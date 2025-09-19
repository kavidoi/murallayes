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
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">📊 Export</button>
        </div>
      </div>

      {/* KPI Cards (placeholder counts for Phase 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Documents</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{docs.length}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Accepted</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-700 dark:text-green-300">{docs.filter(d=>d.status==='ACCEPTED').length}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending/Issued</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{docs.filter(d=>d.status==='ISSUED' || d.status==='DRAFT').length}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-700 dark:text-red-300">{docs.filter(d=>d.status==='REJECTED').length}</div></CardContent>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {docs.map((d) => (
                    <tr key={d.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setSelected(d)}>
                      <td className="px-4 py-2 whitespace-nowrap">{d.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{d.folio || '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{d.receiverName || d.receiverRUT || '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(d.issuedAt || d.createdAt)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(d.totalAmount)}</td>
                      <td className="px-4 py-2 whitespace-nowrap"><Badge className={getStatusColor(d.status)}>{d.status}</Badge></td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <a className="text-primary-600 hover:underline" href={d.pdfUrl || '#'} target={d.pdfUrl ? '_blank' : undefined} rel="noreferrer">PDF</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg h-full bg-white dark:bg-gray-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">{selected.type}</div>
                <div className="text-xl font-semibold">{selected.folio || '—'}</div>
              </div>
              <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Receiver</div>
                  <div className="text-sm">{selected.receiverName || selected.receiverRUT || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-sm">{formatDate(selected.issuedAt || selected.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Net</div>
                  <div className="text-sm">{formatCurrency(selected.netAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">IVA</div>
                  <div className="text-sm">{formatCurrency(selected.taxAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-sm font-semibold">{formatCurrency(selected.totalAmount)}</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {selected.pdfUrl && (
                  <a className="btn-secondary px-4 py-2" href={selected.pdfUrl} target="_blank" rel="noreferrer">📄 PDF</a>
                )}
                <button className="btn-secondary px-4 py-2" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoicing;
