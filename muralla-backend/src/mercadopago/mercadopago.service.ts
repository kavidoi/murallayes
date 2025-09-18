import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface MercadoPagoTransaction {
  id: number;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  money_release_date?: string;
  operation_type: string;
  issuer_id?: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description?: string;
  collector_id: number;
  payer: {
    id?: string;
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
    type: string;
  };
  metadata?: any;
  additional_info?: any;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  transaction_details?: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount: number;
  };
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  statement_descriptor?: string;
  installments: number;
  card?: {
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    cardholder?: {
      name?: string;
      identification?: {
        type: string;
        number: string;
      };
    };
  };
}

interface SearchResponse {
  paging: {
    total: number;
    limit: number;
    offset: number;
  };
  results: MercadoPagoTransaction[];
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private api: AxiosInstance;
  private accessToken: string;
  private publicKey: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Try both naming conventions
    this.accessToken = this.configService.get<string>('MP_ACCESS_TOKEN') ||
                      this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    this.publicKey = this.configService.get<string>('MP_PUBLIC_KEY') ||
                    this.configService.get<string>('MERCADOPAGO_PUBLIC_KEY');

    if (!this.accessToken) {
      this.logger.warn('MercadoPago access token not configured (tried MP_ACCESS_TOKEN and MERCADOPAGO_ACCESS_TOKEN)');
      return;
    }

    if (!this.publicKey) {
      this.logger.warn('MercadoPago public key not configured (tried MP_PUBLIC_KEY and MERCADOPAGO_PUBLIC_KEY)');
    }

