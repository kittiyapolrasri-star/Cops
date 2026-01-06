// Report Export Utilities
// Provides PDF and CSV/Excel export functionality for various reports

interface ExportColumn {
    key: string;
    label: string;
    format?: (value: any) => string;
}

// ==================== CSV EXPORT ====================

export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
) {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Build CSV content
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item =>
        columns.map(col => {
            const value = item[col.key];
            const formatted = col.format ? col.format(value) : value;
            // Escape quotes and wrap in quotes
            return `"${String(formatted ?? '').replace(/"/g, '""')}"`;
        }).join(',')
    ).join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const csvContent = bom + headers + '\n' + rows;

    // Download
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

// ==================== SIMPLE PDF EXPORT (Using browser print) ====================

export function exportToPDF(
    title: string,
    content: string,
    filename?: string
) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        console.error('Failed to open print window');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: 'Sarabun', sans-serif; padding: 20px; }
                h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #1f2937; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #e5e7eb; padding: 8px; }
                tr:nth-child(even) { background: #f9fafb; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; color: #10b981; }
                .date { color: #6b7280; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🚔 C.O.P.S. Report</div>
                <div class="date">${new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}</div>
            </div>
            <h1>${title}</h1>
            ${content}
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ==================== TABLE HTML GENERATOR ====================

export function generateTableHTML<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[]
): string {
    if (data.length === 0) return '<p>ไม่มีข้อมูล</p>';

    const headerRow = columns.map(col => `<th>${col.label}</th>`).join('');
    const bodyRows = data.map(item =>
        '<tr>' + columns.map(col => {
            const value = item[col.key];
            const formatted = col.format ? col.format(value) : value;
            return `<td>${formatted ?? '-'}</td>`;
        }).join('') + '</tr>'
    ).join('');

    return `
        <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}

// ==================== PRE-DEFINED REPORT TEMPLATES ====================

export const ReportTemplates = {
    // Crime Report
    crimes: (crimes: any[]) => ({
        columns: [
            { key: 'caseNumber', label: 'เลขคดี' },
            { key: 'type', label: 'ประเภท' },
            { key: 'address', label: 'สถานที่' },
            { key: 'occurredAt', label: 'วันเวลาเกิดเหตุ', format: (v: string) => new Date(v).toLocaleString('th-TH') },
            { key: 'isResolved', label: 'สถานะ', format: (v: boolean) => v ? 'แก้ไขแล้ว' : 'รอดำเนินการ' },
        ] as ExportColumn[],
        title: 'รายงานอาชญากรรม',
        filename: `crime_report_${new Date().toISOString().split('T')[0]}`,
    }),

    // Patrol Report
    patrols: (patrols: any[]) => ({
        columns: [
            { key: 'user.firstName', label: 'ชื่อ' },
            { key: 'user.rank', label: 'ยศ' },
            { key: 'currentLocation.latitude', label: 'ละติจูด' },
            { key: 'currentLocation.longitude', label: 'ลองจิจูด' },
            { key: 'status', label: 'สถานะ' },
        ] as ExportColumn[],
        title: 'รายงานสายตรวจ',
        filename: `patrol_report_${new Date().toISOString().split('T')[0]}`,
    }),

    // SOS Report
    sos: (alerts: any[]) => ({
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'type', label: 'ประเภท' },
            { key: 'status', label: 'สถานะ' },
            { key: 'user.firstName', label: 'ผู้แจ้ง' },
            { key: 'createdAt', label: 'เวลาแจ้ง', format: (v: string) => new Date(v).toLocaleString('th-TH') },
        ] as ExportColumn[],
        title: 'รายงาน SOS',
        filename: `sos_report_${new Date().toISOString().split('T')[0]}`,
    }),
};

// ==================== HELPER FUNCTIONS ====================

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Get nested property value
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
