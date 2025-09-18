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
  ) {
    return this.service.listDocuments({
      type,
      status,
      startDate,
      endDate,
      search,
      includeOpenFactura: includeOpenFactura === undefined ? undefined : includeOpenFactura === 'true',
      openFacturaOnly: openFacturaOnly === 'true',
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

  // Get document PDF
  @Get('documents/:id/pdf')
  async getDocumentPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const pdfData = await this.service.getDocumentPDF(id);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="document-${id}.pdf"`,
      });
      
      res.send(pdfData.data);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}
