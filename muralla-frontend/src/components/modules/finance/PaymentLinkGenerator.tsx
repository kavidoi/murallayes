import React, { useState } from 'react';
import { AuthService } from '../../../services/authService';

interface PaymentLinkData {
  title: string;
  amount: string;
  description: string;
  customerEmail: string;
  customerName: string;
  externalReference: string;
  categoryId: string;
  itemId: string;
  binaryMode: boolean;
}

const PaymentLinkGenerator: React.FC = () => {
  const [formData, setFormData] = useState<PaymentLinkData>({
    title: 'Payment for Services',
    amount: '200',
    description: 'Payment link generated for services',
    customerEmail: '',
    customerName: '',
    externalReference: `payment-${Date.now()}`,
    categoryId: 'services',
    itemId: `item-${Date.now()}`,
    binaryMode: true
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const paymentData = {
        title: formData.title,
        quantity: 1,
        unit_price: parseFloat(formData.amount),
        currency_id: 'CLP',
        external_reference: formData.externalReference,
        description: formData.description,
        // Enhanced fields for fraud prevention and approval rates
        category_id: formData.categoryId,
        item_id: formData.itemId,
        binary_mode: formData.binaryMode,
        payer: (formData.customerEmail || formData.customerName) ? {
          email: formData.customerEmail || undefined,
          first_name: formData.customerName.split(' ')[0] || undefined,
          last_name: formData.customerName.split(' ').slice(1).join(' ') || undefined
        } : undefined
      };

      const response = await AuthService.apiCall('/api/finance/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response && response.init_point) {
        setResult(response);
      } else {
        throw new Error('Failed to create payment preference');
      }
    } catch (err) {
      console.error('Error creating payment link:', err);
      setError('Failed to create payment link. Please check your permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Payment link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Payment link copied to clipboard!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Link Generator</h1>
          <p className="text-gray-600">Create MercadoPago payment links for your customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
            
            <form onSubmit={handleCreatePaymentLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Payment for Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (CLP)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="200"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.amount && formatCurrency(parseFloat(formData.amount) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Payment link generated for services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.externalReference}
                  onChange={(e) => setFormData({...formData, externalReference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="payment-12345"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Unique identifier for tracking this payment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="services">Services</option>
                  <option value="digital_goods">Digital Goods</option>
                  <option value="physical_goods">Physical Goods</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="consulting">Consulting</option>
                  <option value="software">Software</option>
                  <option value="others">Others</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Item category helps improve approval rates
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemId}
                  onChange={(e) => setFormData({...formData, itemId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="item-12345"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Unique item identifier for tracking
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="binaryMode"
                  checked={formData.binaryMode}
                  onChange={(e) => setFormData({...formData, binaryMode: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="binaryMode" className="ml-2 block text-sm text-gray-700">
                  <span className="font-medium">Binary Mode (Instant Approval)</span>
                  <p className="text-gray-500 text-xs mt-1">
                    Requires immediate payment approval (recommended for most businesses)
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Creating Payment Link...' : '🔗 Generate Payment Link'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Link Result</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-green-400">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">Payment link created successfully!</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔗 Payment Link (Production)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={result.init_point}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(result.init_point)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-r-md border border-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {result.sandbox_init_point && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🧪 Test Payment Link (Sandbox)
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={result.sandbox_init_point}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(result.sandbox_init_point)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-r-md border border-gray-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Preference ID:</p>
                    <p className="text-gray-600 font-mono text-xs">{result.id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Amount:</p>
                    <p className="text-gray-600">{formatCurrency(parseFloat(formData.amount))}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Reference:</p>
                    <p className="text-gray-600 font-mono text-xs">{formData.externalReference}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Category:</p>
                    <p className="text-gray-600">{formData.categoryId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Item ID:</p>
                    <p className="text-gray-600 font-mono text-xs">{formData.itemId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Binary Mode:</p>
                    <p className={`font-medium ${formData.binaryMode ? 'text-green-600' : 'text-yellow-600'}`}>
                      {formData.binaryMode ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Next Steps:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Share the payment link with your customer</li>
                    <li>• Monitor payment status in the Finance Dashboard</li>
                    <li>• Payment notifications will be sent to your webhook</li>
                    <li>• Successful payments will redirect to your success page</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2">✨ Enhanced Features:</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>Binary Mode:</strong> Ensures instant payment approval decisions</li>
                    <li>• <strong>Item Category:</strong> Improves approval rates through fraud prevention</li>
                    <li>• <strong>Customer Info:</strong> Reduces fraud risk and increases trust</li>
                    <li>• <strong>External Reference:</strong> Enables payment correlation with your system</li>
                    <li>• <strong>Auto Redirects:</strong> Seamless user experience after payment</li>
                  </ul>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔗</div>
                <p>Fill out the form and click "Generate Payment Link" to create a MercadoPago payment link</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkGenerator;
