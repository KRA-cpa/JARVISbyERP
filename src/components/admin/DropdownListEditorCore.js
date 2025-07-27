import React, { useState } from 'react';

// Import shared icons instead of inlining them
import {
  ArrowLeftIcon,
  PlusCircle,
  Trash2,
  Settings2
} from '../shared/Icons';

/**
 * =================================================================================
 * DropdownListEditor Component (Corrected)
 * ---------------------------------------------------------------------------------
 * This component provides a form for creating or editing a dropdown list and its
 * options, including dependencies. Fixed for proper integration with Phase 3.
 * =================================================================================
 */
function DropdownListEditor({ dropdownList, onBack, onSave }) {
    // Proper initial state with fallback for new dropdown lists
    const [listData, setListData] = useState(
        dropdownList || { 
            name: '', 
            options: [] 
        }
    );
    
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        // Validate list name
        if (!listData.name?.trim()) {
            newErrors.name = 'List name is required';
        }
        
        // Validate options
        const values = [];
        listData.options?.forEach((option, index) => {
            if (!option.label?.trim()) {
                newErrors[`option_${index}_label`] = 'Label is required';
            }
            if (!option.value?.trim()) {
                newErrors[`option_${index}_value`] = 'Value is required';
            } else {
                // Check for duplicate values
                if (values.includes(option.value)) {
                    newErrors[`option_${index}_value`] = 'Duplicate value';
                }
                values.push(option.value);
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOptionChange = (index, field, value) => {
        // Safely handle option changes with proper validation
        if (!listData.options || index >= listData.options.length) {
            return; // Safety check
        }
        
        const newOptions = [...listData.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setListData(prev => ({ ...prev, options: newOptions }));
        
        // Clear related errors when user starts typing
        if (errors[`option_${index}_${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`option_${index}_${field}`];
                return newErrors;
            });
        }
    };

    const addOption = () => {
        const newOption = { 
            label: '', 
            value: '', 
            parentValue: '' 
        };
        setListData(prev => ({
            ...prev, 
            options: [...(prev.options || []), newOption]
        }));
    };

    const removeOption = (index) => {
        if (window.confirm('Are you sure you want to remove this option?')) {
            setListData(prev => ({
                ...prev, 
                options: (prev.options || []).filter((_, i) => i !== index)
            }));
            
            // Clear errors for removed option
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`option_${index}_label`];
                delete newErrors[`option_${index}_value`];
                return newErrors;
            });
        }
    };

    const handleNameChange = (value) => {
        setListData(prev => ({ ...prev, name: value }));
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }
        
        // Clean up data before saving
        const cleanedData = {
            ...listData,
            name: listData.name.trim(),
            options: (listData.options || []).map(option => ({
                label: option.label.trim(),
                value: option.value.trim(),
                parentValue: option.parentValue?.trim() || ''
            }))
        };
        
        onSave(cleanedData);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                    {listData.id ? `Editing: ${listData.name}` : 'Create New Dropdown List'}
                </h2>
                <div className="flex gap-4">
                    <button 
                        onClick={onBack} 
                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2"/> Back
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                    <label htmlFor="listName" className="block text-sm font-medium text-gray-700">
                        List Name *
                    </label>
                    <input
                        type="text"
                        id="listName"
                        value={listData.name || ''}
                        onChange={e => handleNameChange(e.target.value)}
                        className={`mt-1 block w-full border rounded-md shadow-sm ${
                            errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                        placeholder="e.g., Company Departments"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Options</h3>
                        <span className="text-sm text-gray-500">
                            {(listData.options || []).length} option(s)
                        </span>
                    </div>
                    
                    {/* Options Header */}
                    <div className="grid grid-cols-12 gap-2 font-semibold text-sm text-gray-600 px-2 mb-2">
                        <div className="col-span-4">Label *</div>
                        <div className="col-span-4">Value * (no spaces)</div>
                        <div className="col-span-3">Parent Value</div>
                        <div className="col-span-1">Actions</div>
                    </div>
                    
                    {/* Options List */}
                    <div className="space-y-2">
                        {(listData.options || []).map((opt, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-4">
                                    <input 
                                        type="text" 
                                        value={opt.label || ''} 
                                        onChange={e => handleOptionChange(index, 'label', e.target.value)} 
                                        className={`w-full border rounded ${
                                            errors[`option_${index}_label`] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Display text"
                                    />
                                    {errors[`option_${index}_label`] && (
                                        <p className="text-xs text-red-600 mt-1">{errors[`option_${index}_label`]}</p>
                                    )}
                                </div>
                                <div className="col-span-4">
                                    <input 
                                        type="text" 
                                        value={opt.value || ''} 
                                        onChange={e => handleOptionChange(index, 'value', e.target.value.replace(/\s/g, ''))} 
                                        className={`w-full border rounded ${
                                            errors[`option_${index}_value`] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="stored_value"
                                    />
                                    {errors[`option_${index}_value`] && (
                                        <p className="text-xs text-red-600 mt-1">{errors[`option_${index}_value`]}</p>
                                    )}
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="text" 
                                        value={opt.parentValue || ''} 
                                        onChange={e => handleOptionChange(index, 'parentValue', e.target.value)} 
                                        className="w-full border-gray-300 rounded border"
                                        placeholder="for dependencies"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button 
                                        onClick={() => removeOption(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove option"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Add Option Button */}
                    <button 
                        onClick={addOption} 
                        className="mt-4 flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                        <PlusCircle className="h-5 w-5"/> Add Option
                    </button>
                    
                    {/* Help Text */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">About Dropdown Dependencies</h4>
                        <p className="text-xs text-blue-700">
                            Use "Parent Value" to create dependent dropdowns. For example, if you have a "Countries" 
                            dropdown, you can create a "Cities" dropdown where each city has a parent country value.
                        </p>
                    </div>
                    
                    {/* Show validation summary if there are errors */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800">
                                Please fix the errors above before saving.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DropdownListEditor;