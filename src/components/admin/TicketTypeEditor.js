import React, { useState } from 'react';

// --- Helper Icons (Inlined for portability) ---
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const Trash2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const Settings2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);


/**
 * =================================================================================
 * TicketTypeEditor Component
 * ---------------------------------------------------------------------------------
 * This component provides a comprehensive UI for creating and editing all aspects
 * of a ticket type, including its fields, rules, and workflow steps.
 * =================================================================================
 */
function TicketTypeEditor({ ticketType, onBack, onSave }) {
    const [typeData, setTypeData] = useState(ticketType);

    // --- Generic Handlers ---
    const handleTopLevelChange = (field, value) => {
        setTypeData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (section, field, value) => {
        setTypeData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    // --- Custom Field Handlers ---
    const handleFieldUpdate = (index, field, value) => {
        setTypeData(prev => {
            const newFields = [...(prev.fields || [])];
            newFields[index] = { ...newFields[index], [field]: value };
            return { ...prev, fields: newFields };
        });
    };

    const addField = () => {
        const newField = { 
            name: `newField${Date.now()}`, 
            label: 'New Field', 
            type: 'text', 
            required: false, 
            isNew: true // Flag to show it can be deleted
        };
        setTypeData(prev => ({ ...prev, fields: [...(prev.fields || []), newField] }));
    };

    const removeField = (index) => {
        setTypeData(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }));
    };

    // --- Workflow Step Handlers ---
    const handleWorkflowStepUpdate = (index, field, value, subField = null) => {
        setTypeData(prev => {
            const newSteps = [...(prev.workflow.steps || [])];
            if (subField) {
                newSteps[index][field] = { ...newSteps[index][field], [subField]: value };
            } else {
                newSteps[index][field] = value;
            }
            return { ...prev, workflow: { ...prev.workflow, steps: newSteps } };
        });
    };

    const addWorkflowStep = () => {
        const stepCount = typeData.workflow.steps.length;
        const newStep = {
            name: `For Approval of Approver (${stepCount + 1})`,
            status: 'Pending Approval',
            step_type: 'approval',
            approvers: { roles: [], required: 'any' },
            sla: { duration: 1, unit: 'days', excludeWeekends: true }
        };
        setTypeData(prev => ({ ...prev, workflow: { ...prev.workflow, steps: [...(prev.workflow.steps || []), newStep] } }));
    };

    const removeWorkflowStep = (index) => {
        setTypeData(prev => ({
            ...prev,
            workflow: { ...prev.workflow, steps: prev.workflow.steps.filter((_, i) => i !== index) }
        }));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                    {typeData.id ? `Editing: ${typeData.name}` : 'Create New Ticket Type'}
                </h2>
                <div className="flex gap-4">
                    <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><ArrowLeftIcon className="h-4 w-4 mr-2"/> Back</button>
                    <button onClick={() => onSave(typeData)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">General Settings</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={typeData.name} onChange={(e) => handleTopLevelChange('name', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Is Active (Visible to users)</label>
                        <input type="checkbox" checked={typeData.isActive} onChange={(e) => handleTopLevelChange('isActive', e.target.checked)} className="mt-2 h-5 w-5 text-indigo-600"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea value={typeData.description} onChange={(e) => handleTopLevelChange('description', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3"></textarea>
                    </div>
                 </div>
            </div>

            {/* Submission & Action Rules */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Submission & Action Rules</h3>
                 <div>
                    <label className="flex items-center">
                        <input type="checkbox" checked={typeData.requireAttachmentOnCreate} onChange={(e) => handleTopLevelChange('requireAttachmentOnCreate', e.target.checked)} className="h-5 w-5 text-indigo-600"/>
                        <span className="ml-2 text-gray-700">Require attachment on ticket creation</span>
                    </label>
                 </div>
                 <div className="mt-4">
                     <p className="block text-sm font-medium text-gray-700 mb-2">Require comments for the following actions:</p>
                     <div className="flex gap-6">
                        {Object.keys(typeData.commentRequirements || {}).map(action => (
                            <label key={action} className="flex items-center">
                                <input type="checkbox" checked={typeData.commentRequirements[action]} onChange={(e) => handleNestedChange('commentRequirements', action, e.target.checked)} className="h-5 w-5 text-indigo-600"/>
                                <span className="ml-2 text-gray-700 capitalize">{action}</span>
                            </label>
                        ))}
                     </div>
                 </div>
            </div>
            
            {/* Custom Fields Builder */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Custom Fields</h3>
                 <div className="space-y-4">
                    {(typeData.fields || []).map((field, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-end gap-2">
                                {field.isNew ? (
                                    <button onClick={() => removeField(index)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-5 w-5"/> <span className="sr-only">Remove</span></button>
                                ) : (
                                    <button title="Cannot be deleted as it is used by existing tickets." className="text-gray-300 cursor-not-allowed"><Trash2 className="h-5 w-5"/> <span className="sr-only">Remove</span></button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm">Label</label><input type="text" value={field.label} onChange={e => handleFieldUpdate(index, 'label', e.target.value)} className="mt-1 w-full border-gray-300 rounded"/></div>
                                <div><label className="text-sm">Type</label><select value={field.type} onChange={e => handleFieldUpdate(index, 'type', e.target.value)} className="mt-1 w-full border-gray-300 rounded"><option>text</option><option>paragraph</option><option>date</option><option>amount</option><option>dropdown</option><option>file</option></select></div>
                                <div><label className="text-sm">Name (auto-generated)</label><input type="text" value={field.name} readOnly className="mt-1 w-full border-gray-300 rounded bg-gray-200"/></div>
                                <div><label className="flex items-center mt-6"><input type="checkbox" checked={field.required} onChange={e => handleFieldUpdate(index, 'required', e.target.checked)} className="h-4 w-4"/> <span className="ml-2">Required</span></label></div>
                            </div>
                        </div>
                    ))}
                     <button onClick={addField} className="flex items-center gap-2 text-indigo-600 font-medium"><PlusCircle className="h-5 w-5"/> Add Field</button>
                 </div>
            </div>

            {/* Workflow Steps Builder */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Workflow Steps</h3>
                 <div className="space-y-6">
                    {(typeData.workflow.steps || []).map((step, index) => (
                        <div key={index} className="p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50/50 relative">
                            <span className="absolute -top-3 -left-3 bg-indigo-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-sm">{index + 1}</span>
                            <div className="flex justify-end"><button onClick={() => removeWorkflowStep(index)}><Trash2 className="h-5 w-5 text-red-500"/></button></div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label>Step Name</label><input type="text" value={step.name} onChange={e => handleWorkflowStepUpdate(index, 'name', e.target.value)} className="w-full mt-1 border-gray-300 rounded"/></div>
                                <div><label>Ticket Status at this Step</label><input type="text" value={step.status} onChange={e => handleWorkflowStepUpdate(index, 'status', e.target.value)} className="w-full mt-1 border-gray-300 rounded"/></div>
                            </div>
                            <div className="mb-4">
                                <label>Approver Role(s)</label>
                                <input type="text" placeholder="e.g. manager,finance" value={(step.approvers.roles || []).join(',')} onChange={e => handleWorkflowStepUpdate(index, 'approvers', e.target.value.split(',').map(r => r.trim()), 'roles')} className="w-full mt-1 border-gray-300 rounded"/>
                            </div>
                            <div className="mb-4">
                                <label>Require</label>
                                <select value={step.approvers.required} onChange={e => handleWorkflowStepUpdate(index, 'approvers', e.target.value, 'required')} className="w-auto mt-1 ml-2 border-gray-300 rounded"><option>any</option><option>all</option></select>
                                <span> of the above to approve</span>
                            </div>
                            <div className="mb-4">
                                 <label>SLA</label>
                                 <div className="flex items-center gap-2 mt-1">
                                    <input type="number" value={step.sla.duration} onChange={e => handleWorkflowStepUpdate(index, 'sla', Number(e.target.value), 'duration')} className="w-20 border-gray-300 rounded"/>
                                    <select value={step.sla.unit} onChange={e => handleWorkflowStepUpdate(index, 'sla', e.target.value, 'unit')} className="border-gray-300 rounded"><option>days</option><option>hours</option></select>
                                    <label><input type="checkbox" checked={step.sla.excludeWeekends} onChange={e => handleWorkflowStepUpdate(index, 'sla', e.target.checked, 'excludeWeekends')}/> Weekdays only</label>
                                 </div>
                            </div>
                        </div>
                    ))}
                     <button onClick={addWorkflowStep} className="flex items-center gap-2 text-indigo-600 font-medium"><PlusCircle className="h-5 w-5"/> Add Workflow Step</button>
                 </div>
            </div>
        </div>
    );
}

// --- components/admin/DropdownListEditor.js ---
function DropdownListEditor({ dropdownList, onBack, onSave }) {
    const [listData, setListData] = useState(dropdownList);

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...listData.options];
        newOptions[index][field] = value;
        setListData(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setListData(prev => ({...prev, options: [...(prev.options || []), { label: '', value: '', parentValue: ''}]}));
    };

    const removeOption = (index) => {
        setListData(prev => ({...prev, options: prev.options.filter((_, i) => i !== index)}));
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800">Editing Dropdown: {listData.name}</h2>
                 <div className="flex gap-4">
                    <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><ArrowLeftIcon className="h-4 w-4 mr-2"/> Back</button>
                    <button onClick={() => onSave(listData)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">List Name</label>
                <input type="text" value={listData.name} onChange={e => setListData(prev => ({...prev, name: e.target.value}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold">Options</h3>
                <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-12 gap-2 font-semibold text-sm text-gray-600 px-2">
                        <div className="col-span-4">Label</div>
                        <div className="col-span-4">Value (no spaces)</div>
                        <div className="col-span-3">Parent Value (Optional)</div>
                    </div>
                    {(listData.options || []).map((opt, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4"><input type="text" value={opt.label} onChange={e => handleOptionChange(index, 'label', e.target.value)} className="w-full border-gray-300 rounded"/></div>
                            <div className="col-span-4"><input type="text" value={opt.value} onChange={e => handleOptionChange(index, 'value', e.target.value)} className="w-full border-gray-300 rounded"/></div>
                            <div className="col-span-3"><input type="text" value={opt.parentValue} onChange={e => handleOptionChange(index, 'parentValue', e.target.value)} className="w-full border-gray-300 rounded"/></div>
                            <div className="col-span-1"><button onClick={() => removeOption(index)}><Trash2 className="h-5 w-5 text-red-500"/></button></div>
                        </div>
                    ))}
                </div>
                <button onClick={addOption} className="mt-4 flex items-center gap-2 text-indigo-600 font-medium"><PlusCircle className="h-5 w-5"/> Add Option</button>
            </div>
        </div>
    );
}

// --- Main Admin Panel Component (pages/AdminPage.js) ---
// This component is exported as the default and would be used in App.js
function AdminPage() {
    const [view, setView] = useState('main'); // 'main', 'edit_type', 'edit_dropdown'
    const [selectedItem, setSelectedItem] = useState(null);

    const handleEditTicketType = (type) => {
        setSelectedItem(JSON.parse(JSON.stringify(type)));
        setView('edit_type');
    };

    const handleCreateTicketType = () => {
        setSelectedItem({
            name: '', description: '', isActive: true,
            requireAttachmentOnCreate: false,
            commentRequirements: { approve: false, return: false, reject: false, cancel: false },
            fields: [],
            workflow: { steps: [] }
        });
        setView('edit_type');
    };
    
    const handleEditDropdown = (dropdown) => {
        // Mock data for dropdown editor
        setSelectedItem({
            id: dropdown.id,
            name: dropdown.name,
            options: [
                { label: 'Laptop', value: 'laptop', parentValue: 'hardware' },
                { label: 'CRM License', value: 'crm-license', parentValue: 'software' },
            ]
        });
        setView('edit_dropdown');
    };
    
    const handleCreateDropdown = () => {
        setSelectedItem({ name: 'New Dropdown List', options: [] });
        setView('edit_dropdown');
    };

    const handleBack = () => {
        setView('main');
        setSelectedItem(null);
    };

    if (view === 'edit_type') {
        return <TicketTypeEditor ticketType={selectedItem} onBack={handleBack} onSave={(data) => { console.log("Saving Ticket Type:", data); handleBack(); }} />;
    }
    
    if (view === 'edit_dropdown') {
        return <DropdownListEditor dropdownList={selectedItem} onBack={handleBack} onSave={(data) => { console.log("Saving Dropdown:", data); handleBack(); }} />;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Ticket Types Configuration</h2>
                    <button onClick={handleCreateTicketType} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2"/> Create New Ticket Type
                    </button>
                </div>
                <div className="space-y-2">
                    {MOCK_TICKET_TYPES.map(type => (
                        <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div>
                                <p className="font-semibold">{type.name}</p>
                                <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {type.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <button onClick={() => alert(type.isActive ? 'Disabling...' : 'Enabling...')} className="text-sm font-medium text-gray-600 hover:text-black">
                                    {type.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => handleEditTicketType(type)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="border-t pt-8">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Dropdown List Management</h2>
                    <button onClick={handleCreateDropdown} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2"/> Create New Dropdown List
                    </button>
                </div>
                <div className="space-y-2">
                    {MOCK_DROPDOWN_LISTS.map(list => (
                        <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <p className="font-semibold">{list.name}</p>
                            <div className="flex items-center gap-4">
                                <button onClick={() => alert('Deleting...')} className="text-sm font-medium text-red-600 hover:text-red-900">Delete</button>
                                <button onClick={() => handleEditDropdown(list)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
