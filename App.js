import React, { useState, useEffect } from 'react';
// Note: In a real project, these imports would point to actual files.
// For this example, we assume these components exist.
// import { auth } from './config/firebase'; 
// import { onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';
// import api from './api/googleSheet';
// import { DashboardPage } from './pages/DashboardPage';
// import { AdminPage } from './pages/AdminPage';
// import { LoginPage } from './pages/LoginPage';
// import { Header } from './components/shared/Header';
// import { LoadingScreen } from './components/shared/LoadingScreen';


// --- Placeholder Components (until other files are created) ---
const DashboardPage = () => <div className="text-2xl font-bold">Dashboard Page Content</div>;
const AdminPage = () => <div className="text-2xl font-bold">Admin Page Content</div>;
const LoginPage = () => <div>Loading...</div>;
const Header = ({ currentView, setCurrentView, currentUserData, onSignOut }) => (
    <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Ticketing System</h1>
            <nav className="flex items-center gap-4">
                <button onClick={() => setCurrentView('dashboard')} className={currentView === 'dashboard' ? 'font-bold' : ''}>Dashboard</button>
                {currentUserData?.role === 'admin' && (
                    <button onClick={() => setCurrentView('admin')} className={currentView === 'admin' ? 'font-bold' : ''}>Admin</button>
                )}
                <button onClick={onSignOut} className="text-sm text-red-600">Sign Out</button>
            </nav>
        </div>
    </header>
);

/**
 * =================================================================================
 * App.js - Main Application Component
 * ---------------------------------------------------------------------------------
 * This is the root component of the application. It handles the overall layout,
 * routing between pages, and manages the global authentication state.
 * =================================================================================
 */
export default function App() {
    // const [currentUser, setCurrentUser] = useState(null); // In a real app, you'd use Firebase Auth
    const [currentUserData, setCurrentUserData] = useState(null); // Holds profile from our backend
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    // This effect simulates the authentication and user profile fetching process.
    useEffect(() => {
        // Simulate checking for a logged-in user
        setTimeout(() => {
            const mockUser = {
                uid: '12345-abcde',
                email: 'ken.advento@gmail.com',
                displayName: 'Ken Advento',
            };
            
            // Simulate fetching the user's detailed profile and roles from the backend
            const mockProfile = {
                uid: mockUser.uid,
                name: mockUser.displayName,
                email: mockUser.email,
                role: 'admin', // Hardcoded to 'admin' for testing purposes
                enabled: true,
                default_company_id: 'comp_1',
            };

            setCurrentUserData(mockProfile);
            setIsAuthReady(true);
            
            // In a real app, you would also call the API to log the login event here:
            // api.recordLogin({ userId: mockUser.uid, email: mockUser.email });

        }, 1500); // Simulate a 1.5-second loading time
    }, []);


    if (!isAuthReady || !currentUserData) {
        return <LoginPage />;
    }
    
    if (!currentUserData.enabled) {
        // A component to show if the user's account is disabled
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-600">Account Disabled</h2>
                <p>Your account has been disabled. Please contact an administrator.</p>
                <button onClick={() => alert('Signing out...') } className="mt-4 px-4 py-2 bg-gray-200 rounded">Sign Out</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header 
                currentUserData={currentUserData} 
                setCurrentView={setCurrentView} 
                currentView={currentView} 
                onSignOut={() => alert('Signing out...')}
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
