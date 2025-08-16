import { Module } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CostsController],
  providers: [CostsService, PrismaService],
  exports: [CostsService],
})
export class CostsModule {}
