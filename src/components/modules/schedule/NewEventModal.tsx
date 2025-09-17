import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Calendar, Clock, MapPin, Users, User, 
  Flag, Coffee, CheckSquare, AlertCircle 
} from 'lucide-react';
import type { CalendarEvent } from '../../../services/calendarService';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  selectedDate?: Date;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'meeting' as CalendarEvent['type'],
    title: '',
    description: '',
    startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endTime: '10:00',
    location: '',
    attendees: [] as string[],
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '#3B82F6',
    allDay: false
  });

  const eventTypes = [
    { value: 'meeting', label: 'Reunión', icon: Users, color: '#3B82F6' },
    { value: 'task', label: 'Tarea', icon: CheckSquare, color: '#F59E0B' },
    { value: 'shift', label: 'Turno', icon: Clock, color: '#059669' },
    { value: 'holiday', label: 'Feriado', icon: Flag, color: '#DC2626' },
    { value: 'cafe-status', label: 'Estado Café', icon: Coffee, color: '#6B7280' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Baja', color: '#10B981' },
    { value: 'medium', label: 'Media', color: '#F59E0B' },
    { value: 'high', label: 'Alta', color: '#EF4444' }
  ];

  const staffMembers = [
    'juan.perez@murallacafe.cl',
    'maria.garcia@murallacafe.cl',
    'carlos.lopez@murallacafe.cl',
    'ana.torres@murallacafe.cl',
    'luis.rodriguez@murallacafe.cl'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = formData.allDay 
        ? undefined 
        : new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData: Omit<CalendarEvent, 'id'> = {
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location || undefined,
        attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
        assignedTo: formData.assignedTo || undefined,
        priority: formData.priority,
        color: formData.color,
        status: 'scheduled'
      };

      await onSave(eventData);
      onClose();
      
      // Reset form
      setFormData({
        type: 'meeting',
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '10:00',
        location: '',
        attendees: [],
        assignedTo: '',
        priority: 'medium',
        color: '#3B82F6',
        allDay: false
      });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendeeToggle = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(email)
        ? prev.attendees.filter(a => a !== email)
        : [...prev.attendees, email]
    }));
  };

  const selectedEventType = eventTypes.find(type => type.value === formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {selectedEventType && <selectedEventType.icon className="w-6 h-6 text-blue-600" />}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nuevo Evento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Evento
            </label>
            <div className="grid grid-cols-5 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as any, color: type.color }))}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-5 h-5 ${
                    formData.type === type.value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    formData.type === type.value 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Reunión semanal del equipo"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Detalles adicionales del evento..."
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  disabled={formData.allDay}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* All Day Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Todo el día</span>
            </label>
          </div>

          {/* End Date & Time (if not all day) */}
          {!formData.allDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Sala de reuniones, Área de producción..."
              />
            </div>
          </div>

          {/* Priority (for tasks) */}
          {formData.type === 'task' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {priorityLevels.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      formData.priority === priority.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: priority.color }}
                      />
                      <span className={`text-sm font-medium ${
                        formData.priority === priority.value 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {priority.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assigned To (for tasks) */}
          {formData.type === 'task' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asignado a
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccionar persona...</option>
                  {staffMembers.map((member) => (
                    <option key={member} value={member}>
                      {member.split('@')[0].replace('.', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Attendees (for meetings) */}
          {formData.type === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Participantes
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                {staffMembers.map((member) => (
                  <label key={member} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.attendees.includes(member)}
                      onChange={() => handleAttendeeToggle(member)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {member.split('@')[0].replace('.', ' ').toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex space-x-2">
              {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Guardando...' : 'Crear Evento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};