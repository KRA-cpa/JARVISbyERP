## **Ticketing & Workflow Orchestration System: Functional Specifications**

**Version:** 2.4 **Date:** July 27, 2025

### **1.0 Overview**

This document outlines the functional requirements for a dynamic ticketing and workflow orchestration system. The primary goal is to create a highly configurable, multi-tenant platform where administrators can define entire business processes—including forms, multi-step approval chains, conditional logic, SLA tracking, and integrations with external tools—without requiring new code.

For the proof-of-concept phase, the system will utilize a React frontend deployed to a cloud service (e.g., Vercel) and a serverless backend powered by a Google Sheet database and a Google Apps Script web app API.

NOTICE: Ensure to check/recheck/fix any and all syntax errors in component created/edited.
Consider create mapping of all dependencies connection before creating/updating the components.

### **2.0 System Architecture**

The system is composed of two main parts: a frontend application for user interaction and a backend for data storage and logic.

#### **2.1 Frontend Architecture**

The user interface will be a single-page application (SPA) built with **React**. This provides a modern, responsive, and interactive user experience.

**Component Hierarchy:**

The project will be organized into a standard, scalable file structure:

* /src  
  * |-- /api  
  * |   |-- googleSheet.js      \# Handles all fetch() requests to the Apps Script API  
  * |  
  * |-- /components  
  * |   |-- /admin  
  * |   |   |-- TicketTypeEditor.js   \# Main editor for a ticket type  
  * |   |   |-- DropdownListEditor.js \# UI for managing dropdown options  
  * |   |   |-- CompanyEditor.js      \# UI for managing companies  
  * |   |   |-- RoleEditor.js         \# UI for managing roles  
  * |   |  
  * |   |-- /dashboard  
  * |   |   |-- TicketDashboard.js    \# The list view of all tickets (including chained view)  
  * |   |   |-- TicketListItem.js     \# A single item/row in the ticket list  
  * |   |   |-- TicketDetail.js       \# Detailed view of a single ticket  
  * |   |  
  * |   |-- /shared  
  * |   |   |-- Header.js             \# Top navigation bar with user info and clock  
  * |   |   |-- LiveClock.js          \# Real-time clock component (UTC+8)  
  * |   |   |-- LoadingScreen.js      \# Reusable loading spinner  
  * |   |   |-- ActionCommentModal.js \# Modal for requiring comments on actions  
  * |   |   |-- Icons.js              \# SVG icon components  
  * |  
  * |-- /pages  
  * |   |-- AdminPage.js            \# Main container for the admin panel  
  * |   |-- DashboardPage.js        \# Main container for the user-facing dashboard  
  * |   |-- LoginPage.js            \# Authentication/loading screen  
  * |  
  * |-- /config  
  * |   |-- firebase.js             \# Firebase Authentication setup (for user identity)  
  * |  
  * |-- App.js                      \# Main component handling routing and layout  
  * \`-- index.js                    \# Application entry point  
    

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

NOTICE: Ensure to check/recheck/fix any and all syntax errors in component created/edited.
Consider create mapping of all dependencies connection before creating/updating the components.