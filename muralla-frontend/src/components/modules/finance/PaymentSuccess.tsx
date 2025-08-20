import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentStatus from './PaymentStatus';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const merchantOrder = searchParams.get('merchant_order_id');

  useEffect(() => {
    // Extract payment details from URL parameters
    setPaymentDetails({
      paymentId,
      status,
      externalReference,
      merchantOrder,
    });
  }, [paymentId, status, externalReference, merchantOrder]);

  const handleBackToFinance = () => {
    navigate('/finance');
  };

  const handleViewTransactions = () => {
    navigate('/finance/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <span className="text-3xl text-green-600">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">¡Pago Exitoso!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Tu pago ha sido procesado correctamente
          </p>
        </div>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentDetails.paymentId && (
                <div>
                  <span className="text-sm font-medium text-gray-500">ID de Pago:</span>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {paymentDetails.paymentId}
                  </p>
                </div>
              )}
              {paymentDetails.status && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Estado:</span>
                  <p className="mt-1 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {paymentDetails.status}
                    </span>
                  </p>
                </div>
              )}
              {paymentDetails.externalReference && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Referencia:</span>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {paymentDetails.externalReference}
                  </p>
                </div>
              )}
              {paymentDetails.merchantOrder && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Orden:</span>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {paymentDetails.merchantOrder}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Status Brick */}
        {paymentId && (
          <div className="mb-8">
            <PaymentStatus 
              paymentId={paymentId}
              onStatusUpdate={(status) => {
                console.log('Payment status updated:', status);
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">¿Qué hacer ahora?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewTransactions}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Transacciones
            </button>
            <button
              onClick={handleBackToFinance}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a Finanzas
            </button>
          </div>
        </div>

        {/* Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Información importante:</strong> Tu transacción ha sido registrada automáticamente 
                en el sistema. Recibirás una confirmación por email en los próximos minutos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;