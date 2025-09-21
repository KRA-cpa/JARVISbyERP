/**
 * Custom React hooks for API operations
 * Provides reusable hooks for common API interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '../api/googleSheet';

// Generic API hook
export const useAPI = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, [...dependencies]); // Remove fetchData from dependencies to prevent infinite loops

  return { data, loading, error, refetch: fetchData };
};

// Enhanced API hook with caching and advanced options
export const useAPIData = (key, apiCall, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { enabled = true, staleTime = 0 } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Companies hooks
export const useCompanies = () => {
  return useAPI(() => API.Companies.getAll());
};

export const useCompany = (id) => {
  return useAPI(() => API.Companies.getById(id), [id]);
};

export const useCompanyMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCompany = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Companies.create(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Companies.update(id, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Companies.delete(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCompany, updateCompany, deleteCompany, loading, error };
};

// Ticket Types hooks
export const useTicketTypes = (companyId = null) => {
  return useAPI(() => API.TicketTypes?.getAll(companyId) || API.Tickets.getTicketTypes(companyId), [companyId]);
};

// Roles hooks
export const useRoles = (companyId = null) => {
  return useAPI(() => API.Roles.getAll(companyId), [companyId]);
};

export const useRoleMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createRole = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Roles.create(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Roles.update(id, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Roles.delete(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRole, updateRole, deleteRole, loading, error };
};

// Dropdown hooks
export const useDropdownLists = (companyId = null) => {
  return useAPI(() => API.Dropdowns.getLists(companyId), [companyId]);
};

export const useDropdownOptions = (listId) => {
  return useAPI(() => API.Dropdowns.getOptions(listId), [listId]);
};

export const useDropdownMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createList = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Dropdowns.createList(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateList = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Dropdowns.updateList(id, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Dropdowns.deleteList(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createList, updateList, deleteList, loading, error };
};

// Custom Fields hooks
export const useCustomFields = (ticketTypeId = null) => {
  return useAPI(() => API.CustomFields.getAll(ticketTypeId), [ticketTypeId]);
};

export const useCustomField = (id) => {
  return useAPI(() => API.CustomFields.getById(id), [id]);
};

export const useCustomFieldMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createField = async (fieldData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.CustomFields.create(fieldData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (id, fieldData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.CustomFields.update(id, fieldData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteField = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await API.CustomFields.delete(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createField, updateField, deleteField, loading, error };
};

// Tickets hooks
export const useTickets = (filters = {}) => {
  return useAPI(() => API.Tickets.getAll(filters), [JSON.stringify(filters)]);
};

export const useTicket = (id) => {
  return useAPI(() => API.Tickets.getById(id), [id]);
};

export const useTicketMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTicket = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Tickets.create(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Tickets.update(id, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (id, status, comment = '') => {
    try {
      setLoading(true);
      setError(null);
      const result = await API.Tickets.updateStatus(id, status, comment);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createTicket, updateTicket, updateTicketStatus, loading, error };
};

// User hooks
export const useUsers = () => {
  return useAPI(() => API.Users.getAll());
};

export const useUser = (id) => {
  return useAPI(() => API.Users.getById(id), [id]);
};

// System hooks
export const useSystemHealth = () => {
  return useAPI(() => API.System.getSystemHealth());
};

export const useAPITest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const testResult = await API.System.runTest();
      setResult(testResult);
      return testResult;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { runTest, result, loading, error };
};

// API Connection Test Hook
export const useAPIConnection = () => {
  const [status, setStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = async () => {
    try {
      setLoading(true);
      await API.System.ping();
      setStatus('connected');
      setLastChecked(new Date());
    } catch (error) {
      console.error('API connection test failed:', error);
      setStatus('disconnected');
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return { status, loading, lastChecked, checkConnection };
};

/**
 * Hook for workflow steps data
 */
