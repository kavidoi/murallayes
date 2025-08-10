import { Controller, Get, Query, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ShiftsService } from './shifts.service';

@Controller('api/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private shifts: ShiftsService) {}

  @Get()
  @Roles('admin', 'hr_manager', 'manager')
  list(@Query('from') from?: string, @Query('to') to?: string, @Query('userId') userId?: string) {
    return { success: true, shifts: this.shifts.list(from, to, userId) };
  }

  @Get('me')
  listMine(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const userId = req.user?.sub;
    return { success: true, shifts: this.shifts.list(from, to, userId) };
  }

  @Post('publish')
  @Roles('admin', 'hr_manager')
  publish(@Body() body: any) {
    // Stub for publishing roster
    return { success: true };
  }
} 