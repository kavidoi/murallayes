import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { posService, type POSTransaction, type POSTransactionSummary, type POSHealthCheck, type POSSyncLog, type POSConfiguration } from '../../../services/posService';

interface POSSalesProps {
  className?: string;
}

type TabType = 'overview' | 'transactions' | 'sync' | 'configuration';

const POSSales: React.FC<POSSalesProps> = ({ className = '' }) => {
  // Data states
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [summary, setSummary] = useState<POSTransactionSummary | null>(null);
  const [health, setHealth] = useState<POSHealthCheck | null>(null);
  const [configuration, setConfiguration] = useState<any>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Date filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  
  // Sync date range
  const [syncDateRange, setSyncDateRange] = useState({
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });
  
  // Configuration form state
  const [configForm, setConfigForm] = useState({
    autoSyncEnabled: true,
    syncIntervalHours: 24,
    maxDaysToSync: 60,
    retentionDays: 365,
    apiKey: '',
    baseUrl: '',
  });

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Load transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [dateRange, currentPage]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryData, healthData, configData] = await Promise.all([
        posService.getTransactionSummary(dateRange.startDate, dateRange.endDate),
        posService.getHealth(),
        posService.getConfiguration(),
      ]);
      
      setSummary(summaryData);
      setHealth(healthData);
      setConfiguration(configData);
      
      // Update config form with current values (API key is never returned by backend)
      setConfigForm({
        autoSyncEnabled: configData.autoSyncEnabled,
        syncIntervalHours: configData.syncIntervalHours,
        maxDaysToSync: configData.maxDaysToSync,
        retentionDays: configData.retentionDays,
        apiKey: '',
        baseUrl: configData.baseUrl || '',
      });
      
      // Load transactions
      await loadTransactions();
      
    } catch (err: any) {
      console.error('Error loading POS data:', err);
      setError(err.response?.data?.message || err.message || 'Error loading POS data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTransactions = async () => {
    try {
      // Prefer explicit filter inputs; fall back to dateRange
      const start = filters.startDate || dateRange.startDate;
      const end = filters.endDate || dateRange.endDate;
      const status = filters.status || undefined as any;
      const response = await posService.getTransactions({
        startDate: start,
        endDate: end,
        status,
        limit: pageSize,
        offset: currentPage * pageSize,
      });
      
      setTransactions(response.transactions);
      setTotalTransactions(response.total);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
    }
  };
  
  const loadSummary = async () => {
    try {
      const summaryData = await posService.getTransactionSummary(dateRange.startDate, dateRange.endDate);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };
  
  const loadSyncHistory = async () => {
    try {
      const history = await posService.getSyncHistory(20);
      setSyncHistory(history);
    } catch (err: any) {
      console.error('Error loading sync history:', err);
    }
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSyncDateRangeChange = (field: 'fromDate' | 'toDate', value: string) => {
    setSyncDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    loadAllData();
  };

  const resetFilters = () => {
    setDateRange({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
    loadAllData();
  };

  const triggerSync = async () => {
    try {
      setSyncLoading(true);
      const result = await posService.triggerSync(syncDateRange.fromDate, syncDateRange.toDate);
      
      if (result.success) {
        // Refresh data after successful sync
        // Update filters and date range to the synced window so results are visible
        setFilters({
          startDate: syncDateRange.fromDate,
          endDate: syncDateRange.toDate,
          status: ''
        });
        setDateRange({ startDate: syncDateRange.fromDate, endDate: syncDateRange.toDate });
        setCurrentPage(0);
        await loadAllData();
        await loadSyncHistory();
        alert(`Sync completed successfully!\n\nProcessed: ${result.data.processedTransactions} transactions\nCreated: ${result.data.createdTransactions} new records`);
      } else {
        alert(`Sync failed: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error triggering sync:', err);
      alert(`Sync error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };
  
  const updateConfiguration = async () => {
    try {
      setConfigLoading(true);
      const payload: any = {
        autoSyncEnabled: configForm.autoSyncEnabled,
        syncIntervalHours: configForm.syncIntervalHours,
        maxDaysToSync: configForm.maxDaysToSync,
        retentionDays: configForm.retentionDays,
      };
      if (configForm.baseUrl) payload.baseUrl = configForm.baseUrl;
      if (configForm.apiKey) payload.apiKey = configForm.apiKey;

      const updated = await posService.updateConfiguration(payload);
      setConfiguration(updated);
      alert('Configuration updated successfully!');
    } catch (err: any) {
      console.error('Error updating configuration:', err);
      alert(`Configuration error: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfigLoading(false);
    }
  };
  
  const nextPage = () => {
    if ((currentPage + 1) * pageSize < totalTransactions) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading POS sales
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={loadAllData}
              className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-md text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Define all render functions before the return statement
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {posService.formatCurrency(summary?.totalAmount || 0)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary?.totalTransactions || 0}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary?.successRate || 0}%
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary?.failedTransactions || 0}
                </p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Status */}
      {configuration && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Configuration</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {configuration.hasApiKey ? '✅ API Key Configured' : '❌ API Key Missing'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Sync</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {configuration.autoSyncEnabled ? '✅ Enabled' : '❌ Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadTransactions()}
                className="btn-primary w-full"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Card
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tx.sequenceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {posService.formatDate(tx.transactionDateTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {posService.formatCurrency(tx.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tx.cardBrand} ({tx.transactionType})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={posService.getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          className="text-sm px-3 py-1 rounded bg-primary-600 hover:bg-primary-700 text-white"
                          onClick={async () => {
                            try {
                              const { invoicingService } = await import('../../../services/invoicingService');
                              const res = await invoicingService.issueBoletaFromPos(tx.id, { emitNow: true });
                              alert('Boleta created. Check Finance → Invoicing.');
                            } catch (e: any) {
                              alert(`Issue Boleta failed: ${e?.response?.data?.message || e?.message || 'Unknown error'}`);
                            }
                          }}
                        >
                          Issue Boleta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  const renderSyncManagement = () => (
    <div className="space-y-6">
      {/* Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={syncDateRange.fromDate}
                onChange={(e) => handleSyncDateRangeChange('fromDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={syncDateRange.toDate}
                onChange={(e) => handleSyncDateRangeChange('toDate', e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={triggerSync}
                disabled={syncLoading}
                className="btn-primary w-full"
              >
                {syncLoading ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manually sync POS transaction data from Tuu BranchReport API for the specified date range.
          </p>
        </CardContent>
      </Card>
      
      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No sync history</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No synchronization operations have been performed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Results
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Started At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {syncHistory.map((sync) => (
                    <tr key={sync.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-3">
                            {sync.syncType === 'MANUAL' ? '🔄' : '⏰'}
                          </div>
                          <Badge className={sync.syncType === 'MANUAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}>
                            {sync.syncType}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={posService.getStatusColor(sync.status)}>
                          {sync.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {sync.dateRangeFrom && sync.dateRangeTo ? (
                          <div>
                            <div>{posService.formatDate(sync.dateRangeFrom)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              to {posService.formatDate(sync.dateRangeTo)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          Processed: {sync.totalProcessed || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {sync.totalCreated || 0}
                        </div>
                        {sync.errorMessages && sync.errorMessages.length > 0 && (
                          <div className="text-xs text-red-500 dark:text-red-400">
                            {sync.errorMessages.length} errors
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {sync.startTime && sync.endTime ? (
                          <div>
                            {Math.round((new Date(sync.endTime).getTime() - new Date(sync.startTime).getTime()) / 1000)}s
                          </div>
                        ) : sync.status === 'RUNNING' ? (
                          <div className="text-yellow-600 dark:text-yellow-400">Running...</div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {posService.formatDate(sync.startTime)}
                        </div>
                        <div className="text-xs">
                          {posService.formatTime(sync.startTime)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  const renderConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>POS Sync Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configForm.autoSyncEnabled}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Automatic Sync
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically sync data daily at 2 AM (Chile timezone)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sync Interval (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={configForm.syncIntervalHours}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, syncIntervalHours: parseInt(e.target.value) || 24 }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How often to run automatic sync (1-168 hours)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tuu API Base URL
                </label>
                <input
                  type="text"
                  placeholder="https://integrations.payment.haulmer.com"
                  value={configForm.baseUrl}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default: https://integrations.payment.haulmer.com
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Days to Sync
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={configForm.maxDaysToSync}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, maxDaysToSync: parseInt(e.target.value) || 60 }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How many days back to sync in automatic runs (recommended: 60)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Retention (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={configForm.retentionDays}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 365 }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How long to keep transaction data (30-3650 days)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tuu API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your Tuu API Key"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This is stored on the server and not exposed to the client.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</h4>
                {configuration && (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={configuration.hasApiKey ? posService.getStatusColor('success') : posService.getStatusColor('failed')}>
                        {configuration.hasApiKey ? 'API Key Configured' : 'API Key Missing'}
                      </Badge>
                      <Badge className={configuration.autoSyncEnabled ? posService.getStatusColor('success') : posService.getStatusColor('failed')}>
                        {configuration.autoSyncEnabled ? 'Auto Sync Enabled' : 'Auto Sync Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Base URL: {configuration.baseUrl || 'Not configured'}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={updateConfiguration}
                disabled={configLoading}
                className="btn-primary"
              >
                {configLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-amber-200 dark:border-amber-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Important Configuration Notes
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• The system will automatically sync daily at 2 AM Chile time when enabled</li>
                <li>• 60-day sync window ensures complete data backup and synchronization</li>
                <li>• Data older than retention period will be automatically archived</li>
                <li>• Manual sync operations can be performed anytime regardless of automatic settings</li>
                <li>• API key is required for both manual and automatic sync operations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render the content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'transactions':
        return renderTransactions();
      case 'sync':
        return renderSyncManagement();
      case 'configuration':
        return renderConfiguration();
      default:
        return renderOverview();
    }
  };

  // Main component return
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            POS Sales
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage POS transactions, sync data, and configure the connection
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'transactions', label: 'Transactions', icon: '💳' },
            { id: 'sync', label: 'Sync', icon: '🔄' },
            { id: 'configuration', label: 'Configuration', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                if (tab.id === 'sync') loadSyncHistory();
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default POSSales;
