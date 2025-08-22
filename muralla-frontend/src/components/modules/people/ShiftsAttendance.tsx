import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface Staff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  currentShift?: {
    start: string;
    type: 'in-person' | 'remote';
    status: 'clocked-in' | 'on-break' | 'clocked-out';
  };
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'remote';
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  actualStart?: string;
  actualEnd?: string;
  hoursWorked?: number;
  needsApproval?: boolean;
  isManualEntry?: boolean;
}

interface AdminSettings {
  requireApprovalForManualEntries: boolean;
  requireApprovalForClockTimes: boolean;
  allowRemoteWork: boolean;
  autoBreakAfterHours: number;
}

const ShiftsAttendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'attendance' | 'settings'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  
  const [staff] = useState<Staff[]>([
    {
      id: '1',
      name: 'María González',
      role: 'Barista',
      isActive: true,
      currentShift: {
        start: '08:30',
        type: 'in-person',
        status: 'clocked-in'
      }
    },
    {
      id: '2',
      name: 'Carlos Rodríguez',
      role: 'Manager',
      isActive: true,
      currentShift: {
        start: '07:00',
        type: 'in-person',
        status: 'clocked-in'
      }
    },
    {
      id: '3',
      name: 'Ana Martínez',
      role: 'Admin',
      isActive: true,
      currentShift: {
        start: '09:00',
        type: 'remote',
        status: 'clocked-in'
      }
    },
    {
      id: '4',
      name: 'Luis Torres',
      role: 'Kitchen Staff',
      isActive: false
    }
  ]);

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      staffId: '1',
      staffName: 'María González',
      date: selectedDate,
      startTime: '08:00',
      endTime: '16:00',
      type: 'in-person',
      status: 'in-progress',
      actualStart: '08:30',
      hoursWorked: 3.5
    },
    {
      id: '2',
      staffId: '2',
      staffName: 'Carlos Rodríguez',
      date: selectedDate,
      startTime: '07:00',
      endTime: '15:00',
      type: 'in-person',
      status: 'in-progress',
      actualStart: '07:00',
      hoursWorked: 5
    },
    {
      id: '3',
      staffId: '3',
      staffName: 'Ana Martínez',
      date: selectedDate,
      startTime: '09:00',
      endTime: '17:00',
      type: 'remote',
      status: 'in-progress',
      actualStart: '09:00',
      hoursWorked: 3,
      needsApproval: true,
      isManualEntry: false
    }
  ]);

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    requireApprovalForManualEntries: true,
    requireApprovalForClockTimes: false,
    allowRemoteWork: true,
    autoBreakAfterHours: 6
  });

  const [showCreateShift, setShowCreateShift] = useState(false);

  const activeStaff = staff.filter(s => s.isActive);
  const onShiftNow = activeStaff.filter(s => s.currentShift?.status === 'clocked-in');
  const pendingApprovals = shifts.filter(s => s.needsApproval);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Personal Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {activeStaff.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              En Turno Ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {onShiftNow.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Esperando Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {pendingApprovals.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Horas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {shifts.reduce((acc, shift) => acc + (shift.hoursWorked || 0), 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Personal en Turno Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {onShiftNow.map(person => {
              const shift = shifts.find(s => s.staffId === person.id && s.status === 'in-progress');
              return (
                <div key={person.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{person.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{person.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        person.currentShift?.type === 'remote' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {person.currentShift?.type === 'remote' ? 'Remoto' : 'Presencial'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Desde {person.currentShift?.start}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {shift?.hoursWorked?.toFixed(1)}h trabajadas
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      {/* Schedule Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${mode === 'day' ? 'rounded-l-lg' : mode === 'month' ? 'rounded-r-lg' : ''}`}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowCreateShift(true)}
          className="btn-primary"
        >
          + Planificar Turno
        </button>
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Planificación de Turnos - {viewMode === 'day' ? 'Día' : viewMode === 'week' ? 'Semana' : 'Mes'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Personal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Horario</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Horas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center text-xs">
                          {shift.staffName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{shift.staffName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shift.type === 'remote' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {shift.type === 'remote' ? 'Remoto' : 'Presencial'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        shift.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        shift.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {shift.status === 'completed' ? 'Completado' :
                         shift.status === 'in-progress' ? 'En progreso' :
                         shift.status === 'scheduled' ? 'Programado' : 'Perdido'}
                      </span>
                      {shift.needsApproval && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          Requiere aprobación
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {shift.hoursWorked ? `${shift.hoursWorked.toFixed(1)}h` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Editar
                        </button>
                        {shift.needsApproval && (
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Aprobar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Turnos y Asistencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Requerir aprobación para entradas manuales</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Los empleados necesitarán aprobación para horas ingresadas manualmente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adminSettings.requireApprovalForManualEntries}
                onChange={(e) => setAdminSettings(prev => ({
                  ...prev,
                  requireApprovalForManualEntries: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Requerir aprobación para tiempos marcados</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Los empleados necesitarán aprobación para horas registradas con reloj</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adminSettings.requireApprovalForClockTimes}
                onChange={(e) => setAdminSettings(prev => ({
                  ...prev,
                  requireApprovalForClockTimes: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Permitir trabajo remoto</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Los empleados pueden marcar entrada para trabajo remoto</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adminSettings.allowRemoteWork}
                onChange={(e) => setAdminSettings(prev => ({
                  ...prev,
                  allowRemoteWork: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Descanso automático después de</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sugerir descanso automáticamente después de trabajar X horas</p>
            </div>
            <select
              value={adminSettings.autoBreakAfterHours}
              onChange={(e) => setAdminSettings(prev => ({
                ...prev,
                autoBreakAfterHours: parseInt(e.target.value)
              }))}
              className="input w-20"
            >
              <option value={4}>4h</option>
              <option value={5}>5h</option>
              <option value={6}>6h</option>
              <option value={8}>8h</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-6">
          <button className="btn-primary">
            Guardar Configuración
          </button>
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
            Turnos y Asistencia
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organiza turnos, marca asistencia y gestiona el tiempo del equipo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {([
            { key: 'overview', label: 'Resumen' },
            { key: 'schedule', label: 'Planificación' },
            { key: 'attendance', label: 'Asistencia' },
            { key: 'settings', label: 'Configuración' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

export default ShiftsAttendance;