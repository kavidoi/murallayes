import React, { useState, useEffect } from 'react'
import { ChartBarIcon, DocumentChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface KPICard {
  id: string
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ReactNode
  color: string
}

interface CostByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ProductionMetric {
  product: string
  planned: number
  produced: number
  yield: number
  cost: number
  margin: number
}

interface InventoryValuation {
  location: string
  totalValue: number
  items: number
  lowStockItems: number
  avgCost: number
}

const ReportsAnalytics: React.FC = () => {
  const [kpis, setKpis] = useState<KPICard[]>([])
  const [costsByCategory, setCostsByCategory] = useState<CostByCategory[]>([])
  const [productionMetrics, setProductionMetrics] = useState<ProductionMetric[]>([])
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  // Mock data
  useEffect(() => {
    const mockKPIs: KPICard[] = [
      {
        id: '1',
        title: 'Costos Totales',
        value: '$2,450,000',
        change: 12.5,
        changeType: 'increase',
        icon: <CurrencyDollarIcon className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
      },
      {
        id: '2',
        title: 'Valor Inventario',
        value: '$1,875,000',
        change: 8.3,
        changeType: 'increase',
        icon: <ChartBarIcon className="h-6 w-6" />,
        color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
      },
      {
        id: '3',
        title: 'Rendimiento Promedio',
        value: '92.5%',
        change: -2.1,
        changeType: 'decrease',
        icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
        color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
      },
      {
        id: '4',
        title: 'Órdenes Completadas',
        value: 24,
        change: 15.8,
        changeType: 'increase',
        icon: <DocumentChartBarIcon className="h-6 w-6" />,
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
      }
    ]

    const mockCostsByCategory: CostByCategory[] = [
      { category: 'Materias Primas', amount: 1200000, percentage: 49, color: 'bg-blue-500' },
      { category: 'Inmueble', amount: 850000, percentage: 35, color: 'bg-green-500' },
      { category: 'Servicios', amount: 250000, percentage: 10, color: 'bg-yellow-500' },
      { category: 'Maquinaria', amount: 100000, percentage: 4, color: 'bg-purple-500' },
      { category: 'Otros', amount: 50000, percentage: 2, color: 'bg-gray-500' }
    ]

    const mockProductionMetrics: ProductionMetric[] = [
      {
        product: 'Espresso Muralla',
        planned: 150,
        produced: 142,
        yield: 94.7,
        cost: 9500,
        margin: 26.3
      },
      {
        product: 'Blend Casa',
        planned: 200,
        produced: 185,
        yield: 92.5,
        cost: 7800,
        margin: 31.2
      },
      {
        product: 'Café Descafeinado',
        planned: 75,
        produced: 71,
        yield: 94.7,
        cost: 11200,
        margin: 22.8
      }
    ]

    const mockInventoryValuation: InventoryValuation[] = [
      {
        location: 'Bodega Principal',
        totalValue: 1275000,
        items: 45,
        lowStockItems: 3,
        avgCost: 28333
      },
      {
        location: 'Tienda Centro',
        totalValue: 420000,
        items: 28,
        lowStockItems: 8,
        avgCost: 15000
      },
      {
        location: 'Producción',
        totalValue: 180000,
        items: 12,
        lowStockItems: 1,
        avgCost: 15000
      }
    ]

    setKpis(mockKPIs)
    setCostsByCategory(mockCostsByCategory)
    setProductionMetrics(mockProductionMetrics)
    setInventoryValuation(mockInventoryValuation)
  }, [])

  const totalCosts = costsByCategory.reduce((sum, item) => sum + item.amount, 0)
  const totalInventoryValue = inventoryValuation.reduce((sum, item) => sum + item.totalValue, 0)
  const avgYield = productionMetrics.reduce((sum, item) => sum + item.yield, 0) / productionMetrics.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Reportes y Análisis
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                KPIs, costos, producción e inventario valorizado
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las empresas</option>
                <option value="1">Muralla Spa</option>
                <option value="2">Murallita MEF</option>
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
              </select>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  kpi.changeType === 'increase' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {kpi.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {kpi.title}
                </h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                  {kpi.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Costs by Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Costos por Categoría
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total: ${totalCosts.toLocaleString()}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {costsByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${item.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="flex rounded-full overflow-hidden h-2">
                  {costsByCategory.map((item) => (
                    <div
                      key={item.category}
                      className={item.color}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Inventory Valuation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Inventario Valorizado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total: ${totalInventoryValue.toLocaleString()}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {inventoryValuation.map((location) => (
                  <div key={location.location} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {location.location}
                      </h4>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${location.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Items:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                          {location.items}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Stock Bajo:</span>
                        <span className={`ml-1 font-medium ${
                          location.lowStockItems > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {location.lowStockItems}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Costo Prom:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                          ${location.avgCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Production Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Métricas de Producción
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Rendimiento promedio: {avgYield.toFixed(1)}%
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Planificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rendimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Costo Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Margen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {productionMetrics.map((metric) => (
                  <tr key={metric.product} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.product}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {metric.planned} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {metric.produced} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        metric.yield >= 95 ? 'text-green-600 dark:text-green-400' :
                        metric.yield >= 90 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {metric.yield}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${metric.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        metric.margin >= 30 ? 'text-green-600 dark:text-green-400' :
                        metric.margin >= 20 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {metric.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ReportsAnalytics
