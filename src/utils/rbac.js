/**
 * Role-Based Access Control (RBAC) Implementation
 * Handles user permissions, roles, and access control throughout the application
 *
 * Note: Implementation is complete but will be toggled off initially.
 * Can be enabled once test users can be created in the backend.
 */

/**
 * System roles with hierarchical permissions
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  USER: 'user',
  READONLY: 'readonly',
  GUEST: 'guest'
};

/**
 * Permission categories
 */
export const PERMISSION_CATEGORIES = {
  TICKETS: 'tickets',
  WORKFLOW: 'workflow',
  USERS: 'users',
  COMPANIES: 'companies',
  REPORTS: 'reports',
  ADMIN: 'admin',
  APPROVALS: 'approvals'
};

/**
 * Permission actions
 */
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  EXPORT: 'export',
  IMPORT: 'import',
  CONFIGURE: 'configure'
};

/**
 * Default role permissions matrix
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  [SYSTEM_ROLES.SUPER_ADMIN]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
      PERMISSION_ACTIONS.ASSIGN,
      PERMISSION_ACTIONS.EXPORT
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
      PERMISSION_ACTIONS.CONFIGURE,
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
      PERMISSION_ACTIONS.ASSIGN
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
      PERMISSION_ACTIONS.CONFIGURE
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.EXPORT,
      PERMISSION_ACTIONS.CREATE
    ],
    [PERMISSION_CATEGORIES.ADMIN]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.CONFIGURE
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.ASSIGN
    ]
  },

  [SYSTEM_ROLES.ADMIN]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.ASSIGN,
      PERMISSION_ACTIONS.EXPORT
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.CONFIGURE,
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.ASSIGN
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.CONFIGURE
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.EXPORT,
      PERMISSION_ACTIONS.CREATE
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.ASSIGN
    ]
  },

  [SYSTEM_ROLES.MANAGER]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.ASSIGN,
      PERMISSION_ACTIONS.EXPORT
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.ASSIGN
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.EXPORT
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT,
      PERMISSION_ACTIONS.READ
    ]
  },

  [SYSTEM_ROLES.SUPERVISOR]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.ASSIGN
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.EXPORT
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.APPROVE,
      PERMISSION_ACTIONS.REJECT,
      PERMISSION_ACTIONS.READ
    ]
  },

  [SYSTEM_ROLES.USER]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.READ
    ]
  },

  [SYSTEM_ROLES.READONLY]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.WORKFLOW]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.USERS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.COMPANIES]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.REPORTS]: [
      PERMISSION_ACTIONS.READ
    ],
    [PERMISSION_CATEGORIES.APPROVALS]: [
      PERMISSION_ACTIONS.READ
    ]
  },

  [SYSTEM_ROLES.GUEST]: {
    [PERMISSION_CATEGORIES.TICKETS]: [
      PERMISSION_ACTIONS.READ
    ]
  }
};

/**
 * RBAC Configuration - Toggle to enable/disable RBAC
 */
export const RBAC_CONFIG = {
  enabled: false, // Set to true to enable RBAC
  fallbackToAllAccess: true, // When disabled, grant all access
  debugMode: false // Enable for debugging permission checks
};

/**
 * Check if RBAC is currently enabled
 * @returns {boolean} True if RBAC is enabled
 */
export const isRBACEnabled = () => {
  return RBAC_CONFIG.enabled;
};

/**
 * Enable RBAC system
 */
export const enableRBAC = () => {
  RBAC_CONFIG.enabled = true;
  console.log('RBAC system enabled');
};

/**
 * Disable RBAC system (fallback to all access)
 */
export const disableRBAC = () => {
  RBAC_CONFIG.enabled = false;
  console.log('RBAC system disabled - using all access mode');
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object with roles
 * @param {string} category - Permission category
 * @param {string} action - Permission action
 * @param {Object} context - Additional context (company, ticket, etc.)
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, category, action, context = {}) => {
  // If RBAC is disabled, grant all access
  if (!isRBACEnabled()) {
    if (RBAC_CONFIG.debugMode) {
      console.log(`RBAC disabled - granting access: ${category}:${action}`);
    }
    return true;
  }

  // If no user, deny access
  if (!user) {
    if (RBAC_CONFIG.debugMode) {
      console.log(`No user - denying access: ${category}:${action}`);
    }
    return false;
  }

  // Check user roles
  const userRoles = getUserRoles(user);

  for (const role of userRoles) {
    if (roleHasPermission(role, category, action, context)) {
      if (RBAC_CONFIG.debugMode) {
        console.log(`Permission granted via role ${role}: ${category}:${action}`);
      }
      return true;
    }
  }

  // Check custom permissions
  if (userHasCustomPermission(user, category, action, context)) {
    if (RBAC_CONFIG.debugMode) {
      console.log(`Permission granted via custom permission: ${category}:${action}`);
    }
    return true;
  }

  if (RBAC_CONFIG.debugMode) {
    console.log(`Permission denied: ${category}:${action} for roles:`, userRoles);
  }

  return false;
};

