# Deployment Configuration Guide

## 🚀 **Production Deployment Setup**

**Target Environment**: Vercel (Frontend) + Firebase (Auth) + Google Apps Script (Backend)
**Current Phase**: Phase 6 Development - Ready for production deployment
**Last Updated**: September 16, 2025

---

## 🔧 **Environment Variables Configuration**

### **Vercel Environment Variables**

#### **🔥 Firebase Authentication**
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyDexamplekey123456789
REACT_APP_FIREBASE_AUTH_DOMAIN=jarvisbyerp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=jarvisbyerp
REACT_APP_FIREBASE_STORAGE_BUCKET=jarvisbyerp.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456789
```

#### **📊 Google Apps Script Backend**
```bash
# Google Apps Script Web App URL
REACT_APP_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Google Sheets Database
REACT_APP_SPREADSHEET_ID=1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4
```

#### **⚙️ Application Configuration**
```bash
# Development Toggles (Phase 6)
REACT_APP_ALLOW_DIRECT_ACCESS=false
REACT_APP_ALLOW_ALL_ACCESS=true
REACT_APP_ENFORCE_PERMISSIONS=false

# Feature Flags
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_LIVE_UPDATES=true
REACT_APP_ENABLE_ANALYTICS=true

# UI Configuration
REACT_APP_APP_NAME=JarvisByERP
REACT_APP_TIMEZONE=Asia/Manila
REACT_APP_DATE_FORMAT=MM/dd/yyyy
REACT_APP_TIME_FORMAT=12h
```

#### **🔒 Security & RBAC (Future Phase 7+)**
```bash
# Role-Based Access Control
REACT_APP_RBAC_ENABLED=false
REACT_APP_DEFAULT_ROLE=user
REACT_APP_ADMIN_EMAILS=admin@company.com,superuser@company.com

# Security Settings
REACT_APP_SESSION_TIMEOUT=3600
REACT_APP_MAX_LOGIN_ATTEMPTS=5
REACT_APP_ENABLE_2FA=false
```

#### **📈 Analytics & Monitoring**
```bash
# Optional: Google Analytics
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Error Tracking
REACT_APP_ERROR_REPORTING=true
REACT_APP_LOG_LEVEL=warn
```

---

### **🔥 Firebase Configuration**

#### **Project Setup**
1. **Firebase Console**: https://console.firebase.google.com
2. **Project Name**: `jarvisbyerp`
3. **Hosting**: Optional (using Vercel instead)

#### **Authentication Configuration**

##### **Sign-in Methods**
- ✅ **Google**: Enabled (primary sign-in method)
- ❌ **Email/Password**: Disabled (not used)
- ❌ **Anonymous**: Disabled
- ❌ **Phone**: Disabled

##### **Authorized Domains**
```
# Development
localhost

# Staging (if used)
jarvisbyerp-staging.vercel.app

# Production
jarvisbyerp.vercel.app
your-custom-domain.com
```

##### **OAuth Redirect URIs**
```
# Development
http://localhost:3000/__/auth/handler

# Production
https://jarvisbyerp.vercel.app/__/auth/handler
https://your-custom-domain.com/__/auth/handler
```

#### **Security Rules** (Firestore - if used in future)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // All data is in Google Sheets, Firestore used only for user metadata
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin access for debugging (remove in production)
    match /{document=**} {
      allow read: if request.auth != null &&
        request.auth.token.email in ['admin@company.com'];
    }
  }
}
```

#### **Firebase Configuration Object**
```javascript
// src/config/firebase.js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

---

### **📊 Google Apps Script Configuration**

#### **Apps Script Project Setup**
1. **Script Editor**: https://script.google.com
2. **Project Name**: `JarvisByERP-Backend`
3. **Execution**: Deploy as Web App

#### **Deployment Settings**
```javascript
// In Apps Script Editor: Deploy > New Deployment
{
  "type": "Web App",
  "execute_as": "Me (your-email@gmail.com)",
  "who_has_access": "Anyone", // For CORS support
  "description": "JarvisByERP Backend API - Production"
}
```

#### **Environment Properties** (Apps Script)
```javascript
// Set via Apps Script Editor: Project Settings > Script Properties
const SCRIPT_PROPERTIES = {
  'SPREADSHEET_ID': '1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4',
  'TIMEZONE': 'Asia/Manila',
  'LOG_LEVEL': 'INFO',
  'ENABLE_CORS': 'true',
  'ALLOWED_ORIGINS': 'https://jarvisbyerp.vercel.app,http://localhost:3000',
  'API_VERSION': '1.0.0',
  'MAX_REQUESTS_PER_MINUTE': '100'
}
```

#### **CORS Configuration**
```javascript
// In main Apps Script file
function doOptions(e) {
  const allowedOrigins = PropertiesService.getScriptProperties()
    .getProperty('ALLOWED_ORIGINS').split(',');

  const origin = e.parameter.origin || e.headers.origin;

  if (allowedOrigins.includes(origin)) {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
  }

  return ContentService.createTextOutput('Origin not allowed');
}
```

#### **API Response Format**
```javascript
// Standardized API response format
function createResponse(success, data = null, message = '', status = 200) {
  return {
    success: success,
    data: data,
    message: message,
    status: status,
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Manila'
  };
}
```

#### **Error Handling & Logging**
```javascript
// Enhanced error handling for production
function handleApiError(error, operation = 'Unknown') {
  console.error(`API Error in ${operation}:`, error);

  // Log to spreadsheet for monitoring
  try {
    logError(operation, error.toString(), new Date());
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }

  return createResponse(false, null, 'Internal server error', 500);
}
```

---

## 🌐 **Vercel Deployment Configuration**

### **Project Setup**
```json
{
  "name": "jarvisbyerp",
  "framework": "create-react-app",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "devCommand": "npm start"
}
```

### **vercel.json Configuration**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "env": {
    "REACT_APP_NODE_ENV": "production"
  }
}
```

