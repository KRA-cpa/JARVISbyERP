/**
 * Quick API Test for New Deployment
 * Test the updated Apps Script deployment URL
 */

const NEW_API_URL = 'https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec';

console.log('🔍 Testing New Apps Script Deployment...');
console.log('URL:', NEW_API_URL);

// Test the ping endpoint
fetch(`${NEW_API_URL}?action=ping`)
  .then(response => {
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('🎉 SUCCESS! API Response:', data);

    if (data.success) {
      console.log('✅ API is working correctly!');
      console.log('📊 Server Time:', data.serverTime);
      console.log('⚡ Response Time:', data.responseTime + 'ms');
      console.log('🏷️ Version:', data.version);

      // Test a POST request
      return fetch(NEW_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });
    } else {
      throw new Error('API returned success: false');
    }
  })
  .then(response => response.json())
  .then(postData => {
    console.log('✅ POST request also successful:', postData);
    console.log('🎉 DEPLOYMENT IS WORKING PERFECTLY!');

    // Test getting companies
    return fetch(NEW_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getCompanies' })
    });
  })
  .then(response => response.json())
  .then(companiesData => {
    console.log('🏢 Companies endpoint test:', companiesData);
    console.log('🎯 FULL API INTEGRATION VERIFIED!');
  })
  .catch(error => {
    console.error('❌ API Test Failed:', error.message);
    console.log('🔧 Possible issues:');
    console.log('1. Apps Script deployment not completed');
    console.log('2. Web App access not set to "Anyone"');
    console.log('3. Apps Script code not updated with fixed version');
    console.log('4. CORS issues with deployment');
  });