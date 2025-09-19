# API Connection Debugging Guide

**Issue**: Vercel production shows "Failed to fetch" error
**Time**: 6:36:20 PM
**Status**: 🔴 CRITICAL - Need systematic debugging

## 🔍 Step-by-Step Debugging Process

### **Step 1: Test Apps Script Deployment Directly**

**1.1 Browser Test (Basic)**
Open in browser:
```
https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec?action=ping
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API connection successful",
  "serverTime": "2025-09-17T...",
  "responseTime": 150,
  "version": "1.0.0"
}
```

**If this fails**: Apps Script deployment is broken
**If this works**: Continue to Step 2

---

### **Step 2: Test CORS with POST Request**

**2.1 Browser Console Test**
```javascript
fetch('https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'ping' })
})
.then(r => {
  console.log('Response Status:', r.status);
  console.log('Response Headers:', [...r.headers.entries()]);
  return r.json();
})
.then(d => console.log('✅ POST SUCCESS:', d))
.catch(e => console.log('❌ POST ERROR:', e));
```

**If POST fails but GET works**: CORS issue
**If both work**: Continue to Step 3

---

### **Step 3: Test from Vercel Domain**

**3.1 Check Vercel Environment**
Open Vercel app console (F12) and run:
```javascript
// Check current environment
console.log('Environment:', process.env.NODE_ENV);
console.log('Base URL:', window.location.origin);

// Test API config
import { apiConfig } from './src/config/apiConfig.js';
console.log('API Config:', apiConfig);
```

**3.2 Test API Call from Vercel**
In Vercel app console:
```javascript
fetch('https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() })
})
.then(r => {
  console.log('From Vercel - Status:', r.status);
  console.log('From Vercel - OK:', r.ok);
  return r.text(); // Use text() first to see raw response
})
.then(text => {
  console.log('Raw Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('✅ Parsed JSON:', json);
  } catch (e) {
    console.log('❌ Not valid JSON:', e);
  }
})
.catch(e => console.log('❌ Vercel Fetch Error:', e));
```

---

### **Step 4: Check Apps Script Deployment Settings**

**4.1 Verify Deployment Configuration**

1. Go to: https://script.google.com/
2. Open your project
3. Click "Deploy" → "Manage deployments"
4. Check current deployment:
   - **Type**: Must be "Web app"
   - **Execute as**: Me (your account)
   - **Who has access**: **MUST BE "Anyone"** ⚠️

**4.2 Check Deployment URL**
The URL should exactly match:
```
https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec
```

---

### **Step 5: Check Apps Script Code Version**

**5.1 Verify Code is Updated**
In Apps Script editor, check:

1. **Version header** should be:
   ```javascript
   * Version: 2.5 (Post-Superthink Audit)
   ```

2. **doOptions function** should be:
   ```javascript
   function doOptions(e) {
       return ContentService.createTextOutput()
         .setMimeType(ContentService.MimeType.TEXT);
       // Note: Google Apps Script doesn't support setHeader() method
   }
   ```

3. **Test in Apps Script editor**:
   ```javascript
   function testDeployment() {
     const result = doGet({ parameter: { action: 'ping' } });
     Logger.log('Test result:', result.getContent());
   }
   ```

---

### **Step 6: Check Google Account Permissions**

**6.1 Account Access Issues**
- Script owner must have access to the Google Sheet
- No Google Workspace restrictions
- Apps Script API enabled

**6.2 Sheet Permissions**
- Google Sheet ID: `1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4`
- Sheet must be accessible to script owner
- Check if sheet exists and has proper permissions

---

### **Step 7: Network/Firewall Issues**

**7.1 Test from Different Networks**
- Try from different internet connection
- Test from mobile hotspot
- Check if corporate firewall blocks Google Apps Script

**7.2 Test Different Browsers**
- Chrome (incognito mode)
- Firefox
- Safari

---

## 🔧 Common Issues & Solutions

### **Issue 1: "Who has access" Setting Wrong**
**Symptoms**: GET works in browser, POST fails from Vercel
**Solution**: Set to "Anyone" (not "Anyone with Google account")

### **Issue 2: Old Code Still Deployed**
**Symptoms**: Syntax errors in browser test
**Solution**: Deploy new version with latest APPSCRIPT.txt

### **Issue 3: CORS Blocked**
**Symptoms**: Network tab shows CORS error
**Solution**: Check doOptions() function implementation

### **Issue 4: Environment Variable Override**
**Symptoms**: Works locally, fails on Vercel
**Solution**: Check REACT_APP_API_BASE_URL environment variable

### **Issue 5: Deployment ID Changed**
**Symptoms**: 404 or deployment not found
**Solution**: Update all references to new deployment ID

---

## 🧪 Quick Diagnostic Commands

### **Run in Browser Console (Any Page)**
```javascript
// Test 1: Direct API call
fetch('https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec?action=ping')
  .then(r => r.text())
  .then(t => console.log('Direct Test:', t))
  .catch(e => console.log('Direct Error:', e));

// Test 2: POST with CORS
fetch('https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'ping' })
})
.then(r => r.text())
.then(t => console.log('POST Test:', t))
.catch(e => console.log('POST Error:', e));
```

### **Run in Vercel App Console**
```javascript
// Test current API config
console.log('Current config:', apiConfig?.baseURL);

// Test actual API call like frontend does
const checkAPIConnection = async () => {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwqVawBnx18iG_YYWgLL47iMP3tBIcGLKkhmjsCZvd5ab8cJmGcibAZpyNhtrwt39HpKw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ SUCCESS:', data);
    return data;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return { error: error.message };
  }
};

checkAPIConnection();
```

---

## 📋 Debugging Checklist

Run through this checklist in order:

- [ ] **Step 1**: Browser GET test passes
- [ ] **Step 2**: Browser POST test passes
- [ ] **Step 3**: Vercel console test passes
- [ ] **Step 4**: Deployment settings verified
- [ ] **Step 5**: Code version confirmed
- [ ] **Step 6**: Permissions checked
- [ ] **Step 7**: Network tested

**Most Likely Issues** (in order of probability):
1. 🔴 **"Who has access"** not set to "Anyone"
2. 🔴 **Old code** still deployed (not version 2.5)
3. 🔴 **Environment variable** overriding URL
4. 🔴 **CORS** configuration issue
5. 🔴 **Network/Firewall** blocking requests

---

**Next Action**: Start with Step 1 browser test and work through systematically.