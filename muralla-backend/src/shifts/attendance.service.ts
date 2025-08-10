import { Injectable } from '@nestjs/common';

export type AttendanceStatus = 'OK' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'OPEN';
export type AttendanceLocation = 'CAFE' | 'REMOTE';

export interface AttendanceRecord {
  id: string;
  userId: string;
  shiftId?: string;
  checkInAt?: string;  // ISO
  checkOutAt?: string; // ISO
  status: AttendanceStatus;
  location: AttendanceLocation;
  minutesWorked?: number;
  notes?: string;
}

@Injectable()
export class AttendanceService {
  private records: AttendanceRecord[] = [];

  list(userId?: string, from?: string, to?: string) {
    const fromTs = from ? new Date(from).getTime() : undefined;
    const toTs = to ? new Date(to).getTime() : undefined;
    return this.records.filter(r => {
      if (userId && r.userId !== userId) return false;
      const ts = r.checkInAt ? new Date(r.checkInAt).getTime() : 0;
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }

  openForUser(userId: string) {
    return this.records.find(r => r.userId === userId && r.status === 'OPEN');
  }

  checkIn(userId: string, location: AttendanceLocation, shiftId?: string, plannedStartAt?: string) {
    if (this.openForUser(userId)) {
      throw new Error('You already have an open attendance');
    }
    const nowIso = new Date().toISOString();
    let status: AttendanceStatus = 'OK';
    if (plannedStartAt) {
      const plannedTs = new Date(plannedStartAt).getTime();
      const diffMin = Math.round((Date.now() - plannedTs) / 60000);
      if (diffMin > 5) status = 'LATE';
    }
    const rec: AttendanceRecord = {
      id: `att_${Date.now()}`,
      userId,
      shiftId,
      checkInAt: nowIso,
      status: 'OPEN',
      location,
    };
    // Keep original punctuality info in notes (only for admin scope via API)
    if (status === 'LATE') rec.notes = 'Late check-in';
    this.records.unshift(rec);
    return rec;
  }

  checkOut(userId: string, plannedEndAt?: string) {
    const rec = this.openForUser(userId);
    if (!rec) throw new Error('No open attendance found');
    const nowIso = new Date().toISOString();
    rec.checkOutAt = nowIso;
    const minutes = Math.max(0, Math.round((new Date(rec.checkOutAt).getTime() - new Date(rec.checkInAt!).getTime()) / 60000));
    rec.minutesWorked = minutes;
    rec.status = 'OK';
    if (plannedEndAt) {
      const plannedEnd = new Date(plannedEndAt).getTime();
      const diffMin = Math.round((plannedEnd - Date.now()) / 60000);
      if (diffMin > 10) rec.notes = (rec.notes ? rec.notes + '; ' : '') + 'Early leave';
    }
    return rec;
  }
} 