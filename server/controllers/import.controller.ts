import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

export const uploadMiddleware = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and XLSX files are allowed.'));
        }
    }
}).single('file');

// --- Parse CSV file ---
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    // Simple CSV parser (handles quoted fields)
    const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => parseLine(line));

    return { headers, rows };
}

// --- Generate Client ID ---
async function generateClientId(): Promise<string> {
    const lastClient = await prisma.client.findFirst({
        where: {
            clientId: {
                startsWith: 'CL-'
            }
        },
        orderBy: {
            clientId: 'desc'
        },
        select: {
            clientId: true
        }
    });

    let nextNumber = 1;
    if (lastClient?.clientId) {
        const match = lastClient.clientId.match(/CL-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `CL-${nextNumber.toString().padStart(4, '0')}`;
}

// --- Format phone number ---
function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // Format as +X (XXX) XXX-XXXX if 11 digits (with country code)
    if (digits.length === 11) {
        return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return phone; // Return as-is if doesn't match expected format
}

// --- Apply transform to value ---
function applyTransform(value: string, transform?: string): string {
    if (!value || !transform) return value;

    switch (transform) {
        case 'uppercase':
            return value.toUpperCase();
        case 'lowercase':
            return value.toLowerCase();
        case 'phone_format':
            return formatPhoneNumber(value);
        default:
            return value;
    }
}

// --- Upload and Preview Import File ---
export const uploadPreview = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();

        let headers: string[] = [];
        let rows: string[][] = [];

        if (ext === '.csv') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = parseCSV(content);
            headers = parsed.headers;
            rows = parsed.rows;
        } else if (ext === '.xlsx' || ext === '.xls') {
            try {
                // Handle various ESM/CJS import structures for xlsx
                const xlsxModule = XLSX as any;
                const readFile = xlsxModule.readFile || xlsxModule.default?.readFile;
                const utils = xlsxModule.utils || xlsxModule.default?.utils;

                if (!readFile || !utils) {
                    console.error('XLSX module structure:', Object.keys(xlsxModule));
                    throw new Error('XLSX module functions not found');
                }

                const workbook = readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = utils.sheet_to_json(sheet, { header: 1 }) as string[][];

                if (data.length > 0) {
                    headers = data[0].map(h => String(h || ''));
                    rows = data.slice(1).map(row => row.map(cell => String(cell || '')));
                }
            } catch (xlsxError) {
                console.error('XLSX parsing error:', xlsxError);
                return res.status(400).json({
                    error: 'Failed to parse XLSX file.'
                });
            }
        }

        // Create import job
        const importJob = await prisma.importJob.create({
            data: {
                filename: req.file.originalname,
                totalRecords: rows.length,
                status: 'pending'
            }
        });

        // Store file path in job for later processing
        // We'll use a temp file approach
        const jobDataPath = path.join(process.cwd(), 'uploads', 'imports', `${importJob.id}.json`);
        fs.writeFileSync(jobDataPath, JSON.stringify({ headers, rows }));

        res.json({
            jobId: importJob.id,
            headers,
            sampleRows: rows.slice(0, 5), // First 5 rows as preview
            totalRows: rows.length
        });
    } catch (error) {
        console.error('Failed to process import file:', error);
        res.status(500).json({ error: 'Failed to process import file' });
    }
};

