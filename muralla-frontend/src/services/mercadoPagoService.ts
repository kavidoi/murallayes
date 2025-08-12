/**
 * MercadoPago SDK V2 Service
 * Official integration with MercadoPago.js V2 using the official npm package
 */

import { loadMercadoPago } from '@mercadopago/sdk-js';

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

export class MercadoPagoService {
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
      }
    };

    const brickConfig = {
      initialization: normalizedInitialization,
      customization: { ...defaultCustomization, ...customization },
      callbacks: {
        onReady: () => {
          console.log('Payment Brick ready');
          callbacks.onReady?.();
        },
        onError: (error: any) => {
          console.error('Payment Brick error:', error);
          callbacks.onError?.(error);
        },
        onSubmit: async (formData: any) => {
          console.log('Payment Brick submit:', formData);
          return callbacks.onSubmit?.(formData) || Promise.resolve();
        },
        onBinChange: (bin: string) => {
          console.log('Payment Brick BIN change:', bin);
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
        ticket: 'none',
        bankTransfer: 'none',
        atm: 'none'
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
}

// Export default instance factory
export const createMercadoPagoService = (config: MercadoPagoConfig) => {
  return MercadoPagoService.getInstance(config);
};

export default MercadoPagoService;
