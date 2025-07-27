// App.js

import React, { useState, useEffect } from 'react';

// Firebase Imports (assuming config/firebase.js is set up)
import { auth } from './config/firebase'; 
import { onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';

// API Layer
import api from './api/googleSheet';

// Page Components
import AdminPage from './components/admin/TicketTypeEditor'; // Using the editor directly for the POC
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

// Shared Components
import Header from './components/shared/Header';
import LoadingScreen from './components/shared/LoadingScreen';

// Mock User Roles for POC - In a real app, this would be managed in your DB
const MOCK_USERS_ROLES = {
  'ken.advento@gmail.com': { name: 'Ken Advento', role: 'admin' },
  // Add other pre-defined roles here if needed
};


/**
 * =================================================================================
 * App.js - Main Application Component
 * ---------------------------------------------------------------------------------
 * This is the root component of the application. It handles the overall layout,
 * routing between pages, and manages the global authentication state.
 * =================================================================================
 */
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null); // Holds profile from our backend
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    // Effect to handle Firebase Authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                // If no user, attempt to sign in automatically
                setCurrentUser(null);
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Auto sign-in failed:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect to fetch or create user profile data once authenticated
    useEffect(() => {
        if (!currentUser) {
            setCurrentUserData(null);
            setIsAuthReady(false);
            return;
        }

        // --- This section would be replaced with an API call to your backend ---
        // For this POC, we'll create a mock profile based on the Firebase user
        const email = currentUser.email || `${currentUser.uid}@example.com`;
        const mockRoleInfo = MOCK_USERS_ROLES[email];
        
        let profile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Guest User',
            email: email,
            role: 'user', // Default role
            enabled: true,
            default_company_id: 'comp_1',
        };

        if (mockRoleInfo) {
            profile.name = mockRoleInfo.name;
            profile.role = mockRoleInfo.role;
        }
        
        setCurrentUserData(profile);
        setIsAuthReady(true);
        
        // Log the login event
        api.recordLogin({ userId: currentUser.uid, email: email });

    }, [currentUser]);


    if (!isAuthReady || !currentUserData) {
        return <LoginPage />;
    }
    
    if (!currentUserData.enabled) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-600">Account Disabled</h2>
                <p>Your account has been disabled. Please contact an administrator.</p>
                <button onClick={() => signOut(auth)} className="mt-4 px-4 py-2 bg-gray-200 rounded">Sign Out</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header 
                currentUserData={currentUserData} 
                setCurrentView={setCurrentView} 
                currentView={currentView} 
                onSignOut={() => signOut(auth)}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {currentView === 'dashboard' && <DashboardPage currentUserData={currentUserData} />}
                {currentView === 'admin' && currentUserData.role === 'admin' && <AdminPage />}
                {currentView === 'admin' && currentUserData.role !== 'admin' && (
                    <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
                        You do not have permission to access the admin panel.
                    </div>
                )}
            </main>
        </div>
    );
}