// --- Execute Import ---
export const executeImport = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const { mappings, duplicateStrategy } = req.body;

        // Get import job
        const job = await prisma.importJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ error: 'Import job not found' });
        }

        // Load stored data
        const jobDataPath = path.join(process.cwd(), 'uploads', 'imports', `${jobId}.json`);
        if (!fs.existsSync(jobDataPath)) {
            return res.status(404).json({ error: 'Import data not found. Please upload file again.' });
        }

        const { headers, rows } = JSON.parse(fs.readFileSync(jobDataPath, 'utf-8'));

        // Update job status
        await prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: 'processing',
                mappings: mappings
            }
        });

        // Build field mapping
        const fieldMap: Record<string, { index: number; transform?: string }> = {};
        for (const mapping of mappings) {
            if (mapping.targetField && mapping.targetField !== 'skip') {
                const index = headers.indexOf(mapping.sourceColumn);
                if (index >= 0) {
                    fieldMap[mapping.targetField] = {
                        index,
                        transform: mapping.transform
                    };
                }
            }
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const errors: { row: number; message: string }[] = [];

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 because header is row 1

            try {
                // Extract mapped values
                const getValue = (field: string): string => {
                    const mapping = fieldMap[field];
                    if (!mapping) return '';
                    const value = row[mapping.index] || '';
                    return applyTransform(value, mapping.transform);
                };

                const name = getValue('name');

                // Validate required fields
                if (!name || !name.trim()) {
                    errors.push({ row: rowNum, message: 'Name is required' });
                    errorCount++;
                    continue;
                }

                const primaryEmail = getValue('primary_email');
                const primaryPhone = getValue('primary_phone');
                const additionalPhone = getValue('additional_phone');
                const clientIdValue = getValue('client_id');
                const status = getValue('status') || 'Lead';

                // Check for duplicates using both email and phone
                let existingClient = null;
                if (primaryEmail) {
                    existingClient = await prisma.client.findFirst({
                        where: {
                            OR: [
                                { email: primaryEmail },
                                { emails: { some: { email: primaryEmail } } }
                            ]
                        }
                    });
                }
                if (!existingClient && primaryPhone) {
                    const normalizedPhone = primaryPhone.replace(/\D/g, '');
                    existingClient = await prisma.client.findFirst({
                        where: {
                            OR: [
                                { phone: { contains: normalizedPhone } },
                                { phones: { some: { number: { contains: normalizedPhone } } } }
                            ]
                        }
                    });
                }

                if (existingClient) {
                    // Handle duplicate based on strategy
                    switch (duplicateStrategy) {
                        case 'skip':
                            skippedCount++;
                            continue;

                        case 'update':
                            // Update existing client
                            await prisma.client.update({
                                where: { id: existingClient.id },
                                data: {
                                    name: name.trim(),
                                    status
                                }
                            });

                            // Add new contact info if provided and not duplicate
                            if (additionalPhone) {
                                const phoneExists = await prisma.clientPhone.findFirst({
                                    where: {
                                        clientId: existingClient.id,
                                        number: additionalPhone
                                    }
                                });
                                if (!phoneExists) {
                                    await prisma.clientPhone.create({
                                        data: {
                                            clientId: existingClient.id,
                                            number: additionalPhone,
                                            type: 'WORK',
                                            isPrimary: false
                                        }
                                    });
                                }
                            }
                            successCount++;
                            continue;

                        case 'create_new':
                            // Fall through to create
                            break;
                    }
                }

                // Create new client
                const clientId = clientIdValue || await generateClientId();

                const newClient = await prisma.client.create({
                    data: {
                        clientId,
                        name: name.trim(),
                        status,
                        pipelineStage: 'New Lead',
                        phones: primaryPhone ? {
                            create: [
                                { number: primaryPhone, type: 'MOBILE', isPrimary: true },
                                ...(additionalPhone ? [{ number: additionalPhone, type: 'WORK' as const, isPrimary: false }] : [])
                            ]
                        } : undefined,
                        emails: primaryEmail ? {
                            create: [
                                { email: primaryEmail, type: 'PERSONAL', isPrimary: true }
                            ]
                        } : undefined
                    }
                });

                successCount++;
            } catch (rowError: any) {
                console.error(`Error processing row ${rowNum}:`, rowError);
                errors.push({ row: rowNum, message: rowError.message || 'Unknown error' });
                errorCount++;
            }
        }

        // Update job with results
        await prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                processedCount: rows.length,
                successCount,
                errorCount,
                skippedCount,
                errors: errors.length > 0 ? errors : undefined,
                completedAt: new Date()
            }
        });

        // Cleanup temp file
        try {
            fs.unlinkSync(jobDataPath);
        } catch (e) {
            // Ignore cleanup errors
        }

        res.json({
            totalProcessed: rows.length,
            successCount,
            errorCount,
            skippedCount,
            errors
        });
    } catch (error) {
        console.error('Failed to execute import:', error);
        res.status(500).json({ error: 'Failed to execute import' });
    }
};

// --- Get Import Job Status ---
export const getImportJob = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;

        const job = await prisma.importJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ error: 'Import job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error('Failed to get import job:', error);
        res.status(500).json({ error: 'Failed to get import job' });
    }
};

// --- Get Import History ---
export const getImportHistory = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.importJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(jobs);
    } catch (error) {
        console.error('Failed to get import history:', error);
        res.status(500).json({ error: 'Failed to get import history' });
    }
};

// --- Download Import Template ---
export const downloadTemplate = async (req: Request, res: Response) => {
    try {
        const { format } = req.params;

        if (format === 'csv') {
            const csvContent = 'Name,Email,Phone,Work Phone,Status,Client ID\nJohn Doe,john@example.com,(555) 123-4567,(555) 987-6543,Lead,\nJane Smith,jane@example.com,(555) 111-2222,,Active,CL-0001';

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=import_template.csv');
            res.send(csvContent);
        } else {
            res.status(400).json({ error: 'Only CSV templates are currently supported' });
        }
    } catch (error) {
        console.error('Failed to download template:', error);
        res.status(500).json({ error: 'Failed to download template' });
    }
};
