/**
 * =================================================================================
 * Firebase Configuration (src/config/firebase.js)
 * ---------------------------------------------------------------------------------
 * This file initializes the Firebase app and exports the authentication service.
 * It's designed to be imported into other parts of the application where
 * authentication is required.
 * =================================================================================
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// --- Firebase Configuration ---
// Using your actual Firebase project credentials
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize the Firebase app with the provided configuration.
const app = initializeApp(firebaseConfig);

// Get a reference to the Firebase Authentication service and export it
// for use throughout the application.
export const auth = getAuth(app);

// Export the app instance if needed elsewhere
export default app;