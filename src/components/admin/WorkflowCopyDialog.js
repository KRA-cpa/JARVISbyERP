import React, { useState, useEffect } from 'react';
import { useCompanies, useTicketTypes } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import Icons from '../shared/Icons';

/**
 * WorkflowCopyDialog Component
 *
 * Copies one company's workflow for a ticket type to another company (spec 3.0.1: copy-based setup).
 * AppScript v9.1 copyWorkflowSteps copies the steps with their approver roles, SLAs and conditions in one
 * call, and refuses when the target company already has steps for the ticket type - it never overwrites.
 *
 * Props:
 * - isOpen / onClose
 * - onSuccess(message, result): called after a copy, with the counts the backend reports
 * - initialTicketTypeId / initialTargetCompanyId: preset from the workflow builder's selection
 */
const WorkflowCopyDialog = ({ isOpen, onClose, onSuccess, initialTicketTypeId = '', initialTargetCompanyId = '' }) => {
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();

  const [formData, setFormData] = useState({
    ticketTypeId: initialTicketTypeId,
    sourceCompanyId: '',
    targetCompanyId: initialTargetCompanyId
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Take the builder's current selection each time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ ticketTypeId: initialTicketTypeId, sourceCompanyId: '', targetCompanyId: initialTargetCompanyId });
      setFormError('');
    }
  }, [isOpen, initialTicketTypeId, initialTargetCompanyId]);

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

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await API.WorkflowSteps.copyFromCompany(
        formData.ticketTypeId,
        formData.sourceCompanyId,
        formData.targetCompanyId
      );

      const sourceCompany = companies?.find(c => String(c.id) === String(formData.sourceCompanyId));
      const targetCompany = companies?.find(c => String(c.id) === String(formData.targetCompanyId));
      const ticketType = ticketTypes?.find(tt => String(tt.id) === String(formData.ticketTypeId));

      const message =
        `Copied ${result?.copied_steps ?? 0} step(s), ${result?.approvers ?? 0} approver role(s), ` +
        `${result?.slas ?? 0} SLA(s) and ${result?.conditions ?? 0} condition(s) for "${ticketType?.name}" ` +
        `from ${sourceCompany?.name} to ${targetCompany?.name}`;

      onSuccess?.(message, result);
      onClose();
    } catch (err) {
      console.error('Workflow copy failed:', err);
      setFormError(err.message || 'Failed to copy workflow configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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
                      Steps, approver roles, SLAs and conditions are copied together
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

                {/* Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Icons.Warning size={16} className="text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        The target company must not have workflow steps for this ticket type yet - nothing is
                        overwritten. After copying, the target company owns its copy and can edit it independently.
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
