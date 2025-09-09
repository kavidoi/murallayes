import { Module } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { InvoicingController } from './invoicing.controller';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Module({
  controllers: [InvoicingController],
  providers: [InvoicingService, PrismaService],
  exports: [InvoicingService],
})
export class InvoicingModule {}

