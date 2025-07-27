// src/api/googleSheet.js - Corrected Version

/**
 * =================================================================================
 * Updated API Client for Complete MVP Integration
 * ---------------------------------------------------------------------------------
 * This file centralizes all `fetch` requests to the deployed Google Apps Script 
 * Web App. Each function corresponds to a specific action defined in the backend.
 * This replaces your existing api/googleSheet.js with complete CRUD operations
 * for all components: Companies, Roles, Dropdown Lists, Tickets, etc.
 * =================================================================================
 */

// Your actual deployed Web App URL from Google Apps Script
// This will be loaded from your .env file
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL || 
  "https://script.google.com/macros/s/AKfycbz0ediGYs1TxZu4MddhncQIDyl3pZT3KNYpRLBr5haFrnV2as_9ykhjpvRLfjPG8yjEvw/exec";

/**
 * Generic helper function to handle POST requests to the Apps Script backend.
 * @param {string} action - The name of the function to call in the Apps Script.
 * @param {object} payload - The data to send in the request body.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const postRequest = async (action, payload) => {
    try {
        console.log(`API POST: ${action}`, payload);
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`API POST Result: ${action}`, result);
        
        if (result.status === 'error') {
            throw new Error(result.message || 'API returned error status');
        }
        
        return result;
    } catch (error) {
        console.error(`API POST Error (${action}):`, error);
        return { 
            status: 'error', 
            message: error.message || 'Network error occurred'
        };
    }
};

/**
 * Generic helper function to handle GET requests to the Apps Script backend.
 * @param {string} action - The name of the function to call in the Apps Script.
 * @param {object} params - An object of query parameters to append to the URL.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const getRequest = async (action, params = {}) => {
    try {
        console.log(`API GET: ${action}`, params);
        
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`API GET Result: ${action}`, result);
        
        if (result.status === 'error') {
            throw new Error(result.message || 'API returned error status');
        }
        
        return result;
    } catch (error) {
        console.error(`API GET Error (${action}):`, error);
        return { 
            status: 'error', 
            message: error.message || 'Network error occurred'
        };
    }
};

// =================================================================================
// MAIN API OBJECT WITH ALL CRUD OPERATIONS
// =================================================================================

const api = {
    /**
     * =================================================================================
     * TESTING & HEALTH CHECK
     * =================================================================================
     */
    
    ping: () => {
        return getRequest('ping');
    },

    /**
     * =================================================================================
     * COMPANY MANAGEMENT
     * =================================================================================
     */
    
    getCompanies: (filters = {}) => {
        return getRequest('getCompanies', filters);
    },

    getCompany: (companyId) => {
        return getRequest('getCompany', { companyId });
    },

    createCompany: (companyData) => {
        return postRequest('createCompany', companyData);
    },

    updateCompany: (companyData) => {
        return postRequest('updateCompany', companyData);
    },

    deleteCompany: (companyId) => {
        return postRequest('deleteCompany', { id: companyId });
    },

    /**
     * =================================================================================
     * ROLE MANAGEMENT
     * =================================================================================
     */
    
    getRoles: (filters = {}) => {
        return getRequest('getRoles', filters);
    },

    createRole: (roleData) => {
        return postRequest('createRole', roleData);
    },

    updateRole: (roleData) => {
        return postRequest('updateRole', roleData);
    },

    deleteRole: (roleId) => {
        return postRequest('deleteRole', { id: roleId });
    },

    /**
     * =================================================================================
     * DROPDOWN LIST MANAGEMENT
     * =================================================================================
     */
    
    getDropdownLists: (filters = {}) => {
        return getRequest('getDropdownLists', filters);
    },

    getDropdownOptions: (listId) => {
        return getRequest('getDropdownOptions', { listId });
    },

    createDropdownList: (dropdownData) => {
        return postRequest('createDropdownList', dropdownData);
    },

    updateDropdownList: (dropdownData) => {
        return postRequest('updateDropdownList', dropdownData);
    },

    deleteDropdownList: (listId) => {
        return postRequest('deleteDropdownList', { id: listId });
    },

    /**
     * =================================================================================
     * TICKET TYPE MANAGEMENT
     * =================================================================================
     */
    
    getTicketTypes: (filters = {}) => {
        return getRequest('getTicketTypes', filters);
    },

    createTicketType: (ticketTypeData) => {
        return postRequest('createTicketType', ticketTypeData);
    },

    updateTicketType: (ticketTypeData) => {
        return postRequest('updateTicketType', ticketTypeData);
    },

    deleteTicketType: (typeId) => {
        return postRequest('deleteTicketType', { id: typeId });
    },

    /**
     * =================================================================================
     * TICKET MANAGEMENT
     * =================================================================================
     */
    
    getTickets: (filters = {}) => {
        return getRequest('getTickets', filters);
    },

    getTicketDetails: (ticketId) => {
        return getRequest('getTicketDetails', { ticketId });
    },

    createTicket: (ticketData) => {
        return postRequest('createTicket', ticketData);
    },

    updateTicket: (updateData) => {
        return postRequest('updateTicket', updateData);
    },

    /**
     * =================================================================================
     * USER & AUTHENTICATION
     * =================================================================================
     */
    
    recordLogin: (userData) => {
        return postRequest('recordLogin', userData);
    },

    /**
     * =================================================================================
     * TESTING UTILITIES
     * =================================================================================
     */
    
    testConnection: async () => {
        try {
            const response = await api.ping();
            return {
                success: response.status === 'success',
                data: response.data || response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },

    runComprehensiveTest: async () => {
        console.log('🚀 Starting comprehensive API test...');
        const results = {};

        try {
            // Test ping
            console.log('1. Testing ping...');
            results.ping = await api.ping();

            // Test companies
            console.log('2. Testing companies...');
            results.getCompanies = await api.getCompanies();
            
            const testCompany = {
                name: 'API Test Company',
                code: 'APITEST'
            };
            results.createCompany = await api.createCompany(testCompany);
            
            if (results.createCompany.status === 'success') {
                const companyId = results.createCompany.data.id;
                results.updateCompany = await api.updateCompany({
                    id: companyId,
                    name: 'Updated API Test Company',
                    code: 'UPDATED'
                });
                results.deleteCompany = await api.deleteCompany(companyId);
            }

            // Test roles
            console.log('3. Testing roles...');
            results.getRoles = await api.getRoles();
            
            const testRole = {
                name: 'API Test Role',
                company_id: 'global'
            };
            results.createRole = await api.createRole(testRole);
            
            if (results.createRole.status === 'success') {
                const roleId = results.createRole.data.id;
                results.deleteRole = await api.deleteRole(roleId);
            }

            // Test dropdown lists
            console.log('4. Testing dropdown lists...');
            results.getDropdownLists = await api.getDropdownLists();
            
            const testDropdown = {
                name: 'API Test Dropdown',
                options: [
                    { label: 'Test Option 1', value: 'test1', parentValue: '' },
                    { label: 'Test Option 2', value: 'test2', parentValue: '' }
                ]
            };
            results.createDropdownList = await api.createDropdownList(testDropdown);
            
            if (results.createDropdownList.status === 'success') {
                const dropdownId = results.createDropdownList.data.id;
                results.deleteDropdownList = await api.deleteDropdownList(dropdownId);
            }

            console.log('✅ Comprehensive test completed!');
            return {
                success: true,
                results: results,
                summary: {
                    totalTests: Object.keys(results).length,
                    successfulTests: Object.values(results).filter(r => r.status === 'success').length,
                    failedTests: Object.values(results).filter(r => r.status === 'error').length
                }
            };

        } catch (error) {
            console.error('❌ Comprehensive test failed:', error);
            return {
                success: false,
                error: error.message,
                results: results
            };
        }
    }
};

export default api;