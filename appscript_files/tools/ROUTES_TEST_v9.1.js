// Usage: node appscript_files/tools/ROUTES_TEST_v9.1.js appscript_files/APPSCRIPT_v9.1_<YYYYMMDD>_<HHMM>.txt
// Offline tests for APPSCRIPT v9.1 (core ticket loop, workflow admin, links, company lock, comment
// requirements, review fixes R-03..R-10) on the fake Sheets runtime.
// Run the older suites on the same file too:
//   node appscript_files/tools/ROUTES_AND_APPROVALS_TEST_v9.0.js <file>
//   node appscript_files/tools/CODE_REVIEW_FIXES_TEST_v8.3.js <file>
const fs = require('fs');
const assert = require('assert');
const lib = require('./lib/fakeSheetsRuntime');

const FILE = process.argv[2];
if (!FILE) {
  console.error('Usage: node ROUTES_TEST_v9.1.js <APPSCRIPT file>');
  process.exit(2);
}
const SRC = fs.readFileSync(FILE, 'utf8').replace(/\r/g, '');
const same = lib.same;
const { test, report } = lib.makeTestRunner();

/**
 * Two companies, one ticket type, a 2-step workflow for co_1 (Manager -> Finance, SLA on step 2):
 *   u_mgr: Manager in co_1   u_fin: Finance in co_1   u_admin: System Admin   u_req: requester (profile only)
 */
function seed() {
  const rt = lib.makeRuntime(FILE);
  rt.ctx.rebuildAllTablesApply();
  const S = rt.ctx.__TABLE_SCHEMAS;
  const add = (tableName, record) => rt.sheets.get(tableName).appendRow(rt.ctx.rowFromRecord(S[tableName], record));
  const rows = tableName => rt.ctx.readTable(tableName).records;

  add('companies', { id: 'co_1', name: 'Co', code: 'MYCO', is_active: true });
  add('companies', { id: 'co_2', name: 'Other', code: 'OTH', is_active: true });
  add('ticket_types', { id: 'tt_1', code: 'PR', name: 'Purchase', is_active: true });
  add('roles', { id: 'r_mgr', name: 'Manager', company_id: '', is_active: true });
  add('roles', { id: 'r_fin', name: 'Finance', company_id: 'co_1', is_active: true });
  add('roles', { id: 'r_admin', name: 'System Admin', company_id: '', is_active: true });
  add('workflow_steps', { id: 'ws_1', ticket_type_id: 'tt_1', company_id: 'co_1', name: 'Manager Approval',
    status_on_reach: 'Pending Manager', step_type: 'approval', approver_logic: 'any', sort_order: 1, is_active: true });
  add('workflow_steps', { id: 'ws_2', ticket_type_id: 'tt_1', company_id: 'co_1', name: 'Finance Approval',
    status_on_reach: 'Pending Finance', step_type: 'approval', approver_logic: 'any', sort_order: 2, is_active: true });
  add('step_approvers', { step_id: 'ws_1', role_id: 'r_mgr' });
  add('step_approvers', { step_id: 'ws_2', role_id: 'r_fin' });
  add('step_slas', { id: 'sla_2', step_id: 'ws_2', duration: '24', unit: 'hours', exclude_weekends: false, is_active: true });
  add('step_conditions', { id: 'sc_1', step_id: 'ws_1', custom_field_id: 'cf_amt', operator: '>=', value: '5000',
    next_step_id: 'ws_2', company_id: 'co_1', is_active: true });
  add('custom_fields', { id: 'cf_amt', ticket_type_id: 'tt_1', entity_category: 'ticket', name: 'amount', label: 'Amount',
    type: 'amount', is_required: false, is_hidden: false, sort_order: 1, is_active: true });
  add('custom_fields', { id: 'cf_note', ticket_type_id: 'tt_1', entity_category: 'ticket', name: 'note', label: 'Note',
    type: 'text', is_required: false, is_hidden: false, sort_order: 2, is_active: true });

  const assign = p => {
    const res = rt.ctx.createUserRoleAssignment(p);
    assert.strictEqual(res.status, 'success', res.message);
    return res.data;
  };
  assign({ user_id: 'u_mgr', role_id: 'r_mgr', company_id: 'co_1' });
  assign({ user_id: 'u_fin', role_id: 'r_fin', company_id: 'co_1' });
  assign({ user_id: 'u_admin', role_id: 'r_admin', company_id: 'co_1' });

  const createTicket = (extra = {}) => {
    const res = rt.post({ action: 'createTicket', title: 'Laptop', ticket_type_id: 'tt_1', requester_id: 'u_req', company_id: 'co_1', ...extra });
    assert.strictEqual(res.success, true, res.error);
    return String(res.data.id);
  };
  const ticket = id => rt.ctx.getTicketById(id).data;
  const company = id => rt.ctx.findRecord('companies', id).record;
  const approve = (ticketId, userId, decision = 'approve', extra = {}) =>
    rt.post({ action: 'submitStepApproval', ticket_id: ticketId, user_id: userId, decision, comment: 'ok', ...extra });

  return { rt, add, rows, assign, createTicket, ticket, company, approve };
}

/** Case labels of a router function in the source. */
function routes(fnName) {
  const start = SRC.search(new RegExp(`^function ${fnName}\\(`, 'm'));
  const end = SRC.slice(start).search(/^\}\s*$/m);
  return [...SRC.slice(start, start + end).matchAll(/^\s*case '([A-Za-z0-9_]+)':/gm)].map(m => m[1]);
}

test('version 9.1 and the v9.1 routes: reads in doGet, writes in routePostAction', () => {
  assert.match(SRC, /^ \* Version: 9\.1 /m);
  assert.match(SRC, /^const API_VERSION = '9\.1\.0';/m);
  assert.match(SRC, /Deploy description: v9\.1 \d{8}_\d{4} - /);
  const gets = ['getNextTicketNumber', 'getTicketType', 'getCustomField', 'getTicketLinks', 'validateTicketDependencies',
    'checkCompanyLockStatus', 'getCommentRequirements', 'getTicketHistory', 'getTicketsForApproval'];
  const posts = ['generateTicketNumber', 'createWorkflowStep', 'updateWorkflowStep', 'deleteWorkflowStep', 'copyWorkflowSteps',
    'createDefaultWorkflow', 'updateCustomField', 'deleteCustomField', 'createTicketLink', 'deleteTicketLink',
    'lockCompany', 'unlockCompany', 'saveCommentRequirements'];
  const doGet = routes('doGet');
  const doPost = routes('routePostAction');
  same(gets.filter(a => !doGet.includes(a)), []);
  same(posts.filter(a => !doPost.includes(a)), []);
  assert.strictEqual(seed().rt.get({ action: 'ping' }).version, '9.1.0');
});

test('updateCompany writes by header: lock columns survive an edit; a locked code cannot change', () => {
  const { rt, createTicket, company } = seed();
  createTicket();
  const before = company('co_1');
  assert.strictEqual(before.code_locked, true);

  const renamed = rt.post({ action: 'updateCompany', id: 'co_1', name: 'Co Renamed', code: 'MYCO' });
  assert.strictEqual(renamed.success, true, renamed.error);
  const after = company('co_1');
  same([after.name, after.code_locked, after.code_locked_at, after.code_locked_reason, after.ticket_count],
    ['Co Renamed', true, before.code_locked_at, 'first_ticket_created', 1]);

  const recode = rt.post({ action: 'updateCompany', id: 'co_1', name: 'Co', code: 'NEW' });
  assert.strictEqual(recode.success, false);
  assert.match(recode.error, /locked/);
  assert.strictEqual(company('co_1').code, 'MYCO');

  const unlocked = company('co_2');
  const ok = rt.post({ action: 'updateCompany', id: 'co_2', name: 'Other', code: 'oth2' });
  assert.strictEqual(ok.success, true, ok.error);
  same([company('co_2').code, unlocked.code_locked], ['OTH2', '']);
});

test('createTicket keeps description / priority / customData, counts tickets and locks the code once', () => {
  const { rt, createTicket, ticket, company, rows } = seed();
  const id = createTicket({ description: 'For the new hire', priority: 'High', customData: { cf_amt: 1200 } });
  same([ticket(id).description, ticket(id).priority, ticket(id).created_by, ticket(id).current_step_id],
    ['For the new hire', 'High', 'u_req', 'ws_1']);
  const values = rows('custom_field_values').filter(v => String(v.ticket_id) === id);
  same(values.map(v => [v.custom_field_id, v.number_value || v.text_value]), [['cf_amt', 1200]]);

  const first = company('co_1');
  same([first.ticket_count, first.code_locked, first.code_locked_reason], [1, true, 'first_ticket_created']);
  const id2 = createTicket();
  assert.notStrictEqual(id2, id);
  same([company('co_1').ticket_count, company('co_1').code_locked_at], [2, first.code_locked_at]);
  assert.strictEqual(rt.get({ action: 'checkCompanyLockStatus', id: 'co_1' }).data.ticket_count, 2);
});

test('ticket numbers: peek does not reserve, generate does; getTicketType', () => {
  const { rt } = seed();
  const peek = () => rt.get({ action: 'getNextTicketNumber', company_id: 'co_1', ticket_type_id: 'tt_1' }).data.ticket_number;
  assert.strictEqual(peek(), 'MYCO-PR-2026-00000001');
  assert.strictEqual(peek(), 'MYCO-PR-2026-00000001');
  const reserved = rt.post({ action: 'generateTicketNumber', company_id: 'co_1', ticket_type_id: 'tt_1' });
  assert.strictEqual(reserved.data.ticket_number, 'MYCO-PR-2026-00000001');
  assert.strictEqual(peek(), 'MYCO-PR-2026-00000002');
  assert.strictEqual(rt.get({ action: 'getNextTicketNumber', company_id: 'co_1', ticket_type_id: 'nope' }).success, false);
  assert.strictEqual(rt.get({ action: 'getTicketType', ticket_type_id: 'tt_1' }).data.code, 'PR');
});

test('workflow steps: create with SLA (unique ids), SLA shown / updated / removed, company required', () => {
  const { rt, rows } = seed();
  const base = { ticket_type_id: 'tt_1', company_id: 'co_2', status_on_reach: 'Pending', step_type: 'approval' };
  const a = rt.post({ action: 'createWorkflowStep', ...base, name: 'A', sort_order: 1, sla_duration: 8, sla_unit: 'hours', exclude_weekends: true });
  const b = rt.post({ action: 'createWorkflowStep', ...base, name: 'B', sort_order: 2 });
  assert.strictEqual(a.success, true, a.error);
  assert.notStrictEqual(a.data.id, b.data.id);

  const listed = rt.get({ action: 'getWorkflowSteps', ticket_type_id: 'tt_1', company_id: 'co_2' }).data;
  same(listed.map(s => [s.name, s.sla_duration, s.sla_unit, s.exclude_weekends]), [['A', 8, 'hours', true], ['B', '', '', false]]);

  const upd = rt.post({ action: 'updateWorkflowStep', step_id: a.data.id, name: 'A2', sla_duration: 2, sla_unit: 'days', exclude_weekends: false });
  assert.strictEqual(upd.success, true, upd.error);
  assert.strictEqual(rows('step_slas').filter(s => s.step_id === a.data.id).length, 1, 'SLA updated in place');
  const removed = rt.post({ action: 'updateWorkflowStep', step_id: a.data.id, sla_duration: '' });
  assert.strictEqual(removed.success, true, removed.error);
  assert.strictEqual(rt.ctx.getStepSLAs(a.data.id).data.length, 0);

  assert.strictEqual(rt.post({ action: 'createWorkflowStep', ...base, company_id: '', name: 'X' }).success, false);
  assert.strictEqual(rt.post({ action: 'createWorkflowStep', ...base, name: 'X', sla_duration: -1, sla_unit: 'hours' }).success, false);
});

