import React, { useState } from 'react';
import { useCompanies, useTicketTypes } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

/**
 * BulkWorkflowDialog Component
 *
 * Provides bulk operations for workflow management across multiple companies:
 * - Bulk assign/copy workflows across companies
 * - Multi-target company selection
 * - Progress tracking for bulk operations
 */
const BulkWorkflowDialog = ({ isOpen, onClose, onSuccess }) => {
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { success, error: showError } = useToast();

  const [operationType, setOperationType] = useState('assign'); // 'assign' or 'copy'
  const [formData, setFormData] = useState({
    ticketTypeIds: [],
    sourceCompanyId: '',
    targetCompanyIds: [],
    copyWorkflows: true,
    copySLAs: true,
    copyApprovers: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });

  const validateForm = () => {
    if (formData.ticketTypeIds.length === 0) {
      setFormError('Please select at least one ticket type');
      return false;
    }

    if (operationType === 'copy' && !formData.sourceCompanyId) {
      setFormError('Please select a source company for copying');
      return false;
    }

    if (formData.targetCompanyIds.length === 0) {
      setFormError('Please select at least one target company');
      return false;
    }

    if (operationType === 'copy' && formData.targetCompanyIds.includes(formData.sourceCompanyId)) {
      setFormError('Source company cannot be included in target companies');
      return false;
    }

    if (!formData.copyWorkflows && !formData.copySLAs && !formData.copyApprovers) {
      setFormError('Please select at least one item to process');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    const totalOperations = formData.ticketTypeIds.length * formData.targetCompanyIds.length;
    setProgress({ current: 0, total: totalOperations, status: 'Starting bulk operation...' });

    try {
      let completedOperations = 0;
      const results = [];

      for (const ticketTypeId of formData.ticketTypeIds) {
        const ticketType = ticketTypes?.find(tt => tt.id === ticketTypeId);

        for (const targetCompanyId of formData.targetCompanyIds) {
          const targetCompany = companies?.find(c => c.id === targetCompanyId);

          setProgress({
            current: completedOperations,
            total: totalOperations,
            status: `Processing ${ticketType?.name} for ${targetCompany?.name}...`
          });

          try {
            if (operationType === 'copy') {
              // Copy workflows from source company
              if (formData.copyWorkflows) {
                await API.WorkflowSteps.copyFromCompany(
                  ticketTypeId,
                  formData.sourceCompanyId,
                  targetCompanyId
                );
              }

              // TODO: Implement SLA and approver copying when API is extended
              if (formData.copySLAs) {
                // await API.SLAs.copyFromCompany(ticketTypeId, formData.sourceCompanyId, targetCompanyId);
              }

              if (formData.copyApprovers) {
                // await API.Approvers.copyFromCompany(ticketTypeId, formData.sourceCompanyId, targetCompanyId);
              }
            } else {
              // Bulk assign operation - create default workflows for company
              await API.WorkflowSteps.createDefaultForCompany(ticketTypeId, targetCompanyId);
            }

            results.push({
              ticketType: ticketType?.name,
              company: targetCompany?.name,
              success: true
            });
          } catch (error) {
            console.error(`Failed to process ${ticketType?.name} for ${targetCompany?.name}:`, error);
            results.push({
              ticketType: ticketType?.name,
              company: targetCompany?.name,
              success: false,
              error: error.message
            });
          }

          completedOperations++;
          setProgress({
            current: completedOperations,
            total: totalOperations,
            status: `Completed ${completedOperations} of ${totalOperations} operations`
          });
        }
      }

      // Show summary results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (failureCount === 0) {
        const sourceCompany = companies?.find(c => c.id === formData.sourceCompanyId);
        const operationText = operationType === 'copy'
          ? `copied from ${sourceCompany?.name}`
          : 'assigned';

        success(
          `Successfully ${operationText} workflows for ${successCount} ticket type/company combinations`
        );
      } else {
        showError(
          `Bulk operation completed: ${successCount} succeeded, ${failureCount} failed. Check console for details.`
        );
      }

      // Reset form
      setFormData({
        ticketTypeIds: [],
        sourceCompanyId: '',
        targetCompanyIds: [],
        copyWorkflows: true,
        copySLAs: true,
        copyApprovers: true
      });
      setOperationType('assign');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Bulk workflow operation failed:', err);
      setFormError(err.message || 'Failed to complete bulk operation');
      showError(err.message || 'Failed to complete bulk operation');
    } finally {
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const handleTicketTypeSelection = (ticketTypeId) => {
    setFormData(prev => ({
      ...prev,
      ticketTypeIds: prev.ticketTypeIds.includes(ticketTypeId)
        ? prev.ticketTypeIds.filter(id => id !== ticketTypeId)
        : [...prev.ticketTypeIds, ticketTypeId]
    }));
  };

  const handleCompanySelection = (companyId, isTarget = true) => {
    const field = isTarget ? 'targetCompanyIds' : 'sourceCompanyId';

    if (isTarget) {
      setFormData(prev => ({
        ...prev,
        targetCompanyIds: prev.targetCompanyIds.includes(companyId)
          ? prev.targetCompanyIds.filter(id => id !== companyId)
          : [...prev.targetCompanyIds, companyId]
      }));
    } else {
      setFormData(prev => ({ ...prev, sourceCompanyId: companyId }));
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Icons.Settings size={20} className="text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Bulk Workflow Operations
                    </h3>
                    <p className="text-sm text-gray-500">
                      Assign or copy workflows across multiple companies and ticket types
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

              {/* Progress indicator */}
              {isSubmitting && progress.total > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <div className="flex-1">
                      <div className="text-sm text-blue-700 mb-1">{progress.status}</div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {progress.current} of {progress.total} completed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Operation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operation Type *
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="assign"
                          name="operationType"
                          value="assign"
                          checked={operationType === 'assign'}
                          onChange={(e) => setOperationType(e.target.value)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="assign" className="ml-2 block text-sm text-gray-900">
                          Bulk Assign - Create default workflows for selected companies
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="copy"
                          name="operationType"
                          value="copy"
                          checked={operationType === 'copy'}
                          onChange={(e) => setOperationType(e.target.value)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="copy" className="ml-2 block text-sm text-gray-900">
                          Bulk Copy - Copy workflows from source to target companies
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Types Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Types * ({formData.ticketTypeIds.length} selected)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                      {ticketTypes?.map((ticketType) => (
                        <div key={ticketType.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`ticket-${ticketType.id}`}
                            checked={formData.ticketTypeIds.includes(ticketType.id)}
                            onChange={() => handleTicketTypeSelection(ticketType.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            disabled={isSubmitting}
                          />
                          <label htmlFor={`ticket-${ticketType.id}`} className="ml-2 block text-sm text-gray-900">
                            {ticketType.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source Company (only for copy operation) */}
                  {operationType === 'copy' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source Company *
                      </label>
                      <select
                        name="sourceCompanyId"
                        value={formData.sourceCompanyId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Target Companies Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Companies * ({formData.targetCompanyIds.length} selected)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                      {companies?.map((company) => (
                        <div key={company.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`company-${company.id}`}
                            checked={formData.targetCompanyIds.includes(company.id)}
                            onChange={() => handleCompanySelection(company.id, true)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            disabled={isSubmitting || (operationType === 'copy' && company.id === formData.sourceCompanyId)}
                          />
                          <label htmlFor={`company-${company.id}`} className="ml-2 block text-sm text-gray-900">
                            {company.name} ({company.code})
                            {operationType === 'copy' && company.id === formData.sourceCompanyId && (
                              <span className="text-gray-400"> - Source</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items to Process */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items to Process
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="copyWorkflows"
                          checked={formData.copyWorkflows}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Approver Assignments
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning note */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icons.Warning size={16} className="text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> This bulk operation will affect multiple companies and ticket types.
                      {operationType === 'copy'
                        ? ' Existing workflow configurations in target companies will be overwritten.'
                        : ' Default workflows will be created for companies that don\'t have configurations yet.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.Settings size={16} className="mr-2" />
                    {operationType === 'copy' ? 'Copy to Companies' : 'Assign to Companies'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default BulkWorkflowDialog;