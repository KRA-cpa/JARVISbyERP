## **Ticketing & Workflow Orchestration System: Functional Specifications**

A. DO NOT FORGET to Read first md/txt/or any file before you update.
B. Consult SUPERTHINK_TODO_ANALYSIS_2025-09-27.md on current/completed to do.

**Version:** 3.2 **Date:** September 28, 2025 - 🎯 **TICKET TAGS & COLLABORATION SYSTEM UPDATE**

### **🔗 MANDATORY DEVELOPMENT REFERENCES**

**BEFORE ANY DEVELOPMENT WORK, CONSULT THESE REQUIRED DOCUMENTS:**

1. **`PRODUCTION_REQUIREMENTS.md`** - 🚨 **CRITICAL MANDATORY REFERENCE**
   - Node.js, npm, and runtime environment requirements
   - Complete dependency list with versions and compatibility matrix
   - CSS framework configuration and build requirements
   - Google Sheets + Apps Script proof of concept database documentation
   - Mandatory update clause for design requirement changes

2. **`DEVELOPMENT_PLAN.md`** - ⚠️ **MANDATORY REFERENCE**
   - Complete 43-file architecture with current file structure
   - React hooks documentation and usage patterns
   - 7-layer dependency hierarchy and import rules
   - Code quality standards and best practices
   - Phase completion status and technical requirements

3. **`DEPENDENCY_MAPPING.md`** - ⚠️ **MANDATORY REFERENCE**
   - Component dependency relationships and architecture
   - Import/export rules for circular dependency prevention
   - Layered architecture validation guidelines
   - Component categorization and interaction patterns

4. **`SUPERTHINK_AUDIT.md`** - ⚠️ **MANDATORY REFERENCE**
   - File-by-file audit results and quality metrics
   - React hooks compliance and validation status
   - Compilation error fixes and icon reference corrections
   - ESLint compliance and code quality standards

5. **`SLA_IMPLEMENTATION.md`** - ⚠️ **MANDATORY REFERENCE**
   - Complete SLA calculator implementation documentation
   - Business rules for Philippine timezone and SLA calculations
   - API integration points and component requirements
   - Phase-by-phase implementation tracking and status

6. **`DATABASE_SCHEMA_UPDATES.txt`** - ⚠️ **MANDATORY REFERENCE**
   - **File Location**: `./DATABASE_SCHEMA_UPDATES.txt` (project root)
   - Complete database schema documentation and updates
   - Google Sheets table structure definitions
   - Schema migration and update tracking

7. **`APPSCRIPT.txt`** - ⚠️ **MANDATORY REFERENCE**
   - **File Location**: `./appscript_files/APPSCRIPT.txt`
   - **Current Status**: Version 6.4 - 9,788 lines with ALL PHASES COMPLETE (53 functions)
   - Complete Google Apps Script backend implementation
   - All API functions and database operations
   - Backend deployment and configuration code

8. **`RESOLUTION_CHECKLIST.md`** - 🚨 **CRITICAL MANDATORY REFERENCE FOR ALL ERROR RESOLUTION**
   - **File Location**: `./RESOLUTION_CHECKLIST.md`
   - Fundamental Resolution Rule with domain-specific checks
   - Comprehensive Frontend (8 checks), API (7 checks), AppScript (9 checks), Schema (6 checks)
   - Must be consulted before any error resolution attempt
   - Working pattern reference library for each domain

9. **`USER_MANAGEMENT_FEATURE_PLAN.md`** - 🚀 **NEW REVOLUTIONARY MANDATORY REFERENCE**
   - **File Location**: `./USER_MANAGEMENT_FEATURE_PLAN.md`
   - Revolutionary user/role system with universal custom fields
   - User profile types, role types, and unified dropdown system
   - Date-based role assignments and immediate approver relationships
   - Complete implementation specifications for Phase 10.0

10. **`UNIVERSAL_ENTITY_ARCHITECTURE.md`** - 🚨 **CRITICAL MANDATORY REFERENCE FOR ALL ENTITY WORK**
   - **File Location**: `./UNIVERSAL_ENTITY_ARCHITECTURE.md`
   - Defines universal entity concept treating tickets, user profiles, and roles uniformly
   - Same custom fields infrastructure reused across all entity types
   - Required reading before any component, API, or schema work involving entities
   - Implementation guidelines and backward compatibility requirements

**⚠️ CRITICAL DEVELOPMENT RULES:**
- **NO COMPONENT CREATION** without consulting dependency mapping
- **NO HOOK MODIFICATIONS** without reviewing audit documentation
- **NO DEPENDENCY CHANGES** without updating PRODUCTION_REQUIREMENTS.md first
- **ALL IMPORTS** must follow 7-layer dependency hierarchy
- **VERIFY FILE STRUCTURE** against current 45-file inventory in DEVELOPMENT_PLAN.md
- **PREVENT REACT ERROR #130** by following `REACT_ERROR_130_PREVENTION_GUIDE.md`
- **VERIFY ROUTES** exist in App.js before implementing navigation
- **TEST COMPILATION** with `npm run build` before committing changes
- **🚀 NEW: UNIVERSAL ENTITY RULES** - All entity types (tickets, users, roles) must use unified custom field patterns
- **🚀 NEW: USER/ROLE INTEGRATION** - Follow USER_MANAGEMENT_FEATURE_PLAN.md for all user/role implementations
- **🚨 MANDATORY: UNIVERSAL ENTITY ARCHITECTURE** - Must consult UNIVERSAL_ENTITY_ARCHITECTURE.md before any entity-related work

### **📊 SUPERTHINK AUDIT METHODOLOGY & LATEST RESULTS**

**🔍 SUPERTHINK AUDIT METHODOLOGY:**
Comprehensive systematic review process for React applications focusing on:
- **React Hooks Dependencies**: Validation of useEffect, useCallback, useMemo dependency arrays
- **Syntax Error Detection**: Complete compilation error identification and resolution
- **Component Dependencies**: Import/export relationship mapping and circular dependency prevention
- **Code Quality Standards**: ESLint compliance, type safety, and architectural consistency
- **Production Readiness**: Build verification, error handling, and performance optimization

**✅ LATEST AUDIT COMPLETION (September 21, 2025):**
- **45/45 Files Audited**: 100% coverage of entire React application codebase
- **24 Critical Icon Fixes**: All non-existent icon references resolved (Icons.Loading, Icons.CheckCircle, Icons.Document, Icons.Documents, Icons.History, Icons.List, Icons.Plus, etc.)
- **React Error #130 Resolution**: Zero runtime component reference errors
- **4 Compilation Errors Fixed**: Zero blocking build issues remain (useAPIData function, useUsers hook, useTicketTypes export, cache references, etc.)
- **Dependency Architecture**: Complete 7-layer hierarchy established and documented
- **Production Ready**: Application compiles successfully with only minor ESLint warnings

**🔧 REACT ERROR #130 COMPLETE RESOLUTION (September 21, 2025):**
- **Error Type**: Runtime undefined component/hook reference error (React minified error #130)
- **Root Causes Identified & Fixed**:
  1. ✅ Incorrect toast hook usage pattern in 3 admin components
  2. ✅ Missing icon definitions (Document, Documents, History, List, Plus, ChevronUp, ChevronDown, Eye, EyeOff)
  3. ✅ Missing route definitions causing navigation failures
  4. ✅ Undefined component references at runtime
- **Components Fixed**:
  - `AdminTicketTypeManager.js` → Replaced with `AdminTicketTypeList.js` (modal removal)
  - `AdminCustomFieldManager.js` → Replaced with `AdminCustomFieldList.js` (modal removal)
  - `AdminWorkflowBuilder.js` - Fixed all toast method calls and added ToastContainer
  - All page components verified for proper imports and exports
- **Prevention Measures Implemented**:
  - ✅ Complete icon inventory management in `Icons.js`
  - ✅ All navigation routes defined in `App.js`
  - ✅ Proper hook destructuring patterns throughout codebase
  - ✅ Comprehensive prevention guide: `REACT_ERROR_130_PREVENTION_GUIDE.md`
- **Status**: ✅ **COMPLETELY RESOLVED** - Zero runtime errors, all components functional
- **Best Practices**: Automated prevention strategies documented for future development

**📋 QUALITY METRICS ACHIEVED:**
- **ESLint Compliance**: All critical warnings resolved, only minor style preferences remain
- **React Hooks Validation**: All dependency arrays validated and optimized
- **TypeScript-Style Documentation**: JSDoc types throughout codebase for IDE support
- **Mobile Responsive**: All components optimized for mobile devices with Tailwind CSS
- **Error Handling**: Comprehensive loading states and error boundaries implemented

**🔄 FUTURE AUDIT REQUIREMENTS:**
When conducting future superthink audits, follow the methodology documented in `SUPERTHINK_AUDIT.md` and update results in this section.

### **1.0 Overview**

This document outlines the functional requirements for a dynamic ticketing and workflow orchestration system. The primary goal is to create a highly configurable, multi-tenant platform where administrators can define entire business processes—including forms, multi-step approval chains, conditional logic, SLA tracking, and integrations with external tools—without requiring new code.

### **🔬 PROOF OF CONCEPT ARCHITECTURE** - **✅ BACKEND AUDIT COMPLETE**

**Current Implementation**: Google Sheets + Apps Script Database Backend
- **Purpose**: Serverless proof of concept demonstrating workflow orchestration capabilities
- **Database**: Google Sheets with 15+ tabs representing normalized database tables
- **API Layer**: Google Apps Script web app providing RESTful endpoints with JSON responses ✅ **AUDIT COMPLETE**
- **Frontend**: React SPA deployed to Vercel with Firebase Authentication
- **Data Tables**: companies, roles, tickets, ticket_types, users, workflow_steps, custom_fields, dropdown_lists, dropdown_options, ticket_history, ticket_action_logs, admin_action_logs, sequence_counters

### **📊 BACKEND AUDIT STATUS**

**✅ BACKEND AUDIT 100% COMPLETE** - See `SUPERTHINK_AUDIT.md` for detailed backend audit results, critical fixes applied, and production deployment status.

### **📋 API TESTING METHODOLOGY**

**See `PRODUCTION_REQUIREMENTS.md` for complete API testing procedures, troubleshooting guidelines, and health check protocols.**

**📋 Backend Audit Documentation**:
- **`APPSCRIPT_AUDIT.md`** - Complete function-by-function audit report with detailed findings
- **`APPSCRIPT_IMPLEMENTATION.md`** - Updated production deployment guide with audit results
- **`APPSCRIPT_API.md`** - Enhanced API documentation including all audit fixes and improvements
- **`APPSCRIPT.txt`** - Updated code with all critical issues resolved and runtime verification

**🛡️ Error Prevention Documentation**:
- **`REACT_ERROR_130_PREVENTION_GUIDE.md`** - Comprehensive guide to prevent React minified error #130
- **`REACT_ERROR_130_SUPERTHINK_DUMP.md`** - Complete resolution methodology and debugging process

### **⚠️ PRODUCTION CONSIDERATIONS** (Post-Audit Update)
- **Scale Limitations**: Google Sheets not suitable for high-volume production use ✅ **AUDIT ACKNOWLEDGED**
- **Migration Path**: Future migration to traditional database (PostgreSQL, MySQL, etc.) planned
- **Current Status**: Fully functional proof of concept with production-ready frontend architecture ✅ **AUDIT VERIFIED**
- **Backend Reliability**: ✅ **AUDIT CERTIFIED** - Zero runtime errors, comprehensive error handling
- **Code Quality**: ✅ **PRODUCTION-READY** - Complete documentation, testing, and verification
- **Deployment Status**: ✅ **OPERATIONAL** - Live backend serving frontend admin components

**IMPLEMENTATION STATUS:** Phase 9.0 Complete - Page-based creation system with date range support

**✅ MODAL-TO-PAGE MIGRATION COMPLETE:**
- **AdminTicketTypeCreatePage**: Dedicated full-page creation with save-then-activate pattern
- **AdminCustomFieldCreatePage**: Enhanced field creation with date range support
- **AdminTicketTypeList**: Simplified list view with navigation to dedicated pages
- **Date Range Field Type**: New custom field type with start/end date validation
- **Route Configuration**: Dedicated URLs for creation workflows (/admin/ticket-types/create, /admin/custom-fields/create)
- **Form Components**: Extracted reusable components with auto-save functionality

**🎯 NEW FEATURES:**
- **Date Range Custom Fields**: Start/end date selection with validation and duration calculation
- **Enhanced Form Layouts**: Full-page forms with better spacing and organization
- **Breadcrumb Navigation**: Clear navigation paths for admin workflows
- **Auto-save Drafts**: Form state persistence for long creation sessions
- **Field Type Preview**: Real-time preview of custom field appearance
- **Error Prevention System**: Comprehensive React error #130 prevention with automated validation
- **Safe Navigation**: Route validation to prevent undefined navigation errors
- **Enhanced UX**: Quick start guides and improved button states for better user experience

**📋 SCHEMA UPDATES:**
- `custom_field_values` table: Added `start_date_value` and `end_date_value` columns for date range support

### **2.0 System Architecture**

The system is composed of two main parts: a frontend application for user interaction and a backend for data storage and logic.

#### **2.1 Frontend Architecture**

The user interface will be a single-page application (SPA) built with **React**. This provides a modern, responsive, and interactive user experience.

**⚠️ CURRENT IMPLEMENTED ARCHITECTURE:**

**📋 FOR COMPLETE FILE STRUCTURE AND DEPENDENCY MAPPING, SEE:**
- `DEVELOPMENT_PLAN.md` - Complete 45-file architecture with status
- `DEPENDENCY_MAPPING.md` - 7-layer dependency hierarchy and import rules
- `SUPERTHINK_AUDIT.md` - React hooks compliance and validation status

**🎯 ARCHITECTURE STATUS:**
- **✅ Phase 8.5 Complete**: All 45 files implemented and integrated
- **✅ Zero Compilation Errors**: Successful build verification
- **✅ Admin Panel Complete**: All management components integrated
- **✅ Real API Integration**: Google Apps Script backend connected  
    

    #### **2.2 Backend Architecture**

The backend will be serverless, leveraging Google Workspace tools for rapid development and cost-effectiveness.

* **Database:** A **Google Sheet** will serve as the database, with each sheet (tab) acting as a table. This allows for easy viewing and manual editing of data if necessary.  
* **API Layer:** A **Google Apps Script** project, deployed as a Web App, will function as the RESTful API. It will contain all the business logic to read from and write to the Google Sheet, enforcing rules like uniqueness and creating chained tickets.

  #### **2.2.1 Google Sheet Schema**

The Google Sheet will contain the following sheets (tables), with the first row of each serving as the header.

| Sheet Name | Columns | Description |
| ----- | ----- | ----- |
| **`companies` (Enhanced)** | `id`, `name`, `code`, `code_locked`, `code_locked_at`, `code_locked_reason`, `ticket_count` | Defines each company/tenant in the system. Code locking prevents changes after first ticket creation. |
| **`roles` (New)** | `id`, `name`, `company_id` | Defines available roles. `company_id` is NULL for global roles. |
| **`tickets`** | `id`, `ticket_number`, `title`, `ticket_type_id`, `requester_id`, `status`, `current_step_id`, `step_due_date`, `created_at`, `updated_at`, `company_id` | Tracks every ticket created. |
| **`ticket_history`** | `id`, `ticket_id`, `user_id`, `action`, `comment`, `timestamp` | Audit log of all actions on a ticket. |
| **`ticket_types`** | `id`, `transaction_id`, `code`, `name`, `description`, `is_active`, `require_attachment_on_create`, `company_id` | Defines each kind of ticket. `company_id` is NULL for global types. |
| **`comment_requirements`** | `ticket_type_id`, `require_on_approve`, `require_on_return`, `require_on_reject`, `require_on_cancel` | Rules for mandatory comments. |
| **`custom_fields`** | `id`, `ticket_type_id`, `name`, `label`, `type`, `is_required`, `is_hidden`, `sort_order`, `dropdown_list_id`, `depends_on_field_id` | Defines all possible custom fields. |
| **`custom_field_values`** | `id`, `ticket_id`, `custom_field_id`, `text_value`, `number_value`, `date_value`, `start_date_value`, `end_date_value`, `dropdown_option_id` | Stores the data for custom fields. Date range fields use start_date_value and end_date_value. |
| **`workflow_steps` (Enhanced)** | `id`, `ticket_type_id`, `company_id`, `name`, `status_on_reach`, `step_type`, `approver_logic`, `sort_order`, `next_ticket_type_id`, `external_app_url`, `completion_action_name` | Defines the approval/task steps. Each step is company-specific with explicit assignment required. |
| **`step_approvers`** | `step_id`, `role_id` | Links roles to workflow steps. |
| **`user_role_assignments`** | `user_id`, `ticket_type_id`, `role_id`, `validity_end_date`, `company_id` | Assigns roles to users for specific ticket types and companies. |
| **`step_slas`** | `step_id`, `duration`, `unit`, `exclude_weekends` | Defines the SLA for each step. |
| **`step_conditions`** | `id`, `step_id`, `custom_field_id`, `operator`, `value` | Rules for conditional workflows. |
| **`dropdown_lists`** | `id`, `name`, `description` | Defines reusable dropdown lists (company-neutral). |
| **`dropdown_options`** | `id`, `dropdown_list_id`, `label`, `value`, `parent_option_id` | Stores all options for dropdowns. |
| **`dropdown_company_assignments`** | `id`, `dropdown_list_id`, `company_id`, `is_global`, `is_active`, `created_at`, `created_by`, `updated_at`, `updated_by`, `deactivated_at`, `deactivated_by`, `deactivation_reason` | Manages company access to dropdown lists. `is_global=true` means available to all companies. |
| **`ticket_attachments`** | `id`, `ticket_id`, `uploader_id`, `file_name`, `file_url`, `uploaded_at` | Tracks uploaded files. |
| **`report_configurations`** | `id`, `ticket_type_id`, `field_name`, `display_name`, `field_type`, `sort_order` | Stores report configurations. |
| **`ticket_links`** | `id`, `parent_ticket_id`, `child_ticket_id` | Creates links for chained tickets. |
| **`sequence_counters`** | `sequence_name`, `last_number` | Tracks the last used number for ticket ID generation. |
| **`ticket_action_logs`** | `id`, `ticket_id`, `user_id`, `action_type`, `details`, `timestamp` | Detailed, system-level log of all changes to a ticket for auditing. |
| **`admin_action_logs`** | `id`, `admin_user_id`, `action_type`, `target_entity`, `target_id`, `details`, `timestamp` | Logs all configuration changes made in the Admin Panel and all user logins. |

### **3.0 Functional Requirements**

#### **3.0.1 Core Multi-Company Design Principles**

**🎯 EXPLICIT ASSIGNMENT PRINCIPLE**
The system operates on explicit assignment rather than defaults or fallbacks:

* **No Default Workflows:** Every company-ticket type combination requires explicit workflow assignment
* **Copy-Based Setup:** Companies configure by copying from existing setups rather than inheriting defaults
* **Independent Ownership:** Each company owns their workflow copy and can modify without affecting others

**🔄 WORKFLOW ASSIGNMENT ARCHITECTURE**
```
Ticket Type: "Purchase Request"
├── Company A: Manager → Finance (2 steps, 24h SLA)
├── Company B: Manager → Dept Head → Finance (3 steps, 48h SLA)
└── Company C: [Must explicitly choose to copy from A or B]
```

**📋 ADMIN CONFIGURATION FLOW**
1. **First Company Setup:** Company A creates workflows for ticket type
2. **Subsequent Companies:** Must choose to either:
   - Create workflows from scratch, OR
   - Copy existing workflows from Company A (or any other company)
3. **Customization:** After copying, companies can modify their workflows independently

**🔐 DATA INTEGRITY PRINCIPLES**
* **Company Code Locking:** Automatic after first ticket creation
* **Workflow Independence:** Changes to Company A workflows don't affect Company B
* **Explicit Validation:** System validates company-specific configurations separately

#### **3.1 User & Permissions Management**

* **Authentication:** User identity will be managed by Firebase Authentication for security and ease of use.  
* **Role-Based Access Control (RBAC):**  
  * **Company-Dependent Roles:** User roles will be assigned on a **per-company** and **per-ticket-type** basis. A user can be a 'manager' for "Purchase Requests" at Company A, but only a 'user' for the same ticket type at Company B.  
  * **Global Roles:** An admin can create a role that is not assigned to any specific company (`company_id` is NULL). When a user is assigned this global role, it applies to all existing and future companies.  
  * **Assignments:** Role assignments are stored in the `user_role_assignments` sheet, linking a user, role, ticket type, and company.  
  * **Validity Period:** Each role assignment can have an optional `validity_end_date`, after which the permission expires.  
  * **Admin Role:** A global "admin" role exists, granting access to the Admin Panel.

    #### **3.2 Ticket Number Generation**

* **Format:** A user-facing ticket number will be generated upon creation with the format: `COMPANYCODE-TYPECODE-YEAR-SEQUENCE`.  
  * `COMPANYCODE`: A short code from the `companies` sheet (e.g., "MYCO").  
  * `TYPECODE`: A short code from the `ticket_types` sheet (e.g., "PR").  
  * `YEAR`: The current 4-digit year based on Philippine Time (UTC+8).  
  * `SEQUENCE`: An 8-digit number, padded with leading zeros (e.g., `00000001`).  
* **Sequence Logic:**  
  * The sequence number will increment from the value stored in the `sequence_counters` sheet.  
  * The sequence will be unique per company and ticket type code (e.g., "MYCO-PR" is one sequence, "MYCO-LEAVE" is another).  
  * The sequence will only reset after reaching `99,999,999`.  
* **Backend Implementation:** The Google Apps Script will use `LockService` to ensure that even if two users create a ticket at the exact same time, they will receive unique, sequential numbers without any race conditions.

  #### **3.3 Admin Panel: Dynamic Configuration**

Administrators will have access to a dedicated UI to configure the entire system without writing code.

* **Company Management:** Full CRUD for companies, including setting their name and code.
  * **Company Code Locking:** Company codes are automatically locked after the first ticket is created to prevent breaking existing ticket numbers. Admin override capability available with audit logging.
  * **Data Integrity Protection:** Prevents changes to company codes that would invalidate the ticket numbering format (`COMPANYCODE-TYPECODE-YEAR-SEQUENCE`).
* **Role Management:** Full CRUD for roles, including defining them as global or company-specific.
* **Ticket Type Management:**
  * Full CRUD for ticket types. The "Transaction ID" is the unique business identifier for the ticket type.
  * Each ticket type will have a short **Code** for ticket numbering.
  * Configuration for requiring attachments on creation.
  * Configuration for requiring comments on actions (Approve, Return, Reject, Cancel).
  * **Duplicate Prevention:** Ticket type names must be unique within each company (case-insensitive). Prevents user confusion from similar names like "Purchase Request" vs "purchase request".
  * **Multi-Company Ticket Types:** Ticket types are designed to serve multiple companies with explicit workflow assignments per company.
  * **Copy-Based Configuration:** No default workflows - each company must explicitly assign workflows by either creating new ones or copying from existing company setups.
  * **Workflow Independence:** Each company owns their workflow copy and can customize independently without affecting other companies.  
* **Custom Field Builder:**  
  * Admins can add, hide, and reorder fields for any ticket type. Fields used in existing tickets can be hidden but not deleted.  
  * Supported field types: `text`, `paragraph`, `date`, `amount`, `dropdown`, `file`.  
  * Fields can be marked as required.  
* **Dropdown List Management:**
  * A dedicated UI to create and manage reusable lists of options for dropdown fields using a **two-step process**:
    * **Step 1**: Create dropdown list with name, description, and options (saved as draft)
    * **Step 2**: Assign company access - global (all companies), specific companies, or multiple companies
  * **Multi-Company Support**: Dropdowns can be assigned to:
    * **Global**: Available to all companies
    * **Single Company**: Available to one specific company only
    * **Multiple Companies**: Available to selected companies but not all
    * **Draft/Admin-Only**: No company assignments (visible only to admins)
  * **Company Assignment Management**: Admins can add/remove company access after creation
  * Supports **dependent dropdowns**, where the options of one dropdown are filtered based on the selection in a parent dropdown.  
* **Workflow Builder:**  
  * Admins can define a sequence of steps for any ticket type.  
  * **Step Naming:** Steps can be given custom names, with a default naming convention (e.g., "For Approval of Approver (1)").  
  * **Status per Step:** Each step defines the ticket's `status` while it is at that stage.  
  * **Multi-Approver Logic:** Steps can require approval from one (`any`) or all (`all`) assigned roles.  
  * **SLA Configuration:** Each step can have an SLA defined in `hours` or `days`, with an option to exclude weekends (weekdays only).  
  * **Conditional Logic (Stitching):** A step can have conditions based on ticket data (e.g., `itemValue >= 5000`). This allows for branching workflows.  
  * **Chained Workflows:** A step can be configured to automatically trigger the creation of one or more new tickets of different types upon completion, creating parallel chains.  
  * **External App Integration:** A step can be defined as a `task` that links to an external application. The workflow pauses until the user completes the external task and marks it as complete in the system.  
* **Report Configuration:**  
  * For each ticket type, admins can select which standard fields, custom fields, and computed values (e.g., SLA Status) appear in the status report.

    #### **3.4 Ticketing Lifecycle & User Experience**

* **Dashboard:**  
  * The main view will display all tickets.  
  * It will support a **hierarchical (chained) view**, where parent tickets can be expanded to show their child/parallel tickets.  
  * SLA status will be clearly visible (e.g., "Overdue", "Due Today").  
* **Ticket Actions:**  
  * **Cancellation:** Requesters can cancel a ticket if it has not yet been fully completed.  
  * **Return:** Approvers can return a ticket to the previous workflow step.  
  * **Rejection:** Approvers can reject a ticket, which is a final state unless reopened by an admin.  
  * **Reopening:** Admins can reopen a rejected ticket, returning it to the step from which it was rejected.  
* **Reporting:**  
  * A dedicated "Reports" section will allow users to generate and view reports based on the configurations set by the admin.  
  * Reports will include links to view ticket details and workflow history.  
  * Reports will have an option to be exported to CSV.

    #### **3.5 Audit Logging**

* **Ticket Action Logging:**  
  * Every state change on a ticket (creation, status change, field value update, step change) will be recorded in the `ticket_action_logs` sheet.  
  * The `details` column will store a JSON string representing the change (e.g., `{"field": "status", "from": "New", "to": "Pending Approval"}`).poc  
  * This provides a detailed, immutable record for compliance and debugging, separate from the user-facing `ticket_history`.  
* **Admin Action Logging:**  
  * Every successful user login will be recorded in the `admin_action_logs` sheet with an `action_type` of "USER\_LOGIN".  
  * Every action performed within the Admin Panel (e.g., creating a new ticket type, modifying a workflow, updating a role) will be recorded in the `admin_action_logs` sheet.  
  * The `target_entity` and `target_id` will identify the object that was changed (e.g., `ticket_type`, `tt_1`).  
  * The `details` column will store a JSON string of the changes made.  
  * This ensures full traceability of all administrative changes to the system's configuration.  
    

Notes:

App,js

The mock user data is currently essential for the proof-of-concept to work. It acts as a placeholder for a real user login, allowing the `App.js` component to render the main dashboard and header with user information.

Once you fully connect the frontend to Firebase Authentication and your Google Sheet backend API, you will replace that entire `setTimeout` block with the live `onAuthStateChanged` listener and an API call to fetch the user's profile. At that point, the mock data will be removed.



### **🚨 CRITICAL SCHEMA MIGRATION UPDATE** (September 24, 2025)

**RESOLVED**: Major schema consistency issue identified and resolved through comprehensive SUPERTHINK audit.

**Issue**: When audit fields were added to all database tables (dropdown_lists, companies, roles, etc.), only headers were updated while existing data remained in old format, causing severe column mapping issues where timestamps appeared in wrong fields.

**Solution**: Clean reset approach implemented in `APPSCRIPT.txt` v4.3
- `completeSystemReset()` - One-click solution (recommended)
- `cleanResetAllTables()` - Schema reset only
- `createFreshTestData()` - Fresh test data creation
- `diagnoseDropdownListsSheet()` - Schema debugging utility

**Status**:
- ✅ Root cause identified and solution implemented
- 🟡 Pending: Execute `completeSystemReset()` in deployed Google Apps Script
- 🟡 Pending: Verify dropdown creation works end-to-end

**File Location**: `./appscript_files/APPSCRIPT.txt` (Version 4.3)

---

## 🌟 UNIVERSAL ENTITY ARCHITECTURE

**Core Innovation**: Treating tickets, user profiles, and roles as the same type of configurable entities with dynamic custom fields.

### **Universal Entity Concept**
```
📊 TICKETS      → custom_fields (entity_category='ticket')      → custom_field_values
👤 USER PROFILES → custom_fields (entity_category='user_profile') → custom_field_values
🔐 ROLES        → custom_fields (entity_category='role')        → custom_field_values
⚡ WORKFLOWS    → custom_fields (entity_category='workflow_step') → custom_field_values (future)
```

### **What IS Universal (Reused Infrastructure):**
✅ **Custom Fields Infrastructure** - Same tables, same functions, same UI components
✅ **AdminCustomFieldBuilder** - Same component works for all entity types with entityCategory prop
✅ **API Functions** - Same getCustomFields, createCustomField, setCustomFieldValue with entityCategory parameter
✅ **Dropdown System** - Unified dropdown_lists shared across all entity types
✅ **Validation Logic** - Same form validation and business rules for all entities

### **What is NOT Universal (Entity-Specific Features):**
❌ **SLAs** - Only apply to tickets/workflows, NOT user profiles or roles
❌ **Workflow Engine** - Specific to ticket processing only
❌ **Approval Routing** - Ticket-specific business logic only
❌ **Status Transitions** - Not relevant for user/role management

### **Implementation Benefits:**
- **90% Code Reuse** - Same components, hooks, and functions for all entity types
- **Zero New Components** - AdminCustomFieldBuilder enhanced with entityCategory prop
- **Backward Compatible** - All existing ticket functionality unchanged (default entityCategory='ticket')
- **Consistent UX** - Same admin experience across tickets, users, and roles

### **Usage Examples:**
```javascript
// For tickets (existing)
<AdminCustomFieldBuilder entityTypeId="tt_purchase" entityCategory="ticket" />

// For user profiles (new)
<AdminCustomFieldBuilder entityTypeId="upt_employee" entityCategory="user_profile" />

// For roles (new)
<AdminCustomFieldBuilder entityTypeId="rt_manager" entityCategory="role" />
```

**Mandatory Reference**: `UNIVERSAL_ENTITY_ARCHITECTURE.md` - Required reading before any entity-related development work.

### **🔄 UPDATED SCHEMA: UNIVERSAL ENTITY TABLES (September 27, 2025)**

#### **Enhanced Existing Tables for Universal Entity Support**

**custom_fields (Enhanced)**
```
SCHEMA: id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

KEY CHANGE: + entity_category (TEXT, default 'ticket')
VALUES: 'ticket', 'user_profile', 'role', 'workflow_step'
BACKWARD COMPATIBILITY: 100% - existing ticket custom fields unchanged
```

**custom_field_values (Enhanced)**
```
SCHEMA: id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

KEY CHANGE: + entity_category (TEXT, default 'ticket')
PURPOSE: ticket_id becomes entity_id for non-ticket entities
BACKWARD COMPATIBILITY: 100% - existing ticket data unchanged
```

**user_role_assignments (Date-based Enhancement)**
```
SCHEMA: id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

KEY CHANGES:
+ assignment_type ('permanent', 'temporary', 'project_based', 'emergency', 'delegation')
+ effective_start_date/effective_end_date (temporal role management)
+ auto_expire_days (automatic expiration)
+ assigned_by_user_id (assignment tracking)
+ approval_required (assignment approval workflow)
+ assignment_notes (reason/documentation)
```

#### **New Tables for User/Role Management**

**user_profile_types**
```
SCHEMA: id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

PURPOSE: Define configurable user profile types (Employee, Contractor, Vendor, Intern)
RELATIONSHIP: Links to custom_fields with entity_category='user_profile'
EXAMPLES: Standard Employee (EMP), Contractor (CTR), Vendor Contact (VND)
```

**role_types**
```
SCHEMA: id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

PURPOSE: Define configurable role types with custom attributes
RELATIONSHIP: Links to custom_fields with entity_category='role'
EXAMPLES: Approval Roles (APR), Department Roles (DEP), System Roles (SYS)
```

**user_profiles**
```
SCHEMA: user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date|is_active|created_at|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

PURPOSE: Individual user profile instances with approval relationships
KEY FEATURES:
- immediate_approver_id: Direct manager/supervisor
- backup_approver_id: Fallback approver when primary unavailable
- Integrates with Firebase Authentication via user_id
- Links to custom_field_values for additional configurable attributes
```

#### **Universal Entity Implementation Impact**

**Schema Changes Summary:**
- Modified Tables: 3 (custom_fields, custom_field_values, user_role_assignments)
- New Tables: 3 (user_profile_types, role_types, user_profiles)
- Total Columns Added: 3 across existing tables
- Backward Compatibility: 100% for all existing functionality

**Development Efficiency Benefits:**
- Code Reuse: 90% - Same components for all entity management
- API Reuse: 85% - Enhanced existing functions vs creating new ones
- UI Reuse: 95% - AdminCustomFieldBuilder works for all entity types
- Implementation Time: 35-45 days vs 60+ days for separate systems

**Next Implementation Steps:**
1. Execute `completeSystemReset()` in Google Apps Script
2. Implement enhanced API functions with entityCategory support
3. Update frontend components with universal entity capabilities

### **🏷️ PHASE 11.0: TICKET TAGS & COLLABORATION SYSTEM**

**Status**: Design Complete, Implementation Pending
**Impact**: Enhanced ticket organization and cross-company collaboration capabilities

#### **🎯 Core Features:**
- **Ticket Tagging**: Hierarchical tags with smart autocomplete and usage analytics
- **Collaboration System**: Share tickets across users/companies with granular permissions
- **Advanced Search**: Multi-tag filtering with AND/OR/NOT operators and saved searches
- **Security Controls**: Permission levels, access revocation, audit trails, and expiration dates

#### **📊 Implementation Components:**
- **Database**: 8 new tables for tags and collaboration (see DATABASE_SCHEMA_UPDATES.txt)
- **Backend**: 25+ AppScript functions for tag/collaboration management (see TICKET_TAGS_COLLABORATION_APPSCRIPT.txt)
- **Frontend**: 4 new React components (TagInput, TagSearchFilter, TicketTagManager, TicketCollaborationManager)
- **Integration**: Designed for seamless integration with existing ticket workflow

#### **🔄 Current Status:**
- ✅ **Design Complete**: All specifications, schemas, and components designed
- 🔄 **Implementation Pending**: Backend integration and database table creation required
- **Next Steps**: See SUPERTHINK_TODO_ANALYSIS_2025-09-27.md for detailed implementation roadmap

**References**: Complete specifications in DATABASE_SCHEMA_UPDATES.txt, component designs in `/src/components/`, AppScript functions in TICKET_TAGS_COLLABORATION_APPSCRIPT.txt

---

MANDATORY NOTICES:
1. Ensure to check/recheck/fix any and all syntax errors in component created/edited.
2. Consider create mapping of all dependencies connection before creating/updating the components.
3. update dependecy documentation as each component is created/updated/read/updated/audited.
4. **ALWAYS READ FILES FIRST BEFORE UPDATING** - Use Read tool to understand current content and context before making any modifications to prevent overwriting important information.
5. **SCHEMA MIGRATION**: Execute `completeSystemReset()` in Google Apps Script before any dropdown testing.

### **🛡️ DROPDOWN CREATION LESSONS LEARNED**

**📋 COMPREHENSIVE SAFEGUARDS AND RESOLUTION METHODOLOGY**
**See `RESOLUTION_CHECKLIST.md` for complete:**
- 15 critical development safeguards based on dropdown creation analysis
- Fundamental Resolution Rule with domain-specific checks
- Pattern consistency requirements and working reference library
- Comprehensive 6-phase evolution analysis and lessons learned

