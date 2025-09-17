import React, { useState, useEffect } from 'react'
import { LinkIcon, BanknotesIcon, BuildingOfficeIcon, MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface BankAccount {
  id: string
  companyId: string
  companyName: string
  bankName: string
  alias: string
  currency: string
  balance: number
  isActive: boolean
}

interface Transaction {
  id: string
  source: 'BANK' | 'MP'
  externalId: string
  companyId: string
  companyName: string
  bankAccountId?: string
  bankAccountAlias?: string
  amount: number
  date: Date
  description: string
  counterpartName?: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  isLinked: boolean
  linkedCostId?: string
  linkedCostDescription?: string
  category?: string
}

const BankingTransactions: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedLinkStatus, setSelectedLinkStatus] = useState<string>('all')
  const [, setShowLinkModal] = useState(false)
  const [, setSelectedTransaction] = useState<Transaction | null>(null)

  // Mock data
  useEffect(() => {
    const mockAccounts: BankAccount[] = [
      {
        id: '1',
        companyId: '1',
        companyName: 'Muralla Spa',
        bankName: 'Banco de Chile',
        alias: 'Cuenta Corriente Principal',
        currency: 'CLP',
        balance: 5420000,
        isActive: true
      },
      {
        id: '2',
        companyId: '2',
        companyName: 'Murallita MEF',
        bankName: 'BancoEstado',
        alias: 'Cuenta Vista MEF',
        currency: 'CLP',
        balance: 1250000,
        isActive: true
      },
      {
        id: '3',
        companyId: '1',
        companyName: 'Muralla Spa',
        bankName: 'MercadoPago',
        alias: 'Cuenta MP',
        currency: 'CLP',
        balance: 320000,
        isActive: true
      }
    ]

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        source: 'BANK',
        externalId: 'TXN-001234',
        companyId: '1',
        companyName: 'Muralla Spa',
        bankAccountId: '1',
        bankAccountAlias: 'Cuenta Corriente Principal',
        amount: -425000,
        date: new Date('2024-01-15T14:30:00'),
        description: 'TRANSFERENCIA CAFE PREMIUM LTDA',
        counterpartName: 'CAFE PREMIUM LTDA',
        status: 'COMPLETED',
        isLinked: true,
        linkedCostId: '1',
        linkedCostDescription: 'Compra café arábica premium 50kg',
        category: 'Materias Primas'
      },
      {
        id: '2',
        source: 'MP',
        externalId: 'MP-567890',
        companyId: '1',
        companyName: 'Muralla Spa',
        bankAccountId: '3',
        bankAccountAlias: 'Cuenta MP',
        amount: 85000,
        date: new Date('2024-01-15T16:45:00'),
        description: 'Pago cliente - Pedido #1234',
        counterpartName: 'CLIENTE CORPORATIVO SA',
        status: 'COMPLETED',
        isLinked: false,
        category: 'Ventas'
      },
      {
        id: '3',
        source: 'BANK',
        externalId: 'TXN-002345',
        companyId: '1',
        companyName: 'Muralla Spa',
        bankAccountId: '1',
        bankAccountAlias: 'Cuenta Corriente Principal',
        amount: -850000,
        date: new Date('2024-01-13T09:00:00'),
        description: 'PAGO ARRIENDO LOCAL ENERO',
        counterpartName: 'INMOBILIARIA XYZ',
        status: 'COMPLETED',
        isLinked: false,
        category: 'Inmueble'
      },
      {
        id: '4',
        source: 'BANK',
        externalId: 'TXN-003456',
        companyId: '2',
        companyName: 'Murallita MEF',
        bankAccountId: '2',
        bankAccountAlias: 'Cuenta Vista MEF',
        amount: -45000,
        date: new Date('2024-01-14T11:20:00'),
        description: 'SERVICIO TECNICO EQUIPOS',
        counterpartName: 'TECNICO ESPECIALISTA',
        status: 'COMPLETED',
        isLinked: false,
        category: 'Servicios'
      }
    ]

    setBankAccounts(mockAccounts)
    setTransactions(mockTransactions)
  }, [])

  const getTransactionIcon = (amount: number) => {
    return amount > 0 ? (
      <ArrowUpIcon className="h-5 w-5 text-green-600" />
    ) : (
      <ArrowDownIcon className="h-5 w-5 text-red-600" />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'BANK': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'MP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.counterpartName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.externalId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAccount = selectedAccount === 'all' || transaction.bankAccountId === selectedAccount
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus
    const matchesLinkStatus = selectedLinkStatus === 'all' || 
                             (selectedLinkStatus === 'linked' && transaction.isLinked) ||
                             (selectedLinkStatus === 'unlinked' && !transaction.isLinked)
    return matchesSearch && matchesAccount && matchesStatus && matchesLinkStatus
  })

  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)
  const unlinkedCount = transactions.filter(t => !t.isLinked).length
  const todayTransactions = transactions.filter(t => 
    t.date.toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Bancos y Transacciones
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestión de cuentas bancarias y vinculación con costos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <ArrowDownIcon className="h-4 w-4 mr-2" />
                Importar
              </button>
              <button
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Vincular Masivo
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transacciones por descripción, contraparte o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las cuentas</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.alias} - {account.companyName}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="COMPLETED">Completado</option>
                <option value="PENDING">Pendiente</option>
                <option value="FAILED">Fallido</option>
              </select>
              <select
                value={selectedLinkStatus}
                onChange={(e) => setSelectedLinkStatus(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="linked">Vinculados</option>
                <option value="unlinked">Sin vincular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cuentas Activas</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{bankAccounts.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin Vincular</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{unlinkedCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArrowUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hoy</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{todayTransactions}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Bank Accounts */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cuentas Bancarias
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {account.alias}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          account.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {account.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {account.bankName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {account.companyName}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${account.balance.toLocaleString()} {account.currency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transacciones
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Transacción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cuenta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vinculación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredTransactions.map((transaction) => (
                        <motion.tr
                          key={transaction.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1 mr-3">
                                {getTransactionIcon(transaction.amount)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {transaction.description}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {transaction.counterpartName}
                                </div>
                                <div className="flex items-center mt-1 space-x-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadge(transaction.source)}`}>
                                    {transaction.source}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {transaction.bankAccountAlias}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.companyName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              transaction.amount > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.isLinked ? (
                              <div className="flex items-center">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                <div>
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    Vinculado
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {transaction.linkedCostDescription}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Sin vincular
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!transaction.isLinked && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setShowLinkModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Vincular
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron transacciones
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o importar nuevas transacciones.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BankingTransactions
