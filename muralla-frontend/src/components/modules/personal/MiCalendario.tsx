import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'call' | 'deadline' | 'personal' | 'travel' | 'training';
  location?: string;
  attendees?: string[];
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'confirmed' | 'tentative' | 'cancelled';
  isRecurring?: boolean;
}

interface TimeSlot {
  hour: string;
  isAvailable: boolean;
  event?: CalendarEvent;
}

const MiCalendario: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Reunión 1:1 con Manager',
      start: '2024-03-14T14:00:00',
      end: '2024-03-14T15:00:00',
      type: 'meeting',
      location: 'Sala de Reuniones A',
      attendees: ['sarah.manager@muralla.com'],
      description: 'Revisión mensual de objetivos y feedback',
      priority: 'high',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Demo Cliente - TechCorp',
      start: '2024-03-15T10:00:00',
      end: '2024-03-15T11:30:00',
      type: 'meeting',
      location: 'Zoom',
      attendees: ['carlos@techcorp.com', 'maria@techcorp.com'],
      description: 'Presentación de propuesta CRM Enterprise',
      priority: 'high',
      status: 'confirmed'
    },
    {
      id: '3',
      title: 'Llamada de seguimiento - StartupXYZ',
      start: '2024-03-15T16:00:00',
      end: '2024-03-15T16:30:00',
      type: 'call',
      attendees: ['roberto@startupxyz.com'],
      description: 'Seguimiento post-propuesta',
      priority: 'medium',
      status: 'confirmed'
    },
    {
      id: '4',
      title: 'Entrega Reporte Q1',
      start: '2024-03-18T18:00:00',
      end: '2024-03-18T18:00:00',
      type: 'deadline',
      description: 'Deadline para reporte trimestral de ventas',
      priority: 'high',
      status: 'confirmed'
    },
    {
      id: '5',
      title: 'Capacitación CRM',
      start: '2024-03-19T09:00:00',
      end: '2024-03-19T12:00:00',
      type: 'training',
      location: 'Sala de Capacitación',
      description: 'Entrenamiento en nuevas funcionalidades del CRM',
      priority: 'medium',
      status: 'confirmed'
    }
  ]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    type: 'meeting' as CalendarEvent['type'],
    location: '',
    description: '',
    priority: 'medium' as CalendarEvent['priority']
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'call': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'deadline': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'personal': return 'bg-electric-purple/20 text-electric-purple border-electric-purple/30';
      case 'travel': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'training': return 'bg-electric-cyan/20 text-electric-cyan border-electric-cyan/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'call': return '📞';
      case 'deadline': return '⏰';
      case 'personal': return '🏠';
      case 'travel': return '✈️';
      case 'training': return '📚';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-electric-red';
      case 'medium': return 'border-l-4 border-electric-yellow';
      case 'low': return 'border-l-4 border-electric-green';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return events.filter(event => 
      new Date(event.start).toDateString() === dateStr
    ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const getTimeSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        isAvailable: true
      });
    }
    return slots;
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end,
      type: newEvent.type,
      location: newEvent.location,
      description: newEvent.description,
      priority: newEvent.priority,
      status: 'confirmed'
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      start: '',
      end: '',
      type: 'meeting',
      location: '',
      description: '',
      priority: 'medium'
    });
    setShowNewEventForm(false);
  };

  const todayEvents = getEventsForDate(new Date());
  const tomorrowEvents = getEventsForDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const thisWeekEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  });

  const busyHoursToday = todayEvents.length;
  const freeSlotsToday = getTimeSlots().length - busyHoursToday;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 Mi Calendario</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organiza tu tiempo de manera inteligente y eficiente
          </p>
        </div>
        <button
          onClick={() => setShowNewEventForm(true)}
          className="btn-electric"
        >
          📅 Nuevo Evento
        </button>
      </div>

      {/* Calendar Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Eventos Hoy"
          value={todayEvents.length}
          subtitle={`${freeSlotsToday} slots libres`}
          color="electric-blue"
        />
        <StatCard
          title="Esta Semana"
          value={thisWeekEvents.length}
          subtitle="eventos programados"
          color="electric-green"
        />
        <StatCard
          title="Reuniones Pendientes"
          value={events.filter(e => e.type === 'meeting' && new Date(e.start) > new Date()).length}
          subtitle="próximas reuniones"
          color="electric-purple"
        />
        <StatCard
          title="Tiempo Libre Hoy"
          value={`${freeSlotsToday}h`}
          subtitle="disponible para trabajo"
          color="electric-cyan"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { id: 'day', label: 'Día' },
          { id: 'week', label: 'Semana' },
          { id: 'month', label: 'Mes' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode.id
                ? 'bg-electric-blue text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <Card className="bg-gradient-to-br from-electric-blue/20 to-electric-cyan/10 dark:from-electric-blue/20 dark:to-electric-cyan/10 border-electric-blue/30 dark:border-electric-cyan/30">
          <CardHeader>
            <CardTitle className="text-electric-blue">📅 Hoy - {formatDate(new Date())}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>No tienes eventos programados para hoy</p>
                <p className="text-sm mt-1">¡Perfecto para trabajo enfocado!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div key={event.id} className={`p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 ${getPriorityColor(event.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="mr-2">{getTypeIcon(event.type)}</span>
                          <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-500">📍 {event.location}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Events */}
        <Card>
          <CardHeader>
            <CardTitle>🌅 Mañana - {formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}</CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>No tienes eventos para mañana</p>
                <p className="text-sm mt-1">Buen momento para planificar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tomorrowEvents.map((event) => (
                  <div key={event.id} className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 ${getPriorityColor(event.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="mr-2">{getTypeIcon(event.type)}</span>
                          <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-500">📍 {event.location}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full btn-electric-green text-sm">
                📞 Agendar Llamada
              </button>
              <button className="w-full btn-electric-blue text-sm">
                👥 Nueva Reunión
              </button>
              <button className="w-full btn-electric-purple text-sm">
                📚 Bloquear Tiempo de Trabajo
              </button>
              <button className="w-full btn-electric text-sm">
                🏠 Tiempo Personal
              </button>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">🤖 IA Sugerencias</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  • Considera agendar 30min para preparar la demo de TechCorp
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  • Tiempo libre de 2-4pm ideal para trabajo profundo
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  • Recordar follow-up con StartupXYZ en 2 días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Vista Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1">
              {/* Time column */}
              <div className="space-y-8">
                <div className="h-12"></div> {/* Header spacer */}
                {getTimeSlots().map((slot) => (
                  <div key={slot.hour} className="h-12 text-xs text-gray-500 py-1">
                    {slot.hour}
                  </div>
                ))}
              </div>
              
              {/* Day columns */}
              {getWeekDays(currentDate).map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-1">
                  <div className="h-12 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.getDate()}
                    </div>
                  </div>
                  
                  {getTimeSlots().map((slot, slotIndex) => {
                    const dayEvents = getEventsForDate(day);
                    const slotEvents = dayEvents.filter(event => {
                      const eventHour = new Date(event.start).getHours();
                      return eventHour === parseInt(slot.hour);
                    });
                    
                    return (
                      <div key={slotIndex} className="h-12 border border-gray-200 dark:border-gray-700 rounded">
                        {slotEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`h-full p-1 rounded text-xs font-medium ${getTypeColor(event.type)} cursor-pointer hover:opacity-80`}
                            title={`${event.title}\n${formatTime(event.start)} - ${formatTime(event.end)}`}
                          >
                            <div className="truncate">{event.title}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>🔮 Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Evento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Hora</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Ubicación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {events
                  .filter(event => new Date(event.start) > new Date())
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="mr-2">{getTypeIcon(event.type)}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{event.title}</div>
                            {event.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(new Date(event.start))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.location || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          event.priority === 'high' ? 'bg-electric-red/20 text-electric-red' :
                          event.priority === 'medium' ? 'bg-electric-yellow/20 text-electric-yellow' :
                          'bg-electric-green/20 text-electric-green'
                        }`}>
                          {event.priority === 'high' ? 'Alta' : event.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Event Modal */}
      {showNewEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Evento</h3>
              <button
                onClick={() => setShowNewEventForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Título del evento..."
                  className="input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                    className="input"
                  >
                    <option value="meeting">Reunión</option>
                    <option value="call">Llamada</option>
                    <option value="deadline">Deadline</option>
                    <option value="personal">Personal</option>
                    <option value="travel">Viaje</option>
                    <option value="training">Capacitación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as CalendarEvent['priority'] })}
                    className="input"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Ej: Sala A, Zoom, Cliente..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalles del evento..."
                  className="input h-20 resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCreateEvent}
                  className="btn-electric flex-1"
                >
                  Crear Evento
                </button>
                <button
                  onClick={() => setShowNewEventForm(false)}
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

export default MiCalendario;