test('deleteWorkflowStep is refused while an open ticket sits on the step', () => {
  const { rt, createTicket } = seed();
  const id = createTicket();
  const refused = rt.post({ action: 'deleteWorkflowStep', step_id: 'ws_1' });
  assert.strictEqual(refused.success, false);
  assert.match(refused.error, /open ticket/);
  rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', comment: 'x', user_id: 'u_req' });
  const deleted = rt.post({ action: 'deleteWorkflowStep', step_id: 'ws_2' });
  assert.strictEqual(deleted.success, true, deleted.error);
  assert.strictEqual(rt.ctx.getStepSLAs('ws_2').data.length, 0);
  same(rt.get({ action: 'getWorkflowSteps', ticket_type_id: 'tt_1', company_id: 'co_1' }).data.map(s => s.id), ['ws_1']);
});

test('copyWorkflowSteps copies steps, approvers, SLAs and conditions with remapped ids; refuses a non-empty target', () => {
  const { rt, rows } = seed();
  const res = rt.post({ action: 'copyWorkflowSteps', ticket_type_id: 'tt_1', source_company_id: 'co_1', target_company_id: 'co_2' });
  assert.strictEqual(res.success, true, res.error);
  same([res.data.copied_steps, res.data.approvers, res.data.slas, res.data.conditions], [2, 2, 1, 1]);

  const copied = rt.get({ action: 'getWorkflowSteps', ticket_type_id: 'tt_1', company_id: 'co_2' }).data;
  same(copied.map(s => [s.name, s.sla_duration]), [['Manager Approval', ''], ['Finance Approval', 24]]);
  const map = res.data.step_id_map;
  same(rows('step_approvers').filter(a => a.step_id === map.ws_2).map(a => a.role_id), ['r_fin']);
  const condition = rows('step_conditions').find(c => c.step_id === map.ws_1);
  same([condition.next_step_id, condition.company_id], [map.ws_2, 'co_2']);

  const again = rt.post({ action: 'copyWorkflowSteps', ticket_type_id: 'tt_1', source_company_id: 'co_1', target_company_id: 'co_2' });
  assert.strictEqual(again.success, false);
  assert.match(again.error, /already has 2/);
  assert.strictEqual(rt.post({ action: 'copyWorkflowSteps', ticket_type_id: 'tt_1', source_company_id: 'co_1', target_company_id: 'co_1' }).success, false);
});

test('createDefaultWorkflow makes one editable approval step, only when there are none', () => {
  const { rt } = seed();
  const res = rt.post({ action: 'createDefaultWorkflow', ticket_type_id: 'tt_1', company_id: 'co_2' });
  assert.strictEqual(res.success, true, res.error);
  same([res.data.name, res.data.step_type, res.data.approver_logic], ['For Approval of Approver (1)', 'approval', 'any']);
  assert.strictEqual(rt.post({ action: 'createDefaultWorkflow', ticket_type_id: 'tt_1', company_id: 'co_2' }).success, false);
  assert.strictEqual(rt.post({ action: 'createDefaultWorkflow', ticket_type_id: 'tt_1', company_id: 'co_1' }).success, false);
});

test('custom fields: getCustomFields keys (R-07), get, update by header, delete hides a field in use', () => {
  const { rt, createTicket } = seed();
  const list = rt.get({ action: 'getCustomFields', ticket_type_id: 'tt_1' });
  assert.ok(Array.isArray(list.data), 'data is the array (unwrapped)');
  same(list.data.map(f => f.id), ['cf_amt', 'cf_note']);
  same(rt.get({ action: 'getCustomFields', entityTypeId: 'tt_1', entityCategory: 'ticket' }).data.length, 2);
  assert.strictEqual(rt.get({ action: 'getCustomField', field_id: 'cf_amt' }).data.label, 'Amount');

  const upd = rt.post({ action: 'updateCustomField', field_id: 'cf_note', label: 'Notes', is_required: true });
  assert.strictEqual(upd.success, true, upd.error);
  const note = rt.ctx.findRecord('custom_fields', 'cf_note').record;
  same([note.label, note.is_required, note.entity_category, note.name, note.ticket_type_id], ['Notes', true, 'ticket', 'note', 'tt_1']);

  createTicket({ customData: { cf_amt: 10 } });
  const hidden = rt.post({ action: 'deleteCustomField', field_id: 'cf_amt' });
  same([hidden.success, hidden.data.hidden, rt.ctx.findRecord('custom_fields', 'cf_amt').record.is_hidden], [true, true, true]);
  const deleted = rt.post({ action: 'deleteCustomField', field_id: 'cf_note' });
  same([deleted.data.deleted, rt.ctx.findRecord('custom_fields', 'cf_note').record.entity_category], [true, 'ticket']);
  same(rt.get({ action: 'getCustomFields', ticket_type_id: 'tt_1' }).data.map(f => f.id), ['cf_amt']);
});

test('ticket links: by number, no self / duplicate / cycle; list with numbers; validate; soft delete', () => {
  const { rt, createTicket, ticket, add } = seed();
  const [a, b, c] = [createTicket(), createTicket(), createTicket()].map(id => ticket(id).ticket_number);
  const link = (parent, child, type = 'blocks') =>
    rt.post({ action: 'createTicketLink', parent_ticket_number: parent, child_ticket_number: child, link_type: type, enforce_blocking_rules: true });

  const ab = link(a, b);
  assert.strictEqual(ab.success, true, ab.error);
  assert.strictEqual(link(b, c).success, true);
  assert.match(link(a, a).error, /itself/);
  assert.match(link(a, b).error, /already/);
  const cycle = link(c, a);
  assert.strictEqual(cycle.success, false);
  assert.match(cycle.error, /circular/);
  assert.strictEqual(link(c, a, 'related_to').success, true, 'non-blocking links may point back');

  const forB = rt.get({ action: 'getTicketLinks', ticket_number: b }).data;
  same(forB.map(l => [l.parent_ticket_number, l.child_ticket_number, l.enforce_blocking_rules]).sort(), [[a, b, true], [b, c, true]]);
  assert.strictEqual(rt.get({ action: 'getTicketLinks', ticket_number: a, include_linked: 'true' }).data.length, 3);

  assert.strictEqual(rt.get({ action: 'validateTicketDependencies' }).data.validation_passed, true);
  // A cycle written directly to the sheet (older versions had no check) and a link to a missing ticket
  add('ticket_links', { id: 'tl_raw', parent_ticket_id: ticket(String(3)).id, child_ticket_id: 1, link_type: 'depends_on', is_active: true });
  add('ticket_links', { id: 'tl_orphan', parent_ticket_id: 1, child_ticket_id: 999, link_type: 'related_to', is_active: true });
  const report = rt.get({ action: 'validateTicketDependencies' }).data;
  same([report.validation_passed, report.circular_dependencies.length, report.orphaned_tickets.map(o => o.link_id)], [false, 1, ['tl_orphan']]);

  const del = rt.post({ action: 'deleteTicketLink', link_id: ab.data.id });
  assert.strictEqual(del.success, true, del.error);
  assert.ok(!rt.get({ action: 'getTicketLinks', ticket_number: a }).data.some(l => l.id === ab.data.id));
});

