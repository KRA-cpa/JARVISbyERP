import React, { useState, useEffect } from 'react';
import { useDropdownLists, useCompanies } from '../../hooks/useAPI';
import { dropdownAPI } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const AdminDropdownManager = () => {
  const [selectedCompany, setSelectedCompany] = useState('1'); // Default to first company
  const { data: companies } = useCompanies();
  const { data: dropdownLists, loading, error, refetch } = useDropdownLists(selectedCompany === 'global' ? null : selectedCompany);
  const { ToastContainer, success, error: showError } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    company_id: '1',
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

  // Reset form when closing
  useEffect(() => {
    if (!showCreateForm && !editingList) {
      setFormData({
        name: '',
        description: '',
        company_id: selectedCompany,
        options: []
      });
      setNewOption({
        value: '',
        label: '',
        parent_id: '',
        sort_order: 0
      });
      setFormError('');
    }
  }, [showCreateForm, editingList]);

  // Populate form when editing
  useEffect(() => {
    if (editingList) {
      setFormData({
        name: editingList.name || '',
        description: editingList.description || '',
        company_id: editingList.company_id || selectedCompany,
        options: editingList.options || []
      });
    }
  }, [editingList, selectedCompany]);

  // Update form company when selected company filter changes
  useEffect(() => {
    if (!editingList) {
      setFormData(prev => ({
        ...prev,
        company_id: selectedCompany
      }));
    }
  }, [selectedCompany, editingList]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('List name is required');
      return false;
    }

    // Check for duplicate list names
    const existingList = dropdownLists?.find(l =>
      l.name.toLowerCase() === formData.name.toLowerCase() &&
      l.id !== editingList?.id
    );
    if (existingList) {
      setFormError('List name already exists');
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
    try {
      const listData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        company_id: formData.company_id === 'global' ? null : formData.company_id,
        options: formData.options
      };

      if (editingList) {
        // Update existing dropdown list
        await dropdownAPI.updateList(editingList.id, listData);
      } else {
        // Create new dropdown list
        await dropdownAPI.createList(listData);
      }

      // Close form and refresh data
      setShowCreateForm(false);
      setEditingList(null);
      refetch();

      // Show success message
      success(editingList ? 'Dropdown list updated successfully!' : 'Dropdown list created successfully!');
    } catch (error) {
      console.error('Dropdown list operation failed:', error);
      const errorMessage = error.message || 'Failed to save dropdown list. Please try again.';
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (list) => {
    if (!window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
      return;
    }

    try {
      await dropdownAPI.deleteList(list.id);
      refetch();
      if (selectedList?.id === list.id) {
        setSelectedList(null);
      }
      success(`Dropdown list "${list.name}" deleted successfully!`);
    } catch (error) {
      console.error('Delete dropdown list failed:', error);
      const errorMessage = error.message || 'Failed to delete dropdown list. Please try again.';
      showError(errorMessage);
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
              >
                <Icons.ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveOption(option.id, 'down')}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Move Down"
              >
                <Icons.ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove Option"
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

  const renderForm = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {editingList ? 'Edit Dropdown List' : 'Create New Dropdown List'}
        </h3>
        <button
          onClick={() => {
            setShowCreateForm(false);
            setEditingList(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <Icons.Close size={20} />
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              List Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter list name"
              disabled={isSubmitting}
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
              placeholder="Brief description"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="global">Global (All Companies)</option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add New Option */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add Option</h4>
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
                className="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                disabled={isSubmitting}
              >
                Add Option
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setEditingList(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{editingList ? 'Update List' : 'Create List'}</span>
          </button>
        </div>
      </form>
    </div>
  );

  const renderDropdownList = () => (
    <div className="grid grid-cols-1 gap-6">
      {/* Lists */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Dropdown Lists</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading dropdown lists...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <Icons.Warning size={32} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-600 mb-4">Failed to load dropdown lists</p>
            <button
              onClick={refetch}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : dropdownLists?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {dropdownLists.map((list) => (
              <div
                key={list.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                  selectedList?.id === list.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                }`}
                onClick={() => setSelectedList(list)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Icons.ChevronDown size={20} className="text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{list.name}</h4>
                        {list.description && (
                          <p className="text-sm text-gray-500">{list.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>{list.options?.length || 0} options</span>
                          <span>•</span>
                          <span>
                            {list.company_id
                              ? companies?.find(c => c.id === list.company_id)?.name || 'Unknown Company'
                              : 'Global'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingList(list);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit List"
                    >
                      <Icons.Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(list);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete List"
                    >
                      <Icons.Close size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No dropdown lists found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              Create First List
            </button>
          </div>
        )}
      </div>

      {/* Selected List Options */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedList ? `${selectedList.name} Options` : 'Select a List'}
          </h3>
        </div>

        {selectedList ? (
          selectedList.options?.length > 0 ? (
            <div className="p-6">
              <div className="space-y-2">
                {renderOptionTree(selectedList.options.filter(o => !o.parent_id))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No options in this list</p>
            </div>
          )
        ) : (
          <div className="p-6 text-center">
            <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Select a dropdown list to view its options</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dropdown List Management</h2>
          <p className="text-gray-600">Manage dropdown options and hierarchical data</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Company Filter */}
          <div className="flex items-center space-x-2">
            <Icons.Company size={16} className="text-gray-500" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="global">Global Lists</option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </option>
              ))}
            </select>
          </div>
          {!showCreateForm && !editingList && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center sm:justify-start space-x-2"
            >
              <Icons.Create size={16} />
              <span>Add List</span>
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {(showCreateForm || editingList) && renderForm()}

      {/* Dropdown Lists */}
      {renderDropdownList()}
    </div>
    </>
  );
};

export default AdminDropdownManager;