<!--
===============================================================================
JARVISbyERP — TICKETING & WORKFLOW ORCHESTRATION SYSTEM
===============================================================================
Document: GUIDE_AppScript_Deploy_and_Schema_Rebuild.md | Author: Kenneth R. Advento | Version: 1.4.0
Created: 17 October 2026 UTC+8 (Philippine Standard Time) | Modified: 19 October 2026 UTC+8 (Philippine Standard Time)
Purpose: Step-by-step guide to paste a new AppScript version and rebuild all Google Sheet tables safely | Status: Active

REVISION HISTORY:
- v1.0.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Initial guide for AppScript v8.1 (TABLE_SCHEMAS + rebuildAllTables)
- v1.1.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Current file → v8.2 (resolveColumnMapping implemented, KEEP policy); removed "implement first" prerequisite
- v1.1.1 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Added BLOCKED banner: apply step on hold until v8.3 fixes code review CR-01–CR-04
- v1.2.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Current file → v8.3 (code review fixes); banner removed; §0/§3 redeploy-first note (write lock); `defaulted` log field; lock-timeout error row
- v1.3.0 | 19 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | §5 step 3: the New version description is copied from the file header's `Deploy description:` line (rule A11, from v8.4 on)
- v1.4.0 | 19 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Current file → v9.0 (API contract routes, roles & approvals); deploy the frontend with it (breaking: approve payload, loud errors); roles 5 → 12 columns (rebuild apply needed); §5 ping reports the file version
===============================================================================
-->

# GUIDE — AppScript Deploy & Schema Rebuild

> Use this guide every time a new `APPSCRIPT_v<ver>_<YYYYMMDD>_<HHMM>.txt` file is created.
> **Latest file is the one with the newest timestamp** in `appscript_files/`.
> Current: `APPSCRIPT_v9.0_20261019_0501.txt`

> ⚠️ **v9.0 changes the API contract** - deploy the frontend from the same commit right after §5: the approve request now sends `decision` (the old `action` key never reached a route), and failures return `status: 'error'`, which the frontend now shows instead of an empty list. An older frontend keeps working for everything except approvals.
>
> Offline tests (both must pass on the file you paste): `node appscript_files/tools/ROUTES_AND_APPROVALS_TEST_v9.0.js appscript_files/APPSCRIPT_v9.0_20261019_0501.txt` → 21 PASS; `node appscript_files/tools/CODE_REVIEW_FIXES_TEST_v8.3.js appscript_files/APPSCRIPT_v9.0_20261019_0501.txt` → 11 PASS. Contract: `npm run check:api-contract` → OK. Never apply with v8.2.

**Time needed:** ~15 minutes | **Risk:** Low — the rebuild never deletes data and backs up every tab it changes

---

## §0 Before You Start

| Check | How |
|---|---|
| ☐ You can open the Google Sheet | Sheet ID `1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4` (same as `SPREADSHEET_ID` in the script) |
| ☐ An `xSchema` tab exists in the Sheet | Needed by `analyzeCurrentSchema()` in §4. If missing: in the Sheet click **+** (bottom-left) → rename the new tab to `xSchema` |
| ☐ Nobody is using the app, **or** you redeploy (§5) before applying (§3) | The apply step holds the script lock, and v8.3+ web-app writes wait for it. Redeploying first is safe: v9.0 writes by header name and works on the old layout too (a missing `roles` column is just skipped until the rebuild adds it) |

---

## §1 Paste the New File into the Apps Script Editor

1. Open the Google Sheet → **Extensions → Apps Script** (or open the project from script.google.com).
2. In the left panel, click the script file (usually `Code.gs`).
3. In the repo, open the latest file: `appscript_files/APPSCRIPT_v9.0_20261019_0501.txt` → select all → copy.
4. In the editor: **Ctrl+A** → **Ctrl+V** to replace everything.
5. **Ctrl+S** to save. If a red error bar appears, the paste was incomplete — repeat steps 3–5.
6. Quick check: the first lines must say `Version: 9.0`.

> Pasting and saving updates the **editor** only. The live web app keeps serving the old version until you redeploy (§5).

---

## §2 Dry Run — `rebuildAllTables()`

This **only reports**. It changes nothing.

1. In the toolbar function dropdown (next to **Debug**), choose **`rebuildAllTables`**.
2. Click **Run**.
3. First run only: Google asks for authorization → **Review permissions** → choose your account → **Advanced → Go to (project) (unsafe)** → **Allow**.
4. The **Execution log** opens at the bottom. Read one line per table:

| Log line | Meaning | Action |
|---|---|---|
| `OK: <table>` | Headers already match | None |
| `CREATED: <table>` | Tab is missing or empty — will be created with headers | None |
| `REPAIRED: <table> … added: […] moved: […] extra: […]` (+ `defaulted: […]`) | Headers differ — tab will be backed up and its rows re-mapped by column name | Review `extra` (see below) |
| `ERROR: <table>: …` | Something failed for that table | Stop — see §6 |

5. Last line: `=== REBUILD COMPLETE: X created, Y ok, Z repaired, N errors ===`

