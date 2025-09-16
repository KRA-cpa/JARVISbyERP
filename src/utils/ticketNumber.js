/**
 * Ticket Number Generation Utilities
 * Implements COMPANYCODE-TYPECODE-YEAR-SEQUENCE format
 *
 * Format: ABC-REQ-2025-0001
 * - ABC: Company code (3 chars, uppercase)
 * - REQ: Ticket type code (3 chars, uppercase)
 * - 2025: Current year (4 digits)
 * - 0001: Sequential number (4 digits, zero-padded)
 */

/**
 * Generates a ticket number based on company and ticket type
 * @param {Object} company - Company object with code
 * @param {Object} ticketType - Ticket type object with code
 * @param {number} sequence - Sequential number for the ticket
 * @param {number} year - Year (optional, defaults to current year)
 * @returns {string} Formatted ticket number
 */
export const generateTicketNumber = (company, ticketType, sequence, year = null) => {
  // Validate inputs
  if (!company?.code) {
    throw new Error('Company code is required for ticket number generation');
  }

  if (!ticketType?.code) {
    throw new Error('Ticket type code is required for ticket number generation');
  }

  if (!sequence || sequence < 1) {
    throw new Error('Valid sequence number is required (must be >= 1)');
  }

  // Format components
  const companyCode = company.code.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const typeCode = ticketType.code.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const ticketYear = year || new Date().getFullYear();
  const sequenceNumber = sequence.toString().padStart(4, '0');

  return `${companyCode}-${typeCode}-${ticketYear}-${sequenceNumber}`;
};

/**
 * Parses a ticket number into its components
 * @param {string} ticketNumber - The ticket number to parse
 * @returns {Object} Parsed components or null if invalid
 */
export const parseTicketNumber = (ticketNumber) => {
  if (!ticketNumber || typeof ticketNumber !== 'string') {
    return null;
  }

  const parts = ticketNumber.split('-');
  if (parts.length !== 4) {
    return null;
  }

  const [companyCode, typeCode, year, sequence] = parts;

  // Validate format
  if (companyCode.length !== 3 || typeCode.length !== 3 ||
      year.length !== 4 || sequence.length !== 4) {
    return null;
  }

  const parsedYear = parseInt(year, 10);
  const parsedSequence = parseInt(sequence, 10);

  if (isNaN(parsedYear) || isNaN(parsedSequence)) {
    return null;
  }

  return {
    companyCode,
    typeCode,
    year: parsedYear,
    sequence: parsedSequence,
    formatted: ticketNumber
  };
};

/**
 * Generates the sequence key for tracking ticket numbers
 * Used for Google Sheets sequence_counters table
 * @param {string} companyCode - Company code
 * @param {string} typeCode - Ticket type code
 * @param {number} year - Year
 * @returns {string} Sequence key
 */
export const generateSequenceKey = (companyCode, typeCode, year = null) => {
  const ticketYear = year || new Date().getFullYear();
  return `${companyCode.toUpperCase()}-${typeCode.toUpperCase()}-${ticketYear}`;
};

/**
 * Validates ticket number format
 * @param {string} ticketNumber - Ticket number to validate
 * @returns {boolean} True if valid format
 */
export const isValidTicketNumberFormat = (ticketNumber) => {
  const parsed = parseTicketNumber(ticketNumber);
  return parsed !== null;
};

/**
 * Gets next sequence number for a company/type/year combination
 * This is a client-side helper - actual sequence generation happens on backend
 * @param {string} companyCode - Company code
 * @param {string} typeCode - Ticket type code
 * @param {number} year - Year (optional)
 * @returns {string} Sequence key for backend lookup
 */
export const getSequenceKey = (companyCode, typeCode, year = null) => {
  return generateSequenceKey(companyCode, typeCode, year);
};

/**
 * Formats a preview ticket number for display purposes
 * Shows what the next ticket number would look like
 * @param {Object} company - Company object
 * @param {Object} ticketType - Ticket type object
 * @param {number} nextSequence - Next sequence number (optional, defaults to XXXX)
 * @returns {string} Preview ticket number
 */
export const previewTicketNumber = (company, ticketType, nextSequence = null) => {
  if (!company?.code || !ticketType?.code) {
    return 'XXX-XXX-YYYY-XXXX';
  }

  const companyCode = company.code.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const typeCode = ticketType.code.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const year = new Date().getFullYear();
  const sequence = nextSequence ? nextSequence.toString().padStart(4, '0') : 'XXXX';

  return `${companyCode}-${typeCode}-${year}-${sequence}`;
};

/**
 * Extracts company and type codes from ticket number
 * Useful for filtering and searching
 * @param {string} ticketNumber - Ticket number
 * @returns {Object|null} Company and type codes or null
 */
export const extractCodes = (ticketNumber) => {
  const parsed = parseTicketNumber(ticketNumber);
  if (!parsed) {
    return null;
  }

  return {
    companyCode: parsed.companyCode,
    typeCode: parsed.typeCode
  };
};

/**
 * Generates a ticket number pattern for searching
 * @param {string} companyCode - Company code (optional)
 * @param {string} typeCode - Type code (optional)
 * @param {number} year - Year (optional)
 * @returns {string} Search pattern
 */
export const generateSearchPattern = (companyCode = null, typeCode = null, year = null) => {
  const company = companyCode ? companyCode.toUpperCase().substring(0, 3).padEnd(3, 'X') : 'XXX';
  const type = typeCode ? typeCode.toUpperCase().substring(0, 3).padEnd(3, 'X') : 'XXX';
  const ticketYear = year || new Date().getFullYear();

  return `${company}-${type}-${ticketYear}-XXXX`;
};

/**
 * Ticket number validation rules
 */
export const TICKET_NUMBER_RULES = {
  COMPANY_CODE_LENGTH: 3,
  TYPE_CODE_LENGTH: 3,
  YEAR_LENGTH: 4,
  SEQUENCE_LENGTH: 4,
  SEPARATOR: '-',
  MIN_SEQUENCE: 1,
  MAX_SEQUENCE: 9999,
  MIN_YEAR: 2020,
  MAX_YEAR: 2099
};

/**
 * Validates individual components of a ticket number
 * @param {string} companyCode - Company code
 * @param {string} typeCode - Type code
 * @param {number} year - Year
 * @param {number} sequence - Sequence number
 * @returns {Object} Validation result with errors array
 */
export const validateTicketNumberComponents = (companyCode, typeCode, year, sequence) => {
  const errors = [];

  if (!companyCode || companyCode.length !== TICKET_NUMBER_RULES.COMPANY_CODE_LENGTH) {
    errors.push(`Company code must be exactly ${TICKET_NUMBER_RULES.COMPANY_CODE_LENGTH} characters`);
  }

  if (!typeCode || typeCode.length !== TICKET_NUMBER_RULES.TYPE_CODE_LENGTH) {
    errors.push(`Type code must be exactly ${TICKET_NUMBER_RULES.TYPE_CODE_LENGTH} characters`);
  }

  if (!year || year < TICKET_NUMBER_RULES.MIN_YEAR || year > TICKET_NUMBER_RULES.MAX_YEAR) {
    errors.push(`Year must be between ${TICKET_NUMBER_RULES.MIN_YEAR} and ${TICKET_NUMBER_RULES.MAX_YEAR}`);
  }

  if (!sequence || sequence < TICKET_NUMBER_RULES.MIN_SEQUENCE || sequence > TICKET_NUMBER_RULES.MAX_SEQUENCE) {
    errors.push(`Sequence must be between ${TICKET_NUMBER_RULES.MIN_SEQUENCE} and ${TICKET_NUMBER_RULES.MAX_SEQUENCE}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates multiple ticket number previews for testing
 * @param {Object} company - Company object
 * @param {Object} ticketType - Ticket type object
 * @param {number} count - Number of previews to generate
 * @param {number} startSequence - Starting sequence number
 * @returns {Array} Array of preview ticket numbers
 */
export const generatePreviewSeries = (company, ticketType, count = 5, startSequence = 1) => {
  const previews = [];

  for (let i = 0; i < count; i++) {
    previews.push(generateTicketNumber(company, ticketType, startSequence + i));
  }

  return previews;
};

// Export default object with all functions
export default {
  generateTicketNumber,
  parseTicketNumber,
  generateSequenceKey,
  isValidTicketNumberFormat,
  getSequenceKey,
  previewTicketNumber,
  extractCodes,
  generateSearchPattern,
  validateTicketNumberComponents,
  generatePreviewSeries,
  TICKET_NUMBER_RULES
};