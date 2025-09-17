import React, { useState, useCallback, useRef } from 'react';
// import Papa from 'papaparse';
import type { 
  ExcelImportRow, 
  ExcelImportResult, 
  ExcelImportValidation, 
  ImportProgress,
  // EXCEL_TEMPLATE_COLUMNS 
} from '../../types/excel-import';

interface ExcelImporterProps {
  onImportComplete: (result: ExcelImportResult) => void;
  onImportStart?: () => void;
  className?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onImportComplete,
  onImportStart,
  className = '',
  acceptedFileTypes = '.csv',
  maxFileSize = 10
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: any, rowIndex: number): ExcelImportValidation[] => {
    const errors: ExcelImportValidation[] = [];
    
    // Required field validations
    const requiredFields = [
      { key: 'Número OC', field: 'numeroOC' },
      { key: 'Fecha OC', field: 'fechaOC' },
      { key: 'Nombre Proveedor', field: 'nombreProveedor' },
      { key: 'Estado OC', field: 'estadoOC' },
      { key: 'Empresa', field: 'empresa' },
      { key: 'Es Producto Nuevo', field: 'esProductoNuevo' },
      { key: 'Nombre Producto', field: 'nombreProducto' },
      { key: 'Categoría Producto', field: 'categoriaProducto' },
      { key: 'Unidad Medida', field: 'unidadMedida' },
      { key: 'Tipo Producto', field: 'tipoProducto' },
      { key: 'Cantidad', field: 'cantidad' },
      { key: 'Costo Unitario', field: 'costoUnitario' },
      { key: 'Costo Total', field: 'costoTotal' },
      { key: 'Es Inventario', field: 'esInventario' }
    ];

    for (const { key, field } of requiredFields) {
      if (!row[key] || row[key].toString().trim() === '') {
        errors.push({
          row: rowIndex,
          field,
          value: row[key],
          error: `${key} es requerido`,
          severity: 'error'
        });
      }
    }

    // Validate Es Producto Nuevo field
    const esProductoNuevo = row['Es Producto Nuevo']?.toString().toLowerCase();
    if (esProductoNuevo && !['sí', 'si', 'no'].includes(esProductoNuevo)) {
      errors.push({
        row: rowIndex,
        field: 'esProductoNuevo',
        value: row['Es Producto Nuevo'],
        error: 'Es Producto Nuevo debe ser SÍ o NO',
        severity: 'error'
      });
    }

    // If existing product, require SKU
    if (esProductoNuevo === 'no' && (!row['SKU Existente'] || row['SKU Existente'].toString().trim() === '')) {
      errors.push({
        row: rowIndex,
        field: 'skuExistente',
        value: row['SKU Existente'],
        error: 'SKU Existente es requerido cuando Es Producto Nuevo es NO',
        severity: 'error'
      });
    }

    // Validate numbers
    const numericFields = [
      { key: 'Cantidad', field: 'cantidad' },
      { key: 'Costo Unitario', field: 'costoUnitario' },
      { key: 'Costo Total', field: 'costoTotal' }
    ];

    for (const { key, field } of numericFields) {
      const value = row[key];
      if (value !== undefined && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
        errors.push({
          row: rowIndex,
          field,
          value,
          error: `${key} debe ser un número positivo`,
          severity: 'error'
        });
      }
    }

    // Validate Estado OC
    const validStatuses = ['borrador', 'pendiente', 'aprobada', 'pedida', 'recibida', 'cancelada'];
    const estadoOC = row['Estado OC']?.toString().toLowerCase();
    if (estadoOC && !validStatuses.includes(estadoOC)) {
      errors.push({
        row: rowIndex,
        field: 'estadoOC',
        value: row['Estado OC'],
        error: `Estado OC debe ser uno de: ${validStatuses.join(', ')}`,
        severity: 'error'
      });
    }

    // Validate Tipo Producto
    const validProductTypes = ['PURCHASED', 'MANUFACTURED', 'TERMINADO'];
    const tipoProducto = row['Tipo Producto']?.toString();
    if (tipoProducto && !validProductTypes.includes(tipoProducto)) {
      errors.push({
        row: rowIndex,
        field: 'tipoProducto',
        value: row['Tipo Producto'],
        error: `Tipo Producto debe ser uno de: ${validProductTypes.join(', ')}`,
        severity: 'error'
      });
    }

    // Validate Es Inventario
    const esInventario = row['Es Inventario']?.toString().toLowerCase();
    if (esInventario && !['sí', 'si', 'no'].includes(esInventario)) {
      errors.push({
        row: rowIndex,
        field: 'esInventario',
        value: row['Es Inventario'],
        error: 'Es Inventario debe ser SÍ o NO',
        severity: 'error'
      });
    }

    // Validate dates
    const dateFields = [
      { key: 'Fecha OC', field: 'fechaOC' },
      { key: 'Fecha Entrega Esperada', field: 'fechaEntregaEsperada' }
    ];

    for (const { key, field } of dateFields) {
      const value = row[key];
      if (value && isNaN(Date.parse(value))) {
        errors.push({
          row: rowIndex,
          field,
          value,
          error: `${key} debe ser una fecha válida (formato YYYY-MM-DD recomendado)`,
          severity: 'warning'
        });
      }
    }

    // Validate calculation: Cantidad × Costo Unitario should equal Costo Total
    const cantidad = Number(row['Cantidad']);
    const costoUnitario = Number(row['Costo Unitario']);
    const costoTotal = Number(row['Costo Total']);
    
    if (!isNaN(cantidad) && !isNaN(costoUnitario) && !isNaN(costoTotal)) {
      const calculatedTotal = cantidad * costoUnitario;
      const tolerance = 1; // Allow for small rounding differences in CLP
      
      if (Math.abs(calculatedTotal - costoTotal) > tolerance) {
        errors.push({
          row: rowIndex,
          field: 'costoTotal',
          value: costoTotal,
          error: `Costo Total (${costoTotal}) debe ser igual a Cantidad (${cantidad}) × Costo Unitario (${costoUnitario}) = ${calculatedTotal}`,
          severity: 'warning'
        });
      }
    }

    return errors;
  };

  const processExcelFile = async (file: File): Promise<ExcelImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (_e) => {
        try {
          setProgress({
            phase: 'reading',
            currentStep: 1,
            totalSteps: 4,
            message: 'Leyendo archivo Excel...',
            errors: []
          });

          // const data = new Uint8Array(e.target?.result as ArrayBuffer);
          // TODO: Replace with secure CSV parsing implementation
          // const workbook = XLSX.read(data, { type: 'array' });
          // const sheetName = workbook.SheetNames[0];
          // const worksheet = workbook.Sheets[sheetName];
          // const rawData = XLSX.utils.sheet_to_json(worksheet);
          
          // Temporary fallback - return empty data
          const rawData: any[] = [];

          setProgress({
            phase: 'validating',
            currentStep: 2,
            totalSteps: 4,
            message: `Validating ${rawData.length} rows...`,
            errors: []
          });

          const errors: ExcelImportValidation[] = [];
          const warnings: ExcelImportValidation[] = [];
          const parsedData: ExcelImportRow[] = [];

          rawData.forEach((row: any, index: number) => {
            const rowValidations = validateRow(row, index + 2); // +2 for header row and 0-based index
            
            rowValidations.forEach(validation => {
              if (validation.severity === 'error') {
                errors.push(validation);
              } else {
                warnings.push(validation);
              }
            });

            // Convert row to our format (only if no errors for this row)
            const hasRowErrors = rowValidations.some(v => v.severity === 'error');
            if (!hasRowErrors) {
              const importRow: ExcelImportRow = {
                // PO Info
                numeroOC: row['Número OC']?.toString().trim() || '',
                fechaOC: row['Fecha OC']?.toString().trim() || '',
                nombreProveedor: row['Nombre Proveedor']?.toString().trim() || '',
                rutProveedor: row['RUT Proveedor']?.toString().trim() || undefined,
                fechaEntregaEsperada: row['Fecha Entrega Esperada']?.toString().trim() || undefined,
                estadoOC: row['Estado OC']?.toString().toLowerCase().trim() as any || 'borrador',
                notasOC: row['Notas OC']?.toString().trim() || undefined,
                tipoDocumentoTercero: row['Tipo Documento Tercero']?.toString().trim() as any || undefined,
                numeroDocumentoTercero: row['Número Documento Tercero']?.toString().trim() || undefined,
                empresa: row['Empresa']?.toString().trim() || '',
                
                // Product Info
                esProductoNuevo: row['Es Producto Nuevo']?.toString().toUpperCase().trim() as any || 'NO',
                skuExistente: row['SKU Existente']?.toString().trim() || undefined,
                nombreProducto: row['Nombre Producto']?.toString().trim() || '',
                descripcionProducto: row['Descripción Producto']?.toString().trim() || undefined,
                nombreMostrar: row['Nombre Mostrar']?.toString().trim() || undefined,
                categoriaProducto: row['Categoría Producto']?.toString().trim() || '',
                marcaProducto: row['Marca Producto']?.toString().trim() || undefined,
                codigoBarras: row['Código Barras']?.toString().trim() || undefined,
                unidadMedida: row['Unidad Medida']?.toString().trim() || 'UN',
                tipoProducto: row['Tipo Producto']?.toString().trim() as any || 'PURCHASED',
                
                // Order Line
                cantidad: Number(row['Cantidad']) || 0,
                costoUnitario: Number(row['Costo Unitario']) || 0,
                costoTotal: Number(row['Costo Total']) || 0,
                esInventario: row['Es Inventario']?.toString().toLowerCase().trim() as any || 'SÍ',
                
                // Additional Product Info
                stockMinimo: Number(row['Stock Mínimo']) || undefined,
                stockMaximo: Number(row['Stock Máximo']) || undefined,
                nivelReorden: Number(row['Nivel Reorden']) || undefined,
                cantidadMinPedido: Number(row['Cantidad Mín. Pedido']) || undefined,
                cantidadMaxPedido: Number(row['Cantidad Máx. Pedido']) || undefined,
                precioCafe: Number(row['Precio Café']) || undefined,
                precioRappi: Number(row['Precio Rappi']) || undefined,
                precioPedidosYa: Number(row['Precio PedidosYa']) || undefined,
                precioUber: Number(row['Precio Uber']) || undefined,
                disponibleCafe: row['Disponible Café']?.toString().toLowerCase().trim() as any || undefined,
                disponibleRappi: row['Disponible Rappi']?.toString().toLowerCase().trim() as any || undefined,
                disponiblePedidosYa: row['Disponible PedidosYa']?.toString().toLowerCase().trim() as any || undefined,
                disponibleUber: row['Disponible Uber']?.toString().toLowerCase().trim() as any || undefined,
                idProductoRappi: row['ID Producto Rappi']?.toString().trim() || undefined,
                idProductoPedidosYa: row['ID Producto PedidosYa']?.toString().trim() || undefined,
                idProductoUber: row['ID Producto Uber']?.toString().trim() || undefined,
                notasProducto: row['Notas Producto']?.toString().trim() || undefined,
                
                // Brand and Shipping Info
                costoEnvioMarca: Number(row['Costo Envío Marca']) || undefined,
                contactoMarca: row['Contacto Marca']?.toString().trim() || undefined,
                emailContactoMarca: row['Email Contacto Marca']?.toString().trim() || undefined
              };

              parsedData.push(importRow);
            }
          });

          setProgress({
            phase: 'completed',
            currentStep: 4,
            totalSteps: 4,
            message: `Validación completada: ${parsedData.length} filas válidas, ${errors.length} errores`,
            errors: errors.map(e => e.error)
          });

          const result: ExcelImportResult = {
            success: errors.length === 0,
            totalRows: rawData.length,
            validRows: parsedData.length,
            errors,
            warnings,
            parsedData
          };

          setTimeout(() => resolve(result), 1000); // Small delay to show completion
        } catch (error) {
          console.error('Excel processing error:', error);
          resolve({
            success: false,
            totalRows: 0,
            validRows: 0,
            errors: [{
              row: 0,
              field: 'file',
              value: file.name,
              error: `Error al procesar archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              severity: 'error'
            }],
            warnings: [],
            parsedData: []
          });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      onImportComplete({
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [{
          row: 0,
          field: 'file',
          value: file.name,
          error: `El tamaño del archivo (${Math.round(file.size / 1024 / 1024)}MB) excede el tamaño máximo permitido (${maxFileSize}MB)`,
          severity: 'error'
        }],
        warnings: [],
        parsedData: []
      });
      return;
    }

    // Validate file type
    const extension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = acceptedFileTypes.split(',').map(type => type.replace('.', '').trim());
    
    if (!extension || !allowedExtensions.includes(extension)) {
      onImportComplete({
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [{
          row: 0,
          field: 'file',
          value: file.name,
          error: `Tipo de archivo no soportado. Tipos permitidos: ${acceptedFileTypes}`,
          severity: 'error'
        }],
        warnings: [],
        parsedData: []
      });
      return;
    }

    setIsProcessing(true);
    onImportStart?.();

    try {
      const result = await processExcelFile(file);
      onImportComplete(result);
    } catch (error) {
      console.error('Import error:', error);
      onImportComplete({
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [{
          row: 0,
          field: 'file',
          value: file.name,
          error: `Importación fallida: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error'
        }],
        warnings: [],
        parsedData: []
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [maxFileSize, acceptedFileTypes, onImportComplete, onImportStart]);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Clear input so same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  return (
    <div className={`${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isProcessing
            ? 'border-gray-300 bg-gray-50 dark:bg-gray-800'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            {progress && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {progress.message}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Paso {progress.currentStep} de {progress.totalSteps}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Importar Órdenes de Compra y Productos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Arrastra tu archivo Excel aquí o haz clic para seleccionar
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seleccionar Archivo Excel
            </button>
            
            <div className="text-xs text-gray-400 space-y-1">
              <div>Formatos soportados: Excel (.xlsx, .xls), CSV (.csv)</div>
              <div>Tamaño máximo de archivo: {maxFileSize}MB</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImporter;