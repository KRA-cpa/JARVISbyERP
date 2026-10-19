/**
 * Local Google Apps Script Mock Server
 * Simulates the Google Apps Script API endpoints for local testing
 *
 * Mirrors AppScript v9.0 behaviour for what it mocks: POST bodies are flat ({ action, ...fields }, the way
 * src/api/googleSheet.js sends them; { action, payload } still works), failures carry status: 'error', and the
 * Phase 10.0 + approval-path reads return fixed data for the dev user (dev-user-123). Writes outside the core
 * entities are not mocked - use run-frontend.bat live for those.
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = Number(process.env.MOCK_PORT) || 3001; // MOCK_PORT: run a second copy beside run-backend.bat

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage
let mockData = {
  companies: [
    { id: 'comp_1', name: 'Main Corporation', code: 'MAIN', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'comp_2', name: 'Tech Solutions Inc.', code: 'TECH', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  roles: [
    { id: 'role_1', name: 'Global Admin', company_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'role_2', name: 'Manager', company_id: 'comp_1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  dropdownLists: [
    {
      id: 'dd_1',
      name: 'Departments',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      options: [
        { id: 'opt_1', dropdown_list_id: 'dd_1', label: 'Engineering', value: 'eng', parent_option_id: '' },
        { id: 'opt_2', dropdown_list_id: 'dd_1', label: 'Marketing', value: 'mkt', parent_option_id: '' }
      ]
    }
  ],
  ticketTypes: [
    {
      id: 'tt_1',
      transaction_id: 'TR001',
      code: 'PR',
      name: 'Purchase Request',
      description: 'Request for purchasing items',
      is_active: true,
      require_attachment_on_create: true,
      company_id: 'comp_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  customFields: [
    {
      id: 'cf_1',
      ticket_type_id: 'tt_1',
      name: 'item_description',
      label: 'Item Description',
      type: 'paragraph',
      is_required: true,
      is_hidden: false,
      sort_order: 1,
      dropdown_list_id: null,
      depends_on_field_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cf_2',
      ticket_type_id: 'tt_1',
      name: 'estimated_cost',
      label: 'Estimated Cost',
      type: 'amount',
      is_required: true,
      is_hidden: false,
      sort_order: 2,
      dropdown_list_id: null,
      depends_on_field_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  // Phase 10.0 + approval path (read-only mocks)
  userProfileTypes: [
    { id: 'upt_1', name: 'Standard Employee', code: 'EMP', description: 'Regular employee', company_id: '', is_active: true },
    { id: 'upt_2', name: 'Contractor', code: 'CTR', description: 'External contractor', company_id: '', is_active: false }
  ],
  roleTypes: [
    { id: 'rt_1', name: 'Approval Roles', code: 'APR', description: 'Roles that approve steps', company_id: '', is_active: true }
  ],
  userProfiles: [
    {
      user_id: 'dev-user-123', id: 'dev-user-123', display_name: 'Dev User', name: 'Dev User', email: 'dev@localhost',
      is_active: true, general_role: 'both',
      roles: [{ id: 'role_2', name: 'Manager', company_id: 'comp_1', assignment_id: 'ura_1' }]
    }
  ],
  roleAssignments: [
    {
      id: 'ura_1', user_id: 'dev-user-123', role_id: 'role_2', role_name: 'Manager', company_id: 'comp_1', ticket_type_id: '',
      assignment_type: 'permanent', effective_start_date: '2026-01-01', effective_end_date: '', is_active: true
    }
  ],
  workflowSteps: [
    {
      id: 'ws_1', ticket_type_id: 'tt_1', company_id: 'comp_1', name: 'Manager Approval', status_on_reach: 'Pending Manager',
      step_type: 'approval', approver_logic: 'any', sort_order: 1, is_active: true
    }
  ],
  stepApprovers: [{ step_id: 'ws_1', role_id: 'role_2' }]
};

// Utility functions
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createResponse(success, data = null, error = null) {
  return {
    success,
    ...(success ? {} : { status: 'error' }), // like AppScript v9.0: makes makeRequest() throw
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

// Phase 10.0 handlers return { status, data, message }; the frontend unwraps it (unwrapHandlerResult)
const handlerResult = (data) => ({ status: 'success', data, message: 'mock' });
const activeOnly = (list, query) => (String(query.include_inactive) === 'true' ? list : list.filter(item => item.is_active !== false));

// API Routes - Simulate Google Apps Script endpoints
app.get('/exec', (req, res) => {
  const { action } = req.query;
  console.log(`GET /exec - Action: ${action}`);

  try {
    switch (action) {
      case 'ping':
        res.json(createResponse(true, {
          status: 'API is running',
          timestamp: new Date().toISOString(),
          version: '2.4-local',
          message: 'Local Google Apps Script Mock Server'
        }));
        break;

      case 'getCompanies':
        res.json(createResponse(true, mockData.companies));
        break;

      case 'getRoles':
        res.json(createResponse(true, mockData.roles));
        break;

      case 'getDropdownLists':
        res.json(createResponse(true, mockData.dropdownLists));
        break;

      case 'getTicketTypes':
        res.json(createResponse(true, mockData.ticketTypes));
        break;

      case 'getCompany':
        res.json(createResponse(true, mockData.companies.find(c => c.id === req.query.companyId) || null));
        break;

      case 'getDropdownOptions': {
        const list = mockData.dropdownLists.find(dl => dl.id === req.query.listId);
        res.json(createResponse(true, list ? list.options : []));
        break;
      }

      case 'getUserPreferences':
        res.json(createResponse(true, { user_id: req.query.user_id, dark_mode: false, timezone: 'Asia/Manila' }));
        break;

      case 'getUserProfileTypes':
        res.json(createResponse(true, handlerResult(activeOnly(mockData.userProfileTypes, req.query))));
        break;

      case 'getRoleTypes':
        res.json(createResponse(true, handlerResult(activeOnly(mockData.roleTypes, req.query))));
        break;

      case 'getWorkflowSteps':
        res.json(createResponse(true, mockData.workflowSteps.filter(s =>
          (!req.query.ticket_type_id || s.ticket_type_id === req.query.ticket_type_id) &&
          (!req.query.company_id || s.company_id === req.query.company_id))));
        break;

      case 'getSystemHealth':
        res.json(createResponse(true, { status: 'healthy', api_version: 'mock', server_time: new Date().toISOString(), tables: {}, issues: [] }));
        break;

      case 'getCustomFields':
        const { ticket_type_id } = req.query;
        let customFields = mockData.customFields;
        if (ticket_type_id) {
          customFields = customFields.filter(cf => cf.ticket_type_id === ticket_type_id);
        }
        res.json(createResponse(true, customFields));
        break;

      default:
        res.json(createResponse(false, null, `Unknown action: ${action}`));
    }
  } catch (error) {
    console.error('GET Error:', error);
    res.json(createResponse(false, null, error.message));
  }
});

app.post('/exec', (req, res) => {
  // The frontend sends { action, ...fields }; older callers send { action, payload }
  const { action, payload: wrappedPayload, ...flatFields } = req.body || {};
  const payload = wrappedPayload || flatFields;
  console.log(`POST /exec - Action: ${action}`, payload ? 'with payload' : 'no payload');

  try {
    switch (action) {
      case 'ping':
        res.json(createResponse(true, {
          status: 'API is running',
          timestamp: new Date().toISOString(),
          version: '2.4-local',
          message: 'Local Google Apps Script Mock Server'
        }));
        break;

      case 'getCompanies':
        res.json(createResponse(true, mockData.companies));
        break;

      // Approval path reads (v9.0 routes, unwrapped like createDataResponse)
      case 'getUsers':
        res.json(createResponse(true, mockData.userProfiles));
        break;

      case 'getUserProfile': {
        const profile = mockData.userProfiles.find(p => p.user_id === (payload.userId || payload.user_id));
        res.json(createResponse(true, profile
          ? { ...profile, companies: mockData.companies.filter(c => profile.roles.some(r => r.company_id === c.id)) }
          : null));
        break;
      }

      case 'getUserRoles':
        res.json(createResponse(true, mockData.roleAssignments.filter(a => a.user_id === (payload.userId || payload.user_id))));
        break;

      case 'getUserGeneralRole': {
        const profile = mockData.userProfiles.find(p => p.user_id === (payload.userId || payload.user_id));
        res.json(createResponse(true, { user_id: payload.userId || payload.user_id, general_role: profile ? profile.general_role : 'viewer' }));
        break;
      }

      case 'getStepApprovers':
        res.json(createResponse(true, mockData.stepApprovers.filter(a => a.step_id === payload.step_id)));
        break;

      case 'getWorkflowStep':
        res.json(createResponse(true, mockData.workflowSteps.find(s => s.id === payload.step_id) || null));
        break;

      case 'canUserApprove':
        res.json(createResponse(true, {
          can_approve: true, already_approved: false, approver_logic: 'any',
          eligible_role_ids: ['role_2'], required_role_ids: ['role_2'], approved_role_ids: []
        }));
        break;

      case 'getStepApprovals':
        res.json(createResponse(true, []));
        break;

      case 'createCompany':
        if (!payload.name || !payload.code) {
          return res.json(createResponse(false, null, 'Company name and code are required'));
        }

        const newCompany = {
          id: generateId('comp'),
          name: payload.name.trim(),
          code: payload.code.toUpperCase().trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockData.companies.push(newCompany);
        res.json(createResponse(true, newCompany));
        break;

      case 'createRole':
        if (!payload.name) {
          return res.json(createResponse(false, null, 'Role name is required'));
        }

        const newRole = {
          id: generateId('role'),
          name: payload.name.trim(),
          company_id: payload.company_id === 'global' ? null : payload.company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockData.roles.push(newRole);
        res.json(createResponse(true, newRole));
        break;

      case 'createDropdownList':
        if (!payload.name) {
          return res.json(createResponse(false, null, 'Dropdown list name is required'));
        }

        const newList = {
          id: generateId('dd'),
          name: payload.name.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          options: payload.options || []
        };

        mockData.dropdownLists.push(newList);
        res.json(createResponse(true, newList));
        break;

      case 'createTicketType':
        if (!payload.name || !payload.code) {
          return res.json(createResponse(false, null, 'Ticket type name and code are required'));
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

        mockData.ticketTypes.push(newTicketType);
        res.json(createResponse(true, newTicketType));
        break;

      case 'updateTicketType':
        if (!payload.ticket_type_id) {
          return res.json(createResponse(false, null, 'Ticket type ID is required'));
        }

        const ticketTypeIndex = mockData.ticketTypes.findIndex(tt => tt.id === payload.ticket_type_id);
        if (ticketTypeIndex === -1) {
          return res.json(createResponse(false, null, 'Ticket type not found'));
        }

        mockData.ticketTypes[ticketTypeIndex] = {
          ...mockData.ticketTypes[ticketTypeIndex],
          ...payload,
          updated_at: new Date().toISOString()
        };

        res.json(createResponse(true, mockData.ticketTypes[ticketTypeIndex]));
        break;

      case 'deleteTicketType':
        if (!payload.ticket_type_id) {
          return res.json(createResponse(false, null, 'Ticket type ID is required'));
        }

        const ticketTypeToDelete = mockData.ticketTypes.findIndex(tt => tt.id === payload.ticket_type_id);
        if (ticketTypeToDelete === -1) {
          return res.json(createResponse(false, null, 'Ticket type not found'));
        }

        mockData.ticketTypes.splice(ticketTypeToDelete, 1);
        res.json(createResponse(true, { deleted: true }));
        break;

      case 'createCustomField':
        if (!payload.ticket_type_id || !payload.name || !payload.label) {
          return res.json(createResponse(false, null, 'Ticket type ID, name, and label are required'));
        }

        const newCustomField = {
          id: generateId('cf'),
          ticket_type_id: payload.ticket_type_id,
          name: payload.name.trim(),
          label: payload.label.trim(),
          type: payload.type || 'text',
          is_required: payload.is_required || false,
          is_hidden: payload.is_hidden || false,
          sort_order: payload.sort_order || 1,
          dropdown_list_id: payload.dropdown_list_id || null,
          depends_on_field_id: payload.depends_on_field_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockData.customFields.push(newCustomField);
        res.json(createResponse(true, newCustomField));
        break;

      case 'updateCustomField':
        if (!payload.field_id) {
          return res.json(createResponse(false, null, 'Field ID is required'));
        }

        const fieldIndex = mockData.customFields.findIndex(cf => cf.id === payload.field_id);
        if (fieldIndex === -1) {
          return res.json(createResponse(false, null, 'Custom field not found'));
        }

        mockData.customFields[fieldIndex] = {
          ...mockData.customFields[fieldIndex],
          ...payload,
          updated_at: new Date().toISOString()
        };

        res.json(createResponse(true, mockData.customFields[fieldIndex]));
        break;

      case 'deleteCustomField':
        if (!payload.field_id) {
          return res.json(createResponse(false, null, 'Field ID is required'));
        }

        const fieldToDelete = mockData.customFields.findIndex(cf => cf.id === payload.field_id);
        if (fieldToDelete === -1) {
          return res.json(createResponse(false, null, 'Custom field not found'));
        }

        mockData.customFields.splice(fieldToDelete, 1);
        res.json(createResponse(true, { deleted: true }));
        break;

      default:
        res.json(createResponse(false, null, `Unknown action: ${action}`));
    }
  } catch (error) {
    console.error('POST Error:', error);
    res.json(createResponse(false, null, error.message));
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mockData: {
      companies: mockData.companies.length,
      roles: mockData.roles.length,
      dropdownLists: mockData.dropdownLists.length,
      ticketTypes: mockData.ticketTypes.length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local Google Apps Script Mock Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/exec`);
  console.log(`\n📋 Mock data loaded:`);
  console.log(`   - ${mockData.companies.length} companies`);
  console.log(`   - ${mockData.roles.length} roles`);
  console.log(`   - ${mockData.dropdownLists.length} dropdown lists`);
  console.log(`   - ${mockData.ticketTypes.length} ticket types`);
  console.log(`\n🧪 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/exec?action=ping`);
  console.log(`   POST http://localhost:${PORT}/exec {"action":"getCompanies"}`);
  console.log(`\n💡 Update your React app's apiConfig.js baseURL to:`);
  console.log(`     http://localhost:${PORT}/exec`);
});

module.exports = app;