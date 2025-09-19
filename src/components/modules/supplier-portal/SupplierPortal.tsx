import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface SupplierStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  lastPurchaseDate: string;
  lastPurchaseAmount: number;
  reorderLevel: number;
  status: 'sufficient' | 'low' | 'critical';
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  orderDate: string;
  expectedDelivery?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered';
  notes?: string;
}

interface SupplierData {
  id: string;
  name: string;
  company: string;
  contactPersonName?: string;
  phone?: string;
  email?: string;
  currentStock: SupplierStockItem[];
  pendingOrders: PendingOrder[];
  portalEnabled: boolean;
}

interface CompanyInfo {
  name: string;
  phone: string;
  instagram: string;
  email: string;
  address: string;
}

const SupplierPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stock' | 'orders' | 'contact'>('stock');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    contactPersonName: '',
    phone: '',
    email: ''
  });

  // Company contact information
  const companyInfo: CompanyInfo = {
    name: 'Muralla Café',
    phone: '+56949153575',
    instagram: '@murallacafe',
    email: 'contacto@murallacafe.cl',
    address: 'Av. Providencia 1234, Santiago'
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    if (token) {
      setTimeout(() => {
        // Simulate API call based on token
        if (token === '375dsfgeF') {
          const supplierInfo = {
            id: '1',
            name: 'Café Central S.A.',
            company: 'Café Central S.A.',
            contactPersonName: 'Roberto Muñoz',
            phone: '+56987654321',
            email: 'roberto@cafecentral.cl',
            portalEnabled: true,
            currentStock: [
              {
                id: 's1',
                name: 'Café Arábica Premium',
                category: 'Café',
                currentStock: 25,
                unit: 'kg',
                lastPurchaseDate: '2025-01-20',
                lastPurchaseAmount: 420000,
                reorderLevel: 10,
                status: 'sufficient'
              },
              {
                id: 's2',
                name: 'Café Robusta',
                category: 'Café',
                currentStock: 5,
                unit: 'kg',
                lastPurchaseDate: '2025-01-15',
                lastPurchaseAmount: 180000,
                reorderLevel: 8,
                status: 'low'
              },
              {
                id: 's3',
                name: 'Café Orgánico',
                category: 'Café',
                currentStock: 2,
                unit: 'kg',
                lastPurchaseDate: '2025-01-10',
                lastPurchaseAmount: 350000,
                reorderLevel: 5,
                status: 'critical'
              }
            ],
            pendingOrders: [
              {
                id: 'o1',
                orderNumber: 'PO-2025-003',
                items: [
                  { name: 'Café Arábica Premium', quantity: 50, unit: 'kg' },
                  { name: 'Café Orgánico', quantity: 20, unit: 'kg' }
                ],
                orderDate: '2025-01-22',
                expectedDelivery: '2025-01-25',
                totalAmount: 1200000,
                status: 'confirmed',
                notes: 'Entrega en la mañana, contactar a Roberto'
              }
            ]
          };
          setSupplierData(supplierInfo);
          setEditForm({
            contactPersonName: supplierInfo.contactPersonName || '',
            phone: supplierInfo.phone || '',
            email: supplierInfo.email || ''
          });
        } else {
          setError('Token de acceso inválido');
        }
        setLoading(false);
      }, 1000);
    } else {
      setError('Token de acceso requerido');
      setLoading(false);
    }
  }, [token]);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'sufficient': return 'Suficiente';
      case 'low': return 'Bajo';
      case 'critical': return 'Crítico';
      default: return status;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'in_transit': return 'En Tránsito';
      case 'delivered': return 'Entregada';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const handleSaveContact = () => {
    if (!supplierData) return;
    
    // In a real app, this would make an API call to update the supplier's contact info
    const updatedSupplier = {
      ...supplierData,
      contactPersonName: editForm.contactPersonName,
      phone: editForm.phone,
      email: editForm.email
    };
    
    setSupplierData(updatedSupplier);
    setIsEditing(false);
    
    // Show success message
    alert('Información de contacto actualizada exitosamente');
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (supplierData) {
      setEditForm({
        contactPersonName: supplierData.contactPersonName || '',
        phone: supplierData.phone || '',
        email: supplierData.email || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando portal del proveedor...</p>
        </div>
      </div>
    );
  }

  if (error || !supplierData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la información'}</p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta a Muralla Café
          </p>
        </div>
      </div>
    );
  }

  if (!supplierData.portalEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Deshabilitado</h1>
          <p className="text-gray-600">El acceso al portal está temporalmente deshabilitado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-3 rounded-lg mr-4">
                <span className="text-2xl">☕</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
                <p className="text-gray-600">Portal de Proveedores</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">{supplierData.company}</p>
              {supplierData.contactPersonName && (
                <p className="text-sm text-gray-600">Contacto: {supplierData.contactPersonName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-center space-x-6 text-sm">
            <a 
              href={getWhatsAppLink(companyInfo.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-200 transition-colors"
            >
              <span className="mr-2">📱</span>
              WhatsApp: {companyInfo.phone}
            </a>
            <a 
              href={`https://instagram.com/${companyInfo.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-200 transition-colors"
            >
              <span className="mr-2">📷</span>
              Instagram: {companyInfo.instagram}
            </a>
            <a 
              href={`mailto:${companyInfo.email}`}
              className="flex items-center hover:text-blue-200 transition-colors"
            >
              <span className="mr-2">📧</span>
              Email: {companyInfo.email}
            </a>
            <span className="flex items-center">
              <span className="mr-2">📍</span>
              {companyInfo.address}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stock')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 Stock Actual
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Órdenes Pendientes
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 Mi Información
            </button>
          </nav>
        </div>

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Stock Actual de Productos
              </h2>
              <p className="text-gray-600">
                Estado actual del inventario de productos adquiridos de {supplierData.company}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel Reorden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Compra
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierData.currentStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.currentStock} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.reorderLevel} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(item.status)}`}>
                          {getStockStatusText(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.lastPurchaseAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(item.lastPurchaseDate).toLocaleDateString('es-CL')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Órdenes Pendientes
              </h2>
              <p className="text-gray-600">
                Órdenes de compra actuales y su estado de procesamiento
              </p>
            </div>

            {supplierData.pendingOrders.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <span className="text-4xl mb-4 block">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay órdenes pendientes
                </h3>
                <p className="text-gray-600">
                  Actualmente no tienes órdenes pendientes con nosotros
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {supplierData.pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Orden {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Fecha: {new Date(order.orderDate).toLocaleDateString('es-CL')}
                        </p>
                        {order.expectedDelivery && (
                          <p className="text-sm text-gray-600">
                            Entrega esperada: {new Date(order.expectedDelivery).toLocaleDateString('es-CL')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusText(order.status)}
                        </span>
                        <div className="text-lg font-bold text-gray-900 mt-2">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Productos:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-900">{item.name}</span>
                            <span className="text-gray-600">{item.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Notas:</h4>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Información de Contacto
              </h2>
              <p className="text-gray-600">
                Mantén actualizada tu información de contacto para facilitar la comunicación
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Datos de Contacto
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ✏️ Editar
                  </button>
                )}
              </div>

              {!isEditing ? (
                // Display Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Empresa
                    </label>
                    <p className="text-gray-900">{supplierData?.company}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Persona de Contacto
                    </label>
                    <p className="text-gray-900">
                      {supplierData?.contactPersonName || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Teléfono
                    </label>
                    <p className="text-gray-900">
                      {supplierData?.phone || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {supplierData?.email || 'No especificado'}
                    </p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Empresa
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded">
                      {supplierData?.company} <span className="text-gray-500 text-xs">(No editable)</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={editForm.contactPersonName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, contactPersonName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre de la persona de contacto"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@empresa.com"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveContact}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      💾 Guardar Cambios
                    </button>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">💡</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">
                      ¿Por qué actualizar mi información?
                    </h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Facilita la comunicación directa para órdenes urgentes</li>
                        <li>Permite coordinar mejor las entregas y tiempos</li>
                        <li>Mejora la eficiencia en la gestión de pedidos</li>
                        <li>Asegura que recibas notificaciones importantes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm">
              © 2025 {companyInfo.name}. Portal exclusivo para proveedores.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Este portal es privado y confidencial. No compartir el enlace de acceso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPortal;