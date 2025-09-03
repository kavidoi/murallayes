import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateEventDto, UpdateEventDto, CreateShiftDto, UpdateCafeScheduleDto } from './dto/calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Calendar Events
  @Get('events')
  async getEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.calendarService.getEvents(
      new Date(startDate),
      new Date(endDate),
      req.user.id
    );
  }

  @Post('events')
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.calendarService.createEvent(createEventDto, req.user.id);
  }

  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req
  ) {
    return this.calendarService.updateEvent(id, updateEventDto, req.user.id);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteEvent(id, req.user.id);
  }

  // Staff Shifts
  @Get('shifts')
  async getShifts(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req
  ) {
    if (date) {
      return this.calendarService.getShiftsByDate(new Date(date));
    }
    if (startDate && endDate) {
      return this.calendarService.getShiftsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
    }
    // Default to current week if no parameters
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return this.calendarService.getShiftsByDateRange(startOfWeek, endOfWeek);
  }

  @Post('shifts')
  async createShift(@Body() createShiftDto: CreateShiftDto, @Request() req) {
    return this.calendarService.scheduleShift(createShiftDto, req.user.id);
  }

  @Patch('shifts/:id')
  async updateShift(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateShiftDto>,
    @Request() req
  ) {
    return this.calendarService.updateShift(id, updateDto, req.user.id);
  }

  @Delete('shifts/:id')
  async deleteShift(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteShift(id, req.user.id);
  }

  // Cafe Schedule
  @Get('cafe-schedule')
  async getCafeSchedule(@Query('date') date: string) {
    return this.calendarService.getCafeSchedule(new Date(date));
  }

  @Put('cafe-schedule')
  async updateCafeSchedule(
    @Body() updateDto: UpdateCafeScheduleDto,
    @Request() req
  ) {
    return this.calendarService.updateCafeSchedule(updateDto, req.user.id);
  }

  // Get tasks with due dates for calendar view
  @Get('tasks')
  async getCalendarTasks(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.calendarService.getTasksForCalendar(
      new Date(startDate),
      new Date(endDate)
    );
  }

  // Get holidays (static data + company holidays)
  @Get('holidays')
  async getHolidays(@Query('year') year: string) {
    return this.calendarService.getHolidays(parseInt(year));
  }
}