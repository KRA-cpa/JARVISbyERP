import React, { useState } from 'react';

// --- Helper Icons (Inlined for portability) ---
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const Trash2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const Settings2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);



/**
 * =================================================================================
 * DropdownListEditor Component
 * ---------------------------------------------------------------------------------
 * This component provides a form for creating or editing a dropdown list and its
 * options, including dependencies.
 * =================================================================================
 */
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

    const handleSave = () => {
        if (!listData.name) {
            alert('List Name is required.');
            return;
        }
        onSave(listData);
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800">
                    {listData.id ? `Editing: ${listData.name}` : 'Create New Dropdown List'}
                </h2>
                 <div className="flex gap-4">
                    <button onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><ArrowLeftIcon className="h-4 w-4 mr-2"/> Back</button>
                    <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>
            
            <div>
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700">List Name</label>
                <input
                    type="text"
                    id="listName"
                    value={listData.name}
                    onChange={e => setListData(prev => ({...prev, name: e.target.value}))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="e.g., Company Departments"
                />
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
export default DropdownListEditor;