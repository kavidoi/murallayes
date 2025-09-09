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

  async healthCheck(rut: string = '76795561-8') {
    const res = await this.api.get(`/v2/dte/taxpayer/${encodeURIComponent(rut)}`);
    return res.data;
  }

  async listDocuments(params: { type?: string; status?: string; startDate?: string; endDate?: string; search?: string } = {}) {
    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.startDate || params.endDate) {
      where.issuedAt = {};
      if (params.startDate) where.issuedAt.gte = new Date(params.startDate + 'T00:00:00Z');
      if (params.endDate) where.issuedAt.lte = new Date(params.endDate + 'T23:59:59.999Z');
    }
    // simple search over receiver or folio
    if (params.search) {
      where.OR = [
        { receiverName: { contains: params.search, mode: 'insensitive' } },
        { receiverRUT: { contains: params.search, mode: 'insensitive' } },
        { folio: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const prismaAny = this.prisma as any;
    const docs = await prismaAny.taxDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 100,
    });
    return docs;
  }

  async getDocument(id: string) {
    const prismaAny = this.prisma as any;
    return prismaAny.taxDocument.findUnique({ where: { id }, include: { items: true } });
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
      rutEmisor: "76795561-8", // From environment or config
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
      rutEmisor: "76795561-8", // From environment or config
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

