import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useCompanies, useTicketTypes, useDropdownLists } from '../../hooks/useAPI';
import { useToast } from '../shared/Toast';
import { previewTicketNumber } from '../../utils/ticketNumber';
import { ticketAPI } from '../../api/googleSheet';
import { processTicketWorkflow } from '../../utils/approvalRouter';
import Icons from '../shared/Icons';

const TicketForm = ({ ticket = null, onSave, onCancel }) => {
  const { user, hasPermission } = useUser();
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { data: dropdownLists } = useDropdownLists();
  const { ToastContainer, success, error: showError } = useToast();

  const isEditing = !!ticket;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_id: '',
    ticket_type_id: '',
    priority: 'medium',
    assignee_email: '',
    due_date: '',
    custom_fields: {}
  });

  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [ticketNumberPreview, setTicketNumberPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data
  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        company_id: ticket.company_id || '',
        ticket_type_id: ticket.ticket_type_id || '',
        priority: ticket.priority || 'medium',
        assignee_email: ticket.assignee_email || '',
        due_date: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
        custom_fields: ticket.custom_fields || {}
      });
    }
  }, [ticket]);

  // Update selected company when company_id changes
  useEffect(() => {
    if (formData.company_id) {
      const company = companies?.find(c => c.id === formData.company_id);
      setSelectedCompany(company);
    } else {
      setSelectedCompany(null);
    }
  }, [formData.company_id, companies]);

  // Update selected ticket type when ticket_type_id changes
  useEffect(() => {
    if (formData.ticket_type_id) {
      const ticketType = ticketTypes?.find(t => t.id === formData.ticket_type_id);
      setSelectedTicketType(ticketType);
    } else {
      setSelectedTicketType(null);
    }
  }, [formData.ticket_type_id, ticketTypes]);

  // Update ticket number preview when company or ticket type changes
  useEffect(() => {
    if (selectedCompany && selectedTicketType && !isEditing) {
      // For new tickets, show preview
      const preview = previewTicketNumber(selectedCompany, selectedTicketType);
      setTicketNumberPreview(preview);

      // Optionally fetch actual next ticket number from backend
      if (process.env.REACT_APP_USE_MOCK_DATA !== 'true') {
        ticketAPI.getNextTicketNumber(selectedCompany.id, selectedTicketType.id)
          .then(nextNumber => {
            setTicketNumberPreview(nextNumber);
          })
          .catch(error => {
            console.warn('Failed to get next ticket number:', error);
          });
      }
    } else {
      setTicketNumberPreview('');
    }
  }, [selectedCompany, selectedTicketType, isEditing]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.company_id) {
      newErrors.company_id = 'Company is required';
    }

    if (!formData.ticket_type_id) {
      newErrors.ticket_type_id = 'Ticket type is required';
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }

    // Validate custom fields
    selectedTicketType?.custom_fields?.forEach(field => {
      if (field.required && !formData.custom_fields[field.id]) {
        newErrors[`custom_${field.id}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const ticketData = {
        ...formData,
        creator_email: user?.email,
        status: isEditing ? ticket.status : 'open',
        created_date: isEditing ? ticket.created_date : new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For new tickets, trigger initial workflow setup
      if (!isEditing) {
        try {
          // The actual implementation would pass the new ticket ID
          // For now, we'll simulate it
          const newTicketId = 'new-ticket-id';
          await processTicketWorkflow(ticketAPI, newTicketId);
          console.log('Initial workflow setup completed for new ticket');
        } catch (workflowError) {
          console.error('Workflow setup failed:', workflowError);
          // Don't fail the ticket creation, just log the error
        }
      }

      success(isEditing ? 'Ticket updated successfully!' : 'Ticket created successfully!');
      onSave?.(ticketData);
    } catch (error) {
      console.error('Ticket operation failed:', error);
      showError('Failed to save ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldId]: value
      }
    }));

    // Clear error when user starts typing
    const errorKey = `custom_${fieldId}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields[field.id] || '';
    const errorKey = `custom_${field.id}`;
    const hasError = !!errors[errorKey];

    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? 'border-red-300' : 'border-gray-300'
    }`;

    const renderLabel = () => (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );

    const renderError = () => hasError && (
      <p className="text-sm text-red-600 mt-1">{errors[errorKey]}</p>
    );

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id}>
            {renderLabel()}
            <input
              type="text"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={baseClasses}
              disabled={isSubmitting}
            />
            {renderError()}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id}>
            {renderLabel()}
            <textarea
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={baseClasses}
              disabled={isSubmitting}
            />
            {renderError()}
          </div>
        );

      case 'select':
        const dropdownList = dropdownLists?.find(dl => dl.id === field.dropdown_list_id);
        return (
          <div key={field.id}>
            {renderLabel()}
            <select
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              className={baseClasses}
              disabled={isSubmitting}
            >
              <option value="">Select {field.label}</option>
              {dropdownList?.options?.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderError()}
          </div>
        );

      case 'date':
        return (
          <div key={field.id}>
            {renderLabel()}
            <input
              type="date"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              className={baseClasses}
              disabled={isSubmitting}
            />
            {renderError()}
          </div>
        );

      case 'number':
        return (
          <div key={field.id}>
            {renderLabel()}
            <input
              type="number"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.min_value}
              max={field.max_value}
              className={baseClasses}
              disabled={isSubmitting}
            />
            {renderError()}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-start space-x-2">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
              className="mt-1 rounded border-gray-300 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <div>
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
              {renderError()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <ToastContainer />

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.Close size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ticket Number Preview */}
          {!isEditing && ticketNumberPreview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icons.Ticket size={20} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Ticket Number Preview</h3>
                  <p className="text-lg font-mono text-blue-700 mt-1">{ticketNumberPreview}</p>
                  <p className="text-xs text-blue-600 mt-1">This number will be assigned when the ticket is created</p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Ticket Number Display */}
          {isEditing && ticket?.ticket_number && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icons.Ticket size={20} className="text-gray-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Ticket Number</h3>
                  <p className="text-lg font-mono text-gray-900 mt-1">{ticket.ticket_number}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter ticket title"
                disabled={isSubmitting}
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the issue or request"
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => handleInputChange('company_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.company_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select Company</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && <p className="text-sm text-red-600 mt-1">{errors.company_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ticket_type_id}
                onChange={(e) => handleInputChange('ticket_type_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ticket_type_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select Ticket Type</option>
                {ticketTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.ticket_type_id && <p className="text-sm text-red-600 mt-1">{errors.ticket_type_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <input
                type="email"
                value={formData.assignee_email}
                onChange={(e) => handleInputChange('assignee_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter assignee email"
                disabled={isSubmitting || !hasPermission('canApproveTickets')}
              />
              {!hasPermission('canApproveTickets') && (
                <p className="text-sm text-gray-500 mt-1">Admin will assign this ticket</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.due_date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.due_date && <p className="text-sm text-red-600 mt-1">{errors.due_date}</p>}
            </div>
          </div>

          {/* Custom Fields */}
          {selectedTicketType?.custom_fields?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTicketType.custom_fields.map(renderCustomField)}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting && <Icons.Loading size={16} className="animate-spin" />}
              <span>{isEditing ? 'Update Ticket' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default TicketForm;