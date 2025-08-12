import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memoryHealth.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memoryHealth.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }

  @Public()
  @SkipThrottle()
  @Get('readyz')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      async () => {
        // Check if we can perform basic database operations
        try {
          await this.prisma.user.count();
          return { database_operations: { status: 'up' } };
        } catch (error) {
          throw new Error('Database operations failed');
        }
      },
    ]);
  }

  @Public()
  @SkipThrottle()
  @Get('healthz')
  liveness() {
    return { status: 'up', timestamp: new Date().toISOString() };
  }
}
