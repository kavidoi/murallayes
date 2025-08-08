import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  async onModuleInit() {
    await this.$connect();
  }

  // Added for Prisma v6 compatibility – some generated types expect this method
  $queryRawUnsafe<T = unknown>(query: string, ...params: any[]): Prisma.PrismaPromise<T> {
    // @ts-ignore – not part of current PrismaClient but exists in some flavours; fallback to $queryRaw
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // Forward to the underlying (possibly hidden) implementation if present
    // Fallback to $queryRaw
    return (this as any).$queryRawUnsafe?.(query, ...params) ?? (this as any).$queryRaw?.(query, ...params);
  }
}
