import { generateTicketNumber } from './ticketNumber';
import { WORKFLOW_CONSTANTS } from './workflowEngine';
import { evaluateConditionGroup } from './conditionalWorkflows';

/**
 * Chained Ticket Creation Engine
 * Handles automatic creation of follow-up tickets based on workflow events and conditions
 */

/**
 * Trigger types for chained ticket creation
 */
export const CHAIN_TRIGGERS = {
  WORKFLOW_COMPLETE: 'workflow_complete',
  STEP_COMPLETE: 'step_complete',
  STEP_REJECT: 'step_reject',
  FIELD_CHANGE: 'field_change',
  CUSTOM_CONDITION: 'custom_condition',
  SCHEDULED: 'scheduled'
};

/**
 * Field mapping types for chained tickets
 */
export const FIELD_MAPPING_TYPES = {
  COPY: 'copy',           // Copy value from parent ticket
  STATIC: 'static',       // Use static value
  CALCULATED: 'calculated', // Calculate based on expression
  LOOKUP: 'lookup',       // Lookup from another table
  REFERENCE: 'reference'  // Reference to parent ticket
};

/**
 * Create chained tickets based on configuration
 * @param {Object} parentTicket - The parent ticket that triggered the chain
 * @param {Array} chainConfigurations - Array of chain configurations
 * @param {Object} api - API instance for creating tickets
 * @param {Object} context - Additional context (step, approvals, etc.)
 * @returns {Array} Array of created ticket IDs
 */
export const createChainedTickets = async (parentTicket, chainConfigurations, api, context = {}) => {
  const createdTickets = [];

  if (!chainConfigurations || chainConfigurations.length === 0) {
    return createdTickets;
  }

  for (const config of chainConfigurations) {
    try {
      // Check if chain should be triggered
      if (!shouldTriggerChain(config, parentTicket, context)) {
        continue;
      }

      // Create the chained ticket
      const chainedTicket = await createSingleChainedTicket(parentTicket, config, api, context);
      if (chainedTicket) {
        createdTickets.push(chainedTicket.id);
        console.log(`Created chained ticket: ${chainedTicket.ticket_number} from parent: ${parentTicket.ticket_number}`);
      }

    } catch (error) {
      console.error(`Failed to create chained ticket for config ${config.id}:`, error);
      // Continue with other chains even if one fails
    }
  }

  return createdTickets;
};

/**
 * Check if a chain should be triggered
 * @param {Object} config - Chain configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {boolean} True if chain should be triggered
 */
export const shouldTriggerChain = (config, parentTicket, context) => {
  // Check if enabled
  if (!config.enabled) {
    return false;
  }

  // Check trigger type
  if (!checkTriggerCondition(config.trigger, parentTicket, context)) {
    return false;
  }

  // Check custom conditions if defined
  if (config.conditions && !evaluateConditionGroup(config.conditions, parentTicket)) {
    return false;
  }

  // Check if already triggered (prevent duplicates)
  if (config.once_per_ticket && hasChainAlreadyTriggered(config.id, parentTicket.id)) {
    return false;
  }

  return true;
};

/**
 * Check if trigger condition is met
 * @param {Object} trigger - Trigger configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {boolean} True if trigger condition is met
 */
export const checkTriggerCondition = (trigger, parentTicket, context) => {
  switch (trigger.type) {
    case CHAIN_TRIGGERS.WORKFLOW_COMPLETE:
      return parentTicket.status === WORKFLOW_CONSTANTS.TICKET_STATUS.COMPLETED;

    case CHAIN_TRIGGERS.STEP_COMPLETE:
      if (trigger.step_id) {
        return context.completedStepId === trigger.step_id;
      }
      return context.stepCompleted === true;

    case CHAIN_TRIGGERS.STEP_REJECT:
      if (trigger.step_id) {
        return context.rejectedStepId === trigger.step_id;
      }
      return context.stepRejected === true;

    case CHAIN_TRIGGERS.FIELD_CHANGE:
      if (trigger.field_name && context.changedFields) {
        return context.changedFields.includes(trigger.field_name);
      }
      return false;

    case CHAIN_TRIGGERS.CUSTOM_CONDITION:
      // Custom conditions are handled separately in shouldTriggerChain
      return true;

    case CHAIN_TRIGGERS.SCHEDULED:
      // For scheduled triggers, check timing (implementation depends on scheduler)
      return checkScheduledTrigger(trigger, parentTicket, context);

    default:
      console.warn('Unknown trigger type:', trigger.type);
      return false;
  }
};

