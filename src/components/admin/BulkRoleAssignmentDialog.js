import React, { useState } from 'react';
import { useCompanies, useTicketTypes, useRoles } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

/**
 * BulkRoleAssignmentDialog Component
 *
 * Handles bulk assignment of roles to users across multiple companies and ticket types:
 * - Multi-user selection with search/filter
 * - Multi-company and ticket type selection
 * - Role assignment with validity periods
 * - Bulk operations with progress tracking
 */
const BulkRoleAssignmentDialog = ({ isOpen, onClose, onSuccess }) => {
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { data: roles } = useRoles();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    userEmails: '',
    selectedCompanyIds: [],
    selectedTicketTypeIds: [],
    selectedRoleIds: [],
    validityEndDate: '',
    hasValidityEnd: false,
    assignmentMode: 'add', // 'add', 'replace', 'remove'
    notifyUsers: true,
    createAuditLog: true
  });

  const [userList, setUserList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [validationResults, setValidationResults] = useState(null);

  // Parse user emails and validate
  const parseUserEmails = (emailText) => {
    if (!emailText.trim()) return [];

    const emails = emailText
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const validEmails = [];
    const invalidEmails = [];

    emails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    return { validEmails, invalidEmails, total: emails.length };
  };

  const validateForm = () => {
    const emailValidation = parseUserEmails(formData.userEmails);

    if (emailValidation.validEmails.length === 0) {
      setFormError('Please enter at least one valid email address');
      return false;
    }

    if (emailValidation.invalidEmails.length > 0) {
      setFormError(`Invalid email addresses: ${emailValidation.invalidEmails.join(', ')}`);
      return false;
    }

    if (formData.selectedCompanyIds.length === 0) {
      setFormError('Please select at least one company');
      return false;
    }

    if (formData.selectedTicketTypeIds.length === 0) {
      setFormError('Please select at least one ticket type');
      return false;
    }

    if (formData.selectedRoleIds.length === 0) {
      setFormError('Please select at least one role');
      return false;
    }

    if (formData.hasValidityEnd && !formData.validityEndDate) {
      setFormError('Please select a validity end date');
      return false;
    }

    if (formData.hasValidityEnd && new Date(formData.validityEndDate) <= new Date()) {
      setFormError('Validity end date must be in the future');
      return false;
    }

    setFormError('');
    setValidationResults(emailValidation);
    return true;
  };

  const handleBulkAssignment = async () => {
    if (!validateForm()) return;

    const emailValidation = parseUserEmails(formData.userEmails);
    setIsProcessing(true);

    const totalOperations = emailValidation.validEmails.length *
                           formData.selectedCompanyIds.length *
                           formData.selectedTicketTypeIds.length *
                           formData.selectedRoleIds.length;

    setProgress({ current: 0, total: totalOperations, status: 'Starting bulk role assignment...' });

    try {
      let completedOperations = 0;
      const results = [];

      for (const userEmail of emailValidation.validEmails) {
        for (const companyId of formData.selectedCompanyIds) {
          for (const ticketTypeId of formData.selectedTicketTypeIds) {
            for (const roleId of formData.selectedRoleIds) {
              const company = companies?.find(c => c.id === companyId);
              const ticketType = ticketTypes?.find(tt => tt.id === ticketTypeId);
              const role = roles?.find(r => r.id === roleId);

              setProgress({
                current: completedOperations,
                total: totalOperations,
                status: `Assigning ${role?.name} role to ${userEmail} for ${ticketType?.name} at ${company?.name}...`
              });

              try {
                const assignmentData = {
                  user_email: userEmail,
                  company_id: companyId,
                  ticket_type_id: ticketTypeId,
                  role_id: roleId,
                  validity_end_date: formData.hasValidityEnd ? formData.validityEndDate : null,
                  assignment_mode: formData.assignmentMode,
                  notify_user: formData.notifyUsers,
                  create_audit_log: formData.createAuditLog
                };

                let response;
                switch (formData.assignmentMode) {
                  case 'add':
                    response = await API.Users.assignRole(assignmentData);
                    break;
                  case 'replace':
                    response = await API.Users.replaceUserRoles(assignmentData);
                    break;
                  case 'remove':
                    response = await API.Users.removeRole(assignmentData);
                    break;
                  default:
                    throw new Error('Invalid assignment mode');
                }

                results.push({
                  userEmail,
                  company: company?.name,
                  ticketType: ticketType?.name,
                  role: role?.name,
                  success: true,
                  data: response
                });
              } catch (error) {
                console.error(`Role assignment failed for ${userEmail}:`, error);
                results.push({
                  userEmail,
                  company: company?.name,
                  ticketType: ticketType?.name,
                  role: role?.name,
                  success: false,
                  error: error.message
                });
              }

              completedOperations++;
            }
          }
        }
      }

      // Show summary results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (failureCount === 0) {
        success(`Successfully completed ${successCount} role assignments`);
      } else {
        showError(`Bulk assignment completed: ${successCount} succeeded, ${failureCount} failed`);
      }

      // Reset form
      setFormData({
        userEmails: '',
        selectedCompanyIds: [],
        selectedTicketTypeIds: [],
        selectedRoleIds: [],
        validityEndDate: '',
        hasValidityEnd: false,
        assignmentMode: 'add',
        notifyUsers: true,
        createAuditLog: true
      });
      setValidationResults(null);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Bulk role assignment failed:', err);
      setFormError(err.message || 'Failed to complete bulk role assignment');
      showError(err.message || 'Failed to complete bulk role assignment');
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, status: '' });
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

    // Clear validation results when emails change
    if (name === 'userEmails') {
      setValidationResults(null);
    }
  };

  const handleMultiSelect = (items, selectedItems, itemId) => {
    return selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
  };

  const handleValidateEmails = () => {
    const emailValidation = parseUserEmails(formData.userEmails);
    setValidationResults(emailValidation);

    if (emailValidation.invalidEmails.length > 0) {
      setFormError(`Found ${emailValidation.invalidEmails.length} invalid email(s): ${emailValidation.invalidEmails.join(', ')}`);
    } else {
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={(e) => { e.preventDefault(); handleBulkAssignment(); }}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Icons.Users size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Bulk Role Assignment
                    </h3>
                    <p className="text-sm text-gray-500">
                      Assign roles to multiple users across companies and ticket types
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
              {isProcessing && progress.total > 0 && (
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
                        {progress.current} of {progress.total} assignments completed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - User Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email Addresses *
                    </label>
                    <textarea
                      name="userEmails"
                      value={formData.userEmails}
                      onChange={handleInputChange}
                      placeholder="Enter email addresses separated by commas, semicolons, or new lines..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={handleValidateEmails}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        disabled={isProcessing}
                      >
                        Validate Email Addresses
                      </button>
                      {validationResults && (
                        <span className="text-sm text-gray-600">
                          {validationResults.validEmails.length} valid, {validationResults.invalidEmails.length} invalid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignment Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Mode
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'add', label: 'Add Roles', description: 'Add roles to existing assignments' },
                        { value: 'replace', label: 'Replace Roles', description: 'Replace all existing roles' },
                        { value: 'remove', label: 'Remove Roles', description: 'Remove selected roles' }
                      ].map((mode) => (
                        <div key={mode.value} className="flex items-start">
                          <input
                            type="radio"
                            id={mode.value}
                            name="assignmentMode"
                            value={mode.value}
                            checked={formData.assignmentMode === mode.value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                            disabled={isProcessing}
                          />
                          <div className="ml-2">
                            <label htmlFor={mode.value} className="block text-sm font-medium text-gray-900">
                              {mode.label}
                            </label>
                            <p className="text-xs text-gray-600">{mode.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle column - Selection Options */}
                <div className="space-y-4">
                  {/* Companies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Companies * ({formData.selectedCompanyIds.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                      {companies?.map((company) => (
                        <div key={company.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`company-${company.id}`}
                            checked={formData.selectedCompanyIds.includes(company.id)}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              selectedCompanyIds: handleMultiSelect(companies, prev.selectedCompanyIds, company.id)
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isProcessing}
                          />
                          <label htmlFor={`company-${company.id}`} className="ml-2 block text-sm text-gray-900">
                            {company.name} ({company.code})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Types * ({formData.selectedTicketTypeIds.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                      {ticketTypes?.map((ticketType) => (
                        <div key={ticketType.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`ticket-${ticketType.id}`}
                            checked={formData.selectedTicketTypeIds.includes(ticketType.id)}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              selectedTicketTypeIds: handleMultiSelect(ticketTypes, prev.selectedTicketTypeIds, ticketType.id)
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isProcessing}
                          />
                          <label htmlFor={`ticket-${ticketType.id}`} className="ml-2 block text-sm text-gray-900">
                            {ticketType.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column - Roles and Options */}
                <div className="space-y-4">
                  {/* Roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Roles * ({formData.selectedRoleIds.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                      {roles?.map((role) => (
                        <div key={role.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`role-${role.id}`}
                            checked={formData.selectedRoleIds.includes(role.id)}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              selectedRoleIds: handleMultiSelect(roles, prev.selectedRoleIds, role.id)
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isProcessing}
                          />
                          <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                            {role.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validity Period */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        name="hasValidityEnd"
                        checked={formData.hasValidityEnd}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isProcessing}
                      />
                      <label className="ml-2 block text-sm font-medium text-gray-700">
                        Set Validity End Date
                      </label>
                    </div>
                    {formData.hasValidityEnd && (
                      <input
                        type="date"
                        name="validityEndDate"
                        value={formData.validityEndDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isProcessing}
                      />
                    )}
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="notifyUsers"
                        checked={formData.notifyUsers}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isProcessing}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Notify users via email
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="createAuditLog"
                        checked={formData.createAuditLog}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isProcessing}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Create detailed audit log
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {validationResults && validationResults.validEmails.length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Assignment Summary</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Users:</span>
                      <span className="ml-2 font-medium">{validationResults.validEmails.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Companies:</span>
                      <span className="ml-2 font-medium">{formData.selectedCompanyIds.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ticket Types:</span>
                      <span className="ml-2 font-medium">{formData.selectedTicketTypeIds.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Roles:</span>
                      <span className="ml-2 font-medium">{formData.selectedRoleIds.length}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Total Assignments:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {validationResults.validEmails.length * formData.selectedCompanyIds.length * formData.selectedTicketTypeIds.length * formData.selectedRoleIds.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Warning note */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icons.Warning size={16} className="text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> This will assign roles to multiple users across different companies.
                      {formData.assignmentMode === 'replace' && ' Existing role assignments will be replaced.'}
                      {formData.assignmentMode === 'remove' && ' Selected roles will be removed from users.'}
                      Review the summary before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isProcessing || !validationResults || validationResults.validEmails.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning Roles...
                  </>
                ) : (
                  <>
                    <Icons.Users size={16} className="mr-2" />
                    Assign Roles
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
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

export default BulkRoleAssignmentDialog;