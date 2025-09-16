import { WORKFLOW_CONSTANTS } from './workflowEngine';

/**
 * Conditional Workflow Engine
 * Handles field-based workflow branching and conditional step routing
 */

/**
 * Condition operators for field evaluation
 */
export const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  LESS_THAN: 'less_than',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  IN: 'in',
  NOT_IN: 'not_in',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  REGEX_MATCH: 'regex_match'
};

/**
 * Field types for different evaluation strategies
 */
export const FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  CUSTOM: 'custom'
};

/**
 * Logical operators for combining conditions
 */
export const LOGICAL_OPERATORS = {
  AND: 'and',
  OR: 'or',
  NOT: 'not'
};

/**
 * Evaluate a single condition against ticket data
 * @param {Object} condition - The condition to evaluate
 * @param {Object} ticketData - The ticket data to evaluate against
 * @returns {boolean} True if condition is met
 */
export const evaluateCondition = (condition, ticketData) => {
  const { field_name, operator, value, field_type = FIELD_TYPES.STRING } = condition;

  // Get field value from ticket data
  let fieldValue = getFieldValue(ticketData, field_name);

  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    return operator === CONDITION_OPERATORS.IS_EMPTY;
  }

  // Convert field value to appropriate type
  fieldValue = convertFieldValue(fieldValue, field_type);
  const compareValue = convertFieldValue(value, field_type);

  switch (operator) {
    case CONDITION_OPERATORS.EQUALS:
      return fieldValue === compareValue;

    case CONDITION_OPERATORS.NOT_EQUALS:
      return fieldValue !== compareValue;

    case CONDITION_OPERATORS.CONTAINS:
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;

    case CONDITION_OPERATORS.NOT_CONTAINS:
      return !evaluateCondition({ ...condition, operator: CONDITION_OPERATORS.CONTAINS }, ticketData);

    case CONDITION_OPERATORS.GREATER_THAN:
      return fieldValue > compareValue;

    case CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL:
      return fieldValue >= compareValue;

    case CONDITION_OPERATORS.LESS_THAN:
      return fieldValue < compareValue;

    case CONDITION_OPERATORS.LESS_THAN_OR_EQUAL:
      return fieldValue <= compareValue;

    case CONDITION_OPERATORS.IN:
      if (!Array.isArray(compareValue)) return false;
      return compareValue.includes(fieldValue);

    case CONDITION_OPERATORS.NOT_IN:
      return !evaluateCondition({ ...condition, operator: CONDITION_OPERATORS.IN }, ticketData);

    case CONDITION_OPERATORS.IS_EMPTY:
      if (typeof fieldValue === 'string') return fieldValue.trim() === '';
      if (Array.isArray(fieldValue)) return fieldValue.length === 0;
      return fieldValue === null || fieldValue === undefined;

    case CONDITION_OPERATORS.IS_NOT_EMPTY:
      return !evaluateCondition({ ...condition, operator: CONDITION_OPERATORS.IS_EMPTY }, ticketData);

    case CONDITION_OPERATORS.REGEX_MATCH:
      try {
        const regex = new RegExp(compareValue, 'i');
        return regex.test(String(fieldValue));
      } catch (error) {
        console.error('Invalid regex pattern:', compareValue);
        return false;
      }

    default:
      console.warn('Unknown condition operator:', operator);
      return false;
  }
};

/**
 * Evaluate a group of conditions with logical operators
 * @param {Object} conditionGroup - Group of conditions with logical operator
 * @param {Object} ticketData - The ticket data to evaluate against
 * @returns {boolean} True if condition group is met
 */
export const evaluateConditionGroup = (conditionGroup, ticketData) => {
  const { operator, conditions } = conditionGroup;

  if (!conditions || conditions.length === 0) return true;

  switch (operator) {
    case LOGICAL_OPERATORS.AND:
      return conditions.every(condition => {
        if (condition.conditions) {
          // Nested condition group
          return evaluateConditionGroup(condition, ticketData);
        }
        return evaluateCondition(condition, ticketData);
      });

    case LOGICAL_OPERATORS.OR:
      return conditions.some(condition => {
        if (condition.conditions) {
          // Nested condition group
          return evaluateConditionGroup(condition, ticketData);
        }
        return evaluateCondition(condition, ticketData);
      });

    case LOGICAL_OPERATORS.NOT:
      // NOT operator should have exactly one condition or group
      if (conditions.length !== 1) return false;
      const condition = conditions[0];
      if (condition.conditions) {
        return !evaluateConditionGroup(condition, ticketData);
      }
      return !evaluateCondition(condition, ticketData);

    default:
      console.warn('Unknown logical operator:', operator);
      return false;
  }
};

/**
 * Find the next step based on conditional routing
 * @param {Object} currentStep - Current workflow step
 * @param {Array} workflowSteps - All workflow steps
 * @param {Object} ticketData - Ticket data for condition evaluation
 * @returns {Object|null} Next step or null if workflow complete
 */
export const findConditionalNextStep = (currentStep, workflowSteps, ticketData) => {
  // Check if current step has conditional routing
  if (!currentStep.conditional_routing || !currentStep.conditional_routing.enabled) {
    // Use default next step logic
    return findDefaultNextStep(currentStep, workflowSteps);
  }

  const { routes } = currentStep.conditional_routing;

  // Evaluate each route in order
  for (const route of routes) {
    if (route.conditions && evaluateConditionGroup(route.conditions, ticketData)) {
      // Find the target step
      const targetStep = workflowSteps.find(step => step.id === route.target_step_id);
      if (targetStep) {
        return targetStep;
      }
    }
  }

  // If no conditions match, use default route
  const defaultRoute = routes.find(route => route.is_default);
  if (defaultRoute) {
    const targetStep = workflowSteps.find(step => step.id === defaultRoute.target_step_id);
    if (targetStep) {
      return targetStep;
    }
  }

  // Fallback to default next step logic
  return findDefaultNextStep(currentStep, workflowSteps);
};

/**
 * Validate conditional routing configuration
 * @param {Object} conditionalRouting - Conditional routing configuration
 * @param {Array} workflowSteps - All workflow steps
 * @returns {Object} Validation result with errors
 */
export const validateConditionalRouting = (conditionalRouting, workflowSteps) => {
  const errors = [];

  if (!conditionalRouting || !conditionalRouting.enabled) {
    return { valid: true, errors: [] };
  }

  const { routes } = conditionalRouting;

  if (!routes || routes.length === 0) {
    errors.push('Conditional routing enabled but no routes defined');
    return { valid: false, errors };
  }

  let hasDefault = false;

  routes.forEach((route, index) => {
    // Check if target step exists
    if (!route.target_step_id) {
      errors.push(`Route ${index + 1}: Missing target step ID`);
    } else {
      const targetStep = workflowSteps.find(step => step.id === route.target_step_id);
      if (!targetStep) {
        errors.push(`Route ${index + 1}: Target step ${route.target_step_id} not found`);
      }
    }

    // Check for default route
    if (route.is_default) {
      if (hasDefault) {
        errors.push(`Route ${index + 1}: Multiple default routes found`);
      }
      hasDefault = true;
    }

    // Validate conditions
    if (route.conditions && !route.is_default) {
      const conditionErrors = validateConditionGroup(route.conditions);
      if (conditionErrors.length > 0) {
        errors.push(`Route ${index + 1}: ${conditionErrors.join(', ')}`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate a condition group
 * @param {Object} conditionGroup - Condition group to validate
 * @returns {Array} Array of error messages
 */
export const validateConditionGroup = (conditionGroup) => {
  const errors = [];

  if (!conditionGroup.operator) {
    errors.push('Missing logical operator');
    return errors;
  }

  if (!Object.values(LOGICAL_OPERATORS).includes(conditionGroup.operator)) {
    errors.push(`Invalid logical operator: ${conditionGroup.operator}`);
  }

  if (!conditionGroup.conditions || conditionGroup.conditions.length === 0) {
    errors.push('No conditions defined');
    return errors;
  }

  conditionGroup.conditions.forEach((condition, index) => {
    if (condition.conditions) {
      // Nested condition group
      const nestedErrors = validateConditionGroup(condition);
      nestedErrors.forEach(error => errors.push(`Nested group ${index + 1}: ${error}`));
    } else {
      // Individual condition
      if (!condition.field_name) {
        errors.push(`Condition ${index + 1}: Missing field name`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Missing operator`);
      }
      if (!Object.values(CONDITION_OPERATORS).includes(condition.operator)) {
        errors.push(`Condition ${index + 1}: Invalid operator ${condition.operator}`);
      }
    }
  });

  return errors;
};

/**
 * Get available field names for condition building
 * @param {Array} ticketTypes - Available ticket types
 * @returns {Array} Array of field definitions
 */
export const getAvailableFields = (ticketTypes) => {
  const standardFields = [
    { name: 'title', label: 'Title', type: FIELD_TYPES.STRING },
    { name: 'description', label: 'Description', type: FIELD_TYPES.STRING },
    { name: 'priority', label: 'Priority', type: FIELD_TYPES.STRING },
    { name: 'status', label: 'Status', type: FIELD_TYPES.STRING },
    { name: 'assignee_email', label: 'Assignee Email', type: FIELD_TYPES.STRING },
    { name: 'creator_email', label: 'Creator Email', type: FIELD_TYPES.STRING },
    { name: 'company_id', label: 'Company', type: FIELD_TYPES.STRING },
    { name: 'ticket_type_id', label: 'Ticket Type', type: FIELD_TYPES.STRING },
    { name: 'due_date', label: 'Due Date', type: FIELD_TYPES.DATE },
    { name: 'created_date', label: 'Created Date', type: FIELD_TYPES.DATE },
    { name: 'updated_date', label: 'Updated Date', type: FIELD_TYPES.DATE }
  ];

  // Add custom fields from ticket types
  const customFields = [];
  ticketTypes?.forEach(ticketType => {
    ticketType.custom_fields?.forEach(customField => {
      customFields.push({
        name: `custom_fields.${customField.id}`,
        label: `${customField.label} (${ticketType.name})`,
        type: customField.type || FIELD_TYPES.STRING
      });
    });
  });

  return [...standardFields, ...customFields];
};

/**
 * Helper functions
 */

/**
 * Get field value from ticket data, supporting nested paths
 * @param {Object} data - Data object
 * @param {string} fieldPath - Field path (e.g., 'custom_fields.field1')
 * @returns {*} Field value
 */
const getFieldValue = (data, fieldPath) => {
  const parts = fieldPath.split('.');
  let value = data;

  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  return value;
};

/**
 * Convert field value to appropriate type
 * @param {*} value - Value to convert
 * @param {string} fieldType - Target field type
 * @returns {*} Converted value
 */
const convertFieldValue = (value, fieldType) => {
  if (value === null || value === undefined) return value;

  switch (fieldType) {
    case FIELD_TYPES.NUMBER:
      return Number(value);

    case FIELD_TYPES.DATE:
      return new Date(value);

    case FIELD_TYPES.BOOLEAN:
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);

    case FIELD_TYPES.ARRAY:
      return Array.isArray(value) ? value : [value];

    case FIELD_TYPES.STRING:
    default:
      return String(value);
  }
};

/**
 * Find default next step (fallback for when no conditional routing applies)
 * @param {Object} currentStep - Current workflow step
 * @param {Array} workflowSteps - All workflow steps
 * @returns {Object|null} Next step or null
 */
const findDefaultNextStep = (currentStep, workflowSteps) => {
  // Sort steps by step_order and find the next one
  const sortedSteps = workflowSteps
    .filter(step => step.step_order > currentStep.step_order)
    .sort((a, b) => a.step_order - b.step_order);

  return sortedSteps.length > 0 ? sortedSteps[0] : null;
};

/**
 * Create a sample conditional routing configuration
 * @returns {Object} Sample configuration for documentation/testing
 */
export const createSampleConditionalRouting = () => {
  return {
    enabled: true,
    routes: [
      {
        id: 'route1',
        name: 'High Priority Route',
        conditions: {
          operator: LOGICAL_OPERATORS.AND,
          conditions: [
            {
              field_name: 'priority',
              operator: CONDITION_OPERATORS.EQUALS,
              value: 'high',
              field_type: FIELD_TYPES.STRING
            },
            {
              field_name: 'custom_fields.amount',
              operator: CONDITION_OPERATORS.GREATER_THAN,
              value: 10000,
              field_type: FIELD_TYPES.NUMBER
            }
          ]
        },
        target_step_id: 'step_director_approval',
        is_default: false
      },
      {
        id: 'route2',
        name: 'Default Route',
        conditions: null,
        target_step_id: 'step_manager_approval',
        is_default: true
      }
    ]
  };
};

export default {
  evaluateCondition,
  evaluateConditionGroup,
  findConditionalNextStep,
  validateConditionalRouting,
  getAvailableFields,
  CONDITION_OPERATORS,
  FIELD_TYPES,
  LOGICAL_OPERATORS
};