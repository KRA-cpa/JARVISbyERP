# Code Review — 19 Oct 2026 (Release 1: `origin/main3..HEAD`)

**Scope:** `b22e593` (AppScript v9.0 + frontend) and `f79314e` (`build:ci`). Session a4afc9ed, `/code-review`, no verify pass, so these are candidates.
**Line numbers** refer to `appscript_files/APPSCRIPT_v9.0_20261019_0501.txt` or the named file.
**Rule:** fixes go into v9.1. v9.0 is never edited. Tick an item when its fix lands and say where.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| R-01 | 🔴 | `src/api/googleSheet.js:2195` | `submitApproval` calls `this.cache.invalidate('tickets')`, but the class has no `cache` property. It throws a TypeError **after** the backend saved the approval: the UI shows "Failed", skips its refetches, and the retry gets "already approved" / "moved to another step". The external-task Complete button is affected too. | Use the module-level `cache.invalidate('tickets')` |
| R-02 | 🟠 | `src/api/googleSheet.js:333` | Cache invalidation only fires for action names containing create/update/delete, so `assignUserRole` / `removeUserRole` leave the cached `getUsers` response in place (5 min TTL). AdminUserList keeps showing the old roles and badge. | `cache.invalidate('users')` in assignRole/removeRole (and the other role-assignment writes) |
| R-03 | 🟠 | v9.0:7355 | With `all` logic, `can_approve` is false once the user has partially approved, and the same check gates **reject/return**. A partial approver can't stop the ticket. | Apply `already_approved` only when decision === 'approve' |
| R-04 | 🟠 | v9.0:6669 | Return from the first step → status "Returned to Requester" with no `current_step_id`. No route can move the ticket out (progress needs a step; reopen accepts only Cancelled/Rejected). | Allow resubmit/reopen from "Returned to Requester" (back to step 1) |
| R-05 | 🟠 | v9.0:12803 | `updateTicketStatusAction` lets anyone cancel or reopen any ticket. The caller (`useTicketMutations.updateTicketStatus`) never sends `userId`, so it records `system_user`. Spec 3.4: the requester cancels, an admin reopens. | Require `user_id`; cancel = requester (or admin), reopen = admin; send userId from the hook |
| R-06 | 🟡 | v9.0:12305 | `getStepVisitApprovals` counts an arrival only when `from_step_id` ≠ step. A reopen to the same step (S→S) isn't a new visit, so old partial approvals still count. | Treat REOPENED (any non-approval row with `to_step_id` = step) as an arrival |
| R-07 | 🟡 | v9.0:654 | `getCustomFields` doGet reads `entity_type_id` / `entity_category`, but the frontend sends `ticket_type_id` or `entityTypeId` / `entityCategory` (A7). The response is also nested, so `response.data \|\| []` is an object. The custom-field UI shows nothing. | Accept all key spellings; `createDataResponse` |
| R-08 | 🟡 | v9.0:6565 | Each approval re-reads tickets 4×, workflow_steps 3×, step_approvers 2× plus all of ticket_history, inside the lock. Expiry and replaceUserRoles do a full read per row. Approvals slow down as data grows. | Pass the loaded ticket/tables through; batch writes |
| R-09 | 🟡 | `scripts/check-api-contract.js:127` | `hasActionKey` tests `depth === 1` before counting the current line's braces, so an `action:` key in a **one-line** literal is missed (A13 false negative). | Track depth per character, or test after the opening brace |
| R-10 | 🟡 | `src/components/admin/DateBasedRoleAssignmentManager.js:88` | The role list ignores the selected company, and the backend doesn't check that `role.company_id` matches. Company A's role can be assigned in Company B and becomes an approver for B's steps. | Filter roles by `!role.company_id \|\| role.company_id === companyId`; validate in `createUserRoleAssignment` |

**Status (19 Oct 2026, v9.1 batch, session a4afc9ed):**

| # | Status | Where |
|---|---|---|
| R-01 | ✅ fixed | `src/api/googleSheet.js` submitApproval uses the module `cache` |
| R-02 | ✅ fixed | `makeRequest` invalidates the entity cache after every write, not only create/update/delete names |
| R-03 | ✅ fixed | v9.1 `checkUserCanApproveStep` returns `can_act`; `progressTicketWorkflow` gates reject/return on it; `WorkflowStep` shows Reject/Return for `can_act` |
| R-04 | ✅ fixed | v9.1 `reopenTicketToStep` accepts 'Returned to Requester' (back to the step it was returned from); `TicketDetail` "Resubmit" |
| R-05 | ✅ fixed | v9.1 `updateTicketStatusAction`: user_id required; cancel = requester or admin (`isAdminUser`, same rule as UserContext); reopen = admin; resubmit = requester or admin. Hook passes userId |
| R-06 | ✅ fixed | v9.1 `visitApprovalsFromRows`: any non-PARTIAL row arriving at the step starts a new visit |
| R-07 | ✅ fixed | v9.1 doGet `getCustomFields` accepts all key spellings, `createDataResponse`; `getCustomFields` compares ids as strings |
| R-08 | 🟡 partly | v9.1 passes the loaded ticket into the approval check (fewer tickets reads) and `processPendingExpirations` writes from one read. ticket_history is still read in full per approval; `replaceUserRoles` still re-reads per row - revisit when data grows |
| R-09 | ✅ fixed | `hasActionKey` walks characters (one-line literals caught); 6-case self-test |
| R-10 | ✅ fixed | v9.1 `createUserRoleAssignment` refuses another company's role; `DateBasedRoleAssignmentManager` lists global + the chosen company's roles |

Tests: `appscript_files/tools/ROUTES_TEST_v9.1.js` covers R-03/R-04/R-05/R-06/R-07/R-10 (18 tests).
