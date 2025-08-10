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
  userId: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: string;
  location: 'CAFE' | 'REMOTE';
  minutesWorked?: number;
  notes?: string;
}

const OrgShifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
      const s = await AuthService.apiCall<{ shifts: Shift[] }>(`/api/shifts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setShifts(s.shifts || []);
      const a = await AuthService.apiCall<{ records: AttendanceRecord[] }>(`/api/attendance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setAttendance(a.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const today = new Date();
  const todaysShifts = shifts.filter(s => new Date(s.startAt).toDateString() === today.toDateString());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coverage Today</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : todaysShifts.length === 0 ? (
            <div className="text-neutral-500">No shifts today</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {todaysShifts.map(shift => {
                const hasAttendance = attendance.find(a => a.userId === shift.userId && a.checkInAt && new Date(a.checkInAt).toDateString() === today.toDateString());
                return (
                  <div key={shift.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{shift.userName} • {shift.roleName || 'Shift'}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{formatTime(shift.startAt)}–{formatTime(shift.endAt)} • {shift.location === 'CAFE' ? 'Café' : 'Remote'}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${hasAttendance ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {hasAttendance ? 'On duty' : 'Pending clock-in'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance (Admin only punctuality)</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-neutral-500">No records</div>
          ) : (
            <div className="space-y-3">
              {attendance.map(rec => (
                <div key={rec.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{rec.userId}</div>
                    <div className="text-sm">{rec.minutesWorked ? `${rec.minutesWorked} min` : rec.status}</div>
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {rec.checkInAt ? `${formatDate(rec.checkInAt)} ${formatTime(rec.checkInAt)}` : ''}{rec.checkOutAt ? ` – ${formatTime(rec.checkOutAt)}` : ''} • {rec.location === 'CAFE' ? 'Café' : 'Remote'}
                  </div>
                  {rec.notes && (
                    <div className="text-xs text-neutral-500 mt-1">Note: {rec.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgShifts; 