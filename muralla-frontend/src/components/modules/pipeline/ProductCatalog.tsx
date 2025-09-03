import React, { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TagIcon, CubeIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthService } from '../../../services/authService'
import { useTranslation } from 'react-i18next'
import { useEditingStatus } from '../../../hooks/useEditingStatus'
import { EditingIndicator } from '../../common/EditingIndicator'
import { PresenceIndicator } from '../../common/PresenceIndicator'
import { CreateProductModal } from './CreateProductModal'
import { CreateRecipeProductModal } from './CreateRecipeProductModal'
import { CategoryManagementModal } from './CategoryManagementModal'
// import { recipesService, type ProjectedInventory } from '../../../services/recipesService'

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
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([
    // Default categories for development
    { id: '1', name: 'Bebidas', emoji: '☕', description: 'Bebidas calientes y frías', color: '#8B4513', isActive: true },
    { id: '2', name: 'Alimentos', emoji: '🍕', description: 'Comida y snacks', color: '#FF6347', isActive: true },
    { id: '3', name: 'Postres', emoji: '🍰', description: 'Dulces y postres', color: '#FFB6C1', isActive: true },
    { id: '4', name: 'Suministros', emoji: '📦', description: 'Materiales y suministros', color: '#4682B4', isActive: true }
  ])
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
          isActive: p.isActive ?? true,
          stockLevel: p.stock ?? 0,
          minOrderQuantity: p.minOrderQuantity ?? 1,
          maxOrderQuantity: p.maxOrderQuantity ?? 100,
          availableOnRappi: p.availableOnRappi ?? false,
          availableOnPedidosya: p.availableOnPedidosya ?? false,
          availableOnUberEats: p.availableOnUberEats ?? false,
          availableOnDidiFood: p.availableOnDidiFood ?? false,
          availableOnUber: p.availableOnUber ?? false,
          availableInCafe: p.availableInCafe ?? true,
        }))
        setProducts(mapped)

        try {
          const cats = await AuthService.apiCall<any[]>(`/products/categories/all`)
          const apiCategories = (cats || []).map((c: any) => ({ 
            id: c.id, 
            name: c.name, 
            emoji: c.emoji,
            description: c.description,
            color: c.color || '#64748B',
            isActive: c.isActive !== false
          }))
          
          // If API returns categories, use those; otherwise keep defaults
          if (apiCategories.length > 0) {
            setCategories(apiCategories)
          }
        } catch (categoryError) {
          console.log('Using default categories - API categories not available:', categoryError)
          // Keep the default categories that are already set
        }
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

  const handleProductCreated = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev])
    setShowCreateModal(false)
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
              <PresenceIndicator className="mt-2" />
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Producto Comprado
                </button>
                <button
                  onClick={() => setShowRecipeModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CubeIcon className="h-4 w-4 mr-2" />
                  Producto con Receta
                </button>
              </div>
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
                  <ProductCard key={product.id} product={product} stockStatus={stockStatus} />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Colaboración
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockLevel)
                    return (
                      <ProductRow key={product.id} product={product} stockStatus={stockStatus} />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Product Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProductModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={handleProductCreated} 
            categories={categories}
            onCategoriesUpdate={setCategories}
          />
        )}
      </AnimatePresence>

      {/* Recipe Product Creation Modal */}
      <AnimatePresence>
        {showRecipeModal && (
          <CreateRecipeProductModal 
            onClose={() => setShowRecipeModal(false)} 
            onSuccess={handleProductCreated} 
            categories={categories}
            ingredients={products.filter(p => p.type === 'PURCHASED')}
          />
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        onCategoriesUpdate={setCategories}
      />
    </div>
  )
}

// Product Card Component with Editing Indicators
const ProductCard: React.FC<{ product: Product; stockStatus: any }> = ({ product, stockStatus }) => {
  const { otherUsersEditing, isOthersEditing } = useEditingStatus({
    resource: 'product',
    resourceId: product.id,
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MANUFACTURED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'PURCHASED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MANUFACTURED':
        return <CubeIcon className="w-5 h-5" />
      case 'PURCHASED':
        return <TagIcon className="w-5 h-5" />
      default:
        return <CubeIcon className="w-5 h-5" />
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group relative ${
        isOthersEditing 
          ? 'border-red-300 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Editing Indicator */}
      {isOthersEditing && (
        <div className="absolute -top-2 left-3 z-10">
          <EditingIndicator users={otherUsersEditing} className="bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-md border border-red-200 dark:border-red-700" />
        </div>
      )}

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
}

// Product Row Component with Editing Indicators
const ProductRow: React.FC<{ product: Product; stockStatus: any }> = ({ product, stockStatus }) => {
  const { otherUsersEditing, isOthersEditing } = useEditingStatus({
    resource: 'product',
    resourceId: product.id,
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MANUFACTURED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'PURCHASED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MANUFACTURED':
        return <CubeIcon className="w-5 h-5" />
      case 'PURCHASED':
        return <TagIcon className="w-5 h-5" />
      default:
        return <CubeIcon className="w-5 h-5" />
    }
  }

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
      isOthersEditing ? 'bg-red-50 dark:bg-red-900/10' : ''
    }`}>
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
        {product.stockLevel !== undefined ? (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
            {product.stockLevel} {product.uom}
          </span>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {product.vencimiento ? (
          <span className={`text-xs font-medium ${
            new Date(product.vencimiento) < new Date() 
              ? 'text-red-600 dark:text-red-400' 
              : new Date(product.vencimiento) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {new Date(product.vencimiento).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          product.isActive 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {product.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isOthersEditing ? (
          <EditingIndicator users={otherUsersEditing} showNames={false} />
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
        )}
      </td>
    </tr>
  )
}

export default ProductCatalog
