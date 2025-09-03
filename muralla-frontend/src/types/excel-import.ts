// Tipos de Importación Excel para Órdenes de Compra y Productos

export interface ExcelImportRow {
  // Información de Orden de Compra
  numeroOC: string;
  fechaOC: string;
  nombreProveedor: string;
  rutProveedor?: string;
  fechaEntregaEsperada?: string;
  estadoOC: 'borrador' | 'pendiente' | 'aprobada' | 'pedida' | 'recibida' | 'cancelada';
  notasOC?: string;
  tipoDocumentoTercero?: 'FACTURA' | 'BOLETA' | 'NINGUNO';
  numeroDocumentoTercero?: string;
  empresa: string;
  
  // Información de Producto
  esProductoNuevo: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  skuExistente?: string; // Para productos existentes
  
  // Detalles de Producto (para productos nuevos o líneas de pedido)
  nombreProducto: string;
  descripcionProducto?: string;
  nombreMostrar?: string;
  categoriaProducto: string;
  marcaProducto?: string;
  codigoBarras?: string;
  unidadMedida: string;
  tipoProducto: 'PURCHASED' | 'MANUFACTURED' | 'TERMINADO';
  
  // Información de Línea de Pedido
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  esInventario: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  
  // Información Adicional de Producto (para productos nuevos)
  stockMinimo?: number;
  stockMaximo?: number;
  nivelReorden?: number;
  cantidadMinPedido?: number;
  cantidadMaxPedido?: number;
  precioCafe?: number;
  precioRappi?: number;
  precioPedidosYa?: number;
  precioUber?: number;
  disponibleCafe?: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  disponibleRappi?: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  disponiblePedidosYa?: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  disponibleUber?: 'SÍ' | 'NO' | 'SI' | 'sí' | 'si' | 'no';
  idProductoRappi?: string;
  idProductoPedidosYa?: string;
  idProductoUber?: string;
  notasProducto?: string;
  
  // Información de Marca y Envío
  costoEnvioMarca?: number;  // Total shipping cost for this brand
  contactoMarca?: string;    // Optional brand contact name
  emailContactoMarca?: string; // Optional brand contact email
}

export interface ExcelImportValidation {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

export interface ExcelImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: ExcelImportValidation[];
  warnings: ExcelImportValidation[];
  parsedData: ExcelImportRow[];
}

export interface ProductCreationData {
  name: string;
  description?: string;
  displayName?: string;
  category: string;
  brand?: string;
  brandId?: string; // Will be populated after brand lookup/creation
  barcode?: string;
  uom: string;
  type: 'PURCHASED' | 'MANUFACTURED' | 'TERMINADO';
  minStock?: number;
  maxStock?: number;
  reorderLevel?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  cafePrice?: number;
  rappiPrice?: number;
  pedidosyaPrice?: number;
  uberPrice?: number;
  availableInCafe?: boolean;
  availableOnRappi?: boolean;
  availableOnPedidosya?: boolean;
  availableOnUber?: boolean;
  rappiProductId?: string;
  pedidosyaProductId?: string;
  uberProductId?: string;
  notes?: string;
  isActive: boolean;
  createdFromImport: boolean;
}

export interface PurchaseOrderCreationData {
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierRut?: string;
  supplierAddress?: string;
  expectedDeliveryDate?: string;
  status: string;
  notes?: string;
  thirdPartyDocType?: string;
  thirdPartyDocNumber?: string;
  companyId: string;
  lines: PurchaseOrderLineData[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string; // Always CLP for Chile
}

export interface PurchaseOrderLineData {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isInventory: boolean;
  taxRate: number; // Always 19% IVA for Chile
}

export interface ImportProgress {
  phase: 'reading' | 'validating' | 'creating_products' | 'creating_pos' | 'completed';
  currentStep: number;
  totalSteps: number;
  message: string;
  errors: string[];
}

// Definiciones de Columnas de Plantilla Excel
export const EXCEL_TEMPLATE_COLUMNS = {
  // Información de Orden de Compra
  'Número OC': {
    required: true,
    example: 'OC-2024-001',
    options: ['Número interno de OC auto-generado']
  },
  'Fecha OC': {
    required: true,
    example: '2024-01-15',
    options: ['Formato YYYY-MM-DD']
  },
  'Nombre Proveedor': {
    required: true,
    example: 'ABC Suministros S.A.',
    options: ['Debe coincidir con proveedor existente o se creará uno nuevo']
  },
  'RUT Proveedor': {
    required: false,
    example: '12345678-9'
  },
  'Fecha Entrega Esperada': {
    required: false,
    example: '2024-01-30',
    options: ['Formato YYYY-MM-DD']
  },
  'Estado OC': {
    required: true,
    example: 'pendiente',
    options: ['borrador', 'pendiente', 'aprobada', 'pedida', 'recibida', 'cancelada']
  },
  'Notas OC': {
    required: false,
    example: 'Pedido urgente para inventario Q1'
  },
  'Tipo Documento Tercero': {
    required: false,
    example: 'FACTURA',
    options: ['FACTURA', 'BOLETA', 'NINGUNO']
  },
  'Número Documento Tercero': {
    required: false,
    example: '12345',
    options: ['Número de factura o boleta del proveedor']
  },
  'Empresa': {
    required: true,
    example: 'Mi Empresa Ltda.',
    options: ['Nombre de la empresa compradora']
  },

  // Información de Producto
  'Es Producto Nuevo': {
    required: true,
    example: 'SÍ',
    options: ['SÍ', 'NO']
  },
  'SKU Existente': {
    required: false, // Requerido cuando "Es Producto Nuevo" = NO
    example: 'SKU001',
    options: ['Requerido cuando Es Producto Nuevo = NO']
  },
  'Nombre Producto': {
    required: true,
    example: 'Widget Premium 2.0'
  },
  'Descripción Producto': {
    required: false,
    example: 'Widget de alta calidad con características avanzadas'
  },
  'Nombre Mostrar': {
    required: false,
    example: 'Widget Premium',
    options: ['Nombre para mostrar en plataformas']
  },
  'Categoría Producto': {
    required: true,
    example: 'Electrónicos'
  },
  'Marca Producto': {
    required: false,
    example: 'TechCorp'
  },
  'Código Barras': {
    required: false,
    example: '1234567890123'
  },
  'Unidad Medida': {
    required: true,
    example: 'UN',
    options: ['UN (unidad), KG (kilogramo), L (litro), etc.']
  },
  'Tipo Producto': {
    required: true,
    example: 'PURCHASED',
    options: ['PURCHASED (comprado)', 'MANUFACTURED (fabricado)', 'TERMINADO (terminado)']
  },

  // Información de Línea de Pedido
  'Cantidad': {
    required: true,
    example: '50',
    options: ['Número positivo']
  },
  'Costo Unitario': {
    required: true,
    example: '25990',
    options: ['En CLP (pesos chilenos), número positivo']
  },
  'Costo Total': {
    required: true,
    example: '1299500',
    options: ['Debe ser igual a Cantidad × Costo Unitario, en CLP']
  },
  'Es Inventario': {
    required: true,
    example: 'SÍ',
    options: ['SÍ', 'NO - Indica si afecta el inventario']
  },

  // Información Adicional de Producto (para gestión de inventario y plataformas)
  'Stock Mínimo': {
    required: false,
    example: '10',
    options: ['Nivel mínimo de stock para reordenar']
  },
  'Stock Máximo': {
    required: false,
    example: '500',
    options: ['Nivel máximo de stock']
  },
  'Nivel Reorden': {
    required: false,
    example: '25',
    options: ['Nivel de stock que activa reordenamiento']
  },
  'Cantidad Mín. Pedido': {
    required: false,
    example: '1',
    options: ['Cantidad mínima por pedido']
  },
  'Cantidad Máx. Pedido': {
    required: false,
    example: '10',
    options: ['Cantidad máxima por pedido']
  },
  'Precio Café': {
    required: false,
    example: '3500',
    options: ['Precio en café (CLP)']
  },
  'Precio Rappi': {
    required: false,
    example: '4000',
    options: ['Precio en Rappi (CLP)']
  },
  'Precio PedidosYa': {
    required: false,
    example: '4200',
    options: ['Precio en PedidosYa (CLP)']
  },
  'Precio Uber': {
    required: false,
    example: '4100',
    options: ['Precio en Uber Eats (CLP)']
  },
  'Disponible Café': {
    required: false,
    example: 'SÍ',
    options: ['SÍ', 'NO']
  },
  'Disponible Rappi': {
    required: false,
    example: 'NO',
    options: ['SÍ', 'NO']
  },
  'Disponible PedidosYa': {
    required: false,
    example: 'NO',
    options: ['SÍ', 'NO']
  },
  'Disponible Uber': {
    required: false,
    example: 'NO',
    options: ['SÍ', 'NO']
  },
  'ID Producto Rappi': {
    required: false,
    example: 'RAPPI_12345',
    options: ['ID del producto en Rappi']
  },
  'ID Producto PedidosYa': {
    required: false,
    example: 'PYA_67890',
    options: ['ID del producto en PedidosYa']
  },
  'ID Producto Uber': {
    required: false,
    example: 'UBER_54321',
    options: ['ID del producto en Uber Eats']
  },
  'Notas Producto': {
    required: false,
    example: 'Almacenar en lugar fresco y seco'
  },
  
  // Información de Marca y Envío
  'Costo Envío Marca': {
    required: false,
    example: '15000',
    options: ['Costo total de envío para todos los productos de esta marca (CLP)']
  },
  'Contacto Marca': {
    required: false,
    example: 'Juan Pérez - Gerente Ventas',
    options: ['Contacto directo de la marca (opcional)']
  },
  'Email Contacto Marca': {
    required: false,
    example: 'ventas@marca.cl',
    options: ['Email del contacto de la marca (opcional)']
  }
} as const;

export type ExcelColumnKey = keyof typeof EXCEL_TEMPLATE_COLUMNS;