import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface CalendarEvent {
  id: string;
  type: 'task' | 'meeting' | 'holiday' | 'shift' | 'cafe-status';
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  attendees?: string[];
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'open' | 'closed' | 'scheduled' | 'completed' | 'cancelled';
  color?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface StaffShift {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export interface CafeSchedule {
  date: string; // YYYY-MM-DD format
  status: 'open' | 'closed' | 'limited';
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
  specialHours?: {
    reason: string;
    openTime: string;
    closeTime: string;
  };
}

export interface HolidayInfo {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'national' | 'regional' | 'company';
  description?: string;
}

// Chilean Holidays for 2025-2026
export const CHILEAN_HOLIDAYS: HolidayInfo[] = [
  // 2025
  { date: '2025-01-01', name: 'Año Nuevo', type: 'national' },
  { date: '2025-04-18', name: 'Viernes Santo', type: 'national' },
  { date: '2025-04-19', name: 'Sábado Santo', type: 'national' },
  { date: '2025-05-01', name: 'Día del Trabajador', type: 'national' },
  { date: '2025-05-21', name: 'Glorias Navales', type: 'national' },
  { date: '2025-06-29', name: 'San Pedro y San Pablo', type: 'national' },
  { date: '2025-07-16', name: 'Día de la Virgen del Carmen', type: 'national' },
  { date: '2025-08-15', name: 'Asunción de la Virgen', type: 'national' },
  { date: '2025-09-18', name: 'Independencia Nacional', type: 'national' },
  { date: '2025-09-19', name: 'Glorias del Ejército', type: 'national' },
  { date: '2025-10-12', name: 'Encuentro de Dos Mundos', type: 'national' },
  { date: '2025-10-31', name: 'Día de las Iglesias Evangélicas', type: 'national' },
  { date: '2025-11-01', name: 'Día de Todos los Santos', type: 'national' },
  { date: '2025-12-08', name: 'Inmaculada Concepción', type: 'national' },
  { date: '2025-12-25', name: 'Navidad', type: 'national' },
  
  // 2026
  { date: '2026-01-01', name: 'Año Nuevo', type: 'national' },
  { date: '2026-04-03', name: 'Viernes Santo', type: 'national' },
  { date: '2026-04-04', name: 'Sábado Santo', type: 'national' },
  { date: '2026-05-01', name: 'Día del Trabajador', type: 'national' },
  { date: '2026-05-21', name: 'Glorias Navales', type: 'national' },
  
  // Company holidays
  { date: '2025-12-24', name: 'Nochebuena (Medio día)', type: 'company', description: 'Cerrado desde las 14:00' },
  { date: '2025-12-31', name: 'Nochevieja (Medio día)', type: 'company', description: 'Cerrado desde las 16:00' },
];

class CalendarService {
  private getAuthHeaders() {
    const token = AuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Events Management - Enhanced to include tasks and projects
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      await AuthService.ensureValidToken();
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Fetch all event types in parallel
      const [calendarEvents, taskEvents, projectEvents, shiftEvents] = await Promise.all([
        // Regular calendar events
        axios.get(`${API_BASE_URL}/calendar/events?${params}`, {
          headers: this.getAuthHeaders(),
        }).then(response => response.data.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: event.endTime ? new Date(event.endTime) : undefined,
        }))).catch(() => []),
        
        // Tasks with due dates
        this.getTasksForCalendar(startDate, endDate),
        
        // Project deadlines
        this.getProjectsForCalendar(startDate, endDate),
        
        // Staff shifts
        this.getStaffShiftsRange(startDate, endDate).then(shifts => 
          shifts.map(shift => ({
            id: `shift-${shift.id}`,
            type: 'shift' as const,
            title: `${shift.position} - ${shift.userName}`,
            description: `Turno de ${shift.position}`,
            startTime: new Date(`${shift.date}T${shift.startTime}`),
            endTime: new Date(`${shift.date}T${shift.endTime}`),
            assignedTo: shift.userId,
            status: shift.status,
            color: '#059669', // Green for shifts
            shiftData: shift
          })
        )).catch(() => [])
      ]);

      // Combine all events
      return [...calendarEvents, ...taskEvents, ...projectEvents, ...shiftEvents];
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to mock data for development
      return this.getMockEvents(startDate, endDate);
    }
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/calendar/events`, eventData, {
        headers: this.getAuthHeaders(),
      });

      return {
        ...response.data,
        startTime: new Date(response.data.startTime),
        endTime: response.data.endTime ? new Date(response.data.endTime) : undefined,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.patch(`${API_BASE_URL}/calendar/events/${eventId}`, eventData, {
        headers: this.getAuthHeaders(),
      });

      return {
        ...response.data,
        startTime: new Date(response.data.startTime),
        endTime: response.data.endTime ? new Date(response.data.endTime) : undefined,
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Staff Shifts Management
  async getStaffShifts(date: Date): Promise<StaffShift[]> {
    try {
      await AuthService.ensureValidToken();
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`${API_BASE_URL}/calendar/shifts?date=${dateStr}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching staff shifts:', error);
      return [];
    }
  }

  async getStaffShiftsRange(startDate: Date, endDate: Date): Promise<StaffShift[]> {
    try {
      await AuthService.ensureValidToken();
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      const response = await axios.get(`${API_BASE_URL}/calendar/shifts?${params}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching staff shifts range:', error);
      return [];
    }
  }

  async scheduleShift(shiftData: Omit<StaffShift, 'id'>): Promise<StaffShift> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/calendar/shifts`, shiftData, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error scheduling shift:', error);
      throw error;
    }
  }

  // Cafe Schedule Management
  async getCafeSchedule(date: Date): Promise<CafeSchedule> {
    try {
      await AuthService.ensureValidToken();
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`${API_BASE_URL}/calendar/cafe-schedule?date=${dateStr}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching cafe schedule:', error);
      return this.getMockCafeSchedule(date);
    }
  }

  async updateCafeSchedule(date: Date, schedule: Omit<CafeSchedule, 'date'>): Promise<CafeSchedule> {
    try {
      await AuthService.ensureValidToken();
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.put(`${API_BASE_URL}/calendar/cafe-schedule`, {
        date: dateStr,
        ...schedule
      }, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error updating cafe schedule:', error);
      throw error;
    }
  }

  // Get tasks with due dates for calendar
  async getTasksForCalendar(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      await AuthService.ensureValidToken();
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      const response = await axios.get(`${API_BASE_URL}/calendar/tasks?${params}`, {
        headers: this.getAuthHeaders(),
      });

      // Transform tasks to calendar events (backend already returns properly formatted data)
      return response.data.map((task: any) => ({
        ...task,
        id: `task-${task.id}`,
        startTime: new Date(task.startTime),
        endTime: task.endTime ? new Date(task.endTime) : undefined,
        taskData: task // Store original task data for reference
      }));
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
      return this.getMockTaskEvents(startDate, endDate);
    }
  }

  // Get projects with deadlines for calendar
  async getProjectsForCalendar(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/projects?includeDeadlines=true`, {
        headers: this.getAuthHeaders(),
      });

      return response.data
        .filter((project: any) => project.deadline)
        .map((project: any) => {
          const deadlineDate = new Date(project.deadline);
          if (deadlineDate >= startDate && deadlineDate <= endDate) {
            return {
              id: `project-${project.id}`,
              type: 'meeting' as const, // Using meeting type for project deadlines
              title: `📋 ${project.name} - Deadline`,
              description: project.description || 'Project deadline',
              startTime: deadlineDate,
              endTime: deadlineDate,
              priority: 'high' as const,
              status: 'scheduled' as const,
              color: '#DC2626', // Red for deadlines
              projectData: project
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching project deadlines:', error);
      return [];
    }
  }

  private getTaskPriorityColor(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return '#DC2626'; // Red
      case 'HIGH': return '#EA580C'; // Orange
      case 'MEDIUM': return '#D97706'; // Amber
      case 'LOW': return '#059669'; // Green
      default: return '#6B7280'; // Gray
    }
  }

  // Holidays Management
  async getHolidays(year: number): Promise<HolidayInfo[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/calendar/holidays?year=${year}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return CHILEAN_HOLIDAYS.filter(holiday => 
        new Date(holiday.date).getFullYear() === year
      );
    }
  }

  getHolidaysStatic(year: number): HolidayInfo[] {
    return CHILEAN_HOLIDAYS.filter(holiday => 
      new Date(holiday.date).getFullYear() === year
    );
  }

  isHoliday(date: Date): HolidayInfo | null {
    const dateStr = date.toISOString().split('T')[0];
    return CHILEAN_HOLIDAYS.find(holiday => holiday.date === dateStr) || null;
  }

  // Utility Methods
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatTimeForAPI(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  }

  // Mock task events for development
  private getMockTaskEvents(startDate: Date, endDate: Date): CalendarEvent[] {
    const today = new Date();
    const mockTasks: CalendarEvent[] = [
      {
        id: 'task-1',
        type: 'task',
        title: 'Revisar inventario café premium',
        description: 'Verificar stock de café arábica y espresso premium',
        startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        assignedTo: 'ana.torres',
        priority: 'high',
        status: 'scheduled',
        color: '#DC2626'
      },
      {
        id: 'task-2',
        type: 'task',
        title: 'Actualizar precios plataformas',
        description: 'Sincronizar precios en Rappi, PedidosYa y Uber Eats',
        startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        assignedTo: 'carlos.lopez',
        priority: 'medium',
        status: 'open',
        color: '#D97706'
      },
      {
        id: 'task-3',
        type: 'task',
        title: 'Preparar informe mensual',
        description: 'Compilar métricas de ventas y rendimiento',
        startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        assignedTo: 'maria.garcia',
        priority: 'medium',
        status: 'open',
        color: '#D97706'
      }
    ];

    return mockTasks.filter(task => 
      task.startTime >= startDate && task.startTime <= endDate
    );
  }

  // Mock data for development
  private getMockEvents(startDate: Date, endDate: Date): CalendarEvent[] {
    // Calculate current week dates for the scheduled events
    const today = new Date();
    const currentWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const wednesday = new Date(currentWeek);
    wednesday.setDate(today.getDate() - dayOfWeek + 3);
    const thursday = new Date(currentWeek);
    thursday.setDate(today.getDate() - dayOfWeek + 4);

    const mockEvents: CalendarEvent[] = [
      // This Week's Scheduled Events
      {
        id: 'entel-install',
        type: 'meeting',
        title: 'Instalación de Entel',
        description: 'Instalación del servicio de Entel en el local',
        startTime: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 14, 0),
        endTime: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 16, 0),
        location: 'Local Muralla Café',
        priority: 'high',
        status: 'scheduled',
        color: '#DC2626'
      },
      {
        id: 'pablo-carteles',
        type: 'meeting',
        title: 'Junta con Pablo - Carteles',
        description: 'Reunión con Pablo para revisar diseños de carteles y material promocional',
        startTime: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 16, 0),
        endTime: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 17, 0),
        attendees: ['pablo@example.com'],
        priority: 'medium',
        status: 'scheduled',
        color: '#3B82F6'
      },
      {
        id: 'contadora-reunion',
        type: 'meeting',
        title: 'Reunión con Contadora',
        description: 'Reunión mensual con la contadora para revisar estados financieros y temas fiscales',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30),
        location: 'Oficina Contadora / Video llamada',
        priority: 'high',
        status: 'scheduled',
        color: '#059669'
      },
      {
        id: '1',
        type: 'meeting',
        title: 'Reunión Semanal de Equipo',
        description: 'Revisión de métricas semanales y planificación',
        startTime: new Date(2025, 7, 26, 9, 0),
        endTime: new Date(2025, 7, 26, 10, 30),
        location: 'Sala de Reuniones',
        attendees: ['juan.perez@murallacafe.cl', 'maria.garcia@murallacafe.cl', 'carlos.lopez@murallacafe.cl'],
        color: '#3B82F6'
      },
      {
        id: '2',
        type: 'task',
        title: 'Revisar inventario café premium',
        description: 'Verificar stock de café arábica y espresso premium',
        startTime: new Date(2025, 7, 26, 14, 0),
        assignedTo: 'ana.torres@murallacafe.cl',
        priority: 'high',
        status: 'scheduled',
        color: '#DC2626'
      },
      {
        id: '3',
        type: 'shift',
        title: 'Turno Mañana - Juan Pérez',
        startTime: new Date(2025, 7, 26, 6, 0),
        endTime: new Date(2025, 7, 26, 14, 0),
        assignedTo: 'juan.perez@murallacafe.cl',
        color: '#059669'
      },
      {
        id: '4',
        type: 'task',
        title: 'Actualizar precios plataformas',
        description: 'Sincronizar precios en Rappi, PedidosYa y Uber Eats',
        startTime: new Date(2025, 7, 27, 11, 0),
        assignedTo: 'carlos.lopez@murallacafe.cl',
        priority: 'medium',
        color: '#F59E0B'
      },
      {
        id: '5',
        type: 'meeting',
        title: 'Capacitación Nuevos Productos',
        description: 'Presentación de nuevas bebidas y procedimientos',
        startTime: new Date(2025, 7, 28, 15, 0),
        endTime: new Date(2025, 7, 28, 17, 0),
        attendees: ['todo-el-equipo@murallacafe.cl'],
        location: 'Área de Capacitación',
        color: '#7C3AED'
      }
    ];

    const filteredEvents = mockEvents.filter(event => 
      event.startTime >= startDate && event.startTime <= endDate
    );

    // Add mock tasks to the events
    const mockTasks = this.getMockTaskEvents(startDate, endDate);
    return [...filteredEvents, ...mockTasks];
  }

  private getMockStaffShifts(date: Date): StaffShift[] {
    const dateStr = this.formatDateForAPI(date);
    const dayOfWeek = date.getDay();

    // Different shifts for different days
    if (dayOfWeek === 0) { // Sunday - Limited hours
      return [
        {
          id: '1',
          userId: 'ana.torres',
          userName: 'Ana Torres',
          date: dateStr,
          startTime: '10:00',
          endTime: '16:00',
          position: 'Barista',
          status: 'scheduled'
        }
      ];
    } else if (dayOfWeek === 6) { // Saturday - Extended hours
      return [
        {
          id: '1',
          userId: 'juan.perez',
          userName: 'Juan Pérez',
          date: dateStr,
          startTime: '06:00',
          endTime: '14:00',
          position: 'Supervisor',
          status: 'scheduled'
        },
        {
          id: '2',
          userId: 'maria.garcia',
          userName: 'María García',
          date: dateStr,
          startTime: '14:00',
          endTime: '22:00',
          position: 'Barista',
          status: 'scheduled'
        },
        {
          id: '3',
          userId: 'carlos.lopez',
          userName: 'Carlos López',
          date: dateStr,
          startTime: '08:00',
          endTime: '18:00',
          position: 'Cajero',
          status: 'scheduled'
        }
      ];
    } else { // Regular weekdays
      return [
        {
          id: '1',
          userId: 'juan.perez',
          userName: 'Juan Pérez',
          date: dateStr,
          startTime: '06:00',
          endTime: '14:00',
          position: 'Supervisor',
          status: 'confirmed'
        },
        {
          id: '2',
          userId: 'maria.garcia',
          userName: 'María García',
          date: dateStr,
          startTime: '10:00',
          endTime: '18:00',
          position: 'Barista',
          status: 'confirmed'
        },
        {
          id: '3',
          userId: 'carlos.lopez',
          userName: 'Carlos López',
          date: dateStr,
          startTime: '14:00',
          endTime: '22:00',
          position: 'Cajero',
          status: 'scheduled'
        }
      ];
    }
  }

  private getMockCafeSchedule(date: Date): CafeSchedule {
    const dateStr = this.formatDateForAPI(date);
    const dayOfWeek = date.getDay();
    const holiday = this.isHoliday(date);

    if (holiday) {
      return {
        date: dateStr,
        status: 'closed',
        specialHours: {
          reason: `Cerrado por ${holiday.name}`,
          openTime: '00:00',
          closeTime: '00:00'
        }
      };
    }

    if (dayOfWeek === 0) { // Sunday
      return {
        date: dateStr,
        status: 'limited',
        openTime: '10:00',
        closeTime: '16:00',
        specialHours: {
          reason: 'Horario dominical',
          openTime: '10:00',
          closeTime: '16:00'
        }
      };
    } else if (dayOfWeek === 6) { // Saturday
      return {
        date: dateStr,
        status: 'open',
        openTime: '07:00',
        closeTime: '22:00'
      };
    } else { // Regular weekdays
      return {
        date: dateStr,
        status: 'open',
        openTime: '06:00',
        closeTime: '20:00'
      };
    }
  }
}

export default new CalendarService();