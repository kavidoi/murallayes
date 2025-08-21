import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, EyeIcon, XMarkIcon, ChevronDownIcon, ExclamationTriangleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { AuthService } from '../../../services/authService';

// Interfaces for Insumos
interface Insumo {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  cost: number;
  supplierId: string;
  supplierName: string;
  supplierContactId?: string;
  sku?: string;
  barcode?: string;
  location?: string;
  expirationDate?: string;
  lastPurchaseDate?: string;
  lastPurchaseQuantity?: number;
  lastPurchaseCost?: number;
  averageCost?: number;
  totalValue: number;
  status: 'sufficient' | 'low' | 'critical' | 'excess';
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Contact interface (from Contactos)
interface Contact {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'important';
  entityType: 'business' | 'person';
  phone?: string;
  email?: string;
  rut?: string;
  company?: string;
  address?: string;
  contactPersonName?: string;
  giro?: string;
  isActive?: boolean;
}

interface InsumoFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  cost: number;
  supplierId: string;
  sku: string;
  barcode: string;
  location: string;
  expirationDate: string;
  notes: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

const Insumos: React.FC = () => {
  const { t } = useTranslation();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [viewingInsumo, setViewingInsumo] = useState<Insumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // Get current user info from JWT token
  const getCurrentUser = (): UserInfo | null => {
    const token = AuthService.getToken();
    if (!token) return null;
    
    try {
      const [, payloadSeg] = token.split('.');
      if (!payloadSeg) return null;
      
      const base64 = payloadSeg.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);
      
      return {
        id: payload.sub || payload.userId || '',
        email: payload.email || '',
        firstName: payload.firstName || payload.given_name || '',
        lastName: payload.lastName || payload.family_name || '',
        fullName: `${payload.firstName || payload.given_name || ''} ${payload.lastName || payload.family_name || ''}`.trim() || payload.email || 'Usuario'
      };
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  // Load suppliers from Contactos
  const loadSuppliers = async () => {
    try {
      // Mock suppliers data - in a real app, this would come from the Contactos API
      const mockSuppliers: Contact[] = [
        {
          id: 'sup1',
          name: 'Café Central',
          type: 'supplier',
          entityType: 'business',
          phone: '+56987654321',
          email: 'contacto@cafecentral.cl',
          rut: '76.123.456-7',
          company: 'Café Central S.A.',
          address: 'Av. Providencia 1234, Santiago',
          contactPersonName: 'Roberto Muñoz',
          giro: 'Comercialización de café y productos gourmet',
          isActive: true
        },
        {
          id: 'sup2',
          name: 'Lechería del Valle',
          type: 'supplier',
          entityType: 'business',
          phone: '+56987654322',
          email: 'ventas@lecheriavalle.cl',
          rut: '78.234.567-8',
          company: 'Lechería del Valle Ltda.',
          contactPersonName: 'María González',
          giro: 'Producción y distribución de lácteos',
          isActive: true
        },
        {
          id: 'sup3',
          name: 'Distribuidora Dulce',
          type: 'supplier',
          entityType: 'business',
          phone: '+56987654323',
          email: 'info@distridulce.cl',
          rut: '79.345.678-9',
          company: 'Distribuidora Dulce S.A.',
          contactPersonName: 'Carlos Silva',
          giro: 'Distribución de productos dulces y endulzantes',
          isActive: true
        },
        {
          id: 'sup4',
          name: 'Molino San José',
          type: 'supplier',
          entityType: 'business',
          phone: '+56987654324',
          email: 'contacto@molinosanjose.cl',
          rut: '80.456.789-0',
          company: 'Molino San José S.A.',
          contactPersonName: 'Ana López',
          giro: 'Molino de harinas y cereales',
          isActive: true
        }
      ];
      setSuppliers(mockSuppliers);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    }
  };

  // Mock data with enhanced structure
  useEffect(() => {
    const mockInsumos: Insumo[] = [
      {
        id: '1',
        name: 'Café Arábica Premium',
        description: 'Café de origen colombiano, tostado medio',
        category: 'Café',
        subcategory: 'Granos',
        unit: 'kg',
        currentStock: 25,
        minimumStock: 10,
        maximumStock: 50,
        cost: 8500,
        supplierId: 'sup1',
        supplierName: 'Café Central',
        supplierContactId: 'sup1',
        sku: 'CAF-ARA-001',
        barcode: '1234567890123',
        location: 'Bodega A - Estante 1',
        expirationDate: '2025-06-01',
        lastPurchaseDate: '2025-01-20',
        lastPurchaseQuantity: 20,
        lastPurchaseCost: 8000,
        averageCost: 8200,
        totalValue: 25 * 8500,
        status: 'sufficient',
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-20'
      },
      {
        id: '2',
        name: 'Leche Entera',
        description: 'Leche fresca pasteurizada 3.5% grasa',
        category: 'Lácteos',
        subcategory: 'Leche',
        unit: 'litros',
        currentStock: 8,
        minimumStock: 15,
        maximumStock: 40,
        cost: 1200,
        supplierId: 'sup2',
        supplierName: 'Lechería del Valle',
        supplierContactId: 'sup2',
        sku: 'LAC-ENT-001',
        location: 'Refrigerador 1',
        expirationDate: '2025-01-30',
        lastPurchaseDate: '2025-01-21',
        lastPurchaseQuantity: 15,
        lastPurchaseCost: 1150,
        averageCost: 1180,
        totalValue: 8 * 1200,
        status: 'low',
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-21'
      },
      {
        id: '3',
        name: 'Azúcar Blanca',
        description: 'Azúcar refinada granulada',
        category: 'Endulzantes',
        subcategory: 'Azúcar',
        unit: 'kg',
        currentStock: 2,
        minimumStock: 5,
        maximumStock: 25,
        cost: 850,
        supplierId: 'sup3',
        supplierName: 'Distribuidora Dulce',
        supplierContactId: 'sup3',
        sku: 'END-AZU-001',
        location: 'Bodega B - Estante 2',
        lastPurchaseDate: '2025-01-19',
        lastPurchaseQuantity: 10,
        lastPurchaseCost: 800,
        averageCost: 825,
        totalValue: 2 * 850,
        status: 'critical',
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-19'
      },
      {
        id: '4',
        name: 'Harina de Trigo',
        description: 'Harina 000 para panadería',
        category: 'Panadería',
        subcategory: 'Harinas',
        unit: 'kg',
        currentStock: 50,
        minimumStock: 20,
        maximumStock: 100,
        cost: 650,
        supplierId: 'sup4',
        supplierName: 'Molino San José',
        supplierContactId: 'sup4',
        sku: 'PAN-HAR-001',
        location: 'Bodega A - Estante 3',
        expirationDate: '2025-12-01',
        lastPurchaseDate: '2025-01-21',
        lastPurchaseQuantity: 50,
        lastPurchaseCost: 620,
        averageCost: 635,
        totalValue: 50 * 650,
        status: 'sufficient',
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-21'
      },
      {
        id: '5',
        name: 'Mantequilla',
        description: 'Mantequilla sin sal 82% grasa',
        category: 'Lácteos',
        subcategory: 'Mantequilla',
        unit: 'kg',
        currentStock: 3,
        minimumStock: 8,
        maximumStock: 20,
        cost: 4200,
        supplierId: 'sup2',
        supplierName: 'Lechería del Valle',
        supplierContactId: 'sup2',
        sku: 'LAC-MAN-001',
        location: 'Refrigerador 2',
        expirationDate: '2025-02-15',
        lastPurchaseDate: '2025-01-20',
        lastPurchaseQuantity: 5,
        lastPurchaseCost: 4100,
        averageCost: 4150,
        totalValue: 3 * 4200,
        status: 'low',
        isActive: true,
        createdBy: 'Admin',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-20'
      }
    ];
    setInsumos(mockInsumos);
    setFilteredInsumos(mockInsumos);
    loadSuppliers();
    setCurrentUser(getCurrentUser());
  }, []);

  // Enhanced filter logic
  useEffect(() => {
    let filtered = insumos.filter(insumo => insumo.isActive);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(insumo =>
        insumo.name.toLowerCase().includes(term) ||
        insumo.description?.toLowerCase().includes(term) ||
        insumo.supplierName.toLowerCase().includes(term) ||
        insumo.sku?.toLowerCase().includes(term) ||
        insumo.category.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(insumo => insumo.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(insumo => insumo.status === statusFilter);
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(insumo => insumo.supplierId === supplierFilter);
    }

    setFilteredInsumos(filtered);
  }, [insumos, searchTerm, categoryFilter, statusFilter, supplierFilter]);

  // Handle form submission for creating/editing insumos
  const handleSubmitInsumo = async (formData: InsumoFormData) => {
    setLoading(true);
    try {
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      
      if (editingInsumo) {
        // Update existing insumo
        const updatedInsumo: Insumo = {
          ...editingInsumo,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          unit: formData.unit,
          currentStock: formData.currentStock,
          minimumStock: formData.minimumStock,
          maximumStock: formData.maximumStock,
          cost: formData.cost,
          supplierId: formData.supplierId,
          supplierName: supplier?.name || 'Unknown',
          supplierContactId: supplier?.id,
          sku: formData.sku,
          barcode: formData.barcode,
          location: formData.location,
          expirationDate: formData.expirationDate || undefined,
          totalValue: formData.currentStock * formData.cost,
          status: formData.currentStock <= formData.minimumStock ? 
            (formData.currentStock === 0 ? 'critical' : 'low') : 
            (formData.maximumStock && formData.currentStock > formData.maximumStock ? 'excess' : 'sufficient'),
          updatedBy: currentUser?.fullName || currentUser?.email || 'Usuario',
          updatedAt: new Date().toISOString(),
          notes: formData.notes
        };

        setInsumos(prev => prev.map(i => i.id === editingInsumo.id ? updatedInsumo : i));
        setEditingInsumo(null);
      } else {
        // Create new insumo
        const newInsumo: Insumo = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          unit: formData.unit,
          currentStock: formData.currentStock,
          minimumStock: formData.minimumStock,
          maximumStock: formData.maximumStock,
          cost: formData.cost,
          supplierId: formData.supplierId,
          supplierName: supplier?.name || 'Unknown',
          supplierContactId: supplier?.id,
          sku: formData.sku,
          barcode: formData.barcode,
          location: formData.location,
          expirationDate: formData.expirationDate || undefined,
          totalValue: formData.currentStock * formData.cost,
          status: formData.currentStock <= formData.minimumStock ? 
            (formData.currentStock === 0 ? 'critical' : 'low') : 
            (formData.maximumStock && formData.currentStock > formData.maximumStock ? 'excess' : 'sufficient'),
          isActive: true,
          createdBy: currentUser?.fullName || currentUser?.email || 'Usuario',
          updatedBy: currentUser?.fullName || currentUser?.email || 'Usuario',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: formData.notes
        };

        setInsumos(prev => [...prev, newInsumo]);
      }
      
      setShowAddForm(false);
    } catch (e) {
      console.error('Failed to save insumo:', e);
      alert('Error al guardar el insumo. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInsumo = (insumoId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      setInsumos(prev => prev.map(i => 
        i.id === insumoId ? { ...i, isActive: false, updatedAt: new Date().toISOString() } : i
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'excess': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sufficient': return 'Suficiente';
      case 'low': return 'Bajo';
      case 'critical': return 'Crítico';
      case 'excess': return 'Exceso';
      default: return status;
    }
  };

  const categories = [...new Set(insumos.map(i => i.category))].sort();
  const totalValue = filteredInsumos.reduce((sum, i) => sum + i.totalValue, 0);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Insumos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Control y seguimiento de materias primas y suministros
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Insumo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Insumos</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredInsumos.length}</p>
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
              <p className="text-2xl font-semibold text-green-600">{filteredInsumos.filter(i => i.status === 'sufficient').length}</p>
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
              <p className="text-2xl font-semibold text-yellow-600">{filteredInsumos.filter(i => i.status === 'low').length}</p>
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
              <p className="text-2xl font-semibold text-red-600">{filteredInsumos.filter(i => i.status === 'critical').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Insumo
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, SKU, descripción..."
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
              <option value="excess">Exceso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proveedor
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los proveedores</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
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
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Costo/Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInsumos.map((insumo) => (
                <tr key={insumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {insumo.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {insumo.category} • {insumo.sku}
                      </div>
                      {insumo.location && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          📍 {insumo.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {insumo.currentStock} {insumo.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {insumo.minimumStock} {insumo.unit}
                    </div>
                    {insumo.expirationDate && new Date(insumo.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                      <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-1">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Vence: {new Date(insumo.expirationDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(insumo.status)}`}>
                      {getStatusText(insumo.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      ${insumo.cost.toLocaleString()} / {insumo.unit}
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Total: ${insumo.totalValue.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {insumo.supplierName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingInsumo(insumo)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingInsumo(insumo)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInsumo(insumo.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredInsumos.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📦</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron insumos
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Ajusta los filtros o agrega un nuevo insumo para comenzar.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showAddForm || editingInsumo) && (
        <InsumoFormModal
          isOpen={showAddForm || !!editingInsumo}
          onClose={() => {
            setShowAddForm(false);
            setEditingInsumo(null);
          }}
          onSubmit={handleSubmitInsumo}
          editingInsumo={editingInsumo}
          suppliers={suppliers}
          currentUser={currentUser}
          loading={loading}
        />
      )}

      {viewingInsumo && (
        <ViewInsumoModal
          isOpen={!!viewingInsumo}
          onClose={() => setViewingInsumo(null)}
          insumo={viewingInsumo}
          supplier={suppliers.find(s => s.id === viewingInsumo.supplierId)}
        />
      )}
    </div>
  );
};

// Form Modal Component
const InsumoFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsumoFormData) => void;
  editingInsumo?: Insumo | null;
  suppliers: Contact[];
  currentUser: UserInfo | null;
  loading: boolean;
}> = ({ isOpen, onClose, onSubmit, editingInsumo, suppliers, currentUser, loading }) => {
  const [formData, setFormData] = useState<InsumoFormData>({
    name: editingInsumo?.name || '',
    description: editingInsumo?.description || '',
    category: editingInsumo?.category || '',
    subcategory: editingInsumo?.subcategory || '',
    unit: editingInsumo?.unit || 'kg',
    currentStock: editingInsumo?.currentStock || 0,
    minimumStock: editingInsumo?.minimumStock || 1,
    maximumStock: editingInsumo?.maximumStock || 100,
    cost: editingInsumo?.cost || 0,
    supplierId: editingInsumo?.supplierId || '',
    sku: editingInsumo?.sku || '',
    barcode: editingInsumo?.barcode || '',
    location: editingInsumo?.location || '',
    expirationDate: editingInsumo?.expirationDate || '',
    notes: editingInsumo?.notes || ''
  });

  const categories = [
    'Café', 'Lácteos', 'Endulzantes', 'Panadería', 'Bebidas', 'Condimentos', 
    'Aceites', 'Conservas', 'Embutidos', 'Frutas', 'Verduras', 'Carnes', 'Otros'
  ];

  const units = [
    'kg', 'g', 'litros', 'ml', 'unidades', 'paquetes', 'cajas', 'bolsas', 'latas', 'botellas'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                    {editingInsumo ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}
                  </h3>
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Insumo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Café Arábica Premium"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción detallada del insumo..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subcategoría
                      </label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Granos, Leche, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unidad de Medida *
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Proveedor *
                      </label>
                      <select
                        required
                        value={formData.supplierId}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecciona un proveedor</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} {supplier.company ? `(${supplier.company})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Información de Stock</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stock Actual *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.currentStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stock Mínimo *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.minimumStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, minimumStock: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stock Máximo
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.maximumStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, maximumStock: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Detalles del Producto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Costo Unitario * (CLP)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1"
                          value={formData.cost}
                          onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="8500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="CAF-ARA-001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Código de Barras
                        </label>
                        <input
                          type="text"
                          value={formData.barcode}
                          onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="1234567890123"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Bodega A - Estante 1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          value={formData.expirationDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valor Total Estimado
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={`$${(formData.currentStock * formData.cost).toLocaleString()} CLP`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas Adicionales
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Información adicional sobre el insumo..."
                    />
                  </div>

                  {/* User Tracking Info */}
                  {currentUser && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>{editingInsumo ? 'Modificado' : 'Creado'} por:</strong> {currentUser.fullName} ({currentUser.email})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (editingInsumo ? 'Actualizar Insumo' : 'Crear Insumo')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Modal Component
const ViewInsumoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo;
  supplier?: Contact;
}> = ({ isOpen, onClose, insumo, supplier }) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'excess': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sufficient': return 'Suficiente';
      case 'low': return 'Bajo';
      case 'critical': return 'Crítico';
      case 'excess': return 'Exceso';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
                  Detalles del Insumo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {insumo.name}
                    </h4>
                    {insumo.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {insumo.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.category}
                      {insumo.subcategory && ` • ${insumo.subcategory}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.sku || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Actual
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.currentStock} {insumo.unit}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Mínimo
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.minimumStock} {insumo.unit}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(insumo.status)}`}>
                      {getStatusText(insumo.status)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Costo Unitario
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      ${insumo.cost.toLocaleString()} CLP
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor Total
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${insumo.totalValue.toLocaleString()} CLP
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ubicación
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.location || '—'}
                    </p>
                  </div>

                  {insumo.expirationDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Vencimiento
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(insumo.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Supplier Information */}
                {supplier && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Información del Proveedor
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {supplier.name}
                        </p>
                      </div>
                      {supplier.company && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Empresa
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {supplier.company}
                          </p>
                        </div>
                      )}
                      {supplier.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {supplier.phone}
                          </p>
                        </div>
                      )}
                      {supplier.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {supplier.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purchase History */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Historial de Compras
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insumo.lastPurchaseDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Última Compra
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(insumo.lastPurchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {insumo.lastPurchaseQuantity && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cantidad
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {insumo.lastPurchaseQuantity} {insumo.unit}
                        </p>
                      </div>
                    )}
                    {insumo.lastPurchaseCost && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Costo Anterior
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          ${insumo.lastPurchaseCost.toLocaleString()} CLP
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {insumo.notes && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {insumo.notes}
                    </p>
                  </div>
                )}

                {/* Tracking Information */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Creado por
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {insumo.createdBy}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de creación
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(insumo.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {insumo.updatedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Última modificación por
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insumo.updatedBy}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Última actualización
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(insumo.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insumos;