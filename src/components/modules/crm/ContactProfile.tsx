import React, { useState, useEffect } from 'react';
import { type Contact } from '../../../services/contactsService';

interface Transaction {
  id: string;
  contactId: string;
  type: 'purchase' | 'sale';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  reference?: string;
}

interface HistoryEntry {
  id: string;
  contactId: string;
  type: 'automated' | 'manual';
  category: 'order' | 'payment' | 'communication' | 'meeting' | 'note' | 'system';
  title: string;
  description: string;
  amount?: number;
  date: string;
  author?: string;
  linkedTransactionId?: string;
  linkedOrderId?: string;
  metadata?: {
    orderNumber?: string;
    paymentMethod?: string;
    meetingType?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

interface ContactProfileProps {
  contact: Contact;
  history: HistoryEntry[];
  onClose: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onAddNote?: (note: string) => void;
}

// Helper functions for history display
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'order': return '📦';
    case 'payment': return '💳';
    case 'communication': return '📞';
    case 'meeting': return '🤝';
    case 'note': return '📝';
    case 'system': return '⚙️';
    default: return '📄';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'order': return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
    case 'payment': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
    case 'communication': return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
    case 'meeting': return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
    case 'note': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
    case 'system': return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
  }
};

const ContactProfile: React.FC<ContactProfileProps> = ({ contact, history, onClose, onEdit, onDelete, onAddNote }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'transactions' | 'analytics' | 'history'>('info');
  const [_newNote, _setNewNote] = useState('');

  useEffect(() => {
    // Mock transaction data - replace with actual API call
    const mockTransactions: Transaction[] = [
      // Sample transactions for the contact
      {
        id: '1',
        contactId: contact.id,
        type: contact.type === 'supplier' ? 'purchase' : 'sale',
        amount: contact.lastPurchaseAmount || contact.lastSaleAmount || 100000,
        description: 'Transacción más reciente',
        date: '2025-01-21',
        status: 'completed',
        reference: 'REF-001'
      },
      {
        id: '2',
        contactId: contact.id,
        type: contact.type === 'supplier' ? 'purchase' : 'sale',
        amount: 80000,
        description: 'Transacción anterior',
        date: '2025-01-15',
        status: 'completed',
        reference: 'REF-002'
      },
      {
        id: '3',
        contactId: contact.id,
        type: contact.type === 'supplier' ? 'purchase' : 'sale',
        amount: 120000,
        description: 'Orden pendiente',
        date: '2025-01-25',
        status: 'pending',
        reference: 'REF-003'
      }
    ];
    setTransactions(mockTransactions);
  }, [contact]);

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'important': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'supplier': return 'Proveedor';
      case 'customer': return 'Cliente';
      case 'important': return 'Importante';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRelationshipStars = (score: number) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                {contact.type === 'supplier' ? '🏢' : contact.type === 'customer' ? '👤' : '⭐'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contact.name}
                </h2>
                {contact.company && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">{contact.company}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(contact.type)}`}>
                    {getTypeText(contact.type)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Relación: {getRelationshipStars(contact.relationshipScore || 1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {contact.phone && (
                <a
                  href={getWhatsAppLink(contact.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                >
                  📱 WhatsApp
                </a>
              )}
              <button
                onClick={() => onEdit?.(contact)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
              >
                ✏️ Editar
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar el contacto "${contact.name}"?`)) {
                      onDelete(contact.id);
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                >
                  🗑️ Eliminar
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl px-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', label: 'Información', icon: '📋' },
              { id: 'transactions', label: 'Transacciones', icon: '💰' },
              { id: 'history', label: 'Historial', icon: '📝' },
              { id: 'analytics', label: 'Analítica', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información de Contacto
                </h3>
                <div className="space-y-4">
                  {contact.phone && (
                    <div className="flex items-center">
                      <span className="w-8 text-gray-400">📞</span>
                      <span className="text-gray-900 dark:text-white">{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center">
                      <span className="w-8 text-gray-400">📧</span>
                      <a 
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.instagram && (
                    <div className="flex items-center">
                      <span className="w-8 text-gray-400">📷</span>
                      <a 
                        href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {contact.instagram}
                      </a>
                    </div>
                  )}
                  {contact.rut && (
                    <div className="flex items-center">
                      <span className="w-8 text-gray-400">🆔</span>
                      <span className="text-gray-900 dark:text-white">{contact.rut}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start">
                      <span className="w-8 text-gray-400 mt-1">📍</span>
                      <span className="text-gray-900 dark:text-white">{contact.address}</span>
                    </div>
                  )}
                  
                  {/* Business-specific fields */}
                  {contact.entityType === 'business' && (
                    <>
                      {contact.contactPersonName && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">👤</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Contacto: </span>
                            {contact.contactPersonName}
                          </span>
                        </div>
                      )}
                      {contact.giro && (
                        <div className="flex items-start">
                          <span className="w-8 text-gray-400 mt-1">🏢</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Giro: </span>
                            {contact.giro}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Entity Type Badge */}
                  <div className="flex items-center">
                    <span className="w-8 text-gray-400">🏷️</span>
                    <span className="text-gray-900 dark:text-white">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tipo: </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contact.entityType === 'business' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {contact.entityType === 'business' ? 'Empresa' : 'Persona'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Bank Details Section */}
                {contact.bankDetails && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Datos Bancarios
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                      {contact.bankDetails.bankName && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">🏦</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Banco: </span>
                            {contact.bankDetails.bankName}
                          </span>
                        </div>
                      )}
                      {contact.bankDetails.accountType && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">💳</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Tipo: </span>
                            {contact.bankDetails.accountType === 'checking' ? 'Cuenta Corriente' :
                             contact.bankDetails.accountType === 'savings' ? 'Cuenta de Ahorros' : 'Cuenta Empresa'}
                          </span>
                        </div>
                      )}
                      {contact.bankDetails.accountNumber && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">🔢</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Número: </span>
                            {contact.bankDetails.accountNumber}
                          </span>
                        </div>
                      )}
                      {contact.bankDetails.accountHolder && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">👤</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Titular: </span>
                            {contact.bankDetails.accountHolder}
                          </span>
                        </div>
                      )}
                      {contact.bankDetails.rutAccount && (
                        <div className="flex items-center">
                          <span className="w-8 text-gray-400">🆔</span>
                          <span className="text-gray-900 dark:text-white">
                            <span className="text-sm text-gray-500 dark:text-gray-400">RUT Titular: </span>
                            {contact.bankDetails.rutAccount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stock section disabled - currentStock not in Contact model */}
                {false && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Stock Actual (0 productos)
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Estado del Portal:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.portalEnabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {contact.portalEnabled ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supplier Portal Section */}
                {false && contact.type === 'supplier' && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Stock Actual (0 productos)
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Estado del Portal:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.portalEnabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {contact.portalEnabled ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </div>
                      
                      {contact.portalToken && contact.portalEnabled && (
                        <>
                          <div className="flex items-start">
                            <span className="w-8 text-gray-400">🔗</span>
                            <div className="flex-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Enlace de Acceso: </span>
                              <div className="mt-1">
                                <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">
                                  admin.murallacafe.cl/supplier-portal/{contact.portalToken}
                                </code>
                                <button
                                  onClick={() => {
                                    const url = `${window.location.origin}/supplier-portal/${contact.portalToken}`;
                                    navigator.clipboard.writeText(url);
                                    alert('Enlace copiado al portapapeles');
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-700 text-xs"
                                >
                                  📋 Copiar
                                </button>
                                <a
                                  href={`/supplier-portal/${contact.portalToken}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-700 text-xs"
                                >
                                  🔗 Abrir
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          {/* Stock info disabled - currentStock not in Contact model */}
                          
                          {/* Pending orders disabled - pendingOrders not in Contact model */}
                        </>
                      )}
                      
                      {!contact.portalToken && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => {
                              const token = Math.random().toString(36).substring(2, 15);
                              alert(`Token generado: ${token}\nEsto debería integrarse con el backend para guardar el token.`);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
                          >
                            🔑 Generar Acceso al Portal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {contact.notes && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                      Notas
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {contact.notes}
                    </p>
                  </div>
                )}

                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen Rápido
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Miembro desde</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(contact.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                  
                  {contact.lastContact && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Último contacto</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(contact.lastContact).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </div>
                  )}

                  {contact.type === 'supplier' && (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 dark:text-blue-400">Total compras</span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">
                            {formatCurrency(contact.totalPurchases || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 dark:text-blue-400">Compra promedio</span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">
                            {formatCurrency(contact.averagePurchase || 0)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {contact.type === 'customer' && (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 dark:text-green-400">Total ventas</span>
                          <span className="font-bold text-green-800 dark:text-green-200">
                            {formatCurrency(contact.totalSales || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 dark:text-green-400">Venta promedio</span>
                          <span className="font-bold text-green-800 dark:text-green-200">
                            {formatCurrency(contact.averageSale || 0)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historial de Transacciones
                </h3>
                <button className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
                  ➕ Nueva Transacción
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Referencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(transaction.date).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'purchase' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'purchase' ? 'Compra' : 'Venta'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {getStatusText(transaction.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Análisis de Relación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contact.type === 'supplier' && (
                  <>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Frecuencia de Compra
                      </h4>
                      <p className="text-2xl font-semibold text-blue-600">
                        {contact.purchaseCount || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ~{Math.round((contact.purchaseCount || 0) / 12)} por mes
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Última Compra
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(contact.lastPurchaseAmount || 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.lastContact && new Date(contact.lastContact).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </>
                )}
                
                {contact.type === 'customer' && (
                  <>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Frecuencia de Compra
                      </h4>
                      <p className="text-2xl font-semibold text-green-600">
                        {contact.salesCount || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ~{Math.round((contact.salesCount || 0) / 12)} por mes
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Última Venta
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(contact.lastSaleAmount || 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.lastContact && new Date(contact.lastContact).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Calidad de Relación
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getRelationshipStars(contact.relationshipScore || 1)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contact.relationshipScore}/5 estrellas
                  </p>
                </div>
              </div>

              {/* Additional analytics could go here */}
              <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  📊 Análisis Avanzado (Próximamente)
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  • Tendencias de compra/venta por período<br/>
                  • Análisis de patrones estacionales<br/>
                  • Predicción de próximas compras<br/>
                  • Comparación con otros contactos similares
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historial de Actividad
                </h3>
                {onAddNote && (
                  <button
                    onClick={() => {
                      const note = prompt('Agregar nota:');
                      if (note && note.trim()) {
                        onAddNote(note.trim());
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ➕ Agregar Nota
                  </button>
                )}
              </div>

              {/* History Timeline */}
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">📝</span>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Sin historial
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      No hay actividades registradas para este contacto
                    </p>
                  </div>
                ) : (
                  history
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="bg-white dark:bg-gray-700 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${getCategoryColor(entry.category)}`}>
                              <span className="text-sm">{getCategoryIcon(entry.category)}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {entry.title}
                                </h4>
                                {entry.type === 'automated' && (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                                    🤖 Automático
                                  </span>
                                )}
                                {entry.metadata?.urgency && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    entry.metadata.urgency === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                    entry.metadata.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                  }`}>
                                    {entry.metadata.urgency === 'high' ? '🔴' : entry.metadata.urgency === 'medium' ? '🟡' : '🟢'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {entry.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>📅 {new Date(entry.date).toLocaleString('es-CL')}</span>
                                {entry.author && <span>👤 {entry.author}</span>}
                                {entry.amount && (
                                  <span className="font-medium">💰 {formatCurrency(entry.amount)}</span>
                                )}
                                {entry.metadata?.orderNumber && (
                                  <span>📄 {entry.metadata.orderNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactProfile;