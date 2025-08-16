# Plan integral: Pipeline de desarrollo de productos

Última actualización: 2025-08-16 02:33 (EDT)

## 1) Contexto y objetivos

- __Centralizar costos y compras__ en una sola sección (evitar dispersión).
- __Distinguir insumos vs productos terminados__ para inventario y producción.
- __Calcular costo de producción__ por producto/lote (BOM/formulación + mermas).
- __Multi-empresa__: Muralla Spa y Murallita MEF (empresa hija con autorización alimentaria). Registrar a nombre de cuál empresa se factura.
- __Multi-localización__: manejar stock por ubicación y traslados.
- __Adjuntos__: guardar foto/archivo de boleta/factura; futuro OCR.
- __Conciliar costos con transacciones__ bancarias/MercadoPago (enlace bidireccional).
- __Reembolsos a staff__: cuando el trabajador paga, queda deuda de la empresa.

## 2) Alcance (MVP → Escalable)

- Sección única "Costos" con categorías (insumos, maquinaria, limpieza, inmueble, servicios, otros).
- Compras de insumos → __entrada automática__ a inventario.
- Producción con BOM: consumir insumos y producir terminados; costo por lote.
- Multi-empresa, multi-cuenta bancaria, multi-localización.
- Vincular __Costo ⇄ Transacción__ manual en MVP (automatizaciones en fases posteriores).

## 3) Modelo de datos (conceptual)

- __Company__: id, name (Muralla Spa, Murallita MEF)
- __BankAccount__: id, companyId, bankName, alias, currency
- __Staff__: id, name, email
- __Vendor__: id, name, taxId
- __Product__: id, sku, name, type: INSUMO|TERMINADO, uom, category, active
- __BOM__: id, productId, components[{insumoId, qty, uom}]
- __Location__: id, name, type, address
- __InventoryItem__ (vista agregada), __InventoryMove__ {id, type, productId, fromLocationId?, toLocationId?, qty, unitCost?, reason, refId}
  - Tipos: EntradaCompra, EntradaProducción, SalidaProducción(Consumo), SalidaVenta, Traslado, Ajuste, Merma, Devolución
- __Cost__: {id, companyId, categoryId, vendorId?, docType, docNumber?, date, total, currency, payerType: COMPANY|STAFF, payerCompanyId?, staffId?, bankAccountId?, description, attachments[], status}
- __CostLine__: {id, costId, productId?, isInventory:boolean, qty?, unitCost?, locationId?}
- __Transaction__: {id, source: BANK|MP, externalId, companyId, bankAccountId?, amount, date, description, counterpartName?, status, rawJson}
- __CostTransactionLink__: {costId, transactionId}
- __WorkOrder__: {id, productId, qtyPlanned, locationId, status, lotCode?, startedAt, finishedAt, yield%, scrapQty}
- __Attachment__: {id, costId, fileUrl, fileType, ocrJson?, uploadedBy, uploadedAt}

__Valorización__: Promedio Ponderado (WAVG) en MVP; FIFO opcional en fase posterior.

## 4) Flujos clave

- __Costos/Compras__ (sección única):
  1. Crear Costo: docType (Factura/Boleta), empresa emisora (Muralla Spa/Murallita MEF), fecha, total, categoría, quién pagó (empresa/cuenta o staff), adjuntos.
  2. Si categoría/línea es inventario: agregar líneas (productId INSUMO, qty, unitCost, location) → al guardar genera `InventoryMove: EntradaCompra`.
  3. Enlace con transacción: desde Costo "Vincular transacción" o desde Bancos "Marcar como costo" (enlace bidireccional). Conservar descripción original.
  4. Si pagó Staff: generar saldo a reembolsar; liquidación al pagar.

- __Producción__ (BOM):
  1. Crear `WorkOrder` para TERMINADO + cantidad objetivo y ubicación.
  2. Reservar/calcular insumos requeridos (editable).
  3. Consumir insumos → `InventoryMove: SalidaProducción`.
  4. Producir terminados → `InventoryMove: EntradaProducción`.
  5. Calcular costo de lote (WAVG de insumos + costos indirectos si se asignan).
  6. Registrar mermas y rendimiento (yield) que afectan costo unitario.

- __Multi-localización__:
  - Traslados `InventoryMove: Traslado`, ajustes y mermas con motivo.

- __Transacciones Bancarias/MP__:
  - Importar feed MP (existente) y luego bancos.
  - Marcar transacción como Costo/Venta y vincular con entidad.
  - Futuro: reglas de matching por monto/proveedor/texto.

- __Reembolsos a staff__:
  - Estados: Pendiente de reembolso → Reembolsado; vincular pago con transacción.

## 5) UI (propuesta compacta)

- __Productos__: catálogo (insumo/terminado), UoM, categorías, BOM del terminado.
- __Inventario__: stock por localización; movimientos; traslados/ajustes.
- __Costos__: crear costos con adjuntos, categorías; líneas de insumo → entrada automática; reembolsos a staff.
- __Bancos__: cuentas por empresa; transacciones importadas; marcar costo/venta; vinculación bidireccional; conciliación.
- __Producción__: órdenes de producción, consumo, producción y mermas.
- __Ventas__ (posterior): pedidos/ventas y COGS.
- __Reportes__: costo por producto/lote, inventario valorizado, márgenes, deudas a staff.
- __Configuración__: empresas, localizaciones, categorías, permisos.

## 6) Reglas y contabilidad operativa

- Categorías de costo con `isInventory` para automatizar entradas.
- Centros de costo (fase 2) para agrupar gastos por área.
- COGS: en MVP por producción; ventas en fase posterior.

## 7) Multi-empresa y compliance

- Toda entidad (Cost/Transaction/BankAccount) atada a `Company`.
- Al crear costo con Factura, seleccionar empresa emisora.
- Reportes con filtros por empresa.

## 8) Adjuntos y OCR

- Almacenar archivos en S3/R2/Cloudinary con URLs firmadas.
- Guardar metadatos; OCR (fase 2) para pre-rellenar monto/fecha/proveedor.

## 9) Permisos y auditoría

- Roles: Admin, Finanzas, Operaciones, Staff.
- Auditoría de Costos, Movimientos, WorkOrders (integrar con trail existente).

## 10) Reportes y KPIs

- KPIs: costo unitario por producto/lote; stock valorizado; márgenes (cuando haya ventas); días de cobertura; reembolsos pendientes.
- Informes: compras por categoría/empresa/periodo; consumo de insumos por terminado; mermas por lote.

## 11) Plan por fases

- __Fase 0 – Fundaciones__: entidades base, permisos, auditoría, adjuntos; conector MP.
- __Fase 1 – MVP (4–6 semanas)__: Costos unificado + adjuntos; Productos y Localizaciones; Inventario con entradas por compras; Cuentas bancarias y transacciones MP; vínculo manual Costo ⇄ Transacción; reembolsos a staff.
- __Fase 2 – Producción (4–6 semanas)__: BOM, Work Orders, consumo/producción/mermas, costo por lote (WAVG); traslados/ajustes; reportes de costos e inventario valorizado.
- __Fase 3 – Automatizaciones (4–6 semanas)__: matching transacción–costo, OCR de comprobantes, centros de costo.
- __Fase 4 – Ventas y COGS (4–6 semanas)__: ventas y salida de inventario con COGS; márgenes por producto/canal.
- __Fase 5 – Optimización__: FIFO opcional, multi-moneda, lotes/vencimientos avanzados, dashboards.

## 12) Próximos pasos (sprint inmediato)

1. __Esquema Prisma__ para: Company, BankAccount, Vendor, Product(+type), Location, Cost/CostLine(+attachments), Transaction, InventoryMove, BOM, WorkOrder, Staff.
2. __API Costos__ (crear/editar/listar) + adjuntos y líneas de inventario → genera EntradaCompra.
3. __API Inventario__ (stock/movimientos) y __Productos__ (catálogo + BOM stub).
4. __Bancos__ (import MP) y vínculo manual Costo ⇄ Transacción.
5. Semillas iniciales: empresas, localizaciones, categorías.
6. Reporte básico: compras por categoría y stock valorizado WAVG.

## 13) Decisiones abiertas y riesgos

