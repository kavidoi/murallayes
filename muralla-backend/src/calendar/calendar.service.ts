import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, CreateShiftDto, UpdateCafeScheduleDto } from './dto/calendar.dto';

// Chilean holidays data
interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional' | 'company';
  description?: string;
}

const CHILEAN_HOLIDAYS: Holiday[] = [
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
  { date: '2025-12-24', name: 'Nochebuena', type: 'company', description: 'Cerrado desde las 14:00' },
  { date: '2025-12-31', name: 'Nochevieja', type: 'company', description: 'Cerrado desde las 16:00' },
];

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  // Calendar Events
  async getEvents(startDate: Date, endDate: Date, userId: string) {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events.map(event => ({
      id: event.id,
      type: event.type.toLowerCase(),
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      attendees: event.attendees,
      assignedTo: event.assignedTo,
      priority: event.priority?.toLowerCase(),
      status: event.status?.toLowerCase(),
      color: event.color,
      recurring: event.isRecurring ? {
        type: event.recurringType,
        interval: event.recurringInterval,
        endDate: event.recurringEndDate,
      } : undefined,
      creator: event.creator,
    }));
  }

  async createEvent(createEventDto: CreateEventDto, userId: string) {
    const event = await this.prisma.calendarEvent.create({
      data: {
        type: createEventDto.type,
        title: createEventDto.title,
        description: createEventDto.description,
        startTime: new Date(createEventDto.startTime),
        endTime: createEventDto.endTime ? new Date(createEventDto.endTime) : null,
        location: createEventDto.location,
        attendees: createEventDto.attendees || [],
        assignedTo: createEventDto.assignedTo,
        priority: createEventDto.priority,
        status: createEventDto.status,
        color: createEventDto.color,
        isRecurring: createEventDto.isRecurring || false,
        recurringType: createEventDto.recurringType,
        recurringInterval: createEventDto.recurringInterval,
        recurringEndDate: createEventDto.recurringEndDate ? new Date(createEventDto.recurringEndDate) : null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...event,
      type: event.type.toLowerCase(),
      priority: event.priority?.toLowerCase(),
      status: event.status?.toLowerCase(),
    };
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto, userId: string) {
    // Check if event exists and user has permission
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        isDeleted: false,
      },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    const event = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(updateEventDto.type && { type: updateEventDto.type }),
        ...(updateEventDto.title && { title: updateEventDto.title }),
        ...(updateEventDto.description !== undefined && { description: updateEventDto.description }),
        ...(updateEventDto.startTime && { startTime: new Date(updateEventDto.startTime) }),
        ...(updateEventDto.endTime !== undefined && { 
          endTime: updateEventDto.endTime ? new Date(updateEventDto.endTime) : null 
        }),
        ...(updateEventDto.location !== undefined && { location: updateEventDto.location }),
        ...(updateEventDto.attendees && { attendees: updateEventDto.attendees }),
        ...(updateEventDto.assignedTo !== undefined && { assignedTo: updateEventDto.assignedTo }),
        ...(updateEventDto.priority && { priority: updateEventDto.priority }),
        ...(updateEventDto.status && { status: updateEventDto.status }),
        ...(updateEventDto.color !== undefined && { color: updateEventDto.color }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...event,
      type: event.type.toLowerCase(),
      priority: event.priority?.toLowerCase(),
      status: event.status?.toLowerCase(),
    };
  }

  async deleteEvent(eventId: string, userId: string) {
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        isDeleted: false,
      },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { message: 'Event deleted successfully' };
  }

  // Staff Shifts
  async getShiftsByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await this.prisma.staffShift.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return shifts.map(shift => ({
      id: shift.id,
      userId: shift.userId,
      userName: `${shift.user.firstName} ${shift.user.lastName}`,
      date: shift.date.toISOString().split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      status: shift.status.toLowerCase(),
      notes: shift.notes,
    }));
  }

  async getShiftsByDateRange(startDate: Date, endDate: Date) {
    const shifts = await this.prisma.staffShift.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return shifts.map(shift => ({
      id: shift.id,
      userId: shift.userId,
      userName: `${shift.user.firstName} ${shift.user.lastName}`,
      date: shift.date.toISOString().split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      status: shift.status.toLowerCase(),
      notes: shift.notes,
    }));
  }

  async scheduleShift(createShiftDto: CreateShiftDto, createdBy: string) {
    const shift = await this.prisma.staffShift.create({
      data: {
        userId: createShiftDto.userId,
        date: new Date(createShiftDto.date),
        startTime: createShiftDto.startTime,
        endTime: createShiftDto.endTime,
        position: createShiftDto.position,
        status: createShiftDto.status || 'SCHEDULED',
        notes: createShiftDto.notes,
        createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      id: shift.id,
      userId: shift.userId,
      userName: `${shift.user.firstName} ${shift.user.lastName}`,
      date: shift.date.toISOString().split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      status: shift.status.toLowerCase(),
      notes: shift.notes,
    };
  }

  async updateShift(shiftId: string, updateDto: Partial<CreateShiftDto>, userId: string) {
    const existingShift = await this.prisma.staffShift.findFirst({
      where: {
        id: shiftId,
        isDeleted: false,
      },
    });

    if (!existingShift) {
      throw new NotFoundException('Shift not found');
    }

    const shift = await this.prisma.staffShift.update({
      where: { id: shiftId },
      data: {
        ...(updateDto.userId && { userId: updateDto.userId }),
        ...(updateDto.date && { date: new Date(updateDto.date) }),
        ...(updateDto.startTime && { startTime: updateDto.startTime }),
        ...(updateDto.endTime && { endTime: updateDto.endTime }),
        ...(updateDto.position && { position: updateDto.position }),
        ...(updateDto.status && { status: updateDto.status }),
        ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      id: shift.id,
      userId: shift.userId,
      userName: `${shift.user.firstName} ${shift.user.lastName}`,
      date: shift.date.toISOString().split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      status: shift.status.toLowerCase(),
      notes: shift.notes,
    };
  }

  async deleteShift(shiftId: string, userId: string) {
    const existingShift = await this.prisma.staffShift.findFirst({
      where: {
        id: shiftId,
        isDeleted: false,
      },
    });

    if (!existingShift) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.staffShift.update({
      where: { id: shiftId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { message: 'Shift deleted successfully' };
  }

  // Cafe Schedule
  async getCafeSchedule(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const schedule = await this.prisma.cafeSchedule.findFirst({
      where: {
        date: startOfDay,
        isDeleted: false,
      },
    });

    if (schedule) {
      return {
        date: schedule.date.toISOString().split('T')[0],
        status: schedule.status.toLowerCase(),
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
        specialHours: schedule.specialReason ? {
          reason: schedule.specialReason,
          openTime: schedule.specialOpen,
          closeTime: schedule.specialClose,
        } : undefined,
        notes: schedule.notes,
      };
    }

    // Return default schedule based on day of week and holidays
    return this.getDefaultCafeSchedule(date);
  }

  async updateCafeSchedule(updateDto: UpdateCafeScheduleDto, userId: string) {
    const date = new Date(updateDto.date);
    date.setHours(0, 0, 0, 0);

    const schedule = await this.prisma.cafeSchedule.upsert({
      where: { date },
      update: {
        status: updateDto.status,
        openTime: updateDto.openTime,
        closeTime: updateDto.closeTime,
        specialReason: updateDto.specialReason,
        specialOpen: updateDto.specialOpen,
        specialClose: updateDto.specialClose,
        notes: updateDto.notes,
      },
      create: {
        date,
        status: updateDto.status,
        openTime: updateDto.openTime,
        closeTime: updateDto.closeTime,
        specialReason: updateDto.specialReason,
        specialOpen: updateDto.specialOpen,
        specialClose: updateDto.specialClose,
        notes: updateDto.notes,
        createdBy: userId,
      },
    });

    return {
      date: schedule.date.toISOString().split('T')[0],
      status: schedule.status.toLowerCase(),
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      specialHours: schedule.specialReason ? {
        reason: schedule.specialReason,
        openTime: schedule.specialOpen,
        closeTime: schedule.specialClose,
      } : undefined,
      notes: schedule.notes,
    };
  }

  // Helper method for default cafe schedule
  private getDefaultCafeSchedule(date: Date) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    const holiday = CHILEAN_HOLIDAYS.find(h => h.date === dateStr);

    if (holiday) {
      return {
        date: dateStr,
        status: 'closed',
        specialHours: {
          reason: `Cerrado por ${holiday.name}`,
          openTime: '00:00',
          closeTime: '00:00',
        },
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
          closeTime: '16:00',
        },
      };
    } else if (dayOfWeek === 6) { // Saturday
      return {
        date: dateStr,
        status: 'open',
        openTime: '07:00',
        closeTime: '22:00',
      };
    } else { // Weekdays
      return {
        date: dateStr,
        status: 'open',
        openTime: '06:00',
        closeTime: '20:00',
      };
    }
  }

  // Get tasks with due dates for calendar integration
  async getTasksForCalendar(startDate: Date, endDate: Date) {
    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get task assignments through EntityRelationship system
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        // Get task assignments
        const assignments = await this.prisma.entityRelationship.findMany({
          where: {
            sourceType: 'Task',
            sourceId: task.id,
            relationshipType: 'assigned_to',
            isActive: true,
            isDeleted: false,
          },
          include: {
            targetUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        const assignedUsers = assignments
          .filter(rel => rel.targetUser)
          .map(rel => rel.targetUser);

        return {
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          startTime: task.dueDate,
          endTime: task.dueTime ? new Date(`${task.dueDate?.toISOString().split('T')[0]}T${task.dueTime}`) : null,
          assignedTo: assignedUsers.length > 0 ? assignedUsers[0].id : null,
          priority: task.priority.toLowerCase(),
          status: task.status.toLowerCase(),
          color: this.getTaskPriorityColor(task.priority),
          project: task.project,
          assignees: assignedUsers,
        };
      })
    );

    return tasksWithAssignments;
  }

  private getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return '#DC2626'; // Red
      case 'HIGH':
        return '#EA580C'; // Orange
      case 'MEDIUM':
        return '#F59E0B'; // Yellow
      case 'LOW':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  }

  // Get holidays for a specific year
  async getHolidays(year: number) {
    const holidays = CHILEAN_HOLIDAYS.filter(holiday => 
      new Date(holiday.date).getFullYear() === year
    );

    // Also get any company-specific holiday events from calendar_events
    const companyHolidays = await this.prisma.calendarEvent.findMany({
      where: {
        type: 'HOLIDAY',
        startTime: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
        isDeleted: false,
      },
    });

    const companyHolidayData = companyHolidays.map(event => ({
      date: event.startTime.toISOString().split('T')[0],
      name: event.title,
      type: 'company' as const,
      description: event.description,
    }));

    return [...holidays, ...companyHolidayData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
}