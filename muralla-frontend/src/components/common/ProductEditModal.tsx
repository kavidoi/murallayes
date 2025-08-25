import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useEditingStatus } from '../../hooks/useEditingStatus';
import { useConflictResolution } from '../../hooks/useConflictResolution';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { EditingIndicator } from './EditingIndicator';

interface Product {
  id: string;
  name: string;
  description?: string;
  displayName?: string;
  type: 'TERMINADO' | 'MANUFACTURED' | 'PURCHASED';
  uom: string;
  category?: string;
  unitCost?: number;
  isActive: boolean;
  
  // Phase 1: Multi-Platform Integration Fields
  images?: string[];
  cafePrice?: number;
  rappiPrice?: number;
  pedidosyaPrice?: number;
  uberPrice?: number;
  rappiProductId?: string;
  pedidosyaProductId?: string;
  uberProductId?: string;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  availableOnRappi: boolean;
  availableOnPedidosya: boolean;
  availableOnUber: boolean;
  availableInCafe: boolean;
}

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  product: Product;
  version?: string;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  version: initialVersion
}) => {
  const { t } = useTranslation();
  const { broadcastDataChange } = useWebSocket();
  
  // Local editing state
  const [formData, setFormData] = useState<Product>(product);
  const [originalData] = useState<Product>(product); // Keep original for conflict detection
  const [currentVersion, setCurrentVersion] = useState(initialVersion || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Real-time collaboration hooks
  const {
    isEditing,
    startEditing,
    stopEditing,
    refreshEditingStatus,
    otherUsersEditing,
    isOthersEditing,
  } = useEditingStatus({
    resource: 'product',
    resourceId: product.id,
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
      const updatedProduct = {
        ...formData,
        ...resolvedData.resolvedFields,
      };
      setFormData(updatedProduct);
      await handleSave(updatedProduct, true); // Skip conflict check since we just resolved
    },
    onConflictIgnored: () => {
      // User chose to ignore conflict, stop editing
      stopEditing();
      onClose();
    }
  });

  // Field labels for conflict resolution
  const fieldLabels = {
    name: 'Nombre del Producto',
    description: 'Descripción',
    displayName: 'Nombre para Plataformas',
    unitCost: 'Costo Unitario',
    cafePrice: 'Precio en Café',
    rappiPrice: 'Precio en Rappi',
    pedidosyaPrice: 'Precio en PedidosYa',
    uberPrice: 'Precio en Uber Eats',
    minOrderQuantity: 'Cantidad Mínima',
    maxOrderQuantity: 'Cantidad Máxima',
    availableOnRappi: 'Disponible en Rappi',
    availableOnPedidosya: 'Disponible en PedidosYa',
    availableOnUber: 'Disponible en Uber',
    availableInCafe: 'Disponible en Café',
  };

  // Update form data and broadcast changes
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Broadcast data change to detect conflicts
      broadcastDataChange('product', product.id, updated, currentVersion);
      
      // Refresh editing status to show we're still active
      refreshEditingStatus();
      
      return updated;
    });
  };

  const handleSave = async (productData: Product = formData, skipConflictCheck = false) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Check for conflicts before saving (unless we just resolved them)
      if (!skipConflictCheck) {
        const hasConflicts = await checkForConflicts(
          'product',
          product.id,
          originalData,
          productData,
          fieldLabels
        );

        if (hasConflicts) {
          setIsSaving(false);
          return; // Conflict resolution modal will handle the rest
        }
      }

      // Save the product
      await onSave(productData);
      
      // Stop editing status
      stopEditing();
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setSaveError('Error al guardar el producto. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopEditing();
    onClose();
  };

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
                    Editar Producto
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {product.name}
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
                        ? `${otherUsersEditing[0].name || otherUsersEditing[0].email} también está editando este producto.`
                        : `${otherUsersEditing.length} personas están editando este producto.`
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Información Básica
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Costo Unitario (CLP)
                    </label>
                    <input
                      type="number"
                      value={formData.unitCost || ''}
                      onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Platform Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Precios por Plataforma
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio en Café (CLP)
                    </label>
                    <input
                      type="number"
                      value={formData.cafePrice || ''}
                      onChange={(e) => handleInputChange('cafePrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio en Rappi (CLP)
                    </label>
                    <input
                      type="number"
                      value={formData.rappiPrice || ''}
                      onChange={(e) => handleInputChange('rappiPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio en PedidosYa (CLP)
                    </label>
                    <input
                      type="number"
                      value={formData.pedidosyaPrice || ''}
                      onChange={(e) => handleInputChange('pedidosyaPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio en Uber Eats (CLP)
                    </label>
                    <input
                      type="number"
                      value={formData.uberPrice || ''}
                      onChange={(e) => handleInputChange('uberPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Platform Availability */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Disponibilidad por Plataforma
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'availableInCafe', label: 'Disponible en Café' },
                    { key: 'availableOnRappi', label: 'Disponible en Rappi' },
                    { key: 'availableOnPedidosya', label: 'Disponible en PedidosYa' },
                    { key: 'availableOnUber', label: 'Disponible en Uber Eats' },
                  ].map(platform => (
                    <label key={platform.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData[platform.key as keyof Product] as boolean}
                        onChange={(e) => handleInputChange(platform.key as keyof Product, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {platform.label}
                      </span>
                    </label>
                  ))}
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