/**
 * Google Apps Script API Connection Tester
 * Run this script to test if the current deployment is working
 *
 * Usage:
 * 1. Open browser console on any page
 * 2. Copy and paste this entire script
 * 3. Run: testAPIConnection()
 */

const testAPIConnection = async () => {
  console.log('🔍 Testing Google Apps Script API Connection...');

  // Current API URL from the configuration
  const API_URL = 'https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec';

  try {
    console.log('📍 Testing URL:', API_URL);

    // Test 1: Basic ping via GET
    console.log('\n🧪 Test 1: GET ping request...');
    const getResponse = await fetch(`${API_URL}?action=ping`);
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response Headers:', Object.fromEntries(getResponse.headers.entries()));

    if (getResponse.ok) {
      const getData = await getResponse.text();
      console.log('✅ GET Response:', getData);

      try {
        const getJSON = JSON.parse(getData);
        console.log('✅ GET JSON Parsed:', getJSON);
      } catch (e) {
        console.log('❌ GET Response not valid JSON:', e.message);
      }
    } else {
      console.log('❌ GET Request Failed:', getResponse.statusText);
    }

    // Test 2: POST ping request
    console.log('\n🧪 Test 2: POST ping request...');
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ping',
        timestamp: new Date().toISOString()
      })
    });

    console.log('POST Response Status:', postResponse.status);
    console.log('POST Response Headers:', Object.fromEntries(postResponse.headers.entries()));

    if (postResponse.ok) {
      const postData = await postResponse.text();
      console.log('✅ POST Response:', postData);

      try {
        const postJSON = JSON.parse(postData);
        console.log('✅ POST JSON Parsed:', postJSON);

        if (postJSON.success) {
          console.log('🎉 API CONNECTION SUCCESSFUL!');
          console.log('Server Time:', postJSON.serverTime);
          console.log('Response Time:', postJSON.responseTime + 'ms');
          console.log('Version:', postJSON.version);
          return true;
        } else {
          console.log('❌ API returned success: false');
          return false;
        }
      } catch (e) {
        console.log('❌ POST Response not valid JSON:', e.message);
        return false;
      }
    } else {
      console.log('❌ POST Request Failed:', postResponse.statusText);
      return false;
    }

  } catch (error) {
    console.log('💥 Connection Error:', error.message);
    console.log('Error Details:', error);

    // Provide specific error guidance
    if (error.message.includes('Failed to fetch')) {
      console.log('\n🔧 LIKELY CAUSES:');
      console.log('1. Apps Script deployment not updated with latest code');
      console.log('2. Web App "Who has access" not set to "Anyone"');
      console.log('3. CORS issues with the deployment');
      console.log('4. Network/firewall blocking the request');
      console.log('\n📋 IMMEDIATE FIXES:');
      console.log('1. Redeploy Apps Script as Web App with "Anyone" access');
      console.log('2. Ensure latest APPSCRIPT.txt code is deployed');
      console.log('3. Check Web App URL is exactly:', API_URL);
    }

    return false;
  }
};

// Test individual API endpoints
const testSpecificEndpoints = async () => {
  console.log('\n🔬 Testing Specific API Endpoints...');

  const API_URL = 'https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec';

  const endpoints = [
    { name: 'Get Companies', action: 'getCompanies', method: 'GET' },
    { name: 'Get Roles', action: 'getRoles', method: 'GET' },
    { name: 'Get Dropdown Lists', action: 'getDropdownLists', method: 'GET' },
    { name: 'Get Ticket Types', action: 'getTicketTypes', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing ${endpoint.name}...`);

    try {
      let response;

      if (endpoint.method === 'GET') {
        response = await fetch(`${API_URL}?action=${endpoint.action}`);
      } else {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: endpoint.action })
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}:`, data);
      } else {
        console.log(`❌ ${endpoint.name} failed:`, response.status, response.statusText);
      }

    } catch (error) {
      console.log(`💥 ${endpoint.name} error:`, error.message);
    }
  }
};

// Test with current frontend configuration
const testFrontendConfig = async () => {
  console.log('\n🎯 Testing with Frontend Configuration...');

  // This simulates exactly what the frontend does
  const checkAPIConnection = async () => {
    const API_URL = 'https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ping',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        connected: true,
        status: 'healthy',
        responseTime: data.responseTime || 0,
        serverTime: data.serverTime,
        version: data.version || 'unknown'
      };

    } catch (error) {
      return {
        connected: false,
        status: 'error',
        error: error.message,
        responseTime: null
      };
    }
  };

  const result = await checkAPIConnection();
  console.log('Frontend Config Test Result:', result);

  if (result.connected) {
    console.log('🎉 FRONTEND CONNECTION WOULD WORK!');
  } else {
    console.log('❌ FRONTEND CONNECTION WOULD FAIL:', result.error);
  }

  return result;
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Complete API Test Suite...');
  console.log('Time:', new Date().toISOString());

  const basicTest = await testAPIConnection();

  if (basicTest) {
    await testSpecificEndpoints();
    await testFrontendConfig();
    console.log('\n🎉 ALL TESTS COMPLETED - API IS WORKING!');
  } else {
    console.log('\n❌ BASIC CONNECTION FAILED - SKIPPING OTHER TESTS');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open Google Apps Script editor');
    console.log('2. Update code with latest APPSCRIPT.txt');
    console.log('3. Deploy as Web App with "Anyone" access');
    console.log('4. Run tests again');
  }
};

// Export functions for manual testing
window.testAPIConnection = testAPIConnection;
window.testSpecificEndpoints = testSpecificEndpoints;
window.testFrontendConfig = testFrontendConfig;
window.runAllTests = runAllTests;

console.log('📋 API Test Functions Loaded:');
console.log('- testAPIConnection() - Basic connection test');
console.log('- testSpecificEndpoints() - Test CRUD endpoints');
console.log('- testFrontendConfig() - Test frontend configuration');
console.log('- runAllTests() - Run complete test suite');
console.log('\n🚀 Run: runAllTests() to start testing');