import React, { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TagIcon, CubeIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthService } from '../../../services/authService'
import { useTranslation } from 'react-i18next'

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  displayName?: string
  type: 'TERMINADO' | 'MANUFACTURED' | 'PURCHASED'
  uom: string
  category?: string
  unitCost?: number
  isActive: boolean
  bomComponents?: number
  stockLevel?: number
  fechaElaboracion?: string
  duracion?: number // in days, null means indefinida
  vencimiento?: string
  
  // Phase 1: Multi-Platform Integration Fields
  images?: string[]
  
  // Platform-Specific Pricing (in CLP)
  cafePrice?: number
  rappiPrice?: number
  pedidosyaPrice?: number
  uberPrice?: number
  
  // Platform External IDs
  rappiProductId?: string
  pedidosyaProductId?: string
  uberProductId?: string
  
  // Min/Max Quantities
  minOrderQuantity: number
  maxOrderQuantity: number
  
  // Platform Availability
  availableOnRappi: boolean
  availableOnPedidosya: boolean
  availableOnUber: boolean
  availableInCafe: boolean
}

interface ProductCategory {
  id: string
  name: string
  emoji?: string
  description?: string
  color: string
  isActive: boolean
}

interface ProductFormData {
  name: string
  description: string
  displayName: string
  autoSku: string // Auto-generated, but editable
  category: string
  unitCost: number
  uom: string
  fechaElaboracion: string
  duracion: number | null // null means indefinida
  vencimiento: string
  locationId: string
  initialStock: number
  
  // Phase 1: Multi-Platform Integration Fields
  images: string[]
  
  // Platform-Specific Pricing (in CLP)
  cafePrice: number
  rappiPrice: number
  pedidosyaPrice: number
  uberPrice: number
  
  // Min/Max Quantities
  minOrderQuantity: number
  maxOrderQuantity: number
  
  // Platform Availability
  availableOnRappi: boolean
  availableOnPedidosya: boolean
  availableOnUber: boolean
  availableInCafe: boolean
}

// Available locations
const LOCATIONS = [
  { id: '1', name: 'Muralla Café', isDefault: true },
  { id: '2', name: 'Bodega Principal', isDefault: false },
  { id: '3', name: 'Tienda Centro', isDefault: false },
  { id: '4', name: 'Producción', isDefault: false }
]

// Utility function to generate automatic internal SKU (kept for future use)
// const generateInternalSku = (productType: 'MANUFACTURED' | 'PURCHASED', sequence: number): string => {
//   const prefix = productType === 'MANUFACTURED' ? 'MFG' : 'PUR'
//   const year = new Date().getFullYear().toString().slice(-2)
//   const paddedSequence = sequence.toString().padStart(4, '0')
//   return `${prefix}-${year}-${paddedSequence}`
// }

// Utility functions for expiration calculations
const calculateVencimiento = (fechaElaboracion: string, duracion: number | null): string => {
  if (!fechaElaboracion || duracion === null) return ''
  const fecha = new Date(fechaElaboracion)
  fecha.setDate(fecha.getDate() + duracion)
  return fecha.toISOString().split('T')[0]
}

const calculateDuracion = (fechaElaboracion: string, vencimiento: string): number | null => {
  if (!fechaElaboracion || !vencimiento) return null
  const fecha1 = new Date(fechaElaboracion)
  const fecha2 = new Date(vencimiento)
  const diffTime = fecha2.getTime() - fecha1.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 ? diffDays : null
}

