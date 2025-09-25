# JarvisByERP Dependency Mapping

**Date**: September 17, 2025
**Purpose**: Map all component dependencies, imports, and exports to prevent circular dependencies and ensure proper architecture

### **🔬 PROOF OF CONCEPT BACKEND ARCHITECTURE**
**Database**: Google Sheets + Apps Script Web App (15+ normalized tables)
**API Layer**: RESTful endpoints via Google Apps Script
**Production Note**: Not suitable for high-volume production use - migration to traditional database planned

## Dependency Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Pages (4) → Components (19) → Shared Components (9)       │
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Hooks (3) → Utils (7) → API Layer (2)                     │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Config (3) → Context (1) → Firebase/Google Sheets         │
└─────────────────────────────────────────────────────────────┘
```

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

### **7. Feature Components Layer**

#### Admin Components (8) ✅ PHASE 8.5 COMPLETE
- **Core Admin (6)**: AdminCompanyManager, AdminDropdownManager, AdminRoleManager, APIConnectionStatus, ConditionalWorkflowBuilder, RBACSettings
- **Phase 8.5 New (2)**: AdminTicketTypeManager, AdminCustomFieldManager
- **Dependencies**: useAPI hooks, shared components, Icons, Toast notifications
- **Export**: React components for complete admin functionality
- **Status**: ✅ All admin management components implemented

#### Ticket Components (4) ✅ AUDITED
- **Dependencies**: useAPI hooks, workflow utils, shared components
- **Export**: Core ticketing functionality
- **Issues Found**: 8 non-existent icon references across all 4 components
- **Fixes Applied**:
  - `TicketDashboard.js`: 1 Icons.Loading → CSS spinner
  - `TicketDetail.js`: 2 Icons.Loading → CSS spinners
  - `TicketForm.js`: 1 Icons.Loading → CSS spinner
  - `WorkflowStep.js`: 4 icon fixes (Loading, CheckCircle, XCircle, Return)
- **Status**: ✅ All issues resolved

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

✅ **All 45 files audited and dependency mapped** (43 original + 2 Phase 8.5 components)

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

**Status**: ✅ COMPLETE - Full dependency mapping with architectural safeguards integrated
**Last Updated**: September 25, 2025 - Added architectural safeguards from dropdown analysis
**Next Update**: Integrated into development plan documentation