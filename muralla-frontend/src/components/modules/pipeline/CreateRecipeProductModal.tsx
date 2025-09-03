import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Product classification enums
type ProductFormat = 'ENVASADOS' | 'CONGELADOS' | 'FRESCOS';
type ProductExtra = 'VEGANO' | 'SIN_AZUCAR' | 'SIN_GLUTEN' | 'KETO' | 'ORGANICO' | 'LIGHT' | 'INTEGRAL' | 'ARTESANAL';
type RecipeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  displayName?: string;
  type: 'TERMINADO' | 'MANUFACTURED' | 'PURCHASED';
  uom: string;
  category?: string;
  unitCost?: number;
  isActive: boolean;
  stockLevel?: number;
  bomComponents?: number;
  fechaElaboracion?: string;
  duracion?: number;
  vencimiento?: string;
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

interface ProductCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  notes?: string;
}

interface RecipeProductFormData {
  name: string;
  description: string;
  displayName: string;
  category: string;
  uom: string;
  servingSize: number;
  difficulty: RecipeDifficulty;
  preparationTime: number;
  cookingTime: number;
  ingredients: RecipeIngredient[];
  instructions: string;
  format?: ProductFormat;
  extras: ProductExtra[];
  brandName: string;
  cafePrice: number;
  rappiPrice: number;
  pedidosyaPrice: number;
  uberPrice: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  availableOnRappi: boolean;
  availableOnPedidosya: boolean;
  availableOnUber: boolean;
  availableInCafe: boolean;
}

interface CreateRecipeProductModalProps {
  onClose: () => void;
  onSuccess: (product: Product) => void;
  categories: ProductCategory[];
  ingredients: Product[];
}

export const CreateRecipeProductModal: React.FC<CreateRecipeProductModalProps> = ({
  onClose,
  onSuccess,
  categories,
  ingredients
}) => {
  const [formData, setFormData] = useState<RecipeProductFormData>({
    name: '',
    description: '',
    displayName: '',
    category: '',
    uom: 'UN',
    servingSize: 1,
    difficulty: 'EASY',
    preparationTime: 15,
    cookingTime: 0,
    ingredients: [],
    instructions: '',
    format: undefined,
    extras: [],
    brandName: '',
    cafePrice: 0,
    rappiPrice: 0,
    pedidosyaPrice: 0,
    uberPrice: 0,
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    availableOnRappi: false,
    availableOnPedidosya: false,
    availableOnUber: false,
    availableInCafe: true
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof RecipeProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      ingredientId: '',
      ingredientName: '',
      quantity: 1,
      unit: 'UN',
      isOptional: false,
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index 
          ? { 
              ...ingredient, 
              [field]: value,
              ...(field === 'ingredientId' ? { 
                ingredientName: ingredients.find(ing => ing.id === value)?.name || '' 
              } : {})
            }
          : ingredient
      )
    }));
  };

  const calculateEstimatedCost = (): number => {
    return formData.ingredients.reduce((total, ingredient) => {
      const ingredientData = ingredients.find(ing => ing.id === ingredient.ingredientId);
      const unitCost = ingredientData?.unitCost || 0;
      return total + (unitCost * ingredient.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      if (!formData.category) {
        throw new Error('La categoría es requerida');
      }
      if (formData.ingredients.length === 0) {
        throw new Error('Debe agregar al menos un ingrediente');
      }
      if (formData.ingredients.some(ing => !ing.ingredientId || ing.quantity <= 0)) {
        throw new Error('Todos los ingredientes deben tener un producto seleccionado y cantidad mayor a 0');
      }

      const estimatedCost = calculateEstimatedCost();

      const newProduct: Product = {
        id: Date.now().toString(),
        sku: `RCP-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        displayName: formData.displayName || formData.name,
        type: 'MANUFACTURED',
        uom: formData.uom,
        category: categories.find(c => c.id === formData.category)?.name,
        unitCost: estimatedCost,
        isActive: true,
        stockLevel: 0,
        minOrderQuantity: formData.minOrderQuantity,
        maxOrderQuantity: formData.maxOrderQuantity,
        availableOnRappi: formData.availableOnRappi,
        availableOnPedidosya: formData.availableOnPedidosya,
        availableOnUber: formData.availableOnUber,
        availableInCafe: formData.availableInCafe,
        cafePrice: formData.cafePrice,
        rappiPrice: formData.rappiPrice,
        pedidosyaPrice: formData.pedidosyaPrice,
        uberPrice: formData.uberPrice,
      };

      onSuccess(newProduct);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el producto con receta');
      console.error('Error creating recipe product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Nuevo Producto con Receta
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Crea un producto manufacturado con su receta de ingredientes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Basic Product Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información del Producto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Muffin de Chocolate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dificultad
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value as RecipeDifficulty)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Medio</option>
                    <option value="HARD">Difícil</option>
                    <option value="EXPERT">Experto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiempo Total (min)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime + formData.cookingTime}
                    onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Ingredientes *
                </h4>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Agregar
                </button>
              </div>

              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={ingredient.ingredientId}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Seleccionar ingrediente</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.uom})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-24">
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Cant."
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="w-20">
                      <select
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-full px-2 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="UN">UN</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="taza">taza</option>
                        <option value="cdta">cdta</option>
                        <option value="cda">cda</option>
                      </select>
                    </div>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ingredient.isOptional}
                        onChange={(e) => updateIngredient(index, 'isOptional', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                      />
                      <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">Opcional</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {formData.ingredients.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Costo estimado:</strong> ${calculateEstimatedCost().toLocaleString()} CLP
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instrucciones de Preparación
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Pasos detallados para preparar el producto..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Producto con Receta'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
