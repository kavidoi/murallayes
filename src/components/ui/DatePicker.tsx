import React, { useState, useRef, useEffect } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export interface DatePickerProps {
  value?: string;
  onChange: (date: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
  minDate?: string;
  maxDate?: string;
  format?: 'dd/MM/yyyy' | 'MM/dd/yyyy';
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  date: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  required = false,
  className = '',
  label,
  error,
  minDate,
  maxDate,
  format = 'dd/MM/yyyy'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse date from string value
  useEffect(() => {
    if (value) {
      let date: Date;
      if (value.includes('/')) {
        // Handle DD/MM/YYYY format
        const [day, month, year] = value.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Handle ISO format YYYY-MM-DD
        date = new Date(value);
      }
      
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
        setDisplayValue(formatDate(date, format));
      }
    } else {
      setSelectedDate(null);
      setDisplayValue('');
    }
  }, [value, format]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date, format: string): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'MM/dd/yyyy') {
      return `${month}/${day}/${year}`;
    }
    return `${day}/${month}/${year}`;
  };

  const parseDisplayValue = (input: string): Date | null => {
    // Handle DD/MM/YYYY or MM/DD/YYYY format
    const parts = input.split('/');
    if (parts.length === 3) {
      const [first, second, year] = parts.map(Number);
      if (format === 'MM/dd/yyyy') {
        return new Date(year, first - 1, second);
      } else {
        return new Date(year, second - 1, first);
      }
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    // Try to parse the input
    const parsedDate = parseDisplayValue(input);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      setSelectedDate(parsedDate);
      setCurrentDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
      onChange(formatDate(parsedDate, 'dd/MM/yyyy'));
    } else if (input === '') {
      setSelectedDate(null);
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    const startDayOfWeek = firstDay.getDay();
    
    // Adjust for Monday start (Spanish calendar)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - adjustedStart);

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
      const isToday = currentDay.getTime() === today.getTime();
      const isSelected = selectedDate && currentDay.getTime() === selectedDate.getTime();

      days.push({
        day: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        isSelected: !!isSelected,
        date: new Date(currentDay)
      });
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDisplayValue(formatDate(date, format));
    onChange(formatDate(date, 'dd/MM/yyyy'));
    setIsOpen(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    handleDateSelect(today);
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleClearClick = () => {
    setSelectedDate(null);
    setDisplayValue('');
    onChange(null);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return true;
    }
    return false;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10 border rounded-md shadow-sm
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:cursor-not-allowed"
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => handleMonthChange('next')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => !isDateDisabled(day.date) && handleDateSelect(day.date)}
                disabled={isDateDisabled(day.date)}
                className={`
                  p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${day.isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
                  ${day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold' : ''}
                  ${day.isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isDateDisabled(day.date) ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Hoy
            </button>
            
            <button
              type="button"
              onClick={handleClearClick}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;