    this.api = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add request/response interceptors for logging
    this.api.interceptors.request.use(
      (config) => {
        this.logger.debug(`MercadoPago API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('MercadoPago API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        this.logger.debug(`MercadoPago API Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('MercadoPago API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get MercadoPago SDK status
   */
  getStatus(): {
    configured: boolean;
    hasAccessToken: boolean;
    hasPublicKey: boolean;
    publicKey?: string;
    message: string;
  } {
    const hasAccessToken = !!this.accessToken;
    const hasPublicKey = !!this.publicKey;
    const configured = hasAccessToken && hasPublicKey;

    let message = 'MercadoPago SDK Status';
    if (!hasPublicKey) {
      message = 'MercadoPago public key not configured';
    } else if (!hasAccessToken) {
      message = 'MercadoPago access token not configured';
    } else {
      message = 'MercadoPago SDK configured successfully';
    }

    return {
      configured,
      hasAccessToken,
      hasPublicKey,
      publicKey: hasPublicKey ? this.publicKey : undefined,
      message
    };
  }

  /**
   * Get all payments/transactions
   * https://www.mercadopago.cl/developers/es/reference/payments/_payments_search/get
   */
  async getTransactions(params: {
    begin_date?: string; // ISO 8601 format
    end_date?: string;
    status?: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
    operation_type?: 'regular_payment' | 'money_transfer' | 'recurring_payment' | 'account_fund' | 'payment_addition' | 'cellphone_recharge' | 'pos_payment';
    limit?: number;
    offset?: number;
    sort?: string;
    criteria?: 'date_created' | 'date_last_updated';
  } = {}): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add date range
      if (params.begin_date) {
        queryParams.append('begin_date', params.begin_date);
      }
      if (params.end_date) {
        queryParams.append('end_date', params.end_date);
      }
      
      // Add filters
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.operation_type) {
        queryParams.append('operation_type', params.operation_type);
      }
      
      // Add pagination
      queryParams.append('limit', String(params.limit || 50));
      queryParams.append('offset', String(params.offset || 0));
      
      // Add sorting
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      if (params.criteria) {
        queryParams.append('criteria', params.criteria);
      }

      const response = await this.api.get<SearchResponse>(`/v1/payments/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch MercadoPago transactions:', error);
      throw error;
    }
  }

  /**
   * Get a specific payment by ID
   */
  async getTransaction(paymentId: string): Promise<MercadoPagoTransaction> {
    try {
      const response = await this.api.get<MercadoPagoTransaction>(`/v1/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get account balance
   * https://www.mercadopago.cl/developers/es/reference/account_balance/_users_user_id_mercadopago_account_balance/get
   */
  async getAccountBalance(userId?: string): Promise<any> {
    try {
      const userIdToUse = userId || 'me';
      const response = await this.api.get(`/users/${userIdToUse}/mercadopago_account/balance`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch account balance:', error);
      throw error;
    }
  }

  /**
   * Get bank account movements (money in/out)
   * https://www.mercadopago.cl/developers/es/reference/account_bank_report/_users_user_id_mercadopago_account_bank_report/get
   */
  async getBankMovements(params: {
    user_id?: string;
    begin_date: string;
    end_date: string;
    offset?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const userId = params.user_id || 'me';
      const queryParams = new URLSearchParams({
        begin_date: params.begin_date,
        end_date: params.end_date,
        offset: String(params.offset || 0),
        limit: String(params.limit || 50),
      });

      const response = await this.api.get(`/users/${userId}/mercadopago_account/bank_report?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch bank movements:', error);
      throw error;
    }
  }

  /**
   * Get account movements (all movements including fees, refunds, etc)
   * https://www.mercadopago.cl/developers/es/reference/account_movements/_users_user_id_mercadopago_account_movements_search/get
   */
  async getAccountMovements(params: {
    user_id?: string;
    begin_date?: string;
    end_date?: string;
    status?: string;
    operation_type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const userId = params.user_id || 'me';
      const queryParams = new URLSearchParams();
      
      if (params.begin_date) queryParams.append('begin_date', params.begin_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.status) queryParams.append('status', params.status);
      if (params.operation_type) queryParams.append('operation_type', params.operation_type);
      queryParams.append('limit', String(params.limit || 50));
      queryParams.append('offset', String(params.offset || 0));

      const response = await this.api.get(`/users/${userId}/mercadopago_account/movements/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch account movements:', error);
      throw error;
    }
  }

  /**
   * Get merchant orders
   */
  async getMerchantOrders(params: {
    begin_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.begin_date) queryParams.append('begin_date', params.begin_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryParams.append('limit', String(params.limit || 50));
      queryParams.append('offset', String(params.offset || 0));

      const response = await this.api.get(`/merchant_orders/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch merchant orders:', error);
      throw error;
    }
  }

  /**
   * Get chargebacks
   */
  async getChargebacks(paymentId?: string): Promise<any> {
    try {
      const url = paymentId 
        ? `/v1/chargebacks/search?payment_id=${paymentId}`
        : '/v1/chargebacks/search';
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch chargebacks:', error);
      throw error;
    }
  }

  /**
   * Get refunds for a payment
   */
  async getRefunds(paymentId: string): Promise<any> {
    try {
      const response = await this.api.get(`/v1/payments/${paymentId}/refunds`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch refunds for payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Create payment preference with all required fields for integration score
   */
  async createPreference(data: any): Promise<any> {
    try {
      // Build preference with all required fields
      const preference: any = {
        items: data.items || [],
        payer: data.payer || {},
        external_reference: data.external_reference || `order_${Date.now()}`,
        notification_url: data.notification_url || `${process.env.APP_URL}/mercadopago/webhook`,
        statement_descriptor: data.statement_descriptor || 'MURALLA',
        back_urls: data.back_urls || {
          success: `${process.env.FRONTEND_URL}/finance/payment/success`,
          failure: `${process.env.FRONTEND_URL}/finance/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/finance/payment/pending`,
        },
        auto_return: 'approved',
        binary_mode: data.binary_mode || false,
        payment_methods: {
          excluded_payment_methods: data.excluded_payment_methods || [],
          excluded_payment_types: data.excluded_payment_types || [],
          installments: data.installments || 12,
        },
        shipments: data.shipments,
        metadata: data.metadata || {},
      };

      // Add expiration if needed
      if (data.expires) {
        preference.expires = true;
        preference.expiration_date_from = data.expiration_date_from;
        preference.expiration_date_to = data.expiration_date_to;
      }

      // Add date of expiration for cash payments
      if (data.date_of_expiration) {
        preference.date_of_expiration = data.date_of_expiration;
      }

      const response = await this.api.post('/checkout/preferences', preference);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create preference:', error);
      throw error;
    }
  }

  /**
   * Process payment with card token or payment method
   */
  async processPayment(data: any): Promise<any> {
    try {
      this.logger.log('Processing payment with data:', {
        amount: data.amount || data.transaction_amount,
        payment_method_id: data.payment_method_id,
        token: data.token ? 'PROVIDED' : 'MISSING',
        payer_email: data.payer?.email
      });

      // MercadoPago expects amount in the currency's smallest unit
      // For CLP (Chilean Peso), the amount should be in pesos (no decimals)
      const paymentData: any = {
        transaction_amount: Number(data.transaction_amount || data.amount),
        token: data.token,
        description: data.description || 'Payment',
        installments: Number(data.installments) || 1,
        payment_method_id: data.payment_method_id,
        payer: {
          email: data.payer?.email || data.customerEmail || 'customer@example.com',
          first_name: data.payer?.first_name || 'Customer',
          last_name: data.payer?.last_name || 'Name',
          identification: data.payer?.identification,
        },
        external_reference: data.external_reference || `payment_${Date.now()}`,
        statement_descriptor: data.statement_descriptor || 'MURALLA',
        metadata: data.metadata || {},
        three_d_secure_mode: data.three_d_secure_mode,
        capture: data.capture !== false,
        binary_mode: data.binary_mode || false,
      };

      // Add additional info if provided
      if (data.additional_info) {
        paymentData.additional_info = data.additional_info;
      }

      this.logger.log('Sending payment to MercadoPago API:', {
        url: '/v1/payments',
        amount: paymentData.transaction_amount,
        payment_method_id: paymentData.payment_method_id
      });

      // Generate idempotency key for this payment
      const idempotencyKey = data.idempotencyKey || `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await this.api.post('/v1/payments', paymentData, {
        headers: {
          'X-Idempotency-Key': idempotencyKey
        }
      });
      
      // Log payment for tracking
      this.logger.log(`Payment created: ${response.data.id} - Status: ${response.data.status}`);
      
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to process payment:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data?.message || error.response?.data?.cause
      });
      
      // Return a more informative error
      if (error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.cause || 'Payment processing failed');
      }
      throw error;
    }
  }

  /**
   * Handle webhook notifications from MercadoPago
   */
  async handleWebhook(notification: any): Promise<any> {
    try {
      this.logger.log(`Webhook received: ${notification.type} - ${notification.data?.id}`);
      
      // Handle different notification types
      switch (notification.type) {
        case 'payment':
          // Fetch updated payment info
          const payment = await this.getTransaction(notification.data.id);
          this.logger.log(`Payment webhook: ${payment.id} - Status: ${payment.status}`);
          
          // Here you would update your database with payment status
          // For example: await this.updatePaymentStatus(payment);
          
          return { processed: true, payment };
          
        case 'merchant_order':
          // Handle merchant order updates
          const order = await this.api.get(`/merchant_orders/${notification.data.id}`);
          this.logger.log(`Merchant order webhook: ${order.data.id}`);
          return { processed: true, order: order.data };
          
        case 'chargeback':
          // Handle chargebacks
          this.logger.warn(`Chargeback notification: ${notification.data.id}`);
          return { processed: true, type: 'chargeback' };
          
        default:
          this.logger.log(`Unknown webhook type: ${notification.type}`);
          return { processed: false, type: notification.type };
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }
}
