# Universal Entity Architecture Reference
**Version**: 1.0
**Date**: September 27, 2025
**Status**: 🚨 **MANDATORY REFERENCE** - Required reading before any development work
**Purpose**: Define universal entity concept for tickets, user profiles, and roles

## 🚨 MANDATORY DEVELOPMENT RULE

**BEFORE ANY COMPONENT, API, OR SCHEMA WORK:**
- **MUST READ** this document to understand universal entity architecture
- **MUST FOLLOW** universal entity patterns for consistent implementation
- **MUST REFERENCE** this document when creating entity-related code

## 🌟 Universal Entity Concept Overview

### **What IS Universal (Reused Architecture):**
✅ **Custom Fields Infrastructure** - Same tables, same functions, same UI
✅ **Dynamic Form Building** - Same AdminCustomFieldBuilder component for all entities
✅ **Dropdown System** - Unified dropdown_lists shared across all entity types
✅ **API Patterns** - Same CRUD functions with `entityCategory` parameter
✅ **UI Components** - Same form builders, field editors, validation logic
✅ **Data Storage** - Same custom_fields and custom_field_values tables

### **What is NOT Universal (Entity-Specific Features):**
❌ **SLAs** - Only apply to tickets/workflows, NOT user profiles or roles
❌ **Workflow Engine** - Specific to ticket processing only
❌ **Approval Routing** - Ticket-specific business logic only
❌ **Status Transitions** - Not relevant for user/role management
❌ **Due Dates** - Only applicable to tickets with SLA requirements

## 🎯 Core Architecture Principle

**"Same Infrastructure, Different Data"**

```
📊 TICKETS      → custom_fields (entity_category='ticket')      → custom_field_values
👤 USER PROFILES → custom_fields (entity_category='user_profile') → custom_field_values
🔐 ROLES        → custom_fields (entity_category='role')        → custom_field_values
⚡ WORKFLOWS    → custom_fields (entity_category='workflow_step') → custom_field_values (future)
```

**Key Innovation**: One set of tables, functions, and UI components serves all entity types through the `entity_category` parameter.

## 🔧 Technical Implementation

### **1. Database Schema (Minimal Changes)**

#### **Enhanced Existing Tables (Add 1 Column Each):**
```sql
-- Add entity_category to existing custom_fields table
custom_fields (enhanced):
id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|...

-- Add entity_category to existing custom_field_values table
custom_field_values (enhanced):
id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|...

-- Entity categories: 'ticket' (default/existing), 'user_profile', 'role', 'workflow_step'
```

#### **Essential New Tables Only:**
```sql
user_profile_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

role_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

user_profiles:
user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date|is_active|created_at|updated_at
```

### **2. API Functions (Enhanced with entity_category)**

#### **Enhanced Existing Functions (Backward Compatible):**
```javascript
// BEFORE: Only worked for tickets
function getCustomFields(ticketTypeId) { ... }

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

// Same enhancement pattern for:
// - createCustomField(entityTypeId, fieldData, entityCategory = 'ticket')
// - setCustomFieldValue(entityId, fieldId, value, entityCategory = 'ticket')
// - updateCustomField(fieldId, fieldData, entityCategory = 'ticket')
```

#### **New Entity Type Management Functions:**
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
```

### **3. React Components (Enhanced with entityCategory)**

#### **Enhanced Existing Components:**
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

#### **Enhanced React Hooks:**
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

## 🎨 Practical Usage Examples

### **For User Profiles:**
```javascript
// Create employee profile type with custom fields
const employeeType = await createUserProfileType({
  name: 'Standard Employee',
  code: 'EMP',
  company_id: 'comp_123'
});

// Add custom fields to employee profile type
await createCustomField(employeeType.id, {
  name: 'employee_id',
  label: 'Employee ID',
  type: 'text',
  is_required: true
}, 'user_profile');

await createCustomField(employeeType.id, {
  name: 'department',
  label: 'Department',
  type: 'dropdown',
  dropdown_list_id: 'dd_departments'
}, 'user_profile');

// UI Component Usage
<AdminCustomFieldBuilder
  entityTypeId={employeeType.id}
  entityCategory="user_profile"
  entityTypeName="Employee Profile"
/>
```

### **For Roles:**
```javascript
// Create approval role type with custom fields
const approvalRoleType = await createRoleType({
  name: 'Approval Roles',
  code: 'APR',
  company_id: 'comp_123'
});

// Add custom fields to role type
await createCustomField(approvalRoleType.id, {
  name: 'approval_level',
  label: 'Approval Level',
  type: 'dropdown',
  dropdown_list_id: 'dd_approval_levels'
}, 'role');

await createCustomField(approvalRoleType.id, {
  name: 'max_amount',
  label: 'Maximum Approval Amount',
  type: 'amount',
  is_required: true
}, 'role');

// UI Component Usage
<AdminCustomFieldBuilder
  entityTypeId={approvalRoleType.id}
  entityCategory="role"
  entityTypeName="Approval Role"
/>
```

### **For Tickets (Existing):**
```javascript
// Existing ticket functionality continues unchanged
<AdminCustomFieldBuilder
  entityTypeId="tt_purchase_request"
  entityCategory="ticket"  // default value
  entityTypeName="Purchase Request"
/>
```

## 🔄 Migration and Backward Compatibility

### **Zero Breaking Changes:**
- All existing component imports work unchanged
- All existing hook calls work unchanged
- All existing API calls work unchanged
- Backward compatibility maintained 100%

### **Schema Migration:**
```sql
-- Add entity_category columns with defaults
ALTER TABLE custom_fields ADD COLUMN entity_category TEXT DEFAULT 'ticket';
ALTER TABLE custom_field_values ADD COLUMN entity_category TEXT DEFAULT 'ticket';

-- Create new entity type tables
CREATE TABLE user_profile_types (...);
CREATE TABLE role_types (...);
CREATE TABLE user_profiles (...);

-- Update existing data (optional - works without this)
UPDATE custom_fields SET entity_category = 'ticket' WHERE entity_category IS NULL;
UPDATE custom_field_values SET entity_category = 'ticket' WHERE entity_category IS NULL;
```

### **API Migration:**
```javascript
// Existing calls continue working (default entityCategory='ticket')
const ticketFields = await getCustomFields('tt_purchase_request');

// New entity calls use entityCategory parameter
const userFields = await getCustomFields('upt_employee', 'user_profile');
const roleFields = await getCustomFields('rt_manager', 'role');
```

## 🛡️ Development Guidelines

### **Component Development:**
1. **Reuse Existing Components**: Always check if AdminCustomFieldBuilder can be enhanced instead of creating new components
2. **EntityCategory Parameter**: Add entityCategory prop to any component that works with custom fields
3. **Default Values**: Always default entityCategory to 'ticket' for backward compatibility
4. **Type Safety**: Use entityCategory for API caching keys and data separation

### **API Development:**
1. **Enhance Existing Functions**: Add entityCategory parameter to existing custom field functions
2. **Backward Compatibility**: Default entityCategory = 'ticket' for all existing calls
3. **Data Filtering**: Filter data by both entity_type_id AND entity_category
4. **Validation**: Ensure entity_category is one of: 'ticket', 'user_profile', 'role', 'workflow_step'

### **Database Development:**
1. **Column Additions Only**: Add entity_category columns to existing tables, don't create duplicates
2. **Default Values**: Set entity_category = 'ticket' as default for backward compatibility
3. **Index Strategy**: Create compound indexes on (entity_type_id, entity_category) for performance
4. **Foreign Keys**: Maintain existing foreign key relationships

## 📋 Architecture Benefits

### **Development Efficiency:**
- **90% Code Reuse**: Same components, hooks, and functions for all entity types
- **Consistent UX**: Same form building experience across tickets, users, and roles
- **Reduced Complexity**: One system to maintain instead of separate systems per entity type
- **Faster Implementation**: New entity types can be added with minimal code

### **Business Benefits:**
- **Flexible Configuration**: Same level of customization for users and roles as tickets
- **Unified Administration**: Same admin interface patterns across all entity types
- **Scalable Architecture**: Easy to add new entity types (workflow_steps, etc.) in future
- **Consistent Data Model**: Same validation, audit fields, and data patterns

### **Technical Benefits:**
- **Single Source of Truth**: One custom fields system serves all entity types
- **Performance Optimized**: Shared caching, validation, and rendering logic
- **Type Safety**: Clear entity_category parameter prevents data mixing
- **Testable**: Same test patterns and validation logic across all entities

## 🚨 Critical Success Factors

### **MUST DO:**
1. **Always use entityCategory parameter** when working with custom fields
2. **Default to 'ticket'** for backward compatibility in all functions
3. **Reuse existing components** instead of creating entity-specific ones
4. **Test with all entity categories** when modifying custom field functionality

### **MUST NOT DO:**
1. **Don't create separate custom field systems** for different entity types
2. **Don't apply ticket-specific logic** (SLAs, workflows) to user profiles or roles
3. **Don't break backward compatibility** with existing ticket functionality
4. **Don't duplicate UI components** when entityCategory enhancement will work

## 📚 Related Documentation

### **Core References:**
- **`USER_MANAGEMENT_FEATURE_PLAN.md`** - Complete user/role system design
- **`DATABASE_SCHEMA_UPDATES.txt`** - Detailed schema changes and migration plan
- **`DEPENDENCY_MAPPING.md`** - Component architecture and universal entity integration
- **`DEVELOPMENT_PLAN.md`** - Implementation phases and current status
- **`CLAUDE.md`** - Overall system specifications and universal entity rules

### **Implementation Guides:**
- **`SLA_IMPLEMENTATION.md`** - SLA system (tickets only, not universal)
- **`SUPERTHINK_AUDIT.md`** - Code quality and dependency validation
- **`PRODUCTION_REQUIREMENTS.md`** - Environment and deployment requirements

---

## 📖 Quick Reference Summary

**Universal Entity Architecture = Same Infrastructure + Different Data**

**What to Reuse:**
- custom_fields & custom_field_values tables (+ entity_category column)
- AdminCustomFieldBuilder component (+ entityCategory prop)
- useCustomFields hooks (+ entityCategory parameter)
- API functions for custom fields (+ entityCategory parameter)
- Dropdown system (unified across all entity types)

**What NOT to Apply Universally:**
- SLA calculations and due dates
- Workflow engines and status transitions
- Approval routing logic
- Ticket-specific business rules

**Entity Categories:**
- `'ticket'` - Existing ticket custom fields (default)
- `'user_profile'` - User profile custom fields (new)
- `'role'` - Role custom fields (new)
- `'workflow_step'` - Future workflow step custom fields

**Backward Compatibility:** 100% maintained through default entityCategory='ticket'

---

**Last Updated**: September 27, 2025
**Next Review**: When adding new entity types or custom field functionality
**Status**: 📋 **DESIGN SPECIFICATION** - Implementation pending