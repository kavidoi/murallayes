import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';

interface PTORequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedBy?: string;
  notes?: string;
}

interface PTOBalance {
  currentBalance: number;
  accrualRate: number; // days per month
  used: number;
  pending: number;
  expiringDays: number;
  expirationDate: string;
}

const MisVacaciones: React.FC = () => {
  const [balance, setBalance] = useState<PTOBalance>({
    currentBalance: 12,
    accrualRate: 1.25,
    used: 8,
    pending: 3,
    expiringDays: 4,
    expirationDate: '2024-12-31'
  });

  const [requests, setRequests] = useState<PTORequest[]>([
    {
      id: '1',
      startDate: '2024-03-15',
      endDate: '2024-03-22',
      days: 7,
      reason: 'Vacaciones familiares',
      status: 'approved',
      submittedAt: '2024-02-20',
      approvedBy: 'Sarah Manager'
    },
    {
      id: '2',
      startDate: '2024-04-10',
      endDate: '2024-04-12',
      days: 3,
      reason: 'Asuntos personales',
      status: 'pending',
      submittedAt: '2024-03-01'
    },
    {
      id: '3',
      startDate: '2024-05-20',
      endDate: '2024-05-24',
      days: 5,
      reason: 'Vacaciones de verano',
      status: 'pending',
      submittedAt: '2024-03-05'
    }
  ]);

  const [newRequest, setNewRequest] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  const calculateBusinessDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  };

  const handleSubmitRequest = () => {
    if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert('Por favor completa todos los campos');
      return;
    }

    const days = calculateBusinessDays(newRequest.startDate, newRequest.endDate);
    
    if (days > balance.currentBalance) {
      alert('No tienes suficientes días de PTO disponibles');
      return;
    }

    const request: PTORequest = {
      id: Date.now().toString(),
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days,
      reason: newRequest.reason,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setRequests([request, ...requests]);
    setBalance(prev => ({ ...prev, pending: prev.pending + days }));
    setNewRequest({ startDate: '', endDate: '', reason: '' });
    setShowNewRequestForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-electric-green/20 text-electric-green dark:bg-electric-green/10 dark:text-electric-green';
      case 'pending': return 'bg-electric-yellow/20 text-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow';
      case 'rejected': return 'bg-electric-red/20 text-electric-red dark:bg-electric-red/10 dark:text-electric-red';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏖️ Mis Vacaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu tiempo libre de manera inteligente
          </p>
        </div>
        <button
          onClick={() => setShowNewRequestForm(true)}
          className="btn-electric-green"
        >
          📝 Solicitar PTO
        </button>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Días Disponibles"
          value={balance.currentBalance}
          subtitle="Balance actual"
          color="electric-green"
        />
        <StatCard
          title="Días Usados"
          value={balance.used}
          subtitle="Este año"
          color="electric-blue"
        />
        <StatCard
          title="Días Pendientes"
          value={balance.pending}
          subtitle="En solicitudes"
          color="electric-yellow"
        />
        <StatCard
          title="Días por Expirar"
          value={balance.expiringDays}
          subtitle={`Antes del ${formatDate(balance.expirationDate)}`}
          color="electric-red"
        />
      </div>

      {/* Accrual Information */}
      <div className="card bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-cyan/20 dark:to-electric-blue/10 border-electric-cyan/30 dark:border-electric-blue/30">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">📈 Acumulación de PTO</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de acumulación</span>
            <p className="text-lg font-semibold text-electric-cyan">{balance.accrualRate} días/mes</p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Próxima acumulación</span>
            <p className="text-lg font-semibold text-electric-cyan">1 día</p>
            <span className="text-xs text-gray-500">En 15 días</span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Proyección anual</span>
            <p className="text-lg font-semibold text-electric-cyan">15 días</p>
            <span className="text-xs text-gray-500">Si no usas PTO</span>
          </div>
        </div>
      </div>

      {/* Team Coverage Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">👥 Análisis de Cobertura</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Semana del 15-19 Mar</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tu solicitud: 7 días</p>
            </div>
            <div className="text-right">
              <span className="text-electric-green font-medium">✅ Cobertura disponible</span>
              <p className="text-xs text-gray-500">2 compañeros pueden cubrir</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Semana del 10-12 Abr</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tu solicitud: 3 días</p>
            </div>
            <div className="text-right">
              <span className="text-electric-yellow font-medium">⚠️ Cobertura limitada</span>
              <p className="text-xs text-gray-500">Solo 1 compañero disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📋 Historial de Solicitudes</h3>
          <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800">
            <option>Todas</option>
            <option>Aprobadas</option>
            <option>Pendientes</option>
            <option>Rechazadas</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Fechas</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Días</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Motivo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Enviado</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">{request.days}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{request.reason}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status)}`}>
                      {request.status === 'approved' ? 'Aprobado' : 
                       request.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(request.submittedAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva Solicitud de PTO</h3>
              <button
                onClick={() => setShowNewRequestForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  className="input"
                />
              </div>
              
              {newRequest.startDate && newRequest.endDate && (
                <div className="p-3 bg-electric-blue/10 rounded-lg border border-electric-blue/20">
                  <span className="text-sm text-electric-blue font-medium">
                    Días solicitados: {calculateBusinessDays(newRequest.startDate, newRequest.endDate)}
                  </span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Describe el motivo de tu solicitud..."
                  className="input h-20 resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitRequest}
                  className="btn-electric-green flex-1"
                >
                  Enviar Solicitud
                </button>
                <button
                  onClick={() => setShowNewRequestForm(false)}
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

export default MisVacaciones;