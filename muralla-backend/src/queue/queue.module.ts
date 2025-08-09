import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { TaskProcessor } from './processors/task.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { WebsocketModule } from '../websocket/websocket.module';

function buildBullRoot(): DynamicModule | null {
  if (process.env.DISABLE_QUEUES === 'true') {
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const host = url.hostname;
      const port = parseInt(url.port || '6379', 10);
      const password = url.password || undefined;
      return BullModule.forRoot({
        redis: { host, port, password },
      });
    } catch (_e) {
      // Fallback to host/port below
    }
  }

  return BullModule.forRoot({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
  });
}

const bullRoot = buildBullRoot();

@Module({
  imports: [
    WebsocketModule,
    ...(bullRoot ? [bullRoot] : []),
    ...(process.env.DISABLE_QUEUES === 'true'
      ? []
      : [
          BullModule.registerQueue(
            { name: 'tasks' },
            { name: 'notifications' },
            { name: 'emails' },
          ),
        ]),
  ],
  providers: [QueueService, TaskProcessor, NotificationProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
