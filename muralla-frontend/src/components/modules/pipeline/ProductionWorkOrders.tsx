import React, { useState, useEffect } from 'react'
import { PlusIcon, PlayIcon, CheckIcon, ClockIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkOrder {
  id: string
  productId: string
  productName: string
  productSku: string
  locationName: string
  qtyPlanned: number
  qtyProduced?: number
  qtyScrap?: number
  lotCode?: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  plannedCost?: number
  actualCost?: number
  yieldPercent?: number
  startedAt?: Date
  finishedAt?: Date
  dueDate?: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?: string
  bomComponents: number
  notes?: string
}

interface ComponentConsumption {
  id: string
  componentName: string
  componentSku: string
  qtyPlanned: number
  qtyConsumed?: number
  unitCost: number
  totalCost: number
  status: 'pending' | 'consumed' | 'shortage'
}

const ProductionWorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [, setComponents] = useState<ComponentConsumption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [, setShowCreateModal] = useState(false)
  const [, setShowDetailsModal] = useState(false)

  // Mock data
  useEffect(() => {
    const mockWorkOrders: WorkOrder[] = [
      {
        id: '1',
        productId: '1',
        productName: 'Espresso Muralla',
        productSku: 'ESP-001',
        locationName: 'Producción',
        qtyPlanned: 50,
        qtyProduced: 48,
        qtyScrap: 2,
        lotCode: 'LOT-2024-001',
        status: 'COMPLETED',
        plannedCost: 480000,
        actualCost: 495000,
        yieldPercent: 96,
        startedAt: new Date('2024-01-15T08:00:00'),
        finishedAt: new Date('2024-01-15T16:30:00'),
        dueDate: new Date('2024-01-16'),
        priority: 'HIGH',
        assignedTo: 'Carlos López',
        bomComponents: 3,
        notes: 'Lote especial para evento corporativo'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Blend Casa',
        productSku: 'BLD-001',
        locationName: 'Producción',
        qtyPlanned: 100,
        qtyProduced: 75,
        lotCode: 'LOT-2024-002',
        status: 'IN_PROGRESS',
        plannedCost: 850000,
        actualCost: 640000,
        yieldPercent: 75,
        startedAt: new Date('2024-01-16T09:00:00'),
        dueDate: new Date('2024-01-17'),
        priority: 'MEDIUM',
        assignedTo: 'María García',
        bomComponents: 4,
        notes: 'Producción regular semanal'
      },
      {
        id: '3',
        productId: '3',
        productName: 'Café Descafeinado',
        productSku: 'DEC-001',
        locationName: 'Producción',
        qtyPlanned: 25,
        status: 'PLANNED',
        plannedCost: 275000,
        dueDate: new Date('2024-01-18'),
        priority: 'LOW',
        assignedTo: 'Juan Pérez',
        bomComponents: 2
      }
    ]

    const mockComponents: ComponentConsumption[] = [
      {
        id: '1',
        componentName: 'Café Arábica Premium',
        componentSku: 'CF-001',
        qtyPlanned: 40,
        qtyConsumed: 38,
        unitCost: 8500,
        totalCost: 323000,
        status: 'consumed'
      },
      {
        id: '2',
        componentName: 'Café Robusta',
        componentSku: 'CF-002',
        qtyPlanned: 10,
        qtyConsumed: 10,
        unitCost: 6500,
        totalCost: 65000,
        status: 'consumed'
      },
      {
        id: '3',
        componentName: 'Aditivo Natural',
        componentSku: 'AD-001',
        qtyPlanned: 0.5,
        qtyConsumed: 0.5,
        unitCost: 12000,
        totalCost: 6000,
        status: 'consumed'
      }
    ]

    setWorkOrders(mockWorkOrders)
    setComponents(mockComponents)
  }, [])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckIcon className="h-5 w-5" />
      case 'IN_PROGRESS': return <PlayIcon className="h-5 w-5" />
      case 'PLANNED': return <ClockIcon className="h-5 w-5" />
      default: return <CogIcon className="h-5 w-5" />
    }
  }

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.lotCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalPlanned = filteredOrders.reduce((sum, order) => sum + order.qtyPlanned, 0)
  const totalProduced = filteredOrders.reduce((sum, order) => sum + (order.qtyProduced || 0), 0)
  const activeOrders = workOrders.filter(order => order.status === 'IN_PROGRESS').length
  const completedToday = workOrders.filter(order => 
    order.status === 'COMPLETED' && 
    order.finishedAt && 
    order.finishedAt.toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Órdenes de Producción
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestión de producción con BOM y control de costos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Reportes
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Orden
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por producto, SKU o lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="PLANNED">Planificado</option>
                <option value="IN_PROGRESS">En Proceso</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las prioridades</option>
                <option value="URGENT">Urgente</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
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
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Órdenes Activas</p>
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
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CogIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Planificado</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPlanned} kg</p>
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
                <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Producido</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalProduced} kg</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Work Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedOrder(order)
                  setShowDetailsModal(true)
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status)} mr-3`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {order.productName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.productSku} • {order.lotCode || 'Sin lote'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Cantidad</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.qtyProduced || 0} / {order.qtyPlanned} kg
                    </span>
                  </div>

                  {order.yieldPercent && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Rendimiento</span>
                      <span className={`font-medium ${
                        order.yieldPercent >= 95 ? 'text-green-600' : 
                        order.yieldPercent >= 85 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {order.yieldPercent}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Asignado a</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.assignedTo || 'Sin asignar'}
                    </span>
                  </div>

                  {order.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Fecha límite</span>
                      <span className={`text-sm font-medium ${
                        new Date(order.dueDate) < new Date() && order.status !== 'COMPLETED'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {order.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {order.actualCost && order.plannedCost && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Costo</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ${order.actualCost.toLocaleString()}
                        </div>
                        <div className={`text-xs ${
                          order.actualCost > order.plannedCost 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          vs ${order.plannedCost.toLocaleString()} plan
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="flex items-center space-x-2">
                      {order.status === 'PLANNED' && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Iniciar
                        </button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          Completar
                        </button>
                      )}
                      <span className="text-xs text-gray-400">
                        {order.bomComponents} componentes
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron órdenes de producción
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o crear una nueva orden.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionWorkOrders
