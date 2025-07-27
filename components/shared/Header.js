import React, { useState, useEffect } from 'react';

// --- Helper Icons (Inlined for portability) ---
const LogOutIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

// --- Timezone Configuration ---
const TIMEZONE = 'Asia/Manila'; // UTC+8



/**
 * =================================================================================
 * Header Component (components/shared/Header.js)
 * ---------------------------------------------------------------------------------
 * This component renders the main top navigation bar for the application.
 * It displays navigation links, user information, and handles the sign-out action.
 * It imports and uses the LiveClock component.
 * =================================================================================
 */
export default function Header({ currentUserData, currentView, setCurrentView, onSignOut }) {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                {/* Left Section: Title and Navigation */}
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Ticketing System</h1>
                    <nav className="flex items-center gap-2 border-l pl-4">
                        <button 
                            onClick={() => setCurrentView('dashboard')} 
                            className={`px-3 py-1 text-sm font-medium rounded-md ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Dashboard
                        </button>
                        {/* The Admin button is only visible to users with the 'admin' role */}
                        {currentUserData?.role === 'admin' && (
                             <button 
                                onClick={() => setCurrentView('admin')} 
                                className={`px-3 py-1 text-sm font-medium rounded-md ${currentView === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                             >
                                Admin
                             </button>
                        )}
                    </nav>
                </div>

                {/* Right Section: Clock, User Info, and Sign Out */}
                <div className="flex items-center space-x-4">
                    <LiveClock />
                    <div className="text-right border-l pl-4">
                         <span className="text-sm font-medium text-gray-800">{currentUserData.name}</span>
                         <span className="text-xs text-gray-500 block">{currentUserData.email}</span>
                    </div>
                    <button onClick={onSignOut} title="Sign Out">
                        <LogOutIcon className="h-6 w-6 text-gray-500 hover:text-indigo-600" />
                    </button>
                </div>
            </div>
        </header>
    );
}
