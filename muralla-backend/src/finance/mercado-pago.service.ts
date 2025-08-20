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
    // Quality recommendations for fraud prevention and approval rates
    category_id?: string;
    description?: string;
    item_id?: string;
    payer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    // Additional options for instant approval
    binary_mode?: boolean;
  }): Promise<any> {
    try {
      const preference = new Preference(this.client);
      
      // Generate unique external reference if not provided
      const externalRef = data.external_reference || `muralla-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const preferenceData = {
        items: [
          {
            // Required: Unique item identifier for correlation
            id: data.item_id || `item-${Date.now()}`,
            // Required: Item name/title
            title: data.title,
            // Required: Product quantity
            quantity: data.quantity,
            // Required: Unit price per item
            unit_price: data.unit_price,
            // Currency (defaults to Chilean Peso)
            currency_id: data.currency_id || process.env.MP_CURRENCY || 'CLP',
            // Item category for fraud prevention (improves approval rates)
            category_id: data.category_id || 'others',
            // Detailed item description for fraud prevention
            description: data.description || data.title,
          },
        ],
        // External reference for payment correlation with internal system
        external_reference: externalRef,
        
        // Webhook notification URL for payment status updates
        notification_url: `${process.env.BACKEND_URL}/api/finance/mercadopago/webhook`,
        
        // Redirect URLs after payment completion
        back_urls: {
          success: `${process.env.FRONTEND_URL}/finance/payment/success`,
          failure: `${process.env.FRONTEND_URL}/finance/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/finance/payment/pending`,
        },
        auto_return: 'approved',
        
        // Binary mode for instant approval requirement
        binary_mode: data.binary_mode !== false, // Default to true unless explicitly disabled
        
        // Payer information for fraud prevention (improves approval rates)
        payer: data.payer && {
          email: data.payer.email,
          // Use 'name' and 'surname' for preference API (different from payment API)
          name: data.payer.first_name,
          surname: data.payer.last_name,
        },
        
        // Payment timeout and preferences
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        
        // Statement descriptor to prevent chargebacks
        statement_descriptor: process.env.MP_STATEMENT_DESCRIPTOR || 'MURALLA',
        
        // Additional metadata for tracking
        metadata: {
          source: 'muralla-system',
          created_at: new Date().toISOString(),
          external_reference: externalRef,
        },
      } as any;

      // Clean undefined values to avoid API validation errors
      this.cleanUndefinedValues(preferenceData);

      this.logger.log(`Creating preference with external_reference: ${externalRef}`);
      const result = await preference.create({ body: preferenceData });
      
      this.logger.log(`Preference created successfully: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Error creating Mercado Pago preference:', error);
      throw error;
    }
  }

  private cleanUndefinedValues(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        this.cleanUndefinedValues(obj[key]);
        // Remove empty objects
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      }
    });
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
