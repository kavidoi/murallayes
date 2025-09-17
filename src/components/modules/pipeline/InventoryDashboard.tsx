import React, { useState, useEffect } from 'react'
import { ArrowRightIcon, ArrowUpIcon, ArrowDownIcon, AdjustmentsHorizontalIcon, MapPinIcon, CubeIcon, ExclamationTriangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import inventoryService, { type StockItem, type InventoryMove, type Location, type CreateMoveDto, type TransferDto, type AdjustmentDto } from '../../../services/inventoryService'

// Utility function to generate automatic internal SKU
const generateInternalSku = (productType: 'MANUFACTURED' | 'PURCHASED', sequence: number): string => {
  const prefix = productType === 'MANUFACTURED' ? 'MFG' : 'PUR'
  const year = new Date().getFullYear().toString().slice(-2)
  const paddedSequence = sequence.toString().padStart(4, '0')
  return `${prefix}-${year}-${paddedSequence}`
}

// Available locations
const LOCATIONS = [
  { id: '1', name: 'Muralla Café', isDefault: true },
  { id: '2', name: 'Bodega Principal', isDefault: false },
  { id: '3', name: 'Tienda Centro', isDefault: false },
  { id: '4', name: 'Producción', isDefault: false }
]

interface StockItem {
  id: string
  productId: string
  productName: string
  productSku: string
  internalSku: string
  locationId: string
  locationName: string
  quantity: number
  uom: string
  unitCost: number
  totalValue: number
  lastMovement: Date
  stockStatus: 'high' | 'medium' | 'low' | 'out'
  productType: 'MANUFACTURED' | 'PURCHASED'
  fechaElaboracion?: string
  vencimiento?: string
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
        internalSku: generateInternalSku('PURCHASED', 1),
        locationId: '1',
        locationName: 'Muralla Café',
        quantity: 150,
        uom: 'kg',
        unitCost: 8500,
        totalValue: 1275000,
        lastMovement: new Date('2024-01-15'),
        stockStatus: 'high',
        productType: 'PURCHASED'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Espresso Muralla Premium',
        productSku: 'ESP-MUR-001',
        internalSku: generateInternalSku('MANUFACTURED', 1),
        locationId: '1',
        locationName: 'Muralla Café',
        quantity: 15,
        uom: 'kg',
        unitCost: 12000,
        totalValue: 180000,
        lastMovement: new Date('2024-01-14'),
        stockStatus: 'low',
        productType: 'MANUFACTURED',
        fechaElaboracion: '2025-01-01',
        vencimiento: '2025-01-31'
      },
      {
        id: '3',
        productName: 'Leche Entera',
        productSku: 'MILK-001',
        internalSku: generateInternalSku('PURCHASED', 2),
        productId: '3',
        locationId: '3',
        locationName: 'Tienda Centro',
        quantity: 0,
        uom: 'L',
        unitCost: 950,
        totalValue: 0,
        lastMovement: new Date('2024-01-13'),
        stockStatus: 'out',
        productType: 'PURCHASED'
      },
      {
        id: '4',
        productId: '4',
        productName: 'Latte Mix Murallita',
        productSku: 'LAT-MUR-001',
        internalSku: generateInternalSku('MANUFACTURED', 2),
        locationId: '2',
        locationName: 'Bodega Principal',
        quantity: 25,
        uom: 'kg',
        unitCost: 15000,
        totalValue: 375000,
        lastMovement: new Date('2025-01-20'),
        stockStatus: 'medium',
        productType: 'MANUFACTURED',
        fechaElaboracion: '2025-01-10',
        vencimiento: '2025-01-25'
      }
    ]

    const mockMoves: InventoryMove[] = [
      {
        id: '1',
        type: 'ENTRADA_COMPRA',
        productName: 'Café Arábica Premium',
        productSku: 'CF-001',
        toLocation: 'Muralla Café',
        quantity: 50,
        uom: 'kg',
        unitCost: 8500,
        reason: 'Compra a proveedor ABC',
        createdAt: new Date('2025-01-20T10:30:00'),
        createdBy: 'Juan Pérez'
      },
      {
        id: '2',
        type: 'ENTRADA_PRODUCCION',
        productName: 'Espresso Muralla Premium',
        productSku: 'ESP-MUR-001',
        toLocation: 'Muralla Café',
        quantity: 15,
        uom: 'kg',
        reason: 'Producción terminada',
        createdAt: new Date('2025-01-19T15:45:00'),
        createdBy: 'María García'
      },
      {
        id: '3',
        type: 'TRASLADO',
        productName: 'Latte Mix Murallita',
        productSku: 'LAT-MUR-001',
        fromLocation: 'Producción',
        toLocation: 'Bodega Principal',
        quantity: 25,
        uom: 'kg',
        reason: 'Traslado post-producción',
        createdAt: new Date('2025-01-18T09:15:00'),
        createdBy: 'Carlos López'
      },
      {
        id: '4',
        type: 'SALIDA_VENTA',
        productName: 'Leche Entera',
        productSku: 'MILK-001',
        fromLocation: 'Tienda Centro',
        quantity: 12,
        uom: 'L',
        reason: 'Venta cliente',
        createdAt: new Date('2025-01-17T14:20:00'),
        createdBy: 'Ana Martínez'
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
              <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                Recibir Stock
              </button>
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
              {LOCATIONS.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} {location.isDefault ? '(Principal)' : ''}
                </option>
              ))}
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
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{LOCATIONS.length}</p>
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
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vencimiento
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {item.productSku} | ID: {item.internalSku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.productType === 'MANUFACTURED' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {item.productType === 'MANUFACTURED' ? 'Manufacturado' : 'Comprado'}
                          </span>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.vencimiento ? (
                            <div className="text-sm">
                              <div className={`font-medium ${
                                new Date(item.vencimiento) < new Date() 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : new Date(item.vencimiento) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {new Date(item.vencimiento).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">Sin vencimiento</span>
                          )}
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
