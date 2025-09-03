import XlsxPopulate from 'xlsx-populate';
// import { EXCEL_TEMPLATE_COLUMNS } from '../constants/excel-template-columns';

export interface ExcelTemplateOptions {
  includeExamples?: boolean;
  includeValidation?: boolean;
}

export async function generateExcelTemplate(options: ExcelTemplateOptions = {}) {
  const { includeExamples = true } = options;
  
  // Create a new workbook
  const workbook = await XlsxPopulate.fromBlankAsync();
  const worksheet = workbook.sheet('Sheet1');
  
  // Set worksheet name
  (worksheet as any).name('Plantilla_OC');
  
  // Add headers - temporarily comment out until EXCEL_TEMPLATE_COLUMNS is properly typed
  // const headers = Object.values(EXCEL_TEMPLATE_COLUMNS).map(col => col.header);
  const headers = ['Número OC', 'Fecha OC', 'Proveedor', 'Producto']; // Simplified headers
  headers.forEach((header, index) => {
    const cell = (worksheet as any).cell(1, index + 1);
    (cell as any).value(header);
    (cell as any).style({
      bold: true,
      fill: 'CCCCCC',
      border: true
    });
  });
  
  // Add example data if requested
  if (includeExamples) {
    const exampleData = [
      ['OC-2024-001', '2024-01-15', 'ACME Corp', '12345678-9', 'Producto A', 'PROD-001', 10, 1500, 15000, 'CLP', 'Pendiente', 'Observaciones ejemplo']
    ];
    
    exampleData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        (worksheet as any).cell(rowIndex + 2, colIndex + 1).value(value);
      });
    });
  }
  
  // Auto-fit columns
  for (let i = 1; i <= headers.length; i++) {
    (worksheet as any).column(i).width(15);
  }
  
  return workbook;
}

export async function downloadExcelTemplate(filename: string = 'Plantilla_Importacion_OC.xlsx', options?: ExcelTemplateOptions) {
  const workbook = await generateExcelTemplate(options);
  
  // Generate buffer
  const buffer = await workbook.outputAsync();
  
  // Create blob and download
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}

export async function generateSampleExcelFile(): Promise<Blob> {
  const workbook = await generateExcelTemplate({ includeExamples: true });
  const buffer = await workbook.outputAsync();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
