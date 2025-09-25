import React, { useState } from 'react';
import { dropdownAPI } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';
import { logDropdownCreation } from '../../utils/localLogger';

const DropdownListCreate = ({ onSuccess, onCancel }) => {
  const { ToastContainer, success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    options: []
  });
  const [newOption, setNewOption] = useState({
    value: '',
    label: '',
    parent_id: '',
    sort_order: 0
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('List name is required');
      return false;
    }

    if (!formData.options || formData.options.length === 0) {
      setFormError('At least one option is required');
      return false;
    }

    setFormError('');
    return true;
  };

  const validateOption = () => {
    if (!newOption.value.trim()) {
      return 'Option value is required';
    }
    if (!newOption.label.trim()) {
      return 'Option label is required';
    }

    // Check for duplicate values
    const existingOption = formData.options.find(o =>
      o.value.toLowerCase() === newOption.value.toLowerCase()
    );
    if (existingOption) {
      return 'Option value already exists';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Clean up options by removing temporary frontend IDs
    const cleanedOptions = formData.options.map(option => ({
      label: option.label,
      value: option.value,
      parent_option_id: option.parent_id || '',
      sort_order: option.sort_order || 0
    }));

    const listData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      company_id: null, // Explicitly set to null for global dropdown lists
      options: cleanedOptions
    };

    try {

      // Enhanced debugging for persistent issue
      console.log('🚀 === DROPDOWN CREATION ATTEMPT ===');
      console.log('📝 Frontend sending payload:', JSON.stringify(listData, null, 2));
      console.log('🔍 Original options had temp IDs:', formData.options.map(o => o.id));
      console.log('✅ Cleaned options removed temp IDs:', cleanedOptions.length, 'options');
      console.log('🌐 API Config:', {
        baseURL: window.location.origin,
        environment: process.env.NODE_ENV,
        connectionType: process.env.NODE_ENV === 'development' ? 'DIRECT AppScript' : 'VERCEL PROXY',
        timestamp: new Date().toISOString()
      });

      const result = await dropdownAPI.createList(listData);

      // Log successful creation
      logDropdownCreation(listData, result);

      success(`Dropdown list "${formData.name}" created successfully! You can now assign it to companies.`);

      // Reset form
      setFormData({
        name: '',
        description: '',
        options: []
      });
      setNewOption({
        value: '',
        label: '',
        parent_id: '',
        sort_order: 0
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('🚨 === DROPDOWN CREATION FAILED ===');
      console.error('❌ Error object:', error);
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      console.error('🔗 Network info:', {
        navigator: navigator.onLine ? 'Online' : 'Offline',
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // Log failed creation
      logDropdownCreation(listData, null, error);

      const errorMessage = error.message || 'Failed to create dropdown list. Please try again.';
      setFormError(`DETAILED ERROR: ${errorMessage}`);
      showError(`Creation Failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    const validationError = validateOption();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const option = {
      ...newOption,
      id: `temp_${Date.now()}`,
      sort_order: formData.options.length
    };

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, option]
    }));

    setNewOption({
      value: '',
      label: '',
      parent_id: '',
      sort_order: 0
    });
    setFormError('');
  };

  const removeOption = (optionId) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== optionId)
    }));
  };

  const moveOption = (optionId, direction) => {
    const currentIndex = formData.options.findIndex(o => o.id === optionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formData.options.length) return;

    const newOptions = [...formData.options];
    [newOptions[currentIndex], newOptions[newIndex]] = [newOptions[newIndex], newOptions[currentIndex]];

    // Update sort_order
    newOptions.forEach((option, index) => {
      option.sort_order = index;
    });

    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const getParentOptions = () => {
    return formData.options.filter(option => !option.parent_id);
  };

  const getChildOptions = (parentId) => {
    return formData.options.filter(option => option.parent_id === parentId);
  };

  const renderOptionTree = (options, level = 0) => {
    return options.map((option) => {
      const children = getChildOptions(option.id);
      return (
        <div key={option.id}>
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            style={{ marginLeft: `${level * 20}px` }}
          >
            <div className="flex items-center space-x-2">
              {level > 0 && <span className="text-gray-400">└─</span>}
              <span className="text-sm font-medium text-gray-900">{option.label}</span>
              <span className="text-xs text-gray-500">({option.value})</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => moveOption(option.id, 'up')}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Move Up"
                disabled={isSubmitting}
              >
                <Icons.ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveOption(option.id, 'down')}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Move Down"
                disabled={isSubmitting}
              >
                <Icons.ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove Option"
                disabled={isSubmitting}
              >
                <Icons.Close size={14} />
              </button>
            </div>
          </div>
          {children.length > 0 && (
            <div className="ml-4">
              {renderOptionTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <ToastContainer />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Create New Dropdown List</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create a dropdown list without company assignments. You can assign it to companies later.
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <Icons.Close size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Icons.Warning size={16} className="text-red-600" />
                <span className="text-sm text-red-700">{formError}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Priority Levels, Departments"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this dropdown list"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Add New Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Add Options</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Value (e.g., urgent)"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Label (e.g., Urgent)"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <select
                  value={newOption.parent_id}
                  onChange={(e) => setNewOption(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Top Level</option>
                  {getParentOptions().map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Icons.Plus size={14} />
                    <span>Add</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          {formData.options.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Options ({formData.options.length})
              </h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {renderOptionTree(getParentOptions())}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <Icons.Plus size={16} />
              <span>Create Dropdown List</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default DropdownListCreate;