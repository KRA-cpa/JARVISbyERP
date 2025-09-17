/**
 * Local Google Apps Script Mock Server
 * Simulates the Google Apps Script API endpoints for local testing
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

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
  ]
};

// Utility functions
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createResponse(success, data = null, error = null) {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

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
  const { action, payload } = req.body;
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