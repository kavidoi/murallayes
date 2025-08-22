import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: 'in-person' | 'remote';
  status: 'clocked-in' | 'clocked-out' | 'manual-entry' | 'pending-approval';
  totalHours?: number;
  notes?: string;
  isEditable: boolean;
}

interface WorkSession {
  id: string;
  startTime: string;
  type: 'in-person' | 'remote';
  isActive: boolean;
  elapsedTime: number; // in minutes
}

const MyShifts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clock' | 'history' | 'manual'>('clock');
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:30',
      endTime: '12:00',
      type: 'in-person',
      status: 'clocked-out',
      totalHours: 3.5,
      isEditable: true
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      type: 'remote',
      status: 'pending-approval',
      totalHours: 8,
      notes: 'Trabajo desde casa - reuniones de planificación',
      isEditable: false
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      startTime: '07:30',
      endTime: '15:30',
      type: 'in-person',
      status: 'clocked-out',
      totalHours: 8,
      isEditable: true
    }
  ]);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    type: 'in-person' as 'in-person' | 'remote',
    notes: ''
  });

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession?.isActive) {
      interval = setInterval(() => {
        setCurrentSession(prev => prev ? {
          ...prev,
          elapsedTime: prev.elapsedTime + 1
        } : null);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [currentSession?.isActive]);

  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const startShift = (type: 'in-person' | 'remote') => {
    const now = new Date();
    const session: WorkSession = {
      id: Date.now().toString(),
      startTime: now.toTimeString().slice(0, 5),
      type,
      isActive: true,
      elapsedTime: 0
    };
    setCurrentSession(session);
  };

  const endShift = () => {
    if (!currentSession) return;
    
    const now = new Date();
    const endTime = now.toTimeString().slice(0, 5);
    const totalHours = currentSession.elapsedTime / 60;
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: currentSession.startTime,
      endTime,
      type: currentSession.type,
      status: 'clocked-out',
      totalHours,
      isEditable: true
    };

    setTimeEntries(prev => [newEntry, ...prev]);
    setCurrentSession(null);
  };

  const submitManualEntry = () => {
    console.log('Manual entry data:', manualEntry);
    
    // Validate required fields
    if (!manualEntry.startTime || !manualEntry.endTime) {
      console.log('Missing required fields:', { startTime: manualEntry.startTime, endTime: manualEntry.endTime });
      return;
    }

    // Validate time format (should be HH:MM)
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(manualEntry.startTime) || !timePattern.test(manualEntry.endTime)) {
      console.log('Invalid time format:', { startTime: manualEntry.startTime, endTime: manualEntry.endTime });
      alert('Por favor ingresa tiempos válidos en formato HH:MM (ej: 09:00)');
      return;
    }

    try {
      const start = new Date(`1970-01-01T${manualEntry.startTime}:00`);
      const end = new Date(`1970-01-01T${manualEntry.endTime}:00`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log('Invalid date objects created');
        alert('Tiempos inválidos. Por favor verifica el formato.');
        return;
      }

      if (end <= start) {
        alert('La hora de fin debe ser posterior a la hora de inicio.');
        return;
      }

      const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        date: manualEntry.date,
        startTime: manualEntry.startTime,
        endTime: manualEntry.endTime,
        type: manualEntry.type,
        status: 'manual-entry',
        totalHours,
        notes: manualEntry.notes,
        isEditable: false
      };

      console.log('Creating new entry:', newEntry);
      setTimeEntries(prev => [newEntry, ...prev]);
      setManualEntry({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        type: 'in-person',
        notes: ''
      });
      setShowManualEntry(false);
      
      alert('Registro creado exitosamente. Puede requerir aprobación del administrador.');
    } catch (error) {
      console.error('Error creating manual entry:', error);
      alert('Error al crear el registro. Por favor intenta de nuevo.');
    }
  };

  const editTimeEntry = (id: string) => {
    // Implementation for editing time entries
    console.log('Edit time entry:', id);
  };

  const renderClockInterface = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatElapsedTime(currentSession.elapsedTime)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    En turno
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inicio: {currentSession.startTime}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tipo: {currentSession.type === 'remote' ? 'Trabajo Remoto' : 'Presencial'}
                </p>
              </div>
              <button
                onClick={endShift}
                className="btn-danger w-full max-w-xs"
              >
                Finalizar Turno
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    Sin turno
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => startShift('in-person')}
                  className="btn-primary w-full max-w-xs"
                >
                  🏢 Iniciar Turno Presencial
                </button>
                <button
                  onClick={() => startShift('remote')}
                  className="btn-secondary w-full max-w-xs"
                >
                  🏠 Iniciar Trabajo Remoto
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const todayEntries = timeEntries.filter(entry => 
              entry.date === new Date().toISOString().split('T')[0]
            );
            const totalHours = todayEntries.reduce((acc, entry) => acc + (entry.totalHours || 0), 0);
            const currentHours = currentSession ? currentSession.elapsedTime / 60 : 0;
            const grandTotal = totalHours + currentHours;

            return (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {grandTotal.toFixed(1)}h
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Total Hoy
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {todayEntries.length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Registros
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historial de Tiempo</CardTitle>
            <button
              onClick={() => setShowManualEntry(true)}
              className="btn-secondary"
            >
              + Entrada Manual
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.startTime} - {entry.endTime || 'En progreso'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.type === 'remote' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {entry.type === 'remote' ? 'Remoto' : 'Presencial'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'clocked-out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        entry.status === 'manual-entry' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                        entry.status === 'pending-approval' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {entry.status === 'clocked-out' ? 'Registrado' :
                         entry.status === 'manual-entry' ? 'Manual' :
                         entry.status === 'pending-approval' ? 'Pendiente' : 'Activo'}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {entry.totalHours?.toFixed(1)}h
                    </div>
                  </div>
                  {entry.isEditable && (
                    <button
                      onClick={() => editTimeEntry(entry.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderManualEntry = () => (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Tiempo Manualmente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={manualEntry.date}
              onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hora de Inicio
            </label>
            <input
              type="time"
              value={manualEntry.startTime}
              onChange={(e) => setManualEntry(prev => ({ ...prev, startTime: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hora de Fin
            </label>
            <input
              type="time"
              value={manualEntry.endTime}
              onChange={(e) => setManualEntry(prev => ({ ...prev, endTime: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Trabajo
          </label>
          <select
            value={manualEntry.type}
            onChange={(e) => setManualEntry(prev => ({ ...prev, type: e.target.value as 'in-person' | 'remote' }))}
            className="input"
          >
            <option value="in-person">Presencial</option>
            <option value="remote">Remoto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas (Opcional)
          </label>
          <textarea
            value={manualEntry.notes}
            onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Describe el trabajo realizado..."
            className="input"
            rows={3}
          />
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <p>Debug: Start: "{manualEntry.startTime}" | End: "{manualEntry.endTime}"</p>
          <p>Button disabled: {(!manualEntry.startTime || !manualEntry.endTime) ? 'YES' : 'NO'}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              console.log('Button clicked!', manualEntry);
              submitManualEntry();
            }}
            disabled={!manualEntry.startTime || !manualEntry.endTime}
            className={`btn-primary ${(!manualEntry.startTime || !manualEntry.endTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Guardar Registro
          </button>
          <button
            onClick={() => setShowManualEntry(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Los registros manuales pueden requerir aprobación del administrador antes de ser incluidos en tu tiempo total.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Turnos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu tiempo y registra tus horas de trabajo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {([
            { key: 'clock', label: 'Reloj', icon: '⏰' },
            { key: 'history', label: 'Historial', icon: '📋' },
            { key: 'manual', label: 'Entrada Manual', icon: '✏️' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'clock' && renderClockInterface()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'manual' && renderManualEntry()}

      {/* Manual Entry Modal */}
      {showManualEntry && activeTab !== 'manual' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Registrar Tiempo Manualmente
            </h3>
            {renderManualEntry()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShifts;