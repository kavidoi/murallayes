import { useEffect, useRef, useState } from 'react';
import { createMercadoPagoService } from '../../../services/mercadoPagoService';

interface PaymentBrickProps {
  amount?: number;
  title?: string;
  customerEmail?: string;
  theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
  onPaymentSubmit?: (formData: any) => Promise<any>;
}

export default function PaymentBrick({ 
  amount = 1500, 
  title = 'Test Payment',
  customerEmail = 'test@example.com',
  theme = 'default',
  onPaymentSubmit
}: PaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpService, setMpService] = useState<any>(null);
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;

  useEffect(() => {
    if (!publicKey) return;

    initializePaymentBrick();

    return () => {
      if (mpService) {
        try {
          mpService.destroyBrick('payment');
        } catch (e) {
          console.warn('Error destroying payment brick:', e);
        }
      }
    };
  }, [publicKey, amount]);

  const initializePaymentBrick = async () => {
    try {
      setError(null);
      setReady(false);

      // Initialize MercadoPago service
      const service = createMercadoPagoService({
        publicKey: publicKey!,
        locale: 'es-CL',
        theme
      });

      setMpService(service);
      await service.loadSDK();

      // Create payment brick with enhanced configuration
      await service.createPaymentBrick(
        'payment-brick-container',
        {
          amount,
          payer: {
            email: customerEmail
          }
        },
        {
          onReady: () => {
            console.log('Payment Brick ready');
            setReady(true);
          },
          onError: (error: any) => {
            console.error('Payment Brick error', error);
            setError('Error loading payment form');
          },
          onSubmit: async (formData: any) => {
            console.log('PaymentBrick submit data', formData);
            
            if (onPaymentSubmit) {
              try {
                return await onPaymentSubmit(formData);
              } catch (error) {
                console.error('Payment submission error:', error);
                throw error;
              }
            }
            
            // Default: just resolve for demo purposes
            return Promise.resolve();
          }
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
                borderRadiusMedium: '0.5rem'
              }
            }
          }
        }
      );
    } catch (error) {
      console.error('Error initializing payment brick:', error);
      setError('Failed to initialize payment form');
    }
  };

  if (!publicKey) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Configuration Required
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                Set VITE_MP_PUBLIC_KEY in the Frontend service variables to load MercadoPago.js v2.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-600">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Payment Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={initializePaymentBrick}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          MercadoPago Payment Demo
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          SDK v2 integration with enhanced security and customization
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payment Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Item:</span>
            <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Customer:</span>
            <span className="font-medium text-gray-900 dark:text-white">{customerEmail}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span className="text-gray-900 dark:text-white">Total:</span>
            <span className="text-blue-600 dark:text-blue-400">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Information
        </h2>
        
        {!ready && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading payment form...</span>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          id="payment-brick-container" 
          className={`${!ready ? 'hidden' : ''} bg-white dark:bg-gray-800 rounded-lg`}
        />
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-green-600">🔒</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Secure Payment:</strong> Powered by MercadoPago SDK v2 with enhanced security features.
              Your payment data is processed securely and we never store your card information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 