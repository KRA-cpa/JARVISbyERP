/**
 * Workflow Engine - Multi-step Approval Logic
 * Handles ticket progression through defined workflow steps
 * Supports "any" vs "all" approver logic and step conditions
 */

/**
 * Workflow step types and approver logic constants
 */
export const WORKFLOW_CONSTANTS = {
  STEP_TYPES: {
    APPROVAL: 'approval',
    TASK: 'task',
    CONDITION: 'condition',
    NOTIFICATION: 'notification'
  },
  APPROVER_LOGIC: {
    ANY: 'any',      // Any single approver can approve
    ALL: 'all',      // All approvers must approve
    MAJORITY: 'majority'  // Majority of approvers must approve
  },
  TICKET_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    IN_PROGRESS: 'in_progress',
    PENDING_APPROVAL: 'pending_approval',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    RETURNED: 'returned',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold'
  },
  STEP_STATUS: {
    NOT_STARTED: 'not_started',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    SKIPPED: 'skipped',
    REJECTED: 'rejected'
  }
};

/**
 * Determines if a workflow step can be started
 * @param {Object} step - Workflow step
 * @param {Object} ticket - Current ticket
 * @param {Array} approvers - Available approvers for the step
 * @returns {Object} Can start result with details
 */
export const canStartWorkflowStep = (step, ticket, approvers = []) => {
  if (!step || !ticket) {
    return { canStart: false, reason: 'Invalid step or ticket' };
  }

  // Check if step is already completed
  if (step.status === WORKFLOW_CONSTANTS.STEP_STATUS.COMPLETED) {
    return { canStart: false, reason: 'Step already completed' };
  }

  // Check if step is skipped
  if (step.status === WORKFLOW_CONSTANTS.STEP_STATUS.SKIPPED) {
    return { canStart: false, reason: 'Step is skipped' };
  }

  // Check if ticket is in correct status
  if (ticket.status === WORKFLOW_CONSTANTS.TICKET_STATUS.REJECTED) {
    return { canStart: false, reason: 'Ticket is rejected' };
  }

  if (ticket.status === WORKFLOW_CONSTANTS.TICKET_STATUS.CANCELLED) {
    return { canStart: false, reason: 'Ticket is cancelled' };
  }

  // For approval steps, check if approvers are available
  if (step.step_type === WORKFLOW_CONSTANTS.STEP_TYPES.APPROVAL && approvers.length === 0) {
    return { canStart: false, reason: 'No approvers available for this step' };
  }

  // Check step conditions if any
  if (step.conditions && step.conditions.length > 0) {
    const conditionResult = evaluateStepConditions(step.conditions, ticket);
    if (!conditionResult.passed) {
      return { canStart: false, reason: `Conditions not met: ${conditionResult.failedConditions.join(', ')}` };
    }
  }

  return { canStart: true, reason: 'Step can be started' };
};

/**
 * Evaluates step conditions against ticket data
 * @param {Array} conditions - Array of condition objects
 * @param {Object} ticket - Ticket data
 * @returns {Object} Evaluation result
 */
export const evaluateStepConditions = (conditions, ticket) => {
  const results = [];
  const failedConditions = [];

  for (const condition of conditions) {
    const result = evaluateSingleCondition(condition, ticket);
    results.push(result);

    if (!result.passed) {
      failedConditions.push(result.description);
    }
  }

  return {
    passed: failedConditions.length === 0,
    results,
    failedConditions
  };
};

/**
 * Evaluates a single condition
 * @param {Object} condition - Single condition object
 * @param {Object} ticket - Ticket data
 * @returns {Object} Single condition result
 */
export const evaluateSingleCondition = (condition, ticket) => {
  const { custom_field_id, operator, value } = condition;

  // Get the actual value from ticket
  let actualValue = null;
  if (custom_field_id) {
    actualValue = ticket.custom_fields?.[custom_field_id];
  } else {
    // Handle standard fields
    actualValue = ticket[condition.field_name];
  }

  let passed = false;
  let description = '';

  switch (operator) {
    case 'equals':
    case '=':
    case '==':
      passed = actualValue == value;
      description = `${custom_field_id || condition.field_name} equals ${value}`;
      break;

    case 'not_equals':
    case '!=':
      passed = actualValue != value;
      description = `${custom_field_id || condition.field_name} not equals ${value}`;
      break;

    case 'greater_than':
    case '>':
      passed = parseFloat(actualValue) > parseFloat(value);
      description = `${custom_field_id || condition.field_name} > ${value}`;
      break;

    case 'greater_than_or_equal':
    case '>=':
      passed = parseFloat(actualValue) >= parseFloat(value);
      description = `${custom_field_id || condition.field_name} >= ${value}`;
      break;

    case 'less_than':
    case '<':
      passed = parseFloat(actualValue) < parseFloat(value);
      description = `${custom_field_id || condition.field_name} < ${value}`;
      break;

    case 'less_than_or_equal':
    case '<=':
      passed = parseFloat(actualValue) <= parseFloat(value);
      description = `${custom_field_id || condition.field_name} <= ${value}`;
      break;

    case 'contains':
      passed = String(actualValue || '').toLowerCase().includes(String(value).toLowerCase());
      description = `${custom_field_id || condition.field_name} contains ${value}`;
      break;

    case 'not_contains':
      passed = !String(actualValue || '').toLowerCase().includes(String(value).toLowerCase());
      description = `${custom_field_id || condition.field_name} does not contain ${value}`;
      break;

    case 'is_empty':
      passed = !actualValue || actualValue === '';
      description = `${custom_field_id || condition.field_name} is empty`;
      break;

    case 'is_not_empty':
      passed = actualValue && actualValue !== '';
      description = `${custom_field_id || condition.field_name} is not empty`;
      break;

    default:
      passed = false;
      description = `Unknown operator: ${operator}`;
  }

  return {
    passed,
    description,
    actualValue,
    expectedValue: value,
    operator
  };
};

/**
 * Determines if a step can be completed based on approvals
 * @param {Object} step - Workflow step
 * @param {Array} approvals - Array of approval objects
 * @param {Array} approvers - Array of required approvers
 * @returns {Object} Completion status
 */
export const canCompleteWorkflowStep = (step, approvals = [], approvers = []) => {
  if (!step) {
    return { canComplete: false, reason: 'Invalid step' };
  }

  // Task steps can be completed directly
  if (step.step_type === WORKFLOW_CONSTANTS.STEP_TYPES.TASK) {
    return { canComplete: true, reason: 'Task step can be completed directly' };
  }

  // For approval steps, check approver logic
  if (step.step_type === WORKFLOW_CONSTANTS.STEP_TYPES.APPROVAL) {
    return checkApprovalLogic(step, approvals, approvers);
  }

  return { canComplete: false, reason: 'Unknown step type' };
};

/**
 * Checks approval logic for a step
 * @param {Object} step - Workflow step
 * @param {Array} approvals - Current approvals
 * @param {Array} approvers - Required approvers
 * @returns {Object} Approval check result
 */
export const checkApprovalLogic = (step, approvals, approvers) => {
  const approvalCounts = getApprovalCounts(approvals);
  const totalApprovers = approvers.length;

  switch (step.approver_logic) {
    case WORKFLOW_CONSTANTS.APPROVER_LOGIC.ANY:
      if (approvalCounts.approved > 0) {
        return { canComplete: true, reason: 'At least one approver has approved' };
      }
      if (approvalCounts.rejected > 0) {
        return { canComplete: false, reason: 'Step rejected by approver', rejected: true };
      }
      return { canComplete: false, reason: 'Waiting for any approver' };

    case WORKFLOW_CONSTANTS.APPROVER_LOGIC.ALL:
      if (approvalCounts.rejected > 0) {
        return { canComplete: false, reason: 'Step rejected by approver', rejected: true };
      }
      if (approvalCounts.approved === totalApprovers) {
        return { canComplete: true, reason: 'All approvers have approved' };
      }
      return { canComplete: false, reason: `Waiting for ${totalApprovers - approvalCounts.approved} more approvers` };

    case WORKFLOW_CONSTANTS.APPROVER_LOGIC.MAJORITY:
      const requiredApprovals = Math.ceil(totalApprovers / 2);
      if (approvalCounts.rejected >= requiredApprovals) {
        return { canComplete: false, reason: 'Step rejected by majority', rejected: true };
      }
      if (approvalCounts.approved >= requiredApprovals) {
        return { canComplete: true, reason: 'Majority of approvers have approved' };
      }
      return { canComplete: false, reason: `Need ${requiredApprovals - approvalCounts.approved} more approvals for majority` };

    default:
      return { canComplete: false, reason: 'Unknown approver logic' };
  }
};

