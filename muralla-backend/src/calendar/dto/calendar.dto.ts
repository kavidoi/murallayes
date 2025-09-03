import { IsString, IsOptional, IsArray, IsDateString, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export enum CalendarEventType {
  TASK = 'TASK',
  MEETING = 'MEETING',
  HOLIDAY = 'HOLIDAY',
  SHIFT = 'SHIFT',
  CAFE_STATUS = 'CAFE_STATUS'
}

export enum CalendarPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum CafeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIMITED = 'LIMITED'
}

export class CreateEventDto {
  @IsEnum(CalendarEventType)
  type: CalendarEventType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(CalendarPriority)
  priority?: CalendarPriority;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  color?: string;

  // Recurring event fields
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringType?: string; // 'daily', 'weekly', 'monthly'

  @IsOptional()
  @IsNumber()
  recurringInterval?: number;

  @IsOptional()
  @IsDateString()
  recurringEndDate?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(CalendarPriority)
  priority?: CalendarPriority;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateShiftDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string;

  @IsString()
  startTime: string; // HH:MM format

  @IsString()
  endTime: string; // HH:MM format

  @IsString()
  position: string;

  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCafeScheduleDto {
  @IsDateString()
  date: string;

  @IsEnum(CafeStatus)
  status: CafeStatus;

  @IsOptional()
  @IsString()
  openTime?: string; // HH:MM format

  @IsOptional()
  @IsString()
  closeTime?: string; // HH:MM format

  @IsOptional()
  @IsString()
  specialReason?: string;

  @IsOptional()
  @IsString()
  specialOpen?: string; // HH:MM format

  @IsOptional()
  @IsString()
  specialClose?: string; // HH:MM format

  @IsOptional()
  @IsString()
  notes?: string;
}