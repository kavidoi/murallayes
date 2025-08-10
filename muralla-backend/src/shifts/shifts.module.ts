import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { AttendanceService } from './attendance.service';
import { ShiftsController } from './shifts.controller';
import { AttendanceController } from './attendance.controller';

@Module({
  providers: [ShiftsService, AttendanceService],
  controllers: [ShiftsController, AttendanceController],
  exports: [ShiftsService, AttendanceService],
})
export class ShiftsModule {} 