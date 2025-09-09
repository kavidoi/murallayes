import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { BankController } from '../modules/finance/controllers/bank.controller';

@Module({
  imports: [MercadoPagoModule],
  controllers: [FinanceController, BankController],
  providers: [
    FinanceService,
    PrismaService,
  ],
  exports: [FinanceService],
})
export class FinanceModule {}
