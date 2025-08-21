import React, { useState, useEffect } from 'react'
import { PlusIcon, PlayIcon, CheckIcon, ClockIcon, CogIcon, ChartBarIcon, EyeIcon, PencilIcon, XMarkIcon, ExclamationTriangleIcon, BuildingOfficeIcon, ShoppingCartIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthService } from '../../../services/authService'

// Interfaces for Production System
interface Insumo {
  id: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  cost: number
  supplierName: string
  sku?: string
}

interface ProductRecipeItem {
  insumoId: string
  insumoName: string
  insumoUnit: string
  estimatedQuantity: number
  estimatedCost: number
}

interface Product {
  id: string
  name: string
  description?: string
  category: string
  sku: string
  unit: string
  type: 'MANUFACTURED'
  estimatedYield: number
  targetCost: number
  recipe: ProductRecipeItem[]
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  notes?: string
  fechaElaboracion?: string
  duracion?: number // in days, null means indefinida
  vencimiento?: string
}

interface ActualUsageItem {
  insumoId: string
  insumoName: string
  estimatedQuantity: number
  actualQuantity: number
  estimatedCost: number
  actualCost: number
  variance: number
  variancePercent: number
}

interface ProductionOrder {
  id: string
  productId: string
  productName: string
  productSku: string
  company: 'muralla-spa' | 'murallita-mef'
  companyName: string
  plannedQuantity: number
  actualQuantity?: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  plannedStartDate: string
  actualStartDate?: string
  plannedEndDate: string
  actualEndDate?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?: string
  estimatedCost: number
  actualCost?: number
  additionalCosts?: number
  additionalCostsDescription?: string
  inventoryCheck: {
    hasEnoughInventory: boolean
    missingItems: Array<{
      insumoId: string
      insumoName: string
      needed: number
      available: number
      shortage: number
      estimatedCost: number
    }>
    purchaseRecommendations?: Array<{
      insumoId: string
      insumoName: string
      quantityToBuy: number
      estimatedCost: number
      supplierName: string
    }>
  }
  actualUsage: ActualUsageItem[]
  lotCode?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  completedBy?: string
  completedAt?: string
}

interface ProductFormData {
  name: string
  description: string
  category: string
  sku: string
  unit: string
  estimatedYield: number
  targetCost: number
  recipe: {
    insumoId: string
    estimatedQuantity: number
  }[]
  notes: string
  fechaElaboracion: string
  duracion: number | null // null means indefinida
  vencimiento: string
  locationId: string
  initialStock: number
}

// Available locations
const LOCATIONS = [
  { id: '1', name: 'Muralla Café', isDefault: true },
  { id: '2', name: 'Bodega Principal', isDefault: false },
  { id: '3', name: 'Tienda Centro', isDefault: false },
  { id: '4', name: 'Producción', isDefault: false }
]

// Utility function to generate automatic internal SKU  
const generateInternalSku = (productType: 'MANUFACTURED' | 'PURCHASED', sequence: number): string => {
  const prefix = productType === 'MANUFACTURED' ? 'MFG' : 'PUR'
  const year = new Date().getFullYear().toString().slice(-2)
  const paddedSequence = sequence.toString().padStart(4, '0')
  return `${prefix}-${year}-${paddedSequence}`
}

interface ProductionOrderFormData {
  productId: string
  company: 'muralla-spa' | 'murallita-mef'
  plannedQuantity: number
  plannedStartDate: string
  plannedEndDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo: string
  notes: string
}

interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
}

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

const ProductionWorkOrders: React.FC = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [showCreateProductForm, setShowCreateProductForm] = useState(false)
  const [showCreateOrderForm, setShowCreateOrderForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingOrder, setViewingOrder] = useState<ProductionOrder | null>(null)
  const [executingOrder, setExecutingOrder] = useState<ProductionOrder | null>(null)
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)

  // Get current user info from JWT token
  const getCurrentUser = (): UserInfo | null => {
    const token = AuthService.getToken()
    if (!token) return null
    
    try {
      const [, payloadSeg] = token.split('.')
      if (!payloadSeg) return null
      
      const base64 = payloadSeg.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const json = atob(padded)
      const payload = JSON.parse(json)
      
      return {
        id: payload.sub || payload.userId || '',
        email: payload.email || '',
        firstName: payload.firstName || payload.given_name || '',
        lastName: payload.lastName || payload.family_name || '',
        fullName: `${payload.firstName || payload.given_name || ''} ${payload.lastName || payload.family_name || ''}`.trim() || payload.email || 'Usuario'
      }
    } catch (e) {
      console.error('Error parsing token:', e)
      return null
    }
  }

  // Mock data - replace with API calls
  useEffect(() => {
    // Mock insumos data (from Insumos system)
    const mockInsumos: Insumo[] = [
      {
        id: '1',
        name: 'Café Arábica Premium',
        description: 'Café de origen colombiano, tostado medio',
        category: 'Café',
        unit: 'kg',
        currentStock: 25,
        cost: 8500,
        supplierName: 'Café Central',
        sku: 'CAF-ARA-001'
      },
      {
        id: '2',
        name: 'Leche Entera',
        description: 'Leche fresca pasteurizada 3.5% grasa',
        category: 'Lácteos',
        unit: 'litros',
        currentStock: 8,
        cost: 1200,
        supplierName: 'Lechería del Valle',
        sku: 'LAC-ENT-001'
      },
      {
        id: '3',
        name: 'Azúcar Blanca',
        category: 'Endulzantes',
        unit: 'kg',
        currentStock: 2,
        cost: 850,
        supplierName: 'Distribuidora Dulce',
        sku: 'END-AZU-001'
      },
      {
        id: '4',
        name: 'Mantequilla',
        category: 'Lácteos',
        unit: 'kg',
        currentStock: 3,
        cost: 4200,
        supplierName: 'Lechería del Valle',
        sku: 'LAC-MAN-001'
      },
      {
        id: '5',
        name: 'Harina de Trigo',
        category: 'Panadería',
        unit: 'kg',
        currentStock: 50,
        cost: 650,
        supplierName: 'Molino San José',
        sku: 'PAN-HAR-001'
      }
    ]

    // Mock products with recipes
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Espresso Muralla Premium',
        description: 'Blend especial de la casa con notas cítricas y chocolate',
        category: 'Café Preparado',
        sku: 'ESP-MUR-001',
        unit: 'kg',
        type: 'MANUFACTURED',
        estimatedYield: 10,
        targetCost: 95000,
        recipe: [
          {
            insumoId: '1',
            insumoName: 'Café Arábica Premium',
            insumoUnit: 'kg',
            estimatedQuantity: 8,
            estimatedCost: 68000
          },
          {
            insumoId: '3',
            insumoName: 'Azúcar Blanca',
            insumoUnit: 'kg',
            estimatedQuantity: 2,
            estimatedCost: 1700
          }
        ],
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        notes: 'Receta perfeccionada después de 5 iteraciones',
        fechaElaboracion: '2025-01-01',
        duracion: 30,
        vencimiento: '2025-01-31'
      },
      {
        id: '2',
        name: 'Latte Mix Murallita',
        description: 'Mezcla lista para preparar lattes cremosos',
        category: 'Café con Leche',
        sku: 'LAT-MUR-001',
        unit: 'kg',
        type: 'MANUFACTURED',
        estimatedYield: 5,
        targetCost: 75000,
        recipe: [
          {
            insumoId: '1',
            insumoName: 'Café Arábica Premium',
            insumoUnit: 'kg',
            estimatedQuantity: 3,
            estimatedCost: 25500
          },
          {
            insumoId: '2',
            insumoName: 'Leche Entera',
            insumoUnit: 'litros',
            estimatedQuantity: 2,
            estimatedCost: 2400
          },
          {
            insumoId: '3',
            insumoName: 'Azúcar Blanca',
            insumoUnit: 'kg',
            estimatedQuantity: 1,
            estimatedCost: 850
          }
        ],
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-10',
        updatedAt: '2025-01-20',
        notes: 'Mezcla optimizada para cremosidad',
        fechaElaboracion: '2025-01-10',
        duracion: 15,
        vencimiento: '2025-01-25'
      }
    ]

    // Mock production orders
    const mockOrders: ProductionOrder[] = [
      {
        id: '1',
        productId: '1',
        productName: 'Espresso Muralla Premium',
        productSku: 'ESP-MUR-001',
        company: 'muralla-spa',
        companyName: 'Muralla Spa',
        plannedQuantity: 20,
        actualQuantity: 18,
        status: 'COMPLETED',
        plannedStartDate: '2025-01-20',
        actualStartDate: '2025-01-20',
        plannedEndDate: '2025-01-21',
        actualEndDate: '2025-01-21',
        priority: 'HIGH',
        assignedTo: 'Carlos López',
        estimatedCost: 190000,
        actualCost: 185000,
        additionalCosts: 5000,
        additionalCostsDescription: 'Horas extra de personal',
        inventoryCheck: {
          hasEnoughInventory: true,
          missingItems: []
        },
        actualUsage: [
          {
            insumoId: '1',
            insumoName: 'Café Arábica Premium',
            estimatedQuantity: 16,
            actualQuantity: 15.5,
            estimatedCost: 136000,
            actualCost: 131750,
            variance: -0.5,
            variancePercent: -3.1
          },
          {
            insumoId: '3',
            insumoName: 'Azúcar Blanca',
            estimatedQuantity: 4,
            actualQuantity: 3.8,
            estimatedCost: 3400,
            actualCost: 3230,
            variance: -0.2,
            variancePercent: -5.0
          }
        ],
        lotCode: 'LOT-2025-001',
        notes: 'Producción exitosa, leve ahorro en insumos',
        createdBy: 'Admin',
        createdAt: '2025-01-19',
        updatedAt: '2025-01-21',
        completedBy: 'Carlos López',
        completedAt: '2025-01-21'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Latte Mix Murallita',
        productSku: 'LAT-MUR-001',
        company: 'murallita-mef',
        companyName: 'Murallita MEF',
        plannedQuantity: 15,
        actualQuantity: 12,
        status: 'IN_PROGRESS',
        plannedStartDate: '2025-01-21',
        actualStartDate: '2025-01-21',
        plannedEndDate: '2025-01-22',
        priority: 'MEDIUM',
        assignedTo: 'María González',
        estimatedCost: 225000,
        inventoryCheck: {
          hasEnoughInventory: false,
          missingItems: [
            {
              insumoId: '2',
              insumoName: 'Leche Entera',
              needed: 6,
              available: 8,
              shortage: 0,
              estimatedCost: 0
            }
          ]
        },
        actualUsage: [],
        createdBy: 'Admin',
        createdAt: '2025-01-20',
        updatedAt: '2025-01-21'
      },
      {
        id: '3',
        productId: '1',
        productName: 'Espresso Muralla Premium',
        productSku: 'ESP-MUR-001',
        company: 'muralla-spa',
        companyName: 'Muralla Spa',
        plannedQuantity: 30,
        status: 'PLANNED',
        plannedStartDate: '2025-01-23',
        plannedEndDate: '2025-01-24',
        priority: 'URGENT',
        assignedTo: 'Juan Pérez',
        estimatedCost: 285000,
        inventoryCheck: {
          hasEnoughInventory: false,
          missingItems: [
            {
              insumoId: '1',
              insumoName: 'Café Arábica Premium',
              needed: 24,
              available: 25,
              shortage: 0,
              estimatedCost: 0
            },
            {
              insumoId: '3',
              insumoName: 'Azúcar Blanca',
              needed: 6,
              available: 2,
              shortage: 4,
              estimatedCost: 3400
            }
          ],
          purchaseRecommendations: [
            {
              insumoId: '3',
              insumoName: 'Azúcar Blanca',
              quantityToBuy: 10,
              estimatedCost: 8500,
              supplierName: 'Distribuidora Dulce'
            }
          ]
        },
        actualUsage: [],
        notes: 'Orden urgente para evento corporativo',
        createdBy: 'Admin',
        createdAt: '2025-01-21',
        updatedAt: '2025-01-21'
      }
    ]

    setInsumos(mockInsumos)
    setProducts(mockProducts)
    setProductionOrders(mockOrders)
    setCurrentUser(getCurrentUser())
  }, [])

  // Handle form submissions
  const handleCreateProduct = async (formData: ProductFormData) => {
    setLoading(true)
    try {
      const recipe = formData.recipe.map(item => {
        const insumo = insumos.find(i => i.id === item.insumoId)
        if (!insumo) throw new Error(`Insumo not found: ${item.insumoId}`)
        
        return {
          insumoId: item.insumoId,
          insumoName: insumo.name,
          insumoUnit: insumo.unit,
          estimatedQuantity: item.estimatedQuantity,
          estimatedCost: item.estimatedQuantity * insumo.cost
        }
      })

      // Generate automatic internal SKU
      const sequence = products.length + 1
      const internalSku = generateInternalSku('MANUFACTURED', sequence)
      const selectedLocation = LOCATIONS.find(loc => loc.id === formData.locationId)

      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sku: formData.sku,
        unit: formData.unit,
        type: 'MANUFACTURED',
        estimatedYield: formData.estimatedYield,
        targetCost: formData.targetCost,
        recipe,
        isActive: true,
        createdBy: currentUser?.fullName || 'Usuario',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
        fechaElaboracion: formData.fechaElaboracion,
        duracion: formData.duracion,
        vencimiento: formData.vencimiento
      }

      setProducts(prev => [...prev, newProduct])
      setShowCreateProductForm(false)
      
      // Show success message with internal SKU
      alert(`Producto manufacturado creado exitosamente!\nSKU Interno: ${internalSku}\nUbicación: ${selectedLocation?.name}`)
    } catch (e) {
      console.error('Failed to create product:', e)
      alert('Error al crear el producto. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProductionOrder = async (formData: ProductionOrderFormData) => {
    setLoading(true)
    try {
      const product = products.find(p => p.id === formData.productId)
      if (!product) throw new Error('Product not found')

      // Calculate inventory requirements and check availability
      const inventoryCheck = checkInventoryForOrder(product, formData.plannedQuantity)

      const estimatedCost = product.recipe.reduce((sum, item) => {
        return sum + (item.estimatedCost * (formData.plannedQuantity / product.estimatedYield))
      }, 0)

      const newOrder: ProductionOrder = {
        id: Date.now().toString(),
        productId: formData.productId,
        productName: product.name,
        productSku: product.sku,
        company: formData.company,
        companyName: formData.company === 'muralla-spa' ? 'Muralla Spa' : 'Murallita MEF',
        plannedQuantity: formData.plannedQuantity,
        status: 'PLANNED',
        plannedStartDate: formData.plannedStartDate,
        plannedEndDate: formData.plannedEndDate,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        estimatedCost,
        inventoryCheck,
        actualUsage: [],
        createdBy: currentUser?.fullName || 'Usuario',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: formData.notes
      }

      setProductionOrders(prev => [...prev, newOrder])
      setShowCreateOrderForm(false)
    } catch (e) {
      console.error('Failed to create production order:', e)
      alert('Error al crear la orden de producción. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const checkInventoryForOrder = (product: Product, plannedQuantity: number) => {
    const missingItems: any[] = []
    const purchaseRecommendations: any[] = []
    
    product.recipe.forEach(recipeItem => {
      const insumo = insumos.find(i => i.id === recipeItem.insumoId)
      if (!insumo) return

      const needed = recipeItem.estimatedQuantity * (plannedQuantity / product.estimatedYield)
      const available = insumo.currentStock
      const shortage = Math.max(0, needed - available)

      if (shortage > 0) {
        missingItems.push({
          insumoId: recipeItem.insumoId,
          insumoName: recipeItem.insumoName,
          needed,
          available,
          shortage,
          estimatedCost: shortage * insumo.cost
        })

        // Recommend buying 2x the shortage or minimum 10 units
        const quantityToBuy = Math.max(shortage * 2, 10)
        purchaseRecommendations.push({
          insumoId: recipeItem.insumoId,
          insumoName: recipeItem.insumoName,
          quantityToBuy,
          estimatedCost: quantityToBuy * insumo.cost,
          supplierName: insumo.supplierName
        })
      } else {
        missingItems.push({
          insumoId: recipeItem.insumoId,
          insumoName: recipeItem.insumoName,
          needed,
          available,
          shortage: 0,
          estimatedCost: 0
        })
      }
    })

    return {
      hasEnoughInventory: missingItems.every(item => item.shortage === 0),
      missingItems,
      purchaseRecommendations: purchaseRecommendations.length > 0 ? purchaseRecommendations : undefined
    }
  }

  // Filter functions
  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesCompany = companyFilter === 'all' || order.company === companyFilter
    return matchesSearch && matchesStatus && matchesCompany
  })

  const filteredProducts = products.filter(product => 
    product.isActive &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Status and priority helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PLANNED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completado'
      case 'IN_PROGRESS': return 'En Proceso'
      case 'PLANNED': return 'Planificado'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Statistics
  const activeOrders = productionOrders.filter(order => order.status === 'IN_PROGRESS').length
  const urgentOrders = productionOrders.filter(order => order.priority === 'URGENT' && order.status !== 'COMPLETED').length
  const completedToday = productionOrders.filter(order => 
    order.status === 'COMPLETED' && 
    order.completedAt && 
    new Date(order.completedAt).toDateString() === new Date().toDateString()
  ).length
  const inventoryIssues = productionOrders.filter(order => 
    !order.inventoryCheck.hasEnoughInventory && order.status === 'PLANNED'
  ).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Sistema de Producción
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestión completa de productos, recetas y órdenes de producción
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'products' ? (
                <button
                  onClick={() => setShowCreateProductForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Producto
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateOrderForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nueva Orden de Producción
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Órdenes de Producción
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Productos y Recetas
            </button>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={activeTab === 'orders' ? "Buscar por producto, SKU o asignado..." : "Buscar productos por nombre, SKU o categoría..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {activeTab === 'orders' && (
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="PLANNED">Planificado</option>
                  <option value="IN_PROGRESS">En Proceso</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las empresas</option>
                  <option value="muralla-spa">Muralla Spa</option>
                  <option value="murallita-mef">Murallita MEF</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <PlayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Proceso</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgentes</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{urgentOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completedToday}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <ShoppingCartIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Falta Inventario</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{inventoryIssues}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'orders' ? (
          <ProductionOrdersList
            orders={filteredOrders}
            onViewOrder={setViewingOrder}
            onExecuteOrder={setExecutingOrder}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            getPriorityColor={getPriorityColor}
          />
        ) : (
          <ProductsList
            products={filteredProducts}
            onEditProduct={setEditingProduct}
            insumos={insumos}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateProductForm && (
        <CreateProductModal
          isOpen={showCreateProductForm}
          onClose={() => setShowCreateProductForm(false)}
          onSubmit={handleCreateProduct}
          insumos={insumos}
          currentUser={currentUser}
          loading={loading}
        />
      )}

      {showCreateOrderForm && (
        <CreateProductionOrderModal
          isOpen={showCreateOrderForm}
          onClose={() => setShowCreateOrderForm(false)}
          onSubmit={handleCreateProductionOrder}
          products={products}
          insumos={insumos}
          currentUser={currentUser}
          loading={loading}
          onCheckInventory={checkInventoryForOrder}
        />
      )}

      {editingProduct && (
        <CreateProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleCreateProduct}
          editingProduct={editingProduct}
          insumos={insumos}
          currentUser={currentUser}
          loading={loading}
        />
      )}

      {viewingOrder && (
        <ViewProductionOrderModal
          isOpen={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          order={viewingOrder}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          getPriorityColor={getPriorityColor}
        />
      )}

      {executingOrder && (
        <ExecuteProductionOrderModal
          isOpen={!!executingOrder}
          onClose={() => setExecutingOrder(null)}
          order={executingOrder}
          onComplete={(updatedOrder) => {
            setProductionOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
            setExecutingOrder(null)
          }}
          currentUser={currentUser}
          insumos={insumos}
        />
      )}
    </div>
  )
}

// Production Orders List Component
const ProductionOrdersList: React.FC<{
  orders: ProductionOrder[]
  onViewOrder: (order: ProductionOrder) => void
  onExecuteOrder: (order: ProductionOrder) => void
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getPriorityColor: (priority: string) => string
}> = ({ orders, onViewOrder, onExecuteOrder, getStatusColor, getStatusLabel, getPriorityColor }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No se encontraron órdenes de producción
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea una nueva orden para comenzar la producción.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {order.productName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.productSku} • {order.lotCode || 'Sin lote'}
                </p>
                <div className="flex items-center mt-1">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {order.companyName}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                  {order.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Cantidad</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.actualQuantity || 0} / {order.plannedQuantity} {order.status === 'COMPLETED' ? '✓' : 'kg'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Asignado a</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.assignedTo || 'Sin asignar'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Fecha límite</span>
                <span className={`text-sm font-medium ${
                  new Date(order.plannedEndDate) < new Date() && order.status !== 'COMPLETED'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {new Date(order.plannedEndDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Costo estimado</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${order.actualCost?.toLocaleString() || order.estimatedCost.toLocaleString()}
                  </div>
                  {order.actualCost && order.actualCost !== order.estimatedCost && (
                    <div className={`text-xs ${
                      order.actualCost > order.estimatedCost 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {order.actualCost > order.estimatedCost ? '+' : ''}
                      ${(order.actualCost - order.estimatedCost).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Warning */}
              {!order.inventoryCheck.hasEnoughInventory && order.status === 'PLANNED' && (
                <div className="flex items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Falta inventario
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onViewOrder(order)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                Ver Detalles
              </button>
              <div className="flex space-x-2">
                {order.status === 'PLANNED' && (
                  <button
                    onClick={() => onExecuteOrder(order)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Iniciar
                  </button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onExecuteOrder(order)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Completar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Products List Component
const ProductsList: React.FC<{
  products: Product[]
  onEditProduct: (product: Product) => void
  insumos: Insumo[]
}> = ({ products, onEditProduct, insumos }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No se encontraron productos
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea un nuevo producto con su receta para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.sku} • {product.category}
              </p>
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {product.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onEditProduct(product)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Rendimiento</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {product.estimatedYield} {product.unit}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Costo objetivo</span>
              <div className="font-medium text-gray-900 dark:text-white">
                ${product.targetCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Expiration Information */}
          {product.fechaElaboracion && (
            <div className="grid grid-cols-3 gap-4 mb-4 border-t border-gray-200 dark:border-gray-600 pt-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Elaboración</span>
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {new Date(product.fechaElaboracion).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Duración</span>
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {product.duracion === null ? 'Indefinida' : `${product.duracion} días`}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Vencimiento</span>
                <div className={`font-medium text-sm ${
                  product.vencimiento && new Date(product.vencimiento) < new Date() 
                    ? 'text-red-600 dark:text-red-400' 
                    : product.vencimiento && new Date(product.vencimiento) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {product.vencimiento ? new Date(product.vencimiento).toLocaleDateString() : 'No definido'}
                </div>
              </div>
            </div>
          )}

          {/* Recipe */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Receta ({product.recipe.length} ingredientes)
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {product.recipe.map((item, index) => {
                const insumo = insumos.find(i => i.id === item.insumoId)
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {item.insumoName}
                    </span>
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {item.estimatedQuantity} {item.insumoUnit}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        ${item.estimatedCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm font-medium">
              <span className="text-gray-900 dark:text-white">Total estimado:</span>
              <span className="text-gray-900 dark:text-white">
                ${product.recipe.reduce((sum, item) => sum + item.estimatedCost, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Creado por {product.createdBy}</span>
            <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Create Product Modal Component
const CreateProductModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => void
  editingProduct?: Product | null
  insumos: Insumo[]
  currentUser: UserInfo | null
  loading: boolean
}> = ({ isOpen, onClose, onSubmit, editingProduct, insumos, currentUser, loading }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: editingProduct?.name || '',
    description: editingProduct?.description || '',
    category: editingProduct?.category || '',
    sku: editingProduct?.sku || '',
    unit: editingProduct?.unit || 'kg',
    estimatedYield: editingProduct?.estimatedYield || 1,
    targetCost: editingProduct?.targetCost || 0,
    recipe: editingProduct?.recipe.map(item => ({
      insumoId: item.insumoId,
      estimatedQuantity: item.estimatedQuantity
    })) || [{ insumoId: '', estimatedQuantity: 0 }],
    notes: editingProduct?.notes || '',
    fechaElaboracion: editingProduct?.fechaElaboracion || new Date().toISOString().split('T')[0],
    duracion: editingProduct?.duracion || null,
    vencimiento: editingProduct?.vencimiento || '',
    locationId: '4', // Default to Producción for manufactured products
    initialStock: 0
  })

  const categories = ['Café Preparado', 'Café con Leche', 'Bebidas Frías', 'Panadería', 'Repostería', 'Otros']
  const units = ['kg', 'litros', 'unidades', 'paquetes', 'cajas']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addRecipeItem = () => {
    setFormData(prev => ({
      ...prev,
      recipe: [...prev.recipe, { insumoId: '', estimatedQuantity: 0 }]
    }))
  }

  const removeRecipeItem = (index: number) => {
    if (formData.recipe.length > 1) {
      setFormData(prev => ({
        ...prev,
        recipe: prev.recipe.filter((_, i) => i !== index)
      }))
    }
  }

  const updateRecipeItem = (index: number, field: 'insumoId' | 'estimatedQuantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      recipe: prev.recipe.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotalCost = () => {
    return formData.recipe.reduce((sum, item) => {
      const insumo = insumos.find(i => i.id === item.insumoId)
      return sum + (insumo ? insumo.cost * item.estimatedQuantity : 0)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                    {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Espresso Muralla Premium"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción del producto terminado..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="ESP-MUR-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unidad *
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rendimiento Esperado *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.estimatedYield}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedYield: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Recipe Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Receta de Producción</h4>
                      <button
                        type="button"
                        onClick={addRecipeItem}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Agregar Ingrediente
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {formData.recipe.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="col-span-6">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Insumo *
                            </label>
                            <select
                              required
                              value={item.insumoId}
                              onChange={(e) => updateRecipeItem(index, 'insumoId', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            >
                              <option value="">Selecciona un insumo</option>
                              {insumos.map(insumo => (
                                <option key={insumo.id} value={insumo.id}>
                                  {insumo.name} ({insumo.currentStock} {insumo.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.estimatedQuantity}
                              onChange={(e) => updateRecipeItem(index, 'estimatedQuantity', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Costo Estimado
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={`$${((insumos.find(i => i.id === item.insumoId)?.cost || 0) * item.estimatedQuantity).toLocaleString()}`}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <button
                              type="button"
                              onClick={() => removeRecipeItem(index)}
                              disabled={formData.recipe.length === 1}
                              className="w-full p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Eliminar ingrediente"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 text-right">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Costo total estimado: ${calculateTotalCost().toLocaleString()} CLP
                      </span>
                    </div>
                  </div>

                  {/* Target Cost */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Costo Objetivo (CLP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.targetCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetCost: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Costo objetivo para benchmarking"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Notas adicionales sobre el producto..."
                    />
                  </div>

                  {/* Expiration Fields */}
                  <div className="mb-6 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Información de Vencimiento
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <strong>Nota:</strong> La duración y fecha de vencimiento se calculan automáticamente una con la otra. 
                        Puedes ingresar cualquiera de los dos valores.
                      </div>
                    </div>
                  </div>

                  {/* Location and Stock Fields */}
                  <div className="mb-6 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Ubicación y Stock Inicial
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ubicación *
                        </label>
                        <select
                          value={formData.locationId}
                          onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          {LOCATIONS.map(location => (
                            <option key={location.id} value={location.id}>
                              {location.name} {location.isDefault ? '(Principal)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stock inicial
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.initialStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, initialStock: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded mt-3">
                      <strong>Nota:</strong> Se generará automáticamente un SKU interno único para este producto manufacturado.
                      La ubicación por defecto para productos manufacturados es "Producción".
                    </div>
                  </div>

                  {/* User Tracking Info */}
                  {currentUser && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>{editingProduct ? 'Modificado' : 'Creado'} por:</strong> {currentUser.fullName} ({currentUser.email})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Crear Producto')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Create Production Order Modal Component
const CreateProductionOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductionOrderFormData) => void
  products: Product[]
  insumos: Insumo[]
  currentUser: UserInfo | null
  loading: boolean
  onCheckInventory: (product: Product, quantity: number) => any
}> = ({ isOpen, onClose, onSubmit, products, insumos, currentUser, loading, onCheckInventory }) => {
  const [formData, setFormData] = useState<ProductionOrderFormData>({
    productId: '',
    company: 'muralla-spa',
    plannedQuantity: 1,
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    assignedTo: '',
    notes: ''
  })

  const [inventoryCheck, setInventoryCheck] = useState<any>(null)

  const selectedProduct = products.find(p => p.id === formData.productId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({ ...prev, productId }))
    const product = products.find(p => p.id === productId)
    if (product) {
      const check = onCheckInventory(product, formData.plannedQuantity)
      setInventoryCheck(check)
    } else {
      setInventoryCheck(null)
    }
  }

  const handleQuantityChange = (quantity: number) => {
    setFormData(prev => ({ ...prev, plannedQuantity: quantity }))
    if (selectedProduct) {
      const check = onCheckInventory(selectedProduct, quantity)
      setInventoryCheck(check)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                    Crear Orden de Producción
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Product Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Producto *
                      </label>
                      <select
                        required
                        value={formData.productId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecciona un producto</option>
                        {products.filter(p => p.isActive).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - Rinde {product.estimatedYield} {product.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Company Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            type="radio"
                            name="company"
                            value="muralla-spa"
                            checked={formData.company === 'muralla-spa'}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value as any }))}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Muralla Spa</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Empresa principal</div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            type="radio"
                            name="company"
                            value="murallita-mef"
                            checked={formData.company === 'murallita-mef'}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value as any }))}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Murallita MEF</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Empresa subsidiaria</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Production Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad Planificada *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.plannedQuantity}
                          onChange={(e) => handleQuantityChange(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        {selectedProduct && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Rendimiento por lote: {selectedProduct.estimatedYield} {selectedProduct.unit}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Prioridad *
                        </label>
                        <select
                          required
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="LOW">Baja</option>
                          <option value="MEDIUM">Media</option>
                          <option value="HIGH">Alta</option>
                          <option value="URGENT">Urgente</option>
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.plannedStartDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, plannedStartDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Fin *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.plannedEndDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, plannedEndDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Asignado a
                      </label>
                      <input
                        type="text"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Nombre del responsable"
                      />
                    </div>

                    {/* Inventory Check */}
                    {inventoryCheck && (
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Revisión de Inventario
                        </h4>
                        
                        {inventoryCheck.hasEnoughInventory ? (
                          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              Hay suficiente inventario para esta producción
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                              <span className="text-sm text-red-700 dark:text-red-300">
                                Inventario insuficiente
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {inventoryCheck.missingItems.filter((item: any) => item.shortage > 0).map((item: any, index: number) => (
                                <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                  <span className="font-medium text-red-600 dark:text-red-400">
                                    {item.insumoName}:
                                  </span> faltan {item.shortage} unidades
                                  (necesitas {item.needed}, disponible {item.available})
                                </div>
                              ))}
                            </div>

                            {inventoryCheck.purchaseRecommendations && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Recomendaciones de Compra:
                                </p>
                                {inventoryCheck.purchaseRecommendations.map((rec: any, index: number) => (
                                  <div key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    Comprar {rec.quantityToBuy} {rec.insumoName} 
                                    (≈${rec.estimatedCost.toLocaleString()}) de {rec.supplierName}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Costo estimado de insumos: ${selectedProduct ? (
                            selectedProduct.recipe.reduce((sum, item) => 
                              sum + (item.estimatedCost * (formData.plannedQuantity / selectedProduct.estimatedYield)), 0
                            ).toLocaleString()
                          ) : 0}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notas
                      </label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Instrucciones especiales o notas..."
                      />
                    </div>

                    {/* User Tracking Info */}
                    {currentUser && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Creado por:</strong> {currentUser.fullName} ({currentUser.email})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !formData.productId}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Orden de Producción'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// View Production Order Modal Component
const ViewProductionOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  order: ProductionOrder
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getPriorityColor: (priority: string) => string
}> = ({ isOpen, onClose, order, getStatusColor, getStatusLabel, getPriorityColor }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Detalles de Orden de Producción
                  </h3>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Order Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Información de la Orden</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Producto</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{order.productName} ({order.productSku})</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{order.companyName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {order.actualQuantity ? `${order.actualQuantity} / ${order.plannedQuantity}` : order.plannedQuantity} kg
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{order.assignedTo || 'Sin asignar'}</dd>
                      </div>
                      {order.lotCode && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Código de lote</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{order.lotCode}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Dates and Timeline */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Fechas y Cronograma</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inicio planificado</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {new Date(order.plannedStartDate).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fin planificado</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {new Date(order.plannedEndDate).toLocaleDateString()}
                        </dd>
                      </div>
                      {order.actualStartDate && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inicio real</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {new Date(order.actualStartDate).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {order.actualEndDate && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fin real</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {new Date(order.actualEndDate).toLocaleString()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Cost Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Información de Costos</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo estimado</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">${order.estimatedCost.toLocaleString()}</dd>
                      </div>
                      {order.actualCost && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo real</dt>
                          <dd className={`text-sm font-medium ${
                            order.actualCost > order.estimatedCost 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            ${order.actualCost.toLocaleString()}
                            {order.actualCost !== order.estimatedCost && (
                              <span className="ml-2 text-xs">
                                ({order.actualCost > order.estimatedCost ? '+' : ''}
                                ${(order.actualCost - order.estimatedCost).toLocaleString()})
                              </span>
                            )}
                          </dd>
                        </div>
                      )}
                      {order.additionalCosts && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Costos adicionales</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            ${order.additionalCosts.toLocaleString()}
                            {order.additionalCostsDescription && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {order.additionalCostsDescription}
                              </div>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Inventory Status */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Estado del Inventario</h4>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${
                        order.inventoryCheck.hasEnoughInventory 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        <div className="flex items-center">
                          {order.inventoryCheck.hasEnoughInventory ? (
                            <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            order.inventoryCheck.hasEnoughInventory 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {order.inventoryCheck.hasEnoughInventory 
                              ? 'Inventario suficiente' 
                              : 'Inventario insuficiente'}
                          </span>
                        </div>
                      </div>
                      
                      {!order.inventoryCheck.hasEnoughInventory && order.inventoryCheck.missingItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Faltantes:</p>
                          {order.inventoryCheck.missingItems.filter(item => item.shortage > 0).map((item, index) => (
                            <div key={index} className="text-sm text-red-600 dark:text-red-400">
                              • {item.insumoName}: faltan {item.shortage} unidades
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actual Usage (for completed orders) */}
                {order.actualUsage.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Uso Real de Insumos</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Insumo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estimado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Real</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Variación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Costo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {order.actualUsage.map((usage, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{usage.insumoName}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{usage.estimatedQuantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{usage.actualQuantity}</td>
                              <td className={`px-4 py-3 text-sm font-medium ${
                                usage.variancePercent > 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : usage.variancePercent < 0 
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-900 dark:text-white'
                              }`}>
                                {usage.variance > 0 ? '+' : ''}{usage.variance} ({usage.variancePercent.toFixed(1)}%)
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                ${usage.actualCost.toLocaleString()}
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Est: ${usage.estimatedCost.toLocaleString()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Notas</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{order.notes}</p>
                  </div>
                )}

                {/* Tracking Information */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Información de Seguimiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Creado por</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{order.createdBy}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de creación</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleString()}</dd>
                    </div>
                    {order.completedBy && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Completado por</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{order.completedBy}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de finalización</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {order.completedAt ? new Date(order.completedAt).toLocaleString() : '—'}
                          </dd>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Execute Production Order Modal Component
const ExecuteProductionOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  order: ProductionOrder
  onComplete: (updatedOrder: ProductionOrder) => void
  currentUser: UserInfo | null
  insumos: Insumo[]
}> = ({ isOpen, onClose, order, onComplete, currentUser, insumos }) => {
  const [actualQuantity, setActualQuantity] = useState(order.actualQuantity || order.plannedQuantity)
  const [actualUsage, setActualUsage] = useState<ActualUsageItem[]>(
    order.status === 'IN_PROGRESS' ? order.actualUsage : 
    order.inventoryCheck.missingItems.map(item => ({
      insumoId: item.insumoId,
      insumoName: item.insumoName,
      estimatedQuantity: item.needed,
      actualQuantity: item.needed,
      estimatedCost: item.needed * (insumos.find(i => i.id === item.insumoId)?.cost || 0),
      actualCost: item.needed * (insumos.find(i => i.id === item.insumoId)?.cost || 0),
      variance: 0,
      variancePercent: 0
    }))
  )
  const [additionalCosts, setAdditionalCosts] = useState(order.additionalCosts || 0)
  const [additionalCostsDescription, setAdditionalCostsDescription] = useState(order.additionalCostsDescription || '')
  const [lotCode, setLotCode] = useState(order.lotCode || `LOT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`)
  const [notes, setNotes] = useState(order.notes || '')

  const updateActualUsage = (index: number, actualQuantity: number) => {
    setActualUsage(prev => prev.map((item, i) => {
      if (i === index) {
        const insumo = insumos.find(ins => ins.id === item.insumoId)
        const actualCost = actualQuantity * (insumo?.cost || 0)
        const variance = actualQuantity - item.estimatedQuantity
        const variancePercent = item.estimatedQuantity > 0 ? (variance / item.estimatedQuantity) * 100 : 0
        
        return {
          ...item,
          actualQuantity,
          actualCost,
          variance,
          variancePercent
        }
      }
      return item
    }))
  }

  const getTotalActualCost = () => {
    return actualUsage.reduce((sum, item) => sum + item.actualCost, 0) + additionalCosts
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedOrder: ProductionOrder = {
      ...order,
      status: order.status === 'PLANNED' ? 'IN_PROGRESS' : 'COMPLETED',
      actualQuantity,
      actualStartDate: order.status === 'PLANNED' ? new Date().toISOString() : order.actualStartDate,
      actualEndDate: order.status === 'IN_PROGRESS' ? new Date().toISOString() : undefined,
      actualCost: getTotalActualCost(),
      additionalCosts,
      additionalCostsDescription,
      actualUsage,
      lotCode,
      notes,
      completedBy: order.status === 'IN_PROGRESS' ? currentUser?.fullName : undefined,
      completedAt: order.status === 'IN_PROGRESS' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    }

    onComplete(updatedOrder)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                    {order.status === 'PLANNED' ? 'Iniciar Producción' : 'Completar Producción'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Production Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad Real Producida *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={actualQuantity}
                          onChange={(e) => setActualQuantity(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Planificado: {order.plannedQuantity} kg
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Código de Lote
                        </label>
                        <input
                          type="text"
                          value={lotCode}
                          onChange={(e) => setLotCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="LOT-2025-001"
                        />
                      </div>
                    </div>

                    {/* Actual Usage */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Uso Real de Insumos
                      </h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {actualUsage.map((item, index) => {
                          const insumo = insumos.find(i => i.id === item.insumoId)
                          return (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="col-span-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Insumo
                                </label>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {item.insumoName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Stock: {insumo?.currentStock || 0} {insumo?.unit}
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Estimado
                                </label>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.estimatedQuantity}
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Cantidad Real *
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={item.actualQuantity}
                                  onChange={(e) => updateActualUsage(index, Number(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Variación
                                </label>
                                <div className={`text-sm font-medium ${
                                  item.variancePercent > 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : item.variancePercent < 0 
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-900 dark:text-white'
                                }`}>
                                  {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}
                                  <div className="text-xs">
                                    ({item.variancePercent.toFixed(1)}%)
                                  </div>
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Costo Real
                                </label>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  ${item.actualCost.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Additional Costs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Costos Adicionales (CLP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={additionalCosts}
                          onChange={(e) => setAdditionalCosts(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descripción de Costos Adicionales
                        </label>
                        <input
                          type="text"
                          value={additionalCostsDescription}
                          onChange={(e) => setAdditionalCostsDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Ej: Horas extra, mantenimiento"
                        />
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Resumen de Costos</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Costo estimado:</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${order.estimatedCost.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Costo real:</span>
                          <div className={`font-medium ${
                            getTotalActualCost() > order.estimatedCost 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            ${getTotalActualCost().toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Diferencia:</span>
                          <div className={`font-medium ${
                            getTotalActualCost() > order.estimatedCost 
                              ? 'text-red-600 dark:text-red-400' 
                              : getTotalActualCost() < order.estimatedCost
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                          }`}>
                            {getTotalActualCost() > order.estimatedCost ? '+' : ''}
                            ${(getTotalActualCost() - order.estimatedCost).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notas de Producción
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Observaciones, problemas encontrados, mejoras sugeridas..."
                      />
                    </div>

                    {/* User Tracking Info */}
                    {currentUser && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>{order.status === 'PLANNED' ? 'Iniciado' : 'Completado'} por:</strong> {currentUser.fullName} ({currentUser.email})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {order.status === 'PLANNED' ? 'Iniciar Producción' : 'Completar Producción'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductionWorkOrders