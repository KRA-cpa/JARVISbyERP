import React, { useState, useEffect } from 'react';
import Icons from './Icons';

/**
 * DateRangeInput Component
 *
 * Provides a date range picker with validation for custom fields of type 'daterange':
 * - Start and end date selection
 * - Validation to ensure end date is after start date
 * - Clean, user-friendly interface
 * - Integration with custom field form systems
 */
const DateRangeInput = ({
  value = { startDate: '', endDate: '' },
  onChange,
  disabled = false,
  required = false,
  label = 'Date Range',
  error = '',
  className = ''
}) => {
  const [startDate, setStartDate] = useState(value.startDate || '');
  const [endDate, setEndDate] = useState(value.endDate || '');
  const [validationError, setValidationError] = useState('');

  // Update internal state when value prop changes
  useEffect(() => {
    setStartDate(value.startDate || '');
    setEndDate(value.endDate || '');
  }, [value]);

  // Validate date range
  const validateRange = (start, end) => {
    if (!start && !end) {
      return required ? 'Date range is required' : '';
    }

    if (start && !end) {
      return 'End date is required when start date is provided';
    }

    if (!start && end) {
      return 'Start date is required when end date is provided';
    }

    if (start && end && new Date(start) >= new Date(end)) {
      return 'End date must be after start date';
    }

    return '';
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    const validationErr = validateRange(newStartDate, endDate);
    setValidationError(validationErr);

    // Call parent onChange
    if (onChange) {
      onChange({
        startDate: newStartDate,
        endDate: endDate,
        isValid: !validationErr,
        error: validationErr
      });
    }
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    const validationErr = validateRange(startDate, newEndDate);
    setValidationError(validationErr);

    // Call parent onChange
    if (onChange) {
      onChange({
        startDate: startDate,
        endDate: newEndDate,
        isValid: !validationErr,
        error: validationErr
      });
    }
  };

  // Clear date range
  const clearRange = () => {
    setStartDate('');
    setEndDate('');
    setValidationError('');

    if (onChange) {
      onChange({
        startDate: '',
        endDate: '',
        isValid: !required,
        error: required ? 'Date range is required' : ''
      });
    }
  };

  // Calculate duration
  const getDuration = () => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const displayError = error || validationError;
  const duration = getDuration();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Date Inputs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              disabled={disabled}
              className={`block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                displayError ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icons.Calendar size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              disabled={disabled}
              min={startDate} // Prevent selecting end date before start date
              className={`block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                displayError ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icons.Calendar size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Duration and Clear Button */}
      {(startDate || endDate) && !disabled && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {duration && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Icons.Clock size={12} className="mr-1" />
                {duration}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={clearRange}
            className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
          >
            <Icons.X size={12} className="mr-1" />
            Clear
          </button>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p className="text-sm text-red-600 flex items-center">
          <Icons.Warning size={14} className="mr-1 flex-shrink-0" />
          {displayError}
        </p>
      )}

      {/* Helper Text */}
      {!displayError && !disabled && (
        <p className="text-xs text-gray-500">
          Select a start and end date for this period. End date must be after start date.
        </p>
      )}
    </div>
  );
};

export default DateRangeInput;