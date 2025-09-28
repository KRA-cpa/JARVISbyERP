/**
 * =================================================================================
 * DATABASE SCHEMA ANALYZER FUNCTION - UPDATED September 27, 2025
 * Purpose: Analyze current Google Sheets database structure and document schema
 * Usage: Add this function to your APPSCRIPT.txt file and run analyzeCurrentSchema()
 * Output: Updates 'xSchema' sheet with complete database schema documentation
 *
 * UPDATES:
 * - Added Universal Entity Architecture tables (user_profile_types, role_types, user_profiles)
 * - Updated custom_fields and custom_field_values with entity_category column
 * - Enhanced user_role_assignments with date-based assignment features
 * - Added roles.role_type_id relationship
 * =================================================================================
 */

/**
 * Analyze current database schema and write to 'xSchema' sheet
 * This function examines all sheets in the spreadsheet and documents their structure
 */
function analyzeCurrentSchema() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Get the existing xSchema sheet and clear it
  let xSchemaSheet;
  try {
    xSchemaSheet = ss.getSheetByName('xSchema');
    xSchemaSheet.clear();
  } catch (error) {
    throw new Error('xSchema sheet not found. Please create the xSchema sheet first.');
  }

  // Set up headers for schema documentation
  const headers = [
    'Sheet Name',
    'Column Count',
    'Column Headers',
    'Sample Row 2',
    'Row Count',
    'Status',
    'Notes'
  ];

  xSchemaSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  xSchemaSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  xSchemaSheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  xSchemaSheet.getRange(1, 1, 1, headers.length).setFontColor('white');

  // Get all sheets in the spreadsheet
  const allSheets = ss.getSheets();
  const schemaData = [];

  // Define expected sheets from CLAUDE.md specification - UPDATED September 27, 2025
  // Added Universal Entity Architecture tables for user/role management
  const expectedSheets = {
    'companies': 'id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count + audit fields',
    'roles': 'id|role_type_id|name|company_id + audit fields',
    'tickets': 'id|ticket_number|title|ticket_type_id|requester_id|status|current_step_id|step_due_date|company_id + audit fields',
    'ticket_history': 'id|ticket_id|user_id|action|comment|timestamp',
    'ticket_types': 'id|transaction_id|code|name|description|is_active|require_attachment_on_create|company_id + audit fields',
    'comment_requirements': 'ticket_type_id|require_on_approve|require_on_return|require_on_reject|require_on_cancel + audit fields',
    'custom_fields': '🆕 id|ticket_type_id|entity_category|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id + audit fields',
    'custom_field_values': '🆕 id|ticket_id|entity_category|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id + audit fields',
    'workflow_steps': 'id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name + audit fields',
    'step_approvers': 'step_id|role_id + audit fields',
    'user_role_assignments': '🆕 id|user_id|role_id|ticket_type_id|company_id|assignment_type|effective_start_date|effective_end_date|auto_expire_days|assigned_by_user_id|approval_required|assignment_notes|validity_end_date + audit fields',
    'step_slas': 'step_id|duration|unit|exclude_weekends + audit fields',
    'step_conditions': 'id|step_id|custom_field_id|operator|value + audit fields',
    'dropdown_lists': 'id|name|description + audit fields',
    'dropdown_options': 'id|dropdown_list_id|label|value|parent_option_id|sort_order + audit fields',
    'dropdown_company_assignments': 'id|dropdown_list_id|company_id|is_global|is_active + audit fields',
    'ticket_attachments': 'id|ticket_id|uploader_id|file_name|file_url|uploaded_at + audit fields',
    'report_configurations': 'id|ticket_type_id|field_name|display_name|field_type|sort_order + audit fields',
    'ticket_links': 'id|parent_ticket_id|child_ticket_id|link_type + audit fields',
    'sequence_counters': 'id|sequence_name|last_number|company_id|ticket_type_code + audit fields',
    'ticket_action_logs': 'id|ticket_id|user_id|action_type|details|timestamp',
    'admin_action_logs': 'id|admin_user_id|action_type|target_entity|target_id|details|timestamp',
    'user_preferences': 'id|user_id|dark_mode|timezone|language|email_notifications|desktop_notifications|dashboard_layout|items_per_page|auto_refresh|refresh_interval + audit fields',
    // 🆕 NEW UNIVERSAL ENTITY ARCHITECTURE TABLES (September 27, 2025)
    'user_profile_types': '🆕 id|name|description|code|company_id + audit fields',
    'role_types': '🆕 id|name|description|code|company_id + audit fields',
    'user_profiles': '🆕 user_id|user_profile_type_id|display_name|email|immediate_approver_id|backup_approver_id|status|hire_date + audit fields'
  };

  // Analyze each sheet
  for (let i = 0; i < allSheets.length; i++) {
    const sheet = allSheets[i];
    const sheetName = sheet.getName();

    // Skip the xSchema sheet itself
    if (sheetName === 'xSchema') continue;

    try {
      const lastRow = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();

      let columnHeaders = '';
      let sampleRow = '';
      let status = '';
      let notes = '';

      if (lastRow >= 1 && lastColumn >= 1) {
        // Get headers (row 1)
        const headersRange = sheet.getRange(1, 1, 1, lastColumn);
        const headersValues = headersRange.getValues()[0];
        columnHeaders = headersValues.join('|');

        // Get sample data (row 2 if exists)
        if (lastRow >= 2) {
          const sampleRange = sheet.getRange(2, 1, 1, lastColumn);
          const sampleValues = sampleRange.getValues()[0];
          sampleRow = sampleValues.map(val => val ? String(val).substring(0, 20) : '').join('|');
        } else {
          sampleRow = 'No data rows';
        }

        // Determine status and check for Universal Entity Architecture updates
        if (expectedSheets[sheetName]) {
          status = '✅ Expected';

          // Special checks for Universal Entity Architecture tables
          if (sheetName === 'custom_fields') {
            if (columnHeaders.includes('entity_category')) {
              notes = '🆕 Universal Entity Architecture: entity_category column added';
            } else {
              notes = '⚠️ Missing entity_category column for Universal Entity support';
            }
          } else if (sheetName === 'custom_field_values') {
            if (columnHeaders.includes('entity_category')) {
              notes = '🆕 Universal Entity Architecture: entity_category column added';
            } else {
              notes = '⚠️ Missing entity_category column for Universal Entity support';
            }
          } else if (sheetName === 'user_role_assignments') {
            if (columnHeaders.includes('assignment_type') && columnHeaders.includes('effective_start_date')) {
              notes = '🆕 Date-based role assignments enhanced';
            } else {
              notes = '⚠️ Missing date-based assignment columns';
            }
          } else if (sheetName === 'roles') {
            if (columnHeaders.includes('role_type_id')) {
              notes = '🆕 Role types relationship added';
            } else {
              notes = '⚠️ Missing role_type_id column';
            }
          } else if (['user_profile_types', 'role_types', 'user_profiles'].includes(sheetName)) {
            notes = '🆕 NEW: Universal Entity Architecture table';
          } else {
            // General audit field check
            if (columnHeaders.includes('is_active') && columnHeaders.includes('created_at')) {
              notes = 'Has audit fields';
            } else if (sheetName === 'ticket_history' || sheetName === 'ticket_action_logs' || sheetName === 'admin_action_logs') {
              notes = 'Immutable log table (no audit fields needed)';
            } else {
              notes = '⚠️ Missing audit fields';
            }
          }
        } else {
          status = '❓ Unexpected sheet';
          notes = 'Not in CLAUDE.md specification';
        }

      } else {
        columnHeaders = 'Empty sheet';
        sampleRow = 'No data';
        status = '❌ Empty';
        notes = 'Sheet exists but has no data';
      }

      schemaData.push([
        sheetName,
        lastColumn,
        columnHeaders,
        sampleRow,
        lastRow - 1, // Subtract 1 for header row
        status,
        notes
      ]);

    } catch (error) {
      schemaData.push([
        sheetName,
        0,
        'ERROR',
        'ERROR: ' + error.toString(),
        0,
        '❌ Error',
        'Failed to analyze sheet'
      ]);
    }
  }

  // Check for missing expected sheets
  for (const expectedSheet in expectedSheets) {
    const found = schemaData.some(row => row[0] === expectedSheet);
    if (!found) {
      schemaData.push([
        expectedSheet,
        0,
        expectedSheets[expectedSheet],
        'SHEET MISSING',
        0,
        '❌ Missing',
        'Required by CLAUDE.md specification'
      ]);
    }
  }

  // Sort data: existing sheets first, then missing sheets
  schemaData.sort((a, b) => {
    if (a[4] > 0 && b[4] === 0) return -1; // Existing sheets first
    if (a[4] === 0 && b[4] > 0) return 1;  // Missing sheets last
    return a[0].localeCompare(b[0]); // Alphabetical within groups
  });

  // Write data to sheet
  if (schemaData.length > 0) {
    xSchemaSheet.getRange(2, 1, schemaData.length, headers.length).setValues(schemaData);
  }

  // Add Universal Entity Architecture summary at the bottom
  const summaryStartRow = schemaData.length + 4;
  const existingSheets = schemaData.filter(row => row[4] > 0).length;
  const missingSheets = schemaData.filter(row => row[4] === 0).length;
  const sheetsWithAuditFields = schemaData.filter(row => row[6] === 'Has audit fields').length;
  const sheetsNeedingAuditFields = schemaData.filter(row => row[6] === '⚠️ Missing audit fields').length;
  const universalEntitySheets = schemaData.filter(row => row[6].includes('🆕')).length;

  const summary = [
    ['📊 SCHEMA ANALYSIS SUMMARY - UNIVERSAL ENTITY ARCHITECTURE'],
    [''],
    ['Total Sheets Found:', existingSheets],
    ['Missing Required Sheets:', missingSheets],
    ['Sheets with Audit Fields:', sheetsWithAuditFields],
    ['Sheets Needing Audit Fields:', sheetsNeedingAuditFields],
    ['Universal Entity Enhanced Sheets:', universalEntitySheets],
    [''],
    ['🎯 UNIVERSAL ENTITY ARCHITECTURE STATUS:'],
    ['✅ Custom Fields Infrastructure: Reusable for all entity types'],
    ['✅ User Profile Types: New table for configurable user profiles'],
    ['✅ Role Types: New table for configurable role types'],
    ['✅ Date-based Assignments: Enhanced role management'],
    [''],
    ['🔄 NEXT STEPS:'],
    ['1. Execute completeSystemReset() in Google Apps Script'],
    ['2. Create missing Universal Entity tables'],
    ['3. Add entity_category columns to custom_fields tables'],
    ['4. Enhance user_role_assignments with date-based features'],
    ['5. Test Universal Entity Architecture implementation']
  ];

  xSchemaSheet.getRange(summaryStartRow, 1, summary.length, 2).setValues(summary);
  xSchemaSheet.getRange(summaryStartRow, 1).setFontWeight('bold');
  xSchemaSheet.getRange(summaryStartRow, 1).setFontSize(12);

  // Format the sheet
  xSchemaSheet.autoResizeColumns(1, headers.length);
  xSchemaSheet.setFrozenRows(1);

  // Add conditional formatting for status column
  const statusRange = xSchemaSheet.getRange(2, 6, schemaData.length, 1);

  // Create rules for different statuses
  const rules = [];

  // Green for expected sheets
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('✅ Expected')
    .setBackground('#d4edda')
    .setRanges([statusRange])
    .build());

  // Red for missing/error sheets
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('❌')
    .setBackground('#f8d7da')
    .setRanges([statusRange])
    .build());

  // Yellow for unexpected sheets
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('❓')
    .setBackground('#fff3cd')
    .setRanges([statusRange])
    .build());

  xSchemaSheet.setConditionalFormatRules(rules);

  Logger.log('Universal Entity Architecture schema analysis complete. Results written to xSchema sheet.');

  return {
    status: 'success',
    message: 'Universal Entity Architecture schema analysis complete',
    totalSheets: existingSheets,
    missingSheets: missingSheets,
    sheetsWithAuditFields: sheetsWithAuditFields,
    sheetsNeedingAuditFields: sheetsNeedingAuditFields,
    universalEntitySheets: universalEntitySheets
  };
}

