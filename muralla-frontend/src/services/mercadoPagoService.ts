/**
 * MercadoPago SDK V2 Service
 * Official integration with MercadoPago.js V2 using the official npm package
 */

import { loadMercadoPago } from '@mercadopago/sdk-js';
import api from './api';

interface MercadoPagoConfig {
  publicKey: string;
  locale?: 'es-AR' | 'es-CL' | 'es-CO' | 'es-MX' | 'es-PE' | 'es-UY' | 'pt-BR' | 'en-US';
  theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
}

interface PaymentInitialization {
  amount: number;
  preferenceId?: string;
  payer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    identification?: {
      type: string;
      number: string;
    };
    entityType?: 'individual' | 'association';
  };
}

interface BrickCallbacks {
  onReady?: () => void;
  onError?: (error: any) => void;
  onSubmit?: (formData: any) => Promise<any>;
  onBinChange?: (bin: string) => void;
}

interface BrickCustomization {
  visual?: {
    style?: {
      theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
      customVariables?: {
        textPrimaryColor?: string;
        textSecondaryColor?: string;
        inputBackgroundColor?: string;
        formBackgroundColor?: string;
        baseColor?: string;
        baseColorFirstVariant?: string;
        baseColorSecondVariant?: string;
        errorColor?: string;
        successColor?: string;
        outlinePrimaryColor?: string;
        outlineSecondaryColor?: string;
        buttonTextColor?: string;
        fontSizeExtraSmall?: string;
        fontSizeSmall?: string;
        fontSizeMedium?: string;
        fontSizeLarge?: string;
        fontSizeExtraLarge?: string;
        fontWeightNormal?: string;
        fontWeightSemiBold?: string;
        formInputsTextTransform?: string;
        inputVerticalPadding?: string;
        inputHorizontalPadding?: string;
        inputFocusedBoxShadow?: string;
        inputErrorFocusedBoxShadow?: string;
        inputBorderWidth?: string;
        inputFocusedBorderWidth?: string;
        borderRadiusSmall?: string;
        borderRadiusMedium?: string;
        borderRadiusLarge?: string;
        borderRadiusFull?: string;
      };
    };
    hideFormTitle?: boolean;
    hidePaymentButton?: boolean;
    hideValueProp?: boolean;
  };
  paymentMethods?: {
    creditCard?: 'all' | 'none' | string[];
    debitCard?: 'all' | 'none' | string[];
    ticket?: 'all' | 'none' | string[];
    bankTransfer?: 'all' | 'none' | string[];
    atm?: 'all' | 'none' | string[];
    onboarding_credits?: 'all' | 'none';
    wallet_purchase?: 'all' | 'none';
  };
}

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export interface MercadoPagoTransaction {
  id: number;
  date_created: string;
  date_approved?: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description?: string;
  payer: {
    id?: string;
    email?: string;
    type: string;
  };
  transaction_amount: number;
  transaction_amount_refunded: number;
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  installments: number;
  payment_method_id: string;
  payment_type_id: string;
  operation_type: string;
}

export interface TransactionSummary {
  period: { start: string; end: string };
  balance: any;
  overview: {
    totalTransactions: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    totalRevenue: number;
    totalFees: number;
  };
  dailyStats: Array<{
    date: string;
    count: number;
    approved: number;
    rejected: number;
    pending: number;
    totalAmount: number;
    totalFees: number;
    netAmount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
}

class MercadoPagoService {
  private static instance: MercadoPagoService;
  private mp: any = null;
  private bricks: any = null;
  private config: MercadoPagoConfig;
  private sdkLoaded = false;

  private constructor(config: MercadoPagoConfig) {
    this.config = config;
  }

  static getInstance(config?: MercadoPagoConfig): MercadoPagoService {
    if (!MercadoPagoService.instance) {
      if (!config) {
        throw new Error('MercadoPagoService requires configuration on first initialization');
      }
      MercadoPagoService.instance = new MercadoPagoService(config);
    }
    return MercadoPagoService.instance;
  }

