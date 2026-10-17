# External App Integration - Phase 7 Implementation

## 📋 **Overview**

**Status**: 🎯 **PHASE 7 TARGET** - Core Workflow Feature
**Implementation Phase**: Phase 7 - Workflow Engine & Business Logic
**Complexity**: Medium - Core workflow step functionality
**Type**: **Manual Task-based Workflow Pausing**

External App Integration allows workflow steps to be configured as manual tasks that link to external applications. The workflow pauses until the user completes the external task and manually marks it as complete in the system.

---

## 🔄 **Integration vs Extensions Framework**

### **Two Different Integration Types:**

| Feature | External App Integration (Phase 7) | Extensions Framework (Phase 8+) |
|---------|-----------------------------------|----------------------------------|
| **Type** | Manual task completion | Automated API execution |
| **Workflow** | **Pauses** until user completion | **Continues** after API call |
| **User Action** | Navigate to external app → complete → return | No user action required |
| **Implementation** | `workflow_steps.step_type: 'task'` | Hook-based extension system |
| **Availability** | Any workflow step (not creation) | Any hook point including creation |
| **Database Fields** | `external_app_url`, `completion_action_name` | Complex extension configuration |
| **Use Cases** | Manual approvals, external forms | Automated notifications, data sync |
| **Complexity** | Simple - URL + completion button | Complex - Full API framework |

### **Complementary Purpose:**
- **External Apps**: Human tasks that require manual interaction in external systems
- **Extensions**: Background automation and system-to-system integration

---

## 🏗️ **Database Schema**

### **`workflow_steps` Table Fields:**
```
id                     - Step identifier
ticket_type_id         - Associated ticket type
name                   - Step display name
status_on_reach        - Ticket status when reaching this step
step_type              - 'approval' OR 'task' (task for external apps)
approver_logic         - 'any' or 'all' (not applicable for tasks)
sort_order             - Step sequence order
next_ticket_type_id    - For chained workflows
external_app_url       - URL to external application (for step_type: 'task')
completion_action_name - Button text for completion action
```

### **Key Configuration:**
- `step_type: 'task'` - Identifies external app integration step
- `external_app_url` - URL where user performs the external task
- `completion_action_name` - Text for the completion button (e.g., "Mark Task Complete")

---

## 🔧 **Implementation Details**

### **1. Admin Configuration**

**Workflow Step Setup:**
```javascript
// Admin configures workflow step
{
  id: "ext_task_001",
  ticket_type_id: "purchase_request",
  name: "Finance System Approval",
  status_on_reach: "pending_finance_review",
  step_type: "task",
  sort_order: 3,
  external_app_url: "https://finance.company.com/approvals/{ticket_id}",
  completion_action_name: "Mark Finance Review Complete"
}
```

### **2. Workflow Engine Logic**

**When ticket reaches external app step:**
1. Ticket status changes to `status_on_reach`
2. Current step becomes the external app task
3. Workflow progression **PAUSES**
4. User sees external app link and completion button

**User Workflow:**
1. Click external app URL (opens in new tab/window)
2. Complete task in external system
3. Return to ticket system
4. Click completion action button
5. Workflow resumes to next step

### **3. Frontend Components**

#### **External App Step Display:**
```javascript
// In TicketDetail.js workflow actions
{currentStep?.step_type === 'task' && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 className="font-medium text-blue-900">External Task Required</h3>
    <p className="text-blue-700 mb-4">{currentStep.name}</p>

    <div className="flex gap-3">
      <a
        href={currentStep.external_app_url?.replace('{ticket_id}', ticket.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        Open External App
      </a>

      <button
        onClick={() => handleCompleteExternalTask()}
        className="btn-success"
      >
        {currentStep.completion_action_name || 'Mark Task Complete'}
      </button>
    </div>
  </div>
)}
```

#### **Admin Workflow Step Configuration:**
```javascript
// In AdminWorkflowManager.js
<div className="step-config">
  <select name="step_type" onChange={handleStepTypeChange}>
    <option value="approval">Approval Step</option>
    <option value="task">External Task</option>
  </select>

  {formData.step_type === 'task' && (
    <>
      <input
        type="url"
        name="external_app_url"
        placeholder="External App URL (use {ticket_id} for dynamic ID)"
        value={formData.external_app_url}
        onChange={handleInputChange}
      />

      <input
        type="text"
        name="completion_action_name"
        placeholder="Completion Button Text"
        value={formData.completion_action_name}
        onChange={handleInputChange}
      />
    </>
  )}
</div>
```

---

## 🎯 **Use Cases**

### **1. Finance System Integration**
- **Step**: "Finance Department Review"
- **External App**: Finance ERP system approval workflow
- **User Action**: Review budget, check accounts, approve/reject in finance system
- **Completion**: Return to ticket system, mark finance review complete

### **2. Legal Document Review**
- **Step**: "Legal Compliance Check"
- **External App**: Document management system
- **User Action**: Review contracts, check compliance in legal system
- **Completion**: Mark legal review complete

### **3. Quality Assurance Testing**
- **Step**: "QA Testing Required"
- **External App**: Testing management platform
- **User Action**: Execute test plans, record results in QA system
- **Completion**: Mark testing complete

### **4. Customer Approval Portal**
- **Step**: "Customer Sign-off Required"
- **External App**: Customer portal for approvals
- **User Action**: Customer reviews and approves in their portal
- **Completion**: Sales rep marks customer approval complete

---

## 🔍 **Workflow Availability**

### **✅ Available Locations:**
- **Any Workflow Step**: Between creation and final approval
- **Final Approval Step**: Can be external task instead of internal approval
- **Multiple Steps**: Multiple external tasks in single workflow
- **Conditional Steps**: External tasks can have step conditions

### **❌ Not Available:**
- **Ticket Creation**: No workflow step exists at creation
- **Pre-Creation**: Cannot integrate before ticket exists

### **Integration Points:**
```
Ticket Created → [Approval Step 1] → [External Task] → [Approval Step 2] → [Final External Task] → Complete
                      ↓                    ↓                    ↓                     ↓
                   Internal           Workflow           Internal            Workflow
                   Approval           PAUSES             Approval            PAUSES
                                      ↓                                      ↓
                               External System                        External System
```

---

## 🔧 **Technical Implementation**

### **Backend (Apps Script) Changes:**

#### **1. Workflow Step Validation:**
```javascript
function validateWorkflowStep(stepData) {
  if (stepData.step_type === 'task') {
    if (!stepData.external_app_url) {
      throw new Error('External app URL required for task steps');
    }
    if (!stepData.completion_action_name) {
      stepData.completion_action_name = 'Mark Task Complete';
    }
  }
  return stepData;
}
```

#### **2. External Task Completion:**
```javascript
function completeExternalTask(ticketId, stepId, userId, comment) {
  const ticket = getTicket(ticketId);
  const currentStep = getCurrentWorkflowStep(ticket);

  if (currentStep.id !== stepId || currentStep.step_type !== 'task') {
    throw new Error('Invalid external task completion');
  }

  // Log the completion action
  logTicketAction(ticketId, userId, 'external_task_completed', {
    step_name: currentStep.name,
    comment: comment
  });

  // Move to next workflow step
  return advanceWorkflowStep(ticketId, userId);
}
```

#### **3. URL Template Processing:**
```javascript
function processExternalAppUrl(template, ticket) {
  return template
    .replace('{ticket_id}', ticket.id)
    .replace('{ticket_number}', ticket.ticket_number)
    .replace('{company_id}', ticket.company_id)
    .replace('{requester_id}', ticket.requester_id);
}
```

### **Frontend Changes:**

#### **1. Workflow Action Detection:**
```javascript
// In TicketDetail.js
const isExternalTask = currentStep?.step_type === 'task';
const hasExternalUrl = currentStep?.external_app_url;

const handleCompleteExternalTask = async () => {
  try {
    await ticketAPI.completeExternalTask(ticket.id, currentStep.id, user.id, comment);
    toast.success('External task marked complete');
    refreshTicket();
  } catch (error) {
    toast.error('Failed to complete external task');
  }
};
```

#### **2. External App URL Processing:**
```javascript
const getExternalAppUrl = (template, ticket) => {
  if (!template) return '';

  return template
    .replace('{ticket_id}', ticket.id)
    .replace('{ticket_number}', ticket.ticket_number)
    .replace('{company_id}', ticket.company_id);
};
```

---

## 🚀 **Implementation Timeline**

### **Phase 7A: Database & Backend (1 week)**
- [ ] Update workflow_steps schema with external app fields
- [ ] Implement external task completion API endpoint
- [ ] Add URL template processing
- [ ] Update workflow progression logic

### **Phase 7B: Frontend Integration (1 week)**
- [ ] Add external task detection to TicketDetail
- [ ] Implement external app link rendering
- [ ] Add completion action button
- [ ] Update workflow status display

### **Phase 7C: Admin Configuration (1 week)**
- [ ] Add external app step configuration in AdminWorkflowManager
- [ ] Implement step type selection (approval/task)
- [ ] Add external URL and completion text fields
- [ ] Validation and testing interface

### **Phase 7D: Testing & Polish (0.5 weeks)**
- [ ] End-to-end workflow testing
- [ ] External app URL validation
- [ ] Error handling and edge cases
- [ ] Documentation and help text

**Total Implementation**: 3.5 weeks

---

## 🔒 **Security Considerations**

### **External URL Validation:**
- Validate URLs are HTTPS only (production)
- Prevent javascript: and data: URLs
- Sanitize template parameters
- Log external app access for audit

### **Access Control:**
- Only authorized users can complete external tasks
- Audit logging of external task completions
- RBAC permissions for external task steps
- Company-specific external app restrictions

### **URL Template Security:**
```javascript
// Safe URL template processing
function sanitizeExternalUrl(template, ticket) {
  // Validate base URL is approved domain
  const baseUrl = template.split('?')[0].split('{')[0];
  if (!isApprovedDomain(baseUrl)) {
    throw new Error('External app domain not approved');
  }

  // Sanitize template parameters
  const sanitizedParams = {
    ticket_id: sanitizeId(ticket.id),
    ticket_number: sanitizeString(ticket.ticket_number),
    company_id: sanitizeId(ticket.company_id)
  };

  return processTemplate(template, sanitizedParams);
}
```

---

## 📋 **Testing Strategy**

### **Unit Tests:**
- External URL template processing
- Workflow step validation
- External task completion logic
- Security sanitization

### **Integration Tests:**
- External app workflow progression
- Multi-step workflows with external tasks
- Error handling and recovery
- Permission validation

### **User Acceptance Tests:**
- Admin configuration workflow
- User external task completion
- External app integration scenarios
- Mobile responsiveness

---

## 📊 **Success Metrics**

### **Technical Metrics:**
- [ ] 100% external app URL processing accuracy
- [ ] Zero security vulnerabilities in URL handling
- [ ] Sub-200ms external task completion response
- [ ] 99%+ workflow progression reliability

### **Business Metrics:**
- [ ] Reduced manual workflow coordination
- [ ] Improved external system integration
- [ ] Enhanced audit trail completeness
- [ ] User satisfaction with external task flow

---

## 🔮 **Future Enhancements**

### **Advanced Features:**
- **Callback Integration**: External systems can automatically mark tasks complete
- **Status Synchronization**: Real-time status updates from external systems
- **Data Exchange**: Pass data between ticket system and external apps
- **Timeout Handling**: Automatic escalation for overdue external tasks

### **Integration with Extensions Framework:**
- External apps can trigger automated extension execution
- Extensions can prepare data for external app integration
- Combined manual + automated workflow scenarios

---

**Status**: 📋 **READY FOR PHASE 7 IMPLEMENTATION**
**Last Updated**: September 16, 2025
**Next Steps**: Begin Phase 7A - Database & Backend Implementation

*This specification provides the complete implementation plan for manual external app integration as part of the core workflow engine, distinct from the automated Extensions Framework planned for future phases.*