# Revolutionary User/Role Management System
**Feature**: Unified User Profiles, Roles, and Custom Fields
**Status**: Design Complete - Ready for Implementation
**Priority**: High
**Implementation**: Phase 10.0 - Revolutionary User Management
**Updated**: September 27, 2025

## 🎯 Revolutionary Design Overview

This system introduces a groundbreaking approach treating **user profiles AND roles like ticket types** with dynamic custom fields, creating the most flexible user management system possible.

### 🚀 Key Innovations:
- **User Profile Types**: Like ticket types, but for users (Employee, Contractor, Vendor, etc.)
- **Roles as Custom Field Entities**: Roles become configurable with their own custom fields
- **Unified Dropdown System**: Prevents duplication across all entities (tickets, users, roles)
- **Date-Based Management**: Time-limited assignments, auto-expiration, delegation
- **Immediate Approver System**: Direct manager relationships with intelligent fallback logic
- **Three-Tier Custom Fields**: Tickets, User Profiles, and Roles all support dynamic custom fields

## 🏗️ Revolutionary Architecture Design - REUSE STRATEGY

### **🎯 CORE INNOVATION: Reuse Existing Tables with Minimal Changes**

```
✅ SIMPLIFIED APPROACH - REUSE EXISTING INFRASTRUCTURE:

📊 TICKETS (existing)     → ticket_types → custom_fields → custom_field_values
👤 USER PROFILES (new)    → user_profile_types → custom_fields (entity_category='user_profile') → custom_field_values (entity_category='user_profile')
🔐 ROLES (enhanced)       → role_types → custom_fields (entity_category='role') → custom_field_values (entity_category='role')
🎯 WORKFLOW STEPS (future) → step_types → custom_fields (entity_category='workflow_step') → custom_field_values (entity_category='workflow_step')
```

**🌟 KEY BENEFIT: Same tables, same functions, just add entity_category parameter!**

### **🔄 MINIMAL SCHEMA CHANGES REQUIRED**

#### **1. Enhance Existing Tables (Add 1 Column Each)**
```sql
-- Add entity_category to existing custom_fields table
custom_fields (enhanced):
id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by

-- Add entity_category to existing custom_field_values table
custom_field_values (enhanced):
id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by

-- Entity categories: 'ticket' (default/existing), 'user_profile', 'role', 'workflow_step'
```

#### **2. Add Only Essential New Tables**
```sql
user_profile_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

role_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

user_profiles:
user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date|is_active|created_at|updated_at
```

### **📊 ENHANCED DATABASE SCHEMA**

#### **1. User Profile Types (Like Ticket Types)**
```sql
user_profile_types:
id|name|description|code|company_id|requires_approval_on_create|requires_background_check|auto_expire_days|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- upt_employee|Standard Employee|Regular full-time employee|EMP|comp_123|false|false|0
-- upt_contractor|Contractor|External contractor/consultant|CTR|comp_123|true|true|365
-- upt_vendor|Vendor Contact|External vendor contact|VND|comp_123|true|false|0
-- upt_intern|Intern|Student intern or trainee|INT|comp_123|false|false|180
```

#### **2. Enhanced User Profiles (Core + Custom Fields)**
```sql
user_profiles:
user_id|user_profile_type_id|display_name|email|phone|immediate_approver_id|backup_approver_id|status|hire_date|termination_date|last_login_at|is_active|created_at|created_by|updated_at|updated_by

user_profile_custom_fields:
id|user_profile_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

user_profile_custom_field_values:
id|user_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by
```

#### **3. Roles as Custom Field Entities (NEW INNOVATION)**
```sql
role_types:
id|name|description|code|company_id|permission_level|can_approve_steps|max_approval_amount|requires_certification|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- rt_approval|Approval Roles|Roles that can approve workflow steps|APR|comp_123|3|true|50000|false
-- rt_department|Department Roles|Departmental management roles|DEP|comp_123|2|true|10000|false
-- rt_system|System Roles|Administrative system roles|SYS|comp_123|5|true|0|true

roles (enhanced):
id|role_type_id|name|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

role_custom_fields:
id|role_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

role_custom_field_values:
id|role_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by
```

#### **4. Enhanced Date-Based Role Assignments**
```sql
user_role_assignments (revolutionary enhancement):
id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Assignment Types:
-- 'permanent'    - No expiration
-- 'temporary'    - Fixed end date
-- 'project_based'- Tied to project completion
-- 'emergency'    - Short-term urgent assignment
-- 'delegation'   - Temporary delegation during OOO
```

#### **5. Unified Dropdown Integration**
```sql
dropdown_field_mappings (unified system):
id|entity_type|entity_id|field_name|dropdown_list_id|company_id|is_required|display_order|field_label|help_text|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Entity Types:
-- 'ticket_type'       - Custom fields for tickets
-- 'user_profile_type' - Custom fields for user profiles
-- 'role_type'         - Custom fields for roles
-- 'workflow_step'     - Custom fields for workflow steps (future)
```

### **🎨 Revolutionary Component Architecture**

#### **Main Component: AdminUnifiedEntityManager.js**
```javascript
/**
 * AdminUnifiedEntityManager Component - Revolutionary Design
 *
 * This single component manages ALL entity types with custom fields:
 * - Ticket Types (existing)
 * - User Profile Types (new)
 * - Role Types (new)
 * - Workflow Step Types (future)
 *
 * Features:
 * - Dynamic entity type selection
 * - Universal custom field builder
 * - Unified dropdown management
 * - Cross-entity relationship mapping
 * - Bulk operations across all entity types
 */

// Revolutionary sections:
// 1. Entity Type Selector (Tickets/Users/Roles/Workflows)
// 2. Dynamic Type Builder (creates types for any entity)
// 3. Universal Custom Field Builder
// 4. Unified Dropdown Management Interface
// 5. Cross-Entity Relationship Mapper
// 6. Bulk Operations Manager
```

#### **User-Specific Components:**

**1. UserProfileTypeBuilder.js**
```javascript
/**
 * Creates and manages user profile types like ticket types
 * - Employee, Contractor, Vendor, Intern profiles
 * - Custom fields for each profile type
 * - Company-specific customization
 * - Auto-approval and background check settings
 */
```

**2. RoleTypeBuilder.js**
```javascript
/**
 * Creates and manages role types with custom fields
 * - Approval Roles, Department Roles, System Roles
 * - Permission levels and approval limits
 * - Certification requirements
 * - Custom role attributes via fields
 */
```

**3. DynamicUserProfileForm.js**
```javascript
/**
 * Dynamically generated user profile forms
 * - Based on selected user profile type
 * - Renders custom fields automatically
 * - Handles all field types (text, date, dropdown, etc.)
 * - Validation and submission logic
 */
```

**4. DateBasedRoleAssignmentManager.js**
```javascript
/**
 * Advanced role assignment with date management
 * - Start/end dates for assignments
 * - Auto-expiration with notifications
 * - Temporary delegation during OOO
 * - Assignment approval workflows
 */
```

**5. ImmediateApproverManager.js**
```javascript
/**
 * Manager relationships and approval routing
 * - Direct supervisor assignments
 * - Backup approver configuration
 * - Organizational hierarchy visualization
 * - Approval routing logic
 */
```

#### **Revolutionary Sub-Components:**

**1. UniversalEntityCard.js**
- Works for any entity type (users, roles, tickets)
- Dynamic display based on entity custom fields
- Status indicators and quick actions
- Relationship visualization

**2. DateBasedRoleMatrix.js**
- Visual matrix with time-based assignments
- Drag-and-drop with date range selection
- Color-coded expiration indicators
- Delegation and approval workflows
- Auto-expiration notifications

**3. RoleCustomFieldEditor.js**
- Edit custom fields for specific roles
- Role-specific attributes and permissions
- Certification tracking
- Performance metrics integration

**4. UnifiedCustomFieldBuilder.js**
- Universal custom field builder for all entity types
- Field type selection (text, date, dropdown, etc.)
- Dependency management between fields
- Validation rule configuration
- Company-specific field customization

**5. DropdownFieldMapper.js**
- Maps dropdown lists to any entity type
- Prevents duplication across entities
- Company-specific dropdown assignments
- Global vs. company-specific dropdown management

### **🔄 REUSE STRATEGY: EXISTING FUNCTION ENHANCEMENT**

#### **1. AppScript Functions - Minimal Changes Required**

##### **Existing Custom Field Functions (Enhance with entity_category)**
```javascript
// BEFORE: Only worked for tickets
function getCustomFields(ticketTypeId) {
  // existing implementation
}

// AFTER: Works for any entity type
function getCustomFields(entityTypeId, entityCategory = 'ticket') {
  const sheet = getSheet('custom_fields');
  const data = sheet.getDataRange().getValues();

  return data.slice(1).filter(row => {
    // Backward compatibility: if no category or 'ticket', use original logic
    if (!entityCategory || entityCategory === 'ticket') {
      return row[1] === entityTypeId && (!row[2] || row[2] === 'ticket');
    }

    // New entities: match both entity_type_id and category
    return row[1] === entityTypeId && row[2] === entityCategory;
  });
}

// BEFORE: Only worked for tickets
function createCustomField(ticketTypeId, fieldData) {
  // existing implementation
}

// AFTER: Works for any entity type
function createCustomField(entityTypeId, fieldData, entityCategory = 'ticket') {
  const sheet = getSheet('custom_fields');
  const id = generateUniqueId();

  sheet.appendRow([
    id,
    entityTypeId,
    entityCategory,  // NEW: Add entity category
    fieldData.name,
    fieldData.label,
    fieldData.type,
    fieldData.is_required,
    fieldData.is_hidden,
    fieldData.sort_order,
    fieldData.dropdown_list_id,
    fieldData.depends_on_field_id,
    true, // is_active
    new Date(),
    fieldData.created_by
  ]);

  return id;
}

// BEFORE: Only worked for tickets
function setCustomFieldValue(ticketId, fieldId, value) {
  // existing implementation
}

// AFTER: Works for any entity
function setCustomFieldValue(entityId, fieldId, value, entityCategory = 'ticket') {
  const sheet = getSheet('custom_field_values');

  // Find existing value row
  const data = sheet.getDataRange().getValues();
  const existingRowIndex = data.findIndex(row =>
    row[1] === entityId &&
    row[2] === entityCategory &&  // NEW: Check entity category
    row[3] === fieldId
  );

  if (existingRowIndex > 0) {
    updateCustomFieldValueRow(existingRowIndex, value);
  } else {
    createNewCustomFieldValue(entityId, entityCategory, fieldId, value);
  }
}
```

##### **New Entity Type Management Functions (Minimal Addition)**
```javascript
// User Profile Types
function getUserProfileTypes(companyId = null) {
  return getEntityTypes('user_profile_types', companyId);
}

function createUserProfileType(profileTypeData) {
  return createEntityType('user_profile_types', profileTypeData);
}

// Role Types
function getRoleTypes(companyId = null) {
  return getEntityTypes('role_types', companyId);
}

function createRoleType(roleTypeData) {
  return createEntityType('role_types', roleTypeData);
}

// Universal helper function
function getEntityTypes(tableName, companyId = null) {
  const sheet = getSheet(tableName);
  const data = sheet.getDataRange().getValues();

  return data.slice(1)
    .filter(row => !companyId || row[4] === companyId || row[4] === null)
    .map(row => ({
      id: row[0],
      name: row[1],
      description: row[2],
      code: row[3],
      company_id: row[4],
      is_active: row[5]
    }));
}
```

#### **2. Frontend Components - Reuse with Enhancement**

##### **Existing Components to Enhance (Add entity_category support)**
```javascript
// BEFORE: AdminCustomFieldBuilder.js (only for tickets)
const AdminCustomFieldBuilder = ({ ticketTypeId }) => {
  const { data: customFields } = useCustomFields(ticketTypeId);
  // existing implementation
}

// AFTER: AdminCustomFieldBuilder.js (universal)
const AdminCustomFieldBuilder = ({
  entityTypeId,
  entityCategory = 'ticket',
  entityTypeName = 'Ticket Type'
}) => {
  const { data: customFields } = useCustomFields(entityTypeId, entityCategory);

  return (
    <div>
      <h3>Custom Fields for {entityTypeName}</h3>
      {/* Same UI, just enhanced hooks */}
      <CustomFieldList
        fields={customFields}
        onFieldCreate={(fieldData) => createCustomField(entityTypeId, fieldData, entityCategory)}
        onFieldUpdate={(fieldId, fieldData) => updateCustomField(fieldId, fieldData, entityCategory)}
      />
    </div>
  );
}

// Usage examples:
// <AdminCustomFieldBuilder entityTypeId="tt_purchase" entityCategory="ticket" entityTypeName="Purchase Request" />
// <AdminCustomFieldBuilder entityTypeId="upt_employee" entityCategory="user_profile" entityTypeName="Employee Profile" />
// <AdminCustomFieldBuilder entityTypeId="rt_manager" entityCategory="role" entityTypeName="Manager Role" />
```

##### **Existing Hooks to Enhance (Add entity_category parameter)**
```javascript
// BEFORE: useAPI.js (only for tickets)
export const useCustomFields = (ticketTypeId) => {
  return useQuery(['customFields', ticketTypeId], () =>
    API.getCustomFields(ticketTypeId)
  );
}

// AFTER: useAPI.js (universal)
export const useCustomFields = (entityTypeId, entityCategory = 'ticket') => {
  return useQuery(['customFields', entityTypeId, entityCategory], () =>
    API.getCustomFields(entityTypeId, entityCategory)
  );
}

export const useCustomFieldValues = (entityId, entityCategory = 'ticket') => {
  return useQuery(['customFieldValues', entityId, entityCategory], () =>
    API.getCustomFieldValues(entityId, entityCategory)
  );
}

export const useSetCustomFieldValue = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ entityId, fieldId, value, entityCategory = 'ticket' }) =>
      API.setCustomFieldValue(entityId, fieldId, value, entityCategory),
    {
      onSuccess: (_, { entityId, entityCategory }) => {
        queryClient.invalidateQueries(['customFieldValues', entityId, entityCategory]);
      }
    }
  );
}
```

### **🚀 Revolutionary API Endpoints**

#### **Enhanced Existing + New Functions (Google Apps Script):**

```javascript
// Universal Entity Type Management
function getEntityTypes(entityCategory) // 'user_profile', 'role', 'ticket', 'workflow_step'
function createEntityType(entityCategory, typeData)
function updateEntityType(entityCategory, typeId, typeData)
function copyEntityType(sourceTypeId, targetCompanyId)

// Universal Custom Fields (works for all entity types)
function getEntityCustomFields(entityType, entityTypeId)
function createEntityCustomField(entityType, entityTypeId, fieldData)
function updateEntityCustomField(entityType, fieldId, fieldData)
function deleteEntityCustomField(entityType, fieldId)

// Universal Custom Field Values (works for all entity instances)
function getEntityCustomFieldValues(entityType, entityId)
function setEntityCustomFieldValue(entityType, entityId, fieldId, value)
function bulkUpdateEntityCustomFields(entityType, updates)

// User Profile Type Management
function getUserProfileTypes(companyId = null)
function createUserProfileType(profileTypeData)
function getUserProfileCustomFields(profileTypeId)
function createUserWithProfileType(userData, profileTypeId)

// Role Type Management (NEW INNOVATION)
function getRoleTypes(companyId = null)
function createRoleType(roleTypeData)
function getRoleCustomFields(roleTypeId)
function createRoleWithType(roleData, roleTypeId)
function setRoleCustomFieldValue(roleId, fieldId, value)

// Date-Based Role Assignments
function assignRoleWithDates(userId, roleId, assignmentData)
function getExpiringAssignments(daysAhead = 30)
function processPendingExpirations()
function delegateRoleTemporarily(fromUserId, toUserId, roleId, startDate, endDate)

// Immediate Approver Management
function setImmediateApprover(userId, approverId)
function getApprovalHierarchy(userId)
function getDirectReports(managerId)
function findApproverForTicket(ticketId, stepRequirement)

// Unified Dropdown Field Mapping
function mapDropdownToEntityField(entityType, entityId, fieldName, dropdownListId)
function getDropdownFieldMappings(entityType, entityId)
function createSystemDropdownMappings() // Initialize system defaults
```

### **🎣 Revolutionary React Hooks Integration**

#### **Universal Entity Hooks in useAPI.js:**

```javascript
// Universal Entity Management Hooks
export const useEntityTypes = (entityCategory) => {
  // Get all types for any entity category (user_profile, role, ticket, workflow_step)
}

export const useEntityCustomFields = (entityType, entityTypeId) => {
  // Get custom fields for any entity type
}

export const useEntityCustomFieldValues = (entityType, entityId) => {
  // Get custom field values for any entity instance
}

export const useUniversalEntityBuilder = () => {
  // Universal CRUD for any entity type with custom fields
  return {
    createEntityType,
    updateEntityType,
    deleteEntityType,
    copyEntityType,
    createCustomField,
    updateCustomField,
    setCustomFieldValue
  };
}

// User Profile Type Hooks
export const useUserProfileTypes = (companyId) => {
  // Get available user profile types
}

export const useDynamicUserProfile = (userId, profileTypeId) => {
  // Get user profile with dynamic custom fields
}

export const useUserProfileBuilder = () => {
  // Build user profiles with custom fields
}

// Role Type Hooks (NEW INNOVATION)
export const useRoleTypes = (companyId) => {
  // Get available role types
}

export const useRoleWithCustomFields = (roleId) => {
  // Get role with its custom field values
}

export const useRoleCustomFieldEditor = (roleId) => {
  // Edit custom fields for specific role
}

// Date-Based Role Assignment Hooks
export const useDateBasedRoleAssignments = (userId) => {
  // Get user's time-based role assignments
}

export const useExpiringAssignments = (daysAhead = 30) => {
  // Get assignments expiring soon
}

export const useRoleDelegation = () => {
  // Manage temporary role delegation
}

// Immediate Approver Hooks
export const useImmediateApprover = (userId) => {
  // Get user's immediate approver
}

export const useApprovalHierarchy = (userId) => {
  // Get full approval chain for user
}

export const useDirectReports = (managerId) => {
  // Get users who report to this manager
}

// Unified Dropdown Integration Hooks
export const useDropdownFieldMappings = (entityType, entityId) => {
  // Get dropdown mappings for any entity
}

export const useUnifiedDropdowns = () => {
  // Manage dropdowns across all entity types
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