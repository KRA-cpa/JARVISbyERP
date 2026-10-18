# Claude CLI Conversation Backup - Portable Setup Guide

**Version:** 1.2
**Date:** 2025-11-08 (v1.2: 2026-10-18 — scripts synced to v1.1)
**Purpose:** Copy this file to any directory/repo to set up automated conversation backups

> **Scripts synced with `scripts/` v1.1 (18 Oct 2026)** — code review fixes CR-08–CR-13 (see `docs/guides/GUIDE_CodeReview_Compliance.md` §2). The files in `scripts/` are the source of truth; re-copy from there if they differ.

---

## Overview

This guide sets up automated backups of Claude CLI conversation history with:
- ✅ **Incremental backups** (only new/modified conversations)
- ✅ **AES-256 encryption** for privacy
- ✅ **Git integration** (commits encrypted backups)
- ✅ **Automated scheduling** (daily backups every 24-36 hours)
- ✅ **Claude monitors health** (proactive backup if overdue)
- ✅ **Space-efficient** (~200MB/year)

**🤖 CLAUDE USERS: This system includes proactive monitoring!**
- Claude checks backup health at start of each session
- If backup overdue (>36 hours), Claude runs backup automatically
- You don't need to ask - Claude handles it!

---

## Quick Start (5 Minutes)

### Step 1: Create Directory Structure

```bash
mkdir -p .claude/conversation-backups/{latest,encrypted}
mkdir -p scripts
```

### Step 2: Generate Encryption Password

```bash
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt
echo "✅ Password generated. BACK UP THIS FILE SEPARATELY!"
```

⚠️ **CRITICAL:** Back up this password file to a password manager or secure location!

### Step 3: Initialize Backup Index

```bash
cat > .claude/conversation-backups/backup-index.json <<'EOF'
{
  "last_backup": "1970-01-01T00:00:00Z",
  "total_conversations": 0,
  "backed_up_sessions": [],
  "backup_files": []
}
EOF
```

### Step 4: Update .gitignore

```bash
cat >> .gitignore <<'EOF'

# Claude conversation backups
.claude/conversation-backups/latest/
.claude/conversation-backups/backup-password.txt
!.claude/conversation-backups/encrypted/
!.claude/conversation-backups/backup-index.json
EOF
```

### Step 4b: Create Project-Folder Helper

Create file: `scripts/lib/claude-project-dir.sh` (sourced by the backup and checkpoint scripts — finds the exact Claude project folder, never a broader one)

```bash
#!/bin/bash
# claude-project-dir.sh — find this repo's Claude Code project folder (sourced by backup/checkpoint scripts)
# Claude names the folder after the repo path with every non-alphanumeric character replaced by '-',
# e.g. "Z:/Work Files/project/jarvisbyerp" -> "Z--Work-Files-project-jarvisbyerp".
# Usage: source scripts/lib/claude-project-dir.sh; PROJECT_DIR=$(claude_project_dir) || exit 1

claude_project_dir() {
    local projects_root="$HOME/.claude/projects"
    local repo_path key
    repo_path=$(pwd -W 2>/dev/null || pwd)   # pwd -W = Windows path on Git Bash
    key=$(printf '%s' "$repo_path" | sed 's/[^a-zA-Z0-9]/-/g')

    if [ -d "$projects_root/$key" ]; then
        echo "$projects_root/$key"
        return 0
    fi

    echo "ERROR: Claude project folder not found: $projects_root/$key" >&2
    echo "Run this from the repo root. Folders for this repo name:" >&2
    find "$projects_root" -maxdepth 1 -type d -name "*$(basename "$repo_path" | sed 's/[^a-zA-Z0-9]/-/g')*" >&2
    return 1
}
```

### Step 5: Create Backup Script

Create file: `scripts/backup-conversations.sh`

