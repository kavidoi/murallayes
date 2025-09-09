export const formatDateDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const isoToDDMMYYYY = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  try {
    const date = new Date(isoDate);
    return formatDateDDMMYYYY(date);
  } catch {
    return null;
  }
};

export const dateToISO = (ddmmyyyy?: string | null): string | null => {
  if (!ddmmyyyy) return null;
  try {
    const [day, month, year] = ddmmyyyy.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString();
  } catch {
    return null;
  }
};

export const isOverdue = (ddmmyyyy: string): boolean => {
  try {
    const [day, month, year] = ddmmyyyy.split('/');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  } catch {
    return false;
  }
};

export const isToday = (ddmmyyyy: string): boolean => {
  try {
    const [day, month, year] = ddmmyyyy.split('/');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

export const getRelativeTime = (ddmmyyyy: string): string | null => {
  try {
    const [day, month, year] = ddmmyyyy.split('/');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays < -1 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;
    
    return null; // Return null for dates outside the relative range
  } catch {
    return null;
  }
};
