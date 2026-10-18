<!--
===============================================================================
JARVISbyERP — TICKETING & WORKFLOW ORCHESTRATION SYSTEM
===============================================================================
Document: TODO_CodeReview_20261017.md | Author: Kenneth R. Advento | Version: 1.1.0
Created: 17 October 2026 UTC+8 (Philippine Standard Time) | Modified: 17 October 2026 UTC+8 (Philippine Standard Time)
Purpose: Track findings from the /code-review of origin/main3...HEAD (AppScript v8.0 → v8.2, backup and reorg scripts) until each is fixed | Status: Fixed — awaiting deploy

REVISION HISTORY:
- v1.0.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Initial list: 13 findings from /code-review (session 1d61f1cf); none fixed yet
- v1.1.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | All 13 fixed (AppScript v8.3 + scripts v1.1); 6 extra issues found while fixing (§5); blocker lifted
===============================================================================
-->

# TODO — Code Review Findings (17 Oct 2026)

> **Scope:** `origin/main3...HEAD` (9 commits, 122 files), reviewed at HEAD `4a4cd11`.
> **Line numbers** refer to `appscript_files/APPSCRIPT_v8.2_20261017_1444.txt` unless another file is named.
> **Fixed in:** `appscript_files/APPSCRIPT_v8.3_20261017_1510.txt` and `scripts/` v1.1 (session 1d61f1cf).
> **Rules derived from these findings:** `docs/guides/GUIDE_CodeReview_Compliance.md` (A1–A11, S1–S9, P1–P4 + pre-commit checklist; §5 maps each finding to its rule).

## ✅ Blocker lifted

v8.3 fixes CR-01–CR-04, so the schema rebuild can be applied. Follow `appscript_files/GUIDE_AppScript_Deploy_and_Schema_Rebuild.md` v1.2.0. **Redeploy the web app (§5) before applying (§3)** if anyone may be using the app. The write lock only protects writes from a v8.3 web app.

**Offline test (no Google access needed):**
`node appscript_files/tools/CODE_REVIEW_FIXES_TEST_v8.3.js appscript_files/APPSCRIPT_v8.3_20261017_1510.txt` → 11 PASS (v8.2: 9 of 11 FAIL).
It runs the AppScript file against an in-memory fake of `SpreadsheetApp` / `LockService`. The fake lock throws if it's taken twice in one execution, which proves the locking is re-entrant.

**Still to do (user):** paste v8.3 → dry run → redeploy → apply → `analyzeCurrentSchema()` (deploy guide §1–§5).

---

## §1 Fixed in v8.3 — were blocking the rebuild

| ID | Line | Finding | Fix | Status |
|---|---|---|---|---|
| CR-01 | 1097 | Routed `createTicket()` wrote `custom_field_values` positionally without `entity_category`. | `createTicket` now calls `setCustomFieldValue(..., 'ticket')`, which is header-driven and also detects number, date and dropdown values. Failures are returned as `customFieldErrors`. `createCustomFieldValue` / `updateCustomFieldValue` / `deleteCustomFieldValue` now build rows with the new `rowFromRecord(headers, record)`, so `entity_category` and any extra columns are kept. | ☑ Fixed (v8.3) |
| CR-02 | 13020 | `rebuildTable` filled added columns with `''`. | New `COLUMN_DEFAULTS` (`entity_category: 'ticket'` for `custom_fields` / `custom_field_values`). The dry run reports these columns as `defaulted: […]`. | ☑ Fixed (v8.3) |
| CR-03 | 13070 / 13024 | Only the rebuild took the script lock. | New re-entrant `withScriptLock(fn)`, used by every `doPost` write (the switch moved to `routePostAction`; `POST_READ_ONLY_ACTIONS` skip the lock), by `generateTicketNumber` and by `rebuildAllTablesApply`. A write during the rebuild waits 30s, then fails with an error instead of being lost. | ☑ Fixed (v8.3) |
| CR-04 | 2375 | The init functions hard-coded their own header orders. | All 23 `initialize*Sheet()` now call the new `ensureTableSheet(name)`, which writes `TABLE_SCHEMAS[name]`. Tested: after init or `cleanResetAllTables()`, a dry run reports 0 repairs. | ☑ Fixed (v8.3) |

## §2 AppScript — other bugs

| ID | Line | Finding | Fix | Status |
|---|---|---|---|---|
| CR-05 | 12469 / 998 | The Phase 10 init functions called `sheet.clear()`, reachable through `doPost`. | `ensureTableSheet` never clears a tab that has data. `createUserManagementTestData` skips seeding if `user_profile_types` already has rows. Tested: two `completeUserManagementSetup` calls leave 2 + 2 rows. | ☑ Fixed (v8.3) |
| CR-06 | 285 | `deactivateRecord` called `logAdminAction` with 5 arguments; it takes 3. | **Wider than reported: 26 calls use the 5-argument form** (Phase 1B, 10 and 11), not just `deactivateRecord`. `logAdminAction(...args)` now accepts both forms and writes `admin_user_id` / `target_entity` correctly. | ☑ Fixed (v8.3) |
| CR-07 | 941 | Phase 10 `doPost` cases always returned `success: true`. | New `createHandlerResponse(result)`: `{status:'error'}` or `{success:false}` returns `success: false` plus a top-level `status: 'error'`, which the frontend's `makeRequest()` already throws on. Applied to the 12 Phase 10 and setup cases. `deactivateRecord` compares ids as strings. | ☑ Fixed (v8.3) |

## §3 Backup scripts

| ID | File | Finding | Fix | Status |
|---|---|---|---|---|
| CR-08 | `scripts/backup-conversations.sh` | `git commit` had no pathspec. | `git commit … -- "$BACKUP_FILE" "$INDEX_FILE"`. The script reports a failed commit instead of always printing ✅. Tested in a sandbox repo: changes the user had already staged stay staged. | ☑ Fixed (v1.1) |
| CR-09 | `scripts/backup-conversations.sh` | No check on the `tar \| openssl` result; empty `BACKUP_SIZE`; password in argv. | `set -o pipefail` plus an exit check: on failure the partial `.enc` is removed and the index and git are left alone. An empty file is also rejected. Size defaults to 0. Password passed as `-pass file:` (via `cygpath` on Git Bash). `last_backup` is set to the time the scan started. Tested: new archives also decrypt the old `pass:` way. | ☑ Fixed (v1.1) |
| CR-10 | `scripts/check-backup-health.sh` | Age came from file mtime. | Age comes from `.claude/conversation-backups/backup-index.json` `last_backup`. File mtime is only a labelled fallback. | ☑ Fixed (v1.1) |

## §4 Lower priority

| ID | File | Finding | Fix | Status |
|---|---|---|---|---|
| CR-11 | `scripts/reorg-move.sh` | CRLF manifest left `\r` on `$new`. | Strips a trailing `\r` from both fields. | ☑ Fixed |
| CR-12 | `scripts/backup-conversations.sh` (+ `scripts/checkpoint-session.sh`) | Fell back to all projects; `head -1` picked an arbitrary folder. | New `scripts/lib/claude-project-dir.sh` matches only the exact Claude folder name (repo path with non-alphanumerics → `-`), otherwise lists candidates and exits 1. Tested: another project's conversations are not included. | ☑ Fixed (v1.1) |
| CR-13 | `scripts/checkpoint-session.sh` | Duplicate branches. | One copy path plus a warning when the session is older than 10 minutes. | ☑ Fixed (v1.1) |

---

## §5 Extra issues found while fixing (not in the review)

| # | Where | Issue | Status |
|---|---|---|---|
| X-1 | `logAdminAction` callers | 26 callers, not 1, used the 5-argument form, so most Phase 1B/10/11 audit rows had wrong columns (see CR-06). | ☑ Fixed (v8.3) |
| X-2 | `doPost` update/delete UserProfileType / RoleType | The frontend (`src/api/googleSheet.js`) sends `user_profile_type_id` / `role_type_id`; the backend read only `id`, so every delete or update failed silently. | ☑ Fixed (v8.3): accepts both keys |
| X-3 | `updateCustomFieldValue` / `deleteCustomFieldValue` (not routed) | Same positional-row bug as CR-01: rewrote the whole row without `entity_category`. `updateCustomFieldValue` also blanked `is_active`, because `updateAuditFields()` has no `is_active`. | ☑ Fixed (v8.3) |
| X-4 | `initializeWorkflowStepsSheet` / `StepApprovers` / `UserRoleAssignments` / `StepSLAs` | Called `sheet.clear()` on existing data. They also crashed on a missing tab, because `getSheetByName` returns null rather than throwing. | ☑ Fixed (v8.3) via `ensureTableSheet` |
| X-5 | `backup-conversations.sh` on Git Bash | `-pass file:/posix/path` isn't translated for the native openssl. Found by the sandbox test. | ☑ Fixed: `cygpath -m` |
| X-6 | Deploy order | The live web app runs pre-v8.3 code that never takes the lock, so CR-03 only protects writes after redeploy. | ☑ Documented: guide §0/§3 say to redeploy first |

**Not changed (noted):** `doGet` is not locked. It only reads, apart from creating a missing `user_preferences` tab. The frontend's `getAll()` returns the handler wrapper object rather than an array for user profile types and role types (`response.data` is `{status, data}`). That is a separate frontend issue.
