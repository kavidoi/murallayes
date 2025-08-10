import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AuthService } from '../../../services/authService';

interface Shift {
  id: string;
  userId: string;
  userName: string;
  roleName?: string;
  location: 'CAFE' | 'REMOTE';
  startAt: string;
  endAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
}

interface AttendanceRecord {
  id: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: string;
  location: 'CAFE' | 'REMOTE';
  minutesWorked?: number;
  notes?: string;
}

const MyShifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockSubmitting, setClockSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
      const s = await AuthService.apiCall<{ shifts: Shift[] }>(`/api/shifts/me?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setShifts(s.shifts || []);
      const r = await AuthService.apiCall<{ records: AttendanceRecord[] }>(`/api/attendance/me?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setAttendance(r.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const clockIn = async (location: 'CAFE' | 'REMOTE') => {
    setClockSubmitting(true);
    try {
      await AuthService.apiCall(`/api/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      await load();
    } catch (e) {
      alert('Failed to clock in');
    } finally {
      setClockSubmitting(false);
    }
  };

  const clockOut = async () => {
    setClockSubmitting(true);
    try {
      await AuthService.apiCall(`/api/attendance/clock-out`, { method: 'POST' });
      await load();
    } catch (e) {
      alert('Failed to clock out');
    } finally {
      setClockSubmitting(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const openRecord = attendance.find(a => a.status === 'OPEN');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clock</CardTitle>
        </CardHeader>
        <CardContent>
          {openRecord ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Checked in at</div>
                <div className="text-xl font-semibold">{formatTime(openRecord.checkInAt!)}</div>
              </div>
              <button disabled={clockSubmitting} onClick={clockOut} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">Clock out</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button disabled={clockSubmitting} onClick={() => clockIn('CAFE')} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">Clock in (Café)</button>
              <button disabled={clockSubmitting} onClick={() => clockIn('REMOTE')} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">Clock in (Remote)</button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : shifts.length === 0 ? (
            <div className="text-neutral-500">No assigned shifts</div>
          ) : (
            <div className="space-y-3">
              {shifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <div className="font-medium">{formatDate(shift.startAt)} • {formatTime(shift.startAt)}–{formatTime(shift.endAt)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">{shift.roleName || 'Shift'} • {shift.location === 'CAFE' ? 'Café' : 'Remote'}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">{shift.status}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-neutral-500">No records</div>
          ) : (
            <div className="space-y-3">
              {attendance.map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <div className="font-medium">{rec.checkInAt ? formatDate(rec.checkInAt) : ''} {rec.checkInAt ? `${formatTime(rec.checkInAt)}${rec.checkOutAt ? `–${formatTime(rec.checkOutAt)}` : ''}` : ''}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">{rec.location === 'CAFE' ? 'Café' : 'Remote'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{rec.minutesWorked ? `${rec.minutesWorked} min` : rec.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyShifts; 