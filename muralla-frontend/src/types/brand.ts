// Brand Management Types

export interface Brand {
  id: string;
  name: string;
  code?: string; // Short brand code (e.g., "NIKE", "ADID")
  description?: string;
  shipsDirectly: boolean;
  defaultShippingCost?: number; // Average shipping cost for analytics
  logoUrl?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  contacts?: BrandContact[];
  suppliers?: BrandSupplier[]; // Which suppliers sell this brand
  shippingHistory?: BrandShippingHistory[];
}

export interface BrandContact {
  id: string;
  brandId: string;
  name: string;
  role?: string; // Sales, Support, Logistics, etc.
  email?: string;
  phone?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  brand?: Brand; // Populated when needed
}

export interface BrandSupplier {
  id: string;
  brandId: string;
  supplierId: string;
  supplierName: string;
  isPreferred: boolean; // Preferred supplier for this brand
  averageLeadTime?: number; // Days
  averageShippingCost?: number;
  minimumOrderValue?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface BrandShippingHistory {
  id: string;
  brandId: string;
  purchaseOrderId: string;
  shippingCost: number;
  productsCount: number;
  costPerUnit: number;
  deliveryDate?: string;
  actualDeliveryDate?: string;
  carrierId?: string; // Shipping company
  trackingNumber?: string;
  createdAt: string;
}

// Enhanced Product interface to include brand
export interface ProductBrand {
  id: string;
  brandId?: string;
  brand?: Brand;
  // ... other product fields would extend from main Product interface
}

// Shipping calculation helpers
export interface BrandShippingCalculation {
  brandId: string;
  brandName: string;
  totalShippingCost: number;
  productsInBrand: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalProductValue: number;
  shippingPerUnit: number;
  shippingPercentage: number; // % of total product value
}

export interface PurchaseOrderShippingAllocation {
  purchaseOrderId: string;
  brandAllocations: BrandShippingCalculation[];
  totalShipping: number;
  allocationMethod: 'BY_VALUE' | 'BY_QUANTITY' | 'EQUAL'; // How shipping was distributed
  calculatedAt: string;
}

// Form data interfaces
export interface BrandFormData {
  name: string;
  code?: string;
  description?: string;
  shipsDirectly: boolean;
  defaultShippingCost?: number;
  logoUrl?: string;
  website?: string;
  notes?: string;
  contacts: Omit<BrandContact, 'id' | 'brandId'>[];
}

export interface BrandContactFormData {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  department?: string;
  isPrimary: boolean;
}

// Search and filter types
export interface BrandSearchFilters {
  query?: string;
  shipsDirectly?: boolean;
  hasContacts?: boolean;
  supplierId?: string; // Filter by supplier that sells this brand
  isActive?: boolean;
}

export interface BrandAnalytics {
  brandId: string;
  brandName: string;
  totalOrders: number;
  totalValue: number;
  totalShippingCost: number;
  averageShippingPercentage: number;
  suppliers: {
    supplierId: string;
    supplierName: string;
    orderCount: number;
    totalValue: number;
    averageShipping: number;
  }[];
  performanceMetrics: {
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
    shippingCostTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  };
}