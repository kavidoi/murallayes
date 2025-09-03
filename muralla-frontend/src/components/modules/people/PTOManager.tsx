import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Plus, Filter, CheckCircle, XCircle, AlertTriangle, Eye, Edit3, MessageSquare, Download } from 'lucide-react';

interface PTORequest {
  id: string;
  employeeId: string;
  employee: {
    name: string;
    avatar: string;
    position: string;
    department: string;
  };
  type: 'vacation' | 'sick' | 'personal' | 'emergency' | 'parental' | 'bereavement' | 'jury' | 'military';
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  startDate: string;
  endDate: string;
  totalDays: number;
  workingDays: number;
  reason: string;
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name: string;
    avatar: string;
  };
  denialReason?: string;
  coverage: Array<{
    employeeId: string;
    name: string;
    avatar: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  priority: 'low' | 'medium' | 'high';
  recurring: boolean;
  balance: {
    available: number;
    used: number;
    pending: number;
  };
}

interface Employee {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: string;
  balance: {
    vacation: { available: number; used: number; pending: number; };
    sick: { available: number; used: number; pending: number; };
    personal: { available: number; used: number; pending: number; };
  };
  manager: {
    id: string;
    name: string;
  };
}

const PTOManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'balances'>('requests');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedRequest, setSelectedRequest] = useState<PTORequest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data
  const departments = [
    'all', 'engineering', 'marketing', 'sales', 'hr', 'finance', 'operations'
  ];

  const ptoRequests: PTORequest[] = [
    {
      id: '1',
      employeeId: 'emp1',
      employee: {
        name: 'Ana García',
        avatar: '/api/placeholder/32/32',
        position: 'Senior Developer',
        department: 'engineering'
      },
      type: 'vacation',
      status: 'pending',
      startDate: '2024-02-15',
      endDate: '2024-02-23',
      totalDays: 9,
      workingDays: 7,
      reason: 'Vacaciones familiares planificadas',
      notes: 'Viaje familiar a Europa. Cobertura coordinada con equipo.',
      submittedAt: '2024-01-20T10:30:00Z',
      coverage: [
        { employeeId: 'emp2', name: 'Carlos López', avatar: '/api/placeholder/32/32' },
        { employeeId: 'emp3', name: 'María Silva', avatar: '/api/placeholder/32/32' }
      ],
      attachments: [],
      priority: 'medium',
      recurring: false,
      balance: {
        available: 20,
        used: 5,
        pending: 7
      }
    },
    {
      id: '2',
      employeeId: 'emp2',
      employee: {
        name: 'Carlos López',
        avatar: '/api/placeholder/32/32',
        position: 'Project Manager',
        department: 'engineering'
      },
      type: 'sick',
      status: 'approved',
      startDate: '2024-01-18',
      endDate: '2024-01-19',
      totalDays: 2,
      workingDays: 2,
      reason: 'Gripe e influenza',
      submittedAt: '2024-01-18T08:00:00Z',
      reviewedAt: '2024-01-18T09:30:00Z',
      reviewedBy: {
        id: 'mgr1',
        name: 'Director Técnico',
        avatar: '/api/placeholder/32/32'
      },
      coverage: [],
      attachments: [
        {
          id: 'att1',
          name: 'certificado_medico.pdf',
          type: 'application/pdf',
          url: '/attachments/cert1.pdf'
        }
      ],
      priority: 'high',
      recurring: false,
      balance: {
        available: 10,
        used: 2,
        pending: 0
      }
    },
    {
      id: '3',
      employeeId: 'emp3',
      employee: {
        name: 'María Silva',
        avatar: '/api/placeholder/32/32',
        position: 'UX Designer',
        department: 'marketing'
      },
      type: 'personal',
      status: 'denied',
      startDate: '2024-02-01',
      endDate: '2024-02-02',
      totalDays: 2,
      workingDays: 2,
      reason: 'Asuntos personales urgentes',
      submittedAt: '2024-01-25T14:20:00Z',
      reviewedAt: '2024-01-26T11:00:00Z',
      reviewedBy: {
        id: 'mgr2',
        name: 'Manager Marketing',
        avatar: '/api/placeholder/32/32'
      },
      denialReason: 'Conflicto con lanzamiento de campaña importante. Solicitar fechas alternativas.',
      coverage: [],
      attachments: [],
      priority: 'medium',
      recurring: false,
      balance: {
        available: 15,
        used: 3,
        pending: 0
      }
    },
    {
      id: '4',
      employeeId: 'emp4',
      employee: {
        name: 'Diego Ruiz',
        avatar: '/api/placeholder/32/32',
        position: 'Sales Executive',
        department: 'sales'
      },
      type: 'parental',
      status: 'approved',
      startDate: '2024-03-01',
      endDate: '2024-05-30',
      totalDays: 90,
      workingDays: 65,
      reason: 'Licencia de paternidad',
      notes: 'Nacimiento de segundo hijo. Licencia completa por ley.',
      submittedAt: '2024-01-10T16:45:00Z',
      reviewedAt: '2024-01-11T10:00:00Z',
      reviewedBy: {
        id: 'mgr3',
        name: 'Director Ventas',
        avatar: '/api/placeholder/32/32'
      },
      coverage: [
        { employeeId: 'emp5', name: 'Roberto Kim', avatar: '/api/placeholder/32/32' },
        { employeeId: 'emp6', name: 'Sofía Chen', avatar: '/api/placeholder/32/32' }
      ],
      attachments: [
        {
          id: 'att2',
          name: 'certificado_nacimiento.pdf',
          type: 'application/pdf',
          url: '/attachments/birth_cert.pdf'
        }
      ],
      priority: 'high',
      recurring: false,
      balance: {
        available: 25,
        used: 0,
        pending: 65
      }
    },
    {
      id: '5',
      employeeId: 'emp5',
      employee: {
        name: 'Roberto Kim',
        avatar: '/api/placeholder/32/32',
        position: 'HR Specialist',
        department: 'hr'
      },
      type: 'vacation',
      status: 'pending',
      startDate: '2024-04-15',
      endDate: '2024-04-26',
      totalDays: 12,
      workingDays: 9,
      reason: 'Vacaciones de Semana Santa extendidas',
      submittedAt: '2024-01-22T11:15:00Z',
      coverage: [
        { employeeId: 'emp7', name: 'Emma Thompson', avatar: '/api/placeholder/32/32' }
      ],
      attachments: [],
      priority: 'low',
      recurring: false,
      balance: {
        available: 22,
        used: 8,
        pending: 9
      }
    }
  ];

  const employees: Employee[] = [
    {
      id: 'emp1',
      name: 'Ana García',
      avatar: '/api/placeholder/32/32',
      position: 'Senior Developer',
      department: 'engineering',
      balance: {
        vacation: { available: 20, used: 5, pending: 7 },
        sick: { available: 10, used: 1, pending: 0 },
        personal: { available: 5, used: 2, pending: 0 }
      },
      manager: { id: 'mgr1', name: 'Tech Director' }
    },
    {
      id: 'emp2',
      name: 'Carlos López',
      avatar: '/api/placeholder/32/32',
      position: 'Project Manager',
      department: 'engineering',
      balance: {
        vacation: { available: 22, used: 8, pending: 0 },
        sick: { available: 10, used: 2, pending: 0 },
        personal: { available: 5, used: 1, pending: 0 }
      },
      manager: { id: 'mgr1', name: 'Tech Director' }
    },
    {
      id: 'emp3',
      name: 'María Silva',
      avatar: '/api/placeholder/32/32',
      position: 'UX Designer',
      department: 'marketing',
      balance: {
        vacation: { available: 20, used: 6, pending: 0 },
        sick: { available: 10, used: 0, pending: 0 },
        personal: { available: 5, used: 3, pending: 0 }
      },
      manager: { id: 'mgr2', name: 'Marketing Manager' }
    }
  ];

  const filteredRequests = useMemo(() => {
    return ptoRequests.filter(request => {
      const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
      const matchesType = selectedType === 'all' || request.type === selectedType;
      const matchesDepartment = selectedDepartment === 'all' || request.employee.department === selectedDepartment;
      return matchesStatus && matchesType && matchesDepartment;
    });
  }, [ptoRequests, selectedStatus, selectedType, selectedDepartment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'pending': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'denied': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'cancelled': return 'bg-gray-300/20 text-gray-500 border-gray-300/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-electric-blue/20 text-electric-blue';
      case 'sick': return 'bg-electric-red/20 text-electric-red';
      case 'personal': return 'bg-electric-purple/20 text-electric-purple';
      case 'emergency': return 'bg-electric-orange/20 text-electric-orange';
      case 'parental': return 'bg-electric-green/20 text-electric-green';
      case 'bereavement': return 'bg-gray-400/20 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-electric-red/20 text-electric-red';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      vacation: 'Vacaciones',
      sick: 'Enfermedad',
      personal: 'Personal',
      emergency: 'Emergencia',
      parental: 'Parental',
      bereavement: 'Duelo',
      jury: 'Jurado',
      military: 'Militar'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleApproveRequest = (requestId: string) => {
    console.log('Approving request:', requestId);
    // Implementation would update request status
  };

  const handleDenyRequest = (requestId: string, reason: string) => {
    console.log('Denying request:', requestId, 'Reason:', reason);
    // Implementation would update request status and add denial reason
  };

  const stats = useMemo(() => {
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length;
    const totalDaysRequested = filteredRequests.reduce((sum, r) => sum + r.workingDays, 0);
    const urgentRequests = filteredRequests.filter(r => r.priority === 'high' && r.status === 'pending').length;

    return {
      pendingRequests,
      approvedRequests,
      totalDaysRequested,
      urgentRequests
    };
  }, [filteredRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de PTO y Vacaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema integral de gestión de tiempo libre y ausencias
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </button>

          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['requests', 'calendar', 'balances'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-electric-blue text-electric-blue'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab === 'requests' && '📋 Solicitudes'}
              {tab === 'calendar' && '📅 Calendario'}
              {tab === 'balances' && '⚖️ Balances'}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-electric-yellow">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-8 h-8 text-electric-yellow" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.urgentRequests} urgentes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Aprobadas</p>
              <p className="text-2xl font-bold text-electric-green">{stats.approvedRequests}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Este mes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Días Solicitados</p>
              <p className="text-2xl font-bold text-electric-blue">{stats.totalDaysRequested}</p>
            </div>
            <Calendar className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total en período
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Empleados Activos</p>
              <p className="text-2xl font-bold text-electric-purple">
                {employees.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Con balance asignado
          </p>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobada</option>
                <option value="denied">Denegada</option>
                <option value="cancelled">Cancelada</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Todos los Tipos</option>
                <option value="vacation">Vacaciones</option>
                <option value="sick">Enfermedad</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergencia</option>
                <option value="parental">Parental</option>
                <option value="bereavement">Duelo</option>
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Todos los Departamentos</option>
                {departments.filter(d => d !== 'all').map(dept => (
                  <option key={dept} value={dept} className="capitalize">
                    {dept.replace('-', ' ')}
                  </option>
                ))}
              </select>

              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-end">
                {filteredRequests.length} solicitudes
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Días
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredRequests.map(request => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={request.employee.avatar}
                            alt={request.employee.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.employee.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {request.employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(request.type)}`}>
                          {getTypeLabel(request.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {request.workingDays} laborables
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ({request.totalDays} totales)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-electric-blue hover:text-electric-blue/80"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-electric-green hover:text-electric-green/80"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDenyRequest(request.id, 'Reason required')}
                                className="text-electric-red hover:text-electric-red/80"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button className="text-gray-400 hover:text-electric-blue">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Vista de calendario en desarrollo</p>
            <p className="text-sm mt-2">Próximamente: calendario interactivo con vista de ausencias del equipo</p>
          </div>
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(employee => (
              <div
                key={employee.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {employee.position}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {employee.department}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(employee.balance).map(([type, balance]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {getTypeLabel(type)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {balance.used + balance.pending}/{balance.available}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="relative h-2 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-electric-blue rounded-full"
                            style={{ width: `${(balance.used / balance.available) * 100}%` }}
                          ></div>
                          <div
                            className="absolute left-0 top-0 h-full bg-electric-yellow/50 rounded-full"
                            style={{ 
                              left: `${(balance.used / balance.available) * 100}%`,
                              width: `${(balance.pending / balance.available) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Usado: {balance.used}</span>
                        <span>Pendiente: {balance.pending}</span>
                        <span>Disponible: {balance.available - balance.used - balance.pending}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedRequest.employee.avatar}
                    alt={selectedRequest.employee.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Solicitud de {getTypeLabel(selectedRequest.type)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedRequest.employee.name} • {selectedRequest.employee.position}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Detalles de la Solicitud
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(selectedRequest.type)}`}>
                          {getTypeLabel(selectedRequest.type)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(selectedRequest.priority)}`}>
                          {selectedRequest.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Fecha inicio:</span>
                          <p className="font-medium">{formatDate(selectedRequest.startDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Fecha fin:</span>
                          <p className="font-medium">{formatDate(selectedRequest.endDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Días laborables:</span>
                          <p className="font-medium">{selectedRequest.workingDays}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Total días:</span>
                          <p className="font-medium">{selectedRequest.totalDays}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Motivo
                    </h4>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {selectedRequest.reason}
                    </p>
                  </div>

                  {selectedRequest.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Notas Adicionales
                      </h4>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  )}

                  {selectedRequest.denialReason && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Motivo de Denegación
                      </h4>
                      <p className="text-electric-red bg-electric-red/10 p-3 rounded">
                        {selectedRequest.denialReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-electric-blue rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Solicitud enviada</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(selectedRequest.submittedAt)}
                          </p>
                        </div>
                      </div>
                      {selectedRequest.reviewedAt && (
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedRequest.status === 'approved' ? 'bg-electric-green' : 'bg-electric-red'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium">
                              {selectedRequest.status === 'approved' ? 'Aprobada' : 'Denegada'} por {selectedRequest.reviewedBy?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(selectedRequest.reviewedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.coverage.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Cobertura Asignada
                      </h4>
                      <div className="space-y-2">
                        {selectedRequest.coverage.map(person => (
                          <div key={person.employeeId} className="flex items-center gap-3">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm">{person.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Documentos Adjuntos
                      </h4>
                      <div className="space-y-2">
                        {selectedRequest.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-600 rounded">
                            <span className="text-sm">📄</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{attachment.type}</p>
                            </div>
                            <button className="text-electric-blue hover:text-electric-blue/80">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Balance Actual
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Disponible:</span>
                        <span className="font-medium">{selectedRequest.balance.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usado:</span>
                        <span className="font-medium">{selectedRequest.balance.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendiente:</span>
                        <span className="font-medium">{selectedRequest.balance.pending}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                        <span>Restante:</span>
                        <span className="font-medium text-electric-blue">
                          {selectedRequest.balance.available - selectedRequest.balance.used - selectedRequest.balance.pending}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons for pending requests */}
              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleDenyRequest(selectedRequest.id, 'Reason required')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Denegar
                  </button>
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="px-4 py-2 bg-electric-green text-white rounded-lg hover:bg-electric-green/90 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PTOManager;