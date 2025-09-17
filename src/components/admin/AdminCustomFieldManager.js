import React, { useState, useEffect } from 'react';
import Icons from '../shared/Icons';
import { useToast } from '../shared/Toast';
import { useTicketTypes, useDropdownLists } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';

/**
 * AdminCustomFieldManager Component
 *
 * Manages custom field configurations including:
 * - Dynamic form field creation and editing
 * - Field types: text, paragraph, date, amount, dropdown, file
 * - Field dependencies and conditional display
 * - Dropdown list integration
 * - Field ordering and grouping
 */
const AdminCustomFieldManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingField, setDeletingField] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(true);

  // API data
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { data: dropdownLists, loading: dropdownListsLoading } = useDropdownLists();

  // Form state
  const [formData, setFormData] = useState({
    ticket_type_id: '',
    name: '',
    label: '',
    type: 'text',
    is_required: false,
    is_hidden: false,
    sort_order: 1,
    dropdown_list_id: '',
    depends_on_field_id: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Field type options
  const fieldTypes = [
    { value: 'text', label: 'Single Line Text', icon: Icons.Edit },
    { value: 'paragraph', label: 'Multi-line Text', icon: Icons.Document },
    { value: 'date', label: 'Date Picker', icon: Icons.Calendar },
    { value: 'amount', label: 'Currency Amount', icon: Icons.Currency },
    { value: 'dropdown', label: 'Dropdown List', icon: Icons.ChevronDown },
    { value: 'file', label: 'File Upload', icon: Icons.Attachment }
  ];

  // Mock data for development - to be replaced with API calls
  const mockCustomFields = [
    {
      id: 1,
      ticket_type_id: 1,
      name: 'item_description',
      label: 'Item Description',
      type: 'paragraph',
      is_required: true,
      is_hidden: false,
      sort_order: 1,
      dropdown_list_id: null,
      depends_on_field_id: null
    },
    {
      id: 2,
      ticket_type_id: 1,
      name: 'estimated_cost',
      label: 'Estimated Cost',
      type: 'amount',
      is_required: true,
      is_hidden: false,
      sort_order: 2,
      dropdown_list_id: null,
      depends_on_field_id: null
    },
    {
      id: 3,
      ticket_type_id: 1,
      name: 'vendor_category',
      label: 'Vendor Category',
      type: 'dropdown',
      is_required: false,
      is_hidden: false,
      sort_order: 3,
      dropdown_list_id: 1,
      depends_on_field_id: null
    }
  ];

  const [selectedTicketType, setSelectedTicketType] = useState('');

  // Load custom fields
  const loadCustomFields = async () => {
    setCustomFieldsLoading(true);
    try {
      const fields = await API.CustomFields.getAll();
      setCustomFields(fields || []);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      setCustomFields([]);
    } finally {
      setCustomFieldsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomFields();
  }, []);

  useEffect(() => {
    if (ticketTypes && ticketTypes.length > 0 && !selectedTicketType) {
      setSelectedTicketType(ticketTypes[0].id);
    }
  }, [ticketTypes, selectedTicketType]);

  // Reset form
  const resetForm = () => {
    setFormData({
      ticket_type_id: selectedTicketType || '',
      name: '',
      label: '',
      type: 'text',
      is_required: false,
      is_hidden: false,
      sort_order: getNextSortOrder(),
      dropdown_list_id: '',
      depends_on_field_id: ''
    });
    setFormErrors({});
  };

  // Get next sort order
  const getNextSortOrder = () => {
    const fieldsForType = customFields.filter(f => f.ticket_type_id === selectedTicketType);
    return fieldsForType.length > 0 ? Math.max(...fieldsForType.map(f => f.sort_order)) + 1 : 1;
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.ticket_type_id) {
      errors.ticket_type_id = 'Ticket type is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Field name is required';
    } else if (!/^[a-z_][a-z0-9_]*$/.test(formData.name)) {
      errors.name = 'Field name must be lowercase letters, numbers, and underscores only, starting with a letter';
    }

    if (!formData.label.trim()) {
      errors.label = 'Field label is required';
    }

    if (formData.type === 'dropdown' && !formData.dropdown_list_id) {
      errors.dropdown_list_id = 'Dropdown list is required for dropdown fields';
    }

    // Check uniqueness for name within ticket type
    const existingField = customFields.find(f =>
      f.ticket_type_id === formData.ticket_type_id &&
      f.name === formData.name &&
      (!editingField || f.id !== editingField.id)
    );
    if (existingField) {
      errors.name = 'Field name already exists for this ticket type';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const fieldData = {
        ...formData,
        dropdown_list_id: formData.dropdown_list_id || null,
        depends_on_field_id: formData.depends_on_field_id || null
      };

      if (editingField) {
        await API.CustomFields.update(editingField.id, fieldData);
        showToast('success', 'Success', 'Custom field updated successfully');
        setShowEditForm(false);
        setEditingField(null);
      } else {
        await API.CustomFields.create(fieldData);
        showToast('success', 'Success', 'Custom field created successfully');
        setShowCreateForm(false);
      }

      resetForm();
      loadCustomFields();
    } catch (error) {
      showToast('error', 'Error', error.message || 'Failed to save custom field');
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreateField = () => {
    if (!selectedTicketType) {
      showToast('warning', 'Select Ticket Type', 'Please select a ticket type first');
      return;
    }
    resetForm();
    setShowCreateForm(true);
  };

  // Handle edit
  const handleEditField = (field) => {
    setFormData({
      ticket_type_id: field.ticket_type_id,
      name: field.name,
      label: field.label,
      type: field.type,
      is_required: field.is_required,
      is_hidden: field.is_hidden,
      sort_order: field.sort_order,
      dropdown_list_id: field.dropdown_list_id || '',
      depends_on_field_id: field.depends_on_field_id || ''
    });
    setEditingField(field);
    setShowEditForm(true);
  };

  // Handle delete
  const handleDeleteField = (field) => {
    setDeletingField(field);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingField) return;

    setLoading(true);

    try {
      await API.CustomFields.delete(deletingField.id);
      showToast('success', 'Success', 'Custom field deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingField(null);
      loadCustomFields();
    } catch (error) {
      showToast('error', 'Error', error.message || 'Failed to delete custom field');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle visibility
  const handleToggleVisibility = async (field) => {
    setLoading(true);

    try {
      await API.CustomFields.update(field.id, {
        ...field,
        is_hidden: !field.is_hidden
      });
      showToast('success', 'Success', `Field ${!field.is_hidden ? 'hidden' : 'shown'} successfully`);
      loadCustomFields();
    } catch (error) {
      showToast('error', 'Error', error.message || 'Failed to update field visibility');
    } finally {
      setLoading(false);
    }
  };

  // Handle reorder fields
  const handleReorderFields = async (fieldId, newSortOrder) => {
    setLoading(true);

    try {
      const field = customFields.find(f => f.id === fieldId);
      if (field) {
        await API.CustomFields.update(fieldId, {
          ...field,
          sort_order: newSortOrder
        });
        loadCustomFields();
      }
    } catch (error) {
      showToast('error', 'Error', error.message || 'Failed to reorder field');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear dropdown_list_id if type is not dropdown
    if (name === 'type' && value !== 'dropdown') {
      setFormData(prev => ({ ...prev, dropdown_list_id: '' }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const filteredFields = customFields.filter(field =>
    field.ticket_type_id === selectedTicketType
  ).sort((a, b) => a.sort_order - b.sort_order);

  // Get available dependency fields (fields that come before current field)
  const getAvailableDependencyFields = (currentSortOrder) => {
    return filteredFields.filter(field =>
      field.sort_order < currentSortOrder && !field.is_hidden
    );
  };

  // Loading state
  if (ticketTypesLoading || dropdownListsLoading || customFieldsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading custom fields...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Field Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Build dynamic form fields for ticket types with conditional logic
          </p>
        </div>
        <button
          onClick={handleCreateField}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Icons.Plus size={16} className="mr-2" />
          Add Custom Field
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingField ? 'Edit Custom Field' : 'Create New Custom Field'}
                      </h3>

                      <div className="space-y-4">
                        {/* Ticket Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ticket Type *
                          </label>
                          <select
                            name="ticket_type_id"
                            value={formData.ticket_type_id}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.ticket_type_id ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            disabled={editingField} // Can't change ticket type when editing
                          >
                            <option value="">Select a ticket type</option>
                            {ticketTypes?.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name} ({type.code})
                              </option>
                            ))}
                          </select>
                          {formErrors.ticket_type_id && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.ticket_type_id}</p>
                          )}
                        </div>

                        {/* Field Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.name ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., item_description"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Used internally. Lowercase letters, numbers, and underscores only.
                          </p>
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                          )}
                        </div>

                        {/* Field Label */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Label *
                          </label>
                          <input
                            type="text"
                            name="label"
                            value={formData.label}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.label ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., Item Description"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Displayed to users on the form.
                          </p>
                          {formErrors.label && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.label}</p>
                          )}
                        </div>

                        {/* Field Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Type *
                          </label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Dropdown List (only for dropdown type) */}
                        {formData.type === 'dropdown' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Dropdown List *
                            </label>
                            <select
                              name="dropdown_list_id"
                              value={formData.dropdown_list_id}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                                formErrors.dropdown_list_id ? 'border-red-300' : 'border-gray-300'
                              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            >
                              <option value="">Select a dropdown list</option>
                              {dropdownLists?.map((list) => (
                                <option key={list.id} value={list.id}>
                                  {list.name}
                                </option>
                              ))}
                            </select>
                            {formErrors.dropdown_list_id && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.dropdown_list_id}</p>
                            )}
                          </div>
                        )}

                        {/* Sort Order */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            name="sort_order"
                            value={formData.sort_order}
                            onChange={handleInputChange}
                            min="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Controls the display order on the form.
                          </p>
                        </div>

                        {/* Dependency Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Depends On Field
                          </label>
                          <select
                            name="depends_on_field_id"
                            value={formData.depends_on_field_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">No dependency</option>
                            {getAvailableDependencyFields(formData.sort_order).map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            This field will only show when the selected field has a value.
                          </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="is_required"
                              checked={formData.is_required}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Required field
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="is_hidden"
                              checked={formData.is_hidden}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Hidden by default
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      editingField ? 'Update' : 'Create'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setShowEditForm(false);
                      setEditingField(null);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingField && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Icons.Warning size={20} className="text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Custom Field
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{deletingField.label}"? This action cannot be undone and may affect existing tickets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingField(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Type Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Ticket Type</h3>
        {ticketTypes && ticketTypes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ticketTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedTicketType(type.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedTicketType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icons.Workflow size={20} className={
                    selectedTicketType === type.id ? 'text-blue-600' : 'text-gray-400'
                  } />
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-gray-500">Code: {type.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Icons.Documents size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Ticket Types</h4>
            <p className="text-gray-600">Create ticket types first before adding custom fields.</p>
          </div>
        )}
      </div>

      {/* Field Type Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Available Field Types</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {fieldTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2 text-sm">
              <type.icon size={16} className="text-gray-500" />
              <span className="text-gray-700">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields List */}
      {selectedTicketType && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Custom Fields ({filteredFields.length})
            </h3>
            {filteredFields.length > 1 && (
              <div className="text-sm text-gray-500">
                Use arrow buttons to reorder fields
              </div>
            )}
          </div>

          {filteredFields.length === 0 ? (
            <div className="p-6 text-center">
              <Icons.Document size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Fields</h3>
              <p className="text-gray-600 mb-4">
                Add custom fields to enhance this ticket type's form
              </p>
              <button
                onClick={handleCreateField}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Icons.Plus size={16} className="mr-2" />
                Add First Field
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFields.map((field, index) => {
                const fieldType = fieldTypes.find(t => t.value === field.type);
                const dependsOnField = field.depends_on_field_id
                  ? customFields.find(f => f.id === field.depends_on_field_id)
                  : null;
                const dropdownList = field.dropdown_list_id
                  ? dropdownLists?.find(dl => dl.id === field.dropdown_list_id)
                  : null;

                return (
                  <div key={field.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            #{field.sort_order}
                          </span>
                          {fieldType && <fieldType.icon size={16} className="text-gray-500" />}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {fieldType?.label || field.type}
                          </span>
                          {field.is_required && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                          {field.is_hidden && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Hidden
                            </span>
                          )}
                        </div>

                        <h4 className="mt-2 text-lg font-medium text-gray-900">
                          {field.label}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Field Name: <code className="bg-gray-100 px-1 rounded text-xs">{field.name}</code>
                        </p>

                        <div className="mt-2 space-y-1">
                          {dropdownList && (
                            <p className="text-sm text-gray-500">
                              Dropdown: {dropdownList.name}
                            </p>
                          )}
                          {dependsOnField && (
                            <p className="text-sm text-gray-500">
                              Depends on: {dependsOnField.label}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Move Up/Down buttons */}
                        {filteredFields.length > 1 && (
                          <>
                            <button
                              onClick={() => handleReorderFields(field.id, field.sort_order - 1)}
                              disabled={loading || index === 0}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <Icons.ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => handleReorderFields(field.id, field.sort_order + 1)}
                              disabled={loading || index === filteredFields.length - 1}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <Icons.ChevronDown size={16} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleToggleVisibility(field)}
                          disabled={loading}
                          className={`p-2 rounded-full disabled:opacity-50 ${
                            field.is_hidden
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={field.is_hidden ? 'Show field' : 'Hide field'}
                        >
                          {field.is_hidden ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                        </button>

                        <button
                          onClick={() => handleEditField(field)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                          title="Edit field"
                        >
                          <Icons.Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteField(field)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                          title="Delete field"
                        >
                          <Icons.Delete size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminCustomFieldManager;