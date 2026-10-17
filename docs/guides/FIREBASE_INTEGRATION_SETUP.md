# Firebase Authentication Integration Setup Guide
**Date**: September 27, 2025
**Status**: Setup & Configuration Documentation
**Purpose**: Complete Firebase login integration documentation and setup procedures

## 🔥 Firebase Authentication Overview

### **Current Implementation Status:**
✅ **Firebase Auth Configured**: `src/config/firebase.js` exists
✅ **Google Sign-In**: LoginPage.js with Google OAuth
✅ **User Context**: Complete authentication state management
✅ **Protected Routes**: ProtectedRoute and AdminRoute components
✅ **Backend Integration**: User login logging to Google Apps Script

## 🛠️ Firebase Project Setup

### **1. Create Firebase Project**

**Step 1: Go to Firebase Console**
```
https://console.firebase.google.com/
```

**Step 2: Create New Project**
- Click "Create a project"
- Project name: `jarvisbyerp-ticketing` (or your preferred name)
- Enable Google Analytics: Optional (recommended for production)
- Choose analytics account if enabled

**Step 3: Add Web App**
- Click "Add app" → Web (</> icon)
- App nickname: `JarvisByERP Web App`
- Enable Firebase Hosting: Optional (we use Vercel)
- Click "Register app"

### **2. Authentication Configuration**

**Step 1: Enable Authentication**
- Go to "Authentication" in left sidebar
- Click "Get started"

**Step 2: Configure Sign-in Methods**
- Go to "Sign-in method" tab
- Enable "Google" provider
  - Project support email: Your email
  - Project public-facing name: `JarvisByERP Ticketing System`
  - Click "Save"

**Step 3: Authorized Domains**
- Add your domains to authorized list:
  - `localhost` (for development)
  - `your-vercel-domain.vercel.app` (for production)
  - Your custom domain (if any)

### **3. Get Firebase Configuration**

**Step 1: Project Settings**
- Click gear icon → "Project settings"
- Scroll to "Your apps" section
- Click on your web app

**Step 2: Copy Config Object**
```javascript
// Your Firebase config will look like this:
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ" // Optional, for analytics
};
```

## ⚙️ Environment Configuration

### **1. Update .env Files**

**Development (.env.local):**
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ

# API Configuration
REACT_APP_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Development Toggles
REACT_APP_DISABLE_AUTH=false
REACT_APP_USE_MOCK_DATA=false
REACT_APP_SHOW_DEBUG=true
```

**Production (.env.production):**
```env
# Firebase Configuration (same as development)
REACT_APP_FIREBASE_API_KEY=AIzaSyC...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ

# API Configuration
REACT_APP_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Production Settings
REACT_APP_DISABLE_AUTH=false
REACT_APP_USE_MOCK_DATA=false
REACT_APP_SHOW_DEBUG=false
REACT_APP_SHOW_API_PANEL=false
```

### **2. Verify Current Configuration**

**Check src/config/firebase.js:**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## 🔐 Security Configuration

### **1. Firebase Security Rules (Optional)**

If using Firestore (currently not used):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **2. API Key Restrictions (Recommended)**

**In Firebase Console:**
- Go to Google Cloud Console
- API & Services → Credentials
- Find your API key
- Add restrictions:
  - HTTP referrers: your domains only
  - API restrictions: Firebase Authentication API only

## 🚀 Deployment Configuration

### **1. Vercel Environment Variables**

**In Vercel Dashboard:**
- Go to your project settings
- Environment Variables section
- Add all REACT_APP_ variables from .env.production

**Variables to Add:**
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
REACT_APP_API_URL
```

### **2. Domain Configuration**

**Update Firebase Authorized Domains:**
- Firebase Console → Authentication → Settings
- Authorized domains section
- Add your Vercel domain: `your-app.vercel.app`
- Add custom domain if using one

## 🧪 Testing Authentication

### **1. Local Testing**

**Start Development Server:**
```bash
npm start
```

**Test Login Flow:**
1. Go to http://localhost:3000
2. Should redirect to /login if not authenticated
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Should redirect to /dashboard after successful login

### **2. Production Testing**

**After Deployment:**
1. Visit your production URL
2. Test complete login flow
3. Verify user data is saved to Google Sheets
4. Check browser console for any errors

## 🔧 Troubleshooting

### **Common Issues:**

**1. "Firebase: Error (auth/invalid-api-key)"**
- Solution: Check REACT_APP_FIREBASE_API_KEY in environment variables

**2. "Firebase: Error (auth/unauthorized-domain)"**
- Solution: Add your domain to Firebase authorized domains

**3. "Network Error" during login**
- Solution: Check REACT_APP_API_URL points to correct Google Apps Script

**4. User data not saving**
- Solution: Verify Google Apps Script is deployed and recordLogin function works

### **Debug Tools:**

**1. Check Environment Variables:**
```javascript
console.log('Firebase Config:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing'
});
```

**2. Test API Connection:**
```javascript
// In browser console
fetch(process.env.REACT_APP_API_URL + '?action=ping')
  .then(r => r.json())
  .then(console.log);
```

## 📋 Current Implementation Features

### **✅ Implemented Features:**

**Authentication Flow:**
- Google Sign-In with popup
- Automatic redirect after login
- User session persistence
- Logout functionality

**User Management:**
- User context with state management
- Role-based access control (RBAC)
- Protected routes with permission checks
- Admin role detection

**Backend Integration:**
- User login logging to Google Sheets
- User profile data storage
- API integration for user management

**UI Components:**
- Professional login page
- User menu in header
- Loading states during authentication
- Error handling and display

### **🔧 Available Configuration:**

**Development Toggles:**
- `REACT_APP_DISABLE_AUTH=true` - Bypass authentication
- `REACT_APP_ALLOW_DIRECT_ACCESS=true` - Allow direct page access
- `REACT_APP_USE_MOCK_DATA=true` - Use mock user data

**Production Settings:**
- Real Firebase authentication
- Google Apps Script API integration
- Complete user session management

## 📚 Related Documentation

**Core Files:**
- `src/config/firebase.js` - Firebase configuration
- `src/contexts/UserContext.js` - Authentication state management
- `src/pages/LoginPage.js` - Login interface
- `src/components/shared/Header.js` - User menu integration

**Documentation:**
- `CLAUDE.md` - Overall system specifications
- `DEVELOPMENT_PLAN.md` - Authentication implementation status
- `PRODUCTION_REQUIREMENTS.md` - Environment requirements

---

**Status**: ✅ **IMPLEMENTATION COMPLETE** - Ready for production use
**Next Steps**: Configure Firebase project with your credentials
**Security**: Follow API key restrictions and domain authorization best practices