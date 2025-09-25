# Per-User Management Feature Plan
**Feature**: Individual User Management & Permissions
**Status**: Planning Phase
**Priority**: Medium
**Implementation**: Future Phase

## 🎯 Feature Overview

The per-user management feature will provide administrators with granular control over individual users, their permissions, role assignments, and access patterns within the ticketing system.

## 🏗️ Architecture Design

### **Database Schema Requirements**

#### **Enhanced user_role_assignments Table:**
```
Current: id|user_id|ticket_type_id|role_id|validity_end_date|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

Additional Fields Needed:
- assignment_type (ENUM: 'permanent', 'temporary', 'project_based')
- assigned_by_user_id (User ID who made the assignment)
- approval_required (BOOLEAN - whether assignment needs approval)
- auto_expire_days (INT - automatic expiration period)
- assignment_notes (TEXT - reason/notes for assignment)
```

#### **New user_profiles Table:**
```
id|user_id|display_name|email|phone|department|job_title|manager_user_id|hire_date|status|timezone|language|profile_photo_url|last_login_at|login_count|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason
```

#### **New user_permissions Table:**
```
id|user_id|permission_type|resource_type|resource_id|granted_by|granted_at|expires_at|is_active|created_at|created_by|updated_at|updated_by|revoked_at|revoked_by|revocation_reason
```

#### **New user_activity_log Table:**
```
id|user_id|activity_type|resource_type|resource_id|details|ip_address|user_agent|timestamp
```

### **Component Architecture**

#### **Main Component: AdminUserManager.js**
```javascript
/**
 * AdminUserManager Component
 *
 * Features:
 * - User search and filtering
 * - Individual user profile management
 * - Role assignment interface
 * - Permission matrix display
 * - Activity monitoring
 * - Bulk operations
 */

// Key sections:
// 1. User List with Search/Filter
// 2. User Detail Panel
// 3. Role Assignment Matrix
// 4. Permission Override Interface
// 5. Activity Timeline
// 6. User Status Management
```

#### **Sub-Components:**

**1. UserProfileCard.js**
- Display user basic information
- Status indicators (active, inactive, locked)
- Quick actions (edit, deactivate, reset password)

**2. UserRoleMatrix.js**
- Visual matrix of user roles across companies/ticket types
- Drag-and-drop role assignment
- Validity period management
- Approval workflow integration

**3. UserPermissionOverrides.js**
- Special permissions beyond role-based access
- Resource-specific permissions
- Time-limited access grants

**4. UserActivityTimeline.js**
- Login history
- Action audit trail
- Performance metrics
- Security events

**5. UserBulkActions.js**
- Mass role assignments
- Bulk user imports
- Department-wide changes
- Notification broadcasts

### **API Endpoints Required**

#### **Google Apps Script Functions:**

```javascript
// User Management
function getAllUsers(filters = {})
function getUserById(userId)
function createUser(userData)
function updateUser(userId, userData)
function deactivateUser(userId, reason)
function reactivateUser(userId)

// Role Assignments
function getUserRoles(userId, companyId = null)
function assignRoleToUser(userId, roleId, ticketTypeId, companyId, validityPeriod)
function removeRoleFromUser(userId, roleId, ticketTypeId, companyId)
function bulkAssignRoles(assignments)

// Permissions
function getUserPermissions(userId)
function grantPermission(userId, permissionData)
function revokePermission(userId, permissionId)
function checkUserPermission(userId, resource, action)

// Activity & Monitoring
function getUserActivity(userId, filters = {})
function getUserLoginHistory(userId, limit = 50)
function getUserPerformanceMetrics(userId, dateRange)

// Bulk Operations
function bulkUpdateUsers(userUpdates)
function importUsers(userData)
function exportUsers(filters = {})
```

### **React Hooks Integration**

#### **New Hooks in useAPI.js:**

```javascript
// User Management Hooks
export const useUserManagement = () => {
  // CRUD operations for users
}

export const useUserRoles = (userId) => {
  // Get user's role assignments
}

export const useUserPermissions = (userId) => {
  // Get user's specific permissions
}

export const useUserActivity = (userId, filters = {}) => {
  // Get user activity history
}

export const useUserBulkOperations = () => {
  // Bulk user operations
}

// Permission Checking Hooks
export const useUserCan = (userId, resource, action) => {
  // Check if user has permission
}

export const useCurrentUserPermissions = () => {
  // Get current user's permissions
}
```

## 🎨 UI/UX Design Specifications

### **User List Interface**
- **Search/Filter Bar**: Name, email, department, role, status
- **Sort Options**: Last login, creation date, name, activity level
- **View Modes**: List view, card view, table view
- **Bulk Selection**: Checkbox selection for mass operations

### **User Detail Panel**
- **Tabbed Interface**:
  1. **Profile**: Basic info, contact details, department
  2. **Roles**: Role assignments with company/ticket type matrix
  3. **Permissions**: Special permissions and overrides
  4. **Activity**: Login history, actions, performance
  5. **Settings**: Preferences, notifications, security

### **Role Assignment Matrix**
- **Visual Grid**: Companies (rows) × Ticket Types (columns)
- **Role Indicators**: Color-coded badges for different roles
- **Drag-and-Drop**: Easy role assignment
- **Validity Indicators**: Expiration warnings and timelines

### **Permission Override System**
- **Resource Tree**: Hierarchical view of system resources
- **Permission Types**: Read, Write, Delete, Approve, Admin
- **Time-Limited Grants**: Temporary permission assignments
- **Approval Workflow**: Required approvals for sensitive permissions

## 🔐 Security Considerations

### **Access Control**
- Only admin users can access per-user management
- Audit all user management actions
- Require approval for sensitive role changes
- Implement role hierarchy (can't assign higher roles than own level)

### **Data Protection**
- Mask sensitive user data based on permissions
- Log all access to user information
- Implement data retention policies
- GDPR/privacy compliance features

### **Authentication & Authorization**
- Multi-factor authentication for admin actions
- Session timeouts for security
- IP-based restrictions for sensitive operations
- Rate limiting for bulk operations

## 📊 Feature Capabilities

### **Phase 1: Basic User Management**
- [ ] User profile CRUD operations
- [ ] Basic role assignment interface
- [ ] User search and filtering
- [ ] Activity logging

### **Phase 2: Advanced Permissions**
- [ ] Permission override system
- [ ] Time-limited access grants
- [ ] Approval workflows for role changes
- [ ] Advanced security features

### **Phase 3: Analytics & Monitoring**
- [ ] User performance metrics
- [ ] Activity analytics dashboard
- [ ] Automated security monitoring
- [ ] Compliance reporting

### **Phase 4: Integration & Automation**
- [ ] LDAP/AD integration
- [ ] Automated role provisioning
- [ ] Department-based role templates
- [ ] API for external systems

## 🛠️ Implementation Priority

### **High Priority Components**
1. **AdminUserManager.js** - Main management interface
2. **UserProfileCard.js** - Individual user display
3. **UserRoleMatrix.js** - Role assignment interface
4. **User management API endpoints** - Backend functionality

### **Medium Priority Components**
1. **UserPermissionOverrides.js** - Special permissions
2. **UserActivityTimeline.js** - Activity monitoring
3. **Advanced filtering/search** - Enhanced user discovery

### **Low Priority Components**
1. **UserBulkActions.js** - Mass operations
2. **Analytics dashboard** - Performance metrics
3. **External integrations** - LDAP/AD connectivity

## 🔗 Integration Points

### **Existing System Dependencies**
- **Companies**: User assignments are company-specific
- **Roles**: Extends the current role system
- **Ticket Types**: Role assignments are per ticket type
- **Authentication**: Builds on Firebase Auth
- **Audit System**: Uses existing audit field architecture

### **API Compatibility**
- Extends existing `useAPI.js` hooks
- Compatible with current Google Sheets backend
- Uses established error handling patterns
- Follows existing data model conventions

## 📋 Success Criteria

### **Functional Requirements Met:**
- [ ] Administrators can manage individual users
- [ ] Role assignments work across companies/ticket types
- [ ] Permission overrides function correctly
- [ ] Activity monitoring provides useful insights
- [ ] Bulk operations handle large user sets

### **Performance Requirements:**
- [ ] User list loads within 2 seconds
- [ ] Role assignments update instantly
- [ ] Search results appear within 1 second
- [ ] Bulk operations process 100+ users efficiently

### **Security Requirements:**
- [ ] All user management actions are audited
- [ ] Sensitive operations require proper authorization
- [ ] User data is properly protected
- [ ] Security events are logged and monitored

## 📝 Next Steps

1. **Finalize API Design** - Complete backend endpoint specifications
2. **Create UI Mockups** - Design user management interfaces
3. **Database Schema Update** - Implement required table changes
4. **Component Development** - Build React components
5. **Testing & Validation** - Ensure security and functionality
6. **Documentation** - Update development and user guides

---

**Status**: ✅ **PLANNING COMPLETE** - Ready for implementation prioritization
**Dependencies**: Database schema updates, enhanced audit system
**Estimated Effort**: 2-3 weeks for basic functionality, 4-6 weeks for advanced features