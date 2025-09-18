import { Controller, Get, Post, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvoicingService } from './invoicing.service';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invoicing')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(private readonly service: InvoicingService) {}

  // Connectivity check (uses taxpayer info endpoint)
  @Public()
  @Get('health')
  async health(@Query('rut') rut?: string) {
    return this.service.healthCheck(rut);
  }

  // List stored documents (Phase 1: local DB)
  @Get('documents')
  async list(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('includeOpenFactura') includeOpenFactura?: string,
    @Query('openFacturaOnly') openFacturaOnly?: string,
    @Query('syncReceived') syncReceived?: string,
  ) {
    return this.service.listDocuments({
      type,
      status,
      startDate,
      endDate,
      search,
      includeOpenFactura: includeOpenFactura === undefined ? undefined : includeOpenFactura === 'true',
      openFacturaOnly: openFacturaOnly === 'true',
      syncReceived: syncReceived === undefined ? undefined : syncReceived === 'true',
    });
  }

  @Get('documents/:id')
  async detail(@Param('id') id: string) {
    return this.service.getDocument(id);
  }

  // API Discovery endpoint for debugging
  @Public()
  @Get('discover-endpoints')
  async discoverEndpoints() {
    return this.service.discoverWorkingEndpoints();
  }

  // Public helper to pull recent DTE directly from OpenFactura (read-only)
  // Example: GET /invoicing/openfactura/documents?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  @Public()
  @Get('openfactura/documents')
  async listOpenFactura(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listDocuments({
      type,
      status,
      startDate,
      endDate,
      search,
      includeOpenFactura: true,
      openFacturaOnly: true,
    });
  }

  // Lightweight link checker for costs: GET /invoicing/links/cost?ids=a,b,c
  @Get('links/cost')
  async costLinks(@Query('ids') ids?: string) {
    const list = (ids || '').split(',').map(s => s.trim()).filter(Boolean);
    const links = await this.service.getCostLinks(list);
    // Normalize to an object keyed by costId with last status/folio
    const map: Record<string, { count: number; status: string; folio?: string }> = {};
    for (const d of links) {
      map[d.costId] = {
        count: (map[d.costId]?.count || 0) + 1,
        status: d.status,
        folio: d.folio,
      };
    }
    return map;
  }

  // Phase 2: Real OpenFactura Boleta emission from POS
  @Post('boletas/from-pos/:posTransactionId')
  async boletaFromPos(
    @Param('posTransactionId') posTransactionId: string,
    @Body() body: { receiverRUT?: string; receiverName?: string; receiverEmail?: string; sendEmail?: boolean; emitNow?: boolean }
  ) {
    const result = await this.service.issueBoletaFromPos(posTransactionId, body || {});
    
    if (result.emission) {
      return {
        success: true,
        message: `Boleta ${result.emission.success ? 'emitted successfully' : 'emission failed'}`,
        data: result.document,
        emission: result.emission,
        folio: result.emission.folio,
        pdfUrl: result.emission.pdfUrl
      };
    }
    
    return {
      success: true,
      message: 'Draft document created. Use emitNow: true to emit to OpenFactura.',
      data: result.document,
    };
  }

  // Phase 2: Real OpenFactura Factura emission from Cost
  @Post('facturas/from-cost/:costId')
  async facturaFromCost(
    @Param('costId') costId: string,
    @Body() body: { receiverRUT: string; receiverName?: string; receiverEmail?: string; emitNow?: boolean }
  ) {
    if (!body.receiverRUT) {
      return { success: false, error: 'receiverRUT is required for Facturas' };
    }

    const result = await this.service.issueFacturaFromCost(costId, body);
    
    if (result.emission) {
      return {
        success: true,
        message: `Factura ${result.emission.success ? 'emitted successfully' : 'emission failed'}`,
        data: result.document,
        emission: result.emission,
        folio: result.emission.folio,
        pdfUrl: result.emission.pdfUrl
      };
    }
    
    return {
      success: true,
      message: 'Draft Factura created. Use emitNow: true to emit to OpenFactura.',
      data: result.document,
    };
  }

  // Emit existing draft document to OpenFactura
  @Post('documents/:id/emit')
  async emitDocument(@Param('id') id: string) {
    const document = await this.service.getDocument(id);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    if (document.status !== 'DRAFT') {
      return { success: false, error: 'Only DRAFT documents can be emitted' };
    }

    try {
      let emissionResult;
      if (document.type === 'BOLETA') {
        emissionResult = await this.service.emitBoletaToOpenFactura(document);
      } else if (document.type === 'FACTURA') {
        emissionResult = await this.service.emitFacturaToOpenFactura(document);
      } else {
        return { success: false, error: 'Unsupported document type for emission' };
      }

      return {
        success: true,
        message: 'Document emitted successfully',
        emission: emissionResult
      };
    } catch (error) {
      return {
        success: false,
        error: `Emission failed: ${error.message}`
      };
    }
  }

  // Fetch received documents from OpenFactura (supplier invoices)
  @Public()
  @Get('received-documents')
  async fetchReceivedDocuments(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('tipoDocumento') tipoDocumento?: string, // 33=Factura, 39=Boleta
    @Query('rutEmisor') rutEmisor?: string,
    @Query('dateField') dateField?: string, // FchEmis, FchRecepOF, FchRecepSII
  ) {
    return this.service.fetchReceivedDocuments({
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      tipoDocumento: tipoDocumento ? parseInt(tipoDocumento) : undefined,
      rutEmisor,
      dateField: dateField as 'FchEmis' | 'FchRecepOF' | 'FchRecepSII',
    });
  }

  // Import received documents from OpenFactura into local database
  @Post('received-documents/import')
  async importReceivedDocuments(
    @Body() body: { startDate?: string; endDate?: string; dryRun?: boolean } = {}
  ) {
    return this.service.importReceivedDocuments(body);
  }

  // Send acknowledgment for received document
  @Post('received-documents/:folio/acknowledge')
  async acknowledgeReceivedDocument(
    @Param('folio') folio: string,
    @Body() body: {
      rutEmisor: string;
      tipoDocumento: number;
      tipoAcuse: 'ACD' | 'RCD' | 'ERM' | 'RFP' | 'RFT';
    }
  ) {
    return this.service.acknowledgeReceivedDocument(folio, body);
  }

  // Get document in various formats (PDF, XML, JSON)
  @Get('documents/:id/:format')
  async getDocumentInFormat(
    @Param('id') id: string,
    @Param('format') format: string,
    @Query('display') display?: string, // 'inline' or 'download'
    @Res() res: Response
  ) {
    try {
      const validFormats = ['pdf', 'xml', 'json'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
        });
      }

      const documentData = await this.service.getDocumentInFormat(id, format as 'pdf' | 'xml' | 'json');
      const displayMode = display === 'download' ? 'attachment' : 'inline';

      // Set appropriate headers based on format
      const headers: any = {
        'Content-Type': documentData.contentType,
      };

      // Set filename based on format
      let filename: string;
      switch (format) {
        case 'pdf':
          filename = `document-${id}.pdf`;
          break;
        case 'xml':
          filename = `document-${id}.xml`;
          break;
        case 'json':
          filename = `document-${id}.json`;
          break;
        default:
          filename = `document-${id}.${format}`;
      }

      headers['Content-Disposition'] = `${displayMode}; filename="${filename}"`;

      // For PDF viewing in browser
      if (format === 'pdf' && displayMode === 'inline') {
        headers['X-Frame-Options'] = 'SAMEORIGIN';
        headers['Content-Security-Policy'] = "frame-ancestors 'self'";
      }

      res.set(headers);
      res.send(documentData.data);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  // Legacy PDF endpoint (redirects to new format)
  @Get('documents/:id/pdf')
  async getDocumentPDF(
    @Param('id') id: string,
    @Query('display') display?: string,
    @Res() res: Response
  ) {
    return this.getDocumentInFormat(id, 'pdf', display, res);
  }

  // Get document preview info (without downloading the full document)
  @Get('documents/:id/preview')
  async getDocumentPreview(@Param('id') id: string) {
    const document = await this.service.getDocument(id);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const availableFormats = [];

    // Check if PDF is available
    try {
      await this.service.getDocumentPDF(id);
      availableFormats.push({
        format: 'pdf',
        url: `/invoicing/documents/${id}/pdf`,
        displayUrl: `/invoicing/documents/${id}/pdf?display=inline`,
        downloadUrl: `/invoicing/documents/${id}/pdf?display=download`,
        description: 'PDF Document'
      });
    } catch (error) {
      // PDF not available
    }

    // Check if XML is available
    try {
      await this.service.getDocumentXML(id);
      availableFormats.push({
        format: 'xml',
        url: `/invoicing/documents/${id}/xml`,
        displayUrl: `/invoicing/documents/${id}/xml?display=inline`,
        downloadUrl: `/invoicing/documents/${id}/xml?display=download`,
        description: 'XML Document'
      });
    } catch (error) {
      // XML not available
    }

    // JSON is always available
    availableFormats.push({
      format: 'json',
      url: `/invoicing/documents/${id}/json`,
      displayUrl: `/invoicing/documents/${id}/json?display=inline`,
      downloadUrl: `/invoicing/documents/${id}/json?display=download`,
      description: 'JSON Data'
    });

    return {
      success: true,
      document: {
        id: document.id,
        type: document.type,
        folio: document.folio,
        emitterName: document.emitterName || 'Unknown',
        totalAmount: document.totalAmount,
      },
      availableFormats,
      viewerRecommendation: availableFormats.find(f => f.format === 'pdf')
        ? 'PDF viewing recommended for best experience'
        : 'XML or JSON viewing available'
    };
  }
}