const ProductCatalog: React.FC = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#64748B')
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    displayName: '',
    autoSku: '',
    category: '',
    unitCost: 0,
    uom: 'UN',
    fechaElaboracion: new Date().toISOString().split('T')[0],
    duracion: null,
    vencimiento: '',
    locationId: '1', // Default to Muralla Café
    initialStock: 0,
    
    // Phase 1: Multi-Platform Integration Fields
    images: [],
    
    // Platform-Specific Pricing (in CLP) - with smart defaults
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
    availableInCafe: true
  })

  // Predefined colors for categories
  const categoryColors = [
    '#3B82F6', '#F59E0B', '#06B6D4', '#8B5CF6', '#10B981', 
    '#F97316', '#84CC16', '#6B7280', '#EF4444', '#64748B',
    '#EC4899', '#14B8A6', '#F472B6', '#8B5A2B', '#92400E'
  ]

  // Generate intelligent SKU preview based on form data
  const generateSkuPreview = (): string => {
    const categoryName = categories.find(c => c.id === formData.category)?.name || 'General'
    const categoryPrefix = categoryName.substring(0, 3).toUpperCase()
    const typePrefix = 'PUR' // Always purchased for this form
    const year = new Date().getFullYear().toString().slice(-2)
    const sequence = (products.length + 1).toString().padStart(4, '0')
    return `${categoryPrefix}-${typePrefix}-${year}-${sequence}`
  }

  // Update SKU preview when form data changes
  useEffect(() => {
    if (formData.name && formData.category) {
      const previewSku = generateSkuPreview()
      setFormData(prev => ({ ...prev, autoSku: previewSku }))
    }
  }, [formData.name, formData.category, categories, products.length])

  // Popular emojis for categories
  const popularEmojis = [
    '📱', '💻', '🖥️', '⌚', '🔌', '🎧', '📷', '🖨️', '📟', '📿',
    '🍕', '☕', '🥤', '🍰', '🧴', '🧽', '🔧', '⚙️', '🔩', '📝',
    '📚', '🎨', '✏️', '📐', '📌', '🗂️', '📊', '💼', '🏢', '🛍️'
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AuthService.apiCall<{ data: any[] }>(`/products?limit=100`)
        const mapped: Product[] = (res.data || []).map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: p.description,
          type: p.type || 'PURCHASED',
          uom: p.uom || 'UN',
          category: p.category?.name,
          unitCost: p.unitCost ?? p.price ?? 0,
          isActive: p.isActive,
          stockLevel: p.stock,
        }))
        setProducts(mapped)

        const cats = await AuthService.apiCall<any[]>(`/products/categories/all`)
        setCategories((cats || []).map((c: any) => ({ 
          id: c.id, 
          name: c.name, 
          emoji: c.emoji,
          description: c.description,
          color: c.color || '#64748B',
          isActive: c.isActive !== false
        })))
      } catch (e) {
        console.error('Error loading products/categories', e)
      }
    }
    load()
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || product.type === selectedType
    const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategoryName || product.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MANUFACTURED': return <CubeIcon className="h-5 w-5" />
      case 'PURCHASED': return <TagIcon className="h-5 w-5" />
      case 'TERMINADO': return <CubeIcon className="h-5 w-5" />
      default: return <CubeIcon className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MANUFACTURED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PURCHASED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'TERMINADO': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStockStatus = (level?: number) => {
    if (!level) return { color: 'bg-gray-100 text-gray-800', label: 'Sin stock' }
    if (level < 20) return { color: 'bg-red-100 text-red-800', label: 'Stock bajo' }
    if (level < 50) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock medio' }
    return { color: 'bg-green-100 text-green-800', label: 'Stock alto' }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Create product via backend API
      const productData = {
        name: formData.name,
        description: formData.description,
        displayName: formData.displayName || formData.name,
        sku: formData.autoSku || undefined, // Let backend auto-generate if empty
        categoryId: formData.category || undefined,
        type: 'PURCHASED' as const, // Use PURCHASED for purchased items
        uom: formData.uom,
        unitCost: formData.unitCost,
        price: formData.unitCost, // Set price same as unit cost initially
        
        // Phase 1: Multi-Platform Integration Fields
        images: formData.images,
        
        // Platform-Specific Pricing
        cafePrice: formData.cafePrice,
        rappiPrice: formData.rappiPrice,
        pedidosyaPrice: formData.pedidosyaPrice,
        uberPrice: formData.uberPrice,
        
        // Min/Max Quantities
        minOrderQuantity: formData.minOrderQuantity,
        maxOrderQuantity: formData.maxOrderQuantity,
        
        // Platform Availability
        availableOnRappi: formData.availableOnRappi,
        availableOnPedidosya: formData.availableOnPedidosya,
        availableOnUber: formData.availableOnUber,
        availableInCafe: formData.availableInCafe,
        
        isActive: true
      }

      const createdProduct = await AuthService.apiCall('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (createdProduct) {
        // Update local state with the created product
        const newProduct: Product = {
          id: Date.now().toString(),
          sku: productData.sku || `AUTO-${Date.now()}`,
          name: productData.name,
          description: productData.description,
          displayName: productData.displayName,
          type: productData.type,
          uom: productData.uom,
          category: categories.find(c => c.name === formData.category)?.name,
          unitCost: productData.unitCost,
          isActive: productData.isActive,
          stockLevel: 0, // Will be updated when stock is added
          // Phase 1: Multi-Platform Integration Fields
          images: productData.images || [],
          cafePrice: productData.cafePrice || 0,
          rappiPrice: productData.rappiPrice || 0,
          pedidosyaPrice: productData.pedidosyaPrice || 0,
          uberPrice: productData.uberPrice || 0,
          minOrderQuantity: productData.minOrderQuantity || 1,
          maxOrderQuantity: productData.maxOrderQuantity || 10,
          availableOnRappi: productData.availableOnRappi || false,
          availableOnPedidosya: productData.availableOnPedidosya || false,
          availableOnUber: productData.availableOnUber || false,
          availableInCafe: productData.availableInCafe !== undefined ? productData.availableInCafe : true
        }
        
        setProducts(prev => [...prev, newProduct])
        setShowCreateModal(false)
        resetForm()
        
        // Show success message with actual SKU
        const selectedLocation = LOCATIONS.find(loc => loc.id === formData.locationId)
        alert(`Producto creado exitosamente!\nSKU: ${createdProduct.sku}\nUbicación: ${selectedLocation?.name}`)
      }
    } catch (e) {
      console.error('Error creating product:', e)
      alert('Error al crear el producto. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      displayName: '',
      autoSku: '',
      category: '',
      unitCost: 0,
      uom: 'UN',
      fechaElaboracion: new Date().toISOString().split('T')[0],
      duracion: null,
      vencimiento: '',
      locationId: '1', // Default to Muralla Café
      initialStock: 0,
      
      // Phase 1: Multi-Platform Integration Fields
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
      availableInCafe: true
    })
  }

  // Category management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const newCategory = await AuthService.apiCall('/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          emoji: newCategoryEmoji,
          color: newCategoryColor,
          isInventory: true,
          isActive: true
        })
      })

      if (newCategory) {
        setCategories(prev => [...prev, {
          id: newCategory.id,
          name: newCategory.name,
          emoji: newCategory.emoji,
          color: newCategory.color,
          isActive: true
        }])
      }

      setNewCategoryName('')
      setNewCategoryEmoji('')
      setNewCategoryColor('#64748B')
    } catch (e) {
      console.error('Error creating category:', e)
      alert('Error al crear la categoría. Por favor intenta de nuevo.')
    }
  }

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryEmoji(category.emoji || '')
    setNewCategoryColor(category.color)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return

    try {
      const updatedCategory = await AuthService.apiCall(`/products/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          emoji: newCategoryEmoji,
          color: newCategoryColor
        })
      })

      if (updatedCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, name: updatedCategory.name, emoji: updatedCategory.emoji, color: updatedCategory.color }
            : cat
        ))
      }

      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryEmoji('')
      setNewCategoryColor('#64748B')
    } catch (e) {
      console.error('Error updating category:', e)
      alert('Error al actualizar la categoría. Por favor intenta de nuevo.')
    }
  }

  const handleToggleCategoryActive = async (categoryId: string) => {
    try {
      const category = categories.find(c => c.id === categoryId)
      if (!category) return

      const updatedCategory = await AuthService.apiCall(`/products/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !category.isActive
        })
      })

      if (updatedCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? { ...cat, isActive: updatedCategory.isActive } : cat
        ))
      }
    } catch (e) {
      console.error('Error toggling category status:', e)
      alert('Error al cambiar el estado de la categoría.')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return

    try {
      await AuthService.apiCall(`/products/categories/${categoryId}`, {
        method: 'DELETE'
      })

      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
    } catch (e) {
      console.error('Error deleting category:', e)
      alert('Error al eliminar la categoría. Puede que tenga productos asociados.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Catálogo de Productos
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestiona productos manufacturados (creados en Producción) y productos comprados
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Tabla
                </button>
              </div>
              {/* Type tabs */}
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'MANUFACTURED', label: 'Manufacturados' },
                  { id: 'PURCHASED', label: 'Comprados' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedType(tab.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      selectedType === tab.id
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Producto Comprado
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                <option value="MANUFACTURED">Manufacturados</option>
                <option value="PURCHASED">Comprados</option>
              </select>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCategoriesModal(true)}
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <TagIcon className="h-4 w-4 mr-1 inline" />
                  Gestionar Categorías
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">i</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dos formas de crear productos:</strong> Los productos <span className="font-semibold">manufacturados</span> se crean en la sección de Producción con sus recetas de insumos. 
              Los productos <span className="font-semibold">comprados</span> se crean aquí directamente con sus precios de compra.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stockLevel)
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${getTypeColor(product.type)}`}>
                        {getTypeIcon(product.type)}
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {product.sku}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {product.type === 'MANUFACTURED' ? 'Costo estimado' : 'Costo unitario'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${product.unitCost?.toLocaleString()} / {product.uom}
                        </span>
                      </div>
                      
                      {product.stockLevel !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Stock</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${stockStatus.color}`}>
                            {product.stockLevel} {product.uom}
                          </span>
                        </div>
                      )}
                      
                      {product.bomComponents && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Componentes BOM</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.bomComponents}
                          </span>
                        </div>
                      )}

                      {/* Expiration Information */}
                      {product.fechaElaboracion && (
                        <div className="border-t pt-2 mt-2 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Elaboración</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {new Date(product.fechaElaboracion).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {product.duracion !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Duración</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {product.duracion === null ? 'Indefinida' : `${product.duracion} días`}
                              </span>
                            </div>
                          )}
                          
                          {product.vencimiento && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Vencimiento</span>
                              <span className={`text-xs font-medium ${
                                new Date(product.vencimiento) < new Date() 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : new Date(product.vencimiento) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {new Date(product.vencimiento).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo unitario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockLevel)
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${getTypeColor(product.type)} mr-4`}>
                              {getTypeIcon(product.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {product.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(product.type)}`}>
                            {product.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${product.unitCost?.toLocaleString()} / {product.uom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {product.stockLevel} {product.uom}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.vencimiento ? (
                            <div className="text-sm">
                              <div className={`font-medium ${
                                new Date(product.vencimiento) < new Date() 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : new Date(product.vencimiento) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {new Date(product.vencimiento).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {product.duracion === null ? 'Indefinida' : `${product.duracion} días`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">Sin definir</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron productos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o crear un producto comprado.
            </p>
          </div>
        )}

        {/* Categories Management Modal */}
        {showCategoriesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('products.manageCategories')}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoriesModal(false)
                    setEditingCategory(null)
                    setNewCategoryName('')
                    setNewCategoryEmoji('')
                    setNewCategoryColor('#64748B')
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add/Edit Category Form */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {editingCategory ? t('products.editCategory') : t('products.addNewCategory')}
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Category Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('products.categoryName')}
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t('products.categoryName')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Emoji Selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('products.categoryEmoji')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newCategoryEmoji}
                          onChange={(e) => setNewCategoryEmoji(e.target.value.slice(0, 2))}
                          placeholder="📱"
                          className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {popularEmojis.slice(0, 10).map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setNewCategoryEmoji(emoji)}
                              className={`p-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded ${
                                newCategoryEmoji === emoji ? 'bg-blue-100 dark:bg-blue-900' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('products.categoryColor')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {categoryColors.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setNewCategoryColor(color)}
                              className={`w-6 h-6 rounded-full border-2 ${
                                newCategoryColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {editingCategory ? (
                        <>
                          <button
                            onClick={handleUpdateCategory}
                            disabled={!newCategoryName.trim()}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('common.update')}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategory(null)
                              setNewCategoryName('')
                              setNewCategoryEmoji('')
                              setNewCategoryColor('#64748B')
                            }}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim()}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('common.add')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('products.existingCategories')}
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex items-center space-x-2">
                            {category.emoji && (
                              <span className="text-lg">{category.emoji}</span>
                            )}
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white font-medium">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleCategoryActive(category.id)}
                            className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                              category.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {category.isActive ? t('common.active') : t('common.inactive')}
                          </button>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('common.edit')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-6">
                <button
                  onClick={() => {
                    setShowCategoriesModal(false)
                    setEditingCategory(null)
                    setNewCategoryName('')
                    setNewCategoryEmoji('')
                    setNewCategoryColor('#64748B')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Nuevo Producto Comprado
              </h3>
              
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SKU (Auto-generado)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.autoSku}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoSku: e.target.value }))}
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
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.filter(cat => cat.isActive).map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.emoji && `${cat.emoji} `}{cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoriesModal(true)}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, uom: e.target.value }))}
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

                {/* Location and Stock Fields */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Ubicación y Stock
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ubicación *
                      </label>
                      <select
                        value={formData.locationId}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {LOCATIONS.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} {location.isDefault ? '(Principal)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stock inicial
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.initialStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, initialStock: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded mt-3">
                    <strong>Nota:</strong> Se generará automáticamente un SKU interno único para este producto.
                    La ubicación por defecto es "Muralla Café".
                  </div>
                </div>

                {/* Expiration Fields */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Información de Vencimiento
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Elaboración *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.fechaElaboracion}
                        onChange={(e) => {
                          const newFecha = e.target.value
                          setFormData(prev => {
                            const newData = { ...prev, fechaElaboracion: newFecha }
                            // Auto-calculate vencimiento if duracion exists
                            if (prev.duracion !== null) {
                              newData.vencimiento = calculateVencimiento(newFecha, prev.duracion)
                            }
                            return newData
                          })
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duración (días)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={formData.duracion || ''}
                            onChange={(e) => {
                              const newDuracion = e.target.value === '' ? null : parseInt(e.target.value)
                              setFormData(prev => {
                                const newData = { ...prev, duracion: newDuracion }
                                // Auto-calculate vencimiento if duracion is set
                                if (newDuracion !== null && prev.fechaElaboracion) {
                                  newData.vencimiento = calculateVencimiento(prev.fechaElaboracion, newDuracion)
                                }
                                return newData
                              })
                            }}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Indefinida"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, duracion: null, vencimiento: '' }))}
                            className="px-2 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Marcar como indefinida"
                          >
                            ∞
                          </button>
                        </div>
                        {formData.duracion === null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Duración indefinida</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          value={formData.vencimiento}
                          onChange={(e) => {
                            const newVencimiento = e.target.value
                            setFormData(prev => {
                              const newData = { ...prev, vencimiento: newVencimiento }
                              // Auto-calculate duracion if vencimiento is set
                              if (newVencimiento && prev.fechaElaboracion) {
                                newData.duracion = calculateDuracion(prev.fechaElaboracion, newVencimiento)
                              }
                              return newData
                            })
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <strong>Nota:</strong> La duración y fecha de vencimiento se calculan automáticamente una con la otra. 
                      Puedes ingresar cualquiera de los dos valores.
                    </div>
                  </div>
                </div>

                {/* Phase 1: Multi-Platform Integration Fields */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('products.platformSettings')}
                  </h4>
                  
                  {/* Display Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('products.displayName')}
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre para mostrar en plataformas de delivery"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Si está vacío, se usará el nombre del producto
                    </p>
                  </div>

                  {/* Platform-Specific Pricing */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('products.pricingSection')}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('products.pricingHint')}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.cafePrice')} (CLP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.cafePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, cafePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.rappiPrice')} (CLP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.rappiPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, rappiPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.pedidosyaPrice')} (CLP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.pedidosyaPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, pedidosyaPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.uberPrice')} (CLP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.uberPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, uberPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Limits */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('products.orderLimits')}
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.minQuantity')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.minOrderQuantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, minOrderQuantity: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.maxQuantity')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxOrderQuantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxOrderQuantity: parseInt(e.target.value) || 10 }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platform Availability */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('products.platformAvailability')}
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availableInCafe}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableInCafe: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          ☕ {t('products.availableInCafe')}
                        </span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availableOnRappi}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableOnRappi: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 dark:focus:ring-orange-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          🟠 {t('products.availableOnRappi')}
                        </span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availableOnPedidosya}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableOnPedidosya: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 dark:focus:ring-red-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          🔴 {t('products.availableOnPedidosya')}
                        </span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availableOnUber}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableOnUber: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 dark:focus:ring-green-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          🟢 {t('products.availableOnUber')}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <strong>💡 Consejo:</strong> Configura precios diferentes para cada plataforma considerando las comisiones. 
                    Los límites de cantidad son requeridos por algunas plataformas como Rappi.
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creando...' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalog
