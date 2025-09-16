# Role-Based Access Control (RBAC) Documentation

## 🔐 **Access Control Strategy**

**Current Phase**: Phase 6 Development - "All Access" Mode
**Future Implementation**: Role-based restrictions in Phase 7+
**Philosophy**: Build components with RBAC-ready architecture, enable universal access during development

---

## 🎯 **Permission System Overview**

### **8 Core Permission Types**

#### **Basic User Permissions**
1. **`canCreateTickets`** - Create new tickets and requests
2. **`canApproveTickets`** - Approve/reject tickets in workflow
3. **`canViewReports`** - Access reporting and analytics
4. **`canAccessAdmin`** - Enter admin panel sections

#### **Administrative Permissions**
5. **`canManageUsers`** - User account management
6. **`canManageCompanies`** - Company configuration
7. **`canManageRoles`** - Role and permission management
8. **`canManageDropdowns`** - System dropdown configuration

---

## 👥 **Role Preset Definitions**

### **🔴 Admin Role**
```javascript
{
  name: "Admin",
  permissions: {
    canCreateTickets: true,
    canApproveTickets: true,
    canAccessAdmin: true,
    canViewReports: true,
    canManageUsers: true,
    canManageCompanies: true,
    canManageRoles: true,
    canManageDropdowns: true
  }
}
```
**Access Level**: Full system access, all features unlocked

### **🟡 Manager Role**
```javascript
{
  name: "Manager",
  permissions: {
    canCreateTickets: true,
    canApproveTickets: true,
    canAccessAdmin: false,
    canViewReports: true,
    canManageUsers: false,
    canManageCompanies: false,
    canManageRoles: false,
    canManageDropdowns: false
  }
}
```
**Access Level**: Ticket management and reporting, no admin panel

### **🟢 User Role**
```javascript
{
  name: "User",
  permissions: {
    canCreateTickets: true,
    canApproveTickets: false,
    canAccessAdmin: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCompanies: false,
    canManageRoles: false,
    canManageDropdowns: false
  }
}
```
**Access Level**: Ticket creation only, view own tickets

---

## 🏢 **Multi-Tenant Architecture**

### **Company-Specific Roles**
- Roles can be assigned globally or per-company
- Company-specific roles override global defaults
- Users can have different roles in different companies

### **Global Roles**
- Applied across all companies user has access to
- Useful for system administrators
- Higher precedence than company-specific roles

---

## 🔧 **Phase 6 Implementation Strategy**

### **🟢 Current: "All Access" Mode**

During Phase 6 development, all users have implicit admin-level access:

```javascript
// Temporary override in UserContext.js
const hasPermission = (permission) => {
  // Phase 6: Allow all access for development
  if (process.env.REACT_APP_ALLOW_ALL_ACCESS !== 'false') {
    return true;
  }

  // Future: Actual permission checking
  return userRoles?.some(role =>
    role.permissions?.[permission] === true
  );
};
```

### **🎯 RBAC-Ready Architecture**

All components are built with permission checks in place:

```javascript
// Component example - ready for RBAC
const { hasPermission } = useUser();

return (
  <div>
    {hasPermission('canCreateTickets') && (
      <button>Create Ticket</button>
    )}
    {hasPermission('canAccessAdmin') && (
      <AdminPanel />
    )}
  </div>
);
```

---

## 📋 **Access Requirements by Component**

### **🏠 Dashboard Components**

#### **DashboardPage.js**
- **Required**: `canCreateTickets` OR `canApproveTickets` (basic dashboard access)
- **Features**:
  - Ticket overview (always visible if user has any ticket permissions)
  - Create ticket button (`canCreateTickets`)
  - Approval queue (`canApproveTickets`)

#### **TicketDashboard.js**
- **Required**: `canCreateTickets` OR `canApproveTickets`
- **Features**:
  - Own tickets (always visible)
  - All tickets (`canApproveTickets` OR `canViewReports`)
  - Bulk operations (`canApproveTickets`)

#### **TicketForm.js**
- **Required**: `canCreateTickets`
- **Features**:
  - Create new tickets
  - Edit own tickets (if creator)
  - Assign tickets (`canApproveTickets`)

#### **TicketDetail.js**
- **Required**: Own ticket OR `canApproveTickets` OR `canViewReports`
- **Features**:
  - View ticket details
  - Add comments (if involved in ticket)
  - Approve/reject actions (`canApproveTickets`)
  - Status changes (`canApproveTickets`)

---

### **⚙️ Admin Components**

#### **AdminPage.js**
- **Required**: `canAccessAdmin`
- **Features**: Access to admin panel tabs

#### **AdminCompanyManager.js**
- **Required**: `canManageCompanies`
- **Features**: Company CRUD operations

#### **AdminRoleManager.js**
- **Required**: `canManageRoles`
- **Features**: Role and permission management

#### **AdminDropdownManager.js**
- **Required**: `canManageDropdowns`
- **Features**: System dropdown configuration

#### **AdminUserManager.js** (Future)
- **Required**: `canManageUsers`
- **Features**: User account management

---

### **📊 Reporting Components** (Future)

#### **ReportsPage.js**
- **Required**: `canViewReports`
- **Features**: Analytics and reporting dashboards

#### **AuditLog.js**
- **Required**: `canViewReports` OR `canManageUsers`
- **Features**: System audit trail viewing

---

## 🛡️ **Security Implementation Levels**

### **Level 1: UI Component Hiding**
```javascript
{hasPermission('canAccessAdmin') && <AdminMenuItem />}
```
**Purpose**: User experience, reduce clutter
**Security**: LOW - Client-side only

### **Level 2: Route Protection** (Phase 7)
```javascript
<ProtectedRoute permission="canAccessAdmin">
  <AdminPage />
</ProtectedRoute>
```
**Purpose**: Prevent unauthorized navigation
**Security**: MEDIUM - Can be bypassed by direct URL

### **Level 3: API Endpoint Security** (Phase 7)
```javascript
// Backend validation in Google Apps Script
function updateCompany(data) {
  if (!hasPermission(getUser(), 'canManageCompanies')) {
    throw new Error('Insufficient permissions');
  }
  // Proceed with update
}
```
**Purpose**: Data protection at source
**Security**: HIGH - Server-side enforcement

---

## 🔄 **Permission Inheritance & Override**

### **Inheritance Hierarchy**
1. **Global Admin**: Overrides all other permissions (super user)
2. **Global Role**: Applies to all companies user accesses
3. **Company Role**: Overrides global role for specific company
4. **Explicit Denial**: Explicit `false` overrides inherited `true`

### **Permission Resolution Algorithm**
```javascript
function resolvePermission(user, permission, companyId = null) {
  // 1. Check for global admin override
  if (user.isSuperAdmin) return true;

  // 2. Check company-specific role
  if (companyId) {
    const companyRole = user.roles.find(r => r.company_id === companyId);
    if (companyRole?.permissions?.[permission] !== undefined) {
      return companyRole.permissions[permission];
    }
  }

  // 3. Check global role
  const globalRole = user.roles.find(r => r.company_id === null);
  if (globalRole?.permissions?.[permission] !== undefined) {
    return globalRole.permissions[permission];
  }

  // 4. Default deny
  return false;
}
```

---

## 📈 **Phase Rollout Plan**

### **Phase 6: All Access Development**
- ✅ Build all components with permission checks
- ✅ Implement `hasPermission()` helper (always returns true)
- ✅ Create role management interface
- ✅ Document all access requirements

### **Phase 7: UI-Level Restrictions**
- [ ] Enable role-based UI component visibility
- [ ] Implement route-level protection
- [ ] Add permission-based menu filtering
- [ ] Test with different role configurations

### **Phase 8: API-Level Security**
- [ ] Implement backend permission validation
- [ ] Add API endpoint protection
- [ ] Implement data filtering by permissions
- [ ] Full end-to-end RBAC testing

### **Phase 9: Advanced RBAC Features**
- [ ] Dynamic permission assignment
- [ ] Time-based access controls
- [ ] Approval workflows for permission changes
- [ ] Advanced audit logging

---

## 🧪 **Testing Role Implementation**

### **Test User Scenarios**
```javascript
// Test users for different role validation
const testUsers = {
  admin: {
    roles: [{ name: 'Admin', permissions: { /* all true */ } }]
  },
  manager: {
    roles: [{ name: 'Manager', permissions: { /* subset */ } }]
  },
  user: {
    roles: [{ name: 'User', permissions: { canCreateTickets: true } }]
  },
  multiCompany: {
    roles: [
      { name: 'Admin', company_id: 'company1', permissions: {} },
      { name: 'User', company_id: 'company2', permissions: {} }
    ]
  }
};
```

### **Permission Test Matrix**
| Component | Admin | Manager | User | No Role |
|-----------|-------|---------|------|---------|
| Create Ticket | ✅ | ✅ | ✅ | ❌ |
| Approve Ticket | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ❌ |
| Access Admin | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Companies | ✅ | ❌ | ❌ | ❌ |

---

## 📝 **Configuration Examples**

### **Environment Variables**
```bash
# Phase 6: Development mode
REACT_APP_ALLOW_ALL_ACCESS=true

# Phase 7+: Production with RBAC
REACT_APP_ALLOW_ALL_ACCESS=false
REACT_APP_ENFORCE_PERMISSIONS=true
```

### **User Context Implementation**
```javascript
// Current Phase 6 implementation
const hasPermission = (permission) => {
  return process.env.REACT_APP_ALLOW_ALL_ACCESS !== 'false';
};

// Future Phase 7+ implementation
const hasPermission = (permission, companyId = null) => {
  return resolvePermission(user, permission, companyId);
};
```

---

## 🎯 **Immediate Action Items**

### **Phase 6 Development**
- [x] Document all permission requirements
- [ ] Implement `hasPermission` checks in all new components
- [ ] Create role management UI (completed in Phase 5)
- [ ] Maintain "all access" mode during development
- [ ] Build RBAC-ready architecture

### **Future Phases**
- [ ] Enable permission-based restrictions
- [ ] Implement backend security validation
- [ ] Create role assignment workflows
- [ ] Advanced RBAC features and audit logging

---

**Status**: 📋 **DOCUMENTED** - Ready for Phase 6 implementation
**Last Updated**: September 16, 2025
**Next Review**: Phase 7 RBAC Implementation

*This document ensures all access requirements are considered and documented for future RBAC implementation while maintaining development velocity in Phase 6.*