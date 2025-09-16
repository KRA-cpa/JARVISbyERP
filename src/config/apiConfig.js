/**
 * API Configuration for Google Sheets Integration
 * Handles connection settings, endpoints, and environment-specific configurations
 */

// Environment-based API configuration
const API_CONFIG = {
  development: {
    // Google Apps Script Web App URL (development deployment)
    baseURL: process.env.REACT_APP_API_BASE_URL_DEV || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_DEV/exec',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    debugMode: true,
    mockMode: false // Set to true to use mock data instead of real API
  },

  production: {
    // Google Apps Script Web App URL (production deployment)
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    timeout: 45000,
    retryAttempts: 5,
    retryDelay: 2000,
    debugMode: false,
    mockMode: false
  }
};

// Get current environment configuration
const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return API_CONFIG[env] || API_CONFIG.development;
};

// Export configuration
export const apiConfig = getCurrentConfig();

/**
 * Google Sheets API Endpoint Mappings
 * Maps frontend operations to Google Apps Script function names
 */
export const API_ENDPOINTS = {
  // System endpoints
  ping: 'ping',
  getSystemInfo: 'getSystemInfo',

  // Authentication endpoints
  recordLogin: 'recordLogin',
  getUserProfile: 'getUserProfile',

  // Company management
  getCompanies: 'getCompanies',
  createCompany: 'createCompany',
  updateCompany: 'updateCompany',
  deleteCompany: 'deleteCompany',

  // Role management
  getRoles: 'getRoles',
  createRole: 'createRole',
  updateRole: 'updateRole',
  deleteRole: 'deleteRole',

  // User management
  getUsers: 'getUsers',
  createUser: 'createUser',
  updateUser: 'updateUser',
  deleteUser: 'deleteUser',
  getUserRoles: 'getUserRoles',
  assignUserRole: 'assignUserRole',

  // Ticket management
  getTickets: 'getTickets',
  getTicketById: 'getTicketById',
  createTicket: 'createTicket',
  updateTicket: 'updateTicket',
  deleteTicket: 'deleteTicket',
  getNextTicketNumber: 'getNextTicketNumber',

  // Ticket types
  getTicketTypes: 'getTicketTypes',
  createTicketType: 'createTicketType',
  updateTicketType: 'updateTicketType',
  deleteTicketType: 'deleteTicketType',

  // Workflow management
  getWorkflowSteps: 'getWorkflowSteps',
  getWorkflowStepsByTicketType: 'getWorkflowStepsByTicketType',
  createWorkflowStep: 'createWorkflowStep',
  updateWorkflowStep: 'updateWorkflowStep',
  deleteWorkflowStep: 'deleteWorkflowStep',

  // Step approvals
  getStepApprovals: 'getStepApprovals',
  submitApproval: 'submitApproval',
  getApprovalHistory: 'getApprovalHistory',
  canUserApprove: 'canUserApprove',

  // Dropdown lists
  getDropdownLists: 'getDropdownLists',
  createDropdownList: 'createDropdownList',
  updateDropdownList: 'updateDropdownList',
  deleteDropdownList: 'deleteDropdownList',

  // Custom fields
  getCustomFields: 'getCustomFields',
  createCustomField: 'createCustomField',
  updateCustomField: 'updateCustomField',
  deleteCustomField: 'deleteCustomField',

  // Audit logs
  getTicketHistory: 'getTicketHistory',
  getTicketActionLogs: 'getTicketActionLogs',
  getAdminActionLogs: 'getAdminActionLogs',
  createActionLog: 'createActionLog',

  // Reporting
  getReportData: 'getReportData',
  exportData: 'exportData',
  getStatistics: 'getStatistics',

  // Integration logs
  getIntegrationLogs: 'getIntegrationLogs',
  createIntegrationLog: 'createIntegrationLog',

  // Ticket links (for chained tickets)
  getTicketLinks: 'getTicketLinks',
  createTicketLink: 'createTicketLink',
  deleteTicketLink: 'deleteTicketLink',

  // Notifications
  sendNotification: 'sendNotification',
  sendEmail: 'sendEmail',
  getNotificationTemplates: 'getNotificationTemplates'
};

/**
 * API Connection Status Checker
 */
export const checkAPIConnection = async () => {
  try {
    const response = await fetch(apiConfig.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: API_ENDPOINTS.ping,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      connected: true,
      status: 'healthy',
      responseTime: data.responseTime || 0,
      serverTime: data.serverTime,
      version: data.version || 'unknown'
    };

  } catch (error) {
    return {
      connected: false,
      status: 'error',
      error: error.message,
      responseTime: null
    };
  }
};

/**
 * Mock API responses for development/testing
 */
export const mockAPIResponses = {
  [API_ENDPOINTS.ping]: {
    success: true,
    message: 'API connection successful',
    serverTime: new Date().toISOString(),
    responseTime: 150,
    version: '1.0.0-mock'
  },

  [API_ENDPOINTS.getCompanies]: {
    success: true,
    data: [
      { id: '1', name: 'Main Company', code: 'MAIN', created_at: new Date().toISOString() },
      { id: '2', name: 'Development Branch', code: 'DEV', created_at: new Date().toISOString() }
    ]
  },

  [API_ENDPOINTS.getTicketTypes]: {
    success: true,
    data: [
      { id: '1', name: 'Bug Report', code: 'BUG', company_id: '1' },
      { id: '2', name: 'Feature Request', code: 'FEAT', company_id: '1' }
    ]
  }
};

/**
 * Environment-specific API behavior
 */
export const getAPIBehavior = () => {
  const config = getCurrentConfig();

  return {
    shouldUseMocks: config.mockMode,
    enableRetries: config.retryAttempts > 0,
    enableLogging: config.debugMode,
    timeout: config.timeout,
    retryConfig: {
      attempts: config.retryAttempts,
      delay: config.retryDelay
    }
  };
};

/**
 * API Health Check Component Data
 */
export const getAPIHealthStatus = async () => {
  const connection = await checkAPIConnection();

  return {
    status: connection.connected ? 'healthy' : 'unhealthy',
    message: connection.connected
      ? `Connected to Google Sheets API (${connection.responseTime}ms)`
      : `API Connection Failed: ${connection.error}`,
    details: {
      baseURL: apiConfig.baseURL,
      environment: process.env.NODE_ENV,
      mockMode: apiConfig.mockMode,
      ...connection
    }
  };
};

export default {
  apiConfig,
  API_ENDPOINTS,
  checkAPIConnection,
  mockAPIResponses,
  getAPIBehavior,
  getAPIHealthStatus
};