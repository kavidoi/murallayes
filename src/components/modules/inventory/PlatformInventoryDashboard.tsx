import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArchiveBoxIcon as Package,
  TruckIcon as Truck,
  WifiIcon as Wifi,
  ExclamationTriangleIcon as AlertCircle,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
  ArrowPathIcon as RefreshCw,
  Cog6ToothIcon as Settings,
  ChartBarIcon as BarChart3,
  ShoppingCartIcon as ShoppingCart,
  CurrencyDollarIcon as DollarSign,
  EyeIcon as Eye,
  PencilIcon as Edit,
  EllipsisHorizontalIcon as MoreHorizontal,
  BoltIcon as Zap,
  ArrowTrendingUpIcon as TrendingUp,
  MapPinIcon as MapPin,
  FunnelIcon as Filter,
  MagnifyingGlassIcon as Search,
  PlusIcon as Plus
} from '@heroicons/react/24/outline';
import inventoryService from '../../../services/inventoryService';
import type { StockItem } from '../../../services/inventoryService';

interface PlatformStats {
  totalProducts: number;
  syncedProducts: number;
  pendingSync: number;
  conflicts: number;
  lastSyncAt?: Date;
}

const PlatformInventoryDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalProducts: 0,
    syncedProducts: 0,
    pendingSync: 0,
    conflicts: 0
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'rappi' | 'pedidosya' | 'uber' | 'cafe'>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<'all' | 'synced' | 'pending' | 'error' | 'conflict'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockData, statsData] = await Promise.all([
        inventoryService.getStock(),
        inventoryService.getPlatformSyncStatus()
      ]);
      
      setInventory(stockData.data || []);
      setPlatformStats(statsData || {
        totalProducts: 0,
        syncedProducts: 0,
        pendingSync: 0,
        conflicts: 0
      });
    } catch (error) {
      console.error('Error loading inventory data:', error);
      // Set some demo data for development
      setInventory([
        {
          productId: '1',
          productName: 'Café Americano Demo',
          productDescription: 'Café americano tradicional - Demo Mode',
          productSku: 'CAF-AME-001',
          internalSku: 'MFG-25-0001',
          locationId: '1',
          locationName: 'Muralla Café',
          quantity: 45,
          uom: 'unidad',
          unitCost: 2500,
          totalValue: 112500,
          lastMovement: new Date(),
          stockStatus: 'high' as const,
          productType: 'TERMINADO' as const,
          minStock: 20,
          maxStock: 100,
          availableOnRappi: true,
          availableOnPedidosya: true,
          availableOnUber: false,
          availableInCafe: true,
          rappiPrice: 3500,
          pedidosyaPrice: 3200,
          uberPrice: 3800,
          cafePrice: 3000,
          syncStatus: {
            rappi: 'synced' as const,
            pedidosya: 'synced' as const,
            uber: 'error' as const,
            lastSyncAt: new Date(),
          }
        }
      ]);
      setPlatformStats({
        totalProducts: 1,
        syncedProducts: 1,
        pendingSync: 0,
        conflicts: 0,
        lastSyncAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await inventoryService.syncWithPlatforms();
      await loadData();
    } catch (error) {
      console.error('Error syncing platforms:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkPlatformToggle = async (platform: 'rappi' | 'pedidosya' | 'uber', enabled: boolean) => {
    if (selectedItems.length === 0) return;

    try {
      const updates = selectedItems.map(productId => ({
        productId,
        platform,
        available: enabled
      }));
      
      await inventoryService.bulkUpdatePlatformAvailability(updates);
      await loadData();
      setSelectedItems([]);
    } catch (error) {
      console.error(`Error bulk updating ${platform} availability:`, error);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlatform = selectedPlatform === 'all' || 
        (selectedPlatform === 'rappi' && item.availableOnRappi) ||
        (selectedPlatform === 'pedidosya' && item.availableOnPedidosya) ||
        (selectedPlatform === 'uber' && item.availableOnUber) ||
        (selectedPlatform === 'cafe' && item.availableInCafe);

      const matchesSyncStatus = syncStatusFilter === 'all' ||
        (item.syncStatus && (
          item.syncStatus.rappi === syncStatusFilter ||
          item.syncStatus.pedidosya === syncStatusFilter ||
          item.syncStatus.uber === syncStatusFilter
        ));

      return matchesSearch && matchesPlatform && matchesSyncStatus;
    });
  }, [inventory, searchTerm, selectedPlatform, syncStatusFilter]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'rappi': return <Truck className="w-4 h-4" style={{ color: '#FF441C' }} />;
      case 'pedidosya': return <ShoppingCart className="w-4 h-4" style={{ color: '#F7931E' }} />;
      case 'uber': return <Zap className="w-4 h-4" style={{ color: '#000000' }} />;
      case 'cafe': return <div className="w-4 h-4 text-amber-700">☕</div>;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getSyncStatusIcon = (status: 'synced' | 'pending' | 'error' | 'conflict') => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'conflict': return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string | number) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventario Multi-Plataforma
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestión unificada para Rappi, PedidosYa, Uber Eats y café presencial
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Todo'}
          </button>

          <button className="px-4 py-2 bg-electric-green text-white rounded-lg hover:bg-electric-green/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-electric-blue text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-electric-blue text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{platformStats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-electric-blue" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Sincronizados</p>
              <p className="text-2xl font-bold text-electric-green">{platformStats.syncedProducts}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((platformStats.syncedProducts / platformStats.totalProducts) * 100)}% del inventario
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendientes</p>
              <p className="text-2xl font-bold text-electric-yellow">{platformStats.pendingSync}</p>
            </div>
            <Clock className="w-8 h-8 text-electric-yellow" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Conflictos</p>
              <p className="text-2xl font-bold text-electric-red">{platformStats.conflicts}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-electric-red" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todas las Plataformas</option>
              <option value="rappi">Rappi</option>
              <option value="pedidosya">PedidosYa</option>
              <option value="uber">Uber Eats</option>
              <option value="cafe">Café Presencial</option>
            </select>

            <select
              value={syncStatusFilter}
              onChange={(e) => setSyncStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="synced">Sincronizado</option>
              <option value="pending">Pendiente</option>
              <option value="error">Error</option>
              <option value="conflict">Conflicto</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-electric-blue/10 rounded-lg">
            <span className="text-sm font-medium text-electric-blue">
              {selectedItems.length} productos seleccionados
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkPlatformToggle('rappi', true)}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
              >
                {getPlatformIcon('rappi')} Activar Rappi
              </button>
              <button
                onClick={() => handleBulkPlatformToggle('pedidosya', true)}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
              >
                {getPlatformIcon('pedidosya')} Activar PedidosYa
              </button>
              <button
                onClick={() => handleBulkPlatformToggle('uber', true)}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
              >
                {getPlatformIcon('uber')} Activar Uber
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Grid/Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map(item => (
                <div
                  key={item.productId}
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative ${
                    selectedItems.includes(item.productId) ? 'ring-2 ring-electric-blue' : ''
                  }`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      setSelectedItems(prev => 
                        prev.includes(item.productId) 
                          ? prev.filter(id => id !== item.productId)
                          : [...prev, item.productId]
                      );
                    } else {
                      setSelectedItems([item.productId]);
                    }
                  }}
                >
                  {/* Selection indicator */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.productId)}
                      onChange={() => {}}
                      className="rounded border-gray-300"
                    />
                  </div>

                  {/* Product info */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {item.productSku}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.stockStatus === 'high' ? 'bg-green-100 text-green-800' :
                          item.stockStatus === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          item.stockStatus === 'low' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.quantity} {item.uom}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                        {item.productDescription}
                      </p>
                    </div>

                    {/* Platform availability */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                        item.availableOnRappi ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {getPlatformIcon('rappi')}
                        <span>Rappi</span>
                        {item.availableOnRappi && item.syncStatus && getSyncStatusIcon(item.syncStatus.rappi)}
                      </div>
                      
                      <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                        item.availableOnPedidosya ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {getPlatformIcon('pedidosya')}
                        <span>PedidosYa</span>
                        {item.availableOnPedidosya && item.syncStatus && getSyncStatusIcon(item.syncStatus.pedidosya)}
                      </div>
                      
                      <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                        item.availableOnUber ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {getPlatformIcon('uber')}
                        <span>Uber</span>
                        {item.availableOnUber && item.syncStatus && getSyncStatusIcon(item.syncStatus.uber)}
                      </div>
                      
                      <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                        item.availableInCafe ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {getPlatformIcon('cafe')}
                        <span>Café</span>
                      </div>
                    </div>

                    {/* Pricing summary */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                        <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                      </div>
                      {item.rappiPrice && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Rappi:</span>
                          <span className="font-medium text-green-600">{formatCurrency(item.rappiPrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* Sync errors */}
                    {item.syncStatus?.errorMessage && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {item.syncStatus.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plataformas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Precios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sync Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredInventory.map(item => (
                  <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.productId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(prev => [...prev, item.productId]);
                            } else {
                              setSelectedItems(prev => prev.filter(id => id !== item.productId));
                            }
                          }}
                          className="mr-3 rounded border-gray-300"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.productSku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.quantity} {item.uom}
                      </div>
                      <div className={`text-xs ${
                        item.stockStatus === 'high' ? 'text-green-600' :
                        item.stockStatus === 'medium' ? 'text-yellow-600' :
                        item.stockStatus === 'low' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {item.stockStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.availableOnRappi && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            {getPlatformIcon('rappi')} Rappi
                          </span>
                        )}
                        {item.availableOnPedidosya && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            {getPlatformIcon('pedidosya')} PedidosYa
                          </span>
                        )}
                        {item.availableOnUber && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {getPlatformIcon('uber')} Uber
                          </span>
                        )}
                        {item.availableInCafe && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-brown-100 text-brown-800">
                            {getPlatformIcon('cafe')} Café
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div>Costo: {formatCurrency(item.unitCost)}</div>
                        {item.rappiPrice && <div className="text-orange-600">Rappi: {formatCurrency(item.rappiPrice)}</div>}
                        {item.pedidosyaPrice && <div className="text-yellow-600">PedidosYa: {formatCurrency(item.pedidosyaPrice)}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.syncStatus && (
                          <>
                            {getSyncStatusIcon(item.syncStatus.rappi)}
                            {getSyncStatusIcon(item.syncStatus.pedidosya)}
                            {getSyncStatusIcon(item.syncStatus.uber)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-electric-blue hover:text-electric-blue/80">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-blue">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last sync info */}
      {platformStats.lastSyncAt && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Última sincronización: {formatDate(platformStats.lastSyncAt)}
        </div>
      )}
    </div>
  );
};

export default PlatformInventoryDashboard;