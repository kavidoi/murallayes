/**
 * Barcode validation and processing utilities
 */

export interface BarcodeValidationResult {
  isValid: boolean;
  type: string;
  error?: string;
}

/**
 * Validate barcode format and determine type
 */
export const validateBarcode = (barcode: string): BarcodeValidationResult => {
  if (!barcode || barcode.length < 8) {
    return {
      isValid: false,
      type: 'unknown',
      error: 'Barcode too short (minimum 8 characters)'
    };
  }

  // Remove any whitespace
  const cleanBarcode = barcode.trim();

  // EAN-13 (13 digits)
  if (/^\d{13}$/.test(cleanBarcode)) {
    return {
      isValid: validateEAN13(cleanBarcode),
      type: 'EAN-13',
      error: validateEAN13(cleanBarcode) ? undefined : 'Invalid EAN-13 checksum'
    };
  }

  // EAN-8 (8 digits)
  if (/^\d{8}$/.test(cleanBarcode)) {
    return {
      isValid: validateEAN8(cleanBarcode),
      type: 'EAN-8',
      error: validateEAN8(cleanBarcode) ? undefined : 'Invalid EAN-8 checksum'
    };
  }

  // UPC-A (12 digits)
  if (/^\d{12}$/.test(cleanBarcode)) {
    return {
      isValid: validateUPCA(cleanBarcode),
      type: 'UPC-A',
      error: validateUPCA(cleanBarcode) ? undefined : 'Invalid UPC-A checksum'
    };
  }

  // Code 128 (alphanumeric, variable length)
  if (/^[A-Za-z0-9\-\.\$\/\+\%\s]+$/.test(cleanBarcode) && cleanBarcode.length >= 8) {
    return {
      isValid: true,
      type: 'Code-128'
    };
  }

  // Generic alphanumeric (fallback)
  if (/^[A-Za-z0-9]+$/.test(cleanBarcode)) {
    return {
      isValid: true,
      type: 'Generic'
    };
  }

  return {
    isValid: false,
    type: 'unknown',
    error: 'Invalid barcode format'
  };
};

/**
 * Validate EAN-13 checksum
 */
const validateEAN13 = (barcode: string): boolean => {
  if (barcode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12]);
};

/**
 * Validate EAN-8 checksum
 */
const validateEAN8 = (barcode: string): boolean => {
  if (barcode.length !== 8) return false;
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[7]);
};

/**
 * Validate UPC-A checksum
 */
const validateUPCA = (barcode: string): boolean => {
  if (barcode.length !== 12) return false;
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[11]);
};

/**
 * Format barcode for display
 */
export const formatBarcode = (barcode: string, type: string): string => {
  const clean = barcode.trim();
  
  switch (type) {
    case 'EAN-13':
      // Format as: 1 234567 890123
      return `${clean.slice(0, 1)} ${clean.slice(1, 7)} ${clean.slice(7, 13)}`;
    
    case 'EAN-8':
      // Format as: 1234 5678
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)}`;
    
    case 'UPC-A':
      // Format as: 1 23456 78901 2
      return `${clean.slice(0, 1)} ${clean.slice(1, 6)} ${clean.slice(6, 11)} ${clean.slice(11, 12)}`;
    
    default:
      return clean;
  }
};

/**
 * Generate barcode search terms for fuzzy matching
 */
export const generateBarcodeSearchTerms = (barcode: string): string[] => {
  const terms = [barcode];
  
  // Add partial matches (useful for incomplete scans)
  if (barcode.length > 8) {
    terms.push(barcode.slice(0, -1)); // Remove last digit
    terms.push(barcode.slice(1)); // Remove first digit
  }
  
  // Add formatted versions
  const validation = validateBarcode(barcode);
  if (validation.isValid) {
    const formatted = formatBarcode(barcode, validation.type);
    if (formatted !== barcode) {
      terms.push(formatted);
    }
  }
  
  return [...new Set(terms)]; // Remove duplicates
};
