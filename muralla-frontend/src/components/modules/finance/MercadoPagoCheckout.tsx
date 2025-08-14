import React, { useEffect, useRef, useState } from 'react';
import { createMercadoPagoService } from '../../../services/mercadoPagoService';
import { AuthService } from '../../../services/authService';

interface CheckoutProps {
  amount: number;
  title: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess?: (paymentResult: any) => void;
  onError?: (error: any) => void;
  onPending?: (paymentResult: any) => void;
  preferenceId?: string;
  theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
}

const MercadoPagoCheckout: React.FC<CheckoutProps> = ({
  amount,
  title,
  description,
  customerEmail,
  customerName,
  onSuccess,
  onError,
  onPending,
  preferenceId,
  theme = 'default'
}) => {
  const paymentBrickRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpService, setMpService] = useState<any>(null);
  const [brick, setBrick] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  // Preference flow reserved for Wallet/Checkout; unused in Payment Brick
  // const [prefId, setPrefId] = useState<string | undefined>(preferenceId);

  // Get MercadoPago public key from environment
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setError('MercadoPago public key not configured');
      setIsLoading(false);
      return;
    }

    initializeMercadoPago();

    return () => {
      mpService?.destroyBrick('payment');
    };
  }, [amount, preferenceId]);

  /*
  const createPreference = async (capturedAmount: number) => {
    try {
      const data = {
        title,
        quantity: 1,
        unit_price: capturedAmount,
        currency_id: 'CLP',
        description,
        payer: customerEmail ? { email: customerEmail } : undefined,
      } as any;

      console.log('Creating preference with data:', data);
      const resp = await AuthService.apiCall('/finance/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Preference response:', resp);
      
      if (resp?.id) {
        console.log('Preference created successfully:', resp.id);
        setPrefId(resp.id as string);
        return resp.id as string;
      } else {
        console.warn('Preference creation returned no ID:', resp);
        return null;
      }
    } catch (err) {
      console.error('Failed to create preference:', err);
      return null;
    }
  };
  */

  const initializeMercadoPago = async () => {
    if (isInitializing) return;
    setIsLoading(true);
    setIsInitializing(true);

    try {
      setError(null);

      // Initialize MercadoPago service
      const service = createMercadoPagoService({
        publicKey,
        locale: 'es-CL',
        theme
      });

      setMpService(service);

      // Wait for SDK to load
      await service.loadSDK();

      // Destroy existing brick completely before creating a new one
      if (brick) {
        try {
          await brick.unmount();
        } catch (e) {
          console.warn('Error unmounting brick:', e);
        }
      }
      if (mpService) {
        try {
          mpService.destroyBrick('payment');
        } catch (e) {
          console.warn('Error destroying previous brick:', e);
        }
      }

      // Capture amount at the start to avoid mid-render changes
      const capturedAmount = amount;
      // For Payment Brick, do not use preferenceId to avoid SDK coupling issues
      const effectivePreferenceId = undefined;

      console.log('Effective preference ID (unused for Payment Brick):', effectivePreferenceId);
      console.log('Amount:', capturedAmount);

      // Prepare payer information
      const payer: any = {};
      if (customerEmail) {
        payer.email = customerEmail;
      }
      if (customerName) {
        const nameParts = customerName.split(' ');
        payer.firstName = nameParts[0] || '';
        payer.lastName = nameParts.slice(1).join(' ') || '';
      }

      // Always provide amount to satisfy Brick validation
      // Include preferenceId when available (prod), plus optional payer
      const initialization: any = {
        amount: capturedAmount,
        ...(Object.keys(payer).length ? { payer } : {})
      };

      console.log('Final initialization object:', initialization);

      // Validate initialization has required properties
      if (!initialization.amount) {
        throw new Error('Either preferenceId or amount must be provided');
      }

      const extraCustomization = import.meta.env.PROD
        ? {} // let site/account settings decide allowed methods
        : {
            paymentMethods: {
              creditCard: ['visa', 'master', 'amex'],
              ticket: 'none' as const,
              bankTransfer: 'none' as const,
              atm: 'none' as const,
            },
          };

      const brickInstance = await service.createPaymentBrick(
        'payment-brick-container',
        initialization,
        {
          onReady: () => {
            console.log('Payment brick ready');
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Payment brick error:', error);
            setError(error?.message || 'Error loading payment form');
            onError?.(error);
          },
          onSubmit: async (formData) => {
            console.log('Payment form submitted:', formData);
            // production flow expects MercadoPago redirect or OP
            try {
              // Always process via backend route for Payment Brick
              const paymentResult = await processPayment(formData, capturedAmount);
              if (paymentResult?.status === 'approved' || paymentResult?.success) onSuccess?.(paymentResult);
              else if (paymentResult?.status === 'pending') onPending?.(paymentResult);
              else onError?.(paymentResult);
              return paymentResult;
            } catch (err) {
              console.error('Payment processing error:', err);
              onError?.(err);
              throw err;
            }
          },
        },
        {
          visual: {
            style: {
              theme,
              customVariables: {
                textPrimaryColor: '#1f2937',
                textSecondaryColor: '#6b7280',
                inputBackgroundColor: '#ffffff',
                formBackgroundColor: '#ffffff',
                baseColor: '#3b82f6',
                baseColorFirstVariant: '#1d4ed8',
                baseColorSecondVariant: '#60a5fa',
                errorColor: '#ef4444',
                successColor: '#10b981',
                outlinePrimaryColor: '#d1d5db',
                outlineSecondaryColor: '#e5e7eb',
                buttonTextColor: '#ffffff',
                borderRadiusMedium: '0.5rem',
              },
            },
          },
          ...extraCustomization,
        }
      );

      setBrick(brickInstance);
    } catch (error) {
      console.error('Error initializing MercadoPago:', error);
      setError('Failed to initialize payment form');
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  const processPayment = async (formData: any, useAmount?: number) => {
    try {
      // Send payment data to backend for processing
      const response = await AuthService.apiCall('/finance/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: useAmount ?? amount,
          title,
          description,
          customerEmail,
          customerName
        })
      });

      return response;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  };

  if (!publicKey) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-yellow-600">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Configuration Required
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Please configure VITE_MP_PUBLIC_KEY in your environment variables to enable MercadoPago payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-red-600">❌</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Payment Error
            </h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={initializeMercadoPago}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Item:</span>
            <span className="font-medium">{title}</span>
          </div>
          {description && (
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="text-sm text-gray-500">{description}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
              }).format(amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading payment form...</span>
          </div>
        )}

        <div 
          id="payment-brick-container"
          ref={paymentBrickRef}
          className={isLoading ? 'hidden' : ''}
        />
      </div>

      {/* Security Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-green-600">🔒</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-700">
              <strong>Secure Payment:</strong> Your payment is processed securely by MercadoPago. 
              We do not store your card information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MercadoPagoCheckout;
