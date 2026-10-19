<!--
===============================================================================
JARVISbyERP — TICKETING & WORKFLOW ORCHESTRATION SYSTEM
===============================================================================
Document: GUIDE_CodeReview_Compliance.md | Author: Kenneth R. Advento | Version: 1.2.0
Created: 18 October 2026 UTC+8 (Philippine Standard Time) | Modified: 19 October 2026 UTC+8 (Philippine Standard Time)
Purpose: Coding rules derived from the 17 Oct 2026 code review (CR-01–CR-13 + X-1–X-6), so new AppScript and script changes don't reintroduce them | Status: Active — MANDATORY for AppScript and scripts/ changes

REVISION HISTORY:
- v1.0.0 | 18 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Initial rules A1–A11, S1–S9, P1–P4 from docs/planning/TODO_CodeReview_20261017.md
- v1.1.0 | 19 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | A11 step 2: header carries a `Deploy description:` line to paste at redeploy
- v1.2.0 | 19 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | A12 contract check (49 frontend actions had no route; 3 routes called functions that never existed), A13 no payload key `action`, A11 ping reports API_VERSION; P1 amended (diff-scoped review + contract check), P5 done = reachable
===============================================================================
-->

# GUIDE — Code Review Compliance

> **Source:** `docs/planning/TODO_CodeReview_20261017.md` (findings and fixes). **Reference implementation:** `appscript_files/APPSCRIPT_v8.3_20261017_1510.txt` and `scripts/` v1.1.
> **Use it:** read the rules for the area you're changing, then tick the §4 checklist before committing.
> Each rule names the finding that motivated it. If a rule blocks something legitimate, change the rule here (new version) instead of ignoring it.

---

## §1 AppScript Rules (A1–A11)

### A1 — Write rows by header name, never by position *(CR-01, X-3)*

Positional arrays break as soon as `TABLE_SCHEMAS` adds or moves a column. The value shifts into the neighbouring column without any error.

```javascript
// ✅ Do
const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
sheet.appendRow(rowFromRecord(headers, { id, ticket_id, entity_category: 'ticket', custom_field_id, text_value }));

// ✅ Update = read the record, change fields, write the whole row back by header
const record = { ...currentValue, text_value: 'new', updated_at: ts };
sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowFromRecord(headers, record)]);

// ❌ Don't
sheet.appendRow([valueId, ticketId, fieldId, value, null, null, null]);
```

**Legacy exception.** These positional writers still exist. Their column order is pinned as the first columns of `TABLE_SCHEMAS`, so **never reorder or insert columns in front of these prefixes**:

| Writer | Table | Pinned prefix |
|---|---|---|
| `createTicket()` | `tickets` | first 11 columns |
| `logTicketHistory()` | `ticket_history` | first 6 |
| `logTicketAction()` | `ticket_action_logs` | all 6 |
| `logLogin()`, `logAdminAction()` | `admin_action_logs` | all 7 |
| `generateTicketNumber()` | `sequence_counters` | both columns |

New code must not add to this list.

### A2 — `TABLE_SCHEMAS` is the only header list *(CR-04)*

- New table or column → edit `TABLE_SCHEMAS`, adding new columns **at the end**.
- Create or initialize a tab only through `ensureTableSheet(SHEETS.X)`. An `initialize*Sheet()` function is a one-line wrapper around it.
- ❌ No `const headers = [...]` in init, reset or migration functions.
- Check: after `cleanResetAllTables()` or any init, `rebuildAllTables()` (dry run) reports **0 repaired**.

### A3 — New columns that existing rows need get a `COLUMN_DEFAULTS` entry *(CR-02)*

When a filter depends on a new column (e.g. `row.entity_category === 'ticket'`), existing rows must get a value when the rebuild adds that column. Otherwise they silently disappear from results.

```javascript
const COLUMN_DEFAULTS = {
  custom_fields: { entity_category: 'ticket' },
  custom_field_values: { entity_category: 'ticket' }
  // your_table: { your_new_column: 'value' }
};
```

The dry run shows them as `defaulted: [...]`. Review that line before applying.

### A4 — Never clear data outside an explicit, editor-only reset *(CR-05, X-4)*

- Init functions are **idempotent**: a tab that already has rows is left unchanged (`ensureTableSheet` does this).
- ❌ No `sheet.clear()` / `clearContents()` / `deleteSheet()` in anything `doPost` or `doGet` can reach.
- Seeding functions check first and skip when data exists (see `createUserManagementTestData`).
- Destructive tools (`cleanResetAllTables`, `completeSystemReset`, migrations) are run **from the editor only**, never routed.

### A5 — Every write runs under `withScriptLock` *(CR-03)*

- `doPost` already locks every action except `POST_READ_ONLY_ACTIONS`. Add a new **read-only** POST action to that list. Never add an action that writes.
- Code outside `doPost` that writes and must not interleave with the rebuild (triggers, editor jobs) wraps its work in `withScriptLock(() => …)`.
- ❌ Don't call `LockService.getScriptLock()` directly. A second `waitLock` inside a locked call can deadlock or release the outer lock early. `withScriptLock` is re-entrant.

### A6 — Report failures as failures *(CR-07)*

Many handlers return `{ status: 'error', message }` instead of throwing. Route them through `createHandlerResponse(result)`:

```javascript
// ✅ Do
case 'deleteRoleType':
  return createHandlerResponse(deactivateRecord(SHEETS.ROLE_TYPES, id, reason));

// ❌ Don't — reports success even when result.status === 'error'
return createJsonResponse({ success: true, data: deactivateRecord(...) });
```

New handlers should **throw** on failure (`doPost` turns that into `success: false`), or return `{ status: 'error' }` and use `createHandlerResponse`. The frontend only throws on a top-level `status: 'error'` (`src/api/googleSheet.js` `makeRequest`).

### A7 — Match the request keys the frontend actually sends *(X-2)*

Before writing or changing a `doPost` case, open the matching method in `src/api/googleSheet.js` and use its exact keys. Example: the frontend sends `user_profile_type_id` / `role_type_id`, not `id`. When names differ, accept both (`data.id || data.role_type_id`).

### A8 — Compare ids as strings *(CR-07)*

Sheets returns numbers for numeric cells, and requests may send strings. Use `String(row[idIndex]) === String(id)`, never a bare `===` between a cell and a request value.

### A9 — `logAdminAction`: use the 5-argument form *(CR-06, X-1)*

```javascript
logAdminAction(getCurrentUserId(), 'CREATE_ROLE_TYPE', 'role_type', roleTypeId, { name, code });
//             admin_user_id       action_type         target_entity target_id   details
```

The 3-argument form `(actionType, targetId, details)` is still accepted for old callers, but it logs `target_entity = 'ENTITY'`.

### A10 — `getSheetByName` returns `null`; it doesn't throw *(X-4)*

```javascript
// ✅ Do
const sheet = ss.getSheetByName(name) || ensureTableSheet(name);

// ❌ Don't — the catch never runs, so sheet stays null
try { sheet = ss.getSheetByName(name); } catch (e) { sheet = ss.insertSheet(name); }
```

### A11 — Every change is a new timestamped file, tested offline *(process)*

1. Copy the latest file to `APPSCRIPT_v<ver>_<YYYYMMDD>_<HHMM>.txt` (UTC+8). Never edit an older version.
2. Update the header block: `Version:`, a `Phase` line listing the changes, `Last Updated`, and a `Deploy description:` line to paste into **Deploy → Manage deployments → ✏️ Edit → Version: New version → Description** when redeploying. Format: `v<ver> <YYYYMMDD_HHMM> - <short summary>`, with the same timestamp as the file name, kept under about 100 characters:
   ```
    * Deploy description: v8.4 20261019_0500 - is_active writable for user profile / role types
    *   (paste at redeploy: Deploy > Manage deployments > Edit > New version > Description)
   ```
   The description is how a deployment is traced back to its file. From v9.0, `ping` reports the `API_VERSION` constant at the top of the file too (it was stuck at `8.0.0` through v8.3): bump it with the header `Version:` line; the v9.0 offline test fails when they differ.
3. Run the offline test (no Google access needed). Add a test for any new behaviour:
   ```bash
   node appscript_files/tools/CODE_REVIEW_FIXES_TEST_v8.3.js appscript_files/APPSCRIPT_v<new>.txt
   ```
   It runs the file against an in-memory fake of `SpreadsheetApp` / `LockService`. The fake lock throws if it's taken twice in one execution, which proves the locking is re-entrant.
4. Keep the CRLF line endings and the file's trailing-newline state the same as the previous version, so `git diff` shows only real changes.

### A12 — Every action the frontend sends has a route *(19 Oct 2026 contract diff)*

