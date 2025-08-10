import React, { useEffect, useRef, useState } from 'react';
import { createMercadoPagoService } from '../../../services/mercadoPagoService';

interface PaymentStatusProps {
  paymentId: string;
  onStatusUpdate?: (status: string) => void;
  theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  paymentId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStatusUpdate, // Used for status callbacks
  theme = 'default'
}) => {
  const statusBrickRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpService, setMpService] = useState<any>(null);

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setError('MercadoPago public key not configured');
      setIsLoading(false);
      return;
    }

    if (!paymentId) {
      setError('Payment ID is required');
      setIsLoading(false);
      return;
    }

    initializeStatusBrick();

    return () => {
      if (mpService) {
        try {
          mpService.destroyBrick('statusScreen');
        } catch (e) {
          console.warn('Error destroying status brick:', e);
        }
      }
    };
  }, [paymentId]);

  const initializeStatusBrick = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const service = createMercadoPagoService({
        publicKey,
        locale: 'es-CL',
        theme
      });

      setMpService(service);
      await service.loadSDK();

      await service.createStatusBrick('status-brick-container', {
        paymentId
      });

      // Call onStatusUpdate callback with initial load status
      if (onStatusUpdate) {
        onStatusUpdate('loaded');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing status brick:', error);
      setError('Failed to load payment status');
      setIsLoading(false);
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
              Please configure VITE_MP_PUBLIC_KEY to display payment status.
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
              Status Error
            </h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={initializeStatusBrick}
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status</h2>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading payment status...</span>
          </div>
        )}

        <div 
          id="status-brick-container"
          ref={statusBrickRef}
          className={isLoading ? 'hidden' : ''}
        />
      </div>
    </div>
  );
};

export default PaymentStatus;
