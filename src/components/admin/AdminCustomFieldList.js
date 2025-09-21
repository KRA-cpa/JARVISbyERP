import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icons from '../shared/Icons';
import { useToast } from '../shared/Toast';
import { useTicketTypes, useDropdownLists, useCustomFields } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';

/**
 * AdminCustomFieldList Component
 *
 * Simplified list view for custom fields with navigation to dedicated pages:
 * - Removed modal logic completely
 * - Navigation to create/edit pages
 * - Enhanced list view with field type indicators
 * - Ticket type selection interface
 */
const AdminCustomFieldList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: showError, warning, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingField, setDeletingField] = useState(null);

  // Get selected ticket type from URL params
  const selectedTicketType = searchParams.get('ticketType') || '';

  // API data
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { data: dropdownLists, loading: dropdownListsLoading } = useDropdownLists();
  const { data: customFields, loading: customFieldsLoading, refetch: refetchCustomFields } = useCustomFields();

  // Field type options
  const fieldTypes = [
    { value: 'text', label: 'Single Line Text', icon: Icons.Edit },
    { value: 'paragraph', label: 'Multi-line Text', icon: Icons.Document },
    { value: 'date', label: 'Date Picker', icon: Icons.Calendar },
    { value: 'daterange', label: 'Date Range', icon: Icons.DateRange },
    { value: 'amount', label: 'Currency Amount', icon: Icons.Currency },
    { value: 'dropdown', label: 'Dropdown List', icon: Icons.List },
    { value: 'file', label: 'File Upload', icon: Icons.Attachment }
  ];

  // Handle ticket type selection
  const handleTicketTypeSelect = (ticketTypeId) => {
    if (ticketTypeId) {
      setSearchParams({ ticketType: ticketTypeId });
    } else {
      setSearchParams({});
    }
  };

  // Handle create navigation
  const handleCreateCustomField = () => {
    const params = selectedTicketType ? `?ticketType=${selectedTicketType}` : '';
    navigate(`/admin/custom-fields/create${params}`);
  };

  // Handle edit navigation
  const handleEditCustomField = (field) => {
    navigate(`/admin/custom-fields/${field.id}/edit`);
  };

  // Handle delete
  const handleDeleteCustomField = (field) => {
    setDeletingField(field);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingField) return;

    setLoading(true);
    try {
      await API.CustomFields.delete(deletingField.id);
      success('Custom field deleted successfully');
      refetchCustomFields();
      setShowDeleteConfirm(false);
      setDeletingField(null);
    } catch (err) {
      showError('Failed to delete custom field: ' + err.message);
    }
    setLoading(false);
  };

  // Handle field visibility toggle
  const handleToggleVisibility = async (field) => {
    setLoading(true);
    try {
      await API.CustomFields.update(field.id, {
        ...field,
        is_hidden: !field.is_hidden
      });
      success(`Field ${!field.is_hidden ? 'hidden' : 'shown'} successfully`);
      refetchCustomFields();
    } catch (err) {
      showError(err.message || 'Failed to update field visibility');
    } finally {
      setLoading(false);
    }
  };

  // Handle field reordering
  const handleMoveField = async (fieldId, direction) => {
    setLoading(true);
    try {
      const fieldsForType = filteredFields;
      const currentIndex = fieldsForType.findIndex(f => f.id === fieldId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= fieldsForType.length) return;

      // Update sort orders
      await API.CustomFields.update(fieldId, {
        sort_order: fieldsForType[newIndex].sort_order
      });

      await API.CustomFields.update(fieldsForType[newIndex].id, {
        sort_order: fieldsForType[currentIndex].sort_order
      });

      success('Field order updated successfully');
      refetchCustomFields();
    } catch (err) {
      showError(err.message || 'Failed to reorder field');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered fields for selected ticket type
  const filteredFields = customFields?.filter(field =>
    field.ticket_type_id === selectedTicketType
  ).sort((a, b) => a.sort_order - b.sort_order) || [];

  // Get field type details
  const getFieldType = (typeValue) => {
    return fieldTypes.find(type => type.value === typeValue);
  };

  // Get dropdown list name
  const getDropdownListName = (listId) => {
    const list = dropdownLists?.find(l => l.id === listId);
    return list ? list.name : 'Unknown List';
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
    <>
      <ToastContainer />
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
            onClick={handleCreateCustomField}
            disabled={!selectedTicketType}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedTicketType ? 'Please select a ticket type first' : 'Add custom field'}
          >
            <Icons.Plus size={16} className="mr-2" />
            Add Custom Field
          </button>
        </div>

        {/* Ticket Type Selection */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Ticket Type</h3>
            {ticketTypes && ticketTypes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ticketTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTicketTypeSelect(type.id)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedTicketType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icons.Ticket size={20} className={
                        selectedTicketType === type.id ? 'text-blue-600' : 'text-gray-400'
                      } />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{type.name}</h4>
                        <p className="text-sm text-gray-500">Code: {type.code}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Icons.Ticket size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Ticket Types</h4>
                <p className="text-gray-600">Create ticket types first before adding custom fields.</p>
              </div>
            )}
          </div>
        </div>

        {/* Field Type Guide */}
        {!selectedTicketType && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Available Field Types</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fieldTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2 text-sm">
                  <type.icon size={16} className="text-gray-500" />
                  <span className="text-gray-700">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields List */}
        {selectedTicketType && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Custom Fields ({filteredFields.length})
              </h3>
            </div>

            {filteredFields.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredFields.map((field, index) => {
                  const fieldType = getFieldType(field.type);
                  const canMoveUp = index > 0;
                  const canMoveDown = index < filteredFields.length - 1;

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

                          {field.type === 'dropdown' && field.dropdown_list_id && (
                            <p className="text-sm text-gray-500">
                              Dropdown List: {getDropdownListName(field.dropdown_list_id)}
                            </p>
                          )}
                          {field.depends_on_field_id && (
                            <p className="text-sm text-gray-500">
                              Depends on: {filteredFields.find(f => f.id === field.depends_on_field_id)?.label || 'Unknown Field'}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Reorder buttons */}
                          <button
                            onClick={() => handleMoveField(field.id, 'up')}
                            disabled={!canMoveUp || loading}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <Icons.ChevronUp size={16} />
                          </button>

                          <button
                            onClick={() => handleMoveField(field.id, 'down')}
                            disabled={!canMoveDown || loading}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <Icons.ChevronDown size={16} />
                          </button>

                          {/* Visibility toggle */}
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

                          {/* Edit button */}
                          <button
                            onClick={() => handleEditCustomField(field)}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                            title="Edit custom field"
                          >
                            <Icons.Edit size={16} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteCustomField(field)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                            title="Delete custom field"
                          >
                            <Icons.Delete size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Icons.Document size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Fields</h3>
                <p className="text-gray-600 mb-4">
                  Add custom fields to enhance this ticket type's form
                </p>
                <button
                  onClick={handleCreateCustomField}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Icons.Plus size={16} className="mr-2" />
                  Add First Field
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
                        Are you sure you want to delete "{deletingField.label}"? This action cannot be undone and will remove the field from all existing tickets.
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
    </>
  );
};

export default AdminCustomFieldList;