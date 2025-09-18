import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
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
import { ConfigModule } from '@nestjs/config';
import { InvoicingModule } from './invoicing/invoicing.module';

@Injectable()
export class AppBootstrapService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    console.log('🚀 Initializing application...');
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    CustomLoggerModule,
    UsersModule,
    RolesModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    HealthModule,
    InvoicingModule,
  ],
  controllers: [AppController, MetricsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AbilitiesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    PrismaService,
    AuditService,
    PaginationService,
    AbilityFactory,
    MetricsService,
    AppBootstrapService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpsRedirectMiddleware).forRoutes('*');
  }
}