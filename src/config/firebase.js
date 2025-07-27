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
// --- Firebase & Config ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : {
  apiKey: "AIzaSyDXYPPI-FifYgN39SP7yt96BMT5co0mYlw",
  authDomain: "jarvisbyerp.firebaseapp.com",
  projectId: "jarvisbyerp",
  storageBucket: "jarvisbyerp.firebasestorage.app",
  messagingSenderId: "3188796143",
  appId: "1:3188796143:web:850ba08114a59b6158c91a",
  measurementId: "G-523E3W5ZMN"
};

// Initialize the Firebase app with the provided configuration.
const app = initializeApp(firebaseConfig);

// Get a reference to the Firebase Authentication service and export it
// for use throughout the application.
export const auth = getAuth(app);
