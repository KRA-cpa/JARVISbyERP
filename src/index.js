import React from 'react';
import ReactDOM from 'react-dom/client';
// In a real project, you would also import your main CSS file here, e.g.:
import './index.css'; 
import App from './App'; // Assuming App.js is in the same directory

/**
 * =================================================================================
 * index.js - Application Entry Point
 * ---------------------------------------------------------------------------------
 * This is the first JavaScript file that runs in the application.
 * It finds the root HTML element and renders the main React component (`App`)
 * into it.
 * =================================================================================
 */

// Find the root element in your public/index.html file.
const rootElement = document.getElementById('root');

// Create a React root for the application.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component.
// React.StrictMode is a wrapper that helps find potential problems in an app.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
