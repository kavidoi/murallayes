import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Insumo {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  cost: number;
  supplier: string;
  lastUpdated: string;
  status: 'sufficient' | 'low' | 'critical';
}

const Insumos: React.FC = () => {
  const { t } = useTranslation();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockInsumos: Insumo[] = [
      {
        id: '1',
        name: 'Café Arábica Premium',
        category: 'Café',
        unit: 'kg',
        currentStock: 25,
        minimumStock: 10,
        cost: 8500,
        supplier: 'Café Central',
        lastUpdated: '2025-01-20',
        status: 'sufficient'
      },
      {
        id: '2',
        name: 'Leche Entera',
        category: 'Lácteos',
        unit: 'litros',
        currentStock: 8,
        minimumStock: 15,
        cost: 1200,
        supplier: 'Lechería del Valle',
        lastUpdated: '2025-01-21',
        status: 'low'
      },
      {
        id: '3',
        name: 'Azúcar Blanca',
        category: 'Endulzantes',
        unit: 'kg',
        currentStock: 2,
        minimumStock: 5,
        cost: 850,
        supplier: 'Distribuidora Dulce',
        lastUpdated: '2025-01-19',
        status: 'critical'
      },
      {
        id: '4',
        name: 'Harina de Trigo',
        category: 'Panadería',
        unit: 'kg',
        currentStock: 50,
        minimumStock: 20,
        cost: 650,
        supplier: 'Molino San José',
        lastUpdated: '2025-01-21',
        status: 'sufficient'
      },
      {
        id: '5',
        name: 'Mantequilla',
        category: 'Lácteos',
        unit: 'kg',
        currentStock: 3,
        minimumStock: 8,
        cost: 4200,
        supplier: 'Lechería del Valle',
        lastUpdated: '2025-01-20',
        status: 'low'
      }
    ];
    setInsumos(mockInsumos);
    setFilteredInsumos(mockInsumos);
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = insumos;

    if (searchTerm) {
      filtered = filtered.filter(insumo =>
        insumo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insumo.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(insumo => insumo.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(insumo => insumo.status === statusFilter);
    }

    setFilteredInsumos(filtered);
  }, [insumos, searchTerm, categoryFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sufficient': return 'Suficiente';
      case 'low': return 'Bajo';
      case 'critical': return 'Crítico';
      default: return status;
    }
  };

  const categories = ['Café', 'Lácteos', 'Endulzantes', 'Panadería'];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Insumos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Control y seguimiento de materias primas y suministros
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Insumos</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{insumos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Suficiente</h3>
              <p className="text-2xl font-semibold text-green-600">{insumos.filter(i => i.status === 'sufficient').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Bajo</h3>
              <p className="text-2xl font-semibold text-yellow-600">{insumos.filter(i => i.status === 'low').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Crítico</h3>
              <p className="text-2xl font-semibold text-red-600">{insumos.filter(i => i.status === 'critical').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Insumo
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o proveedor..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado del Stock
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="sufficient">Suficiente</option>
              <option value="low">Bajo</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insumos Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Lista de Insumos ({filteredInsumos.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Insumo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Proveedor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInsumos.map((insumo) => (
                <tr key={insumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {insumo.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {insumo.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {insumo.currentStock} {insumo.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {insumo.minimumStock} {insumo.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(insumo.status)}`}>
                      {getStatusText(insumo.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      ${insumo.cost.toLocaleString('es-CL')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {insumo.supplier}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          📋 Generar Orden de Compra
        </button>
        <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          ➕ Agregar Insumo
        </button>
        <button className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
          📊 Exportar Reporte
        </button>
      </div>
    </div>
  );
};

export default Insumos;