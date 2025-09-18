import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InvoicingService } from './invoicing.service';

@Controller('invoicing')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get('tax-documents')
  async getTaxDocuments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    console.log('Controller method called, service is:', this.invoicingService);
    if (!this.invoicingService) {
      throw new Error('InvoicingService is not injected properly');
    }
    return this.invoicingService.getTaxDocuments(page, limit);
  }

  @Get('tax-documents/stats')
  async getTaxDocumentStats() {
    return this.invoicingService.getTaxDocumentStats();
  }

  @Get('tax-documents/:id')
  async getTaxDocumentById(@Param('id') id: string) {
    return this.invoicingService.getTaxDocumentById(id);
  }
}