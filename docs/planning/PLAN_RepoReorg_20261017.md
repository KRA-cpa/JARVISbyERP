<!--
===============================================================================
JARVISbyERP — TICKETING & WORKFLOW ORCHESTRATION SYSTEM
===============================================================================
Document: PLAN_RepoReorg_20261017.md | Author: Kenneth R. Advento | Version: 1.0.0
Created: 17 October 2026 UTC+8 (Philippine Standard Time) | Modified: 17 October 2026 UTC+8 (Philippine Standard Time)
Purpose: Plan to reorganize repo docs and AppScript files into a clear folder structure without breaking references | Status: Draft — awaiting decisions D1–D5

REVISION HISTORY:
- v1.0.0 | 17 October 2026 UTC+8 (Philippine Standard Time) | Kenneth R. Advento | Initial plan (inventory, target layout, manifest, steps, verification)
===============================================================================
-->

# PLAN — Repo File Reorganization

## §1 Context

The repo root has **49 `.md` files plus 15 loose `.txt`/`.js`/backup files**. Live references, finished analyses, and old dumps sit side by side, so it's hard to tell which documents are current. AppScript code is split across `appscript_files/` (31 files: the current versions mixed with 11 old copies and 10 Sept-2025 debug notes), `appscript_versions/` (14 old copies), and loose files in the root.

**Goal:** a small root, one place per kind of document, and every live reference still working.

### What the inventory found (17 Oct 2026)

| Finding | Effect on the plan |
|---|---|
| Nothing in `src/`, `api/`, `scripts/`, or `package.json` references a doc or AppScript path | Moves can't break the build or the npm scripts |
| All 225 doc-to-doc references are bare backtick names (`` `DEVELOPMENT_PLAN.md` ``); there are 0 markdown links and 1 wikilink | The link rewrite is mechanical find-and-replace |
| `Claude.md` is referenced by 21 files; the mandatory references by 10–18 files each | These links need rewriting, but only in **live** docs |
| SessionStart hook, memory files, and `assessment_reference.md` reference `REF_SessionLog.md` (root), `appscript_files/`, and `.claude/conversation-backups/` | Keep all three where they are, so no hook or memory changes are needed |
| 18 docs have 0 inbound references and are dated Sept 2025 | Safe to archive |
| `.obsidian/` exists | Obsidian resolves links by file name, so moves don't affect the vault |

---

## §2 Target Layout

```
jarvisbyerp/
├── Claude.md  README.md  Gemini.md  REF_SessionLog.md     ← stay (tools read them from the root)
├── package.json  package-lock.json  *.config.js  .env.example  .gitignore
├── src/  public/  api/  scripts/  logs/                     ← unchanged
├── docs/
│   ├── reference/   10  mandatory references (Claude.md list) + DATABASE_SCHEMA_UPDATES.txt
│   ├── guides/       7  how-to / setup / testing guides
│   ├── design/       7  feature designs & system analyses
│   ├── planning/     3  active TODOs + this plan
│   ├── backups/      5  conversation-backup system docs
│   └── archive/2025-09/  16  finished audits, debriefs, analyses, superseded plans
└── appscript_files/
    ├── APPSCRIPT_v8.1_20261017_1409.txt   ← latest (timestamped convention)
    ├── APPSCRIPT.txt                       ← frozen v8.0 snapshot
    ├── GUIDE_AppScript_Deploy_and_Schema_Rebuild.md
    ├── APPSCRIPT_API.md  APPSCRIPT_IMPLEMENTATION.md  APPSCRIPT_AUDIT.md
    ├── tools/                 local server, API test scripts, Apps Script test/analyzer snippets
    └── archive/
        ├── versions/          every old APPSCRIPT copy (incl. all of appscript_versions/)
        └── troubleshooting/   Sept-2025 CORS / deployment / debug notes
```

