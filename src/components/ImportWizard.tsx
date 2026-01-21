import React, { useState, useCallback } from 'react';
import {
    Upload, FileSpreadsheet, Check, X, AlertCircle,
    ChevronRight, ChevronLeft, Loader2, Download,
    ArrowRight, RefreshCw
} from 'lucide-react';
import { importService } from '../services/import.service';
import { ImportPreview, ColumnMapping, DuplicateStrategy, ImportResult } from '../types';

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

// Available target fields for mapping
const TARGET_FIELDS = [
    { value: 'skip', label: '-- Skip --' },
    { value: 'name', label: 'Name (Required)' },
    { value: 'client_id', label: 'Client ID' },
    // Email fields matching user's data
    { value: 'home_email', label: 'Home Email' },
    { value: 'home_email_2', label: 'Home Email 2' },
    { value: 'work_email', label: 'Work Email' },
    { value: 'personal_email', label: 'Personal Email' },
    { value: 'other_email', label: 'Other Email' },
    // Phone fields matching user's data
    { value: 'home_phone', label: 'Home Phone' },
    { value: 'work_phone', label: 'Work Phone' },
    { value: 'cellular_phone', label: 'Cellular Phone' },
    { value: 'other_phone', label: 'Other Phone' },
    { value: 'status', label: 'Status' },
    { value: 'tags', label: 'Tags' }
];

const TRANSFORMS = [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'UPPERCASE' },
    { value: 'lowercase', label: 'lowercase' },
    { value: 'phone_format', label: 'Phone Format' }
];

