import React, { useState, useEffect } from 'react';
import Icons from '../shared/Icons';
import { useToast } from '../shared/Toast';
import { useTicketTypes, useWorkflowSteps, useRoles } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';

/**
 * AdminWorkflowBuilder Component
 *
 * Manages workflow step configurations for ticket types including:
 * - CRUD operations for workflow steps
 * - Step ordering and naming
 * - SLA configuration per step
 * - Approver role assignments
 * - Step type configuration (approval, task, external)
 */
const AdminWorkflowBuilder = () => {
  const { success, error, warning, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);

  // API data
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { data: workflowSteps, loading: stepsLoading, refetch: refetchSteps } = useWorkflowSteps(selectedTicketType);
  const { data: roles } = useRoles();

  // Step form state
  const [stepFormData, setStepFormData] = useState({
    name: '',
    status_on_reach: 'pending_approval',
    step_type: 'approval',
    approver_logic: 'any',
    sort_order: 1,
    // SLA configuration
    sla_duration: '',
    sla_unit: 'hours',
    exclude_weekends: false,
    // Advanced options
    next_ticket_type_id: '',
    external_app_url: '',
    completion_action_name: ''
  });

  const [stepFormErrors, setStepFormErrors] = useState({});
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [showSLATest, setShowSLATest] = useState(false);
  const [slaTestResults, setSlaTestResults] = useState(null);

  // Step type options
  const stepTypes = [
    { value: 'approval', label: 'Approval Step', icon: Icons.Approval },
    { value: 'task', label: 'Task Step', icon: Icons.Document },
    { value: 'external', label: 'External App', icon: Icons.ExternalLink }
  ];

  // Status options when step is reached
  const statusOptions = [
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_external', label: 'Waiting External' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  // SLA unit options
  const slaUnits = [
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' }
  ];

  // Reset step form
  const resetStepForm = () => {
    setStepFormData({
      name: '',
      status_on_reach: 'pending_approval',
      step_type: 'approval',
      approver_logic: 'any',
      sort_order: 1,
      sla_duration: '',
      sla_unit: 'hours',
      exclude_weekends: false,
      next_ticket_type_id: '',
      external_app_url: '',
      completion_action_name: ''
    });
    setSelectedApprovers([]);
    setStepFormErrors({});
  };

  // Validate step form
  const validateStepForm = () => {
    const errors = {};

    if (!stepFormData.name.trim()) {
      errors.name = 'Step name is required';
    }

    if (stepFormData.step_type === 'approval' && selectedApprovers.length === 0) {
      errors.approvers = 'At least one approver role is required for approval steps';
    }

    if (stepFormData.step_type === 'external' && !stepFormData.external_app_url.trim()) {
      errors.external_app_url = 'External app URL is required for external steps';
    }

    // Enhanced SLA validation using SLA calculator
    if (stepFormData.sla_duration) {
      const duration = parseFloat(stepFormData.sla_duration);
      if (isNaN(duration) || duration <= 0) {
        errors.sla_duration = 'SLA duration must be a positive number';
      } else {
        // Use SLA calculator for validation
        import('../../utils/slaCalculator').then(({ SLACalculator }) => {
          const validation = SLACalculator.validateSLAConfig({
            duration: duration,
            unit: stepFormData.sla_unit,
            excludeWeekends: stepFormData.exclude_weekends
          });

          if (!validation.isValid) {
            setStepFormErrors(prev => ({
              ...prev,
              sla_duration: validation.errors.join(', ')
            }));
          }
        }).catch(err => {
          console.error('SLA validation error:', err);
        });
      }
    }

    setStepFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step form submission
  const handleStepSubmit = async (e) => {
    e.preventDefault();

    if (!validateStepForm()) {
      return;
    }

    setLoading(true);

    try {
      const stepData = {
        ticket_type_id: selectedTicketType,
        name: stepFormData.name.trim(),
        status_on_reach: stepFormData.status_on_reach,
        step_type: stepFormData.step_type,
        approver_logic: stepFormData.approver_logic,
        sort_order: stepFormData.sort_order,
        next_ticket_type_id: stepFormData.next_ticket_type_id || null,
        external_app_url: stepFormData.external_app_url || null,
        completion_action_name: stepFormData.completion_action_name || null,
        // SLA configuration
        sla_duration: stepFormData.sla_duration ? parseFloat(stepFormData.sla_duration) : null,
        sla_unit: stepFormData.sla_duration ? stepFormData.sla_unit : null,
        exclude_weekends: stepFormData.exclude_weekends
      };

      let createdStep;

      if (editingStep) {
        await API.WorkflowSteps.update(editingStep.id, stepData);
        success('Workflow step updated successfully');
      } else {
        createdStep = await API.WorkflowSteps.create(stepData);
        success('Workflow step created successfully');
      }

      // Update step approvers for approval steps
      if (stepFormData.step_type === 'approval' && selectedApprovers.length > 0) {
        const stepId = editingStep?.id || createdStep?.id;
        if (stepId) {
          // Clear existing approvers and add new ones
          await API.WorkflowSteps.updateStepApprovers(stepId, selectedApprovers);
        }
      }

      resetStepForm();
      setShowStepForm(false);
      setEditingStep(null);
      refetchSteps();
    } catch (err) {
      error(err.message || 'Failed to save workflow step');
    } finally {
      setLoading(false);
    }
  };

  // Handle create new step
  const handleCreateStep = () => {
    if (!selectedTicketType) {
      warning('Please select a ticket type first');
      return;
    }

    resetStepForm();

    // Set default sort order to be after existing steps
    const nextSortOrder = workflowSteps ? Math.max(...workflowSteps.map(s => s.sort_order), 0) + 1 : 1;
    setStepFormData(prev => ({ ...prev, sort_order: nextSortOrder }));

    setShowStepForm(true);
  };

  // Handle edit step
  const handleEditStep = (step) => {
    setStepFormData({
      name: step.name,
      status_on_reach: step.status_on_reach,
      step_type: step.step_type,
      approver_logic: step.approver_logic || 'any',
      sort_order: step.sort_order,
      sla_duration: step.sla_duration || '',
      sla_unit: step.sla_unit || 'hours',
      exclude_weekends: step.exclude_weekends || false,
      next_ticket_type_id: step.next_ticket_type_id || '',
      external_app_url: step.external_app_url || '',
      completion_action_name: step.completion_action_name || ''
    });

    // Load existing approvers
    if (step.step_type === 'approval') {
      API.WorkflowSteps.getStepApprovers(step.id)
        .then(approvers => {
          setSelectedApprovers(approvers.map(a => a.role_id));
        })
        .catch(err => console.error('Failed to load step approvers:', err));
    }

    setEditingStep(step);
    setShowStepForm(true);
  };

  // Handle delete step
  const handleDeleteStep = (step) => {
    setDeletingStep(step);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStep = async () => {
    if (!deletingStep) return;

    setLoading(true);

    try {
      await API.WorkflowSteps.delete(deletingStep.id);
      success('Workflow step deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingStep(null);
      refetchSteps();
    } catch (err) {
      error(err.message || 'Failed to delete workflow step');
    } finally {
      setLoading(false);
    }
  };

  // Handle SLA testing
  const handleTestSLA = async () => {
    if (!stepFormData.sla_duration) {
      warning('Please enter SLA duration before testing');
      return;
    }

    try {
      const { SLACalculator } = await import('../../utils/slaCalculator');
      const testConfig = {
        duration: parseFloat(stepFormData.sla_duration),
        unit: stepFormData.sla_unit,
        excludeWeekends: stepFormData.exclude_weekends,
        businessHoursOnly: false // Currently not implemented in UI
      };

      const results = SLACalculator.simulateSLA(testConfig);
      setSlaTestResults(results);
      setShowSLATest(true);
    } catch (err) {
      error('Failed to test SLA configuration');
      console.error('SLA test error:', err);
    }
  };

  // Handle form input changes
  const handleStepInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStepFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (stepFormErrors[name]) {
      setStepFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear SLA test results when SLA config changes
    if (['sla_duration', 'sla_unit', 'exclude_weekends'].includes(name)) {
      setSlaTestResults(null);
    }
  };

  // Handle approver selection
  const handleApproverToggle = (roleId) => {
    setSelectedApprovers(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });

    // Clear approvers error
    if (stepFormErrors.approvers) {
      setStepFormErrors(prev => ({ ...prev, approvers: '' }));
    }
  };

  // Get SLA display text
  const getSLADisplayText = (step) => {
    if (!step.sla_duration) return 'No SLA';

    const duration = step.sla_duration;
    const unit = step.sla_unit || 'hours';
    const weekends = step.exclude_weekends ? ' (business days)' : '';

    return `${duration} ${unit}${weekends}`;
  };

  // Loading state
  if (ticketTypesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading workflow builder...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Workflow Builder</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure multi-step approval workflows with SLA tracking
          </p>
        </div>
        <button
          onClick={handleCreateStep}
          disabled={loading || !selectedTicketType}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Icons.Plus size={16} className="mr-2" />
          Add Workflow Step
        </button>
      </div>

      {/* Ticket Type Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ticket Type to Configure Workflow
            </label>
            <select
              value={selectedTicketType}
              onChange={(e) => setSelectedTicketType(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a ticket type...</option>
              {ticketTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>
          {selectedTicketType && workflowSteps && (
            <div className="text-sm text-gray-600">
              {workflowSteps.length} step{workflowSteps.length !== 1 ? 's' : ''} configured
            </div>
          )}
        </div>
      </div>

      {/* Workflow Steps List */}
      {selectedTicketType && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Workflow Steps
            </h3>
          </div>

          {stepsLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <span className="text-gray-600 mt-2">Loading workflow steps...</span>
            </div>
          ) : workflowSteps && workflowSteps.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {workflowSteps
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((step, index) => (
                  <div key={step.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {step.name}
                          </h4>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Type: {step.step_type}</span>
                            <span>•</span>
                            <span>Status: {step.status_on_reach}</span>
                            <span>•</span>
                            <span>SLA: {getSLADisplayText(step)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditStep(step)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                          title="Edit step"
                        >
                          <Icons.Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteStep(step)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                          title="Delete step"
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
              <Icons.Workflow size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflow Steps</h3>
              <p className="text-gray-600 mb-4">
                Create workflow steps to define the approval process for this ticket type.
              </p>
              <button
                onClick={handleCreateStep}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Icons.Plus size={16} className="mr-2" />
                Add First Step
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step Form Modal */}
      {showStepForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleStepSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingStep ? 'Edit Workflow Step' : 'Create New Workflow Step'}
                      </h3>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Step Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Step Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={stepFormData.name}
                            onChange={handleStepInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                              stepFormErrors.name ? 'border-red-300' : 'border-gray-300'
                            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g., Manager Approval"
                          />
                          {stepFormErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{stepFormErrors.name}</p>
                          )}
                        </div>

                        {/* Step Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Step Type *
                          </label>
                          <select
                            name="step_type"
                            value={stepFormData.step_type}
                            onChange={handleStepInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            {stepTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status When Reached */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status When Reached
                          </label>
                          <select
                            name="status_on_reach"
                            value={stepFormData.status_on_reach}
                            onChange={handleStepInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SLA Configuration */}
                        <div className="sm:col-span-2">
                          <h4 className="text-md font-medium text-gray-900 mb-3">SLA Configuration</h4>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Duration
                              </label>
                              <input
                                type="number"
                                name="sla_duration"
                                value={stepFormData.sla_duration}
                                onChange={handleStepInputChange}
                                min="0"
                                step="0.5"
                                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                                  stepFormErrors.sla_duration ? 'border-red-300' : 'border-gray-300'
                                } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="e.g., 24"
                              />
                              {stepFormErrors.sla_duration && (
                                <p className="mt-1 text-sm text-red-600">{stepFormErrors.sla_duration}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Unit
                              </label>
                              <select
                                name="sla_unit"
                                value={stepFormData.sla_unit}
                                onChange={handleStepInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                {slaUnits.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <div className="flex items-center h-10">
                                <input
                                  type="checkbox"
                                  name="exclude_weekends"
                                  checked={stepFormData.exclude_weekends}
                                  onChange={handleStepInputChange}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                  Exclude weekends
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* SLA Test Button */}
                          {stepFormData.sla_duration && (
                            <div className="mt-3 flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={handleTestSLA}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Icons.Search size={14} className="mr-2" />
                                Test SLA
                              </button>
                              {slaTestResults && (
                                <span className={`text-sm ${slaTestResults.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                  {slaTestResults.isValid ? '✓ Valid configuration' : '✗ Configuration has issues'}
                                </span>
                              )}
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Approver Roles (for approval steps) */}
                        {stepFormData.step_type === 'approval' && (
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Approver Roles *
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                              {roles?.map((role) => (
                                <label key={role.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedApprovers.includes(role.id)}
                                    onChange={() => handleApproverToggle(role.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{role.name}</span>
                                </label>
                              ))}
                            </div>
                            {stepFormErrors.approvers && (
                              <p className="mt-1 text-sm text-red-600">{stepFormErrors.approvers}</p>
                            )}

                            {selectedApprovers.length > 1 && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  Approval Logic
                                </label>
                                <select
                                  name="approver_logic"
                                  value={stepFormData.approver_logic}
                                  onChange={handleStepInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="any">Any approver can approve</option>
                                  <option value="all">All approvers must approve</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* External App URL (for external steps) */}
                        {stepFormData.step_type === 'external' && (
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              External App URL *
                            </label>
                            <input
                              type="url"
                              name="external_app_url"
                              value={stepFormData.external_app_url}
                              onChange={handleStepInputChange}
                              className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                                stepFormErrors.external_app_url ? 'border-red-300' : 'border-gray-300'
                              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                              placeholder="https://external-app.com/workflow"
                            />
                            {stepFormErrors.external_app_url && (
                              <p className="mt-1 text-sm text-red-600">{stepFormErrors.external_app_url}</p>
                            )}
                          </div>
                        )}

                        {/* Sort Order */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Step Order
                          </label>
                          <input
                            type="number"
                            name="sort_order"
                            value={stepFormData.sort_order}
                            onChange={handleStepInputChange}
                            min="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
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
                      editingStep ? 'Update Step' : 'Create Step'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStepForm(false);
                      setEditingStep(null);
                      resetStepForm();
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
      {showDeleteConfirm && deletingStep && (
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
                      Delete Workflow Step
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{deletingStep.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDeleteStep}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingStep(null);
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

      {/* SLA Test Results Modal */}
      {showSLATest && slaTestResults && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      SLA Configuration Test Results
                    </h3>

                    {/* Validation Status */}
                    <div className={`p-4 rounded-lg border mb-4 ${
                      slaTestResults.isValid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {slaTestResults.isValid ? (
                          <Icons.Success size={20} className="text-green-600 mr-2" />
                        ) : (
                          <Icons.Warning size={20} className="text-red-600 mr-2" />
                        )}
                        <span className={`font-medium ${
                          slaTestResults.isValid ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {slaTestResults.isValid ? 'Configuration is valid' : 'Configuration has issues'}
                        </span>
                      </div>

                      {/* Errors */}
                      {slaTestResults.errors.length > 0 && (
                        <div className="mt-2">
                          <ul className="list-disc list-inside text-sm text-red-700">
                            {slaTestResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings */}
                      {slaTestResults.warnings.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-700">
                            {slaTestResults.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Configuration Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Configuration</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span> {slaTestResults.configuration.duration} {slaTestResults.configuration.unit}
                        </div>
                        <div>
                          <span className="font-medium">Weekends:</span> {slaTestResults.configuration.excludeWeekends ? 'Excluded' : 'Included'}
                        </div>
                      </div>
                    </div>

                    {/* Example Scenarios */}
                    {slaTestResults.examples.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Example Scenarios</h4>
                        <div className="space-y-3">
                          {slaTestResults.examples.map((example, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                {example.scenario}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Start:</span><br />
                                  {example.startDate}
                                </div>
                                <div>
                                  <span className="font-medium">Due:</span><br />
                                  {example.dueDate}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span><br />
                                  {example.duration}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowSLATest(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminWorkflowBuilder;