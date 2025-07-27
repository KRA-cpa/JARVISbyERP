// src/components/admin/RoleEditorCore.js - Corrected with API Integration
import React, { useState } from "react";
import { ArrowLeftIcon } from "../shared/Icons"; // Fixed import path

/**
 * =================================================================================
 * RoleEditor Component - API Integrated
 * ---------------------------------------------------------------------------------
 * This component provides a form for creating or editing a single role's details,
 * including its assignment to a specific company or as a global role.
 * Updated with proper API integration, loading states, and error handling.
 * =================================================================================
 */
function RoleEditor({ role, companies, onBack, onSave }) {
    // Initialize state with the passed role data or a blank slate for a new role
    const [roleData, setRoleData] = useState(
        role || { name: '', company_id: null }
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
        // Use null for the "Global" option
        const finalValue = value === 'global' ? null : value;
        setRoleData(prev => ({ ...prev, [field]: finalValue }));
        // Clear error when user makes changes
        if (error) setError(null);
    };

    const handleSave = async () => {
        // Basic validation
        if (!roleData.name.trim()) {
            setError('Role Name is required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // The onSave function will handle the API call
            await onSave(roleData);
            // onSave will handle navigation back and state updates
        } catch (error) {
            setError(error.message || 'Failed to save role');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                    {roleData.id ? `Editing Role: ${roleData.name}` : 'Create New Role'}
                </h2>
                <div className="flex gap-4">
                    <button 
                        onClick={onBack} 
                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center disabled:opacity-50"
                        disabled={loading}
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2"/> Back
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                        disabled={loading || !roleData.name.trim()}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">
                            Role Name *
                        </label>
                        <input
                            type="text"
                            id="roleName"
                            value={roleData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., Manager"
                            disabled={loading}
                            required
                        />
                        {!roleData.name.trim() && (
                            <p className="mt-1 text-sm text-gray-500">Role name is required</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
                            Company Assignment
                        </label>
                        <select
                            id="companyId"
                            value={roleData.company_id === null ? 'global' : roleData.company_id}
                            onChange={(e) => handleChange('company_id', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        >
                            <option value="global">All Companies (Global)</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            Global roles apply to all companies, specific roles apply to one company only
                        </p>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Role Information</h4>
                    <div className="text-sm text-blue-700">
                        <p>• <strong>Global roles</strong> can be assigned to users across all companies</p>
                        <p>• <strong>Company-specific roles</strong> are only available for that company</p>
                        <p>• Roles are used in workflow steps to determine who can approve tickets</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoleEditor;