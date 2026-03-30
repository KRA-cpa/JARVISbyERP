# Pending Decisions Register
**Last Updated**: 2026-03-30
**Purpose**: Track all unresolved architectural, product, and implementation decisions

---

## D1 — Target Database for Migration
**Status**: PENDING DECISION
**Blocking**: All of Workstream B in BACKEND_REDEPLOYMENT_PLAN.md
**Options**:
| Option | Cost | Effort | Notes |
|--------|------|--------|-------|
| **Supabase** (Postgres) | Free / $25/mo Pro | Low | Recommended. REST API closest to Apps Script pattern |
| **Firebase Firestore** | Spark free / Blaze pay-per-use | Medium | Already in stack (Auth). NoSQL requires schema rethink |
| **Neon / PlanetScale** | Free tiers | Medium | Need own Express API layer |

**Recommendation**: Supabase
**Decide by**: Before starting Phase B1

---

## D2 — New API Layer Architecture
**Status**: PENDING DECISION (depends on D1)
**Blocking**: Phase B4 of migration
**Options**:
| Option | Description | Effort |
|--------|-------------|--------|
| **B4a — Supabase Auto-REST** | Supabase exposes tables as REST endpoints automatically. Minimal frontend change. | Low |
| **B4b — Express API Server** | Custom Node.js API on Vercel serverless functions. Full control over business logic. | Medium |

**Recommendation**: Start with B4a (auto-REST), migrate to B4b only if custom server-side logic is needed
**Decide by**: Before starting Phase B4

---

## D3 — Auth Strategy Post-Migration
**Status**: PENDING DECISION (depends on D1)
**Blocking**: Phase B6 of migration
**Options**:
| Option | Description | Risk |
|--------|-------------|------|
| **Keep Firebase Auth** | Pass Firebase UID/JWT in request headers to Supabase. Use Supabase RLS with Firebase token. | Low — already working |
| **Switch to Supabase Auth** | Replace Firebase Auth with Supabase Auth. Single auth system. | Medium — requires login flow rewrite |

**Recommendation**: Keep Firebase Auth (zero disruption to existing login flow)
**Decide by**: Before starting Phase B6

---

## D4 — Quota Alert: Server-Side Tracking in AppScript
**Status**: PENDING DECISION
**Context**: Current quota tracker is client-side (localStorage, per browser tab).
Does not see other users' API calls. Asked in chat: "want me to implement server-side tracking?"
**Options**:
| Option | Description |
|--------|-------------|
| **A — Client-side only (current)** | Per-user early warning. Simple. Cannot see total system load. |
| **B — AppScript PropertiesService counter** | Shared counter across all users. Fires email at 75% system-wide. Tracks per-user call contribution. |
| **C — Both A + B** | Client-side for per-user UX, server-side for admin alerts. Recommended. |

**Recommendation**: Option C
**Decide by**: Before implementing Phase A3 (sendQuotaAlertEmail)

---

## D5 — Quota Alert: Client Response Action
**Status**: PENDING CLIENT DECISION (business/product)
**Context**: When admin hits 75% quota, they see a modal with two options.
This is the actual business decision the system owner must make.
**Options**:
| Option | What it means |
|--------|--------------|
| **Option A — Add new Google Sheet** | Free. Spin up second Apps Script deployment. ~10 min setup. Splits load. Keeps Sheets backend. |
| **Option B — Upgrade to Cloud DB** | Migrate to Supabase/Postgres. Handles unlimited users. One-time effort ~19 hrs. |

**Notes**: Not a code decision — the admin/client must decide when they receive the alert.
**Triggers**: When `quotaTracker.percentUsed >= 75`

---

## D6 — Firebase Auth Integration in AppScript Backend
**Status**: PENDING IMPLEMENTATION (known TODO)
**File**: `appscript_files/APPSCRIPT.txt`, line 63
**Issue**: `getCurrentUserId()` returns hardcoded `'system_user'` placeholder.
All audit trail entries (`created_by`, `updated_by`) are recorded as `'system_user'` instead of the actual user.
**Fix**: Pass Firebase UID from frontend request headers; read it in `doPost(e)` via `e.parameter.userId` or request body.
**Impact**: Audit trail accuracy, user-specific quota tracking (D4), RBAC enforcement server-side
**Decide by**: Should be fixed regardless of migration decision

---

## D7 — Email Notification System (Not Yet Implemented)
**Status**: PENDING IMPLEMENTATION
**Files**:
- `appscript_files/APPSCRIPT.txt` — `triggerWorkflowNotifications()` logs only, no actual send
- `src/components/shared/SLANotificationSystem.js` — lines 103, 125, 145, 146
- `src/components/admin/AdminSLAEscalationManager.js` — lines 57, 136, 171
**Issue**: Entire notification system (SLA escalations, workflow approvals, status changes) only logs to console. No emails are sent.
**Options**:
| Option | Description |
|--------|-------------|
| **AppScript MailApp** | Simple. Free with Google account. 100 emails/day (free) / 1,500/day (Workspace). |
| **AppScript GmailApp** | Sends as the script owner's Gmail. No daily limit noted. |
| **Firebase Cloud Functions + SendGrid/Resend** | Production-grade. Works post-migration. Decoupled from Sheets. |

**Recommendation**: AppScript MailApp now (quick win), migrate to Firebase Cloud Functions with migration
**Decide by**: High priority — SLA escalations are silently failing in production

---

## D8 — Ticket Collaboration & Tags API (Stub Only)
**Status**: PENDING IMPLEMENTATION
**Files**:
- `src/components/tickets/TicketCollaborationManager.js` — 7 TODO stubs (lines 71, 122, 149, 190, 233, 266, 300)
- `src/components/tickets/TicketTagManager.js` — 4 TODO stubs (lines 49, 89, 114, 135)
- `src/hooks/useAPI.js` — 3 TODO stubs (lines 708, 739, 763)
**Issue**: Collaboration and tagging UI exists but all API calls are stubs returning mock data.
**Fix**: Implement AppScript backend functions for `getTicketTags`, `addTag`, `removeTag`, `getCollaborators`, `addCollaborator`, etc.
**Decide by**: After D6 (auth) is fixed — tags/collaboration need real user IDs

---

## D9 — Dropdown Company Assignment (Known Incomplete)
**Status**: PENDING IMPLEMENTATION
**File**: `src/components/admin/AdminDropdownManager.js`, line 41–42
**Issue**: Company assignment for dropdown lists was not implemented in AppScript v6.0. Shows an error message to the user.
**Fix**: Add `updateDropdownCompanyAssignment(dropdownId, companyIds)` in AppScript backend
**Impact**: Admins cannot currently restrict dropdown options by company

---

## D10 — Comment Requirements Feature (Stubbed)
**Status**: PENDING IMPLEMENTATION
**File**: `src/components/admin/AdminTicketTypeManager.js`, lines 45, 66, 284
**Issue**: Comment requirements UI state exists but feature is not implemented (3 TODO markers)
**Fix**: Add `comment_requirements` sheet + AppScript CRUD + frontend wiring
**Impact**: Cannot enforce mandatory comments on ticket state transitions

---

## D11 — SLA Copy in Bulk Workflow Operations
**Status**: PENDING IMPLEMENTATION
**File**: `src/components/admin/BulkWorkflowDialog.js`, line 100
**Issue**: When bulk-copying workflows, SLA rules and approver assignments are NOT copied
**Fix**: Extend `copyWorkflowStep` API to include `step_slas` and `step_approvers`
**Impact**: Bulk operations create incomplete workflow copies

---

## Summary by Priority

| # | Decision | Type | Priority |
|---|----------|------|----------|
| D6 | Firebase Auth in AppScript | Implementation | 🔴 High — affects all audit trails now |
| D7 | Email notifications | Implementation | 🔴 High — SLA escalations silently failing |
| D4 | Server-side quota tracking | Implementation | 🟡 Medium — needed before selling |
| D1 | Target DB choice | Architecture | 🟡 Medium — blocks migration |
| D8 | Collaboration/Tags API | Implementation | 🟡 Medium — feature is stubbed |
| D9 | Dropdown company assignment | Implementation | 🟡 Medium — admin UX gap |
| D2 | API layer architecture | Architecture | 🟠 Depends on D1 |
| D3 | Auth post-migration | Architecture | 🟠 Depends on D1 |
| D5 | Client quota response | Business | 🔵 Client decides when triggered |
| D10 | Comment requirements | Implementation | 🟢 Low — feature not yet promised |
| D11 | SLA copy in bulk ops | Implementation | 🟢 Low — edge case |
