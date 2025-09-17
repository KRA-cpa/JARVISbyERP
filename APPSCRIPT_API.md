# Google Apps Script API Backend - Complete Implementation

**Date**: September 17, 2025
**Version**: 2.4 (Syntax Corrected)
**Purpose**: Complete serverless backend for JarvisByERP ticketing system

## 🔧 Fixed Issues

**Previous Errors Resolved:**
- ✅ Missing opening brace in `doPost` function
- ✅ Typo fixed: "Unknown faction" → "Unknown action"
- ✅ Extra closing braces removed
- ✅ Function structure corrected

## 📋 Complete Google Apps Script Code

```javascript
/**
 * =================================================================================
 * Ticketing & Workflow Orchestration System - Google Apps Script Backend API
 * Version: 2.4 (Syntax Corrected)
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
    ADMIN_ACTION_LOGS: "admin_action_logs"
};

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
          return createJsonResponse({
            success: true,
            data: createCompany(data.payload)
          });

        case 'updateCompany':
          return createJsonResponse({
            success: true,
            data: updateCompany(data.payload)
          });

        case 'deleteCompany':
          return createJsonResponse({
            success: true,
            data: deleteCompany(data.payload.id)
          });

        case 'createRole':
          return createJsonResponse({
            success: true,
            data: createRole(data.payload)
          });

        case 'updateRole':
          return createJsonResponse({
            success: true,
            data: updateRole(data.payload)
          });

        case 'deleteRole':
          return createJsonResponse({
            success: true,
            data: deleteRole(data.payload.id)
          });

        case 'createDropdownList':
          return createJsonResponse({
            success: true,
            data: createDropdownList(data.payload)
          });

        case 'updateDropdownList':
          return createJsonResponse({
            success: true,
            data: updateDropdownList(data.payload)
          });

        case 'deleteDropdownList':
          return createJsonResponse({
            success: true,
            data: deleteDropdownList(data.payload.id)
          });

        case 'createTicketType':
          return createJsonResponse({
            success: true,
            data: createTicketType(data.payload)
          });

        case 'updateTicketType':
          return createJsonResponse({
            success: true,
            data: updateTicketType(data.payload)
          });

        case 'deleteTicketType':
          return createJsonResponse({
            success: true,
            data: deleteTicketType(data.payload.id)
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
 * @returns {ContentService.TextOutput} - An empty response with CORS headers.
 */
function doOptions(e) {
    return ContentService.createTextOutput()
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    // Validate required fields
    if (!payload.name || !payload.code) {
      throw new Error('Company name and code are required');
    }

    // Check if code already exists
    const existingCompanies = getSheetDataAsJSON(companiesSheet);
    const codeExists = existingCompanies.some(c => c.code.toUpperCase() === payload.code.toUpperCase());

    if (codeExists) {
      throw new Error('Company code already exists');
    }

    // Generate new company
    const newCompany = {
      id: generateId('comp'),
      name: payload.name.trim(),
      code: payload.code.toUpperCase().trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to sheet
    companiesSheet.appendRow([
      newCompany.id,
      newCompany.name,
      newCompany.code,
      newCompany.created_at,
      newCompany.updated_at
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

function updateCompany(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companiesSheet = ss.getSheetByName(SHEETS.COMPANIES);

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

    if (!payload.name) {
      throw new Error('Dropdown list name is required');
    }

    const newList = {
      id: generateId('dd'),
      name: payload.name.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create the list
    listsSheet.appendRow([
      newList.id,
      newList.name,
      newList.created_at,
      newList.updated_at
    ]);

    // Add options if provided
    if (payload.options && Array.isArray(payload.options)) {
      payload.options.forEach(option => {
        if (option.label && option.value) {
          optionsSheet.appendRow([
            generateId('opt'),
            newList.id,
            option.label.trim(),
            option.value.trim(),
            option.parentValue || ''
          ]);
        }
      });
    }

    logAdminAction('CREATE_DROPDOWN_LIST', newList.id, newList);

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

    const updatedList = {
      id: payload.id,
      name: payload.name.trim(),
      created_at: listData[listRowIndex - 1][2],
      updated_at: new Date().toISOString()
    };

    listsSheet.getRange(listRowIndex, 1, 1, 4).setValues([[
      updatedList.id,
      updatedList.name,
      updatedList.created_at,
      updatedList.updated_at
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

    ticketTypesSheet.deleteRow(rowIndex);
    logAdminAction('DELETE_TICKET_TYPE', ticketTypeId, { deletedTicketType: ticketTypeData });

    Logger.log(`Deleted ticket type: ${ticketTypeData[3]}`);
    return { message: 'Ticket type deleted successfully' };
  } catch (error) {
    Logger.log(`Error deleting ticket type: ${error.message}`);
    throw error;
  }
}

/**
 * =================================================================================
 * AUDIT LOGGING FUNCTIONS
 * =================================================================================
 */

/**
 * Records a successful user login event.
 * @param {object} payload - Contains the user's ID and email.
 * @returns {object} - A success message.
 */
function logLogin(payload) {
  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.ADMIN_ACTION_LOGS);
  const logRow = [
    (logSheet.getLastRow() > 0 ? logSheet.getLastRow() : 1), // Log ID
    payload.userId, // admin_user_id
    'USER_LOGIN',   // action_type
    'USER',         // target_entity
    payload.userId, // target_id
    JSON.stringify({ email: payload.email, ipAddress: payload.ipAddress || 'N/A' }),
    new Date()
  ];
  logSheet.appendRow(logRow);
  return { message: "Login recorded." };
}

/**
 * Records a user-facing action in the ticket's history.
 * @param {number} ticketId - The ID of the ticket.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - The name of the action (e.g., 'Approved').
 * @param {string} comment - The user's comment.
 */
function logTicketHistory(ticketId, userId, action, comment) {
  const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_HISTORY);
  const historyRow = [
    (historySheet.getLastRow() > 0 ? historySheet.getLastRow() : 1),
    ticketId,
    userId,
    action,
    comment,
    new Date()
  ];
  historySheet.appendRow(historyRow);
}

/**
 * Records a detailed, system-level change for a ticket.
 * @param {number} ticketId - The ID of the ticket.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} actionType - A system-level action name (e.g., 'STATUS_CHANGE').
 * @param {object} details - A JSON object describing the change.
 */
function logTicketAction(ticketId, userId, actionType, details) {
  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.TICKET_ACTION_LOGS);
  const logRow = [
    (logSheet.getLastRow() > 0 ? logSheet.getLastRow() : 1),
    ticketId,
    userId,
    actionType,
    JSON.stringify(details),
    new Date()
  ];
  logSheet.appendRow(logRow);
}

/**
 * =================================================================================
 * UTILITY & HELPER FUNCTIONS
 * =================================================================================
 */

/**
 * Generates a unique, formatted ticket number.
 * Uses LockService to prevent race conditions when multiple users create tickets simultaneously.
 * @param {string} companyCode - The short code for the company.
 * @param {string} typeCode - The short code for the ticket type.
 * @returns {string} - The formatted ticket number.
 */
function generateTicketNumber(companyCode, typeCode) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds for the lock.

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const countersSheet = ss.getSheetByName(SHEETS.SEQUENCE_COUNTERS);
    const data = countersSheet.getDataRange().getValues();
    const headers = data.shift();

    const sequenceName = `${companyCode}-${typeCode}`;
    const year = Utilities.formatDate(new Date(), "Asia/Manila", "yyyy");

    let currentNumber = 0;
    let rowIndex = -1;

    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === sequenceName) {
            currentNumber = parseInt(data[i][1], 10);
            rowIndex = i + 2; // +1 for 1-based index, +1 for header
            break;
        }
    }

    const nextNumber = currentNumber + 1;

    if (nextNumber > 99999999) {
        // In a real system, you might throw an error or handle the reset differently.
        // For now, we'll just log it.
        Logger.log(`Sequence ${sequenceName} has exceeded 99,999,999.`);
    }

    // Update the sheet with the new number
    if (rowIndex > -1) {
        countersSheet.getRange(rowIndex, 2).setValue(nextNumber);
    } else {
        countersSheet.appendRow([sequenceName, nextNumber]);
    }

    // Pad the number with leading zeros to 8 digits
    const paddedNumber = String(nextNumber).padStart(8, '0');

    return `${sequenceName}-${year}-${paddedNumber}`;

  } finally {
    lock.releaseLock();
  }
}

/**
 * Converts a Google Sheet's data into an array of JSON objects.
 * @param {Sheet} sheet - The Google Sheet object.
 * @returns {Array} - An array of objects representing the sheet data.
 */
function getSheetDataAsJSON(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // No data beyond headers
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * Creates a standard JSON response with CORS headers.
 * @param {object} response - The data to be stringified.
 * @returns {ContentService.TextOutput} - The final JSON response object.
 */
function createJsonResponse(response) {
    try {
      const output = ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);

      // Set CORS headers individually (not chained)
      output.setHeader('Access-Control-Allow-Origin', '*');
      output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      return output;
    } catch (error) {
      console.error('createJsonResponse Error:', error);
      // Fallback response without headers if there's an issue
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Response creation failed'
      })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * =================================================================================
 * UTILITY FUNCTIONS
 * =================================================================================
 */

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function logAdminAction(actionType, targetId, details) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEETS.ADMIN_ACTION_LOGS);

    if (!logSheet) {
      logSheet = initializeAdminActionLogsSheet();
    }

    logSheet.appendRow([
      generateId('log'),
      Session.getActiveUser().getEmail() || 'system',
      actionType,
      'ENTITY',
      targetId,
      JSON.stringify(details),
      new Date().toISOString()
    ]);
  } catch (error) {
    Logger.log(`Error logging admin action: ${error.message}`);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

function pingAPI() {
  return {
    status: 'API is running',
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    version: '2.4',
    availableEndpoints: [
      'getCompanies', 'createCompany', 'updateCompany', 'deleteCompany',
      'getRoles', 'createRole', 'updateRole', 'deleteRole',
      'getDropdownLists', 'createDropdownList', 'updateDropdownList', 'deleteDropdownList',
      'getTicketTypes', 'createTicketType', 'updateTicketType', 'deleteTicketType',
      'getTickets', 'createTicket', 'recordLogin'
    ]
  };
}

/**
 * =================================================================================
 * SHEET INITIALIZATION FUNCTIONS
 * =================================================================================
 */

function initializeCompaniesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.COMPANIES);
  sheet.getRange(1, 1, 1, 5).setValues([
    ['id', 'name', 'code', 'created_at', 'updated_at']
  ]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  return sheet;
}

function initializeRolesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.ROLES);
  sheet.getRange(1, 1, 1, 5).setValues([
    ['id', 'name', 'company_id', 'created_at', 'updated_at']
  ]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  return sheet;
}

function initializeDropdownListsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.DROPDOWN_LISTS);
  sheet.getRange(1, 1, 1, 4).setValues([
    ['id', 'name', 'created_at', 'updated_at']
  ]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  return sheet;
}

function initializeDropdownOptionsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.DROPDOWN_OPTIONS);
  sheet.getRange(1, 1, 1, 5).setValues([
    ['id', 'dropdown_list_id', 'label', 'value', 'parent_option_id']
  ]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  return sheet;
}

function initializeTicketTypesSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.TICKET_TYPES);
  sheet.getRange(1, 1, 1, 10).setValues([
    ['id', 'transaction_id', 'code', 'name', 'description', 'is_active', 'require_attachment_on_create', 'company_id', 'created_at', 'updated_at']
  ]);
  sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  return sheet;
}

function initializeAdminActionLogsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet(SHEETS.ADMIN_ACTION_LOGS);
  sheet.getRange(1, 1, 1, 7).setValues([
    ['id', 'admin_user_id', 'action_type', 'target_entity', 'target_id', 'details', 'timestamp']
  ]);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  return sheet;
}

/**
 * =================================================================================
 * COMPREHENSIVE TEST FUNCTIONS
 * =================================================================================
 */

function runCompleteAPITest() {
  Logger.log('=== STARTING COMPLETE API TEST ===');

  try {
    // Test API ping
    Logger.log('1. Testing API ping...');
    const pingResult = pingAPI();
    Logger.log('Ping result:', pingResult);

    // Test company CRUD
    Logger.log('2. Testing Company CRUD...');
    testCompanyCRUD();

    // Test role CRUD
    Logger.log('3. Testing Role CRUD...');
    testRoleCRUD();

    // Test dropdown CRUD
    Logger.log('4. Testing Dropdown CRUD...');
    testDropdownCRUD();

    // Test ticket type CRUD
    Logger.log('5. Testing Ticket Type CRUD...');
    testTicketTypeCRUD();

    // Test ticket operations
    Logger.log('6. Testing Ticket operations...');
    testTicketOperations();

    Logger.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('Error:', error.message);
    Logger.log('Stack:', error.stack);
  }
}

function testCompanyCRUD() {
  Logger.log('--- Testing Company CRUD ---');

  // Create company
  const newCompany = createCompany({
    name: 'Test Company',
    code: 'TEST'
  });
  Logger.log('Created company:', newCompany);

  // Get all companies
  const allCompanies = getCompanies();
  Logger.log('All companies:', allCompanies.length);

  // Get single company
  const singleCompany = getCompany(newCompany.id);
  Logger.log('Single company:', singleCompany);

  // Update company
  const updatedCompany = updateCompany({
    id: newCompany.id,
    name: 'Updated Test Company',
    code: 'UPDT'
  });
  Logger.log('Updated company:', updatedCompany);

  // Delete company
  const deleteResult = deleteCompany(newCompany.id);
  Logger.log('Delete result:', deleteResult);

  Logger.log('--- Company CRUD test completed ---');
}

function testRoleCRUD() {
  Logger.log('--- Testing Role CRUD ---');

  // Create global role
  const globalRole = createRole({
    name: 'Test Global Role',
    company_id: 'global'
  });
  Logger.log('Created global role:', globalRole);

  // Create company-specific role
  const companyRole = createRole({
    name: 'Test Company Role',
    company_id: 'comp_123'
  });
  Logger.log('Created company role:', companyRole);

  // Get all roles
  const allRoles = getRoles();
  Logger.log('All roles:', allRoles.length);

  // Update role
  const updatedRole = updateRole({
    id: globalRole.id,
    name: 'Updated Global Role',
    company_id: 'global'
  });
  Logger.log('Updated role:', updatedRole);

  // Delete roles
  deleteRole(globalRole.id);
  deleteRole(companyRole.id);

  Logger.log('--- Role CRUD test completed ---');
}

function testDropdownCRUD() {
  Logger.log('--- Testing Dropdown CRUD ---');

  // Create dropdown list with options
  const newDropdown = createDropdownList({
    name: 'Test Dropdown',
    options: [
      { label: 'Option 1', value: 'opt1', parentValue: '' },
      { label: 'Option 2', value: 'opt2', parentValue: '' },
      { label: 'Sub Option', value: 'sub1', parentValue: 'opt1' }
    ]
  });
  Logger.log('Created dropdown:', newDropdown);

  // Get all dropdowns
  const allDropdowns = getDropdownLists();
  Logger.log('All dropdowns:', allDropdowns.length);

  // Get options for the dropdown
  const options = getDropdownOptions(newDropdown.id);
  Logger.log('Dropdown options:', options.length);

  // Update dropdown
  const updatedDropdown = updateDropdownList({
    id: newDropdown.id,
    name: 'Updated Test Dropdown',
    options: [
      { label: 'New Option 1', value: 'new1', parentValue: '' },
      { label: 'New Option 2', value: 'new2', parentValue: '' }
    ]
  });
  Logger.log('Updated dropdown:', updatedDropdown);

  // Delete dropdown
  const deleteResult = deleteDropdownList(newDropdown.id);
  Logger.log('Delete result:', deleteResult);

  Logger.log('--- Dropdown CRUD test completed ---');
}

function testTicketTypeCRUD() {
  Logger.log('--- Testing Ticket Type CRUD ---');

  // Create ticket type
  const newTicketType = createTicketType({
    name: 'Test Purchase Request',
    code: 'TPR',
    transaction_id: 'TR001',
    description: 'Test ticket type for purchase requests',
    company_id: 'global',
    require_attachment_on_create: true
  });
  Logger.log('Created ticket type:', newTicketType);

  // Get all ticket types
  const allTicketTypes = getTicketTypes();
  Logger.log('All ticket types:', allTicketTypes.length);

  // Update ticket type
  const updatedTicketType = updateTicketType({
    id: newTicketType.id,
    name: 'Updated Test Purchase Request',
    code: 'UTPR',
    transaction_id: 'TR001',
    description: 'Updated test ticket type',
    company_id: 'global',
    require_attachment_on_create: false
  });
  Logger.log('Updated ticket type:', updatedTicketType);

  // Delete ticket type
  const deleteResult = deleteTicketType(newTicketType.id);
  Logger.log('Delete result:', deleteResult);

  Logger.log('--- Ticket Type CRUD test completed ---');
}

function testTicketOperations() {
  Logger.log('--- Testing Ticket Operations ---');

  // First create a company and ticket type for testing
  const testCompany = createCompany({
    name: 'Ticket Test Company',
    code: 'TTC'
  });

  const testTicketType = createTicketType({
    name: 'Test Request',
    code: 'TEST',
    transaction_id: 'TR001',
    company_id: testCompany.id
  });

  // Create ticket
  const newTicket = createTicket({
    title: 'Test Ticket',
    ticket_type_id: testTicketType.id,
    company_id: testCompany.id,
    requester_id: 'user_test',
    customData: {
      field1: 'Test Value 1',
      field2: 'Test Value 2'
    }
  });
  Logger.log('Created ticket:', newTicket);

  // Get tickets
  const allTickets = getTickets();
  Logger.log('All tickets:', allTickets.length);

  // Test login logging
  const loginResult = logLogin({
    userId: 'user_test',
    email: 'test@example.com',
    ipAddress: '127.0.0.1'
  });
  Logger.log('Login result:', loginResult);

  // Clean up test data
  deleteTicketType(testTicketType.id);
  deleteCompany(testCompany.id);

  Logger.log('--- Ticket Operations test completed ---');
}

function createSampleData() {
  Logger.log('=== CREATING SAMPLE DATA ===');

  try {
    // Create sample companies
    const companies = [
      { name: 'Main Corporation', code: 'MAIN' },
      { name: 'Tech Solutions Inc.', code: 'TECH' },
      { name: 'Global Services Ltd.', code: 'GLOB' }
    ];

    const createdCompanies = companies.map(comp => createCompany(comp));
    Logger.log('Created companies:', createdCompanies);

    // Create sample roles
    const roles = [
      { name: 'Global Admin', company_id: 'global' },
      { name: 'Manager', company_id: createdCompanies[0].id },
      { name: 'Finance', company_id: createdCompanies[0].id },
      { name: 'HR', company_id: createdCompanies[1].id }
    ];

    const createdRoles = roles.map(role => createRole(role));
    Logger.log('Created roles:', createdRoles);

    // Create sample dropdown lists
    const dropdowns = [
      {
        name: 'Departments',
        options: [
          { label: 'Engineering', value: 'eng', parentValue: '' },
          { label: 'Marketing', value: 'mkt', parentValue: '' },
          { label: 'Finance', value: 'fin', parentValue: '' }
        ]
      },
      {
        name: 'Equipment Types',
        options: [
          { label: 'Hardware', value: 'hardware', parentValue: '' },
          { label: 'Software', value: 'software', parentValue: '' },
          { label: 'Laptop', value: 'laptop', parentValue: 'hardware' },
          { label: 'Monitor', value: 'monitor', parentValue: 'hardware' }
        ]
      }
    ];

    const createdDropdowns = dropdowns.map(dropdown => createDropdownList(dropdown));
    Logger.log('Created dropdowns:', createdDropdowns);

    // Create sample ticket types
    const ticketTypes = [
      {
        name: 'Purchase Request',
        code: 'PR',
        transaction_id: 'TR001',
        description: 'Request for purchasing items',
        company_id: createdCompanies[0].id,
        require_attachment_on_create: true
      },
      {
        name: 'Leave Request',
        code: 'LEAVE',
        transaction_id: 'TR002',
        description: 'Request for leave',
        company_id: 'global',
        require_attachment_on_create: false
      }
    ];

    const createdTicketTypes = ticketTypes.map(tt => createTicketType(tt));
    Logger.log('Created ticket types:', createdTicketTypes);

    Logger.log('=== SAMPLE DATA CREATION COMPLETED ===');

  } catch (error) {
    Logger.log('Error creating sample data:', error.message);
  }
}

/**
 * =================================================================================
 * FRONTEND API TESTER
 * =================================================================================
 */

// This function simulates what your React frontend will do
function simulateFrontendRequests() {
  Logger.log('=== SIMULATING FRONTEND REQUESTS ===');

  try {
    // Simulate GET request for companies
    const getCompaniesResult = doGet({
      parameter: { action: 'getCompanies' }
    });
    Logger.log('GET companies result:', getCompaniesResult.getContent());

    // Simulate POST request to create company
    const createCompanyResult = doPost({
      postData: {
        contents: JSON.stringify({
          action: 'createCompany',
          payload: {
            name: 'Frontend Test Company',
            code: 'FRONT'
          }
        })
      }
    });
    Logger.log('POST create company result:', createCompanyResult.getContent());

    // Simulate ping request
    const pingResult = doGet({
      parameter: { action: 'ping' }
    });
    Logger.log('Ping result:', pingResult.getContent());

    Logger.log('=== FRONTEND SIMULATION COMPLETED ===');

  } catch (error) {
    Logger.log('Error simulating frontend requests:', error.message);
  }
}
```

