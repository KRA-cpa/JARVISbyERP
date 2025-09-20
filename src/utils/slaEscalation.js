/**
 * SLA Escalation Engine
 *
 * Handles SLA escalation rules, notifications, and automated actions
 * for the JarvisByERP Ticketing & Workflow Orchestration System
 */

import { addHours, addDays, isBefore, differenceInHours, differenceInDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const PHILIPPINES_TZ = 'Asia/Manila';

/**
 * SLA Escalation Rule Types
 */
export const ESCALATION_TYPES = {
  NOTIFICATION: 'notification',      // Send notification to specific roles
  REASSIGN: 'reassign',             // Reassign ticket to different role/user
  ESCALATE_STEP: 'escalate_step',   // Move ticket to escalation workflow step
  AUTO_APPROVE: 'auto_approve',     // Automatically approve if overdue
  MANAGER_ALERT: 'manager_alert'    // Alert management about SLA breach
};

/**
 * Escalation Trigger Conditions
 */
export const ESCALATION_TRIGGERS = {
  PERCENTAGE: 'percentage',         // Trigger at X% of SLA time
  HOURS_BEFORE: 'hours_before',     // Trigger X hours before due
  OVERDUE_BY: 'overdue_by',        // Trigger when X hours/days overdue
  DUE_TODAY: 'due_today',          // Trigger when ticket becomes due today
  IMMEDIATE: 'immediate'            // Trigger immediately when rule applies
};

/**
 * Default Escalation Rules Templates
 */
export const DEFAULT_ESCALATION_RULES = {
  // Standard 24-hour approval SLA
  APPROVAL_24H: [
    {
      id: 'approval_24h_reminder',
      name: '75% SLA Warning',
      trigger: ESCALATION_TRIGGERS.PERCENTAGE,
      triggerValue: 75,
      action: ESCALATION_TYPES.NOTIFICATION,
      targetRoles: ['approver', 'manager'],
      message: 'Ticket approval required - SLA warning',
      isActive: true,
      priority: 'medium'
    },
    {
      id: 'approval_24h_urgent',
      name: '90% SLA Alert',
      trigger: ESCALATION_TRIGGERS.PERCENTAGE,
      triggerValue: 90,
      action: ESCALATION_TYPES.MANAGER_ALERT,
      targetRoles: ['manager', 'admin'],
      message: 'Urgent: Ticket approval SLA critical',
      isActive: true,
      priority: 'high'
    },
    {
      id: 'approval_24h_overdue',
      name: 'Overdue Escalation',
      trigger: ESCALATION_TRIGGERS.OVERDUE_BY,
      triggerValue: 2, // 2 hours overdue
      triggerUnit: 'hours',
      action: ESCALATION_TYPES.ESCALATE_STEP,
      targetRoles: ['senior_manager'],
      message: 'SLA breached - escalating to senior management',
      isActive: true,
      priority: 'critical'
    }
  ],

  // Standard 8-hour task SLA
  TASK_8H: [
    {
      id: 'task_8h_reminder',
      name: '2 Hours Before Due',
      trigger: ESCALATION_TRIGGERS.HOURS_BEFORE,
      triggerValue: 2,
      action: ESCALATION_TYPES.NOTIFICATION,
      targetRoles: ['assignee'],
      message: 'Task due in 2 hours - please complete',
      isActive: true,
      priority: 'medium'
    }
  ]
};

/**
 * Calculate when escalation rules should trigger
 */
export class SLAEscalationCalculator {
  /**
   * Calculate trigger time for escalation rule
   */
  static calculateTriggerTime(dueDate, escalationRule) {
    if (!dueDate || !escalationRule) return null;

    const dueDatePhilippine = utcToZonedTime(new Date(dueDate), PHILIPPINES_TZ);
    const now = utcToZonedTime(new Date(), PHILIPPINES_TZ);

    switch (escalationRule.trigger) {
      case ESCALATION_TRIGGERS.PERCENTAGE:
        return this.calculatePercentageTrigger(dueDatePhilippine, escalationRule.triggerValue);

      case ESCALATION_TRIGGERS.HOURS_BEFORE:
        return addHours(dueDatePhilippine, -escalationRule.triggerValue);

      case ESCALATION_TRIGGERS.OVERDUE_BY:
        const unit = escalationRule.triggerUnit || 'hours';
        const addFn = unit === 'days' ? addDays : addHours;
        return addFn(dueDatePhilippine, escalationRule.triggerValue);

      case ESCALATION_TRIGGERS.DUE_TODAY:
        // Trigger at start of due date day
        const startOfDay = new Date(dueDatePhilippine);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;

      case ESCALATION_TRIGGERS.IMMEDIATE:
        return now;

      default:
        return null;
    }
  }

  /**
   * Calculate percentage-based trigger time
   */
  static calculatePercentageTrigger(dueDate, percentage) {
    // This is a simplified calculation - in reality, we'd need the ticket creation time
    // For now, assume 24-hour default SLA
    const hoursBeforeDue = Math.floor((24 * (100 - percentage)) / 100);
    return addHours(dueDate, -hoursBeforeDue);
  }

  /**
   * Check if escalation rule should trigger now
   */
  static shouldTrigger(dueDate, escalationRule, lastTriggered = null) {
    const triggerTime = this.calculateTriggerTime(dueDate, escalationRule);
    if (!triggerTime) return false;

    const now = utcToZonedTime(new Date(), PHILIPPINES_TZ);

    // Check if trigger time has passed
    const shouldTriggerNow = isBefore(triggerTime, now) ||
                            Math.abs(differenceInHours(triggerTime, now)) < 1;

    // Don't trigger again if already triggered recently
    if (lastTriggered) {
      const hoursSinceLastTrigger = differenceInHours(now, new Date(lastTriggered));
      if (hoursSinceLastTrigger < 1) return false;
    }

    return shouldTriggerNow;
  }
}

/**
 * SLA Notification Manager
 */
export class SLANotificationManager {
  /**
   * Generate notification content for escalation
   */
  static generateNotification(ticket, escalationRule, slaStatus) {
    const notificationTypes = {
      [ESCALATION_TYPES.NOTIFICATION]: this.generateStandardNotification,
      [ESCALATION_TYPES.MANAGER_ALERT]: this.generateManagerAlert,
      [ESCALATION_TYPES.REASSIGN]: this.generateReassignNotification,
      [ESCALATION_TYPES.ESCALATE_STEP]: this.generateEscalationNotification,
      [ESCALATION_TYPES.AUTO_APPROVE]: this.generateAutoApprovalNotification
    };

    const generator = notificationTypes[escalationRule.action];
    return generator ? generator(ticket, escalationRule, slaStatus) : null;
  }

  /**
   * Generate standard notification
   */
  static generateStandardNotification(ticket, rule, slaStatus) {
    return {
      type: 'sla_warning',
      title: `SLA Alert: ${rule.name}`,
      message: rule.message || `Ticket ${ticket.ticket_number} requires attention - ${slaStatus.label}`,
      priority: rule.priority || 'medium',
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      dueDate: ticket.step_due_date,
      slaStatus: slaStatus.type,
      actionRequired: 'review_ticket',
      targetRoles: rule.targetRoles || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate manager alert
   */
  static generateManagerAlert(ticket, rule, slaStatus) {
    return {
      type: 'sla_breach_alert',
      title: `SLA Breach Alert: ${ticket.ticket_number}`,
      message: `Critical SLA issue requires management attention`,
      priority: 'high',
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      slaStatus: slaStatus.type,
      actionRequired: 'escalation_review',
      targetRoles: ['manager', 'admin'],
      escalationLevel: 'management',
      breachDetails: {
        originalDue: ticket.step_due_date,
        currentStatus: slaStatus.label,
        hoursOverdue: slaStatus.hoursOverdue || 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate reassignment notification
   */
  static generateReassignNotification(ticket, rule, slaStatus) {
    return {
      type: 'sla_reassignment',
      title: `Ticket Reassigned: SLA Escalation`,
      message: `Ticket ${ticket.ticket_number} has been reassigned due to SLA breach`,
      priority: rule.priority || 'high',
      ticketId: ticket.id,
      actionRequired: 'reassignment_complete',
      originalAssignee: ticket.current_assignee,
      newAssignee: rule.targetRoles?.[0],
      reassignmentReason: 'sla_escalation',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate escalation notification
   */
  static generateEscalationNotification(ticket, rule, slaStatus) {
    return {
      type: 'sla_escalation',
      title: `Workflow Escalated: ${ticket.ticket_number}`,
      message: `Ticket has been escalated to higher approval level due to SLA breach`,
      priority: 'critical',
      ticketId: ticket.id,
      actionRequired: 'escalated_approval',
      escalationLevel: 'senior_management',
      originalStep: ticket.current_step_id,
      escalatedTo: rule.targetRoles,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate auto-approval notification
   */
  static generateAutoApprovalNotification(ticket, rule, slaStatus) {
    return {
      type: 'sla_auto_approval',
      title: `Auto-Approved: ${ticket.ticket_number}`,
      message: `Ticket automatically approved due to SLA policy`,
      priority: 'medium',
      ticketId: ticket.id,
      actionRequired: 'none',
      approvalReason: 'sla_auto_approval',
      originalDue: ticket.step_due_date,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * SLA Escalation Engine
 */
export class SLAEscalationEngine {
  constructor() {
    this.activeRules = new Map();
    this.notificationQueue = [];
    this.lastProcessed = new Date();
  }

  /**
   * Register escalation rules for a ticket type or step
   */
  registerEscalationRules(ticketTypeId, stepId, rules) {
    const key = `${ticketTypeId}_${stepId}`;
    this.activeRules.set(key, rules);
  }

  /**
   * Process escalations for a single ticket
   */
  processTicketEscalations(ticket, currentSLA, escalationRules = []) {
    const results = [];

    for (const rule of escalationRules) {
      if (!rule.isActive) continue;

      const shouldTrigger = SLAEscalationCalculator.shouldTrigger(
        ticket.step_due_date,
        rule,
        ticket.last_escalation_triggered
      );

      if (shouldTrigger) {
        const notification = SLANotificationManager.generateNotification(
          ticket,
          rule,
          currentSLA
        );

        if (notification) {
          results.push({
            ruleId: rule.id,
            notification,
            action: rule.action,
            triggered: true,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Process all escalations for tickets
   */
  async processAllEscalations(tickets, getEscalationRules) {
    const results = [];

    for (const ticket of tickets) {
      if (!ticket.step_due_date || ['completed', 'closed', 'rejected'].includes(ticket.status)) {
        continue;
      }

      // Get escalation rules for this ticket
      const rules = await getEscalationRules(ticket.ticket_type_id, ticket.current_step_id);

      if (rules && rules.length > 0) {
        // Get current SLA status
        const slaStatus = this.getCurrentSLAStatus(ticket);

        // Process escalations
        const ticketEscalations = this.processTicketEscalations(ticket, slaStatus, rules);

        if (ticketEscalations.length > 0) {
          results.push({
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            escalations: ticketEscalations
          });
        }
      }
    }

    return results;
  }

  /**
   * Get current SLA status for ticket
   */
  getCurrentSLAStatus(ticket) {
    // Import getSLAStatus dynamically to avoid circular imports
    const { getSLAStatus } = require('./slaCalculator');
    return getSLAStatus(ticket.step_due_date);
  }

  /**
   * Validate escalation rule configuration
   */
  static validateEscalationRule(rule) {
    const errors = [];

    if (!rule.name) errors.push('Rule name is required');
    if (!rule.trigger) errors.push('Trigger type is required');
    if (!rule.action) errors.push('Action type is required');

    if (!Object.values(ESCALATION_TRIGGERS).includes(rule.trigger)) {
      errors.push('Invalid trigger type');
    }

    if (!Object.values(ESCALATION_TYPES).includes(rule.action)) {
      errors.push('Invalid action type');
    }

    if ([ESCALATION_TRIGGERS.PERCENTAGE, ESCALATION_TRIGGERS.HOURS_BEFORE, ESCALATION_TRIGGERS.OVERDUE_BY].includes(rule.trigger)) {
      if (!rule.triggerValue || rule.triggerValue <= 0) {
        errors.push('Trigger value must be greater than 0');
      }
    }

    if (rule.trigger === ESCALATION_TRIGGERS.PERCENTAGE && rule.triggerValue > 100) {
      errors.push('Percentage trigger value cannot exceed 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default SLAEscalationEngine;