import React from 'react';
import { useDarkMode } from '../../contexts/DarkModeContext';
import Icons from './Icons';

/**
 * DarkModeToggle Component
 *
 * A toggle button for switching between light and dark modes.
 * Features:
 * - Smooth transition animations
 * - Visual indicators (sun/moon icons)
 * - Accessible design with proper ARIA labels
 * - Compact design suitable for headers and toolbars
 */
const DarkModeToggle = ({ size = 'md', showLabel = false, className = '' }) => {
  const { isDarkMode, toggleDarkMode, isLoading } = useDarkMode();


  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizeClasses = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const translateClasses = {
    sm: isDarkMode ? 'translate-x-4' : 'translate-x-0',
    md: isDarkMode ? 'translate-x-5' : 'translate-x-0',
    lg: isDarkMode ? 'translate-x-6' : 'translate-x-0'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      )}

      <button
        onClick={() => {
          if (toggleDarkMode) {
            toggleDarkMode();
          }
        }}
        disabled={isLoading || !toggleDarkMode}
        className={`
          relative inline-flex items-center ${sizeClasses[size]}
          rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${(isLoading || !toggleDarkMode) ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDarkMode
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-200 hover:bg-gray-300'
          }
        `}
        role="switch"
        aria-checked={isDarkMode}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <span className="sr-only">
          {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        </span>

        {/* Toggle thumb with icon */}
        <span
          className={`
            ${thumbSizeClasses[size]} ${translateClasses[size]}
            pointer-events-none inline-block rounded-full
            bg-white shadow-lg transform ring-0
            transition-transform duration-200 ease-in-out
            flex items-center justify-center
          `}
        >
          {isDarkMode ? (
            <Icons.Moon
              size={iconSizeClasses[size]}
              className="text-blue-600"
            />
          ) : (
            <Icons.Sun
              size={iconSizeClasses[size]}
              className="text-yellow-500"
            />
          )}
        </span>
      </button>

      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Mode
        </span>
      )}
    </div>
  );
};

export default DarkModeToggle;