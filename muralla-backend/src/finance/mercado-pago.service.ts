import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, PaymentMethod, TransactionStatus } from '@prisma/client';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;

  constructor(private prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || 'TEST_ACCESS_TOKEN',
      // IMPORTANT: Do NOT set a global idempotency key. Provide per-request keys instead.
      options: { timeout: 5000 },
    });
  }

  async handleWebhook(body: any): Promise<void> {
    try {
      const { type, data } = body;

      if (type === 'payment') {
        const payment = await new Payment(this.client).get({ id: data.id });
        
        if (payment.status === 'approved') {
          // Idempotency: if we already have this mpPaymentId, ignore
          const existing = await this.prisma.transaction.findFirst({ where: { mpPaymentId: payment.id.toString() } });
          if (existing) {
            this.logger.log(`Skipping duplicate webhook for payment ${payment.id}`);
            return;
          }
          await this.createTransactionFromPayment(payment);
        }
      }
    } catch (error) {
      this.logger.error('Error handling Mercado Pago webhook:', error);
      throw error;
    }
  }

  private async createTransactionFromPayment(payment: any): Promise<void> {
    try {
      // Find or create default bank account
      let account = await this.prisma.bankAccount.findFirst({
        where: { name: 'Mercado Pago Account', isActive: true },
      });

      if (!account) {
        account = await this.prisma.bankAccount.create({
          data: {
            name: 'Mercado Pago Account',
            accountType: 'mercado_pago',
            currency: 'ARS',
            isActive: true,
          },
        });
      }

      // Find or create sales category
      let category = await this.prisma.transactionCategory.findFirst({
        where: { name: 'Ventas' },
      });

      if (!category) {
        category = await this.prisma.transactionCategory.create({
          data: {
            name: 'Ventas',
            icon: 'shopping-cart',
            color: '#10b981',
            description: 'Ingresos por ventas de productos y servicios',
          },
        });
      }

      // Create transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          description: payment.description || 'Pago Mercado Pago',
          amount: payment.transaction_amount,
          type: TransactionType.INCOME,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.MERCADO_PAGO,
          reference: payment.id.toString(),
          externalId: payment.id.toString(),
          mpPaymentId: payment.id.toString(),
          mpStatus: payment.status,
          mpPaymentType: payment.payment_type_id,
          accountId: account.id,
          categoryId: category.id,
          customerName: payment.payer?.first_name 
            ? `${payment.payer.first_name} ${payment.payer.last_name || ''}`.trim()
            : null,
        },
      });

      // Update account balance
      await this.prisma.bankAccount.update({
        where: { id: account.id },
        data: {
          currentBalance: {
            increment: payment.transaction_amount,
          },
        },
      });

      this.logger.log(`Created transaction ${transaction.id} from Mercado Pago payment ${payment.id}`);
    } catch (error) {
      this.logger.error('Error creating transaction from payment:', error);
      throw error;
    }
  }

  /**
   * Creates a Mercado Pago payment using official SDK.
   * If approved, it will also create a local transaction (idempotent by mpPaymentId).
   */
  async createPayment(
    paymentData: {
      token?: string;
      payment_method_id?: string;
      installments?: number;
      amount: number;
      title: string;
      description?: string;
      customerEmail?: string;
      customerName?: string;
      payer?: {
        email?: string;
        first_name?: string;
        last_name?: string;
        identification?: {
          type: string;
          number: string;
        };
      };
    },
    options?: { idempotencyKey?: string }
  ): Promise<any> {
    try {
      const {
        token,
        payment_method_id,
        installments,
        amount,
        title,
        description,
        customerEmail,
        customerName,
        payer,
      } = paymentData;

      const [firstName, ...restLast] = (customerName || '').split(' ').filter(Boolean);
      const body: any = {
        transaction_amount: amount,
        description: description || title,
        capture: true,
        statement_descriptor: process.env.MP_STATEMENT_DESCRIPTOR || 'MURALLA',
        // For card payments via Brick
        token,
        payment_method_id,
        installments,
        payer: {
          email: customerEmail || payer?.email,
          first_name: firstName || payer?.first_name,
          last_name: restLast.join(' ') || payer?.last_name,
          identification: payer?.identification,
        },
      };

      // Clean undefined fields to avoid API validation errors
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      if (body.payer) {
        Object.keys(body.payer).forEach((k) => body.payer[k] === undefined && delete body.payer[k]);
      }

      this.logger.log('Creating Mercado Pago payment');
      const payment = await new Payment(this.client).create({
        body,
        requestOptions: options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
      });

      this.logger.log(`Mercado Pago payment created: ${payment.id} (${payment.status})`);

      if (payment.status === 'approved') {
        // Guard against duplicates even on immediate creation
        const existing = await this.prisma.transaction.findFirst({ where: { mpPaymentId: payment.id.toString() } });
        if (!existing) {
          await this.createTransactionFromPayment(payment);
        }
      }

      return payment;
    } catch (error) {
      this.logger.error('Error creating Mercado Pago payment:', error);
      throw error;
    }
  }

  async createPreference(data: {
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
    external_reference?: string;
    // Quality recommendations
    category_id?: string;
    description?: string;
    payer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  }): Promise<any> {
    try {
      const preference = new Preference(this.client);
      
      const preferenceData = {
        items: [
          {
            id: 'item-' + Date.now(),
            title: data.title,
            quantity: data.quantity,
            unit_price: data.unit_price,
            currency_id: data.currency_id || process.env.MP_CURRENCY || 'CLP',
            category_id: data.category_id || 'others',
            description: data.description || data.title,
          },
        ],
        external_reference: data.external_reference,
        notification_url: `${process.env.BACKEND_URL}/api/finance/mercadopago/webhook`,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/finance/payment/success`,
          failure: `${process.env.FRONTEND_URL}/finance/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/finance/payment/pending`,
        },
        auto_return: 'approved',
        payer: data.payer && {
          email: data.payer.email,
          name: data.payer.first_name,
          surname: data.payer.last_name,
        },
        // Descripción-Resumen de tarjeta para evitar contracargos
        statement_descriptor: process.env.MP_STATEMENT_DESCRIPTOR || 'MURALLA',
      } as any;

      const result = await preference.create({ body: preferenceData });
      return result;
    } catch (error) {
      this.logger.error('Error creating Mercado Pago preference:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const payment = await new Payment(this.client).get({ id: paymentId });
      return payment;
    } catch (error) {
      this.logger.error(`Error fetching payment ${paymentId}:`, error);
      throw error;
    }
  }
}
