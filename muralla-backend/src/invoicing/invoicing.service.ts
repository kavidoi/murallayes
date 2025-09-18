import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);
  private api: AxiosInstance;

  constructor(private prisma: PrismaService) {
    const baseURL = (process.env.OPENFACTURA_BASE_URL || 'https://api.haulmer.com').replace(/\/$/, '');
    const key = process.env.OPENFACTURA_API_KEY || '';
    this.api = axios.create({
      baseURL,
      headers: {
        apikey: key,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      timeout: 15000,
    });
  }

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
        },
      },
      include: { items: true },
    });

    // Phase 2: Real emission to OpenFactura if requested
    if (opts.emitNow) {
      try {
        const emissionResult = await this.emitBoletaToOpenFactura(doc);
        return { created: true, document: doc, emission: emissionResult };
      } catch (error) {
        this.logger.error('Failed to emit to OpenFactura:', error);
        // Update document status to ERROR
        await prismaAny.taxDocument.update({
          where: { id: doc.id },
          data: { 
            status: 'ERROR', 
            notes: `Emission failed: ${error.message}` 
          }
        });
        throw new Error(`Document created but emission failed: ${error.message}`);
      }
    }

    return { created: true, document: doc };
  }

  // Real OpenFactura emission for Boleta (document code 39)
  async emitBoletaToOpenFactura(document: any) {
    const payload = this.buildBoletaPayload(document);
    
    try {
      this.logger.log(`Emitting Boleta to OpenFactura: ${document.id}`);
      const response = await this.api.post('/v2/dte/document', payload);
      
      const emissionData = response.data;
      this.logger.log(`OpenFactura response:`, emissionData);
      
      // Update document with emission results
      const prismaAny = this.prisma as any;
      const updatedDoc = await prismaAny.taxDocument.update({
        where: { id: document.id },
        data: {
          status: emissionData.estado === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING',
          folio: emissionData.folio?.toString(),
          openFacturaId: emissionData.id?.toString(),
          pdfUrl: emissionData.urlPdf,
          xmlUrl: emissionData.urlXml,
          issuedAt: emissionData.fechaEmision ? new Date(emissionData.fechaEmision) : new Date(),
          rawResponse: emissionData,
          notes: `Emitted to OpenFactura. Status: ${emissionData.estado}`,
        }
      });

      return {
        success: true,
        folio: emissionData.folio,
        status: emissionData.estado,
        pdfUrl: emissionData.urlPdf,
        xmlUrl: emissionData.urlXml,
        openFacturaId: emissionData.id,
        document: updatedDoc
      };
    } catch (error) {
      this.logger.error('OpenFactura emission failed:', error.response?.data || error.message);
      throw new Error(`OpenFactura emission failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Build OpenFactura payload for Boleta (39)
  private buildBoletaPayload(document: any) {
    return {
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
    };
  }

  // Create Factura from Cost (document code 33)
  async issueFacturaFromCost(costId: string, opts: { receiverRUT: string; receiverName?: string; receiverEmail?: string; emitNow?: boolean } = { receiverRUT: '' }) {
    const prismaAny = this.prisma as any;
    const cost = await prismaAny.cost.findUnique({
      where: { id: costId },
      include: { lines: true },
    });
    
    if (!cost) {
      throw new Error('Cost record not found');
    }

    if (!opts.receiverRUT) {
      throw new Error('Receiver RUT is required for Facturas');
    }

    // Calculate totals from cost lines
    const totalAmount = Number(cost.total || 0);
    const netAmount = Math.round(totalAmount / 1.19 * 100) / 100;
    const taxAmount = Math.round((totalAmount - netAmount) * 100) / 100;

    // Create tax document
    const doc = await prismaAny.taxDocument.create({
      data: {
        type: 'FACTURA',
        documentCode: 33,
        receiverRUT: opts.receiverRUT,
        receiverName: opts.receiverName || 'Cliente',
        receiverEmail: opts.receiverEmail,
        netAmount,
        taxAmount,
        totalAmount,
        status: opts.emitNow ? 'PENDING' : 'DRAFT',
        costId: cost.id,
        notes: opts.emitNow ? 'Emitting to OpenFactura...' : 'Draft Factura created from Cost.',
        items: {
          create: (cost.lines || [{ description: cost.description || 'Servicio', price: cost.total }]).map((line: any, index: number) => ({
            description: line.description || cost.description || 'Servicio',
            quantity: line.quantity || 1,
            unitPrice: line.price ? Number(line.price) : Number(cost.total),
            net: line.price ? Number(line.price) : Number(cost.total),
            tax: 0,
            total: line.price ? Number(line.price) : Number(cost.total),
            taxExempt: false,
          })),
        },
      },
      include: { items: true },
    });

    // Emit to OpenFactura if requested
    if (opts.emitNow) {
      try {
        const emissionResult = await this.emitFacturaToOpenFactura(doc);
        return { created: true, document: doc, emission: emissionResult };
      } catch (error) {
        this.logger.error('Failed to emit Factura to OpenFactura:', error);
        await prismaAny.taxDocument.update({
          where: { id: doc.id },
          data: { 
            status: 'ERROR', 
            notes: `Factura emission failed: ${error.message}` 
          }
        });
        throw new Error(`Factura created but emission failed: ${error.message}`);
      }
    }

    return { created: true, document: doc };
  }

  // Real OpenFactura emission for Factura (document code 33)
  async emitFacturaToOpenFactura(document: any) {
    const payload = this.buildFacturaPayload(document);
    
    try {
      this.logger.log(`Emitting Factura to OpenFactura: ${document.id}`);
      const response = await this.api.post('/v2/dte/document', payload);
      
      const emissionData = response.data;
      this.logger.log(`OpenFactura Factura response:`, emissionData);
      
      // Update document with emission results
      const prismaAny = this.prisma as any;
      const updatedDoc = await prismaAny.taxDocument.update({
        where: { id: document.id },
        data: {
          status: emissionData.estado === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING',
          folio: emissionData.folio?.toString(),
          openFacturaId: emissionData.id?.toString(),
          pdfUrl: emissionData.urlPdf,
          xmlUrl: emissionData.urlXml,
          issuedAt: emissionData.fechaEmision ? new Date(emissionData.fechaEmision) : new Date(),
          rawResponse: emissionData,
          notes: `Factura emitted to OpenFactura. Status: ${emissionData.estado}`,
        }
      });

      return {
        success: true,
        folio: emissionData.folio,
        status: emissionData.estado,
        pdfUrl: emissionData.urlPdf,
        xmlUrl: emissionData.urlXml,
        openFacturaId: emissionData.id,
        document: updatedDoc
      };
    } catch (error) {
      this.logger.error('OpenFactura Factura emission failed:', error.response?.data || error.message);
      throw new Error(`OpenFactura Factura emission failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Build OpenFactura payload for Factura (33)
  private buildFacturaPayload(document: any) {
    return {
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
  async fetchReceivedDocuments(params: { startDate?: string; endDate?: string; page?: number } = {}) {
    const companyRut = process.env.COMPANY_RUT || '78188363-8';
    const rutWithoutDv = companyRut.split('-')[0];

    const requestBody: any = {
      Page: params.page || 1,
    };

    // Add date filters if provided
    if (params.startDate) {
      requestBody.FchRecepOF = { gte: params.startDate };
    }
    if (params.endDate) {
      if (requestBody.FchRecepOF) {
        requestBody.FchRecepOF.lte = params.endDate;
      } else {
        requestBody.FchRecepOF = { lte: params.endDate };
      }
    }

    try {
      this.logger.log(`Fetching received documents from OpenFactura for RUT: ${companyRut}`);
      const response = await this.api.post('/v2/dte/document/received', requestBody);

      const data = response.data;
      this.logger.log(`Received documents response:`, JSON.stringify(data, null, 2));

      if (data && data.data && Array.isArray(data.data)) {
        const normalizedDocs = data.data.map(doc => ({
          rutEmisor: doc.RUTEmisor,
          dvEmisor: doc.DV,
          nombreEmisor: doc.RznSoc,
          tipoDocumento: doc.TipoDTE,
          folio: doc.Folio,
          fechaEmision: doc.FchEmis,
          fechaRecepcionSII: doc.FchRecepSII,
          fechaRecepcionOF: doc.FchRecepOF,
          montoExento: doc.MntExe || 0,
          montoNeto: doc.MntNeto || 0,
          iva: doc.IVA || 0,
          montoTotal: doc.MntTotal || 0,
          acuses: doc.Acuses || [],
          formaPago: doc.FmaPago,
          tipoTransaccionCompra: doc.TpoTranCompra,
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
                rawResponse: doc.rawData,
                notes: `Imported from OpenFactura - Supplier: ${doc.nombreEmisor} - Payment: ${doc.formaPago} - Purchase Type: ${doc.tipoTransaccionCompra}`,
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

  // Get document PDF
  async getDocumentPDF(id: string) {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.pdfUrl) {
      throw new Error('PDF not available for this document');
    }

    // Proxy the PDF from OpenFactura or return signed URL
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
      this.logger.error('Failed to fetch PDF:', error);
      throw new Error('PDF could not be retrieved');
    }
  }
}
