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
export const useDropdownLists = () => {
  return useAPI(() => API.Dropdowns.getLists());
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
export const useWorkflowSteps = (ticketTypeId) => {
  return useAPIData(
    ['workflow_steps', ticketTypeId],
    () => API.WorkflowSteps.getByTicketType(ticketTypeId),
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

export default {
  useAPI,
  useCompanies,
  useRoles,
  useDropdownLists,
  useTickets,
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
  useAPIConnection
};