import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface Deal {
  id: string;
  client: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  commission: number;
  notes: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  lastContact: string;
  dealValue: number;
  status: 'hot' | 'warm' | 'cold' | 'customer';
  notes: string;
}

interface SalesGoal {
  period: string;
  target: number;
  current: number;
  commission: number;
  dealsNeeded: number;
}

const MisVentas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pipeline');

  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      client: 'TechCorp SA',
      title: 'Implementación CRM Enterprise',
      value: 85000,
      stage: 'proposal',
      probability: 75,
      expectedCloseDate: '2024-03-30',
      lastActivity: '2024-03-10',
      commission: 6800,
      notes: 'Esperando aprobación del comité ejecutivo'
    },
    {
      id: '2',
      client: 'InnovateLTD',
      title: 'Consultoría Digital',
      value: 45000,
      stage: 'negotiation',
      probability: 85,
      expectedCloseDate: '2024-03-20',
      lastActivity: '2024-03-12',
      commission: 2250,
      notes: 'Negociando términos finales de contrato'
    },
    {
      id: '3',
      client: 'StartupXYZ',
      title: 'Paquete Básico SaaS',
      value: 12000,
      stage: 'qualification',
      probability: 50,
      expectedCloseDate: '2024-04-15',
      lastActivity: '2024-03-08',
      commission: 600,
      notes: 'Validando presupuesto y autoridad de compra'
    },
    {
      id: '4',
      client: 'MegaCorp Industries',
      title: 'Transformación Digital',
      value: 150000,
      stage: 'prospecting',
      probability: 25,
      expectedCloseDate: '2024-06-30',
      lastActivity: '2024-03-05',
      commission: 15000,
      notes: 'Primera reunión agendada'
    }
  ]);

  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'Carlos Rodríguez',
      company: 'TechCorp SA',
      email: 'carlos@techcorp.com',
      phone: '+56 9 1111 2222',
      lastContact: '2024-03-10',
      dealValue: 85000,
      status: 'hot',
      notes: 'CTO interesado en modernización'
    },
    {
      id: '2',
      name: 'María González',
      company: 'InnovateLTD',
      email: 'maria@innovate.com',
      phone: '+56 9 3333 4444',
      lastContact: '2024-03-12',
      dealValue: 45000,
      status: 'hot',
      notes: 'CMO busca soluciones de marketing'
    },
    {
      id: '3',
      name: 'Roberto Silva',
      company: 'StartupXYZ',
      email: 'roberto@startupxyz.com',
      phone: '+56 9 5555 6666',
      lastContact: '2024-03-08',
      dealValue: 12000,
      status: 'warm',
      notes: 'Founder evaluando opciones'
    },
    {
      id: '4',
      name: 'Ana Morales',
      company: 'ClienteActual Corp',
      email: 'ana@clienteactual.com',
      phone: '+56 9 7777 8888',
      lastContact: '2024-03-01',
      dealValue: 0,
      status: 'customer',
      notes: 'Cliente satisfecho, posible upsell'
    }
  ]);

  const [salesGoals, setSalesGoals] = useState<SalesGoal>({
    period: 'Q1 2024',
    target: 250000,
    current: 142000,
    commission: 14200,
    dealsNeeded: 3
  });

  const [newDeal, setNewDeal] = useState({
    client: '',
    title: '',
    value: '',
    stage: 'prospecting' as Deal['stage'],
    probability: 25,
    expectedCloseDate: '',
    notes: ''
  });

  const [showNewDealForm, setShowNewDealForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'qualification': return 'bg-electric-yellow/20 text-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow';
      case 'proposal': return 'bg-electric-blue/20 text-electric-blue dark:bg-electric-blue/10 dark:text-electric-blue';
      case 'negotiation': return 'bg-electric-purple/20 text-electric-purple dark:bg-electric-purple/10 dark:text-electric-purple';
      case 'closed-won': return 'bg-electric-green/20 text-electric-green dark:bg-electric-green/10 dark:text-electric-green';
      case 'closed-lost': return 'bg-electric-red/20 text-electric-red dark:bg-electric-red/10 dark:text-electric-red';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-electric-red/20 text-electric-red dark:bg-electric-red/10 dark:text-electric-red';
      case 'warm': return 'bg-electric-yellow/20 text-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow';
      case 'cold': return 'bg-electric-blue/20 text-electric-blue dark:bg-electric-blue/10 dark:text-electric-blue';
      case 'customer': return 'bg-electric-green/20 text-electric-green dark:bg-electric-green/10 dark:text-electric-green';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'Prospección';
      case 'qualification': return 'Calificación';
      case 'proposal': return 'Propuesta';
      case 'negotiation': return 'Negociación';
      case 'closed-won': return 'Ganado';
      case 'closed-lost': return 'Perdido';
      default: return stage;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'hot': return 'Caliente';
      case 'warm': return 'Tibio';
      case 'cold': return 'Frío';
      case 'customer': return 'Cliente';
      default: return status;
    }
  };

  const handleCreateDeal = () => {
    if (!newDeal.client || !newDeal.title || !newDeal.value || !newDeal.expectedCloseDate) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const deal: Deal = {
      id: Date.now().toString(),
      client: newDeal.client,
      title: newDeal.title,
      value: parseFloat(newDeal.value),
      stage: newDeal.stage,
      probability: newDeal.probability,
      expectedCloseDate: newDeal.expectedCloseDate,
      lastActivity: new Date().toISOString().split('T')[0],
      commission: parseFloat(newDeal.value) * 0.08, // 8% commission
      notes: newDeal.notes
    };

    setDeals([deal, ...deals]);
    setNewDeal({
      client: '',
      title: '',
      value: '',
      stage: 'prospecting',
      probability: 25,
      expectedCloseDate: '',
      notes: ''
    });
    setShowNewDealForm(false);
  };

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedPipelineValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  const totalCommissions = deals.reduce((sum, deal) => sum + deal.commission, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💼 Mis Ventas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu pipeline y relaciones con clientes
          </p>
        </div>
        <button
          onClick={() => setShowNewDealForm(true)}
          className="btn-electric"
        >
          💰 Nueva Oportunidad
        </button>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pipeline Total"
          value={formatCurrency(totalPipelineValue)}
          subtitle={`${deals.length} oportunidades activas`}
          color="electric-blue"
        />
        <StatCard
          title="Pipeline Ponderado"
          value={formatCurrency(weightedPipelineValue)}
          subtitle="Valor ajustado por probabilidad"
          color="electric-green"
        />
        <StatCard
          title="Comisiones Potenciales"
          value={formatCurrency(totalCommissions)}
          subtitle="Si se cierran todas las ventas"
          color="electric-purple"
        />
        <StatCard
          title="Meta Q1 2024"
          value={`${Math.round((salesGoals.current / salesGoals.target) * 100)}%`}
          subtitle={`${formatCurrency(salesGoals.current)} / ${formatCurrency(salesGoals.target)}`}
          color="electric-cyan"
        />
      </div>

      {/* Sales Goals Progress */}
      <Card className="bg-gradient-to-br from-electric-green/20 to-electric-green/10 dark:from-electric-green/20 dark:to-electric-green/10 border-electric-green/30 dark:border-electric-green/30">
        <CardHeader>
          <CardTitle className="text-electric-green">🎯 Objetivos de Ventas - {salesGoals.period}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Progreso</h4>
              <div className="text-2xl font-bold text-electric-green mb-1">
                {Math.round((salesGoals.current / salesGoals.target) * 100)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div
                  className="bg-electric-green h-3 rounded-full"
                  style={{ width: `${Math.min((salesGoals.current / salesGoals.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vendido</h4>
              <div className="text-lg font-semibold text-electric-green">
                {formatCurrency(salesGoals.current)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                de {formatCurrency(salesGoals.target)}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Comisiones</h4>
              <div className="text-lg font-semibold text-electric-green">
                {formatCurrency(salesGoals.commission)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                este trimestre
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Por Lograr</h4>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(salesGoals.target - salesGoals.current)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ~{salesGoals.dealsNeeded} deals más
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'pipeline', label: '🔄 Pipeline', icon: '🔄' },
          { id: 'clients', label: '👥 Clientes', icon: '👥' },
          { id: 'analytics', label: '📊 Análisis', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-electric-blue text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <Card>
          <CardHeader>
            <CardTitle>🔄 Pipeline de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Cliente / Oportunidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Etapa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Probabilidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Cierre Esperado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{deal.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{deal.client}</div>
                          <div className="text-xs text-gray-500">Última actividad: {formatDate(deal.lastActivity)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(deal.value)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(deal.stage)}`}>
                          {getStageName(deal.stage)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">{deal.probability}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-electric-blue h-2 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(deal.expectedCloseDate)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-electric-green">{formatCurrency(deal.commission)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <Card>
          <CardHeader>
            <CardTitle>👥 Mis Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{client.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{client.company}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                      {getStatusName(client.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">📧</span>
                      <a href={`mailto:${client.email}`} className="text-electric-blue hover:underline">
                        {client.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">📱</span>
                      <a href={`tel:${client.phone}`} className="text-gray-600 dark:text-gray-400">
                        {client.phone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">💰</span>
                      <span className="font-medium text-electric-green">
                        {client.dealValue > 0 ? formatCurrency(client.dealValue) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">📅</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Último contacto: {formatDate(client.lastContact)}
                      </span>
                    </div>
                  </div>
                  
                  {client.notes && (
                    <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                      {client.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Análisis de Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['prospecting', 'qualification', 'proposal', 'negotiation'].map((stage) => {
                  const stageDeals = deals.filter(d => d.stage === stage);
                  const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                  const percentage = totalPipelineValue > 0 ? (stageValue / totalPipelineValue) * 100 : 0;
                  
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="font-medium text-gray-900 dark:text-white mr-3 w-24">
                          {getStageName(stage)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 dark:bg-gray-700 mr-3">
                          <div
                            className="bg-electric-blue h-3 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(stageValue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stageDeals.length} deals
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Métricas de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Tasa de conversión</span>
                  <span className="font-semibold text-electric-green">68%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Tiempo promedio de cierre</span>
                  <span className="font-semibold text-gray-900 dark:text-white">45 días</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Valor promedio por deal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalPipelineValue / deals.length)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Actividades esta semana</span>
                  <span className="font-semibold text-gray-900 dark:text-white">12</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Reuniones programadas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Deal Modal */}
      {showNewDealForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva Oportunidad de Venta</h3>
              <button
                onClick={() => setShowNewDealForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={newDeal.client}
                  onChange={(e) => setNewDeal({ ...newDeal, client: e.target.value })}
                  placeholder="Nombre del cliente..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título de la oportunidad *
                </label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  placeholder="Ej: Implementación CRM..."
                  className="input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor (USD) *
                  </label>
                  <input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Etapa
                  </label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as Deal['stage'] })}
                    className="input"
                  >
                    <option value="prospecting">Prospección</option>
                    <option value="qualification">Calificación</option>
                    <option value="proposal">Propuesta</option>
                    <option value="negotiation">Negociación</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Probabilidad (%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {newDeal.probability}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cierre esperado *
                  </label>
                  <input
                    type="date"
                    value={newDeal.expectedCloseDate}
                    onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  placeholder="Información adicional..."
                  className="input h-20 resize-none"
                />
              </div>
              
              {newDeal.value && (
                <div className="p-3 bg-electric-green/10 rounded-lg border border-electric-green/20">
                  <span className="text-sm text-electric-green font-medium">
                    Comisión estimada: {formatCurrency(parseFloat(newDeal.value || '0') * 0.08)}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleCreateDeal}
                  className="btn-electric flex-1"
                >
                  Crear Oportunidad
                </button>
                <button
                  onClick={() => setShowNewDealForm(false)}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisVentas;