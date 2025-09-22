/**
 * Data Models and Type Definitions for Ticketing System
 * Using JSDoc for TypeScript-like type safety in JavaScript
 */

// =================================================================================
// COMPANY MODELS
// =================================================================================

/**
 * @typedef {Object} Company
 * @property {string} id - Unique company identifier
 * @property {string} name - Company display name
 * @property {string} code - Short company code for ticket numbering
 * @property {boolean} code_locked - Whether company code is locked after first ticket
 * @property {string|null} code_locked_at - ISO timestamp when code was locked
 * @property {string|null} code_locked_reason - Reason for code locking
 * @property {number} ticket_count - Number of tickets created for this company
 * @property {boolean} is_active - Whether the company is active (not deactivated)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} created_by - User ID who created the record
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} updated_by - User ID who last updated the record
 * @property {string|null} deactivated_at - ISO timestamp when deactivated (null if active)
 * @property {string|null} deactivated_by - User ID who deactivated (null if active)
 * @property {string|null} deactivation_reason - Reason for deactivation (null if active)
 */

export class CompanyModel {
  /**
   * @param {Company} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.code = data.code || '';
    this.code_locked = data.code_locked || false;
    this.code_locked_at = data.code_locked_at || null;
    this.code_locked_reason = data.code_locked_reason || null;
    this.ticket_count = data.ticket_count || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_at = data.updated_at || new Date().toISOString();
    this.updated_by = data.updated_by || '';
    this.deactivated_at = data.deactivated_at || null;
    this.deactivated_by = data.deactivated_by || null;
    this.deactivation_reason = data.deactivation_reason || null;
  }

  /**
   * Validate company data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.name?.trim()) {
      errors.push('Company name is required');
    }

    if (!this.code?.trim()) {
      errors.push('Company code is required');
    } else if (!/^[A-Z0-9]{2,8}$/.test(this.code)) {
      errors.push('Company code must be 2-8 uppercase letters or numbers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if company is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === true || this.is_active === 'TRUE';
  }

  /**
   * Check if company code is locked
   * @returns {boolean}
   */
  isCodeLocked() {
    return this.code_locked === true || this.code_locked === 'TRUE';
  }

  /**
   * Get audit information summary
   * @returns {Object}
   */
  getAuditInfo() {
    return {
      created: {
        at: this.created_at,
        by: this.created_by
      },
      updated: {
        at: this.updated_at,
        by: this.updated_by
      },
      deactivated: this.deactivated_at ? {
        at: this.deactivated_at,
        by: this.deactivated_by,
        reason: this.deactivation_reason
      } : null,
      codeLocked: this.code_locked_at ? {
        at: this.code_locked_at,
        reason: this.code_locked_reason
      } : null
    };
  }

  /**
   * Get status display information
   * @returns {Object}
   */
  getStatusInfo() {
    if (!this.isActive()) {
      return {
        status: 'deactivated',
        label: 'Deactivated',
        color: 'red',
        reason: this.deactivation_reason,
        timestamp: this.deactivated_at
      };
    }

    if (this.isCodeLocked()) {
      return {
        status: 'code_locked',
        label: 'Code Locked',
        color: 'yellow',
        reason: this.code_locked_reason,
        timestamp: this.code_locked_at
      };
    }

    return {
      status: 'active',
      label: 'Active',
      color: 'green'
    };
  }

