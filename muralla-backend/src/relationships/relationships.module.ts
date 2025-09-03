import { Module } from '@nestjs/common';
import { EntityRelationshipService } from './entity-relationship.service';
import { EntityRelationshipController } from './entity-relationship.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntityRelationshipController],
  providers: [EntityRelationshipService],
  exports: [EntityRelationshipService],
})
export class RelationshipsModule {}