test('company code lock / unlock (reason required) / status; repairCompanyLocks dry run then apply', () => {
  const { rt, add, company } = seed();
  same(rt.get({ action: 'checkCompanyLockStatus', id: 'co_2' }).data.code_locked, false);
  assert.strictEqual(rt.post({ action: 'lockCompany', id: 'co_2', reason: 'audit' }).success, true);
  assert.strictEqual(rt.get({ action: 'checkCompanyLockStatus', id: 'co_2' }).data.code_locked_reason, 'audit');
  assert.match(rt.post({ action: 'unlockCompany', id: 'co_2', reason: ' ' }).error, /reason/);
  assert.strictEqual(rt.post({ action: 'unlockCompany', id: 'co_2', reason: 'rebrand', user_id: 'u_admin' }).success, true);
  same(rt.get({ action: 'checkCompanyLockStatus', id: 'co_2' }).data.code_locked, false);

  // A row the old updateCompany corrupted (dates in the lock columns) with tickets but no lock
  add('companies', { id: 'co_3', name: 'Old', code: 'OLD', code_locked: '2025-09-01T00:00:00.000Z',
    code_locked_at: '2026-01-05T00:00:00.000Z', ticket_count: '', is_active: true });
  add('tickets', { id: 50, ticket_number: 'OLD-PR-2026-00000001', ticket_type_id: 'tt_1', company_id: 'co_3',
    status: 'New', created_at: '2026-02-01T00:00:00.000Z', is_active: true });
  const dry = rt.ctx.repairCompanyLocks(false);
  const entry = dry.data.changes.find(c => c.company_id === 'co_3');
  same([entry.after.code_locked, entry.after.ticket_count, entry.after.code_locked_reason], [true, 1, 'first_ticket_created (repair)']);
  assert.strictEqual(company('co_3').code_locked, '2025-09-01T00:00:00.000Z', 'dry run writes nothing');
  rt.ctx.repairCompanyLocksApply();
  same([company('co_3').code_locked, company('co_3').ticket_count, company('co_3').code_locked_at], [true, 1, '2026-02-01T00:00:00.000Z']);
  assert.strictEqual(rt.ctx.repairCompanyLocks(false).data.changes.length, 0, 'repair is idempotent');
});