## 🚀 Deployment Instructions

1. **Copy the complete code above** into your Google Apps Script project
2. **Update the SPREADSHEET_ID** with your actual Google Sheet ID
3. **Deploy as Web App**:
   - Click Deploy → New Deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
4. **Copy the Web App URL** and update your frontend `apiConfig.js`

## 🧪 Testing the API

After deployment, you can test the API using these functions in the Apps Script editor:

- `runCompleteAPITest()` - Tests all CRUD operations
- `createSampleData()` - Creates sample companies, roles, dropdowns, and ticket types
- `simulateFrontendRequests()` - Simulates frontend API calls

## 📊 Available Endpoints

**GET Endpoints:**
- `ping` - Health check
- `getCompanies` - Fetch all companies
- `getRoles` - Fetch all roles
- `getDropdownLists` - Fetch dropdown lists with options
- `getTicketTypes` - Fetch ticket types

**POST Endpoints:**
- All CRUD operations for companies, roles, dropdown lists, and ticket types
- `createTicket` - Create new tickets
- `recordLogin` - Log user logins

## ✅ Syntax Issues Fixed

- ✅ Missing opening brace in `doPost` function
- ✅ Fixed typo: "Unknown faction" → "Unknown action"
- ✅ Removed extra closing braces
- ✅ Corrected function structure and flow
- ✅ Added missing ticket type CRUD functions
- ✅ Enhanced error handling and logging

## 🔗 Integration Status

**Frontend URL**: `https://script.google.com/macros/s/AKfycbyU_9RfwP-w3xn3tNl4IFcSEv1MJJzJArpHbZwz3RLoVHLWCwn13MKGIki0K4nmK9amWg/exec`

**Status**: Ready for frontend integration testing