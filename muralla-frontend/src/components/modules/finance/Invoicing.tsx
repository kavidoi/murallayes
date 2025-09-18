import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { invoicingService, type TaxDocument } from '../../../services/invoicingService';

const Invoicing: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<TaxDocument[]>([]);
  const [filters, setFilters] = useState({ type: '', status: '', startDate: '', endDate: '', search: '' });
  const [selected, setSelected] = useState<TaxDocument | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (useFilters = false) => {
    try {
      setLoading(true); setError(null);
      const params = useFilters ? filters : {} as any;
      const list = await invoicingService.list(params);
      setDocs(list);
    } catch (e: any) {
      setError(e?.message || 'Error loading invoicing data');
    } finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ISSUED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'CANCELLED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount?: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount || 0);
  const formatDate = (s?: string) => (s ? new Date(s).toLocaleDateString('es-CL') : '—');

  const handleImportSupplierInvoices = async () => {
    if (importing) return;

    setImporting(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await invoicingService.importReceivedDocuments({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        dryRun: false,
      });

      alert(`Import completed! Imported ${result.totalImported} new documents, skipped ${result.totalSkipped} duplicates.`);
      await fetchAll(); // Refresh the list
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Calculate enhanced statistics
  const stats = {
    total: docs.length,
    received: docs.filter(d => !!d.emitterName).length,
    emitted: docs.filter(d => !d.emitterName).length,
    accepted: docs.filter(d => d.status === 'ACCEPTED').length,
    pending: docs.filter(d => d.status === 'ISSUED' || d.status === 'DRAFT').length,
    rejected: docs.filter(d => d.status === 'REJECTED').length,
    totalValue: docs.reduce((sum, d) => sum + (d.totalAmount || 0), 0),
    receivedValue: docs.filter(d => !!d.emitterName).reduce((sum, d) => sum + (d.totalAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (<div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading invoicing data</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              <button onClick={fetchAll} className="mt-3 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded">Try Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoicing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage Boletas and Facturas. Styled like Bank.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">🔄 Refresh</button>
          <button
            onClick={handleImportSupplierInvoices}
            disabled={importing}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              importing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {importing ? '⏳ Importing...' : '📥 Import Supplier Invoices'}
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">📊 Export</button>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Received Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.received}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(stats.receivedValue)} total value
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Emitted Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.emitted}</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Our invoices to customers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.accepted}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Confirmed documents
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              All documents combined
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})} className="input">
                <option value="">All</option>
                <option value="BOLETA">Boletas</option>
                <option value="FACTURA">Facturas</option>
                <option value="CREDIT_NOTE">Credit Notes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="input">
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
              <input type="date" value={filters.startDate} onChange={e=>setFilters({...filters,startDate:e.target.value})} className="input"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
              <input type="date" value={filters.endDate} onChange={e=>setFilters({...filters,endDate:e.target.value})} className="input"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search (Folio/RUT/Name)</label>
              <input type="text" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} className="input" placeholder="e.g., 12345 or 11.111.111-1"/>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={() => fetchAll(true)} className="btn-primary px-4 py-2">Apply Filters</button>
            <button onClick={() => { setFilters({ type: '', status: '', startDate: '', endDate: '', search: '' }); fetchAll(false); }} className="btn-secondary px-4 py-2">Reset</button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No documents yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {docs.map((d) => {
                    // Determine if this is a received document (from supplier) or emitted document (to customer)
                    const isReceived = !!d.emitterName;
                    const companyName = isReceived ? d.emitterName : (d.receiverName || d.receiverRUT);
                    const companyRUT = isReceived ? d.emitterRUT : d.receiverRUT;

                    return (
                      <tr key={d.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setSelected(d)}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isReceived ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            {d.type}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-mono text-sm">{d.folio || '—'}</td>
                        <td className="px-4 py-2">
                          <div className="max-w-48">
                            <div className="font-medium text-sm truncate">{companyName || '—'}</div>
                            {companyRUT && <div className="text-xs text-gray-500 truncate">{companyRUT}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(d.issuedAt || d.createdAt)}</td>
                        <td className="px-4 py-2 whitespace-nowrap font-semibold">{formatCurrency(d.totalAmount)}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><Badge className={getStatusColor(d.status)}>{d.status}</Badge></td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isReceived
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {isReceived ? 'Received' : 'Emitted'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          <a
                            className="text-primary-600 hover:underline text-sm"
                            href={invoicingService.getDocumentPDFUrl(d.id, 'inline')}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📄 PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selected && (() => {
        const isReceived = !!selected.emitterName;
        const companyName = isReceived ? selected.emitterName : (selected.receiverName || selected.receiverRUT);
        const companyRUT = isReceived ? selected.emitterRUT : selected.receiverRUT;

        return (
          <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg h-full bg-white dark:bg-gray-900 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isReceived ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                    <span className="text-sm text-gray-500">{selected.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isReceived
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {isReceived ? 'Received' : 'Emitted'}
                    </span>
                  </div>
                  <div className="text-xl font-semibold">{selected.folio || '—'}</div>
                </div>
                <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
              </div>

              <div className="p-4 space-y-6">
                {/* Company Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {isReceived ? 'Supplier (Emitter)' : 'Customer (Receiver)'}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-sm">{companyName || 'No name provided'}</div>
                    {companyRUT && <div className="text-xs text-gray-500 mt-1">RUT: {companyRUT}</div>}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Financial Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Net Amount</div>
                      <div className="text-sm">{formatCurrency(selected.netAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">IVA (Tax)</div>
                      <div className="text-sm">{formatCurrency(selected.taxAmount)}</div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500">Total Amount</div>
                      <div className="text-lg font-semibold">{formatCurrency(selected.totalAmount)}</div>
                    </div>
                  </div>
                </div>

                {/* Document Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Document Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issue Date:</span>
                      <span>{formatDate(selected.issuedAt || selected.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Document Code:</span>
                      <span>{selected.documentCode || '—'}</span>
                    </div>
                    {selected.source && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="capitalize">{selected.source.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Notes */}
                {selected.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Additional Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selected.notes}
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Actions */}
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex gap-3">
                    <a
                      className="btn-primary flex-1 px-4 py-2 text-center"
                      href={invoicingService.getDocumentPDFUrl(selected.id, 'inline')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📄 View PDF
                    </a>
                    <a
                      className="btn-secondary px-4 py-2"
                      href={invoicingService.getDocumentPDFUrl(selected.id, 'download')}
                      rel="noreferrer"
                    >
                      💾 Download
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <a
                      className="btn-secondary flex-1 px-4 py-2 text-center text-xs"
                      href={invoicingService.getDocumentXMLUrl(selected.id, 'inline')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📄 XML
                    </a>
                    <button
                      className="btn-secondary px-4 py-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
                        alert('Document data copied to clipboard');
                      }}
                    >
                      📋 Copy JSON
                    </button>
                  </div>

                  <button className="btn-secondary px-4 py-2 mt-2" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Invoicing;
