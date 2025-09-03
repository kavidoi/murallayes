import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ProductCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface CategoryFormData {
  name: string;
  emoji: string;
  description: string;
  color: string;
  isActive: boolean;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onCategoriesUpdate: (categories: ProductCategory[]) => void;
}

const DEFAULT_COLORS = [
  '#8B4513', '#FF6347', '#32CD32', '#4169E1', '#FFD700',
  '#FF69B4', '#8A2BE2', '#00CED1', '#FF4500', '#228B22',
  '#DC143C', '#4682B4', '#DAA520', '#B22222', '#5F9EA0'
];

const EMOJI_SUGGESTIONS = [
  '☕', '🍕', '🍔', '🍟', '🌮', '🥗', '🍝', '🍜', '🍲', '🥘',
  '🍰', '🧁', '🍪', '🍩', '🍫', '🍬', '🍭', '🍯', '🥤', '🧊',
  '📱', '💻', '📚', '🎵', '🎨', '🏠', '🚗', '✈️', '🎁', '🛍️'
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdate
}) => {
  const { t } = useTranslation();
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(categories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    emoji: '',
    description: '',
    color: DEFAULT_COLORS[0],
    isActive: true
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const resetForm = () => {
    setFormData({
      name: '',
      emoji: '',
      description: '',
      color: DEFAULT_COLORS[0],
      isActive: true
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else {
      // Check for duplicate names (excluding current editing category)
      const isDuplicate = localCategories.some(cat => 
        cat.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        cat.id !== editingCategory?.id
      );
      if (isDuplicate) {
        newErrors.name = 'Ya existe una categoría con este nombre';
      }
    }

    if (!formData.color) {
      newErrors.color = 'Selecciona un color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (editingCategory) {
      // Update existing category
      const updatedCategories = localCategories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, ...formData, name: formData.name.trim() }
          : cat
      );
      setLocalCategories(updatedCategories);
    } else {
      // Create new category
      const newCategory: ProductCategory = {
        id: `cat-${Date.now()}`, // In real app, this would come from API
        ...formData,
        name: formData.name.trim()
      };
      setLocalCategories([...localCategories, newCategory]);
    }

    setIsCreating(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      emoji: category.emoji || '',
      description: category.description || '',
      color: category.color,
      isActive: category.isActive
    });
    setIsCreating(true);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.')) {
      const updatedCategories = localCategories.filter(cat => cat.id !== categoryId);
      setLocalCategories(updatedCategories);
    }
  };

  const handleToggleActive = (categoryId: string) => {
    const updatedCategories = localCategories.map(cat =>
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    );
    setLocalCategories(updatedCategories);
  };

  const handleSave = () => {
    onCategoriesUpdate(localCategories);
    onClose();
  };

  const handleCancel = () => {
    setLocalCategories(categories); // Reset to original state
    onClose();
  };

  const filteredCategories = localCategories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showInactive || cat.isActive;
    return matchesSearch && matchesActiveFilter;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleCancel}
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-25 dark:bg-gray-900 dark:bg-opacity-30" />
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestionar Categorías
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Administra las categorías de productos para tu catálogo
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Categorías Existentes ({filteredCategories.length})
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </button>
              </div>

              {/* Search and Filters */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrar categorías inactivas
                  </span>
                </label>
              </div>

              {/* Categories List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredCategories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 border rounded-lg ${
                        category.isActive
                          ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-500 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.emoji || category.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </h4>
                            {category.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleActive(category.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              category.isActive
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title={category.isActive ? 'Desactivar categoría' : 'Activar categoría'}
                          >
                            {category.isActive ? (
                              <EyeIcon className="w-4 h-4" />
                            ) : (
                              <EyeSlashIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar categoría"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar categoría"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron categorías que coincidan con tu búsqueda.' : 'No hay categorías disponibles.'}
                  </div>
                )}
              </div>
            </div>

            {/* Category Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>

              {isCreating && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Nombre de la categoría"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción opcional"
                    />
                  </div>

                  {/* Emoji Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emoji (Opcional)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value.slice(0, 2) }))}
                        className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        placeholder="😀"
                        maxLength={2}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">o selecciona:</span>
                      <div className="flex flex-wrap gap-1">
                        {EMOJI_SUGGESTIONS.slice(0, 10).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {errors.color && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.color}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Categoría activa
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Las categorías inactivas no aparecerán en el selector de productos
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa:</p>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.emoji || formData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {formData.name || 'Nombre de categoría'}
                        </h4>
                        {formData.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingCategory(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
                    >
                      {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                    </button>
                  </div>
                </form>
              )}

              {!isCreating && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Selecciona una categoría para editarla o crea una nueva.
                  </p>
                  <button
                    onClick={() => {
                      setIsCreating(true);
                      setEditingCategory(null);
                      resetForm();
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Categoría
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700"
            >
              Guardar Cambios
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};