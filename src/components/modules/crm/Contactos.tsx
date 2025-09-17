import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AddContact from './AddContact';
import EditContact from './EditContact';
import ContactProfile from './ContactProfile';
import { contactsService, type Contact as ContactType } from '../../../services/contactsService';

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
  author?: string; // For manual entries
  linkedTransactionId?: string; // Link to related transaction
  linkedOrderId?: string; // Link to related order
  metadata?: {
    orderNumber?: string;
    paymentMethod?: string;
    meetingType?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

const Contactos: React.FC = () => {
  const _t = useTranslation();
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'supplier' | 'customer' | 'important' | 'brand'>('all');
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data from API
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch contacts from the general contacts API
        const allContacts = await contactsService.getAllContacts();
        
        setContacts(allContacts);
        setFilteredContacts(allContacts);
        
        // For now, use empty arrays for transactions and history since we don't have that data
        setTransactions([]);
        setHistory([]);
        
      } catch (err) {
        console.error('Failed to load contacts:', err);
        setError('Failed to load contacts. Please try again.');
        // Keep empty state on error
        setContacts([]);
        setFilteredContacts([]);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.type === typeFilter);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, typeFilter]);

  const _getContactTransactions = (contactId: string) => {
    return transactions.filter(t => t.contactId === contactId);
  };

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
      case 'brand': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'supplier': return 'Proveedor';
      case 'customer': return 'Cliente';
      case 'important': return 'Importante';
      case 'brand': return 'Marca';
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

  const ContactCard: React.FC<{ contact: ContactType }> = ({ contact }) => (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedContact(contact)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {contact.name}
          </h3>
          {contact.company && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{contact.company}</p>
          )}
          {/* Business-specific info */}
          {contact.entityType === 'business' && contact.contactPersonName && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              👤 {contact.contactPersonName}
            </p>
          )}
          {contact.entityType === 'business' && contact.giro && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              🏢 {contact.giro}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(contact.type)}`}>
              {getTypeText(contact.type)}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              contact.entityType === 'business' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            }`}>
              {contact.entityType === 'business' ? '🏢' : '👤'}
            </span>
          </div>
          {contact.phone && (
            <a
              href={getWhatsAppLink(contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
              onClick={(e) => e.stopPropagation()}
            >
              📱
            </a>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {contact.phone && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-5">📞</span>
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-5">📧</span>
            <span>{contact.email}</span>
          </div>
        )}
        {contact.instagram && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-5">📷</span>
            <span>{contact.instagram}</span>
          </div>
        )}
        {contact.rut && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-5">🆔</span>
            <span>{contact.rut}</span>
          </div>
        )}
      </div>

      {(contact.type === 'supplier' || contact.type === 'customer') && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {contact.type === 'supplier' && contact.totalPurchases && (
              <>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Compras</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(contact.totalPurchases)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Promedio</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(contact.averagePurchase || 0)}
                  </p>
                </div>
              </>
            )}
            {contact.type === 'customer' && contact.totalSales && (
              <>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Ventas</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(contact.totalSales)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Promedio</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(contact.averageSale || 0)}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Relación: {getRelationshipStars(contact.relationshipScore || 1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {contact.type === 'supplier' ? `${contact.purchaseCount || 0} compras` : `${contact.salesCount || 0} ventas`}
            </span>
          </div>
        </div>
      )}

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contact.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Contactos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Proveedores, clientes y contactos importantes
        </p>
        
        {/* Loading State */}
        {loading && (
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Cargando contactos...
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <span className="text-red-400 mr-2">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-sm text-red-600 dark:text-red-400 underline mt-2 hover:text-red-500"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Proveedores</h3>
              <p className="text-2xl font-semibold text-blue-600">
                {contacts.filter(c => c.type === 'supplier').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Clientes</h3>
              <p className="text-2xl font-semibold text-green-600">
                {contacts.filter(c => c.type === 'customer').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <span className="text-2xl">🏷️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Marcas</h3>
              <p className="text-2xl font-semibold text-orange-600">
                {contacts.filter(c => c.type === 'brand').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Importantes</h3>
              <p className="text-2xl font-semibold text-purple-600">
                {contacts.filter(c => c.type === 'important').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {contacts.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Filters and Search */}
      {!loading && !error && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Contacto
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, empresa, email o etiquetas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Contacto
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="supplier">Proveedores</option>
              <option value="customer">Clientes</option>
              <option value="brand">Marcas</option>
              <option value="important">Importantes</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ➕ Agregar Contacto
          </button>
        </div>
      </div>
      )}

      {/* Contacts Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📞</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron contactos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ajusta los filtros o agrega tu primer contacto
              </p>
            </div>
          )}
        </>
      )}

      {/* Contact Profile Modal */}
      {selectedContact && (
        <ContactProfile
          contact={selectedContact}
          history={history.filter(h => h.contactId === selectedContact.id)}
          onClose={() => setSelectedContact(null)}
          onEdit={(contact) => {
            // Close profile and open edit modal
            setSelectedContact(null);
            setEditingContact(contact);
          }}
          onDelete={(contactId) => {
            // Remove contact from the list and close profile
            setContacts(prev => prev.filter(c => c.id !== contactId));
            setSelectedContact(null);
          }}
          onAddNote={(note) => {
            // Add new history entry
            const newHistoryEntry: HistoryEntry = {
              id: `h-${Date.now()}`,
              contactId: selectedContact.id,
              type: 'manual',
              category: 'note',
              title: 'Nota agregada',
              description: note,
              date: new Date().toISOString(),
              author: 'Usuario', // In real app, get from auth context
            };
            setHistory(prev => [...prev, newHistoryEntry]);
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddForm && (
        <AddContact
          onClose={() => setShowAddForm(false)}
          onAdd={(contactData) => {
            // Add the new contact directly from the API response
            setContacts(prev => [...prev, contactData]);
            setShowAddForm(false);
          }}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContact
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onEdit={(updatedContact) => {
            // Update contact in the list
            setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
            setEditingContact(null);
          }}
          onDelete={(contactId) => {
            // Remove contact from the list
            setContacts(prev => prev.filter(c => c.id !== contactId));
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
};

export default Contactos;