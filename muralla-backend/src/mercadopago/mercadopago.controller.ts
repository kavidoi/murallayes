import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public } from '../auth/public.decorator';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  /**
   * Get MercadoPago SDK configuration status
   */
  @Public()
  @Get('status')
  async getStatus() {
    return this.mercadoPagoService.getStatus();
  }

  /**
   * Get all transactions/payments
   */
  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  async getTransactions(
    @Query('begin_date') beginDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: any,
    @Query('operation_type') operationType?: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: string,
    @Query('criteria') criteria?: any,
  ) {
    const transactions = await this.mercadoPagoService.getTransactions({
      begin_date: beginDate,
      end_date: endDate,
      status,
      operation_type: operationType,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      sort,
      criteria,
    });

    // Calculate summary statistics
    const summary = {
      total: transactions.paging.total,
      approved: transactions.results.filter(t => t.status === 'approved').length,
      pending: transactions.results.filter(t => t.status === 'pending').length,
      rejected: transactions.results.filter(t => t.status === 'rejected').length,
      totalAmount: transactions.results
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.transaction_amount, 0),
      totalFees: transactions.results
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => {
          const fees = t.fee_details?.reduce((feeSum, fee) => feeSum + fee.amount, 0) || 0;
          return sum + fees;
        }, 0),
    };

    return {
      summary,
      paging: transactions.paging,
      transactions: transactions.results,
    };
  }

  /**
   * Get a specific transaction by ID
   */
  @Get('transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  async getTransaction(@Param('id') id: string) {
    return this.mercadoPagoService.getTransaction(id);
  }

  /**
   * Get account balance
   */
  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  async getBalance() {
    return this.mercadoPagoService.getAccountBalance();
  }

  /**
   * Get bank movements (money in/out)
   */
  @Get('bank-movements')
  @UseGuards(AuthGuard('jwt'))
  async getBankMovements(
    @Query('begin_date') beginDate: string,
    @Query('end_date') endDate: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!beginDate || !endDate) {
      throw new Error('begin_date and end_date are required');
    }

    return this.mercadoPagoService.getBankMovements({
      begin_date: beginDate,
      end_date: endDate,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  /**
   * Get all account movements
   */
  @Get('movements')
  @UseGuards(AuthGuard('jwt'))
  async getAccountMovements(
    @Query('begin_date') beginDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: string,
    @Query('operation_type') operationType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mercadoPagoService.getAccountMovements({
      begin_date: beginDate,
      end_date: endDate,
      status,
      operation_type: operationType,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  /**
   * Get merchant orders
   */
  @Get('orders')
  @UseGuards(AuthGuard('jwt'))
  async getMerchantOrders(
    @Query('begin_date') beginDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mercadoPagoService.getMerchantOrders({
      begin_date: beginDate,
      end_date: endDate,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  /**
   * Get chargebacks
   */
  @Get('chargebacks')
  @UseGuards(AuthGuard('jwt'))
  async getChargebacks(@Query('payment_id') paymentId?: string) {
    return this.mercadoPagoService.getChargebacks(paymentId);
  }

  /**
   * Get refunds for a payment
   */
  @Get('transactions/:id/refunds')
  @UseGuards(AuthGuard('jwt'))
  async getRefunds(@Param('id') paymentId: string) {
    return this.mercadoPagoService.getRefunds(paymentId);
  }

  /**
   * Create payment preference with all required fields
   */
  @Post('create-preference')
  @UseGuards(AuthGuard('jwt'))
  async createPreference(@Body() paymentData: CreatePaymentDto) {
    return this.mercadoPagoService.createPreference(paymentData);
  }

  /**
   * Process payment
   */
  @Post('process-payment')
  @UseGuards(AuthGuard('jwt'))
  async processPayment(@Body() paymentData: any) {
    return this.mercadoPagoService.processPayment(paymentData);
  }

  /**
   * Webhook endpoint for MercadoPago notifications
   */
  @Post('webhook')
  async handleWebhook(@Body() notification: any) {
    return this.mercadoPagoService.handleWebhook(notification);
  }

  /**
   * Get transaction summary for dashboard
   */
  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  async getTransactionSummary(
    @Query('begin_date') beginDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = beginDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [transactions, balance] = await Promise.all([
      this.mercadoPagoService.getTransactions({
        begin_date: start,
        end_date: end,
        limit: 100,
      }),
      this.mercadoPagoService.getAccountBalance(),
    ]);

    // Group transactions by date
    const dailyStats = {};
    transactions.results.forEach(t => {
      const date = t.date_created.split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          count: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          totalAmount: 0,
          totalFees: 0,
          netAmount: 0,
        };
      }
      
      dailyStats[date].count++;
      dailyStats[date][t.status]++;
      
      if (t.status === 'approved') {
        dailyStats[date].totalAmount += t.transaction_amount;
        const fees = t.fee_details?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
        dailyStats[date].totalFees += fees;
        dailyStats[date].netAmount += (t.transaction_amount - fees);
      }
    });

    // Group by payment method
    const paymentMethods = {};
    transactions.results.forEach(t => {
      const method = t.payment_method_id || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          totalAmount: 0,
        };
      }
      paymentMethods[method].count++;
      if (t.status === 'approved') {
        paymentMethods[method].totalAmount += t.transaction_amount;
      }
    });

    return {
      period: { start, end },
      balance,
      overview: {
        totalTransactions: transactions.paging.total,
        approvedCount: transactions.results.filter(t => t.status === 'approved').length,
        pendingCount: transactions.results.filter(t => t.status === 'pending').length,
        rejectedCount: transactions.results.filter(t => t.status === 'rejected').length,
        totalRevenue: transactions.results
          .filter(t => t.status === 'approved')
          .reduce((sum, t) => sum + t.transaction_amount, 0),
        totalFees: transactions.results
          .filter(t => t.status === 'approved')
          .reduce((sum, t) => {
            const fees = t.fee_details?.reduce((feeSum, fee) => feeSum + fee.amount, 0) || 0;
            return sum + fees;
          }, 0),
      },
      dailyStats: Object.values(dailyStats).sort((a: any, b: any) => b.date.localeCompare(a.date)),
      paymentMethods: Object.values(paymentMethods).sort((a: any, b: any) => b.totalAmount - a.totalAmount),
    };
  }
}
