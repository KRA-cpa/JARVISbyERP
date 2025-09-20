import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTickets } from '../../hooks/useAPI';
import { useToast } from './Toast';
import Icons from './Icons';
import {
  SLAEscalationEngine,
  SLANotificationManager,
  DEFAULT_ESCALATION_RULES
} from '../../utils/slaEscalation';
import { getSLAStatus } from '../../utils/slaCalculator';

/**
 * SLA Notification System Component
 *
 * Monitors tickets for SLA breaches and sends automated notifications
 * Runs in the background and provides real-time SLA alerts
 */
const SLANotificationSystem = () => {
  const { user, hasPermission } = useUser();
  const { data: tickets, refetch: refetchTickets } = useTickets();
  const { success, warning, error } = useToast();

  // Component state
  const [isActive, setIsActive] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [escalationEngine] = useState(() => new SLAEscalationEngine());
  const [stats, setStats] = useState({
    ticketsMonitored: 0,
    overdueTickets: 0,
    dueTodayTickets: 0,
    escalationsTriggered: 0
  });

  // Check if user should receive SLA notifications
  const shouldReceiveNotifications = hasPermission('canViewTickets') || hasPermission('canApproveTickets');

  // Process SLA monitoring
  const processSLAMonitoring = useCallback(async () => {
    if (!isActive || !tickets || !shouldReceiveNotifications) return;

    try {
      const activeTickets = tickets.filter(ticket =>
        ticket.step_due_date &&
        !['completed', 'closed', 'rejected'].includes(ticket.status)
      );

      let overdueCount = 0;
      let dueTodayCount = 0;
      let escalationsTriggered = 0;

      const newNotifications = [];

      for (const ticket of activeTickets) {
        const slaStatus = getSLAStatus(ticket.step_due_date);

        // Count statistics
        if (slaStatus.type === 'overdue') overdueCount++;
        if (slaStatus.type === 'due_today') dueTodayCount++;

        // Get escalation rules (mock for now)
        const escalationRules = getEscalationRulesForTicket(ticket);

        // Process escalations
        const ticketEscalations = escalationEngine.processTicketEscalations(
          ticket,
          slaStatus,
          escalationRules
        );

        if (ticketEscalations.length > 0) {
          escalationsTriggered += ticketEscalations.length;
          newNotifications.push(...ticketEscalations.map(esc => ({
            ...esc.notification,
            ticketId: ticket.id,
            ruleId: esc.ruleId
          })));
        }
      }

      // Update statistics
      setStats({
        ticketsMonitored: activeTickets.length,
        overdueTickets: overdueCount,
        dueTodayTickets: dueTodayCount,
        escalationsTriggered
      });

      // Process new notifications
      if (newNotifications.length > 0) {
        await processNotifications(newNotifications);
      }

      setLastCheck(new Date());
    } catch (err) {
      console.error('SLA monitoring error:', err);
    }
  }, [isActive, tickets, shouldReceiveNotifications, escalationEngine]);

  // Get escalation rules for a ticket (mock implementation)
  const getEscalationRulesForTicket = (ticket) => {
    // TODO: Replace with actual API call to get escalation rules
    // For now, return default rules based on ticket type
    return DEFAULT_ESCALATION_RULES.APPROVAL_24H.filter(rule => rule.isActive);
  };

  // Process notifications
  const processNotifications = async (notifications) => {
    const userNotifications = notifications.filter(notification =>
      shouldReceiveNotification(notification)
    );

    for (const notification of userNotifications) {
      await sendNotification(notification);
    }

    setNotificationQueue(prev => [...prev, ...userNotifications]);
  };

  // Check if user should receive specific notification
  const shouldReceiveNotification = (notification) => {
    if (!notification.targetRoles || notification.targetRoles.length === 0) return true;

    // TODO: Check user roles against target roles
    // For now, return true for any user with ticket permissions
    return shouldReceiveNotifications;
  };

  // Send individual notification
  const sendNotification = async (notification) => {
    try {
      // Display toast notification
      switch (notification.priority) {
        case 'critical':
          error(`🚨 ${notification.title}: ${notification.message}`);
          break;
        case 'high':
          warning(`⚠️ ${notification.title}: ${notification.message}`);
          break;
        default:
          success(`📋 ${notification.title}: ${notification.message}`);
      }

      // TODO: Add email notifications, push notifications, etc.
      // TODO: Log notification to backend for audit trail

    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  // Set up monitoring interval
  useEffect(() => {
    if (!isActive || !shouldReceiveNotifications) return;

    // Initial check
    processSLAMonitoring();

    // Set up periodic monitoring (every 5 minutes)
    const interval = setInterval(processSLAMonitoring, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [processSLAMonitoring, isActive, shouldReceiveNotifications]);

  // Manual trigger for testing
  const handleManualCheck = () => {
    processSLAMonitoring();
    success('SLA monitoring check completed');
  };

  // Clear notification queue
  const clearNotifications = () => {
    setNotificationQueue([]);
    success('Notification queue cleared');
  };

  // Don't render if user shouldn't receive notifications
  if (!shouldReceiveNotifications) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-medium text-gray-900">SLA Monitoring</h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </button>

          <button
            onClick={handleManualCheck}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            title="Manual Check"
          >
            <Icons.Refresh size={16} />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.ticketsMonitored}</div>
          <div className="text-sm text-gray-600">Monitored</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overdueTickets}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.dueTodayTickets}</div>
          <div className="text-sm text-gray-600">Due Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.escalationsTriggered}</div>
          <div className="text-sm text-gray-600">Escalations</div>
        </div>
      </div>

      {/* Last Check Time */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>Last checked: {lastCheck.toLocaleTimeString()}</span>
        <span>Next check: {new Date(lastCheck.getTime() + 5 * 60 * 1000).toLocaleTimeString()}</span>
      </div>

      {/* Recent Notifications */}
      {notificationQueue.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Recent Notifications ({notificationQueue.length})
            </h4>
            <button
              onClick={clearNotifications}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notificationQueue.slice(-5).map((notification, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-xs ${
                  notification.priority === 'critical'
                    ? 'bg-red-50 text-red-700'
                    : notification.priority === 'high'
                    ? 'bg-orange-50 text-orange-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="truncate">{notification.message}</div>
                <div className="text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {isActive ? (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icons.Success size={16} className="text-green-600" />
            <span className="text-sm text-green-700">
              SLA monitoring is active. Automatic checks every 5 minutes.
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icons.Warning size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">
              SLA monitoring is paused. Click "Active" to resume monitoring.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SLA Notification Hook
 *
 * Provides access to SLA notification system from other components
 */
export const useSLANotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isMonitoring,
    setIsMonitoring,
    addNotification,
    removeNotification,
    clearNotifications
  };
};

export default SLANotificationSystem;