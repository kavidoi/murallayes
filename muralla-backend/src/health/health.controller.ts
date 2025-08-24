import { Controller, Get, Head } from '@nestjs/common';
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
      async () => {
        // Use direct Prisma query with timeout
        try {
          const queryPromise = this.prisma.$queryRaw`SELECT 1`;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          );
          
          await Promise.race([queryPromise, timeoutPromise]);
          return { database: { status: 'up' } };
        } catch (error) {
          console.warn('[HEALTH] Database check failed:', error.message);
          return { database: { status: 'down', error: error.message } };
        }
      },
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
      async () => {
        // Use direct Prisma query with timeout
        try {
          const queryPromise = this.prisma.$queryRaw`SELECT 1`;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 3000)
          );
          
          await Promise.race([queryPromise, timeoutPromise]);
          return { database: { status: 'up' } };
        } catch (error) {
          console.warn('[HEALTH] Database check failed:', error.message);
          return { database: { status: 'down', error: error.message } };
        }
      },
      async () => {
        // Check if we can perform basic database operations with timeout
        try {
          const countPromise = this.prisma.user.count();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database operations timeout')), 3000)
          );
          
          await Promise.race([countPromise, timeoutPromise]);
          return { database_operations: { status: 'up' } };
        } catch (error) {
          console.warn('[HEALTH] Database operations failed:', error.message);
          return { database_operations: { status: 'down', error: error.message } };
        }
      },
    ]);
  }

  @Public()
  @SkipThrottle()
  @Get('healthz')
  liveness() {
    // eslint-disable-next-line no-console
    console.log('[HEALTH] GET /health/healthz');
    return { status: 'up', timestamp: new Date().toISOString() };
  }

  // Some platforms issue HEAD requests for healthchecks
  @Public()
  @SkipThrottle()
  @Head('healthz')
  headLiveness(): void {
    // eslint-disable-next-line no-console
    console.log('[HEALTH] HEAD /health/healthz');
    return;
  }
}
