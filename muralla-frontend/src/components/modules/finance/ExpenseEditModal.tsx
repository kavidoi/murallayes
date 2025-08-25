import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useEditingStatus } from '../../../hooks/useEditingStatus';
import { useConflictResolution } from '../../../hooks/useConflictResolution';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { ConflictResolutionModal } from '../../common/ConflictResolutionModal';
import { EditingIndicator } from '../../common/EditingIndicator';

interface ExpenseCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface ExpenseStatus {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface DirectExpense {
  id: string;
  fecha: Date;
  proveedor: string;
  documento: string;
  descripcion: string;
  total: number;
  currency: string;
  categoryId: string;
  statusId: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  documentType: string;
  documentNumber?: string;
  thirdPartyDocType?: 'FACTURA' | 'BOLETA' | 'NONE';
  thirdPartyDocNumber?: string;
  notes?: string;
  attachments?: Array<{
    id?: string;
    fileName?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }>;
  type: 'DIRECT';
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: DirectExpense) => Promise<void>;
  expense: DirectExpense;
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  suppliers: Array<{id: string; name: string; email?: string; phone?: string}>;
  onCreateSupplier: () => void;
  version?: string;
}

export const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
  statuses,
  suppliers,
  onCreateSupplier,
  version: initialVersion
}) => {
  const { t } = useTranslation();
  const { broadcastDataChange } = useWebSocket();
  
  // Local editing state
  const [formData, setFormData] = useState<DirectExpense>(expense);
  const [originalData] = useState<DirectExpense>(expense); // Keep original for conflict detection
  const [currentVersion, setCurrentVersion] = useState(initialVersion || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Provider search state
  const [providerSearchTerm, setProviderSearchTerm] = useState(expense.proveedor);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  // Helper function to get local date string
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Real-time collaboration hooks
  const {
    isEditing,
    startEditing,
    stopEditing,
    refreshEditingStatus,
    otherUsersEditing,
    isOthersEditing,
  } = useEditingStatus({
    resource: 'expense',
    resourceId: expense.id,
    autoStart: true,
  });

  const {
    currentConflict,
    isConflictModalOpen,
    checkForConflicts,
    handleConflictResolve,
    handleConflictClose,
  } = useConflictResolution({
    onConflictResolved: async (resolvedData) => {
      // Apply resolved changes and save
      const updatedExpense = {
        ...formData,
        ...resolvedData.resolvedFields,
      };
      setFormData(updatedExpense);
      await handleSave(updatedExpense, true); // Skip conflict check since we just resolved
    },
    onConflictIgnored: () => {
      // User chose to ignore conflict, stop editing
      stopEditing();
      onClose();
    }
  });

  // Field labels for conflict resolution
  const fieldLabels = {
    proveedor: 'Proveedor',
    descripcion: 'Descripción',
    total: 'Monto Total',
    fecha: 'Fecha',
    categoryId: 'Categoría',
    statusId: 'Estado',
    documentType: 'Tipo de Documento',
    documentNumber: 'Número de Documento',
    thirdPartyDocType: 'Tipo de Documento del Proveedor',
    thirdPartyDocNumber: 'Número de Documento del Proveedor',
    notes: 'Notas',
  };

  // Update form data and broadcast changes
  const handleInputChange = (field: keyof DirectExpense, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Broadcast data change to detect conflicts
      broadcastDataChange('expense', expense.id, updated, currentVersion);
      
      // Refresh editing status to show we're still active
      refreshEditingStatus();
      
      return updated;
    });
  };

  // Provider search handlers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(providerSearchTerm.toLowerCase())
  );

  const handleSelectSupplier = (supplier: {id: string; name: string; email?: string; phone?: string}) => {
    setFormData(prev => ({ ...prev, proveedor: supplier.name }));
    setProviderSearchTerm(supplier.name);
    setShowProviderDropdown(false);
  };

  const handleProviderInputChange = (value: string) => {
    setProviderSearchTerm(value);
    setFormData(prev => ({ ...prev, proveedor: value }));
    setShowProviderDropdown(value.length > 0);
  };

  // Save handler
  const handleSave = async (expenseData: DirectExpense = formData, skipConflictCheck = false) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Check for conflicts before saving (unless we just resolved them)
      if (!skipConflictCheck) {
        const hasConflicts = await checkForConflicts(
          'expense',
          expense.id,
          originalData,
          expenseData,
          fieldLabels
        );

        if (hasConflicts) {
          setIsSaving(false);
          return; // Conflict resolution modal will handle the rest
        }
      }

      // Save the expense
      await onSave(expenseData);
      
      // Stop editing status
      stopEditing();
      
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      setSaveError('Error al guardar el gasto. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopEditing();
    onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isDropdownClick = target.closest('[data-provider-dropdown]');
      if (!isDropdownClick && showProviderDropdown) {
        setShowProviderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProviderDropdown]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('gastos.editExpense')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {expense.proveedor} - {expense.descripcion}
                  </p>
                </div>
                
                {/* Real-time collaboration status */}
                {isOthersEditing && (
                  <div className="ml-4">
                    <EditingIndicator 
                      users={otherUsersEditing}
                      className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Warning */}
            {isOthersEditing && (
              <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Cuidado: Edición Simultánea
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {otherUsersEditing.length === 1 
                        ? `${otherUsersEditing[0].name || otherUsersEditing[0].email} también está editando este gasto.`
                        : `${otherUsersEditing.length} personas están editando este gasto.`
                      } Los cambios pueden entrar en conflicto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Error */}
            {saveError && (
              <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              </div>
            )}

            {/* Form Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.provider')}
                    </label>
                    <div className="relative" data-provider-dropdown>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={providerSearchTerm}
                        onChange={(e) => handleProviderInputChange(e.target.value)}
                        onFocus={() => setShowProviderDropdown(providerSearchTerm.length > 0 || filteredSuppliers.length > 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t('gastos.searchOrCreateProvider')}
                      />
                      
                      {/* Smart Search Dropdown */}
                      {showProviderDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredSuppliers.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                {t('gastos.existingSuppliers')}
                              </div>
                              {filteredSuppliers.slice(0, 5).map((supplier) => (
                                <button
                                  key={supplier.id}
                                  type="button"
                                  onClick={() => handleSelectSupplier(supplier)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {supplier.name}
                                  </div>
                                  {supplier.email && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {supplier.email}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          
                          {/* Add New Supplier Option */}
                          <button
                            type="button"
                            onClick={() => {
                              onCreateSupplier();
                              setShowProviderDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center text-blue-600 dark:text-blue-400">
                              <PlusIcon className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {t('gastos.addNewSupplier')}
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.amount')}
                    </label>
                    <input
                      type="number"
                      value={formData.total}
                      onChange={(e) => handleInputChange('total', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('gastos.description')}
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.date')}
                    </label>
                    <input
                      type="date"
                      value={getLocalDateString(formData.fecha)}
                      onChange={(e) => {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        handleInputChange('fecha', new Date(year, month - 1, day));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.category')}
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">{t('gastos.selectCategory')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.emoji ? `${category.emoji} ` : ''}{category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.status')}
                    </label>
                    <select
                      value={formData.statusId}
                      onChange={(e) => handleInputChange('statusId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">{t('gastos.selectStatus')}</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.documentType')}
                    </label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => handleInputChange('documentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="FACTURA">Factura</option>
                      <option value="BOLETA">Boleta</option>
                      <option value="RECIBO">Recibo</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.notes')}
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Notas adicionales sobre este gasto..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Editando...' : 'Listo para guardar'}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isSaving
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {isConflictModalOpen && currentConflict && (
          <ConflictResolutionModal
            isOpen={isConflictModalOpen}
            onClose={handleConflictClose}
            onResolve={handleConflictResolve}
            resourceName={currentConflict.resourceName}
            conflicts={currentConflict.conflicts}
            currentUser="Tú"
            conflictingUser={currentConflict.conflictingUser.name || currentConflict.conflictingUser.email}
          />
        )}
      </AnimatePresence>
    </>
  );
};