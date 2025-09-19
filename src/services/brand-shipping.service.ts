import type { 
  ExcelImportRow,
  BrandShippingCalculation,
  PurchaseOrderShippingAllocation 
} from '../types/excel-import';
import type { Brand, BrandContact } from '../types/brand';

interface BrandGroupedProducts {
  brandName: string;
  products: (ExcelImportRow & { 
    calculatedShippingPerUnit?: number;
    totalProductValue?: number;
  })[];
  totalShippingCost: number;
  totalProductValue: number;
  totalQuantity: number;
}

export class BrandShippingService {
  private brands: Map<string, Brand> = new Map();
  private brandContacts: Map<string, BrandContact[]> = new Map();
  
  constructor() {
    // Initialize with sample brand data
    this.initializeSampleBrands();
  }

  private initializeSampleBrands() {
    const sampleBrands: Brand[] = [
      {
        id: 'brand_1',
        name: 'TechCorp',
        code: 'TECH',
        shipsDirectly: true,
        defaultShippingCost: 15000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand_2', 
        name: 'IndustrialCorp',
        code: 'INDUS',
        shipsDirectly: true,
        defaultShippingCost: 25000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleBrands.forEach(brand => {
      this.brands.set(brand.name.toLowerCase(), brand);
    });
  }

  /**
   * Find or create a brand based on the product's brand name
   */
  async findOrCreateBrand(brandName: string, contactInfo?: {
    contactoMarca?: string;
    emailContactoMarca?: string;
  }): Promise<Brand> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let brand = this.brands.get(brandName.toLowerCase());
    
    if (!brand) {
      // Create new brand
      const brandCode = brandName.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, '');
      
      brand = {
        id: `brand_${Date.now()}`,
        name: brandName,
        code: brandCode,
        shipsDirectly: false, // Default to false, user can update later
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.brands.set(brand.name.toLowerCase(), brand);
      console.log('Created new brand:', brand);
      
      // Create brand contact if provided
      if (contactInfo?.contactoMarca) {
        await this.createBrandContact(brand.id, {
          name: contactInfo.contactoMarca,
          email: contactInfo.emailContactoMarca,
          isPrimary: true
        });
      }
    }
    
    return brand;
  }

  /**
   * Create a brand contact
   */
  async createBrandContact(brandId: string, contactData: {
    name: string;
    email?: string;
    role?: string;
    isPrimary: boolean;
  }): Promise<BrandContact> {
    const contact: BrandContact = {
      id: `contact_${Date.now()}`,
      brandId,
      name: contactData.name,
      email: contactData.email,
      role: contactData.role || 'Contacto General',
      isPrimary: contactData.isPrimary,
      isActive: true
    };

    if (!this.brandContacts.has(brandId)) {
      this.brandContacts.set(brandId, []);
    }
    
    this.brandContacts.get(brandId)!.push(contact);
    console.log('Created brand contact:', contact);
    
    return contact;
  }

  /**
   * Group import rows by brand and calculate shipping
   */
  groupProductsByBrand(importRows: ExcelImportRow[]): BrandGroupedProducts[] {
    const brandGroups = new Map<string, ExcelImportRow[]>();
    
    // Group products by brand
    importRows.forEach(row => {
      const brandName = row.marcaProducto || 'Sin Marca';
      
      if (!brandGroups.has(brandName)) {
        brandGroups.set(brandName, []);
      }
      brandGroups.get(brandName)!.push(row);
    });
    
    // Calculate shipping for each brand group
    const result: BrandGroupedProducts[] = [];
    
    for (const [brandName, products] of brandGroups.entries()) {
      // Get total shipping cost for this brand (from first product that has it)
      const totalShippingCost = products.find(p => p.costoEnvioMarca)?.costoEnvioMarca || 0;
      
      // Calculate total product value and quantity
      const totalProductValue = products.reduce((sum, product) => {
        return sum + (product.costoTotal || 0);
      }, 0);
      
      const totalQuantity = products.reduce((sum, product) => {
        return sum + (product.cantidad || 0);
      }, 0);
      
      result.push({
        brandName,
        products,
        totalShippingCost,
        totalProductValue,
        totalQuantity
      });
    }
    
    return result;
  }

  /**
   * Calculate shipping proration for each product
   * Methods: BY_VALUE (proportional to product value), BY_QUANTITY (equal per unit), EQUAL (equal per product)
   */
  calculateShippingProration(
    brandGroups: BrandGroupedProducts[], 
    method: 'BY_VALUE' | 'BY_QUANTITY' | 'EQUAL' = 'BY_VALUE'
  ): BrandShippingCalculation[] {
    
    return brandGroups.map(group => {
      let shippingPerUnit = 0;
      
      // Calculate shipping per unit based on method
      switch (method) {
        case 'BY_VALUE':
          // Distribute shipping proportional to product value
          group.products.forEach(product => {
            const productProportion = (product.costoTotal || 0) / group.totalProductValue;
            const productShipping = group.totalShippingCost * productProportion;
            product.calculatedShippingPerUnit = productShipping / (product.cantidad || 1);
            product.totalProductValue = product.costoTotal || 0;
          });
          
          // Average shipping per unit for the brand
          shippingPerUnit = group.totalShippingCost / group.totalQuantity;
          break;
          
        case 'BY_QUANTITY':
          // Equal shipping cost per unit across all products
          shippingPerUnit = group.totalShippingCost / group.totalQuantity;
          
          group.products.forEach(product => {
            product.calculatedShippingPerUnit = shippingPerUnit;
            product.totalProductValue = product.costoTotal || 0;
          });
          break;
          
        case 'EQUAL':
          // Equal shipping cost per product (regardless of quantity or value)
          const shippingPerProduct = group.totalShippingCost / group.products.length;
          
          group.products.forEach(product => {
            product.calculatedShippingPerUnit = shippingPerProduct / (product.cantidad || 1);
            product.totalProductValue = product.costoTotal || 0;
          });
          
          shippingPerUnit = group.totalShippingCost / group.totalQuantity;
          break;
      }
      
      const shippingPercentage = group.totalProductValue > 0 
        ? (group.totalShippingCost / group.totalProductValue) * 100 
        : 0;
      
      return {
        brandId: `temp_${group.brandName}`, // Will be updated with actual brand ID
        brandName: group.brandName,
        totalShippingCost: group.totalShippingCost,
        productsInBrand: group.products.map(p => ({
          productId: p.nombreProducto, // Temporary ID
          productName: p.nombreProducto,
          quantity: p.cantidad || 0,
          unitCost: p.costoUnitario || 0,
          totalCost: p.costoTotal || 0
        })),
        totalProductValue: group.totalProductValue,
        shippingPerUnit,
        shippingPercentage
      };
    });
  }

  /**
   * Process import data with brand shipping calculations
   */
  async processImportWithBrandShipping(
    importRows: ExcelImportRow[],
    allocationMethod: 'BY_VALUE' | 'BY_QUANTITY' | 'EQUAL' = 'BY_VALUE'
  ): Promise<{
    processedRows: ExcelImportRow[];
    brandAllocations: BrandShippingCalculation[];
    createdBrands: Brand[];
    createdContacts: BrandContact[];
  }> {
    
    const createdBrands: Brand[] = [];
    const createdContacts: BrandContact[] = [];
    
    // Step 1: Ensure all brands exist
    const uniqueBrands = [...new Set(importRows.map(row => row.marcaProducto).filter(Boolean))];
    
    for (const brandName of uniqueBrands) {
      // Find rows with this brand to get contact info
      const brandRow = importRows.find(row => 
        row.marcaProducto === brandName && 
        (row.contactoMarca || row.emailContactoMarca)
      );
      
      const brand = await this.findOrCreateBrand(brandName!, {
        contactoMarca: brandRow?.contactoMarca,
        emailContactoMarca: brandRow?.emailContactoMarca
      });
      
      createdBrands.push(brand);
      
      // Collect any contacts created
      const brandContactsList = this.brandContacts.get(brand.id) || [];
      createdContacts.push(...brandContactsList);
    }
    
    // Step 2: Group products by brand
    const brandGroups = this.groupProductsByBrand(importRows);
    
    // Step 3: Calculate shipping proration
    const brandAllocations = this.calculateShippingProration(brandGroups, allocationMethod);
    
    // Step 4: Apply calculated shipping to original rows
    const processedRows = importRows.map(row => {
      const brandGroup = brandGroups.find(bg => bg.brandName === (row.marcaProducto || 'Sin Marca'));
      const matchingProduct = brandGroup?.products.find(p => 
        p.nombreProducto === row.nombreProducto && 
        p.cantidad === row.cantidad &&
        p.costoUnitario === row.costoUnitario
      );
      
      return {
        ...row,
        // Add calculated shipping per unit to the row
        shippingCostPerUnit: matchingProduct?.calculatedShippingPerUnit || 0
      };
    });
    
    return {
      processedRows,
      brandAllocations,
      createdBrands: createdBrands.filter(brand => 
        !this.brands.has(brand.name.toLowerCase())
      ), // Only return newly created brands
      createdContacts: createdContacts.filter(contact => 
        contact.id.startsWith('contact_')
      ) // Only return newly created contacts
    };
  }

  /**
   * Get shipping analytics for a brand
   */
  getBrandShippingAnalytics(brandName: string): {
    averageShippingCost: number;
    totalOrders: number;
    averageShippingPercentage: number;
  } {
    // This would typically query historical data from a database
    // For now, return mock data
    return {
      averageShippingCost: 18000,
      totalOrders: 15,
      averageShippingPercentage: 8.5
    };
  }

  /**
   * Suggest shipping cost based on historical data
   */
  suggestShippingCost(brandName: string, totalProductValue: number): number {
    const brand = this.brands.get(brandName.toLowerCase());
    
    if (brand?.defaultShippingCost) {
      return brand.defaultShippingCost;
    }
    
    // Use a percentage-based estimation (typically 5-15% of product value)
    const estimatedPercentage = 0.08; // 8%
    return Math.round(totalProductValue * estimatedPercentage);
  }

  // Get current data for display/debugging
  getBrands(): Brand[] {
    return Array.from(this.brands.values());
  }

  getBrandContacts(brandId?: string): BrandContact[] {
    if (brandId) {
      return this.brandContacts.get(brandId) || [];
    }
    
    // Return all contacts
    const allContacts: BrandContact[] = [];
    for (const contacts of this.brandContacts.values()) {
      allContacts.push(...contacts);
    }
    return allContacts;
  }
}

export const brandShippingService = new BrandShippingService();