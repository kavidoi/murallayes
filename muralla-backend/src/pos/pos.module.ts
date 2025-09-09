import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PosController } from './pos.controller';
import { PosSyncService } from './pos-sync.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [PosController],
  providers: [PosSyncService],
  exports: [PosSyncService],
})
export class PosModule {}