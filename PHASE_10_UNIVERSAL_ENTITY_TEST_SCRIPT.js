/**
 * =================================================================================
 * PHASE 10.0 UNIVERSAL ENTITY ARCHITECTURE TESTING SCRIPT
 * Purpose: Comprehensive testing of Universal Entity Architecture implementation
 * Version: 1.0
 * Date: September 27, 2025
 * =================================================================================
 */

/**
 * Master test function for Phase 10.0 - Universal Entity Architecture
 * Tests all entity types (tickets, user_profiles, roles) with custom fields
 *
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Copy this entire script to the bottom of APPSCRIPT.txt
 * 2. Run testPhase10Complete() in Google Apps Script editor
 * 3. Check execution transcript and console logs for results
 * 4. Verify data in custom_fields, user_profile_types, role_types sheets
 */
function testPhase10Complete() {
  Logger.log('='.repeat(80));
  Logger.log('STARTING PHASE 10.0 UNIVERSAL ENTITY ARCHITECTURE TEST');
  Logger.log('Testing Universal Entity Architecture Functions');
  Logger.log('='.repeat(80));

  const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    entityTypes: {
      ticket: { passed: 0, failed: 0 },
      user_profile: { passed: 0, failed: 0 },
      role: { passed: 0, failed: 0 }
    }
  };

  try {
    // Test 1: Initialize Universal Entity Architecture sheets
    Logger.log('\n--- TEST 1: UNIVERSAL ENTITY SHEET INITIALIZATION ---');
    testUniversalEntityInitialization(testResults);

    // Test 2: User Profile Types CRUD
    Logger.log('\n--- TEST 2: USER PROFILE TYPES CRUD ---');
    const userProfileTypeId = testUserProfileTypesCRUD(testResults);

    // Test 3: Role Types CRUD
    Logger.log('\n--- TEST 3: ROLE TYPES CRUD ---');
    const roleTypeId = testRoleTypesCRUD(testResults);

    // Test 4: Universal Custom Fields - Tickets
    Logger.log('\n--- TEST 4: UNIVERSAL CUSTOM FIELDS - TICKETS ---');
    testUniversalCustomFields(testResults, 'tt_1', 'ticket');

    // Test 5: Universal Custom Fields - User Profiles
    Logger.log('\n--- TEST 5: UNIVERSAL CUSTOM FIELDS - USER PROFILES ---');
    if (userProfileTypeId) {
      testUniversalCustomFields(testResults, userProfileTypeId, 'user_profile');
    }

    // Test 6: Universal Custom Fields - Roles
    Logger.log('\n--- TEST 6: UNIVERSAL CUSTOM FIELDS - ROLES ---');
    if (roleTypeId) {
      testUniversalCustomFields(testResults, roleTypeId, 'role');
    }

    // Test 7: Cross-entity validation
    Logger.log('\n--- TEST 7: CROSS-ENTITY VALIDATION ---');
    testCrossEntityValidation(testResults);

    // Test 8: Backward compatibility
    Logger.log('\n--- TEST 8: BACKWARD COMPATIBILITY ---');
    testBackwardCompatibility(testResults);

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('CRITICAL ERROR: ' + error.toString());
    Logger.log('CRITICAL TEST FAILURE: ' + error.toString());
  }

  // Final results
  Logger.log('\n' + '='.repeat(80));
  Logger.log('PHASE 10.0 UNIVERSAL ENTITY ARCHITECTURE TEST RESULTS:');
  Logger.log('TOTAL PASSED: ' + testResults.passed);
  Logger.log('TOTAL FAILED: ' + testResults.failed);
  Logger.log('SUCCESS RATE: ' + Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100) + '%');

  Logger.log('\nRESULTS BY ENTITY TYPE:');
  Object.keys(testResults.entityTypes).forEach(entityType => {
    const results = testResults.entityTypes[entityType];
    const total = results.passed + results.failed;
    const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
    Logger.log(`${entityType.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`);
  });

  if (testResults.errors.length > 0) {
    Logger.log('\nERRORS ENCOUNTERED:');
    testResults.errors.forEach((error, index) => {
      Logger.log((index + 1) + '. ' + error);
    });
  }

  if (testResults.failed === 0) {
    Logger.log('\n✅ PHASE 10.0: ALL TESTS PASSED - UNIVERSAL ENTITY ARCHITECTURE READY');
  } else {
    Logger.log('\n❌ PHASE 10.0: TESTS FAILED - REVIEW ERRORS BEFORE DEPLOYMENT');
  }

  Logger.log('='.repeat(80));

  return {
    success: testResults.failed === 0,
    passed: testResults.passed,
    failed: testResults.failed,
    errors: testResults.errors,
    entityResults: testResults.entityTypes
  };
}

function testUniversalEntityInitialization(testResults) {
  try {
    Logger.log('Testing Universal Entity Architecture sheet initialization...');

    // Test universal entity sheets creation
    const universalSheetsResult = createUniversalEntitySheets();
    if (universalSheetsResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Universal Entity Sheets creation: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Universal Entity Sheets creation failed: ' + universalSheetsResult.message);
      Logger.log('❌ Universal Entity Sheets creation: FAIL');
    }

    // Test validation
    const validationResult = validateUniversalEntityArchitecture();
    if (validationResult.status === 'success') {
      testResults.passed++;
      Logger.log('✅ Universal Entity Architecture validation: PASS');
      Logger.log('   Checks passed: ' + validationResult.summary.checks_passed);
      Logger.log('   Errors: ' + validationResult.summary.errors);
      Logger.log('   Warnings: ' + validationResult.summary.warnings);
    } else {
      testResults.failed++;
      testResults.errors.push('Universal Entity Architecture validation failed: ' + validationResult.message);
      Logger.log('❌ Universal Entity Architecture validation: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Universal Entity initialization test error: ' + error.toString());
    Logger.log('❌ Universal Entity initialization test error: ' + error.toString());
  }
}

function testUserProfileTypesCRUD(testResults) {
  let userProfileTypeId = null;

  try {
    Logger.log('Testing User Profile Types CRUD operations...');

    // CREATE: Test user profile type creation
    const createPayload = {
      name: 'Test Employee Profile',
      description: 'Test employee profile for Universal Entity testing',
      code: 'TEST_EMP',
      company_id: null // Global
    };

    const createResult = createUserProfileType(createPayload);
    if (createResult.status === 'success' && createResult.data && createResult.data.id) {
      userProfileTypeId = createResult.data.id;
      testResults.passed++;
      testResults.entityTypes.user_profile.passed++;
      Logger.log('✅ Create User Profile Type: PASS (ID: ' + userProfileTypeId + ')');
    } else {
      testResults.failed++;
      testResults.entityTypes.user_profile.failed++;
      testResults.errors.push('Create User Profile Type failed: ' + (createResult.message || 'Unknown error'));
      Logger.log('❌ Create User Profile Type: FAIL');
      return null;
    }

    // READ: Test user profile type retrieval
    const getResult = getUserProfileTypes();
    if (getResult.status === 'success' && getResult.data && getResult.data.length > 0) {
      testResults.passed++;
      testResults.entityTypes.user_profile.passed++;
      Logger.log('✅ Get User Profile Types: PASS (' + getResult.data.length + ' types found)');
    } else {
      testResults.failed++;
      testResults.entityTypes.user_profile.failed++;
      testResults.errors.push('Get User Profile Types failed: ' + (getResult.message || 'No types found'));
      Logger.log('❌ Get User Profile Types: FAIL');
    }

    // UPDATE: Test user profile type update
    const updatePayload = {
      name: 'Updated Test Employee Profile',
      description: 'Updated description for testing'
    };

    const updateResult = updateUserProfileType(userProfileTypeId, updatePayload);
    if (updateResult.status === 'success') {
      testResults.passed++;
      testResults.entityTypes.user_profile.passed++;
      Logger.log('✅ Update User Profile Type: PASS');
    } else {
      testResults.failed++;
      testResults.entityTypes.user_profile.failed++;
      testResults.errors.push('Update User Profile Type failed: ' + (updateResult.message || 'Unknown error'));
      Logger.log('❌ Update User Profile Type: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.entityTypes.user_profile.failed++;
    testResults.errors.push('User Profile Types CRUD test error: ' + error.toString());
    Logger.log('❌ User Profile Types CRUD test error: ' + error.toString());
  }

  return userProfileTypeId;
}

function testRoleTypesCRUD(testResults) {
  let roleTypeId = null;

  try {
    Logger.log('Testing Role Types CRUD operations...');

    // CREATE: Test role type creation
    const createPayload = {
      name: 'Test Approver Role',
      description: 'Test approver role for Universal Entity testing',
      code: 'TEST_APR',
      company_id: null // Global
    };

    const createResult = createRoleType(createPayload);
    if (createResult.status === 'success' && createResult.data && createResult.data.id) {
      roleTypeId = createResult.data.id;
      testResults.passed++;
      testResults.entityTypes.role.passed++;
      Logger.log('✅ Create Role Type: PASS (ID: ' + roleTypeId + ')');
    } else {
      testResults.failed++;
      testResults.entityTypes.role.failed++;
      testResults.errors.push('Create Role Type failed: ' + (createResult.message || 'Unknown error'));
      Logger.log('❌ Create Role Type: FAIL');
      return null;
    }

    // READ: Test role type retrieval
    const getResult = getRoleTypes();
    if (getResult.status === 'success' && getResult.data && getResult.data.length > 0) {
      testResults.passed++;
      testResults.entityTypes.role.passed++;
      Logger.log('✅ Get Role Types: PASS (' + getResult.data.length + ' types found)');
    } else {
      testResults.failed++;
      testResults.entityTypes.role.failed++;
      testResults.errors.push('Get Role Types failed: ' + (getResult.message || 'No types found'));
      Logger.log('❌ Get Role Types: FAIL');
    }

    // UPDATE: Test role type update
    const updatePayload = {
      name: 'Updated Test Approver Role',
      description: 'Updated description for testing'
    };

    const updateResult = updateRoleType(roleTypeId, updatePayload);
    if (updateResult.status === 'success') {
      testResults.passed++;
      testResults.entityTypes.role.passed++;
      Logger.log('✅ Update Role Type: PASS');
    } else {
      testResults.failed++;
      testResults.entityTypes.role.failed++;
      testResults.errors.push('Update Role Type failed: ' + (updateResult.message || 'Unknown error'));
      Logger.log('❌ Update Role Type: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.entityTypes.role.failed++;
    testResults.errors.push('Role Types CRUD test error: ' + error.toString());
    Logger.log('❌ Role Types CRUD test error: ' + error.toString());
  }

  return roleTypeId;
}

function testUniversalCustomFields(testResults, entityTypeId, entityCategory) {
  let fieldId = null;

  try {
    Logger.log(`Testing Universal Custom Fields for ${entityCategory}...`);

    // CREATE: Test universal custom field creation
    const createResult = createCustomField(entityTypeId, {
      name: `test_${entityCategory}_field`,
      label: `Test ${entityCategory.charAt(0).toUpperCase() + entityCategory.slice(1)} Field`,
      type: 'text',
      is_required: false,
      is_hidden: false,
      sort_order: 1
    }, entityCategory);

    if (createResult.status === 'success' && createResult.data && createResult.data.id) {
      fieldId = createResult.data.id;
      testResults.passed++;
      testResults.entityTypes[entityCategory].passed++;
      Logger.log(`✅ Create Universal Custom Field (${entityCategory}): PASS (ID: ${fieldId})`);
    } else {
      testResults.failed++;
      testResults.entityTypes[entityCategory].failed++;
      testResults.errors.push(`Create Universal Custom Field (${entityCategory}) failed: ${createResult.message || 'Unknown error'}`);
      Logger.log(`❌ Create Universal Custom Field (${entityCategory}): FAIL`);
      return;
    }

    // READ: Test universal custom field retrieval
    const getResult = getCustomFields(entityTypeId, entityCategory);
    if (getResult.status === 'success' && getResult.data && getResult.data.length > 0) {
      testResults.passed++;
      testResults.entityTypes[entityCategory].passed++;
      Logger.log(`✅ Get Universal Custom Fields (${entityCategory}): PASS (${getResult.data.length} fields found)`);
    } else {
      testResults.failed++;
      testResults.entityTypes[entityCategory].failed++;
      testResults.errors.push(`Get Universal Custom Fields (${entityCategory}) failed: ${getResult.message || 'No fields found'}`);
      Logger.log(`❌ Get Universal Custom Fields (${entityCategory}): FAIL`);
    }

    // Test setting field values if applicable
    if (entityCategory === 'ticket' && fieldId) {
      const setValueResult = setCustomFieldValue('test_ticket_id', fieldId, 'Universal Entity Test Value', entityCategory);
      if (setValueResult.status === 'success') {
        testResults.passed++;
        testResults.entityTypes[entityCategory].passed++;
        Logger.log(`✅ Set Universal Custom Field Value (${entityCategory}): PASS`);
      } else {
        testResults.failed++;
        testResults.entityTypes[entityCategory].failed++;
        testResults.errors.push(`Set Universal Custom Field Value (${entityCategory}) failed: ${setValueResult.message || 'Unknown error'}`);
        Logger.log(`❌ Set Universal Custom Field Value (${entityCategory}): FAIL`);
      }
    }

  } catch (error) {
    testResults.failed++;
    testResults.entityTypes[entityCategory].failed++;
    testResults.errors.push(`Universal Custom Fields (${entityCategory}) test error: ${error.toString()}`);
    Logger.log(`❌ Universal Custom Fields (${entityCategory}) test error: ${error.toString()}`);
  }
}

function testCrossEntityValidation(testResults) {
  try {
    Logger.log('Testing cross-entity validation...');

    // Test that entities are properly isolated
    const ticketFields = getCustomFields('tt_1', 'ticket');
    const userProfileFields = getCustomFields('upt_1', 'user_profile');
    const roleFields = getCustomFields('rt_1', 'role');

    let isolationTest = true;
    let isolationMessage = '';

    if (ticketFields.status === 'success' && userProfileFields.status === 'success') {
      // Ensure ticket fields don't appear in user profile fields
      const ticketFieldNames = ticketFields.data ? ticketFields.data.map(f => f.name) : [];
      const userProfileFieldNames = userProfileFields.data ? userProfileFields.data.map(f => f.name) : [];

      const overlap = ticketFieldNames.filter(name => userProfileFieldNames.includes(name));
      if (overlap.length > 0) {
        isolationTest = false;
        isolationMessage = `Field overlap detected between tickets and user profiles: ${overlap.join(', ')}`;
      }
    }

    if (isolationTest) {
      testResults.passed++;
      Logger.log('✅ Cross-entity isolation: PASS');
    } else {
      testResults.failed++;
      testResults.errors.push('Cross-entity isolation failed: ' + isolationMessage);
      Logger.log('❌ Cross-entity isolation: FAIL');
    }

    // Test entity category validation
    const invalidCategoryResult = getCustomFields('tt_1', 'invalid_category');
    if (invalidCategoryResult.status === 'error') {
      testResults.passed++;
      Logger.log('✅ Invalid entity category handling: PASS (properly rejected)');
    } else {
      testResults.failed++;
      testResults.errors.push('Invalid entity category should have failed but succeeded');
      Logger.log('❌ Invalid entity category handling: FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Cross-entity validation test error: ' + error.toString());
    Logger.log('❌ Cross-entity validation test error: ' + error.toString());
  }
}

function testBackwardCompatibility(testResults) {
  try {
    Logger.log('Testing backward compatibility...');

    // Test old ticket-based custom field creation (should still work)
    const oldStyleResult = createCustomField({
      ticket_type_id: 'tt_1',
      name: 'backward_compat_test',
      label: 'Backward Compatibility Test',
      type: 'text',
      is_required: false,
      is_hidden: false,
      sort_order: 99
    });

    if (oldStyleResult.status === 'success') {
      testResults.passed++;
      testResults.entityTypes.ticket.passed++;
      Logger.log('✅ Backward compatibility (old API): PASS');
    } else {
      testResults.failed++;
      testResults.entityTypes.ticket.failed++;
      testResults.errors.push('Backward compatibility failed: ' + (oldStyleResult.message || 'Unknown error'));
      Logger.log('❌ Backward compatibility (old API): FAIL');
    }

    // Test old custom field retrieval
    const oldGetResult = getCustomFields('tt_1');
    if (oldGetResult.status === 'success') {
      testResults.passed++;
      testResults.entityTypes.ticket.passed++;
      Logger.log('✅ Backward compatibility (old get): PASS');
    } else {
      testResults.failed++;
      testResults.entityTypes.ticket.failed++;
      testResults.errors.push('Backward compatibility get failed: ' + (oldGetResult.message || 'Unknown error'));
      Logger.log('❌ Backward compatibility (old get): FAIL');
    }

  } catch (error) {
    testResults.failed++;
    testResults.errors.push('Backward compatibility test error: ' + error.toString());
    Logger.log('❌ Backward compatibility test error: ' + error.toString());
  }
}

/**
 * Quick smoke test for Universal Entity Architecture
 * Use this for rapid validation during development
 */
function testPhase10Smoke() {
  Logger.log('PHASE 10.0 UNIVERSAL ENTITY ARCHITECTURE SMOKE TEST');

  try {
    // Test 1: Universal Entity initialization
    const initResult = createUniversalEntitySheets();
    Logger.log('Universal Entity Initialization: ' + initResult.status);

    // Test 2: User profile type creation
    const userProfileType = createUserProfileType({
      name: 'Smoke Test Employee',
      code: 'SMOKE_EMP'
    });
    Logger.log('User Profile Type Creation: ' + userProfileType.status);

    // Test 3: Role type creation
    const roleType = createRoleType({
      name: 'Smoke Test Role',
      code: 'SMOKE_ROLE'
    });
    Logger.log('Role Type Creation: ' + roleType.status);

    // Test 4: Universal custom field
    if (userProfileType.status === 'success' && userProfileType.data) {
      const universalField = createCustomField(userProfileType.data.id, {
        name: 'smoke_test_field',
        label: 'Smoke Test Field',
        type: 'text'
      }, 'user_profile');
      Logger.log('Universal Custom Field Creation: ' + universalField.status);
    }

    // Test 5: Validation
    const validation = validateUniversalEntityArchitecture();
    Logger.log('Universal Entity Validation: ' + validation.status);

    Logger.log('✅ PHASE 10.0 SMOKE TEST COMPLETE');
    return true;

  } catch (error) {
    Logger.log('❌ PHASE 10.0 SMOKE TEST FAILED: ' + error.toString());
    return false;
  }
}

/**
 * Performance test for Universal Entity Architecture
 * Tests system performance with multiple entity types and large datasets
 */
function testPhase10Performance() {
  Logger.log('PHASE 10.0 UNIVERSAL ENTITY ARCHITECTURE PERFORMANCE TEST');

  const startTime = new Date().getTime();
  let operationsCompleted = 0;

  try {
    // Create multiple entity types
    for (let i = 1; i <= 10; i++) {
      createUserProfileType({
        name: `Performance Test Profile ${i}`,
        code: `PERF_PROF_${i}`
      });
      operationsCompleted++;

      createRoleType({
        name: `Performance Test Role ${i}`,
        code: `PERF_ROLE_${i}`
      });
      operationsCompleted++;
    }

    // Create multiple custom fields for each entity category
    ['ticket', 'user_profile', 'role'].forEach(entityCategory => {
      for (let i = 1; i <= 5; i++) {
        createCustomField('test_entity_id', {
          name: `perf_field_${entityCategory}_${i}`,
          label: `Performance Field ${i}`,
          type: 'text'
        }, entityCategory);
        operationsCompleted++;
      }
    });

    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    const operationsPerSecond = (operationsCompleted / duration) * 1000;

    Logger.log(`✅ PERFORMANCE TEST COMPLETE:`);
    Logger.log(`   Operations: ${operationsCompleted}`);
    Logger.log(`   Duration: ${duration}ms`);
    Logger.log(`   Operations/second: ${operationsPerSecond.toFixed(2)}`);

    return {
      success: true,
      operations: operationsCompleted,
      duration: duration,
      operationsPerSecond: operationsPerSecond
    };

  } catch (error) {
    Logger.log('❌ PERFORMANCE TEST FAILED: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      operations: operationsCompleted
    };
  }
}