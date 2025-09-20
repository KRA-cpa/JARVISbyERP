import React, { useState, useEffect } from 'react';
import Icons from '../shared/Icons';
import { useToast } from '../shared/Toast';
import { useTicketTypes, useCompanies } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';

/**
 * AdminTicketTypeManager Component
 *
 * Manages ticket type configurations including:
 * - CRUD operations for ticket types
 * - Transaction ID and code configuration
 * - Attachment requirements
 * - Comment requirements for actions
 * - Company-specific vs global ticket types
 */
const AdminTicketTypeManager = () => {
  const { success, error, warning, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTicketType, setDeletingTicketType] = useState(null);

  // API data
  const { data: ticketTypes, loading: ticketTypesLoading, error: ticketTypesError, refetch: refetchTicketTypes } = useTicketTypes();
  const { data: companies, loading: companiesLoading } = useCompanies();

  // Form state
  const [formData, setFormData] = useState({
    transaction_id: '',
    code: '',
    name: '',
    description: '',
    is_active: true,
    require_attachment_on_create: false,
    company_id: 'global'
  });

  // Comment requirements state
  const [commentRequirements, setCommentRequirements] = useState({
    require_on_approve: false,
    require_on_return: false,
    require_on_reject: false,
    require_on_cancel: false
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form
  const resetForm = () => {
    setFormData({
      transaction_id: '',
      code: '',
      name: '',
      description: '',
      is_active: true,
      require_attachment_on_create: false,
      company_id: 'global'
    });
    setCommentRequirements({
      require_on_approve: false,
      require_on_return: false,
      require_on_reject: false,
      require_on_cancel: false
    });
    setFormErrors({});
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.transaction_id.trim()) {
      errors.transaction_id = 'Transaction ID is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    // Check uniqueness for transaction_id and code
    if (ticketTypes) {
      const existingTransactionId = ticketTypes.find(tt =>
        tt.transaction_id === formData.transaction_id &&
        (!editingTicketType || tt.id !== editingTicketType.id)
      );
      if (existingTransactionId) {
        errors.transaction_id = 'Transaction ID already exists';
      }

      const existingCode = ticketTypes.find(tt =>
        tt.code === formData.code &&
        (!editingTicketType || tt.id !== editingTicketType.id)
      );
      if (existingCode) {
        errors.code = 'Code already exists';
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
      const ticketTypeData = {
        ...formData,
        company_id: formData.company_id === 'global' ? null : formData.company_id
      };

      if (editingTicketType) {
        await API.TicketTypes.update(editingTicketType.id, ticketTypeData);
        success('Ticket type updated successfully');
        setShowEditForm(false);
        setEditingTicketType(null);
      } else {
        await API.TicketTypes.create(ticketTypeData);
        success('Ticket type created successfully');
        setShowCreateForm(false);
      }

      resetForm();
      refetchTicketTypes();
    } catch (err) {
      error(err.message || 'Failed to save ticket type');
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreateTicketType = () => {
    resetForm();
    setShowCreateForm(true);
  };

  // Handle edit
  const handleEditTicketType = (ticketType) => {
    setFormData({
      transaction_id: ticketType.transaction_id,
      code: ticketType.code,
      name: ticketType.name,
      description: ticketType.description || '',
      is_active: ticketType.is_active,
      require_attachment_on_create: ticketType.require_attachment_on_create || false,
      company_id: ticketType.company_id || 'global'
    });
    setEditingTicketType(ticketType);
    setShowEditForm(true);
  };

  // Handle delete
  const handleDeleteTicketType = (ticketType) => {
    setDeletingTicketType(ticketType);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingTicketType) return;

    setLoading(true);
    try {
      await API.TicketTypes.delete(deletingTicketType.id);
      success('Ticket type deleted successfully');
      refetchTicketTypes();
      setShowDeleteConfirm(false);
      setDeletingTicketType(null);
    } catch (err) {
      error('Failed to delete ticket type: ' + err.message);
    }
    setLoading(false);
  };

  // Handle toggle active
  const handleToggleActive = async (ticketType) => {
    setLoading(true);

    try {
      await API.TicketTypes.update(ticketType.id, {
        ...ticketType,
        is_active: !ticketType.is_active
      });
      success(`Ticket type ${!ticketType.is_active ? 'activated' : 'deactivated'} successfully`);
      refetchTicketTypes();
    } catch (err) {
      error(err.message || 'Failed to update ticket type status');
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

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCommentRequirementChange = (e) => {
    const { name, checked } = e.target;
    setCommentRequirements(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Loading state
  if (ticketTypesLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading ticket types...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (ticketTypesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <Icons.Error size={20} className="text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Ticket Types</h3>
            <p className="mt-1 text-sm text-red-700">{ticketTypesError}</p>
          </div>
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
          <h2 className="text-2xl font-bold text-gray-900">Ticket Type Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure ticket types, transaction IDs, and workflow requirements
          </p>
        </div>
        <button
          onClick={handleCreateTicketType}
          disabled={loading}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Icons.Plus size={16} className="mr-2" />
          Add Ticket Type
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
                        {editingTicketType ? 'Edit Ticket Type' : 'Create New Ticket Type'}
                      </h3>

                      <div className="space-y-4">
                        {/* Transaction ID */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Transaction ID *
                          </label>
                          <input
                            type="text"
                            name="transaction_id"
                            value={formData.transaction_id}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.transaction_id ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., TT001"
                          />
                          {formErrors.transaction_id && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.transaction_id}</p>
                          )}
                        </div>

                        {/* Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Code *
                          </label>
                          <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.code ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., PR, LEAVE"
                            style={{ textTransform: 'uppercase' }}
                          />
                          {formErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              formErrors.name ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., Purchase Request"
                          />
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief description of this ticket type"
                          />
                        </div>

                        {/* Company */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Company
                          </label>
                          <select
                            name="company_id"
                            value={formData.company_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="global">Global (All Companies)</option>
                            {companies?.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name} ({company.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="is_active"
                              checked={formData.is_active}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Active
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="require_attachment_on_create"
                              checked={formData.require_attachment_on_create}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Require attachment on creation
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
                      editingTicketType ? 'Update' : 'Create'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setShowEditForm(false);
                      setEditingTicketType(null);
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
      {showDeleteConfirm && deletingTicketType && (
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
                      Delete Ticket Type
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{deletingTicketType.name}"? This action cannot be undone.
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
                    setDeletingTicketType(null);
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

      {/* Ticket Types List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Ticket Types ({ticketTypes?.length || 0})
          </h3>
        </div>

        {ticketTypes && ticketTypes.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {ticketTypes.map((ticketType) => (
              <div key={ticketType.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticketType.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticketType.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {ticketType.code}
                      </span>
                      {!ticketType.company_id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Global
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 text-lg font-medium text-gray-900">
                      {ticketType.name}
                    </h4>
                    {ticketType.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {ticketType.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Transaction ID: {ticketType.transaction_id}</span>
                      <span>•</span>
                      <span>
                        Attachments: {ticketType.require_attachment_on_create ? 'Required' : 'Optional'}
                      </span>
                      {ticketType.company_id && companies && (
                        <>
                          <span>•</span>
                          <span>
                            Company: {companies.find(c => c.id === ticketType.company_id)?.name || 'Unknown'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(ticketType)}
                      disabled={loading}
                      className={`p-2 rounded-full ${
                        ticketType.is_active
                          ? 'text-green-600 hover:bg-green-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      } disabled:opacity-50`}
                      title={ticketType.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ticketType.is_active ? <Icons.Success size={16} /> : <Icons.Clock size={16} />}
                    </button>

                    <button
                      onClick={() => handleEditTicketType(ticketType)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                      title="Edit ticket type"
                    >
                      <Icons.Edit size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteTicketType(ticketType)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                      title="Delete ticket type"
                    >
                      <Icons.Delete size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Icons.Ticket size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Types</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first ticket type.</p>
            <button
              onClick={handleCreateTicketType}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Icons.Create size={16} className="mr-2" />
              Add Ticket Type
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminTicketTypeManager;