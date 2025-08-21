import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentTextIcon, PaperClipIcon, BanknotesIcon, BuildingOfficeIcon, PlusIcon, PencilIcon, CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
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

interface PurchaseOrderFormData {
  vendorName: string
  docType: string
  docNumber?: string
  date: string
  description?: string
  companyId: string
  lines: {
    description: string
    quantity: number
    unitCost: number
    totalCost: number
    isInventory: boolean
    productId?: string
  }[]
}

interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
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
    setCurrentUser(getCurrentUser())
  }, [])

  const handleCreateOrder = async (formData: PurchaseOrderFormData) => {
    setActionLoading('create')
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
        status: 'PENDING',
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
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{po.description}</div>
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
  loading: boolean
}> = ({ isOpen, onClose, onSubmit, editingOrder, currentUser, loading }) => {
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    vendorName: editingOrder?.vendorName || '',
    docType: editingOrder?.docType || 'OC',
    docNumber: editingOrder?.docNumber || '',
    date: editingOrder?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    description: editingOrder?.description || '',
    companyId: editingOrder?.companyId || 'default-company',
    lines: editingOrder?.lines?.map(line => ({
      description: line.description || '',
      quantity: Number(line.quantity) || 1,
      unitCost: Number(line.unitCost) || 0,
      totalCost: Number(line.totalCost) || 0,
      isInventory: !!line.isInventory,
      productId: line.productId || undefined
    })) || [{
      description: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      isInventory: true
    }]
  })

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
        isInventory: true
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
                    {editingOrder ? 'Editar Orden de Compra' : 'Crear Orden de Compra'}
                  </h3>
                  
                  {/* Header Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Proveedor *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Documento *
                      </label>
                      <select
                        required
                        value={formData.docType}
                        onChange={(e) => setFormData(prev => ({ ...prev, docType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="OC">Orden de Compra</option>
                        <option value="Factura">Factura</option>
                        <option value="Boleta">Boleta</option>
                        <option value="Guía">Guía de Despacho</option>
                        <option value="Nota">Nota de Crédito</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número de Documento
                      </label>
                      <input
                        type="text"
                        value={formData.docNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, docNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: OC-2025-001"
                      />
                    </div>
                    
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
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Descripción *
                            </label>
                            <input
                              type="text"
                              required
                              value={line.description}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) => i === index ? { ...l, description: e.target.value } : l)
                                }))
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                              placeholder="Descripción del producto"
                            />
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
                              Precio Unitario *
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
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          
                          <div className="col-span-2">
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
                          
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              disabled={formData.lines.length === 1}
                              className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Eliminar línea"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 text-right">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Total: ${totalAmount.toLocaleString()} CLP
                      </span>
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
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
