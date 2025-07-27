import React, { useState } from 'react';

// --- Helper Icons (Inlined for portability) ---
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const Settings2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);

// --- Mock Data ---
const MOCK_ROLES = [
    { id: 'role_1', name: 'Admin', company_id: null }, // Global Role
    { id: 'role_2', name: 'Manager', company_id: 'comp_1' },
    { id: 'role_3', name: 'Finance', company_id: 'comp_1' },
    { id: 'role_4', name: 'Manager', company_id: 'comp_2' },
];

const MOCK_COMPANIES = [
    { id: 'comp_1', name: 'Main Corporation', code: 'MYCO' },
    { id: 'comp_2', name: 'Subsidiary Inc.', code: 'SUB' },
];


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


/**
 * =================================================================================
 * RoleAdminPage (Demonstration Wrapper)
 * ---------------------------------------------------------------------------------
 * This component demonstrates how the RoleEditor would be used. It manages the
 * view state between the list of roles and the editor form.
 * In the final application, this logic would be part of the main AdminPage.
 * =================================================================================
 */
export default function RoleAdminPage() {
    const [roles, setRoles] = useState(MOCK_ROLES);
    const [companies] = useState(MOCK_COMPANIES);
    const [editingRole, setEditingRole] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleEdit = (role) => {
        setEditingRole(role);
    };

    const handleCreate = () => {
        setIsCreating(true);
    };

    const handleBack = () => {
        setEditingRole(null);
        setIsCreating(false);
    };

    const handleSave = (roleData) => {
        console.log("Saving role:", roleData);
        // In a real app, you would call an API here to save the data.
        if (roleData.id) {
            setRoles(roles.map(r => r.id === roleData.id ? roleData : r));
        } else {
            setRoles([...roles, { ...roleData, id: `role_${Date.now()}` }]);
        }
        handleBack();
    };

    const getCompanyName = (companyId) => {
        if (companyId === null) {
            return <span className="font-semibold text-indigo-600">Global</span>;
        }
        return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
    };

    if (editingRole || isCreating) {
        return <RoleEditor role={editingRole} companies={companies} onBack={handleBack} onSave={handleSave} />;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Role Management</h2>
                <button onClick={handleCreate} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                    <PlusCircle className="h-5 w-5 mr-2"/> Add New Role
                </button>
            </div>
            <div className="space-y-2">
                {roles.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                            <p className="font-semibold">{role.name}</p>
                            <p className="text-sm text-gray-500">Company: {getCompanyName(role.company_id)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => alert('Deleting...')} className="text-sm font-medium text-red-600 hover:text-red-900">Delete</button>
                            <button onClick={() => handleEdit(role)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
