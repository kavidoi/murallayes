import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, BuildingStorefrontIcon, TruckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
  shipsDirectly: boolean;
  defaultShippingCost: number;
  website?: string;
  notes?: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'brand' | 'supplier' | 'brand_supplier';
  isMainContact: boolean;
}

interface BrandManagementProps {
  onClose: () => void;
}

const BrandManagement: React.FC<BrandManagementProps> = ({ onClose }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    filterBrands();
  }, [brands, searchQuery, selectedFilter]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      // Mock data - in production this would be an API call
      const mockBrands: Brand[] = [
        {
          id: '1',
          name: 'Nike',
          code: 'NIKE',
          description: 'Sportswear and athletic equipment brand',
          shipsDirectly: true,
          defaultShippingCost: 15000,
          website: 'https://www.nike.com',
          contacts: [
            {
              id: '1',
              name: 'Juan Pérez',
              email: 'juan@nike.com',
              phone: '+56912345678',
              role: 'brand_supplier',
              isMainContact: true
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Adidas',
          code: 'ADID',
          description: 'Sports clothing and accessories',
          shipsDirectly: false,
          defaultShippingCost: 0,
          contacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setBrands(mockBrands);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
    let filtered = brands;

    if (searchQuery) {
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (selectedFilter) {
      case 'ships_directly':
        filtered = filtered.filter(brand => brand.shipsDirectly);
        break;
      case 'has_contacts':
        filtered = filtered.filter(brand => brand.contacts.length > 0);
        break;
      default:
        break;
    }

    setFilteredBrands(filtered);
  };

  const handleCreateBrand = () => {
    setSelectedBrand(null);
    setShowCreateModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowCreateModal(true);
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta marca?')) {
      setBrands(brands.filter(b => b.id !== brandId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Marcas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra marcas, contactos y costos de envío para productos y órdenes de compra
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cerrar
          </button>
          <button
            onClick={handleCreateBrand}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Marcas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{brands.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Envío Directo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brands.filter(b => b.shipsDirectly).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Contactos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brands.filter(b => b.contacts.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">Todas las marcas</option>
              <option value="ships_directly">Con envío directo</option>
              <option value="has_contacts">Con contactos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {brand.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Código: {brand.code}
                  </p>
                  {brand.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {brand.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Brand Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <TruckIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {brand.shipsDirectly ? `Envío directo: $${brand.defaultShippingCost.toLocaleString()}` : 'Sin envío directo'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {brand.contacts.length} contacto{brand.contacts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Contacts Preview */}
              {brand.contacts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contactos:</h4>
                  {brand.contacts.slice(0, 2).map((contact) => (
                    <div key={contact.id} className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="font-medium">{contact.name}</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {contact.role === 'brand' ? 'Marca' : contact.role === 'supplier' ? 'Proveedor' : 'Marca + Proveedor'}
                      </span>
                      {contact.isMainContact && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">★</span>
                      )}
                    </div>
                  ))}
                  {brand.contacts.length > 2 && (
                    <p className="text-xs text-gray-400">+{brand.contacts.length - 2} más...</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditBrand(brand)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteBrand(brand.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBrands.length === 0 && (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron marcas
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera marca'}
          </p>
          <button
            onClick={handleCreateBrand}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Marca
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <BrandFormModal
          brand={selectedBrand}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedBrand(null);
          }}
          onSave={(brandData) => {
            if (selectedBrand) {
              setBrands(brands.map(b => 
                b.id === selectedBrand.id 
                  ? { ...b, ...brandData, updatedAt: new Date().toISOString() } 
                  : b
              ));
            } else {
              const newBrand: Brand = {
                id: Date.now().toString(),
                name: brandData.name || '',
                code: brandData.code ?? '',
                description: brandData.description,
                shipsDirectly: brandData.shipsDirectly ?? false,
                defaultShippingCost: brandData.defaultShippingCost ?? 0,
                website: brandData.website,
                notes: brandData.notes,
                contacts: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setBrands([...brands, newBrand]);
            }
            setShowCreateModal(false);
            setSelectedBrand(null);
          }}
        />
      )}
    </div>
  );
};

// Brand Form Modal Component
interface BrandFormModalProps {
  brand?: Brand | null;
  onClose: () => void;
  onSave: (brandData: Partial<Brand>) => void;
}

const BrandFormModal: React.FC<BrandFormModalProps> = ({ brand, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    code: brand?.code || '',
    description: brand?.description || '',
    shipsDirectly: brand?.shipsDirectly || false,
    defaultShippingCost: brand?.defaultShippingCost || 0,
    website: brand?.website || '',
    notes: brand?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {brand ? 'Editar Marca' : 'Nueva Marca'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la Marca *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: NIKE, ADID"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.shipsDirectly}
                  onChange={(e) => setFormData({ ...formData, shipsDirectly: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Envía directamente
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Costo de Envío Promedio (CLP)
              </label>
              <input
                type="number"
                value={formData.defaultShippingCost}
                onChange={(e) => setFormData({ ...formData, defaultShippingCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="15000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://www.marca.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {brand ? 'Actualizar' : 'Crear'} Marca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandManagement;
