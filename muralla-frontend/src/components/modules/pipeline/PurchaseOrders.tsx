import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentTextIcon, PaperClipIcon, BanknotesIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { PurchaseOrdersService } from '../../../services/purchaseOrdersService'
import type { CostDTO } from '../../../services/purchaseOrdersService'

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
}

const PurchaseOrders: React.FC = () => {
  const [rows, setRows] = useState<PurchaseOrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

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
  }, [])

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
              {/* Future actions: Create PO, Import, etc. */}
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
      </div>
    </div>
  )
}

export default PurchaseOrders
