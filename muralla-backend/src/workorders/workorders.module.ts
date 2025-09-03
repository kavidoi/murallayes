import { Module } from '@nestjs/common';
import { WorkOrdersService } from './workorders.service';
import { WorkOrdersController } from './workorders.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
  imports: [RelationshipsModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, PrismaService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