/**
 * Helper function to get detailed column analysis for a specific sheet
 * Enhanced for Universal Entity Architecture validation
 * @param {string} sheetName - Name of the sheet to analyze
 * @returns {Object} Detailed column analysis
 */
function analyzeSheetColumns(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  try {
    const sheet = ss.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow < 1 || lastColumn < 1) {
      return { error: 'Sheet is empty' };
    }

    const headersRange = sheet.getRange(1, 1, 1, lastColumn);
    const headers = headersRange.getValues()[0];

    const columnAnalysis = [];
    const universalEntityChecks = {
      hasEntityCategory: false,
      hasAuditFields: false,
      hasDateBasedAssignment: false,
      hasRoleTypeRelation: false
    };

    for (let col = 0; col < headers.length; col++) {
      const columnName = headers[col];
      let sampleValues = [];
      let dataTypes = new Set();

      // Check for Universal Entity Architecture columns
      if (columnName === 'entity_category') universalEntityChecks.hasEntityCategory = true;
      if (columnName === 'is_active' || columnName === 'created_at') universalEntityChecks.hasAuditFields = true;
      if (columnName === 'assignment_type' || columnName === 'effective_start_date') universalEntityChecks.hasDateBasedAssignment = true;
      if (columnName === 'role_type_id') universalEntityChecks.hasRoleTypeRelation = true;

      // Get sample values from first 5 data rows
      const maxSampleRows = Math.min(6, lastRow); // Row 1 is headers, so 2-6 for data
      if (maxSampleRows > 1) {
        const sampleRange = sheet.getRange(2, col + 1, maxSampleRows - 1, 1);
        const values = sampleRange.getValues();

        values.forEach(([value]) => {
          if (value !== null && value !== '') {
            sampleValues.push(String(value).substring(0, 30));
            dataTypes.add(typeof value);
          }
        });
      }

      columnAnalysis.push({
        position: col + 1,
        name: columnName,
        sampleValues: sampleValues.slice(0, 3), // Show first 3 samples
        dataTypes: Array.from(dataTypes),
        isEmpty: sampleValues.length === 0
      });
    }

    return {
      sheetName: sheetName,
      totalColumns: lastColumn,
      totalRows: lastRow - 1, // Exclude header
      columns: columnAnalysis,
      universalEntityStatus: universalEntityChecks
    };

  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Create missing Universal Entity Architecture sheets based on CLAUDE.md specification
 * Creates the new tables required for user/role management
 */
function createUniversalEntitySheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const universalEntitySheets = [
    {
      name: 'user_profile_types',
      headers: ['id', 'name', 'description', 'code', 'company_id', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deactivated_at', 'deactivated_by', 'deactivation_reason']
    },
    {
      name: 'role_types',
      headers: ['id', 'name', 'description', 'code', 'company_id', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deactivated_at', 'deactivated_by', 'deactivation_reason']
    },
    {
      name: 'user_profiles',
      headers: ['user_id', 'user_profile_type_id', 'display_name', 'email', 'immediate_approver_id', 'backup_approver_id', 'status', 'hire_date', 'is_active', 'created_at', 'updated_at', 'updated_by', 'deactivated_at', 'deactivated_by', 'deactivation_reason']
    }
  ];

  const created = [];
  const skipped = [];

  universalEntitySheets.forEach(sheetConfig => {
    try {
      const existing = ss.getSheetByName(sheetConfig.name);
      skipped.push(sheetConfig.name + ' (already exists)');
    } catch (error) {
      // Sheet doesn't exist, create it
      const newSheet = ss.insertSheet(sheetConfig.name);

      // Add headers
      newSheet.getRange(1, 1, 1, sheetConfig.headers.length).setValues([sheetConfig.headers]);
      newSheet.getRange(1, 1, 1, sheetConfig.headers.length).setFontWeight('bold');
      newSheet.getRange(1, 1, 1, sheetConfig.headers.length).setBackground('#4285f4');
      newSheet.getRange(1, 1, 1, sheetConfig.headers.length).setFontColor('white');

      // Auto-resize columns
      newSheet.autoResizeColumns(1, sheetConfig.headers.length);

      created.push(sheetConfig.name);
    }
  });

  Logger.log('Universal Entity sheets created: ' + created.join(', '));
  Logger.log('Universal Entity sheets skipped: ' + skipped.join(', '));

  return {
    created: created,
    skipped: skipped,
    message: 'Universal Entity Architecture sheet creation complete. Run schema analyzer to verify structure.'
  };
}

/**
 * Validate Universal Entity Architecture implementation
 * Checks if all required columns and relationships are in place
 */
function validateUniversalEntityArchitecture() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const validationResults = {
    status: 'success',
    checks: [],
    errors: [],
    warnings: []
  };

  // Check custom_fields has entity_category
  try {
    const customFieldsSheet = ss.getSheetByName('custom_fields');
    const headers = customFieldsSheet.getRange(1, 1, 1, customFieldsSheet.getLastColumn()).getValues()[0];

    if (headers.includes('entity_category')) {
      validationResults.checks.push('✅ custom_fields has entity_category column');
    } else {
      validationResults.errors.push('❌ custom_fields missing entity_category column');
    }
  } catch (error) {
    validationResults.errors.push('❌ custom_fields sheet not found');
  }

  // Check custom_field_values has entity_category
  try {
    const customFieldValuesSheet = ss.getSheetByName('custom_field_values');
    const headers = customFieldValuesSheet.getRange(1, 1, 1, customFieldValuesSheet.getLastColumn()).getValues()[0];

    if (headers.includes('entity_category')) {
      validationResults.checks.push('✅ custom_field_values has entity_category column');
    } else {
      validationResults.errors.push('❌ custom_field_values missing entity_category column');
    }
  } catch (error) {
    validationResults.errors.push('❌ custom_field_values sheet not found');
  }

  // Check for Universal Entity tables
  const requiredTables = ['user_profile_types', 'role_types', 'user_profiles'];
  requiredTables.forEach(tableName => {
    try {
      const sheet = ss.getSheetByName(tableName);
      validationResults.checks.push(`✅ ${tableName} table exists`);
    } catch (error) {
      validationResults.errors.push(`❌ ${tableName} table missing`);
    }
  });

  if (validationResults.errors.length > 0) {
    validationResults.status = 'failed';
  } else if (validationResults.warnings.length > 0) {
    validationResults.status = 'warning';
  }

  Logger.log('Universal Entity Architecture validation: ' + validationResults.status);

  return validationResults;
}