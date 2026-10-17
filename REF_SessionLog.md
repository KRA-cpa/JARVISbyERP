<!--
===============================================================================
JARVISbyERP — TICKETING & WORKFLOW ORCHESTRATION SYSTEM
===============================================================================
Document: REF_SessionLog.md | Author: Kenneth R. Advento | Version: 1.0.0
Created: 17 October 2026 UTC+8 (Philippine Standard Time) | Modified: 17 October 2026 UTC+8 (Philippine Standard Time)
Purpose: Track open/unfinished Claude Code sessions; subproject map; session logging rules and enforcement instructions | Status: Active

REVISION HISTORY:
- v1.0.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Initial creation — copied from HolmesWatson REF_SessionLog.md v1.0.0 setup (session log, subproject map, rules, enforcement)
===============================================================================
-->

# REF — Session Log

> **Single source of truth** for all open/unfinished Claude Code sessions in this repo.
> Claude reads this at session start (enforced via Claude.md §🗓️ SESSION LOG + settings hook).

---

## §1 Subproject Map

| Subproject | Root Folder | Key Docs |
|---|---|---|
| Frontend | `src/`, `public/` | `DEVELOPMENT_PLAN.md`, `DEPENDENCY_MAPPING.md`, `REACT_ERROR_130_PREVENTION_GUIDE.md` |
| AppScript Backend | `appscript_files/`, `appscript_versions/` | `appscript_files/APPSCRIPT.txt`, `APPSCRIPT_VERSION_EVOLUTION_ANALYSIS.md`, `DATABASE_SCHEMA_UPDATES.txt` |
| API | `api/` | `PRODUCTION_REQUIREMENTS.md` (API testing), `RESOLUTION_CHECKLIST.md` |
| Docs / Planning | `/` (root) | `Claude.md`, `SUPERTHINK_TODO_ANALYSIS_2025-09-27.md`, `CURRENT_TODO_*.md`, `USER_MANAGEMENT_FEATURE_PLAN.md`, `UNIVERSAL_ENTITY_ARCHITECTURE.md` |
| Backup System | `scripts/`, `.claude/conversation-backups/` | `CLAUDE_BACKUP_SETUP.md`, `QUICK_REFERENCE_BACKUPS.md` |
| Meta | — | Claude Code setup, repo hygiene, git |

---

## §2 Session Log

| Session ID | Date | Subproject / Topic | Status | Output File |
|---|---|---|---|---|
| 2b1ab64c | 17 Oct 2026 | Meta / Repo check (backup overdue, password in unpushed commits, uncommitted Phase 10.0 work) + session log setup copied from HolmesWatson | CLOSED — 3 items carry forward (see Pending below) | `REF_SessionLog.md`; Claude.md v3.4 (🗓️ SESSION LOG); `.claude/settings.local.json` SessionStart hook (now gitignored); memory/feedback_session_log_workflow.md; backup-20261017-135150.enc; commits 60fc8e5..6a70fe6; plan `~/.claude/plans/check-repo-refactored-shore.md` |

| e9025b24 | 17 Oct 2026 | AppScript Backend / v8.1 timestamped file + `rebuildAllTables()` safe schema repair (all 33 tables) | OPEN — pending: user implements `resolveColumnMapping()`, runs guide in Apps Script | `appscript_files/APPSCRIPT_v8.1_20261017_1409.txt`; `appscript_files/GUIDE_AppScript_Deploy_and_Schema_Rebuild.md`; `docs/planning/PLAN_RepoReorg_20261017.md` (awaiting D1–D5); memory/feedback_appscript_timestamped_files.md; plan `~/.claude/plans/select-one-high-impact-vast-shamir.md` |

### Pending — 2b1ab64c (17 Oct 2026)

1. **Push `main3`** — 4 commits ahead of `origin/main3` (60fc8e5..6a70fe6 + session-log close-out); verified password-free (tree + messages). Awaiting user OK.
2. **Verify SessionStart hook** — the first new session should show "SESSION LOG REMINDER" in startup context. Hook matcher is `startup` only: a fresh `claude` launch fires it; `/clear` does NOT (matcher `clear`) — add a `clear` matcher if `/clear` is the usual way to start a new convo.
3. **Delete local safety branch** `backup/main3-pre-rewrite-20261017` once satisfied with the rewrite — it contains the backup password; never push it (and avoid `git push --all` until deleted).
4. *(Optional, not started)* Review/merge `origin/claude/verify-todos-codebase-JgyRz` (quota checker, redeploy plan, decisions register); fix malformed global git `safe.directory` entries.

---

**How to find your Session ID**
JSONL files are stored at `%USERPROFILE%\.claude\projects\[sanitized-path]\`.
The path **varies by terminal** — the project folder name is derived from the working directory:
- This terminal: `C:\Users\clark\.claude\projects\Z--Work-Files-project-jarvisbyerp\`
- Another terminal may map the same repo to a different drive/path

To find the right folder: open `%USERPROFILE%\.claude\projects\` and look for the subfolder
matching the jarvisbyerp repo path on that machine.
**Session ID = first 8 characters of the JSONL filename.**

---

## §3 Session Logging Rules

Claude must follow these rules in every session:

1. **Log OPEN at the start** — as early as possible in the session; add a row to §2 above
2. **Ask subproject if not specified** — if the first message does not make the subproject clear, ask before logging
3. **Mark CLOSED when any of the following occurs:**
   - (a) A session dump file is written
   - (b) Work is formally wrapped (all tasks done, no open items)
   - (c) User asks "OK to close?" → Claude checks for open decisions/pending items → Claude confirms clear or flags what's still open → user proceeds to close
4. **Handoff exception:** If the user explicitly states they are closing this convo and continuing the task in a new convo, do NOT mark CLOSED — carry the row forward as a handoff note in the Output File column
5. **Definition:** Unfinished = not yet closed by any of the above criteria, regardless of whether output files exist

---

## §4 Enforcement Instructions

At the start of every Claude Code session, Claude must:

1. Read `Claude.md` §🗓️ SESSION LOG
2. Read this file (`REF_SessionLog.md`) and log the current session in §2
3. **If on a new machine or the memory file is missing:** Write `feedback_session_log_workflow.md`
   at `%USERPROFILE%\.claude\projects\[project-folder]\memory\` with content pointing to this file
   as the source of truth; also add the pointer line to `MEMORY.md` in the same folder
4. **If on a new machine and the hook is missing:** recreate the SessionStart hook below in `.claude/settings.local.json`

**SessionStart hook** (add under the top-level `"hooks"` key of `.claude/settings.local.json`):

```json
"SessionStart": [
  {
    "matcher": "startup",
    "hooks": [
      {
        "type": "command",
        "command": "echo SESSION LOG REMINDER - read REF_SessionLog.md in the jarvisbyerp repo root and log this session in its section 2 per Claude.md SESSION LOG - status OPEN, close per section 3."
      }
    ]
  }
]
```

**Cross-terminal coverage summary:**

| Mechanism | In repo? | Works on any terminal? |
|---|---|---|
| This file (REF_SessionLog.md) | Yes | Yes |
| Claude.md §🗓️ SESSION LOG | Yes | Yes |
| SessionStart hook (`.claude/settings.local.json`) | No — gitignored (local file) | No — recreate per machine (see step 4 above) |
| Memory file (feedback_session_log_workflow.md) | No — user profile | No — write on first use per step 3 above |
