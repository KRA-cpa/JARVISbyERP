import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Icons from './Icons';

const LiveClock = ({
  showSeconds = true,
  showDate = true,
  showTimezone = true,
  className = "",
  size = "normal" // "small", "normal", "large"
}) => {
  const [philippineTime, setPhilippineTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      // Get current UTC time and convert to Philippine Time (UTC+8)
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const philippineTimeOffset = 8; // UTC+8
      const philippineCurrentTime = new Date(utcTime + (philippineTimeOffset * 3600000));

      setPhilippineTime(philippineCurrentTime);
    };

    // Update immediately
    updateTime();

    // Set up interval to update every second
    const interval = setInterval(updateTime, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    if (showSeconds) {
      return format(date, 'HH:mm:ss');
    }
    return format(date, 'HH:mm');
  };

  const formatDate = (date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatDayOfWeek = (date) => {
    return format(date, 'EEEE');
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'text-sm',
          time: 'font-semibold',
          date: 'text-xs',
          timezone: 'text-xs opacity-75'
        };
      case 'large':
        return {
          container: 'text-lg',
          time: 'font-bold text-xl',
          date: 'text-sm',
          timezone: 'text-sm opacity-75'
        };
      default: // normal
        return {
          container: 'text-base',
          time: 'font-semibold',
          date: 'text-sm',
          timezone: 'text-sm opacity-75'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center space-x-2 ${sizeClasses.container} ${className}`}>
      <Icons.Clock size={size === 'small' ? 16 : size === 'large' ? 24 : 20} className="text-blue-600" />

      <div className="flex flex-col">
        <div className={`${sizeClasses.time} text-gray-900`}>
          {formatTime(philippineTime)}
        </div>

        {showDate && (
          <div className={`${sizeClasses.date} text-gray-600`}>
            {formatDayOfWeek(philippineTime)}, {formatDate(philippineTime)}
          </div>
        )}

        {showTimezone && (
          <div className={`${sizeClasses.timezone} text-gray-500`}>
            GMT+8 (Philippine Time)
          </div>
        )}
      </div>
    </div>
  );
};

// Compact version for headers/navbars
export const CompactClock = ({ className = "" }) => (
  <LiveClock
    showSeconds={false}
    showDate={false}
    showTimezone={false}
    size="small"
    className={className}
  />
);

// Full detailed version for dashboards
export const DetailedClock = ({ className = "" }) => (
  <LiveClock
    showSeconds={true}
    showDate={true}
    showTimezone={true}
    size="large"
    className={className}
  />
);

// Header version with minimal info
export const HeaderClock = ({ className = "" }) => (
  <div className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}>
    <Icons.Clock size={16} />
    <span className="font-medium">
      {format(
        new Date(Date.now() + (8 * 60 * 60 * 1000)), // UTC+8
        'HH:mm'
      )}
    </span>
    <span className="text-xs opacity-75">PHT</span>
  </div>
);

export default LiveClock;