  /**
   * Create a new company instance
   * @param {string} name
   * @param {string} code
   * @returns {CompanyModel}
   */
  static create(name, code) {
    return new CompanyModel({
      name: name?.trim(),
      code: code?.toUpperCase().trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// =================================================================================
// ROLE MODELS
// =================================================================================

/**
 * @typedef {Object} Role
 * @property {string} id - Unique role identifier
 * @property {string} name - Role display name
 * @property {string|null} company_id - Company ID (null for global roles)
 * @property {boolean} is_active - Whether the role is active (not deactivated)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} created_by - User ID who created the record
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} updated_by - User ID who last updated the record
 * @property {string|null} deactivated_at - ISO timestamp when deactivated (null if active)
 * @property {string|null} deactivated_by - User ID who deactivated (null if active)
 * @property {string|null} deactivation_reason - Reason for deactivation (null if active)
 */

export class RoleModel {
  /**
   * @param {Role} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.company_id = data.company_id || null;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_at = data.updated_at || new Date().toISOString();
    this.updated_by = data.updated_by || '';
    this.deactivated_at = data.deactivated_at || null;
    this.deactivated_by = data.deactivated_by || null;
    this.deactivation_reason = data.deactivation_reason || null;
  }

  /**
   * Check if role is global
   * @returns {boolean}
   */
  get isGlobal() {
    return this.company_id === null || this.company_id === '';
  }

  /**
   * Get role scope description
   * @returns {string}
   */
  get scope() {
    return this.isGlobal ? 'Global' : 'Company-specific';
  }

  /**
   * Check if role is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === true || this.is_active === 'TRUE';
  }

  /**
   * Get audit information summary
   * @returns {Object}
   */
  getAuditInfo() {
    return {
      created: {
        at: this.created_at,
        by: this.created_by
      },
      updated: {
        at: this.updated_at,
        by: this.updated_by
      },
      deactivated: this.deactivated_at ? {
        at: this.deactivated_at,
        by: this.deactivated_by,
        reason: this.deactivation_reason
      } : null
    };
  }

  /**
   * Get status display information
   * @returns {Object}
   */
  getStatusInfo() {
    if (!this.isActive()) {
      return {
        status: 'deactivated',
        label: 'Deactivated',
        color: 'red',
        reason: this.deactivation_reason,
        timestamp: this.deactivated_at
      };
    }

    return {
      status: 'active',
      label: 'Active',
      color: 'green'
    };
  }

  /**
   * Validate role data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.name?.trim()) {
      errors.push('Role name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new role instance
   * @param {string} name
   * @param {string|null} companyId
   * @returns {RoleModel}
   */
  static create(name, companyId = null) {
    return new RoleModel({
      name: name?.trim(),
      company_id: companyId === 'global' ? null : companyId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// =================================================================================
// DROPDOWN MODELS
// =================================================================================

/**
 * @typedef {Object} DropdownOption
 * @property {string} id - Unique option identifier
 * @property {string} dropdown_list_id - Parent dropdown list ID
 * @property {string} label - Display label
 * @property {string} value - Option value
 * @property {string} parent_option_id - Parent option for hierarchical dropdowns
 * @property {number} sort_order - Display order within the dropdown list
 * @property {boolean} is_active - Whether the option is active (not deactivated)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} created_by - User ID who created the record
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} updated_by - User ID who last updated the record
 * @property {string|null} deactivated_at - ISO timestamp when deactivated (null if active)
 * @property {string|null} deactivated_by - User ID who deactivated (null if active)
 * @property {string|null} deactivation_reason - Reason for deactivation (null if active)
 */

/**
 * @typedef {Object} DropdownList
 * @property {string} id - Unique dropdown list identifier
 * @property {string} name - Dropdown list name
 * @property {string} company_id - Company ID (makes dropdown lists company-specific)
 * @property {boolean} is_active - Whether the dropdown list is active (not deactivated)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} created_by - User ID who created the record
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} updated_by - User ID who last updated the record
 * @property {string|null} deactivated_at - ISO timestamp when deactivated (null if active)
 * @property {string|null} deactivated_by - User ID who deactivated (null if active)
 * @property {string|null} deactivation_reason - Reason for deactivation (null if active)
 * @property {DropdownOption[]} options - Array of dropdown options
 */

export class DropdownOptionModel {
  /**
   * @param {DropdownOption} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.dropdown_list_id = data.dropdown_list_id || '';
    this.label = data.label || '';
    this.value = data.value || '';
    this.parent_option_id = data.parent_option_id || '';
    this.sort_order = data.sort_order || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_at = data.updated_at || new Date().toISOString();
    this.updated_by = data.updated_by || '';
    this.deactivated_at = data.deactivated_at || null;
    this.deactivated_by = data.deactivated_by || null;
    this.deactivation_reason = data.deactivation_reason || null;
  }

  /**
   * Check if option has parent
   * @returns {boolean}
   */
  get hasParent() {
    return !!this.parent_option_id;
  }

  /**
   * Check if option is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === true || this.is_active === 'TRUE';
  }

  /**
   * Get audit information summary
   * @returns {Object}
   */
  getAuditInfo() {
    return {
      created: {
        at: this.created_at,
        by: this.created_by
      },
      updated: {
        at: this.updated_at,
        by: this.updated_by
      },
      deactivated: this.deactivated_at ? {
        at: this.deactivated_at,
        by: this.deactivated_by,
        reason: this.deactivation_reason
      } : null
    };
  }

  /**
   * Get status display information
   * @returns {Object}
   */
  getStatusInfo() {
    if (!this.isActive()) {
      return {
        status: 'deactivated',
        label: 'Deactivated',
        color: 'red',
        reason: this.deactivation_reason,
        timestamp: this.deactivated_at
      };
    }

    return {
      status: 'active',
      label: 'Active',
      color: 'green'
    };
  }
}

export class DropdownListModel {
  /**
   * @param {DropdownList} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.company_id = data.company_id || '';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_at = data.updated_at || new Date().toISOString();
    this.updated_by = data.updated_by || '';
    this.deactivated_at = data.deactivated_at || null;
    this.deactivated_by = data.deactivated_by || null;
    this.deactivation_reason = data.deactivation_reason || null;
    this.options = (data.options || []).map(option => new DropdownOptionModel(option));
  }

  /**
   * Get root options (no parent)
   * @returns {DropdownOptionModel[]}
   */
  get rootOptions() {
    return this.options.filter(option => !option.hasParent);
  }

  /**
   * Get child options for a parent
   * @param {string} parentId
   * @returns {DropdownOptionModel[]}
   */
  getChildOptions(parentId) {
    return this.options.filter(option => option.parent_option_id === parentId);
  }

  /**
   * Check if dropdown list is active
   * @returns {boolean}
   */
  isActive() {
    return this.is_active === true || this.is_active === 'TRUE';
  }

  /**
   * Get audit information summary
   * @returns {Object}
   */
  getAuditInfo() {
    return {
      created: {
        at: this.created_at,
        by: this.created_by
      },
      updated: {
        at: this.updated_at,
        by: this.updated_by
      },
      deactivated: this.deactivated_at ? {
        at: this.deactivated_at,
        by: this.deactivated_by,
        reason: this.deactivation_reason
      } : null
    };
  }

  /**
   * Get status display information
   * @returns {Object}
   */
  getStatusInfo() {
    if (!this.isActive()) {
      return {
        status: 'deactivated',
        label: 'Deactivated',
        color: 'red',
        reason: this.deactivation_reason,
        timestamp: this.deactivated_at
      };
    }

    return {
      status: 'active',
      label: 'Active',
      color: 'green'
    };
  }

  /**
   * Validate dropdown list data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.name?.trim()) {
      errors.push('Dropdown list name is required');
    }

    if (this.options.length === 0) {
      errors.push('At least one option is required');
    }

    // Validate options
    this.options.forEach((option, index) => {
      if (!option.label?.trim()) {
        errors.push(`Option ${index + 1}: Label is required`);
      }
      if (!option.value?.trim()) {
        errors.push(`Option ${index + 1}: Value is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new dropdown list instance
   * @param {string} name
   * @param {string} companyId
   * @param {Array<{label: string, value: string, parentValue?: string}>} options
   * @returns {DropdownListModel}
   */
  static create(name, companyId, options = []) {
    const formattedOptions = options.map(opt => ({
      label: opt.label,
      value: opt.value,
      parent_option_id: opt.parentValue || ''
    }));

    return new DropdownListModel({
      name: name?.trim(),
      company_id: companyId,
      options: formattedOptions,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// =================================================================================
// TICKET MODELS
// =================================================================================

/**
 * @typedef {Object} Ticket
 * @property {string} id - Unique ticket identifier
 * @property {string} ticket_number - User-facing ticket number (e.g., MAIN-PR-2025-00000001)
 * @property {string} title - Ticket title
 * @property {string} ticket_type_id - Ticket type identifier
 * @property {string} requester_id - User ID who created the ticket
 * @property {string} status - Current ticket status
 * @property {string|null} current_step_id - Current workflow step
 * @property {string|null} step_due_date - Due date for current step
 * @property {string} company_id - Company identifier
 * @property {boolean} is_active - Whether the ticket is active (not deleted)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} created_by - User ID who created the record
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} updated_by - User ID who last updated the record
 * @property {string|null} deleted_at - ISO timestamp when deleted (null if not deleted)
 * @property {string|null} deleted_by - User ID who deleted (null if not deleted)
 * @property {string|null} deletion_reason - Reason for deletion (null if not deleted)
 * @property {string[]} children - Child ticket IDs
 * @property {string|null} parent - Parent ticket ID
 */

export class TicketModel {
  /**
   * @param {Ticket} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.ticket_number = data.ticket_number || '';
    this.title = data.title || '';
    this.ticket_type_id = data.ticket_type_id || '';
    this.requester_id = data.requester_id || '';
    this.status = data.status || 'New';
    this.current_step_id = data.current_step_id || null;
    this.step_due_date = data.step_due_date || null;
    this.company_id = data.company_id || '';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_at = data.updated_at || new Date().toISOString();
    this.updated_by = data.updated_by || '';
    this.deleted_at = data.deleted_at || null;
    this.deleted_by = data.deleted_by || null;
    this.deletion_reason = data.deletion_reason || null;
    this.children = data.children || [];
    this.parent = data.parent || null;
  }

  /**
   * Check if ticket is overdue
   * @returns {boolean}
   */
  get isOverdue() {
    if (!this.step_due_date) return false;
    return new Date(this.step_due_date) < new Date();
  }

  /**
   * Check if ticket is due today
   * @returns {boolean}
   */
  get isDueToday() {
    if (!this.step_due_date) return false;
    const dueDate = new Date(this.step_due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  }

  /**
   * Get ticket age in days
   * @returns {number}
   */
  get ageInDays() {
    const created = new Date(this.created_at);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if ticket has children
   * @returns {boolean}
   */
  get hasChildren() {
    return this.children.length > 0;
  }

  /**
   * Check if ticket is a child ticket
   * @returns {boolean}
   */
  get isChild() {
    return !!this.parent;
  }

  /**
   * Get status color for UI
   * @returns {string}
   */
  get statusColor() {
    const statusColors = {
      'New': 'blue',
      'In Progress': 'yellow',
      'Pending Approval': 'orange',
      'Approved': 'green',
      'Rejected': 'red',
      'Completed': 'green',
      'Cancelled': 'gray',
      'On Hold': 'purple'
    };
    return statusColors[this.status] || 'gray';
  }

  /**
   * Parse ticket number components
   * @returns {{company: string, type: string, year: string, sequence: string}}
   */
  get ticketNumberParts() {
    const parts = this.ticket_number.split('-');
    if (parts.length === 4) {
      return {
        company: parts[0],
        type: parts[1],
        year: parts[2],
        sequence: parts[3]
      };
    }
    return { company: '', type: '', year: '', sequence: '' };
  }

  /**
   * Validate ticket data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.title?.trim()) {
      errors.push('Ticket title is required');
    }

    if (!this.ticket_type_id?.trim()) {
      errors.push('Ticket type is required');
    }

    if (!this.requester_id?.trim()) {
      errors.push('Requester ID is required');
    }

    if (!this.company_id?.trim()) {
      errors.push('Company ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new ticket instance
   * @param {string} title
   * @param {string} ticketTypeId
   * @param {string} requesterId
   * @param {string} companyId
   * @returns {TicketModel}
   */
  static create(title, ticketTypeId, requesterId, companyId) {
    return new TicketModel({
      title: title?.trim(),
      ticket_type_id: ticketTypeId,
      requester_id: requesterId,
      company_id: companyId,
      status: 'New',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// =================================================================================
// USER MODELS
// =================================================================================

/**
 * @typedef {Object} User
 * @property {string} id - User identifier (Firebase UID)
 * @property {string} email - User email address
 * @property {string} displayName - User display name
 * @property {string} photoURL - User profile photo URL
 * @property {Role[]} roles - User roles
 * @property {Company[]} companies - Companies user has access to
 */

export class UserModel {
  /**
   * @param {User} data
   */
  constructor(data = {}) {
    this.id = data.id || data.uid || '';
    this.email = data.email || '';
    this.displayName = data.displayName || '';
    this.photoURL = data.photoURL || '';
    this.roles = (data.roles || []).map(role => new RoleModel(role));
    this.companies = (data.companies || []).map(company => new CompanyModel(company));
  }

  /**
   * Get user's first name
   * @returns {string}
   */
  get firstName() {
    return this.displayName?.split(' ')[0] || this.email?.split('@')[0] || 'User';
  }

  /**
   * Check if user has admin role
   * @returns {boolean}
   */
  get isAdmin() {
    return this.roles.some(role => role.name.toLowerCase().includes('admin'));
  }

  /**
   * Get user's primary role
   * @returns {RoleModel|null}
   */
  get primaryRole() {
    return this.roles.length > 0 ? this.roles[0] : null;
  }

  /**
   * Check if user can access company
   * @param {string} companyId
   * @returns {boolean}
   */
  canAccessCompany(companyId) {
    return this.companies.some(company => company.id === companyId);
  }

  /**
   * Get user role for specific company
   * @param {string} companyId
   * @returns {RoleModel|null}
   */
  getRoleForCompany(companyId) {
    return this.roles.find(role =>
      role.company_id === companyId || role.isGlobal
    ) || null;
  }
}

// =================================================================================
// API RESPONSE MODELS
// =================================================================================

/**
 * @typedef {Object} APIResponse
 * @property {any} data - Response data
 * @property {string} status - Response status ('success' or 'error')
 * @property {string|null} error - Error message if status is 'error'
 * @property {string} timestamp - ISO timestamp of response
 */

export class APIResponseModel {
  /**
   * @param {APIResponse} data
   */
  constructor(data = {}) {
    this.data = data.data || null;
    this.status = data.status || 'success';
    this.error = data.error || null;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Check if response is successful
   * @returns {boolean}
   */
  get isSuccess() {
    return this.status === 'success';
  }

  /**
   * Check if response has error
   * @returns {boolean}
   */
  get isError() {
    return this.status === 'error';
  }
}

// =================================================================================
// VALIDATION UTILITIES
// =================================================================================

export const ValidationUtils = {
  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate company code format
   * @param {string} code
   * @returns {boolean}
   */
  isValidCompanyCode(code) {
    return /^[A-Z0-9]{2,8}$/.test(code);
  },

  /**
   * Validate ticket number format
   * @param {string} ticketNumber
   * @returns {boolean}
   */
  isValidTicketNumber(ticketNumber) {
    return /^[A-Z0-9]{2,8}-[A-Z0-9]{2,8}-\d{4}-\d{8}$/.test(ticketNumber);
  },

  /**
   * Sanitize string input
   * @param {string} input
   * @returns {string}
   */
  sanitizeString(input) {
    return input?.trim().replace(/[<>\"'&]/g, '') || '';
  }
};

// =================================================================================
// EXPORT ALL MODELS
// =================================================================================

export const Models = {
  Company: CompanyModel,
  Role: RoleModel,
  DropdownList: DropdownListModel,
  DropdownOption: DropdownOptionModel,
  Ticket: TicketModel,
  User: UserModel,
  APIResponse: APIResponseModel
};

export default Models;