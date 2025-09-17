import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, UserPlus, Calendar, DollarSign, Clock, Award, AlertTriangle, TrendingUp, Eye, Edit3, MoreVertical, MapPin, Phone, Mail } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar: string;
  position: string;
  department: string;
  team?: string;
  manager?: {
    id: string;
    name: string;
    avatar: string;
  };
  directReports: number;
  employeeType: 'full-time' | 'part-time' | 'contractor' | 'intern';
  status: 'active' | 'on-leave' | 'terminated' | 'pending';
  startDate: string;
  endDate?: string;
  location: string;
  workModel: 'remote' | 'hybrid' | 'on-site';
  salary: {
    base: number;
    currency: string;
    frequency: 'hourly' | 'monthly' | 'yearly';
  };
  benefits: string[];
  skills: Array<{
    name: string;
    level: 1 | 2 | 3 | 4 | 5;
    verified: boolean;
  }>;
  performance: {
    lastReview: string;
    score: number; // 1-5
    goals: number;
    completedGoals: number;
    nextReview: string;
  };
  timeOff: {
    available: number;
    used: number;
    pending: number;
  };
  compliance: {
    onboarding: boolean;
    backgroundCheck: boolean;
    documents: boolean;
    training: number; // percentage
  };
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const PeopleHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'org-chart'>('cards');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data
  const departments = [
    { id: 'all', name: 'Todos los Departamentos', count: 0 },
    { id: 'engineering', name: 'Ingeniería', count: 12 },
    { id: 'marketing', name: 'Marketing', count: 8 },
    { id: 'sales', name: 'Ventas', count: 6 },
    { id: 'hr', name: 'Recursos Humanos', count: 4 },
    { id: 'finance', name: 'Finanzas', count: 5 },
    { id: 'operations', name: 'Operaciones', count: 7 },
  ];

  const employees: Employee[] = [
    {
      id: '1',
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana.garcia@company.com',
      phone: '+56 9 1234 5678',
      avatar: '/api/placeholder/64/64',
      position: 'CEO & Founder',
      department: 'executive',
      team: 'Leadership',
      directReports: 6,
      employeeType: 'full-time',
      status: 'active',
      startDate: '2020-01-15',
      location: 'Santiago, Chile',
      workModel: 'hybrid',
      salary: {
        base: 200000,
        currency: 'USD',
        frequency: 'yearly'
      },
      benefits: ['Health Insurance', 'Stock Options', 'Flexible PTO', 'Learning Budget'],
      skills: [
        { name: 'Leadership', level: 5, verified: true },
        { name: 'Strategic Planning', level: 5, verified: true },
        { name: 'Business Development', level: 4, verified: true }
      ],
      performance: {
        lastReview: '2024-01-15',
        score: 4.8,
        goals: 5,
        completedGoals: 4,
        nextReview: '2024-07-15'
      },
      timeOff: {
        available: 25,
        used: 8,
        pending: 3
      },
      compliance: {
        onboarding: true,
        backgroundCheck: true,
        documents: true,
        training: 95
      },
      notes: 'Exceptional leadership and vision. Driving company growth successfully.',
      tags: ['founder', 'executive', 'key-person'],
      createdAt: '2020-01-15T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@company.com',
      phone: '+56 9 8765 4321',
      avatar: '/api/placeholder/64/64',
      position: 'CTO',
      department: 'engineering',
      team: 'Leadership',
      manager: { id: '1', name: 'Ana García', avatar: '/api/placeholder/32/32' },
      directReports: 8,
      employeeType: 'full-time',
      status: 'active',
      startDate: '2020-03-01',
      location: 'Santiago, Chile',
      workModel: 'hybrid',
      salary: {
        base: 180000,
        currency: 'USD',
        frequency: 'yearly'
      },
      benefits: ['Health Insurance', 'Stock Options', 'Flexible PTO', 'Tech Budget'],
      skills: [
        { name: 'Software Architecture', level: 5, verified: true },
        { name: 'Team Leadership', level: 4, verified: true },
        { name: 'React', level: 5, verified: true },
        { name: 'Node.js', level: 4, verified: true }
      ],
      performance: {
        lastReview: '2024-01-10',
        score: 4.6,
        goals: 6,
        completedGoals: 5,
        nextReview: '2024-07-10'
      },
      timeOff: {
        available: 25,
        used: 12,
        pending: 0
      },
      compliance: {
        onboarding: true,
        backgroundCheck: true,
        documents: true,
        training: 88
      },
      notes: 'Strong technical leader. Excellent at scaling engineering teams.',
      tags: ['cto', 'technical-leader', 'key-person'],
      createdAt: '2020-03-01T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z'
    },
    {
      id: '3',
      firstName: 'María',
      lastName: 'Silva',
      email: 'maria.silva@company.com',
      phone: '+56 9 5555 1234',
      avatar: '/api/placeholder/64/64',
      position: 'Senior Frontend Developer',
      department: 'engineering',
      team: 'Web Platform',
      manager: { id: '2', name: 'Carlos López', avatar: '/api/placeholder/32/32' },
      directReports: 2,
      employeeType: 'full-time',
      status: 'active',
      startDate: '2021-05-15',
      location: 'Valparaíso, Chile',
      workModel: 'remote',
      salary: {
        base: 4500000,
        currency: 'CLP',
        frequency: 'monthly'
      },
      benefits: ['Health Insurance', 'Flexible PTO', 'Learning Budget', 'Home Office Setup'],
      skills: [
        { name: 'React', level: 5, verified: true },
        { name: 'TypeScript', level: 4, verified: true },
        { name: 'UI/UX Design', level: 3, verified: false },
        { name: 'Testing', level: 4, verified: true }
      ],
      performance: {
        lastReview: '2024-01-20',
        score: 4.4,
        goals: 4,
        completedGoals: 3,
        nextReview: '2024-07-20'
      },
      timeOff: {
        available: 20,
        used: 5,
        pending: 5
      },
      compliance: {
        onboarding: true,
        backgroundCheck: true,
        documents: true,
        training: 92
      },
      notes: 'Excellent technical skills and mentoring abilities. High potential for promotion.',
      tags: ['senior', 'mentor', 'high-performer'],
      createdAt: '2021-05-15T10:00:00Z',
      updatedAt: '2024-01-21T11:20:00Z'
    },
    {
      id: '4',
      firstName: 'Diego',
      lastName: 'Ruiz',
      email: 'diego.ruiz@company.com',
      avatar: '/api/placeholder/64/64',
      position: 'UX/UI Designer',
      department: 'marketing',
      team: 'Brand & Design',
      manager: { id: '5', name: 'Roberto Kim', avatar: '/api/placeholder/32/32' },
      directReports: 0,
      employeeType: 'full-time',
      status: 'active',
      startDate: '2022-09-01',
      location: 'Santiago, Chile',
      workModel: 'on-site',
      salary: {
        base: 3800000,
        currency: 'CLP',
        frequency: 'monthly'
      },
      benefits: ['Health Insurance', 'Flexible PTO', 'Creative Software License'],
      skills: [
        { name: 'Figma', level: 5, verified: true },
        { name: 'User Research', level: 3, verified: false },
        { name: 'Prototyping', level: 4, verified: true },
        { name: 'Design Systems', level: 4, verified: true }
      ],
      performance: {
        lastReview: '2023-12-01',
        score: 4.2,
        goals: 3,
        completedGoals: 3,
        nextReview: '2024-06-01'
      },
      timeOff: {
        available: 20,
        used: 8,
        pending: 0
      },
      compliance: {
        onboarding: true,
        backgroundCheck: true,
        documents: true,
        training: 78
      },
      notes: 'Creative and detail-oriented. Strong collaboration with engineering team.',
      tags: ['designer', 'creative', 'collaborative'],
      createdAt: '2022-09-01T09:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z'
    },
    {
      id: '5',
      firstName: 'Roberto',
      lastName: 'Kim',
      email: 'roberto.kim@company.com',
      avatar: '/api/placeholder/64/64',
      position: 'Marketing Director',
      department: 'marketing',
      team: 'Marketing',
      manager: { id: '1', name: 'Ana García', avatar: '/api/placeholder/32/32' },
      directReports: 4,
      employeeType: 'full-time',
      status: 'active',
      startDate: '2021-01-10',
      location: 'Santiago, Chile',
      workModel: 'hybrid',
      salary: {
        base: 120000,
        currency: 'USD',
        frequency: 'yearly'
      },
      benefits: ['Health Insurance', 'Stock Options', 'Flexible PTO', 'Marketing Budget'],
      skills: [
        { name: 'Digital Marketing', level: 5, verified: true },
        { name: 'Growth Hacking', level: 4, verified: true },
        { name: 'Analytics', level: 4, verified: true },
        { name: 'Team Management', level: 3, verified: false }
      ],
      performance: {
        lastReview: '2024-01-05',
        score: 4.3,
        goals: 5,
        completedGoals: 4,
        nextReview: '2024-07-05'
      },
      timeOff: {
        available: 22,
        used: 6,
        pending: 2
      },
      compliance: {
        onboarding: true,
        backgroundCheck: true,
        documents: true,
        training: 85
      },
      notes: 'Results-driven marketing leader. Successfully scaled user acquisition.',
      tags: ['director', 'growth-focused', 'data-driven'],
      createdAt: '2021-01-10T08:30:00Z',
      updatedAt: '2024-01-16T15:20:00Z'
    }
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
      const matchesEmployeeType = selectedEmployeeType === 'all' || employee.employeeType === selectedEmployeeType;

      return matchesSearch && matchesDepartment && matchesStatus && matchesEmployeeType;
    });
  }, [employees, searchTerm, selectedDepartment, selectedStatus, selectedEmployeeType]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'on-leave': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'terminated': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'pending': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getEmployeeTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-electric-blue/20 text-electric-blue';
      case 'part-time': return 'bg-electric-purple/20 text-electric-purple';
      case 'contractor': return 'bg-electric-orange/20 text-electric-orange';
      case 'intern': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatSalary = (salary: Employee['salary']) => {
    const formatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `${formatter.format(salary.base)}/${salary.frequency === 'yearly' ? 'año' : salary.frequency === 'monthly' ? 'mes' : 'hora'}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateTenure = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months > 0 ? `, ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  const renderEmployeeCard = (employee: Employee) => (
    <div
      key={employee.id}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => setSelectedEmployee(employee)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={employee.avatar}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {employee.position}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {employee.department} • {employee.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(employee.status)}`}>
            {employee.status}
          </span>
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
          <span className={`px-2 py-1 text-xs rounded ${getEmployeeTypeColor(employee.employeeType)}`}>
            {employee.employeeType}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Antigüedad:</span>
          <span className="text-gray-900 dark:text-white">
            {calculateTenure(employee.startDate)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Reportes Directos:</span>
          <span className="text-gray-900 dark:text-white">
            {employee.directReports}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Performance:</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-900 dark:text-white font-medium">
              {employee.performance.score}/5
            </span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-xs ${
                  i < employee.performance.score ? 'text-electric-yellow' : 'text-gray-300 dark:text-gray-600'
                }`}>
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Vacaciones:</span>
          <span className="text-gray-900 dark:text-white">
            {employee.timeOff.used}/{employee.timeOff.available} días
          </span>
        </div>

        {employee.skills.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
              Habilidades principales:
            </span>
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map(skill => (
                <span
                  key={skill.name}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {skill.name} ({skill.level}/5)
                </span>
              ))}
              {employee.skills.length > 3 && (
                <span className="text-xs text-gray-400">+{employee.skills.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Mail className="w-3 h-3" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span>{employee.workModel}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const stats = useMemo(() => {
    const activeEmployees = filteredEmployees.filter(e => e.status === 'active').length;
    const avgPerformance = filteredEmployees.reduce((sum, e) => sum + e.performance.score, 0) / Math.max(filteredEmployees.length, 1);
    const totalSalary = filteredEmployees.reduce((sum, e) => {
      // Convert everything to USD for comparison (simplified)
      const salary = e.salary.currency === 'USD' ? e.salary.base : e.salary.base / 800; // rough conversion
      return sum + (e.salary.frequency === 'yearly' ? salary : e.salary.frequency === 'monthly' ? salary * 12 : salary * 2000);
    }, 0);
    const upcomingReviews = filteredEmployees.filter(e => {
      const reviewDate = new Date(e.performance.nextReview);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      return reviewDate <= oneMonthFromNow;
    }).length;

    return {
      activeEmployees,
      avgPerformance: Math.round(avgPerformance * 10) / 10,
      totalSalary,
      upcomingReviews
    };
  }, [filteredEmployees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Personal
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Centro de operaciones para la administración de talento humano
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <button className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Nuevo Empleado
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['cards', 'table', 'org-chart'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'cards' && 'Tarjetas'}
                {mode === 'table' && 'Tabla'}
                {mode === 'org-chart' && 'Organigrama'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Empleados Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeEmployees}</p>
            </div>
            <Users className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            de {filteredEmployees.length} totales
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Performance Promedio</p>
              <p className="text-2xl font-bold text-electric-green">{stats.avgPerformance}/5</p>
            </div>
            <Award className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Última evaluación
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Masa Salarial Anual</p>
              <p className="text-2xl font-bold text-electric-purple">
                ${Math.round(stats.totalSalary / 1000)}k
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            USD estimado
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Reviews Próximos</p>
              <p className="text-2xl font-bold text-electric-orange">{stats.upcomingReviews}</p>
            </div>
            <Calendar className="w-8 h-8 text-electric-orange" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            En los próximos 30 días
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, posición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
            {filteredEmployees.length} de {employees.length} empleados
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.count > 0 && `(${dept.count})`}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="on-leave">En Licencia</option>
              <option value="terminated">Terminado</option>
              <option value="pending">Pendiente</option>
            </select>

            <select
              value={selectedEmployeeType}
              onChange={(e) => setSelectedEmployeeType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Tipos</option>
              <option value="full-time">Tiempo Completo</option>
              <option value="part-time">Tiempo Parcial</option>
              <option value="contractor">Contratista</option>
              <option value="intern">Interno</option>
            </select>
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'cards' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => renderEmployeeCard(employee))}
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Salario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredEmployees.map(employee => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={employee.avatar}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.performance.score}/5
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${
                              i < employee.performance.score ? 'text-electric-yellow' : 'text-gray-300 dark:text-gray-600'
                            }`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatSalary(employee.salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="text-electric-blue hover:text-electric-blue/80"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-blue">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-red">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'org-chart' && (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Vista de organigrama en desarrollo</p>
              <p className="text-sm mt-2">Próximamente: visualización jerárquica interactiva</p>
            </div>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedEmployee.avatar}
                    alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedEmployee.position}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedEmployee.status)}`}>
                        {selectedEmployee.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getEmployeeTypeColor(selectedEmployee.employeeType)}`}>
                        {selectedEmployee.employeeType}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Información de Contacto
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{selectedEmployee.email}</span>
                      </div>
                      {selectedEmployee.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{selectedEmployee.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {selectedEmployee.location} • {selectedEmployee.workModel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Habilidades y Competencias
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedEmployee.skills.map(skill => (
                        <div key={skill.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                            {skill.verified && (
                              <span className="text-electric-green text-xs">✓</span>
                            )}
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${
                                i < skill.level ? 'text-electric-blue' : 'text-gray-300 dark:text-gray-600'
                              }`}>
                                ●
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Performance y Objetivos
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Última evaluación:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedEmployee.performance.score}/5</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${
                                i < selectedEmployee.performance.score ? 'text-electric-yellow' : 'text-gray-300 dark:text-gray-600'
                              }`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Objetivos completados:</span>
                        <span className="font-medium">
                          {selectedEmployee.performance.completedGoals}/{selectedEmployee.performance.goals}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Próxima evaluación:</span>
                        <span className="font-medium">{formatDate(selectedEmployee.performance.nextReview)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Notas
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {selectedEmployee.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Información Laboral
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Departamento:</span>
                        <span className="font-medium">{selectedEmployee.department}</span>
                      </div>
                      {selectedEmployee.team && (
                        <div className="flex justify-between">
                          <span>Equipo:</span>
                          <span className="font-medium">{selectedEmployee.team}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Fecha de ingreso:</span>
                        <span className="font-medium">{formatDate(selectedEmployee.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Antigüedad:</span>
                        <span className="font-medium">{calculateTenure(selectedEmployee.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reportes directos:</span>
                        <span className="font-medium">{selectedEmployee.directReports}</span>
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.manager && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Supervisor
                      </h4>
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedEmployee.manager.avatar}
                          alt={selectedEmployee.manager.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.manager.name}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Compensación
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Salario base:</span>
                        <span className="font-medium">{formatSalary(selectedEmployee.salary)}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Beneficios:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedEmployee.benefits.map(benefit => (
                            <span
                              key={benefit}
                              className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Tiempo Libre
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Disponible:</span>
                        <span className="font-medium">{selectedEmployee.timeOff.available} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usado:</span>
                        <span className="font-medium">{selectedEmployee.timeOff.used} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendiente:</span>
                        <span className="font-medium">{selectedEmployee.timeOff.pending} días</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className="bg-electric-blue h-2 rounded-full transition-all"
                          style={{ width: `${(selectedEmployee.timeOff.used / selectedEmployee.timeOff.available) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Cumplimiento
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Onboarding:</span>
                        <span className={selectedEmployee.compliance.onboarding ? 'text-electric-green' : 'text-electric-red'}>
                          {selectedEmployee.compliance.onboarding ? '✓ Completo' : '✗ Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Antecedentes:</span>
                        <span className={selectedEmployee.compliance.backgroundCheck ? 'text-electric-green' : 'text-electric-red'}>
                          {selectedEmployee.compliance.backgroundCheck ? '✓ Completo' : '✗ Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Documentos:</span>
                        <span className={selectedEmployee.compliance.documents ? 'text-electric-green' : 'text-electric-red'}>
                          {selectedEmployee.compliance.documents ? '✓ Completo' : '✗ Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Entrenamiento:</span>
                        <span className="font-medium">{selectedEmployee.compliance.training}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-electric-green h-2 rounded-full transition-all"
                          style={{ width: `${selectedEmployee.compliance.training}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmployee.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleHub;