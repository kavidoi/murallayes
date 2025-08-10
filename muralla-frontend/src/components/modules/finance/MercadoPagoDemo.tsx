import React, { useState } from 'react';
import PaymentBrick from './PaymentBrick';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import PaymentStatus from './PaymentStatus';
import PaymentLinkGenerator from './PaymentLinkGenerator';

const MercadoPagoDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'brick' | 'checkout' | 'status' | 'links'>('brick');
  const [demoSettings, setDemoSettings] = useState({
    amount: 200,
    title: 'Payment Demo - $200',
    customerEmail: 'demo@murallayes.com',
    customerName: 'Demo Customer',
    theme: 'default' as 'default' | 'dark' | 'bootstrap' | 'flat'
  });

  const [paymentResult, setPaymentResult] = useState<any>(null);

  const demos = [
    {
      id: 'brick' as const,
      title: '🧱 Payment Brick',
      description: 'Complete payment form with card processing'
    },
    {
      id: 'checkout' as const,
      title: '💳 Full Checkout',
      description: 'Complete checkout experience with summary'
    },
    {
      id: 'links' as const,
      title: '🔗 Payment Links',
      description: 'Generate payment links for sharing'
    },
    {
      id: 'status' as const,
      title: '📊 Payment Status',
      description: 'Display payment status (requires payment ID)'
    }
  ];

  const handlePaymentSubmit = async (formData: any) => {
    console.log('Demo payment submitted:', formData);
    
    // Simulate payment processing
    const mockResult = {
      id: `demo_payment_${Date.now()}`,
      status: 'approved',
      amount: demoSettings.amount,
      currency: 'CLP',
      payment_method: formData.payment_method_id || 'card',
      created_at: new Date().toISOString()
    };

    setPaymentResult(mockResult);
    
    alert(`Demo payment processed!\nPayment ID: ${mockResult.id}\nStatus: ${mockResult.status}`);
    
    return mockResult;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MercadoPago SDK V2 Integration Demo
          </h1>
          <p className="text-gray-600">
            Complete integration examples using MercadoPago.js V2 SDK with enhanced security and customization
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex items-center px-3 py-2 border-b-2 font-medium text-sm ${
                  activeDemo === demo.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{demo.title.split(' ')[0]}</span>
                <div className="text-left">
                  <div className="font-medium">{demo.title.substring(2)}</div>
                  <div className="text-xs text-gray-500">{demo.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (CLP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={demoSettings.amount}
                    onChange={(e) => setDemoSettings({
                      ...demoSettings,
                      amount: parseInt(e.target.value) || 200
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Title
                  </label>
                  <input
                    type="text"
                    value={demoSettings.title}
                    onChange={(e) => setDemoSettings({
                      ...demoSettings,
                      title: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={demoSettings.customerEmail}
                    onChange={(e) => setDemoSettings({
                      ...demoSettings,
                      customerEmail: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={demoSettings.customerName}
                    onChange={(e) => setDemoSettings({
                      ...demoSettings,
                      customerName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    value={demoSettings.theme}
                    onChange={(e) => setDemoSettings({
                      ...demoSettings,
                      theme: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                    <option value="bootstrap">Bootstrap</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
              </div>

              {/* SDK Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">SDK Information</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• MercadoPago.js V2</div>
                  <div>• Enhanced Security</div>
                  <div>• PCI DSS Compliant</div>
                  <div>• Real-time Validation</div>
                  <div>• Multiple Payment Methods</div>
                </div>
              </div>

              {/* Last Payment Result */}
              {paymentResult && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Last Payment</h4>
                  <div className="text-xs bg-green-50 p-3 rounded border">
                    <div><strong>ID:</strong> {paymentResult.id}</div>
                    <div><strong>Status:</strong> {paymentResult.status}</div>
                    <div><strong>Amount:</strong> ${paymentResult.amount} CLP</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-3">
            {activeDemo === 'brick' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Brick Demo</h2>
                <PaymentBrick
                  amount={demoSettings.amount}
                  title={demoSettings.title}
                  customerEmail={demoSettings.customerEmail}
                  theme={demoSettings.theme}
                  onPaymentSubmit={handlePaymentSubmit}
                />
              </div>
            )}

            {activeDemo === 'checkout' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Checkout Demo</h2>
                <MercadoPagoCheckout
                  amount={demoSettings.amount}
                  title={demoSettings.title}
                  description="Demo payment for testing MercadoPago integration"
                  customerEmail={demoSettings.customerEmail}
                  customerName={demoSettings.customerName}
                  theme={demoSettings.theme}
                  onSuccess={(result) => {
                    setPaymentResult(result);
                    alert(`Payment successful!\nPayment ID: ${result.id}`);
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error);
                    alert('Payment failed. Please try again.');
                  }}
                  onPending={(result) => {
                    setPaymentResult(result);
                    alert(`Payment pending!\nPayment ID: ${result.id}`);
                  }}
                />
              </div>
            )}

            {activeDemo === 'links' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Links Generator</h2>
                <PaymentLinkGenerator />
              </div>
            )}

            {activeDemo === 'status' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status Demo</h2>
                {paymentResult ? (
                  <PaymentStatus
                    paymentId={paymentResult.id}
                    theme={demoSettings.theme}
                    onStatusUpdate={(status) => {
                      console.log('Payment status updated:', status);
                    }}
                  />
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-blue-600">💡</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          No Payment Available
                        </h3>
                        <p className="mt-1 text-sm text-blue-700">
                          Complete a payment using one of the other demos first to see the status screen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Documentation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🚀 Quick Start</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Install MercadoPago SDK V2</p>
                <p>2. Configure public key in environment</p>
                <p>3. Import components and services</p>
                <p>4. Handle payment callbacks</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔧 Environment Setup</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• VITE_MP_PUBLIC_KEY (Frontend)</p>
                <p>• MP_ACCESS_TOKEN (Backend)</p>
                <p>• MP_CLIENT_ID (Backend)</p>
                <p>• MP_CLIENT_SECRET (Backend)</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🛡️ Security Features</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• PCI DSS Level 1 compliance</p>
                <p>• Tokenized card data</p>
                <p>• Real-time fraud detection</p>
                <p>• 3D Secure authentication</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📱 Payment Methods</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Credit & Debit Cards</p>
                <p>• Bank Transfers</p>
                <p>• Digital Wallets</p>
                <p>• Cash Payments (Tickets)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MercadoPagoDemo;