/**
 * Create a single chained ticket
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} config - Chain configuration
 * @param {Object} api - API instance
 * @param {Object} context - Event context
 * @returns {Object} Created ticket
 */
export const createSingleChainedTicket = async (parentTicket, config, api, context) => {
  // Get target company and ticket type
  const targetCompany = await getTargetCompany(config.target_company_mapping, parentTicket, api);
  const targetTicketType = await getTargetTicketType(config.target_ticket_type_mapping, parentTicket, api);

  if (!targetCompany || !targetTicketType) {
    throw new Error('Could not determine target company or ticket type for chained ticket');
  }

  // Generate ticket number
  const ticketNumber = await generateChainedTicketNumber(targetCompany, targetTicketType, api);

  // Map fields from parent to child
  const ticketData = await mapTicketFields(parentTicket, config.field_mappings, context);

  // Set required fields
  const chainedTicketData = {
    ...ticketData,
    ticket_number: ticketNumber,
    company_id: targetCompany.id,
    ticket_type_id: targetTicketType.id,
    parent_ticket_id: parentTicket.id,
    chain_config_id: config.id,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    status: config.initial_status || WORKFLOW_CONSTANTS.TICKET_STATUS.DRAFT
  };

  // Create the ticket
  const createdTicket = await api.Tickets.create(chainedTicketData);

  // Create link between parent and child
  await createTicketLink(parentTicket.id, createdTicket.id, 'chained', api);

  // Start workflow if configured
  if (config.auto_start_workflow) {
    await startChainedTicketWorkflow(createdTicket.id, api);
  }

  return createdTicket;
};

/**
 * Map fields from parent ticket to chained ticket
 * @param {Object} parentTicket - Parent ticket
 * @param {Array} fieldMappings - Field mapping configurations
 * @param {Object} context - Event context
 * @returns {Object} Mapped ticket data
 */
export const mapTicketFields = async (parentTicket, fieldMappings, context) => {
  const mappedData = {};

  if (!fieldMappings || fieldMappings.length === 0) {
    return mappedData;
  }

  for (const mapping of fieldMappings) {
    try {
      const value = await mapSingleField(mapping, parentTicket, context);
      if (value !== undefined) {
        setNestedField(mappedData, mapping.target_field, value);
      }
    } catch (error) {
      console.error(`Failed to map field ${mapping.source_field} -> ${mapping.target_field}:`, error);
    }
  }

  return mappedData;
};

/**
 * Map a single field value
 * @param {Object} mapping - Field mapping configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {*} Mapped value
 */
export const mapSingleField = async (mapping, parentTicket, context) => {
  switch (mapping.type) {
    case FIELD_MAPPING_TYPES.COPY:
      return getNestedField(parentTicket, mapping.source_field);

    case FIELD_MAPPING_TYPES.STATIC:
      return mapping.static_value;

    case FIELD_MAPPING_TYPES.CALCULATED:
      return calculateFieldValue(mapping.expression, parentTicket, context);

    case FIELD_MAPPING_TYPES.LOOKUP:
      return await lookupFieldValue(mapping.lookup_config, parentTicket, context);

    case FIELD_MAPPING_TYPES.REFERENCE:
      return createReference(mapping.reference_config, parentTicket);

    default:
      console.warn('Unknown field mapping type:', mapping.type);
      return undefined;
  }
};

/**
 * Get target company for chained ticket
 * @param {Object} companyMapping - Company mapping configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} api - API instance
 * @returns {Object} Target company
 */