/**
 * Counts approvals by status
 * @param {Array} approvals - Array of approval objects
 * @returns {Object} Approval counts
 */
export const getApprovalCounts = (approvals) => {
  const counts = {
    approved: 0,
    rejected: 0,
    returned: 0,
    pending: 0,
    total: approvals.length
  };

  for (const approval of approvals) {
    switch (approval.action || approval.status) {
      case 'approved':
      case 'approve':
        counts.approved++;
        break;
      case 'rejected':
      case 'reject':
        counts.rejected++;
        break;
      case 'returned':
      case 'return':
        counts.returned++;
        break;
      default:
        counts.pending++;
    }
  }

  return counts;
};

/**
 * Gets the next workflow step after current step
 * @param {Array} workflowSteps - All workflow steps for ticket type
 * @param {Object} currentStep - Current workflow step
 * @param {Object} ticket - Current ticket (for condition evaluation)
 * @returns {Object|null} Next step or null if no more steps
 */
export const getNextWorkflowStep = (workflowSteps, currentStep, ticket = null) => {
  if (!workflowSteps || workflowSteps.length === 0) {
    return null;
  }

  // Sort steps by sort_order
  const sortedSteps = [...workflowSteps].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (!currentStep) {
    // Return first step if no current step
    return sortedSteps[0] || null;
  }

  // Find current step index
  const currentIndex = sortedSteps.findIndex(step => step.id === currentStep.id);

  if (currentIndex === -1) {
    return null; // Current step not found
  }

  // Look for next step
  for (let i = currentIndex + 1; i < sortedSteps.length; i++) {
    const nextStep = sortedSteps[i];

    // Check if step conditions are met (if any)
    if (nextStep.conditions && nextStep.conditions.length > 0) {
      if (ticket) {
        const conditionResult = evaluateStepConditions(nextStep.conditions, ticket);
        if (!conditionResult.passed) {
          continue; // Skip this step, continue to next
        }
      }
    }

    return nextStep;
  }

  return null; // No more steps
};

/**
 * Gets all possible next steps (for conditional workflows)
 * @param {Array} workflowSteps - All workflow steps
 * @param {Object} currentStep - Current step
 * @param {Object} ticket - Current ticket
 * @returns {Array} Array of possible next steps
 */
export const getPossibleNextSteps = (workflowSteps, currentStep, ticket) => {
  if (!workflowSteps) return [];

  const sortedSteps = [...workflowSteps].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const currentIndex = sortedSteps.findIndex(step => step.id === currentStep?.id);

  if (currentIndex === -1) return sortedSteps.slice(0, 1); // Return first step

  const possibleSteps = [];

  for (let i = currentIndex + 1; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];

    if (step.conditions && step.conditions.length > 0) {
      if (ticket) {
        const conditionResult = evaluateStepConditions(step.conditions, ticket);
        if (conditionResult.passed) {
          possibleSteps.push({ ...step, conditionResult });
        }
      } else {
        possibleSteps.push({ ...step, conditionResult: { passed: null, reason: 'Cannot evaluate without ticket data' } });
      }
    } else {
      possibleSteps.push({ ...step, conditionResult: { passed: true, reason: 'No conditions' } });
    }
  }

  return possibleSteps;
};

/**
 * Advances ticket to next workflow step
 * @param {Object} ticket - Current ticket
 * @param {Array} workflowSteps - Workflow steps
 * @param {Object} currentStep - Current step
 * @returns {Object} Updated ticket with next step
 */