```bash
#!/bin/bash
# Claude CLI Conversation Backup Script
# Version: 1.1 (17 Oct 2026: code review CR-08/CR-09/CR-12 — commit only backup files, fail on
#               encryption errors, password via file not argv, exact project folder only)
# Usage: ./scripts/backup-conversations.sh [quick|full]   (run from the repo root)

set -o pipefail
source "$(dirname "$0")/lib/claude-project-dir.sh"

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
SOURCE_DIR="$HOME/.claude/projects"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
# Taken before the scan: a conversation written during the backup is newer and gets picked up next run
SCAN_START=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")
PASSWORD_FILE="$BACKUP_DIR/backup-password.txt"
INDEX_FILE="$BACKUP_DIR/backup-index.json"
MODE="${1:-full}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Claude Conversation Backup ===${NC}"
echo "Mode: $MODE"
echo "Timestamp: $TIMESTAMP"

# Check prerequisites
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}ERROR: Claude projects directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

if [ ! -f "$PASSWORD_FILE" ]; then
    echo -e "${RED}ERROR: Password file not found: $PASSWORD_FILE${NC}"
    echo "Run: openssl rand -base64 32 > $PASSWORD_FILE"
    exit 1
fi

# Create backup directories
mkdir -p "$BACKUP_DIR/latest"
mkdir -p "$BACKUP_DIR/encrypted"

# Get last backup timestamp
if command -v jq &> /dev/null; then
    LAST_BACKUP=$(jq -r '.last_backup // "1970-01-01T00:00:00Z"' "$INDEX_FILE" 2>/dev/null || echo "1970-01-01T00:00:00Z")
else
    LAST_BACKUP="1970-01-01T00:00:00Z"
    echo -e "${YELLOW}NOTE: jq not installed, backing up all conversations${NC}"
fi
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_BACKUP" +%s 2>/dev/null || echo 0)

echo "Last backup: $LAST_BACKUP"

# Find this repo's project directory (exact match only — never fall back to every project's conversations)
if ! PROJECT_DIR=$(claude_project_dir); then
    echo -e "${RED}ERROR: Backup aborted — no project directory for this repo${NC}"
    exit 1
fi

echo "Source: $PROJECT_DIR"

# Find new/modified conversations
NEW_FILES=()
while IFS= read -r -d '' file; do
    FILE_MTIME=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    if [ "$FILE_MTIME" -gt "$LAST_BACKUP_EPOCH" ]; then
        NEW_FILES+=("$file")
    fi
done < <(find "$PROJECT_DIR" -name "*.jsonl" -type f -print0 2>/dev/null)

if [ ${#NEW_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No new conversations to backup${NC}"
    exit 0
fi

echo -e "${GREEN}Found ${#NEW_FILES[@]} new/modified conversations${NC}"

# Copy new files to latest/
for file in "${NEW_FILES[@]}"; do
    SESSION_ID=$(basename "$file")
    cp "$file" "$BACKUP_DIR/latest/$SESSION_ID"
    echo "  📄 $SESSION_ID"
done

# Create encrypted archive
BACKUP_FILE="$BACKUP_DIR/encrypted/backup-$TIMESTAMP.enc"
echo -e "${YELLOW}Encrypting...${NC}"

# Password is read from the file by openssl (file:), so it never appears in a process listing.
# Git Bash doesn't translate a POSIX path after "file:", so give openssl a Windows path there.
# pipefail makes a tar or openssl failure fail the whole pipeline.
PASSWORD_PATH="$PASSWORD_FILE"
command -v cygpath &> /dev/null && PASSWORD_PATH=$(cygpath -m "$PASSWORD_FILE")
if ! tar -czf - -C "$BACKUP_DIR/latest" . | \
    openssl enc -aes-256-cbc -salt -pbkdf2 -pass "file:$PASSWORD_PATH" \
    -out "$BACKUP_FILE"; then
    echo -e "${RED}ERROR: Encryption failed — partial file removed, index and git left unchanged${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file is empty — removed, index and git left unchanged${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -m "$BACKUP_FILE" 2>/dev/null | cut -f1)
[[ "$BACKUP_SIZE" =~ ^[0-9]+$ ]] || BACKUP_SIZE=0
echo -e "${GREEN}✅ Created: backup-$TIMESTAMP.enc ($BACKUP_SIZE MB)${NC}"

# Update index
if command -v jq &> /dev/null; then
    CURRENT_TIME="$SCAN_START"

    jq --arg timestamp "$CURRENT_TIME" \
       --arg backup_file "backup-$TIMESTAMP.enc" \
       --argjson sessions_count "${#NEW_FILES[@]}" \
       --argjson size_mb "$BACKUP_SIZE" \
       '.last_backup = $timestamp |
        .total_conversations = (.total_conversations + $sessions_count) |
        .backup_files += [{
            filename: $backup_file,
            created: $timestamp,
            sessions_count: $sessions_count,
            size_mb: $size_mb
        }]' "$INDEX_FILE" > "$INDEX_FILE.tmp" && mv "$INDEX_FILE.tmp" "$INDEX_FILE" \
        || echo -e "${RED}WARNING: index update failed — last_backup not advanced${NC}"
else
    echo -e "${YELLOW}WARNING: jq not installed, skipping index update${NC}"
fi

# Git commit (optional). The pathspec commits ONLY the backup file and index, never other staged work.
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git add "$BACKUP_FILE" "$INDEX_FILE" && \
       git commit -m "chore: backup conversations $TIMESTAMP - ${#NEW_FILES[@]} sessions" -- "$BACKUP_FILE" "$INDEX_FILE"; then
        echo -e "${GREEN}✅ Committed to git (backup files only)${NC}"
    else
        echo -e "${YELLOW}⚠️  Git commit failed — backup file is on disk but not committed${NC}"
    fi
fi

echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Files: ${#NEW_FILES[@]} conversations"
echo "Size: $BACKUP_SIZE MB encrypted"
echo "Location: $BACKUP_FILE"
```

