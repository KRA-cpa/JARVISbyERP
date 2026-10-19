/**
 * CSV export for reports (spec 3.4: "Reports will have an option to be exported to CSV").
 * RFC 4180 quoting; cells that a spreadsheet would run as a formula (=, +, -, @, tab, CR) get a leading
 * apostrophe, so an exported ticket title like "=HYPERLINK(...)" stays text (CSV injection).
 */

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * One CSV cell.
 * @param {*} value - Cell value (null / undefined = empty)
 * @returns {string}
 */
export const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  // A plain negative number is data, not a formula
  if (FORMULA_START.test(text) && !/^-\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * CSV text for a table.
 * @param {Array} columns - [{ field_name, display_name }]
 * @param {Array} rows - [{ <field_name>: value }]
 * @returns {string} CRLF line endings (what Excel expects)
 */
export const toCSV = (columns, rows) => {
  const header = columns.map(c => csvCell(c.display_name || c.field_name)).join(',');
  const body = rows.map(row => columns.map(c => csvCell(row[c.field_name])).join(','));
  return [header, ...body].join('\r\n');
};

/**
 * Download a table as a .csv file (UTF-8 with BOM, so Excel shows non-ASCII text correctly).
 * @param {string} fileName - e.g. "report-PR-20261019.csv"
 * @param {Array} columns - [{ field_name, display_name }]
 * @param {Array} rows - [{ <field_name>: value }]
 */
export const downloadCSV = (fileName, columns, rows) => {
  const blob = new Blob(['﻿' + toCSV(columns, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const csvExport = { csvCell, toCSV, downloadCSV };
export default csvExport;
