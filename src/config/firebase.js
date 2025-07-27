/**
 * =================================================================================
 * Firebase Configuration
 * ---------------------------------------------------------------------------------
 * This file initializes the Firebase app and exports the authentication service.
 * It's designed to be imported into other parts of the application where
 * authentication is required.
 * =================================================================================
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// --- Firebase Configuration ---
// This configuration object is a placeholder. In a real deployment environment
// (like the one this app is designed for), these values are provided securely
// by the hosting platform.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
      };

// Initialize the Firebase app with the provided configuration.
const app = initializeApp(firebaseConfig);

// Get a reference to the Firebase Authentication service and export it
// for use throughout the application.
export const auth = getAuth(app);