  /**
   * Load MercadoPago SDK V2 using official npm package
   */
  async loadSDK(): Promise<void> {
    // If global already exists, don't try to reload the SDK
    if (window.MercadoPago) {
      this.sdkLoaded = true;
      this.initializeMercadoPago();
      return Promise.resolve();
    }

    if (this.sdkLoaded) return Promise.resolve();

    try {
      // Load using the official npm package
      await loadMercadoPago();
      this.sdkLoaded = true;
      this.initializeMercadoPago();
    } catch (error) {
      throw new Error(`Failed to load MercadoPago SDK V2: ${error}`);
    }
  }

  private initializeMercadoPago(): void {
    if (!window.MercadoPago || this.mp) return;

    this.mp = new window.MercadoPago(this.config.publicKey, {
      locale: this.config.locale || 'es-CL'
    });
    this.bricks = this.mp.bricks();
  }

  /**
   * Create Payment Brick
   */
  async createPaymentBrick(
    containerId: string,
    initialization: PaymentInitialization,
    callbacks: BrickCallbacks = {},
    customization: BrickCustomization = {}
  ): Promise<any> {
    await this.loadSDK();

    if (!this.bricks) {
      throw new Error('MercadoPago Bricks not initialized');
    }

    // Ensure payer.entityType is provided to satisfy Bricks validation
    const providedEntity = initialization.payer?.entityType;
    const entityTypeNormalized: 'individual' | 'association' =
      providedEntity === 'association' || providedEntity === 'individual'
        ? providedEntity
        : 'individual';

    const normalizedInitialization: PaymentInitialization = {
      ...initialization,
      payer: {
        ...(initialization.payer || {}),
        entityType: entityTypeNormalized
      }
    };

    const defaultCustomization: BrickCustomization = {
      visual: {
        style: {
          theme: this.config.theme || 'default'
        }
      },
      // Enable only supported payment methods for better compatibility
      paymentMethods: {
        // Restrict to commonly allowed credit cards
        creditCard: 'all',  // Let MercadoPago decide which cards are available
        debitCard: 'all',   // Enable debit cards
        // Don't explicitly disable other methods - let account settings control them
        // ticket: 'none',    // Removed - let account settings control
        // bankTransfer: 'none', // Removed - let account settings control  
        // atm: 'none'        // Removed - let account settings control
      }
    };

    const brickConfig = {
      // Provide MercadoPago instance when using preferenceId to satisfy Bricks requirement
      mercadoPago: this.mp || undefined,
      initialization: normalizedInitialization,
      customization: { ...defaultCustomization, ...customization },
      callbacks: {
        onReady: () => {
          if (import.meta.env.DEV) {
            console.log('Payment Brick ready');
          }
          callbacks.onReady?.();
        },
        onError: (error: any) => {
          console.error('Payment Brick error:', error);
          callbacks.onError?.(error);
        },
        onSubmit: async (formData: any) => {
          if (import.meta.env.DEV) {
            console.log('Payment Brick submit:', formData);
          }
          return callbacks.onSubmit?.(formData) || Promise.resolve();
        },
        onBinChange: (bin: string) => {
          if (import.meta.env.DEV) {
            console.log('Payment Brick BIN change:', bin);
          }
          callbacks.onBinChange?.(bin);
        }
      }
    };

    return this.bricks.create('payment', containerId, brickConfig);
  }

  /**
   * Create Card Payment Brick (Simplified)
   */
  async createCardPaymentBrick(
    containerId: string,
    initialization: PaymentInitialization,
    callbacks: BrickCallbacks = {}
  ): Promise<any> {
    return this.createPaymentBrick(containerId, initialization, callbacks, {
      paymentMethods: {
        creditCard: 'all',
        debitCard: 'all'
        // Let account settings control other payment methods
      }
    });
  }

  /**
   * Create Status Screen Brick
   */
  async createStatusBrick(
    containerId: string,
    initialization: {
      paymentId: string;
    }
  ): Promise<any> {
    await this.loadSDK();

    if (!this.bricks) {
      throw new Error('MercadoPago Bricks not initialized');
    }

    return this.bricks.create('statusScreen', containerId, {
      initialization
    });
  }

  /**
   * Create Wallet Brick (for MercadoPago Wallet payments)
   */
  async createWalletBrick(
    containerId: string,
    initialization: {
      preferenceId: string;
    }
  ): Promise<any> {
    await this.loadSDK();

    if (!this.bricks) {
      throw new Error('MercadoPago Bricks not initialized');
    }

    return this.bricks.create('wallet', containerId, {
      initialization
    });
  }

  /**
   * Destroy a brick
   */
  destroyBrick(brickType: string): void {
    try {
      this.bricks?.destroy?.(brickType);
    } catch (error) {
      console.warn('Error destroying brick:', error);
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<any> {
    await this.loadSDK();
    
    if (!this.mp) {
      throw new Error('MercadoPago not initialized');
    }

    return this.mp.getPaymentMethods();
  }

  /**
   * Get installments
   */
  async getInstallments(params: {
    amount: number;
    bin: string;
  }): Promise<any> {
    await this.loadSDK();
    
    if (!this.mp) {
      throw new Error('MercadoPago not initialized');
    }

    return this.mp.getInstallments({
      amount: params.amount.toString(),
      bin: params.bin
    });
  }

  /**
   * Get issuer information
   */
  async getIssuers(paymentMethodId: string): Promise<any> {
    await this.loadSDK();
    
    if (!this.mp) {
      throw new Error('MercadoPago not initialized');
    }

    return this.mp.getIssuers({
      paymentMethodId
    });
  }

  /**
   * Create card token (for custom implementations)
   */
  async createCardToken(cardData: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }): Promise<any> {
    await this.loadSDK();
    
    if (!this.mp) {
      throw new Error('MercadoPago not initialized');
    }

    return this.mp.createCardToken(cardData);
  }

  /**
   * Validate identification
   */
  async getIdentificationTypes(): Promise<any> {
    await this.loadSDK();
    
    if (!this.mp) {
      throw new Error('MercadoPago not initialized');
    }

    return this.mp.getIdentificationTypes();
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return this.mp?.version || 'Unknown';
  }

  /**
   * Check if SDK is loaded
   */
  isSDKLoaded(): boolean {
    return this.sdkLoaded && !!window.MercadoPago;
  }

  // ============= Transaction Fetching Methods =============

  /**
   * Get all transactions with optional filters
   */
  async getTransactions(params: {
    begin_date?: string;
    end_date?: string;
    status?: string;
    operation_type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    summary: any;
    paging: any;
    transactions: MercadoPagoTransaction[];
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.begin_date) queryParams.append('begin_date', params.begin_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.status) queryParams.append('status', params.status);
      if (params.operation_type) queryParams.append('operation_type', params.operation_type);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response = await api.get(`/mercadopago/transactions?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(id: string): Promise<MercadoPagoTransaction> {
    try {
      const response = await api.get(`/mercadopago/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await api.get('/mercadopago/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Get bank movements
   */
  async getBankMovements(params: {
    begin_date: string;
    end_date: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        begin_date: params.begin_date,
        end_date: params.end_date,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString(),
      });

      const response = await api.get(`/mercadopago/bank-movements?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank movements:', error);
      throw error;
    }
  }

  /**
   * Get transaction summary for dashboard
   */
  async getTransactionSummary(params: {
    begin_date?: string;
    end_date?: string;
  } = {}): Promise<TransactionSummary> {
    try {
      const queryParams = new URLSearchParams();
      if (params.begin_date) queryParams.append('begin_date', params.begin_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const response = await api.get(`/mercadopago/summary?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      throw error;
    }
  }
}

// Export default instance factory
export const createMercadoPagoService = (config: MercadoPagoConfig) => {
  return MercadoPagoService.getInstance(config);
};

export default MercadoPagoService;
