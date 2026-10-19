// In-memory fake of the Apps Script runtime (SpreadsheetApp / LockService / ContentService) for offline tests.
// Shared by CODE_REVIEW_FIXES_TEST_v8.3.js and ROUTES_AND_APPROVALS_TEST_v9.0.js.
// makeRuntime(appscriptPath) loads the AppScript file into a vm context and returns helpers to seed and inspect tabs.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function makeRuntime(appscriptPath) {
  const sheets = new Map();
  let lockHeld = false;
  const lockLog = [];

  class Range {
    constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr: nr || 1, nc: nc || 1 }); }
    getValues() {
      const out = [];
      for (let i = 0; i < this.nr; i++) {
        const row = [];
        for (let j = 0; j < this.nc; j++) {
          const v = (this.sheet.rows[this.r - 1 + i] || [])[this.c - 1 + j];
          row.push(v === undefined ? '' : v);
        }
        out.push(row);
      }
      return out;
    }
    setValues(values) {
      assert.strictEqual(values.length, this.nr, 'setValues row count');
      values.forEach((row, i) => {
        assert.strictEqual(row.length, this.nc, 'setValues col count');
        row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, v));
      });
      return this;
    }
    setValue(v) { this.sheet.set(this.r, this.c, v); return this; }
    clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet.set(this.r + i, this.c + j, ''); return this; }
    setFontWeight() { return this; }
    setBackground() { return this; }
    setFontColor() { return this; }
  }

  class Sheet {
    constructor(name) { this.name = name; this.rows = []; this.maxCols = 26; }
    getName() { return this.name; }
    setName(n) { sheets.delete(this.name); this.name = n; sheets.set(n, this); return this; }
    set(r, c, v) {
      // Columns 0 and below don't exist in Sheets - getRange(row, 0) throws there too
      if (c < 1 || r < 1) throw new Error(`Range out of bounds: row ${r}, column ${c}`);
      while (this.rows.length < r) this.rows.push([]);
      const row = this.rows[r - 1];
      while (row.length < c) row.push('');
      row[c - 1] = v;
      if (c > this.maxCols) this.maxCols = c;
    }
    trimmed() {
      const rows = this.rows.map(r => r.slice());
      while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop();
      return rows;
    }
    getLastRow() { return this.trimmed().length; }
    getLastColumn() { return this.trimmed().reduce((m, r) => { let n = r.length; while (n && r[n - 1] === '') n--; return Math.max(m, n); }, 0); }
    getMaxColumns() { return this.maxCols; }
    insertColumnsAfter(after, n) { this.maxCols += n; }
    getDataRange() { return new Range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
    getRange(r, c, nr, nc) {
      if (c < 1 || r < 1) throw new Error(`Range out of bounds: row ${r}, column ${c}`);
      return new Range(this, r, c, nr, nc);
    }
    appendRow(row) { this.rows = this.trimmed(); this.rows.push(row.slice()); }
    deleteRow(r) { this.rows.splice(r - 1, 1); }
    clearContents() { this.rows = []; }
    clear() { this.rows = []; }
    setFrozenRows() {}
    autoResizeColumns() {}
    copyTo() { const s = new Sheet('copy'); s.rows = this.rows.map(r => r.slice()); sheets.set('copy', s); return s; }
  }

  const ss = {
    getSheetByName: name => sheets.get(name) || null,
    insertSheet: name => { if (sheets.has(name)) throw new Error(`sheet ${name} exists`); const s = new Sheet(name); sheets.set(name, s); return s; },
    deleteSheet: s => sheets.delete(s.name),
    getSheets: () => [...sheets.values()]
  };

  const context = {
    console: { log() {}, error() {} },
    Logger: { log() {} },
    SpreadsheetApp: { openById: () => ss },
    Session: { getActiveUser: () => ({ getEmail: () => 'admin@example.com' }) },
    Utilities: { formatDate: (d, tz, fmt) => (fmt === 'yyyy' ? '2026' : '20261017_151000') },
    ContentService: {
      MimeType: { JSON: 'json', TEXT: 'text' },
      createTextOutput: text => ({ text, setMimeType() { return this; } })
    },
    LockService: {
      getScriptLock: () => ({
        // Non-reentrant on purpose: a second waitLock in the same execution must never happen
        waitLock() { if (lockHeld) throw new Error('LOCK ALREADY HELD (would deadlock)'); lockHeld = true; lockLog.push('acquire'); },
        releaseLock() { lockHeld = false; lockLog.push('release'); }
      })
    }
  };
  vm.createContext(context);
  const src = fs.readFileSync(appscriptPath, 'utf8');
  vm.runInContext(src + '\n;this.__TABLE_SCHEMAS = TABLE_SCHEMAS; this.__SHEETS = SHEETS;', context);

  const table = (name, headers, rows = []) => {
    const s = ss.insertSheet(name);
    s.rows = [headers.slice(), ...rows.map(r => r.slice())];
    return s;
  };
  const json = name => {
    const rows = sheets.get(name).trimmed();
    const [h, ...rest] = rows;
    return rest.map(r => Object.fromEntries(h.map((k, i) => [k, r[i] === undefined ? '' : r[i]])));
  };
  const post = body => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  const get = params => JSON.parse(context.doGet({ parameter: params }).text);
  return { ctx: context, ss, sheets, table, json, post, get, lockLog, isLocked: () => lockHeld };
}

const same = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

function makeTestRunner() {
  const results = [];
  function test(name, fn) {
    try { fn(); results.push(`PASS  ${name}`); }
    catch (e) { results.push(`FAIL  ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); process.exitCode = 1; }
  }
  return { test, report: () => console.log(results.join('\n')) };
}

module.exports = { makeRuntime, same, makeTestRunner };