export const getTargetCompany = async (companyMapping, parentTicket, api) => {
  if (companyMapping.type === 'same') {
    return await api.Companies.getById(parentTicket.company_id);
  }

  if (companyMapping.type === 'specific') {
    return await api.Companies.getById(companyMapping.company_id);
  }

  if (companyMapping.type === 'field') {
    const companyId = getNestedField(parentTicket, companyMapping.field_name);
    return await api.Companies.getById(companyId);
  }

  throw new Error('Invalid company mapping configuration');
};

/**
 * Get target ticket type for chained ticket
 * @param {Object} ticketTypeMapping - Ticket type mapping configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} api - API instance
 * @returns {Object} Target ticket type
 */
export const getTargetTicketType = async (ticketTypeMapping, parentTicket, api) => {
  if (ticketTypeMapping.type === 'same') {
    return await api.TicketTypes.getById(parentTicket.ticket_type_id);
  }

  if (ticketTypeMapping.type === 'specific') {
    return await api.TicketTypes.getById(ticketTypeMapping.ticket_type_id);
  }

  if (ticketTypeMapping.type === 'field') {
    const ticketTypeId = getNestedField(parentTicket, ticketTypeMapping.field_name);
    return await api.TicketTypes.getById(ticketTypeId);
  }

  throw new Error('Invalid ticket type mapping configuration');
};

/**
 * Generate ticket number for chained ticket
 * @param {Object} company - Target company
 * @param {Object} ticketType - Target ticket type
 * @param {Object} api - API instance
 * @returns {string} Generated ticket number
 */
export const generateChainedTicketNumber = async (company, ticketType, api) => {
  try {
    return await api.getNextTicketNumber(company.id, ticketType.id);
  } catch (error) {
    console.error('Failed to generate ticket number via API, using fallback:', error);
    // Fallback to client-side generation
    const sequence = Math.floor(Math.random() * 9999) + 1; // Simple fallback
    return generateTicketNumber(company, ticketType, sequence);
  }
};

/**
 * Create a link between parent and child tickets
 * @param {string} parentId - Parent ticket ID
 * @param {string} childId - Child ticket ID
 * @param {string} linkType - Type of link
 * @param {Object} api - API instance
 */
export const createTicketLink = async (parentId, childId, linkType, api) => {
  try {
    // This would typically create a record in a ticket_links table
    await api.TicketLinks?.create?.({
      parent_ticket_id: parentId,
      child_ticket_id: childId,
      link_type: linkType,
      created_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create ticket link:', error);
    // Non-critical error, don't fail the entire chain creation
  }
};

/**
 * Start workflow for a chained ticket
 * @param {string} ticketId - Chained ticket ID
 * @param {Object} api - API instance
 */
export const startChainedTicketWorkflow = async (ticketId, api) => {
  try {
    // Import approval router to start workflow
    const { processTicketWorkflow } = await import('./approvalRouter');
    await processTicketWorkflow(api, ticketId);
  } catch (error) {
    console.error('Failed to start chained ticket workflow:', error);
  }
};

/**
 * Helper functions
 */

/**
 * Get nested field value from object
 * @param {Object} obj - Object to get value from
 * @param {string} fieldPath - Dot-notation field path
 * @returns {*} Field value
 */
const getNestedField = (obj, fieldPath) => {
  return fieldPath.split('.').reduce((value, key) => value?.[key], obj);
};

/**
 * Set nested field value in object
 * @param {Object} obj - Object to set value in
 * @param {string} fieldPath - Dot-notation field path
 * @param {*} value - Value to set
 */
const setNestedField = (obj, fieldPath, value) => {
  const keys = fieldPath.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
};

/**
 * Calculate field value using expression
 * @param {string} expression - Calculation expression
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {*} Calculated value
 */
const calculateFieldValue = (expression, parentTicket, context) => {
  // Simple expression evaluation (could be enhanced with a proper expression parser)
  try {
    // Replace placeholders with actual values
    let processedExpression = expression
      .replace(/\$\{parent\.([^}]+)\}/g, (match, field) => {
        const value = getNestedField(parentTicket, field);
        return typeof value === 'string' ? `"${value}"` : value;
      })
      .replace(/\$\{context\.([^}]+)\}/g, (match, field) => {
        const value = getNestedField(context, field);
        return typeof value === 'string' ? `"${value}"` : value;
      });

    // For security, only allow simple operations (no eval)
    // This is a basic implementation - production should use a proper expression parser
    if (/^[0-9+\-*/.() ]+$/.test(processedExpression)) {
      return Function(`"use strict"; return (${processedExpression})`)();
    }

    return processedExpression;
  } catch (error) {
    console.error('Expression calculation failed:', error);
    return null;
  }
};

/**
 * Lookup field value from external source
 * @param {Object} lookupConfig - Lookup configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {*} Looked up value
 */
const lookupFieldValue = async (lookupConfig, parentTicket, context) => {
  // This would integrate with external APIs or databases
  // For now, return a placeholder
  console.log('Lookup not implemented:', lookupConfig);
  return null;
};

/**
 * Create reference to parent ticket
 * @param {Object} referenceConfig - Reference configuration
 * @param {Object} parentTicket - Parent ticket
 * @returns {*} Reference value
 */
const createReference = (referenceConfig, parentTicket) => {
  switch (referenceConfig.type) {
    case 'ticket_id':
      return parentTicket.id;
    case 'ticket_number':
      return parentTicket.ticket_number;
    case 'full_reference':
      return `${parentTicket.ticket_number}: ${parentTicket.title}`;
    default:
      return parentTicket.id;
  }
};

/**
 * Check if chain has already been triggered for a ticket
 * @param {string} chainId - Chain configuration ID
 * @param {string} ticketId - Parent ticket ID
 * @returns {boolean} True if already triggered
 */
const hasChainAlreadyTriggered = (chainId, ticketId) => {
  // This would check against a database of triggered chains
  // For now, return false (allow multiple triggers)
  return false;
};

/**
 * Check scheduled trigger conditions
 * @param {Object} trigger - Trigger configuration
 * @param {Object} parentTicket - Parent ticket
 * @param {Object} context - Event context
 * @returns {boolean} True if scheduled condition is met
 */
const checkScheduledTrigger = (trigger, parentTicket, context) => {
  // Implementation depends on scheduling system
  // This could check time-based conditions, deadlines, etc.
  return false;
};

/**
 * Create sample chain configuration for documentation/testing
 * @returns {Object} Sample configuration
 */
export const createSampleChainConfiguration = () => {
  return {
    id: 'chain_follow_up',
    name: 'Follow-up Ticket Chain',
    enabled: true,
    once_per_ticket: true,
    trigger: {
      type: CHAIN_TRIGGERS.WORKFLOW_COMPLETE
    },
    conditions: null,
    target_company_mapping: {
      type: 'same'
    },
    target_ticket_type_mapping: {
      type: 'specific',
      ticket_type_id: 'follow_up_type_id'
    },
    field_mappings: [
      {
        source_field: 'title',
        target_field: 'title',
        type: FIELD_MAPPING_TYPES.CALCULATED,
        expression: '"Follow-up: " + ${parent.title}'
      },
      {
        source_field: 'description',
        target_field: 'description',
        type: FIELD_MAPPING_TYPES.COPY
      },
      {
        target_field: 'parent_reference',
        type: FIELD_MAPPING_TYPES.REFERENCE,
        reference_config: { type: 'full_reference' }
      }
    ],
    initial_status: WORKFLOW_CONSTANTS.TICKET_STATUS.DRAFT,
    auto_start_workflow: false
  };
};

export default {
  createChainedTickets,
  shouldTriggerChain,
  mapTicketFields,
  createSampleChainConfiguration,
  CHAIN_TRIGGERS,
  FIELD_MAPPING_TYPES
};