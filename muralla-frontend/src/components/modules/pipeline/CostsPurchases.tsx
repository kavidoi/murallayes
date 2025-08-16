import React, { useState, useEffect } from 'react'
import { PlusIcon, DocumentTextIcon, PaperClipIcon, LinkIcon, BanknotesIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface Cost {
  id: string
  companyId: string
  companyName: string
  categoryId?: string
  categoryName?: string
  vendorId?: string
  vendorName?: string
  docType: 'FACTURA' | 'BOLETA' | 'RECIBO' | 'OTRO'
  docNumber?: string
  date: Date
  total: number
  currency: string
  payerType: 'COMPANY' | 'STAFF'
  payerName: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  reimbursementStatus?: 'PENDING' | 'APPROVED' | 'PAID'
  attachments: number
  hasInventoryLines: boolean
  linkedTransactions: number
}

const CostsPurchases: React.FC = () => {
  const [costs, setCosts] = useState<Cost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPayerType, setSelectedPayerType] = useState<string>('all')
  const [, setShowCreateModal] = useState(false)

  // Mock data
  useEffect(() => {
    const mockCosts: Cost[] = [
      {
        id: '1',
        companyId: '1',
        companyName: 'Muralla Spa',
        categoryId: '1',
        categoryName: 'Materias Primas',
        vendorId: '1',
        vendorName: 'Café Premium Ltda',
        docType: 'FACTURA',
        docNumber: 'F-001234',
        date: new Date('2024-01-15'),
        total: 425000,
        currency: 'CLP',
        payerType: 'COMPANY',
        payerName: 'Muralla Spa',
        description: 'Compra café arábica premium 50kg',
        status: 'PAID',
        attachments: 2,
        hasInventoryLines: true,
        linkedTransactions: 1
      },
      {
        id: '2',
        companyId: '2',
        companyName: 'Murallita MEF',
        categoryId: '2',
        categoryName: 'Servicios',
        docType: 'BOLETA',
        docNumber: 'B-005678',
        date: new Date('2024-01-14'),
        total: 45000,
        currency: 'CLP',
        payerType: 'STAFF',
        payerName: 'Juan Pérez',
        description: 'Servicio técnico máquina espresso',
        status: 'APPROVED',
        reimbursementStatus: 'PENDING',
        attachments: 1,
        hasInventoryLines: false,
        linkedTransactions: 0
      },
      {
        id: '3',
        companyId: '1',
        companyName: 'Muralla Spa',
        categoryId: '3',
        categoryName: 'Inmueble',
        docType: 'FACTURA',
        docNumber: 'F-002345',
        date: new Date('2024-01-13'),
        total: 850000,
        currency: 'CLP',
        payerType: 'COMPANY',
        payerName: 'Muralla Spa',
        description: 'Arriendo local enero 2024',
        status: 'PENDING',
        attachments: 1,
        hasInventoryLines: false,
        linkedTransactions: 0
      }
    ]
    setCosts(mockCosts)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagado'
      case 'APPROVED': return 'Aprobado'
      case 'PENDING': return 'Pendiente'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'FACTURA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'BOLETA': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'RECIBO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'OTRO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const filteredCosts = costs.filter(cost => {
    const matchesSearch = cost.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cost.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cost.docNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCompany = selectedCompany === 'all' || cost.companyId === selectedCompany
    const matchesStatus = selectedStatus === 'all' || cost.status === selectedStatus
    const matchesPayerType = selectedPayerType === 'all' || cost.payerType === selectedPayerType
    return matchesSearch && matchesCompany && matchesStatus && matchesPayerType
  })

  const totalAmount = filteredCosts.reduce((sum, cost) => sum + cost.total, 0)
  const pendingReimbursements = costs.filter(cost => cost.reimbursementStatus === 'PENDING').length
  const unlinkedTransactions = costs.filter(cost => cost.linkedTransactions === 0).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Costos y Compras
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestión unificada de gastos, compras e inventario
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                <LinkIcon className="h-4 w-4 mr-2" />
                Vincular Transacción
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Costo
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
                <option value="1">Muralla Spa</option>
                <option value="2">Murallita MEF</option>
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
              <select
                value={selectedPayerType}
                onChange={(e) => setSelectedPayerType(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los pagadores</option>
                <option value="COMPANY">Empresa</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Período</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalAmount.toLocaleString()}
                </p>
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
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <UserIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reembolsos Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{pendingReimbursements}</p>
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
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <LinkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin Vincular</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{unlinkedTransactions}</p>
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
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documentos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredCosts.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Costs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registro de Costos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor/Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pagador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredCosts.map((cost) => (
                    <motion.tr
                      key={cost.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDocTypeColor(cost.docType)}`}>
                              {cost.docType}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {cost.docNumber || 'Sin número'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {cost.date.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cost.vendorName || 'Sin proveedor'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {cost.description}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {cost.categoryName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {cost.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {cost.payerType === 'COMPANY' ? (
                            <BuildingOfficeIcon className="h-4 w-4 text-blue-500 mr-2" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-green-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {cost.payerName}
                            </div>
                            {cost.reimbursementStatus && (
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Reembolso {cost.reimbursementStatus.toLowerCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${cost.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cost.status)}`}>
                          {getStatusLabel(cost.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          {cost.attachments > 0 && (
                            <div className="flex items-center text-blue-600 dark:text-blue-400">
                              <PaperClipIcon className="h-4 w-4 mr-1" />
                              <span className="text-xs">{cost.attachments}</span>
                            </div>
                          )}
                          {cost.hasInventoryLines && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Genera inventario" />
                          )}
                          {cost.linkedTransactions > 0 && (
                            <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                              <LinkIcon className="h-4 w-4 mr-1" />
                              <span className="text-xs">{cost.linkedTransactions}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {filteredCosts.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron costos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o crear un nuevo costo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CostsPurchases
