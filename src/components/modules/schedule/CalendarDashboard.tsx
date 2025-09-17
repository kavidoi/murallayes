import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Clock, Users, Coffee, MapPin, Plus, 
  Bell, Flag, ChevronLeft, ChevronRight, 
  Filter, Search, Settings, X, Check
} from 'lucide-react';
import calendarService, { type CalendarEvent, CHILEAN_HOLIDAYS } from '../../../services/calendarService';
import { NewEventModal } from './NewEventModal';

// Types for calendar views

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  isHoliday: boolean;
  holidayName?: string;
  cafeStatus?: 'open' | 'closed' | 'limited';
  staffOnShift?: string[];
}


export const CalendarDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    tasks: true,
    meetings: true,
    holidays: true,
    shifts: true,
    cafeStatus: true
  });
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events for current month
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const fetchedEvents = await calendarService.getEvents(startDate, endDate);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        // Set some mock events for demo
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [currentDate]);

  // Handle new event creation
  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      const newEvent = await calendarService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];

    // Add days from previous month to fill the first week
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      const dateStr = date.toISOString().split('T')[0];
      const holiday = CHILEAN_HOLIDAYS.find(h => h.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter(e => e.startTime.toDateString() === date.toDateString()),
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        cafeStatus: holiday ? 'closed' : 'open',
        staffOnShift: ['juan.perez', 'maria.garcia']
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const holiday = CHILEAN_HOLIDAYS.find(h => h.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: true,
        events: events.filter(e => e.startTime.toDateString() === date.toDateString()),
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        cafeStatus: holiday ? 'closed' : (date.getDay() === 0 ? 'limited' : 'open'),
        staffOnShift: date.getDay() === 0 ? ['ana.torres'] : ['juan.perez', 'maria.garcia', 'carlos.lopez']
      });
    }

    // Add days from next month to fill the last week
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(nextYear, nextMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const holiday = CHILEAN_HOLIDAYS.find(h => h.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter(e => e.startTime.toDateString() === date.toDateString()),
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        cafeStatus: holiday ? 'closed' : 'open',
        staffOnShift: ['juan.perez']
      });
    }

    return days;
  }, [currentDate, events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return <Users className="w-3 h-3" />;
      case 'task': return <Check className="w-3 h-3" />;
      case 'holiday': return <Flag className="w-3 h-3" />;
      case 'shift': return <Clock className="w-3 h-3" />;
      case 'cafe-status': return <Coffee className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  const getCafeStatusColor = (status: 'open' | 'closed' | 'limited') => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-red-600 bg-red-50';
      case 'limited': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('calendar.title')}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('calendar.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['month', 'week', 'day'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                  </button>
                ))}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
              </button>

              {/* Add Event Button */}
              <button
                onClick={() => setShowNewEventModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Nuevo Evento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Quick Info */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
          {/* Calendar Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentDate.toLocaleDateString('es-CL', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={goToToday}
              className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              Ir a Hoy
            </button>
          </div>

          {/* Today's Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Resumen de Hoy
            </h3>
            <div className="space-y-2">
              {/* Cafe Status */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${getCafeStatusColor('open')}`}>
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4" />
                  <span className="text-sm font-medium">Estado Café</span>
                </div>
                <span className="text-xs font-bold uppercase">Abierto</span>
              </div>

              {/* Staff on Shift */}
              <div className="bg-green-50 text-green-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Personal en Turno</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Juan Pérez', 'María García', 'Carlos López'].map((staff) => (
                    <span key={staff} className="text-xs bg-green-100 px-2 py-1 rounded-full">
                      {staff}
                    </span>
                  ))}
                </div>
              </div>

              {/* Today's Events Count */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold">{events.filter(e => e.type === 'meeting' && new Date(e.startTime).toDateString() === new Date().toDateString()).length}</div>
                  <div className="text-xs">Reuniones</div>
                </div>
                <div className="bg-orange-50 text-orange-700 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold">{events.filter(e => e.type === 'task' && new Date(e.startTime).toDateString() === new Date().toDateString()).length}</div>
                  <div className="text-xs">Tareas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Próximos Eventos
            </h3>
            <div className="space-y-2">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                      {event.type === 'task' && event.priority && (
                        <span className="ml-1 text-xs">
                          {event.priority === 'urgent' ? '🔴' : 
                           event.priority === 'high' ? '🟠' : 
                           event.priority === 'medium' ? '🟡' : '⚪'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {event.startTime.toLocaleTimeString('es-CL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.type === 'task' && event.project && (
                        <span className="ml-2">📁 {event.project.name}</span>
                      )}
                      {event.assignees && event.assignees.length > 0 && (
                        <span className="ml-2">👤 {event.assignees[0].firstName} {event.assignees[0].lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 p-6">
          {/* Month View */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div 
                    key={day} 
                    className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day.date)}
                      className={`min-h-24 p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800' : ''
                      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          !day.isCurrentMonth 
                            ? 'text-gray-400 dark:text-gray-600' 
                            : isToday
                              ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                              : 'text-gray-900 dark:text-white'
                        }`}>
                          {day.date.getDate()}
                        </span>

                        {/* Holiday Flag */}
                        {day.isHoliday && (
                          <Flag className="w-3 h-3 text-red-500" />
                        )}
                      </div>

                      {/* Cafe Status Indicator */}
                      {day.cafeStatus && day.isCurrentMonth && (
                        <div className={`w-full h-1 rounded-full mb-1 ${
                          day.cafeStatus === 'open' ? 'bg-green-400' :
                          day.cafeStatus === 'closed' ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                      )}

                      {/* Events */}
                      <div className="space-y-1">
                        {day.events.filter(event => {
                          if (!selectedFilters.tasks && event.type === 'task') return false;
                          if (!selectedFilters.meetings && event.type === 'meeting') return false;
                          if (!selectedFilters.shifts && event.type === 'shift') return false;
                          return true;
                        }).slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded text-white truncate ${
                              event.type === 'task' ? 'bg-orange-500 opacity-90' : 
                              event.type === 'meeting' ? 'bg-blue-500' : 
                              event.type === 'shift' ? 'bg-green-500' : 'bg-gray-500'
                            }`}
                            style={event.color ? { backgroundColor: event.color, opacity: 0.9 } : {}}
                            title={`${event.title}${event.assignees && event.assignees.length > 0 ? ` - ${event.assignees.map((a: any) => `${a.firstName} ${a.lastName}`).join(', ')}` : ''}${event.project ? ` (${event.project.name})` : ''}`}
                          >
                            <div className="flex items-center space-x-1">
                              {getEventTypeIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                              {event.type === 'task' && event.priority && (
                                <span className="text-xs opacity-75">
                                  {event.priority === 'urgent' ? '🔴' : 
                                   event.priority === 'high' ? '🟠' : 
                                   event.priority === 'medium' ? '🟡' : '⚪'}
                                </span>
                              )}
                            </div>
                            {event.type === 'task' && event.assignees && event.assignees.length > 0 && (
                              <div className="text-xs opacity-75 truncate">
                                👤 {event.assignees[0].firstName}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{day.events.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Week Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Semana del {currentDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              
              <div className="grid grid-cols-8 h-96">
                {/* Time column */}
                <div className="border-r border-gray-200 dark:border-gray-700">
                  <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    Hora
                  </div>
                  {Array.from({ length: 12 }, (_, i) => i + 6).map((hour) => (
                    <div key={hour} className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      {hour}:00
                    </div>
                  ))}
                </div>
                
                {/* Week days */}
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(currentDate);
                  const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + i));
                  const dayEvents = events.filter(event => 
                    event.startTime.toDateString() === startOfWeek.toDateString()
                  );
                  const isToday = startOfWeek.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={i} className={`border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      {/* Day header */}
                      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i]}
                        </div>
                        <div className={`text-sm font-semibold ${
                          isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-900 dark:text-white'
                        }`}>
                          {startOfWeek.getDate()}
                        </div>
                      </div>
                      
                      {/* Hour slots */}
                      <div className="relative">
                        {Array.from({ length: 12 }, (_, hour) => (
                          <div key={hour} className="h-12 border-b border-gray-100 dark:border-gray-800 relative">
                            {/* Events in this hour */}
                            {dayEvents
                              .filter(event => event.startTime.getHours() === hour + 6)
                              .map((event) => (
                                <div
                                  key={event.id}
                                  className="absolute left-1 right-1 rounded text-xs text-white p-1 z-10 truncate"
                                  style={{ 
                                    backgroundColor: event.color, 
                                    top: `${(event.startTime.getMinutes() / 60) * 100}%`,
                                    height: event.endTime ? `${Math.max(30, ((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)) * 100)}%` : '30px'
                                  }}
                                  title={`${event.title} - ${event.startTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                                >
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-xs opacity-75">
                                    {event.startTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Day Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentDate.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {events.filter(e => e.startTime.toDateString() === currentDate.toDateString()).length} eventos programados
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 h-96">
                {/* Time column */}
                <div className="border-r border-gray-200 dark:border-gray-700">
                  <div className="h-8 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                    Horario
                  </div>
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                    <div key={hour} className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                      {hour}:00
                    </div>
                  ))}
                </div>
                
                {/* Events column */}
                <div className="relative">
                  <div className="h-8 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                    Eventos
                  </div>
                  
                  <div className="relative">
                    {Array.from({ length: 18 }, (_, hour) => (
                      <div key={hour} className="h-12 border-b border-gray-100 dark:border-gray-800 relative">
                        {/* Events in this hour */}
                        {events
                          .filter(event => 
                            event.startTime.toDateString() === currentDate.toDateString() && 
                            event.startTime.getHours() === hour + 6
                          )
                          .map((event) => (
                            <div
                              key={event.id}
                              className="absolute left-2 right-2 rounded-lg shadow-sm border-l-4 p-2 m-1"
                              style={{ 
                                backgroundColor: `${event.color}20`,
                                borderLeftColor: event.color,
                                top: `${(event.startTime.getMinutes() / 60) * 100}%`,
                                height: event.endTime ? `${Math.max(40, ((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)) * 100)}%` : '40px'
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {event.title}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {event.startTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    {event.endTime && ` - ${event.endTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                                  </div>
                                  {event.location && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                      📍 {event.location}
                                    </div>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                      👥 {event.attendees.length} asistente{event.attendees.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-2">
                                  {event.type === 'task' && event.priority && (
                                    <span className="text-sm">
                                      {event.priority === 'urgent' ? '🔴' : 
                                       event.priority === 'high' ? '🟠' : 
                                       event.priority === 'medium' ? '🟡' : '⚪'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ))}
                    
                    {/* No events message */}
                    {events.filter(e => e.startTime.toDateString() === currentDate.toDateString()).length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📅</div>
                          <div className="text-sm">No hay eventos programados para este día</div>
                          <button
                            onClick={() => setShowNewEventModal(true)}
                            className="mt-3 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Agregar Evento
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros de Calendario
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(selectedFilters).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSelectedFilters(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {key === 'tasks' ? 'Tareas' :
                     key === 'meetings' ? 'Reuniones' :
                     key === 'holidays' ? 'Feriados' :
                     key === 'shifts' ? 'Turnos' :
                     key === 'cafeStatus' ? 'Estado del Café' : key}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate || undefined}
      />
    </div>
  );
};

export default CalendarDashboard;