import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

function buildNotificationQueue(): DynamicModule[] {
  if (process.env.DISABLE_QUEUES === 'true') {
    return [];
  }
  // Rely on root BullModule.forRoot configuration from QueueModule
  return [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ];
}

const notifQueueImports = buildNotificationQueue();
const notifProviders = (
  process.env.DISABLE_QUEUES === 'true'
    ? [
        NotificationsService,
        PrismaService,
        AuditService,
      ]
    : [
        NotificationsService,
        NotificationProcessor,
        PrismaService,
        AuditService,
      ]
);

@Module({
  imports: [...notifQueueImports],
  controllers: [NotificationsController],
  providers: notifProviders,
  exports: [NotificationsService],
})
export class NotificationsModule {}
