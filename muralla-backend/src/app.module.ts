import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { PtoModule } from './pto/pto.module';
import { WebsocketModule } from './websocket/websocket.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './common/audit.service';
import { PaginationService } from './common/pagination.service';
import { AbilityFactory } from './common/abilities.factory';
import { AbilitiesGuard } from './common/abilities.guard';
import { CustomLoggerModule } from './common/logger.module';
import { MetricsService } from './common/metrics.service';
import { MetricsController } from './common/metrics.controller';
import { MetricsInterceptor } from './common/metrics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { HttpsRedirectMiddleware } from './common/https-redirect.middleware';
import { CostsModule } from './costs/costs.module';
import { ProductsModule } from './products/products.module';
import { WorkOrdersModule } from './workorders/workorders.module';
import { BudgetsModule } from './budgets/budgets.module';
import { QueueService } from './queue/queue.service';

@Injectable()
class BootstrapService implements OnModuleInit {
  constructor(private users: UsersService, private queueService: QueueService) {}
  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    try {
      if (email && password) {
        await this.users.findOrCreateAdmin(email, password);
        console.log(`Admin ensured from env: ${email}`);
      } else {
        console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin bootstrap');
      }
    } catch (e) {
      console.error('Failed to ensure admin user', e);
    }

    // Schedule recurring jobs with timeout
    try {
      const jobPromises = Promise.all([
        this.queueService.addDailyReportJob(),
        this.queueService.addWeeklyBackupJob()
      ]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Queue job scheduling timeout')), 5000)
      );
      
      await Promise.race([jobPromises, timeoutPromise]);
      console.log('Scheduled recurring jobs: daily-report and weekly-backup');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn('Skipping queue scheduling (queues may be disabled):', errorMessage);
    }
  }
}

@Module({
  imports: [
    // Temporarily disable GraphQL to allow server startup
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: true,
    //   sortSchema: true,
    //   playground: process.env.NODE_ENV !== 'production',
    //   installSubscriptionHandlers: true,
    //   buildSchemaOptions: {
    //     numberScalarMode: 'integer',
    //   },
    //   context: ({ req }) => ({ req }),
    // }),
    UsersModule,
    RolesModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    KnowledgeModule,
    NotificationsModule,
    InventoryModule,
    PtoModule,
    FinanceModule,
    WebsocketModule,
    QueueModule,
    HealthModule,
    CustomLoggerModule,
    CostsModule,
    ProductsModule,
    WorkOrdersModule,
    BudgetsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [AppController, MetricsController],
  providers: [
    PrismaService,
    AuditService,
    PaginationService,
    AbilityFactory,
    MetricsService,
    BootstrapService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AbilitiesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply HTTPS redirect middleware to all routes
    consumer
      .apply(HttpsRedirectMiddleware)
      .forRoutes('*');
  }
}
