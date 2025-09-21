# Implementation Todo Plan
## Copy-Based Multi-Company System & Company Code Locking

**Generated:** September 21, 2025
**System Status:** Phase 8.5 Complete - Ready for Phase 8.6/8.7 Implementation

---

## 📋 IMMEDIATE NEXT STEPS (Priority Order)

### **🔴 PHASE 8.6: Company Code Locking (URGENT - Week 1)**

#### **Backend/Database Tasks:**
- [ ] **Add locking columns to companies table in Google Sheets**
  - [ ] Add `code_locked` (boolean) column
  - [ ] Add `code_locked_at` (timestamp) column
  - [ ] Add `code_locked_reason` (string) column
  - [ ] Add `ticket_count` (number) column
  - [ ] Initialize existing companies with `code_locked: false`, others as null

#### **Apps Script API Tasks:**
- [ ] **Create company locking API endpoints**
  - [ ] `API.Companies.lock(id, reason)` - Lock company code
  - [ ] `API.Companies.unlock(id, reason)` - Admin override unlock
  - [ ] `API.Companies.checkLockStatus(id)` - Get lock status
- [ ] **Update existing API endpoints**
  - [ ] Modify `Companies.update()` to validate lock status before code changes
  - [ ] Add auto-lock trigger in `Tickets.create()` when first ticket created
  - [ ] Update `Companies.getAll()` to include lock status fields

#### **Frontend Tasks:**
- [ ] **Update AdminCompanyManager component**
  - [ ] Display lock status icon/badge next to company code
  - [ ] Disable code input field when company is locked
  - [ ] Add lock status tooltip with lock reason and timestamp
  - [ ] Add admin unlock button with confirmation dialog
- [ ] **Add validation and user feedback**
  - [ ] Warning message when attempting to edit locked company code
  - [ ] Success/error messages for lock/unlock operations
  - [ ] Visual indicators for locked vs unlocked companies

#### **Testing Tasks:**
- [ ] Test company code locking triggers on first ticket creation
- [ ] Test admin unlock functionality with proper authorization
- [ ] Verify locked companies cannot have codes modified
- [ ] Test lock status display and user feedback messages

---

### **🟡 PHASE 8.7: Copy-Based Multi-Company Workflows (Week 2-3)**

#### **Database Schema Tasks:**
- [ ] **Add company_id to workflow_steps table**
  - [ ] Add `company_id` column to `workflow_steps` table
  - [ ] Make `company_id` a REQUIRED field (no null values)
  - [ ] Create migration plan for existing workflow steps
  - [ ] Update validation constraints for (ticket_type_id, company_id, sort_order) uniqueness

#### **Data Migration Tasks:**
- [ ] **Handle existing workflow steps**
  - [ ] Identify all existing workflow steps without company_id
  - [ ] Create migration strategy (assign to default company OR require recreation)
  - [ ] Execute migration with data backup
  - [ ] Verify all workflow steps have valid company_id after migration

#### **Apps Script API Tasks:**
- [ ] **Create workflow copying endpoints**
  - [ ] `API.WorkflowSteps.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`
  - [ ] `API.StepSLAs.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`
  - [ ] `API.StepApprovers.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`
- [ ] **Update workflow query methods**
  - [ ] Modify `WorkflowSteps.getAll()` to filter by company_id
  - [ ] Add `WorkflowSteps.getByCompany(ticketTypeId, companyId)`
  - [ ] Update all workflow-related APIs to require company_id parameter
- [ ] **Add workflow validation**
  - [ ] Validate company_id is provided for all workflow operations
  - [ ] Throw error if no workflow found for ticket_type + company combination
  - [ ] Add company existence validation

#### **Frontend UI Tasks:**
- [ ] **Create workflow assignment interface**
  - [ ] Company selector for workflow configuration
  - [ ] "Copy from existing company" option with dropdown
  - [ ] Checkboxes for what to copy (workflows, SLAs, approvers)
  - [ ] Preview of source company's workflow before copying
- [ ] **Update existing workflow components**
  - [ ] Add company context to all workflow management interfaces
  - [ ] Update ConditionalWorkflowBuilder to work with company-specific workflows
  - [ ] Modify workflow step creation to require company selection
- [ ] **Add workflow copying UI**
  - [ ] Source company selection dropdown
  - [ ] Copy confirmation dialog with details
  - [ ] Progress indicator for copying operations
  - [ ] Success/error feedback for copy operations

#### **Integration Tasks:**
- [ ] **Update ticket creation flow**
  - [ ] Ensure ticket creation validates workflow exists for company
  - [ ] Update workflow progression to use company-specific steps
  - [ ] Modify SLA calculations to use company-specific settings
- [ ] **Update admin workflow management**
  - [ ] Add company filter to workflow management interfaces
  - [ ] Update workflow builder to create company-specific steps
  - [ ] Ensure approver assignments work with company context

---

### **🟡 PHASE 8.8: Enhanced Validation & Data Quality (Week 4)**

#### **Ticket Type Duplicate Prevention Tasks:**
- [ ] **Frontend validation updates**
  - [ ] Add case-insensitive duplicate checking to AdminTicketTypeCreatePage
  - [ ] Implement real-time validation on name field changes
  - [ ] Block save button when duplicates detected
  - [ ] Show clear error messages with existing ticket type name
- [ ] **Backend validation updates**
  - [ ] Add duplicate validation to Google Apps Script TicketTypes.create()
  - [ ] Add duplicate validation to TicketTypes.update()
  - [ ] Return appropriate error messages for duplicates
- [ ] **Testing tasks**
  - [ ] Test various case combinations (uppercase, lowercase, mixed)
  - [ ] Test edit scenarios (exclude self from duplicate check)
  - [ ] Test error message display and clearing
  - [ ] Verify save/activation blocking works correctly

#### **Dropdown Lists Per-Company Tasks:**
- [ ] **Database schema updates**
  - [ ] Add `company_id` column to `dropdown_lists` table
  - [ ] Make `company_id` required field for new dropdown lists
  - [ ] Migrate existing dropdown lists (assign to all companies OR specific company)
- [ ] **Frontend UI updates**
  - [ ] Add company selector to dropdown list management
  - [ ] Update AdminDropdownManager with company context
  - [ ] Add dropdown copying interface between companies
- [ ] **API updates**
  - [ ] Modify DropdownLists.getAll() to filter by company
  - [ ] Add DropdownLists.copyFromCompany() method
  - [ ] Update validation to check company-specific dropdown uniqueness

#### **Ticket Type Uniqueness Fix Tasks:**
- [ ] **Validation logic updates**
  - [ ] Fix transaction_id uniqueness to be company-scoped instead of global
  - [ ] Fix code uniqueness to be company-scoped instead of global
  - [ ] Update AdminTicketTypeCreatePage validation logic
- [ ] **Backend validation updates**
  - [ ] Update Google Apps Script validation to scope by company
  - [ ] Allow same transaction_id/code across different companies

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### **Database Schema Updates Required:**

**companies table:**
```
id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count
```

**workflow_steps table:**
```
id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name
```

**dropdown_lists table (ENHANCED):**
```
id|name|company_id
```

### **New API Methods Required:**

**Company Locking:**
- `Companies.lock(id, reason)`
- `Companies.unlock(id, reason)`
- `Companies.checkLockStatus(id)`

**Workflow Copying:**
- `WorkflowSteps.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`
- `WorkflowSteps.getByCompany(ticketTypeId, companyId)`
- `StepSLAs.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`
- `StepApprovers.copyFromCompany(ticketTypeId, sourceCompanyId, targetCompanyId)`

**Validation & Data Quality:**
- `TicketTypes.validateNameUniqueness(name, companyId, excludeId)`
- `DropdownLists.getByCompany(companyId)`
- `DropdownLists.copyFromCompany(sourceCompanyId, targetCompanyId)`

### **Frontend Components to Update:**

**Phase 8.6:**
- `AdminCompanyManager.js` - Add lock status and controls
- `AdminPage.js` - Update company management integration

**Phase 8.7:**
- `ConditionalWorkflowBuilder.js` - Add company context
- `AdminTicketTypeManager.js` - Add workflow copying interface
- Create new: `WorkflowCopyDialog.js` - Copy workflow interface
- Create new: `CompanyWorkflowSelector.js` - Company selection for workflows

**Phase 8.8:**
- `AdminTicketTypeCreatePage.js` - Add duplicate validation and uniqueness fixes
- `AdminDropdownManager.js` - Add company context and copying interface
- Create new: `DropdownCopyDialog.js` - Copy dropdown lists interface

---

## ⚠️ CRITICAL CONSIDERATIONS

### **Data Migration Risks:**
1. **Existing Workflows**: All existing `workflow_steps` need company assignment
2. **Breaking Changes**: Adding required `company_id` field breaks existing queries
3. **User Impact**: Companies without workflows cannot create tickets

### **Testing Priorities:**
1. **Company Code Locking**: Prevent data integrity issues with ticket numbering
2. **Workflow Migration**: Ensure existing workflows continue to work
3. **Copy Operations**: Verify complete copying of workflows, SLAs, and approvers
4. **Cross-Company Independence**: Ensure workflow changes don't affect other companies

### **Rollback Plan:**
1. **Database Backup**: Full backup before schema changes
2. **Feature Flags**: Ability to disable new features if issues arise
3. **Migration Reversal**: Plan to remove new columns if needed
4. **API Versioning**: Maintain backward compatibility during transition

---

## 📊 SUCCESS METRICS

### **Phase 8.6 Success Criteria:**
- [ ] ✅ Company codes automatically lock after first ticket creation
- [ ] ✅ Locked company codes cannot be modified without admin override
- [ ] ✅ Lock status clearly visible in admin interface
- [ ] ✅ Admin unlock functionality works with proper authorization

### **Phase 8.7 Success Criteria:**
- [ ] ✅ All workflow steps assigned to specific companies
- [ ] ✅ Companies can copy workflows from other companies
- [ ] ✅ Workflow modifications are independent between companies
- [ ] ✅ No default/fallback workflows - explicit assignment required
- [ ] ✅ Complete copying of workflows, SLAs, and approver assignments

### **Overall System Benefits:**
- [ ] ✅ Data integrity protection for ticket numbering
- [ ] ✅ Reduced setup time for new companies (copy vs recreate)
- [ ] ✅ Independent workflow customization per company
- [ ] ✅ Clear ownership model for workflows and configurations

---

## 🚀 IMPLEMENTATION TIMELINE

**Week 1 (Phase 8.6):**
- Days 1-2: Database schema updates and Apps Script API
- Days 3-4: Frontend UI updates and integration
- Day 5: Testing and bug fixes

**Week 2-3 (Phase 8.7):**
- Days 1-2: Database schema updates and migration
- Days 3-5: Apps Script copying APIs and validation
- Days 6-8: Frontend workflow copying interface
- Days 9-10: Integration testing and bug fixes

**Week 4 (Phase 8.8):**
- Days 1-2: Ticket type duplicate prevention (frontend + backend)
- Days 3-4: Dropdown lists per-company implementation
- Day 5: Ticket type uniqueness validation fixes

**Total Estimated Effort:** 46-60 hours over 3-4 weeks
**Risk Level:** Medium (schema changes require careful migration)
**Dependencies:** Stable company code locking before workflow copying implementation

---

*This implementation plan provides a comprehensive roadmap for implementing the copy-based multi-company system with company code locking, ensuring data integrity and operational efficiency.*