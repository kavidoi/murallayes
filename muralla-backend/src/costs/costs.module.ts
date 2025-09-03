import { Module } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
  imports: [StorageModule, RelationshipsModule],
  controllers: [CostsController],
  providers: [CostsService, PrismaService],
  exports: [CostsService],
})
export class CostsModule {}
