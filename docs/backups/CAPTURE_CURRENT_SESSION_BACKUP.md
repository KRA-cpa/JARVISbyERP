# Capturing Current Open Claude Session

**Version:** 1.0
**Date:** 2025-11-08
**Purpose:** Instructions for capturing current session context before it's saved to disk

---

## Problem

Claude CLI conversations are only saved to `~/.claude/projects/` when:
- The session ends normally
- Files are modified during the session
- The conversation is significant/long enough

**Current open sessions may not be saved yet**, meaning if Claude or your system crashes, you could lose the current conversation.

---

## Solution: Manual Session Capture

### Method 1: Find Current Session ID (Quick)

The current session is accessible in Claude's session storage while active.

**Step 1: Get Current Session ID**

Check the most recent history entry:

```bash
tail -1 ~/.claude/history.jsonl | python -c "import sys, json; data=json.load(sys.stdin); print(f'Session ID: {data.get(\"sessionId\", \"unknown\")}')"
```

**Step 2: Check if Session File Exists**

```bash
SESSION_ID="[paste-session-id-here]"
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g')

# Check if session is saved
ls -lh ~/.claude/projects/*$PROJECT*/$SESSION_ID.jsonl 2>/dev/null

# If file doesn't exist, session is NOT saved yet
```

---

### Method 2: Copy Current Session (If It Exists)

If the session file exists, back it up immediately:

```bash
# Find current project's conversation directory
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g' | sed 's/[^a-zA-Z0-9-]/_/g')
PROJECT_DIR=$(find ~/.claude/projects -type d -name "*$PROJECT*" | head -1)

# Copy most recent conversation (by modification time)
LATEST=$(find "$PROJECT_DIR" -name "*.jsonl" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$LATEST" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp "$LATEST" "./temp/CLI_CURRENT_SESSION_$TIMESTAMP.jsonl"
    echo "✅ Current session backed up to: ./temp/CLI_CURRENT_SESSION_$TIMESTAMP.jsonl"
else
    echo "⚠️  No session file found - conversation not saved to disk yet"
fi
```

---

### Method 3: Export from Browser/App (If Using Web Interface)

**Not applicable for CLI** - This is for claude.ai web interface users only.

---

### Method 4: Force Session Save (Trigger File Modification)

Claude is more likely to save sessions that modify files. To force a save:

```bash
# Create a dummy file modification
echo "# Session marker $(date)" >> .claude/session-markers.txt
git add .claude/session-markers.txt

# This increases the likelihood Claude will save the session
# Exit Claude normally (not crash) to ensure save
```

**Add to .gitignore:**
```
.claude/session-markers.txt
```

---

### Method 5: Checkpoint Current Session (Best Practice)

Create a script to periodically checkpoint the current session:

**File:** `scripts/checkpoint-session.sh`

```bash
#!/bin/bash
# Checkpoint current Claude session

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g' | sed 's/[^a-zA-Z0-9-]/_/g')
PROJECT_DIR=$(find ~/.claude/projects -type d -name "*$PROJECT*" 2>/dev/null | head -1)

if [ -z "$PROJECT_DIR" ]; then
    echo "⚠️  No project directory found for: $PROJECT"
    exit 1
fi

# Find most recently modified conversation
LATEST=$(find "$PROJECT_DIR" -name "*.jsonl" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$LATEST" ]; then
    echo "⚠️  No conversation files found - session not saved yet"
    echo "Tip: Modify a file or use /checkpoint command to trigger save"
    exit 1
fi

# Get modification time
MOD_TIME=$(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null)
NOW=$(date +%s)
AGE_MINUTES=$(( ($NOW - $MOD_TIME) / 60 ))

echo "Latest session: $(basename $LATEST)"
echo "Last modified: $AGE_MINUTES minutes ago"

# Copy if recently modified (within last 10 minutes)
if [ $AGE_MINUTES -lt 10 ]; then
    mkdir -p .claude/checkpoints
    cp "$LATEST" ".claude/checkpoints/checkpoint-$TIMESTAMP.jsonl"
    echo "✅ Checkpoint saved: .claude/checkpoints/checkpoint-$TIMESTAMP.jsonl"
else
    echo "⚠️  Session hasn't been updated recently - might not be current"
fi
```

**Usage:**
```bash
chmod +x scripts/checkpoint-session.sh
./scripts/checkpoint-session.sh
```

---

## Automated Checkpointing

### Option A: Periodic Checkpoints (Every 15 Minutes)

**Windows Task Scheduler:**
```powershell
$repoPath = "Z:\Work Files\Megaworld\SQL"
$action = New-ScheduledTaskAction -Execute "bash" -Argument "-c 'cd ""$repoPath"" && ./scripts/checkpoint-session.sh'"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName "ClaudeSessionCheckpoint" -Action $action -Trigger $trigger
```

**Linux/Mac Crontab:**
```bash
# Every 15 minutes
*/15 * * * * cd /path/to/repo && ./scripts/checkpoint-session.sh
```

### Option B: Hook-Based Checkpointing

Add to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "onToolUse": "bash -c 'cd /path/to/repo && ./scripts/checkpoint-session.sh quick'"
  }
}
```

This triggers a checkpoint after every tool use (Read, Write, Bash, etc.).

---

## Session Storage Locations

### Where Claude Stores Active Sessions:

**Session Storage (Temporary):**
```
~/.claude/Session Storage/
```
- Contains temporary session data
- May not be persisted to disk immediately

**Projects (Permanent):**
```
~/.claude/projects/{PROJECT_NAME}/{SESSION_ID}.jsonl
```
- Permanent storage
- Only saved when session ends normally or meets criteria

**History Index:**
```
~/.claude/history.jsonl
```
- Contains prompts and session IDs
- Updated in real-time

---

## Recovery from Lost Session

If Claude crashes and session wasn't saved:

### 1. Check History for Session ID

```bash
tail -10 ~/.claude/history.jsonl | python -c "
import sys, json
for line in sys.stdin:
    data = json.loads(line)
    print(f'{data.get(\"timestamp\")}: {data.get(\"display\")[:50]} (session: {data.get(\"sessionId\", \"N/A\")[:8]}...)')
"
```

### 2. Check Session Storage

```bash
# List recent session storage files
ls -lt ~/.claude/Session\ Storage/*.ldb | head -5

# Try to extract data (advanced)
xxd ~/.claude/Session\ Storage/000011.ldb | grep -a "conversation\|message" | head -20
```

### 3. Check Shell Snapshots

```bash
# Claude stores shell snapshots
ls -lt ~/.claude/shell-snapshots/ | head -10
```

### 4. Check Checkpoints (If You Set Them Up)

```bash
ls -lt .claude/checkpoints/ | head -5
```

---

## Prevention Strategies

### Best Practices to Avoid Losing Sessions:

1. **✅ Exit Claude Normally**
   - Use `/exit` or Ctrl+D to close properly
   - Don't kill the process

2. **✅ Make File Modifications**
   - Sessions with file changes are more likely to be saved
   - Write a dummy file if needed

3. **✅ Use Checkpoints**
   - Run checkpoint script periodically
   - Especially before risky operations

4. **✅ Regular Backups**
   - Use the automated backup system (runs daily)
   - Captures all saved sessions

5. **✅ Long Conversations**
   - Longer conversations are more likely to be persisted
   - Brief sessions may not be saved

---

## Quick Reference Commands

### Check Current Session Status

```bash
# Get current session ID
tail -1 ~/.claude/history.jsonl | python -c "import sys, json; print(json.load(sys.stdin).get('sessionId', 'unknown'))"

# Check if session file exists
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g')
find ~/.claude/projects -name "*.jsonl" -path "*$PROJECT*" -mmin -30

# List recent sessions
find ~/.claude/projects -name "*.jsonl" -mmin -60 -exec ls -lh {} \;
```

### Manual Checkpoint

```bash
# Quick checkpoint
./scripts/checkpoint-session.sh

# Or manual copy
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g')
LATEST=$(find ~/.claude/projects/*$PROJECT* -name "*.jsonl" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
cp "$LATEST" "./temp/CLI_CHECKPOINT_$(date +%Y%m%d-%H%M%S).jsonl"
```

### Force Session Save

```bash
# Create dummy modification to trigger save
echo "# Checkpoint $(date)" >> .claude/session-markers.txt
```

---

## Integration with Backup System

The automated backup system (`scripts/backup-conversations.sh`) will capture:
- ✅ All saved sessions (in `~/.claude/projects/`)
- ✅ Checkpoints (if you copy them to backup area)
- ❌ Current unsaved session (not yet persisted)

**To include checkpoints in backups:**

```bash
# Copy checkpoints to backup staging area
cp .claude/checkpoints/*.jsonl .claude/conversation-backups/latest/ 2>/dev/null

# Then run backup
./scripts/backup-conversations.sh
```

---

## Troubleshooting

### "No session file found"

**Cause:** Session hasn't been saved to disk yet
**Solution:**
- Make a file modification
- Wait for Claude to auto-save
- Exit Claude normally to force save

### "Session file is outdated"

**Cause:** Current session changes not written to disk
**Solution:**
- Create a checkpoint now
- Modify a file to trigger save
- Exit and restart Claude

### "Can't find project directory"

**Cause:** Project name mangling or directory not created yet
**Solution:**
```bash
# List all project directories
ls -la ~/.claude/projects/

# Search for your project
find ~/.claude/projects -type d -name "*SQL*"
```

---

## Summary

| Method | When to Use | Reliability |
|--------|-------------|-------------|
| **Automated Backup** | Daily preservation | ✅ High (saved sessions only) |
| **Manual Checkpoint** | Before risky operations | ✅ High (if session saved) |
| **Periodic Checkpoints** | During long sessions | ⚠️ Medium (if session active) |
| **Force Save** | Critical conversations | ⚠️ Medium (requires file mod) |
| **Session Storage** | After crash | ❌ Low (temporary storage) |

**Recommendation:** Use automated backups + periodic checkpoints for best protection.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-08 | Initial session capture guide |

---

**END OF SESSION CAPTURE GUIDE**

✅ **Best Practice:** Run `./scripts/checkpoint-session.sh` before important operations or every 15-30 minutes during long sessions.
