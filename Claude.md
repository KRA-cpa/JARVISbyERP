## **Ticketing & Workflow Orchestration System: Functional Specifications**

**Version:** 2.5 **Date:** September 17, 2025

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

**⚠️ CRITICAL DEVELOPMENT RULES:**
- **NO COMPONENT CREATION** without consulting dependency mapping
- **NO HOOK MODIFICATIONS** without reviewing audit documentation
- **NO DEPENDENCY CHANGES** without updating PRODUCTION_REQUIREMENTS.md first
- **ALL IMPORTS** must follow 7-layer dependency hierarchy
- **VERIFY FILE STRUCTURE** against current 43-file inventory in DEVELOPMENT_PLAN.md

### **📊 SUPERTHINK AUDIT METHODOLOGY & LATEST RESULTS**

**🔍 SUPERTHINK AUDIT METHODOLOGY:**
Comprehensive systematic review process for React applications focusing on:
- **React Hooks Dependencies**: Validation of useEffect, useCallback, useMemo dependency arrays
- **Syntax Error Detection**: Complete compilation error identification and resolution
- **Component Dependencies**: Import/export relationship mapping and circular dependency prevention
- **Code Quality Standards**: ESLint compliance, type safety, and architectural consistency
- **Production Readiness**: Build verification, error handling, and performance optimization

**✅ LATEST AUDIT COMPLETION (September 17, 2025):**
- **43/43 Files Audited**: 100% coverage of entire React application codebase
- **19 Critical Icon Fixes**: All non-existent icon references resolved (Icons.Loading, Icons.CheckCircle, etc.)
- **4 Compilation Errors Fixed**: Zero blocking build issues remain (useAPIData function, useUsers hook, useTicketTypes export, cache references, etc.)
- **Dependency Architecture**: Complete 7-layer hierarchy established and documented
- **Production Ready**: Application compiles successfully with only minor ESLint warnings

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

### **🔬 PROOF OF CONCEPT ARCHITECTURE**

**Current Implementation**: Google Sheets + Apps Script Database Backend
- **Purpose**: Serverless proof of concept demonstrating workflow orchestration capabilities
- **Database**: Google Sheets with 15+ tabs representing normalized database tables
- **API Layer**: Google Apps Script web app providing RESTful endpoints with JSON responses
- **Frontend**: React SPA deployed to Vercel with Firebase Authentication
- **Data Tables**: companies, roles, tickets, ticket_types, users, workflow_steps, custom_fields, dropdown_lists, dropdown_options, ticket_history, ticket_action_logs, admin_action_logs, sequence_counters

### **⚠️ PRODUCTION CONSIDERATIONS**
- **Scale Limitations**: Google Sheets not suitable for high-volume production use
- **Migration Path**: Future migration to traditional database (PostgreSQL, MySQL, etc.) planned
- **Current Status**: Fully functional proof of concept with production-ready frontend architecture

**IMPLEMENTATION STATUS:** Phase 8.5 Complete - All 45 files implemented, admin components complete, real API integrated

**✅ CRITICAL GAP RESOLVED:** Ticket Types and Custom Fields admin management components implemented with real Google Apps Script integration

### **2.0 System Architecture**

The system is composed of two main parts: a frontend application for user interaction and a backend for data storage and logic.

#### **2.1 Frontend Architecture**

The user interface will be a single-page application (SPA) built with **React**. This provides a modern, responsive, and interactive user experience.

**⚠️ CURRENT IMPLEMENTED ARCHITECTURE (43 Files):**

**📋 FOR COMPLETE FILE STRUCTURE, SEE `DEVELOPMENT_PLAN.md` SECTION 'Complete File Structure'**

```
src/ (45 total files) ✅ PHASE 8.5 COMPLETE
├── api/ (2 files)
│   ├── googleSheet.js           # ✅ API client with real Google Apps Script URL
│   └── models.js                # ✅ Data models & JSDoc type definitions
├── components/ (21 files)
│   ├── admin/ (8 files)         # ✅ COMPLETE - All admin management components
│   │   ├── AdminCompanyManager.js
│   │   ├── AdminDropdownManager.js
│   │   ├── AdminRoleManager.js
│   │   ├── APIConnectionStatus.js
│   │   ├── ConditionalWorkflowBuilder.js
│   │   ├── RBACSettings.js
│   │   ├── ✅ AdminTicketTypeManager.js    # NEW - Phase 8.5 - Ticket type CRUD
│   │   └── ✅ AdminCustomFieldManager.js   # NEW - Phase 8.5 - Custom field builder
│   ├── shared/ (9 files)        # ✅ Reusable UI components with 40+ icons
│   │   ├── ActionCommentModal.js
│   │   ├── APITestPanel.js
│   │   ├── DevPanel.js
│   │   ├── ErrorBoundary.js
│   │   ├── Header.js
│   │   ├── Icons.js
│   │   ├── LiveClock.js
│   │   ├── LoadingScreen.js
│   │   └── Toast.js
│   └── tickets/ (4 files)       # ✅ Complete ticket management system
│       ├── TicketDashboard.js
│       ├── TicketDetail.js
│       ├── TicketForm.js
│       └── WorkflowStep.js
├── config/ (3 files)            # ✅ Configuration & environment management
│   ├── apiConfig.js
│   ├── development.js
│   └── firebase.js
├── contexts/ (1 file)           # ✅ Authentication & user state
│   └── UserContext.js
├── hooks/ (2 files)             # ✅ React hooks for data & workflow
│   ├── useAPI.js
│   └── useWorkflowRouter.js
├── pages/ (4 files)             # ✅ Main application pages
│   ├── AdminPage.js
│   ├── DashboardPage.js
│   ├── LoginPage.js
│   └── UnauthorizedPage.js
├── utils/ (7 files)             # ✅ Business logic & workflow engine
│   ├── approvalRouter.js
│   ├── chainedTickets.js
│   ├── conditionalWorkflows.js
│   ├── externalAppIntegration.js
│   ├── rbac.js
│   ├── ticketNumber.js
│   └── workflowEngine.js
├── App.js                       # ✅ Main routing & layout
├── App.test.js                  # ✅ Test suite
├── index.js                     # ✅ Application entry point
├── reportWebVitals.js           # ✅ Performance monitoring
└── setupTests.js                # ✅ Testing configuration
```

**🎯 ARCHITECTURE STATUS:**
- **✅ Phase 8.5 Complete**: All 45 files implemented and integrated
- **✅ Admin Components**: All critical admin management components implemented
- **✅ Zero Compilation Errors**: Successful build verification
- **✅ Dependency Mapping**: Complete 7-layer architecture documented
- **✅ React Hooks Compliance**: All hooks validated and optimized
- **✅ Admin Panel Complete**: Ticket Types and Custom Fields management integrated
- **✅ Real API Integration**: Google Apps Script URL configured and connected

#### **🔗 DEPENDENCY & HOOKS REQUIREMENTS**

**📋 MANDATORY ARCHITECTURAL COMPLIANCE:**

1. **7-Layer Dependency Hierarchy** (See `DEPENDENCY_MAPPING.md`):
   ```
   Layer 1: Pages (4) → Layer 2: Components (19) → Layer 3: Shared (9)
        ↓                    ↓                         ↓
   Layer 4: Hooks (2) → Layer 5: Utils (7) → Layer 6: API/Context (3)
        ↓                 ↓                    ↓
                     Layer 7: Config (3)
   ```

2. **React Hooks Standards** (25+ hooks implemented):
   - **useAPI.js**: 25+ data fetching hooks with caching and error handling
   - **useWorkflowRouter.js**: Workflow progression and approval management
   - **UserContext hooks**: Authentication and permission management
   - **useToast**: Notification system integration

3. **Import/Export Rules**:
   - **NO upward imports** - Lower layers cannot import higher layers
   - **Shared components** only import Icons and basic utilities
   - **Hooks** must be pure data fetching with no business logic
   - **Utils** contain pure functions with no React dependencies

4. **Component Standards**:
   - **Mobile-responsive**: All components use Tailwind CSS breakpoints
   - **Loading states**: Every async operation has loading indicators
   - **Error handling**: Graceful failure with user-friendly messages
   - **Permission checks**: RBAC integration with development mode toggle  
    

    #### **2.2 Backend Architecture**

The backend will be serverless, leveraging Google Workspace tools for rapid development and cost-effectiveness.

* **Database:** A **Google Sheet** will serve as the database, with each sheet (tab) acting as a table. This allows for easy viewing and manual editing of data if necessary.  
* **API Layer:** A **Google Apps Script** project, deployed as a Web App, will function as the RESTful API. It will contain all the business logic to read from and write to the Google Sheet, enforcing rules like uniqueness and creating chained tickets.

  #### **2.2.1 Google Sheet Schema**

The Google Sheet will contain the following sheets (tables), with the first row of each serving as the header.

| Sheet Name | Columns | Description |
| ----- | ----- | ----- |
| **`companies` (New)** | `id`, `name`, `code` | Defines each company/tenant in the system. |
| **`roles` (New)** | `id`, `name`, `company_id` | Defines available roles. `company_id` is NULL for global roles. |
| **`tickets`** | `id`, `ticket_number`, `title`, `ticket_type_id`, `requester_id`, `status`, `current_step_id`, `step_due_date`, `created_at`, `updated_at`, `company_id` | Tracks every ticket created. |
| **`ticket_history`** | `id`, `ticket_id`, `user_id`, `action`, `comment`, `timestamp` | Audit log of all actions on a ticket. |
| **`ticket_types`** | `id`, `transaction_id`, `code`, `name`, `description`, `is_active`, `require_attachment_on_create`, `company_id` | Defines each kind of ticket. `company_id` is NULL for global types. |
| **`comment_requirements`** | `ticket_type_id`, `require_on_approve`, `require_on_return`, `require_on_reject`, `require_on_cancel` | Rules for mandatory comments. |
| **`custom_fields`** | `id`, `ticket_type_id`, `name`, `label`, `type`, `is_required`, `is_hidden`, `sort_order`, `dropdown_list_id`, `depends_on_field_id` | Defines all possible custom fields. |
| **`custom_field_values`** | `id`, `ticket_id`, `custom_field_id`, `text_value`, `number_value`, `date_value`, `dropdown_option_id` | Stores the data for custom fields. |
| **`workflow_steps`** | `id`, `ticket_type_id`, `name`, `status_on_reach`, `step_type`, `approver_logic`, `sort_order`, `next_ticket_type_id`, `external_app_url`, `completion_action_name` | Defines the approval/task steps. |
| **`step_approvers`** | `step_id`, `role_id` | Links roles to workflow steps. |
| **`user_role_assignments`** | `user_id`, `ticket_type_id`, `role_id`, `validity_end_date`, `company_id` | Assigns roles to users for specific ticket types and companies. |
| **`step_slas`** | `step_id`, `duration`, `unit`, `exclude_weekends` | Defines the SLA for each step. |
| **`step_conditions`** | `id`, `step_id`, `custom_field_id`, `operator`, `value` | Rules for conditional workflows. |
| **`dropdown_lists`** | `id`, `name` | Defines reusable dropdown lists. |
| **`dropdown_options`** | `id`, `dropdown_list_id`, `label`, `value`, `parent_option_id` | Stores all options for dropdowns. |
| **`ticket_attachments`** | `id`, `ticket_id`, `uploader_id`, `file_name`, `file_url`, `uploaded_at` | Tracks uploaded files. |
| **`report_configurations`** | `id`, `ticket_type_id`, `field_name`, `display_name`, `field_type`, `sort_order` | Stores report configurations. |
| **`ticket_links`** | `id`, `parent_ticket_id`, `child_ticket_id` | Creates links for chained tickets. |
| **`sequence_counters`** | `sequence_name`, `last_number` | Tracks the last used number for ticket ID generation. |
| **`ticket_action_logs`** | `id`, `ticket_id`, `user_id`, `action_type`, `details`, `timestamp` | Detailed, system-level log of all changes to a ticket for auditing. |
| **`admin_action_logs`** | `id`, `admin_user_id`, `action_type`, `target_entity`, `target_id`, `details`, `timestamp` | Logs all configuration changes made in the Admin Panel and all user logins. |

### **3.0 Functional Requirements**

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
* **Role Management:** Full CRUD for roles, including defining them as global or company-specific.  
* **Ticket Type Management:**  
  * Full CRUD for ticket types. The "Transaction ID" is the unique business identifier for the ticket type.  
  * Each ticket type will have a short **Code** for ticket numbering.  
  * Configuration for requiring attachments on creation.  
  * Configuration for requiring comments on actions (Approve, Return, Reject, Cancel).  
* **Custom Field Builder:**  
  * Admins can add, hide, and reorder fields for any ticket type. Fields used in existing tickets can be hidden but not deleted.  
  * Supported field types: `text`, `paragraph`, `date`, `amount`, `dropdown`, `file`.  
  * Fields can be marked as required.  
* **Dropdown List Management:**  
  * A dedicated UI to create and manage reusable lists of options for dropdown fields.  
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



MANDATORY NOTICES:
1. Ensure to check/recheck/fix any and all syntax errors in component created/edited.
2. Consider create mapping of all dependencies connection before creating/updating the components.
3. update dependecy documentation as each component is created/updated/read/updated/audited.
4. Read first md files before you update.

