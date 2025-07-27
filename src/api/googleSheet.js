/**
 * =================================================================================
 * API Utility for Google Sheets Backend
 * ---------------------------------------------------------------------------------
 * This file centralizes all `fetch` requests to the deployed Google Apps Script 
 * Web App. Each function corresponds to a specific action defined in the backend.
 * =================================================================================
 */

// IMPORTANT: Replace this with your actual deployed Web App URL from Google Apps Script.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0ediGYs1TxZu4MddhncQIDyl3pZT3KNYpRLBr5haFrnV2as_9ykhjpvRLfjPG8yjEvw/exec";

/**
 * A generic helper function to handle POST requests to the Apps Script backend.
 * @param {string} action - The name of the function to call in the Apps Script.
 * @param {object} payload - The data to send in the request body.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const postRequest = async (action, payload) => {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            // Use 'no-cors' for simple POST requests if you encounter CORS issues,
            // but be aware you won't be able to read the response directly.
            // For production, proper CORS handling in Apps Script (doOptions) is better.
            mode: 'cors', 
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok for action: ${action}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API POST Error (${action}):`, error);
        // Return a standardized error format
        return { status: 'error', message: error.message };
    }
};

/**
 * A generic helper function to handle GET requests to the Apps Script backend.
 * @param {string} action - The name of the function to call in the Apps Script.
 * @param {object} params - An object of query parameters to append to the URL.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const getRequest = async (action, params = {}) => {
    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', action);
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok for action: ${action}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API GET Error (${action}):`, error);
        return { status: 'error', message: error.message };
    }
};


// --- API Functions ---

const api = {
    /**
     * Fetches a list of all tickets.
     * @param {object} filters - Optional filters, e.g., { status: 'New', company_id: 1 }.
     * @returns {Promise<object>} The API response containing the list of tickets.
     */
    getTickets: (filters) => {
        return getRequest('getTickets', filters);
    },

    /**
     * Fetches the complete details for a single ticket by its ID.
     * @param {number} ticketId - The unique ID of the ticket.
     * @returns {Promise<object>} The API response containing the ticket details.
     */
    getTicketDetails: (ticketId) => {
        return getRequest('getTicketDetails', { ticketId });
    },

    /**
     * Creates a new ticket.
     * @param {object} ticketData - The data for the new ticket.
     * @returns {Promise<object>} The API response confirming creation.
     */
    createTicket: (ticketData) => {
        return postRequest('createTicket', ticketData);
    },

    /**
     * Records a user login event in the admin audit log.
     * @param {object} userData - Contains userId, email, etc.
     * @returns {Promise<object>} The API response.
     */
    recordLogin: (userData) => {
        return postRequest('recordLogin', userData);
    },

    /**
     * Fetches all defined ticket types.
     * @param {number} [companyId] - Optional company ID to filter by.
     * @returns {Promise<object>} The API response with ticket types.
     */
    getTicketTypes: (companyId) => {
        return getRequest('getTicketTypes', { companyId });
    },

    /**
     * Fetches all defined companies.
     * @returns {Promise<object>} The API response with companies.
     */
    getCompanies: () => {
        return getRequest('getCompanies');
    },

    /**
     * Fetches all defined roles.
     * @param {number} [companyId] - Optional company ID to filter by.
     * @returns {Promise<object>} The API response with roles.
     */
    getRoles: (companyId) => {
        return getRequest('getRoles', { companyId });
    },

    /**
     * Fetches all defined dropdown lists.
     * @returns {Promise<object>} The API response with dropdown lists.
     */
    getDropdownLists: () => {
        return getRequest('getDropdownLists');
    },

    /**
     * Fetches the options for a specific dropdown list.
     * @param {number} listId - The ID of the dropdown list.
     * @returns {Promise<object>} The API response with the list's options.
     */
    getDropdownOptions: (listId) => {
        return getRequest('getDropdownOptions', { listId });
    },
    
    // --- Placeholder for future functions ---
    
    /**
     * Updates an existing ticket (e.g., status change, assignment).
     * @param {object} updateData - The data to update.
     * @returns {Promise<object>} The API response.
     */
    updateTicket: (updateData) => {
        return postRequest('updateTicket', updateData);
    },

    /**
     * Saves a ticket type configuration from the admin panel.
     * @param {object} ticketTypeData - The full ticket type configuration object.
     * @returns {Promise<object>} The API response.
     */
    saveTicketType: (ticketTypeData) => {
        return postRequest('saveTicketType', ticketTypeData);
    }
};

export default api;