**Review before applying:**
- **`added`** — new columns, empty for existing rows. Normal.
- **`defaulted`** — added columns that existing rows get a value for instead of blank (`COLUMN_DEFAULTS`): `entity_category = 'ticket'` in `custom_fields` / `custom_field_values`, and (v9.0) `is_active = TRUE` in `roles`. Normal.
- **v9.0 expects** `REPAIRED: roles … added: [role_type_id, is_active, created_by, updated_by, deactivated_at, deactivated_by, deactivation_reason] … defaulted: [is_active]`. Nothing else should change if v8.3 was applied.
- **`moved`** — existing columns that will change position. Data moves with its header. Normal.
- **`extra`** — columns in the tab that are **not** in `TABLE_SCHEMAS`. They are **kept**, moved after the official columns, with their data. A blank header becomes `_unnamed_<col>`; a repeated header becomes `<name>_dup_<col>`. If a name looks like a typo of a real column (e.g. `creatd_at`), fix the header in the Sheet by hand **before applying** and re-run the dry run — otherwise its data stays in the extra column instead of the real one.

> ⚠️ Repair matches columns **by header name**. If a tab has rows that were written under the wrong headers in the past (the Sept 24, 2025 schema issue), those values stay in the wrong columns after the repair. Spot-check a few rows in `tickets` and `custom_field_values` after §3.

---

## §3 Apply — `rebuildAllTablesApply()`

> If people may be using the app, do §5 (redeploy) **now**, then come back here — see §0.

1. Function dropdown → **`rebuildAllTablesApply`** → **Run**.
2. Wait for `=== REBUILD COMPLETE … ===` in the Execution log. The `REPAIRED` / `CREATED` counts should match the dry run.
3. In the Sheet you'll now see backup tabs: `_bak_<table>_<yyyyMMdd_HHmmss>` — one per repaired table. **Don't delete them yet.**

> If it stops with `Exceeded maximum execution time` (6-minute Apps Script limit), just run it again. Tables already fixed report `OK` and are skipped.

---

## §4 Verify — `analyzeCurrentSchema()`

1. Function dropdown → **`analyzeCurrentSchema`** → **Run**.
2. Open the `xSchema` tab in the Sheet. Each row shows a table, its column count and its headers.
3. Compare against the expected column counts:

| Table | Cols | Table | Cols | Table | Cols |
|---|---|---|---|---|---|
| companies | 15 | step_slas | 13 | user_profile_types | 13 |
| roles | 12 | step_conditions | 16 | role_types | 17 |
| tickets | 27 | dropdown_lists | 12 | user_profiles | 19 |
| ticket_history | 11 | dropdown_options | 5 | ticket_tags | 18 |
| ticket_types | 10 | ticket_attachments | 19 | ticket_tag_assignments | 13 |
| comment_requirements | 16 | report_configurations | 18 | tag_categories | 15 |
| custom_fields | 19 | ticket_links | 14 | tag_usage_statistics | 8 |
| custom_field_values | 18 | sequence_counters | 2 | ticket_collaborations | 20 |
| workflow_steps | 19 | ticket_action_logs | 6 | collaboration_requests | 19 |
| step_approvers | 2 | admin_action_logs | 7 | collaboration_notifications | 10 |
| user_role_assignments | 24 | user_preferences | 12 | shared_ticket_access_logs | 9 |

A table with **more** columns than listed had `extra` columns, which are kept at the end — that's expected. Delete them in the Sheet by hand once you're sure they aren't needed.

4. Run **`rebuildAllTables`** (dry run) once more → every table should now say `OK`.

---

## §5 Redeploy the Web App (so the live API uses the new file)

1. **Deploy → Manage deployments**.
2. Select the active web-app deployment → **✏️ Edit**.
3. **Version → New version** → **Description**: copy the `Deploy description:` line from the header of the file you pasted (v9.0: `v9.0 20261019_0501 - API contract routes, roles & approval engine, loud errors`). For v8.3, which predates that line, use `v8.3 20261017_1510 - code review fixes CR-01..CR-07`. → **Deploy**.
4. The web-app URL stays the same — no frontend change needed.
5. Open the app → Admin page → confirm the API status shows connected and lists load.
6. From v9.0, `<web app URL>?action=ping` returns `"version": "9.0.0"` (the file's `API_VERSION`). Before v9.0 it always said `8.0.0`. `?action=getSystemHealth` lists any tab whose headers differ from `TABLE_SCHEMAS`.

---

## §6 If Something Goes Wrong

**Restore one table from its backup**
1. In the Sheet, right-click the broken tab (e.g. `tickets`) → **Delete**.
2. Right-click `_bak_tickets_<stamp>` → **Rename** → `tickets`.

**Common errors**

| Error | Cause | Fix |
|---|---|---|
| `xSchema sheet not found` | No `xSchema` tab | Create it (§0) |
| `Lock timeout` / `Could not obtain lock` | Another script run in progress | Wait a minute, run again |
| App shows a save error with `lock` in it during §3 | v8.3 web-app writes wait up to 30s for the rebuild's lock, then fail rather than lose data | Retry the save after the rebuild finishes |
| `A sheet with the name "_bak_…" already exists` | Two applies in the same second | Run again |
| `Exceeded maximum execution time` | 6-minute limit | Run again — finished tables are skipped |

**Cleanup:** after the app has worked normally for a few days, delete the `_bak_*` tabs.

---

## §7 Record It

- Add a line to `REF_SessionLog.md` (or tell Claude) with the date, the file version deployed, and the dry-run counts.
- Next AppScript change → new timestamped file → repeat this guide from §0.
