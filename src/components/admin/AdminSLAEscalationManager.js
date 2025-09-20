import React, { useState, useEffect } from 'react';
import { useCompanies, useTicketTypes, useRoles } from '../../hooks/useAPI';
import { useToast } from '../shared/Toast';
import { useConfirmation, useInformation } from '../shared/ConfirmationModal';
import Icons from '../shared/Icons';
import {
  ESCALATION_TYPES,
  ESCALATION_TRIGGERS,
  DEFAULT_ESCALATION_RULES,
  SLAEscalationEngine
} from '../../utils/slaEscalation';

/**
 * SLA Escalation Rules Management Component
 *
 * Allows administrators to configure escalation rules for SLA management
 * including notifications, reassignments, and automated actions
 */
const AdminSLAEscalationManager = () => {
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { data: roles } = useRoles();
  const { success, error } = useToast();
  const { confirm, ConfirmationModal } = useConfirmation();
  const { showInfo, InformationModal } = useInformation();

  // Component state
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [escalationRules, setEscalationRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for new/editing rule
  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: ESCALATION_TRIGGERS.PERCENTAGE,
    triggerValue: 75,
    triggerUnit: 'hours',
    action: ESCALATION_TYPES.NOTIFICATION,
    targetRoles: [],
    message: '',
    priority: 'medium',
    isActive: true
  });

  // Load escalation rules for selected ticket type
  useEffect(() => {
    if (selectedTicketType) {
      loadEscalationRules(selectedTicketType);
    }
  }, [selectedTicketType]);

  const loadEscalationRules = async (ticketTypeId) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // For now, simulate loading with default rules
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockRules = DEFAULT_ESCALATION_RULES.APPROVAL_24H.map(rule => ({
        ...rule,
        ticketTypeId,
        id: `${ticketTypeId}_${rule.id}`
      }));

      setEscalationRules(mockRules);
    } catch (err) {
      error('Failed to load escalation rules');
      setEscalationRules([]);
    }
    setLoading(false);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      trigger: ESCALATION_TRIGGERS.PERCENTAGE,
      triggerValue: 75,
      triggerUnit: 'hours',
      action: ESCALATION_TYPES.NOTIFICATION,
      targetRoles: [],
      message: '',
      priority: 'medium',
      isActive: true
    });
    setShowRuleForm(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      trigger: rule.trigger,
      triggerValue: rule.triggerValue || 75,
      triggerUnit: rule.triggerUnit || 'hours',
      action: rule.action,
      targetRoles: rule.targetRoles || [],
      message: rule.message || '',
      priority: rule.priority || 'medium',
      isActive: rule.isActive
    });
    setShowRuleForm(true);
  };

  const handleSaveRule = async () => {
    // Validate rule
    const validation = SLAEscalationEngine.validateEscalationRule(ruleForm);
    if (!validation.isValid) {
      showInfo({
        title: 'Validation Error',
        message: `Please fix the following issues:\n${validation.errors.join('\n')}`,
        type: 'error'
      });
      return;
    }

    if (ruleForm.targetRoles.length === 0) {
      showInfo({
        title: 'Target Roles Required',
        message: 'Please select at least one target role for this escalation rule.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const ruleData = {
        ...ruleForm,
        ticketTypeId: selectedTicketType,
        id: editingRule ? editingRule.id : `${selectedTicketType}_${Date.now()}`
      };

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingRule) {
        // Update existing rule
        setEscalationRules(prev =>
          prev.map(rule => rule.id === editingRule.id ? ruleData : rule)
        );
        success('Escalation rule updated successfully');
      } else {
        // Add new rule
        setEscalationRules(prev => [...prev, ruleData]);
        success('Escalation rule created successfully');
      }

      setShowRuleForm(false);
      setEditingRule(null);
    } catch (err) {
      error('Failed to save escalation rule');
    }
    setLoading(false);
  };

  const handleDeleteRule = async (rule) => {
    const confirmed = await confirm({
      title: 'Delete Escalation Rule',
      message: `Are you sure you want to delete the escalation rule "${rule.name}"? This action cannot be undone.`,
      type: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setEscalationRules(prev => prev.filter(r => r.id !== rule.id));
        success('Escalation rule deleted successfully');
      } catch (err) {
        error('Failed to delete escalation rule');
      }
      setLoading(false);
    }
  };

  const handleTestRule = (rule) => {
    showInfo({
      title: 'Test Escalation Rule',
      message: `This will simulate the escalation rule "${rule.name}" for testing purposes. Test notifications will be sent to configured roles.\n\nRule Details:\n• Trigger: ${getTriggerDescription(rule)}\n• Action: ${getActionDescription(rule)}\n• Target Roles: ${rule.targetRoles.join(', ')}`,
      type: 'info'
    });
  };

  const getTriggerDescription = (rule) => {
    switch (rule.trigger) {
      case ESCALATION_TRIGGERS.PERCENTAGE:
        return `${rule.triggerValue}% of SLA time`;
      case ESCALATION_TRIGGERS.HOURS_BEFORE:
        return `${rule.triggerValue} hours before due`;
      case ESCALATION_TRIGGERS.OVERDUE_BY:
        return `${rule.triggerValue} ${rule.triggerUnit} overdue`;
      case ESCALATION_TRIGGERS.DUE_TODAY:
        return 'When ticket becomes due today';
      case ESCALATION_TRIGGERS.IMMEDIATE:
        return 'Immediate trigger';
      default:
        return 'Unknown trigger';
    }
  };

  const getActionDescription = (rule) => {
    switch (rule.action) {
      case ESCALATION_TYPES.NOTIFICATION:
        return 'Send notification';
      case ESCALATION_TYPES.REASSIGN:
        return 'Reassign ticket';
      case ESCALATION_TYPES.ESCALATE_STEP:
        return 'Escalate to next step';
      case ESCALATION_TYPES.AUTO_APPROVE:
        return 'Auto-approve ticket';
      case ESCALATION_TYPES.MANAGER_ALERT:
        return 'Alert management';
      default:
        return 'Unknown action';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <ConfirmationModal />
      <InformationModal />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SLA Escalation Rules</h2>
            <p className="text-gray-600">Configure automated escalation rules for SLA management</p>
          </div>
        </div>

        {/* Ticket Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Ticket Type</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Type
              </label>
              <select
                value={selectedTicketType}
                onChange={(e) => setSelectedTicketType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a ticket type...</option>
                {ticketTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedTicketType && (
              <div className="flex items-end">
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Icons.Create size={16} />
                  <span>Add Escalation Rule</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Escalation Rules List */}
        {selectedTicketType && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Escalation Rules ({escalationRules.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading escalation rules...</p>
              </div>
            ) : escalationRules.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {escalationRules.map((rule) => (
                  <div key={rule.id} className="p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rule.priority)}`}>
                            {rule.priority}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Trigger:</span> {getTriggerDescription(rule)}
                          </div>
                          <div>
                            <span className="font-medium">Action:</span> {getActionDescription(rule)}
                          </div>
                          <div>
                            <span className="font-medium">Target Roles:</span> {rule.targetRoles.join(', ') || 'None'}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {rule.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>

                        {rule.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Message:</span>
                            <p className="text-sm text-gray-600 mt-1">{rule.message}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestRule(rule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Test Rule"
                        >
                          <Icons.Warning size={16} />
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Edit Rule"
                        >
                          <Icons.Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Rule"
                        >
                          <Icons.Close size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Icons.Warning size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No escalation rules configured</p>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  Create First Escalation Rule
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rule Form Modal */}
        {showRuleForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRuleForm(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingRule ? 'Edit Escalation Rule' : 'Create Escalation Rule'}
                  </h3>

                  <div className="space-y-4">
                    {/* Rule Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rule Name
                      </label>
                      <input
                        type="text"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 75% SLA Warning"
                      />
                    </div>

                    {/* Trigger Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trigger Type
                        </label>
                        <select
                          value={ruleForm.trigger}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, trigger: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={ESCALATION_TRIGGERS.PERCENTAGE}>Percentage of SLA</option>
                          <option value={ESCALATION_TRIGGERS.HOURS_BEFORE}>Hours Before Due</option>
                          <option value={ESCALATION_TRIGGERS.OVERDUE_BY}>Hours/Days Overdue</option>
                          <option value={ESCALATION_TRIGGERS.DUE_TODAY}>Due Today</option>
                          <option value={ESCALATION_TRIGGERS.IMMEDIATE}>Immediate</option>
                        </select>
                      </div>

                      {[ESCALATION_TRIGGERS.PERCENTAGE, ESCALATION_TRIGGERS.HOURS_BEFORE, ESCALATION_TRIGGERS.OVERDUE_BY].includes(ruleForm.trigger) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {ruleForm.trigger === ESCALATION_TRIGGERS.PERCENTAGE ? 'Percentage' : 'Value'}
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="1"
                              max={ruleForm.trigger === ESCALATION_TRIGGERS.PERCENTAGE ? "100" : "999"}
                              value={ruleForm.triggerValue}
                              onChange={(e) => setRuleForm(prev => ({ ...prev, triggerValue: parseInt(e.target.value) }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {ruleForm.trigger === ESCALATION_TRIGGERS.OVERDUE_BY && (
                              <select
                                value={ruleForm.triggerUnit}
                                onChange={(e) => setRuleForm(prev => ({ ...prev, triggerUnit: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Action Type
                        </label>
                        <select
                          value={ruleForm.action}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, action: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={ESCALATION_TYPES.NOTIFICATION}>Send Notification</option>
                          <option value={ESCALATION_TYPES.MANAGER_ALERT}>Manager Alert</option>
                          <option value={ESCALATION_TYPES.REASSIGN}>Reassign Ticket</option>
                          <option value={ESCALATION_TYPES.ESCALATE_STEP}>Escalate Step</option>
                          <option value={ESCALATION_TYPES.AUTO_APPROVE}>Auto Approve</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={ruleForm.priority}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    {/* Target Roles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Roles
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {roles?.map((role) => (
                          <label key={role.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={ruleForm.targetRoles.includes(role.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRuleForm(prev => ({
                                    ...prev,
                                    targetRoles: [...prev.targetRoles, role.name]
                                  }));
                                } else {
                                  setRuleForm(prev => ({
                                    ...prev,
                                    targetRoles: prev.targetRoles.filter(r => r !== role.name)
                                  }));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{role.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={ruleForm.message}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Custom message for this escalation..."
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ruleForm.isActive}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Rule is active
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRuleForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRule}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:text-sm"
                  >
                    {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
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

export default AdminSLAEscalationManager;