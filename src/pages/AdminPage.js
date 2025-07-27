import React, { useState } from 'react';

// --- Helper Icons (Inlined for portability) ---
// In a real project, these would be imported from a shared Icons.js file.
const Settings2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);


// --- Mock Data ---
const MOCK_TICKET_TYPES = [
    { id: 'tt_1', name: 'Purchase Request', description: 'Used for requesting new items.', isActive: true },
    { id: 'tt_2', name: 'Leave Application', description: 'Standard employee leave requests.', isActive: false },
];
const MOCK_DROPDOWN_LISTS = [
    { id: 'dd_1', name: 'Company Departments' },
    { id: 'dd_2', name: 'Asset Categories' },
];
const MOCK_COMPANIES = [
    { id: 'comp_1', name: 'Main Corporation', code: 'MYCO' },
    { id: 'comp_2', name: 'Subsidiary Inc.', code: 'SUB' },
];
const MOCK_ROLES = [
    { id: 'role_1', name: 'Admin', company_id: null },
    { id: 'role_2', name: 'Manager', company_id: 'comp_1' },
];


// --- Placeholder Editor Components ---
// In a real project, these would be imported from their respective files in components/admin/
const TicketTypeEditor = ({ onBack }) => <div className="bg-white p-6 rounded-lg shadow-md"><button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold"><ArrowLeftIcon className="h-4 w-4 mr-1"/> Back</button><h2 className="text-2xl mt-4">Ticket Type Editor (UI Placeholder)</h2></div>;
const DropdownListEditor = ({ onBack }) => <div className="bg-white p-6 rounded-lg shadow-md"><button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold"><ArrowLeftIcon className="h-4 w-4 mr-1"/> Back</button><h2 className="text-2xl mt-4">Dropdown List Editor (UI Placeholder)</h2></div>;
const CompanyEditor = ({ onBack }) => <div className="bg-white p-6 rounded-lg shadow-md"><button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold"><ArrowLeftIcon className="h-4 w-4 mr-1"/> Back</button><h2 className="text-2xl mt-4">Company Editor (UI Placeholder)</h2></div>;
const RoleEditor = ({ onBack }) => <div className="bg-white p-6 rounded-lg shadow-md"><button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold"><ArrowLeftIcon className="h-4 w-4 mr-1"/> Back</button><h2 className="text-2xl mt-4">Role Editor (UI Placeholder)</h2></div>;


/**
 * =================================================================================
 * AdminPage Component (pages/AdminPage.js)
 * ---------------------------------------------------------------------------------
 * This component acts as the main container and router for all administrative
 * functions, allowing navigation between different configuration panels.
 * =================================================================================
 */
export default function AdminPage() {
    const [view, setView] = useState('main'); // 'main', 'edit_type', 'edit_dropdown', 'edit_company', 'edit_role'
    const [selectedItem, setSelectedItem] = useState(null);

    const handleNavigation = (newView, item = null) => {
        setSelectedItem(item);
        setView(newView);
    };

    const handleBack = () => {
        setView('main');
        setSelectedItem(null);
    };

    // Render the appropriate editor based on the current view state
    switch (view) {
        case 'edit_type':
            return <TicketTypeEditor ticketType={selectedItem} onBack={handleBack} onSave={() => {}} />;
        case 'edit_dropdown':
            return <DropdownListEditor dropdownList={selectedItem} onBack={handleBack} onSave={() => {}} />;
        case 'edit_company':
            return <CompanyEditor company={selectedItem} onBack={handleBack} onSave={() => {}} />;
        case 'edit_role':
            return <RoleEditor role={selectedItem} onBack={handleBack} onSave={() => {}} />;
        default:
            // Render the main admin dashboard
            return (
                <div className="space-y-8">
                    {/* Ticket Types Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Ticket Types Configuration</h2>
                            <button onClick={() => handleNavigation('edit_type')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                                <PlusCircle className="h-5 w-5 mr-2"/> Create New Ticket Type
                            </button>
                        </div>
                        <div className="space-y-2">
                            {MOCK_TICKET_TYPES.map(type => (
                                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <div><p className="font-semibold">{type.name}</p></div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{type.isActive ? 'Active' : 'Inactive'}</span>
                                        <button onClick={() => handleNavigation('edit_type', type)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dropdown Lists Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Dropdown List Management</h2>
                            <button onClick={() => handleNavigation('edit_dropdown')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                                <PlusCircle className="h-5 w-5 mr-2"/> Create New Dropdown List
                            </button>
                        </div>
                        <div className="space-y-2">
                            {MOCK_DROPDOWN_LISTS.map(list => (
                                <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <p className="font-semibold">{list.name}</p>
                                    <button onClick={() => handleNavigation('edit_dropdown', list)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Companies Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Company Management</h2>
                            <button onClick={() => handleNavigation('edit_company')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                                <PlusCircle className="h-5 w-5 mr-2"/> Add New Company
                            </button>
                        </div>
                        <div className="space-y-2">
                            {MOCK_COMPANIES.map(company => (
                                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <p className="font-semibold">{company.name} ({company.code})</p>
                                    <button onClick={() => handleNavigation('edit_company', company)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roles Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Role Management</h2>
                            <button onClick={() => handleNavigation('edit_role')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                                <PlusCircle className="h-5 w-5 mr-2"/> Add New Role
                            </button>
                        </div>
                        <div className="space-y-2">
                            {MOCK_ROLES.map(role => (
                                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="font-semibold">{role.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Scope: {role.company_id ? MOCK_COMPANIES.find(c => c.id === role.company_id)?.name : 'Global'}
                                        </p>
                                    </div>
                                    <button onClick={() => handleNavigation('edit_role', role)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
    }
}
