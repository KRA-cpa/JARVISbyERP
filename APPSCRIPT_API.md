# Google Apps Script API Documentation

## Overview

This document outlines the Google Apps Script Web App that serves as the RESTful API layer for the Ticketing & Workflow Orchestration System.

**Database**: [Google Sheet](https://docs.google.com/spreadsheets/d/1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4/edit?usp=drive_link)
**Frontend**: React application making fetch() requests to this API
**Deployment**: Google Apps Script Web App (publicly accessible with authentication)

## Database Schema (Google Sheet Tabs)

### Core Entity Tables
- **`companies`** - `id`, `name`, `code`
- **`roles`** - `id`, `name`, `company_id` (NULL for global roles)
- **`tickets`** - `id`, `ticket_number`, `title`, `ticket_type_id`, `requester_id`, `status`, `current_step_id`, `step_due_date`, `created_at`, `updated_at`, `company_id`
- **`ticket_types`** - `id`, `transaction_id`, `code`, `name`, `description`, `is_active`, `require_attachment_on_create`, `company_id`
- **`user_role_assignments`** - `user_id`, `ticket_type_id`, `role_id`, `validity_end_date`, `company_id`

### Workflow & Configuration Tables
- **`workflow_steps`** - `id`, `ticket_type_id`, `name`, `status_on_reach`, `step_type`, `approver_logic`, `sort_order`, `next_ticket_type_id`, `external_app_url`, `completion_action_name`
- **`step_approvers`** - `step_id`, `role_id`
- **`custom_fields`** - `id`, `ticket_type_id`, `name`, `label`, `type`, `is_required`, `is_hidden`, `sort_order`, `dropdown_list_id`, `depends_on_field_id`
- **`custom_field_values`** - `id`, `ticket_id`, `custom_field_id`, `text_value`, `number_value`, `date_value`, `dropdown_option_id`
- **`dropdown_lists`** - `id`, `name`
- **`dropdown_options`** - `id`, `dropdown_list_id`, `label`, `value`, `parent_option_id`

### Audit & Tracking Tables
- **`ticket_history`** - `id`, `ticket_id`, `user_id`, `action`, `comment`, `timestamp`
- **`ticket_action_logs`** - `id`, `ticket_id`, `user_id`, `action_type`, `details`, `timestamp`
- **`admin_action_logs`** - `id`, `admin_user_id`, `action_type`, `target_entity`, `target_id`, `details`, `timestamp`

### Supporting Tables
- **`comment_requirements`** - `ticket_type_id`, `require_on_approve`, `require_on_return`, `require_on_reject`, `require_on_cancel`
- **`step_slas`** - `step_id`, `duration`, `unit`, `exclude_weekends`
- **`step_conditions`** - `id`, `step_id`, `custom_field_id`, `operator`, `value`
- **`ticket_attachments`** - `id`, `ticket_id`, `uploader_id`, `file_name`, `file_url`, `uploaded_at`
- **`report_configurations`** - `id`, `ticket_type_id`, `field_name`, `display_name`, `field_type`, `sort_order`
- **`ticket_links`** - `id`, `parent_ticket_id`, `child_ticket_id`
- **`sequence_counters`** - `sequence_name`, `last_number`

## API Endpoints Structure

### Base Configuration
```javascript
// Main Web App entry point
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  // CORS headers
  // Authentication check
  // Route to appropriate handler
  // Return JSON response
}
```

### 1. Company Management
```javascript
// GET /companies - List all companies
// POST /companies - Create new company
// PUT /companies/:id - Update company
// DELETE /companies/:id - Delete company

function getCompanies() {
  // Read from 'companies' sheet
}

function createCompany(data) {
  // Validate company code uniqueness
  // Insert to 'companies' sheet
  // Log admin action
}
```

### 2. Role Management
```javascript
// GET /roles - List roles (filtered by company if needed)
// POST /roles - Create new role
// PUT /roles/:id - Update role
// DELETE /roles/:id - Delete role

function getRoles(companyId = null) {
  // Read from 'roles' sheet
  // Filter by company_id or show global roles
}
```

### 3. User Role Assignments
```javascript
// GET /user-roles/:userId - Get user's roles
// POST /user-roles - Assign role to user
// DELETE /user-roles - Remove role assignment

function getUserRoles(userId, companyId = null) {
  // Join user_role_assignments with roles
  // Check validity_end_date
}
```

### 4. Ticket Management
```javascript
// GET /tickets - List tickets (with filters)
// POST /tickets - Create new ticket
// PUT /tickets/:id - Update ticket
// GET /tickets/:id - Get single ticket with details

function createTicket(ticketData) {
  // Generate ticket number: COMPANYCODE-TYPECODE-YEAR-SEQUENCE
  // Use LockService for sequence counter
  // Insert to 'tickets' sheet
  // Create initial ticket_history entry
  // Log ticket action
}

function generateTicketNumber(companyId, ticketTypeId) {
  // Get company code and ticket type code
  // Get Philippine Time year (UTC+8)
  // Use LockService to increment sequence
  // Format: MYCO-PR-2025-00000001
}
```

### 5. Workflow Management
```javascript
// GET /workflows/:ticketTypeId - Get workflow steps for ticket type
// POST /tickets/:id/actions - Perform ticket action (approve, reject, etc.)

function performTicketAction(ticketId, action, userId, comment = null) {
  // Validate user permissions
  // Check comment requirements
  // Update ticket status and current_step
  // Create ticket_history entry
  // Log detailed ticket_action_logs
  // Check for chained ticket creation
  // Calculate next SLA due date
}
```

### 6. Custom Fields
```javascript
// GET /custom-fields/:ticketTypeId - Get fields for ticket type
// POST /custom-fields - Create custom field
// PUT /custom-field-values - Save field values for ticket

function getCustomFields(ticketTypeId, includeHidden = false) {
  // Read custom_fields with dependencies
  // Join with dropdown options if applicable
}
```

### 7. Dropdown Management
```javascript
// GET /dropdown-lists - Get all dropdown lists
// GET /dropdown-options/:listId - Get options for dropdown
// POST /dropdown-lists - Create new dropdown list

function getDropdownOptions(listId, parentOptionId = null) {
  // Support hierarchical dropdowns
  // Filter by parent for dependent dropdowns
}
```

### 8. Reporting & Audit
```javascript
// GET /reports/:ticketTypeId - Generate report
// GET /audit-logs - Get audit trail
// POST /reports/export - Export to CSV

function generateReport(ticketTypeId, filters = {}) {
  // Use report_configurations for field selection
  // Join multiple tables for complete data
  // Apply date range and status filters
}
```

## Core Business Logic Functions

### 1. Ticket Number Generation with Concurrency Control
```javascript
function generateUniqueTicketNumber(companyId, ticketTypeId) {
  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(5000); // 5 second timeout

    const company = getCompanyById(companyId);
    const ticketType = getTicketTypeById(ticketTypeId);

    // Philippine Time (UTC+8)
    const now = new Date();
    const utc8 = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const year = utc8.getFullYear();

    const sequenceKey = `${company.code}-${ticketType.code}`;
    const nextNumber = incrementSequenceCounter(sequenceKey);

    return `${company.code}-${ticketType.code}-${year}-${nextNumber.toString().padStart(8, '0')}`;
  } finally {
    lock.releaseLock();
  }
}
```

### 2. Multi-Step Approval Logic
```javascript
function processApprovalStep(ticketId, stepId, userId, action) {
  const step = getWorkflowStep(stepId);
  const userRoles = getUserRoles(userId);

  // Check if user has required role for this step
  if (!hasRequiredRole(userRoles, stepId)) {
    throw new Error('Insufficient permissions');
  }

  if (step.approver_logic === 'all') {
    // Need all approvers - check if this completes the step
    return checkAllApproversComplete(stepId, ticketId);
  } else {
    // Any approver can complete - move to next step
    return moveToNextStep(ticketId, stepId);
  }
}
```

### 3. Conditional Workflow Processing
```javascript
function evaluateStepConditions(stepId, ticketId) {
  const conditions = getStepConditions(stepId);
  const ticketData = getTicketWithCustomFields(ticketId);

  for (let condition of conditions) {
    const fieldValue = getCustomFieldValue(ticketId, condition.custom_field_id);
    if (!evaluateCondition(fieldValue, condition.operator, condition.value)) {
      return false; // Skip this step
    }
  }
  return true; // All conditions met
}
```

### 4. SLA Calculation
```javascript
function calculateStepDueDate(stepId, startTime = null) {
  const sla = getStepSLA(stepId);
  if (!sla) return null;

  const start = startTime || new Date();
  const duration = sla.duration;
  const unit = sla.unit; // 'hours' or 'days'

  if (sla.exclude_weekends && unit === 'days') {
    return addBusinessDays(start, duration);
  } else {
    const ms = unit === 'hours' ? duration * 60 * 60 * 1000 : duration * 24 * 60 * 60 * 1000;
    return new Date(start.getTime() + ms);
  }
}
```

## Security & Authentication

### 1. User Authentication
```javascript
function authenticateUser(request) {
  // Validate Firebase JWT token
  // Extract user ID and email
  // Check user exists in system
  // Return user context
}
```

### 2. Permission Validation
```javascript
function checkUserPermission(userId, action, resourceId, companyId) {
  const userRoles = getUserRoles(userId, companyId);
  const requiredPermissions = getRequiredPermissions(action, resourceId);

  return userRoles.some(role =>
    hasPermission(role, requiredPermissions)
  );
}
```

## Deployment Configuration

### Web App Settings
- **Execute as**: Me (script owner)
- **Access**: Anyone (with authentication)
- **Version**: Deploy as new version for each update

### Environment Variables
```javascript
// Script Properties (File > Project Properties > Script Properties)
const CONFIG = {
  SPREADSHEET_ID: '1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4',
  FIREBASE_PROJECT_ID: 'jarvisbyerp',
  TIMEZONE: 'Asia/Manila',
  DEFAULT_SLA_HOURS: 24
};
```

## Error Handling & Logging

### Standard Response Format
```javascript
function createResponse(success, data = null, error = null) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      data: data,
      error: error,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Admin Action Logging
```javascript
function logAdminAction(userId, actionType, targetEntity, targetId, details) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('admin_action_logs');
  sheet.appendRow([
    Utilities.getUuid(), // id
    userId,              // admin_user_id
    actionType,          // action_type
    targetEntity,        // target_entity
    targetId,            // target_id
    JSON.stringify(details), // details
    new Date()           // timestamp
  ]);
}
```

## Development Status

- [ ] **Setup & Configuration** - Create Apps Script project, link to spreadsheet
- [ ] **Core CRUD Operations** - Basic read/write functions for all tables
- [ ] **Authentication Integration** - Firebase token validation
- [ ] **Business Logic Implementation** - Ticket number generation, workflow processing
- [ ] **API Endpoint Routing** - Complete REST API structure
- [ ] **Testing & Validation** - Test all endpoints with frontend integration
- [ ] **Deployment** - Deploy as Web App and provide URL to frontend

## Next Steps

1. Create Google Apps Script project
2. Implement core database helper functions
3. Build REST API endpoints
4. Test with Postman/frontend integration
5. Deploy as Web App
6. Update frontend `googleSheet.js` with API URL

---

*Last Updated: September 15, 2025*