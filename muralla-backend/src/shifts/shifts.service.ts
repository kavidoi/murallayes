import { Injectable } from '@nestjs/common';

export type ShiftLocation = 'CAFE' | 'REMOTE';
export type ShiftStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface PlannedShift {
  id: string;
  userId: string;
  userName: string;
  roleName?: string;
  location: ShiftLocation;
  startAt: string; // ISO
  endAt: string;   // ISO
  status: ShiftStatus;
}

@Injectable()
export class ShiftsService {
  private plannedShifts: PlannedShift[] = [];

  constructor() {
    // Seed a few demo shifts for this week
    const now = new Date();
    const startOfDay = (d: Date, hour: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0).toISOString();
    const plusDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

    for (let offset = -1; offset <= 5; offset++) {
      const day = plusDays(now, offset);
      this.plannedShifts.push({
        id: `sh_${day.toDateString()}_1`,
        userId: 'emp_001',
        userName: 'María García',
        roleName: 'Barista',
        location: 'CAFE',
        startAt: startOfDay(day, 9),
        endAt: startOfDay(day, 17),
        status: 'PUBLISHED',
      });
      this.plannedShifts.push({
        id: `sh_${day.toDateString()}_2`,
        userId: 'emp_002',
        userName: 'Carlos López',
        roleName: 'Cashier',
        location: 'CAFE',
        startAt: startOfDay(day, 10),
        endAt: startOfDay(day, 18),
        status: 'PUBLISHED',
      });
    }
  }

  list(from?: string, to?: string, userId?: string) {
    const fromTs = from ? new Date(from).getTime() : undefined;
    const toTs = to ? new Date(to).getTime() : undefined;
    return this.plannedShifts.filter((s) => {
      if (userId && s.userId !== userId) return false;
      const sTs = new Date(s.startAt).getTime();
      if (fromTs && sTs < fromTs) return false;
      if (toTs && sTs > toTs) return false;
      return true;
    });
  }

  findNearestForUser(userId: string, whenIso: string): PlannedShift | undefined {
    const when = new Date(whenIso).getTime();
    const candidates = this.plannedShifts.filter(s => s.userId === userId);
    let best: PlannedShift | undefined;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const s of candidates) {
      const startTs = new Date(s.startAt).getTime();
      const delta = Math.abs(when - startTs);
      if (delta < bestDelta) {
        best = s;
        bestDelta = delta;
      }
    }
    return best;
  }
} 