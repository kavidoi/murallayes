import React, { useState, useEffect } from 'react'
import { ArrowRightIcon, ArrowUpIcon, ArrowDownIcon, AdjustmentsHorizontalIcon, MapPinIcon, CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface StockItem {
  id: string
  productId: string
  productName: string
  productSku: string
  locationId: string
  locationName: string
  quantity: number
  uom: string
  unitCost: number
  totalValue: number
  lastMovement: Date
  stockStatus: 'high' | 'medium' | 'low' | 'out'
}

interface InventoryMove {
  id: string
  type: 'ENTRADA_COMPRA' | 'ENTRADA_PRODUCCION' | 'SALIDA_PRODUCCION' | 'SALIDA_VENTA' | 'TRASLADO' | 'AJUSTE' | 'MERMA'
  productName: string
  productSku: string
  fromLocation?: string
  toLocation?: string
  quantity: number
  uom: string
  unitCost?: number
  reason?: string
  createdAt: Date
  createdBy: string
}

const InventoryDashboard: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [recentMoves, setRecentMoves] = useState<InventoryMove[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [, setShowTransferModal] = useState(false)

  // Mock data
  useEffect(() => {
    const mockStock: StockItem[] = [
      {
        id: '1',
        productId: '1',
        productName: 'Café Arábica Premium',
        productSku: 'CF-001',
        locationId: '1',
        locationName: 'Bodega Principal',
        quantity: 150,
        uom: 'kg',
        unitCost: 8500,
        totalValue: 1275000,
        lastMovement: new Date('2024-01-15'),
        stockStatus: 'high'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Espresso Muralla',
        productSku: 'ESP-001',
        locationId: '1',
        locationName: 'Bodega Principal',
        quantity: 15,
        uom: 'kg',
        unitCost: 12000,
        totalValue: 180000,
        lastMovement: new Date('2024-01-14'),
        stockStatus: 'low'
      },
      {
        id: '3',
        productName: 'Leche Entera',
        productSku: 'MILK-001',
        productId: '3',
        locationId: '2',
        locationName: 'Tienda Centro',
        quantity: 0,
        uom: 'L',
        unitCost: 950,
        totalValue: 0,
        lastMovement: new Date('2024-01-13'),
        stockStatus: 'out'
      }
    ]

    const mockMoves: InventoryMove[] = [
      {
        id: '1',
        type: 'ENTRADA_COMPRA',
        productName: 'Café Arábica Premium',
        productSku: 'CF-001',
        toLocation: 'Bodega Principal',
        quantity: 50,
        uom: 'kg',
        unitCost: 8500,
        reason: 'Compra a proveedor ABC',
        createdAt: new Date('2024-01-15T10:30:00'),
        createdBy: 'Juan Pérez'
      },
      {
        id: '2',
        type: 'TRASLADO',
        productName: 'Espresso Muralla',
        productSku: 'ESP-001',
        fromLocation: 'Bodega Principal',
        toLocation: 'Tienda Centro',
        quantity: 5,
        uom: 'kg',
        reason: 'Reposición tienda',
        createdAt: new Date('2024-01-14T15:45:00'),
        createdBy: 'María García'
      },
      {
        id: '3',
        type: 'SALIDA_VENTA',
        productName: 'Leche Entera',
        productSku: 'MILK-001',
        fromLocation: 'Tienda Centro',
        quantity: 12,
        uom: 'L',
        reason: 'Venta cliente',
        createdAt: new Date('2024-01-13T09:15:00'),
        createdBy: 'Carlos López'
      }
    ]

    setStockItems(mockStock)
    setRecentMoves(mockMoves)
  }, [])

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'out': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'high': return 'Stock Alto'
      case 'medium': return 'Stock Medio'
      case 'low': return 'Stock Bajo'
      case 'out': return 'Sin Stock'
      default: return 'Desconocido'
    }
  }

  const getMoveTypeIcon = (type: string) => {
    switch (type) {
      case 'ENTRADA_COMPRA': return <ArrowDownIcon className="h-4 w-4 text-green-600" />
      case 'ENTRADA_PRODUCCION': return <ArrowDownIcon className="h-4 w-4 text-blue-600" />
      case 'SALIDA_PRODUCCION': return <ArrowUpIcon className="h-4 w-4 text-orange-600" />
      case 'SALIDA_VENTA': return <ArrowUpIcon className="h-4 w-4 text-purple-600" />
      case 'TRASLADO': return <ArrowRightIcon className="h-4 w-4 text-indigo-600" />
      case 'AJUSTE': return <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-600" />
      case 'MERMA': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      default: return <CubeIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getMoveTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTRADA_COMPRA': return 'Entrada por Compra'
      case 'ENTRADA_PRODUCCION': return 'Entrada por Producción'
      case 'SALIDA_PRODUCCION': return 'Salida por Producción'
      case 'SALIDA_VENTA': return 'Salida por Venta'
      case 'TRASLADO': return 'Traslado'
      case 'AJUSTE': return 'Ajuste'
      case 'MERMA': return 'Merma'
      default: return type
    }
  }

  const filteredStock = stockItems.filter(item => {
    const matchesLocation = selectedLocation === 'all' || item.locationId === selectedLocation
    const matchesStatus = stockFilter === 'all' || item.stockStatus === stockFilter
    return matchesLocation && matchesStatus
  })

  const totalValue = filteredStock.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = stockItems.filter(item => item.stockStatus === 'low' || item.stockStatus === 'out').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Inventario
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Control de stock y movimientos por ubicación
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Trasladar
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Ajustar
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las ubicaciones</option>
              <option value="1">Bodega Principal</option>
              <option value="2">Tienda Centro</option>
              <option value="3">Producción</option>
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="high">Stock Alto</option>
              <option value="medium">Stock Medio</option>
              <option value="low">Stock Bajo</option>
              <option value="out">Sin Stock</option>
            </select>
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
                <CubeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalValue.toLocaleString()}
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
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicaciones</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">3</p>
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
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Bajo</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{lowStockItems}</p>
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
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArrowRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Movimientos Hoy</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">12</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stock Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stock por Producto
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.productSku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.locationName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.quantity} {item.uom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${item.totalValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(item.stockStatus)}`}>
                            {getStockStatusLabel(item.stockStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Movements */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Movimientos Recientes
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentMoves.map((move) => (
                    <div key={move.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getMoveTypeIcon(move.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getMoveTypeLabel(move.type)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {move.productName} ({move.productSku})
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {move.quantity} {move.uom}
                          {move.fromLocation && move.toLocation && (
                            <span> • {move.fromLocation} → {move.toLocation}</span>
                          )}
                          {move.toLocation && !move.fromLocation && (
                            <span> • → {move.toLocation}</span>
                          )}
                          {move.fromLocation && !move.toLocation && (
                            <span> • {move.fromLocation} →</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {move.createdAt.toLocaleDateString()} {move.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryDashboard
