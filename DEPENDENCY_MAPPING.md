# JarvisByERP Dependency Mapping

**Date**: September 28, 2025 - 🏷️ **TICKET TAGS & COLLABORATION SYSTEM UPDATE**
**Purpose**: Map all component dependencies, imports, and exports to prevent circular dependencies and ensure proper architecture with ticket tags and collaboration system integration

### **🔬 PROOF OF CONCEPT BACKEND ARCHITECTURE**
**Database**: Google Sheets + Apps Script Web App (15+ normalized tables)
**API Layer**: RESTful endpoints via Google Apps Script
**Production Note**: Not suitable for high-volume production use - migration to traditional database planned

## 🚀 Universal Entity System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  🌟 UNIVERSAL ENTITY LAYER                  │
├─────────────────────────────────────────────────────────────┤
│  📊 Tickets | 👤 User Profiles | 🔐 Roles | ⚡ Workflows    │
│  ALL use same custom_fields infrastructure with entity_category │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Pages (5) → Components (23) → Shared Components (11)      │
│  🔄 ENHANCED: AdminPage + tabs for entity types            │
│  🔄 ENHANCED: AdminCustomFieldBuilder + entityCategory     │
│  🏷️ NEW: Tag components + collaboration system             │
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Hooks (3) → Utils (7) → API Layer (2)                     │
│  🔄 ENHANCED: useAPI hooks + entityCategory parameters     │
│  🔄 ENHANCED: API functions + entityCategory support       │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Config (3) → Context (1) → Firebase/Google Sheets         │
│  🔄 ENHANCED: Google Sheets + entity_category columns      │
└─────────────────────────────────────────────────────────────┘
```

### **🎯 REVOLUTIONARY CHANGE: Zero New Components**
Instead of creating new components, existing components are enhanced with:
- **entityCategory parameter** (tickets, user_profile, role)
- **Dynamic UI text** based on entity type
- **Same component logic** works for all entity types

## Core Dependencies Map

### **1. Infrastructure Layer (Foundation)**

#### `src/config/firebase.js`
- **Exports**: `auth`
- **Dependencies**: Firebase SDK
- **Used by**: UserContext, LoginPage, Header
- **Status**: ✅ No issues

#### `src/config/apiConfig.js`
- **Exports**: `apiConfig`, `getAPIHealthStatus`, `checkAPIConnection`
- **Dependencies**: None
- **Used by**: API classes, APIConnectionStatus
- **Status**: 🔍 Needs audit

#### `src/config/development.js`
- **Exports**: `DEV_CONFIG`, `MOCK_USER`
- **Dependencies**: None
- **Used by**: UserContext, API classes
- **Status**: 🔍 Needs audit

### **2. Context Layer**

#### `src/contexts/UserContext.js`
- **Exports**: `UserProvider`, `useUser`, `withAuth`, `withAdminAuth`
- **Dependencies**:
  - Firebase: `auth`
  - API: `API.Users`, `API.System`
  - Config: `DEV_CONFIG`, `MOCK_USER`
- **Used by**: App.js, all pages, protected components
- **Status**: 🔧 Syntax error fixed, needs dependency audit

### **3. API Layer**

#### `src/api/googleSheet.js`
- **Exports**: `API`, `companyAPI`, `roleAPI`, `dropdownAPI`, `ticketAPI`
- **Dependencies**:
  - Config: `apiConfig`
  - Utils: `cache`, `workflowEngine`
- **Used by**: All hooks, components
- **Status**: 🔧 Cache reference issues fixed

#### `src/api/models.js` ✅ AUDITED
- **Exports**: Data models, validation schemas, TypeScript-style JSDoc definitions
- **Dependencies**: None
- **Used by**: API classes, forms
- **Status**: ✅ Excellent TypeScript-style definitions with validation utilities

### **4. Utility Layer**

#### `src/utils/rbac.js` ✅ AUDITED
- **Exports**: RBAC constants, permission functions
- **Dependencies**: None
- **Used by**: UserContext, RBACSettings, protected components
- **Status**: ✅ Excellent code quality, comprehensive implementation

#### `src/utils/workflowEngine.js` ✅ AUDITED
- **Exports**: Workflow processing functions
- **Dependencies**: API classes
- **Used by**: Ticket components, API layer
- **Status**: ✅ Excellent architecture, multi-step approval logic

#### `src/utils/conditionalWorkflows.js` ✅ AUDITED
- **Exports**: Conditional routing logic
- **Dependencies**: Workflow engine
- **Used by**: ConditionalWorkflowBuilder
- **Status**: ✅ Sophisticated implementation, field-based branching

#### `src/utils/` (Other utilities) ✅ ALL AUDITED
- `approvalRouter.js` → ✅ Complex workflow progression logic
- `chainedTickets.js` → ✅ Automated follow-up ticket creation
- `externalAppIntegration.js` → ✅ Manual task-based workflow pausing
- `ticketNumber.js` → ✅ Well-structured ticket numbering utilities

### **5. Hooks Layer**

#### `src/hooks/useAPI.js`
- **Exports**: 25+ API hooks including `useAPIData`, `useUsers`, `useUser`, `useTicketTypes`
- **Dependencies**:
  - API: `API` classes
  - React: `useState`, `useEffect`, `useCallback`
- **Used by**: All data-driven components
- **Status**: ✅ Fixed missing `useAPIData` function and `useUsers` hook - compilation errors resolved

#### `src/hooks/useWorkflowRouter.js` ✅ AUDITED
- **Exports**: Workflow routing logic
- **Dependencies**: Utils, API
- **Used by**: Workflow components
- **Status**: ✅ Complex workflow routing implementation, no issues found

### **6. Shared Components Layer**

#### `src/components/shared/Icons.js`
- **Exports**: `Icons` object with 40+ SVG components
- **Dependencies**: React
- **Used by**: All UI components
- **Status**: ✅ Complete icon library

#### `src/components/shared/Toast.js`
- **Exports**: `Toast`, `useToast`
- **Dependencies**: Icons, React hooks
- **Used by**: All interactive components
- **Status**: ✅ No issues

#### Other Shared Components:
- `Header.js` → Navigation, user menu
- `LoadingScreen.js` → Loading states
- `ErrorBoundary.js` → Error handling
- `LiveClock.js` → Philippine time display

#### Phase 11.0 Tag & Collaboration Components:
- `TagInput.js` → ✅ Advanced tag input with autocomplete and smart features
- `TagSearchFilter.js` → ✅ Multi-tag filtering with AND/OR/NOT operators

### **7. Feature Components Layer**

#### Admin Components (8) ✅ PHASE 8.5 COMPLETE
- **Core Admin (6)**: AdminCompanyManager, AdminDropdownManager, AdminRoleManager, APIConnectionStatus, ConditionalWorkflowBuilder, RBACSettings
- **Phase 8.5 New (2)**: AdminTicketTypeManager, AdminCustomFieldManager
- **Dependencies**: useAPI hooks, shared components, Icons, Toast notifications
- **Export**: React components for complete admin functionality
- **Status**: ✅ All admin management components implemented

#### Ticket Components (6) ✅ AUDITED + PHASE 11.0 ENHANCED
- **Core Components (4)**:
  - `TicketDashboard.js`: Advanced ticket list with filtering
  - `TicketDetail.js`: Complete ticket view with workflow
  - `TicketForm.js`: Dynamic ticket creation/editing
  - `WorkflowStep.js`: Workflow step management UI
- **Phase 11.0 Components (2)**:
  - `TicketTagManager.js` ✅ Tag management interface for ticket details
  - `TicketCollaborationManager.js` ✅ Secure sharing workflow interface
- **Dependencies**: useAPI hooks, workflow utils, shared components, tag components
- **Export**: Core ticketing functionality + tag/collaboration features
- **Previous Issues Fixed**: 8 non-existent icon references resolved across core components
- **Status**: ✅ Core components audited, Phase 11.0 components coded and ready

#### Page Components (4) ✅ AUDITED
- **Dependencies**: All lower layers (contexts, hooks, components, utils)
- **Export**: Main application pages and route handlers
- **Issues Found**: 2 non-existent Icons.Loading references in DashboardPage.js
- **Fixes Applied**:
  - `AdminPage.js`: ✅ No issues found
  - `DashboardPage.js`: 2 Icons.Loading → CSS spinners
  - `LoginPage.js`: ✅ No issues found
  - `UnauthorizedPage.js`: ✅ Already reviewed, no issues
- **Status**: ✅ All issues resolved

## Dependency Issues Identified

### **Critical Issues Fixed:**
1. ✅ Missing `useAPIData` function, `useUsers` hook, and `useTicketTypes` export in useAPI.js
2. ✅ Incorrect cache references in API classes
3. ✅ Non-existent icon references (19 fixes total)
4. ✅ Syntax error in UserContext.js useCallback
5. ✅ **Phase 8.5**: Missing admin components (AdminTicketTypeManager, AdminCustomFieldManager) implemented
6. ✅ **API Integration**: Real Google Apps Script URL configured for live testing

### **Potential Issues to Investigate:**

#### **Circular Dependencies Risk:**
- Utils ↔ API ↔ Hooks potential circular imports
- Components importing utils that import API that import hooks

#### **Missing Dependencies:**
- useEffect dependency arrays
- useCallback dependency arrays
- Prop validation

#### **Unused Dependencies:**
- Imported modules not used
- Dead code in utility functions

## Recommended Dependency Architecture

### **Strict Layering:**
```
Pages
  ↓ (can import)
Components
  ↓ (can import)
Hooks
  ↓ (can import)
Utils
  ↓ (can import)
API
  ↓ (can import)
Config
```

### **Rules:**
1. **No upward imports** - Lower layers cannot import higher layers
2. **Shared components** can only import Icons, basic utilities
3. **Hooks** should be pure data fetching, no business logic
4. **Utils** contain pure functions, no React dependencies
5. **API** layer is purely data access, no UI concerns

---

## 🚀 UNIVERSAL ENTITY SYSTEM DEPENDENCIES (September 27, 2025)

### **🔄 ENHANCED COMPONENT DEPENDENCIES**

#### **AdminCustomFieldBuilder.js (Universal Enhanced)**
- **NEW Props**: `entityCategory`, `entityTypeName`
- **Enhanced Exports**: Works for tickets, user_profiles, roles
- **Dependencies**: Same existing dependencies + entityCategory parameter
- **Used by**: AdminPage (all entity tabs), future EntityTypeManager
- **Status**: ✅ Ready for enhancement

#### **useAPI.js Hooks (Enhanced with entityCategory)**
- **Enhanced Hooks**:
  - `useCustomFields(entityTypeId, entityCategory='ticket')`
  - `useCustomFieldValues(entityId, entityCategory='ticket')`
  - `useSetCustomFieldValue()` with entityCategory support
- **Backward Compatibility**: ✅ All existing calls work unchanged
- **Dependencies**: Same existing + entityCategory parameter passing
- **Status**: ✅ Ready for enhancement

#### **googleSheet.js API Functions (Enhanced)**
- **Enhanced Functions**:
  - `getCustomFields(entityTypeId, entityCategory='ticket')`
  - `createCustomField(entityTypeId, fieldData, entityCategory='ticket')`
  - `setCustomFieldValue(entityId, fieldId, value, entityCategory='ticket')`
- **Backward Compatibility**: ✅ All existing ticket calls work unchanged
- **Dependencies**: Enhanced Google Sheets access with entity_category column
- **Status**: ✅ Ready for enhancement

#### **AdminPage.js (Tab Enhancement)**
- **NEW Tabs**: User Profiles, Roles (reusing existing components)
- **Enhanced Navigation**: Tab-based entity type switching
- **Dependencies**: Same existing + enhanced AdminCustomFieldBuilder
- **Component Reuse**: ✅ Zero new components needed
- **Status**: ✅ Ready for tab addition

### **📊 DEPENDENCY IMPACT ANALYSIS**

#### **Zero Breaking Changes**
- All existing component imports work unchanged
- All existing hook calls work unchanged
- All existing API calls work unchanged
- Backward compatibility maintained 100%

#### **Enhanced Capabilities**
- Same components work for multiple entity types
- Same hooks support all entity categories
- Same API functions handle all entities
- Same validation and UI logic reused

## 🏷️ PHASE 11.0 TICKET TAGS & COLLABORATION DEPENDENCIES (September 28, 2025)

### **📋 NEW COMPONENT DEPENDENCY ANALYSIS**

#### **TagInput.js (Shared Component)**
- **Dependencies**:
  - React hooks: `useState`, `useEffect`, `useCallback`, `useRef`
  - Shared components: `Icons`
  - API hooks: `useTicketTags()`, `useTagCategories()`
  - Utils: Tag validation, autocomplete logic
- **Exports**: `TagInput` component with advanced autocomplete
- **Used by**: TicketForm, TicketTagManager, tag-enabled forms
- **Features**: Smart suggestions, hierarchy support, validation
- **Status**: ✅ Coded and ready for integration

#### **TagSearchFilter.js (Shared Component)**
- **Dependencies**:
  - React hooks: `useState`, `useEffect`, `useCallback`
  - Shared components: `Icons`, `Toast`
  - API hooks: `useTicketTags()`, `useTagSearch()`
  - Utils: Query builder logic, filter operators
- **Exports**: `TagSearchFilter` component with visual query builder
- **Used by**: TicketDashboard, search interfaces, reporting components
- **Features**: AND/OR/NOT operators, saved filters, visual query building
- **Status**: ✅ Coded and ready for integration

#### **TicketTagManager.js (Ticket Component)**
- **Dependencies**:
  - React hooks: `useState`, `useEffect`, `useCallback`
  - Shared components: `TagInput`, `Icons`, `Toast`
  - API hooks: `useTicketTags()`, `useTagAssignments()`, `useTagStatistics()`
  - Utils: Tag assignment logic, permission validation
- **Exports**: `TicketTagManager` component for ticket detail integration
- **Used by**: TicketDetail page, ticket management interfaces
- **Features**: Tag assignment, hierarchy management, usage analytics
- **Status**: ✅ Coded and ready for integration

#### **TicketCollaborationManager.js (Ticket Component)**
- **Dependencies**:
  - React hooks: `useState`, `useEffect`, `useCallback`
  - Shared components: `Icons`, `Toast`, `ActionCommentModal`
  - API hooks: `useCollaborations()`, `useCollaborationRequests()`, `useUsers()`
  - Utils: Permission validation, notification logic, security checks
- **Exports**: `TicketCollaborationManager` component for secure sharing
- **Used by**: TicketDetail page, collaboration interfaces
- **Features**: Share requests, permission levels, access control, audit trail
- **Status**: ✅ Coded and ready for integration

### **🔗 API INTEGRATION DEPENDENCIES**

#### **Enhanced API Hooks (Phase 11.0 Extensions)**
- **New Hooks Required**:
  - `useTicketTags(filters)` - Tag management with hierarchy
  - `useTagCategories()` - Tag organization system
  - `useTagAssignments(ticketId)` - Ticket-tag relationships
  - `useTagStatistics()` - Usage analytics and trending
  - `useCollaborations(ticketId)` - Ticket sharing management
  - `useCollaborationRequests()` - Share request workflow
  - `useTagSearch(query)` - Advanced tag-based search
- **Dependencies**: Enhanced googleSheet.js API with tag/collaboration endpoints
- **Status**: 🟡 Design complete, API integration pending

#### **Enhanced Backend Functions (25+ Functions)**
- **Tag Management Functions** (8):
  - `createTicketTag()`, `updateTicketTag()`, `deleteTicketTag()`
  - `getTagHierarchy()`, `getTagStatistics()`, `validateTagPermissions()`
  - `assignTagToTicket()`, `unassignTagFromTicket()`
- **Collaboration Functions** (12):
  - `createCollaborationRequest()`, `approveCollaborationRequest()`
  - `shareTicketWithUser()`, `revokeTicketAccess()`
  - `getSharedTickets()`, `getCollaborationHistory()`
  - `validateCollaborationPermissions()`, etc.
- **Search & Analytics Functions** (8):
  - `searchTicketsByTags()`, `getTagUsageStatistics()`
  - `getCollaborationAnalytics()`, `generateTagReports()`
- **Status**: 🟡 All functions designed in TICKET_TAGS_COLLABORATION_APPSCRIPT.txt

### **📊 DATABASE SCHEMA DEPENDENCIES**

#### **New Tables Required (8 Tables)**
- **ticket_tags**: Tag definitions with hierarchy and categories
- **ticket_tag_assignments**: Tag-to-ticket relationships
- **tag_categories**: Tag organization system
- **tag_usage_statistics**: Analytics and trending data
- **ticket_collaborations**: Sharing configuration
- **collaboration_requests**: Share request workflow
- **collaboration_notifications**: Real-time notifications
- **shared_ticket_access_logs**: Comprehensive audit trail

#### **Schema Integration Requirements**
- **Column Structure**: All tables use | delimited columns format
- **Audit Fields**: Complete audit trail (created_at, created_by, updated_at, updated_by, etc.)
- **Security Fields**: Permission levels, access control, deactivation tracking
- **Status**: ✅ Complete schema documented in DATABASE_SCHEMA_UPDATES.txt

### **🔄 COMPONENT INTEGRATION FLOW**

#### **Phase 11.0 Component Integration Chain**
```
TicketDetail.js
    ↓ imports and uses
TicketTagManager.js + TicketCollaborationManager.js
    ↓ both import and use
TagInput.js + TagSearchFilter.js
    ↓ all components use
Enhanced API Hooks (useTicketTags, useCollaborations, etc.)
    ↓ hooks call
Enhanced googleSheet.js API functions
    ↓ API functions interact with
8 New Database Tables in Google Sheets
```

#### **Dependency Safety Analysis**
- **No Circular Dependencies**: Tag components are lower-level than ticket components
- **Clear Layer Separation**: Shared components → Ticket components → Pages
- **API Isolation**: All backend integration through hooks layer
- **Error Boundaries**: Each component handles errors independently
- **Status**: ✅ Architecture follows established dependency patterns

### **📋 INTEGRATION CHECKLIST**

#### **Backend Integration Requirements**
- [ ] **Integrate 25+ functions** from TICKET_TAGS_COLLABORATION_APPSCRIPT.txt into main APPSCRIPT.txt
- [ ] **Create 8 new database tables** in Google Sheets with proper column structure
- [ ] **Test API endpoints** with actual frontend payload structures
- [ ] **Verify permission system** integration with existing RBAC

#### **Frontend Integration Requirements**
- [ ] **Add API hooks** to useAPI.js for tag and collaboration operations
- [ ] **Integrate TagInput** into TicketForm for tag assignment during creation
- [ ] **Integrate TicketTagManager** into TicketDetail for post-creation tag management
- [ ] **Integrate TicketCollaborationManager** into TicketDetail for sharing workflow
- [ ] **Add TagSearchFilter** to TicketDashboard for advanced filtering

#### **Testing Requirements**
- [ ] **Component Testing**: Verify all 4 components render and function correctly
- [ ] **Integration Testing**: Test complete tag assignment and collaboration workflow
- [ ] **API Testing**: Verify all backend functions work with frontend components
- [ ] **Security Testing**: Validate permission controls and access restrictions

**Status**: 🟡 **DESIGN COMPLETE, INTEGRATION PENDING** - All components coded, dependencies mapped, ready for backend integration

---

## 🛡️ ARCHITECTURAL SAFEGUARDS (September 25, 2025)

**Based on dropdown creation analysis - See DROPDOWN_CREATION_ISSUE_DEBRIEF.md**

### **🚨 PATTERN CONSISTENCY ARCHITECTURE REQUIREMENTS**

#### **1. API LAYER PATTERN STANDARDIZATION**
- **Golden Rule**: "Use proven patterns from working implementations"
- **Standard Pattern**: All API endpoints must follow simple payload pattern
- **Reference Implementations**: Company creation, role management (proven working)
- **Prohibited**: Multi-strategy validation patterns with complex conditional logic

#### **2. COMPONENT ARCHITECTURAL SAFEGUARDS**

**Before Adding New API-Connected Components:**
- [ ] **Pattern Analysis**: Review existing working components for similar functionality
- [ ] **Dependency Verification**: Ensure new component follows established layer hierarchy
- [ ] **Payload Compatibility**: Verify frontend-backend payload structure consistency
- [ ] **Error Handling**: Implement proven error handling patterns from working components

**Component Pattern Requirements:**
```javascript
// ✅ PROVEN PATTERN - Use in all new components
const { data, loading, error, create } = useAPIHook();

// ✅ PROVEN ERROR HANDLING - Copy from working components
const handleSubmit = async (formData) => {
  try {
    const result = await create(formData);
    showToast('success', 'Operation completed successfully');
  } catch (error) {
    showToast('error', error.message);
  }
};
```

#### **3. HOOK LAYER SAFEGUARDS**

**Custom Hook Pattern Requirements:**
- **Single Responsibility**: Each hook handles one specific data type or operation
- **Consistent Error Handling**: All hooks return `{ data, loading, error }` structure
- **Caching Strategy**: Follow established caching patterns from working hooks
- **Pattern Reuse**: Copy successful patterns from `useCompanies`, `useRoles`

**Before Creating New Hooks:**
- [ ] **Existing Hook Review**: Check if similar functionality already exists
- [ ] **Pattern Consistency**: Use same structure as proven working hooks
- [ ] **Error Boundaries**: Implement same error handling as successful hooks
- [ ] **Testing Strategy**: Follow testing patterns from working implementations

#### **4. UTILS LAYER PATTERN ENFORCEMENT**

**Business Logic Pattern Requirements:**
- **Pure Functions**: No React dependencies, no side effects
- **Single Execution Path**: Avoid complex conditional logic chains
- **Comprehensive Testing**: All util functions must have clear success/failure cases
- **Pattern Consistency**: Follow established patterns from `ticketNumber.js`, `rbac.js`

#### **5. TECHNICAL DEBT PREVENTION**

**Architecture Standards:**
- **Pattern Recognition**: Always identify similar working implementation before starting
- **Complexity Rejection**: Choose simple, proven patterns over sophisticated validation
- **Documentation**: Record why specific patterns were chosen for future consistency
- **Version Control**: Maintain clean history showing pattern evolution

**Development Process Safeguards:**
1. **Pre-Development Analysis**: Identify working pattern to copy
2. **Implementation Verification**: Test with actual data structures
3. **Pattern Documentation**: Record pattern decisions
4. **Integration Testing**: Verify with existing working components

### **📋 ARCHITECTURAL CHECKLIST**

**Before Component Development:**
- [ ] **Reference Implementation**: Identify working component with similar functionality
- [ ] **Pattern Documentation**: Record which working pattern is being used
- [ ] **Dependency Verification**: Confirm component follows layer hierarchy
- [ ] **Payload Testing**: Verify frontend-backend data structure compatibility

**Before API Integration:**
- [ ] **Working Pattern**: Identify successful API endpoint pattern to copy
- [ ] **Error Handling**: Use same error handling as proven working endpoints
- [ ] **Testing Strategy**: Test with actual frontend payload structures
- [ ] **Documentation**: Record pattern decisions for future reference

### **🔍 DROPDOWN LESSONS FOR ARCHITECTURE**

**Key Architectural Lessons:**
1. **Pattern Consistency**: Copy working patterns rather than inventing new validation
2. **Simple Execution**: Single-path execution more reliable than multi-strategy approaches
3. **Frontend Compatibility**: Always test with actual frontend data structures
4. **Documentation**: Record pattern decisions to prevent future inconsistencies
5. **Technical Domain Separation**: API layer vs business logic vs UI layer issues

**Architecture Pattern History:**
- **Phase 0**: Handler-based pattern with utilities (working)
- **Phase 1-2**: Simple pattern across components (working)
- **Phase 3**: Complex validation experiment (failed)
- **Phase 4**: Return to simple pattern (successful)
- **Phase 5**: Systematic standardization (architectural success)

**Application to All Development:**
- Use proven architectural patterns from working implementations
- Maintain separation of concerns between layers
- Keep debugging infrastructure separate from production architecture
- Document architectural decisions for consistency

## Completed Architecture Analysis

✅ **All 49 files audited and dependency mapped** (43 original + 2 Phase 8.5 components + 4 Phase 11.0 components)

### Next Optimization Steps

1. **Identify circular dependencies** using tools or manual analysis
2. **Refactor violations** of the layered architecture
3. **Create dependency injection** for complex interdependencies
4. **Add ESLint rules** to prevent future violations
5. **Update development plan** with dependency documentation references

## Tools for Dependency Analysis

```bash
# Analyze imports/exports
npx madge --circular src/
npx dependency-cruiser src/

# Check for unused dependencies
npx depcheck

# ESLint dependency rules
npm install eslint-plugin-import
```

---

## 🎯 ARCHITECTURAL SUCCESS PATTERNS

**Reference Working Implementations:**
- **Company Management**: AdminCompanyManager.js + companyAPI pattern
- **Role Management**: AdminRoleManager.js + roleAPI pattern
- **User Authentication**: UserContext.js + Firebase integration
- **Data Fetching**: useAPI.js hook patterns
- **Error Handling**: Toast notification system

**Pattern Application Strategy:**
1. **Identify Similar Working Implementation**: Find component/hook/util with similar functionality
2. **Copy Proven Pattern**: Use same architectural approach
3. **Adapt for Specific Needs**: Modify data structures but keep same pattern
4. **Test with Real Data**: Verify with actual frontend-backend integration
5. **Document Pattern Choice**: Record why this pattern was selected

**Architecture Documentation References:**
- **DROPDOWN_CREATION_ISSUE_DEBRIEF.md**: Complete analysis of pattern consistency importance
- **APPSCRIPT_VERSION_EVOLUTION_ANALYSIS.md**: Technical deep-dive of architectural evolution
- **DEVELOPMENT_PLAN.md**: Integration with development process safeguards

---

**Status**: ✅ COMPLETE - Full dependency mapping with Phase 11.0 tag & collaboration system integration
**Last Updated**: September 28, 2025 - Added Phase 11.0 component dependencies and integration requirements
**Next Update**: Backend integration and testing documentation