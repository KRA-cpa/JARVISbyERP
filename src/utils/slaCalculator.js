/**
 * SLA Calculator Utility
 *
 * Handles Service Level Agreement (SLA) calculations for workflow steps
 * including due date calculations, status determination, and business hours logic.
 *
 * Business Rules:
 * - Philippine timezone (UTC+8) is the default timezone
 * - Weekend exclusion means Saturday and Sunday are not counted
 * - Business hours: 8:00 AM to 5:00 PM (configurable)
 * - SLA status: "On Time", "Due Today", "Overdue", "No SLA"
 */

import {
  addHours,
  addDays,
  isWeekend,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  differenceInHours,
  differenceInDays,
  format,
  parseISO
} from 'date-fns';
// Note: Using simplified timezone handling without date-fns-tz dependency

// Philippine timezone configuration

// Business hours configuration (24-hour format)
const BUSINESS_HOURS = {
  start: 8, // 8:00 AM
  end: 17,  // 5:00 PM
  hoursPerDay: 9 // 8 AM to 5 PM = 9 hours
};

/**
 * SLA Calculator Class
 * Core business logic for all SLA-related calculations
 */
export class SLACalculator {

  /**
   * Validate SLA configuration before calculations
   * @param {Object} slaConfig - SLA configuration to validate
   * @returns {Object} Validation result with errors array
   */
  static validateSLAConfig(slaConfig) {
    const errors = [];

    if (!slaConfig) {
      errors.push('SLA configuration is required');
      return { isValid: false, errors };
    }

    // Validate duration
    if (slaConfig.duration === null || slaConfig.duration === undefined) {
      errors.push('SLA duration is required');
    } else {
      const duration = parseFloat(slaConfig.duration);
      if (isNaN(duration) || duration <= 0) {
        errors.push('SLA duration must be a positive number');
      } else if (duration > 8760 && slaConfig.unit === 'hours') {
        errors.push('SLA duration cannot exceed 8760 hours (1 year)');
      } else if (duration > 365 && slaConfig.unit === 'days') {
        errors.push('SLA duration cannot exceed 365 days (1 year)');
      } else if (duration > 100000) {
        errors.push('SLA duration is unreasonably large');
      }
    }

    // Validate unit
    if (!slaConfig.unit) {
      errors.push('SLA unit is required');
    } else if (!['hours', 'days'].includes(slaConfig.unit.toLowerCase())) {
      errors.push('SLA unit must be "hours" or "days"');
    }

    // Validate logical combinations
    if (slaConfig.unit === 'hours' && slaConfig.duration > 24 && slaConfig.excludeWeekends) {
      console.warn('SLA: Using weekend exclusion with hours > 24 may lead to unexpected behavior');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Calculate due date for a workflow step with error handling
   * @param {Date|string} startDate - When the step started
   * @param {number} duration - SLA duration number
   * @param {string} unit - 'hours' or 'days'
   * @param {boolean} excludeWeekends - Whether to exclude weekends
   * @param {boolean} businessHoursOnly - Whether to only count business hours
   * @returns {Object} Result object with dueDate or error
   */
  static calculateDueDate(startDate, duration, unit = 'days', excludeWeekends = false, businessHoursOnly = false) {
    try {
      // Validate inputs
      if (!startDate) {
        throw new Error('Start date is required for SLA calculation');
      }

      if (!duration || duration <= 0) {
        throw new Error('SLA duration must be a positive number');
      }

      // Validate SLA configuration
      const validation = this.validateSLAConfig({ duration, unit, excludeWeekends, businessHoursOnly });
      if (!validation.isValid) {
        throw new Error(`Invalid SLA configuration: ${validation.errors.join(', ')}`);
      }

      // Convert to Philippine timezone if needed
      let start;
      try {
        start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
        if (isNaN(start.getTime())) {
          throw new Error('Invalid start date format');
        }
      } catch (dateError) {
        throw new Error('Failed to parse start date: ' + dateError.message);
      }

      const philippineStart = this.toPhilippineTime(start);

      let dueDate;
      if (unit === 'hours') {
        dueDate = this._calculateHoursDueDate(philippineStart, duration, excludeWeekends, businessHoursOnly);
      } else if (unit === 'days') {
        dueDate = this._calculateDaysDueDate(philippineStart, duration, excludeWeekends);
      } else {
        throw new Error(`Invalid SLA unit: ${unit}. Must be 'hours' or 'days'.`);
      }

      // Validate result
      if (!dueDate || isNaN(dueDate.getTime())) {
        throw new Error('SLA calculation resulted in invalid due date');
      }

      // Check for unreasonable future dates (> 2 years)
      const maxFutureDate = addDays(new Date(), 730); // 2 years
      if (dueDate > maxFutureDate) {
        console.warn('SLA due date is more than 2 years in the future:', dueDate);
      }

      return {
        success: true,
        dueDate,
        calculatedAt: new Date(),
        configuration: { duration, unit, excludeWeekends, businessHoursOnly }
      };

    } catch (error) {
      console.error('SLA Calculation Error:', error);
      return {
        success: false,
        error: error.message,
        dueDate: null,
        calculatedAt: new Date()
      };
    }
  }

  /**
   * Calculate due date for hours-based SLA
   * @private
   */
  static _calculateHoursDueDate(startDate, hours, excludeWeekends, businessHoursOnly) {
    if (!businessHoursOnly && !excludeWeekends) {
      // Simple case: just add hours
      return addHours(startDate, hours);
    }

    let currentDate = new Date(startDate);
    let remainingHours = hours;

    while (remainingHours > 0) {
      // Skip weekends if configured
      if (excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        currentDate = this._setToBusinessStart(currentDate);
        continue;
      }

      if (businessHoursOnly) {
        const hoursUntilEndOfBusinessDay = this._getHoursUntilEndOfBusinessDay(currentDate);

        if (remainingHours <= hoursUntilEndOfBusinessDay) {
          // Can finish within current business day
          return addHours(currentDate, remainingHours);
        } else {
          // Move to next business day
          remainingHours -= hoursUntilEndOfBusinessDay;
          currentDate = addDays(currentDate, 1);
          currentDate = this._setToBusinessStart(currentDate);
        }
      } else {
        // Not business hours only, but may exclude weekends
        currentDate = addHours(currentDate, 1);
        remainingHours--;
      }
    }

    return currentDate;
  }

  /**
   * Calculate due date for days-based SLA
   * @private
   */
  static _calculateDaysDueDate(startDate, days, excludeWeekends) {
    if (!excludeWeekends) {
      // Simple case: just add days
      return addDays(startDate, days);
    }

    let currentDate = new Date(startDate);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate = addDays(currentDate, 1);

      // Only count business days
      if (!isWeekend(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * Set time to business start (8:00 AM)
   * @private
   */
  static _setToBusinessStart(date) {
    const newDate = new Date(date);
    newDate.setHours(BUSINESS_HOURS.start, 0, 0, 0);
    return newDate;
  }

  /**
   * Get hours remaining until end of business day
   * @private
   */
  static _getHoursUntilEndOfBusinessDay(date) {
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();

    if (currentHour < BUSINESS_HOURS.start) {
      // Before business hours - return full business day
      return BUSINESS_HOURS.hoursPerDay;
    } else if (currentHour >= BUSINESS_HOURS.end) {
      // After business hours - no time left today
      return 0;
    } else {
      // During business hours - calculate remaining
      const hoursLeft = BUSINESS_HOURS.end - currentHour;
      const minutesLeft = currentMinute > 0 ? -1 + (60 - currentMinute) / 60 : 0;
      return Math.max(0, hoursLeft + minutesLeft);
    }
  }

  /**
   * Determine SLA status for a ticket step
   * @param {Date|string|null} dueDate - When the step is due
   * @param {Date} currentDate - Current date/time (defaults to now)
   * @returns {Object} SLA status object with type, label, color, and urgency
   */
  static getSLAStatus(dueDate, currentDate = new Date()) {
    if (!dueDate) {
      return {
        type: 'no_sla',
        label: 'No SLA',
        color: 'gray',
        urgency: 0,
        isOverdue: false,
        isDueToday: false
      };
    }

    const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    const now = this.toPhilippineTime(currentDate);
    const dueDatePhilippine = this.toPhilippineTime(due);

    // Check if overdue
    if (isAfter(now, dueDatePhilippine)) {
      const hoursOverdue = differenceInHours(now, dueDatePhilippine);
      return {
        type: 'overdue',
        label: `Overdue by ${this._formatDuration(hoursOverdue)}`,
        color: 'red',
        urgency: 3,
        isOverdue: true,
        isDueToday: false,
        hoursOverdue
      };
    }

    // Check if due today
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    if (isAfter(dueDatePhilippine, todayStart) && isBefore(dueDatePhilippine, todayEnd)) {
      const hoursUntilDue = differenceInHours(dueDatePhilippine, now);
      return {
        type: 'due_today',
        label: `Due in ${this._formatDuration(hoursUntilDue)}`,
        color: 'yellow',
        urgency: 2,
        isOverdue: false,
        isDueToday: true,
        hoursUntilDue
      };
    }

    // Due in the future
    const daysUntilDue = differenceInDays(dueDatePhilippine, now);
    return {
      type: 'on_time',
      label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
      color: 'green',
      urgency: 1,
      isOverdue: false,
      isDueToday: false,
      daysUntilDue
    };
  }

  /**
   * Format duration in hours to human-readable format
   * @private
   */
  static _formatDuration(hours) {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      const roundedHours = Math.round(hours);
      return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get SLA configuration for a step
   * @param {Object} step - Workflow step object
   * @returns {Object|null} SLA configuration or null if no SLA
   */
  static getStepSLAConfig(step) {
    if (!step || !step.sla_duration || !step.sla_unit) {
      return null;
    }

    return {
      duration: step.sla_duration,
      unit: step.sla_unit,
      excludeWeekends: step.exclude_weekends || false,
      businessHoursOnly: step.business_hours_only || false
    };
  }

  /**
   * Update ticket due date when moving to a new step
   * @param {Object} ticket - Current ticket object
   * @param {Object} newStep - New workflow step
   * @param {Date} transitionTime - When the transition occurred
   * @returns {Date|null} New due date or null if no SLA
   */
  static updateTicketDueDate(ticket, newStep, transitionTime = new Date()) {
    const slaConfig = this.getStepSLAConfig(newStep);

    if (!slaConfig) {
      return null;
    }

    return this.calculateDueDate(
      transitionTime,
      slaConfig.duration,
      slaConfig.unit,
      slaConfig.excludeWeekends,
      slaConfig.businessHoursOnly
    );
  }

  /**
   * Format date for display in Philippine timezone
   * @param {Date|string} date - Date to format
   * @param {string} formatString - Format pattern (default: 'MMM d, yyyy h:mm a')
   * @returns {string} Formatted date string
   */
  static formatDatePhilippine(date, formatString = 'MMM d, yyyy h:mm a') {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const philippineDate = this.toPhilippineTime(dateObj);

    return format(philippineDate, formatString);
  }

  /**
   * Convert UTC time to Philippine time (UTC+8)
   * @param {Date} date - Date to convert
   * @returns {Date} Date adjusted to Philippine timezone
   */
  static toPhilippineTime(date) {
    if (!date) return new Date();

    const utcDate = new Date(date);
    // Philippine time is UTC+8
    const philippineTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
    return philippineTime;
  }

  /**
   * Get current Philippine time
   * @returns {Date} Current date/time in Philippine timezone
   */
  static getCurrentPhilippineTime() {
    return this.toPhilippineTime(new Date());
  }

  /**
   * Simulate SLA calculation for testing/validation purposes
   * @param {Object} slaConfig - SLA configuration to test
   * @param {Date} testStartDate - Optional start date for simulation (defaults to now)
   * @returns {Object} Simulation result with examples and validation
   */
  static simulateSLA(slaConfig, testStartDate = null) {
    const startDate = testStartDate || this.getCurrentPhilippineTime();
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      examples: [],
      configuration: slaConfig
    };

    try {
      // Validate configuration first
      const validation = this.validateSLAConfig(slaConfig);
      if (!validation.isValid) {
        results.isValid = false;
        results.errors = validation.errors;
        return results;
      }

      // Test calculation with current time
      const calculation = this.calculateDueDate(
        startDate,
        slaConfig.duration,
        slaConfig.unit,
        slaConfig.excludeWeekends,
        slaConfig.businessHoursOnly
      );

      if (!calculation.success) {
        results.isValid = false;
        results.errors.push(`Calculation failed: ${calculation.error}`);
        return results;
      }

      // Generate example scenarios
      const scenarios = [
        { name: 'If started now', startDate: startDate },
        { name: 'If started Monday 9 AM', startDate: this._getNextMondayMorning(startDate) },
        { name: 'If started Friday 4 PM', startDate: this._getNextFridayAfternoon(startDate) },
        { name: 'If started on weekend', startDate: this._getNextSaturdayMorning(startDate) }
      ];

      for (const scenario of scenarios) {
        const scenarioResult = this.calculateDueDate(
          scenario.startDate,
          slaConfig.duration,
          slaConfig.unit,
          slaConfig.excludeWeekends,
          slaConfig.businessHoursOnly
        );

        if (scenarioResult.success) {
          results.examples.push({
            scenario: scenario.name,
            startDate: this.formatDatePhilippine(scenario.startDate),
            dueDate: this.formatDatePhilippine(scenarioResult.dueDate),
            duration: this._formatDuration(differenceInHours(scenarioResult.dueDate, scenario.startDate)),
            businessDaysOnly: slaConfig.excludeWeekends
          });
        }
      }

      // Add warnings for potential issues
      if (slaConfig.unit === 'hours' && slaConfig.duration > 168) {
        results.warnings.push('Duration exceeds 1 week (168 hours). Consider using days instead.');
      }

      if (slaConfig.excludeWeekends && slaConfig.unit === 'hours' && slaConfig.duration < 8) {
        results.warnings.push('Weekend exclusion with short durations may not have significant impact.');
      }

      if (!slaConfig.excludeWeekends && slaConfig.duration > 5 && slaConfig.unit === 'days') {
        results.warnings.push('Consider enabling weekend exclusion for durations longer than 5 days.');
      }

    } catch (error) {
      results.isValid = false;
      results.errors.push(`Simulation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Helper methods for generating test scenarios
   * @private
   */
  static _getNextMondayMorning(fromDate) {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // 0 = Sunday
    date.setDate(date.getDate() + daysUntilMonday);
    date.setHours(9, 0, 0, 0); // 9 AM
    return date;
  }

  static _getNextFridayAfternoon(fromDate) {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    date.setDate(date.getDate() + daysUntilFriday);
    date.setHours(16, 0, 0, 0); // 4 PM
    return date;
  }

  static _getNextSaturdayMorning(fromDate) {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    date.setDate(date.getDate() + daysUntilSaturday);
    date.setHours(10, 0, 0, 0); // 10 AM
    return date;
  }
}

// Convenience functions for common operations
export const calculateSLADueDate = SLACalculator.calculateDueDate.bind(SLACalculator);
export const getSLAStatus = SLACalculator.getSLAStatus.bind(SLACalculator);
export const formatDatePhilippine = SLACalculator.formatDatePhilippine.bind(SLACalculator);
export const getCurrentPhilippineTime = SLACalculator.getCurrentPhilippineTime.bind(SLACalculator);

// Default export
export default SLACalculator;