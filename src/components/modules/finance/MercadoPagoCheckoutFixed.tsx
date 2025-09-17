import React, { useEffect, useRef, useState } from 'react';
import { createMercadoPagoService } from '../../../services/mercadoPagoService';
import { AuthService } from '../../../services/authService';

interface CheckoutProps {
  amount: number;
  title?: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onPending?: (result: any) => void;
  theme?: 'default' | 'dark' | 'flat' | 'bootstrap';
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
  theme = 'default'
}) => {
  const paymentBrickRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brickControllerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey || !amount || isInitializedRef.current) return;

    const initPayment = async () => {
      if (!paymentBrickRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Clean up any existing brick
        if (brickControllerRef.current) {
          try {
            await brickControllerRef.current.unmount();
          } catch (e) {
            console.warn('Error unmounting previous brick:', e);
          }
          brickControllerRef.current = null;
        }

        // Clear the container
        paymentBrickRef.current.innerHTML = '';

        // Initialize MercadoPago service
        const service = createMercadoPagoService({
          publicKey,
          locale: 'es-CL',
          theme
        });

        await service.loadSDK();

        // Create payment brick
        const brickController = await service.createPaymentBrick(
          'payment-brick-container',
          { amount },
          {
            onReady: () => {
              console.log('Payment brick ready');
              setIsLoading(false);
              isInitializedRef.current = true;
            },
            onError: (error) => {
              console.error('Payment brick error:', error);
              setError(error?.message || 'Error loading payment form');
              onError?.(error);
            },
            onSubmit: async (formData) => {
              console.log('Payment form submitted:', formData);
              try {
                // Extract the actual form data from the MercadoPago response
                const submission = formData?.formData || formData;
                
                const paymentData = {
                  token: submission.token,
                  payment_method_id: submission.payment_method_id || submission.paymentType || 'visa',
                  transaction_amount: amount,
                  installments: submission.installments || 1,
                  payer: submission.payer || {
                    email: customerEmail || 'customer@example.com',
                    first_name: customerName?.split(' ')[0] || 'Customer',
                    last_name: customerName?.split(' ')[1] || 'Name',
                    identification: submission.payer?.identification
                  },
                  amount,
                  title,
                  description,
                  customerEmail,
                  customerName,
                  idempotencyKey: `mp:${Date.now()}`
                };

                const response = await AuthService.apiCall('/mercadopago/process-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(paymentData)
                });

                if (response.status === 'approved') {
                  onSuccess?.(response);
                } else if (response.status === 'pending') {
                  onPending?.(response);
                } else {
                  onError?.(response);
                }
                
                return response;
              } catch (err) {
                console.error('Payment processing error:', err);
                onError?.(err);
                throw err;
              }
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
                }
              }
            }
          }
        );

        brickControllerRef.current = brickController;
      } catch (err) {
        console.error('Error initializing MercadoPago:', err);
        setError('Failed to initialize payment form');
        setIsLoading(false);
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initPayment, 100);

    return () => {
      clearTimeout(timer);
      if (brickControllerRef.current && typeof brickControllerRef.current.unmount === 'function') {
        brickControllerRef.current.unmount().catch(console.error);
        brickControllerRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [publicKey, amount]); // Only re-initialize if these change

  if (!publicKey) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">MercadoPago public key not configured</p>
      </div>
    );
  }

  return (
    <div className="mercadopago-checkout">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      )}

      <div 
        id="payment-brick-container" 
        ref={paymentBrickRef}
        className="min-h-[400px]"
      />
    </div>
  );
};

export default MercadoPagoCheckout;
