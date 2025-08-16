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

@Injectable()
class BootstrapService implements OnModuleInit {
  constructor(private users: UsersService) {}
  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    try {
      if (email && password) {
        await this.users.findOrCreateAdmin(email, password);
        // eslint-disable-next-line no-console
        console.log(`Admin ensured from env: ${email}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin bootstrap');
      }
    } catch (e) {
      console.error('Failed to ensure admin user', e);
    }
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      sortSchema: true,
      playground: true,
      installSubscriptionHandlers: true,
    }),
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
