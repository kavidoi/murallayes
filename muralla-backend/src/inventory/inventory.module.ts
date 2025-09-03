import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TestInventoryController } from './test-inventory.controller';
import { PlatformIntegrationService } from './platform-integration.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InventoryController, TestInventoryController],
  providers: [InventoryService, PlatformIntegrationService, PrismaService],
  exports: [InventoryService, PlatformIntegrationService],
})
export class InventoryModule {}
