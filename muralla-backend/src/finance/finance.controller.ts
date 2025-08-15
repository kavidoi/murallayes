import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { MercadoPagoService } from './mercado-pago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Public } from '../auth/public.decorator';
import { TransactionType, TransactionStatus } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  // Bank Account Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Post('accounts')
  createBankAccount(@Body() data: any, @Request() req: any) {
    return this.financeService.createBankAccount(data, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('accounts')
  findAllBankAccounts() {
    return this.financeService.findAllBankAccounts();
  }

  @UseGuards(JwtAuthGuard)
  @Get('accounts/:id')
  findBankAccount(@Param('id') id: string) {
    return this.financeService.findBankAccount(id);
  }

  // Transaction Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager', 'employee')
  @Post('transactions')
  createTransaction(@Body() data: any, @Request() req: any) {
    return this.financeService.createTransaction(data, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  findTransactions(
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      accountId,
      categoryId,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };
    return this.financeService.findTransactions(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions/:id')
  findTransaction(@Param('id') id: string) {
    return this.financeService.findTransaction(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Patch('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.financeService.updateTransaction(id, data, req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Delete('transactions/:id')
  deleteTransaction(@Param('id') id: string, @Request() req: any) {
    return this.financeService.deleteTransaction(id, req.user?.id);
  }

  // Category Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Post('categories')
  createTransactionCategory(@Body() data: any, @Request() req: any) {
    return this.financeService.createTransactionCategory(data, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  findTransactionCategories() {
    return this.financeService.findTransactionCategories();
  }

  // Analytics Endpoints
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  getFinancialSummary(
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.financeService.getFinancialSummary(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get('daily-totals')
  getDailyTotals(
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.financeService.getDailyTotals(filters);
  }

  // Mercado Pago Integration
  @Public()
  @Post('mercadopago/webhook')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() body: any) {
    await this.mercadoPagoService.handleWebhook(body);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Post('mercadopago/preference')
  createMercadoPagoPreference(@Body() data: {
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
    external_reference?: string;
    description?: string;
    payer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  }) {
    return this.mercadoPagoService.createPreference(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager', 'employee')
  @Post('process-payment')
  async processPayment(@Request() req: any, @Body() paymentData: {
    token?: string;
    payment_method_id?: string;
    installments?: number;
    amount: number;
    title: string;
    description?: string;
    customerEmail?: string;
    customerName?: string;
    idempotencyKey?: string;
    payer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
      identification?: {
        type: string;
        number: string;
      };
    };
  }) {
    try {
      const userId = req.user.sub;

      // Build a per-request idempotency key (allow client-provided, fallback to server-generated)
      const idempotencyKey = paymentData.idempotencyKey || `mp:${userId}:${paymentData.amount}:${Date.now()}`;

      const payment = await this.mercadoPagoService.createPayment(paymentData, { idempotencyKey });

      // Normalize minimal response for the frontend
      return {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        currency_id: payment.currency_id,
        payment_method_id: payment.payment_method_id,
        installments: payment.installments,
        payer: payment.payer,
        description: payment.description,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      // Surface MercadoPago error information when possible
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Get('mercadopago/payment/:id')
  getMercadoPagoPayment(@Param('id') paymentId: string) {
    return this.mercadoPagoService.getPayment(paymentId);
  }

  // Seed Data
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('seed')
  seedDefaultData() {
    return this.financeService.seedDefaultData();
  }

}
