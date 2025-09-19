import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
// import { useTranslation } from 'react-i18next';
import { CategoryManagementModal } from './CategoryManagementModal';
import { SKUGenerator } from '../../sku/SKUGenerator';
import { MentionInput } from '../../common/MentionInput';

// Product classification enums
type ProductFormat = 'ENVASADOS' | 'CONGELADOS' | 'FRESCOS';
type ProductExtra = 'VEGANO' | 'SIN_AZUCAR' | 'SIN_GLUTEN' | 'KETO' | 'ORGANICO' | 'LIGHT' | 'INTEGRAL' | 'ARTESANAL';

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
  bomComponents?: number;
  stockLevel?: number;
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
  // Product Classification for SKU Generation
  format?: ProductFormat;
  extras?: ProductExtra[];
  brandName?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  displayName: string;
  autoSku: string;
  category: string;
  unitCost: number;
  uom: string;
  
  // Multi-Platform Integration Fields
  images: string[];
  
  // Platform-Specific Pricing (in CLP)
  cafePrice: number;
  rappiPrice: number;
  pedidosyaPrice: number;
  uberPrice: number;
  
  // Min/Max Quantities
  minOrderQuantity: number;
  maxOrderQuantity: number;
  
  // Platform Availability
  availableOnRappi: boolean;
  availableOnPedidosya: boolean;
  availableOnUber: boolean;
  availableInCafe: boolean;
  
  // Product Classification for SKU Generation
  format?: ProductFormat;
  extras: ProductExtra[];
  brandName: string;
}

interface CreateProductModalProps {
  onClose: () => void;
  onSuccess: (product: Product) => void;
  categories: ProductCategory[];
  onCategoriesUpdate?: (categories: ProductCategory[]) => void;
}


