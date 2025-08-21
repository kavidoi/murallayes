import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AddContact from './AddContact';
import ContactProfile from './ContactProfile';

interface Contact {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'important';
  entityType: 'business' | 'person'; // New field to distinguish business vs person
  phone?: string;
  email?: string;
  instagram?: string;
  rut?: string;
  company?: string;
  address?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  lastContact?: string;
  // Business-specific fields
  contactPersonName?: string; // For businesses: name of the contact person
  giro?: string; // Business activity/industry
  // Analytics data
  totalPurchases?: number;
  totalSales?: number;
  averagePurchase?: number;
  averageSale?: number;
  lastPurchaseAmount?: number;
  lastSaleAmount?: number;
  purchaseCount: number;
  salesCount: number;
  relationshipScore: number; // 1-5 rating
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

const Contactos: React.FC = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'supplier' | 'customer' | 'important'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Café Central S.A.',
        type: 'supplier',
        entityType: 'business',
        phone: '+56987654321',
        email: 'ventas@cafecentral.cl',
        instagram: '@cafecentral',
        rut: '76.123.456-7',
        company: 'Café Central S.A.',
        address: 'Av. Providencia 1234, Santiago',
        contactPersonName: 'Roberto Muñoz',
        giro: 'Comercialización de café y productos gourmet',
        notes: 'Proveedor principal de café arábica premium',
        tags: ['café', 'premium', 'confiable'],
        createdAt: '2024-01-15',
        lastContact: '2025-01-20',
        totalPurchases: 2450000,
        averagePurchase: 350000,
        lastPurchaseAmount: 420000,
        purchaseCount: 7,
        salesCount: 0,
        relationshipScore: 5
      },
      {
        id: '2',
        name: 'María González',
        type: 'customer',
        entityType: 'person',
        phone: '+56912345678',
        email: 'maria.gonzalez@email.com',
        instagram: '@mariagonzalez',
        notes: 'Cliente VIP, prefiere café sin azúcar',
        tags: ['vip', 'frecuente', 'café'],
        createdAt: '2024-02-01',
        lastContact: '2025-01-21',
        totalSales: 350000,
        averageSale: 8500,
        lastSaleAmount: 12000,
        purchaseCount: 0,
        salesCount: 41,
        relationshipScore: 4
      },
      {
        id: '3',
        name: 'TechCorp S.A.',
        type: 'customer',
        entityType: 'business',
        phone: '+56223456789',
        email: 'eventos@techcorp.cl',
        rut: '96.789.123-4',
        company: 'TechCorp S.A.',
        address: 'Las Condes, Santiago',
        contactPersonName: 'Ana Martínez',
        giro: 'Tecnología y servicios digitales',
        notes: 'Cliente corporativo para eventos y catering',
        tags: ['corporativo', 'catering', 'eventos'],
        createdAt: '2024-03-10',
        lastContact: '2025-01-18',
        totalSales: 1250000,
        averageSale: 125000,
        lastSaleAmount: 250000,
        purchaseCount: 0,
        salesCount: 10,
        relationshipScore: 5
      },
      {
        id: '4',
        name: 'Seguridad Edificio',
        type: 'important',
        entityType: 'person',
        phone: '+56987123456',
        notes: 'Contacto de emergencia del edificio',
        tags: ['emergencia', 'edificio'],
        createdAt: '2024-01-01',
        purchaseCount: 0,
        salesCount: 0,
        relationshipScore: 3
      },
      {
        id: '5',
        name: 'Municipalidad de Santiago',
        type: 'important',
        entityType: 'business',
        phone: '+56226927000',
        email: 'contacto@santiago.cl',
        address: 'Plaza de Armas s/n, Santiago',
        contactPersonName: 'Encargado de Permisos',
        giro: 'Administración pública municipal',
        notes: 'Permisos y trámites municipales',
        tags: ['gobierno', 'permisos', 'trámites'],
        createdAt: '2024-01-01',
        purchaseCount: 0,
        salesCount: 0,
        relationshipScore: 3
      },
      {
        id: '6',
        name: 'Lechería del Valle',
        type: 'supplier',
        entityType: 'business',
        phone: '+56945678912',
        email: 'pedidos@lecheriadelvalle.cl',
        rut: '78.456.789-1',
        company: 'Lechería del Valle Ltda.',
        address: 'Camino Rural 456, Melipilla',
        contactPersonName: 'Carlos Jiménez',
        giro: 'Producción y distribución de lácteos',
        notes: 'Proveedor de lácteos frescos',
        tags: ['lácteos', 'frescos', 'diario'],
        createdAt: '2024-01-20',
        lastContact: '2025-01-19',
        totalPurchases: 890000,
        averagePurchase: 85000,
        lastPurchaseAmount: 120000,
        purchaseCount: 12,
        salesCount: 0,
        relationshipScore: 4
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        contactId: '1',
        type: 'purchase',
        amount: 420000,
        description: 'Café Arábica Premium - 50kg',
        date: '2025-01-20',
        status: 'completed',
        reference: 'PO-2025-001'
      },
      {
        id: '2',
        contactId: '2',
        type: 'sale',
        amount: 12000,
        description: 'Café + Pasteles',
        date: '2025-01-21',
        status: 'completed'
      },
      {
        id: '3',
        contactId: '3',
        type: 'sale',
        amount: 250000,
        description: 'Catering Evento Corporativo',
        date: '2025-01-18',
        status: 'completed',
        reference: 'FACT-2025-015'
      }
    ];

    setContacts(mockContacts);
    setFilteredContacts(mockContacts);
    setTransactions(mockTransactions);
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.type === typeFilter);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, typeFilter]);

  const getContactTransactions = (contactId: string) => {
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

  const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
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
              Relación: {getRelationshipStars(contact.relationshipScore)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {contact.type === 'supplier' ? `${contact.purchaseCount} compras` : `${contact.salesCount} ventas`}
            </span>
          </div>
        </div>
      )}

      {contact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contact.tags.map((tag, index) => (
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
      </div>

      {/* Summary Cards */}
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

      {/* Filters and Search */}
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

      {/* Contacts Grid */}
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

      {/* Contact Profile Modal */}
      {selectedContact && (
        <ContactProfile
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={(contact) => {
            // Update contact in the list
            setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
            setSelectedContact(contact);
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddForm && (
        <AddContact
          onClose={() => setShowAddForm(false)}
          onAdd={(contactData) => {
            // Add new contact to the list
            const newContact: Contact = {
              ...contactData,
              id: `contact-${Date.now()}`,
              tags: [],
              createdAt: new Date().toISOString(),
              purchaseCount: 0,
              salesCount: 0,
              relationshipScore: 1,
              totalPurchases: 0,
              totalSales: 0,
              averagePurchase: 0,
              averageSale: 0,
            };
            setContacts(prev => [...prev, newContact]);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Contactos;