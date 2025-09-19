import { Module } from '@nestjs/common';
import { InvoicingController } from './invoicing.controller';
import { InvoicingService } from './invoicing.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InvoicingController],
  providers: [InvoicingService, PrismaService],
  exports: [InvoicingService],
})
export class InvoicingModule {}