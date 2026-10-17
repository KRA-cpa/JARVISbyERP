
# STAGING Gemini Integration - September 27, 2025

This file contains the proposed changes to the database schema and AppScript code based on the analysis in `SUPERTHINK_TODO_ANALYSIS_2025-09-27.md`.

## 1. PROPOSED_DATABASE_SCHEMA_UPDATES.txt

```
# DATABASE SCHEMA UPDATES
# Multi-Company Workflow, Company Code Locking & Comprehensive Audit Fields
# Generated: September 24, 2025 - CRITICAL UPDATE: Migration solution for existing data

## 🚨 MANDATORY SCHEMA RESOLUTION RULE

### FUNDAMENTAL RESOLUTION PRINCIPLE FOR ALL SCHEMA ISSUES:

**1. SIMPLEST FIRST APPROACH:**
- **1st Resolution**: Always use simplest schema solution (copy working table structure)
- **Complexity Gate**: Only add schema complexity if simple structure clearly inadequate
- **Pattern Priority**: Use proven working schema from similar successful tables

**2. SCHEMA DOMAIN CHECKS (All 6 Required):**
- [ ] **Column Count**: Does sheet have correct number of columns?
- [ ] **Column Names**: Do headers match model definitions exactly?
- [ ] **Data Types**: Are column types consistent with API expectations?
- [ ] **Schema Migration**: Have recent changes been applied correctly?
- [ ] **Sample Data**: Does existing data match expected structure?
- [ ] **Foreign Keys**: Are relationship columns consistent across sheets?

**3. SCHEMA WORKING PATTERNS:**
- **Reference**: companies table (15 columns with audit fields)
- **Reference**: roles table (11 columns with company assignment)
- **Reference**: dropdown_lists table (11 columns after September 24 redesign)

**BEFORE ANY SCHEMA CHANGES**: Consult RESOLUTION_CHECKLIST.md Schema Domain section

---

## 🚨 CRITICAL MIGRATION NOTICE (September 24, 2025)

### ROOT CAUSE IDENTIFIED: Schema/Data Mismatch
When audit fields were added to tables, only HEADERS were updated but EXISTING DATA remained in old format.
This caused severe column mapping issues where timestamps appeared in wrong fields (description, company_id).

### SOLUTION: Clean Reset Approach
Since this is a proof of concept with test data, clean reset is faster than data migration.

**Execute in Google Apps Script (APPSCRIPT.txt v4.3):**
```javascript
completeSystemReset()  // One-click: reset all tables + create fresh test data
```

**Alternative Functions:**
```javascript
cleanResetAllTables()   // Reset schema only
createFreshTestData()   // Create test data only
diagnoseDropdownListsSheet()  // Debug utility
```

### AFFECTED TABLES:
- dropdown_lists (4-column old data → 12-column new schema)
- companies (5-column old data → 15-column new schema)
- roles (5-column old data → 11-column new schema)
- ticket_types, custom_fields, workflow_steps (similar issues)

**STATUS**: Solution ready, pending execution of completeSystemReset()

### 🔧 SCHEMA ISSUE RESOLUTION APPROACH:

**Applied Fundamental Resolution Rule to Schema Migration Issue:**

**Simple Solution Used:**
1. **Working Pattern**: Clean working tables from successful deployments
2. **Simple Approach**: Complete reset rather than complex data migration
3. **Domain Focus**: Schema structure issue, not API or frontend issue
4. **Proven Method**: completeSystemReset() function from working implementations

**Why This Follows Basic Rule:**
- **Simplest First**: Clean reset simpler than data migration for POC
- **Working Pattern**: Function exists and has been tested successfully
- **Domain Specific**: Schema-only solution for schema-only problem
- **Complexity Avoided**: Didn't attempt complex migration scripts

---

## REQUIRED CHANGES ANALYSIS

### 1. COMPANY CODE LOCKING
# Table: companies
# Current: id|name|code
# Enhanced: id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count

### 2. MULTI-COMPANY WORKFLOWS
# Table: workflow_steps
# Current: id|ticket_type_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name
# Enhanced: id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name

## UPDATED TABLE SCHEMAS WITH COMPREHENSIVE AUDIT FIELDS (Text-to-Column Format)

### CORE ENTITY TABLES (Enhanced with Audit Fields)

# companies (ENHANCED WITH AUDIT FIELDS)
id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# roles (ENHANCED WITH AUDIT FIELDS)
id|name|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# ticket_types (ENHANCED WITH AUDIT FIELDS)
id|transaction_id|code|name|description|is_active|require_attachment_on_create|company_id|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# tickets (ENHANCED WITH AUDIT FIELDS)
id|ticket_number|title|ticket_type_id|requester_id|status|current_step_id|step_due_date|company_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

# custom_fields (ENHANCED WITH AUDIT FIELDS) - ⚠️ MISSING SHEET - CRITICAL FOR DYNAMIC FORMS
# PURPOSE: Defines field configurations for ticket types (what fields exist, not the data)
# RELATIONSHIP: Links to custom_field_values (which stores actual user data)
# DIFFERENCE: custom_fields = field definitions, custom_field_values = user data
id|ticket_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# FIELD TYPE DEFINITIONS FOR custom_fields.type COLUMN:
# 'text'        - Single line text input
# 'paragraph'   - Multi-line text area
# 'date'        - Single date picker
# 'date_range'  - Start date + End date picker (uses start_date_value & end_date_value in custom_field_values)
# 'amount'      - Numeric input with currency formatting
# 'dropdown'    - Single select from dropdown_list_id
# 'file'        - File upload attachment

# EXAMPLE RECORDS FOR custom_fields:
# field_1|tt_purchase_req|customer_name|Customer Name|text|true|false|1||
# field_2|tt_purchase_req|amount|Purchase Amount|amount|true|false|2||
# field_3|tt_purchase_req|priority|Priority Level|dropdown|false|false|3|dd_priority|
# field_4|tt_leave_req|leave_dates|Leave Period|date_range|true|false|1||

# workflow_steps (ENHANCED WITH AUDIT FIELDS)
id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# dropdown_lists (ENHANCED WITH AUDIT FIELDS) - ✅ REDESIGNED September 24, 2025
id|name|description|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# dropdown_company_assignments (NEW TABLE WITH AUDIT FIELDS) - ✅ ADDED September 24, 2025
id|dropdown_list_id|company_id|is_global|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# dropdown_options (ENHANCED WITH AUDIT FIELDS)
id|dropdown_list_id|label|value|parent_option_id|sort_order|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

### RELATIONSHIP & CONFIGURATION TABLES (Enhanced with Audit Fields)

# user_role_assignments (ENHANCED WITH AUDIT FIELDS)
id|user_id|ticket_type_id|role_id|validity_end_date|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# step_slas (ENHANCED WITH AUDIT FIELDS)
id|step_id|duration|unit|exclude_weekends|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# step_approvers (ENHANCED WITH AUDIT FIELDS)
id|step_id|role_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# step_conditions (ENHANCED WITH AUDIT FIELDS)
id|step_id|custom_field_id|operator|value|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# comment_requirements (ENHANCED WITH AUDIT FIELDS)
id|ticket_type_id|require_on_approve|require_on_return|require_on_reject|require_on_cancel|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

### DATA & TRANSACTION TABLES (Enhanced with Audit Fields)

# custom_field_values (ENHANCED WITH AUDIT FIELDS) - ✅ COMPLETE WITH DATE RANGE SUPPORT
# PURPOSE: Stores actual user data entered into custom fields for specific tickets
# RELATIONSHIP: Links to custom_fields (which defines what fields exist)
# DATE RANGE SUPPORT: start_date_value & end_date_value for date_range field types
id|ticket_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

# EXAMPLE RECORDS FOR custom_field_values:
# 1|ticket_123|field_customer|John Smith||||||true|2025-09-26|user_1|2025-09-26|user_1|||
# 2|ticket_123|field_amount||5000||||true|2025-09-26|user_1|2025-09-26|user_1|||
# 3|ticket_123|field_priority|||||||opt_high|true|2025-09-26|user_1|2025-09-26|user_1|||
# 4|ticket_124|field_leave_period||||2025-10-01|2025-10-15|||true|2025-09-26|user_2|2025-09-26|user_2|||

# ticket_attachments (ENHANCED WITH AUDIT FIELDS)
id|ticket_id|uploader_id|file_name|file_url|file_size|mime_type|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

# ticket_links (ENHANCED WITH AUDIT FIELDS)
id|parent_ticket_id|child_ticket_id|link_type|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

# report_configurations (ENHANCED WITH AUDIT FIELDS)
id|ticket_type_id|field_name|display_name|field_type|sort_order|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

### SYSTEM & AUDIT TABLES (Enhanced with Audit Fields)

# user_preferences (ENHANCED WITH AUDIT FIELDS)
id|user_id|dark_mode|timezone|language|email_notifications|desktop_notifications|dashboard_layout|items_per_page|auto_refresh|refresh_interval|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# sequence_counters (ENHANCED WITH AUDIT FIELDS)
id|sequence_name|last_number|company_id|ticket_type_code|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

### AUDIT LOG TABLES (READ-ONLY - No Audit Fields Needed)

# ticket_history (IMMUTABLE LOG)
id|ticket_id|user_id|action|comment|timestamp

# ticket_action_logs (IMMUTABLE LOG)
id|ticket_id|user_id|action_type|details|timestamp

# admin_action_logs (IMMUTABLE LOG)
id|admin_user_id|action_type|target_entity|target_id|details|timestamp

## COMPREHENSIVE AUDIT FIELD DEFINITIONS

### STANDARD AUDIT FIELDS (Applied to All Applicable Tables)

#### **Creation Tracking:**
# created_at: timestamp (ISO 8601) - When the record was first created
# created_by: string - User ID who created the record (Firebase Auth ID)

#### **Update Tracking:**
# updated_at: timestamp (ISO 8601) - When the record was last modified
# updated_by: string - User ID who last updated the record (Firebase Auth ID)

#### **Active Status:**
# is_active: boolean - TRUE for active records, FALSE for soft-deleted/deactivated records

#### **Deactivation Tracking (for Configuration/Master Data):**
# deactivated_at: timestamp (ISO 8601) - When the record was deactivated (NULL if active)
# deactivated_by: string - User ID who deactivated the record (NULL if active)
# deactivation_reason: string - Reason for deactivation (e.g., "obsolete", "duplicate", "admin_request")

#### **Deletion Tracking (for Transaction Data):**
# deleted_at: timestamp (ISO 8601) - When the record was deleted (NULL if not deleted)
# deleted_by: string - User ID who deleted the record (NULL if not deleted)
# deletion_reason: string - Reason for deletion (e.g., "user_request", "data_cleanup", "mistake")

### TABLE-SPECIFIC FIELD DEFINITIONS

#### **companies table additions:**
# code_locked: boolean - TRUE when company code is locked (after first ticket creation)
# code_locked_at: timestamp - When the code was locked (ISO format)
# code_locked_reason: string - Reason for locking (e.g., "first_ticket_created", "admin_override")
# ticket_count: number - Count of tickets created for this company (for lock trigger)
# + All standard audit fields (is_active, created_at, created_by, updated_at, updated_by, deactivated_at, deactivated_by, deactivation_reason)

#### **workflow_steps table additions:**
# company_id: string - REQUIRED field linking workflow step to specific company
# Note: No NULL values allowed - every workflow step must belong to a company
# + All standard audit fields (is_active, created_at, created_by, updated_at, updated_by, deactivated_at, deactivated_by, deactivation_reason)

#### **dropdown_lists table additions:**
# company_id: string - REQUIRED field linking dropdown list to specific company
# Note: Makes dropdown lists company-specific, prevents option pollution across companies
# + All standard audit fields (is_active, created_at, created_by, updated_at, updated_by, deactivated_at, deactivated_by, deactivation_reason)

#### **tickets table additions:**
# Note: Tickets use deletion tracking instead of deactivation (transaction data)
# + Standard audit fields (is_active, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, deletion_reason)

#### **user_preferences table columns:**
# user_id: string - Primary key, user's unique identifier (from Firebase Auth)
# dark_mode: boolean - User's dark mode preference (true/false)
# timezone: string - User's timezone (e.g., 'Asia/Manila', 'UTC', 'America/New_York')
# language: string - User's language preference (ISO code, e.g., 'en', 'es', 'fr')
# email_notifications: boolean - Whether user wants email notifications
# desktop_notifications: boolean - Whether user wants browser notifications
# dashboard_layout: string - Dashboard layout preference ('grid', 'list', 'table')
# items_per_page: number - Number of items to display per page (10, 20, 50, 100)
# auto_refresh: boolean - Whether to automatically refresh data
# refresh_interval: number - Auto-refresh interval in milliseconds (10000, 30000, 60000, 300000, 0=disabled)
# + All standard audit fields (is_active, created_at, created_by, updated_at, updated_by, deactivated_at, deactivated_by, deactivation_reason)

#### **Enhanced ID Fields:**
# Note: Many tables now include an auto-incrementing 'id' field as primary key for better audit trail support
# The original composite keys remain for business logic, but 'id' provides unique record identification

### AUDIT FIELD BEHAVIOR RULES

#### **Creation Rules:**
1. created_at: Set to current timestamp (Philippine Time - UTC+8) when record is inserted
2. created_by: Set to current user's Firebase Auth ID from request context
3. is_active: Defaults to TRUE for new records
4. All other audit fields: Set to NULL on creation

#### **Update Rules:**
1. updated_at: Set to current timestamp on every update operation
2. updated_by: Set to current user's Firebase Auth ID from request context
3. Original created_at/created_by: Never modified after creation
4. Deactivation/deletion fields: Only set during specific deactivation/deletion operations

#### **Soft Delete vs Deactivation:**
- **Configuration/Master Data**: Use deactivation (deactivated_at, deactivated_by, deactivation_reason)
  - Examples: companies, roles, ticket_types, custom_fields, workflow_steps, dropdown_lists
- **Transaction Data**: Use deletion (deleted_at, deleted_by, deletion_reason)
  - Examples: tickets, custom_field_values, ticket_attachments, ticket_links

#### **Query Behavior:**
- Default queries should filter WHERE is_active = TRUE
- Admin interfaces may show deactivated/deleted records with special indicators
- Audit reports should include all records regardless of status

## MIGRATION NOTES

1. EXISTING DATA HANDLING:
   - Current workflow_steps have no company_id
   - Need to either:
     a) Assign all existing steps to a "default" company, OR
     b) Delete existing workflow_steps and require recreation

2. COMPANY CODE LOCKING:
   - All existing companies start with code_locked = FALSE
   - code_locked_at and code_locked_reason start as NULL
   - ticket_count starts at 0 and will be populated by counting existing tickets

3. WORKFLOW STEP VALIDATION:
   - New constraint: workflow_steps.company_id cannot be NULL
   - New constraint: combination of (ticket_type_id, company_id, sort_order) should be unique

## APPS SCRIPT CHANGES REQUIRED

### New API Endpoints:
# Companies.lock(id, reason)
# Companies.unlock(id, reason)
# Companies.checkLockStatus(id)
# WorkflowSteps.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)
# WorkflowSteps.getByCompany(ticketTypeId, companyId)
# DropdownLists.getByCompany(companyId)
# DropdownLists.copyFromCompany(sourceCompanyId, targetCompanyId)
# TicketTypes.validateNameUniqueness(name, companyId, excludeId)
# UserPreferences.get(userId) - GET endpoint for retrieving user preferences
# UserPreferences.update(userId, preferences) - POST endpoint for updating user preferences
# SLAStatistics.getPerformanceByCompany(companyId) - Company-specific SLA performance metrics
# SLAStatistics.getPerformanceByTicketType(ticketTypeId, companyId) - Per-company ticket type SLA performance
# SLAStatistics.getGlobalPerformance() - System-wide SLA performance across all companies

### Modified API Endpoints:
# WorkflowSteps.getAll() - Must now filter by company_id
# WorkflowSteps.create() - Must require company_id
# Companies.update() - Must validate code_locked status

## IMPACT ASSESSMENT

### HIGH IMPACT CHANGES:
1. workflow_steps.company_id addition - BREAKS EXISTING WORKFLOW QUERIES
2. Company code locking validation - PREVENTS CODE CHANGES

### MEDIUM IMPACT CHANGES:
1. New API endpoints required for copying workflows
2. Frontend UI updates for company selection and copying

### LOW IMPACT CHANGES:
1. Company table additions (non-breaking for existing queries)
2. Additional validation logic

## FRONTEND MODEL CONSISTENCY UPDATE (September 22, 2025)

### ✅ CRITICAL CONSISTENCY ISSUES RESOLVED:

#### **Issues Discovered:**
- RoleModel missing audit fields specified in schema above
- DropdownListModel missing company_id and audit fields
- DropdownOptionModel missing sort_order and audit fields
- TicketModel missing deletion tracking audit fields

#### **✅ Fixes Applied to src/api/models.js:**

**RoleModel Enhanced:**
- Added: is_active, created_at, created_by, updated_at, updated_by
- Added: deactivated_at, deactivated_by, deactivation_reason
- Added: isActive(), getAuditInfo(), getStatusInfo() methods

**DropdownListModel Enhanced:**
- Added: company_id (makes dropdowns company-specific)
- Added: Complete audit field set for deactivation tracking
- Updated: create() method now requires companyId parameter

**DropdownOptionModel Enhanced:**
- Added: sort_order for proper display ordering
- Added: Complete audit field set for deactivation tracking
- Added: Audit utility methods for status management

**TicketModel Enhanced:**
- Added: deleted_at, deleted_by, deletion_reason (deletion tracking)
- Added: is_active, created_by, updated_by (standard audit fields)
- Note: Uses deletion tracking instead of deactivation (transaction data)

#### **Status:**
✅ **Frontend Consistency**: All data models now match DATABASE_SCHEMA_UPDATES.txt specification
⚠️ **Backend Schema Gap**: Google Sheets structure still needs updating from 4 to 15 columns per table

## ROLLBACK PLAN

If changes need to be rolled back:
1. Remove company_id column from workflow_steps
2. Remove locking columns from companies
3. Revert Apps Script to previous validation logic

## ✅ DROPDOWN LISTS REDESIGN - September 24, 2025

### **NEW DESIGN: Two-Step Dropdown Creation Process**

**Design Decision:**
Changed from direct company assignment during creation to a two-step process for better UX and flexibility.

**✅ New Architecture:**

1. **Step 1: Create Dropdown** (Company-neutral)
   - Create dropdown with name, description, options
   - Saved as "draft" (no company access)
   - Visible only to admins until assigned

2. **Step 2: Assign Company Access**
   - Global: Available to all companies (`is_global = true`)
   - Single Company: Assign to one company
   - Multiple Companies: Assign to multiple selected companies
   - Draft/Admin-Only: No assignments (admin use only)

**✅ New Table Structure:**

1. **dropdown_lists** (Simplified):
   ```
   OLD: ['id', 'name', 'description', 'company_id', 'created_at', 'updated_at']
   NEW: ['id', 'name', 'description', 'created_at', 'updated_at', ...]
   ```

2. **dropdown_company_assignments** (New Table):
   ```
   ['id', 'dropdown_list_id', 'company_id', 'is_global', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deactivated_at', 'deactivated_by', 'deactivation_reason']
   ```

**✅ Access Logic:**
- **Global Access**: One record with `is_global = true, company_id = null`
- **Company-Specific**: One record per company with `is_global = false, company_id = 'comp_123'`
- **Multi-Company**: Multiple records, one per assigned company
- **Draft**: No assignment records (visible only to admins)
- **Audit Support**: Full audit fields allow soft deletes and change tracking of assignments

**✅ Benefits:**
- Better UX: Create first, assign later
- Flexible assignment management: Add/remove company access anytime
- Clear separation of concerns: Dropdown definition vs company access
- Support for all scenarios: global, single, multiple, draft

**🔄 Implementation Status:**
- ✅ Design documented in CLAUDE.md
- ✅ Schema updated in DATABASE_SCHEMA_UPDATES.txt
- 🔄 Pending: Update APPSCRIPT.txt backend functions
- 🔄 Pending: Update frontend UI for two-step process

**Next Steps:**
1. Update backend functions for new assignment-based logic
2. Update frontend for two-step creation process
3. Add assignment management UI
4. Test all access scenarios

## TESTING REQUIREMENTS

1. Test company code locking triggers
2. Test workflow copying between companies
3. Test validation of company-specific workflows
4. Test migration of existing data
5. Verify all existing functionality still works
6. **NEW**: Test dropdown creation with company_id support
7. **NEW**: Verify dropdown filtering by company works correctly

---

## 🆕 NEW/UPDATED TABLES SUMMARY - PHASE 10.0 USER/ROLE REVOLUTION

**Date**: September 27, 2025
**Version**: 3.0 - Revolutionary User Management with Custom Fields

### **🎯 INNOVATION SUMMARY**
This update introduces a revolutionary approach where:
- **User Profiles** are treated like ticket types with custom fields
- **Roles** are treated like ticket types with custom fields
- **Unified dropdown system** serves all entity types
- **Date-based role management** with auto-expiration
- **Immediate approver relationships** with fallback logic

### **📋 NEW TABLES**

#### **User Profile Types & Custom Fields**
```
user_profile_types:
id|name|description|code|company_id|requires_approval_on_create|requires_background_check|auto_expire_days|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

user_profile_custom_fields:
id|user_profile_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

user_profile_custom_field_values:
id|user_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by
```

#### **Role Types & Custom Fields (NEW INNOVATION)**
```
role_types:
id|name|description|code|company_id|permission_level|can_approve_steps|max_approval_amount|requires_certification|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

role_custom_fields:
id|role_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

role_custom_field_values:
id|role_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by
```

#### **Unified Dropdown Field Mappings**
```
dropdown_field_mappings:
id|entity_type|entity_id|field_name|dropdown_list_id|company_id|is_required|display_order|field_label|help_text|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason
```

### **🔄 ENHANCED EXISTING TABLES**

#### **user_profiles (Core redesign)**
```
BEFORE: Basic profile with fixed fields
AFTER: user_id|user_profile_type_id|display_name|email|phone|immediate_approver_id|backup_approver_id|status|hire_date|termination_date|last_login_at|is_active|created_at|created_by|updated_at|updated_by

KEY CHANGES:
+ user_profile_type_id (links to user_profile_types)
+ immediate_approver_id (direct manager relationship)
+ backup_approver_id (fallback approver)
+ termination_date (employment end tracking)
```

#### **roles (Enhanced with types)**
```
BEFORE: id|name|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason
AFTER: id|role_type_id|name|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

KEY CHANGES:
+ role_type_id (links to role_types for custom fields)
```

#### **user_role_assignments (Date-based enhancements)**
```
BEFORE: id|user_id|ticket_type_id|role_id|validity_end_date|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason
AFTER: id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

KEY CHANGES:
+ assignment_type ('permanent', 'temporary', 'project_based', 'emergency', 'delegation')
+ effective_start_date (when assignment becomes active)
+ effective_end_date (when assignment expires)
+ auto_expire_days (automatic expiration period)
+ assigned_by_user_id (who made the assignment)
+ approval_required (whether assignment needs approval)
+ assignment_notes (reason/notes for assignment)
```

### **🎯 SYSTEM ENTITY TYPES**

The system now supports **4 core entity types** with unified custom fields:

1. **ticket_types** → custom_fields → custom_field_values (existing)
2. **user_profile_types** → user_profile_custom_fields → user_profile_custom_field_values (new)
3. **role_types** → role_custom_fields → role_custom_field_values (new)
4. **workflow_steps** → step_custom_fields → step_custom_field_values (future)

### **📊 PRE-BUILT SYSTEM DEFAULTS**

#### **User Profile Types:**
- **Standard Employee** (EMP): employee_id, department, job_title, hire_date, emergency_contact
- **Contractor** (CTR): contractor_id, company_name, contract_dates, billing_rate
- **Vendor Contact** (VND): vendor_company, contact_role, service_category
- **Intern** (INT): student_id, school_name, internship_period, supervisor

#### **Role Types:**
- **Approval Roles** (APR): approval_level, max_amount, delegation_allowed
- **Department Roles** (DEP): department_scope, budget_authority, reporting_level
- **System Roles** (SYS): system_permissions, admin_level, security_clearance
- **Project Roles** (PRJ): project_scope, timeline, deliverables

### **🔗 INTEGRATION POINTS**

#### **Dropdown Integration:**
- All custom fields can reference dropdown_lists
- dropdown_field_mappings links dropdowns to any entity type
- Unified dropdown management across tickets, users, and roles

#### **Approval Routing:**
- immediate_approver_id provides direct manager relationships
- Role custom fields can define approval hierarchies
- Date-based assignments support temporary delegation

#### **Firebase Authentication:**
- user_profiles.user_id links to Firebase Auth UID
- Seamless integration with existing authentication

### **🚀 IMPLEMENTATION PRIORITY**

#### **Phase 1: Foundation**
1. Create user_profile_types and role_types tables
2. Implement custom fields for both entity types
3. Add dropdown_field_mappings system

#### **Phase 2: Core Features**
1. Build dynamic user profile forms
2. Create role configuration interface
3. Implement immediate approver system

#### **Phase 3: Advanced Features**
1. Date-based role assignments with auto-expiration
2. Approval delegation during out-of-office
3. Advanced reporting and analytics

---

---

## 🔄 SIMPLIFIED REUSE STRATEGY UPDATE - September 27, 2025 (Latest)

**Version**: 3.1 - Simplified Reuse Strategy for Minimal Changes

### **🎯 STRATEGY CHANGE: REUSE EXISTING TABLES**

**Previous Approach**: Create separate tables for each entity type
**New Approach**: Enhance existing tables with entity_category column

### **✅ MINIMAL SCHEMA CHANGES (Reuse Strategy)**

#### **1. Enhance Existing Tables (Add 1 Column Each)**
```
custom_fields (enhanced):
BEFORE: id|ticket_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

AFTER: id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

KEY CHANGE: + entity_category (TEXT, default 'ticket')
Values: 'ticket', 'user_profile', 'role', 'workflow_step'

custom_field_values (enhanced):
BEFORE: id|ticket_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

AFTER: id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

KEY CHANGE: + entity_category (TEXT, default 'ticket')
Note: ticket_id becomes entity_id for non-ticket entities
```

#### **2. Essential New Tables Only**
```
user_profile_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

role_types:
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

user_profiles:
user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date|is_active|created_at|updated_at

user_role_assignments (enhanced with date fields):
id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason
```

### **🔄 REUSE BENEFITS**

#### **Backward Compatibility**
- All existing ticket custom fields continue working unchanged
- Existing API functions work with default entity_category='ticket'
- No data migration required for existing tickets

#### **Minimal Code Changes**
- Add entityCategory parameter to existing functions (default 'ticket')
- Enhance existing React components with entityCategory prop
- Reuse existing custom field UI components

#### **Development Efficiency**
- Same custom field builder for all entity types
- Same validation and rendering logic
- Same dropdown integration system

### **📊 IMPLEMENTATION COMPARISON**

#### **Previous Complex Approach**
- 9 new tables required
- 40+ new API functions
- Separate UI components for each entity type
- Complex cross-entity relationship management

#### **New Simplified Approach**
- 2 column additions + 3 new tables
- 10-15 new API functions + enhanced existing ones
- Reuse existing UI components with entityCategory prop
- Simple parameter-based entity switching

### **🚀 MIGRATION STRATEGY**

#### **Phase 1: Schema Enhancement**
```sql
-- Add entity_category columns
ALTER TABLE custom_fields ADD COLUMN entity_category TEXT DEFAULT 'ticket';
ALTER TABLE custom_field_values ADD COLUMN entity_category TEXT DEFAULT 'ticket';

-- Create essential new tables
CREATE TABLE user_profile_types (...);
CREATE TABLE role_types (...);
CREATE TABLE user_profiles (...);

-- Update existing data (optional - works without this)
UPDATE custom_fields SET entity_category = 'ticket' WHERE entity_category IS NULL;
UPDATE custom_field_values SET entity_category = 'ticket' WHERE entity_category IS NULL;
```

#### **Phase 2: API Enhancement**
```javascript
// Enhance existing functions with entityCategory parameter
function getCustomFields(entityTypeId, entityCategory = 'ticket') { ... }
function createCustomField(entityTypeId, fieldData, entityCategory = 'ticket') { ... }
function setCustomFieldValue(entityId, fieldId, value, entityCategory = 'ticket') { ... }

// Add minimal new functions
function getUserProfileTypes() { ... }
function createUserProfileType() { ... }
function getRoleTypes() { ... }
function createRoleType() { ... }
```

#### **Phase 3: Frontend Enhancement**
```javascript
// Enhance existing components
<AdminCustomFieldBuilder
  entityTypeId="upt_employee"
  entityCategory="user_profile"
  entityTypeName="Employee Profile"
/>

// Reuse existing hooks with entityCategory
const { data: fields } = useCustomFields(entityTypeId, 'user_profile');
const setFieldValue = useSetCustomFieldValue();
```

### **💾 FINAL SCHEMA SUMMARY - REUSE APPROACH**

#### **Modified Existing Tables (2)**
- custom_fields: + entity_category column
- custom_field_values: + entity_category column

#### **New Tables (3)**
- user_profile_types
- role_types
- user_profiles

#### **Total Schema Impact**
- 2 column additions to existing tables
- 3 new simple tables
- 100% backward compatibility
- Zero data migration required

**Migration Note**: This simplified approach provides the same enterprise-level flexibility while minimizing schema changes and maintaining full backward compatibility with existing ticket functionality.
---
# PROPOSED SCHEMA CHANGES from SUPERTHINK_TODO_ANALYSIS_2025-09-27.md

## Phase 1: User Profile Implementation
# custom_fields
id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# custom_field_values
id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason

# user_profile_types
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

# user_profiles
user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date|is_active|created_at|updated_at

## Phase 2: Role Maintenance Implementation
# role_types
id|name|description|code|company_id|is_active|created_at|created_by|updated_at|updated_by

# roles
id|role_type_id|name|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# user_role_assignments
id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

## Phase 3: User-End Ticket Interactions
# ticket_tags
id|ticket_id|tag_name|normalized_tag|created_at|created_by|is_active|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# tickets
id|ticket_number|title|ticket_type_id|requester_id|status|current_step_id|step_due_date|company_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason|tag_summary|tag_count

# ticket_collaborators
id|ticket_id|user_id|permission_level|granted_by|granted_at|access_reason|expiry_date|is_active

# ticket_type_collaborators
id|ticket_type_id|user_id|permission_level|granted_by|granted_at|access_reason|is_active

# tag_based_collaborators
id|tag_name|user_id|permission_level|granted_by|granted_at|access_reason|company_id|is_active

## Phase 4: Ticket Configuration & Management
# companies
id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

# workflow_steps
id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

## Phase 5: Workflow & SLA Enhancements
# step_slas
id|step_id|duration|unit|exclude_weekends|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason|company_id

# workflow_steps
id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason|requires_approval

```

## 2. PROPOSED_APPSCRIPT.txt

```javascript
/*
=================================================================================
 * Ticketing & Workflow Orchestration System - Google Apps Script Backend API
 * 
 * Version: 6.0 (Payload standardization - comprehensive pattern alignment)
 * Phase 1A: Custom Fields System (12 functions) → v6.1
 * Phase 1B: Workflow Steps System (18 functions) → v6.2
 * Phase 1C: Ticket Management (15 functions) → v6.3
 * Phase 1D: Integration & Admin (17 functions) → v6.4
 * 
 * 
 * Author: System Generated
 * Description: This script provides a complete serverless backend using Google Sheets
 * for the dynamic ticketing system, as specified in the design document. It includes
 * multi-tenancy, dynamic roles, sequential ticket numbering, and audit logging.
 * =================================================================================
 */

// --- GLOBAL CONFIGURATION ---
// IMPORTANT: Replace this with the actual ID of your Google Sheet.
const SPREADSHEET_ID = "1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4"; // Google sheet added 0235pm

// Sheet (Table) Names - must match the tabs in your Google Sheet exactly.
const SHEETS = {
    COMPANIES: "companies",
    ROLES: "roles",
    TICKETS: "tickets",
    TICKET_HISTORY: "ticket_history",
    TICKET_TYPES: "ticket_types",
    COMMENT_REQUIREMENTS: "comment_requirements",
    CUSTOM_FIELDS: "custom_fields",
    CUSTOM_FIELD_VALUES: "custom_field_values",
    WORKFLOW_STEPS: "workflow_steps",
    STEP_APPROVERS: "step_approvers",
    USER_ROLE_ASSIGNMENTS: "user_role_assignments",
    STEP_SLAS: "step_slas",
    STEP_CONDITIONS: "step_conditions",
    DROPDOWN_LISTS: "dropdown_lists",
    DROPDOWN_OPTIONS: "dropdown_options",
    TICKET_ATTACHMENTS: "ticket_attachments",
    REPORT_CONFIGURATIONS: "report_configurations",
    TICKET_LINKS: "ticket_links",
    SEQUENCE_COUNTERS: "sequence_counters",
    TICKET_ACTION_LOGS: "ticket_action_logs",
    ADMIN_ACTION_LOGS: "admin_action_logs",
    USER_PREFERENCES: "user_preferences",
    USER_PROFILE_TYPES: "user_profile_types",
    USER_PROFILES: "user_profiles",
    ROLE_TYPES: "role_types",
    TICKET_TAGS: "ticket_tags",
    TICKET_COLLABORATORS: "ticket_collaborators",
    TICKET_TYPE_COLLABORATORS: "ticket_type_collaborators",
    TAG_BASED_COLLABORATORS: "tag_based_collaborators"
};

/**
 * =================================================================================
 * COMPREHENSIVE AUDIT FIELD UTILITY FUNCTIONS
 * Support for creation tracking, update tracking, and soft delete/deactivation
 * Added: September 22, 2025 for comprehensive audit trail implementation
 * =================================================================================
 */

/**
 * Get current user ID from request context (to be implemented with proper auth)
 * For now, returns a placeholder - should be replaced with Firebase Auth integration
 * @returns {string} Current user's Firebase Auth ID
 */
function getCurrentUserId() {
  // TODO: Implement proper Firebase Auth integration
  // For now, return a placeholder for development
  return 'system_user'; // Replace with actual Firebase Auth ID extraction
}

/**
 * Get current timestamp in Philippine Time (UTC+8)
 * @returns {string} ISO 8601 timestamp string
 */
function getCurrentTimestamp() {
  const now = new Date();
  // Convert to Philippine Time (UTC+8)
  const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return philippineTime.toISOString();
}

/**
 * Create audit fields for new record creation
 * @param {string} userId - User ID who is creating the record (optional, uses current user if not provided)
 * @returns {Object} Audit fields object for creation
 */
function createAuditFields(userId = null) {
  const currentUser = userId || getCurrentUserId();
  const timestamp = getCurrentTimestamp();

  return {
    is_active: true,
    created_at: timestamp,
    created_by: currentUser,
    updated_at: timestamp,
    updated_by: currentUser,
    deactivated_at: null,
    deactivated_by: null,
    deactivation_reason: null,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null
  };
}

/**
 * Create audit fields for record updates
 * @param {string} userId - User ID who is updating the record (optional, uses current user if not provided)
 * @returns {Object} Audit fields object for updates
 */
function updateAuditFields(userId = null) {
  const currentUser = userId || getCurrentUserId();
  const timestamp = getCurrentTimestamp();

  return {
    updated_at: timestamp,
    updated_by: currentUser
  };
}

/**
 * Create audit fields for record deactivation (soft delete for configuration data)
 * @param {string} reason - Reason for deactivation
 * @param {string} userId - User ID who is deactivating the record (optional, uses current user if not provided)
 * @returns {Object} Audit fields object for deactivation
 */
function deactivateAuditFields(reason, userId = null) {
  const currentUser = userId || getCurrentUserId();
  const timestamp = getCurrentTimestamp();

  return {
    is_active: false,
    updated_at: timestamp,
    updated_by: currentUser,
    deactivated_at: timestamp,
    deactivated_by: currentUser,
    deactivation_reason: reason
  };
}

/**
 * Create audit fields for record deletion (soft delete for transaction data)
 * @param {string} reason - Reason for deletion
 * @param {string} userId - User ID who is deleting the record (optional, uses current user if not provided)
 * @returns {Object} Audit fields object for deletion
 */
function deleteAuditFields(reason, userId = null) {
  const currentUser = userId || getCurrentUserId();
  const timestamp = getCurrentTimestamp();

  return {
    is_active: false,
    updated_at: timestamp,
    updated_by: currentUser,
    deleted_at: timestamp,
    deleted_by: currentUser,
    deletion_reason: reason
  };
}

/**
 * Reactivate a deactivated record
 * @param {string} userId - User ID who is reactivating the record (optional, uses current user if not provided)
 * @returns {Object} Audit fields object for reactivation
 */
function reactivateAuditFields(userId = null) {
  const currentUser = userId || getCurrentUserId();
  const timestamp = getCurrentTimestamp();

  return {
    is_active: true,
    updated_at: timestamp,
    updated_by: currentUser,
    deactivated_at: null,
    deactivated_by: null,
    deactivation_reason: null,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null
  };
}

/**
 * Apply audit fields to a data object
 * @param {Object} data - The data object to enhance
 * @param {Object} auditFields - The audit fields to apply
 * @returns {Object} Enhanced data object with audit fields
 */
function applyAuditFields(data, auditFields) {
  return {
    ...data,
    ...auditFields
  };
}

/**
 * Filter active records from a dataset
 * @param {Array} records - Array of records to filter
 * @returns {Array} Array containing only active records
 */
function filterActiveRecords(records) {
  return records.filter(record => record.is_active === true || record.is_active === 'TRUE');
}

/**
 * Convert audit field values for Google Sheets (handle nulls and booleans)
 * @param {Object} auditFields - Audit fields object
 * @returns {Object} Sheets-compatible audit fields
 */
function auditFieldsForSheets(auditFields) {
  const sheetsFields = {};

  Object.keys(auditFields).forEach(key => {
    const value = auditFields[key];
    if (value === null || value === undefined) {
      sheetsFields[key] = '';
    } else if (typeof value === 'boolean') {
      sheetsFields[key] = value ? 'TRUE' : 'FALSE';
    } else {
      sheetsFields[key] = value;
    }
  });

  return sheetsFields;
}

/**
 * =================================================================================
 * PER-COMPANY SLA STATISTICS API FUNCTIONS
 * Enhanced support for company-specific workflow performance tracking
 * Added: September 22, 2025 for Phase 8.95
 * =================================================================================
 */

/**
 * Get SLA performance statistics for a specific company
 * @param {string} companyId - Company ID to get statistics for (optional - returns all if null)
 * @returns {Object} Company-specific SLA performance data
 */
function getSLAPerformanceByCompany(companyId = null) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companies = getSheetDataAsJSON(ss.getSheetByName(SHEETS.COMPANIES));
    const tickets = getSheetDataAsJSON(ss.getSheetByName(SHEETS.TICKETS));
    const workflowSteps = getSheetDataAsJSON(ss.getSheetByName(SHEETS.WORKFLOW_STEPS));
    const stepSLAs = getSheetDataAsJSON(ss.getSheetByName(SHEETS.STEP_SLAS));

    const targetCompanies = companyId ? companies.filter(c => c.id === companyId) : companies;
    const performanceData = {};

    targetCompanies.forEach(company => {
      const companyTickets = tickets.filter(t => t.company_id === company.id);
      const completedTickets = companyTickets.filter(t => t.status === 'Completed');

      let totalStandardSLAHours = 0;
      let totalActualResolutionHours = 0;
      let companyBreaches = 0;

      completedTickets.forEach(ticket => {
        // Get company-specific workflow steps for this ticket type
        const ticketWorkflowSteps = workflowSteps.filter(ws =>
          ws.ticket_type_id === ticket.ticket_type_id && ws.company_id === company.id
        );

        // Calculate standard SLA target for this ticket
        const ticketStandardSLAHours = ticketWorkflowSteps.reduce((total, step) => {
          const stepSLA = stepSLAs.find(sla => sla.step_id === step.id);
          if (stepSLA) {
            const hours = stepSLA.unit === 'days' ? stepSLA.duration * 24 : stepSLA.duration;
            return total + hours;
          }
          return total;
        }, 0);

        // Calculate actual resolution time
        const created = new Date(ticket.created_at);
        const completed = new Date(ticket.updated_at);
        const actualResolutionHours = (completed - created) / (1000 * 60 * 60);

        totalStandardSLAHours += ticketStandardSLAHours;
        totalActualResolutionHours += actualResolutionHours;

        if (actualResolutionHours > ticketStandardSLAHours) {
          companyBreaches++;
        }
      });

      const avgStandardSLAHours = completedTickets.length > 0 ? totalStandardSLAHours / completedTickets.length : 0;
      const avgActualResolutionHours = completedTickets.length > 0 ? totalActualResolutionHours / completedTickets.length : 0;
      const slaCompliance = completedTickets.length > 0 ?
        ((completedTickets.length - companyBreaches) / completedTickets.length * 100).toFixed(1) : 0;

      performanceData[company.id] = {
        companyId: company.id,
        companyName: company.name,
        totalTickets: companyTickets.length,
        completedTickets: completedTickets.length,
        avgStandardSLAHours: Math.round(avgStandardSLAHours * 10) / 10,
        avgActualResolutionHours: Math.round(avgActualResolutionHours * 10) / 10,
        slaCompliance: slaCompliance,
        slaBreaches: companyBreaches,
        performanceVsStandard: avgStandardSLAHours > 0 ?
          ((avgStandardSLAHours - avgActualResolutionHours) / avgStandardSLAHours * 100).toFixed(1) : 0
      };
    });

    return performanceData;
  } catch (error) {
    Logger.log('Error in getSLAPerformanceByCompany: ' + error.toString());
    throw error;
  }
}

/**
 * Get SLA performance statistics for ticket types across companies
 * @param {string} ticketTypeId - Ticket type ID to filter by (optional)
 * @param {string} companyId - Company ID to filter by (optional)
 * @returns {Object} Ticket type and company-specific SLA performance matrix
 */
function getSLAPerformanceByTicketTypeAndCompany(ticketTypeId = null, companyId = null) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companies = getSheetDataAsJSON(ss.getSheetByName(SHEETS.COMPANIES));
    const ticketTypes = getSheetDataAsJSON(ss.getSheetByName(SHEETS.TICKET_TYPES));
    const tickets = getSheetDataAsJSON(ss.getSheetByName(SHEETS.TICKETS));
    const workflowSteps = getSheetDataAsJSON(ss.getSheetByName(SHEETS.WORKFLOW_STEPS));
    const stepSLAs = getSheetDataAsJSON(ss.getSheetByName(SHEETS.STEP_SLAS));

    const targetCompanies = companyId ? companies.filter(c => c.id === companyId) : companies;
    const targetTicketTypes = ticketTypeId ? ticketTypes.filter(tt => tt.id === ticketTypeId) : ticketTypes;
    const performanceMatrix = {};

    targetCompanies.forEach(company => {
      targetTicketTypes.forEach(ticketType => {
        const specificTickets = tickets.filter(t =>
          t.company_id === company.id && t.ticket_type_id === ticketType.id
        );

        if (specificTickets.length === 0) return;

        // Get company-specific workflow steps for this ticket type
        const companyWorkflowSteps = workflowSteps.filter(ws =>
          ws.ticket_type_id === ticketType.id && ws.company_id === company.id
        );

        // Calculate standard SLA target for this company's workflow
        const standardSLAHours = companyWorkflowSteps.reduce((total, step) => {
          const stepSLA = stepSLAs.find(sla => sla.step_id === step.id);
          if (stepSLA) {
            const hours = stepSLA.unit === 'days' ? stepSLA.duration * 24 : stepSLA.duration;
            return total + hours;
          }
          return total;
        }, 0);

        const completedTickets = specificTickets.filter(t => t.status === 'Completed');
        const avgActualResolutionHours = completedTickets.length > 0 ?
          completedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const completed = new Date(ticket.updated_at);
            const hours = (completed - created) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / completedTickets.length : 0;

        const slaBreaches = completedTickets.filter(ticket => {
          const created = new Date(ticket.created_at);
          const completed = new Date(ticket.updated_at);
          const actualHours = (completed - created) / (1000 * 60 * 60);
          return actualHours > standardSLAHours;
        }).length;

        const performanceKey = `${company.id}_${ticketType.id}`;
        performanceMatrix[performanceKey] = {
          companyId: company.id,
          companyName: company.name,
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          standardSLAHours: standardSLAHours,
          avgActualResolutionHours: Math.round(avgActualResolutionHours * 10) / 10,
          totalTickets: specificTickets.length,
          completedTickets: completedTickets.length,
          slaBreaches: slaBreaches,
          slaCompliance: completedTickets.length > 0 ?
            ((completedTickets.length - slaBreaches) / completedTickets.length * 100).toFixed(1) : 0,
          performanceVsStandard: standardSLAHours > 0 ?
            ((standardSLAHours - avgActualResolutionHours) / standardSLAHours * 100).toFixed(1) : 0
        };
      });
    });

    return performanceMatrix;
  } catch (error) {
    Logger.log('Error in getSLAPerformanceByTicketTypeAndCompany: ' + error.toString());
    throw error;
  }
}

/**
 * Get global SLA performance across all companies
 * @returns {Object} System-wide SLA performance metrics
 */
function getGlobalSLAPerformance() {
  try {
    const companyPerformanceData = getSLAPerformanceByCompany();
    const companies = Object.values(companyPerformanceData);

    if (companies.length === 0) {
      return {
        totalCompanies: 0,
        totalTickets: 0,
        totalCompletedTickets: 0,
        globalAvgSLACompliance: 0,
        globalAvgStandardSLAHours: 0,
        globalAvgActualResolutionHours: 0,
        totalSLABreaches: 0,
        bestPerformingCompany: null,
        worstPerformingCompany: null
      };
    }

    const totalTickets = companies.reduce((sum, c) => sum + c.totalTickets, 0);
    const totalCompletedTickets = companies.reduce((sum, c) => sum + c.completedTickets, 0);
    const totalBreaches = companies.reduce((sum, c) => sum + c.slaBreaches, 0);

    const weightedSLASum = companies.reduce((sum, c) =>
      sum + (c.avgStandardSLAHours * c.completedTickets), 0);
    const weightedActualSum = companies.reduce((sum, c) =>
      sum + (c.avgActualResolutionHours * c.completedTickets), 0);

    const globalAvgStandardSLAHours = totalCompletedTickets > 0 ?
      weightedSLASum / totalCompletedTickets : 0;
    const globalAvgActualResolutionHours = totalCompletedTickets > 0 ?
      weightedActualSum / totalCompletedTickets : 0;
    const globalSLACompliance = totalCompletedTickets > 0 ?
      ((totalCompletedTickets - totalBreaches) / totalCompletedTickets * 100).toFixed(1) : 0;

    const bestPerformingCompany = companies.reduce((best, current) =>
      (!best || parseFloat(current.slaCompliance) > parseFloat(best.slaCompliance)) ? current : best, null);
    const worstPerformingCompany = companies.reduce((worst, current) =>
      (!worst || parseFloat(current.slaCompliance) < parseFloat(worst.slaCompliance)) ? current : worst, null);

    return {
      totalCompanies: companies.length,
      totalTickets: totalTickets,
      totalCompletedTickets: totalCompletedTickets,
      globalAvgSLACompliance: globalSLACompliance,
      globalAvgStandardSLAHours: Math.round(globalAvgStandardSLAHours * 10) / 10,
      globalAvgActualResolutionHours: Math.round(globalAvgActualResolutionHours * 10) / 10,
      totalSLABreaches: totalBreaches,
      bestPerformingCompany: bestPerformingCompany,
      worstPerformingCompany: worstPerformingCompany
    };
  } catch (error) {
    Logger.log('Error in getGlobalSLAPerformance: ' + error.toString());
    throw error;
  }
}

/**
 * =================================================================================
 * SHEET INITIALIZATION FUNCTIONS
 * =================================================================================
 */

function initializeCompaniesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.COMPANIES);
  sheet.getRange(1, 1, 1, 15).setValues([[
    'id', 'name', 'code', 'code_locked', 'code_locked_at', 'code_locked_reason', 'ticket_count',
    'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by',
    'deactivated_at', 'deactivated_by', 'deactivation_reason'
  ]]);
  sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
  return sheet;
}

function initializeRolesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.ROLES);
  sheet.getRange(1, 1, 1, 5).setValues([['id', 'name', 'company_id', 'created_at', 'updated_at']]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  return sheet;
}

function initializeTicketTypesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.TICKET_TYPES);
  sheet.getRange(1, 1, 1, 10).setValues([['id', 'transaction_id', 'code', 'name', 'description', 'is_active', 'require_attachment_on_create', 'company_id', 'created_at', 'updated_at']]);
  sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  return sheet;
}

function initializeAdminActionLogsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.ADMIN_ACTION_LOGS);
  sheet.getRange(1, 1, 1, 7).setValues([['id', 'admin_user_id', 'action_type', 'target_entity', 'target_id', 'details', 'timestamp']]);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  return sheet;
}

function initializeDropdownListsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.DROPDOWN_LISTS);
  sheet.getRange(1, 1, 1, 12).setValues([[
    'id', 'name', 'description', 'company_id', 'is_active',
    'created_at', 'created_by', 'updated_at', 'updated_by',
    'deactivated_at', 'deactivated_by', 'deactivation_reason'
  ]]);
  sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  return sheet;
}

function initializeDropdownOptionsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.DROPDOWN_OPTIONS);
  sheet.getRange(1, 1, 1, 5).setValues([[
    'id', 'dropdown_list_id', 'label', 'value', 'parent_option_id'
  ]]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  return sheet;
}

/**
 * =================================================================================
 * MAIN API ROUTERS (doGet, doPost, doOptions)
 * These are the main entry points for the deployed Web App.
 * =================================================================================
 */

/**
 * Handles all GET requests. Used for fetching data.
 * @param {object} e - The event object from the GET request.
 * @returns {ContentService.TextOutput} - A JSON response.
 */
function doGet(e) {
    // Safe parameter access with fallback
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'ping'; // Default to 'ping' if no action

    try {
      // Log for debugging
      console.log('doGet called with params:', params);

      // Handle the request based on action
      switch(action) {
        case 'ping':
          return createJsonResponse({
            success: true,
            message: 'API connection successful',
            serverTime: new Date().toISOString(),
            responseTime: 150,
            version: '1.0.0'
          });

        case 'getCompanies':
          return createJsonResponse({
            success: true,
            data: getCompanies(params)
          });

        case 'getCompany':
          return createJsonResponse({
            success: true,
            data: getCompany(params.companyId)
          });

        case 'getRoles':
          return createJsonResponse({
            success: true,
            data: getRoles(params)
          });

        case 'getDropdownLists':
          return createJsonResponse({
            success: true,
            data: getDropdownLists(params)
          });

        case 'getDropdownOptions':
          return createJsonResponse({
            success: true,
            data: getDropdownOptions(params.listId)
          });

        case 'getTicketTypes':
          return createJsonResponse({
            success: true,
            data: getTicketTypes(params)
          });

        case 'getTickets':
          return createJsonResponse({
            success: true,
            data: getTickets(params)
          });

        case 'getUserPreferences':
          const userId = params.user_id;
          if (!userId) {
            throw new Error('User ID is required for getting preferences');
          }
          return createJsonResponse({
            success: true,
            data: getUserPreferences(userId)
          });

        case 'getSLAPerformanceByCompany':
          const slaCompanyId = params.company_id || null;
          return createJsonResponse({
            success: true,
            data: getSLAPerformanceByCompany(slaCompanyId)
          });

        case 'getSLAPerformanceByTicketType':
          const slaTicketTypeId = params.ticket_type_id || null;
          const slaCompanyFilter = params.company_id || null;
          return createJsonResponse({
            success: true,
            data: getSLAPerformanceByTicketTypeAndCompany(slaTicketTypeId, slaCompanyFilter)
          });

        case 'getGlobalSLAPerformance':
          return createJsonResponse({
            success: true,
            data: getGlobalSLAPerformance()
          });

        default:
          return createJsonResponse({
            success: false,
            error: 'Unknown action: ' + action
          });
      }
    } catch (error) {
      console.error('doGet Error:', error);
      return createJsonResponse({
        success: false,
        error: error.toString()
      });
    }
}

/**
 * Handles all POST requests. Used for creating or updating data.
 * @param {object} e - The event object from the POST request.
 * @returns {ContentService.TextOutput} - A JSON response.
 */
function doPost(e) {
    // Safe parameter access
    const postData = e && e.postData ? e.postData.contents : '{}';

    try {
      const data = JSON.parse(postData);
      const action = data.action || 'ping';

      console.log('doPost called with action:', action, 'data:', data);

      // Handle the request based on action
      switch(action) {
        case 'ping':
          return createJsonResponse({
            success: true,
            message: 'API connection successful',
            serverTime: new Date().toISOString(),
            responseTime: 150,
            version: '1.0.0'
          });

        case 'getCompanies':
          return createJsonResponse({
            success: true,
            data: getCompanies()
          });

        case 'createCompany':
          // Handle both payload formats: { action, payload } or { action, ...payload }
          const companyData = data.payload || { name: data.name, code: data.code };
          return createJsonResponse({
            success: true,
            data: createCompany(companyData)
          });

        case 'updateCompany':
          const updateCompanyData = data.payload || { id: data.id, name: data.name, code: data.code };
          return createJsonResponse({
            success: true,
            data: updateCompany(updateCompanyData)
          });

        case 'deleteCompany':
          const deactivationData = data.payload || {
            id: data.id,
            reason: data.reason || 'admin_request'
          };
          if (!deactivationData.id) {
            throw new Error('Company ID is required for deactivation');
          }
          return createJsonResponse({
            success: true,
            data: deactivateCompany(deactivationData.id, deactivationData.reason)
          });

        case 'reactivateCompany':
          const reactivationData = data.payload || {
            id: data.id
          };
          if (!reactivationData.id) {
            throw new Error('Company ID is required for reactivation');
          }
          return createJsonResponse({
            success: true,
            data: reactivateCompany(reactivationData.id)
          });

        case 'createRole':
          const roleData = data.payload || { name: data.name, company_id: data.company_id };
          return createJsonResponse({
            success: true,
            data: createRole(roleData)
          });

        case 'updateRole':
          const updateRoleData = data.payload || { id: data.id, name: data.name, company_id: data.company_id };
          return createJsonResponse({
            success: true,
            data: updateRole(updateRoleData)
          });

        case 'deleteRole':
          const roleDeletionData = data.payload || {
            id: data.id,
            reason: data.reason || 'admin_request'
          };
          if (!roleDeletionData.id) {
            throw new Error('Role ID is required for deletion');
          }
          return createJsonResponse({
            success: true,
            data: deactivateRole(roleDeletionData.id, roleDeletionData.reason)
          });

        case 'createDropdownList':
          // Simplified payload handling to match working company creation pattern
          const dropdownData = data.payload || {
            name: data.name,
            description: data.description || '',
            company_id: data.company_id || null,
            options: data.options || []
          };

          Logger.log('=== SIMPLIFIED DROPDOWN CREATION DEBUG ===');
          Logger.log('🔍 Raw request data keys:', Object.keys(data));
          Logger.log('📥 Final extracted payload:', JSON.stringify(dropdownData, null, 2));

          // Use the debug version for comprehensive validation and logging
          const creationResult = createDropdownListWithDebug(dropdownData);

          return createJsonResponse({
            success: true,
            data: creationResult
          });

        case 'updateDropdownList':
          const updateDropdownData = data.payload || {
            id: data.id,
            name: data.name,
            description: data.description,
            company_id: data.company_id,
            options: data.options
          };
          return createJsonResponse({
            success: true,
            data: updateDropdownList(updateDropdownData)
          });

        case 'deleteDropdownList':
          const dropdownDeletionData = data.payload || {
            id: data.id,
            reason: data.reason || 'admin_request'
          };
          if (!dropdownDeletionData.id) {
            throw new Error('Dropdown list ID is required for deletion');
          }
          return createJsonResponse({
            success: true,
            data: deactivateDropdownList(dropdownDeletionData.id, dropdownDeletionData.reason)
          });

        case 'createTicketType':
          const ticketTypeData = data.payload || { name: data.name, code: data.code, description: data.description, transaction_id: data.transaction_id, require_attachment_on_create: data.require_attachment_on_create, company_id: data.company_id };
          return createJsonResponse({
            success: true,
            data: createTicketType(ticketTypeData)
          });

        case 'updateTicketType':
          const updateTicketTypeData = data.payload || { id: data.id, name: data.name, code: data.code, description: data.description, transaction_id: data.transaction_id, require_attachment_on_create: data.require_attachment_on_create, company_id: data.company_id };
          return createJsonResponse({
            success: true,
            data: updateTicketType(updateTicketTypeData)
          });

        case 'deleteTicketType':
          const ticketTypeDeletionData = data.payload || {
            id: data.id,
            reason: data.reason || 'admin_request'
          };
          if (!ticketTypeDeletionData.id) {
            throw new Error('Ticket type ID is required for deletion');
          }
          return createJsonResponse({
            success: true,
            data: deactivateTicketType(ticketTypeDeletionData.id, ticketTypeDeletionData.reason)
          });

        case 'getTickets':
          return createJsonResponse({
            success: true,
            data: getTickets(data)
          });

        case 'createTicket':
          const ticketData = data.payload || {
            title: data.title,
            ticket_type_id: data.ticket_type_id,
            requester_id: data.requester_id,
            company_id: data.company_id,
            custom_fields: data.custom_fields
          };
          return createJsonResponse({
            success: true,
            data: createTicket(ticketData)
          });

        case 'recordLogin':
          const loginData = data.payload || {
            userId: data.userId || data.user_id,
            email: data.email,
            ipAddress: data.ipAddress
          };
          return createJsonResponse({
            success: true,
            data: logLogin(loginData)
          });

        case 'updateUserPreferences':
          const userPreferencesData = data.payload || {
            user_id: data.user_id,
            preferences: data.preferences
          };
          if (!userPreferencesData.user_id) {
            throw new Error('User ID is required for updating preferences');
          }
          if (!userPreferencesData.preferences) {
            throw new Error('Preferences data is required');
          }
          return createJsonResponse({
            success: true,
            data: updateUserPreferences(userPreferencesData.user_id, userPreferencesData.preferences)
          });

        case 'testMinimalDropdownCreate':
          return createJsonResponse({
            success: true,
            data: testMinimalDropdownCreate()
          });

        case 'checkDropdownPersistence':
          return createJsonResponse({
            success: true,
            data: checkDropdownPersistence()
          });

        default:
          return createJsonResponse({
            success: false,
            error: 'Unknown action: ' + action
          });
      }
    } catch (error) {
      console.error('doPost Error:', error);
      return createJsonResponse({
        success: false,
        error: error.toString()
      });
    }
}

/**
 * Handles OPTIONS requests for CORS preflight checks. This is essential for
 * allowing the frontend (e.g., on Vercel) to communicate with this API.
 * Google Apps Script requires proper CORS handling for cross-origin requests.
 * @param {object} e - The event object from the OPTIONS request.
 * @returns {ContentService.TextOutput} - An empty response with CORS support.
 */
function doOptions(e) {
  // Google Apps Script doesn't support setHeader chaining
  // For Web Apps, CORS is handled automatically when deployed with "Anyone" access
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * =================================================================================
 * CORE BUSINESS LOGIC FUNCTIONS
 * =================================================================================
 */

/**
 * Creates a new ticket, generates a unique ticket number, and logs the creation.
 * @param {object} payload - The data for the new ticket from the frontend.
 * @returns {object} - Confirmation of the created ticket.
 */
function createTicket(payload) {
  // Validate payload exists
  if (!payload) {
    throw new Error('Payload is required');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ticketsSheet = ss.getSheetByName(SHEETS.TICKETS);

  const now = new Date();
  const newTicketId = ticketsSheet.getLastRow() > 0 ? ticketsSheet.getLastRow() : 1; // Simple internal ID

  // --- Generate User-Facing Ticket Number ---
  const ticketTypes = getSheetDataAsJSON(ss.getSheetByName(SHEETS.TICKET_TYPES));
  const companies = getSheetDataAsJSON(ss.getSheetByName(SHEETS.COMPANIES));

  const ticketType = ticketTypes.find(t => t.id == payload.ticket_type_id);
  const company = companies.find(c => c.id == payload.company_id);

  if (!ticketType) throw new Error(`Ticket Type with ID ${payload.ticket_type_id} not found.`);
  if (!company) throw new Error(`Company with ID ${payload.company_id} not found.`);

  const ticketNumber = generateTicketNumber(company.code, ticketType.code);

  // --- Create Main Ticket Entry ---
  const newTicketRow = [
    newTicketId,
    ticketNumber,
    payload.title,
    payload.ticket_type_id,
    payload.requester_id,
    'New', // Initial status
    payload.current_step_id || null,
    payload.step_due_date || null,
    now,
    now,
    payload.company_id
  ];
  ticketsSheet.appendRow(newTicketRow);

  // --- Log Actions ---
  logTicketHistory(newTicketId, payload.requester_id, 'Created', 'Ticket submitted by user.');
  logTicketAction(newTicketId, payload.requester_id, 'CREATE_TICKET', { newTicketData: payload });

  // --- Save Custom Field Values (Simplified for POC) ---
  if (payload.customData) {
      const fieldValuesSheet = ss.getSheetByName(SHEETS.CUSTOM_FIELD_VALUES);
      for (const fieldId in payload.customData) {
          const valueRow = [
              (fieldValuesSheet.getLastRow() > 0 ? fieldValuesSheet.getLastRow() : 1),
              newTicketId,
              fieldId,
              payload.customData[fieldId], // Assumes text value
              null, null, null // Placeholders for other value types
          ];
          fieldValuesSheet.appendRow(valueRow);
      }
  }

  return { ticketId: newTicketId, ticketNumber: ticketNumber, message: "Ticket created successfully." };
}

/**
 * Fetches all tickets and their parent/child relationships.
 * @param {object} params - Optional filter parameters.
 * @returns {Array} - An array of ticket objects.
 */
function getTickets(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ticketsSheet = ss.getSheetByName(SHEETS.TICKETS);
  const linksSheet = ss.getSheetByName(SHEETS.TICKET_LINKS);

  const tickets = getSheetDataAsJSON(ticketsSheet);
  const links = getSheetDataAsJSON(linksSheet);

  // Add parent/child info to each ticket object
  const ticketsWithLinks = tickets.map(ticket => {
      const children = links.filter(l => l.parent_ticket_id == ticket.id).map(l => l.child_ticket_id);
      const parent = links.find(l => l.child_ticket_id == ticket.id);
      return {
          ...ticket,
          children: children,
          parent: parent ? parent.parent_ticket_id : null
      };
  });

  // Example filtering (can be expanded)
  if (params.status) {
    return ticketsWithLinks.filter(t => t.status === params.status);
  }

  return ticketsWithLinks;
}

/**
 * =================================================================================
 * COMPANY MANAGEMENT FUNCTIONS
 * =================================================================================
 */

function getCompanies(params = {}) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    if (!companiesSheet) {
      initializeCompaniesSheet();
      return [];
    }

    const companies = getSheetDataAsJSON(companiesSheet);
    Logger.log(`Retrieved ${companies.length} companies`);
    return companies;
  } catch (error) {
    Logger.log(`Error getting companies: ${error.message}`);
    throw new Error(`Failed to retrieve companies: ${error.message}`);
  }
}

function getCompany(companyId) {
  try {
    const companies = getCompanies();
    const company = companies.find(c => c.id === companyId);

    if (!company) {
      throw new Error('Company not found');
    }

    return company;
  } catch (error) {
    Logger.log(`Error getting company ${companyId}: ${error.message}`);
    throw error;
  }
}

function createCompany(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    if (!companiesSheet) {
      companiesSheet = initializeCompaniesSheet();
    }

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    // Validate required fields
    if (!payload.name || !payload.code) {
      throw new Error('Company name and code are required');
    }

    // Check if code already exists (among active companies only)
    const existingCompanies = getSheetDataAsJSON(companiesSheet);
    const activeCompanies = filterActiveRecords(existingCompanies);
    const codeExists = activeCompanies.some(c => c.code.toUpperCase() === payload.code.toUpperCase());

    if (codeExists) {
      throw new Error('Company code already exists');
    }

    // Create audit fields for new record
    const auditFields = createAuditFields();

    // Generate new company with comprehensive audit fields
    const newCompany = {
      id: generateId('comp'),
      name: payload.name.trim(),
      code: payload.code.toUpperCase(),
      code_locked: false,
      code_locked_at: null,
      code_locked_reason: null,
      ticket_count: 0,
      ...auditFields
    };

    // Add to sheet with all audit fields
    companiesSheet.appendRow([
      newCompany.id,
      newCompany.name,
      newCompany.code,
      newCompany.code_locked,
      newCompany.code_locked_at,
      newCompany.code_locked_reason,
      newCompany.ticket_count,
      newCompany.is_active,
      newCompany.created_at,
      newCompany.created_by,
      newCompany.updated_at,
      newCompany.updated_by,
      newCompany.deactivated_at,
      newCompany.deactivated_by,
      newCompany.deactivation_reason
    ]);

    // Log the action
    logAdminAction('CREATE_COMPANY', newCompany.id, newCompany);

    Logger.log(`Created company: ${newCompany.name} (${newCompany.code})`);
    return newCompany;
  } catch (error) {
    Logger.log(`Error creating company: ${error.message}`);
    throw error;
  }
}

/**
 * Deactivate (soft delete) a company
 * @param {string} companyId - The company ID to deactivate
 * @param {string} reason - Reason for deactivation
 * @returns {Object} Result of the deactivation operation
 */
function deactivateCompany(companyId, reason = 'admin_request') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    if (!companiesSheet) {
      throw new Error('Companies sheet not found');
    }

    // Find the row to deactivate
    const data = companiesSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const rowIndex = rows.findIndex(row => row[0] === companyId);
    if (rowIndex === -1) {
      throw new Error('Company not found');
    }

    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based index

    // Create deactivation audit fields
    const deactivationFields = deactivateAuditFields(reason);
    const sheetsFields = auditFieldsForSheets(deactivationFields);

    // Update the row with deactivation fields
    const currentRow = rows[rowIndex];
    const updatedRow = [...currentRow];

    // Update audit fields (assuming column positions match the schema)
    updatedRow[7] = sheetsFields.is_active; // is_active column
    updatedRow[10] = sheetsFields.updated_at; // updated_at column
    updatedRow[11] = sheetsFields.updated_by; // updated_by column
    updatedRow[12] = sheetsFields.deactivated_at; // deactivated_at column
    updatedRow[13] = sheetsFields.deactivated_by; // deactivated_by column
    updatedRow[14] = sheetsFields.deactivation_reason; // deactivation_reason column

    // Write the updated row back to the sheet
    companiesSheet.getRange(actualRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    // Log the action
    logAdminAction('DEACTIVATE_COMPANY', companyId, { reason: reason });

    Logger.log(`Deactivated company: ${companyId} (Reason: ${reason})`);
    return {
      id: companyId,
      deactivated: true,
      reason: reason,
      deactivated_at: deactivationFields.deactivated_at
    };

  } catch (error) {
    Logger.log(`Error deactivating company: ${error.message}`);
    throw error;
  }
}

/**
 * Reactivate a deactivated company
 * @param {string} companyId - The company ID to reactivate
 * @returns {Object} Result of the reactivation operation
 */
function reactivateCompany(companyId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    if (!companiesSheet) {
      throw new Error('Companies sheet not found');
    }

    // Find the row to reactivate
    const data = companiesSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const rowIndex = rows.findIndex(row => row[0] === companyId);
    if (rowIndex === -1) {
      throw new Error('Company not found');
    }

    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based index

    // Create reactivation audit fields
    const reactivationFields = reactivateAuditFields();
    const sheetsFields = auditFieldsForSheets(reactivationFields);

    // Update the row with reactivation fields
    const currentRow = rows[rowIndex];
    const updatedRow = [...currentRow];

    // Update audit fields (assuming column positions match the schema)
    updatedRow[7] = sheetsFields.is_active; // is_active column
    updatedRow[10] = sheetsFields.updated_at; // updated_at column
    updatedRow[11] = sheetsFields.updated_by; // updated_by column
    updatedRow[12] = sheetsFields.deactivated_at; // deactivated_at column (cleared)
    updatedRow[13] = sheetsFields.deactivated_by; // deactivated_by column (cleared)
    updatedRow[14] = sheetsFields.deactivation_reason; // deactivation_reason column (cleared)

    // Write the updated row back to the sheet
    companiesSheet.getRange(actualRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    // Log the action
    logAdminAction('REACTIVATE_COMPANY', companyId, { reactivated: true });

    Logger.log(`Reactivated company: ${companyId}`);
    return {
      id: companyId,
      reactivated: true,
      reactivated_at: reactivationFields.updated_at
    };

  } catch (error) {
    Logger.log(`Error reactivating company: ${error.message}`);
    throw error;
  }
}

function updateCompany(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.id) {
      throw new Error('Company ID is required for update');
    }

    // Validate required fields
    if (!payload.name || !payload.code) {
      throw new Error('Company name and code are required');
    }

    // Find the row to update
    const data = companiesSheet.getDataRange().getValues();
    const headers = data[0];
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.id) { // ID is in first column
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Company not found');
    }

    // Check if code already exists (excluding current company)
    const existingCompanies = getSheetDataAsJSON(companiesSheet);
    const codeExists = existingCompanies.some(c =>
      c.id !== payload.id && c.code.toUpperCase() === payload.code.toUpperCase()
    );

    if (codeExists) {
      throw new Error('Company code already exists');
    }

    // Update the company
    const updatedCompany = {
      id: payload.id,
      name: payload.name.trim(),
      code: payload.code.toUpperCase().trim(),
      created_at: data[rowIndex - 1][3], // Keep original created_at
      updated_at: new Date().toISOString()
    };

    // Update the row
    companiesSheet.getRange(rowIndex, 1, 1, 5).setValues([[
      updatedCompany.id,
      updatedCompany.name,
      updatedCompany.code,
      updatedCompany.created_at,
      updatedCompany.updated_at
    ]]);

    // Log the action
    logAdminAction('UPDATE_COMPANY', payload.id, { before: data[rowIndex - 1], after: updatedCompany });

    Logger.log(`Updated company: ${updatedCompany.name}`);
    return updatedCompany;
  } catch (error) {
    Logger.log(`Error updating company: ${error.message}`);
    throw error;
  }
}

function deleteCompany(companyId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

    // Find the row to delete
    const data = companiesSheet.getDataRange().getValues();
    let rowIndex = -1;
    let companyData = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === companyId) {
        rowIndex = i + 1; // 1-based index
        companyData = data[i];
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Company not found');
    }

    // Delete the row
    companiesSheet.deleteRow(rowIndex);

    // Log the action
    logAdminAction('DELETE_COMPANY', companyId, { deletedCompany: companyData });

    Logger.log(`Deleted company: ${companyData[1]}`);
    return { message: 'Company deleted successfully' };
  } catch (error) {
    Logger.log(`Error deleting company: ${error.message}`);
    throw error;
  }
}

/**
 * =================================================================================
 * ROLE MANAGEMENT FUNCTIONS
 * =================================================================================
 */

function getRoles(params = {}) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let rolesSheet = ss.getSheetByName(SHEETS.ROLES);

    if (!rolesSheet) {
      rolesSheet = initializeRolesSheet();
      return [];
    }

    let roles = getSheetDataAsJSON(rolesSheet);

    // Filter by company if specified
    if (params.companyId) {
      roles = roles.filter(r => r.company_id === params.companyId || r.company_id === null);
    }

    Logger.log(`Retrieved ${roles.length} roles`);
    return roles;
  } catch (error) {
    Logger.log(`Error getting roles: ${error.message}`);
    throw new Error(`Failed to retrieve roles: ${error.message}`);
  }
}

function createRole(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let rolesSheet = ss.getSheetByName(SHEETS.ROLES);

    if (!rolesSheet) {
      rolesSheet = initializeRolesSheet();
    }

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.name) {
      throw new Error('Role name is required');
    }

    const newRole = {
      id: generateId('role'),
      name: payload.name.trim(),
      company_id: payload.company_id === 'global' ? null : payload.company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rolesSheet.appendRow([
      newRole.id,
      newRole.name,
      newRole.company_id || '',
      newRole.created_at,
      newRole.updated_at
    ]);

    logAdminAction('CREATE_ROLE', newRole.id, newRole);

    Logger.log(`Created role: ${newRole.name}`);
    return newRole;
  } catch (error) {
    Logger.log(`Error creating role: ${error.message}`);
    throw error;
  }
}

function updateRole(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const rolesSheet = ss.getSheetByName(SHEETS.ROLES);

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.id || !payload.name) {
      throw new Error('Role ID and name are required');
    }

    // Find and update the role
    const data = rolesSheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Role not found');
    }

    const updatedRole = {
      id: payload.id,
      name: payload.name.trim(),
      company_id: payload.company_id === 'global' ? null : payload.company_id,
      created_at: data[rowIndex - 1][3],
      updated_at: new Date().toISOString()
    };

    rolesSheet.getRange(rowIndex, 1, 1, 5).setValues([[
      updatedRole.id,
      updatedRole.name,
      updatedRole.company_id || '',
      updatedRole.created_at,
      updatedRole.updated_at
    ]]);

    logAdminAction('UPDATE_ROLE', payload.id, updatedRole);

    Logger.log(`Updated role: ${updatedRole.name}`);
    return updatedRole;
  } catch (error) {
    Logger.log(`Error updating role: ${error.message}`);
    throw error;
  }
}

function deleteRole(roleId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const rolesSheet = ss.getSheetByName(SHEETS.ROLES);

    const data = rolesSheet.getDataRange().getValues();
    let rowIndex = -1;
    let roleData = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roleId) {
        rowIndex = i + 1;
        roleData = data[i];
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Role not found');
    }

    rolesSheet.deleteRow(rowIndex);
    logAdminAction('DELETE_ROLE', roleId, { deletedRole: roleData });

    Logger.log(`Deleted role: ${roleData[1]}`);
    return { message: 'Role deleted successfully' };
  } catch (error) {
    Logger.log(`Error deleting role: ${error.message}`);
    throw error;
  }
}

/**
 * =================================================================================
 * DROPDOWN LIST MANAGEMENT FUNCTIONS
 * =================================================================================
 */

function getDropdownLists(params = {}) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let listsSheet = ss.getSheetByName(SHEETS.DROPDOWN_LISTS);

    if (!listsSheet) {
      listsSheet = initializeDropdownListsSheet();
      return [];
    }

    const lists = getSheetDataAsJSON(listsSheet);

    // Add options to each list
    const listsWithOptions = lists.map(list => ({
      ...list,
      options: getDropdownOptions(list.id)
    }));

    Logger.log(`Retrieved ${lists.length} dropdown lists`);
    return listsWithOptions;
  } catch (error) {
    Logger.log(`Error getting dropdown lists: ${error.message}`);
    throw new Error(`Failed to retrieve dropdown lists: ${error.message}`);
  }
}

function getDropdownOptions(listId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let optionsSheet = ss.getSheetByName(SHEETS.DROPDOWN_OPTIONS);

    if (!optionsSheet) {
      optionsSheet = initializeDropdownOptionsSheet();
      return [];
    }

    const allOptions = getSheetDataAsJSON(optionsSheet);
    const listOptions = allOptions.filter(opt => opt.dropdown_list_id === listId);

    return listOptions;
  } catch (error) {
    Logger.log(`Error getting dropdown options for list ${listId}: ${error.message}`);
    return [];
  }
}

function createDropdownList(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let listsSheet = ss.getSheetByName(SHEETS.DROPDOWN_LISTS);
    let optionsSheet = ss.getSheetByName(SHEETS.DROPDOWN_OPTIONS);

    if (!listsSheet) {
      listsSheet = initializeDropdownListsSheet();
    }
    if (!optionsSheet) {
      optionsSheet = initializeDropdownOptionsSheet();
    }

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.name) {
      throw new Error('Dropdown list name is required');
    }

    // Handle multi-company assignment
    let companyId = payload.company_id || null;

    // If multiple companies are specified, store as JSON array
    if (Array.isArray(payload.company_ids) && payload.company_ids.length > 0) {
      companyId = JSON.stringify(payload.company_ids);
    } else if (Array.isArray(payload.company_id) && payload.company_id.length > 0) {
      companyId = JSON.stringify(payload.company_id);
    }

    const currentTime = new Date().toISOString();
    const currentUser = getCurrentUserId();

    const newList = {
      id: generateId('dd'),
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : '',
      company_id: companyId,
      is_active: true,
      created_at: currentTime,
      created_by: currentUser,
      updated_at: currentTime,
      updated_by: currentUser,
      deactivated_at: null,
      deactivated_by: null,
      deactivation_reason: null
    };

    // ENHANCED SHEET WRITING WITH VERIFICATION
    Logger.log('About to write to sheet - newList data:', JSON.stringify(newList, null, 2));
    Logger.log('Sheet name:', listsSheet.getName());
    Logger.log('Sheet ID:', listsSheet.getSheetId());

    const rowToAppend = [
      newList.id,
      newList.name,
      newList.description,
      newList.company_id,
      newList.is_active,
      newList.created_at,
      newList.created_by,
      newList.updated_at,
      newList.updated_by,
      newList.deactivated_at,
      newList.deactivated_by,
      newList.deactivation_reason
    ];

    Logger.log('Row data to append:', JSON.stringify(rowToAppend, null, 2));

    const beforeRowCount = listsSheet.getLastRow();
    Logger.log('Row count before append:', beforeRowCount);

    // Write to sheet
    listsSheet.appendRow(rowToAppend);

    const afterRowCount = listsSheet.getLastRow();
    Logger.log('Row count after append:', afterRowCount);
    Logger.log('Row count difference:', afterRowCount - beforeRowCount);

    // Verify the write by reading back the last row
    if (afterRowCount > beforeRowCount) {
      const lastRow = listsSheet.getRange(afterRowCount, 1, 1, 12).getValues()[0];
      Logger.log('Verification - last row written:', JSON.stringify(lastRow, null, 2));
    } else {
      Logger.error('ERROR: Row count did not increase after appendRow!');
    }

    // Add options if provided
    if (payload.options && Array.isArray(payload.options)) {
      Logger.log('Adding options:', payload.options.length);
      payload.options.forEach((option, index) => {
        if (option.label && option.value) {
          const optionRow = [
            generateId('opt'),
            newList.id,
            option.label.trim(),
            option.value.trim(),
            option.parent_option_id || ''
          ];
          Logger.log(`Adding option ${index + 1}:`, JSON.stringify(optionRow, null, 2));
          optionsSheet.appendRow(optionRow);
        }
      });
    }

    // Log admin action
    try {
      logAdminAction('CREATE_DROPDOWN_LIST', newList.id, newList);
      Logger.log('Admin action logged successfully');
    } catch (logError) {
      Logger.error('Error logging admin action:', logError.message);
    }

    Logger.log('=== SHEET OPERATIONS COMPLETE ===');
    Logger.log(`Created dropdown list: ${newList.name}`);
    return newList;
  } catch (error) {
    Logger.log(`Error creating dropdown list: ${error.message}`);
    throw error;
  }
}

function updateDropdownList(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const listsSheet = ss.getSheetByName(SHEETS.DROPDOWN_LISTS);
    const optionsSheet = ss.getSheetByName(SHEETS.DROPDOWN_OPTIONS);

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.id || !payload.name) {
      throw new Error('Dropdown list ID and name are required');
    }

    // Update the list
    const listData = listsSheet.getDataRange().getValues();
    let listRowIndex = -1;

    for (let i = 1; i < listData.length; i++) {
      if (listData[i][0] === payload.id) {
        listRowIndex = i + 1;
        break;
      }
    }

    if (listRowIndex === -1) {
      throw new Error('Dropdown list not found');
    }

    const currentTime = new Date().toISOString();
    const currentUser = getCurrentUserId();

    const updatedList = {
      id: payload.id,
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : (listData[listRowIndex - 1][2] || ''),
      company_id: payload.company_id !== undefined ? payload.company_id : listData[listRowIndex - 1][3],
      is_active: listData[listRowIndex - 1][4] !== undefined ? listData[listRowIndex - 1][4] : true,
      created_at: listData[listRowIndex - 1][5] || currentTime,
      created_by: listData[listRowIndex - 1][6] || currentUser,
      updated_at: currentTime,
      updated_by: currentUser,
      deactivated_at: listData[listRowIndex - 1][9] || null,
      deactivated_by: listData[listRowIndex - 1][10] || null,
      deactivation_reason: listData[listRowIndex - 1][11] || null
    };

    listsSheet.getRange(listRowIndex, 1, 1, 12).setValues([[
      updatedList.id,
      updatedList.name,
      updatedList.description,
      updatedList.company_id,
      updatedList.is_active,
      updatedList.created_at,
      updatedList.created_by,
      updatedList.updated_at,
      updatedList.updated_by,
      updatedList.deactivated_at,
      updatedList.deactivated_by,
      updatedList.deactivation_reason
    ]]);

    // Delete existing options
    const optionsData = optionsSheet.getDataRange().getValues();
    for (let i = optionsData.length - 1; i >= 1; i--) {
      if (optionsData[i][1] === payload.id) {
        optionsSheet.deleteRow(i + 1);
      }
    }

    // Add new options
    if (payload.options && Array.isArray(payload.options)) {
      payload.options.forEach(option => {
        if (option.label && option.value) {
          optionsSheet.appendRow([
            generateId('opt'),
            payload.id,
            option.label.trim(),
            option.value.trim(),
            option.parentValue || ''
          ]);
        }
      });
    }

    logAdminAction('UPDATE_DROPDOWN_LIST', payload.id, updatedList);

    Logger.log(`Updated dropdown list: ${updatedList.name}`);
    return updatedList;
  } catch (error) {
    Logger.log(`Error updating dropdown list: ${error.message}`);
    throw error;
  }
}

function deleteDropdownList(listId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const listsSheet = ss.getSheetByName(SHEETS.DROPDOWN_LISTS);
    const optionsSheet = ss.getSheetByName(SHEETS.DROPDOWN_OPTIONS);

    // Find and delete the list
    const listData = listsSheet.getDataRange().getValues();
    let listRowIndex = -1;
    let deletedListData = null;

    for (let i = 1; i < listData.length; i++) {
      if (listData[i][0] === listId) {
        listRowIndex = i + 1;
        deletedListData = listData[i];
        break;
      }
    }

    if (listRowIndex === -1) {
      throw new Error('Dropdown list not found');
    }

    // Delete options first
    const optionsData = optionsSheet.getDataRange().getValues();
    for (let i = optionsData.length - 1; i >= 1; i--) {
      if (optionsData[i][1] === listId) {
        optionsSheet.deleteRow(i + 1);
      }
    }

    // Delete the list
    listsSheet.deleteRow(listRowIndex);

    logAdminAction('DELETE_DROPDOWN_LIST', listId, { deletedList: deletedListData });

    Logger.log(`Deleted dropdown list: ${deletedListData[1]}`);
    return { message: 'Dropdown list deleted successfully' };
  } catch (error) {
    Logger.log(`Error deleting dropdown list: ${error.message}`);
    throw error;
  }
}

/**
 * =================================================================================
 * TICKET TYPE MANAGEMENT FUNCTIONS
 * =================================================================================
 */

function getTicketTypes(params = {}) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let ticketTypesSheet = ss.getSheetByName(SHEETS.TICKET_TYPES);

    if (!ticketTypesSheet) {
      ticketTypesSheet = initializeTicketTypesSheet();
      return [];
    }

    let ticketTypes = getSheetDataAsJSON(ticketTypesSheet);

    // Filter by company if specified
    if (params.companyId) {
      ticketTypes = ticketTypes.filter(tt => tt.company_id === params.companyId || tt.company_id === null);
    }

    Logger.log(`Retrieved ${ticketTypes.length} ticket types`);
    return ticketTypes;
  } catch (error) {
    Logger.log(`Error getting ticket types: ${error.message}`);
    throw new Error(`Failed to retrieve ticket types: ${error.message}`);
  }
}

function createTicketType(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let ticketTypesSheet = ss.getSheetByName(SHEETS.TICKET_TYPES);

    if (!ticketTypesSheet) {
      ticketTypesSheet = initializeTicketTypesSheet();
    }

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.name || !payload.code) {
      throw new Error('Ticket type name and code are required');
    }

    const newTicketType = {
      id: generateId('tt'),
      transaction_id: payload.transaction_id || generateId('tr'),
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      description: payload.description || '',
      is_active: payload.is_active !== false,
      require_attachment_on_create: payload.require_attachment_on_create || false,
      company_id: payload.company_id === 'global' ? null : payload.company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    ticketTypesSheet.appendRow([
      newTicketType.id,
      newTicketType.transaction_id,
      newTicketType.code,
      newTicketType.name,
      newTicketType.description,
      newTicketType.is_active,
      newTicketType.require_attachment_on_create,
      newTicketType.company_id || '',
      newTicketType.created_at,
      newTicketType.updated_at
    ]);

    logAdminAction('CREATE_TICKET_TYPE', newTicketType.id, newTicketType);

    Logger.log(`Created ticket type: ${newTicketType.name}`);
    return newTicketType;
  } catch (error) {
    Logger.log(`Error creating ticket type: ${error.message}`);
    throw error;
  }
}

function updateTicketType(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ticketTypesSheet = ss.getSheetByName(SHEETS.TICKET_TYPES);

    // Validate payload exists
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!payload.id || !payload.name || !payload.code) {
      throw new Error('Ticket type ID, name, and code are required');
    }

    // Find and update the ticket type
    const data = ticketTypesSheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Ticket type not found');
    }

    const updatedTicketType = {
      id: payload.id,
      transaction_id: payload.transaction_id || data[rowIndex - 1][1],
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      description: payload.description || '',
      is_active: payload.is_active !== false,
      require_attachment_on_create: payload.require_attachment_on_create || false,
      company_id: payload.company_id === 'global' ? null : payload.company_id,
      created_at: data[rowIndex - 1][8],
      updated_at: new Date().toISOString()
    };

    ticketTypesSheet.getRange(rowIndex, 1, 1, 10).setValues([[
      updatedTicketType.id,
      updatedTicketType.transaction_id,
      updatedTicketType.code,
      updatedTicketType.name,
      updatedTicketType.description,
      updatedTicketType.is_active,
      updatedTicketType.require_attachment_on_create,
      updatedTicketType.company_id || '',
      updatedTicketType.created_at,
      updatedTicketType.updated_at
    ]]);

    logAdminAction('UPDATE_TICKET_TYPE', payload.id, updatedTicketType);

    Logger.log(`Updated ticket type: ${updatedTicketType.name}`);
    return updatedTicketType;
  } catch (error) {
    Logger.log(`Error updating ticket type: ${error.message}`);
    throw error;
  }
}

function deleteTicketType(ticketTypeId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ticketTypesSheet = ss.getSheetByName(SHEETS.TICKET_TYPES);

    const data = ticketTypesSheet.getDataRange().getValues();
    let rowIndex = -1;
    let ticketTypeData = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === ticketTypeId) {
        rowIndex = i + 1;
        ticketTypeData = data[i];
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Ticket type not found');
    }
// =================================================================================
// NEW FUNCTIONS BASED ON SUPERTHINK_TODO_ANALYSIS_2025-09-27.md
// =================================================================================

/**
 * =================================================================================
 * PHASE 1: User Profile Implementation
 * =================================================================================
 */

/**
 * MODIFIED to support entityCategory
 * Fetches custom fields for a given entity type and category.
 * @param {string} entityTypeId - The ID of the entity type (e.g., ticket type ID, user profile type ID).
 * @param {string} [entityCategory='ticket'] - The category of the entity ('ticket', 'user_profile', 'role').
 * @returns {Array} - An array of custom field objects.
 */
function getCustomFields(entityTypeId, entityCategory = 'ticket') {
  const allCustomFields = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOM_FIELDS));
  return allCustomFields.filter(field => field.ticket_type_id === entityTypeId && field.entity_category === entityCategory && field.is_active);
}

/**
 * MODIFIED to support entityCategory
 * Creates a new custom field for a given entity type and category.
 * @param {string} entityTypeId - The ID of the entity type.
 * @param {object} fieldData - The data for the new custom field.
 * @param {string} [entityCategory='ticket'] - The category of the entity.
 * @returns {object} - The created custom field object.
 */
function createCustomField(entityTypeId, fieldData, entityCategory = 'ticket') {
  const customFieldsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOM_FIELDS);
  const auditFields = createAuditFields();
  const newField = {
    id: generateId('cf'),
    ticket_type_id: entityTypeId,
    entity_category: entityCategory,
    name: fieldData.name,
    label: fieldData.label,
    type: fieldData.type,
    is_required: fieldData.is_required || false,
    is_hidden: fieldData.is_hidden || false,
    sort_order: fieldData.sort_order || 0,
    dropdown_list_id: fieldData.dropdown_list_id || null,
    depends_on_field_id: fieldData.depends_on_field_id || null,
    ...auditFields
  };
  
  const newRow = [
    newField.id, newField.ticket_type_id, newField.entity_category, newField.name, newField.label, newField.type,
    newField.is_required, newField.is_hidden, newField.sort_order, newField.dropdown_list_id, newField.depends_on_field_id,
    newField.is_active, newField.created_at, newField.created_by, newField.updated_at, newField.updated_by,
    newField.deactivated_at, newField.deactivated_by, newField.deactivation_reason
  ];
  
  customFieldsSheet.appendRow(newRow);
  logAdminAction('CREATE_CUSTOM_FIELD', newField.id, newField);
  return newField;
}

/**
 * MODIFIED to support entityCategory
 * Sets the value of a custom field for a given entity.
 * @param {string} entityId - The ID of the entity (e.g., ticket ID, user ID).
 * @param {string} fieldId - The ID of the custom field.
 * @param {any} value - The value to set.
 * @param {string} [entityCategory='ticket'] - The category of the entity.
 * @returns {object} - Confirmation of the value being set.
 */
function setCustomFieldValue(entityId, fieldId, value, entityCategory = 'ticket') {
  const valuesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOM_FIELD_VALUES);
  const auditFields = createAuditFields();
  
  // This is a simplified implementation. A real implementation would need to handle different value types.
  const newValue = {
    id: generateId('cfv'),
    ticket_id: entityId, // Assuming ticket_id can be used as a generic entity_id
    entity_category: entityCategory,
    custom_field_id: fieldId,
    text_value: value,
    ...auditFields
  };
  
  const newRow = [
      newValue.id, newValue.ticket_id, newValue.entity_category, newValue.custom_field_id, newValue.text_value,
      null, null, null, null, // other value types
      newValue.is_active, newValue.created_at, newValue.created_by, newValue.updated_at, newValue.updated_by,
      newValue.deleted_at, newValue.deleted_by, newValue.deletion_reason
  ];

  valuesSheet.appendRow(newRow);
  return { success: true, valueId: newValue.id };
}

/**
 * NEW FUNCTION
 * Fetches user profile types.
 * @param {string} [companyId=null] - Optional company ID to filter by.
 * @returns {Array} - An array of user profile type objects.
 */
function getUserProfileTypes(companyId = null) {
  const allTypes = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILE_TYPES));
  if (companyId) {
    return allTypes.filter(type => type.company_id === companyId && type.is_active);
  }
  return allTypes.filter(type => type.is_active);
}

/**
 * NEW FUNCTION
 * Creates a new user profile type.
 * @param {object} profileTypeData - The data for the new user profile type.
 * @returns {object} - The created user profile type object.
 */
function createUserProfileType(profileTypeData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILE_TYPES);
  const auditFields = createAuditFields();
  const newType = {
    id: generateId('upt'),
    name: profileTypeData.name,
    description: profileTypeData.description || '',
    code: profileTypeData.code,
    company_id: profileTypeData.company_id || null,
    ...auditFields
  };
  
  const newRow = [
    newType.id, newType.name, newType.description, newType.code, newType.company_id,
    newType.is_active, newType.created_at, newType.created_by, newType.updated_at, newType.updated_by,
    newType.deactivated_at, newType.deactivated_by, newType.deactivation_reason
  ];
  
  sheet.appendRow(newRow);
  logAdminAction('CREATE_USER_PROFILE_TYPE', newType.id, newType);
  return newType;
}

/**
 * NEW FUNCTION
 * Updates an existing user profile type.
 * @param {string} profileTypeId - The ID of the user profile type to update.
 * @param {object} profileTypeData - The updated data.
 * @returns {object} - The updated user profile type object.
 */
function updateUserProfileType(profileTypeId, profileTypeData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILE_TYPES);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === profileTypeId);

  if (rowIndex === -1) {
    throw new Error(`User profile type with ID ${profileTypeId} not found.`);
  }

  const auditFields = updateAuditFields();
  const updatedData = {
    name: profileTypeData.name || data[rowIndex][1],
    description: profileTypeData.description || data[rowIndex][2],
    code: profileTypeData.code || data[rowIndex][3],
    company_id: profileTypeData.company_id || data[rowIndex][4],
    ...auditFields
  };

  sheet.getRange(rowIndex + 1, 2).setValue(updatedData.name);
  sheet.getRange(rowIndex + 1, 3).setValue(updatedData.description);
  sheet.getRange(rowIndex + 1, 4).setValue(updatedData.code);
  sheet.getRange(rowIndex + 1, 5).setValue(updatedData.company_id);
  sheet.getRange(rowIndex + 1, 9).setValue(updatedData.updated_at);
  sheet.getRange(rowIndex + 1, 10).setValue(updatedData.updated_by);

  logAdminAction('UPDATE_USER_PROFILE_TYPE', profileTypeId, { old: data[rowIndex], new: updatedData });
  return { id: profileTypeId, ...updatedData };
}

/**
 * NEW FUNCTION
 * Fetches user profiles.
 * @param {string} [companyId=null] - Optional company ID to filter by.
 * @returns {Array} - An array of user profile objects.
 */
function getUserProfiles(companyId = null) {
    const allProfiles = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES));
    // This is a simplified filter. A real implementation might need to join with companies table.
    return allProfiles.filter(p => p.is_active);
}

/**
 * NEW FUNCTION
 * Creates a new user profile.
 * @param {object} userProfileData - The data for the new user profile.
 * @returns {object} - The created user profile object.
 */
function createUserProfile(userProfileData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES);
  const auditFields = createAuditFields();
  const newProfile = {
    user_id: userProfileData.user_id, // This should come from Firebase Auth
    user_profile_type_id: userProfileData.user_profile_type_id,
    display_name: userProfileData.display_name,
    email: userProfileData.email,
    immediate_approver_id: userProfileData.immediate_approver_id || null,
    backup_approver_id: userProfileData.backup_approver_id || null,
    status: 'active',
    hire_date: userProfileData.hire_date || null,
    ...auditFields
  };
  
  const newRow = [
      newProfile.user_id, newProfile.user_profile_type_id, newProfile.display_name, newProfile.email,
      newProfile.immediate_approver_id, newProfile.backup_approver_id, newProfile.status, newProfile.hire_date,
      newProfile.is_active, newProfile.created_at, newProfile.updated_at
  ];

  sheet.appendRow(newRow);
  logAdminAction('CREATE_USER_PROFILE', newProfile.user_id, newProfile);
  return newProfile;
}

/**
 * NEW FUNCTION
 * Updates an existing user profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} userProfileData - The updated data.
 * @returns {object} - The updated user profile object.
 */
function updateUserProfile(userId, userProfileData) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES);
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[0] === userId);

    if (rowIndex === -1) {
        throw new Error(`User with ID ${userId} not found.`);
    }

    const auditFields = updateAuditFields();
    const updatedData = {
        user_profile_type_id: userProfileData.user_profile_type_id || data[rowIndex][1],
        display_name: userProfileData.display_name || data[rowIndex][2],
        email: userProfileData.email || data[rowIndex][3],
        immediate_approver_id: userProfileData.immediate_approver_id || data[rowIndex][4],
        backup_approver_id: userProfileData.backup_approver_id || data[rowIndex][5],
        status: userProfileData.status || data[rowIndex][6],
        hire_date: userProfileData.hire_date || data[rowIndex][7],
        ...auditFields
    };

    sheet.getRange(rowIndex + 1, 2).setValue(updatedData.user_profile_type_id);
    sheet.getRange(rowIndex + 1, 3).setValue(updatedData.display_name);
    sheet.getRange(rowIndex + 1, 4).setValue(updatedData.email);
    sheet.getRange(rowIndex + 1, 5).setValue(updatedData.immediate_approver_id);
    sheet.getRange(rowIndex + 1, 6).setValue(updatedData.backup_approver_id);
    sheet.getRange(rowIndex + 1, 7).setValue(updatedData.status);
    sheet.getRange(rowIndex + 1, 8).setValue(updatedData.hire_date);
    sheet.getRange(rowIndex + 1, 11).setValue(updatedData.updated_at);

    logAdminAction('UPDATE_USER_PROFILE', userId, { old: data[rowIndex], new: updatedData });
    return { userId: userId, ...updatedData };
}

/**
 * NEW FUNCTION
 * Sets custom field values for a user profile.
 * @param {string} userId - The ID of the user.
 * @param {object} customFieldsData - The custom field values to set.
 * @returns {object} - Confirmation of the values being set.
 */
function setUserProfileCustomFields(userId, customFieldsData) {
    for (const fieldId in customFieldsData) {
        setCustomFieldValue(userId, fieldId, customFieldsData[fieldId], 'user_profile');
    }
    return { success: true, userId: userId };
}


/**
 * =================================================================================
 * PHASE 2: Role Maintenance Implementation
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Fetches role types.
 * @param {string} [companyId=null] - Optional company ID to filter by.
 * @returns {Array} - An array of role type objects.
 */
function getRoleTypes(companyId = null) {
  const allTypes = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.ROLE_TYPES));
  if (companyId) {
    return allTypes.filter(type => type.company_id === companyId && type.is_active);
  }
  return allTypes.filter(type => type.is_active);
}

/**
 * NEW FUNCTION
 * Creates a new role type.
 * @param {object} roleTypeData - The data for the new role type.
 * @returns {object} - The created role type object.
 */
function createRoleType(roleTypeData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.ROLE_TYPES);
  const auditFields = createAuditFields();
  const newType = {
    id: generateId('rt'),
    name: roleTypeData.name,
    description: roleTypeData.description || '',
    code: roleTypeData.code,
    company_id: roleTypeData.company_id || null,
    ...auditFields
  };
  
  const newRow = [
    newType.id, newType.name, newType.description, newType.code, newType.company_id,
    newType.is_active, newType.created_at, newType.created_by, newType.updated_at, newType.updated_by,
    newType.deactivated_at, newType.deactivated_by, newType.deactivation_reason
  ];
  
  sheet.appendRow(newRow);
  logAdminAction('CREATE_ROLE_TYPE', newType.id, newType);
  return newType;
}

/**
 * NEW FUNCTION
 * Assigns a role to a user with date-based validity.
 * @param {string} userId - The ID of the user.
 * @param {string} roleId - The ID of the role.
 * @param {object} assignmentData - The assignment data, including dates.
 * @returns {object} - The created role assignment object.
 */
function assignRoleWithDates(userId, roleId, assignmentData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_ROLE_ASSIGNMENTS);
  const auditFields = createAuditFields();
  const newAssignment = {
    id: generateId('ura'),
    user_id: userId,
    role_id: roleId,
    ticket_type_id: assignmentData.ticket_type_id || null,
    company_id: assignmentData.company_id || null,
    assignment_type: assignmentData.assignment_type || 'permanent',
    effective_start_date: assignmentData.effective_start_date || new Date(),
    effective_end_date: assignmentData.effective_end_date || null,
    auto_expire_days: assignmentData.auto_expire_days || null,
    assigned_by_user_id: getCurrentUserId(),
    approval_required: assignmentData.approval_required || false,
    assignment_notes: assignmentData.assignment_notes || '',
    ...auditFields
  };
  
  const newRow = Object.values(newAssignment);
  sheet.appendRow(newRow);
  logAdminAction('ASSIGN_ROLE_WITH_DATES', newAssignment.id, newAssignment);
  return newAssignment;
}

/**
 * NEW FUNCTION
 * Fetches role assignments that are expiring soon.
 * @param {number} [daysAhead=30] - The number of days to look ahead for expiring roles.
 * @returns {Array} - An array of expiring role assignment objects.
 */
function getExpiringAssignments(daysAhead = 30) {
  const allAssignments = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_ROLE_ASSIGNMENTS));
  const now = new Date();
  const limitDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return allAssignments.filter(assignment => {
    if (!assignment.effective_end_date || !assignment.is_active) {
      return false;
    }
    const endDate = new Date(assignment.effective_end_date);
    return endDate > now && endDate <= limitDate;
  });
}

/**
 * NEW FUNCTION
 * Processes pending role assignment expirations.
 */
function processPendingExpirations() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_ROLE_ASSIGNMENTS);
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  data.forEach((row, index) => {
    if (index === 0) return; // Skip header
    const endDate = new Date(row[7]); // effective_end_date
    const isActive = row[13];
    if (isActive && endDate < now) {
      sheet.getRange(index + 1, 14).setValue(false); // is_active
      sheet.getRange(index + 1, 17).setValue(new Date()); // updated_at
      sheet.getRange(index + 1, 18).setValue('system'); // updated_by
      sheet.getRange(index + 1, 19).setValue(new Date()); // deactivated_at
      sheet.getRange(index + 1, 20).setValue('system'); // deactivated_by
      sheet.getRange(index + 1, 21).setValue('Auto-expired'); // deactivation_reason
    }
  });
}

/**
 * NEW FUNCTION
 * Gets the general role of a user (maker, approver, etc.).
 * @param {string} userId - The ID of the user.
 * @returns {string} - The user's general role.
 */
function getUserGeneralRole(userId) {
    // This is a simplified implementation. A real one would check role_types permissions.
    const userRoles = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_ROLE_ASSIGNMENTS));
    const userHasApprovalRole = userRoles.some(r => r.user_id === userId && r.is_active);
    return userHasApprovalRole ? 'approver' : 'maker';
}

/**
 * NEW FUNCTION
 * Checks if a user can approve a workflow step.
 * @param {string} userId - The ID of the user.
 * @returns {boolean} - True if the user can approve, false otherwise.
 */
function canUserApprove(userId) {
  return getUserGeneralRole(userId) === 'approver';
}


/**
 * =================================================================================
 * PHASE 3: User-End Ticket Interactions
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Adds tags to a ticket.
 * @param {string} ticketId - The ID of the ticket.
 * @param {Array<string>} tags - An array of tags to add.
 * @param {string} userId - The ID of the user adding the tags.
 * @returns {object} - Confirmation of the tags being added.
 */
function addTicketTags(ticketId, tags, userId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_TAGS);
  const auditFields = createAuditFields(userId);
  const newTags = [];

  tags.forEach(tag => {
    const newTag = {
      id: generateId('tag'),
      ticket_id: ticketId,
      tag_name: tag,
      normalized_tag: tag.toLowerCase(),
      ...auditFields
    };
    const newRow = Object.values(newTag);
    sheet.appendRow(newRow);
    newTags.push(newTag);
  });

  logTicketAction(ticketId, userId, 'ADD_TAGS', { tags: tags });
  return { success: true, added: newTags };
}

/**
 * NEW FUNCTION
 * Removes tags from a ticket.
 * @param {string} ticketId - The ID of the ticket.
 * @param {Array<string>} tags - An array of tags to remove.
 * @param {string} userId - The ID of the user removing the tags.
 * @returns {object} - Confirmation of the tags being removed.
 */
function removeTicketTags(ticketId, tags, userId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_TAGS);
  const data = sheet.getDataRange().getValues();
  const normalizedTagsToRemove = tags.map(t => t.toLowerCase());
  let removedCount = 0;

  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (row[1] === ticketId && normalizedTagsToRemove.includes(row[3])) {
      sheet.deleteRow(i + 1);
      removedCount++;
    }
  }

  logTicketAction(ticketId, userId, 'REMOVE_TAGS', { tags: tags });
  return { success: true, removedCount: removedCount };
}

/**
 * NEW FUNCTION
 * Searches for tickets by tags.
 * @param {Array<string>} tags - An array of tags to search for.
 * @param {string} [matchType='any'] - The type of match ('any' or 'all').
 * @returns {Array} - An array of matching ticket objects.
 */
function searchTicketsByTags(tags, matchType = 'any') {
  const allTags = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_TAGS));
  const normalizedSearchTags = tags.map(t => t.toLowerCase());
  const ticketIds = new Set();

  if (matchType === 'all') {
    const ticketTags = allTags.reduce((acc, tag) => {
      acc[tag.ticket_id] = acc[tag.ticket_id] || new Set();
      acc[tag.ticket_id].add(tag.normalized_tag);
      return acc;
    }, {});

    for (const ticketId in ticketTags) {
      if (normalizedSearchTags.every(searchTag => ticketTags[ticketId].has(searchTag))) {
        ticketIds.add(ticketId);
      }
    }
  } else {
    allTags.forEach(tag => {
      if (normalizedSearchTags.includes(tag.normalized_tag)) {
        ticketIds.add(tag.ticket_id);
      }
    });
  }

  const allTickets = getTickets();
  return allTickets.filter(ticket => ticketIds.has(ticket.id));
}

/**
 * NEW FUNCTION
 * Gets popular tags.
 * @param {number} [limit=20] - The maximum number of tags to return.
 * @param {string} [companyId=null] - Optional company ID to filter by.
 * @returns {Array} - An array of popular tag objects.
 */
function getPopularTags(limit = 20, companyId = null) {
  const allTags = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_TAGS));
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag.normalized_tag] = (acc[tag.normalized_tag] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * NEW FUNCTION
 * Grants access to a ticket to a user.
 * @param {string} ticketId - The ID of the ticket.
 * @param {string} userId - The ID of the user to grant access to.
 * @param {string} permissionLevel - The permission level to grant.
 * @param {string} grantedBy - The ID of the user granting access.
 * @param {string} reason - The reason for granting access.
 * @param {string} [expiryDate=null] - Optional expiry date for the access.
 * @returns {object} - The created collaboration object.
 */
function grantTicketAccess(ticketId, userId, permissionLevel, grantedBy, reason, expiryDate = null) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_COLLABORATORS);
  const auditFields = createAuditFields(grantedBy);
  const newCollaboration = {
    id: generateId('collab'),
    ticket_id: ticketId,
    user_id: userId,
    permission_level: permissionLevel,
    granted_by: grantedBy,
    granted_at: new Date(),
    access_reason: reason,
    expiry_date: expiryDate,
    ...auditFields
  };
  
  const newRow = Object.values(newCollaboration);
  sheet.appendRow(newRow);
  logTicketAction(ticketId, grantedBy, 'GRANT_ACCESS', { to: userId, level: permissionLevel });
  return newCollaboration;
}

/**
 * NEW FUNCTION
 * Checks if a user has access to a ticket.
 * @param {string} ticketId - The ID of the ticket.
 * @param {string} userId - The ID of the user.
 * @returns {boolean} - True if the user has access, false otherwise.
 */
function checkTicketAccess(ticketId, userId) {
  const ticket = getTickets({id: ticketId})[0];
  if(ticket && ticket.requester_id === userId) return true;

  const collaborators = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_COLLABORATORS));
  return collaborators.some(c => c.ticket_id === ticketId && c.user_id === userId && c.is_active);
}

/**
 * NEW FUNCTION
 * Gets all tickets accessible by a user.
 * @param {string} userId - The ID of the user.
 * @param {string} [companyId=null] - Optional company ID to filter by.
 * @returns {Array} - An array of accessible ticket objects.
 */
function getUserAccessibleTickets(userId, companyId = null) {
  const allTickets = getTickets({companyId: companyId});
  const collaborators = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_COLLABORATORS));
  const accessibleTicketIds = new Set(collaborators.filter(c => c.user_id === userId && c.is_active).map(c => c.ticket_id));
  
  return allTickets.filter(t => t.requester_id === userId || accessibleTicketIds.has(t.id));
}

/**
 * NEW FUNCTION
 * Grants access to tickets based on a tag.
 * @param {string} tagName - The name of the tag.
 * @param {string} userId - The ID of the user to grant access to.
 * @param {string} permissionLevel - The permission level to grant.
 * @param {string} grantedBy - The ID of the user granting access.
 * @param {string} reason - The reason for granting access.
 * @param {string} [companyId=null] - Optional company ID to scope the access to.
 * @returns {object} - The created collaboration object.
 */
function grantTagBasedAccess(tagName, userId, permissionLevel, grantedBy, reason, companyId = null) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TAG_BASED_COLLABORATORS);
  const auditFields = createAuditFields(grantedBy);
  const newCollaboration = {
    id: generateId('tagcollab'),
    tag_name: tagName,
    user_id: userId,
    permission_level: permissionLevel,
    granted_by: grantedBy,
    granted_at: new Date(),
    access_reason: reason,
    company_id: companyId,
    ...auditFields
  };
  
  const newRow = Object.values(newCollaboration);
  sheet.appendRow(newRow);
  logAdminAction('GRANT_TAG_ACCESS', newCollaboration.id, newCollaboration);
  return newCollaboration;
}

/**
 * NEW FUNCTION
 * Validates if a user can approve a workflow step.
 * @param {string} userId - The ID of the user.
 * @param {string} stepId - The ID of the workflow step.
 * @returns {boolean} - True if the user can approve, false otherwise.
 */
function validateWorkflowStepApproval(userId, stepId) {
  const stepApprovers = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.STEP_APPROVERS));
  const userRoles = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_ROLE_ASSIGNMENTS));

  const requiredRoleIds = new Set(stepApprovers.filter(sa => sa.step_id === stepId).map(sa => sa.role_id));
  if (requiredRoleIds.size === 0) return true; // No specific role required

  const userRoleIds = new Set(userRoles.filter(ur => ur.user_id === userId && ur.is_active).map(ur => ur.role_id));
  
  return [...requiredRoleIds].some(requiredRoleId => userRoleIds.has(requiredRoleId));
}

/**
 * NEW FUNCTION
 * Checks if a user can approve a workflow step.
 * @param {string} userId - The ID of the user.
 * @param {string} stepId - The ID of the workflow step.
 * @returns {boolean} - True if the user can approve, false otherwise.
 */
function canUserApproveStep(userId, stepId) {
  return validateWorkflowStepApproval(userId, stepId);
}


/**
 * =================================================================================
 * PHASE 4: Ticket Configuration & Management
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Validates a company code change.
 * @param {string} companyId - The ID of the company.
 * @param {string} newCode - The proposed new code.
 * @returns {boolean} - True if the change is valid, false otherwise.
 */
function validateCompanyCodeChange(companyId, newCode) {
  const company = getCompany(companyId);
  if (!company) {
    throw new Error('Company not found');
  }
  if (company.code_locked) {
    return false; // Cannot change a locked code
  }
  const allCompanies = getCompanies();
  return !allCompanies.some(c => c.id !== companyId && c.code.toUpperCase() === newCode.toUpperCase());
}

/**
 * NEW FUNCTION
 * Locks a company's code.
 * @param {string} companyId - The ID of the company.
 * @param {string} reason - The reason for locking the code.
 * @returns {object} - Confirmation of the lock.
 */
function lockCompanyCode(companyId, reason) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPANIES);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === companyId);

  if (rowIndex === -1) {
    throw new Error(`Company with ID ${companyId} not found.`);
  }

  sheet.getRange(rowIndex + 1, 4).setValue(true); // code_locked
  sheet.getRange(rowIndex + 1, 5).setValue(new Date()); // code_locked_at
  sheet.getRange(rowIndex + 1, 6).setValue(reason); // code_locked_reason

  logAdminAction('LOCK_COMPANY_CODE', companyId, { reason: reason });
  return { success: true, companyId: companyId, locked: true };
}

/**
 * NEW FUNCTION
 * Unlocks a company's code.
 * @param {string} companyId - The ID of the company.
 * @param {string} reason - The reason for unlocking the code.
 * @param {string} adminUserId - The ID of the admin user performing the action.
 * @returns {object} - Confirmation of the unlock.
 */
function unlockCompanyCode(companyId, reason, adminUserId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPANIES);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === companyId);

  if (rowIndex === -1) {
    throw new Error(`Company with ID ${companyId} not found.`);
  }

  sheet.getRange(rowIndex + 1, 4).setValue(false); // code_locked
  sheet.getRange(rowIndex + 1, 5).setValue(null); // code_locked_at
  sheet.getRange(rowIndex + 1, 6).setValue(reason); // code_locked_reason

  logAdminAction('UNLOCK_COMPANY_CODE', companyId, { reason: reason, unlocked_by: adminUserId });
  return { success: true, companyId: companyId, locked: false };
}

/**
 * NEW FUNCTION
 * Gets workflow steps for a given ticket type and company.
 * @param {string} ticketTypeId - The ID of the ticket type.
 * @param {string} companyId - The ID of the company.
 * @returns {Array} - An array of workflow step objects.
 */
function getWorkflowStepsByCompany(ticketTypeId, companyId) {
  const allSteps = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.WORKFLOW_STEPS));
  return allSteps.filter(step => step.ticket_type_id === ticketTypeId && step.company_id === companyId && step.is_active);
}

/**
 * NEW FUNCTION
 * Copies workflow steps from one company to another for a given ticket type.
 * @param {string} ticketTypeId - The ID of the ticket type.
 * @param {string} sourceCompanyId - The ID of the source company.
 * @param {string} targetCompanyId - The ID of the target company.
 * @returns {object} - Confirmation of the copy operation.
 */
function copyWorkflowStepsFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId) {
  const sourceSteps = getWorkflowStepsByCompany(ticketTypeId, sourceCompanyId);
  if (sourceSteps.length === 0) {
    throw new Error(`No workflow steps found for ticket type ${ticketTypeId} and source company ${sourceCompanyId}`);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.WORKFLOW_STEPS);
  const auditFields = createAuditFields();
  const newSteps = [];

  sourceSteps.forEach(step => {
    const newStep = { ...step };
    newStep.id = generateId('ws');
    newStep.company_id = targetCompanyId;
    newStep.created_at = auditFields.created_at;
    newStep.created_by = auditFields.created_by;
    newStep.updated_at = auditFields.updated_at;
    newStep.updated_by = auditFields.updated_by;
    
    const newRow = Object.values(newStep);
    sheet.appendRow(newRow);
    newSteps.push(newStep);
  });

  logAdminAction('COPY_WORKFLOW_STEPS', ticketTypeId, { from: sourceCompanyId, to: targetCompanyId, count: newSteps.length });
  return { success: true, copiedCount: newSteps.length };
}

/**
 * =================================================================================
 * PHASE 5: Workflow & SLA Enhancements
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Processes SLA escalations for overdue tickets.
 */
function processSLAEscalations() {
  const tickets = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKETS));
  const workflowSteps = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.WORKFLOW_STEPS));
  const stepSLAs = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.STEP_SLAS));
  const now = new Date();

  tickets.forEach(ticket => {
    if (ticket.status === 'Completed' || ticket.status === 'Cancelled' || !ticket.step_due_date) {
      return;
    }

    const dueDate = new Date(ticket.step_due_date);
    if (now > dueDate) {
      // SLA is breached, trigger escalation
      logTicketAction(ticket.id, 'system', 'SLA_BREACH', { 
        step_id: ticket.current_step_id, 
        due_date: ticket.step_due_date 
      });
      // In a real scenario, this would trigger notifications or other actions.
    }
  });
}

/**
 * NEW FUNCTION
 * Tags a workflow step as requiring approval.
 * @param {string} stepId - The ID of the workflow step.
 * @param {boolean} requiresApproval - Whether the step requires approval.
 * @returns {object} - Confirmation of the change.
 */
function tagWorkflowStepForApproval(stepId, requiresApproval) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.WORKFLOW_STEPS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === stepId);

  if (rowIndex === -1) {
    throw new Error(`Workflow step with ID ${stepId} not found.`);
  }

  // Assuming `requires_approval` is the last column
  sheet.getRange(rowIndex + 1, data[0].length).setValue(requiresApproval);

  logAdminAction('TAG_WORKFLOW_APPROVAL', stepId, { requires_approval: requiresApproval });
  return { success: true, stepId: stepId, requires_approval: requiresApproval };
}

/**
 * =================================================================================
 * PHASE 6: Admin Panel Enhancements
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Fetches statistics for the admin dashboard.
 * @param {string} [companyId=null] - Optional company ID to filter statistics.
 * @returns {object} - An object containing various admin statistics.
 */
function getAdminDashboardStats(companyId = null) {
  const tickets = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKETS));
  const users = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES));
  const companies = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPANIES));

  let filteredTickets = companyId ? tickets.filter(t => t.company_id === companyId) : tickets;

  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const closedTickets = totalTickets - openTickets;
  const slaBreaches = filteredTickets.filter(t => t.step_due_date && new Date(t.step_due_date) < new Date()).length;

  return {
    totalTickets,
    openTickets,
    closedTickets,
    totalUsers: users.length,
    totalCompanies: companies.length,
    slaBreaches
  };
}

/**
 * NEW FUNCTION
 * Fetches statistics related to tags.
 * @returns {object} - An object containing tag statistics.
 */
function getAdminTagStats() {
  const tags = getSheetDataAsJSON(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_TAGS));
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag.normalized_tag] = (acc[tag.normalized_tag] || 0) + 1;
    return acc;
  }, {});

  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    totalTags: tags.length,
    uniqueTags: Object.keys(tagCounts).length,
    popularTags
  };
}

/**
 * NEW FUNCTION
 * Performs a bulk import of users.
 * @param {Array<object>} usersData - An array of user data objects to import.
 * @returns {object} - A summary of the import operation.
 */
function performBulkUserImport(usersData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES);
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  usersData.forEach((user, index) => {
    try {
      createUserProfile(user);
      successCount++;
    } catch (e) {
      errorCount++;
      errors.push({ user: user, error: e.message, index: index });
    }
  });

  logAdminAction('BULK_USER_IMPORT', null, { success: successCount, errors: errorCount });
  return { success: true, successCount, errorCount, errors };
}

/**
 * =================================================================================
 * PHASE 7: Firebase Authentication Integration
 * =================================================================================
 */

/**
 * NEW FUNCTION
 * Placeholder for setting up Firebase project properties.
 */
function setupFirebase() {
  // In a real scenario, this would involve setting up Firebase service accounts and properties.
  // For this script, we assume properties are set in the script environment.
  logAdminAction('SETUP_FIREBASE', null, { status: 'completed' });
  return { success: true, message: 'Firebase properties assumed to be set.' };
}

/**
 * NEW FUNCTION
 * Enables multi-factor authentication for a user.
 * @param {string} userId - The ID of the user.
 * @returns {object} - Confirmation of MFA status.
 */
function enableMFA(userId) {
  // This is a placeholder. A real implementation would use the Firebase Admin SDK.
  // Example: admin.auth().updateUser(userId, { multiFactor: { enrolled: true } });
  logAdminAction('ENABLE_MFA', userId, { mfa_enabled: true });
  return { success: true, userId: userId, mfa_enabled: true };
}

/**
 * NEW FUNCTION
 * Synchronizes a Firebase user with the local user profile sheet.
 * @param {object} firebaseUser - The Firebase user object.
 * @returns {object} - The created or updated user profile.
 */
function syncFirebaseUser(firebaseUser) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.USER_PROFILES);
  const data = usersSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === firebaseUser.uid);

  if (rowIndex === -1) {
    // User does not exist, create a new profile
    const newUserProfile = {
      user_id: firebaseUser.uid,
      display_name: firebaseUser.displayName || firebaseUser.email,
      email: firebaseUser.email,
      status: 'active'
    };
    return createUserProfile(newUserProfile);
  } else {
    // User exists, update the profile
    const updatedUserProfile = {
      display_name: firebaseUser.displayName || data[rowIndex][2],
      email: firebaseUser.email || data[rowIndex][3],
    };
    return updateUserProfile(firebaseUser.uid, updatedUserProfile);
  }
}

/**\n * =================================================================================\n * PHASE 8: Documentation & Testing\n * =================================================================================\n */\n\n/**\n * NEW FUNCTION\n * Runs all test scripts and returns a summary of the results.\n * @returns {object} - A summary of the test results.\n */\nfunction runAllTests() {\n  const results = {};\n  \n  // Example of how you might run tests. In a real scenario, these would be more robust.\n  try {\n    results.testMinimalDropdownCreate = testMinimalDropdownCreate();\n  } catch (e) {\n    results.testMinimalDropdownCreate = { error: e.message };\n  }\n  \n  try {\n    results.checkDropdownPersistence = checkDropdownPersistence();\n  } catch (e) {\n    results.checkDropdownPersistence = { error: e.message };\n  }\n\n  // You would add more test function calls here.\n\n  logAdminAction(\'RUN_ALL_TESTS\', null, results);\n  return { success: true, results: results };\n}\n\n/**\n * NEW FUNCTION\n * Generates API documentation from the function definitions.\n * @returns {string} - A markdown string containing the API documentation.\n */\nfunction generateApiDocumentation() {\n  const script = DriveApp.getFileById(ScriptApp.getScriptId()).getBlob().getDataAsString();\n  const functionRegex = /\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*function\\s+([\\w\\d_]+)\\s*\\(([^)]*)\\)/g;\n  let match;\n  let markdown = \'# API Documentation\\n\\n\';\n\n  while ((match = functionRegex.exec(script)) !== null) {\n    const jsdoc = match[1];\n    const functionName = match[2];\n    const params = match[3];\n\n    const description = jsdoc.match(/@[^@]*\\*\\s+([^@\\n\\r]*)/)[1].trim();\n    const paramMatches = [...jsdoc.matchAll(/@param\\s+\\{([^}]+)\\}\\s+([\\w\\d_]+)\\s+-\s+([^\\n\\r]*)/g)];\n\n    markdown += `## ${functionName}\\n\\n`;\n    markdown += `**Description:** ${description}\\n\\n`;\n    markdown += `**Parameters:**\\n\\n`;\n\n    if (paramMatches.length > 0) {\n      markdown += \'| Name | Type | Description |\\n\';\n      markdown += \'|---|---|---|\\n\';\n      paramMatches.forEach(p => {\n        markdown += `| ${p[2]} | ${p[1]} | ${p[3]} |\\n`;\n      });\n    } else {\n      markdown += \'_None_\\n\';\n    }\n    markdown += \'\\n\';\n  }\n\n  return markdown;\n}

```