### **Environment Variable Categories**

#### **🔴 Critical (Required for Production)**
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_API_BASE_URL`
- `REACT_APP_SPREADSHEET_ID`

#### **🟡 Important (Recommended)**
- `REACT_APP_ALLOW_DIRECT_ACCESS=false`
- `REACT_APP_ALLOW_ALL_ACCESS=true` (Phase 6 only)
- `REACT_APP_APP_NAME=JarvisByERP`
- `REACT_APP_TIMEZONE=Asia/Manila`

#### **🟢 Optional (Enhancement)**
- `REACT_APP_GA_TRACKING_ID`
- `REACT_APP_ERROR_REPORTING=true`
- `REACT_APP_ENABLE_NOTIFICATIONS=true`

---

## 🔧 **Setup Instructions**

### **1. Firebase Setup**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (optional, using Vercel for hosting)
firebase init

# Deploy only authentication rules if using Firestore
firebase deploy --only firestore:rules
```

### **2. Google Apps Script Setup**
1. Open [Google Apps Script](https://script.google.com)
2. Create new project: "JarvisByERP-Backend"
3. Copy your existing Apps Script code
4. Set Script Properties (Project Settings > Script Properties)
5. Deploy as Web App with public access
6. Copy deployment URL for `REACT_APP_API_BASE_URL`

### **3. Vercel Setup**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Set environment variables
vercel env add REACT_APP_FIREBASE_API_KEY
vercel env add REACT_APP_API_BASE_URL
# ... add all required variables

# Deploy to production
vercel --prod
```

### **4. Google Sheets Setup**
1. Ensure spreadsheet ID matches `REACT_APP_SPREADSHEET_ID`
2. Share spreadsheet with Apps Script service account
3. Verify all required tabs exist (companies, roles, tickets, etc.)
4. Test API endpoints from Apps Script editor

---

## 🔐 **Security Checklist**

### **Production Security**
- [ ] ✅ `REACT_APP_ALLOW_DIRECT_ACCESS=false`
- [ ] ❌ `REACT_APP_ALLOW_ALL_ACCESS=false` (Phase 7+)
- [ ] ✅ Firebase authorized domains configured
- [ ] ✅ Apps Script CORS origins restricted
- [ ] ✅ All environment variables set in Vercel
- [ ] ✅ No secrets in source code

### **Phase 6 Development Security**
- [ ] ✅ `REACT_APP_ALLOW_ALL_ACCESS=true` (temporary)
- [ ] ✅ `REACT_APP_RBAC_ENABLED=false` (temporary)
- [ ] ✅ Permission checks implemented (returns true)
- [ ] ✅ Ready for Phase 7 RBAC activation

---

## 📊 **Monitoring & Analytics**

### **Error Tracking**
```javascript
// Add to Apps Script for production monitoring
function logError(operation, error, timestamp) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('error_logs');
    if (!sheet) return;

    sheet.appendRow([
      timestamp,
      operation,
      error,
      Session.getActiveUser().getEmail()
    ]);
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}
```

### **Usage Analytics**
```javascript
// Track API usage
function logApiUsage(endpoint, userEmail, responseTime) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('api_usage');
    if (!sheet) return;

    sheet.appendRow([
      new Date(),
      endpoint,
      userEmail,
      responseTime,
      'success'
    ]);
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}
```

---

## 🚀 **Deployment Commands**

### **Development to Staging**
```bash
# Build and test locally
npm run build
npm run test

# Deploy to Vercel preview
vercel

# Test staging environment
# Verify all features work
```

### **Staging to Production**
```bash
# Final production deployment
vercel --prod

# Verify production environment
# Check all environment variables
# Test authentication flow
# Verify API connectivity
```

### **Rollback Procedure**
```bash
# If deployment fails, rollback to previous version
vercel rollback [DEPLOYMENT_ID]

# Or redeploy previous working commit
git checkout [PREVIOUS_COMMIT_HASH]
vercel --prod
```

---

## ⚡ **Performance Optimization**

### **Build Optimization**
```json
// package.json build script optimization
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build",
    "build:analyze": "npm run build && npx serve -s build"
  }
}
```

### **Caching Strategy**
- Static assets: 1 year cache
- API responses: No cache (real-time data)
- Images: 6 months cache
- Service worker: Update on app version change

---

## 📋 **Pre-Deployment Checklist**

### **Code Quality**
- [ ] ✅ All ESLint warnings resolved
- [ ] ✅ Build completes without errors
- [ ] ✅ All environment variables documented
- [ ] ✅ No hardcoded URLs or secrets

### **Functionality**
- [ ] ✅ Authentication flow works
- [ ] ✅ Admin panel accessible
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ Mobile responsiveness verified

### **Security**
- [ ] ✅ Production environment variables set
- [ ] ✅ CORS configured properly
- [ ] ✅ Firebase security rules active
- [ ] ✅ No debug logs in production

### **Performance**
- [ ] ✅ Bundle size optimized
- [ ] ✅ Loading times acceptable
- [ ] ✅ Error boundaries implemented
- [ ] ✅ Graceful offline handling

---

**Status**: 📋 **READY FOR DEPLOYMENT**
**Last Updated**: September 16, 2025
**Next Review**: After Phase 7 RBAC Implementation

*This configuration guide ensures a secure, scalable, and maintainable production deployment of the JarvisByERP ticketing system.*