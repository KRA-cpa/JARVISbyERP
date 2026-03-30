# Backend Redeployment Plan
**Date**: 2026-03-30
**Status**: PLANNED
**Scope**: (1) Quota alert at 75% with client decision flow, (2) Full backend migration from Google Sheets to cloud DB

---

## Overview

Two parallel workstreams:

| Workstream | Goal | Urgency |
|------------|------|---------|
| **A — Quota Alert at 75%** | Warn admin before hitting Sheets limits; prompt for a plan | Do now |
| **B — Backend Migration** | Replace Apps Script + Sheets with a real DB | When admin chooses "upgrade" |

---

## Workstream A — Quota Alert & Client Decision Flow

### A1. Update Warning Threshold to 75%

**File**: `src/utils/sheetsQuotaTracker.js`

Change:
```js
// BEFORE
const WARNING_PCT = 0.7;

// AFTER
const WARNING_PCT = 0.75;
```

No other changes needed — the monitor component reads `status.level` dynamically.

---

### A2. Quota Alert Modal ("What's your plan?")

**New file**: `src/components/shared/QuotaLimitAlert.js`

Triggered when `status.level === 'warn'` (75%+) AND the admin hasn't dismissed it today.
Dismissed state stored in `localStorage` with key `jarvis_quota_alert_dismissed_YYYY-MM-DD` (auto-resets next day).

**Modal content:**

```
⚠️  You've used 75%+ of your daily Google Sheets API quota.

At this rate, you will hit your limit today.
What would you like to do?

  [ Option A ]  Add a new Google Sheet
                Create a second Apps Script deployment for overflow.
                Free. Takes ~10 minutes. Splits load between two sheets.

  [ Option B ]  Upgrade to Cloud Database
                Migrate to Supabase (PostgreSQL). Handles 10,000+ users.
                Recommended for growing teams. One-time migration effort.

  [ Remind me tomorrow ]
```

**Wiring:**
- Mount in `App.js` (or `AdminPage.js` for admin-only visibility)
- Only show if `user.isAdmin === true`
- Poll `quotaTracker.getStatus()` every 60 seconds

---

### A3. Email Alert to Admin via AppScript MailApp

When quota hits 75%, fire a one-time email per day to the system admin email.

**AppScript addition** (`appscript_files/APPSCRIPT.txt`):

New function `sendQuotaAlertEmail(usedPct, callCount, limit, tier)`:
```javascript
function sendQuotaAlertEmail(usedPct, callCount, limit, tier) {
  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
  if (!adminEmail) return;

  var subject = '[JARVIS] ⚠️ Google Sheets quota at ' + usedPct + '%';
  var body = [
    'Your JARVIS system has used ' + usedPct + '% of its daily Google Sheets quota.',
    '',
    'Used: ' + callCount + ' / ' + limit + ' calls (' + tier + ' tier)',
    'Date: ' + new Date().toISOString().slice(0,10) + ' UTC',
    '',
    'Options:',
    '1. Add a second Google Sheet deployment (free, 10 min setup)',
    '2. Upgrade to a cloud database (Supabase/PostgreSQL)',
    '',
    'Log in to your JARVIS admin panel to take action.',
  ].join('\n');

  MailApp.sendEmail(adminEmail, subject, body);
}
```

**Trigger**: Called from frontend via a new `API_ENDPOINTS.sendQuotaAlert` action.
**Rate-limit**: AppScript `PropertiesService` stores `last_quota_alert_date`; function exits early if already sent today.

---

### A4. "Option A" Flow — Add a New Google Sheet

If admin clicks **Option A** in the modal, show a step-by-step guide:

```
Step 1: Open Google Sheets and copy the current spreadsheet
Step 2: Deploy a new Apps Script from the copy
Step 3: Paste the new deployment URL in Admin > System Settings > Secondary API URL
Step 4: JARVIS will automatically route overflow traffic to the secondary sheet
```

**Implementation**:
- New field in `system_config` sheet: `secondary_api_url`
- `src/config/apiConfig.js`: add `secondaryURL` config
- `src/api/googleSheet.js`: `HTTPClient` checks `quotaTracker.getStatus().percentUsed >= 90`
  → falls back to `secondaryURL` for read requests

---

### A5. "Option B" Flow — Upgrade to Cloud DB

If admin clicks **Option B**, redirect to an in-app migration wizard (Workstream B below).
Show estimated effort, cost comparison, and a "Start Migration" button.

---

## Workstream B — Full Backend Migration (Google Sheets → Cloud DB)

### B0. Decision: Target Database

| Option | Cost | Effort | Best for |
|--------|------|--------|----------|
| **Supabase** (Postgres + REST) | Free tier: 500MB / 2 projects. $25/mo for Pro | Low — REST API very similar to Apps Script | Recommended: closest drop-in replacement |
| **Firebase Firestore** | Spark free tier generous. Blaze: pay-per-use | Medium — NoSQL requires schema rethink | Already in stack (Auth uses Firebase) |
| **PlanetScale / Neon** | Free tiers available. Serverless Postgres | Medium — need own API layer | If strong SQL preference |

**Recommended: Supabase** — Postgres, built-in REST API, row-level security, dashboard, free tier.

---

### B1. Schema Export from Google Sheets

**New script**: `scripts/export-sheets-schema.js`

Calls each `get*` API endpoint and writes JSON files:
```
scripts/migration/
  companies.json
  roles.json
  users.json
  tickets.json
  ticket_types.json
  workflow_steps.json
  step_approvers.json
  custom_fields.json
  custom_field_values.json
  dropdown_lists.json
  dropdown_options.json
  ... (all 20 sheets)
```

Run once before migration:
```bash
node scripts/export-sheets-schema.js --output ./scripts/migration/
```

---

### B2. Supabase Schema Creation

**New file**: `scripts/supabase-schema.sql`

Mirrors the existing Sheets structure 1:1 as Postgres tables, preserving:
- All column names (already snake_case ✓)
- Audit fields (`created_at`, `updated_at`, `created_by`, etc.)
- `entity_category` for Universal Entity architecture
- Soft deletes (`deleted_at`, `is_active`)
- Foreign key relationships (ticket → ticket_type, company, etc.)

Key tables:
```sql
companies, roles, users, user_role_assignments, user_profiles, user_profile_types,
role_types, tickets, ticket_history, ticket_types, ticket_action_logs,
workflow_steps, step_approvers, step_slas, step_conditions, step_approvals,
custom_fields, custom_field_values, dropdown_lists, dropdown_options,
ticket_attachments, ticket_links, admin_action_logs, user_preferences,
report_configurations, sequence_counters
```

---

### B3. Data Migration Script

**New file**: `scripts/migrate-to-supabase.js`

Reads JSON exports from B1, transforms, and inserts into Supabase:
```
1. Insert companies
2. Insert roles + role_types
3. Insert users + user_profiles + user_role_assignments
4. Insert dropdown_lists + dropdown_options
5. Insert ticket_types
6. Insert custom_fields
7. Insert workflow_steps + step_approvers + step_slas + step_conditions
8. Insert tickets (with sequence counter reset)
9. Insert custom_field_values
10. Insert ticket_history + action_logs
```

Each table insert: upsert by `id` (idempotent — safe to re-run).

---

### B4. New API Layer

**Replace**: `appscript_files/APPSCRIPT.txt` (Apps Script backend)
**With**: `api/` (Node.js Express server OR Supabase edge functions)

Two options:

#### Option B4a — Supabase Auto-REST (fastest)
Supabase exposes every table as a REST endpoint automatically:
```
GET  /rest/v1/tickets?select=*&company_id=eq.{id}
POST /rest/v1/tickets
PATCH /rest/v1/tickets?id=eq.{id}
```

Only change needed in frontend: swap `CONFIG.APPS_SCRIPT_URL` for Supabase project URL + anon key.
Row-level security (RLS) policies replace the manual company isolation in Apps Script.

#### Option B4b — Express API server (full control)
New `api/` directory with Express routes mirroring existing `API_ENDPOINTS`:
```
api/
  routes/
    tickets.js
    companies.js
    users.js
    ...
  middleware/
    auth.js       (verify Firebase JWT)
    rateLimit.js
  db/
    supabase.js   (Supabase client)
  index.js
```

Deploy to Vercel as serverless functions (same host, no CORS changes).

**Recommended: B4a** (Supabase auto-REST) for speed. Upgrade to B4b if custom business logic needs server-side execution.

---

### B5. Frontend Switchover

**File**: `src/config/apiConfig.js`

Add Supabase config alongside existing:
```js
supabase: {
  baseURL: process.env.REACT_APP_SUPABASE_URL,
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
}
```

**File**: `src/api/googleSheet.js`

Add a `DB_BACKEND` flag:
```js
const DB_BACKEND = process.env.REACT_APP_DB_BACKEND || 'sheets'; // 'sheets' | 'supabase'
```

All `BaseAPI.makeRequest()` calls route through either the Apps Script HTTP client
or the Supabase client based on this flag.

This allows **zero-downtime cutover**: deploy with `DB_BACKEND=supabase`, verify, then remove old code.

---

### B6. Firebase Auth Integration Fix

Currently `getCurrentUserId()` in AppScript returns `'system_user'` (TODO placeholder).

With Supabase backend, fix this at the frontend layer:
- Pass `Authorization: Bearer {firebase_id_token}` in all API requests
- Supabase RLS verifies Firebase JWT via a custom auth hook
- OR: use Supabase Auth instead of Firebase Auth (single auth system)

**Recommended**: Keep Firebase Auth (already working), pass Firebase UID in request headers to Supabase.

---

### B7. Quota Monitor Update Post-Migration

After migration to Supabase, the `sheetsQuotaTracker` becomes irrelevant.

Update `SheetsQuotaMonitor.js` to:
- Hide entirely when `DB_BACKEND !== 'sheets'`
- Show Supabase usage stats instead (database size, API requests via Supabase dashboard API)

---

## Implementation Phases & Order

```
Phase A1  ──► Update threshold to 75%                    (30 min)
Phase A2  ──► QuotaLimitAlert modal component            (2 hrs)
Phase A3  ──► AppScript sendQuotaAlertEmail function     (1 hr)
Phase A4  ──► Option A: secondary sheet fallback         (3 hrs)
Phase A5  ──► Option B: in-app migration wizard UI       (2 hrs)
                         ▼
Phase B0  ──► Choose target DB (Supabase recommended)    (decision)
Phase B1  ──► Schema export script                       (2 hrs)
Phase B2  ──► Supabase SQL schema                        (3 hrs)
Phase B3  ──► Data migration script                      (4 hrs)
Phase B4  ──► New API layer (Supabase auto-REST)         (4 hrs)
Phase B5  ──► Frontend DB_BACKEND flag + switchover      (3 hrs)
Phase B6  ──► Firebase Auth header integration           (2 hrs)
Phase B7  ──► Quota monitor update                       (1 hr)
```

**Total Workstream A**: ~8 hrs (do first — protects current users)
**Total Workstream B**: ~19 hrs (do when admin chooses "upgrade")

---

## Files Changed / Created

### Workstream A
| File | Change |
|------|--------|
| `src/utils/sheetsQuotaTracker.js` | Change `WARNING_PCT` to 0.75 |
| `src/components/shared/QuotaLimitAlert.js` | NEW — modal with 2 options |
| `src/App.js` | Mount `<QuotaLimitAlert />` for admins |
| `src/config/apiConfig.js` | Add `secondaryURL` field |
| `src/api/googleSheet.js` | Secondary URL fallback in `HTTPClient` |
| `appscript_files/APPSCRIPT.txt` | Add `sendQuotaAlertEmail()` + `doGet/doPost` routing |

### Workstream B
| File | Change |
|------|--------|
| `scripts/export-sheets-schema.js` | NEW — data export |
| `scripts/supabase-schema.sql` | NEW — Postgres DDL |
| `scripts/migrate-to-supabase.js` | NEW — migration runner |
| `src/config/apiConfig.js` | Add Supabase config |
| `src/api/googleSheet.js` | Add `DB_BACKEND` routing |
| `src/components/shared/SheetsQuotaMonitor.js` | Hide when not on Sheets backend |

---

## What Stays the Same (No Changes Needed)

- All React components and pages
- Firebase Auth (kept as-is)
- Universal Entity architecture
- SLA engine, workflow engine, RBAC
- Vercel deployment
- All existing API endpoint names (`API_ENDPOINTS.*`)
