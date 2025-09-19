// Cashier POS System Types

export interface CashierProduct {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category: string;
  brand?: string;
  supplier?: string;
  stock: number;
  minStock?: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Search optimization fields
  searchTerms: string; // Pre-computed search terms
  nameWords: string[]; // Tokenized name for fuzzy search
  categoryPath: string; // Full category hierarchy
  tags?: string[]; // Additional search tags
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  subtotal: number;
  barcode?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mixed';
  cashTendered?: number;
  change?: number;
  cardAmount?: number;
  cashierId: string;
  timestamp: string;
  synced: boolean;
  syncedAt?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface PaymentDetails {
  method: 'cash' | 'card';
  amount: number;
  tendered?: number;
  change?: number;
  cardTransactionId?: string;
  processing?: boolean;
  error?: string;
}

export interface ProductFilter {
  category?: string;
  brand?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface SearchResult {
  products: CashierProduct[];
  totalCount: number;
  hasMore: boolean;
  query: string;
  filters: ProductFilter;
  searchTime: number; // milliseconds
}

export interface BarcodeEvent {
  barcode: string;
  timestamp: number;
  isValid: boolean;
  product?: CashierProduct;
  error?: string;
}

export interface CashierSettings {
  taxRate: number;
  currency: string;
  locale: string;
  receiptPrinter?: {
    name: string;
    width: number;
    encoding: string;
  };
  barcodeSettings: {
    minLength: number;
    maxLength: number;
    timeout: number;
    validFormats: string[];
  };
  shortcuts: {
    [key: string]: string;
  };
  autoSync: boolean;
  syncInterval: number; // minutes
}

// Database sync status
export interface SyncStatus {
  lastSync: string;
  pendingTransactions: number;
  pendingProductUpdates: number;
  isOnline: boolean;
  isSyncing: boolean;
  errors: string[];
}