export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  onClose,
  onSuccess,
  categories,
  onCategoriesUpdate
}) => {
  // const { t } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    displayName: '',
    autoSku: '',
    category: '',
    unitCost: 0,
    uom: 'UN',
    
    // Multi-Platform Integration Fields
    images: [],
    
    // Platform-Specific Pricing (in CLP)
    cafePrice: 0,
    rappiPrice: 0,
    pedidosyaPrice: 0,
    uberPrice: 0,
    
    // Min/Max Quantities
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    
    // Platform Availability - start with café only
    availableOnRappi: false,
    availableOnPedidosya: false,
    availableOnUber: false,
    availableInCafe: true,
    
    // Product Classification for SKU Generation
    format: undefined,
    extras: [],
    brandName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlatformConfig, setShowPlatformConfig] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(categories);

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Generate intelligent SKU preview based on form data
  const generateSkuPreview = (): string => {
    const categoryName = localCategories.find(c => c.id === formData.category)?.name || 'General';
    const categoryPrefix = categoryName.substring(0, 3).toUpperCase();
    const typePrefix = 'PUR'; // Always purchased for this form
    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = '0001'; // This would be calculated based on existing products
    return `${categoryPrefix}-${typePrefix}-${year}-${sequence}`;
  };

  // Generate advanced SKU preview based on new classification system
  const generateAdvancedSkuPreview = (): string => {
    const parts: string[] = [];
    
    // Format code
    if (formData.format) {
      const formatCodes = {
        'ENVASADOS': '100',
        'CONGELADOS': '200',
        'FRESCOS': '300'
      };
      parts.push(formatCodes[formData.format]);
    }
    
    // Brand code (3 chars)
    if (formData.brandName) {
      const brandCode = formData.brandName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 3)
        .padEnd(3, 'X');
      parts.push(brandCode);
    }
    
    
    // Origin placeholder
    parts.push('ORI');
    
    // Extra codes
    if (formData.extras.length > 0) {
      const extraCodes = {
        'ARTESANAL': '2',
        'INTEGRAL': '3',
        'LIGHT': '4',
        'ORGANICO': '5',
        'SIN_GLUTEN': '6',
        'KETO': '7',
        'VEGANO': '8',
        'SIN_AZUCAR': '9'
      };
      
      const codes = formData.extras
        .map(extra => extraCodes[extra])
        .filter(Boolean)
        .sort()
        .join('');
      
      if (codes) {
        parts.push(codes);
      }
    }
    
    return parts.join(' ') || 'Selecciona clasificación para generar SKU';
  };

  // Update SKU preview when form data changes
  useEffect(() => {
    if (formData.name && formData.category) {
      const previewSku = generateSkuPreview();
      setFormData(prev => ({ ...prev, autoSku: previewSku }));
    }
  }, [formData.name, formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create new product object with all advanced fields
      const newProduct: Product = {
        id: `product-${Date.now()}`, // Temporary ID generation
        sku: formData.autoSku || `AUTO-${Date.now()}`,
        name: formData.name,
        description: formData.description || undefined,
        displayName: formData.displayName || formData.name,
        type: 'PURCHASED', // Always purchased for this form
        uom: formData.uom,
        category: localCategories.find(c => c.id === formData.category)?.name,
        unitCost: formData.unitCost,
        isActive: true,
        
        // Multi-Platform Integration Fields
        images: formData.images,
        cafePrice: formData.cafePrice,
        rappiPrice: formData.rappiPrice,
        pedidosyaPrice: formData.pedidosyaPrice,
        uberPrice: formData.uberPrice,
        minOrderQuantity: formData.minOrderQuantity,
        maxOrderQuantity: formData.maxOrderQuantity,
        availableOnRappi: formData.availableOnRappi,
        availableOnPedidosya: formData.availableOnPedidosya,
        availableOnUber: formData.availableOnUber,
        availableInCafe: formData.availableInCafe,
        
        // Product Classification for SKU Generation
        format: formData.format,
        extras: formData.extras,
        brandName: formData.brandName,
      };

      // In a real app, this would be an API call
      // await productsService.createProduct(newProduct);
      
      onSuccess(newProduct);
      onClose();
    } catch (err) {
      setError('Error al crear el producto');
      console.error('Error creating product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoriesUpdate = (updatedCategories: ProductCategory[]) => {
    setLocalCategories(updatedCategories);
    if (onCategoriesUpdate) {
      onCategoriesUpdate(updatedCategories);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
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
          className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nuevo Producto Comprado
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del producto"
                />
              </div>

              {/* Café Price - Right under name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio en Café (CLP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cafePrice}
                  onChange={(e) => handleInputChange('cafePrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Precio base para el café físico
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU (Auto-generado)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.autoSku}
                    onChange={(e) => handleInputChange('autoSku', e.target.value)}
                    className="w-full px-3 py-2 pr-20 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Se generará automáticamente"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    Editable
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Se genera automáticamente basado en categoría y producto, pero puedes editarlo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <MentionInput
                  value={formData.description}
                  onChange={(description) => handleInputChange('description', description)}
                  placeholder="Describe el producto... Usa @ para mencionar usuarios, proveedores, categorías..."
                  className="min-h-[80px]"
                  onMentionCreated={async (mention) => {
                    // Create relationship when entity is mentioned in product description
                    console.log('Product mention created:', mention);
                    // TODO: Create relationship when product is saved
                  }}
                />
              </div>

              {/* Universal SKU Generator */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🏷️ Generación Automática de SKU
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                  El SKU se generará automáticamente cuando se cree el producto usando el sistema universal de SKU templates.
                </p>
                <div className="bg-white dark:bg-gray-700 rounded border px-3 py-2">
                  <span className="text-sm text-gray-500">Vista previa: </span>
                  <code className="text-sm font-mono text-green-600">
                    {formData.autoSku || 'Se generará automáticamente...'}
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {localCategories.filter(cat => cat.isActive).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji && `${cat.emoji} `}{cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    title="Gestionar categorías"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Costo unitario *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unidad *
                  </label>
                  <select
                    value={formData.uom}
                    onChange={(e) => handleInputChange('uom', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UN">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramo</option>
                    <option value="L">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="m">Metro</option>
                    <option value="cm">Centímetro</option>
                    <option value="m2">Metro cuadrado</option>
                    <option value="pack">Paquete</option>
                    <option value="caja">Caja</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Classification Section */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Clasificación del Producto (para SKU)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Formato
                  </label>
                  <select
                    value={formData.format || ''}
                    onChange={(e) => handleInputChange('format', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar formato</option>
                    <option value="ENVASADOS">Envasados (Código 100)</option>
                    <option value="CONGELADOS">Congelados (Código 200)</option>
                    <option value="FRESCOS">Frescos (Código 300)</option>
                  </select>
                </div>


                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la marca"
                  />
                </div>

                {/* Extras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Características Especiales
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[
                      { value: 'VEGANO', label: 'Vegano (Código 8)' },
                      { value: 'SIN_AZUCAR', label: 'Sin Azúcar (Código 9)' },
                      { value: 'SIN_GLUTEN', label: 'Sin Gluten (Código 6)' },
                      { value: 'KETO', label: 'Keto (Código 7)' },
                      { value: 'ORGANICO', label: 'Orgánico (Código 5)' },
                      { value: 'LIGHT', label: 'Light (Código 4)' },
                      { value: 'INTEGRAL', label: 'Integral (Código 3)' },
                      { value: 'ARTESANAL', label: 'Artesanal (Código 2)' }
                    ].map(extra => (
                      <label key={extra.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.extras.includes(extra.value as ProductExtra)}
                          onChange={(e) => {
                            const currentExtras = formData.extras;
                            if (e.target.checked) {
                              handleInputChange('extras', [...currentExtras, extra.value as ProductExtra]);
                            } else {
                              handleInputChange('extras', currentExtras.filter(ex => ex !== extra.value));
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {extra.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SKU Preview */}
              {(formData.format || formData.brandName || formData.extras.length > 0) && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Vista previa del SKU:
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-mono">
                    {generateAdvancedSkuPreview()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    El SKU se generará automáticamente basado en la clasificación seleccionada
                  </p>
                </div>
              )}
            </div>

            {/* Platform Configuration - Expandable */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowPlatformConfig(!showPlatformConfig)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Configuración de Delivery
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (Opcional)
                  </span>
                </div>
                {showPlatformConfig ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {showPlatformConfig && (
                <div className="mt-4 space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre para mostrar al público"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Si está vacío, se usará el nombre del producto
                    </p>
                  </div>

                  {/* Platform Availability */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Plataformas de Delivery
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      El producto siempre está disponible en el café físico. Selecciona las plataformas de delivery adicionales:
                    </p>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      {[
                        { key: 'availableOnRappi', label: 'Rappi', priceKey: 'rappiPrice' },
                        { key: 'availableOnPedidosya', label: 'PedidosYa', priceKey: 'pedidosyaPrice' },
                        { key: 'availableOnUber', label: 'Uber Eats', priceKey: 'uberPrice' },
                      ].map(platform => (
                        <label key={platform.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData[platform.key as keyof ProductFormData] as boolean}
                            onChange={(e) => {
                              handleInputChange(platform.key as keyof ProductFormData, e.target.checked);
                              // Auto-expand platform config when first platform is selected
                              if (e.target.checked && !showPlatformConfig) {
                                setShowPlatformConfig(true);
                              }
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {platform.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Pricing - Only show for selected delivery platforms */}
                  {(formData.availableOnRappi || formData.availableOnPedidosya || formData.availableOnUber) && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Precios para Delivery
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Define precios específicos para las plataformas de delivery seleccionadas
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {formData.availableOnRappi && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Precio en Rappi (CLP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.rappiPrice}
                              onChange={(e) => handleInputChange('rappiPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        )}
                        
                        {formData.availableOnPedidosya && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Precio en PedidosYa (CLP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.pedidosyaPrice}
                              onChange={(e) => handleInputChange('pedidosyaPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        )}
                        
                        {formData.availableOnUber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Precio en Uber Eats (CLP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.uberPrice}
                              onChange={(e) => handleInputChange('uberPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Quantities - Only show if any delivery platform is selected */}
                  {(formData.availableOnRappi || formData.availableOnPedidosya || formData.availableOnUber) && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Cantidades de Pedido para Delivery
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cantidad Mínima
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.minOrderQuantity}
                            onChange={(e) => handleInputChange('minOrderQuantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cantidad Máxima
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.maxOrderQuantity}
                            onChange={(e) => handleInputChange('maxOrderQuantity', parseInt(e.target.value) || 10)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={localCategories}
        onCategoriesUpdate={handleCategoriesUpdate}
      />
    </motion.div>
  );
};
