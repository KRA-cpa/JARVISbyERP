import React from 'react';

/**
 * =================================================================================
 * LoadingScreen Component (components/shared/LoadingScreen.js)
 * ---------------------------------------------------------------------------------
 * A reusable component that displays a centered loading spinner and a message.
 * NOTE: This component is included here for completeness but should be in its own
 * file at `components/shared/LoadingScreen.js`.
 * =================================================================================
 */
function LoadingScreen({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center h-full w-full p-10">
            <div className="text-center">
                {/* SVG Spinner */}
                <svg 
                    className="mx-auto h-12 w-12 text-gray-400 animate-spin" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 4.75v1.5M12 17.75v1.5M5.75 5.75l1.06 1.06M17.19 17.19l1.06 1.06M4.75 12h1.5M17.75 12h1.5M5.75 18.25l1.06-1.06M17.19 6.81l1.06-1.06"
                    />
                </svg>
                {/* Display Message */}
                <p className="mt-2 text-gray-600">
                    {message}
                </p>
            </div>
        </div>
    );
}


/**
 * =================================================================================
 * LoginPage Component (pages/LoginPage.js)
 * ---------------------------------------------------------------------------------
 * This page is displayed to the user while the application is waiting for Firebase
 * to confirm the user's authentication status. It provides a clean loading
 * state instead of a blank or partially loaded screen.
 * =================================================================================
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Ticketing System</h1>
                <p className="text-gray-600 mb-8">Please wait, authenticating...</p>
                <LoadingScreen />
            </div>
        </div>
    );
}
