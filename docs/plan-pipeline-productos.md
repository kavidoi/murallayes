# Plan integral: Pipeline de desarrollo de productos

Última actualización: 2025-08-16 00:51 (EDT)

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
