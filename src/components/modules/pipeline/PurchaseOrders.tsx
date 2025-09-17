import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SupplierForm from './SupplierForm'
import { CreateProductModal } from './CreateProductModal'
import ExcelImportModal from './ExcelImportModal'
import { DocumentTextIcon, PaperClipIcon, BanknotesIcon, BuildingOfficeIcon, PlusIcon, PencilIcon, CheckIcon, XMarkIcon, EyeIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { PurchaseOrdersService } from '../../../services/purchaseOrdersService'
import type { CostDTO, CostLine } from '../../../services/purchaseOrdersService'
import { usersService } from '../../../services/usersService'
import { AuthService } from '../../../services/authService'

interface PurchaseOrderRow {
  id: string
  companyId: string
  companyName?: string
  vendorName?: string
  docType: string
  docNumber?: string | null
  date: Date
  total: number
  currency: string
  status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  description?: string | null
  attachments: number
  hasInventoryLines: boolean
  lines?: CostLine[]
  createdBy?: string
  approvedBy?: string
  createdAt?: Date
  updatedAt?: Date
}

interface Supplier {
  id: string
  internalNumber?: string // Auto-generated: SUPP-001, SUPP-002, etc.
  name: string
  vendorType: 'AGENTE' | 'PROVEEDOR_REGULAR' | 'EMPRENDEDOR'
  taxId?: string // RUT - optional since not always available
  email?: string
  phone?: string
  address?: string
  contactName?: string
  paymentTerms?: string
  isActive: boolean
  brandContactId?: string // Link to brand contact if this vendor is a brand
  
  // Legacy fields for backward compatibility
  rut?: string
}

interface Brand {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  isContact: boolean // true if it's a structured contact, false if just text
}

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  type: 'PURCHASED' | 'MANUFACTURED'
  unitCost?: number
  uom: string
  category?: string
  isActive: boolean
  // Brand can be either a structured contact or simple text
  brand?: Brand
  brandName?: string // Simple text field when brand is not a contact
}

interface PurchaseOrderFormData {
  // Main supplier (creates factura)
  mainSupplierId: string
  mainSupplierName: string
  
  // Legacy fields for backward compatibility
  vendorName: string
  vendorId?: string
  
  docType: string
  docNumber?: string // This will be auto-generated internal PO number
  thirdPartyDocType?: 'FACTURA' | 'BOLETA' | 'NONE'
  thirdPartyDocNumber?: string
  date: string
  expectedDelivery?: string
  description?: string
  companyId: string
  receiptFile?: File
  
  // Sub-suppliers for delivery
  subSuppliers: {
    supplierId: string
    supplierName: string
    shippingCost?: number
    expectedDelivery?: string
    trackingNumber?: string
    notes?: string
    allowSharedShipping?: boolean
  }[]
  
  lines: {
    description: string
    quantity: number
    unitCost: number
    totalCost: number
    shippingCostUnit?: number // Prorated shipping per unit
    isInventory: boolean
    productId?: string
    productName?: string
    // Delivery assignment
    deliveredBy: 'MAIN' | 'SUB' // Who delivers this line
    subSupplierId?: string // If delivered by sub-supplier
    deliveryDate?: string
    trackingNumber?: string
  }[]
}

interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
}

