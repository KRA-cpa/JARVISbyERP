/**
 * =================================================================================
 * DATABASE SCHEMA ANALYZER FUNCTION
 * Purpose: Analyze current Google Sheets database structure and document schema
 * Usage: Add this function to your APPSCRIPT.txt file and run analyzeCurrentSchema()
 * Output: Updates 'xSchema' sheet with complete database schema documentation
 *
 * PHASE 11.0 UPDATE (September 28, 2025):
 * Added validation for 8 new Ticket Tags & Collaboration System tables:
 * - ticket_tags, ticket_tag_assignments, tag_categories, tag_usage_statistics
 * - ticket_collaborations, collaboration_requests, collaboration_notifications
 * - shared_ticket_access_logs
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

  // Define expected sheets from CLAUDE.md specification
  const expectedSheets = {
    'companies': 'id|name|code|code_locked|code_locked_at|code_locked_reason|ticket_count + audit fields',
    'roles': 'id|name|company_id + audit fields',
    'tickets': 'id|ticket_number|title|ticket_type_id|requester_id|status|current_step_id|step_due_date|company_id + audit fields',
    'ticket_history': 'id|ticket_id|user_id|action|comment|timestamp',
    'ticket_types': 'id|transaction_id|code|name|description|is_active|require_attachment_on_create|company_id + audit fields',
    'comment_requirements': 'ticket_type_id|require_on_approve|require_on_return|require_on_reject|require_on_cancel',
    'custom_fields': 'id|ticket_type_id|name|label|type|is_required|is_hidden|sort_order|dropdown_list_id|depends_on_field_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason',
    'custom_field_values': 'id|ticket_id|custom_field_id|text_value|number_value|date_value|start_date_value|end_date_value|dropdown_option_id|is_active|created_at|created_by|updated_at|updated_by|deleted_at|deleted_by|deletion_reason',
    'workflow_steps': 'id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|next_ticket_type_id|external_app_url|completion_action_name|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason',
    'step_approvers': 'step_id|role_id',
    'user_role_assignments': 'user_id|ticket_type_id|role_id|validity_end_date|company_id + audit fields',
    'step_slas': 'step_id|duration|unit|exclude_weekends + audit fields',
    'step_conditions': 'id|step_id|custom_field_id|operator|value + audit fields',
    'dropdown_lists': 'id|name|description + audit fields',
    'dropdown_options': 'id|dropdown_list_id|label|value|parent_option_id + audit fields',
    'dropdown_company_assignments': 'id|dropdown_list_id|company_id|is_global|is_active + audit fields',
    'ticket_attachments': 'id|ticket_id|uploader_id|file_name|file_url|uploaded_at',
    'report_configurations': 'id|ticket_type_id|field_name|display_name|field_type|sort_order',
    'ticket_links': 'id|parent_ticket_id|child_ticket_id',
    'sequence_counters': 'sequence_name|last_number',
    'ticket_action_logs': 'id|ticket_id|user_id|action_type|details|timestamp',
    'admin_action_logs': 'id|admin_user_id|action_type|target_entity|target_id|details|timestamp',
    'user_preferences': 'id|user_id|dark_mode|timezone|language|email_notifications|desktop_notifications|dashboard_layout|items_per_page|auto_refresh|refresh_interval + audit fields',
    // Phase 11.0: Ticket Tags & Collaboration System (8 new tables)
    'ticket_tags': 'id|name|color|description|tag_category|parent_tag_id|company_id|is_global|usage_count|created_by_user_id + audit fields',
    'ticket_tag_assignments': 'id|ticket_id|tag_id|assigned_by_user_id|assignment_reason|confidence_score + audit fields',
    'tag_categories': 'id|name|description|color|sort_order|company_id|is_global|category_rules + audit fields',
    'tag_usage_statistics': 'id|tag_id|company_id|usage_count|last_used_at|trending_score|popularity_rank|usage_context + audit fields',
    'ticket_collaborations': 'id|ticket_id|owner_user_id|shared_with_user_id|access_level|sharing_reason|business_justification|expires_at + audit fields',
    'collaboration_requests': 'id|ticket_id|requester_user_id|target_user_id|requested_access_level|approval_required|approver_user_id|request_reason|business_justification|approval_status|approved_at|expires_at + audit fields',
    'collaboration_notifications': 'id|collaboration_id|recipient_user_id|notification_type|message|read_at|action_taken|notification_priority + audit fields',
    'shared_ticket_access_logs': 'id|collaboration_id|accessing_user_id|access_type|resource_accessed|access_timestamp|ip_address|user_agent|session_id + audit fields'
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

        // Determine status
        if (expectedSheets[sheetName]) {
          status = '✅ Expected';
          // Check if headers match expected structure
          if (columnHeaders.includes('is_active') && columnHeaders.includes('created_at')) {
            notes = 'Has audit fields';
          } else if (sheetName === 'ticket_history' || sheetName === 'ticket_action_logs' || sheetName === 'admin_action_logs') {
            notes = 'Immutable log table (no audit fields needed)';
          } else {
            notes = '⚠️ Missing audit fields';
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

  // Add summary at the bottom
  const summaryStartRow = schemaData.length + 4;
  const existingSheets = schemaData.filter(row => row[4] > 0).length;
  const missingSheets = schemaData.filter(row => row[4] === 0).length;
  const sheetsWithAuditFields = schemaData.filter(row => row[6] === 'Has audit fields').length;
  const sheetsNeedingAuditFields = schemaData.filter(row => row[6] === '⚠️ Missing audit fields').length;

  const summary = [
    ['📊 SCHEMA ANALYSIS SUMMARY'],
    [''],
    ['Total Sheets Found:', existingSheets],
    ['Missing Required Sheets:', missingSheets],
    ['Sheets with Audit Fields:', sheetsWithAuditFields],
    ['Sheets Needing Audit Fields:', sheetsNeedingAuditFields],
    [''],
    ['🎯 NEXT STEPS:'],
    ['1. Create missing sheets'],
    ['2. Add audit fields to existing sheets'],
    ['3. Populate with sample data'],
    ['4. Update AppScript initialization functions']
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

  Logger.log('Schema analysis complete. Results written to xSchema sheet.');

  return {
    status: 'success',
    message: 'Schema analysis complete',
    totalSheets: existingSheets,
    missingSheets: missingSheets,
    sheetsWithAuditFields: sheetsWithAuditFields,
    sheetsNeedingAuditFields: sheetsNeedingAuditFields
  };
}

/**
 * Helper function to get detailed column analysis for a specific sheet
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

    for (let col = 0; col < headers.length; col++) {
      const columnName = headers[col];
      let sampleValues = [];
      let dataTypes = new Set();

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
      columns: columnAnalysis
    };

  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Create missing sheets based on CLAUDE.md specification
 * WARNING: This will create empty sheets - you'll need to add proper initialization
 */
function createMissingSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const requiredSheets = [
    'custom_fields',
    'workflow_steps',
    'custom_field_values',
    'ticket_history',
    'ticket_action_logs',
    'admin_action_logs',
    'ticket_attachments',
    'report_configurations',
    'ticket_links',
    // Phase 11.0: Ticket Tags & Collaboration System
    'ticket_tags',
    'ticket_tag_assignments',
    'tag_categories',
    'tag_usage_statistics',
    'ticket_collaborations',
    'collaboration_requests',
    'collaboration_notifications',
    'shared_ticket_access_logs'
  ];

  const created = [];
  const skipped = [];

  requiredSheets.forEach(sheetName => {
    try {
      const existing = ss.getSheetByName(sheetName);
      skipped.push(sheetName + ' (already exists)');
    } catch (error) {
      // Sheet doesn't exist, create it
      const newSheet = ss.insertSheet(sheetName);
      newSheet.getRange(1, 1).setValue('Sheet created - needs proper initialization');
      created.push(sheetName);
    }
  });

  Logger.log('Created sheets: ' + created.join(', '));
  Logger.log('Skipped sheets: ' + skipped.join(', '));

  return {
    created: created,
    skipped: skipped,
    message: 'Sheet creation complete. Run initialization functions to add proper structure.'
  };
}