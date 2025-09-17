import React, { useState } from 'react';
import { contactsService, type Contact, type UpdateContactData } from '../../../services/contactsService';
import { useTranslation } from 'react-i18next';

interface EditContactProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}

const EditContact: React.FC<EditContactProps> = ({ contact, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: contact.name || '',
    type: contact.type as 'supplier' | 'customer' | 'important' | 'brand',
    entityType: contact.entityType as 'business' | 'person',
    phone: contact.phone || '',
    email: contact.email || '',
    instagram: contact.instagram || '',
    rut: contact.rut || '',
    company: contact.company || '',
    address: contact.address || '',
    contactPersonName: contact.contactPersonName || '',
    giro: contact.giro || '',
    notes: contact.notes || '',
    skuAbbreviation: contact.skuAbbreviation || '',
    // Bank details
    bankName: contact.bankDetails?.bankName || '',
    accountType: (contact.bankDetails?.accountType || 'checking') as 'checking' | 'savings' | 'business',
    accountNumber: contact.bankDetails?.accountNumber || '',
    accountHolder: contact.bankDetails?.accountHolder || '',
    rutAccount: contact.bankDetails?.rutAccount || '',
    tags: contact.tags ? contact.tags.join(', ') : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Create update data for the contacts API
      const updateData: UpdateContactData = {
        name: formData.name,
        type: formData.type,
        entityType: formData.entityType,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        instagram: formData.instagram ? 
          (formData.instagram.startsWith('@') ? formData.instagram : `@${formData.instagram}`) : undefined,
        rut: formData.rut || undefined,
        company: formData.company || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        contactPersonName: formData.contactPersonName || undefined,
        giro: formData.giro || undefined,
        skuAbbreviation: formData.skuAbbreviation || undefined,
        bankDetails: (formData.bankName || formData.accountNumber || formData.accountHolder) ? {
          bankName: formData.bankName || undefined,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber || undefined,
          accountHolder: formData.accountHolder || undefined,
          rutAccount: formData.rutAccount || undefined,
        } : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };

      // Update the contact via the contacts API
      const updatedContact = await contactsService.updateContact(contact.id, updateData);
      
      onEdit(updatedContact);
      onClose();
    } catch (error) {
      console.error('Failed to update contact:', error);
      setErrors({ submit: 'Error al actualizar el contacto. Por favor intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setDeleting(true);
    try {
      await contactsService.deleteContact(contact.id);
      onDelete(contact.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setErrors({ delete: 'Error al eliminar el contacto. Por favor intenta de nuevo.' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Editar Contacto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <span className="text-red-400 mr-2">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}

          {errors.delete && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <span className="text-red-400 mr-2">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-300">{errors.delete}</p>
              </div>
            </div>
          )}

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
                placeholder="Nombre completo"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Contacto
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="customer">Cliente</option>
                <option value="supplier">Proveedor</option>
                <option value="brand">Marca</option>
                <option value="important">Contacto Importante</option>
              </select>
            </div>
          </div>

          {/* Entity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Entidad
            </label>
            <select
              name="entityType"
              value={formData.entityType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="person">Persona Natural</option>
              <option value="business">Empresa/Negocio</option>
            </select>
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
                RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.rut ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="12.345.678-9"
              />
              {errors.rut && <p className="mt-1 text-sm text-red-600">{errors.rut}</p>}
            </div>
          </div>

          {/* SKU Abbreviation - Show for suppliers and brands */}
          {(formData.type === 'supplier' || formData.type === 'brand') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Abreviación SKU
                <span className="text-sm text-gray-500 ml-1">(para códigos de productos)</span>
              </label>
              <input
                type="text"
                name="skuAbbreviation"
                value={formData.skuAbbreviation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="ABC (ej: para productos ABC-001, ABC-002)"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">
                Abreviación de 2-10 caracteres para identificar productos de esta marca/proveedor
              </p>
            </div>
          )}

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

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etiquetas
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="vip, cliente-frecuente, descuento (separadas por comas)"
            />
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
              placeholder="Información adicional sobre el contacto..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Delete Button */}
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                🗑️ Eliminar
              </button>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-600 dark:text-red-400">¿Confirmas eliminar este contacto?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs font-medium rounded"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  '✏️ Actualizar Contacto'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContact;