import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Plus, Filter, MapPin, Video, Phone, ChevronLeft, ChevronRight, Settings, Bell, Eye, Edit3, Trash2, Copy, Share } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'task' | 'reminder' | 'block' | 'personal' | 'holiday';
  status: 'confirmed' | 'tentative' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime: string;
  allDay: boolean;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    exceptions?: string[];
  };
  location?: {
    type: 'in-person' | 'online' | 'hybrid';
    address?: string;
    room?: string;
    onlineLink?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
    role: 'organizer' | 'required' | 'optional';
  }>;
  resources: Array<{
    id: string;
    name: string;
    type: 'room' | 'equipment' | 'vehicle' | 'other';
    capacity?: number;
    location?: string;
    available: boolean;
  }>;
  organizer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  reminders: Array<{
    id: string;
    type: 'email' | 'notification' | 'sms';
    time: number; // minutes before event
    sent: boolean;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  tags: string[];
  color: string;
  isPrivate: boolean;
  allowGuests: boolean;
  maxAttendees?: number;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'vehicle' | 'other';
  capacity?: number;
  location: string;
  description?: string;
  features: string[];
  bookingRules: {
    maxDuration: number; // hours
    advanceBooking: number; // days
    requiresApproval: boolean;
    allowedUsers: string[];
  };
  availability: {
    monday: { start: string; end: string; };
    tuesday: { start: string; end: string; };
    wednesday: { start: string; end: string; };
    thursday: { start: string; end: string; };
    friday: { start: string; end: string; };
    saturday?: { start: string; end: string; };
    sunday?: { start: string; end: string; };
  };
  image?: string;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  active: boolean;
}

const CalendarHub: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showResourceManager, setShowResourceManager] = useState(false);

  // Mock data
  const eventTypes = [
    { id: 'meeting', name: 'Reuniones', color: 'electric-blue' },
    { id: 'task', name: 'Tareas', color: 'electric-green' },
    { id: 'reminder', name: 'Recordatorios', color: 'electric-yellow' },
    { id: 'block', name: 'Tiempo Bloqueado', color: 'electric-red' },
    { id: 'personal', name: 'Personal', color: 'electric-purple' },
    { id: 'holiday', name: 'Feriados', color: 'electric-orange' }
  ];

  const resources: Resource[] = [
    {
      id: 'room-001',
      name: 'Sala de Juntas Principal',
      type: 'room',
      capacity: 12,
      location: 'Piso 3, Oficina Central',
      description: 'Sala principal para reuniones ejecutivas con vista panorámica',
      features: ['Proyector 4K', 'Sistema de Audio', 'Pizarra Digital', 'Video Conferencia', 'Wi-Fi', 'Aire Acondicionado'],
      bookingRules: {
        maxDuration: 4,
        advanceBooking: 30,
        requiresApproval: true,
        allowedUsers: ['executives', 'managers']
      },
      availability: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '17:00' }
      },
      image: '/api/placeholder/300/200',
      manager: {
        id: 'mgr1',
        name: 'Ana García',
        email: 'ana.garcia@company.com'
      },
      active: true
    },
    {
      id: 'room-002',
      name: 'Sala Creativa',
      type: 'room',
      capacity: 8,
      location: 'Piso 2, Oficina Central',
      description: 'Espacio colaborativo para sesiones de brainstorming y trabajo en equipo',
      features: ['Pizarra', 'Post-its', 'Mesas Modulares', 'Iluminación Natural', 'Plantas'],
      bookingRules: {
        maxDuration: 8,
        advanceBooking: 14,
        requiresApproval: false,
        allowedUsers: ['all']
      },
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '16:00' }
      },
      manager: {
        id: 'mgr2',
        name: 'Carlos López',
        email: 'carlos.lopez@company.com'
      },
      active: true
    },
    {
      id: 'equip-001',
      name: 'Proyector Portátil HP',
      type: 'equipment',
      location: 'Almacén de TI',
      description: 'Proyector portátil para presentaciones móviles',
      features: ['Full HD', 'HDMI', 'USB-C', 'Wireless', 'Batería 2h'],
      bookingRules: {
        maxDuration: 24,
        advanceBooking: 7,
        requiresApproval: false,
        allowedUsers: ['all']
      },
      availability: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' }
      },
      manager: {
        id: 'mgr3',
        name: 'IT Support',
        email: 'it@company.com'
      },
      active: true
    },
    {
      id: 'vehicle-001',
      name: 'Van Corporativa',
      type: 'vehicle',
      capacity: 8,
      location: 'Estacionamiento Subterráneo',
      description: 'Vehículo para transporte de equipos y personal',
      features: ['GPS', 'A/C', '8 Asientos', 'Espacio Carga'],
      bookingRules: {
        maxDuration: 48,
        advanceBooking: 3,
        requiresApproval: true,
        allowedUsers: ['drivers', 'managers']
      },
      availability: {
        monday: { start: '06:00', end: '22:00' },
        tuesday: { start: '06:00', end: '22:00' },
        wednesday: { start: '06:00', end: '22:00' },
        thursday: { start: '06:00', end: '22:00' },
        friday: { start: '06:00', end: '22:00' },
        saturday: { start: '08:00', end: '20:00' }
      },
      manager: {
        id: 'mgr4',
        name: 'Operations',
        email: 'ops@company.com'
      },
      active: true
    }
  ];

  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Reunión Estratégica Q1',
      description: 'Revisión de objetivos y planificación estratégica para el primer trimestre',
      type: 'meeting',
      status: 'confirmed',
      priority: 'high',
      startTime: '2024-01-25T09:00:00Z',
      endTime: '2024-01-25T11:00:00Z',
      allDay: false,
      location: {
        type: 'in-person',
        room: 'Sala de Juntas Principal',
        address: 'Piso 3, Oficina Central'
      },
      attendees: [
        {
          id: '1',
          name: 'Ana García',
          email: 'ana.garcia@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'organizer'
        },
        {
          id: '2',
          name: 'Carlos López',
          email: 'carlos.lopez@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'required'
        },
        {
          id: '3',
          name: 'María Silva',
          email: 'maria.silva@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'tentative',
          role: 'required'
        },
        {
          id: '4',
          name: 'Diego Ruiz',
          email: 'diego.ruiz@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'pending',
          role: 'optional'
        }
      ],
      resources: [
        {
          id: 'room-001',
          name: 'Sala de Juntas Principal',
          type: 'room',
          capacity: 12,
          location: 'Piso 3',
          available: true
        },
        {
          id: 'equip-001',
          name: 'Proyector Portátil HP',
          type: 'equipment',
          available: true
        }
      ],
      organizer: {
        id: '1',
        name: 'Ana García',
        email: 'ana.garcia@company.com',
        avatar: '/api/placeholder/32/32'
      },
      reminders: [
        {
          id: 'rem1',
          type: 'email',
          time: 1440, // 24 hours
          sent: false
        },
        {
          id: 'rem2',
          type: 'notification',
          time: 15, // 15 minutes
          sent: false
        }
      ],
      attachments: [
        {
          id: 'att1',
          name: 'Agenda_Q1_Strategic.pdf',
          type: 'application/pdf',
          url: '/attachments/agenda.pdf',
          size: 2048000
        }
      ],
      tags: ['strategy', 'quarterly', 'executive'],
      color: 'electric-blue',
      isPrivate: false,
      allowGuests: false,
      maxAttendees: 12,
      customFields: {
        budget_impact: 'High',
        decision_required: true
      },
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-22T14:15:00Z'
    },
    {
      id: '2',
      title: 'Sesión Brainstorming - Producto',
      description: 'Generación de ideas para nuevas funcionalidades del producto',
      type: 'meeting',
      status: 'confirmed',
      priority: 'medium',
      startTime: '2024-01-26T14:00:00Z',
      endTime: '2024-01-26T16:00:00Z',
      allDay: false,
      location: {
        type: 'in-person',
        room: 'Sala Creativa',
        address: 'Piso 2, Oficina Central'
      },
      attendees: [
        {
          id: '5',
          name: 'Roberto Kim',
          email: 'roberto.kim@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'organizer'
        },
        {
          id: '6',
          name: 'Sofía Chen',
          email: 'sofia.chen@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'required'
        },
        {
          id: '7',
          name: 'Luis Morales',
          email: 'luis.morales@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'required'
        }
      ],
      resources: [
        {
          id: 'room-002',
          name: 'Sala Creativa',
          type: 'room',
          capacity: 8,
          location: 'Piso 2',
          available: true
        }
      ],
      organizer: {
        id: '5',
        name: 'Roberto Kim',
        email: 'roberto.kim@company.com',
        avatar: '/api/placeholder/32/32'
      },
      reminders: [
        {
          id: 'rem3',
          type: 'notification',
          time: 30,
          sent: false
        }
      ],
      attachments: [],
      tags: ['brainstorming', 'product', 'creative'],
      color: 'electric-purple',
      isPrivate: false,
      allowGuests: true,
      maxAttendees: 8,
      customFields: {},
      createdAt: '2024-01-23T09:15:00Z',
      updatedAt: '2024-01-23T09:15:00Z'
    },
    {
      id: '3',
      title: 'Revisión de Código - Sprint 12',
      description: 'Code review semanal del equipo de desarrollo',
      type: 'meeting',
      status: 'confirmed',
      priority: 'medium',
      startTime: '2024-01-24T10:00:00Z',
      endTime: '2024-01-24T11:30:00Z',
      allDay: false,
      recurrence: {
        pattern: 'weekly',
        interval: 1,
        endDate: '2024-06-30T00:00:00Z'
      },
      location: {
        type: 'online',
        onlineLink: 'https://meet.google.com/abc-defg-hij'
      },
      attendees: [
        {
          id: '8',
          name: 'Emma Thompson',
          email: 'emma.thompson@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'organizer'
        },
        {
          id: '2',
          name: 'Carlos López',
          email: 'carlos.lopez@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'required'
        },
        {
          id: '3',
          name: 'María Silva',
          email: 'maria.silva@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'required'
        }
      ],
      resources: [],
      organizer: {
        id: '8',
        name: 'Emma Thompson',
        email: 'emma.thompson@company.com',
        avatar: '/api/placeholder/32/32'
      },
      reminders: [
        {
          id: 'rem4',
          type: 'notification',
          time: 10,
          sent: false
        }
      ],
      attachments: [],
      tags: ['development', 'code-review', 'weekly'],
      color: 'electric-green',
      isPrivate: false,
      allowGuests: false,
      customFields: {
        sprint: 'Sprint 12'
      },
      createdAt: '2024-01-15T16:00:00Z',
      updatedAt: '2024-01-20T11:30:00Z'
    },
    {
      id: '4',
      title: 'Entrega Presentación Cliente',
      description: 'Deadline para entrega de presentación al cliente ABC Corp',
      type: 'task',
      status: 'confirmed',
      priority: 'critical',
      startTime: '2024-01-30T17:00:00Z',
      endTime: '2024-01-30T17:00:00Z',
      allDay: false,
      attendees: [
        {
          id: '4',
          name: 'Diego Ruiz',
          email: 'diego.ruiz@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'organizer'
        }
      ],
      resources: [],
      organizer: {
        id: '4',
        name: 'Diego Ruiz',
        email: 'diego.ruiz@company.com',
        avatar: '/api/placeholder/32/32'
      },
      reminders: [
        {
          id: 'rem5',
          type: 'email',
          time: 2880, // 2 days
          sent: false
        },
        {
          id: 'rem6',
          type: 'notification',
          time: 60, // 1 hour
          sent: false
        }
      ],
      attachments: [],
      tags: ['deadline', 'client', 'presentation'],
      color: 'electric-red',
      isPrivate: false,
      allowGuests: false,
      customFields: {
        client: 'ABC Corp',
        project: 'Website Redesign'
      },
      createdAt: '2024-01-10T14:20:00Z',
      updatedAt: '2024-01-18T10:45:00Z'
    },
    {
      id: '5',
      title: 'Almuerzo con Equipo',
      description: 'Almuerzo casual para celebrar el éxito del último proyecto',
      type: 'personal',
      status: 'confirmed',
      priority: 'low',
      startTime: '2024-01-28T12:30:00Z',
      endTime: '2024-01-28T14:00:00Z',
      allDay: false,
      location: {
        type: 'in-person',
        address: 'Restaurante El Buen Gusto, Av. Providencia 1234'
      },
      attendees: [
        {
          id: '1',
          name: 'Ana García',
          email: 'ana.garcia@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'organizer'
        },
        {
          id: '2',
          name: 'Carlos López',
          email: 'carlos.lopez@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'accepted',
          role: 'optional'
        },
        {
          id: '3',
          name: 'María Silva',
          email: 'maria.silva@company.com',
          avatar: '/api/placeholder/32/32',
          status: 'tentative',
          role: 'optional'
        }
      ],
      resources: [
        {
          id: 'vehicle-001',
          name: 'Van Corporativa',
          type: 'vehicle',
          available: true
        }
      ],
      organizer: {
        id: '1',
        name: 'Ana García',
        email: 'ana.garcia@company.com',
        avatar: '/api/placeholder/32/32'
      },
      reminders: [
        {
          id: 'rem7',
          type: 'notification',
          time: 60,
          sent: false
        }
      ],
      attachments: [],
      tags: ['team', 'celebration', 'lunch'],
      color: 'electric-yellow',
      isPrivate: false,
      allowGuests: true,
      customFields: {
        budget: '$300',
        restaurant: 'El Buen Gusto'
      },
      createdAt: '2024-01-22T11:00:00Z',
      updatedAt: '2024-01-22T11:00:00Z'
    }
  ];

  const filteredEvents = useMemo(() => {
    if (selectedFilters.length === 0) return events;
    return events.filter(event => 
      selectedFilters.includes(event.type) || 
      event.tags.some(tag => selectedFilters.includes(tag))
    );
  }, [events, selectedFilters]);

  const getEventTypeColor = (type: string) => {
    const typeConfig = eventTypes.find(t => t.id === type);
    return typeConfig?.color || 'gray';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'tentative': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'cancelled': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-electric-red/20 text-electric-red';
      case 'high': return 'bg-electric-orange/20 text-electric-orange';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const getCurrentViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      case 'agenda':
        return 'Vista de Agenda';
      default:
        return '';
    }
  };

  const stats = useMemo(() => {
    const today = new Date();
    const todayEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === today.toDateString();
    });

    const thisWeekEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    const upcomingReminders = filteredEvents.filter(event => 
      event.reminders.some(reminder => !reminder.sent)
    ).length;

    const resourcesInUse = filteredEvents.reduce((count, event) => 
      count + event.resources.length, 0
    );

    return {
      todayEvents: todayEvents.length,
      thisWeekEvents: thisWeekEvents.length,
      upcomingReminders,
      resourcesInUse
    };
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendario y Recursos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Orquestación inteligente de tiempo y recursos organizacionales
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResourceManager(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Recursos
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Evento
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['month', 'week', 'day', 'agenda'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'month' && 'Mes'}
                {mode === 'week' && 'Semana'}
                {mode === 'day' && 'Día'}
                {mode === 'agenda' && 'Agenda'}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Eventos Hoy</p>
              <p className="text-2xl font-bold text-electric-blue">{stats.todayEvents}</p>
            </div>
            <Calendar className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Programados para hoy
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Esta Semana</p>
              <p className="text-2xl font-bold text-electric-green">{stats.thisWeekEvents}</p>
            </div>
            <Clock className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total semanal
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recordatorios</p>
              <p className="text-2xl font-bold text-electric-orange">{stats.upcomingReminders}</p>
            </div>
            <Bell className="w-8 h-8 text-electric-orange" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pendientes de envío
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recursos en Uso</p>
              <p className="text-2xl font-bold text-electric-purple">{stats.resourcesInUse}</p>
            </div>
            <MapPin className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Asignaciones activas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
          {eventTypes.map(type => (
            <button
              key={type.id}
              onClick={() => {
                if (selectedFilters.includes(type.id)) {
                  setSelectedFilters(selectedFilters.filter(f => f !== type.id));
                } else {
                  setSelectedFilters([...selectedFilters, type.id]);
                }
              }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedFilters.includes(type.id)
                  ? `bg-${type.color} text-white`
                  : `bg-${type.color}/20 text-${type.color} hover:bg-${type.color}/30`
              }`}
            >
              {type.name}
            </button>
          ))}
          {selectedFilters.length > 0 && (
            <button
              onClick={() => setSelectedFilters([])}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {getCurrentViewTitle()}
            </h3>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-electric-blue hover:text-electric-blue/80 transition-colors"
            >
              Hoy
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'agenda' && (
          <div className="p-6">
            <div className="space-y-4">
              {filteredEvents
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className={`w-4 h-4 rounded-full bg-${getEventTypeColor(event.type)} flex-shrink-0 mt-1`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(event.startTime)} {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>

                        {event.location && (
                          <span className="flex items-center gap-1">
                            {event.location.type === 'online' ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            {event.location.room || event.location.address || 'Online'}
                          </span>
                        )}

                        {event.attendees.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.attendees.length} participantes
                          </span>
                        )}
                      </div>

                      {event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {event.attendees.slice(0, 4).map(attendee => (
                            <img
                              key={attendee.id}
                              src={attendee.avatar || '/api/placeholder/24/24'}
                              alt={attendee.name}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                              title={`${attendee.name} - ${attendee.status}`}
                            />
                          ))}
                          {event.attendees.length > 4 && (
                            <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-xs flex items-center justify-center text-gray-600 dark:text-gray-300">
                              +{event.attendees.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {event.recurrence && (
                        <div className="mt-2">
                          <span className="text-xs bg-electric-blue/20 text-electric-blue px-2 py-1 rounded">
                            🔄 Se repite {event.recurrence.pattern}
                          </span>
                        </div>
                      )}

                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{event.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <Edit3 className="w-4 h-4" />
                      <Share className="w-4 h-4" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {viewMode !== 'agenda' && (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Vista de calendario ({viewMode}) en desarrollo</p>
              <p className="text-sm mt-2">Próximamente: vista completa de calendario con drag & drop</p>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full bg-${getEventTypeColor(selectedEvent.type)}`}></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formatDateTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {selectedEvent.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Descripción
                      </h4>
                      <p className="text-gray-900 dark:text-white">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Detalles del Evento
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className={`px-2 py-1 text-xs rounded bg-${getEventTypeColor(selectedEvent.type)}/20 text-${getEventTypeColor(selectedEvent.type)}`}>
                            {selectedEvent.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estado:</span>
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedEvent.status)}`}>
                            {selectedEvent.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prioridad:</span>
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(selectedEvent.priority)}`}>
                            {selectedEvent.priority}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Todo el día:</span>
                          <span>{selectedEvent.allDay ? 'Sí' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.location && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Ubicación
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            {selectedEvent.location.type === 'online' ? (
                              <Video className="w-4 h-4 text-gray-400" />
                            ) : (
                              <MapPin className="w-4 h-4 text-gray-400" />
                            )}
                            <span>
                              {selectedEvent.location.type === 'online' ? 'En línea' : 'Presencial'}
                            </span>
                          </div>
                          {selectedEvent.location.room && (
                            <p><strong>Sala:</strong> {selectedEvent.location.room}</p>
                          )}
                          {selectedEvent.location.address && (
                            <p><strong>Dirección:</strong> {selectedEvent.location.address}</p>
                          )}
                          {selectedEvent.location.onlineLink && (
                            <p>
                              <strong>Enlace:</strong> 
                              <a 
                                href={selectedEvent.location.onlineLink} 
                                className="text-electric-blue hover:text-electric-blue/80 ml-1"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Unirse a la reunión
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEvent.attendees.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Participantes ({selectedEvent.attendees.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedEvent.attendees.map(attendee => (
                          <div key={attendee.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={attendee.avatar || '/api/placeholder/32/32'}
                                alt={attendee.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {attendee.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {attendee.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                attendee.status === 'accepted' ? 'bg-electric-green/20 text-electric-green' :
                                attendee.status === 'declined' ? 'bg-electric-red/20 text-electric-red' :
                                attendee.status === 'tentative' ? 'bg-electric-yellow/20 text-electric-yellow' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {attendee.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {attendee.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.resources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Recursos Asignados
                      </h4>
                      <div className="space-y-2">
                        {selectedEvent.resources.map(resource => (
                          <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {resource.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {resource.type} • {resource.location}
                                {resource.capacity && ` • Capacidad: ${resource.capacity}`}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              resource.available 
                                ? 'bg-electric-green/20 text-electric-green' 
                                : 'bg-electric-red/20 text-electric-red'
                            }`}>
                              {resource.available ? 'Disponible' : 'Ocupado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Archivos Adjuntos
                      </h4>
                      <div className="space-y-2">
                        {selectedEvent.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-600 rounded">
                            <span className="text-sm">📄</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button className="text-electric-blue hover:text-electric-blue/80">
                              Descargar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Organizador
                    </h4>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedEvent.organizer.avatar || '/api/placeholder/32/32'}
                        alt={selectedEvent.organizer.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedEvent.organizer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedEvent.organizer.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.reminders.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Recordatorios
                      </h4>
                      <div className="space-y-2">
                        {selectedEvent.reminders.map(reminder => (
                          <div key={reminder.id} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{reminder.type}</span>
                            <span className={reminder.sent ? 'text-electric-green' : 'text-gray-600 dark:text-gray-300'}>
                              {reminder.time} min antes {reminder.sent && '✓'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.recurrence && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Recurrencia
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Patrón:</span>
                          <span className="capitalize">{selectedEvent.recurrence.pattern}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Intervalo:</span>
                          <span>Cada {selectedEvent.recurrence.interval}</span>
                        </div>
                        {selectedEvent.recurrence.endDate && (
                          <div className="flex justify-between">
                            <span>Hasta:</span>
                            <span>{formatDate(selectedEvent.recurrence.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.tags.map(tag => (
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

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Creado: {formatDateTime(selectedEvent.createdAt)}</p>
                    <p>Actualizado: {formatDateTime(selectedEvent.updatedAt)}</p>
                    <p>Privado: {selectedEvent.isPrivate ? 'Sí' : 'No'}</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-electric-blue text-white rounded hover:bg-electric-blue/90 transition-colors flex items-center justify-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                    <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Share className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Manager Modal */}
      {showResourceManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Gestión de Recursos
                </h3>
                <button
                  onClick={() => setShowResourceManager(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(resource => (
                  <div
                    key={resource.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    {resource.image && (
                      <img
                        src={resource.image}
                        alt={resource.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {resource.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                            {resource.type}
                            {resource.capacity && ` • ${resource.capacity} personas`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {resource.location}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          resource.active 
                            ? 'bg-electric-green/20 text-electric-green' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {resource.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {resource.description}
                      </p>

                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Características:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {resource.features.slice(0, 3).map(feature => (
                            <span
                              key={feature}
                              className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {resource.features.length > 3 && (
                            <span className="text-xs text-gray-400">+{resource.features.length - 3}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p><strong>Manager:</strong> {resource.manager.name}</p>
                        <p><strong>Max. duración:</strong> {resource.bookingRules.maxDuration}h</p>
                        <p><strong>Reserva anticipada:</strong> {resource.bookingRules.advanceBooking} días</p>
                        {resource.bookingRules.requiresApproval && (
                          <p className="text-electric-orange">⚠️ Requiere aprobación</p>
                        )}
                      </div>

                      <button className="w-full px-3 py-2 text-sm bg-electric-blue text-white rounded hover:bg-electric-blue/90 transition-colors">
                        Ver Disponibilidad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarHub;