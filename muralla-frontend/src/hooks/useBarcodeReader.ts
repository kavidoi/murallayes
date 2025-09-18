import { useEffect, useRef, useCallback, useState } from 'react';

interface BarcodeReaderOptions {
  minLength?: number;
  timeout?: number;
  onBarcodeScanned: (barcode: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

interface BarcodeReaderReturn {
  isScanning: boolean;
  lastBarcode: string | null;
  clearBuffer: () => void;
}

/**
 * Custom hook for barcode reader integration
 * Detects rapid keystroke sequences typical of barcode scanners
 */
export const useBarcodeReader = ({
  minLength = 8,
  timeout = 100,
  onBarcodeScanned,
  onError,
  enabled = true
}: BarcodeReaderOptions): BarcodeReaderReturn => {
  const barcodeBuffer = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeystrokeTime = useRef<number>(0);
  const keystrokeCount = useRef<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  const clearBuffer = useCallback(() => {
    barcodeBuffer.current = '';
    keystrokeCount.current = 0;
    setIsScanning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const processBarcode = useCallback(() => {
    const barcode = barcodeBuffer.current.trim();
    
    if (barcode.length >= minLength) {
      // Validate barcode format (basic check for numeric/alphanumeric)
      const isValidBarcode = /^[0-9A-Za-z]+$/.test(barcode);
      
      if (isValidBarcode) {
        setLastBarcode(barcode);
        onBarcodeScanned(barcode);
        console.log(`Barcode scanned: ${barcode}`);
      } else {
        onError?.(`Invalid barcode format: ${barcode}`);
      }
    } else if (barcode.length > 0) {
      onError?.(`Barcode too short: ${barcode} (minimum ${minLength} characters)`);
    }
    
    clearBuffer();
  }, [minLength, onBarcodeScanned, onError, clearBuffer]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Ignore modifier keys and function keys
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }
      
      // Ignore special keys (except Enter which might end barcode)
      if (event.key.length > 1 && event.key !== 'Enter') {
        return;
      }

      // Clear timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check if this is rapid input (barcode scanner characteristic)
      const timeDiff = currentTime - lastKeystrokeTime.current;
      
      if (timeDiff < 50) { // Very fast input suggests barcode scanner
        keystrokeCount.current++;
        setIsScanning(true);
      } else if (timeDiff > 200) {
        // Too slow, likely human input - reset
        clearBuffer();
        keystrokeCount.current = 1;
        setIsScanning(false);
      }

      lastKeystrokeTime.current = currentTime;

      // Add character to buffer (ignore Enter)
      if (event.key !== 'Enter' && event.key.length === 1) {
        barcodeBuffer.current += event.key;
      }

      // Set timeout to process barcode
      timeoutRef.current = setTimeout(() => {
        // Only process if we detected rapid input
        if (keystrokeCount.current >= 5) {
          processBarcode();
        } else {
          clearBuffer();
        }
      }, timeout);
    };

    // Add event listener to document to capture all keystrokes
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, timeout, processBarcode, clearBuffer]);

  return {
    isScanning,
    lastBarcode,
    clearBuffer
  };
};

export default useBarcodeReader;
