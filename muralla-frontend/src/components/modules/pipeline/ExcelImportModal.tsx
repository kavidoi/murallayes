import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, DocumentArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ExcelImporter from '../../common/ExcelImporter';
import { downloadExcelTemplate } from '../../../utils/excel-template';
import { excelImportService } from '../../../services/excel-import.service';
import type { ExcelImportResult } from '../../../types/excel-import';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: { processedPOs: any[]; createdProducts: any[] }) => void;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
    processedPOs: any[];
    createdProducts: any[];
    createdBrands?: any[];
    brandAllocations?: any[];
    errors: string[];
    success: boolean;
  } | null>(null);

  const handleDownloadTemplate = () => {
    downloadExcelTemplate('Plantilla_Importacion_OC.xlsx', { 
      includeExamples: true,
      includeValidation: true 
    });
  };

  const handleImportComplete = (result: ExcelImportResult) => {
    setImportResult(result);
  };

  const handleProcessImport = async () => {
    if (!importResult || !importResult.success) return;

    setIsProcessing(true);
    try {
      const result = await excelImportService.processImportData(importResult.parsedData);
      setProcessingResult(result);
      
      if (result.success) {
        // Notify parent component
        onImportComplete({
          processedPOs: result.processedPOs,
          createdProducts: result.createdProducts
        });
      }
    } catch (error) {
      console.error('Import processing error:', error);
      setProcessingResult({
        processedPOs: [],
        createdProducts: [],
        createdBrands: [],
        brandAllocations: [],
        errors: [`Procesamiento fallido: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        success: false
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setProcessingResult(null);
    onClose();
  };

  const renderValidationResults = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Resultados de Validación
          </h3>
          <div className="flex items-center space-x-2">
            {importResult.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              importResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {importResult.success ? 'Listo para Importar' : 'Tiene Errores'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="font-medium text-blue-900 dark:text-blue-100">Total Filas</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {importResult.totalRows}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="font-medium text-green-900 dark:text-green-100">Filas Válidas</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {importResult.validRows}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-medium text-red-900 dark:text-red-100">Errores</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {importResult.errors.length}
            </div>
          </div>
        </div>

        {importResult.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Errores Encontrados:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {importResult.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  Fila {error.row}: {error.error}
                </div>
              ))}
              {importResult.errors.length > 10 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  ... y {importResult.errors.length - 10} errores más
                </div>
              )}
            </div>
          </div>
        )}

        {importResult.warnings.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Advertencias:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {importResult.warnings.slice(0, 5).map((warning, index) => (
                <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                  Fila {warning.row}: {warning.error}
                </div>
              ))}
              {importResult.warnings.length > 5 && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  ... y {importResult.warnings.length - 5} advertencias más
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProcessingResults = () => {
    if (!processingResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Resultados de Importación
          </h3>
          <div className="flex items-center space-x-2">
            {processingResult.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              processingResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {processingResult.success ? 'Importación Exitosa' : 'Importación Fallida'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="font-medium text-blue-900 dark:text-blue-100">Órdenes de Compra Creadas</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {processingResult.processedPOs.length}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="font-medium text-green-900 dark:text-green-100">Productos Creados</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {processingResult.createdProducts.length}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="font-medium text-purple-900 dark:text-purple-100">Marcas Procesadas</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {processingResult.createdBrands?.length || 0}
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="font-medium text-orange-900 dark:text-orange-100">Envío Calculado</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {processingResult.brandAllocations?.length || 0}
            </div>
          </div>
        </div>
        
        {/* Brand Shipping Summary */}
        {processingResult.brandAllocations && processingResult.brandAllocations.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Resumen de Envío por Marca:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {processingResult.brandAllocations.map((allocation: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {allocation.brandName}
                  </span>
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-100">
                      ${allocation.totalShippingCost?.toLocaleString()} CLP
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {allocation.productsInBrand?.length || 0} productos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {processingResult.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Errores de Procesamiento:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {processingResult.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {processingResult.success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">Importación Completada Exitosamente</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Tus órdenes de compra y productos han sido creados. La página se actualizará para mostrar los nuevos datos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6"
            >
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                    Importar Órdenes de Compra y Productos
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Sube un archivo Excel para crear múltiples órdenes de compra y productos de una vez.
                  </p>

                  <div className="mt-6">
                    {!importResult && !processingResult && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100">Antes de Comenzar</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Descarga la plantilla de Excel para asegurar que tus datos estén formateados correctamente. 
                                La plantilla incluye ejemplos y reglas de validación.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                          >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                            Descargar Plantilla Excel
                          </button>
                        </div>

                        <ExcelImporter
                          onImportComplete={handleImportComplete}
                          className="mt-6"
                          maxFileSize={10}
                        />
                      </div>
                    )}

                    {importResult && !processingResult && renderValidationResults()}
                    {processingResult && renderProcessingResults()}
                  </div>

                  <div className="mt-8 flex justify-end space-x-3">
                    {importResult && !processingResult && (
                      <>
                        <button
                          type="button"
                          onClick={() => setImportResult(null)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Subir Archivo Diferente
                        </button>
                        {importResult.success && (
                          <button
                            type="button"
                            onClick={handleProcessImport}
                            disabled={isProcessing}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                              </>
                            ) : (
                              `Crear ${importResult.validRows} Elementos`
                            )}
                          </button>
                        )}
                      </>
                    )}
                    {processingResult && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {processingResult.success ? 'Cerrar y Actualizar' : 'Cerrar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExcelImportModal;