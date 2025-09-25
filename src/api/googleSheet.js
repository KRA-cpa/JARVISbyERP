/**
 * Google Sheets API Integration Layer
 * Handles all communication with Google Apps Script backend
 * Includes caching, error handling, and mock data fallback
 */

import { ValidationUtils } from './models';
import { apiConfig } from '../config/apiConfig';

// API Configuration - Reduced retries to prevent resource exhaustion
const CONFIG = {
  APPS_SCRIPT_URL: apiConfig.baseURL,
  TIMEOUT: 15000, // Reduced timeout
  MAX_RETRIES: 1, // Reduced retries to prevent flooding
  RETRY_DELAY: 2000, // Increased delay between retries
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  ENABLE_MOCK_DATA: apiConfig.mockMode
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

// Simple circuit breaker to prevent resource exhaustion
class CircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.timeout = 30000; // 30 seconds
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - too many failures');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

const circuitBreaker = new CircuitBreaker();

// Request queue to limit concurrent API calls
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const requestQueue = new RequestQueue(2); // Limit to 2 concurrent requests

// HTTP Client with retry logic, circuit breaker, and request queue
class HTTPClient {
  static async request(url, options = {}) {
    return await requestQueue.add(async () => {
      return await circuitBreaker.execute(async () => {
      const config = {
        method: 'GET',
        timeout: CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Debug logging moved to after URL construction

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

          // Enhanced debug logging for response
          if (apiConfig.debugMode) {
            const timestamp = new Date().toISOString();
            console.log(`\n✅ [${timestamp}] API Response:`);
            console.log(`   Status: ${response.status} ${response.statusText}`);
            console.log(`   URL: ${url}`);
            console.log(`   Success: ${data.success || 'undefined'}`);

            if (data.data) {
              console.log(`   Data Count: ${Array.isArray(data.data) ? data.data.length : 'single item'}`);
              console.log(`   Data: ${JSON.stringify(data.data, null, 2)}`);
            }

            if (data.error) {
              console.log(`   Error: ${data.error}`);
            }
          }

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

      throw lastError;
      });
    });
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
      // Handle both absolute URLs (production) and relative paths (development)
      let url;
      let urlString;

      if (CONFIG.APPS_SCRIPT_URL.startsWith('http')) {
        // Absolute URL (production) - can use URL constructor
        url = new URL(CONFIG.APPS_SCRIPT_URL);
        urlString = CONFIG.APPS_SCRIPT_URL;
      } else {
        // Relative path (development) - use fetch directly without URL constructor
        urlString = CONFIG.APPS_SCRIPT_URL;
        url = null; // We'll build query params manually for relative URLs
      }

      // GET requests for read operations, POST for write operations
      const readActions = [
        'ping', 'getCompanies', 'getTickets', 'getTicketTypes', 'getRoles',
        'getDropdownLists', 'getCustomFields', 'getWorkflowSteps', 'getSystemHealth'
      ];

      const isGetRequest = readActions.includes(action);

      if (isGetRequest) {
        // GET request with query parameters
        if (url) {
          url.searchParams.set('action', action);
          // Add any payload as query params for GET requests
          if (payload && typeof payload === 'object') {
            Object.entries(payload).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
              }
            });
          }
          urlString = url.toString();
        } else {
          urlString += `?action=${encodeURIComponent(action)}`;
          // Add any payload as query params for relative URLs
          if (payload && typeof payload === 'object') {
            const queryParams = Object.entries(payload)
              .filter(([key, value]) => value !== undefined && value !== null)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
              .join('&');
            if (queryParams) {
              urlString += `&${queryParams}`;
            }
          }
        }
      }

      const options = isGetRequest
        ? { method: 'GET' }
        : {
            method: 'POST',
            body: JSON.stringify({ action, ...(payload || {}) })
          };

      // Enhanced debug logging for development
      if (apiConfig.debugMode) {
        const timestamp = new Date().toISOString();
        console.log(`\n🔗 [${timestamp}] API Request Details:`);
        console.log(`   Action: ${action}`);
        console.log(`   Method: ${options.method}`);

        if (options.method === 'GET') {
          console.log(`   GET URL: ${urlString}`);
        } else if (options.method === 'POST' && options.body) {
          console.log(`   POST Body: ${options.body}`);
        }
      }

      const response = await HTTPClient.request(urlString, options);

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
      throw new Error('Company code must be 2-8 uppercase letters or numbers');
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

  async lock(id, reason = 'first_ticket_created') {
    const response = await this.makeRequest('lockCompany', { id, reason });
    return response.data;
  }

  async unlock(id, reason = 'admin_override') {
    const response = await this.makeRequest('unlockCompany', { id, reason });
    return response.data;
  }

  async checkLockStatus(id) {
    const response = await this.makeRequest('checkCompanyLockStatus', { id });
    return response.data;
  }

  getMockData(action) {
    const mockCompanies = [
      {
        id: '1',
        name: 'Main Office',
        code: 'MAIN',
        code_locked: true,
        code_locked_at: '2025-01-15T10:30:00.000Z',
        code_locked_reason: 'first_ticket_created',
        ticket_count: 25,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Production Division',
        code: 'PROD',
        code_locked: false,
        code_locked_at: null,
        code_locked_reason: null,
        ticket_count: 0,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: '3',
        name: 'Sales Department',
        code: 'SALES',
        code_locked: true,
        code_locked_at: '2025-01-20T14:15:00.000Z',
        code_locked_reason: 'first_ticket_created',
        ticket_count: 8,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      }
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
      case 'lockCompany':
        return {
          status: 'success',
          data: {
            locked: true,
            locked_at: new Date().toISOString(),
            reason: 'first_ticket_created',
            message: 'Company code locked successfully'
          }
        };
      case 'unlockCompany':
        return {
          status: 'success',
          data: {
            unlocked: true,
            unlocked_at: new Date().toISOString(),
            reason: 'admin_override',
            message: 'Company code unlocked successfully'
          }
        };
      case 'checkCompanyLockStatus':
        return {
          status: 'success',
          data: {
            id: '1',
            code_locked: true,
            code_locked_at: '2025-01-15T10:30:00.000Z',
            code_locked_reason: 'first_ticket_created',
            ticket_count: 25
          }
        };
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

  async getLists(companyId = null) {
    const response = await this.makeRequest('getDropdownLists', {
      company_id: companyId
    });
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
      description: data.description?.trim() || '',
      company_id: data.company_id || null,
      options: data.options
    });
    return response.data;
  }

  async updateList(id, data) {
    const response = await this.makeRequest('updateDropdownList', {
      id,
      name: data.name?.trim(),
      description: data.description?.trim() || '',
      company_id: data.company_id || null,
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
        company_id: '1',
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
        company_id: '1',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
        options: [
          { id: '5', label: 'IT', value: 'it', parent_option_id: '' },
          { id: '6', label: 'HR', value: 'hr', parent_option_id: '' },
          { id: '7', label: 'Finance', value: 'finance', parent_option_id: '' },
          { id: '8', label: 'Operations', value: 'operations', parent_option_id: '' }
        ]
      },
      {
        id: '3',
        name: 'Global Categories',
        company_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
        options: [
          { id: '9', label: 'Software', value: 'software', parent_option_id: '' },
          { id: '10', label: 'Hardware', value: 'hardware', parent_option_id: '' },
          { id: '11', label: 'Service', value: 'service', parent_option_id: '' }
        ]
      }
    ];

    switch (action) {
      case 'getDropdownLists':
        // Filter by company_id if provided
        const { company_id } = arguments[1] || {};
        let filteredLists = mockLists;
        if (company_id !== undefined) {
          filteredLists = mockLists.filter(list =>
            company_id === null
              ? list.company_id === null
              : list.company_id === company_id || list.company_id === null
          );
        }
        return { status: 'success', data: filteredLists };
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
    cache.invalidate('tickets');

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

  // Bulk role assignment method for the dialog
  async assignRoleBulk(assignmentData) {
    const response = await this.makeRequest('bulkAssignRole', {
      user_email: assignmentData.user_email,
      company_id: assignmentData.company_id,
      ticket_type_id: assignmentData.ticket_type_id,
      role_id: assignmentData.role_id,
      validity_end_date: assignmentData.validity_end_date,
      notify_user: assignmentData.notify_user,
      create_audit_log: assignmentData.create_audit_log
    });
    return response.data;
  }

  async replaceUserRoles(assignmentData) {
    const response = await this.makeRequest('replaceUserRoles', {
      user_email: assignmentData.user_email,
      company_id: assignmentData.company_id,
      ticket_type_id: assignmentData.ticket_type_id,
      role_id: assignmentData.role_id,
      validity_end_date: assignmentData.validity_end_date,
      notify_user: assignmentData.notify_user,
      create_audit_log: assignmentData.create_audit_log
    });
    return response.data;
  }

  async getPreferences(userId) {
    const response = await this.makeRequest('getUserPreferences', {
      user_id: userId
    });
    return response.data || {};
  }

  async updatePreferences(userId, preferences) {
    const response = await this.makeRequest('updateUserPreferences', {
      user_id: userId,
      preferences: preferences
    });
    cache.invalidate('user_preferences');
    return response.data;
  }

  async getAll() {
    const response = await this.makeRequest('getUsers');
    return response.data || [];
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
      case 'bulkAssignRole':
        return {
          success: true,
          message: 'Role assigned successfully',
          data: {
            assignment_id: `assign_${Date.now()}`,
            user_email: 'user@example.com',
            role_assigned: true,
            notification_sent: true,
            audit_log_created: true,
            timestamp: new Date().toISOString()
          }
        };
      case 'replaceUserRoles':
        return {
          success: true,
          message: 'User roles replaced successfully',
          data: {
            replacement_id: `replace_${Date.now()}`,
            user_email: 'user@example.com',
            roles_replaced: 3,
            new_roles_assigned: 2,
            notification_sent: true,
            audit_log_created: true,
            timestamp: new Date().toISOString()
          }
        };
      case 'getUserPreferences':
        return {
          success: true,
          data: {
            dark_mode: false,
            timezone: 'Asia/Manila',
            language: 'en',
            email_notifications: true,
            desktop_notifications: true,
            dashboard_layout: 'grid',
            items_per_page: 20,
            auto_refresh: true,
            refresh_interval: 30000,
            updated_at: '2025-01-15T10:30:00.000Z'
          }
        };
      case 'updateUserPreferences':
        return {
          success: true,
          message: 'User preferences updated successfully',
          data: {
            user_id: 'user123',
            updated_at: new Date().toISOString(),
            preferences_updated: Object.keys(arguments[1] || {}).length
          }
        };
      case 'getUsers':
        return {
          success: true,
          data: [
            {
              id: 'user123',
              email: 'admin@example.com',
              displayName: 'System Administrator',
              roles: ['Admin'],
              companies: ['Main Office'],
              created_at: '2025-01-01T00:00:00.000Z'
            },
            {
              id: 'user456',
              email: 'user@example.com',
              displayName: 'Regular User',
              roles: ['User'],
              companies: ['Main Office'],
              created_at: '2025-01-02T00:00:00.000Z'
            }
          ]
        };
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

  async exportConfiguration(params) {
    const response = await this.makeRequest('exportConfiguration', {
      company_id: params.company_id,
      ticket_type_ids: params.ticket_type_ids,
      include_workflows: params.include_workflows,
      include_custom_fields: params.include_custom_fields,
      include_sla_rules: params.include_sla_rules,
      include_roles: params.include_roles,
      include_dropdowns: params.include_dropdowns
    });
    return response;
  }

  async importConfiguration(params) {
    const response = await this.makeRequest('importConfiguration', {
      source_company_id: params.source_company_id,
      target_company_id: params.target_company_id,
      ticket_type_ids: params.ticket_type_ids,
      include_workflows: params.include_workflows,
      include_custom_fields: params.include_custom_fields,
      include_sla_rules: params.include_sla_rules,
      include_roles: params.include_roles,
      include_dropdowns: params.include_dropdowns,
      overwrite_existing: params.overwrite_existing
    });
    cache.invalidate('workflow_steps');
    cache.invalidate('custom_fields');
    cache.invalidate('roles');
    cache.invalidate('dropdown_lists');
    return response;
  }

  async createConfigurationBackup(params) {
    const response = await this.makeRequest('createConfigurationBackup', {
      company_id: params.company_id,
      backup_name: params.backup_name
    });
    return response;
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
      case 'exportConfiguration':
        return {
          success: true,
          message: 'Configuration exported successfully',
          data: {
            export_id: `export_${Date.now()}`,
            company_id: '1',
            timestamp: new Date().toISOString(),
            workflows: [
              { id: 'step_1', name: 'Manager Approval', step_type: 'approval' },
              { id: 'step_2', name: 'Finance Review', step_type: 'approval' }
            ],
            custom_fields: [
              { id: 'field_1', name: 'item_description', type: 'paragraph' },
              { id: 'field_2', name: 'estimated_cost', type: 'amount' }
            ],
            sla_rules: [
              { step_id: 'step_1', duration: 24, unit: 'hours' },
              { step_id: 'step_2', duration: 48, unit: 'hours' }
            ],
            roles: [
              { id: 'role_1', name: 'Manager', permissions: ['approve', 'view'] },
              { id: 'role_2', name: 'Finance', permissions: ['approve', 'edit'] }
            ],
            dropdowns: [
              { id: 'dropdown_1', name: 'Vendor Categories', options: ['IT', 'Office', 'Facilities'] }
            ]
          }
        };
      case 'importConfiguration':
        return {
          success: true,
          message: 'Configuration imported successfully',
          data: {
            import_id: `import_${Date.now()}`,
            source_company_id: '1',
            target_company_id: '2',
            imported_items: {
              workflows: 2,
              custom_fields: 2,
              sla_rules: 2,
              roles: 2,
              dropdowns: 1
            },
            conflicts_resolved: 0,
            backup_created: true,
            timestamp: new Date().toISOString()
          }
        };
      case 'createConfigurationBackup':
        return {
          success: true,
          message: 'Configuration backup created successfully',
          data: {
            backup_id: `backup_${Date.now()}`,
            company_id: '2',
            backup_name: `pre-import-${new Date().toISOString().split('T')[0]}`,
            created_at: new Date().toISOString(),
            size_kb: 45.7
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

  async getByTicketType(ticketTypeId, companyId = null) {
    const response = await this.makeRequest('getWorkflowSteps', {
      ticket_type_id: ticketTypeId,
      company_id: companyId
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

    if (!data.company_id) {
      throw new Error('Company ID is required');
    }

    if (!data.name?.trim()) {
      throw new Error('Step name is required');
    }

    if (!data.step_type) {
      throw new Error('Step type is required');
    }

    const response = await this.makeRequest('createWorkflowStep', {
      ticket_type_id: data.ticket_type_id,
      company_id: data.company_id,
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

    cache.invalidate('workflow_steps');
    return response.data;
  }

  async update(stepId, data) {
    const response = await this.makeRequest('updateWorkflowStep', {
      step_id: stepId,
      ...data
    });

    cache.invalidate('workflow_steps');
    return response.data;
  }

  async delete(stepId) {
    const response = await this.makeRequest('deleteWorkflowStep', {
      step_id: stepId
    });

    cache.invalidate('workflow_steps');
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

    cache.invalidate('step_approvers');
    return response.data;
  }

  // Copy workflow steps from one company to another
  async copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId) {
    if (!ticketTypeId || !sourceCompanyId || !targetCompanyId) {
      throw new Error('Ticket type ID, source company ID, and target company ID are required');
    }

    const response = await this.makeRequest('copyWorkflowSteps', {
      ticket_type_id: ticketTypeId,
      source_company_id: sourceCompanyId,
      target_company_id: targetCompanyId
    });
    cache.invalidate('workflow_steps');
    return response.data;
  }

  // Create default workflow steps for a company
  async createDefaultForCompany(ticketTypeId, companyId) {
    if (!ticketTypeId || !companyId) {
      throw new Error('Ticket type ID and company ID are required');
    }

    const response = await this.makeRequest('createDefaultWorkflow', {
      ticket_type_id: ticketTypeId,
      company_id: companyId
    });
    cache.invalidate('workflow_steps');
    return response.data;
  }

  // Get workflows by company and ticket type
  async getByCompany(ticketTypeId, companyId) {
    return this.getByTicketType(ticketTypeId, companyId);
  }

  getMockData(action, params = {}) {
    if (action === 'getWorkflowSteps') {
      const ticketTypeId = params.ticket_type_id;

      const mockSteps = {
        'purchase_request': [
          {
            id: 'step_pr_1',
            ticket_type_id: 'purchase_request',
            company_id: '1',
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
            company_id: '1',
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
            company_id: '1',
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
            company_id: '1',
            name: 'Implementation',
            status_on_reach: 'in_implementation',
            step_type: 'task',
            sort_order: 2,
            external_app_url: 'https://ticketing.company.com/implement/{ticket_id}',
            completion_action_name: 'Mark Implementation Complete'
          }
        ]
      };

      // Filter by company_id if provided
      let steps = mockSteps[ticketTypeId] || [];
      const { company_id } = params;

      if (company_id !== undefined) {
        steps = steps.filter(step =>
          company_id === null
            ? step.company_id === null
            : step.company_id === company_id
        );
      }

      return {
        success: true,
        data: steps
      };
    }

    if (action === 'copyWorkflowSteps') {
      return {
        success: true,
        data: {
          copied: true,
          source_company_id: params.source_company_id,
          target_company_id: params.target_company_id,
          ticket_type_id: params.ticket_type_id,
          steps_copied: 2
        }
      };
    }

    if (action === 'createDefaultWorkflow') {
      return {
        success: true,
        message: 'Default workflow created successfully',
        data: {
          created_steps: 2,
          ticket_type_id: params.ticket_type_id,
          company_id: params.company_id,
          steps: [
            {
              id: `step_${params.ticket_type_id}_${params.company_id}_1`,
              name: 'Initial Review',
              step_type: 'approval',
              sort_order: 1
            },
            {
              id: `step_${params.ticket_type_id}_${params.company_id}_2`,
              name: 'Final Approval',
              step_type: 'approval',
              sort_order: 2
            }
          ]
        }
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

// Custom Fields API
class CustomFieldsAPI extends BaseAPI {
  constructor() {
    super('custom_fields');
  }

  async getAll() {
    const response = await this.makeRequest('getCustomFields');
    return response.data || [];
  }

  async getByTicketType(ticketTypeId) {
    const response = await this.makeRequest('getCustomFields', {
      ticket_type_id: ticketTypeId
    });
    return response.data || [];
  }

  async getById(id) {
    const response = await this.makeRequest('getCustomField', {
      field_id: id
    });
    return response.data;
  }

  async create(data) {
    if (!data.ticket_type_id) {
      throw new Error('Ticket type ID is required');
    }

    if (!data.name?.trim()) {
      throw new Error('Field name is required');
    }

    if (!data.label?.trim()) {
      throw new Error('Field label is required');
    }

    if (!data.type) {
      throw new Error('Field type is required');
    }

    const response = await this.makeRequest('createCustomField', {
      ticket_type_id: data.ticket_type_id,
      name: data.name.trim(),
      label: data.label.trim(),
      type: data.type,
      is_required: data.is_required || false,
      is_hidden: data.is_hidden || false,
      sort_order: data.sort_order || 1,
      dropdown_list_id: data.dropdown_list_id || null,
      depends_on_field_id: data.depends_on_field_id || null
    });
    return response.data;
  }

  async update(id, data) {
    if (!id) {
      throw new Error('Field ID is required');
    }

    const response = await this.makeRequest('updateCustomField', {
      field_id: id,
      ...data
    });
    return response.data;
  }

  async delete(id) {
    if (!id) {
      throw new Error('Field ID is required');
    }

    const response = await this.makeRequest('deleteCustomField', {
      field_id: id
    });
    return response.data;
  }

  getMockData(action, params = {}) {
    const mockCustomFields = [
      {
        id: '1',
        ticket_type_id: 'tt_1',
        name: 'item_description',
        label: 'Item Description',
        type: 'paragraph',
        is_required: true,
        is_hidden: false,
        sort_order: 1,
        dropdown_list_id: null,
        depends_on_field_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        ticket_type_id: 'tt_1',
        name: 'estimated_cost',
        label: 'Estimated Cost',
        type: 'amount',
        is_required: true,
        is_hidden: false,
        sort_order: 2,
        dropdown_list_id: null,
        depends_on_field_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: '3',
        ticket_type_id: 'tt_1',
        name: 'vendor_category',
        label: 'Vendor Category',
        type: 'dropdown',
        is_required: false,
        is_hidden: false,
        sort_order: 3,
        dropdown_list_id: '1',
        depends_on_field_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      }
    ];

    switch (action) {
      case 'getCustomFields':
        if (params.ticket_type_id) {
          return {
            status: 'success',
            data: mockCustomFields.filter(f => f.ticket_type_id === params.ticket_type_id)
          };
        }
        return { status: 'success', data: mockCustomFields };
      case 'getCustomField':
        const field = mockCustomFields.find(f => f.id === params.field_id);
        return { status: 'success', data: field };
      case 'createCustomField':
      case 'updateCustomField':
        return {
          status: 'success',
          data: {
            ...mockCustomFields[0],
            id: Date.now().toString(),
            ...params
          }
        };
      case 'deleteCustomField':
        return { status: 'success', data: { deleted: true } };
      default:
        return super.getMockData(action, params);
    }
  }
}

// Ticket Types API
class TicketTypesAPI extends BaseAPI {
  constructor() {
    super('ticket_types');
  }

  async getAll(companyId = null) {
    const response = await this.makeRequest('getTicketTypes', {
      company_id: companyId
    });
    return response.data || [];
  }

  async getById(id) {
    const response = await this.makeRequest('getTicketType', {
      ticket_type_id: id
    });
    return response.data;
  }

  async create(data) {
    if (!data.transaction_id?.trim()) {
      throw new Error('Transaction ID is required');
    }

    if (!data.code?.trim()) {
      throw new Error('Code is required');
    }

    if (!data.name?.trim()) {
      throw new Error('Name is required');
    }

    // Check for duplicate names (case-insensitive)
    await this.validateNameUniqueness(data.name.trim());

    const response = await this.makeRequest('createTicketType', {
      transaction_id: data.transaction_id.trim(),
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description || '',
      is_active: data.is_active !== false,
      require_attachment_on_create: data.require_attachment_on_create || false,
      company_id: data.company_id || null
    });
    return response.data;
  }

  async update(id, data) {
    if (!id) {
      throw new Error('Ticket type ID is required');
    }

    // Check for duplicate names if name is being updated (case-insensitive)
    if (data.name?.trim()) {
      await this.validateNameUniqueness(data.name.trim(), id);
    }

    const response = await this.makeRequest('updateTicketType', {
      ticket_type_id: id,
      ...data
    });
    return response.data;
  }

  async delete(id) {
    if (!id) {
      throw new Error('Ticket type ID is required');
    }

    const response = await this.makeRequest('deleteTicketType', {
      ticket_type_id: id
    });
    return response.data;
  }

  // Validate ticket type name uniqueness (case-insensitive)
  async validateNameUniqueness(name, excludeId = null) {
    if (!name?.trim()) return;

    const existingTicketTypes = await this.getAll();
    const trimmedName = name.trim().toLowerCase();

    const duplicate = existingTicketTypes.find(ticketType =>
      ticketType.name.toLowerCase() === trimmedName &&
      ticketType.id !== excludeId
    );

    if (duplicate) {
      throw new Error(`A ticket type with the name "${name}" already exists (case-insensitive)`);
    }
  }

  getMockData(action, params = {}) {
    const mockTicketTypes = [
      {
        id: 'tt_1',
        transaction_id: 'TR001',
        code: 'PR',
        name: 'Purchase Request',
        description: 'Request for purchasing items',
        is_active: true,
        require_attachment_on_create: true,
        company_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'tt_2',
        transaction_id: 'TR002',
        code: 'IT',
        name: 'IT Request',
        description: 'Request for IT support',
        is_active: true,
        require_attachment_on_create: false,
        company_id: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'tt_3',
        transaction_id: 'TR003',
        code: 'LV',
        name: 'Leave Request',
        description: 'Request for time off',
        is_active: true,
        require_attachment_on_create: false,
        company_id: '1',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      }
    ];

    switch (action) {
      case 'getTicketTypes':
        return { status: 'success', data: mockTicketTypes };
      case 'getTicketType':
        const ticketType = mockTicketTypes.find(tt => tt.id === params.ticket_type_id);
        return { status: 'success', data: ticketType };
      case 'createTicketType':
      case 'updateTicketType':
        return {
          status: 'success',
          data: {
            ...mockTicketTypes[0],
            id: Date.now().toString(),
            ...params
          }
        };
      case 'deleteTicketType':
        return { status: 'success', data: { deleted: true } };
      default:
        return super.getMockData(action, params);
    }
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

    cache.invalidate('step_approvals');
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

// SLA API
class SLAAPI extends BaseAPI {
  constructor() {
    super('sla');
  }

  async getCompanyRules(companyId, ticketTypeId) {
    const response = await this.makeRequest('getCompanySLARules', {
      company_id: companyId,
      ticket_type_id: ticketTypeId
    });
    return response.data || [];
  }

  async createCompanyRule(ruleData) {
    const response = await this.makeRequest('createCompanySLARule', {
      company_id: ruleData.company_id,
      ticket_type_id: ruleData.ticket_type_id,
      step_name: ruleData.step_name,
      duration: ruleData.duration,
      unit: ruleData.unit,
      exclude_weekends: ruleData.exclude_weekends,
      exclude_holidays: ruleData.exclude_holidays,
      escalation_enabled: ruleData.escalation_enabled,
      escalation_delay: ruleData.escalation_delay,
      escalation_unit: ruleData.escalation_unit,
      escalation_recipients: ruleData.escalation_recipients,
      warning_threshold: ruleData.warning_threshold,
      business_hours_start: ruleData.business_hours_start,
      business_hours_end: ruleData.business_hours_end,
      business_days: ruleData.business_days,
      timezone: ruleData.timezone
    });
    cache.invalidate('sla');
    return response.data;
  }

  async updateCompanyRule(ruleId, ruleData) {
    const response = await this.makeRequest('updateCompanySLARule', {
      rule_id: ruleId,
      ...ruleData
    });
    cache.invalidate('sla');
    return response.data;
  }

  async deleteCompanyRule(ruleId) {
    const response = await this.makeRequest('deleteCompanySLARule', {
      rule_id: ruleId
    });
    cache.invalidate('sla');
    return response.data;
  }

  getMockData(action, params = {}) {
    const mockSLARules = [
      {
        id: 'sla_1',
        company_id: '1',
        ticket_type_id: 'tt_1',
        step_name: 'Manager Approval',
        duration: 24,
        unit: 'hours',
        exclude_weekends: false,
        exclude_holidays: true,
        escalation_enabled: true,
        escalation_delay: 4,
        escalation_unit: 'hours',
        escalation_recipients: ['manager@company.com', 'supervisor@company.com'],
        warning_threshold: 75,
        business_hours_start: '09:00',
        business_hours_end: '17:00',
        business_days: [1, 2, 3, 4, 5],
        timezone: 'Asia/Manila',
        created_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'sla_2',
        company_id: '1',
        ticket_type_id: 'tt_1',
        step_name: 'Finance Review',
        duration: 48,
        unit: 'business_hours',
        exclude_weekends: true,
        exclude_holidays: true,
        escalation_enabled: false,
        warning_threshold: 80,
        business_hours_start: '09:00',
        business_hours_end: '17:00',
        business_days: [1, 2, 3, 4, 5],
        timezone: 'Asia/Manila',
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ];

    switch (action) {
      case 'getCompanySLARules':
        return {
          success: true,
          data: mockSLARules.filter(rule =>
            rule.company_id === params.company_id &&
            rule.ticket_type_id === params.ticket_type_id
          )
        };
      case 'createCompanySLARule':
        return {
          success: true,
          message: 'SLA rule created successfully',
          data: {
            id: `sla_${Date.now()}`,
            ...params,
            created_at: new Date().toISOString()
          }
        };
      case 'updateCompanySLARule':
        return {
          success: true,
          message: 'SLA rule updated successfully',
          data: {
            id: params.rule_id,
            updated_at: new Date().toISOString()
          }
        };
      case 'deleteCompanySLARule':
        return {
          success: true,
          message: 'SLA rule deleted successfully',
          data: { deleted: true }
        };
      default:
        return super.getMockData(action, params);
    }
  }
}

// Main API object
// Ticket Links API
class TicketLinksAPI extends BaseAPI {
  constructor() {
    super('ticket_links');
  }

  async getAll(criteria = {}) {
    const response = await this.makeRequest('getTicketLinks', {
      ticket_number: criteria.ticketNumber,
      company_id: criteria.companyId,
      ticket_type_id: criteria.ticketTypeId,
      status: criteria.status,
      include_linked: criteria.includeLinked
    });
    return response.data || [];
  }

  async create(linkData) {
    const response = await this.makeRequest('createTicketLink', {
      parent_ticket_number: linkData.parent_ticket_number,
      child_ticket_number: linkData.child_ticket_number,
      link_type: linkData.link_type,
      description: linkData.description,
      enforce_blocking_rules: linkData.enforce_blocking_rules,
      sync_status: linkData.sync_status,
      notify_on_update: linkData.notify_on_update
    });
    cache.invalidate('ticket_links');
    return response.data;
  }

  async delete(linkId) {
    const response = await this.makeRequest('deleteTicketLink', {
      link_id: linkId
    });
    cache.invalidate('ticket_links');
    return response.data;
  }

  async validateDependencies() {
    const response = await this.makeRequest('validateTicketDependencies');
    return response.data;
  }

  getMockData(action, params = {}) {
    const mockLinks = [
      {
        id: 'link_1',
        parent_ticket_number: 'ABC-PR-2025-0001',
        child_ticket_number: 'XYZ-IT-2025-0010',
        link_type: 'blocks',
        description: 'Purchase request must be approved before IT setup',
        enforce_blocking_rules: true,
        sync_status: false,
        notify_on_update: true,
        created_at: '2025-01-15T08:00:00.000Z'
      },
      {
        id: 'link_2',
        parent_ticket_number: 'DEF-BUD-2025-0005',
        child_ticket_number: 'ABC-PR-2025-0001',
        link_type: 'depends_on',
        description: 'Purchase depends on budget approval',
        enforce_blocking_rules: true,
        sync_status: true,
        notify_on_update: true,
        created_at: '2025-01-14T10:30:00.000Z'
      }
    ];

    switch (action) {
      case 'getTicketLinks':
        return {
          success: true,
          data: mockLinks.filter(link => {
            if (params.ticket_number &&
                !link.parent_ticket_number.includes(params.ticket_number) &&
                !link.child_ticket_number.includes(params.ticket_number)) {
              return false;
            }
            return true;
          })
        };
      case 'createTicketLink':
        return {
          success: true,
          message: 'Ticket link created successfully',
          data: {
            id: `link_${Date.now()}`,
            ...params,
            created_at: new Date().toISOString()
          }
        };
      case 'deleteTicketLink':
        return {
          success: true,
          message: 'Ticket link deleted successfully',
          data: { deleted: true }
        };
      case 'validateTicketDependencies':
        return {
          success: true,
          data: {
            total_links: 5,
            circular_dependencies: [],
            orphaned_tickets: [],
            validation_passed: true
          }
        };
      default:
        return super.getMockData(action, params);
    }
  }
}

export const API = {
  Companies: new CompanyAPI(),
  Roles: new RoleAPI(),
  Dropdowns: new DropdownAPI(),
  Tickets: new TicketAPI(),
  TicketTypes: new TicketTypesAPI(),
  CustomFields: new CustomFieldsAPI(),
  Users: new UserAPI(),
  System: new SystemAPI(),
  WorkflowSteps: new WorkflowStepsAPI(),
  StepApprovals: new StepApprovalsAPI(),
  SLA: new SLAAPI(),
  TicketLinks: new TicketLinksAPI()
};

// Individual API exports for backward compatibility
export const companyAPI = API.Companies;
export const roleAPI = API.Roles;
export const dropdownAPI = API.Dropdowns;
export const ticketAPI = API.Tickets;
export const ticketTypesAPI = API.TicketTypes;
export const customFieldsAPI = API.CustomFields;
export const userAPI = API.Users;
export const systemAPI = API.System;
export const workflowStepsAPI = API.WorkflowSteps;
export const stepApprovalsAPI = API.StepApprovals;
export const slaAPI = API.SLA;
export const ticketLinksAPI = API.TicketLinks;

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