const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('update');
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Reset wizard state
    const resetWizard = () => {
        setStep(1);
        setSelectedFile(null);
        setUploadError(null);
        setPreview(null);
        setMappings([]);
        setDuplicateStrategy('update');
        setIsImporting(false);
        setImportResult(null);
    };

    // Handle file drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file);
            setUploadError(null);
        } else {
            setUploadError('Please upload a CSV or XLSX file');
        }
    }, []);

    // Handle file select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    // Upload and preview file
    const handleUploadPreview = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await importService.uploadPreview(selectedFile);
            setPreview(result);

            // Initialize mappings with smart defaults
            const initialMappings: ColumnMapping[] = result.headers.map(header => {
                const lowerHeader = header.toLowerCase();
                let targetField = 'skip';
                let transform: 'none' | 'uppercase' | 'lowercase' | 'phone_format' = 'none';

                // Smart field detection
                if (lowerHeader.includes('name') && !lowerHeader.includes('file')) {
                    targetField = 'name';
                } else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
                    targetField = 'primary_email';
                    transform = 'lowercase';
                } else if (lowerHeader.includes('phone') || lowerHeader.includes('cell') || lowerHeader.includes('mobile')) {
                    if (lowerHeader.includes('work') || lowerHeader.includes('office')) {
                        targetField = 'additional_phone';
                    } else {
                        targetField = 'primary_phone';
                    }
                    transform = 'phone_format';
                } else if (lowerHeader.includes('status')) {
                    targetField = 'status';
                } else if (lowerHeader.includes('id') || lowerHeader.includes('client no') || lowerHeader.includes('client #')) {
                    targetField = 'client_id';
                    transform = 'uppercase';
                }

                return { sourceColumn: header, targetField, transform };
            });

            setMappings(initialMappings);
            setStep(2);
        } catch (error: any) {
            console.error('Upload failed:', error);
            setUploadError(error.response?.data?.error || 'Failed to process file');
        } finally {
            setIsUploading(false);
        }
    };

    // Execute import
    const handleExecuteImport = async () => {
        if (!preview) return;

        setIsImporting(true);

        try {
            const result = await importService.executeImport(preview.jobId, mappings, duplicateStrategy);
            setImportResult(result);
            setStep(5);
        } catch (error: any) {
            console.error('Import failed:', error);
            setImportResult({
                totalProcessed: 0,
                successCount: 0,
                errorCount: 1,
                skippedCount: 0,
                errors: [{ row: 0, message: error.response?.data?.error || 'Import failed' }]
            });
            setStep(5);
        } finally {
            setIsImporting(false);
        }
    };

    // Check if Name field is mapped
    const isNameMapped = mappings.some(m => m.targetField === 'name');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">Import Clients</h2>
                        <p className="text-sm text-slate-500">Step {step} of 5</p>
                    </div>
                    <button onClick={() => { resetWizard(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <React.Fragment key={s}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s < step ? 'bg-teal-600 text-white' :
                                    s === step ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
                                        'bg-slate-200 text-slate-500'
                                    }`}>
                                    {s < step ? <Check size={16} /> : s}
                                </div>
                                {s < 5 && <div className={`flex-1 h-1 rounded ${s < step ? 'bg-teal-600' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>Upload</span>
                        <span>Map</span>
                        <span>Preview</span>
                        <span>Duplicates</span>
                        <span>Results</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Upload File */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging ? 'border-teal-500 bg-teal-50' :
                                    selectedFile ? 'border-emerald-500 bg-emerald-50' :
                                        'border-slate-300 hover:border-teal-400'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="import-file"
                                />
                                <label htmlFor="import-file" className="cursor-pointer">
                                    {selectedFile ? (
                                        <div className="space-y-2">
                                            <FileSpreadsheet size={48} className="mx-auto text-emerald-600" />
                                            <p className="text-lg font-medium text-emerald-700">{selectedFile.name}</p>
                                            <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload size={48} className="mx-auto text-slate-400" />
                                            <p className="text-lg font-medium text-slate-600">Drag & drop your file here</p>
                                            <p className="text-sm text-slate-500">or click to browse</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {uploadError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                                    <AlertCircle size={18} />
                                    <span className="text-sm">{uploadError}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>Supported: CSV, XLSX • Max: 10MB • Max rows: 10,000</span>
                            </div>

                            {/* Visual Template Preview */}
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Expected Format</p>
                                <div className="overflow-x-auto">
                                    <table className="text-xs w-full">
                                        <thead>
                                            <tr className="bg-slate-200">
                                                <th className="px-2 py-1 text-left font-medium text-slate-700">Name</th>
                                                <th className="px-2 py-1 text-left font-medium text-slate-700">Email</th>
                                                <th className="px-2 py-1 text-left font-medium text-slate-700">Phone</th>
                                                <th className="px-2 py-1 text-left font-medium text-slate-700">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <td className="px-2 py-1 text-slate-600">John Smith</td>
                                                <td className="px-2 py-1 text-slate-600">john@email.com</td>
                                                <td className="px-2 py-1 text-slate-600">(555) 123-4567</td>
                                                <td className="px-2 py-1 text-slate-600">Lead</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-1 text-slate-600">Jane Doe</td>
                                                <td className="px-2 py-1 text-slate-600">jane@email.com</td>
                                                <td className="px-2 py-1 text-slate-600">(555) 987-6543</td>
                                                <td className="px-2 py-1 text-slate-600">Prospect</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Columns are auto-detected • Name column is required</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Map Columns */}
                    {step === 2 && preview && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Map your file columns to CRM fields. The <span className="font-semibold">Name</span> field is required.
                            </p>

                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase pb-2 border-b border-slate-200">
                                    <div className="col-span-4">Your Column</div>
                                    <div className="col-span-1 text-center">→</div>
                                    <div className="col-span-4">CRM Field</div>
                                    <div className="col-span-3">Transform</div>
                                </div>

                                {mappings.map((mapping, idx) => (
                                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-200">
                                        <div className="sm:col-span-4 font-medium text-navy-900 truncate text-sm" title={mapping.sourceColumn}>
                                            <span className="sm:hidden text-xs text-slate-500 block">Source:</span>
                                            {mapping.sourceColumn}
                                        </div>
                                        <div className="hidden sm:block sm:col-span-1 text-center text-slate-400">
                                            <ArrowRight size={16} />
                                        </div>
                                        <div className="sm:col-span-4">
                                            <select
                                                value={mapping.targetField}
                                                onChange={(e) => {
                                                    const newMappings = [...mappings];
                                                    newMappings[idx].targetField = e.target.value;
                                                    setMappings(newMappings);
                                                }}
                                                className={`w-full px-3 py-2.5 text-base border rounded-lg min-h-[44px] ${mapping.targetField === 'name' ? 'border-teal-500 bg-teal-50' : 'border-slate-200'
                                                    }`}
                                            >
                                                {TARGET_FIELDS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <select
                                                value={mapping.transform || 'none'}
                                                onChange={(e) => {
                                                    const newMappings = [...mappings];
                                                    newMappings[idx].transform = e.target.value as any;
                                                    setMappings(newMappings);
                                                }}
                                                className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg min-h-[44px]"
                                            >
                                                {TRANSFORMS.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!isNameMapped && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
                                    <AlertCircle size={18} />
                                    <span className="text-sm">The Name field must be mapped to proceed.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && preview && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-slate-50 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-navy-900">{preview.totalRows}</p>
                                    <p className="text-xs text-slate-500">Total Records</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{mappings.filter(m => m.targetField !== 'skip').length}</p>
                                    <p className="text-xs text-slate-500">Fields Mapped</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-blue-600">{mappings.filter(m => m.targetField === 'skip').length}</p>
                                    <p className="text-xs text-slate-500">Fields Skipped</p>
                                </div>
                                <div className="bg-teal-50 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-teal-600">{preview.sampleRows.length}</p>
                                    <p className="text-xs text-slate-500">Preview Rows</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Row</th>
                                            {mappings.filter(m => m.targetField !== 'skip').map((m, i) => (
                                                <th key={i} className="px-3 py-2 text-left text-xs font-bold text-slate-500">
                                                    {TARGET_FIELDS.find(f => f.value === m.targetField)?.label || m.targetField}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preview.sampleRows.slice(0, 5).map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 text-slate-400">{rowIdx + 1}</td>
                                                {mappings.filter(m => m.targetField !== 'skip').map((m, colIdx) => {
                                                    const sourceIdx = preview.headers.indexOf(m.sourceColumn);
                                                    return (
                                                        <td key={colIdx} className="px-3 py-2 text-navy-900">
                                                            {row[sourceIdx] || '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Duplicate Handling */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600">
                                Choose how to handle duplicate records (matched by email or phone number):
                            </p>

                            <div className="space-y-3">
                                <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${duplicateStrategy === 'skip' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-200'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="duplicate"
                                        value="skip"
                                        checked={duplicateStrategy === 'skip'}
                                        onChange={() => setDuplicateStrategy('skip')}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${duplicateStrategy === 'skip' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                                            }`}>
                                            {duplicateStrategy === 'skip' && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-navy-900">Skip Duplicates</p>
                                            <p className="text-sm text-slate-500">Keep existing records unchanged, skip matching imports</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${duplicateStrategy === 'update' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-200'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="duplicate"
                                        value="update"
                                        checked={duplicateStrategy === 'update'}
                                        onChange={() => setDuplicateStrategy('update')}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${duplicateStrategy === 'update' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                                            }`}>
                                            {duplicateStrategy === 'update' && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-navy-900">Update Existing Records</p>
                                            <p className="text-sm text-slate-500">Merge new data into existing client records (recommended)</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${duplicateStrategy === 'create_new' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-200'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="duplicate"
                                        value="create_new"
                                        checked={duplicateStrategy === 'create_new'}
                                        onChange={() => setDuplicateStrategy('create_new')}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${duplicateStrategy === 'create_new' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                                            }`}>
                                            {duplicateStrategy === 'create_new' && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-navy-900">Create All as New</p>
                                            <p className="text-sm text-slate-500">Create new records for all rows (may cause duplicates)</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Results */}
                    {step === 5 && importResult && (
                        <div className="space-y-6 text-center">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${importResult.errorCount === 0 ? 'bg-emerald-100' :
                                importResult.successCount > 0 ? 'bg-amber-100' : 'bg-red-100'
                                }`}>
                                {importResult.errorCount === 0 ? (
                                    <Check size={40} className="text-emerald-600" />
                                ) : importResult.successCount > 0 ? (
                                    <AlertCircle size={40} className="text-amber-600" />
                                ) : (
                                    <X size={40} className="text-red-600" />
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-navy-900">
                                    {importResult.errorCount === 0 ? 'Import Complete!' :
                                        importResult.successCount > 0 ? 'Import Completed with Issues' : 'Import Failed'}
                                </h3>
                                <p className="text-slate-500">
                                    {importResult.successCount} of {importResult.totalProcessed} records imported successfully
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-2xl font-bold text-navy-900">{importResult.totalProcessed}</p>
                                    <p className="text-xs text-slate-500">Total Processed</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-lg">
                                    <p className="text-2xl font-bold text-emerald-600">{importResult.successCount}</p>
                                    <p className="text-xs text-slate-500">Successful</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-600">{importResult.skippedCount}</p>
                                    <p className="text-xs text-slate-500">Skipped</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                                    <p className="text-xs text-slate-500">Errors</p>
                                </div>
                            </div>

                            {importResult.errors.length > 0 && (
                                <div className="text-left bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    <p className="text-sm font-bold text-red-700 mb-2">Error Details:</p>
                                    {importResult.errors.slice(0, 10).map((err, i) => (
                                        <p key={i} className="text-sm text-red-600">
                                            Row {err.row}: {err.message}
                                        </p>
                                    ))}
                                    {importResult.errors.length > 10 && (
                                        <p className="text-sm text-red-500 mt-2">
                                            ...and {importResult.errors.length - 10} more errors
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
                    {step > 1 && step < 5 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-3">
                        {step === 1 && (
                            <button
                                onClick={handleUploadPreview}
                                disabled={!selectedFile || isUploading}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight size={18} />
                                    </>
                                )}
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={() => setStep(3)}
                                disabled={!isNameMapped}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Preview Import
                                <ChevronRight size={18} />
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={() => setStep(4)}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                            >
                                Continue
                                <ChevronRight size={18} />
                            </button>
                        )}

                        {step === 4 && (
                            <button
                                onClick={handleExecuteImport}
                                disabled={isImporting}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        Start Import
                                        <Check size={18} />
                                    </>
                                )}
                            </button>
                        )}

                        {step === 5 && (
                            <>
                                <button
                                    onClick={() => { resetWizard(); }}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <RefreshCw size={18} />
                                    Import More
                                </button>
                                <button
                                    onClick={() => { resetWizard(); onComplete(); onClose(); }}
                                    className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                                >
                                    Done
                                    <Check size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportWizard;
