import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentStatus from './PaymentStatus';

const PaymentPending: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');
  const externalReference = searchParams.get('external_reference');
  const merchantOrder = searchParams.get('merchant_order_id');

  useEffect(() => {
    // Extract payment details from URL parameters
    setPaymentDetails({
      paymentId,
      status,
      statusDetail,
      externalReference,
      merchantOrder,
    });
  }, [paymentId, status, statusDetail, externalReference, merchantOrder]);

  const handleBackToFinance = () => {
    navigate('/finance');
  };

  const handleViewTransactions = () => {
    navigate('/finance/transactions');
  };

  const getPendingMessage = (statusDetail: string | null) => {
    switch (statusDetail) {
      case 'pending_contingency':
        return 'Estamos procesando el pago. Te notificaremos cuando esté completado.';
      case 'pending_review_manual':
        return 'Estamos revisando tu pago. Te notificaremos el resultado en breve.';
      case 'pending_waiting_transfer':
        return 'Esperando la transferencia bancaria.';
      case 'pending_waiting_payment':
        return 'Esperando el pago del comprador.';
      default:
        return 'Tu pago está siendo procesado. Te notificaremos cuando esté completado.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pending Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pago en Proceso</h1>
          <p className="mt-2 text-lg text-gray-600">
            {getPendingMessage(paymentDetails?.statusDetail)}
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {paymentDetails.status}
                    </span>
                  </p>
                </div>
              )}
              {paymentDetails.statusDetail && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Detalle:</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {paymentDetails.statusDetail}
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
                // You could implement real-time status updates here
                if (status === 'approved') {
                  navigate(`/finance/payment/success?payment_id=${paymentId}`);
                } else if (status === 'rejected') {
                  navigate(`/finance/payment/failure?payment_id=${paymentId}`);
                }
              }}
            />
          </div>
        )}

        {/* Timeline Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">¿Cuánto tiempo tomará?</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Transferencias bancarias</p>
                <p className="text-sm text-gray-500">1-2 días hábiles</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Medios de pago en efectivo</p>
                <p className="text-sm text-gray-500">1-3 días hábiles después del pago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Revisión manual</p>
                <p className="text-sm text-gray-500">Hasta 2 días hábiles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">¿Qué hacer mientras esperas?</h3>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600">📧</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Te mantendremos informado:</strong> Recibirás una notificación por email 
                tan pronto como el estado de tu pago cambie. También puedes revisar el estado 
                en cualquier momento desde el panel de transacciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;