import { Module } from '@nestjs/common';
import { UniversalSKUService } from './universal-sku.service';
import { UniversalSKUController } from './universal-sku.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UniversalSKUController],
  providers: [UniversalSKUService],
  exports: [UniversalSKUService],
})
export class SKUModule {}