/**
 * Check if role has specific permission
 * @param {string} role - Role name
 * @param {string} category - Permission category
 * @param {string} action - Permission action
 * @param {Object} context - Additional context
 * @returns {boolean} True if role has permission
 */
export const roleHasPermission = (role, category, action, context = {}) => {
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;

  const categoryPermissions = rolePermissions[category];
  if (!categoryPermissions) return false;

  return categoryPermissions.includes(action);
};

/**
 * Get user roles
 * @param {Object} user - User object
 * @returns {Array} Array of role names
 */
export const getUserRoles = (user) => {
  if (!user) return [];

  // Handle different role storage formats
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles;
  }

  if (user.role) {
    return [user.role];
  }

  if (user.system_role) {
    return [user.system_role];
  }

  // Default to user role if no role specified
  return [SYSTEM_ROLES.USER];
};

/**
 * Check if user has custom permission
 * @param {Object} user - User object
 * @param {string} category - Permission category
 * @param {string} action - Permission action
 * @param {Object} context - Additional context
 * @returns {boolean} True if user has custom permission
 */
export const userHasCustomPermission = (user, category, action, context) => {
  if (!user.custom_permissions) return false;

  const customPerms = user.custom_permissions;

  // Check direct permission
  const permissionKey = `${category}:${action}`;
  if (customPerms[permissionKey] === true) return true;

  // Check context-specific permissions
  if (context.company_id && customPerms.companies) {
    const companyPerms = customPerms.companies[context.company_id];
    if (companyPerms && companyPerms[category] && companyPerms[category].includes(action)) {
      return true;
    }
  }

  return false;
};

/**
 * Get user's effective permissions
 * @param {Object} user - User object
 * @returns {Object} Object with all effective permissions
 */
export const getUserPermissions = (user) => {
  if (!isRBACEnabled()) {
    // Return all permissions when RBAC is disabled
    const allPermissions = {};
    Object.values(PERMISSION_CATEGORIES).forEach(category => {
      allPermissions[category] = Object.values(PERMISSION_ACTIONS);
    });
    return allPermissions;
  }

  const permissions = {};
  const userRoles = getUserRoles(user);

  // Collect permissions from all roles
  userRoles.forEach(role => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
    if (rolePermissions) {
      Object.keys(rolePermissions).forEach(category => {
        if (!permissions[category]) {
          permissions[category] = new Set();
        }
        rolePermissions[category].forEach(action => {
          permissions[category].add(action);
        });
      });
    }
  });

  // Add custom permissions
  if (user.custom_permissions) {
    Object.keys(user.custom_permissions).forEach(permKey => {
      if (user.custom_permissions[permKey] === true) {
        const [category, action] = permKey.split(':');
        if (category && action) {
          if (!permissions[category]) {
            permissions[category] = new Set();
          }
          permissions[category].add(action);
        }
      }
    });
  }

  // Convert Sets to Arrays
  Object.keys(permissions).forEach(category => {
    permissions[category] = Array.from(permissions[category]);
  });

  return permissions;
};

/**
 * Permission checking utilities for common use cases
 */
