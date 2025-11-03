/**
 * DateRangePicker - Flexible Date Range Selection Component
 * مكون متقدم لاختيار الفترة الزمنية مع دعم RTL والـ presets المخصصة
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import {
  DateRange,
  DATE_PRESETS,
  getDateRangePreset,
  formatDate,
  DateRangeSchema,
} from '@/lib/analytics-utils';

// ========================
// Types and Props
// ========================

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  onPresetSelect?: (preset: string) => void;
  
  // Configuration
  enablePresets?: boolean;
  enableCustom?: boolean;
  showTimeSelect?: boolean;
  showTimeZone?: boolean;
  
  // Preset options
  presets?: Array<{
    key: string;
    label: string;
    getValue: () => DateRange;
  }>;
  
  // Customization
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  direction?: 'ltr' | 'rtl';
  
  // Validation
  minDate?: Date;
  maxDate?: Date;
  
  // Callbacks
  onError?: (error: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface QuickPresetProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

// ========================
// Quick Preset Button Component
// ========================

const QuickPresetButton: React.FC<QuickPresetProps> = ({ 
  label, 
  isSelected, 
  onClick, 
  compact = false 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${isSelected 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
        }
        ${compact ? 'px-2 py-1 text-xs' : ''}
        border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      `}
    >
      {label}
    </button>
  );
};

// ========================
// Date Input Component
// ========================

interface DateInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  showTimeSelect?: boolean;
  disabled?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  showTimeSelect = false,
  disabled = false,
  placeholder = '',
  minDate,
  maxDate,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  
  // Format date for input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (showTimeSelect) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    return `${year}-${month}-${day}`;
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue) {
      try {
        const parsedDate = new Date(newValue);
        if (!isNaN(parsedDate.getTime())) {
          onChange(parsedDate);
        }
      } catch (error) {
        console.error('Invalid date format:', error);
      }
    }
  };
  
  // Update input value when prop changes
  useEffect(() => {
    setInputValue(formatDateForInput(value));
  }, [value, showTimeSelect]);
  
  // Format for display
  const displayValue = useMemo(() => {
    return showTimeSelect
      ? formatDate(value, 'medium')
      : formatDate(value, 'medium');
  }, [value, showTimeSelect]);
  
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={showTimeSelect ? 'datetime-local' : 'date'}
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        min={minDate ? formatDateForInput(minDate) : undefined}
        max={maxDate ? formatDateForInput(maxDate) : undefined}
        placeholder={placeholder}
        className={`
          px-3 py-2 border border-gray-300 rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-500
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      />
      <div className="text-xs text-gray-500 mt-1">
        {displayValue}
      </div>
    </div>
  );
};

// ========================
// Main DateRangePicker Component
// ========================

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  onPresetSelect,
  
  // Configuration
  enablePresets = true,
  enableCustom = true,
  showTimeSelect = false,
  showTimeZone = false,
  
  // Preset options
  presets = Object.entries(DATE_PRESETS).map(([key, preset]) => ({
    key,
    label: preset.label,
    getValue: preset.getValue,
  })),
  
  // Customization
  className = '',
  disabled = false,
  placeholder = 'اختر الفترة الزمنية',
  compact = false,
  direction = 'rtl',
  
  // Validation
  minDate,
  maxDate,
  
  // Callbacks
  onError,
  onFocus,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [localDateRange, setLocalDateRange] = useState<DateRange>(value);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Validate date range
  const validateDateRange = (range: DateRange): string | null => {
    if (range.start > range.end) {
      return 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية';
    }
    
    if (minDate && range.start < minDate) {
      return 'تاريخ البداية لا يمكن أن يكون قبل الحد الأدنى المسموح';
    }
    
    if (maxDate && range.end > maxDate) {
      return 'تاريخ النهاية لا يمكن أن يكون بعد الحد الأقصى المسموح';
    }
    
    return null;
  };
  
  // Handle preset selection
  const handlePresetSelect = (presetKey: string) => {
    if (disabled) return;
    
    try {
      const preset = presets.find(p => p.key === presetKey);
      if (!preset) return;
      
      const newRange = preset.getValue();
      const validationError = validateDateRange(newRange);
      
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return;
      }
      
      setSelectedPreset(presetKey);
      setLocalDateRange(newRange);
      setIsCustomMode(false);
      onChange(newRange);
      onPresetSelect?.(presetKey);
      setError('');
      
    } catch (error) {
      const errorMessage = 'خطأ في تطبيق الفترة المحددة';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };
  
  // Handle custom date change
  const handleStartDateChange = (date: Date) => {
    const newRange = { ...localDateRange, start: date };
    const validationError = validateDateRange(newRange);
    
    setLocalDateRange(newRange);
    setError(validationError || '');
    
    if (!validationError) {
      onChange(newRange);
    }
  };
  
  const handleEndDateChange = (date: Date) => {
    const newRange = { ...localDateRange, end: date };
    const validationError = validateDateRange(newRange);
    
    setLocalDateRange(newRange);
    setError(validationError || '');
    
    if (!validationError) {
      onChange(newRange);
    }
  };
  
  // Handle custom mode toggle
  const toggleCustomMode = () => {
    if (disabled) return;
    
    setIsCustomMode(!isCustomMode);
    if (!isCustomMode) {
      setSelectedPreset('');
    }
  };
  
  // Handle apply
  const handleApply = () => {
    const validationError = validateDateRange(localDateRange);
    
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }
    
    onChange(localDateRange);
    setIsOpen(false);
    setError('');
  };
  
  // Handle cancel
  const handleCancel = () => {
    setLocalDateRange(value);
    setSelectedPreset('');
    setIsCustomMode(false);
    setError('');
    setIsOpen(false);
  };
  
  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.date-range-picker')) {
        handleCancel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        handleCancel();
      }
      
      if (event.key === 'Enter' && !error) {
        handleApply();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, error, localDateRange]);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalDateRange(value);
    
    // Find matching preset
    const matchingPreset = presets.find(preset => {
      const presetRange = preset.getValue();
      return presetRange.start.getTime() === value.start.getTime() &&
             presetRange.end.getTime() === value.end.getTime();
    });
    
    if (matchingPreset) {
      setSelectedPreset(matchingPreset.key);
      setIsCustomMode(false);
    } else {
      setSelectedPreset('');
      setIsCustomMode(true);
    }
  }, [value, presets]);
  
  // Format display text
  const displayText = useMemo(() => {
    const startText = formatDate(value.start, compact ? 'short' : 'medium');
    const endText = formatDate(value.end, compact ? 'short' : 'medium');
    return `${startText} - ${endText}`;
  }, [value, compact]);
  
  // Get selected preset label
  const selectedPresetLabel = useMemo(() => {
    const preset = presets.find(p => p.key === selectedPreset);
    return preset?.label || '';
  }, [selectedPreset, presets]);
  
  return (
    <div className={`date-range-picker relative ${className}`}>
      {/* Main Input */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={`
          w-full px-4 py-2 text-left border border-gray-300 rounded-lg
          bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:border-blue-500
          ${disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'text-gray-900 cursor-pointer'
          }
          ${compact ? 'px-3 py-1 text-sm' : ''}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={compact ? 'text-sm' : ''}>
            {selectedPreset && !isCustomMode ? (
              selectedPresetLabel
            ) : (
              displayText
            )}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 ${direction === 'rtl' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className={`
          absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg
          ${direction === 'rtl' ? 'right-0' : 'left-0'}
          ${compact ? 'w-80' : 'w-96'}
        `}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                اختر الفترة الزمنية
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Quick Presets */}
            {enablePresets && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">فترات سريعة</h4>
                <div className={`
                  grid gap-2
                  ${compact ? 'grid-cols-3' : 'grid-cols-2'}
                `}>
                  {presets.map((preset) => (
                    <QuickPresetButton
                      key={preset.key}
                      label={preset.label}
                      isSelected={selectedPreset === preset.key && !isCustomMode}
                      onClick={() => handlePresetSelect(preset.key)}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Custom Date Selection */}
            {enableCustom && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">تواريخ مخصصة</h4>
                  <button
                    type="button"
                    onClick={toggleCustomMode}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isCustomMode ? 'إلغاء التخصيص' : 'تخصيص التواريخ'}
                  </button>
                </div>
                
                {isCustomMode && (
                  <div className="grid grid-cols-2 gap-4">
                    <DateInput
                      label="من"
                      value={localDateRange.start}
                      onChange={handleStartDateChange}
                      showTimeSelect={showTimeSelect}
                      disabled={disabled}
                      minDate={minDate}
                      maxDate={maxDate}
                    />
                    <DateInput
                      label="إلى"
                      value={localDateRange.end}
                      onChange={handleEndDateChange}
                      showTimeSelect={showTimeSelect}
                      disabled={disabled}
                      minDate={minDate}
                      maxDate={maxDate}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!!error || disabled}
                className="
                  px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                  disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                "
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

// ========================
// Additional Helper Components
// ========================

interface DateRangeSummaryProps {
  dateRange: DateRange;
  showPresets?: boolean;
  presets?: Array<{ key: string; label: string }>;
  onPresetChange?: (preset: string) => void;
  className?: string;
}

export const DateRangeSummary: React.FC<DateRangeSummaryProps> = ({
  dateRange,
  showPresets = true,
  presets = Object.entries(DATE_PRESETS).map(([key, preset]) => ({
    key,
    label: preset.label,
  })),
  onPresetChange,
  className = '',
}) => {
  // Find matching preset
  const matchingPreset = useMemo(() => {
    return presets.find(preset => {
      const presetRange = getDateRangePreset(preset.key as keyof typeof DATE_PRESETS);
      return presetRange.start.getTime() === dateRange.start.getTime() &&
             presetRange.end.getTime() === dateRange.end.getTime();
    });
  }, [dateRange, presets]);
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Date Range Display */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-gray-600">
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </span>
      </div>
      
      {/* Preset Badge */}
      {showPresets && matchingPreset && (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {matchingPreset.label}
        </span>
      )}
      
      {/* Duration */}
      <div className="text-xs text-gray-500">
        {Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} يوم
      </div>
    </div>
  );
};