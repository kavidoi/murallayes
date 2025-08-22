import { AuthService } from './authService';

export interface TimeEntry {
  id: string;
  staffId: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: 'in-person' | 'remote';
  status: 'clocked-in' | 'clocked-out' | 'manual-entry' | 'pending-approval' | 'approved' | 'rejected';
  totalHours?: number;
  notes?: string;
  isEditable: boolean;
  clockedInAt?: string;
  clockedOutAt?: string;
  breaks?: TimeBreak[];
}

export interface TimeBreak {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  isActive: boolean;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'remote';
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed' | 'cancelled';
  actualStart?: string;
  actualEnd?: string;
  hoursWorked?: number;
  needsApproval?: boolean;
  isManualEntry?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
  currentSession?: WorkSession;
}

export interface WorkSession {
  id: string;
  staffId: string;
  startTime: string;
  type: 'in-person' | 'remote';
  isActive: boolean;
  isPaused: boolean;
  elapsedTime: number; // in minutes
  breaks: TimeBreak[];
  notes?: string;
}

export interface AdminSettings {
  requireApprovalForManualEntries: boolean;
  requireApprovalForClockTimes: boolean;
  allowRemoteWork: boolean;
  autoBreakAfterHours: number;
  maxDailyHours: number;
  enableGeoLocation: boolean;
  allowedLocations?: GeoLocation[];
}

export interface GeoLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface ShiftStats {
  totalStaff: number;
  activeShifts: number;
  pendingApprovals: number;
  totalHoursToday: number;
  avgHoursPerEmployee: number;
  remoteWorkers: number;
  lateArrivals: number;
}

function buildQuery(params: Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const ShiftsService = {
  // Time tracking operations
  async clockIn(type: 'in-person' | 'remote', location?: GeoLocation): Promise<WorkSession> {
    const data = {
      type,
      location,
      timestamp: new Date().toISOString()
    };
    return AuthService.apiCall<WorkSession>('/shifts/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async clockOut(): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>('/shifts/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    });
  },

  async startBreak(): Promise<TimeBreak> {
    return AuthService.apiCall<TimeBreak>('/shifts/break-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    });
  },

  async endBreak(): Promise<TimeBreak> {
    return AuthService.apiCall<TimeBreak>('/shifts/break-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    });
  },

  async getCurrentSession(): Promise<WorkSession | null> {
    try {
      return await AuthService.apiCall<WorkSession>('/shifts/current-session');
    } catch (error) {
      // Return null if no active session
      return null;
    }
  },

  // Time entries management
  async listTimeEntries(params: {
    staffId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<TimeEntry[]> {
    return AuthService.apiCall<TimeEntry[]>(`/time-entries${buildQuery(params)}`);
  },

  async getTimeEntry(id: string): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>(`/time-entries/${id}`);
  },

  async createManualEntry(data: {
    date: string;
    startTime: string;
    endTime: string;
    type: 'in-person' | 'remote';
    notes?: string;
  }): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>('/time-entries/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateTimeEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>(`/time-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async approveTimeEntry(id: string, notes?: string): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>(`/time-entries/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  },

  async rejectTimeEntry(id: string, reason: string): Promise<TimeEntry> {
    return AuthService.apiCall<TimeEntry>(`/time-entries/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  },

  // Shift scheduling
  async listShifts(params: {
    staffId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<Shift[]> {
    return AuthService.apiCall<Shift[]>(`/shifts${buildQuery(params)}`);
  },

  async getMyScheduledShifts(params: {
    dateFrom?: string;
    dateTo?: string;
    includeCompleted?: boolean;
  } = {}): Promise<Shift[]> {
    return AuthService.apiCall<Shift[]>(`/shifts/my-schedule${buildQuery(params)}`);
  },

  async getShift(id: string): Promise<Shift> {
    return AuthService.apiCall<Shift>(`/shifts/${id}`);
  },

  async createShift(data: {
    staffId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'in-person' | 'remote';
    notes?: string;
  }): Promise<Shift> {
    return AuthService.apiCall<Shift>('/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
    return AuthService.apiCall<Shift>(`/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteShift(id: string): Promise<void> {
    return AuthService.apiCall<void>(`/shifts/${id}`, {
      method: 'DELETE',
    });
  },

  async bulkCreateShifts(shifts: Array<{
    staffId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'in-person' | 'remote';
  }>): Promise<Shift[]> {
    return AuthService.apiCall<Shift[]>('/shifts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shifts }),
    });
  },

  // Staff management
  async listStaff(params: {
    isActive?: boolean;
    department?: string;
    role?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<Staff[]> {
    return AuthService.apiCall<Staff[]>(`/staff${buildQuery(params)}`);
  },

  async getStaffMember(id: string): Promise<Staff> {
    return AuthService.apiCall<Staff>(`/staff/${id}`);
  },

  async getActiveStaff(): Promise<Staff[]> {
    return AuthService.apiCall<Staff[]>('/staff/active');
  },

  async getStaffCurrentSessions(): Promise<Staff[]> {
    return AuthService.apiCall<Staff[]>('/staff/current-sessions');
  },

  // Statistics and reporting
  async getShiftStats(params: {
    dateFrom?: string;
    dateTo?: string;
    staffId?: string;
    department?: string;
  } = {}): Promise<ShiftStats> {
    return AuthService.apiCall<ShiftStats>(`/shifts/stats${buildQuery(params)}`);
  },

  async getAttendanceReport(params: {
    dateFrom: string;
    dateTo: string;
    staffId?: string;
    department?: string;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<any> {
    return AuthService.apiCall<any>(`/shifts/attendance-report${buildQuery(params)}`);
  },

  async getHoursReport(params: {
    dateFrom: string;
    dateTo: string;
    staffId?: string;
    department?: string;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<any> {
    return AuthService.apiCall<any>(`/shifts/hours-report${buildQuery(params)}`);
  },

  // Admin settings
  async getAdminSettings(): Promise<AdminSettings> {
    return AuthService.apiCall<AdminSettings>('/shifts/admin-settings');
  },

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    return AuthService.apiCall<AdminSettings>('/shifts/admin-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Geolocation management
  async addLocation(location: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<GeoLocation> {
    return AuthService.apiCall<GeoLocation>('/shifts/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });
  },

  async updateLocation(id: string, location: Partial<GeoLocation>): Promise<GeoLocation> {
    return AuthService.apiCall<GeoLocation>(`/shifts/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });
  },

  async deleteLocation(id: string): Promise<void> {
    return AuthService.apiCall<void>(`/shifts/locations/${id}`, {
      method: 'DELETE',
    });
  },

  async getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Utility functions
  calculateHours(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  },

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  },

  isWithinLocation(current: GeoLocation, allowed: GeoLocation): boolean {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = current.latitude * Math.PI / 180;
    const φ2 = allowed.latitude * Math.PI / 180;
    const Δφ = (allowed.latitude - current.latitude) * Math.PI / 180;
    const Δλ = (allowed.longitude - current.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // Distance in meters
    return distance <= allowed.radius;
  }
};