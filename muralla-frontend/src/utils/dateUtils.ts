/**
 * Date utilities for consistent formatting across the application
 */

export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

/**
 * Format a date to DD/MM/YYYY format (Spanish standard)
 */
export const formatDateDDMMYYYY = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parse DD/MM/YYYY string to Date object
 */
export const parseDDMMYYYY = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  const date = new Date(year, month - 1, day);
  
  // Verify the date is valid (handles cases like 31/02/2024)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

/**
 * Convert date to ISO format (YYYY-MM-DD) for API calls
 * Uses local timezone to prevent date shifting issues
 */
export const dateToISO = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if it's DD/MM/YYYY format
    if (date.includes('/')) {
      const parsed = parseDDMMYYYY(date);
      if (!parsed) return null;
      dateObj = parsed;
    } else {
      // Assume ISO format
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return null;
  
  // Use local timezone instead of UTC to prevent date shifting
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY format
 * Uses local timezone to prevent date shifting issues
 */
export const isoToDDMMYYYY = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  
  // Parse ISO date manually to avoid timezone issues
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  
  // Create date in local timezone
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return '';
  
  return formatDateDDMMYYYY(date);
};

/**
 * Format date with time in Spanish locale
 */
export const formatDateTimeSpanish = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date in Spanish locale with long format
 */
export const formatDateLongSpanish = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Get relative time string (e.g., "hace 2 días", "en 3 días")
 */
export const getRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if it's DD/MM/YYYY format
    if (date.includes('/')) {
      const parsed = parseDDMMYYYY(date);
      if (!parsed) return '';
      dateObj = parsed;
    } else {
      // Assume ISO format or other valid date string
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  // Set both dates to start of day for accurate day comparison
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  
  const diffMs = dateStart.getTime() - nowStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays > 0) return `En ${diffDays} días`;
  return `Hace ${Math.abs(diffDays)} días`;
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if it's DD/MM/YYYY format
    if (date.includes('/')) {
      const parsed = parseDDMMYYYY(date);
      if (!parsed) return false;
      dateObj = parsed;
    } else {
      // Assume ISO format or other valid date string
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  // Set both dates to start of day for accurate comparison
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  
  return dateStart < nowStart;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if it's DD/MM/YYYY format
    if (date.includes('/')) {
      const parsed = parseDDMMYYYY(date);
      if (!parsed) return false;
      dateObj = parsed;
    } else {
      // Assume ISO format or other valid date string
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  return (
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

/**
 * Get month name in Spanish
 */
export const getMonthNameSpanish = (monthIndex: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex] || '';
};

/**
 * Get day name in Spanish
 */
export const getDayNameSpanish = (dayIndex: number): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex] || '';
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 */
export const formatForDateInput = (date: Date | string | null | undefined): string => {
  return dateToISO(date) || '';
};