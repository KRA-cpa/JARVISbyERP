import React from 'react';

/**
 * =================================================================================
 * LoadingScreen Component (components/shared/LoadingScreen.js)
 * ---------------------------------------------------------------------------------
 * A reusable component that displays a centered loading spinner and a message.
 * It's used to indicate to the user that a background process is running,
 * such as fetching data from the API.
 * =================================================================================
 */
export default function LoadingScreen({ message = "Loading..." }) {
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
