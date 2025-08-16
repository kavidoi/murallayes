import React, { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TagIcon, CubeIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  type: 'INSUMO' | 'TERMINADO' | 'SERVICIO'
  uom: string
  category?: string
  unitCost?: number
  isActive: boolean
  bomComponents?: number
  stockLevel?: number
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Mock data - replace with API call
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        sku: 'CF-001',
        name: 'Café Arábica Premium',
        description: 'Granos de café arábica de alta calidad',
        type: 'INSUMO',
        uom: 'kg',
        category: 'Materias Primas',
        unitCost: 8500,
        isActive: true,
        stockLevel: 150
      },
      {
        id: '2',
        sku: 'ESP-001',
        name: 'Espresso Muralla',
        description: 'Blend especial de la casa',
        type: 'TERMINADO',
        uom: 'kg',
        category: 'Productos Terminados',
        unitCost: 12000,
        isActive: true,
        bomComponents: 3,
        stockLevel: 45
      },
      {
        id: '3',
        sku: 'MILK-001',
        name: 'Leche Entera',
        description: 'Leche fresca para preparaciones',
        type: 'INSUMO',
        uom: 'L',
        category: 'Lácteos',
        unitCost: 950,
        isActive: true,
        stockLevel: 80
      }
    ]
    setProducts(mockProducts)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || product.type === selectedType
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INSUMO': return <BeakerIcon className="h-5 w-5" />
      case 'TERMINADO': return <CubeIcon className="h-5 w-5" />
      case 'SERVICIO': return <TagIcon className="h-5 w-5" />
      default: return <CubeIcon className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INSUMO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'TERMINADO': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'SERVICIO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStockStatus = (level?: number) => {
    if (!level) return { color: 'bg-gray-100 text-gray-800', label: 'Sin stock' }
    if (level < 20) return { color: 'bg-red-100 text-red-800', label: 'Stock bajo' }
    if (level < 50) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock medio' }
    return { color: 'bg-green-100 text-green-800', label: 'Stock alto' }
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
                Gestiona insumos, productos terminados y servicios
              </p>
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Producto
              </button>
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
                <option value="INSUMO">Insumos</option>
                <option value="TERMINADO">Productos Terminados</option>
                <option value="SERVICIO">Servicios</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                <option value="Materias Primas">Materias Primas</option>
                <option value="Productos Terminados">Productos Terminados</option>
                <option value="Lácteos">Lácteos</option>
              </select>
            </div>
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
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
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
                        <span className="text-sm text-gray-500 dark:text-gray-400">Precio unitario</span>
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
                    </div>
                  </motion.div>
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
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockLevel)
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {product.stockLevel} {product.uom}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron productos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o crear un nuevo producto.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalog
