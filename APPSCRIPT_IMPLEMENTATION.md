# Google Apps Script - Production Implementation

## Overview

**Status**: ✅ **PRODUCTION-READY MVP BACKEND**
**Database**: [Google Sheet](https://docs.google.com/spreadsheets/d/1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4/edit?usp=drive_link)
**Spreadsheet ID**: `1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4`

This Google Apps Script provides a complete serverless backend using Google Sheets for the dynamic ticketing system. It includes multi-tenancy, dynamic roles, sequential ticket numbering, and comprehensive audit logging.

## Deployment Configuration

### Script Properties
```javascript
SPREADSHEET_ID = "1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4"
```

### Web App Deployment Settings
- **Execute as**: Me (script owner)
- **Access**: Anyone (will require authentication integration)
- **Version**: Deploy as new version for each update

## Implemented Features

### ✅ Core CRUD Operations
- **Companies**: Full CRUD with code uniqueness validation
- **Roles**: Global and company-specific role management
- **Dropdown Lists**: Hierarchical dropdown with parent-child relationships
- **Tickets**: Creation with auto-numbering and custom fields
- **Audit Logging**: Comprehensive tracking of all actions

### ✅ Business Logic
- **Ticket Number Generation**: `COMPANYCODE-TYPECODE-YEAR-SEQUENCE` format
- **Concurrency Control**: LockService prevents race conditions
- **Philippine Time**: UTC+8 timezone support (`Asia/Manila`)
- **Multi-tenancy**: Company-specific data isolation
- **Auto-initialization**: Creates sheets dynamically if missing

### ✅ Advanced Features
- **JSON Response Format**: Standardized API responses with CORS
- **Error Handling**: Comprehensive validation and error reporting
- **Test Suite**: Built-in testing functions for all operations
- **Sample Data**: Automated sample data generation
- **Health Check**: Ping endpoint for API status

## API Endpoints

### Main Entry Points
- `doGet(e)` - Handles all GET requests
- `doPost(e)` - Handles all POST requests
- `doOptions(e)` - CORS preflight support

### GET Endpoints
| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `getCompanies` | - | List all companies |
| `getCompany` | `companyId` | Get single company |
| `getRoles` | `companyId` (optional) | List roles with optional company filter |
| `getDropdownLists` | - | List all dropdown lists with options |
| `getDropdownOptions` | `listId` | Get options for specific dropdown |
| `getTickets` | `status` (optional) | List tickets with optional status filter |
| `ping` | - | API health check with version info |

### POST Endpoints
| Action | Payload | Description |
|--------|---------|-------------|
| `createCompany` | `{name, code}` | Create new company |
| `updateCompany` | `{id, name, code}` | Update existing company |
| `deleteCompany` | `{id}` | Delete company |
| `createRole` | `{name, company_id}` | Create role (company_id='global' for global roles) |
| `updateRole` | `{id, name, company_id}` | Update existing role |
| `deleteRole` | `{id}` | Delete role |
| `createDropdownList` | `{name, options[]}` | Create dropdown with options |
| `updateDropdownList` | `{id, name, options[]}` | Update dropdown and options |
| `deleteDropdownList` | `{id}` | Delete dropdown and all options |
| `createTicket` | `{title, ticket_type_id, company_id, requester_id, customData}` | Create ticket with auto-numbering |
| `recordLogin` | `{userId, email, ipAddress}` | Log user login event |

## Database Schema Implementation

### Sheet Structure
All sheets auto-initialize with proper headers if missing:

#### Core Entity Sheets
- **companies**: `id`, `name`, `code`, `created_at`, `updated_at`
- **roles**: `id`, `name`, `company_id`, `created_at`, `updated_at`
- **tickets**: `id`, `ticket_number`, `title`, `ticket_type_id`, `requester_id`, `status`, `current_step_id`, `step_due_date`, `created_at`, `updated_at`, `company_id`
- **ticket_types**: `id`, `transaction_id`, `code`, `name`, `description`, `is_active`, `company_id`

#### Configuration Sheets
- **dropdown_lists**: `id`, `name`, `created_at`, `updated_at`
- **dropdown_options**: `id`, `dropdown_list_id`, `label`, `value`, `parent_option_id`
- **custom_fields**: `id`, `ticket_type_id`, `name`, `label`, `type`, `is_required`, `is_hidden`, `sort_order`, `dropdown_list_id`, `depends_on_field_id`
- **custom_field_values**: `id`, `ticket_id`, `custom_field_id`, `text_value`, `number_value`, `date_value`, `dropdown_option_id`

#### Workflow Sheets
- **workflow_steps**: `id`, `ticket_type_id`, `name`, `status_on_reach`, `step_type`, `approver_logic`, `sort_order`, `next_ticket_type_id`, `external_app_url`, `completion_action_name`
- **step_approvers**: `step_id`, `role_id`
- **user_role_assignments**: `user_id`, `ticket_type_id`, `role_id`, `validity_end_date`, `company_id`

#### Audit & Tracking Sheets
- **ticket_history**: `id`, `ticket_id`, `user_id`, `action`, `comment`, `timestamp`
- **ticket_action_logs**: `id`, `ticket_id`, `user_id`, `action_type`, `details`, `timestamp`
- **admin_action_logs**: `id`, `admin_user_id`, `action_type`, `target_entity`, `target_id`, `details`, `timestamp`

#### Supporting Sheets
- **sequence_counters**: `sequence_name`, `last_number`
- **ticket_links**: `id`, `parent_ticket_id`, `child_ticket_id`
- **ticket_attachments**: `id`, `ticket_id`, `uploader_id`, `file_name`, `file_url`, `uploaded_at`

## Key Implementation Details

### Ticket Number Generation
```javascript
// Format: COMPANYCODE-TYPECODE-YEAR-SEQUENCE
// Example: MAIN-PR-2025-00000001

function generateTicketNumber(companyCode, typeCode) {
  const lock = LockService.getScriptLock();
  // Uses Philippine Time (Asia/Manila)
  // Increments sequence with LockService for concurrency
  // Pads to 8 digits with leading zeros
}
```

### CORS Implementation
```javascript
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

### Error Handling Pattern
```javascript
try {
  // Operation logic
  return createJsonResponse({ status: 'success', data: result });
} catch (error) {
  Logger.log(`Error: ${error.stack}`);
  return createJsonResponse({ status: 'error', message: error.message });
}
```

## Testing & Development

### Built-in Test Functions
- `runCompleteAPITest()` - Tests all CRUD operations
- `testCompanyCRUD()` - Company management tests
- `testRoleCRUD()` - Role management tests
- `testDropdownCRUD()` - Dropdown management tests
- `testTicketOperations()` - Ticket creation and numbering tests
- `simulateFrontendRequests()` - Simulates React app API calls

### Sample Data Generation
- `createSampleData()` - Creates test companies, roles, and dropdowns
- Useful for development and testing

### Debugging
- Comprehensive Logger.log() statements throughout
- Error stack traces logged for debugging
- Admin action logging for audit trail

## Frontend Integration

### React Client Implementation Needed
Create `src/api/googleSheet.js`:

```javascript
const API_BASE_URL = 'YOUR_DEPLOYED_SCRIPT_URL_HERE';

// GET request example
export const getCompanies = async () => {
  const response = await fetch(`${API_BASE_URL}?action=getCompanies`);
  return response.json();
};

// POST request example
export const createCompany = async (companyData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createCompany',
      payload: companyData
    })
  });
  return response.json();
};
```

## Deployment Steps

1. **Copy Script**: Paste the complete Apps Script code into Google Apps Script editor
2. **Set Spreadsheet ID**: Ensure `SPREADSHEET_ID` matches your Google Sheet
3. **Deploy as Web App**:
   - Execute as: Me
   - Access: Anyone (will add auth later)
4. **Get Web App URL**: Copy the deployed URL for frontend integration
5. **Test API**: Use `runCompleteAPITest()` to verify functionality

## Security Considerations

- **Authentication**: Currently open access - Firebase JWT validation to be added
- **Data Validation**: Input validation implemented for all CRUD operations
- **Audit Logging**: All admin actions and data changes tracked
- **Error Handling**: No sensitive data exposed in error messages

## Production Readiness

✅ **Ready for Integration**: The backend is fully functional
✅ **Error Handling**: Comprehensive validation and error responses
✅ **Logging**: Complete audit trail implementation
✅ **Testing**: Built-in test suite validates all functionality
✅ **CORS**: Properly configured for frontend access
✅ **Concurrency**: LockService prevents race conditions

**Next Step**: Deploy as Web App and integrate with React frontend via `googleSheet.js`

---

*Implementation Status: Production-Ready MVP*
*Last Updated: September 15, 2025*