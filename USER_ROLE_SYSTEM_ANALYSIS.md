# User Role System Analysis & Implementation Plan
**Date**: September 27, 2025
**Status**: Analysis & Design Specification - Using Universal Entity Architecture
**Purpose**: Define user general roles, approval permissions, and department assignments

## 🌟 Universal Entity Architecture Integration

### **Core Principle: Reuse Existing Infrastructure**
This implementation leverages the **Universal Entity Architecture** to minimize new code and maximize consistency with existing ticket custom fields system.

#### **What We Reuse from Universal Entity Architecture:**
✅ **Same custom_fields table** with `entity_category='user_profile'` and `entity_category='role'`
✅ **Same AdminCustomFieldBuilder component** with entityCategory parameter
✅ **Same API functions** (getCustomFields, createCustomField, setCustomFieldValue)
✅ **Same dropdown system** for department selections and role classifications
✅ **Same validation patterns** and form building logic

## 🎯 User General Role System Design

### **B. User General Roles: Maker/Requester vs Approver**

#### **Implementation Using Universal Entity Architecture:**

**1. Create Role Type for General Classifications:**
```javascript
// Create general role type using universal entity system
const generalRoleType = await createRoleType({
  name: 'General User Classifications',
  code: 'GEN',
  company_id: companyId
});

// Add custom fields using existing universal infrastructure
await createCustomField(generalRoleType.id, {
  name: 'user_classification',
  label: 'User Classification',
  type: 'dropdown',
  dropdown_list_id: 'dd_user_classifications',
  is_required: true
}, 'role');

await createCustomField(generalRoleType.id, {
  name: 'approval_permissions',
  label: 'Can Approve Workflow Steps',
  type: 'dropdown',
  dropdown_list_id: 'dd_yes_no',
  is_required: true
}, 'role');
```

**2. Create User Profile Type for Department Assignment:**
```javascript
// Create employee profile type using universal entity system
const employeeProfileType = await createUserProfileType({
  name: 'Standard Employee',
  code: 'EMP',
  company_id: companyId
});

// Add department field using existing custom field infrastructure
await createCustomField(employeeProfileType.id, {
  name: 'department',
  label: 'Department',
  type: 'dropdown',
  dropdown_list_id: 'dd_departments',
  is_required: true
}, 'user_profile');

await createCustomField(employeeProfileType.id, {
  name: 'immediate_supervisor',
  label: 'Immediate Supervisor',
  type: 'dropdown',
  dropdown_list_id: 'dd_supervisors',
  is_required: false
}, 'user_profile');
```

**3. UI Components - Reuse Existing Infrastructure:**
```javascript
// For User General Role Assignment
<AdminCustomFieldBuilder
  entityTypeId={generalRoleType.id}
  entityCategory="role"
  entityTypeName="General User Role"
/>

// For User Department Assignment
<AdminCustomFieldBuilder
  entityTypeId={employeeProfileType.id}
  entityCategory="user_profile"
  entityTypeName="Employee Profile"
/>

// Same component, same logic, different entity categories!
```

### **Department Assignment Using Universal Entity Architecture**

#### **Implementation Strategy:**

**1. Department Dropdown Creation:**
```javascript
// Create department dropdown using existing system
const departmentDropdown = await createDropdownList({
  name: 'Departments',
  description: 'Company organizational departments',
  options: [
    { label: 'Human Resources', value: 'hr' },
    { label: 'Finance', value: 'finance' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' }
  ]
});

// Assign to company using existing assignment system
await assignDropdownToCompany(departmentDropdown.id, companyId, false); // company-specific
```

**2. User Profile Custom Fields for Department:**
```javascript
// Add department field to user profile type
await createCustomField(userProfileTypeId, {
  name: 'department',
  label: 'Department',
  type: 'dropdown',
  dropdown_list_id: departmentDropdown.id,
  is_required: true
}, 'user_profile');

// Add manager field
await createCustomField(userProfileTypeId, {
  name: 'department_manager',
  label: 'Department Manager',
  type: 'text', // or dropdown of managers
  is_required: false
}, 'user_profile');
```

**3. Role Custom Fields for Approval Levels:**
```javascript
// Add approval level to role type
await createCustomField(roleTypeId, {
  name: 'approval_level',
  label: 'Approval Level',
  type: 'dropdown',
  dropdown_list_id: 'dd_approval_levels',
  is_required: true
}, 'role');

await createCustomField(roleTypeId, {
  name: 'can_approve_amount',
  label: 'Maximum Approval Amount',
  type: 'amount',
  is_required: false
}, 'role');
```

## 🔧 Technical Implementation Using Universal Architecture

### **1. Enhanced API Functions (Reuse Existing):**
```javascript
// Get user's general role classification
async function getUserGeneralRole(userId) {
  const userRoles = await getUserRoles(userId);
  const generalRole = userRoles.find(role => role.role_type_code === 'GEN');

  if (generalRole) {
    const customFields = await getCustomFieldValues(generalRole.id, 'role');
    return customFields.find(field => field.name === 'user_classification')?.value;
  }

  return 'both'; // default
}

// Get user's department
async function getUserDepartment(userId) {
  const userProfile = await getUserProfile(userId);
  const customFields = await getCustomFieldValues(userProfile.id, 'user_profile');
  return customFields.find(field => field.name === 'department')?.value;
}

// Check if user can approve workflow steps
async function canUserApprove(userId) {
  const userRoles = await getUserRoles(userId);

  for (const role of userRoles) {
    const roleCustomFields = await getCustomFieldValues(role.id, 'role');
    const approvalPermission = roleCustomFields.find(field =>
      field.name === 'approval_permissions'
    )?.value;

    if (approvalPermission === 'yes') {
      return true;
    }
  }

  return false;
}
```

### **2. Workflow Integration:**
```javascript
// Enhanced workflow step validation using universal entity data
async function validateWorkflowStepApproval(userId, stepId) {
  // Check general approval permission
  const canApprove = await canUserApprove(userId);
  if (!canApprove) {
    return { allowed: false, reason: 'User does not have approval permissions' };
  }

  // Check step-specific role requirements
  const stepApprovers = await getStepApprovers(stepId);
  const userRoles = await getUserRoles(userId);

  const hasRequiredRole = stepApprovers.some(approverRole =>
    userRoles.some(userRole => userRole.id === approverRole.role_id)
  );

  if (!hasRequiredRole) {
    return { allowed: false, reason: 'User does not have required role for this step' };
  }

  return { allowed: true, reason: 'User authorized to approve this step' };
}
```

### **3. UI Components - Complete Reuse:**
```javascript
// User Role Management Page
const UserRoleManagementPage = () => {
  const [selectedRoleType, setSelectedRoleType] = useState('general');

  return (
    <div>
      <h2>User Role Management</h2>

      {/* Role Type Selector */}
      <RoleTypeSelector
        value={selectedRoleType}
        onChange={setSelectedRoleType}
        options={[
          { value: 'general', label: 'General Classifications' },
          { value: 'approval', label: 'Approval Roles' },
          { value: 'department', label: 'Department Roles' }
        ]}
      />

      {/* Same custom field builder for all role types */}
      <AdminCustomFieldBuilder
        entityTypeId={selectedRoleType}
        entityCategory="role"
        entityTypeName={`${selectedRoleType} Role Configuration`}
      />
    </div>
  );
};

// User Profile Management Page
const UserProfileManagementPage = () => {
  const [selectedProfileType, setSelectedProfileType] = useState('employee');

  return (
    <div>
      <h2>User Profile Management</h2>

      {/* Same custom field builder for all profile types */}
      <AdminCustomFieldBuilder
        entityTypeId={selectedProfileType}
        entityCategory="user_profile"
        entityTypeName={`${selectedProfileType} Profile Configuration`}
      />
    </div>
  );
};
```

## 📋 Implementation Benefits of Universal Architecture

### **Development Efficiency:**
- **Zero new components** - Reuse AdminCustomFieldBuilder for everything
- **Zero new API functions** - Enhance existing custom field functions
- **Zero new database tables** - Use existing custom_fields and custom_field_values
- **Same validation logic** - Reuse existing form validation patterns

### **Consistency Benefits:**
- **Same admin experience** - Managing user roles feels identical to managing ticket custom fields
- **Same data patterns** - All entities use same audit fields, dropdown system, etc.
- **Same testing approach** - Same test patterns work for all entity types
- **Same documentation** - Universal entity architecture applies to everything

### **Business Benefits:**
- **Faster implementation** - Leverage existing working infrastructure
- **Lower maintenance** - One system to maintain instead of separate systems
- **Flexible configuration** - Same level of customization for users as tickets
- **Scalable architecture** - Easy to add new user attributes without code changes

## 🚀 Implementation Phases

### **Phase 1: Setup Entity Types (1-2 days)**
```javascript
// Create role types for classifications
await createRoleType({ name: 'General Classifications', code: 'GEN' });
await createRoleType({ name: 'Approval Roles', code: 'APR' });
await createRoleType({ name: 'Department Roles', code: 'DEP' });

// Create user profile types
await createUserProfileType({ name: 'Standard Employee', code: 'EMP' });
await createUserProfileType({ name: 'Contractor', code: 'CTR' });
await createUserProfileType({ name: 'Vendor Contact', code: 'VND' });
```

### **Phase 2: Configure Custom Fields (2-3 days)**
```javascript
// Add custom fields to each entity type using existing UI
// This is done through AdminCustomFieldBuilder - no new code needed!
<AdminCustomFieldBuilder entityTypeId="gen_role" entityCategory="role" />
<AdminCustomFieldBuilder entityTypeId="emp_profile" entityCategory="user_profile" />
```

### **Phase 3: Workflow Integration (3-4 days)**
- Enhance workflow validation functions
- Add approval permission checks
- Update UI to show approval capabilities

### **Phase 4: Department Management (2-3 days)**
- Create department dropdown lists
- Configure department assignments
- Add department-based approval routing

## 📊 Zero New Infrastructure Required

### **Reusing Existing Systems:**
- ✅ **Custom Fields Table** - Add entity_category='user_profile' and 'role'
- ✅ **Dropdown System** - Use for departments, classifications, approval levels
- ✅ **AdminCustomFieldBuilder** - Same component for all entity management
- ✅ **API Functions** - getCustomFields, createCustomField, setCustomFieldValue
- ✅ **Validation Logic** - Same form validation patterns
- ✅ **Audit Fields** - Same created_at, updated_at, is_active patterns

### **Total New Code Estimate:**
- **0 new React components** (reuse AdminCustomFieldBuilder)
- **~10 new API functions** (mostly wrappers around existing functions)
- **~5 enhanced workflow functions** (add approval validation)
- **~2 new dropdown lists** (departments, user classifications)

**Implementation Time**: 8-12 days total vs 20-30 days for separate system

---

**Status**: 📋 **UNIVERSAL ENTITY DESIGN** - Leverages existing infrastructure
**Key Innovation**: Same custom field system serves user/role management
**Dependencies**: UNIVERSAL_ENTITY_ARCHITECTURE.md, DATABASE_SCHEMA_UPDATES.txt