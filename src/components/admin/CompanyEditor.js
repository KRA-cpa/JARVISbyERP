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
//const MOCK_COMPANIES = [
//    { id: 'comp_1', name: 'Main Corporation', code: 'MYCO' },
 //   { id: 'comp_2', name: 'Subsidiary Inc.', code: 'SUB' },
];

/**
 * =================================================================================
 * CompanyEditor Component
 * ---------------------------------------------------------------------------------
 * This component provides a form for creating or editing a single company's details.
 * It's designed to be displayed within the AdminPage.
 * =================================================================================
 */
function CompanyEditor({ company, onBack, onSave }) {
    // Initialize state with the passed company data or a blank slate for a new company
    const [companyData, setCompanyData] = useState(
        company || { name: '', code: '' }
    );

    const handleChange = (field, value) => {
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Basic validation
        if (!companyData.name || !companyData.code) {
            alert('Company Name and Code are required.');
            return;
        }
        onSave(companyData);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                    {companyData.id ? `Editing: ${companyData.name}` : 'Create New Company'}
                </h2>
                <div className="flex gap-4">
                    <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><ArrowLeftIcon className="h-4 w-4 mr-2"/> Back</button>
                    <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            placeholder="e.g., Main Corporation"
                        />
                    </div>
                    <div>
                        <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700">Company Code</label>
                        <input
                            type="text"
                            id="companyCode"
                            value={companyData.code}
                            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            placeholder="e.g., MYCO (3-5 letters)"
                            maxLength="5"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompanyEditor;