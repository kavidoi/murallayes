import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, Plus, TrendingUp, TrendingDown, AlertTriangle, Eye, Edit3, Trash2, BarChart3, MapPin, Calendar, DollarSign, Users, Truck } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  supplier: {
    id: string;
    name: string;
    contact: string;
    reliability: number; // 1-5
  };
  locations: Array<{
    locationId: string;
    locationName: string;
    quantity: number;
    reserved: number;
    available: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
  }>;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  unitCost: number;
  sellingPrice?: number;
  currency: string;
  unit: string; // piece, kg, liter, etc.
  status: 'active' | 'discontinued' | 'out-of-stock' | 'low-stock';
  stockAlerts: Array<{
    type: 'low-stock' | 'out-of-stock' | 'excess-stock' | 'expired';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  movements: Array<{
    id: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    date: string;
    reference: string;
    reason: string;
    user: string;
  }>;
  attributes: Record<string, any>;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    unit: string;
  };
  expiration?: {
    hasExpiration: boolean;
    expirationDate?: string;
    lotNumber?: string;
  };
  images: string[];
  barcode?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'office' | 'external';
  address: string;
  manager: {
    id: string;
    name: string;
    contact: string;
  };
  capacity: {
    total: number;
    used: number;
    unit: string;
  };
  zones: Array<{
    id: string;
    name: string;
    type: 'storage' | 'picking' | 'receiving' | 'shipping';
  }>;
  active: boolean;
}

const InventoryHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'analytics'>('cards');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock data
  const categories = [
    { id: 'all', name: 'Todas las Categorías', count: 0 },
    { id: 'electronics', name: 'Electrónicos', count: 24 },
    { id: 'office', name: 'Oficina', count: 18 },
    { id: 'furniture', name: 'Mobiliario', count: 12 },
    { id: 'supplies', name: 'Suministros', count: 35 },
    { id: 'equipment', name: 'Equipamiento', count: 8 },
    { id: 'consumables', name: 'Consumibles', count: 42 },
  ];

  const locations: Location[] = [
    {
      id: 'main-warehouse',
      name: 'Bodega Principal',
      type: 'warehouse',
      address: 'Av. Industrial 1234, Santiago',
      manager: { id: '1', name: 'Juan Pérez', contact: 'juan@company.com' },
      capacity: { total: 1000, used: 750, unit: 'm²' },
      zones: [
        { id: 'z1', name: 'Almacén A', type: 'storage' },
        { id: 'z2', name: 'Picking', type: 'picking' },
        { id: 'z3', name: 'Recepción', type: 'receiving' },
        { id: 'z4', name: 'Despacho', type: 'shipping' }
      ],
      active: true
    },
    {
      id: 'store-centro',
      name: 'Tienda Centro',
      type: 'store',
      address: 'Av. Providencia 456, Santiago',
      manager: { id: '2', name: 'María González', contact: 'maria@company.com' },
      capacity: { total: 200, used: 150, unit: 'm²' },
      zones: [
        { id: 'z5', name: 'Piso de Venta', type: 'storage' },
        { id: 'z6', name: 'Bodega', type: 'storage' }
      ],
      active: true
    },
    {
      id: 'office-hq',
      name: 'Oficina Central',
      type: 'office',
      address: 'Las Condes 789, Santiago',
      manager: { id: '3', name: 'Carlos Silva', contact: 'carlos@company.com' },
      capacity: { total: 50, used: 35, unit: 'm²' },
      zones: [
        { id: 'z7', name: 'Almacén Oficina', type: 'storage' }
      ],
      active: true
    }
  ];

  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      sku: 'LT-001',
      name: 'Laptop Dell Inspiron 15',
      description: 'Laptop para oficina con procesador Intel i5, 8GB RAM, 256GB SSD',
      category: 'electronics',
      subcategory: 'computers',
      brand: 'Dell',
      supplier: {
        id: 'sup1',
        name: 'TechSupplier SA',
        contact: 'ventas@techsupplier.cl',
        reliability: 4
      },
      locations: [
        {
          locationId: 'main-warehouse',
          locationName: 'Bodega Principal',
          quantity: 15,
          reserved: 3,
          available: 12,
          minStock: 5,
          maxStock: 25,
          reorderPoint: 8
        },
        {
          locationId: 'office-hq',
          locationName: 'Oficina Central',
          quantity: 3,
          reserved: 0,
          available: 3,
          minStock: 2,
          maxStock: 8,
          reorderPoint: 3
        }
      ],
      totalQuantity: 18,
      totalReserved: 3,
      totalAvailable: 15,
      unitCost: 450000,
      sellingPrice: 550000,
      currency: 'CLP',
      unit: 'unidad',
      status: 'active',
      stockAlerts: [
        {
          type: 'low-stock',
          severity: 'medium',
          message: 'Stock en Bodega Principal cerca del punto de reorden'
        }
      ],
      movements: [
        {
          id: 'm1',
          type: 'in',
          quantity: 10,
          date: '2024-01-15T10:00:00Z',
          reference: 'PO-2024-001',
          reason: 'Compra mensual',
          user: 'Ana García'
        },
        {
          id: 'm2',
          type: 'out',
          quantity: 2,
          date: '2024-01-18T14:30:00Z',
          reference: 'SO-2024-015',
          reason: 'Venta cliente',
          user: 'Carlos López'
        }
      ],
      attributes: {
        processor: 'Intel i5-11400H',
        ram: '8GB DDR4',
        storage: '256GB SSD',
        screen: '15.6" Full HD',
        warranty: '12 meses'
      },
      dimensions: {
        length: 35.8,
        width: 23.6,
        height: 2.0,
        weight: 1.8,
        unit: 'cm'
      },
      images: ['/api/placeholder/300/200'],
      barcode: '7891234567890',
      tags: ['laptop', 'oficina', 'dell'],
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-20T16:45:00Z'
    },
    {
      id: '2',
      sku: 'CH-002',
      name: 'Silla Ergonómica Ejecutiva',
      description: 'Silla de oficina con soporte lumbar, brazos ajustables y base de aluminio',
      category: 'furniture',
      subcategory: 'seating',
      brand: 'ErgoMax',
      supplier: {
        id: 'sup2',
        name: 'Muebles & Más Ltda.',
        contact: 'pedidos@mueblesmas.cl',
        reliability: 5
      },
      locations: [
        {
          locationId: 'main-warehouse',
          locationName: 'Bodega Principal',
          quantity: 8,
          reserved: 2,
          available: 6,
          minStock: 3,
          maxStock: 15,
          reorderPoint: 5
        },
        {
          locationId: 'store-centro',
          locationName: 'Tienda Centro',
          quantity: 4,
          reserved: 1,
          available: 3,
          minStock: 2,
          maxStock: 8,
          reorderPoint: 3
        }
      ],
      totalQuantity: 12,
      totalReserved: 3,
      totalAvailable: 9,
      unitCost: 180000,
      sellingPrice: 250000,
      currency: 'CLP',
      unit: 'unidad',
      status: 'active',
      stockAlerts: [],
      movements: [
        {
          id: 'm3',
          type: 'in',
          quantity: 15,
          date: '2024-01-10T11:30:00Z',
          reference: 'PO-2024-002',
          reason: 'Stock inicial',
          user: 'María Silva'
        },
        {
          id: 'm4',
          type: 'out',
          quantity: 3,
          date: '2024-01-16T09:15:00Z',
          reference: 'SO-2024-020',
          reason: 'Venta corporativa',
          user: 'Diego Ruiz'
        }
      ],
      attributes: {
        material: 'Cuero sintético y malla',
        color: 'Negro',
        peso_max: '120kg',
        garantia: '24 meses'
      },
      dimensions: {
        length: 65,
        width: 65,
        height: 115,
        weight: 18,
        unit: 'cm'
      },
      images: ['/api/placeholder/300/200'],
      tags: ['silla', 'ergonomica', 'oficina'],
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-18T12:20:00Z'
    },
    {
      id: '3',
      sku: 'PP-003',
      name: 'Papel A4 75gr (Paquete)',
      description: 'Paquete de 500 hojas papel bond blanco tamaño A4, 75 gramos',
      category: 'supplies',
      subcategory: 'stationery',
      brand: 'OfficeMax',
      supplier: {
        id: 'sup3',
        name: 'Papelería Industrial',
        contact: 'ventas@papelindustrial.cl',
        reliability: 4
      },
      locations: [
        {
          locationId: 'main-warehouse',
          locationName: 'Bodega Principal',
          quantity: 25,
          reserved: 0,
          available: 25,
          minStock: 10,
          maxStock: 100,
          reorderPoint: 15
        },
        {
          locationId: 'office-hq',
          locationName: 'Oficina Central',
          quantity: 8,
          reserved: 0,
          available: 8,
          minStock: 5,
          maxStock: 20,
          reorderPoint: 8
        },
        {
          locationId: 'store-centro',
          locationName: 'Tienda Centro',
          quantity: 2,
          reserved: 0,
          available: 2,
          minStock: 3,
          maxStock: 10,
          reorderPoint: 5
        }
      ],
      totalQuantity: 35,
      totalReserved: 0,
      totalAvailable: 35,
      unitCost: 3500,
      sellingPrice: 4500,
      currency: 'CLP',
      unit: 'paquete',
      status: 'low-stock',
      stockAlerts: [
        {
          type: 'low-stock',
          severity: 'high',
          message: 'Stock crítico en Tienda Centro - por debajo del mínimo'
        }
      ],
      movements: [
        {
          id: 'm5',
          type: 'in',
          quantity: 50,
          date: '2024-01-12T08:00:00Z',
          reference: 'PO-2024-003',
          reason: 'Compra mensual suministros',
          user: 'Roberto Kim'
        },
        {
          id: 'm6',
          type: 'out',
          quantity: 15,
          date: '2024-01-19T15:45:00Z',
          reference: 'REQ-2024-008',
          reason: 'Uso interno oficina',
          user: 'Sofía Chen'
        }
      ],
      attributes: {
        gramaje: '75g/m²',
        blancura: 'ISO 94',
        tamaño: '210 x 297 mm',
        hojas_paquete: 500
      },
      images: ['/api/placeholder/300/200'],
      tags: ['papel', 'a4', 'oficina', 'suministros'],
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-19T15:45:00Z'
    },
    {
      id: '4',
      sku: 'CF-004',
      name: 'Café Premium Molido 250g',
      description: 'Café arábica 100% colombiano, tueste medio, molido para cafetera',
      category: 'consumables',
      subcategory: 'beverages',
      brand: 'CaféDelSur',
      supplier: {
        id: 'sup4',
        name: 'Distribuidora Gourmet',
        contact: 'pedidos@distgourmet.cl',
        reliability: 4
      },
      locations: [
        {
          locationId: 'office-hq',
          locationName: 'Oficina Central',
          quantity: 12,
          reserved: 0,
          available: 12,
          minStock: 6,
          maxStock: 24,
          reorderPoint: 8
        },
        {
          locationId: 'store-centro',
          locationName: 'Tienda Centro',
          quantity: 0,
          reserved: 0,
          available: 0,
          minStock: 4,
          maxStock: 12,
          reorderPoint: 6
        }
      ],
      totalQuantity: 12,
      totalReserved: 0,
      totalAvailable: 12,
      unitCost: 4800,
      sellingPrice: 6500,
      currency: 'CLP',
      unit: 'paquete',
      status: 'out-of-stock',
      stockAlerts: [
        {
          type: 'out-of-stock',
          severity: 'high',
          message: 'Sin stock en Tienda Centro'
        }
      ],
      movements: [
        {
          id: 'm7',
          type: 'in',
          quantity: 20,
          date: '2024-01-14T13:20:00Z',
          reference: 'PO-2024-004',
          reason: 'Reposición consumibles',
          user: 'Luis Morales'
        },
        {
          id: 'm8',
          type: 'out',
          quantity: 8,
          date: '2024-01-21T10:30:00Z',
          reference: 'CON-2024-012',
          reason: 'Consumo oficina',
          user: 'Emma Thompson'
        }
      ],
      attributes: {
        origen: 'Colombia',
        tueste: 'Medio',
        tipo_grano: '100% Arábica',
        molienda: 'Medio'
      },
      expiration: {
        hasExpiration: true,
        expirationDate: '2024-07-14T00:00:00Z',
        lotNumber: 'LOT-2024-0142'
      },
      images: ['/api/placeholder/300/200'],
      tags: ['café', 'consumibles', 'oficina'],
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-21T10:30:00Z'
    }
  ];

  const filteredItems = useMemo(() => {
    let filtered = inventoryItems.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || 
        item.locations.some(loc => loc.locationId === selectedLocation);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'quantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'value':
          aValue = a.totalQuantity * a.unitCost;
          bValue = b.totalQuantity * b.unitCost;
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [inventoryItems, searchTerm, selectedCategory, selectedLocation, selectedStatus, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'low-stock': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'out-of-stock': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'discontinued': return 'bg-gray-300/20 text-gray-500 border-gray-300/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-electric-red/20 text-electric-red';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-blue/20 text-electric-blue';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.totalQuantity * item.unitCost), 0);
    const lowStockItems = filteredItems.filter(item => 
      item.stockAlerts.some(alert => alert.type === 'low-stock' || alert.type === 'out-of-stock')
    ).length;
    const activeLocations = locations.filter(loc => loc.active).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      activeLocations
    };
  }, [filteredItems, locations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Inventario
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Control integral de stock, ubicaciones y movimientos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <button className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['cards', 'table', 'analytics'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'cards' && 'Tarjetas'}
                {mode === 'table' && 'Tabla'}
                {mode === 'analytics' && 'Analytics'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Productos Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            En {stats.activeLocations} ubicaciones
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Total</p>
              <p className="text-2xl font-bold text-electric-green">
                {formatCurrency(stats.totalValue, 'CLP')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Costo de inventario
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Alertas de Stock</p>
              <p className="text-2xl font-bold text-electric-orange">{stats.lowStockItems}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-electric-orange" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Requieren atención
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ubicaciones</p>
              <p className="text-2xl font-bold text-electric-purple">{stats.activeLocations}</p>
            </div>
            <MapPin className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Activas
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="name">Nombre</option>
                <option value="quantity">Cantidad</option>
                <option value="value">Valor</option>
                <option value="updated">Actualización</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filteredItems.length} productos
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.count > 0 && `(${cat.count})`}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todas las Ubicaciones</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="low-stock">Stock Bajo</option>
              <option value="out-of-stock">Sin Stock</option>
              <option value="discontinued">Descontinuado</option>
            </select>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSelectedStatus('all');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-sm text-electric-blue hover:text-electric-blue/80"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'cards' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {item.sku}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {item.description}
                      </p>
                      {item.brand && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.brand}
                        </p>
                      )}
                    </div>
                    {item.images.length > 0 && (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded ml-3"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Stock Total:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.totalAvailable} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Valor Unit:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.unitCost, item.currency)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ubicaciones:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.locations.map(loc => (
                          <span
                            key={loc.locationId}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {loc.locationName}: {loc.available}
                          </span>
                        ))}
                      </div>
                    </div>

                    {item.stockAlerts.length > 0 && (
                      <div className="space-y-1">
                        {item.stockAlerts.slice(0, 2).map((alert, index) => (
                          <div
                            key={index}
                            className={`px-2 py-1 text-xs rounded ${getAlertColor(alert.severity)}`}
                          >
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {alert.message}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Actualizado: {formatDate(item.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <Edit3 className="w-3 h-3" />
                        <Trash2 className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.images.length > 0 && (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.totalAvailable} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        En {item.locations.length} ubicaciones
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.stockAlerts.length > 0 && (
                        <div className="mt-1">
                          <AlertTriangle className="w-4 h-4 text-electric-orange" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.unitCost, item.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-electric-blue hover:text-electric-blue/80"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-blue">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-red">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Dashboard de analytics en desarrollo</p>
              <p className="text-sm mt-2">Próximamente: análisis de rotación, tendencias y forecasting</p>
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedItem.images.length > 0 && (
                    <img
                      src={selectedItem.images[0]}
                      alt={selectedItem.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {selectedItem.sku}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedItem.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Stock por Ubicación
                    </h4>
                    <div className="space-y-3">
                      {selectedItem.locations.map(location => (
                        <div key={location.locationId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {location.locationName}
                            </h5>
                            <span className="text-sm font-semibold text-electric-blue">
                              {location.available} disponibles
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Total:</span>
                              <p className="font-medium">{location.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Reservado:</span>
                              <p className="font-medium">{location.reserved}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Mínimo:</span>
                              <p className="font-medium">{location.minStock}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Reorden:</span>
                              <p className="font-medium">{location.reorderPoint}</p>
                            </div>
                          </div>
                          {location.available <= location.reorderPoint && (
                            <div className="mt-2 text-xs text-electric-orange">
                              ⚠️ Stock en punto de reorden
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedItem.movements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Movimientos Recientes
                      </h4>
                      <div className="space-y-2">
                        {selectedItem.movements.slice(0, 5).map(movement => (
                          <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                movement.type === 'in' ? 'bg-electric-green' : 
                                movement.type === 'out' ? 'bg-electric-red' : 
                                'bg-electric-blue'
                              }`}>
                                {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '→'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {movement.reason}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(movement.date)} • {movement.user}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {movement.reference}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.stockAlerts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Alertas Activas
                      </h4>
                      <div className="space-y-2">
                        {selectedItem.stockAlerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${getAlertColor(alert.severity)}`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">{alert.type.replace('-', ' ')}</span>
                            </div>
                            <p className="text-sm mt-1">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Información General
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Categoría:</span>
                        <span className="font-medium capitalize">{selectedItem.category}</span>
                      </div>
                      {selectedItem.subcategory && (
                        <div className="flex justify-between">
                          <span>Subcategoría:</span>
                          <span className="font-medium capitalize">{selectedItem.subcategory}</span>
                        </div>
                      )}
                      {selectedItem.brand && (
                        <div className="flex justify-between">
                          <span>Marca:</span>
                          <span className="font-medium">{selectedItem.brand}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Unidad:</span>
                        <span className="font-medium">{selectedItem.unit}</span>
                      </div>
                      {selectedItem.barcode && (
                        <div className="flex justify-between">
                          <span>Código:</span>
                          <span className="font-mono text-xs">{selectedItem.barcode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Costos y Precios
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Costo unitario:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedItem.unitCost, selectedItem.currency)}
                        </span>
                      </div>
                      {selectedItem.sellingPrice && (
                        <div className="flex justify-between">
                          <span>Precio venta:</span>
                          <span className="font-medium">
                            {formatCurrency(selectedItem.sellingPrice, selectedItem.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Valor total stock:</span>
                        <span className="font-medium text-electric-green">
                          {formatCurrency(selectedItem.totalQuantity * selectedItem.unitCost, selectedItem.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Proveedor
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedItem.supplier.name}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${
                              i < selectedItem.supplier.reliability ? 'text-electric-yellow' : 'text-gray-300 dark:text-gray-600'
                            }`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedItem.supplier.contact}
                      </p>
                    </div>
                  </div>

                  {selectedItem.dimensions && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Dimensiones
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>L x W x H:</span>
                          <span className="font-medium">
                            {selectedItem.dimensions.length} x {selectedItem.dimensions.width} x {selectedItem.dimensions.height} {selectedItem.dimensions.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peso:</span>
                          <span className="font-medium">
                            {selectedItem.dimensions.weight} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.expiration && selectedItem.expiration.hasExpiration && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Vencimiento
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedItem.expiration.expirationDate && (
                          <div className="flex justify-between">
                            <span>Vence:</span>
                            <span className="font-medium">
                              {formatDate(selectedItem.expiration.expirationDate)}
                            </span>
                          </div>
                        )}
                        {selectedItem.expiration.lotNumber && (
                          <div className="flex justify-between">
                            <span>Lote:</span>
                            <span className="font-medium">
                              {selectedItem.expiration.lotNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {Object.keys(selectedItem.attributes).length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Atributos
                      </h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(selectedItem.attributes).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Creado: {formatDate(selectedItem.createdAt)}</p>
                    <p>Actualizado: {formatDate(selectedItem.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHub;