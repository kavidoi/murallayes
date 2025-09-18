import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { TestController } from './test.controller';
import { InvoicingController } from './invoicing/invoicing.controller';
import { InvoicingService } from './invoicing/invoicing.service';

@Module({
  controllers: [TestController, InvoicingController],
  providers: [PrismaService, InvoicingService],
})
export class AppModule {}