export const can = {
  // Ticket permissions
  createTicket: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.CREATE, context),
  viewTicket: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.READ, context),
  editTicket: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.UPDATE, context),
  deleteTicket: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.DELETE, context),
  assignTicket: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.ASSIGN, context),
  exportTickets: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.TICKETS, PERMISSION_ACTIONS.EXPORT, context),

  // Approval permissions
  approveStep: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.APPROVALS, PERMISSION_ACTIONS.APPROVE, context),
  rejectStep: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.APPROVALS, PERMISSION_ACTIONS.REJECT, context),
  viewApprovals: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.APPROVALS, PERMISSION_ACTIONS.READ, context),

  // Workflow permissions
  configureWorkflow: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.WORKFLOW, PERMISSION_ACTIONS.CONFIGURE, context),
  viewWorkflow: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.WORKFLOW, PERMISSION_ACTIONS.READ, context),

  // User management permissions
  createUser: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.USERS, PERMISSION_ACTIONS.CREATE, context),
  viewUsers: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.USERS, PERMISSION_ACTIONS.READ, context),
  editUser: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.USERS, PERMISSION_ACTIONS.UPDATE, context),
  deleteUser: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.USERS, PERMISSION_ACTIONS.DELETE, context),

  // Company permissions
  createCompany: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.COMPANIES, PERMISSION_ACTIONS.CREATE, context),
  viewCompanies: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.COMPANIES, PERMISSION_ACTIONS.READ, context),
  editCompany: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.COMPANIES, PERMISSION_ACTIONS.UPDATE, context),
  deleteCompany: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.COMPANIES, PERMISSION_ACTIONS.DELETE, context),

  // Admin permissions
  accessAdmin: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.ADMIN, PERMISSION_ACTIONS.READ, context),
  configureSystem: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.ADMIN, PERMISSION_ACTIONS.CONFIGURE, context),

  // Report permissions
  viewReports: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.REPORTS, PERMISSION_ACTIONS.READ, context),
  exportReports: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.REPORTS, PERMISSION_ACTIONS.EXPORT, context),
  createReports: (user, context) => hasPermission(user, PERMISSION_CATEGORIES.REPORTS, PERMISSION_ACTIONS.CREATE, context)
};

/**
 * Higher-order component for permission-based rendering
 * @param {Object} user - User object
 * @param {string} category - Permission category
 * @param {string} action - Permission action
 * @param {Object} context - Permission context
 * @returns {Function} Component wrapper function
 */
export const withPermission = (user, category, action, context = {}) => {
  return (Component) => {
    return (props) => {
      if (hasPermission(user, category, action, context)) {
        return Component(props);
      }
      return null;
    };
  };
};

/**
 * React hook for permission checking
 * @param {Object} user - User object
 * @returns {Object} Permission checking functions
 */
export const usePermissions = (user) => {
  return {
    hasPermission: (category, action, context) => hasPermission(user, category, action, context),
    can: Object.keys(can).reduce((acc, key) => {
      acc[key] = (context) => can[key](user, context);
      return acc;
    }, {}),
    getUserPermissions: () => getUserPermissions(user),
    isRBACEnabled: isRBACEnabled
  };
};

/**
 * Create RBAC toggle component props
 * @returns {Object} Props for RBAC toggle component
 */
export const createRBACToggleProps = () => {
  return {
    enabled: isRBACEnabled(),
    onEnable: enableRBAC,
    onDisable: disableRBAC,
    status: isRBACEnabled() ? 'RBAC Active' : 'All Access Mode'
  };
};

/**
 * Validate role permissions configuration
 * @param {Object} rolePermissions - Role permissions object
 * @returns {Object} Validation result
 */
export const validateRolePermissions = (rolePermissions) => {
  const errors = [];
  const warnings = [];

  Object.keys(rolePermissions).forEach(role => {
    if (!Object.values(SYSTEM_ROLES).includes(role)) {
      warnings.push(`Unknown role: ${role}`);
    }

    const permissions = rolePermissions[role];
    Object.keys(permissions).forEach(category => {
      if (!Object.values(PERMISSION_CATEGORIES).includes(category)) {
        warnings.push(`Unknown permission category: ${category} in role ${role}`);
      }

      const actions = permissions[category];
      if (!Array.isArray(actions)) {
        errors.push(`Invalid actions format for ${category} in role ${role}`);
        return;
      }

      actions.forEach(action => {
        if (!Object.values(PERMISSION_ACTIONS).includes(action)) {
          warnings.push(`Unknown permission action: ${action} in ${category} for role ${role}`);
        }
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  SYSTEM_ROLES,
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,
  RBAC_CONFIG,
  hasPermission,
  getUserPermissions,
  can,
  usePermissions,
  withPermission,
  isRBACEnabled,
  enableRBAC,
  disableRBAC,
  createRBACToggleProps,
  validateRolePermissions
};