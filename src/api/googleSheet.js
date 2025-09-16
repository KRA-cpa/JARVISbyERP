/**
 * Google Sheets API Integration Layer
 * Handles all communication with Google Apps Script backend
 * Includes caching, error handling, and mock data fallback
 */

import { ValidationUtils } from './models';

// API Configuration
const CONFIG = {
  APPS_SCRIPT_URL: process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL || '',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development' && !process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL
};

// Simple in-memory cache
class APICache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, data, ttl = CONFIG.CACHE_DURATION) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }
}

const cache = new APICache();

// HTTP Client with retry logic
class HTTPClient {
  static async request(url, options = {}) {
    const config = {
      method: 'GET',
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let lastError;
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        if (attempt < CONFIG.MAX_RETRIES && error.name !== 'AbortError') {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
          continue;
        }
        throw error;
      }
    }
  }
}

// Base API class
class BaseAPI {
  constructor(entityName) {
    this.entityName = entityName;
  }

  getCacheKey(action, params = {}) {
    return `${this.entityName}_${action}_${JSON.stringify(params)}`;
  }

  async makeRequest(action, payload = null, useCache = true) {
    const cacheKey = this.getCacheKey(action, payload);

    // Check cache for GET requests
    if (useCache && !payload && action.startsWith('get')) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = new URL(CONFIG.APPS_SCRIPT_URL);
      url.searchParams.set('action', action);

      if (payload && ['get', 'delete'].includes(action.split(/(?=[A-Z])/).pop()?.toLowerCase())) {
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
          }
        });
      }

      const options = payload && !['get', 'delete'].includes(action.split(/(?=[A-Z])/).pop()?.toLowerCase())
        ? {
            method: 'POST',
            body: JSON.stringify({ action, ...payload })
          }
        : { method: 'GET' };

      const response = await HTTPClient.request(url.toString(), options);

      if (response.status === 'error') {
        throw new Error(response.error || 'API request failed');
      }

      // Cache successful GET requests
      if (useCache && action.startsWith('get')) {
        cache.set(cacheKey, response);
      }

      // Invalidate related cache entries on mutations
      if (['create', 'update', 'delete'].some(verb => action.toLowerCase().includes(verb))) {
        cache.invalidate(this.entityName);
      }

      return response;
    } catch (error) {
      console.error(`API Error [${action}]:`, error);

      // Return mock data in development if API fails
      if (CONFIG.ENABLE_MOCK_DATA) {
        return this.getMockData(action, payload);
      }

      throw new Error(`Failed to ${action}: ${error.message}`);
    }
  }

  getMockData(action, payload) {
    console.warn(`Using mock data for ${this.entityName}.${action}`);
    return {
      status: 'success',
      data: null,
      timestamp: new Date().toISOString()
    };
  }
}

// Company API
class CompanyAPI extends BaseAPI {
  constructor() {
    super('companies');
  }

  async getAll() {
    const response = await this.makeRequest('getCompanies');
    return response.data || [];
  }

  async getById(id) {
    const response = await this.makeRequest('getCompany', { companyId: id });
    return response.data;
  }

  async create(data) {
    if (!data.name?.trim() || !data.code?.trim()) {
      throw new Error('Company name and code are required');
    }

    if (!ValidationUtils.isValidCompanyCode(data.code)) {
      throw new Error('Company code must be 2-8 uppercase letters');
    }

    const response = await this.makeRequest('createCompany', {
      name: data.name.trim(),
      code: data.code.toUpperCase().trim()
    });
    return response.data;
  }

  async update(id, data) {
    const response = await this.makeRequest('updateCompany', {
      id,
      name: data.name?.trim(),
      code: data.code?.toUpperCase().trim()
    });
    return response.data;
  }

  async delete(id) {
    const response = await this.makeRequest('deleteCompany', { id });
    return response.data;
  }

  getMockData(action) {
    const mockCompanies = [
      { id: '1', name: 'Main Office', code: 'MAIN', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
      { id: '2', name: 'Production Division', code: 'PROD', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
      { id: '3', name: 'Sales Department', code: 'SALES', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' }
    ];

    switch (action) {
      case 'getCompanies':
        return { status: 'success', data: mockCompanies };
      case 'getCompany':
        return { status: 'success', data: mockCompanies[0] };
      case 'createCompany':
      case 'updateCompany':
        return { status: 'success', data: { ...mockCompanies[0], id: Date.now().toString() } };
      case 'deleteCompany':
        return { status: 'success', data: { deleted: true } };
      default:
        return super.getMockData(action);
    }
  }
}

// Role API
class RoleAPI extends BaseAPI {
  constructor() {
    super('roles');
  }

  async getAll(companyId = null) {
    const response = await this.makeRequest('getRoles', companyId ? { companyId } : {});
    return response.data || [];
  }

  async create(data) {
    if (!data.name?.trim()) {
      throw new Error('Role name is required');
    }

    const response = await this.makeRequest('createRole', {
      name: data.name.trim(),
      company_id: data.company_id === 'global' ? null : data.company_id
    });
    return response.data;
  }

  async update(id, data) {
    const response = await this.makeRequest('updateRole', {
      id,
      name: data.name?.trim(),
      company_id: data.company_id === 'global' ? null : data.company_id
    });
    return response.data;
  }

  async delete(id) {
    const response = await this.makeRequest('deleteRole', { id });
    return response.data;
  }

  getMockData(action) {
    const mockRoles = [
      { id: '1', name: 'System Admin', company_id: null, created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
      { id: '2', name: 'Company Admin', company_id: '1', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
      { id: '3', name: 'Manager', company_id: '1', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
      { id: '4', name: 'User', company_id: '1', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' }
    ];

    switch (action) {
      case 'getRoles':
        return { status: 'success', data: mockRoles };
      case 'createRole':
      case 'updateRole':
        return { status: 'success', data: { ...mockRoles[0], id: Date.now().toString() } };
      case 'deleteRole':
        return { status: 'success', data: { deleted: true } };
      default:
        return super.getMockData(action);
    }
  }
}

// Dropdown API
class DropdownAPI extends BaseAPI {
  constructor() {
    super('dropdowns');
  }

  async getLists() {
    const response = await this.makeRequest('getDropdownLists');
    return response.data || [];
  }

  async getOptions(listId) {
    const response = await this.makeRequest('getDropdownOptions', { listId });
    return response.data || [];
  }

  async createList(data) {
    if (!data.name?.trim()) {
      throw new Error('Dropdown list name is required');
    }

    if (!data.options || data.options.length === 0) {
      throw new Error('At least one option is required');
    }

    const response = await this.makeRequest('createDropdownList', {
      name: data.name.trim(),
      options: data.options
    });
    return response.data;
  }

  async updateList(id, data) {
    const response = await this.makeRequest('updateDropdownList', {
      id,
      name: data.name?.trim(),
      options: data.options
    });
    return response.data;
  }

  async deleteList(id) {
    const response = await this.makeRequest('deleteDropdownList', { id });
    return response.data;
  }

  getMockData(action) {
    const mockLists = [
      {
        id: '1',
        name: 'Priority Levels',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
        options: [
          { id: '1', label: 'Low', value: 'low', parent_option_id: '' },
          { id: '2', label: 'Medium', value: 'medium', parent_option_id: '' },
          { id: '3', label: 'High', value: 'high', parent_option_id: '' },
          { id: '4', label: 'Critical', value: 'critical', parent_option_id: '' }
        ]
      },
      {
        id: '2',
        name: 'Departments',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
        options: [
          { id: '5', label: 'IT', value: 'it', parent_option_id: '' },
          { id: '6', label: 'HR', value: 'hr', parent_option_id: '' },
          { id: '7', label: 'Finance', value: 'finance', parent_option_id: '' },
          { id: '8', label: 'Operations', value: 'operations', parent_option_id: '' }
        ]
      }
    ];

    switch (action) {
      case 'getDropdownLists':
        return { status: 'success', data: mockLists };
      case 'getDropdownOptions':
        return { status: 'success', data: mockLists[0].options };
      case 'createDropdownList':
      case 'updateDropdownList':
        return { status: 'success', data: { ...mockLists[0], id: Date.now().toString() } };
      case 'deleteDropdownList':
        return { status: 'success', data: { deleted: true } };
      default:
        return super.getMockData(action);
    }
  }
}

// Ticket API
class TicketAPI extends BaseAPI {
  constructor() {
    super('tickets');
  }

  async getAll(filters = {}) {
    const response = await this.makeRequest('getTickets', filters);
    return response.data || [];
  }

  async getById(id) {
    const response = await this.makeRequest('getTicket', { ticketId: id });
    return response.data;
  }

  async create(data) {
    if (!data.title?.trim()) {
      throw new Error('Ticket title is required');
    }

    if (!data.ticket_type_id) {
      throw new Error('Ticket type is required');
    }

    if (!data.company_id) {
      throw new Error('Company ID is required');
    }

    if (!data.requester_id) {
      throw new Error('Requester ID is required');
    }

    const response = await this.makeRequest('createTicket', {
      title: data.title.trim(),
      description: data.description || '',
      ticket_type_id: data.ticket_type_id,
      company_id: data.company_id,
      requester_id: data.requester_id,
      priority: data.priority || 'medium',
      assignee_email: data.assignee_email || '',
      due_date: data.due_date || '',
      custom_fields: data.custom_fields || {},
      customData: data.customData || {}
    });

    // Clear tickets cache since we added a new ticket
    this.cache.invalidate('tickets');

    return response.data;
  }

  /**
   * Get next ticket number preview for a company/ticket type combination
   * @param {string} companyId - Company ID
   * @param {string} ticketTypeId - Ticket type ID
   * @returns {Promise<string>} Next ticket number preview
   */
  async getNextTicketNumber(companyId, ticketTypeId) {
    const response = await this.makeRequest('getNextTicketNumber', {
      company_id: companyId,
      ticket_type_id: ticketTypeId
    });
    return response.data?.ticket_number || 'XXX-XXX-YYYY-XXXX';
  }

  /**
   * Generate and reserve a ticket number
   * @param {string} companyId - Company ID
   * @param {string} ticketTypeId - Ticket type ID
   * @returns {Promise<string>} Generated ticket number
   */
  async generateTicketNumber(companyId, ticketTypeId) {
    const response = await this.makeRequest('generateTicketNumber', {
      company_id: companyId,
      ticket_type_id: ticketTypeId
    });
    return response.data?.ticket_number;
  }

  async update(id, data) {
    const response = await this.makeRequest('updateTicket', {
      id,
      ...data
    });
    return response.data;
  }

  async updateStatus(id, status, comment = '') {
    const response = await this.makeRequest('updateTicketStatus', {
      id,
      status,
      comment: comment.trim()
    });
    return response.data;
  }

  getMockData(action, params = {}) {
    // Handle getNextTicketNumber mock request
    if (action === 'getNextTicketNumber') {
      const companyId = params.company_id || '1';
      const ticketTypeId = params.ticket_type_id || 'purchase_request';

      // Mock company and ticket type lookup
      const mockCompanies = { '1': { code: 'ABC' }, '2': { code: 'XYZ' } };
      const mockTicketTypes = {
        'purchase_request': { code: 'PR' },
        'it_request': { code: 'IT' },
        'maintenance': { code: 'MNT' }
      };

      const company = mockCompanies[companyId] || { code: 'UNK' };
      const ticketType = mockTicketTypes[ticketTypeId] || { code: 'TKT' };
      const year = new Date().getFullYear();
      const nextSequence = Math.floor(Math.random() * 100) + 1; // Mock next sequence

      return {
        success: true,
        data: {
          ticket_number: `${company.code}-${ticketType.code}-${year}-${nextSequence.toString().padStart(4, '0')}`
        }
      };
    }

    const mockTickets = [
      {
        id: '1',
        ticket_number: 'ABC-PR-2025-0001',
        title: 'Purchase Request - Office Supplies',
        ticket_type_id: 'purchase_request',
        requester_id: 'user123',
        status: 'New',
        current_step_id: null,
        step_due_date: null,
        created_at: '2025-01-15T08:00:00.000Z',
        updated_at: '2025-01-15T08:00:00.000Z',
        company_id: '1',
        children: [],
        parent: null
      },
      {
        id: '2',
        ticket_number: 'ABC-IT-2025-0002',
        title: 'Software License Renewal',
        ticket_type_id: 'it_request',
        requester_id: 'user456',
        status: 'In Progress',
        current_step_id: 'step1',
        step_due_date: '2025-01-20T17:00:00.000Z',
        created_at: '2025-01-14T10:30:00.000Z',
        updated_at: '2025-01-15T09:15:00.000Z',
        company_id: '1',
        children: [],
        parent: null
      }
    ];

    switch (action) {
      case 'getTickets':
        return { status: 'success', data: mockTickets };
      case 'getTicket':
        return { status: 'success', data: mockTickets[0] };
      case 'createTicket':
        return {
          status: 'success',
          data: {
            ...mockTickets[0],
            id: Date.now().toString(),
            ticket_number: `MAIN-PR-2025-${String(Date.now()).slice(-8)}`
          }
        };
      case 'updateTicket':
      case 'updateTicketStatus':
        return { status: 'success', data: mockTickets[0] };
      default:
        return super.getMockData(action);
    }
  }
}

// User API
class UserAPI extends BaseAPI {
  constructor() {
    super('users');
  }

  async getProfile(userId) {
    const response = await this.makeRequest('getUserProfile', { userId });
    return response.data;
  }

  async updateProfile(userId, data) {
    const response = await this.makeRequest('updateUserProfile', {
      userId,
      ...data
    });
    return response.data;
  }

  async getRoles(userId) {
    const response = await this.makeRequest('getUserRoles', { userId });
    return response.data || [];
  }

  async assignRole(userId, roleId, companyId = null) {
    const response = await this.makeRequest('assignUserRole', {
      userId,
      roleId,
      companyId
    });
    return response.data;
  }

  async removeRole(userId, roleId, companyId = null) {
    const response = await this.makeRequest('removeUserRole', {
      userId,
      roleId,
      companyId
    });
    return response.data;
  }

  getMockData(action) {
    const mockUser = {
      id: 'user123',
      email: 'admin@example.com',
      displayName: 'System Administrator',
      photoURL: '',
      roles: [
        { id: '1', name: 'System Admin', company_id: null, created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' }
      ],
      companies: [
        { id: '1', name: 'Main Office', code: 'MAIN', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' }
      ]
    };

    switch (action) {
      case 'getUserProfile':
        return { status: 'success', data: mockUser };
      case 'updateUserProfile':
        return { status: 'success', data: mockUser };
      case 'getUserRoles':
        return { status: 'success', data: mockUser.roles };
      case 'assignUserRole':
      case 'removeUserRole':
        return { status: 'success', data: { success: true } };
      default:
        return super.getMockData(action);
    }
  }
}

// System API
class SystemAPI extends BaseAPI {
  constructor() {
    super('system');
  }

  async ping() {
    const response = await this.makeRequest('ping');
    return response;
  }

  async recordLogin(userData) {
    const response = await this.makeRequest('recordLogin', {
      userId: userData.id,
      email: userData.email,
      ipAddress: userData.ipAddress || 'unknown'
    });
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.makeRequest('getSystemHealth');
    return response.data;
  }

  async runTest() {
    const response = await this.makeRequest('runCompleteAPITest');
    return response.data;
  }

  getMockData(action) {
    switch (action) {
      case 'ping':
        return {
          status: 'success',
          data: { message: 'API is healthy', timestamp: new Date().toISOString() }
        };
      case 'recordLogin':
        return {
          status: 'success',
          data: { recorded: true, timestamp: new Date().toISOString() }
        };
      case 'getSystemHealth':
        return {
          status: 'success',
          data: {
            status: 'healthy',
            uptime: '99.9%',
            lastCheck: new Date().toISOString()
          }
        };
      case 'runCompleteAPITest':
        return {
          status: 'success',
          data: {
            passed: 15,
            failed: 0,
            total: 15,
            details: 'All API endpoints working correctly'
          }
        };
      default:
        return super.getMockData(action);
    }
  }
}

// Workflow Steps API
class WorkflowStepsAPI extends BaseAPI {
  constructor() {
    super('workflow_steps');
  }

  async getByTicketType(ticketTypeId) {
    const response = await this.makeRequest('getWorkflowSteps', {
      ticket_type_id: ticketTypeId
    });
    return response.data || [];
  }

  async getById(stepId) {
    const response = await this.makeRequest('getWorkflowStep', {
      step_id: stepId
    });
    return response.data;
  }

  async create(data) {
    if (!data.ticket_type_id) {
      throw new Error('Ticket type ID is required');
    }

    if (!data.name?.trim()) {
      throw new Error('Step name is required');
    }

    if (!data.step_type) {
      throw new Error('Step type is required');
    }

    const response = await this.makeRequest('createWorkflowStep', {
      ticket_type_id: data.ticket_type_id,
      name: data.name.trim(),
      status_on_reach: data.status_on_reach || 'in_progress',
      step_type: data.step_type,
      approver_logic: data.approver_logic || 'any',
      sort_order: data.sort_order || 1,
      next_ticket_type_id: data.next_ticket_type_id || null,
      external_app_url: data.external_app_url || null,
      completion_action_name: data.completion_action_name || null,
      sla_duration: data.sla_duration || null,
      sla_unit: data.sla_unit || null,
      exclude_weekends: data.exclude_weekends || false
    });

    this.cache.invalidate('workflow_steps');
    return response.data;
  }

  async update(stepId, data) {
    const response = await this.makeRequest('updateWorkflowStep', {
      step_id: stepId,
      ...data
    });

    this.cache.invalidate('workflow_steps');
    return response.data;
  }

  async delete(stepId) {
    const response = await this.makeRequest('deleteWorkflowStep', {
      step_id: stepId
    });

    this.cache.invalidate('workflow_steps');
    return response.data;
  }

  async getStepApprovers(stepId) {
    const response = await this.makeRequest('getStepApprovers', {
      step_id: stepId
    });
    return response.data || [];
  }

  async setStepApprovers(stepId, roleIds) {
    const response = await this.makeRequest('setStepApprovers', {
      step_id: stepId,
      role_ids: roleIds
    });

    this.cache.invalidate('step_approvers');
    return response.data;
  }

  getMockData(action, params = {}) {
    if (action === 'getWorkflowSteps') {
      const ticketTypeId = params.ticket_type_id;

      const mockSteps = {
        'purchase_request': [
          {
            id: 'step_pr_1',
            ticket_type_id: 'purchase_request',
            name: 'Manager Approval',
            status_on_reach: 'pending_approval',
            step_type: 'approval',
            approver_logic: 'any',
            sort_order: 1,
            sla_duration: 24,
            sla_unit: 'hours',
            exclude_weekends: false
          },
          {
            id: 'step_pr_2',
            ticket_type_id: 'purchase_request',
            name: 'Finance Review',
            status_on_reach: 'pending_finance',
            step_type: 'approval',
            approver_logic: 'all',
            sort_order: 2,
            sla_duration: 48,
            sla_unit: 'hours',
            exclude_weekends: true
          },
          {
            id: 'step_pr_3',
            ticket_type_id: 'purchase_request',
            name: 'Procurement Processing',
            status_on_reach: 'in_procurement',
            step_type: 'task',
            sort_order: 3,
            external_app_url: 'https://procurement.company.com/process/{ticket_id}',
            completion_action_name: 'Mark Procurement Complete'
          }
        ],
        'it_request': [
          {
            id: 'step_it_1',
            ticket_type_id: 'it_request',
            name: 'IT Manager Review',
            status_on_reach: 'pending_it_approval',
            step_type: 'approval',
            approver_logic: 'any',
            sort_order: 1,
            sla_duration: 4,
            sla_unit: 'hours',
            exclude_weekends: false
          },
          {
            id: 'step_it_2',
            ticket_type_id: 'it_request',
            name: 'Implementation',
            status_on_reach: 'in_implementation',
            step_type: 'task',
            sort_order: 2,
            external_app_url: 'https://ticketing.company.com/implement/{ticket_id}',
            completion_action_name: 'Mark Implementation Complete'
          }
        ]
      };

      return {
        success: true,
        data: mockSteps[ticketTypeId] || []
      };
    }

    if (action === 'getStepApprovers') {
      return {
        success: true,
        data: [
          { id: 'role_manager', name: 'Manager' },
          { id: 'role_finance', name: 'Finance Team' }
        ]
      };
    }

    return super.getMockData(action, params);
  }
}

// Step Approvals API
class StepApprovalsAPI extends BaseAPI {
  constructor() {
    super('step_approvals');
  }

  async getStepApprovals(ticketId, stepId) {
    const response = await this.makeRequest('getStepApprovals', {
      ticket_id: ticketId,
      step_id: stepId
    });
    return response.data || [];
  }

  async submitApproval(ticketId, stepId, userId, action, comment = '') {
    const response = await this.makeRequest('submitStepApproval', {
      ticket_id: ticketId,
      step_id: stepId,
      user_id: userId,
      action: action, // 'approve', 'reject', 'return'
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    });

    this.cache.invalidate('step_approvals');
    this.cache.invalidate('tickets');
    return response.data;
  }

  async canUserApprove(userId, stepId, ticketId = null) {
    const response = await this.makeRequest('canUserApprove', {
      user_id: userId,
      step_id: stepId,
      ticket_id: ticketId
    });
    return response.data?.can_approve || false;
  }

  getMockData(action, params = {}) {
    if (action === 'getStepApprovals') {
      return {
        success: true,
        data: [
          {
            id: 'approval_1',
            ticket_id: params.ticket_id,
            step_id: params.step_id,
            user_id: 'user123',
            user_name: 'John Manager',
            action: 'approve',
            comment: 'Budget approved',
            timestamp: '2025-01-15T10:30:00.000Z'
          }
        ]
      };
    }

    if (action === 'canUserApprove') {
      return {
        success: true,
        data: { can_approve: true }
      };
    }

    return super.getMockData(action, params);
  }
}

// Main API object
export const API = {
  Companies: new CompanyAPI(),
  Roles: new RoleAPI(),
  Dropdowns: new DropdownAPI(),
  Tickets: new TicketAPI(),
  Users: new UserAPI(),
  System: new SystemAPI(),
  WorkflowSteps: new WorkflowStepsAPI(),
  StepApprovals: new StepApprovalsAPI()
};

// Individual API exports for backward compatibility
export const companyAPI = API.Companies;
export const roleAPI = API.Roles;
export const dropdownAPI = API.Dropdowns;
export const ticketAPI = API.Tickets;
export const userAPI = API.Users;
export const systemAPI = API.System;
export const workflowStepsAPI = API.WorkflowSteps;
export const stepApprovalsAPI = API.StepApprovals;

// Utility functions
export const APIUtils = {
  /**
   * Clear all cached data
   */
  clearCache() {
    cache.clear();
    console.log('API cache cleared');
  },

  /**
   * Check if API is configured
   */
  isConfigured() {
    return !!CONFIG.APPS_SCRIPT_URL;
  },

  /**
   * Get API configuration status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      mockMode: CONFIG.ENABLE_MOCK_DATA,
      cacheEnabled: true,
      timeout: CONFIG.TIMEOUT,
      maxRetries: CONFIG.MAX_RETRIES
    };
  },

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await API.System.ping();
      return {
        success: true,
        message: 'API connection successful',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        mockMode: CONFIG.ENABLE_MOCK_DATA
      };
    }
  }
};

export default API;