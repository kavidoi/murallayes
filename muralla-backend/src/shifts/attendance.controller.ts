import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AttendanceService, AttendanceLocation } from './attendance.service';
import { ShiftsService } from './shifts.service';

@Controller('api/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService, private shifts: ShiftsService) {}

  @Get()
  @Roles('admin', 'hr_manager', 'manager')
  list(@Query('userId') userId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return { success: true, records: this.attendance.list(userId, from, to) };
  }

  @Get('me')
  listMy(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return { success: true, records: this.attendance.list(req.user?.sub, from, to) };
  }

  @Post('clock-in')
  clockIn(@Request() req: any, @Body() body: { location: AttendanceLocation }) {
    const userId = req.user?.sub;
    const nowIso = new Date().toISOString();
    const nearest = this.shifts.findNearestForUser(userId, nowIso);
    const rec = this.attendance.checkIn(userId, body.location, nearest?.id, nearest?.startAt);
    return { success: true, record: rec };
  }

  @Post('clock-out')
  clockOut(@Request() req: any) {
    const userId = req.user?.sub;
    const open = this.attendance.openForUser(userId);
    const plannedEnd = open?.shiftId ? this.shifts.list(undefined, undefined, userId).find(s => s.id === open.shiftId)?.endAt : undefined;
    const rec = this.attendance.checkOut(userId, plannedEnd);
    return { success: true, record: rec };
  }
} 