- FIFO vs WAVG (arrancamos con WAVG por simplicidad).
- Multi-moneda e impuestos locales (post-MVP).
- Gestión de lotes/vencimientos (alimentarios) — recomendable en Fase 2.

## 14) Métricas de éxito

- % de costos con transacción vinculada.
- % de compras de insumos que generan inventario automáticamente (sin errores).
- Tiempo medio de registro de costo (con adjunto).
- Precisión del costo unitario por lote.
- Reembolsos pendientes vs tiempo de resolución.

## 15) Implementación técnica detallada

### 15.1) Esquema Prisma completo

```prisma
// Empresas y configuración
model Company {
  id          String @id @default(cuid())
  name        String
  taxId       String? @unique
  address     String?
  phone       String?
  email       String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  bankAccounts BankAccount[]
  costs       Cost[]
  transactions Transaction[]
  locations   Location[]
  workOrders  WorkOrder[]
  
  @@map("companies")
}

model Location {
  id          String @id @default(cuid())
  name        String
  type        LocationType // WAREHOUSE, STORE, PRODUCTION, OFFICE
  address     String?
  companyId   String
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  company     Company @relation(fields: [companyId], references: [id])
  inventoryMoves InventoryMove[]
  costLines   CostLine[]
  workOrders  WorkOrder[]
  
  @@map("locations")
}

// Productos y BOM
model Product {
  id          String @id @default(cuid())
  sku         String @unique
  name        String
  description String?
  type        ProductType // INSUMO, TERMINADO, SERVICIO
  uom         String // kg, L, pcs, etc.
  categoryId  String?
  unitCost    Decimal? @db.Decimal(10,4)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  category    ProductCategory? @relation(fields: [categoryId], references: [id])
  bomComponents BOMComponent[] @relation("ProductBOM")
  bomUsedIn   BOMComponent[] @relation("ComponentProduct")
  costLines   CostLine[]
  inventoryMoves InventoryMove[]
  workOrders  WorkOrder[]
  
  @@map("products")
}

model ProductCategory {
  id          String @id @default(cuid())
  name        String
  description String?
  isInventory Boolean @default(false)
  parentId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  parent      ProductCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    ProductCategory[] @relation("CategoryHierarchy")
  products    Product[]
  costs       Cost[]
  
  @@map("product_categories")
}

model BOMComponent {
  id          String @id @default(cuid())
  productId   String // Producto terminado
  componentId String // Insumo/componente
  quantity    Decimal @db.Decimal(10,4)
  uom         String
  unitCost    Decimal? @db.Decimal(10,4)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  product     Product @relation("ProductBOM", fields: [productId], references: [id])
  component   Product @relation("ComponentProduct", fields: [componentId], references: [id])
  
  @@unique([productId, componentId])
  @@map("bom_components")
}

// Inventario
model InventoryMove {
  id              String @id @default(cuid())
  type            InventoryMoveType
  productId       String
  fromLocationId  String?
  toLocationId    String?
  quantity        Decimal @db.Decimal(10,4)
  unitCost        Decimal? @db.Decimal(10,4)
  totalCost       Decimal? @db.Decimal(10,2)
  reason          String?
  referenceType   String? // Cost, WorkOrder, Sale, etc.
  referenceId     String?
  lotCode         String?
  expiryDate      DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  
  // Relaciones
  product         Product @relation(fields: [productId], references: [id])
  fromLocation    Location? @relation(fields: [fromLocationId], references: [id])
  toLocation      Location? @relation(fields: [toLocationId], references: [id])
  creator         User @relation(fields: [createdBy], references: [id])
  
  @@map("inventory_moves")
}

// Costos y compras
model Cost {
  id              String @id @default(cuid())
  companyId       String
  categoryId      String?
  vendorId        String?
  docType         DocumentType // FACTURA, BOLETA, RECIBO, OTRO
  docNumber       String?
  date            DateTime
  total           Decimal @db.Decimal(10,2)
  currency        String @default("CLP")
  payerType       PayerType // COMPANY, STAFF
  payerCompanyId  String?
  staffId         String?
  bankAccountId   String?
  description     String?
  status          CostStatus @default(PENDING)
  reimbursementStatus ReimbursementStatus?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  company         Company @relation(fields: [companyId], references: [id])
  category        ProductCategory? @relation(fields: [categoryId], references: [id])
  vendor          Vendor? @relation(fields: [vendorId], references: [id])
  payerCompany    Company? @relation(fields: [payerCompanyId], references: [id])
  staff           User? @relation(fields: [staffId], references: [id])
  bankAccount     BankAccount? @relation(fields: [bankAccountId], references: [id])
  creator         User @relation(fields: [createdBy], references: [id])
  lines           CostLine[]
  attachments     Attachment[]
  transactionLinks CostTransactionLink[]
  
  @@map("costs")
}

model CostLine {
  id          String @id @default(cuid())
  costId      String
  productId   String?
  isInventory Boolean @default(false)
  quantity    Decimal? @db.Decimal(10,4)
  unitCost    Decimal? @db.Decimal(10,4)
  totalCost   Decimal @db.Decimal(10,2)
  locationId  String?
  description String?
  createdAt   DateTime @default(now())
  
  // Relaciones
  cost        Cost @relation(fields: [costId], references: [id], onDelete: Cascade)
  product     Product? @relation(fields: [productId], references: [id])
  location    Location? @relation(fields: [locationId], references: [id])
  
  @@map("cost_lines")
}

model Vendor {
  id          String @id @default(cuid())
  name        String
  taxId       String?
  email       String?
  phone       String?
  address     String?
  contactName String?
  paymentTerms String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  costs       Cost[]
  
  @@map("vendors")
}

// Producción
model WorkOrder {
  id              String @id @default(cuid())
  companyId       String
  productId       String
  locationId      String
  qtyPlanned      Decimal @db.Decimal(10,4)
  qtyProduced     Decimal? @db.Decimal(10,4)
  qtyScrap        Decimal? @db.Decimal(10,4)
  lotCode         String?
  status          WorkOrderStatus @default(PLANNED)
  plannedCost     Decimal? @db.Decimal(10,2)
  actualCost      Decimal? @db.Decimal(10,2)
  yieldPercent    Decimal? @db.Decimal(5,2)
  startedAt       DateTime?
  finishedAt      DateTime?
  notes           String?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  company         Company @relation(fields: [companyId], references: [id])
  product         Product @relation(fields: [productId], references: [id])
  location        Location @relation(fields: [locationId], references: [id])
  creator         User @relation(fields: [createdBy], references: [id])
  components      WorkOrderComponent[]
  
  @@map("work_orders")
}

model WorkOrderComponent {
  id              String @id @default(cuid())
  workOrderId     String
  productId       String
  qtyPlanned      Decimal @db.Decimal(10,4)
  qtyConsumed     Decimal? @db.Decimal(10,4)
  unitCost        Decimal? @db.Decimal(10,4)
  totalCost       Decimal? @db.Decimal(10,2)
  createdAt       DateTime @default(now())
  
  // Relaciones
  workOrder       WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])
  
  @@map("work_order_components")
}

// Transacciones y enlaces
model CostTransactionLink {
  id            String @id @default(cuid())
  costId        String
  transactionId String
  amount        Decimal? @db.Decimal(10,2)
  createdBy     String
  createdAt     DateTime @default(now())
  
  // Relaciones
  cost          Cost @relation(fields: [costId], references: [id], onDelete: Cascade)
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  creator       User @relation(fields: [createdBy], references: [id])
  
  @@unique([costId, transactionId])
  @@map("cost_transaction_links")
}

model Attachment {
  id          String @id @default(cuid())
  costId      String
  fileName    String
  fileUrl     String
  fileType    String
  fileSize    Int?
  ocrData     Json?
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  
  // Relaciones
  cost        Cost @relation(fields: [costId], references: [id], onDelete: Cascade)
  uploader    User @relation(fields: [uploadedBy], references: [id])
  
  @@map("attachments")
}

// Enums
enum LocationType {
  WAREHOUSE
  STORE
  PRODUCTION
  OFFICE
}

enum ProductType {
  INSUMO
  TERMINADO
  SERVICIO
}

enum InventoryMoveType {
  ENTRADA_COMPRA
  ENTRADA_PRODUCCION
  SALIDA_PRODUCCION
  SALIDA_VENTA
  TRASLADO
  AJUSTE
  MERMA
  DEVOLUCION
}

enum DocumentType {
  FACTURA
  BOLETA
  RECIBO
  OTRO
}

enum PayerType {
  COMPANY
  STAFF
}

enum CostStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}

enum ReimbursementStatus {
  PENDING
  APPROVED
  PAID
}

enum WorkOrderStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### 15.2) APIs y endpoints faltantes

#### Productos y Categorías
```typescript
// products.controller.ts
@Controller('products')
export class ProductsController {
  @Get() findAll(@Query() filters: ProductFiltersDto)
  @Get(':id') findOne(@Param('id') id: string)
  @Post() create(@Body() data: CreateProductDto)
  @Patch(':id') update(@Param('id') id: string, @Body() data: UpdateProductDto)
  @Delete(':id') remove(@Param('id') id: string)
  
  // BOM management
  @Get(':id/bom') getBOM(@Param('id') id: string)
  @Post(':id/bom') updateBOM(@Param('id') id: string, @Body() components: BOMComponentDto[])
  @Post(':id/calculate-cost') calculateProductCost(@Param('id') id: string)
}

// product-categories.controller.ts
@Controller('product-categories')
export class ProductCategoriesController {
  @Get() findAll()
  @Post() create(@Body() data: CreateCategoryDto)
  @Patch(':id') update(@Param('id') id: string, @Body() data: UpdateCategoryDto)
}
```

#### Inventario
```typescript
// inventory.controller.ts
@Controller('inventory')
export class InventoryController {
  @Get('stock') getStock(@Query() filters: StockFiltersDto)
  @Get('moves') getMoves(@Query() filters: MovesFiltersDto)
  @Post('moves') createMove(@Body() data: CreateMoveDto)
  @Post('transfer') transfer(@Body() data: TransferDto)
  @Post('adjustment') adjustment(@Body() data: AdjustmentDto)
  @Get('valuation') getValuation(@Query() filters: ValuationFiltersDto)
}
```

#### Costos mejorado
```typescript
// costs.controller.ts (extender existente)
@Controller('costs')
export class CostsController {
  // Existentes + nuevos:
  @Post(':id/attachments') uploadAttachment(@Param('id') id: string, @UploadedFile() file)
  @Post(':id/link-transaction') linkTransaction(@Param('id') id: string, @Body() data: LinkTransactionDto)
  @Delete(':id/unlink-transaction/:transactionId') unlinkTransaction()
  @Post(':id/approve') approve(@Param('id') id: string)
  @Post('reimburse') processReimbursement(@Body() data: ReimbursementDto)
}
```

#### Producción
```typescript
// work-orders.controller.ts
@Controller('work-orders')
export class WorkOrdersController {
  @Get() findAll(@Query() filters: WorkOrderFiltersDto)
  @Get(':id') findOne(@Param('id') id: string)
  @Post() create(@Body() data: CreateWorkOrderDto)
  @Post(':id/start') start(@Param('id') id: string)
  @Post(':id/consume') consumeComponents(@Param('id') id: string, @Body() data: ConsumeDto)
  @Post(':id/produce') recordProduction(@Param('id') id: string, @Body() data: ProduceDto)
  @Post(':id/complete') complete(@Param('id') id: string, @Body() data: CompleteDto)
  @Get(':id/cost-analysis') getCostAnalysis(@Param('id') id: string)
}
```

### 15.3) Servicios de negocio críticos

#### InventoryService
```typescript
@Injectable()
export class InventoryService {
  async getStock(filters: StockFilters): Promise<StockItem[]>
  async createMove(data: CreateMoveData): Promise<InventoryMove>
  async calculateWAVG(productId: string, locationId?: string): Promise<number>
  async checkAvailability(productId: string, quantity: number, locationId: string): Promise<boolean>
  async reserveStock(reservations: StockReservation[]): Promise<void>
  async releaseReservation(reservationId: string): Promise<void>
}
```

#### ProductionService
```typescript
@Injectable()
export class ProductionService {
  async createWorkOrder(data: CreateWorkOrderData): Promise<WorkOrder>
  async calculateRequiredComponents(productId: string, quantity: number): Promise<ComponentRequirement[]>
  async consumeComponents(workOrderId: string, consumptions: ComponentConsumption[]): Promise<void>
  async recordProduction(workOrderId: string, production: ProductionRecord): Promise<void>
  async calculateLotCost(workOrderId: string): Promise<LotCostBreakdown>
}
```

#### CostingService
```typescript
@Injectable()
export class CostingService {
  async calculateProductCost(productId: string, method: 'WAVG' | 'FIFO' = 'WAVG'): Promise<ProductCost>
  async updateInventoryValuation(locationId?: string): Promise<ValuationReport>
  async calculateCOGS(saleId: string): Promise<COGSBreakdown>
  async allocateOverheadCosts(workOrderId: string, overheadRules: OverheadRule[]): Promise<void>
}
```

### 15.4) Integraciones faltantes

#### File Upload Service
```typescript
@Injectable()
export class FileUploadService {
  async uploadFile(file: Express.Multer.File, context: 'cost' | 'product'): Promise<UploadResult>
  async processOCR(fileUrl: string): Promise<OCRResult>
  async generateSignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string>
}
```

#### Bank Integration Service
```typescript
@Injectable()
export class BankIntegrationService {
  async importTransactions(bankAccountId: string, fromDate: Date, toDate: Date): Promise<Transaction[]>
  async matchTransactionsToCosts(bankAccountId: string): Promise<MatchSuggestion[]>
  async autoLinkTransaction(transactionId: string, costId: string, confidence: number): Promise<void>
}
```

### 15.5) Reportes y dashboards

#### ReportsService
```typescript
@Injectable()
export class ReportsService {
  async getCostsByCategory(filters: ReportFilters): Promise<CostCategoryReport>
  async getInventoryValuation(locationId?: string): Promise<InventoryValuationReport>
  async getProductCostAnalysis(productId: string, period: DateRange): Promise<ProductCostAnalysis>
  async getReimbursementReport(staffId?: string): Promise<ReimbursementReport>
  async getProductionEfficiencyReport(period: DateRange): Promise<ProductionEfficiencyReport>
}
```

### 15.6) Validaciones y reglas de negocio

#### Business Rules Engine
```typescript
@Injectable()
export class BusinessRulesService {
  async validateCostEntry(cost: CreateCostDto): Promise<ValidationResult>
  async validateInventoryMove(move: CreateMoveDto): Promise<ValidationResult>
  async validateWorkOrderStart(workOrderId: string): Promise<ValidationResult>
  async applyAutomaticCategorization(cost: Cost): Promise<Cost>
  async suggestVendorFromDescription(description: string): Promise<Vendor[]>
}
```

### 15.7) Testing strategy

#### Unit Tests
- Servicios de cálculo de costos (WAVG, FIFO)
- Lógica de BOM y explosión de materiales
- Validaciones de inventario
- Cálculos de producción y mermas

#### Integration Tests
- Flujo completo: Compra → Inventario → Producción → Costo
- Integración con MercadoPago
- Upload y procesamiento de archivos
- Matching automático de transacciones

#### E2E Tests
- Registro de costo con adjunto
- Creación y ejecución de orden de producción
- Traslado de inventario entre ubicaciones
- Proceso de reembolso a staff

### 15.8) Deployment y DevOps

#### Database Migrations
```bash
# Crear migración inicial
npx prisma migrate dev --name init-product-pipeline

# Seed data
npx prisma db seed
```

#### Environment Variables
```env
# File storage
FILE_STORAGE_PROVIDER=s3|cloudinary|local
AWS_S3_BUCKET=muralla-attachments
CLOUDINARY_CLOUD_NAME=muralla

# OCR Service
OCR_PROVIDER=aws-textract|google-vision|azure
OCR_ENABLED=true

# Business rules
AUTO_CATEGORIZATION_ENABLED=true
AUTO_MATCHING_THRESHOLD=0.85
INVENTORY_VALUATION_METHOD=WAVG
```

#### Monitoring
- Métricas de performance para cálculos de costos
- Alertas por discrepancias en inventario
- Monitoreo de uploads y OCR
- Tracking de precisión en matching automático