### Step 6: Make Script Executable

```bash
chmod +x scripts/backup-conversations.sh
```

### Step 7: Create Health Check Script

Create file: `scripts/check-backup-health.sh`

```bash
#!/bin/bash
# Check backup health - Claude runs this at session start
# Version: 1.1 (17 Oct 2026: code review CR-10 — age comes from backup-index.json last_backup;
#               file mtime is only a fallback, since a git checkout/clone resets it)

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
ENCRYPTED_DIR="$BACKUP_DIR/encrypted"
INDEX_FILE="$BACKUP_DIR/backup-index.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Backup Health Check ==="

# Check if backup system is initialized
if [ ! -d "$ENCRYPTED_DIR" ]; then
    echo -e "${RED}❌ Backup system not initialized${NC}"
    echo "Run: ./scripts/backup-conversations.sh"
    exit 1
fi

# Check if any backups exist
if [ -z "$(ls -A "$ENCRYPTED_DIR" 2>/dev/null)" ]; then
    echo -e "${RED}❌ No backups found${NC}"
    echo "Run: ./scripts/backup-conversations.sh"
    exit 1
fi

# Get latest backup file
LATEST_BACKUP=$(ls -t "$ENCRYPTED_DIR"/*.enc 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ No backup files found${NC}"
    exit 1
fi

# Calculate backup age from the index (the real backup time); fall back to file mtime
BACKUP_TIME=""
AGE_SOURCE="backup-index.json last_backup"
if [ -f "$INDEX_FILE" ] && command -v jq &> /dev/null; then
    LAST_BACKUP=$(jq -r '.last_backup // empty' "$INDEX_FILE" 2>/dev/null)
    if [ -n "$LAST_BACKUP" ]; then
        BACKUP_TIME=$(date -d "$LAST_BACKUP" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S%z" "$LAST_BACKUP" +%s 2>/dev/null)
    fi
fi
if [ -z "$BACKUP_TIME" ]; then
    AGE_SOURCE="file mtime (index unreadable — may look newer than it is after a checkout)"
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")
fi
NOW=$(date +%s)
HOURS_SINCE=$(( ($NOW - $BACKUP_TIME) / 3600 ))

echo "Latest backup: $(basename "$LATEST_BACKUP")"
echo "Age: $HOURS_SINCE hours ago (from $AGE_SOURCE)"

# Get backup stats from index
if [ -f "$INDEX_FILE" ] && command -v jq &> /dev/null; then
    BACKUP_COUNT=$(jq '.backup_files | length' "$INDEX_FILE" 2>/dev/null || echo "unknown")
    TOTAL_CONVERSATIONS=$(jq '.total_conversations' "$INDEX_FILE" 2>/dev/null || echo "unknown")
    echo "Total backups: $BACKUP_COUNT"
    echo "Total conversations: $TOTAL_CONVERSATIONS"
fi

# Health status
if [ $HOURS_SINCE -gt 36 ]; then
    echo -e "${RED}🔴 BACKUP OVERDUE (>36 hours)${NC}"
    echo "ACTION REQUIRED: Run ./scripts/backup-conversations.sh"
    exit 2
elif [ $HOURS_SINCE -gt 24 ]; then
    echo -e "${YELLOW}⚠️  Backup due soon (>24 hours)${NC}"
    echo "Recommended: Run ./scripts/backup-conversations.sh"
    exit 1
else
    echo -e "${GREEN}✅ Backup status: HEALTHY${NC}"
    exit 0
fi
```

Make executable:
```bash
chmod +x scripts/check-backup-health.sh
```

### Step 8: Test Backup

```bash
./scripts/backup-conversations.sh
```

You should see output like:
```
=== Claude Conversation Backup ===
Found 5 new/modified conversations
✅ Created: backup-20251108-190744.enc (2 MB)
✅ Committed to git
=== Backup Complete ===
```

### Step 9: Add Claude Instructions to CLAUDE.md

Add this section to your `CLAUDE.md` (project documentation):

```markdown
## Claude Conversation History Backup

**🤖 CLAUDE: CHECK THIS AT START OF EACH SESSION!**
- Run `./scripts/check-backup-health.sh` to verify backup status
- If backup overdue (>36 hours), proactively run backup
- This is YOUR responsibility - user shouldn't need to ask!

### Quick Backup
\`\`\`bash
# Run backup manually
./scripts/backup-conversations.sh

# Check backup health
./scripts/check-backup-health.sh
\`\`\`
```

---

## Schedule Automated Backups

### Option A: Daily Schedule (Recommended)

**Windows - Task Scheduler:**

```powershell
# Run this in PowerShell (as Administrator)
$repoPath = "Z:\Work Files\Megaworld\SQL"  # UPDATE THIS PATH
$action = New-ScheduledTaskAction -Execute "bash" -Argument "-c 'cd ""$repoPath"" && ./scripts/backup-conversations.sh'"
$trigger = New-ScheduledTaskTrigger -Daily -At 11PM
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "ClaudeConversationBackup_$(Split-Path $repoPath -Leaf)" -Action $action -Trigger $trigger -Settings $settings
```

**Linux/Mac - Crontab:**

```bash
# Edit crontab
crontab -e

# Add this line (update path):
0 23 * * * cd /path/to/your/repo && ./scripts/backup-conversations.sh >> /tmp/backup.log 2>&1
```

### Option B: Per-Session Hook (More Frequent)

Add to `.claude/settings.local.json` in the repo:

```json
{
  "hooks": {
    "onExit": "bash -c 'cd /path/to/repo && ./scripts/backup-conversations.sh quick'"
  }
}
```

---

## Restoration

### List Available Backups

```bash
jq -r '.backup_files[] | "\(.created) - \(.filename) (\(.sessions_count) sessions)"' \
    .claude/conversation-backups/backup-index.json
```

### Restore Specific Backup

