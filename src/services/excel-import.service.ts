import type { 
  ExcelImportRow, 
  ProductCreationData, 
  PurchaseOrderCreationData, 
  PurchaseOrderLineData 
} from '../types/excel-import';
import type { Brand } from '../types/brand';
import { brandShippingService } from './brand-shipping.service';

// Simulated API interfaces - in production, these would call actual backend APIs
interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  brandId?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: string;
  date: string;
  expectedDeliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  lines: PurchaseOrderLineData[];
}

export class ExcelImportService {
  // Simulated product database - in production, this would be API calls
  private products: Map<string, Product> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private nextProductId = 1;
  private nextSupplierId = 1;
  private nextPOId = 1;

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample products
    const sampleProducts: Product[] = [
      {
        id: 'prod_1',
        sku: 'SKU001',
        name: 'Sample Widget',
        description: 'A sample widget product',
        category: 'Electronics',
        brand: 'SampleBrand',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_2',
        sku: 'SKU002',
        name: 'Test Component',
        description: 'A test component',
        category: 'Components',
        brand: 'TestCorp',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.sku.toLowerCase(), product);
    });

    // Sample suppliers
    const sampleSuppliers: Supplier[] = [
      {
        id: 'supp_1',
        name: 'ABC Supplies Inc'
      }
    ];

    sampleSuppliers.forEach(supplier => {
      this.suppliers.set(supplier.name.toLowerCase(), supplier);
    });
  }

  async findProductBySKU(sku: string): Promise<Product | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.products.get(sku.toLowerCase()) || null;
  }

  async createProduct(productData: ProductCreationData): Promise<Product> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Generate SKU if not provided
    let sku = productData.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase();
    
    // Ensure SKU is unique
    let counter = 1;
    let originalSku = sku;
    while (this.products.has(sku.toLowerCase())) {
      sku = `${originalSku}${counter.toString().padStart(2, '0')}`;
      counter++;
    }

    const product: Product = {
      id: `prod_${this.nextProductId++}`,
      sku,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      brand: productData.brand,
      barcode: productData.barcode,
      isActive: productData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in our simulated database
    this.products.set(sku.toLowerCase(), product);
    
    console.log('Created new product:', product);
    return product;
  }

  async findOrCreateSupplier(supplierData: { 
    name: string; 
    rut?: string;
  }): Promise<Supplier> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to find existing supplier
    let supplier = this.suppliers.get(supplierData.name.toLowerCase());
    
    if (!supplier) {
      // Create new supplier
      supplier = {
        id: `supp_${this.nextSupplierId++}`,
        name: supplierData.name
      };
      
      this.suppliers.set(supplier.name.toLowerCase(), supplier);
      console.log('Created new supplier:', supplier);
    }
    
    return supplier;
  }

  async createPurchaseOrder(poData: PurchaseOrderCreationData): Promise<PurchaseOrder> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const po: PurchaseOrder = {
      id: `po_${this.nextPOId++}`,
      poNumber: poData.poNumber,
      supplierId: poData.supplierId,
      status: poData.status,
      date: poData.date,
      expectedDeliveryDate: poData.expectedDeliveryDate,
      subtotal: poData.subtotal,
      taxAmount: poData.taxAmount,
      totalAmount: poData.totalAmount,
      currency: poData.currency,
      notes: poData.notes,
      lines: poData.lines
    };
    
    console.log('Created new PO:', po);
    return po;
  }

  async processImportData(importData: ExcelImportRow[]): Promise<{
    success: boolean;
    processedPOs: PurchaseOrder[];
    createdProducts: Product[];
    createdBrands: Brand[];
    brandAllocations: any[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const createdProducts: Product[] = [];
    const processedPOs: PurchaseOrder[] = [];
    let createdBrands: Brand[] = [];
    let brandAllocations: any[] = [];
    
    try {
      // Step 1: Process brand shipping calculations
      console.log('Processing brand shipping calculations...');
      const brandShippingResult = await brandShippingService.processImportWithBrandShipping(
        importData,
        'BY_VALUE' // Use value-proportional allocation
      );
      
      createdBrands = brandShippingResult.createdBrands;
      brandAllocations = brandShippingResult.brandAllocations;
      
      // Use processed rows with calculated shipping
      const processedImportData = brandShippingResult.processedRows;
      console.log('Brand shipping processing completed:', {
        brandsCreated: createdBrands.length,
        allocations: brandAllocations.length
      });
      // Step 2: Group processed data by PO Number
      const poGroups = new Map<string, ExcelImportRow[]>();
      
      for (const row of processedImportData) {
        if (!poGroups.has(row.numeroOC)) {
          poGroups.set(row.numeroOC, []);
        }
        poGroups.get(row.numeroOC)!.push(row);
      }

      // Process each PO group
      for (const [numeroOC, rows] of poGroups.entries()) {
        try {
          const firstRow = rows[0];
          
          // Find or create supplier
          const supplier = await this.findOrCreateSupplier({
            name: firstRow.nombreProveedor,
            rut: firstRow.rutProveedor
          });

          // Process products and create order lines
          const orderLines: PurchaseOrderLineData[] = [];
          
          for (const row of rows) {
            let product: Product;
            
            const isNewProduct = ['sí', 'si', 'sÍ', 'SI'].includes(row.esProductoNuevo.toLowerCase());
            if (isNewProduct) {
              // Create new product
              const productData: ProductCreationData = {
                name: row.nombreProducto,
                description: row.descripcionProducto,
                displayName: row.nombreMostrar,
                category: row.categoriaProducto,
                brand: row.marcaProducto,
                brandId: row.marcaProducto ? 
                  createdBrands.find(b => b.name === row.marcaProducto)?.id : undefined,
                barcode: row.codigoBarras,
                uom: row.unidadMedida,
                type: row.tipoProducto,
                minStock: row.stockMinimo,
                maxStock: row.stockMaximo,
                reorderLevel: row.nivelReorden,
                minOrderQuantity: row.cantidadMinPedido,
                maxOrderQuantity: row.cantidadMaxPedido,
                cafePrice: row.precioCafe,
                rappiPrice: row.precioRappi,
                pedidosyaPrice: row.precioPedidosYa,
                uberPrice: row.precioUber,
                availableInCafe: ['sí', 'si', 'sÍ', 'SI'].includes(row.disponibleCafe?.toLowerCase() || ''),
                availableOnRappi: ['sí', 'si', 'sÍ', 'SI'].includes(row.disponibleRappi?.toLowerCase() || ''),
                availableOnPedidosya: ['sí', 'si', 'sÍ', 'SI'].includes(row.disponiblePedidosYa?.toLowerCase() || ''),
                availableOnUber: ['sí', 'si', 'sÍ', 'SI'].includes(row.disponibleUber?.toLowerCase() || ''),
                rappiProductId: row.idProductoRappi,
                pedidosyaProductId: row.idProductoPedidosYa,
                uberProductId: row.idProductoUber,
                notes: row.notasProducto,
                isActive: true,
                createdFromImport: true
              };
              
              product = await this.createProduct(productData);
              createdProducts.push(product);
            } else {
              // Find existing product by SKU
              if (!row.skuExistente) {
                errors.push(`Fila con OC ${numeroOC}: No se proporcionó SKU para producto existente ${row.nombreProducto}`);
                continue;
              }
              
              const foundProduct = await this.findProductBySKU(row.skuExistente);
              product = foundProduct!;
              if (!product) {
                errors.push(`Fila con OC ${numeroOC}: Producto con SKU ${row.skuExistente} no encontrado`);
                continue;
              }
            }

            // Create order line with calculated shipping
            const orderLine: PurchaseOrderLineData = {
              productId: product.id,
              sku: product.sku,
              productName: product.name,
              quantity: row.cantidad,
              unitCost: row.costoUnitario,
              totalCost: row.costoTotal,
              isInventory: ['sí', 'si', 'sÍ', 'SI'].includes(row.esInventario?.toLowerCase() || ''),
              taxRate: 19, // Chile IVA fixed at 19%
              // shippingCostPerUnit: (row as any).shippingCostPerUnit || 0, // From brand shipping calculation
              // brand: row.marcaProducto,
              // brandId: row.marcaProducto ? 
              //   createdBrands.find(b => b.name === row.marcaProducto)?.id : undefined
            };
            
            orderLines.push(orderLine);
          }

          if (orderLines.length === 0) {
            errors.push(`OC ${numeroOC}: No se encontraron productos válidos, omitiendo creación de OC`);
            continue;
          }

          // Calculate totals
          const subtotal = orderLines.reduce((sum, line) => sum + line.totalCost, 0);
          const taxAmount = orderLines.reduce((sum, line) => {
            const lineTax = line.totalCost * (line.taxRate / 100);
            return sum + lineTax;
          }, 0);
          const totalAmount = subtotal + taxAmount;

          // Create PO
          const poData: PurchaseOrderCreationData = {
            poNumber: firstRow.numeroOC,
            date: firstRow.fechaOC,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierRut: firstRow.rutProveedor,
            expectedDeliveryDate: firstRow.fechaEntregaEsperada,
            status: firstRow.estadoOC,
            notes: firstRow.notasOC,
            thirdPartyDocType: firstRow.tipoDocumentoTercero,
            thirdPartyDocNumber: firstRow.numeroDocumentoTercero,
            companyId: firstRow.empresa, // This would be mapped to actual company ID in production
            lines: orderLines,
            subtotal,
            taxAmount,
            totalAmount,
            currency: 'CLP' // Fixed to CLP for Chile
          };

          const createdPO = await this.createPurchaseOrder(poData);
          processedPOs.push(createdPO);
          
        } catch (error) {
          const errorMsg = `Error procesando OC ${numeroOC}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      return {
        success: errors.length === 0,
        processedPOs,
        createdProducts,
        createdBrands,
        brandAllocations,
        errors
      };
      
    } catch (error) {
      const errorMsg = `Error crítico durante procesamiento de importación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
      
      return {
        success: false,
        processedPOs,
        createdProducts,
        createdBrands: [],
        brandAllocations: [],
        errors
      };
    }
  }

  // Get current data for display/debugging
  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values());
  }
}

export const excelImportService = new ExcelImportService();