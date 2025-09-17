import React, { useState } from 'react';

interface Supplier {
  id: string;
  internalNumber?: string; // Auto-generated: SUPP-001, SUPP-002, etc.
  name: string;
  vendorType: 'SUPPLIER' | 'BRAND_CONTACT' | 'AGENT';
  taxId?: string; // RUT - optional since not always available
  phone?: string;
  email?: string;
  address?: string;
  contactName?: string;
  paymentTerms?: string;
  isActive?: boolean;
  brandContactId?: string; // Link to brand contact if this vendor is a brand
  
  // Legacy fields for backward compatibility
  type?: 'supplier';
  entityType?: 'business' | 'person';
  instagram?: string;
  rut?: string;
  company?: string;
  notes?: string;
  contactPersonName?: string;
  giro?: string;
  bankDetails?: {
    bankName?: string;
    accountType?: 'checking' | 'savings' | 'business';
    accountNumber?: string;
    accountHolder?: string;
    rutAccount?: string;
  };
}

interface BrandContact {
  id: string;
  brandId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  brand: {
    id: string;
    name: string;
  };
}

interface SupplierFormProps {
  onClose: () => void;
  onAdd: (supplier: Omit<Supplier, 'id'>) => void;
  brandContacts?: BrandContact[];
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onClose, onAdd, brandContacts = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    vendorType: 'SUPPLIER' as 'SUPPLIER' | 'BRAND_CONTACT' | 'AGENT',
    taxId: '', // RUT field
    phone: '',
    email: '',
    address: '',
    contactName: '',
    paymentTerms: '',
    brandContactId: '',
    
    // Legacy fields for backward compatibility
    type: 'supplier' as const,
    entityType: 'business' as 'business' | 'person',
    instagram: '',
    rut: '',
    company: '',
    contactPersonName: '',
    giro: '',
    notes: '',
    // Bank details
    bankName: '',
    accountType: 'checking' as 'checking' | 'savings' | 'business',
    accountNumber: '',
    accountHolder: '',
    rutAccount: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validate email format if provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validate RUT format if provided (basic Chilean RUT validation)
    if (formData.taxId && !/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(formData.taxId)) {
      newErrors.taxId = 'Formato de RUT inválido (ej: 12.345.678-9)';
    }
    
    // Legacy RUT validation for backward compatibility
    if (formData.rut && !/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(formData.rut)) {
      newErrors.rut = 'Formato de RUT inválido (ej: 12.345.678-9)';
    }

    // Validate phone format if provided
    if (formData.phone && !/^\+?[\d\s\-\(\)]{8,15}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    // Validate Instagram handle if provided
    if (formData.instagram && !/^@?[\w\._]{1,30}$/.test(formData.instagram)) {
      newErrors.instagram = 'Formato de Instagram inválido (ej: @usuario)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up Instagram handle
    const cleanedInstagram = formData.instagram ? 
      (formData.instagram.startsWith('@') ? formData.instagram : `@${formData.instagram}`) : '';

    // Prepare bank details if any field is filled
    const bankDetails = (formData.bankName || formData.accountNumber || formData.accountHolder) ? {
      bankName: formData.bankName || undefined,
      accountType: formData.accountType,
      accountNumber: formData.accountNumber || undefined,
      accountHolder: formData.accountHolder || undefined,
      rutAccount: formData.rutAccount || undefined,
    } : undefined;

    const supplierData = {
      name: formData.name,
      vendorType: formData.vendorType,
      taxId: formData.taxId || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      contactName: formData.contactName || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      brandContactId: formData.brandContactId || undefined,
      
      // Legacy fields for backward compatibility
      type: formData.type,
      entityType: formData.entityType,
      instagram: cleanedInstagram || undefined,
      rut: formData.rut || formData.taxId || undefined, // Map taxId to rut for compatibility
      company: formData.company || undefined,
      contactPersonName: formData.contactPersonName || formData.contactName || undefined,
      giro: formData.giro || undefined,
      bankDetails,
      notes: formData.notes || undefined,
    };

    onAdd(supplierData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Agregar Nuevo Proveedor
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Sistema mejorado con numeración interna automática
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nombre del proveedor"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Proveedor
              </label>
              <select
                name="vendorType"
                value={formData.vendorType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="SUPPLIER">Proveedor Regular</option>
                <option value="BRAND_CONTACT">Contacto de Marca</option>
                <option value="AGENT">Agente</option>
              </select>
            </div>
          </div>
          
          {/* Show internal number info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📋 <strong>Número Interno:</strong> Se asignará automáticamente (ej: SUPP-001)
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="+56 9 1234 5678"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RUT (Opcional)
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.taxId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="12.345.678-9"
              />
              {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Opcional - no siempre disponible
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre del contacto principal"
              />
            </div>
          </div>
          
          {/* Brand Contact Selection */}
          {formData.vendorType === 'BRAND_CONTACT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contacto de Marca
              </label>
              <select
                name="brandContactId"
                value={formData.brandContactId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar contacto de marca...</option>
                {brandContacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.brand.name} - {contact.name} {contact.isPrimary ? '(Principal)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Términos de Pago
            </label>
            <input
              type="text"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="ej: 30 días, Contado, etc."
            />
          </div>
          
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Dirección del proveedor"
            />
          </div>
          
          {/* Legacy fields section - collapsible */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Campos Adicionales (Opcional)</span>
                <span className="ml-2 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.instagram ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="@usuario"
                    />
                    {errors.instagram && <p className="mt-1 text-sm text-red-600">{errors.instagram}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Entidad (Legacy)
                    </label>
                    <select
                      name="entityType"
                      value={formData.entityType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="business">Empresa/Negocio</option>
                      <option value="person">Persona Natural</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Conditional Fields based on Entity Type */}
          {formData.entityType === 'business' ? (
            <>
              {/* Business Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Razón social de la empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nombre del contacto en la empresa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Dirección de la empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giro/Actividad
                  </label>
                  <input
                    type="text"
                    name="giro"
                    value={formData.giro}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Actividad comercial de la empresa"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Person Fields */
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empresa (Opcional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Empresa donde trabaja (opcional)"
              />
            </div>
          )}

          {/* Bank Details Section */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Datos Bancarios (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nombre del banco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorros</option>
                  <option value="business">Cuenta Empresa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="000-1234567-89"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nombre del titular"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RUT del Titular
              </label>
              <input
                type="text"
                name="rutAccount"
                value={formData.rutAccount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="12.345.678-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Información adicional sobre el proveedor..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
