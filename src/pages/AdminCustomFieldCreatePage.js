import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import { useToast } from '../components/shared/Toast';
import { useTicketTypes, useDropdownLists, useCustomFields } from '../hooks/useAPI';
import { API } from '../api/googleSheet';

/**
 * AdminCustomFieldCreatePage Component
 *
 * Dedicated page for creating new custom fields with:
 * - Full-page form layout with enhanced field type selection
 * - Support for all field types including new date range
 * - Conditional field logic and dependencies
 * - Better validation and error handling
 */
const AdminCustomFieldCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { success, error: showError, warning, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);

  // Get pre-selected ticket type from URL params
  const preSelectedTicketType = searchParams.get('ticketType');

  // API data
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { data: dropdownLists, loading: dropdownListsLoading } = useDropdownLists();
  const { data: customFields, refetch: refetchCustomFields } = useCustomFields();

  // Form state
  const [formData, setFormData] = useState({
    ticket_type_id: preSelectedTicketType || '',
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
  const [draftSaved, setDraftSaved] = useState(false);

  // Field type options with new date range support
  const fieldTypes = [
    { value: 'text', label: 'Single Line Text', icon: Icons.Edit, description: 'Short text input field' },
    { value: 'paragraph', label: 'Multi-line Text', icon: Icons.Document, description: 'Large text area for detailed input' },
    { value: 'date', label: 'Date Picker', icon: Icons.Calendar, description: 'Single date selection' },
    { value: 'daterange', label: 'Date Range', icon: Icons.DateRange, description: 'Start and end date selection' },
    { value: 'amount', label: 'Currency Amount', icon: Icons.Currency, description: 'Monetary value with currency formatting' },
    { value: 'dropdown', label: 'Dropdown List', icon: Icons.List, description: 'Single selection from predefined options' },
    { value: 'file', label: 'File Upload', icon: Icons.Attachment, description: 'File attachment capability' }
  ];

  // Calculate next sort order
  useEffect(() => {
    if (formData.ticket_type_id && customFields) {
      const fieldsForType = customFields.filter(f => f.ticket_type_id === formData.ticket_type_id);
      const maxSortOrder = fieldsForType.length > 0 ? Math.max(...fieldsForType.map(f => f.sort_order)) : 0;
      setFormData(prev => ({ ...prev, sort_order: maxSortOrder + 1 }));
    }
  }, [formData.ticket_type_id, customFields]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.ticket_type_id) {
      errors.ticket_type_id = 'Please select a ticket type';
    }

    if (!formData.name.trim()) {
      errors.name = 'Field name is required';
    } else if (!/^[a-z_][a-z0-9_]*$/i.test(formData.name)) {
      errors.name = 'Field name must start with a letter and contain only letters, numbers, and underscores';
    }

    if (!formData.label.trim()) {
      errors.label = 'Field label is required';
    }

    if (formData.type === 'dropdown' && !formData.dropdown_list_id) {
      errors.dropdown_list_id = 'Please select a dropdown list';
    }

    // Check for duplicate field names within the ticket type
    if (formData.ticket_type_id && customFields) {
      const duplicateField = customFields.find(f =>
        f.ticket_type_id === formData.ticket_type_id &&
        f.name.toLowerCase() === formData.name.toLowerCase().trim()
      );
      if (duplicateField) {
        errors.name = 'A field with this name already exists for this ticket type';
      }
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
        name: formData.name.trim(),
        label: formData.label.trim(),
        dropdown_list_id: formData.dropdown_list_id || null,
        depends_on_field_id: formData.depends_on_field_id || null
      };

      await API.CustomFields.create(fieldData);
      success('Custom field created successfully');
      refetchCustomFields();
      navigate(`/admin?tab=custom-fields&ticketType=${formData.ticket_type_id}`);
    } catch (err) {
      showError(err.message || 'Failed to create custom field');
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

    // Clear depends_on_field_id if changing ticket type
    if (name === 'ticket_type_id') {
      setFormData(prev => ({ ...prev, depends_on_field_id: '' }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Mark draft as modified
    setDraftSaved(false);
  };

  // Get available dependency fields
  const getAvailableDependencyFields = () => {
    if (!formData.ticket_type_id || !customFields) return [];

    return customFields.filter(field =>
      field.ticket_type_id === formData.ticket_type_id &&
      field.sort_order < formData.sort_order &&
      !field.is_hidden
    );
  };

  // Get selected field type details
  const selectedFieldType = fieldTypes.find(type => type.value === formData.type);

  // Auto-save draft functionality
  const saveDraft = () => {
    localStorage.setItem('customFieldDraft', JSON.stringify(formData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('customFieldDraft');
    if (savedDraft && !preSelectedTicketType) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, [preSelectedTicketType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <ToastContainer />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <Icons.Home size={14} className="mr-2" />
                  Admin
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <Icons.ChevronRight size={14} className="text-gray-400" />
                  <button
                    onClick={() => navigate('/admin?tab=custom-fields')}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                  >
                    Custom Fields
                  </button>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <Icons.ChevronRight size={14} className="text-gray-400" />
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Create New Field</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Custom Field</h1>
            <p className="mt-2 text-sm text-gray-600">
              Add a dynamic form field to enhance ticket data collection with conditional logic and validation.
            </p>
            {draftSaved && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <Icons.CheckCircle size={16} className="mr-1" />
                Draft saved automatically
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Form - 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-6">
                    <div className="space-y-6">
                      {/* Ticket Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Ticket Type *
                        </label>
                        <select
                          name="ticket_type_id"
                          value={formData.ticket_type_id}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.ticket_type_id ? 'border-red-300' : 'border-gray-300'
                          }`}
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

                      {/* Field Name and Label */}
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., purchase_amount"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Internal field identifier (letters, numbers, underscores only)
                          </p>
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Label *
                          </label>
                          <input
                            type="text"
                            name="label"
                            value={formData.label}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.label ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Purchase Amount"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            User-friendly label displayed in forms
                          </p>
                          {formErrors.label && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.label}</p>
                          )}
                        </div>
                      </div>

                      {/* Field Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Field Type *
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {fieldTypes.map((fieldType) => (
                            <div
                              key={fieldType.value}
                              className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                                formData.type === fieldType.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => setFormData(prev => ({ ...prev, type: fieldType.value }))}
                            >
                              <div className="flex items-start">
                                <fieldType.icon
                                  size={20}
                                  className={formData.type === fieldType.value ? 'text-blue-600' : 'text-gray-400'}
                                />
                                <div className="ml-3 flex-1">
                                  <h4 className={`text-sm font-medium ${
                                    formData.type === fieldType.value ? 'text-blue-900' : 'text-gray-900'
                                  }`}>
                                    {fieldType.label}
                                  </h4>
                                  <p className={`text-xs ${
                                    formData.type === fieldType.value ? 'text-blue-700' : 'text-gray-500'
                                  }`}>
                                    {fieldType.description}
                                  </p>
                                </div>
                                {formData.type === fieldType.value && (
                                  <Icons.CheckCircle size={16} className="text-blue-600" />
                                )}
                              </div>
                              <input
                                type="radio"
                                name="type"
                                value={fieldType.value}
                                checked={formData.type === fieldType.value}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dropdown List Selection (only for dropdown type) */}
                      {formData.type === 'dropdown' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Dropdown List *
                          </label>
                          <select
                            name="dropdown_list_id"
                            value={formData.dropdown_list_id}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.dropdown_list_id ? 'border-red-300' : 'border-gray-300'
                            }`}
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

                      {/* Conditional Logic */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Depends On Field (Optional)
                        </label>
                        <select
                          name="depends_on_field_id"
                          value={formData.depends_on_field_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">No dependency</option>
                          {getAvailableDependencyFields().map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label} ({field.name})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          This field will only be shown when the selected field has a value
                        </p>
                      </div>

                      {/* Field Configuration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Field Configuration</h3>

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

                  {/* Form Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate('/admin?tab=custom-fields')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Icons.ArrowLeft size={16} className="mr-2" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveDraft}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Icons.Save size={16} className="mr-2" />
                        Save Draft
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Icons.Plus size={16} className="mr-2" />
                          Create Field
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Field Type Preview */}
              {selectedFieldType && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Field Preview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <selectedFieldType.icon size={20} className="text-blue-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{selectedFieldType.label}</h4>
                        <p className="text-xs text-gray-500">{selectedFieldType.description}</p>
                      </div>
                    </div>

                    {/* Mock preview based on field type */}
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.label || 'Field Label'}
                        {formData.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {formData.type === 'text' && (
                        <input
                          type="text"
                          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                          placeholder="Text input preview"
                          disabled
                        />
                      )}
                      {formData.type === 'paragraph' && (
                        <textarea
                          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                          rows={3}
                          placeholder="Multi-line text preview"
                          disabled
                        />
                      )}
                      {formData.type === 'date' && (
                        <input
                          type="date"
                          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                          disabled
                        />
                      )}
                      {formData.type === 'daterange' && (
                        <div className="space-y-2">
                          <input
                            type="date"
                            className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                            placeholder="Start date"
                            disabled
                          />
                          <input
                            type="date"
                            className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                            placeholder="End date"
                            disabled
                          />
                        </div>
                      )}
                      {formData.type === 'amount' && (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₱</span>
                          </div>
                          <input
                            type="number"
                            className="block w-full pl-7 border-gray-300 rounded-md shadow-sm text-sm"
                            placeholder="0.00"
                            disabled
                          />
                        </div>
                      )}
                      {formData.type === 'dropdown' && (
                        <select className="block w-full border-gray-300 rounded-md shadow-sm text-sm" disabled>
                          <option>Select an option...</option>
                        </select>
                      )}
                      {formData.type === 'file' && (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                          <Icons.Attachment size={24} className="mx-auto text-gray-400" />
                          <p className="text-sm text-gray-500 mt-1">Click to upload file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Help Documentation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">
                  <Icons.Info size={20} className="inline mr-2" />
                  Field Type Guide
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-900">Text Fields</h4>
                    <p className="text-blue-700">Use for names, IDs, short descriptions</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Date Range (NEW)</h4>
                    <p className="text-blue-700">Perfect for project timelines, leave periods, event durations</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Dropdowns</h4>
                    <p className="text-blue-700">Use dropdown lists for consistent data entry</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Conditional Fields</h4>
                    <p className="text-blue-700">Set field dependencies to create dynamic forms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomFieldCreatePage;