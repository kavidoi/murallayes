import React, { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, DocumentTextIcon, BuildingOfficeIcon, TrashIcon, PencilIcon, EyeIcon, TagIcon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline'
// import { motion, AnimatePresence } from 'framer-motion' // Commented out as unused
import { useTranslation } from 'react-i18next'
import { formatCLP, formatCurrency as formatCurrencyInput, parseCurrency } from '../../../utils/formatUtils';
import { PurchaseOrdersService, type CostDTO } from '../../../services/purchaseOrdersService';
import AddContact from '../crm/AddContact';
import { ExpenseEditModal } from './ExpenseEditModal';
import { EditingIndicator } from '../../common/EditingIndicator';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import MentionInput, { type EntityMention } from '../../universal/MentionInput';
import RelationshipManager, { type EntityRelationship } from '../../universal/RelationshipManager';
import { DevLoginModal } from '../../common/DevLoginModal';
import { AuthService } from '../../../services/authService';

interface ExpenseCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface ExpenseStatus {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface DirectExpense {
  id: string;
  fecha: Date;
  proveedor: string;
  documento: string;
  descripcion: string;
  total: number;
  currency: string;
  categoryId: string;
  statusId: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  documentType: string;
  documentNumber?: string;
  thirdPartyDocType?: 'FACTURA' | 'BOLETA' | 'NONE';
  thirdPartyDocNumber?: string;
  notes?: string;
  attachments?: Array<{
    id?: string;
    fileName?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }>;
  type: 'DIRECT';
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyExpense {
  id: string;
  fecha: Date;
  proveedor: string;
  documento: string;
  descripcion: string;
  total: number;
  currency: string;
  companyName?: string;
  status?: string;
  originalPurchaseOrder?: CostDTO;
  type: 'PURCHASE_ORDER';
}

interface ExpenseFormData {
  proveedor: string;
  descripcion: string;
  total: number;
  fecha: string;
  categoryId: string;
  statusId: string;
  documentType: string;
  documentNumber: string;
  thirdPartyDocType: 'FACTURA' | 'BOLETA' | 'NONE';
  thirdPartyDocNumber: string;
  notes: string;
  receiptFile?: File;
}

const Gastos: React.FC = () => {
  const { t } = useTranslation();
  const { isUserEditing, getEditingUsers } = useWebSocket();
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [directExpenses, setDirectExpenses] = useState<DirectExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [statuses, setStatuses] = useState<ExpenseStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string; email?: string; phone?: string}>>([]);
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  
  // Universal Relationship System state
  const [supplierMentions, setSupplierMentions] = useState<EntityMention[]>([]);
  const [descriptionMentions, setDescriptionMentions] = useState<EntityMention[]>([]);
  const [expenseRelationships, setExpenseRelationships] = useState<EntityRelationship[]>([]);
  
  // Authentication state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Real-time collaboration state
  const [editingExpense, setEditingExpense] = useState<DirectExpense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Helper function to get local date string without timezone issues
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    proveedor: '',
    descripcion: '',
    total: 0,
    fecha: getLocalDateString(),
    categoryId: '',
    statusId: '',
    documentType: 'FACTURA',
    documentNumber: '',
    thirdPartyDocType: 'NONE',
    thirdPartyDocNumber: '',
    notes: '',
    receiptFile: undefined
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#64748B');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Predefined colors for categories
  const categoryColors = [
    '#3B82F6', '#F59E0B', '#06B6D4', '#8B5CF6', '#10B981', 
    '#F97316', '#84CC16', '#6B7280', '#EF4444', '#64748B',
    '#EC4899', '#14B8A6', '#F472B6', '#8B5A2B', '#92400E'
  ];

  // Popular emojis for categories
  const popularEmojis = [
    '🏠', '💡', '💧', '🌐', '📱', '🪑', '🧽', '🔧', '🛡️', '📋',
    '🚗', '⛽', '🍕', '🛒', '💳', '🏥', '📚', '🎭', '✈️', '🎯',
    '💰', '📊', '🎨', '🔥', '❄️', '🎵', '📺', '☕', '🥕', '🧾'
  ];

  // Default expense statuses
  const defaultStatuses: ExpenseStatus[] = [
    { id: '1', name: 'Por Pagar', color: '#F59E0B', isDefault: true },
    { id: '2', name: 'Pagado', color: '#10B981', isDefault: true },
    { id: '3', name: 'Cancelado', color: '#EF4444', isDefault: true }
  ];

  // Default suppliers
  const defaultSuppliers = [
    { id: '1', name: 'Empresa Eléctrica', email: 'facturacion@electrica.cl', phone: '+56 9 1234 5678' },
    { id: '2', name: 'Aguas del Sur', email: 'contacto@aguasdelsur.cl', phone: '+56 2 2345 6789' },
    { id: '3', name: 'Internet Fibra', email: 'ventas@internetfibra.cl', phone: '+56 9 8765 4321' },
    { id: '4', name: 'Supermercado Central', email: 'proveedores@supermercado.cl', phone: '+56 2 3456 7890' },
    { id: '5', name: 'Ferretería Los Andes', email: 'ventas@ferreterialosandes.cl', phone: '+56 9 5555 4444' }
  ];

  // Predefined expense categories
  const defaultCategories: ExpenseCategory[] = [
    { id: '1', name: 'Arriendo', emoji: '🏠', color: '#3B82F6', isActive: true },
    { id: '2', name: 'Cuenta Luz', emoji: '💡', color: '#F59E0B', isActive: true },
    { id: '3', name: 'Cuenta Agua', emoji: '💧', color: '#06B6D4', isActive: true },
    { id: '4', name: 'Cuenta Internet', emoji: '🌐', color: '#8B5CF6', isActive: true },
    { id: '5', name: 'Electrodomésticos', emoji: '📱', color: '#10B981', isActive: true },
    { id: '6', name: 'Muebles', emoji: '🪑', color: '#F97316', isActive: true },
    { id: '7', name: 'Artículos Limpieza', emoji: '🧽', color: '#84CC16', isActive: true },
    { id: '8', name: 'Mantenimiento', emoji: '🔧', color: '#6B7280', isActive: true },
    { id: '9', name: 'Seguros', emoji: '🛡️', color: '#EF4444', isActive: true },
    { id: '10', name: 'Otros Gastos', emoji: '📋', color: '#64748B', isActive: true }
  ];

  const loadExpenses = async () => {
    setLoading(true);
    try {
      // Fetch purchase orders and convert them to company expenses
      const purchaseOrders = await PurchaseOrdersService.list({ take: 100 });
      
      const mappedExpenses: CompanyExpense[] = (purchaseOrders || []).map((po: CostDTO) => ({
        id: po.id,
        fecha: new Date(po.date),
        proveedor: po.vendor?.name || po.description?.split(' - ')[0] || 'Sin proveedor',
        documento: `${po.docType}${po.docNumber ? ` ${po.docNumber}` : ''}`,
        descripcion: po.description || 'Sin descripción',
        total: typeof po.total === 'string' ? Number(po.total) : (po.total as number),
        currency: po.currency || 'CLP',
        companyName: po.company?.name,
        status: po.status,
        originalPurchaseOrder: po,
        type: 'PURCHASE_ORDER' as const
      }));

      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Error loading company expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    setCategories(defaultCategories);
    setStatuses(defaultStatuses);
    setSuppliers(defaultSuppliers);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isDropdownClick = target.closest('[data-provider-dropdown]');
      if (!isDropdownClick && showProviderDropdown) {
        setShowProviderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProviderDropdown]);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    // Try to create the expense again after authentication
    handleCreateExpense();
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(providerSearchTerm.toLowerCase())
  );

  const [selectedExpense, setSelectedExpense] = useState<CompanyExpense | DirectExpense | null>(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  const handleViewDetails = (expense: CompanyExpense) => {
    // Check if this is a direct expense or a purchase order
    const directExpense = directExpenses.find(de => de.id === expense.id);
    
    if (directExpense) {
      // Show details modal for direct expenses
      setSelectedExpense(directExpense);
      setShowExpenseDetails(true);
    } else if (expense.originalPurchaseOrder) {
      // Open purchase order details in a new tab for company expenses
      const url = `/operations/purchase-orders?id=${expense.id}`;
      window.open(url, '_blank');
    } else {
      // Fallback: show expense details in modal
      setSelectedExpense(expense);
      setShowExpenseDetails(true);
    }
  };

  const handleEditExpense = (expense: CompanyExpense) => {
    // Only allow editing direct expenses for now
    const directExpense = directExpenses.find(de => de.id === expense.id);
    if (directExpense) {
      setEditingExpense(directExpense);
      setShowEditModal(true);
    }
  };

  const handleSaveExpense = async (updatedExpense: DirectExpense) => {
    try {
      // TODO: Integrate with backend API to save expense
      setDirectExpenses(prev => 
        prev.map(expense => 
          expense.id === updatedExpense.id ? updatedExpense : expense
        )
      );
    } catch (error) {
      console.error('Error saving expense:', error);
      throw error;
    }
  };

  const companies = Array.from(new Set(expenses.map(e => e.companyName).filter(Boolean)));

  // Helper function to parse date without timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Supplier management handlers
  const handleSelectSupplier = (supplier: {id: string; name: string; email?: string; phone?: string}) => {
    setExpenseFormData(prev => ({ ...prev, proveedor: supplier.name }));
    setProviderSearchTerm(supplier.name);
    setShowProviderDropdown(false);
  };

  const handleProviderInputChange = (value: string) => {
    setProviderSearchTerm(value);
    setExpenseFormData(prev => ({ ...prev, proveedor: value }));
    setShowProviderDropdown(value.length > 0);
  };

  const handleCreateSupplier = () => {
    setShowAddContact(true);
    setShowProviderDropdown(false);
  };

  const handleContactCreated = (contact: any) => {
    // Add the new contact as a supplier
    const newSupplier = {
      id: Date.now().toString(),
      name: contact.name || `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email,
      phone: contact.phone
    };
    
    setSuppliers(prev => [...prev, newSupplier]);
    
    // Set the new supplier as the selected provider
    setExpenseFormData(prev => ({ ...prev, proveedor: newSupplier.name }));
    setProviderSearchTerm(newSupplier.name);
    
    setShowAddContact(false);
  };

  // Expense creation handlers
  const handleCreateExpense = async () => {
    try {
      setLoading(true);
      // Upload receipt file if provided
      let attachments: any[] = [];
      if (expenseFormData.receiptFile) {
        try {
          const uploadResult = await PurchaseOrdersService.uploadReceipt(expenseFormData.receiptFile);
          if (uploadResult?.fileUrl) {
            attachments.push({
              fileName: expenseFormData.receiptFile.name,
              fileUrl: uploadResult.fileUrl,
              fileType: expenseFormData.receiptFile.type,
              fileSize: expenseFormData.receiptFile.size
            });
          }
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError);
          // Continue with expense creation even if file upload fails
        }
      }

      // Create expense data for backend API
      const expenseData: Partial<CostDTO> = {
        companyId: 'default-company', // Required field
        docType: expenseFormData.thirdPartyDocType || 'NONE',
        docNumber: expenseFormData.thirdPartyDocNumber || null,
        date: expenseFormData.fecha,
        total: expenseFormData.total,
        currency: 'CLP',
        payerType: 'COMPANY',
        payerCompanyId: 'default-company', // Required for COMPANY payer type
        description: expenseFormData.descripcion,
        categoryId: expenseFormData.categoryId || undefined,
        status: 'PENDING',
        attachments: attachments,
        lines: [{
          description: expenseFormData.descripcion,
          totalCost: expenseFormData.total,
          isInventory: false
        }]
      };

      let savedExpense: any;
      let isFromBackend = false;
      
      try {
        // Try to save to backend
        savedExpense = await PurchaseOrdersService.create(expenseData);
        isFromBackend = true;
        console.log('✅ Expense saved to backend:', savedExpense);
      } catch (error: any) {
        // If authentication fails or other backend error, create mock data for demo
        console.log('⚠️ Backend save failed (likely auth issue), using demo mode:', error.message);
        
        // Create mock backend response for demo purposes
        savedExpense = {
          id: `demo_${Date.now()}`,
          date: expenseFormData.fecha,
          total: expenseFormData.total,
          currency: 'CLP',
          description: expenseFormData.descripcion,
          vendor: { name: expenseFormData.proveedor },
          docType: expenseFormData.thirdPartyDocType || 'NONE',
          docNumber: expenseFormData.thirdPartyDocNumber,
          categoryId: expenseFormData.categoryId,
          companyId: 'default-company'
        };
        
        // Show user-friendly message
        // Show login modal instead of alert
        setShowLoginModal(true);
      }
      
      // Convert backend/demo response to local format for immediate UI update
      const newExpense: DirectExpense = {
        id: savedExpense.id,
        fecha: new Date(savedExpense.date),
        proveedor: savedExpense.vendor?.name || expenseFormData.proveedor,
        documento: `${savedExpense.docType}${savedExpense.docNumber ? ` ${savedExpense.docNumber}` : ''}`,
        descripcion: savedExpense.description || expenseFormData.descripcion,
        total: savedExpense.total,
        currency: savedExpense.currency,
        categoryId: savedExpense.categoryId || expenseFormData.categoryId,
        statusId: expenseFormData.statusId,
        documentType: expenseFormData.documentType,
        documentNumber: expenseFormData.documentNumber,
        thirdPartyDocType: expenseFormData.thirdPartyDocType,
        thirdPartyDocNumber: expenseFormData.thirdPartyDocNumber,
        notes: expenseFormData.notes,
        attachments,
        type: 'DIRECT' as const,
        createdAt: new Date(savedExpense.date),
        updatedAt: new Date()
      };

      setDirectExpenses(prev => [...prev, newExpense]);
      setShowExpenseForm(false);
      setExpenseFormData({
        proveedor: '',
        descripcion: '',
        total: 0,
        fecha: getLocalDateString(),
        categoryId: '',
        statusId: '',
        documentType: 'FACTURA',
        documentNumber: '',
        thirdPartyDocType: 'NONE',
        thirdPartyDocNumber: '',
        notes: '',
        receiptFile: undefined
      });
      
      // Reload expenses to ensure consistency with backend
      await loadExpenses();
      
      console.log('✅ Expense created successfully:', savedExpense.id);
    } catch (error) {
      console.error('❌ Error creating expense:', error);
      alert('Error al crear el gasto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: ExpenseCategory = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji || '📋',
        color: newCategoryColor,
        isActive: true
      };
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
      setNewCategoryEmoji('');
      setNewCategoryColor('#64748B');
      setShowCategoryForm(false);
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryEmoji(category.emoji || '');
    setNewCategoryColor(category.color);
  };

  const handleUpdateCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      const updatedCategory: ExpenseCategory = {
        ...editingCategory,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji || '📋',
        color: newCategoryColor
      };
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryEmoji('');
      setNewCategoryColor('#64748B');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Check if category is used in any expenses
    const isUsed = directExpenses.some(expense => expense.categoryId === categoryId);
    
    if (isUsed) {
      alert(t('gastos.categoryInUse'));
      return;
    }
    
    if (confirm(t('gastos.confirmDeleteCategory'))) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  const handleToggleCategoryActive = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    ));
  };

  // Status management functions
  const handleCreateStatus = (statusName: string) => {
    if (statusName.trim()) {
      const newStatus: ExpenseStatus = {
        id: Date.now().toString(),
        name: statusName.trim(),
        color: '#64748B',
        isDefault: false
      };
      setStatuses(prev => [...prev, newStatus]);
      return newStatus.id;
    }
    return null;
  };

  // Combine purchase orders and direct expenses
  const allExpenses: CompanyExpense[] = [
    ...expenses,
    ...directExpenses.map(de => ({
      id: de.id,
      fecha: de.fecha,
      proveedor: de.proveedor,
      documento: de.documento,
      descripcion: de.descripcion,
      total: de.total,
      currency: de.currency,
      companyName: undefined,
      status: undefined,
      originalPurchaseOrder: undefined,
      type: 'PURCHASE_ORDER' as const
    }))
  ];

  const filteredExpenses = allExpenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.documento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = selectedCompany === 'all' || expense.companyName === selectedCompany;
    
    return matchesSearch && matchesCompany;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.total, 0);

  // Use the new CLP formatting utility
  const formatCurrency = formatCLP;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusDisplay = (expense: CompanyExpense | DirectExpense) => {
    // For direct expenses, use custom status
    if ('statusId' in expense) {
      const directExpense = expense as DirectExpense;
      const status = statuses.find(s => s.id === directExpense.statusId);
      if (status) {
        return {
          label: status.name,
          color: status.color,
          className: `text-white`
        };
      }
    }
    
    // For company expenses, use original logic
    const companyExpense = expense as CompanyExpense;
    const status = companyExpense.status;
    
    let label = '';
    let className = '';
    
    switch (status) {
      case 'PAID': 
        label = 'Pagado';
        className = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        break;
      case 'APPROVED': 
        label = 'Aprobado';
        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        break;
      case 'PENDING': 
        label = 'Pendiente';
        className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        break;
      case 'CANCELLED': 
        label = 'Cancelado';
        className = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      default: 
        label = status || '—';
        className = 'bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90';
    }
    
    return { label, className, color: null };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('nav.gastos')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('gastos.subtitle')}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <TagIcon className="h-4 w-4 mr-2" />
            {t('gastos.manageCategories')}
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('gastos.createExpense')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('gastos.totalExpenses')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('gastos.totalCount')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredExpenses.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('gastos.companies')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {companies.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('common.filters')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.search')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('gastos.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.company')}
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t('common.allCompanies')}</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('gastos.expensesList')}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('gastos.noExpenses')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('gastos.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('gastos.provider')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('gastos.document')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('gastos.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('gastos.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Colaboración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map((expense) => {
                  const isBeingEdited = isUserEditing('expense', expense.id);
                  const editingUsers = getEditingUsers('expense', expense.id);
                  const isDirectExpense = directExpenses.some(de => de.id === expense.id);
                  
                  return (
                    <tr key={expense.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isBeingEdited ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(expense.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.proveedor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.documento}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs truncate" title={expense.descripcion}>
                          {expense.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(expense.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusDisplay = getStatusDisplay(expense);
                          return (
                            <span 
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                statusDisplay.color 
                                  ? statusDisplay.className 
                                  : statusDisplay.className
                              }`}
                              style={statusDisplay.color ? { backgroundColor: statusDisplay.color } : {}}
                            >
                              {statusDisplay.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBeingEdited && (
                          <EditingIndicator 
                            users={editingUsers}
                            showNames={false}
                            className="text-xs"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(expense)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span className="sr-only">{t('common.view')}</span>
                          </button>
                          {isDirectExpense && (
                            <button
                              onClick={() => handleEditExpense(expense)}
                              disabled={isBeingEdited}
                              className={`${
                                isBeingEdited 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={isBeingEdited ? 'Siendo editado por otro usuario' : 'Editar gasto'}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">{t('common.edit')}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Creation Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('gastos.createExpense')}
                </h3>
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.provider')}
                    </label>
                    <div className="relative" data-provider-dropdown>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={providerSearchTerm}
                        onChange={(e) => handleProviderInputChange(e.target.value)}
                        onFocus={() => setShowProviderDropdown(providerSearchTerm.length > 0 || filteredSuppliers.length > 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t('gastos.searchOrCreateProvider')}
                        required
                      />
                      
                      {/* Smart Search Dropdown */}
                      {showProviderDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredSuppliers.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                {t('gastos.existingSuppliers')}
                              </div>
                              {filteredSuppliers.slice(0, 5).map((supplier) => (
                                <button
                                  key={supplier.id}
                                  type="button"
                                  onClick={() => handleSelectSupplier(supplier)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {supplier.name}
                                  </div>
                                  {supplier.email && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {supplier.email}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          
                          {/* Add New Supplier Option */}
                          <button
                            type="button"
                            onClick={handleCreateSupplier}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center text-blue-600 dark:text-blue-400">
                              <PlusIcon className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {t('gastos.addNewSupplier')}
                              </span>
                            </div>
                            {providerSearchTerm && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                                "{providerSearchTerm}"
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.amount')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        $
                      </span>
                      <input
                        type="text"
                        value={formatCurrencyInput(expenseFormData.total)}
                        onChange={(e) => {
                          const rawValue = parseCurrency(e.target.value);
                          setExpenseFormData(prev => ({ ...prev, total: rawValue }));
                        }}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('gastos.description')}
                  </label>
                  <textarea
                    value={expenseFormData.descripcion}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.date')}
                    </label>
                    <input
                      type="date"
                      value={expenseFormData.fecha}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, fecha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.category')}
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={expenseFormData.categoryId}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">{t('gastos.selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.emoji ? `${category.emoji} ` : ''}{category.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(true)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.status')}
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={expenseFormData.statusId}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, statusId: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">{t('gastos.selectStatus')}</option>
                        {statuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={t('gastos.newStatus')}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const statusId = handleCreateStatus(e.currentTarget.value);
                              if (statusId) {
                                setExpenseFormData(prev => ({ ...prev, statusId }));
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-32"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Third-party Document Section */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    📄 Documento del Proveedor (Opcional)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Documento
                      </label>
                      <select
                        value={expenseFormData.thirdPartyDocType}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, thirdPartyDocType: e.target.value as 'FACTURA' | 'BOLETA' | 'NONE' }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="NONE">Sin documento</option>
                        <option value="FACTURA">Factura</option>
                        <option value="BOLETA">Boleta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número del Documento
                      </label>
                      <input
                        type="text"
                        value={expenseFormData.thirdPartyDocNumber}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, thirdPartyDocNumber: e.target.value }))}
                        disabled={expenseFormData.thirdPartyDocType === 'NONE'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:text-gray-500"
                        placeholder="Ej: 12345 o A-001234"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📎 Subir Recibo/Factura (PDF o Foto)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setExpenseFormData(prev => ({ ...prev, receiptFile: file }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300"
                    />
                    {expenseFormData.receiptFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        ✅ Archivo seleccionado: {expenseFormData.receiptFile.name} ({(expenseFormData.receiptFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateExpense}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {t('gastos.createExpense')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('gastos.manageCategories')}
                </h3>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Add/Edit Category */}
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {editingCategory ? t('gastos.editCategory') : t('gastos.addNewCategory')}
                </h4>
                
                <div className="space-y-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('gastos.categoryName')}
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t('gastos.categoryName')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Emoji Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('gastos.categoryEmoji')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryEmoji}
                        onChange={(e) => setNewCategoryEmoji(e.target.value.slice(0, 2))}
                        placeholder="🏠"
                        className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {popularEmojis.slice(0, 10).map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setNewCategoryEmoji(emoji)}
                            className={`p-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                              newCategoryEmoji === emoji ? 'bg-blue-100 dark:bg-blue-900' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('gastos.categoryColor')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {categoryColors.map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              newCategoryColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {editingCategory ? (
                      <>
                        <button
                          onClick={handleUpdateCategory}
                          disabled={!newCategoryName.trim()}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('common.update')}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setNewCategoryName('');
                            setNewCategoryEmoji('');
                            setNewCategoryColor('#64748B');
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common.add')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Existing Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {t('gastos.existingCategories')}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {category.emoji && (
                            <span className="text-lg">{category.emoji}</span>
                          )}
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleCategoryActive(category.id)}
                          className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {category.isActive ? t('common.active') : t('common.inactive')}
                        </button>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title={t('common.delete')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {showExpenseDetails && selectedExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('gastos.expenseDetails')}
                </h3>
                <button
                  onClick={() => setShowExpenseDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.date')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedExpense.fecha)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.amount')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedExpense.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.provider')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedExpense.proveedor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('gastos.document')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedExpense.documento}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category and Status (for direct expenses) */}
                {'statusId' in selectedExpense && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('gastos.category')}
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const category = categories.find(c => c.id === selectedExpense.categoryId);
                            return (
                              <>
                                {category?.emoji && (
                                  <span className="text-lg">{category.emoji}</span>
                                )}
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: category?.color || '#64748B' }}
                                />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {category?.name || t('common.unknown')}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('gastos.status')}
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        {(() => {
                          const status = statuses.find(s => s.id === (selectedExpense as DirectExpense).statusId);
                          return (
                            <span 
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: status?.color || '#64748B' }}
                            >
                              {status?.name || t('common.unknown')}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Company info (for company expenses) */}
                {('companyName' in selectedExpense) && selectedExpense.companyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('common.company')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {('companyName' in selectedExpense) ? selectedExpense.companyName : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('gastos.description')}
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedExpense.descripcion}
                    </span>
                  </div>
                </div>

                {/* Notes (for direct expenses) */}
                {'notes' in selectedExpense && selectedExpense.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('common.notes')}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedExpense.notes}
                      </span>
                    </div>
                  </div>
                )}

                {/* Third-party Document Information (for direct expenses) */}
                {'thirdPartyDocType' in selectedExpense && selectedExpense.thirdPartyDocType && selectedExpense.thirdPartyDocType !== 'NONE' && selectedExpense.thirdPartyDocNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📄 Documento del Proveedor
                    </label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <span className="text-sm text-gray-900 dark:text-white font-mono">
                        {selectedExpense.thirdPartyDocType}: {selectedExpense.thirdPartyDocNumber}
                      </span>
                    </div>
                  </div>
                )}

                {/* File Attachments (for direct expenses) */}
                {'attachments' in selectedExpense && selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📎 Archivos Adjuntos
                    </label>
                    <div className="space-y-2">
                      {selectedExpense.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {attachment.fileName || 'Archivo'}
                            </p>
                            {attachment.fileSize && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                          {attachment.fileUrl && (
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-3 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creation dates (for direct expenses) */}
                {'createdAt' in selectedExpense && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('common.createdAt')}
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedExpense.createdAt).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('common.updatedAt')}
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedExpense.updatedAt).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowExpenseDetails(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal for Supplier Creation */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('gastos.addNewSupplier')}
              </h3>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <AddContact
              onAdd={handleContactCreated}
              onClose={() => setShowAddContact(false)}
            />
          </div>
        </div>
      )}

      {/* Real-time Collaborative Expense Edit Modal */}
      {showEditModal && editingExpense && (
        <ExpenseEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          expense={editingExpense}
          categories={categories}
          statuses={statuses}
          suppliers={suppliers}
          onCreateSupplier={() => setShowAddContact(true)}
        />
      )}

      {/* Login Modal for Authentication */}
      <DevLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Gastos;