Root goes from **70 files to 10 tracked files** (plus D3's two shortcuts left untracked on disk). `appscript_versions/` is removed (merged into `appscript_files/archive/versions/`).

---

## §3 Decisions Needed (recommended option first)

| # | Question | Recommended | Alternative |
|---|---|---|---|
| D1 | `CLAUDE.md.backup`, `CLAUDE.md.backup2` (Sept 2025 copies of Claude.md) | **Delete**: git history already has every version | Move to `docs/archive/` |
| D2 | `appscript hist.txt` (1.4 MB), `appcript up to 4.8.txt` (976 KB): old pasted version dumps | **Move** to `appscript_files/archive/versions/` | Delete (still in git history) |
| D3 | `AdminCMD.bat`, `runCMD.lnk`: personal Windows shortcuts that are tracked in git | **Untrack** (`git rm --cached`) and add to `.gitignore`; the files stay on disk | Keep tracked |
| D4 | References inside archived docs | **Leave unchanged**: they're historical snapshots | Rewrite them too (adds ~100 edits) |
| D5 | Rename `appscript_files/` to something cleaner (e.g. `appscript/`) | **Keep the name**: memory, the guide, Claude.md, and test scripts use it | Rename and update all of them |

---

## §4 Move Manifest

### Root → `docs/reference/` (live links rewritten)
`PRODUCTION_REQUIREMENTS.md`, `DEVELOPMENT_PLAN.md`, `DEPENDENCY_MAPPING.md`, `SUPERTHINK_AUDIT.md`, `SLA_IMPLEMENTATION.md`, `DATABASE_SCHEMA_UPDATES.txt`, `RESOLUTION_CHECKLIST.md`, `USER_MANAGEMENT_FEATURE_PLAN.md`, `UNIVERSAL_ENTITY_ARCHITECTURE.md`, `REACT_ERROR_130_PREVENTION_GUIDE.md`

### Root → `docs/guides/`
`FIREBASE_INTEGRATION_SETUP.md`, `PHASE_9_IMPLEMENTATION_GUIDE.md`, `TESTING_CHECKLIST.md`, `TEST_AUTOMATION.md`, `DEPLOYMENT_CONFIG.md`, `STATS_TOGGLES.md`, `ADMIN_PANEL_STATS_DOCUMENTATION.md`

### Root → `docs/design/`
`ROLE_MANAGEMENT.md`, `USER_ROLE_SYSTEM_ANALYSIS.md`, `TICKET_TAGS_FEASIBILITY_ANALYSIS.md`, `TICKET_COLLABORATION_SYSTEM.md`, `EXTENSIONS_FRAMEWORK.md`, `EXTERNAL_APP_INTEGRATION.md`, `STAGING_Gemini_Integration.md`

### Root → `docs/planning/`
`SUPERTHINK_TODO_ANALYSIS_2025-09-27.md`, `CURRENT_TODO_2025-11-27.md` (+ this plan, already here)

### Root → `docs/backups/`
`CLAUDE_BACKUP_SETUP.md`, `QUICK_REFERENCE_BACKUPS.md`, `SETUP_AUTOMATED_BACKUPS.md`, `CAPTURE_CURRENT_SESSION_BACKUP.md`, `Automated_Conversation_Backup_Strategy_20251108-190744.md`

### Root → `docs/archive/2025-09/` (frozen; links not rewritten)
`SUPERTHINK_AUDIT_2025.md`, `SUPERTHINK_SCHEMA_AUDIT_RESULTS.md`, `SUPERTHINK_BEYOND APPSCRIPT 6.0.md`, `SUPERTHINK_PAYLOAD_STANDARDIZATION_V6.0.md`, `SUPERTHINK_ANALYSIS_TICKET_TYPE_COMPANY_FEATURES.md`, `REACT_ERROR_130_SUPERTHINK_DUMP.md`, `DROPDOWN_CREATION_ISSUE_DEBRIEF.md`, `SCHEMA_MIGRATION_RESOLUTION.md`, `DOCUMENTATION_GAPS_ANALYSIS.md`, `DEPLOYMENT_CONTEXT_ANALYSIS.md`, `COMPREHENSIVE_DEPLOYMENT_HISTORY.md`, `APPSCRIPT_VERSION_EVOLUTION_ANALYSIS.md`, `TEST_AUTOMATION_V6_UPDATE_PLAN.md`, `IMPLEMENTATION_TODO_PLAN.md`, `DEVELOPMENT_PLAN_UPDATE.md`, `DATABASE_SCHEMA_UPDATES_UPDATED.txt`

### Root → `appscript_files/tools/`
`PHASE_1A_TEST_SCRIPT.js`, `PHASE_10_UNIVERSAL_ENTITY_TEST_SCRIPT.js`, `SCHEMA_ANALYZER_FUNCTION.js`

### Root → `appscript_files/archive/versions/`
`TICKET_TAGS_COLLABORATION_APPSCRIPT.txt` (already merged into v7.0+), `SCHEMA_ANALYZER_FUNCTION_UPDATED.js`, `DUPLICATE_FUNCTIONS_LIST.txt`, `DUPLICATE_FUNCTIONS_COMPARISON.txt`, plus D2's two dumps

### Inside `appscript_files/`
| To | Files |
|---|---|
| `tools/` | `local-appscript-server.js`, `test-api-connection.js`, `quick-api-test.js`, `IMMEDIATE_DEBUG_TEST.html` |
| `archive/versions/` | `APPSCRIPT_CLEAN.txt`, `APPSCRIPT_ENHANCED.txt`, `APPSCRIPT before 0922 0551pm.txt`, `APPSCRIPT_DEPLOY_V5.txt`, `APPSCRIPT_V5.7_BACKUP.txt`, `APPSCRIPT_V6.0.txt`, `APPSCRIPT_V6.4.txt`, `APPSCRIPT_BACKUP.txt`, `APPSCRIPT_BACKUP_BEFORE_DUPLICATE_REMOVAL.txt`, `V7_FUNCTIONS.txt`, `DROPDOWN_FUNCTIONS_CLEAN.txt`, **all 14 files of `appscript_versions/`** |
| `archive/troubleshooting/` | `ADMIN_REFRESH_ERROR_HANDLING.md`, `RESOURCE_EXHAUSTION_FIX.md`, `VERCEL_CORS_FIX.md`, `CORS_FIX_URGENT.md`, `CORS_TROUBLESHOOTING.md`, `DEPLOYMENT_STATUS.md`, `APPSCRIPT_CLAUDE_AI_ISSUES.md`, `DEBUG_API_CONNECTION.md`, `APPSCRIPT_DEPLOYMENT_FIX.md`, `GET_FUNCTIONS_RESOLUTION.md` |
| stay | `APPSCRIPT.txt`, `APPSCRIPT_v8.1_20261017_1409.txt`, `GUIDE_AppScript_Deploy_and_Schema_Rebuild.md`, `APPSCRIPT_API.md`, `APPSCRIPT_IMPLEMENTATION.md`, `APPSCRIPT_AUDIT.md` |

### Stay in root
`Claude.md`, `README.md`, `Gemini.md` (Gemini CLI reads it from the root), `REF_SessionLog.md` (hook + memory point here), configs, `package*.json`, `.env.example`, `.gitignore`

---

## §5 Execution Steps

0. **Pre-flight**
   - Commit this session's open work (AppScript v8.1, guide, doc edits) as its own commit on `main3`, so the reorg diff contains nothing else.
   - Create branch `chore/repo-reorg`.
   - Confirm `git status` is clean.
1. **Manifest file.** Write the §4 tables as `docs/planning/REORG_MANIFEST.tsv` (`old_path<TAB>new_path`). This one file drives both scripts.
2. **Move: `scripts/reorg-move.sh`**
   - For each manifest row, run `mkdir -p` on the target folder, then `git mv "old" "new"`. Quote paths: 3 names contain spaces.
   - Apply D1 (`git rm`) and D3 (`git rm --cached` + `.gitignore`).
   - **Commit 1:** `chore: reorganize docs and AppScript files (renames only)`. With no content changes, git records 100% renames and `git log --follow` keeps each file's history.
3. **Relink: `scripts/reorg-relink.js`**
   - In **live files only** (root `Claude.md`, `README.md`, `REF_SessionLog.md`, `docs/{reference,guides,design,planning,backups}/`, and the top-level docs in `appscript_files/`), rewrite each moved file's backtick reference (`` `NAME` `` or `` `./NAME` ``) to its repo-root-relative path, e.g. `` `docs/reference/DEVELOPMENT_PLAN.md` ``.
   - Use root-relative paths because the existing references are written that way (`./appscript_files/APPSCRIPT.txt`) and Claude reads paths from the repo root.
   - Skip `docs/archive/` (D4).
   - Print a count of rewrites per file.
4. **Hand edits**
   - `Claude.md`:
     - update the File Location of all 10 mandatory references
     - add a short **📁 Repo Layout** section (the §2 tree)
     - bump to v3.5 and add a version-history row
   - `REF_SessionLog.md §1` Subproject Map: update the Key Docs paths.
   - `README.md`: link to `docs/`.
   - **Commit 2:** `docs: update references after repo reorg`.
5. **Not changed, by design:** SessionStart hook, memory files, `assessment_reference.md`, `.claude/`, `scripts/*.sh`, and `src/`, all because their targets don't move.

---

## §6 Verification

| Check | Pass criteria |
|---|---|
| `git show --stat HEAD~1` (commit 1) | Every change is `R100` (pure rename): no adds or deletes except D1/D3 |
| Link checker (in `reorg-relink.js --check`) | Every backtick `*.md` / `*.txt` reference in the live files resolves to an existing file: **0 unresolved** |
| `git log --follow docs/reference/DEVELOPMENT_PLAN.md` | Shows commits from before the move |
| `npm run build` | Succeeds (sanity check; nothing in `src/` depends on the moved paths) |
| `npm run test:api-health` | Same result as before the reorg |
| Root listing (`git ls-files` at depth 1) | 10 tracked files plus folders |
| New Claude Code session | SessionStart reminder appears, `REF_SessionLog.md` is found, and every mandatory reference in Claude.md opens |

**Rollback:** the work lives entirely on `chore/repo-reorg`: `git checkout main3 && git branch -D chore/repo-reorg`. Merge to `main3` only after verification passes.

**Effort:** ~30–45 min, in one session.
