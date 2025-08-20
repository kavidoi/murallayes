import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Extract error details from URL parameters
    setErrorDetails({
      paymentId,
      status,
      statusDetail,
      externalReference,
    });
  }, [paymentId, status, statusDetail, externalReference]);

  const handleRetryPayment = () => {
    // Navigate back to payment form or finance section
    navigate('/finance/payment');
  };

  const handleBackToFinance = () => {
    navigate('/finance');
  };

  const handleContactSupport = () => {
    // You can implement support contact logic here
    window.open('mailto:soporte@murallacafe.cl', '_blank');
  };

  const getStatusMessage = (status: string | null, statusDetail: string | null) => {
    if (status === 'rejected') {
      switch (statusDetail) {
        case 'cc_rejected_insufficient_amount':
          return 'Fondos insuficientes en la tarjeta';
        case 'cc_rejected_bad_filled_card_number':
          return 'Número de tarjeta inválido';
        case 'cc_rejected_bad_filled_security_code':
          return 'Código de seguridad inválido';
        case 'cc_rejected_bad_filled_date':
          return 'Fecha de expiración inválida';
        case 'cc_rejected_high_risk':
          return 'Pago rechazado por seguridad';
        case 'cc_rejected_by_bank':
          return 'Pago rechazado por el banco';
        case 'cc_rejected_card_disabled':
          return 'Tarjeta deshabilitada';
        default:
          return 'El pago fue rechazado';
      }
    }
    return 'El pago no pudo ser procesado';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <span className="text-3xl text-red-600">✗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pago No Completado</h1>
          <p className="mt-2 text-lg text-gray-600">
            {getStatusMessage(errorDetails?.status, errorDetails?.statusDetail)}
          </p>
        </div>

        {/* Error Details */}
        {errorDetails && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Error</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {errorDetails.paymentId && (
                <div>
                  <span className="text-sm font-medium text-gray-500">ID de Intento:</span>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {errorDetails.paymentId}
                  </p>
                </div>
              )}
              {errorDetails.status && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Estado:</span>
                  <p className="mt-1 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {errorDetails.status}
                    </span>
                  </p>
                </div>
              )}
              {errorDetails.statusDetail && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Detalle:</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {errorDetails.statusDetail}
                  </p>
                </div>
              )}
              {errorDetails.externalReference && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Referencia:</span>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {errorDetails.externalReference}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posibles Soluciones</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</span>
              <span className="ml-2">Verifica que los datos de tu tarjeta sean correctos</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</span>
              <span className="ml-2">Asegúrate de tener fondos suficientes en tu cuenta</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</span>
              <span className="ml-2">Intenta con un método de pago diferente</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</span>
              <span className="ml-2">Contacta con tu banco si el problema persiste</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">¿Qué hacer ahora?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRetryPayment}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Intentar Nuevamente
            </button>
            <button
              onClick={handleContactSupport}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contactar Soporte
            </button>
            <button
              onClick={handleBackToFinance}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a Finanzas
            </button>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">💡</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>¿Necesitas ayuda?</strong> Si tienes problemas recurrentes con los pagos, 
                nuestro equipo de soporte está disponible para ayudarte en soporte@murallacafe.cl
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;