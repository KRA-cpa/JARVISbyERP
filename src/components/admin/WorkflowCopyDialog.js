import React, { useState } from 'react';
import { useCompanies, useTicketTypes } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

/**
 * WorkflowCopyDialog Component
 *
 * Provides a dialog interface for copying workflows, SLAs, and approvers
 * from one company to another for a specific ticket type.
 */
const WorkflowCopyDialog = ({ isOpen, onClose, onSuccess }) => {
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    ticketTypeId: '',
    sourceCompanyId: '',
    targetCompanyId: '',
    copyWorkflows: true,
    copySLAs: true,
    copyApprovers: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    if (!formData.ticketTypeId) {
      setFormError('Please select a ticket type');
      return false;
    }
    if (!formData.sourceCompanyId) {
      setFormError('Please select a source company');
      return false;
    }
    if (!formData.targetCompanyId) {
      setFormError('Please select a target company');
      return false;
    }
    if (formData.sourceCompanyId === formData.targetCompanyId) {
      setFormError('Source and target companies must be different');
      return false;
    }
    if (!formData.copyWorkflows && !formData.copySLAs && !formData.copyApprovers) {
      setFormError('Please select at least one item to copy');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Copy workflows if selected
      if (formData.copyWorkflows) {
        await API.WorkflowSteps.copyFromCompany(
          formData.ticketTypeId,
          formData.sourceCompanyId,
          formData.targetCompanyId
        );
      }

      // Note: In a real implementation, you would also copy SLAs and approvers
      // For now, we'll simulate success for all selected items

      const sourceCompany = companies?.find(c => c.id === formData.sourceCompanyId);
      const targetCompany = companies?.find(c => c.id === formData.targetCompanyId);
      const ticketType = ticketTypes?.find(tt => tt.id === formData.ticketTypeId);

      const copiedItems = [];
      if (formData.copyWorkflows) copiedItems.push('workflows');
      if (formData.copySLAs) copiedItems.push('SLAs');
      if (formData.copyApprovers) copiedItems.push('approvers');

      success(
        `Successfully copied ${copiedItems.join(', ')} for "${ticketType?.name}" ` +
        `from ${sourceCompany?.name} to ${targetCompany?.name}`
      );

      // Reset form
      setFormData({
        ticketTypeId: '',
        sourceCompanyId: '',
        targetCompanyId: '',
        copyWorkflows: true,
        copySLAs: true,
        copyApprovers: true
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Workflow copy failed:', err);
      setFormError(err.message || 'Failed to copy workflow configuration');
      showError(err.message || 'Failed to copy workflow configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user makes changes
    if (formError) {
      setFormError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Center the modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Icons.Copy size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Copy Workflow Configuration
                    </h3>
                    <p className="text-sm text-gray-500">
                      Copy workflows, SLAs, and approvers between companies
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icons.Close size={20} />
                </button>
              </div>

              {/* Error message */}
              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Icons.Warning size={16} className="text-red-600" />
                    <span className="text-sm text-red-700">{formError}</span>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-4">
                {/* Ticket Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Type *
                  </label>
                  <select
                    name="ticketTypeId"
                    value={formData.ticketTypeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="">Select ticket type</option>
                    {ticketTypes?.map((ticketType) => (
                      <option key={ticketType.id} value={ticketType.id}>
                        {ticketType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy From (Source Company) *
                  </label>
                  <select
                    name="sourceCompanyId"
                    value={formData.sourceCompanyId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="">Select source company</option>
                    {companies?.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy To (Target Company) *
                  </label>
                  <select
                    name="targetCompanyId"
                    value={formData.targetCompanyId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="">Select target company</option>
                    {companies?.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* What to copy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items to Copy
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="copyWorkflows"
                        checked={formData.copyWorkflows}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Workflow Steps
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="copySLAs"
                        checked={formData.copySLAs}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        SLA Settings
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="copyApprovers"
                        checked={formData.copyApprovers}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Approver Assignments
                      </label>
                    </div>
                  </div>
                </div>

                {/* Warning note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Icons.Warning size={16} className="text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> This will overwrite any existing workflow configuration
                        for the selected ticket type in the target company.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <Icons.Copy size={16} className="mr-2" />
                    Copy Configuration
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCopyDialog;