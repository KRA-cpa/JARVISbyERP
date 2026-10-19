#!/usr/bin/env node
/**
 * check-api-contract.js — every action the frontend sends must have a backend route
 * Rule: docs/guides/GUIDE_CodeReview_Compliance.md A12 / A13
 *
 * Usage:
 *   node scripts/check-api-contract.js [APPSCRIPT file]   check (default: newest appscript_files/APPSCRIPT_v*_<YYYYMMDD>_<HHMM>.txt)
 *   node scripts/check-api-contract.js --update [file]    rewrite the known-gaps list; refuses to add entries
 *                                                         (creates the baseline when the list doesn't exist yet)
 *
 * Frontend side: makeRequest('<action>', ...) calls in src/ (tests skipped). An action is sent by GET
 * when it is in readActions (src/api/googleSheet.js), otherwise by POST.
 * Backend side: case labels inside doGet() and routePostAction().
 *
 * Gap kinds:
 *   missing             no route in doGet or doPost
 *   get-not-in-doGet    sent by GET, routed only in doPost
 *   post-not-in-doPost  sent by POST, routed only in doGet
 *   action-key          the payload has its own `action` key, which overwrites the route name in the POST body
 *   undefined-function  doGet/routePostAction calls a function the AppScript file doesn't define
 *
 * scripts/api-contract-known-gaps.txt lists gaps that are known and not fixed yet. It may only shrink:
 * the check fails on a gap that isn't listed, and on a listed gap that is fixed (remove it from the list).
 * Exit: 0 = matches the list, 1 = new or stale gaps, 2 = usage/parse error.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const API_FILE = path.join(SRC, 'api/googleSheet.js');
const APPSCRIPT_DIR = path.join(ROOT, 'appscript_files');
const KNOWN_GAPS = path.join(__dirname, 'api-contract-known-gaps.txt');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const fileArg = args.find(a => !a.startsWith('--'));

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

// --- Backend ---------------------------------------------------------------

function newestAppScript() {
  const pattern = /^APPSCRIPT_v(\d+)\.(\d+)_(\d{8})_(\d{4})\.txt$/;
  const files = fs.readdirSync(APPSCRIPT_DIR)
    .map(name => ({ name, m: name.match(pattern) }))
    .filter(f => f.m)
    .sort((a, b) => (a.m[3] + a.m[4]).localeCompare(b.m[3] + b.m[4]));
  if (!files.length) fail(`no APPSCRIPT_v<ver>_<YYYYMMDD>_<HHMM>.txt in ${APPSCRIPT_DIR}`);
  return path.join(APPSCRIPT_DIR, files[files.length - 1].name);
}

/** Body of a top-level function: from its declaration to the first line that is just "}". */
function functionBody(text, name) {
  const start = text.search(new RegExp(`^function ${name}\\(`, 'm'));
  if (start === -1) fail(`function ${name}() not found in the AppScript file`);
  const end = text.slice(start).search(/^\}\s*$/m);
  if (end === -1) fail(`end of function ${name}() not found`);
  return text.slice(start, start + end);
}

function caseLabels(body) {
  return new Set([...body.matchAll(/^\s*case '([A-Za-z0-9_]+)':/gm)].map(m => m[1]));
}

// Called in a router but not defined in the file (v8.3 deleteRole called deactivateRole(), which never existed)
const NOT_FUNCTIONS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'typeof', 'new',
  'String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Error', 'JSON', 'Math', 'parseInt', 'parseFloat', 'isNaN']);

function undefinedCalls(text, bodies) {
  const defined = new Set([...text.matchAll(/^(?:function\s+([A-Za-z0-9_$]+)\s*\(|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=)/gm)]
    .map(m => m[1] || m[2]));
  const missing = new Set();
  for (const body of bodies) {
    const code = body.replace(/\/\/.*$/gm, '').replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''");
    for (const m of code.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!NOT_FUNCTIONS.has(m[2]) && !defined.has(m[2])) missing.add(m[2]);
    }
  }
  return missing;
}

// --- Frontend --------------------------------------------------------------

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    if (!/\.jsx?$/.test(entry.name) || /\.test\.jsx?$/.test(entry.name) || entry.name === 'setupTests.js') return [];
    return [full];
  });
}

/** Text of the object literal starting at text[open] === '{' (string-aware brace matching). */
function objectLiteral(text, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if (c === '{') {
      depth++;
    } else if (c === '}' && --depth === 0) {
      return text.slice(open, i + 1);
    }
  }
  return '';
}

/** True when the object literal has a top-level `action:` key. */
function hasActionKey(literal) {
  let depth = 0;
  const lines = literal.split('\n');
  for (const line of lines) {
    if (depth === 1 && /^\s*['"]?action['"]?\s*:/.test(line)) return true;
    depth += (line.match(/[{[(]/g) || []).length - (line.match(/[}\])]/g) || []).length;
  }
  return false;
}

function frontendCalls() {
  const calls = new Map(); // action -> [file:line]
  const actionKeys = new Map();
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    for (const m of text.matchAll(/makeRequest\(\s*'([A-Za-z0-9_]+)'\s*(,\s*)?/g)) {
      const where = `${rel}:${text.slice(0, m.index).split('\n').length}`;
      const action = m[1];
      if (!calls.has(action)) calls.set(action, []);
      calls.get(action).push(where);
      const after = m.index + m[0].length;
      if (m[2] && text[after] === '{' && hasActionKey(objectLiteral(text, after))) {
        if (!actionKeys.has(action)) actionKeys.set(action, []);
        actionKeys.get(action).push(where);
      }
    }
  }
  return { calls, actionKeys };
}

function readActions() {
  const text = fs.readFileSync(API_FILE, 'utf8');
  const m = text.match(/const readActions = \[([\s\S]*?)\];/);
  if (!m) fail(`readActions list not found in ${path.relative(ROOT, API_FILE)}`);
  return new Set([...m[1].replace(/\/\/.*$/gm, '').matchAll(/'([A-Za-z0-9_]+)'/g)].map(x => x[1]));
}

// --- Known gaps ------------------------------------------------------------

function loadKnownGaps() {
  if (!fs.existsSync(KNOWN_GAPS)) return new Set();
  return new Set(fs.readFileSync(KNOWN_GAPS, 'utf8').split('\n')
    .map(line => line.replace(/\r$/, '').replace(/#.*$/, '').trim())
    .filter(Boolean));
}

function writeKnownGaps(gaps, appscriptName) {
  const header = [
    '# Known frontend->backend contract gaps - checked by scripts/check-api-contract.js',
    '# Format: <kind> <action>. This list may only shrink: fix a gap, then remove its line',
    '# (node scripts/check-api-contract.js --update). Never add a line to silence a new gap.',
    `# Last updated against ${appscriptName}`,
    ''
  ];
  fs.writeFileSync(KNOWN_GAPS, header.concat([...gaps].sort(), ['']).join('\n'));
}

// --- Main ------------------------------------------------------------------

const appscriptFile = fileArg ? path.resolve(fileArg) : newestAppScript();
if (!fs.existsSync(appscriptFile)) fail(`${appscriptFile} not found`);
const appscript = fs.readFileSync(appscriptFile, 'utf8').replace(/\r/g, '');
const appscriptName = path.basename(appscriptFile);

const getBody = functionBody(appscript, 'doGet');
const postBody = functionBody(appscript, 'routePostAction');
const getRoutes = caseLabels(getBody);
const postRoutes = caseLabels(postBody);
const gets = readActions();
const { calls, actionKeys } = frontendCalls();

const gaps = new Set();
for (const action of calls.keys()) {
  const inGet = getRoutes.has(action);
  const inPost = postRoutes.has(action);
  if (!inGet && !inPost) gaps.add(`missing ${action}`);
  else if (gets.has(action) && !inGet) gaps.add(`get-not-in-doGet ${action}`);
  else if (!gets.has(action) && !inPost) gaps.add(`post-not-in-doPost ${action}`);
}
for (const action of actionKeys.keys()) gaps.add(`action-key ${action}`);
for (const fn of undefinedCalls(appscript, [getBody, postBody])) gaps.add(`undefined-function ${fn}`);

const known = loadKnownGaps();
const added = [...gaps].filter(g => !known.has(g)).sort();
const fixed = [...known].filter(g => !gaps.has(g)).sort();

console.log(`API contract: ${calls.size} frontend actions, ${getRoutes.size} doGet + ${postRoutes.size} doPost routes (${appscriptName})`);
console.log(`Gaps: ${gaps.size} (${known.size} in known-gaps list)`);

if (UPDATE) {
  // The first run creates the baseline; after that the list may only shrink
  if (added.length && fs.existsSync(KNOWN_GAPS)) {
    console.error('Refusing to update: these gaps are not in the list (fix them; the list may only shrink):');
    added.forEach(g => console.error(`  + ${g}  (${(calls.get(g.split(' ')[1]) || []).join(', ')})`));
    process.exit(1);
  }
  writeKnownGaps(gaps, appscriptName);
  console.log(`Updated ${path.relative(ROOT, KNOWN_GAPS)}: removed ${fixed.length}, ${gaps.size} remain`);
  process.exit(0);
}

if (added.length) {
  console.error('\nNEW gaps (not in the known-gaps list):');
  for (const g of added) {
    const action = g.split(' ')[1];
    const where = (g.startsWith('action-key') ? actionKeys.get(action) : calls.get(action)) || [];
    console.error(`  + ${g}  (${where.join(', ')})`);
  }
}
if (fixed.length) {
  console.error('\nFixed gaps still in the known-gaps list (run with --update to remove them):');
  fixed.forEach(g => console.error(`  - ${g}`));
}
if (added.length || fixed.length) process.exit(1);
console.log('OK: contract matches the known-gaps list');