// Function to generate automatic internal PO number
const generatePONumber = (existingPOs: PurchaseOrderRow[]): string => {
  const currentYear = new Date().getFullYear()
  
  // Find the highest number for this year
  const yearPattern = `PO-${currentYear}`
  const existingNumbers = existingPOs
    .map(po => po.docNumber)
    .filter(docNum => docNum && docNum.startsWith(yearPattern))
    .map(docNum => {
      const match = docNum?.match(/PO-\d{4}-(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter(num => !isNaN(num))
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
  return `${yearPattern}-${String(nextNumber).padStart(3, '0')}`
}

const PurchaseOrders: React.FC = () => {
  const [rows, setRows] = useState<PurchaseOrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrderRow | null>(null)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrderRow | null>(null)
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)
  const [productCategories, setProductCategories] = useState<Array<{
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    color: string;
    isActive: boolean;
  }>>([
    { id: '1', name: 'Bebidas', emoji: '☕', color: '#8B4513', isActive: true },
    { id: '2', name: 'Comida', emoji: '🍕', color: '#FF6347', isActive: true },
    { id: '3', name: 'Postres', emoji: '🍰', color: '#FFD700', isActive: true },
    { id: '4', name: 'Ingredientes', emoji: '🥘', color: '#32CD32', isActive: true },
    { id: '5', name: 'Suministros', emoji: '📦', color: '#4169E1', isActive: true }
  ])

  // Function to log actions (this could be enhanced to send to backend)
  const logAction = (action: string, orderId: string, details?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || currentUser?.email || 'Usuario desconocido',
      userId: currentUser?.id || 'unknown',
      action,
      orderId,
      details
    }
    
    console.log('Purchase Order Action:', logEntry)
    
    // TODO: Send to backend logging service when available
    // LoggingService.log('purchase_order', logEntry)
    
    // For now, store in localStorage for demo purposes
    try {
      const existingLogs = JSON.parse(localStorage.getItem('purchase_order_logs') || '[]')
      existingLogs.push(logEntry)
      // Keep only last 100 entries
      localStorage.setItem('purchase_order_logs', JSON.stringify(existingLogs.slice(-100)))
    } catch (e) {
      console.error('Failed to store action log:', e)
    }
  }

  // Get current user info from JWT token and backend
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
      
      const firstName = payload.firstName || payload.given_name || payload.name?.split(' ')[0] || ''
      const lastName = payload.lastName || payload.family_name || payload.name?.split(' ').slice(1).join(' ') || ''
      const email = payload.email || payload.username || ''
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                      payload.name || 
                      email || 
                      'Usuario Actual'
      
      return {
        id: payload.sub || payload.userId || payload.id || '',
        email,
        firstName,
        lastName,
        fullName
      }
    } catch (e) {
      console.error('Error parsing token:', e)
      return {
        id: 'unknown',
        email: 'usuario@sistema.com',
        firstName: 'Usuario',
        lastName: 'Actual',
        fullName: 'Usuario Actual'
      }
    }
  }

  // Load current user from backend if available
  const loadCurrentUserFromBackend = async () => {
    try {
      const tokenUser = getCurrentUser()
      if (tokenUser?.id && tokenUser.id !== 'unknown') {
        const backendUser = await usersService.getUser(tokenUser.id)
        setCurrentUser({
          id: backendUser.id,
          email: backendUser.email,
          firstName: (backendUser as any).firstName || '',
          lastName: (backendUser as any).lastName || '',
          fullName: `${(backendUser as any).firstName || ''} ${(backendUser as any).lastName || ''}`.trim() || backendUser.email
        })
      } else {
        setCurrentUser(tokenUser)
      }
    } catch (error) {
      console.log('Could not load user from backend, using token data:', error)
      setCurrentUser(getCurrentUser())
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const list = await PurchaseOrdersService.list({ take: 100 })
      const mapped: PurchaseOrderRow[] = (list || []).map((c: CostDTO) => ({
        id: c.id,
        companyId: c.companyId,
        companyName: c.company?.name,
        vendorName: c.vendor?.name,
        docType: c.docType,
        docNumber: c.docNumber ?? undefined,
        date: new Date(c.date),
        total: typeof c.total === 'string' ? Number(c.total) : (c.total as any),
        currency: c.currency || 'CLP',
        status: c.status as any,
        description: c.description ?? undefined,
        attachments: (c.attachments || []).length,
        hasInventoryLines: (c.lines || []).some(l => !!l.isInventory || !!l.productId),
        lines: c.lines,
        createdBy: (c as any).createdBy || (c as any).createdByUser?.firstName ? 
          `${(c as any).createdByUser?.firstName || ''} ${(c as any).createdByUser?.lastName || ''}`.trim() || 
          (c as any).createdByUser?.email || 
          'Sistema' : 'Sistema',
        approvedBy: c.status === 'APPROVED' ? 
          ((c as any).approvedByUser?.firstName ? 
            `${(c as any).approvedByUser?.firstName || ''} ${(c as any).approvedByUser?.lastName || ''}`.trim() || 
            (c as any).approvedByUser?.email || 
            'Admin' : 'Admin') : undefined,
        createdAt: new Date((c as any).createdAt || c.date),
        updatedAt: new Date((c as any).updatedAt || c.date)
      }))
      setRows(mapped)
    } catch (e) {
      console.error('Failed to load purchase orders', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadCurrentUserFromBackend()
  }, [])

  const handleCreateOrder = async (formData: PurchaseOrderFormData) => {
    setActionLoading('create')
    try {
      // Use the PO number from the form (already generated or user-modified)
      
      // Upload receipt file if provided
      let attachments: any[] = []
      if (formData.receiptFile) {
        try {
          const uploadResult = await PurchaseOrdersService.uploadReceipt(formData.receiptFile)
          if (uploadResult?.fileUrl) {
            attachments.push({
              fileName: formData.receiptFile.name,
              fileUrl: uploadResult.fileUrl,
              fileType: formData.receiptFile.type,
              fileSize: formData.receiptFile.size
            })
          }
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError)
          // Continue with PO creation even if file upload fails
        }
      }
      
      // Build description with third-party document info if provided
      let description = `${formData.vendorName} - ${formData.description || ''}`.trim()
      if (formData.thirdPartyDocType && formData.thirdPartyDocType !== 'NONE' && formData.thirdPartyDocNumber) {
        description += ` | ${formData.thirdPartyDocType}: ${formData.thirdPartyDocNumber}`
      }
      
      const orderData: Partial<CostDTO> = {
        vendorId: undefined, // We'll use vendorName for now
        docType: formData.docType,
        docNumber: formData.docNumber, // Use the PO number from the form
        date: formData.date,
        description,
        companyId: formData.companyId,
        total: formData.lines.reduce((sum, line) => sum + line.totalCost, 0),
        currency: 'CLP',
        payerType: 'COMPANY',
        status: 'PENDING',
        attachments,
        lines: formData.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          isInventory: line.isInventory,
          productId: line.productId || null
        }))
      }
      
      const newOrder = await PurchaseOrdersService.create(orderData)
      logAction('CREATE', newOrder.id, {
        vendor: formData.vendorName,
        docType: formData.docType,
        total: orderData.total
      })
      setShowCreateForm(false)
      await load() // Reload the list
    } catch (e) {
      console.error('Failed to create purchase order:', e)
      alert('Error al crear la orden de compra. Por favor intenta de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditOrder = async (formData: PurchaseOrderFormData) => {
    if (!editingOrder) return
    
    setActionLoading(`edit-${editingOrder.id}`)
    try {
      const orderData: Partial<CostDTO> = {
        vendorId: undefined, // We'll use vendorName for now
        docType: formData.docType,
        docNumber: formData.docNumber || undefined,
        date: formData.date,
        description: `${formData.vendorName} - ${formData.description || ''}`.trim(),
        companyId: formData.companyId,
        total: formData.lines.reduce((sum, line) => sum + line.totalCost, 0),
        currency: 'CLP',
        payerType: 'COMPANY',
        lines: formData.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          isInventory: line.isInventory,
          productId: line.productId || null
        }))
      }
      
      await PurchaseOrdersService.update(editingOrder.id, orderData)
      logAction('UPDATE', editingOrder.id, {
        vendor: formData.vendorName,
        docType: formData.docType,
        total: orderData.total
      })
      setEditingOrder(null)
      await load()
    } catch (e) {
      console.error('Failed to edit purchase order:', e)
      alert('Error al editar la orden de compra. Por favor intenta de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que quieres aprobar esta orden de compra?')) return
    
    setActionLoading(`confirm-${orderId}`)
    try {
      await PurchaseOrdersService.approve(orderId)
      logAction('APPROVE', orderId, {
        previousStatus: rows.find(r => r.id === orderId)?.status
      })
      await load()
    } catch (e) {
      console.error('Failed to confirm purchase order:', e)
      alert('Error al aprobar la orden de compra. Por favor intenta de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('¿Por qué razón deseas cancelar esta orden? (opcional):')
    if (reason === null) return // User cancelled the prompt
    
    setActionLoading(`cancel-${orderId}`)
    try {
      await PurchaseOrdersService.cancel(orderId, reason || undefined)
      logAction('CANCEL', orderId, {
        reason: reason || 'No reason provided',
        previousStatus: rows.find(r => r.id === orderId)?.status
      })
      await load()
    } catch (e) {
      console.error('Failed to cancel purchase order:', e)
      alert('Error al cancelar la orden de compra. Por favor intenta de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  const companies = useMemo(() => {
    const set = new Map<string, string>()
    rows.forEach(r => {
      if (r.companyId) set.set(r.companyId, r.companyName || r.companyId)
    })
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }))
  }, [rows])

  const filtered = rows.filter(r => {
    const s = searchTerm.trim().toLowerCase()
    const matchesSearch = !s ||
      r.description?.toLowerCase().includes(s) ||
      r.vendorName?.toLowerCase().includes(s) ||
      (r.docNumber || '').toLowerCase().includes(s)
    const matchesCompany = selectedCompany === 'all' || r.companyId === selectedCompany
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus
    return matchesSearch && matchesCompany && matchesStatus
  })

  const totalAmount = filtered.reduce((sum, r) => sum + (Number(r.total) || 0), 0)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PAID': return 'Pagado'
      case 'APPROVED': return 'Aprobado'
      case 'PENDING': return 'Pendiente'
      case 'CANCELLED': return 'Cancelado'
      default: return status || '—'
    }
  }

  const handleSupplierCreated = (supplierData: any) => {
    // This would typically integrate with the backend to create the supplier
    // For now, we'll just show a success message
    console.log('New supplier created:', supplierData)
    setShowSupplierForm(false)
    
    // Show success toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out'
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white text-sm font-bold">✓</span>
        </div>
        <div>
          <div class="font-medium">Proveedor Creado</div>
          <div class="text-green-100 text-sm">${supplierData.name} agregado exitosamente</div>
        </div>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 10)
  }

  const handleProductCreated = (productData: any) => {
    // This would typically integrate with the backend to create the product
    console.log('New product created:', productData)
    setShowProductForm(false)
    
    // Show success toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out'
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white text-sm font-bold">✓</span>
        </div>
        <div>
          <div class="font-medium">Producto Creado</div>
          <div class="text-green-100 text-sm">${productData.name} agregado exitosamente</div>
        </div>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 10)
  }

  const handleExcelImportComplete = async (result: { processedPOs: any[]; createdProducts: any[] }) => {
    setShowExcelImport(false)
    
    // Show success toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out'
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white text-sm font-bold">✓</span>
        </div>
        <div>
          <div class="font-medium">Importación Completada</div>
          <div class="text-green-100 text-sm">${result.processedPOs.length} Órdenes y ${result.createdProducts.length} Productos importados</div>
        </div>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => toast.remove(), 300)
    }, 4000)
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 10)
    
    // Refresh the purchase orders list to show the newly imported data
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Órdenes de Compra</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compras que impactan inventario (por líneas de productos)</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowExcelImport(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Importar desde Excel
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Orden de Compra
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por descripción, proveedor o número de documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobado</option>
                <option value="PAID">Pagado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Período</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">${totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Con Inventario</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filtered.filter(f => f.hasInventoryLines).length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <PaperClipIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documentos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filtered.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Órdenes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor/Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Cargando…</td>
                    </tr>
                  ) : (
                    filtered.map((po) => (
                      <motion.tr key={po.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{po.docType}</span>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{po.docNumber || 'Sin número'}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{po.date.toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{po.vendorName || 'Sin proveedor'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {(() => {
                                const description = po.description || '';
                                const thirdPartyMatch = description.match(/\|\s*(FACTURA|BOLETA):\s*([^|]+)$/);
                                if (thirdPartyMatch) {
                                  const [, docType, docNumber] = thirdPartyMatch;
                                  const mainDescription = description.replace(thirdPartyMatch[0], '').trim();
                                  return (
                                    <div>
                                      <div>{mainDescription}</div>
                                      <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                                        📄 {docType}: {docNumber.trim()}
                                      </div>
                                    </div>
                                  );
                                }
                                return description;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">{po.companyName || po.companyId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${po.total.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>{getStatusLabel(po.status)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setViewingOrder(po)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {po.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => setEditingOrder(po)}
                                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title="Editar"
                                  disabled={actionLoading === `edit-${po.id}`}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleConfirmOrder(po.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Aprobar"
                                  disabled={actionLoading === `confirm-${po.id}`}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(po.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Cancelar"
                                  disabled={actionLoading === `cancel-${po.id}`}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {po.attachments > 0 && (
                              <div className="flex items-center text-blue-600 dark:text-blue-400">
                                <PaperClipIcon className="h-4 w-4 mr-1" />
                                <span className="text-xs">{po.attachments}</span>
                              </div>
                            )}
                            {po.hasInventoryLines && <div className="w-2 h-2 bg-green-500 rounded-full" title="Genera inventario" />}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {(!loading && filtered.length === 0) && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No se encontraron órdenes</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Intenta ajustar los filtros o crear una nueva orden.</p>
          </div>
        )}

        {/* Create/Edit Purchase Order Modal */}
        {(showCreateForm || editingOrder) && (
          <PurchaseOrderModal
            isOpen={showCreateForm || !!editingOrder}
            onClose={() => {
              setShowCreateForm(false)
              setEditingOrder(null)
            }}
            onSubmit={editingOrder ? handleEditOrder : handleCreateOrder}
            editingOrder={editingOrder}
            currentUser={currentUser}
            loading={actionLoading === 'create' || actionLoading?.startsWith('edit-')}
            existingOrders={rows}
            onOpenSupplierForm={() => setShowSupplierForm(true)}
            onOpenProductForm={() => setShowProductForm(true)}
          />
        )}

        {/* View Purchase Order Modal */}
        {viewingOrder && (
          <ViewPurchaseOrderModal
            isOpen={!!viewingOrder}
            onClose={() => setViewingOrder(null)}
            order={viewingOrder}
          />
        )}

        {/* Supplier Creation Modal */}
        {showSupplierForm && (
          <SupplierForm
            onClose={() => setShowSupplierForm(false)}
            onAdd={handleSupplierCreated}
          />
        )}

        {/* Product Creation Modal */}
        {showProductForm && (
          <CreateProductModal
            onClose={() => setShowProductForm(false)}
            onSuccess={handleProductCreated}
            categories={productCategories}
            onCategoriesUpdate={setProductCategories}
          />
        )}
        
        {/* Excel Import Modal */}
        {showExcelImport && (
          <ExcelImportModal
            isOpen={showExcelImport}
            onClose={() => setShowExcelImport(false)}
            onImportComplete={handleExcelImportComplete}
          />
        )}
      </div>
    </div>
  )
}

// Create/Edit Purchase Order Modal Component
const PurchaseOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PurchaseOrderFormData) => void
  editingOrder?: PurchaseOrderRow | null
  currentUser: UserInfo | null
  loading?: boolean
  existingOrders: PurchaseOrderRow[]
  onOpenSupplierForm: () => void
  onOpenProductForm: () => void
}> = ({ isOpen, onClose, onSubmit, editingOrder, currentUser, loading, existingOrders, onOpenSupplierForm, onOpenProductForm }) => {
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    // Main supplier fields
    mainSupplierId: '',
    mainSupplierName: editingOrder?.vendorName || '',
    
    // Legacy fields for backward compatibility
    vendorName: editingOrder?.vendorName || '',
    vendorId: '',
    
    docType: 'OC', // Always set to OC for purchase orders
    docNumber: editingOrder?.docNumber || '', // Will be set when modal opens
    thirdPartyDocType: 'NONE',
    thirdPartyDocNumber: '',
    date: editingOrder?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    description: editingOrder?.description || '',
    companyId: editingOrder?.companyId || 'default-company',
    receiptFile: undefined,
    
    // Sub-suppliers array
    subSuppliers: [],
    
    lines: editingOrder?.lines?.map(line => ({
      description: line.description || '',
      quantity: Number(line.quantity) || 1,
      unitCost: Number(line.unitCost) || 0,
      totalCost: Number(line.totalCost) || 0,
      shippingCostUnit: 0,
      isInventory: !!line.isInventory,
      productId: line.productId || undefined,
      productName: line.description || '',
      deliveredBy: 'MAIN' as const,
      subSupplierId: undefined,
      deliveryDate: '',
      trackingNumber: ''
    })) || [{
      description: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      shippingCostUnit: 0,
      isInventory: true,
      productName: '',
      deliveredBy: 'MAIN' as const,
      subSupplierId: undefined,
      deliveryDate: '',
      trackingNumber: ''
    }]
  })

  // State for search functionality
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [productSearches, setProductSearches] = useState<{ [key: number]: string }>({})
  const [showProductDropdowns, setShowProductDropdowns] = useState<{ [key: number]: boolean }>({})
  
  // Sub-supplier search states
  const [subSupplierSearches, setSubSupplierSearches] = useState<{ [key: number]: string }>({})
  const [showSubSupplierDropdowns, setShowSubSupplierDropdowns] = useState<{ [key: number]: boolean }>({})
  const [showSubSuppliersSection, setShowSubSuppliersSection] = useState(false)

  // Generate PO number when modal opens for new orders
  React.useEffect(() => {
    if (isOpen && !editingOrder) {
      const generatedPONumber = generatePONumber(existingOrders)
      setFormData(prev => ({ ...prev, docNumber: generatedPONumber }))
    }
  }, [isOpen, editingOrder, existingOrders])

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const mockSuppliers: Supplier[] = [
      { id: '1', name: 'Proveedor ABC S.A.', vendorType: 'PROVEEDOR_REGULAR', email: 'contacto@abc.cl', phone: '+56912345678', rut: '12345678-9', taxId: '12345678-9', isActive: true },
      { id: '2', name: 'Distribuidora XYZ Ltda.', vendorType: 'AGENTE', email: 'ventas@xyz.cl', phone: '+56987654321', rut: '87654321-0', taxId: '87654321-0', isActive: true },
      { id: '3', name: 'Café Premium Import', vendorType: 'EMPRENDEDOR', email: 'info@cafeimport.cl', phone: '+56956789123', rut: '11223344-5', taxId: '11223344-5', isActive: true }
    ]
    
    const mockProducts: Product[] = [
      { 
        id: '1', 
        sku: 'CF-001', 
        name: 'Café Arábica Premium', 
        type: 'PURCHASED', 
        unitCost: 8500, 
        uom: 'kg', 
        category: 'Café', 
        isActive: true,
        brand: { id: 'b1', name: 'Café Premium', contactName: 'Juan Pérez', email: 'juan@cafepremium.cl', phone: '+56912345678', isContact: true }
      },
      { 
        id: '2', 
        sku: 'MILK-001', 
        name: 'Leche Entera', 
        type: 'PURCHASED', 
        unitCost: 950, 
        uom: 'L', 
        category: 'Lácteos', 
        isActive: true,
        brandName: 'Colun' // Simple text field
      },
      { 
        id: '3', 
        sku: 'SUG-001', 
        name: 'Azúcar Blanca', 
        type: 'PURCHASED', 
        unitCost: 850, 
        uom: 'kg', 
        category: 'Endulzantes', 
        isActive: true,
        brand: { id: 'b2', name: 'Iansa', isContact: false }
      }
    ]
    
    setSuppliers(mockSuppliers)
    setProducts(mockProducts)
  }, [])

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setShowSupplierDropdown(false)
        setShowProductDropdowns({})
        setShowSubSupplierDropdowns({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper functions for search and selection
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.rut?.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  const getFilteredProducts = (searchTerm: string) => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData(prev => ({ 
      ...prev, 
      vendorName: supplier.name, 
      vendorId: supplier.id,
      mainSupplierName: supplier.name,
      mainSupplierId: supplier.id
    }))
    setSupplierSearch(supplier.name)
    setShowSupplierDropdown(false)
  }

  const handleSubSupplierSelect = (subSupplierIndex: number, supplier: Supplier) => {
    const newSubSuppliers = [...formData.subSuppliers]
    newSubSuppliers[subSupplierIndex] = {
      ...newSubSuppliers[subSupplierIndex],
      supplierId: supplier.id,
      supplierName: supplier.name
    }
    setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
    setSubSupplierSearches(prev => ({ ...prev, [subSupplierIndex]: supplier.name }))
    setShowSubSupplierDropdowns(prev => ({ ...prev, [subSupplierIndex]: false }))
  }

  const getFilteredSubSuppliers = (searchTerm: string) => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getSupplierTypeLabel = (vendorType: string) => {
    switch (vendorType) {
      case 'AGENTE': return 'Agente'
      case 'PROVEEDOR_REGULAR': return 'Proveedor Regular'
      case 'EMPRENDEDOR': return 'Emprendedor'
      default: return vendorType
    }
  }

  const getBrandDisplay = (product: Product) => {
    if (product.brand) {
      return product.brand.isContact 
        ? `${product.brand.name} (${product.brand.contactName})`
        : product.brand.name
    }
    return product.brandName || 'Sin marca'
  }

  const handleProductSelect = (lineIndex: number, product: Product) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, index) => 
        index === lineIndex 
          ? { 
              ...line, 
              productId: product.id, 
              productName: product.name,
              description: product.name,
              unitCost: product.unitCost || line.unitCost,
              totalCost: line.quantity * (product.unitCost || line.unitCost)
            }
          : line
      )
    }))
    setProductSearches(prev => ({ ...prev, [lineIndex]: product.name }))
    setShowProductDropdowns(prev => ({ ...prev, [lineIndex]: false }))
  }

  const openSupplierCreationToast = () => {
    onOpenSupplierForm()
    setShowSupplierDropdown(false)
  }

  const openProductCreationToast = () => {
    onOpenProductForm()
  }


  const updateLineTotal = (index: number) => {
    const line = formData.lines[index]
    const totalCost = line.quantity * line.unitCost
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, totalCost } : l)
    }))
  }

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        description: '',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        shippingCostUnit: 0,
        isInventory: true,
        productName: '',
        deliveredBy: 'MAIN' as const,
        subSupplierId: undefined,
        deliveryDate: '',
        trackingNumber: ''
      }]
    }))
  }

  const removeLine = (index: number) => {
    if (formData.lines.length > 1) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  const totalAmount = formData.lines.reduce((sum, line) => sum + line.totalCost, 0)
  
  // Calculate shipping cost proration
  const calculateShippingCosts = () => {
    const mainSupplierLines = formData.lines.filter(line => line.deliveredBy === 'MAIN')
    const subSupplierLines = formData.lines.filter(line => line.deliveredBy === 'SUB')
    
    const mainSupplierTotal = mainSupplierLines.reduce((sum, line) => sum + line.totalCost, 0)
    const subSupplierShipping = subSupplierLines.reduce((sum, line) => sum + (line.shippingCostUnit || 0) * line.quantity, 0)
    const totalShipping = formData.subSuppliers.reduce((sum, sub) => sum + (sub.shippingCost || 0), 0) + subSupplierShipping
    
    return {
      mainSupplierTotal,
      subSupplierShipping,
      totalShipping,
      grandTotal: totalAmount + totalShipping
    }
  }
  
  const shippingCosts = calculateShippingCosts()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white bg-opacity-95 dark:bg-gray-800 dark:bg-opacity-95 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white bg-opacity-95 dark:bg-gray-800 dark:bg-opacity-95 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                    {editingOrder ? 'Editar Orden de Compra' : 'Crear Orden de Compra'}
                  </h3>
                  
                  {/* Info Panel */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">i</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Búsqueda inteligente:</strong> Busca proveedores y productos existentes escribiendo su nombre o SKU. 
                          Si no existen, puedes crearlos directamente desde los enlaces o botones disponibles.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Supplier Selection */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      🏢 Proveedor Principal (Facturador)
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      El proveedor principal es quien emite la factura y es responsable del pago.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="relative md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Proveedor Principal *
                        </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            required
                            value={supplierSearch || formData.vendorName}
                            onChange={(e) => {
                              setSupplierSearch(e.target.value)
                              setFormData(prev => ({ 
                                ...prev, 
                                vendorName: e.target.value, 
                                vendorId: '',
                                mainSupplierName: e.target.value,
                                mainSupplierId: ''
                              }))
                              setShowSupplierDropdown(true)
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Buscar proveedor..."
                          />
                          
                          {showSupplierDropdown && (supplierSearch || formData.vendorName) && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredSuppliers.length > 0 ? (
                                filteredSuppliers.map(supplier => (
                                  <div
                                    key={supplier.id}
                                    onClick={() => handleSupplierSelect(supplier)}
                                    className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                                        {getSupplierTypeLabel(supplier.vendorType)}
                                      </span>
                                      {supplier.rut} • {supplier.email}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                  No se encontraron proveedores
                                </div>
                              )}
                              <div 
                                onClick={openSupplierCreationToast}
                                className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer text-blue-600 dark:text-blue-400 font-medium"
                              >
                                + Crear nuevo proveedor
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={openSupplierCreationToast}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                          title="Crear nuevo proveedor"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Display selected main supplier info */}
                      {formData.mainSupplierId && (
                        <div className="md:col-span-3 mt-2">
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              ✓ Proveedor seleccionado: <strong>{formData.mainSupplierName}</strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sub-suppliers Toggle */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setShowSubSuppliersSection(!showSubSuppliersSection)}
                      className="w-full flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🚚</span>
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                            Sub-proveedores (Entrega Opcional)
                          </h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Configura proveedores adicionales para entrega de productos específicos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.subSuppliers.length > 0 && (
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                            {formData.subSuppliers.length}
                          </span>
                        )}
                        <motion.div
                          animate={{ rotate: showSubSuppliersSection ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </button>
                  </div>

                  {/* Sub-suppliers Section */}
                  <AnimatePresence>
                    {showSubSuppliersSection && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800 mb-6 overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-medium text-orange-900 dark:text-orange-100">
                            Gestión de Sub-proveedores
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                subSuppliers: [...prev.subSuppliers, {
                                  supplierId: '',
                                  supplierName: '',
                                  shippingCost: 0,
                                  expectedDelivery: '',
                                  trackingNumber: '',
                                  notes: ''
                                }]
                              }))
                            }}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm flex items-center gap-2"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Agregar Sub-proveedor
                          </button>
                        </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                      Los sub-proveedores se encargan de la entrega de productos específicos. Opcional si el proveedor principal entrega todo.
                    </p>
                    
                    {formData.subSuppliers.length > 0 ? (
                      <div className="space-y-4">
                        {formData.subSuppliers.map((subSupplier, index) => (
                          <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Sub-proveedor #{index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    subSuppliers: prev.subSuppliers.filter((_, i) => i !== index)
                                  }))
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Sub-proveedor *
                                </label>
                                <div className="flex gap-2">
                                  <div className="flex-1 relative">
                                    <input
                                      type="text"
                                      value={subSupplierSearches[index] || subSupplier.supplierName}
                                      onChange={(e) => {
                                        setSubSupplierSearches(prev => ({ ...prev, [index]: e.target.value }))
                                        const newSubSuppliers = [...formData.subSuppliers]
                                        newSubSuppliers[index] = { 
                                          ...subSupplier, 
                                          supplierName: e.target.value,
                                          supplierId: ''
                                        }
                                        setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                        setShowSubSupplierDropdowns(prev => ({ ...prev, [index]: true }))
                                      }}
                                      onFocus={() => setShowSubSupplierDropdowns(prev => ({ ...prev, [index]: true }))}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="Buscar sub-proveedor..."
                                    />
                                    
                                    {showSubSupplierDropdowns[index] && (subSupplierSearches[index] || subSupplier.supplierName) && (
                                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {getFilteredSubSuppliers(subSupplierSearches[index] || subSupplier.supplierName).length > 0 ? (
                                          getFilteredSubSuppliers(subSupplierSearches[index] || subSupplier.supplierName).map(supplier => (
                                            <div
                                              key={supplier.id}
                                              onClick={() => handleSubSupplierSelect(index, supplier)}
                                              className="px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/50 cursor-pointer transition-colors"
                                            >
                                              <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 mr-2">
                                                  {getSupplierTypeLabel(supplier.vendorType)}
                                                </span>
                                                {supplier.rut} • {supplier.email}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                            No se encontraron sub-proveedores
                                          </div>
                                        )}
                                        <div 
                                          onClick={openSupplierCreationToast}
                                          className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900 cursor-pointer text-orange-600 dark:text-orange-400 font-medium"
                                        >
                                          + Crear nuevo sub-proveedor
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={openSupplierCreationToast}
                                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm"
                                    title="Crear nuevo sub-proveedor"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                {/* Display selected sub-supplier info */}
                                {subSupplier.supplierId && (
                                  <div className="mt-2">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                      <p className="text-xs text-green-800 dark:text-green-200">
                                        ✓ Sub-proveedor: <strong>{subSupplier.supplierName}</strong>
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Costo de Envío
                                </label>
                                <input
                                  type="number"
                                  value={subSupplier.shippingCost || ''}
                                  onChange={(e) => {
                                    const newSubSuppliers = [...formData.subSuppliers]
                                    newSubSuppliers[index] = { ...subSupplier, shippingCost: Number(e.target.value) }
                                    setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="0"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Entrega Esperada
                                </label>
                                <input
                                  type="date"
                                  value={subSupplier.expectedDelivery || ''}
                                  onChange={(e) => {
                                    const newSubSuppliers = [...formData.subSuppliers]
                                    newSubSuppliers[index] = { ...subSupplier, expectedDelivery: e.target.value }
                                    setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Número de Seguimiento
                                </label>
                                <input
                                  type="text"
                                  value={subSupplier.trackingNumber || ''}
                                  onChange={(e) => {
                                    const newSubSuppliers = [...formData.subSuppliers]
                                    newSubSuppliers[index] = { ...subSupplier, trackingNumber: e.target.value }
                                    setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="Número de tracking..."
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notas
                              </label>
                              <textarea
                                value={subSupplier.notes || ''}
                                onChange={(e) => {
                                  const newSubSuppliers = [...formData.subSuppliers]
                                  newSubSuppliers[index] = { ...subSupplier, notes: e.target.value }
                                  setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Notas adicionales sobre este sub-proveedor..."
                              />
                            </div>
                            
                            {/* Shared shipping option */}
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={subSupplier.allowSharedShipping || false}
                                  onChange={(e) => {
                                    const newSubSuppliers = [...formData.subSuppliers]
                                    newSubSuppliers[index] = { 
                                      ...subSupplier, 
                                      allowSharedShipping: e.target.checked 
                                    }
                                    setFormData(prev => ({ ...prev, subSuppliers: newSubSuppliers }))
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                                />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Envío compartido:</strong> Permitir que el proveedor principal entregue productos de este sub-proveedor con costo prorrateado
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                          No hay sub-proveedores configurados
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          El proveedor principal se encargará de toda la entrega
                        </p>
                      </div>
                    )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número Interno
                      </label>
                      <input
                        type="text"
                        value={formData.docNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, docNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                        placeholder="OC-2025-08-001"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Entrega Esperada
                      </label>
                      <input
                        type="date"
                        value={formData.expectedDelivery || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Descripción opcional de la orden"
                    />
                  </div>

                  {/* Third-party Document Section */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      📄 Documento del Proveedor (Opcional)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Documento
                        </label>
                        <select
                          value={formData.thirdPartyDocType}
                          onChange={(e) => setFormData(prev => ({ ...prev, thirdPartyDocType: e.target.value as 'FACTURA' | 'BOLETA' | 'NONE' }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="NONE">Sin documento</option>
                          <option value="FACTURA">Factura</option>
                          <option value="BOLETA">Boleta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número del Documento
                        </label>
                        <input
                          type="text"
                          value={formData.thirdPartyDocNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, thirdPartyDocNumber: e.target.value }))}
                          disabled={formData.thirdPartyDocType === 'NONE'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:text-gray-500"
                          placeholder="Ej: 12345 o A-001234"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📎 Subir Recibo/Factura (PDF o Foto)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setFormData(prev => ({ ...prev, receiptFile: file }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300"
                      />
                      {formData.receiptFile && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          ✅ Archivo seleccionado: {formData.receiptFile.name} ({(formData.receiptFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Line Items */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Líneas de Productos</h4>
                      <button
                        type="button"
                        onClick={addLine}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Agregar Línea
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {formData.lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-14 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="col-span-4 relative">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Producto *
                            </label>
                            <div className="flex gap-1">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  required
                                  value={productSearches[index] || line.productName || line.description}
                                  onChange={(e) => {
                                    setProductSearches(prev => ({ ...prev, [index]: e.target.value }))
                                    setFormData(prev => ({
                                      ...prev,
                                      lines: prev.lines.map((l, i) => i === index ? { ...l, description: e.target.value, productName: e.target.value } : l)
                                    }))
                                    setShowProductDropdowns(prev => ({ ...prev, [index]: true }))
                                  }}
                                  onFocus={() => setShowProductDropdowns(prev => ({ ...prev, [index]: true }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                  placeholder="Buscar producto..."
                                />
                                
                                {showProductDropdowns[index] && (productSearches[index] || line.productName || line.description) && (
                                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-auto">
                                    {getFilteredProducts(productSearches[index] || line.productName || line.description).length > 0 ? (
                                      getFilteredProducts(productSearches[index] || line.productName || line.description).map(product => (
                                        <div
                                          key={product.id}
                                          onClick={() => handleProductSelect(index, product)}
                                          className="px-2 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                                        >
                                          <div className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 mr-1">
                                              {getBrandDisplay(product)}
                                            </span>
                                            {product.sku} • ${product.unitCost?.toLocaleString()} / {product.uom}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-2 py-2 text-gray-500 dark:text-gray-400 text-sm">
                                        No se encontraron productos
                                      </div>
                                    )}
                                    <div 
                                      onClick={openProductCreationToast}
                                      className="px-2 py-2 border-t border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer text-blue-600 dark:text-blue-400 font-medium text-sm"
                                    >
                                      + Crear nuevo producto
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={openProductCreationToast}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                title="Crear nuevo producto"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { ...l, quantity: Number(e.target.value) } : l)
                                }))
                                setTimeout(() => updateLineTotal(index), 0)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Precio Unit. *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { ...l, unitCost: Number(e.target.value) } : l)
                                }))
                                setTimeout(() => updateLineTotal(index), 0)
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Total
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={line.totalCost.toFixed(2)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
                            />
                          </div>
                          
                          {/* Delivery Assignment */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Entregado por
                            </label>
                            <select
                              value={line.deliveredBy}
                              onChange={(e) => {
                                const deliveredBy = e.target.value as 'MAIN' | 'SUB'
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { 
                                    ...l, 
                                    deliveredBy,
                                    subSupplierId: deliveredBy === 'MAIN' ? undefined : l.subSupplierId,
                                    shippingCostUnit: deliveredBy === 'MAIN' ? 0 : l.shippingCostUnit
                                  } : l)
                                }))
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            >
                              <option value="MAIN">Proveedor Principal</option>
                              <option value="SUB" disabled={formData.subSuppliers.length === 0}>
                                Sub-proveedor {formData.subSuppliers.length === 0 ? '(Ninguno configurado)' : ''}
                              </option>
                            </select>
                            
                            {/* Sub-supplier selection when SUB is selected */}
                            {line.deliveredBy === 'SUB' && formData.subSuppliers.length > 0 && (
                              <select
                                value={line.subSupplierId || ''}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    lines: prev.lines.map((l, i) => i === index ? { 
                                      ...l, 
                                      subSupplierId: e.target.value
                                    } : l)
                                  }))
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-600 dark:text-white mt-1"
                              >
                                <option value="">Seleccionar sub-proveedor...</option>
                                {formData.subSuppliers.map((subSupplier, subIndex) => (
                                  <option key={subIndex} value={subSupplier.supplierId}>
                                    {subSupplier.supplierName || `Sub-proveedor #${subIndex + 1}`}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          
                          {/* Shipping Cost Unit (only for sub-suppliers) */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Envío/Unidad
                            </label>
                            <input
                              type="number"
                              value={line.shippingCostUnit || ''}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { 
                                    ...l, 
                                    shippingCostUnit: Number(e.target.value) || 0
                                  } : l)
                                }))
                              }}
                              disabled={line.deliveredBy === 'MAIN'}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                              placeholder="0"
                              title={line.deliveredBy === 'MAIN' ? 'Solo para sub-proveedores' : 'Costo de envío prorrateado por unidad'}
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Inventario
                            </label>
                            <input
                              type="checkbox"
                              checked={line.isInventory}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { ...l, isInventory: e.target.checked } : l)
                                }))
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                            />
                          </div>
                          
                          <div className="col-span-1 flex items-end">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              disabled={formData.lines.length <= 1}
                              className="w-full px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded"
                              title="Eliminar línea"
                            >
                              <XMarkIcon className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Shipping Cost Summary */}
                    {(formData.subSuppliers.length > 0 || shippingCosts.subSupplierShipping > 0) && (
                      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-3">
                          📦 Resumen de Costos de Envío
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Productos (Proveedor Principal):</span>
                            <span className="font-medium">${shippingCosts.mainSupplierTotal.toLocaleString()}</span>
                          </div>
                          {shippingCosts.subSupplierShipping > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Envío Sub-proveedores:</span>
                              <span className="font-medium text-orange-600">${shippingCosts.subSupplierShipping.toLocaleString()}</span>
                            </div>
                          )}
                          {formData.subSuppliers.some(sub => (sub.shippingCost || 0) > 0) && (
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Envío Base Sub-proveedores:</span>
                              <span className="font-medium text-orange-600">
                                ${formData.subSuppliers.reduce((sum, sub) => sum + (sub.shippingCost || 0), 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-orange-200 dark:border-orange-700 pt-2 flex justify-between font-semibold">
                            <span className="text-gray-900 dark:text-white">Total con Envío:</span>
                            <span className="text-orange-600 dark:text-orange-400">${shippingCosts.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 text-right">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          Subtotal: ${totalAmount.toLocaleString()} CLP
                        </div>
                        {shippingCosts.totalShipping > 0 && (
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            + Envío: ${shippingCosts.totalShipping.toLocaleString()} CLP
                          </div>
                        )}
                        <div className="text-xl font-bold text-gray-900 dark:text-white border-t pt-2">
                          Total: ${shippingCosts.grandTotal.toLocaleString()} CLP
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Tracking Info */}
                  {currentUser && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Creado por:</strong> {currentUser.fullName} ({currentUser.email})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 bg-opacity-95 dark:bg-gray-700 dark:bg-opacity-95 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (editingOrder ? 'Actualizar' : 'Crear Orden')}
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

// View Purchase Order Modal Component
const ViewPurchaseOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrderRow
}> = ({ isOpen, onClose, order }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                  Detalles de Orden de Compra
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proveedor
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.vendorName || 'Sin proveedor'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Documento
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.docType} {order.docNumber || 'Sin número'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.date.toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${[
                      order.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      order.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    ][0]}`}>
                      {[
                        order.status === 'PAID' ? 'Pagado' :
                        order.status === 'APPROVED' ? 'Aprobado' :
                        order.status === 'PENDING' ? 'Pendiente' :
                        order.status === 'CANCELLED' ? 'Cancelado' :
                        order.status || '—'
                      ][0]}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">${order.total.toLocaleString()} {order.currency}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Empresa
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.companyName || order.companyId}</p>
                  </div>
                  
                  {/* Third-party Document Information */}
                  {(() => {
                    const description = order.description || '';
                    const thirdPartyMatch = description.match(/\|\s*(FACTURA|BOLETA):\s*([^|]+)$/);
                    if (thirdPartyMatch) {
                      const [, docType, docNumber] = thirdPartyMatch;
                      return (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            📄 Documento del Proveedor
                          </label>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                            <p className="text-gray-900 dark:text-white font-mono">
                              {docType}: {docNumber.trim()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* File Attachments */}
                  {order.attachments && order.attachments > 0 && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📎 Archivos Adjuntos ({order.attachments})
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.attachments} archivo{order.attachments > 1 ? 's' : ''} adjunto{order.attachments > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {order.description && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <p className="text-gray-900 dark:text-white">{order.description}</p>
                  </div>
                )}
                
                {/* Line Items */}
                {order.lines && order.lines.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Líneas de Productos</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Unit.</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inventario</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {order.lines.map((line, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{line.description || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{line.quantity || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">${Number(line.unitCost || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">${Number(line.totalCost || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                {line.isInventory ? (
                                  <span className="text-green-600 dark:text-green-400">✓ Sí</span>
                                ) : (
                                  <span className="text-gray-400">— No</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Tracking Information */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Información de Seguimiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {order.createdBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Creado por
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.createdBy}</p>
                      </div>
                    )}
                    {order.approvedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Aprobado por
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.approvedBy}</p>
                      </div>
                    )}
                    {order.createdAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de creación
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.createdAt.toLocaleString()}</p>
                      </div>
                    )}
                    {order.updatedAt && order.updatedAt.getTime() !== order.createdAt?.getTime() && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Última actualización
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.updatedAt.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Activity Log */}
                  <ActivityLog orderId={order.id} />
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

// Activity Log Component
const ActivityLog: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    try {
      const allLogs = JSON.parse(localStorage.getItem('purchase_order_logs') || '[]')
      const orderLogs = allLogs.filter((log: any) => log.orderId === orderId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10) // Show last 10 activities
      setLogs(orderLogs)
    } catch (e) {
      console.error('Failed to load activity logs:', e)
    }
  }, [orderId])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '✅'
      case 'UPDATE': return '✏️'
      case 'APPROVE': return '👍'
      case 'CANCEL': return '❌'
      default: return '📝'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Orden creada'
      case 'UPDATE': return 'Orden actualizada'
      case 'APPROVE': return 'Orden aprobada'
      case 'CANCEL': return 'Orden cancelada'
      default: return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 dark:text-green-400'
      case 'UPDATE': return 'text-blue-600 dark:text-blue-400'
      case 'APPROVE': return 'text-green-600 dark:text-green-400'
      case 'CANCEL': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (logs.length === 0) {
    return (
      <div>
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actividad Reciente</h5>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay actividad registrada para esta orden.</p>
      </div>
    )
  }

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Actividad Reciente</h5>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm">{getActionIcon(log.action)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                  {getActionLabel(log.action)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Por: {log.user}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {log.details.reason && (
                    <span>Motivo: {log.details.reason}</span>
                  )}
                  {log.details.vendor && (
                    <span>Proveedor: {log.details.vendor}</span>
                  )}
                  {log.details.total && (
                    <span> • Total: ${Number(log.details.total).toLocaleString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PurchaseOrders