Until v9.0, 49 of the 84 actions `src/api/googleSheet.js` sends had no `case` in `doGet` / `routePostAction`. Three routes (`deleteRole`, `deleteDropdownList`, `deleteTicketType`) called functions that never existed. Nobody noticed: unknown actions answered `success: false` without `status: 'error'`, `makeRequest` only threw on `status: 'error'`, and development fell back to mock data.

```bash
npm run check:api-contract        # newest APPSCRIPT_v*.txt; or: node scripts/check-api-contract.js <file>
```

- It checks: no route; sent by GET but only in doPost (and the reverse); a router case calling an undefined function; a payload with an `action` key (A13).
- `scripts/api-contract-known-gaps.txt` lists the gaps that are known and not fixed yet. It **may only shrink**: fix a gap, then `node scripts/check-api-contract.js --update`. Never add a line to silence a new gap. `--update` refuses to add.
- A new frontend action ships with its backend route **in the same batch**. A new GET action goes into both `readActions` and `doGet`.
- Unknown actions and handler failures return `success: false` **and** `status: 'error'` (doGet too, via `createHandlerResponse` / `createDataResponse`), and `makeRequest` throws on either. Never answer a failure with `success: true`.

### A13 — No payload key named `action` *(19 Oct 2026, approve button)*

`makeRequest` posts `{ action, ...payload }`. A payload key `action` replaces the route name: `submitApproval` sent `action: 'approve'`, so the backend saw the action `approve` and every approval failed. Use a domain name (`decision`, `operation`). `makeRequest` throws on an `action` key, and the contract check flags it.

---

## §2 Shell Script Rules (S1–S9)

### S1 — A failed pipeline must stop the script *(CR-09)*

```bash
set -o pipefail
if ! tar -czf - -C "$SRC" . | openssl enc ... -out "$OUT"; then
    rm -f "$OUT"; echo "ERROR: ..." >&2; exit 1      # remove partial output, change nothing else
fi
[ -s "$OUT" ] || { rm -f "$OUT"; exit 1; }            # empty output is a failure too
```

### S2 — Secrets never go on the command line *(CR-09, X-5)*

- ❌ `-pass "pass:$PASSWORD"`: any process listing can read it.
- ✅ `-pass "file:$PASSWORD_PATH"` (or `env:`, or stdin).
- Git Bash only converts arguments that **start** with `/`. Convert a path that comes after a prefix like `file:` yourself:
  ```bash
  PASSWORD_PATH="$PASSWORD_FILE"
  command -v cygpath &> /dev/null && PASSWORD_PATH=$(cygpath -m "$PASSWORD_FILE")
  ```

### S3 — Automated commits name their files *(CR-08)*

```bash
# ✅ Commits only these paths, even if the user has other changes staged
git add "$A" "$B" && git commit -m "chore: ..." -- "$A" "$B"
# ❌ Commits the whole index
git commit -m "chore: ..." || true
```

Report the real outcome. Never `|| true` followed by a ✅ message.

### S4 — Use recorded times, not file mtimes *(CR-10)*

`git checkout` / `clone` resets mtimes. Read the time from the record the script itself writes (e.g. `.claude/conversation-backups/backup-index.json` `last_backup`). Only fall back to mtime with a visible warning.

### S5 — Exact match or fail; never widen the scope *(CR-12)*

Find the Claude project folder with `scripts/lib/claude-project-dir.sh` (`claude_project_dir`). It matches the exact folder name, or exits 1 and lists the candidates. ❌ No `find … | head -1`, and no "searching all projects" fallback: it would back up every project's conversations.

### S6 — Lines read from a file may end in CRLF *(CR-11)*

This repo uses `core.autocrlf=true`. Strip `\r` from every field you read:

```bash
while IFS=$'\t' read -r a b; do a="${a%$'\r'}"; b="${b%$'\r'}"; ...; done < file.tsv
```

### S7 — Validate values before passing them on *(CR-09)*

```bash
[[ "$SIZE" =~ ^[0-9]+$ ]] || SIZE=0      # before jq --argjson
```

### S8 — Shared logic lives in `scripts/lib/`; no duplicated branches *(CR-13)*

### S9 — Test committing or destructive scripts in a sandbox first

```bash
SB=$(mktemp -d); cd "$SB" && git init -q && git config user.email t@t && git config user.name t
# create the files the script expects, stage an unrelated file, use a fake HOME:
HOME="$SB/fakehome" bash "/path/to/repo/scripts/<script>.sh"
git show --name-only HEAD; git diff --cached --name-only     # only the intended files committed?
```

