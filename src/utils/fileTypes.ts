export const getMimeType = (filename: string): string => {
    if (!filename) return 'application/octet-stream';
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
        // Documents
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'rtf': return 'application/rtf';

        // Images
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'svg': return 'image/svg+xml';
        case 'bmp': return 'image/bmp';
        case 'ico': return 'image/x-icon';

        // Archives
        case 'zip': return 'application/zip';
        case 'rar': return 'application/x-rar-compressed';
        case '7z': return 'application/x-7z-compressed';

        default: return 'application/octet-stream';
    }
};
