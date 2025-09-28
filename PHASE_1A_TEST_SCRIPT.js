/**
 * =================================================================================
 * PHASE 1A TESTING SCRIPT
 * Purpose: Comprehensive testing of Custom Fields System functions
 * Version: 6.1
 * Date: September 26, 2025
 * =================================================================================
 */

/**
 * Master test function for Phase 1A - Custom Fields System
 * Tests all 12 functions in proper sequence
 *
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Copy this entire script to the bottom of APPSCRIPT.txt
 * 2. Run testPhase1AComplete() in Google Apps Script editor
 * 3. Check execution transcript and console logs for results
 * 4. Verify data in custom_fields and custom_field_values sheets
 */
function testPhase1AComplete() {
  Logger.log('='.repeat(80));
  Logger.log('STARTING PHASE 1A COMPREHENSIVE TEST');
  Logger.log('Testing Custom Fields System Functions');
  Logger.log('='.repeat(80));

  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test 1: Initialize sheets
    Logger.log('\n--- TEST 1: SHEET INITIALIZATION ---');
    testInitialization(testResults);

    // Test 2: Custom Fields CRUD
    Logger.log('\n--- TEST 2: CUSTOM FIELDS CRUD ---');
    const fieldId = testCustomFieldsCRUD(testResults);

    // Test 3: Custom Field Values CRUD
    Logger.log('\n--- TEST 3: CUSTOM FIELD VALUES CRUD ---');
    testCustomFieldValuesCRUD(testResults, fieldId);

    // Test 4: Advanced operations
    Logger.log('\n--- TEST 4: ADVANCED OPERATIONS ---');
    testAdvancedOperations(testResults, fieldId);

    // Test 5: Validation and edge cases
    Logger.log('\n--- TEST 5: VALIDATION & EDGE CASES ---');
    testValidationEdgeCases(testResults);

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('CRITICAL ERROR: ' + error.toString());
    Logger.log('CRITICAL TEST FAILURE: ' + error.toString());
  }

  // Final results
  Logger.log('\n' + '='.repeat(80));
  Logger.log('PHASE 1A TEST RESULTS:');
  Logger.log('PASSED: ' + testResults.passed);
  Logger.log('FAILED: ' + testResults.failed);
  Logger.log('SUCCESS RATE: ' + Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100) + '%');

  if (testResults.errors.length > 0) {
    Logger.log('\nERRORS ENCOUNTERED:');
    testResults.errors.forEach((error, index) => {
      Logger.log((index + 1) + '. ' + error);
    });
  }

  if (testResults.failed === 0) {
    Logger.log('\n✅ PHASE 1A: ALL TESTS PASSED - READY FOR PHASE 1B');
  } else {
    Logger.log('\n❌ PHASE 1A: TESTS FAILED - REVIEW ERRORS BEFORE PROCEEDING');
  }

  Logger.log('='.repeat(80));

  return {
    success: testResults.failed === 0,
    passed: testResults.passed,
    failed: testResults.failed,
    errors: testResults.errors
  };
}

function testInitialization(testResults) {
  try {
    Logger.log('Testing sheet initialization...');

    // Test custom_fields sheet initialization
    const customFieldsResult = initializeCustomFieldsSheet();
    if (customFieldsResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Custom Fields sheet initialization: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Custom Fields sheet initialization failed: ' + customFieldsResult.message);
      Logger.log('❌ Custom Fields sheet initialization: FAIL');
    }

    // Test custom_field_values sheet initialization
    const valuesResult = initializeCustomFieldValuesSheet();
    if (valuesResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Custom Field Values sheet initialization: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Custom Field Values sheet initialization failed: ' + valuesResult.message);
      Logger.log('❌ Custom Field Values sheet initialization: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Initialization test error: ' + error.toString());
    Logger.log('❌ Initialization test error: ' + error.toString());
  }
}

function testCustomFieldsCRUD(testResults) {
  let fieldId = null;

  try {
    Logger.log('Testing Custom Fields CRUD operations...');

    // CREATE: Test field creation
    const createPayload = {
      ticket_type_id: 'tt_1',
      name: 'test_budget_amount',
      label: 'Project Budget',
      type: 'amount',
      is_required: true,
      is_hidden: false,
      sort_order: 1
    };

    const createResult = createCustomField(createPayload);
    if (createResult.status === 'success' && createResult.data && createResult.data.id) {
      fieldId = createResult.data.id;
      testResults.passed++;
      Logger.log('✅ Create Custom Field: PASS (ID: ' + fieldId + ')');
    } else {
      testResults.failed++;
      testResults.errors.push('Create Custom Field failed: ' + (createResult.message || 'Unknown error'));
      Logger.log('❌ Create Custom Field: FAIL');
      return null;
    }

    // READ: Test field retrieval
    const getResult = getCustomFields('tt_1');
    if (getResult.status === 'success' && getResult.data && getResult.data.length > 0) {
      testResults.passed++;
      Logger.log('✅ Get Custom Fields: PASS (' + getResult.data.length + ' fields found)');
    } else {
      testResults.failed++;
      testResults.errors.push('Get Custom Fields failed: ' + (getResult.message || 'No fields found'));
      Logger.log('❌ Get Custom Fields: FAIL');
    }

    // UPDATE: Test field update
    const updatePayload = {
      label: 'Updated Project Budget',
      is_required: false
    };

    const updateResult = updateCustomField(fieldId, updatePayload);
    if (updateResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Update Custom Field: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Update Custom Field failed: ' + (updateResult.message || 'Unknown error'));
      Logger.log('❌ Update Custom Field: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Custom Fields CRUD test error: ' + error.toString());
    Logger.log('❌ Custom Fields CRUD test error: ' + error.toString());
  }

  return fieldId;
}

function testCustomFieldValuesCRUD(testResults, fieldId) {
  let valueId = null;

  try {
    Logger.log('Testing Custom Field Values CRUD operations...');

    if (!fieldId) {
      testResults.failed++;
      testResults.errors.push('Cannot test values CRUD - no valid field ID from previous test');
      Logger.log('❌ Custom Field Values CRUD: FAIL (No field ID)');
      return;
    }

    // CREATE: Test value creation
    const createPayload = {
      ticket_id: 'tk_1',
      custom_field_id: fieldId,
      number_value: 50000.00
    };

    const createResult = createCustomFieldValue(createPayload);
    if (createResult.status === 'success' && createResult.data && createResult.data.id) {
      valueId = createResult.data.id;
      testResults.passed++;
      Logger.log('✅ Create Custom Field Value: PASS (ID: ' + valueId + ')');
    } else {
      testResults.failed++;
      testResults.errors.push('Create Custom Field Value failed: ' + (createResult.message || 'Unknown error'));
      Logger.log('❌ Create Custom Field Value: FAIL');
      return;
    }

    // READ: Test value retrieval
    const getResult = getCustomFieldValues('tk_1');
    if (getResult.status === 'success' && getResult.data && getResult.data.length > 0) {
      testResults.passed++;
      Logger.log('✅ Get Custom Field Values: PASS (' + getResult.data.length + ' values found)');
    } else {
      testResults.failed++;
      testResults.errors.push('Get Custom Field Values failed: ' + (getResult.message || 'No values found'));
      Logger.log('❌ Get Custom Field Values: FAIL');
    }

    // UPDATE: Test value update
    const updatePayload = {
      number_value: 75000.00
    };

    const updateResult = updateCustomFieldValue(valueId, updatePayload);
    if (updateResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Update Custom Field Value: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Update Custom Field Value failed: ' + (updateResult.message || 'Unknown error'));
      Logger.log('❌ Update Custom Field Value: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Custom Field Values CRUD test error: ' + error.toString());
    Logger.log('❌ Custom Field Values CRUD test error: ' + error.toString());
  }
}

function testAdvancedOperations(testResults, fieldId) {
  try {
    Logger.log('Testing advanced operations...');

    if (!fieldId) {
      Logger.log('⚠️ Skipping advanced operations - no valid field ID');
      return;
    }

    // Test field reordering
    const reorderResult = reorderCustomFields('tt_1', [fieldId]);
    if (reorderResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Reorder Custom Fields: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Reorder Custom Fields failed: ' + (reorderResult.message || 'Unknown error'));
      Logger.log('❌ Reorder Custom Fields: FAIL');
    }

    // Test bulk value update
    const bulkPayload = {};
    bulkPayload[fieldId] = { number_value: 100000.00 };

    const bulkResult = bulkUpdateCustomFieldValues('tk_1', bulkPayload);
    if (bulkResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Bulk Update Custom Field Values: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Bulk Update Custom Field Values failed: ' + (bulkResult.message || 'Unknown error'));
      Logger.log('❌ Bulk Update Custom Field Values: FAIL');
    }

    // Test validation
    const validateResult = validateCustomFieldValues('tk_1', bulkPayload);
    if (validateResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Validate Custom Field Values: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Validate Custom Field Values failed: ' + (validateResult.message || 'Unknown error'));
      Logger.log('❌ Validate Custom Field Values: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Advanced operations test error: ' + error.toString());
    Logger.log('❌ Advanced operations test error: ' + error.toString());
  }
}

function testValidationEdgeCases(testResults) {
  try {
    Logger.log('Testing validation and edge cases...');

    // Test date validation helper
    const validDate = isValidDate('2025-12-31');
    const invalidDate = isValidDate('invalid-date');

    if (validDate === true && invalidDate === false) {
      testResults.passed++;
      Logger.log('✅ Date Validation: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Date validation failed - valid: ' + validDate + ', invalid: ' + invalidDate);
      Logger.log('❌ Date Validation: FAIL');
    }

    // Test search functionality
    const searchResult = searchCustomFieldValues({
      ticket_id: 'tk_1',
      field_type: 'amount'
    });

    if (searchResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Search Custom Field Values: PASS (' + searchResult.data.length + ' results)');
    } else {
      testResults.failed++;
      testResults.errors.push('Search Custom Field Values failed: ' + (searchResult.message || 'Unknown error'));
      Logger.log('❌ Search Custom Field Values: FAIL');
    }

    // Test invalid field creation (should fail gracefully)
    const invalidCreateResult = createCustomField({
      // Missing required fields
      name: 'invalid_field'
    });

    if (invalidCreateResult.status === 'error') {
      testResults.passed++;
      Logger.log('✅ Invalid Field Creation Handling: PASS (properly rejected)');
    } else {
      testResults.failed++;
      testResults.errors.push('Invalid Field Creation should have failed but succeeded');
      Logger.log('❌ Invalid Field Creation Handling: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Validation edge cases test error: ' + error.toString());
    Logger.log('❌ Validation edge cases test error: ' + error.toString());
  }
}

/**
 * Quick smoke test - tests basic functionality only
 * Use this for rapid validation during development
 */
function testPhase1ASmoke() {
  Logger.log('PHASE 1A SMOKE TEST - Basic functionality only');

  try {
    // Test 1: Basic initialization
    const initResult = initializeCustomFieldsSheet();
    Logger.log('Initialization: ' + initResult.status);

    // Test 2: Basic field creation
    const field = createCustomField({
      ticket_type_id: 'tt_1',
      name: 'smoke_test',
      label: 'Smoke Test Field',
      type: 'text',
      is_required: false,
      is_hidden: false,
      sort_order: 99
    });
    Logger.log('Field Creation: ' + field.status);

    // Test 3: Basic field retrieval
    const fields = getCustomFields('tt_1');
    Logger.log('Field Retrieval: ' + fields.status + ' (' + (fields.data ? fields.data.length : 0) + ' fields)');

    Logger.log('✅ SMOKE TEST COMPLETE');
    return true;

  } catch (error) {
    Logger.log('❌ SMOKE TEST FAILED: ' + error.toString());
    return false;
  }
}