/**
 * Utility functions for formatting numbers, prices, and quantities according to Chilean standards
 */

/**
 * Format CLP currency - no decimals, proper thousand separators
 * Examples: $100, $1.000, $29.990, $255.000
 */
export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format numbers without leading zeros and with proper thousand separators
 * Examples: 1, 1.000, 29.990, 255.000
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Format quantities - no leading zeros, no decimals for whole numbers
 */
export const formatQuantity = (quantity: number): string => {
  // Remove any leading zeros and format with Chilean locale
  return Math.round(quantity).toLocaleString('es-CL');
};

/**
 * Format percentages with one decimal place
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format hours with one decimal place
 */
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

/**
 * Format file sizes
 */
export const formatFileSize = (bytes: number): string => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format currency for input fields without currency symbol
 * Examples: 1.000, 29.990, 255.000
 */
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Parse currency string back to number
 * Examples: "1.000" -> 1000, "29.990" -> 29990
 */
export const parseCurrency = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove all non-digit characters except periods (dots)
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  // If empty after cleaning, return 0
  if (!cleanValue) return 0;
  
  // Remove all periods (thousand separators) and convert to number
  const numericValue = cleanValue.replace(/\./g, '');
  
  return parseInt(numericValue, 10) || 0;
};