export const advanceToNextStep = (ticket, workflowSteps, currentStep) => {
  const nextStep = getNextWorkflowStep(workflowSteps, currentStep, ticket);

  if (!nextStep) {
    // No more steps - mark as completed
    return {
      ...ticket,
      status: WORKFLOW_CONSTANTS.TICKET_STATUS.COMPLETED,
      current_step_id: null,
      step_due_date: null,
      updated_at: new Date().toISOString()
    };
  }

  return {
    ...ticket,
    status: nextStep.status_on_reach || WORKFLOW_CONSTANTS.TICKET_STATUS.IN_PROGRESS,
    current_step_id: nextStep.id,
    step_due_date: calculateStepDueDate(nextStep),
    updated_at: new Date().toISOString()
  };
};

/**
 * Calculates due date for a workflow step based on SLA
 * @param {Object} step - Workflow step with SLA configuration
 * @returns {string|null} ISO date string or null
 */
export const calculateStepDueDate = (step) => {
  if (!step.sla_duration || !step.sla_unit) {
    return null;
  }

  const now = new Date();
  let dueDate = new Date(now);

  switch (step.sla_unit) {
    case 'minutes':
      dueDate.setMinutes(now.getMinutes() + step.sla_duration);
      break;
    case 'hours':
      dueDate.setHours(now.getHours() + step.sla_duration);
      break;
    case 'days':
      dueDate.setDate(now.getDate() + step.sla_duration);

      // Skip weekends if configured
      if (step.exclude_weekends) {
        let businessDays = 0;
        let checkDate = new Date(now);

        while (businessDays < step.sla_duration) {
          checkDate.setDate(checkDate.getDate() + 1);
          const dayOfWeek = checkDate.getDay();

          // Skip weekends (0 = Sunday, 6 = Saturday)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDays++;
          }
        }

        dueDate = checkDate;
      }
      break;
    case 'weeks':
      dueDate.setDate(now.getDate() + (step.sla_duration * 7));
      break;
    default:
      return null;
  }

  return dueDate.toISOString();
};

/**
 * Validates workflow configuration
 * @param {Array} workflowSteps - Workflow steps to validate
 * @returns {Object} Validation result
 */
export const validateWorkflowConfiguration = (workflowSteps) => {
  const errors = [];
  const warnings = [];

  if (!workflowSteps || workflowSteps.length === 0) {
    errors.push('Workflow must have at least one step');
    return { isValid: false, errors, warnings };
  }

  // Check for duplicate sort orders
  const sortOrders = workflowSteps.map(step => step.sort_order).filter(order => order !== undefined);
  const duplicateSortOrders = sortOrders.filter((order, index) => sortOrders.indexOf(order) !== index);

  if (duplicateSortOrders.length > 0) {
    errors.push(`Duplicate sort orders found: ${duplicateSortOrders.join(', ')}`);
  }

  // Validate each step
  workflowSteps.forEach((step, index) => {
    if (!step.name) {
      errors.push(`Step ${index + 1}: Name is required`);
    }

    if (!Object.values(WORKFLOW_CONSTANTS.STEP_TYPES).includes(step.step_type)) {
      errors.push(`Step ${index + 1}: Invalid step type '${step.step_type}'`);
    }

    if (step.step_type === WORKFLOW_CONSTANTS.STEP_TYPES.APPROVAL) {
      if (!Object.values(WORKFLOW_CONSTANTS.APPROVER_LOGIC).includes(step.approver_logic)) {
        warnings.push(`Step ${index + 1}: Invalid approver logic '${step.approver_logic}', defaulting to 'any'`);
      }
    }

    if (step.step_type === WORKFLOW_CONSTANTS.STEP_TYPES.TASK) {
      if (!step.external_app_url) {
        warnings.push(`Step ${index + 1}: Task step should have external_app_url`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Export default object with all functions
export default {
  WORKFLOW_CONSTANTS,
  canStartWorkflowStep,
  evaluateStepConditions,
  evaluateSingleCondition,
  canCompleteWorkflowStep,
  checkApprovalLogic,
  getApprovalCounts,
  getNextWorkflowStep,
  getPossibleNextSteps,
  advanceToNextStep,
  calculateStepDueDate,
  validateWorkflowConfiguration
};