test('comment requirements: save / get (company row wins), enforced on reject and cancel', () => {
  const { rt, createTicket, approve } = seed();
  const saved = rt.post({ action: 'saveCommentRequirements', ticket_type_id: 'tt_1', require_on_reject: true, require_on_cancel: true });
  assert.strictEqual(saved.success, true, saved.error);
  const got = rt.get({ action: 'getCommentRequirements', ticket_type_id: 'tt_1', company_id: 'co_1' }).data;
  same([got.source, got.require_on_reject, got.require_on_approve], ['global', true, false]);
  rt.post({ action: 'saveCommentRequirements', ticket_type_id: 'tt_1', company_id: 'co_2', require_on_reject: false });
  same(rt.get({ action: 'getCommentRequirements', ticket_type_id: 'tt_1', company_id: 'co_2' }).data.source, 'company');

  const id = createTicket();
  const noComment = approve(id, 'u_mgr', 'reject', { comment: ' ' });
  assert.strictEqual(noComment.success, false);
  assert.match(noComment.error, /comment is required to reject/);
  assert.strictEqual(approve(id, 'u_mgr', 'approve', { comment: '' }).success, true, 'approve needs none');
  assert.match(rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', user_id: 'u_req' }).error, /comment is required to cancel/);
  assert.strictEqual(rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', comment: 'dup', user_id: 'u_req' }).success, true);
});

test('getTicketHistory (string id from GET) newest first; approver inbox follows the workflow', () => {
  const { rt, createTicket, approve } = seed();
  const id = createTicket();
  const inbox = user => rt.get({ action: 'getTicketsForApproval', user_id: user }).data.map(t => [String(t.id), t.current_step_name]);
  same(inbox('u_mgr'), [[id, 'Manager Approval']]);
  same(inbox('u_fin'), []);
  assert.strictEqual(approve(id, 'u_mgr').success, true);
  same([inbox('u_mgr'), inbox('u_fin')], [[], [[id, 'Finance Approval']]]);
  same(inbox('u_nobody'), []);

  const history = rt.get({ action: 'getTicketHistory', ticket_id: id }).data;
  assert.ok(history.length >= 3, 'created, workflow started, approved');
  assert.strictEqual(history[0].action, 'APPROVED');
});

test("R-03: under 'all' a partial approver can still reject; R-06: a reopen to the same step is a new visit", () => {
  const { rt, createTicket, ticket, approve, assign } = seed();
  const steps = rt.sheets.get('workflow_steps');
  steps.set(2, rt.ctx.__TABLE_SCHEMAS.workflow_steps.indexOf('approver_logic') + 1, 'all');
  rt.sheets.get('step_approvers').appendRow(['ws_1', 'r_fin']);   // ws_1 needs Manager AND Finance
  const id = createTicket();

  assert.strictEqual(approve(id, 'u_mgr').data.partial, true);
  const check = rt.post({ action: 'canUserApprove', user_id: 'u_mgr', step_id: 'ws_1', ticket_id: id }).data;
  same([check.can_approve, check.can_act], [false, true]);
  same(rt.get({ action: 'getTicketsForApproval', user_id: 'u_mgr' }).data, []);
  assert.strictEqual(approve(id, 'u_mgr', 'reject', { comment: 'wrong vendor' }).success, true);
  assert.strictEqual(ticket(id).status, 'Rejected');

  // Admin reopens to the same step: the earlier partial approval no longer counts
  assert.strictEqual(rt.post({ action: 'updateTicketStatus', id, status: 'Reopened', user_id: 'u_admin' }).success, true);
  assert.strictEqual(ticket(id).current_step_id, 'ws_1');
  const after = rt.post({ action: 'canUserApprove', user_id: 'u_mgr', step_id: 'ws_1', ticket_id: id }).data;
  same([after.can_approve, after.approved_role_ids], [true, []]);
  void assign;
});

test('R-04: a ticket returned from the first step can be resubmitted by its requester', () => {
  const { rt, createTicket, ticket, approve } = seed();
  const id = createTicket();
  assert.strictEqual(approve(id, 'u_mgr', 'return', { comment: 'add quote' }).success, true);
  same([ticket(id).status, ticket(id).current_step_id], ['Returned to Requester', '']);
  const resubmit = rt.post({ action: 'updateTicketStatus', id, status: 'Reopened', user_id: 'u_req' });
  assert.strictEqual(resubmit.success, true, resubmit.error);
  same([ticket(id).status, ticket(id).current_step_id], ['Pending Manager', 'ws_1']);
});

test('R-05: cancel = requester or admin, reopen = admin, user_id required', () => {
  const { rt, createTicket, approve } = seed();
  const id = createTicket();
  assert.match(rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', comment: 'x' }).error, /user_id/);
  assert.match(rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', comment: 'x', user_id: 'u_fin' }).error, /requester or an admin/);
  assert.strictEqual(rt.post({ action: 'updateTicketStatus', id, status: 'Cancelled', comment: 'x', user_id: 'u_admin' }).success, true);
  assert.match(rt.post({ action: 'updateTicketStatus', id, status: 'Reopened', user_id: 'u_req' }).error, /Only an admin/);
  assert.strictEqual(rt.post({ action: 'updateTicketStatus', id, status: 'Reopened', user_id: 'u_admin' }).success, true);
  void approve;
});

test('R-10: a company-specific role cannot be assigned in another company', () => {
  const { rt } = seed();
  const res = rt.ctx.createUserRoleAssignment({ user_id: 'u_x', role_id: 'r_fin', company_id: 'co_2' });
  assert.strictEqual(res.status, 'error');
  assert.match(res.message, /belongs to another company/);
  assert.strictEqual(rt.ctx.createUserRoleAssignment({ user_id: 'u_x', role_id: 'r_mgr', company_id: 'co_2' }).status, 'success');
  assert.strictEqual(rt.ctx.createUserRoleAssignment({ user_id: 'u_x', role_id: 'r_none', company_id: 'co_2' }).status, 'error');
});

test('rebuild: ticket_links gains the v9.1 columns and existing rows default to false', () => {
  const rt = lib.makeRuntime(FILE);
  rt.ctx.rebuildAllTablesApply();
  const S = rt.ctx.__TABLE_SCHEMAS;
  const old = S.ticket_links.filter(h => !['enforce_blocking_rules', 'sync_status', 'notify_on_update'].includes(h));
  const sheet = rt.sheets.get('ticket_links');
  sheet.clear();
  sheet.appendRow(old);
  sheet.appendRow(old.map(h => (h === 'id' ? 'tl_old' : h === 'is_active' ? true : '')));
  rt.ctx.rebuildAllTablesApply();
  const link = rt.ctx.readTable('ticket_links').records[0];
  same([link.id, link.enforce_blocking_rules, link.sync_status, link.notify_on_update], ['tl_old', false, false, false]);
});

report();