---

## §3 Process Rules (P1–P4)

- **P1 — Review before pushing a batch.** Run `/code-review` **and** `npm run check:api-contract`. `/code-review` only sees the diff, so it can't find code that was never written (the 49 missing routes were never in a diff); the contract check covers the whole repo. Record the findings in `docs/planning/TODO_CodeReview_<YYYYMMDD>.md` with `CR-nn` ids and a status per row. Mark unfinished work as **BLOCKED** in `Claude.md` and the relevant guide until it's fixed.
- **P2 — Fix in a new AppScript file** (A11) and tick the status in the tracker with the file or commit that fixed it.
- **P3 — Deploy order for data migrations.** The lock (A5) only protects writes from a web app that runs the new code. Redeploy the web app **before** applying a rebuild or migration, or make sure nobody is using the app. See `appscript_files/GUIDE_AppScript_Deploy_and_Schema_Rebuild.md`.
- **P4 — Promote lessons.** When a finding reveals a new class of bug, add a rule here (new version) and a check in `docs/reference/RESOLUTION_CHECKLIST.md`.
- **P5 — Done means reachable.** A feature or phase is done when its endpoints are routed, the contract check passes, and a live smoke test exercised them (the deploy guide's verify step). Functions written but not routed count as not started. The v6.2–v6.3 workflow engine was marked "18 functions → v6.2" and was unreachable for a year.

---

## §4 Pre-Commit Checklist

**AppScript change**
- [ ] New timestamped file; header block updated, including the `Deploy description:` line (A11)
- [ ] No positional rows added; no new columns in front of a pinned prefix (A1)
- [ ] Headers only in `TABLE_SCHEMAS`; tabs created via `ensureTableSheet` (A2)
- [ ] New column that filters depend on → `COLUMN_DEFAULTS` entry (A3)
- [ ] No clear or delete reachable from `doPost` / `doGet`; init and seed are idempotent (A4)
- [ ] Writes under `withScriptLock`; `POST_READ_ONLY_ACTIONS` lists only reads (A5)
- [ ] Error results go through `createHandlerResponse` or throw (A6)
- [ ] Request keys match `src/api/googleSheet.js`; ids compared with `String()` (A7, A8)
- [ ] `logAdminAction` uses the 5-argument form (A9)
- [ ] Offline test passes; a new test was added for new behaviour (A11)
- [ ] `API_VERSION` matches the header `Version:` (A11)
- [ ] `npm run check:api-contract` passes; the known-gaps list only shrank (A12)
- [ ] No payload key named `action` (A13)
- [ ] Dry run `rebuildAllTables()` reviewed before any apply (P3)

**Script change**
- [ ] `pipefail` and exit checks; partial output removed on failure (S1)
- [ ] No secrets in argv; Git Bash paths converted after prefixes (S2)
- [ ] Commits use a pathspec; real outcome reported (S3)
- [ ] Times come from records, not mtimes (S4)
- [ ] Exact match or fail; no widened scope (S5)
- [ ] `\r` stripped from fields read from files (S6)
- [ ] Values validated before use (S7)
- [ ] Shared logic in `scripts/lib/` (S8)
- [ ] Sandbox-tested if it commits, deletes or encrypts (S9)

---

## §5 Finding → Rule Map

| Finding | Rule | | Finding | Rule |
|---|---|---|---|---|
| CR-01 positional custom_field_values | A1 | | CR-08 commit without pathspec | S3 |
| CR-02 blank new column | A3 | | CR-09 unchecked pipeline / password in argv | S1, S2, S7 |
| CR-03 rebuild vs unlocked writers | A5, P3 | | CR-10 mtime as backup age | S4 |
| CR-04 duplicate header lists | A2 | | CR-11 CRLF manifest | S6 |
| CR-05 init clears data | A4 | | CR-12 widened project scope | S5 |
| CR-06 logAdminAction arity | A9 | | CR-13 duplicated branches | S8 |
| CR-07 success:true on error | A6, A8 | | X-1 26 mis-logged audit rows | A9 |
| X-2 frontend/backend key mismatch | A7 | | X-3 update/delete positional rows | A1 |
| X-4 init clear + null sheet | A4, A10 | | X-5 `file:` path on Git Bash | S2 |
| X-6 old web app ignores lock | P3 | | 49 unrouted frontend actions | A12, P1, P5 |
| Routes calling undefined functions | A12 | | Payload `action` overwrote the route | A13 |
