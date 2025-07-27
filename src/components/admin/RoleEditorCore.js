import React, { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid"; // Adjust path if needed

/**
 * =================================================================================
 * RoleEditor Component
 * ---------------------------------------------------------------------------------
 * This component provides a form for creating or editing a single role's details,
 * including its assignment to a specific company or as a global role.
 * =================================================================================
 */
function RoleEditor({ role, companies, onBack, onSave }) {
    // Initialize state with the passed role data or a blank slate for a new role
    const [roleData, setRoleData] = useState(
        role || { name: '', company_id: null }
    );

    const handleChange = (field, value) => {
        // Use null for the "Global" option
        const finalValue = value === 'global' ? null : value;
        setRoleData(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleSave = () => {
        // Basic validation
        if (!roleData.name) {
            alert('Role Name is required.');
            return;
        }
        onSave(roleData);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                    {roleData.id ? `Editing Role: ${roleData.name}` : 'Create New Role'}
                </h2>
                <div className="flex gap-4">
                    <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><ArrowLeftIcon className="h-4 w-4 mr-2"/> Back</button>
                    <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">Role Name</label>
                        <input
                            type="text"
                            id="roleName"
                            value={roleData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            placeholder="e.g., Manager"
                        />
                    </div>
                    <div>
                        <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">Company Assignment</label>
                        <select
                            id="companyId"
                            value={roleData.company_id === null ? 'global' : roleData.company_id}
                            onChange={(e) => handleChange('company_id', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="global">All Companies (Global)</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoleEditor;