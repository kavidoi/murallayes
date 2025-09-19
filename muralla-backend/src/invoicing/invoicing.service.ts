import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicingService {
  constructor(private prisma: PrismaService) {}

  async getTaxDocuments(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

<<<<<<< HEAD
  async healthCheck(rut?: string) {
    const companyRut = rut || process.env.COMPANY_RUT || '78188363-8';
    const res = await this.api.get(`/v2/dte/taxpayer/${encodeURIComponent(companyRut)}`);
    return res.data;
  }

  async listDocuments(params: { type?: string; status?: string; startDate?: string; endDate?: string; search?: string; includeOpenFactura?: boolean; openFacturaOnly?: boolean; syncReceived?: boolean } = {}) {
    // Auto-sync received documents from OpenFactura if enabled (default: true)
    if (params.syncReceived !== false) {
      try {
        await this.syncReceivedDocuments();
      } catch (error) {
        this.logger.warn('Failed to sync received documents:', error.message);
      }
    }

    // Get local documents first
    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.startDate || params.endDate) {
      where.issuedAt = {};
      if (params.startDate) where.issuedAt.gte = new Date(params.startDate + 'T00:00:00Z');
      if (params.endDate) where.issuedAt.lte = new Date(params.endDate + 'T23:59:59.999Z');
    }
    // Enhanced search over receiver, emitter, or folio
    if (params.search) {
      where.OR = [
        { receiverName: { contains: params.search, mode: 'insensitive' } },
        { receiverRUT: { contains: params.search, mode: 'insensitive' } },
        { emitterName: { contains: params.search, mode: 'insensitive' } },
        { emitterRUT: { contains: params.search, mode: 'insensitive' } },
        { folio: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const prismaAny = this.prisma as any;
    const localDocs = params.openFacturaOnly ? [] : await prismaAny.taxDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 100,
    });

    // Try to fetch from OpenFactura if enabled (legacy support)
    let openFacturaDocs = [];
    if (params.includeOpenFactura !== false && params.openFacturaOnly) {
      try {
        openFacturaDocs = await this.fetchDocumentsFromOpenFactura(params);
      } catch (error) {
        this.logger.warn('Failed to fetch from OpenFactura:', error.message);
      }
    }

    // Combine and deduplicate results
    const allDocs = params.openFacturaOnly ? openFacturaDocs : [...localDocs, ...openFacturaDocs];
    const uniqueDocs = allDocs.filter((doc, index, self) =>
      index === self.findIndex(d => d.folio === doc.folio && d.type === doc.type)
    );

    return uniqueDocs.sort((a, b) =>
      new Date(b.createdAt || b.issuedAt).getTime() - new Date(a.createdAt || a.issuedAt).getTime()
    );
  }

  async fetchDocumentsFromOpenFactura(params: any = {}) {
    const companyRut = process.env.COMPANY_RUT || '78188363-8';

    // Try common OpenFactura endpoints for document listing
    // Based on Chilean DTE standards, most systems use rutEmisor parameter
    const qs = new URLSearchParams();
    if (params.startDate) qs.set('fechaDesde', params.startDate);
    if (params.endDate) qs.set('fechaHasta', params.endDate);
    const q = qs.toString();

    const withQ = (base: string) => q ? `${base}&${q}` : base;
    const endpoints = [
      withQ(`/v2/dte/emitidos?rutEmisor=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/document?rutEmisor=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/documents?rutEmisor=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/issued?rutEmisor=${encodeURIComponent(companyRut)}`),
      // taxpayer documents may not accept fechaDesde/Hasta, but adding won't hurt if ignored
      q ? `/v2/dte/taxpayer/${encodeURIComponent(companyRut)}/documents?${q}` : `/v2/dte/taxpayer/${encodeURIComponent(companyRut)}/documents`,
      withQ(`/v2/dte/list?rutEmisor=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/document?rut=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/documents?rut=${encodeURIComponent(companyRut)}`),
      withQ(`/v2/dte/list?rut=${encodeURIComponent(companyRut)}`),
    ];

    for (const endpoint of endpoints) {
      try {
        this.logger.log(`Trying OpenFactura endpoint: ${endpoint}`);
        const response = await this.api.get(endpoint);

        if (response.data) {
          let documents = [];

          if (Array.isArray(response.data)) {
            documents = response.data;
          } else if (response.data.documents && Array.isArray(response.data.documents)) {
            documents = response.data.documents;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            documents = response.data.data;
          } else if (response.data.dte && Array.isArray(response.data.dte)) {
            documents = response.data.dte;
          }

          if (documents.length > 0) {
            this.logger.log(`✅ Found ${documents.length} documents from OpenFactura via ${endpoint}`);
            return this.normalizeOpenFacturaDocuments(documents);
          } else {
            this.logger.debug(`Endpoint ${endpoint} returned empty array`);
          }
        }
      } catch (error) {
        this.logger.debug(`Endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }

    this.logger.warn('No working OpenFactura document endpoint found');
    return [];
  }

  private normalizeOpenFacturaDocuments(docs: any[]): any[] {
    return docs.map(doc => ({
      id: doc.id || doc.folio,
      type: this.mapDocumentType(doc.codigoTipoDocumento || doc.documentType),
      folio: doc.folio,
      status: doc.estado || doc.status || 'UNKNOWN',
      receiverName: doc.nombreReceptor || doc.receiverName,
      receiverRUT: doc.rutReceptor || doc.receiverRUT,
      netAmount: doc.montoNeto || doc.netAmount || 0,
      taxAmount: doc.montoIva || doc.taxAmount || 0,
      totalAmount: doc.montoTotal || doc.totalAmount || 0,
      issuedAt: doc.fechaEmision ? new Date(doc.fechaEmision) : new Date(),
      createdAt: doc.fechaEmision ? new Date(doc.fechaEmision) : new Date(),
      pdfUrl: doc.urlPdf || doc.pdfUrl,
      xmlUrl: doc.urlXml || doc.xmlUrl,
      source: 'OPENFACTURA',
      rawData: doc,
    }));
  }

  private mapDocumentType(code: number | string): string {
    const codeNum = typeof code === 'string' ? parseInt(code) : code;
    switch (codeNum) {
      case 33: return 'FACTURA';
      case 39: return 'BOLETA';
      case 56: return 'NOTA_DEBITO';
      case 61: return 'NOTA_CREDITO';
      default: return 'OTHER';
    }
  }

  private getDocumentTypeName(code: number): string {
    switch (code) {
      case 33: return 'Factura Electrónica';
      case 39: return 'Boleta Electrónica';
      case 56: return 'Nota de Débito Electrónica';
      case 61: return 'Nota de Crédito Electrónica';
      case 52: return 'Guía de Despacho Electrónica';
      case 110: return 'Factura de Exportación Electrónica';
      case 111: return 'Nota de Débito de Exportación Electrónica';
      case 112: return 'Nota de Crédito de Exportación Electrónica';
      default: return `Documento Tipo ${code}`;
    }
  }

  private getPaymentMethodDescription(code: number | string): string {
    const codeNum = typeof code === 'string' ? parseInt(code) : code;
    switch (codeNum) {
      case 1: return 'Contado';
      case 2: return 'Crédito';
      case 3: return 'Sin costo (entrega gratuita)';
      default: return code ? `Forma de pago ${code}` : 'No especificado';
    }
  }

  private getPurchaseTypeDescription(code: number | string): string {
    const codeNum = typeof code === 'string' ? parseInt(code) : code;
    switch (codeNum) {
      case 1: return 'Compras del giro';
      case 2: return 'Compras en Supermercados o similares';
      case 3: return 'Adquisición Bien Raíz';
      case 4: return 'Compra Activo Fijo';
      case 5: return 'Compra con IVA Uso Común';
      case 6: return 'Compra sin derecho a crédito';
      case 7: return 'Compra que no corresponde incluir';
      default: return code ? `Tipo compra ${code}` : 'No especificado';
    }
  }

  private getAcknowledgmentDescription(code: string): string {
    switch (code) {
      case 'ACD': return 'Acepta Contenido del Documento';
      case 'RCD': return 'Reclamo al Contenido del Documento';
      case 'ERM': return 'Otorga Recibo de Mercaderías o Servicios';
      case 'RFP': return 'Reclamo por Falta Parcial de Mercaderías';
      case 'RFT': return 'Reclamo por Falta Total de Mercaderías';
      default: return code || 'Acuse desconocido';
    }
  }

  async discoverWorkingEndpoints() {
    const companyRut = process.env.COMPANY_RUT || '78188363-8';

    const getDateString = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Comprehensive list of potential endpoints
    const endpointsToTest = [
      // Direct document endpoints
      `/v2/dte/document?rut=${companyRut}`,
      `/v2/dte/documents?rut=${companyRut}`,
      `/v2/dte/document?rutEmisor=${companyRut}`,
      `/v2/dte/document?rutReceptor=${companyRut}`,

      // Taxpayer-specific endpoints
      `/v2/dte/taxpayer/${companyRut}/documents`,
      `/v2/dte/taxpayer/${companyRut}/document`,
      `/v2/dte/taxpayer/${companyRut}/dte`,

      // List endpoints
      `/v2/dte/list?rut=${companyRut}`,
      `/v2/dte/list?rutEmisor=${companyRut}`,
      `/v2/dte/list?rutReceptor=${companyRut}`,

      // Search endpoints
      `/v2/dte/search?rut=${companyRut}`,
      `/v2/dte/search?rutEmisor=${companyRut}`,
      `/v2/dte/search?rutReceptor=${companyRut}`,

      // Generic endpoints
      `/v2/dte`,
      `/v2/dte/document`,
      `/v2/documents`,
      `/v2/document`,

      // With date filters (last 30 days)
      `/v2/dte/document?rut=${companyRut}&fechaDesde=${getDateString(-30)}`,
      `/v2/dte/documents?rut=${companyRut}&fechaDesde=${getDateString(-30)}`,

      // Issued vs Received
      `/v2/dte/emitidos?rut=${companyRut}`,
      `/v2/dte/recibidos?rut=${companyRut}`,
      `/v2/dte/issued?rut=${companyRut}`,
      `/v2/dte/received?rut=${companyRut}`,

      // Alternative paths
      `/v1/dte/document?rut=${companyRut}`,
      `/api/v2/dte/document?rut=${companyRut}`,
      `/api/dte/document?rut=${companyRut}`,
    ];

    const results = [];

    for (const endpoint of endpointsToTest) {
      try {
        this.logger.log(`Testing endpoint: ${endpoint}`);
        const response = await this.api.get(endpoint);
        const data = response.data;

        let documentCount = 0;
        let sampleDoc = null;

        if (Array.isArray(data)) {
          documentCount = data.length;
          sampleDoc = data[0];
        } else if (data && typeof data === 'object') {
          if (data.documents && Array.isArray(data.documents)) {
            documentCount = data.documents.length;
            sampleDoc = data.documents[0];
          } else if (data.data && Array.isArray(data.data)) {
            documentCount = data.data.length;
            sampleDoc = data.data[0];
          } else {
            documentCount = Object.keys(data).length > 0 ? 1 : 0;
            sampleDoc = data;
          }
        }

        results.push({
          endpoint,
          success: true,
          status: response.status,
          documentCount,
          sampleDoc: documentCount > 0 ? sampleDoc : null,
          responseKeys: data && typeof data === 'object' ? Object.keys(data) : []
        });

        if (documentCount > 0) {
          this.logger.log(`✅ SUCCESS: ${endpoint} returned ${documentCount} documents`);
        } else {
          this.logger.log(`⚠️ Empty response from ${endpoint}`);
        }

      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        results.push({
          endpoint,
          success: false,
          status,
          error: message,
          documentCount: 0
        });

        this.logger.debug(`❌ ${endpoint} failed: ${status} - ${message}`);
      }
    }

    const successful = results.filter(r => r.success && r.documentCount > 0);
    const workingEndpoint = successful.length > 0 ? successful[0] : null;

    return {
      companyRut,
      totalEndpointsTested: endpointsToTest.length,
      successfulEndpoints: successful.length,
      workingEndpoint: workingEndpoint?.endpoint,
      documentCount: workingEndpoint?.documentCount || 0,
      sampleDocument: workingEndpoint?.sampleDoc || null,
      allResults: results.map(r => ({
        endpoint: r.endpoint,
        success: r.success,
        status: r.status,
        documentCount: r.documentCount,
        error: r.error
      })),
      recommendation: workingEndpoint
        ? `Use endpoint: ${workingEndpoint.endpoint}`
        : 'No working document endpoints found. Check API permissions or document availability.'
    };
  }

  async getDocument(id: string) {
    const prismaAny = this.prisma as any;
    return prismaAny.taxDocument.findUnique({ where: { id }, include: { items: true } });
  }

  async getCostLinks(costIds: string[]) {
    if (!Array.isArray(costIds) || costIds.length === 0) return [];
    const prismaAny = this.prisma as any;
    const docs = await prismaAny.taxDocument.findMany({
      where: { costId: { in: costIds } },
      select: { id: true, costId: true, type: true, folio: true, status: true }
    });
    return docs;
  }

  // Phase 2: Real OpenFactura emission for Boletas (39)
  async issueBoletaFromPos(posTransactionId: string, opts: { receiverRUT?: string; receiverName?: string; sendEmail?: boolean; emitNow?: boolean } = {}) {
    const prismaAny = this.prisma as any;
    const tx = await prismaAny.pOSTransaction.findUnique({
      where: { id: posTransactionId },
      include: { items: true },
    });
    if (!tx) {
      throw new Error('POS transaction not found');
    }

    // Compute simple totals from POS transaction
    const totalAmount = Number(tx.totalAmount || tx.saleAmount || 0);
    const netAmount = Math.round(totalAmount / 1.19 * 100) / 100; // approx 19% IVA
    const taxAmount = Math.round((totalAmount - netAmount) * 100) / 100;

    // Create local draft document for now (no external emission yet)
    const doc = await prismaAny.taxDocument.create({
      data: {
        type: 'BOLETA',
        documentCode: 39,
        receiverRUT: opts.receiverRUT || null,
        receiverName: opts.receiverName || tx.merchant || null,
        netAmount,
        taxAmount,
        totalAmount,
        status: opts.emitNow ? 'PENDING' : 'DRAFT',
        posTransactionId: tx.id,
        notes: opts.emitNow ? 'Emitting to OpenFactura...' : 'Draft created from POS.',
        items: {
          create: (tx.items || []).map((it: any) => ({
            description: it.name,
            quantity: it.quantity ? Number(it.quantity) : 1,
            unitPrice: it.price ? Number(it.price) : 0,
            net: it.price ? Number(it.price) : 0,
            tax: 0,
            total: it.price ? Number(it.price) : 0,
            taxExempt: false,
          })),
=======
    const [documents, total] = await Promise.all([
      this.prisma.taxDocument.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
>>>>>>> frontend-deploy
        },
      }),
      this.prisma.taxDocument.count(),
    ]);

    return {
<<<<<<< HEAD
      // Document identification
      codigoTipoDocumento: 39, // Boleta Electrónica
      rutEmisor: process.env.COMPANY_RUT || "78188363-8", // Company RUT
      rutReceptor: document.receiverRUT || "66666666-6", // Default RUT for anonymous
      
      // Document details
      fechaEmision: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      indicadorFacturacionExenta: 0, // Not exempt
      
      // Amounts
      montoNeto: Math.round(document.netAmount * 100) / 100,
      montoIva: Math.round(document.taxAmount * 100) / 100,
      montoTotal: Math.round(document.totalAmount * 100) / 100,
      
      // Items detail
      detalle: document.items.map((item: any, index: number) => ({
        numeroLinea: index + 1,
        codigoItem: item.id || `ITEM-${index + 1}`,
        nombreItem: item.description || 'Producto/Servicio',
        cantidad: item.quantity || 1,
        unidadMedida: "UN",
        precioUnitario: Math.round(item.unitPrice * 100) / 100,
        montoDescuento: 0,
        montoItem: Math.round(item.total * 100) / 100,
        indicadorExento: item.taxExempt ? 1 : 0
      })),

      // Optional receiver info
      ...(document.receiverName && { nombreReceptor: document.receiverName }),
      ...(document.receiverEmail && { emailReceptor: document.receiverEmail }),
      
      // Additional config
      enviarPorEmail: false, // Can be made configurable
      generarPdf: true,
      generarXml: true
=======
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
>>>>>>> frontend-deploy
    };
  }

  async getTaxDocumentById(id: string) {
    return this.prisma.taxDocument.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async getTaxDocumentStats() {
    const [total, byStatus, byType, recentTotal] = await Promise.all([
      this.prisma.taxDocument.count(),
      this.prisma.taxDocument.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.taxDocument.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.taxDocument.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    const totalAmount = await this.prisma.taxDocument.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'ISSUED' },
    });

    return {
<<<<<<< HEAD
      // Document identification
      codigoTipoDocumento: 33, // Factura Electrónica
      rutEmisor: process.env.COMPANY_RUT || "78188363-8", // Company RUT
      rutReceptor: document.receiverRUT,
      
      // Document details
      fechaEmision: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      indicadorFacturacionExenta: 0, // Not exempt
      
      // Amounts
      montoNeto: Math.round(document.netAmount * 100) / 100,
      montoIva: Math.round(document.taxAmount * 100) / 100,
      montoTotal: Math.round(document.totalAmount * 100) / 100,
      
      // Items detail
      detalle: document.items.map((item: any, index: number) => ({
        numeroLinea: index + 1,
        codigoItem: item.id || `ITEM-${index + 1}`,
        nombreItem: item.description || 'Producto/Servicio',
        cantidad: item.quantity || 1,
        unidadMedida: "UN",
        precioUnitario: Math.round(item.unitPrice * 100) / 100,
        montoDescuento: 0,
        montoItem: Math.round(item.total * 100) / 100,
        indicadorExento: item.taxExempt ? 1 : 0
      })),

      // Required receiver info for Facturas
      nombreReceptor: document.receiverName || 'Cliente',
      ...(document.receiverEmail && { emailReceptor: document.receiverEmail }),
      
      // Additional config
      enviarPorEmail: !!document.receiverEmail,
      generarPdf: true,
      generarXml: true
    };
  }

  // Fetch received documents from OpenFactura (/v2/dte/document/received)
  async fetchReceivedDocuments(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    tipoDocumento?: number; // 33=Factura, 39=Boleta, 56=Nota Débito, 61=Nota Crédito
    rutEmisor?: string;
    dateField?: 'FchEmis' | 'FchRecepOF' | 'FchRecepSII';
  } = {}) {
    const companyRut = process.env.COMPANY_RUT || '78188363-8';
    const rutWithoutDv = companyRut.split('-')[0];

    const requestBody: any = {
      Page: params.page || 1,
    };

    // Add document type filter
    if (params.tipoDocumento) {
      requestBody.TipoDTE = { eq: params.tipoDocumento.toString() };
    }

    // Add RUT emisor filter
    if (params.rutEmisor) {
      const rutNumber = params.rutEmisor.replace(/[^0-9]/g, '');
      requestBody.RUTEmisor = { eq: rutNumber };
    }

    // Add date filters - use specified field or default to reception date
    const dateField = params.dateField || 'FchRecepOF';
    if (params.startDate) {
      requestBody[dateField] = { gte: params.startDate };
    }
    if (params.endDate) {
      if (requestBody[dateField]) {
        requestBody[dateField].lte = params.endDate;
      } else {
        requestBody[dateField] = { lte: params.endDate };
      }
    }

    try {
      this.logger.log(`Fetching received documents from OpenFactura for RUT: ${companyRut}`);
      const response = await this.api.post('/v2/dte/document/received', requestBody);

      const data = response.data;
      this.logger.log(`Received documents response:`, JSON.stringify(data, null, 2));

      if (data && data.data && Array.isArray(data.data)) {
        const normalizedDocs = data.data.map(doc => ({
          // Emisor information
          rutEmisor: doc.RUTEmisor,
          dvEmisor: doc.DV,
          nombreEmisor: doc.RznSoc,
          rutEmisorCompleto: `${doc.RUTEmisor}-${doc.DV}`,

          // Document identification
          tipoDocumento: doc.TipoDTE,
          tipoDocumentoNombre: this.getDocumentTypeName(doc.TipoDTE),
          folio: doc.Folio,

          // Dates with proper handling
          fechaEmision: doc.FchEmis,
          fechaRecepcionSII: doc.FchRecepSII || null,
          fechaRecepcionOF: doc.FchRecepOF,

          // Financial amounts
          montoExento: Number(doc.MntExe) || 0,
          montoNeto: Number(doc.MntNeto) || 0,
          iva: Number(doc.IVA) || 0,
          montoTotal: Number(doc.MntTotal) || 0,

          // Payment and transaction info
          formaPago: doc.FmaPago,
          formaPagoDescripcion: this.getPaymentMethodDescription(doc.FmaPago),
          tipoTransaccionCompra: doc.TpoTranCompra,
          tipoTransaccionCompraDescripcion: this.getPurchaseTypeDescription(doc.TpoTranCompra),

          // Acknowledgments with enhanced processing
          acuses: (doc.Acuses || []).map(acuse => ({
            codigoEvento: acuse.codEvento,
            fechaEvento: acuse.fechaEvento,
            estado: acuse.estado,
            descripcion: this.getAcknowledgmentDescription(acuse.codEvento),
          })),

          // Status indicators
          tieneSiiRecepcion: !!doc.FchRecepSII,
          tieneAcuses: Array.isArray(doc.Acuses) && doc.Acuses.length > 0,

          // Enhanced metadata
          diasEmisionRecepcion: doc.FchEmis && doc.FchRecepOF
            ? Math.ceil((new Date(doc.FchRecepOF).getTime() - new Date(doc.FchEmis).getTime()) / (1000 * 60 * 60 * 24))
            : null,

          // Full raw data for debugging/future use
          rawData: doc,
        }));

        return {
          currentPage: data.current_page,
          lastPage: data.last_page,
          total: data.total,
          documents: normalizedDocs,
        };
      }

      return {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        documents: [],
      };
    } catch (error) {
      this.logger.error('Failed to fetch received documents from OpenFactura:', error.response?.data || error.message);
      throw new Error(`OpenFactura received documents fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Sync received documents (lightweight version for auto-sync)
  async syncReceivedDocuments() {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const startDate = lastWeek.toISOString().split('T')[0];

    try {
      const result = await this.importReceivedDocuments({ 
        startDate, 
        dryRun: false 
      });
      
      if (result.totalImported > 0) {
        this.logger.log(`Auto-sync: Imported ${result.totalImported} new received documents`);
      }
      
      return result;
    } catch (error) {
      this.logger.warn('Auto-sync failed:', error.message);
      throw error;
    }
  }

  // Import received documents into local database
  async importReceivedDocuments(params: { startDate?: string; endDate?: string; dryRun?: boolean } = {}) {
    this.logger.log('Starting import of received documents from OpenFactura...');

    const results = {
      totalFetched: 0,
      totalImported: 0,
      totalSkipped: 0,
      errors: [],
      imported: [],
    };

    try {
      // Fetch received documents
      const fetchParams: any = {};
      if (params.startDate) fetchParams.startDate = params.startDate;
      if (params.endDate) fetchParams.endDate = params.endDate;

      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const receivedDocs = await this.fetchReceivedDocuments({ ...fetchParams, page });
        results.totalFetched += receivedDocs.documents.length;

        for (const doc of receivedDocs.documents) {
          try {
            const existingDoc = await (this.prisma as any).taxDocument.findFirst({
              where: {
                folio: doc.folio.toString(),
                type: this.mapDocumentType(doc.tipoDocumento),
                emitterRUT: `${doc.rutEmisor}-${doc.dvEmisor}`,
              },
            });

            if (existingDoc) {
              results.totalSkipped++;
              continue;
            }

            if (params.dryRun) {
              this.logger.log(`[DRY RUN] Would import: ${doc.nombreEmisor} - ${this.mapDocumentType(doc.tipoDocumento)} #${doc.folio}`);
              results.totalImported++;
              continue;
            }

            // Import into database
            const importedDoc = await (this.prisma as any).taxDocument.create({
              data: {
                type: this.mapDocumentType(doc.tipoDocumento),
                documentCode: doc.tipoDocumento,
                folio: doc.folio.toString(),
                status: 'ACCEPTED', // Received documents are typically accepted

                // Supplier info (emitter)
                emitterRUT: `${doc.rutEmisor}-${doc.dvEmisor}`,
                emitterName: doc.nombreEmisor,

                // We are the receiver
                receiverRUT: process.env.COMPANY_RUT || '78188363-8',
                receiverName: 'MURALLA SPA',

                // Amounts
                netAmount: doc.montoNeto,
                taxAmount: doc.iva,
                totalAmount: doc.montoTotal,

                // Dates
                issuedAt: new Date(doc.fechaEmision),

                // Additional info stored in rawResponse and notes
                rawResponse: {
                  ...doc.rawData,
                  // Enhanced metadata
                  formaPagoDescripcion: this.getPaymentMethodDescription(doc.formaPago),
                  tipoTransaccionCompraDescripcion: this.getPurchaseTypeDescription(doc.tipoTransaccionCompra),
                  acusesDetalle: (doc.rawData.Acuses || []).map(acuse => ({
                    ...acuse,
                    descripcion: this.getAcknowledgmentDescription(acuse.codEvento),
                  })),
                  diasEmisionRecepcion: doc.fechaEmision && doc.fechaRecepcionOF
                    ? Math.ceil((new Date(doc.fechaRecepcionOF).getTime() - new Date(doc.fechaEmision).getTime()) / (1000 * 60 * 60 * 24))
                    : null,
                },
                notes: [
                  `Imported from OpenFactura`,
                  `Supplier: ${doc.nombreEmisor}`,
                  `Payment: ${this.getPaymentMethodDescription(doc.formaPago)}`,
                  `Purchase Type: ${this.getPurchaseTypeDescription(doc.tipoTransaccionCompra)}`,
                  doc.rawData.Acuses && doc.rawData.Acuses.length > 0
                    ? `Acknowledgments: ${doc.rawData.Acuses.length}`
                    : null,
                  doc.fechaRecepcionSII ? 'SII Reception Confirmed' : 'SII Reception Pending',
                ].filter(Boolean).join(' | '),
              },
            });

            results.totalImported++;
            results.imported.push({
              id: importedDoc.id,
              folio: doc.folio,
              supplier: doc.nombreEmisor,
              type: this.mapDocumentType(doc.tipoDocumento),
              amount: doc.montoTotal,
            });

            this.logger.log(`Imported: ${doc.nombreEmisor} - ${this.mapDocumentType(doc.tipoDocumento)} #${doc.folio} - $${doc.montoTotal}`);
          } catch (error) {
            results.errors.push({
              folio: doc.folio,
              supplier: doc.nombreEmisor,
              error: error.message,
            });
            this.logger.error(`Failed to import document ${doc.folio}:`, error);
          }
        }

        // Check if there are more pages
        hasMorePages = page < receivedDocs.lastPage;
        page++;
      }

      this.logger.log(`Import completed: ${results.totalImported} imported, ${results.totalSkipped} skipped, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      this.logger.error('Import failed:', error);
      throw error;
    }
  }

  // Send acknowledgment for received document using /v2/dte/document/received/accuse
  async acknowledgeReceivedDocument(
    folio: string,
    params: {
      rutEmisor: string;
      tipoDocumento: number;
      tipoAcuse: 'ACD' | 'RCD' | 'ERM' | 'RFP' | 'RFT';
    }
  ) {
    const payload = {
      rut: params.rutEmisor,
      dte: params.tipoDocumento,
      folio: parseInt(folio),
      acuse: params.tipoAcuse,
    };

    try {
      this.logger.log(`Sending acknowledgment for document ${folio}:`, payload);
      const response = await this.api.post('/v2/dte/document/received/accuse', payload);

      const result = response.data;
      this.logger.log(`Acknowledgment response:`, result);

      // Update local document if it exists
      try {
        const existingDoc = await (this.prisma as any).taxDocument.findFirst({
          where: {
            folio: folio,
            type: this.mapDocumentType(params.tipoDocumento),
            emitterRUT: params.rutEmisor,
          },
        });

        if (existingDoc) {
          await (this.prisma as any).taxDocument.update({
            where: { id: existingDoc.id },
            data: {
              notes: `${existingDoc.notes || ''} | Acknowledgment sent: ${params.tipoAcuse} - ${this.getAcknowledgmentDescription(params.tipoAcuse)}`,
              rawResponse: {
                ...existingDoc.rawResponse,
                lastAcknowledgment: {
                  type: params.tipoAcuse,
                  description: this.getAcknowledgmentDescription(params.tipoAcuse),
                  sentAt: new Date().toISOString(),
                  response: result,
                },
              },
            },
          });
        }
      } catch (updateError) {
        this.logger.warn('Failed to update local document with acknowledgment:', updateError.message);
      }

      return {
        success: true,
        acknowledgment: {
          folio: parseInt(folio),
          rutEmisor: params.rutEmisor,
          tipoDocumento: params.tipoDocumento,
          tipoAcuse: params.tipoAcuse,
          descripcion: this.getAcknowledgmentDescription(params.tipoAcuse),
        },
        openFacturaResponse: result,
      };
    } catch (error) {
      this.logger.error('Failed to send acknowledgment:', error.response?.data || error.message);
      throw new Error(`Acknowledgment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get document PDF - enhanced to fetch from OpenFactura if needed
  async getDocumentPDF(id: string) {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error('Document not found');
    }

    // Try stored PDF URL first
    if (document.pdfUrl) {
      try {
        const response = await this.api.get(document.pdfUrl, {
          responseType: 'arraybuffer'
        });
        return {
          data: response.data,
          headers: response.headers,
          contentType: 'application/pdf'
        };
      } catch (error) {
        this.logger.warn('Stored PDF URL failed, trying OpenFactura API:', error.message);
      }
    }

    // Try to fetch PDF from OpenFactura using document identifiers
    if (document.emitterRUT && document.folio && document.documentCode) {
      try {
        return await this.fetchPDFFromOpenFactura({
          rutEmisor: document.emitterRUT,
          folio: document.folio,
          tipoDocumento: document.documentCode,
          isReceived: !!document.emitterRUT, // If we have emitterRUT, it's a received document
        });
      } catch (error) {
        this.logger.warn('OpenFactura PDF fetch failed:', error.message);
      }
    }

    throw new Error('PDF not available for this document');
  }

  // Fetch PDF directly from OpenFactura using document identifiers
  async fetchPDFFromOpenFactura(params: {
    rutEmisor: string;
    folio: string;
    tipoDocumento: number;
    isReceived?: boolean;
  }) {
    // For received documents, try common PDF endpoints
    const endpoints = [
      `/v2/dte/document/pdf?rutEmisor=${params.rutEmisor}&folio=${params.folio}&tipoDte=${params.tipoDocumento}`,
      `/v2/dte/document/${params.rutEmisor}/${params.tipoDocumento}/${params.folio}/pdf`,
      `/v2/dte/received/pdf?rutEmisor=${params.rutEmisor}&folio=${params.folio}&tipoDte=${params.tipoDocumento}`,
      `/v2/pdf/${params.rutEmisor}/${params.tipoDocumento}/${params.folio}`,
      `/v2/dte/document/received/pdf?rutEmisor=${params.rutEmisor}&folio=${params.folio}&tipoDte=${params.tipoDocumento}`,
    ];

    for (const endpoint of endpoints) {
      try {
        this.logger.log(`Trying PDF endpoint: ${endpoint}`);
        const response = await this.api.get(endpoint, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        if (response.data && response.data.byteLength > 1000) { // Ensure it's actually a PDF
          this.logger.log(`✅ PDF found via ${endpoint}`);
          return {
            data: response.data,
            headers: response.headers,
            contentType: 'application/pdf',
            source: endpoint,
          };
        }
      } catch (error) {
        this.logger.debug(`PDF endpoint ${endpoint} failed:`, error.response?.status || error.message);
        continue;
      }
    }

    throw new Error('PDF not available from OpenFactura');
  }

  // Get document in different formats
  async getDocumentInFormat(id: string, format: 'pdf' | 'xml' | 'json') {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error('Document not found');
    }

    switch (format) {
      case 'pdf':
        return await this.getDocumentPDF(id);

      case 'xml':
        return await this.getDocumentXML(id);

      case 'json':
        return {
          data: JSON.stringify(document, null, 2),
          contentType: 'application/json',
          headers: {},
        };

      default:
        throw new Error('Unsupported format');
    }
  }

  // Get document XML
  async getDocumentXML(id: string) {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error('Document not found');
    }

    // Try stored XML URL first
    if (document.xmlUrl) {
      try {
        const response = await this.api.get(document.xmlUrl);
        return {
          data: response.data,
          headers: response.headers,
          contentType: 'application/xml',
        };
      } catch (error) {
        this.logger.warn('Stored XML URL failed, trying OpenFactura API:', error.message);
      }
    }

    // Try to fetch XML from OpenFactura
    if (document.emitterRUT && document.folio && document.documentCode) {
      const endpoints = [
        `/v2/dte/document/xml?rutEmisor=${document.emitterRUT}&folio=${document.folio}&tipoDte=${document.documentCode}`,
        `/v2/dte/document/${document.emitterRUT}/${document.documentCode}/${document.folio}/xml`,
        `/v2/xml/${document.emitterRUT}/${document.documentCode}/${document.folio}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.api.get(endpoint);
          if (response.data) {
            return {
              data: response.data,
              headers: response.headers,
              contentType: 'application/xml',
              source: endpoint,
            };
          }
        } catch (error) {
          continue;
        }
      }
    }

    throw new Error('XML not available for this document');
  }
}
=======
      total,
      totalAmount: totalAmount._sum.totalAmount || 0,
      recentTotal,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
    };
  }
}
>>>>>>> frontend-deploy