export const useWorkflowSteps = (ticketTypeId, companyId = null) => {
  return useAPIData(
    ['workflow_steps', ticketTypeId, companyId],
    () => API.WorkflowSteps.getByTicketType(ticketTypeId, companyId),
    {
      enabled: !!ticketTypeId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
};

/**
 * Hook for step approvals
 */
export const useStepApprovals = (ticketId, stepId) => {
  return useAPIData(
    ['step_approvals', ticketId, stepId],
    () => API.StepApprovals.getStepApprovals(ticketId, stepId),
    {
      enabled: !!(ticketId && stepId),
      staleTime: 30 * 1000 // 30 seconds (more frequent updates)
    }
  );
};

/**
 * Hook for checking if user can approve a step
 */
export const useCanUserApprove = (userId, stepId, ticketId = null) => {
  return useAPIData(
    ['can_user_approve', userId, stepId, ticketId],
    () => API.StepApprovals.canUserApprove(userId, stepId, ticketId),
    {
      enabled: !!(userId && stepId),
      staleTime: 2 * 60 * 1000 // 2 minutes
    }
  );
};

/**
 * SLA-related hooks for monitoring due dates and status
 */

/**
 * Hook for getting SLA status of a specific ticket
 */
export const useSLAStatus = (ticketId) => {
  return useAPIData(
    ['sla_status', ticketId],
    async () => {
      if (!ticketId) return null;

      // Get ticket with current step and due date
      const ticket = await API.Tickets.getById(ticketId);
      if (!ticket || !ticket.current_step_id) return null;

      // Get current workflow step
      const step = await API.WorkflowSteps.getById(ticket.current_step_id);
      if (!step) return null;

      // Calculate SLA status using our SLA calculator
      const { getSLAStatus } = await import('../utils/slaCalculator');
      return getSLAStatus(ticket.step_due_date);
    },
    {
      enabled: !!ticketId,
      staleTime: 30 * 1000, // 30 seconds - SLA status changes frequently
      refetchInterval: 60 * 1000 // Refresh every minute for real-time updates
    }
  );
};

/**
 * Hook for getting SLA configuration of a workflow step
 */
export const useWorkflowStepSLA = (stepId) => {
  return useAPIData(
    ['workflow_step_sla', stepId],
    async () => {
      if (!stepId) return null;

      const step = await API.WorkflowSteps.getById(stepId);
      if (!step) return null;

      // Extract SLA configuration using our SLA calculator
      const { SLACalculator } = await import('../utils/slaCalculator');
      return SLACalculator.getStepSLAConfig(step);
    },
    {
      enabled: !!stepId,
      staleTime: 5 * 60 * 1000 // 5 minutes - SLA configs don't change often
    }
  );
};

/**
 * Hook for getting due dates of all tickets for a ticket type
 */
export const useTicketDueDates = (ticketTypeId) => {
  return useAPIData(
    ['ticket_due_dates', ticketTypeId],
    async () => {
      if (!ticketTypeId) return [];

      // Get all tickets for this type
      const tickets = await API.Tickets.getByTicketType(ticketTypeId);
      if (!tickets || tickets.length === 0) return [];

      // Calculate SLA status for each ticket
      const { getSLAStatus } = await import('../utils/slaCalculator');

      return tickets.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        step_due_date: ticket.step_due_date,
        sla_status: getSLAStatus(ticket.step_due_date),
        current_step_id: ticket.current_step_id
      }));
    },
    {
      enabled: !!ticketTypeId,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
    }
  );
};

/**
 * Hook for getting all overdue tickets across the system
 */
export const useSLAOverdueTickets = () => {
  return useAPIData(
    ['sla_overdue_tickets'],
    async () => {
      // Get all active tickets
      const tickets = await API.Tickets.getAll();
      if (!tickets || tickets.length === 0) return [];

      // Filter for overdue tickets
      const { getSLAStatus } = await import('../utils/slaCalculator');

      const overdueTickets = tickets
        .map(ticket => ({
          ...ticket,
          sla_status: getSLAStatus(ticket.step_due_date)
        }))
        .filter(ticket => ticket.sla_status.isOverdue);

      return overdueTickets;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000 // Refresh every minute for real-time monitoring
    }
  );
};

/**
 * Hook for getting all tickets due today
 */
export const useSLADueTodayTickets = () => {
  return useAPIData(
    ['sla_due_today_tickets'],
    async () => {
      // Get all active tickets
      const tickets = await API.Tickets.getAll();
      if (!tickets || tickets.length === 0) return [];

      // Filter for tickets due today
      const { getSLAStatus } = await import('../utils/slaCalculator');

      const dueTodayTickets = tickets
        .map(ticket => ({
          ...ticket,
          sla_status: getSLAStatus(ticket.step_due_date)
        }))
        .filter(ticket => ticket.sla_status.isDueToday);

      return dueTodayTickets;
    },
    {
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
    }
  );
};

/**
 * Hook for getting escalation rules for a ticket type/step
 */
export const useSLAEscalationRules = (ticketTypeId, stepId) => {
  return useAPIData(
    ['sla_escalation_rules', ticketTypeId, stepId],
    async () => {
      if (!ticketTypeId) return [];

      // TODO: Replace with actual API call
      // For now, return mock escalation rules
      const { DEFAULT_ESCALATION_RULES } = await import('../utils/slaEscalation');

      // Return rules filtered by ticket type and step
      return DEFAULT_ESCALATION_RULES.APPROVAL_24H.map(rule => ({
        ...rule,
        ticketTypeId,
        stepId: stepId || 'all',
        id: `${ticketTypeId}_${stepId || 'all'}_${rule.id}`
      }));
    },
    {
      enabled: !!ticketTypeId,
      staleTime: 5 * 60 * 1000 // 5 minutes - escalation rules don't change often
    }
  );
};

/**
 * Hook for managing escalation rule mutations
 */
export const useSLAEscalationMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createEscalationRule = async (ruleData) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        rule: {
          ...ruleData,
          id: `rule_${Date.now()}`,
          created_at: new Date().toISOString()
        }
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEscalationRule = async (ruleId, ruleData) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        rule: {
          ...ruleData,
          id: ruleId,
          updated_at: new Date().toISOString()
        }
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEscalationRule = async (ruleId) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testEscalationRule = async (ruleId, ticketId) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to test rule
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        testResults: {
          ruleId,
          ticketId,
          triggered: true,
          notificationsSent: 1,
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createEscalationRule,
    updateEscalationRule,
    deleteEscalationRule,
    testEscalationRule
  };
};

/**
 * Hook for SLA notification monitoring
 */
export const useSLANotificationMonitor = () => {
  const [notifications, setNotifications] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  const processNotifications = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      // Get all active tickets
      const tickets = await API.Tickets.getAll();
      if (!tickets || tickets.length === 0) return;

      // Filter active tickets with SLA
      const activeTickets = tickets.filter(ticket =>
        ticket.step_due_date &&
        !['completed', 'closed', 'rejected'].includes(ticket.status)
      );

      // Process escalations for each ticket
      const { SLAEscalationEngine } = await import('../utils/slaEscalation');
      const escalationEngine = new SLAEscalationEngine();

      const newNotifications = [];

      for (const ticket of activeTickets) {
        // Get escalation rules for this ticket
        // TODO: Replace with actual API call
        const escalationRules = [];

        if (escalationRules.length > 0) {
          const { getSLAStatus } = await import('../utils/slaCalculator');
          const slaStatus = getSLAStatus(ticket.step_due_date);

          const ticketEscalations = escalationEngine.processTicketEscalations(
            ticket,
            slaStatus,
            escalationRules
          );

          if (ticketEscalations.length > 0) {
            newNotifications.push(...ticketEscalations.map(esc => ({
              ...esc.notification,
              ticketId: ticket.id,
              ruleId: esc.ruleId
            })));
          }
        }
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setLastCheck(new Date());
    } catch (err) {
      console.error('SLA notification monitoring error:', err);
    }
  }, [isMonitoring]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Set up monitoring interval
  useEffect(() => {
    if (!isMonitoring) return;

    // Initial check
    processNotifications();

    // Set up periodic checks (every 5 minutes)
    const interval = setInterval(processNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [processNotifications, isMonitoring]);

  return {
    notifications,
    isMonitoring,
    setIsMonitoring,
    lastCheck,
    clearNotifications,
    removeNotification,
    processNotifications
  };
};

export default {
  useAPI,
  useCompanies,
  useRoles,
  useDropdownLists,
  useTickets,
  useTicketTypes,
  useUsers,
  useWorkflowSteps,
  useStepApprovals,
  useCanUserApprove,
  useCompany,
  useCompanyMutations,
  useRoleMutations,
  useDropdownOptions,
  useDropdownMutations,
  useTicket,
  useTicketMutations,
  useSystemHealth,
  useAPITest,
  useAPIConnection,
  // SLA hooks
  useSLAStatus,
  useWorkflowStepSLA,
  useTicketDueDates,
  useSLAOverdueTickets,
  useSLADueTodayTickets,
  // SLA Escalation hooks
  useSLAEscalationRules,
  useSLAEscalationMutations,
  useSLANotificationMonitor
};