```bash
# Set variables
BACKUP_FILE="backup-20251108-190744.enc"  # UPDATE THIS
RESTORE_DIR=".claude/conversation-backups/restored-$(date +%Y%m%d-%H%M%S)"

# Decrypt and extract (openssl reads the password from the file, so it never appears on the command line)
mkdir -p "$RESTORE_DIR"
openssl enc -aes-256-cbc -d -pbkdf2 -pass "file:.claude/conversation-backups/backup-password.txt" \
    -in ".claude/conversation-backups/encrypted/$BACKUP_FILE" | \
    tar -xzf - -C "$RESTORE_DIR"

echo "Restored to: $RESTORE_DIR"
ls -lh "$RESTORE_DIR"
```

### Copy Restored Conversations Back

```bash
# Copy back to Claude's directory
cp "$RESTORE_DIR"/*.jsonl "$HOME/.claude/projects/[project-name]/"
```

---

## Monitoring & Health Checks

### Create Health Check Script

Create file: `scripts/check-backup-health.sh`

```bash
#!/bin/bash
# Check backup health

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
INDEX_FILE="$BACKUP_DIR/backup-index.json"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ No backup index found"
    exit 1
fi

LAST_BACKUP=$(jq -r '.last_backup' "$INDEX_FILE")
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_BACKUP" +%s)
NOW_EPOCH=$(date +%s)
HOURS_SINCE=$(( ($NOW_EPOCH - $LAST_BACKUP_EPOCH) / 3600 ))

echo "=== Backup Health Check ==="
echo "Last backup: $LAST_BACKUP ($HOURS_SINCE hours ago)"

if [ $HOURS_SINCE -gt 48 ]; then
    echo "⚠️  WARNING: Backup is overdue!"
else
    echo "✅ Backup health: OK"
fi

BACKUP_COUNT=$(jq '.backup_files | length' "$INDEX_FILE")
TOTAL_CONVERSATIONS=$(jq '.total_conversations' "$INDEX_FILE")
echo "Total backups: $BACKUP_COUNT"
echo "Total conversations backed up: $TOTAL_CONVERSATIONS"

if [ ! -f "$BACKUP_DIR/backup-password.txt" ]; then
    echo "❌ ERROR: Password file missing!"
fi
```

Make executable and run:

```bash
chmod +x scripts/check-backup-health.sh
./scripts/check-backup-health.sh
```

---

## Security Best Practices

### Password Management

**DO:**
- ✅ Store password in `.claude/` directory (gitignored)
- ✅ Back up password to password manager (1Password, LastPass, Bitwarden)
- ✅ Make secure offline backup of password
- ✅ Use strong encryption (AES-256 is default)

**DON'T:**
- ❌ Commit password to Git
- ❌ Email or message the password
- ❌ Store password with encrypted files
- ❌ Share password unnecessarily

### Git Security

**Safe to Commit:**
- ✅ `encrypted/` directory (encrypted backups)
- ✅ `backup-index.json` (metadata only)
- ✅ Backup scripts

**Never Commit:**
- ❌ `latest/` directory (unencrypted conversations)
- ❌ `backup-password.txt` (encryption key)
- ❌ Restored conversations

---

## Customization

### Change Backup Location

Edit `scripts/backup-conversations.sh`:

```bash
# Change this line:
BACKUP_DIR="$(pwd)/.claude/conversation-backups"

# To (example):
BACKUP_DIR="/path/to/external/drive/backups"
```

### Change Encryption Password

```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)
echo "$NEW_PASSWORD" > .claude/conversation-backups/backup-password.txt

echo "⚠️  New password generated. Re-encrypt old backups if needed."
```

### Add Cloud Sync

Sync encrypted backups to cloud storage:

```bash
# Example: OneDrive
ln -s "$(pwd)/.claude/conversation-backups/encrypted" \
      "$HOME/OneDrive/ClaudeBackups"

# Example: Dropbox
ln -s "$(pwd)/.claude/conversation-backups/encrypted" \
      "$HOME/Dropbox/ClaudeBackups"
```

---

## Troubleshooting

### "No new conversations to backup"

**Cause:** No conversations modified since last backup
**Solution:** This is normal - script exits cleanly

### "Password file not found"

**Cause:** Password file missing or wrong path
**Solution:** Run Step 2 again to generate password

### "jq not installed"

**Cause:** jq JSON processor not available
**Solution:**
- **Windows:** `choco install jq` or download from https://jqlang.github.io/jq/
- **Linux:** `sudo apt install jq` or `sudo yum install jq`
- **Mac:** `brew install jq`

### Backup file corrupted

**Cause:** Interrupted backup or disk error
**Solution:** Delete corrupt backup file, run backup again

### Cannot decrypt backup

**Cause:** Wrong password or corrupted file
**Solution:**
- Verify password file contents
- Try older backup files
- Check if backup file is complete (not truncated)

---

## Copy to Other Repos/Directories

### Quick Setup for New Repo

1. **Copy this file** (`docs/backups/CLAUDE_BACKUP_SETUP.md`) to new repo
2. **Run Quick Start steps** (1-7 above)
3. **Update scheduled task path** (if using scheduled backups)
4. **Test backup:** `./scripts/backup-conversations.sh`

### Batch Setup Script

Create file: `setup-claude-backup.sh` (copy to each repo)

```bash
#!/bin/bash
# Quick setup for Claude conversation backups

set -e

echo "=== Claude Backup Setup ==="

# Step 1-3: Create structure
mkdir -p .claude/conversation-backups/{latest,encrypted}
mkdir -p scripts
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt

cat > .claude/conversation-backups/backup-index.json <<'EOF'
{"last_backup":"1970-01-01T00:00:00Z","total_conversations":0,"backed_up_sessions":[],"backup_files":[]}
EOF

# Step 4: Update gitignore
if ! grep -q ".claude/conversation-backups" .gitignore 2>/dev/null; then
    cat >> .gitignore <<'EOF'

# Claude conversation backups
.claude/conversation-backups/latest/
.claude/conversation-backups/backup-password.txt
!.claude/conversation-backups/encrypted/
!.claude/conversation-backups/backup-index.json
EOF
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy backup script to: scripts/backup-conversations.sh"
echo "2. Make executable: chmod +x scripts/backup-conversations.sh"
echo "3. Test: ./scripts/backup-conversations.sh"
echo ""
echo "⚠️  IMPORTANT: Back up password file:"
echo "    .claude/conversation-backups/backup-password.txt"
```

Usage:
```bash
chmod +x setup-claude-backup.sh
./setup-claude-backup.sh
```

---

## FAQ

**Q: How much disk space do backups use?**
A: ~200MB per year with daily backups (depends on conversation volume)

**Q: Can I backup multiple repos to same location?**
A: No, each repo should have its own backup directory

**Q: What if I lose the password?**
A: Data cannot be recovered. AES-256 encryption is unbreakable without the password.

**Q: Can I share encrypted backups publicly?**
A: Yes, encrypted files are safe to share - unreadable without password

**Q: How do I backup conversations from old repos?**
A: Run a one-time manual export before setting up automated backups

**Q: Do I need jq installed?**
A: Recommended but not required. Script works without it (no index updates)

**Q: Can I use different encryption?**
A: Yes, modify the openssl command in the script (requires code changes)

---

## Support & References

- **GitHub Issue:** https://github.com/anthropics/claude-code/issues/5024
- **Claude Documentation:** https://code.claude.com/docs/
- **OpenSSL Documentation:** https://www.openssl.org/docs/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-08 | Initial portable setup guide |

---

**END OF PORTABLE SETUP GUIDE**

✅ Copy this file to any repo and follow the Quick Start section to set up automated conversation backups.

⚠️ **Remember:** Back up your password file separately and securely!
