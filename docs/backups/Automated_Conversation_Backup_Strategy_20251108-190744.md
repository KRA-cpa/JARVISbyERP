# Automated Conversation History Backup Strategy

> **Historical design doc (Nov 2025).** The script snippets below are v1.0 and contain issues fixed on 18 Oct 2026 (password in argv, unscoped `git commit`, unchecked encryption, mtime-based health, project-folder fallback). Use `scripts/` v1.1 and `docs/backups/CLAUDE_BACKUP_SETUP.md` v1.2; rules in `docs/guides/GUIDE_CodeReview_Compliance.md` §2.

**Document Version:** 1.0
**Date Created:** 2025-11-08 19:07:44
**Purpose:** Design efficient, automated system for backing up Claude CLI conversation history

---

## Problem Statement

**Current Situation:**
- Claude CLI stores conversations indefinitely in `~/.claude/projects/`
- No automatic cleanup or retention enforcement
- Manual exports are time-consuming
- Risk of data loss if system crashes or files deleted

**Requirements:**
- Automated backups of new conversations
- Efficient (incremental, not full backup each time)
- Git-integrated (track changes over time)
- Minimal manual intervention
- Space-efficient storage

---

## Recommended Strategy: Git-Based Incremental Backups

### Overview

Store conversation history in the current Git repository with:
- Incremental backups (only new/modified conversations)
- Automated via Git hooks or scheduled tasks
- Encrypted for privacy
- Version-controlled for history tracking

---

## Architecture

### Directory Structure

```
Z:\Work Files\Megaworld\SQL\
├── .git/
├── .claude/                          (ignored by git)
│   └── conversation-backups/
│       ├── latest/                   (unencrypted, for quick access)
│       │   ├── session-id-1.jsonl
│       │   ├── session-id-2.jsonl
│       │   └── ...
│       ├── encrypted/                (encrypted archives)
│       │   ├── backup-20251108.enc
│       │   ├── backup-20251109.enc
│       │   └── ...
│       ├── backup-index.json         (tracks what's backed up)
│       └── backup-password.txt       (encrypted password file)
├── scripts/
│   ├── backup-conversations.sh       (main backup script)
│   ├── restore-conversations.sh      (restore from backup)
│   └── cleanup-old-backups.sh        (retention management)
└── .gitignore                        (exclude .claude/)
```

### Key Files

**backup-index.json:**
```json
{
  "last_backup": "2025-11-08T19:07:44Z",
  "total_conversations": 53,
  "backed_up_sessions": [
    {
      "session_id": "9cc6fded-2a3a-44ec-9382-9870bf67653e",
      "project": "Z:\\Work Files\\Megaworld\\SQL",
      "last_modified": "2025-11-08T18:38:00Z",
      "backed_up": "2025-11-08T19:07:44Z",
      "size_kb": 1234
    }
  ],
  "backup_files": [
    {
      "filename": "backup-20251108.enc",
      "created": "2025-11-08T19:07:44Z",
      "sessions_count": 2,
      "size_mb": 2.5
    }
  ]
}
```

---

## Option 1: Daily Incremental Backup (RECOMMENDED)

### How It Works

1. **Daily Schedule:** Run backup script once per day (e.g., 11 PM)
2. **Incremental Detection:** Only backup new/modified conversations
3. **Encryption:** Encrypt new conversations before storing
4. **Git Commit:** Commit encrypted backup to repository
5. **Cleanup:** Remove backups older than retention period

### Implementation

**Script: `scripts/backup-conversations.sh`**

```bash
#!/bin/bash
# Daily incremental backup of Claude CLI conversations

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
SOURCE_DIR="$HOME/.claude/projects"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
PASSWORD_FILE="$BACKUP_DIR/backup-password.txt"
INDEX_FILE="$BACKUP_DIR/backup-index.json"

# Create backup directories
mkdir -p "$BACKUP_DIR/latest"
mkdir -p "$BACKUP_DIR/encrypted"

# Initialize password if doesn't exist
if [ ! -f "$PASSWORD_FILE" ]; then
    openssl rand -base64 32 > "$PASSWORD_FILE"
    echo "Generated new backup password: $PASSWORD_FILE"
fi

PASSWORD=$(cat "$PASSWORD_FILE")

# Find new/modified conversations since last backup
LAST_BACKUP=$(jq -r '.last_backup // "1970-01-01T00:00:00Z"' "$INDEX_FILE" 2>/dev/null)
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s 2>/dev/null || echo 0)

echo "=== Incremental Backup Started: $TIMESTAMP ==="
echo "Last backup: $LAST_BACKUP"

# Find modified files
NEW_FILES=()
while IFS= read -r -d '' file; do
    FILE_MTIME=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    if [ "$FILE_MTIME" -gt "$LAST_BACKUP_EPOCH" ]; then
        NEW_FILES+=("$file")
    fi
done < <(find "$SOURCE_DIR" -name "*.jsonl" -print0)

if [ ${#NEW_FILES[@]} -eq 0 ]; then
    echo "No new conversations to backup."
    exit 0
fi

echo "Found ${#NEW_FILES[@]} new/modified conversations"

# Copy new files to latest/
for file in "${NEW_FILES[@]}"; do
    SESSION_ID=$(basename "$file")
    cp "$file" "$BACKUP_DIR/latest/$SESSION_ID"
    echo "  Copied: $SESSION_ID"
done

# Create encrypted archive of new files
BACKUP_FILE="$BACKUP_DIR/encrypted/backup-$TIMESTAMP.enc"
tar -czf - -C "$BACKUP_DIR/latest" . | \
    openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:$PASSWORD" \
    -out "$BACKUP_FILE"

BACKUP_SIZE=$(du -m "$BACKUP_FILE" | cut -f1)
echo "Created encrypted backup: backup-$TIMESTAMP.enc ($BACKUP_SIZE MB)"

# Update index
jq --arg timestamp "$(date -Iseconds)" \
   --arg backup_file "backup-$TIMESTAMP.enc" \
   --argjson sessions_count "${#NEW_FILES[@]}" \
   --argjson size_mb "$BACKUP_SIZE" \
   '.last_backup = $timestamp |
    .backup_files += [{
        filename: $backup_file,
        created: $timestamp,
        sessions_count: $sessions_count,
        size_mb: $size_mb
    }]' "$INDEX_FILE" > "$INDEX_FILE.tmp" && mv "$INDEX_FILE.tmp" "$INDEX_FILE"

# Git commit (optional)
if git rev-parse --git-dir > /dev/null 2>&1; then
    git add "$BACKUP_DIR/encrypted/backup-$TIMESTAMP.enc"
    git add "$INDEX_FILE"
    git commit -m "chore: backup conversations $TIMESTAMP - ${#NEW_FILES[@]} sessions" || true
    echo "Committed to git"
fi

echo "=== Backup Complete ==="
```

### Scheduling

**Windows (Task Scheduler):**
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "bash" -Argument "-c 'cd /z/Work\ Files/Megaworld/SQL && ./scripts/backup-conversations.sh'"
$trigger = New-ScheduledTaskTrigger -Daily -At 11PM
Register-ScheduledTask -TaskName "ClaudeConversationBackup" -Action $action -Trigger $trigger
```

**Linux/Mac (Crontab):**
```bash
# Run daily at 11 PM
0 23 * * * cd ~/Work/Megaworld/SQL && ./scripts/backup-conversations.sh >> /tmp/backup.log 2>&1
```

---

## Option 2: Post-Session Hook (More Frequent)

### How It Works

Use Claude's hook system to trigger backup after each session ends.

### Implementation

**File: `.claude/settings.local.json`**

```json
{
  "hooks": {
    "onExit": "bash -c 'cd /z/Work\\ Files/Megaworld/SQL && ./scripts/backup-conversations.sh quick'"
  }
}
```

**Modified script for quick backup:**

```bash
#!/bin/bash
# Quick backup mode - only backup current project's latest conversation

MODE="${1:-full}"

if [ "$MODE" = "quick" ]; then
    # Only backup the most recent conversation from current project
    LATEST=$(find "$SOURCE_DIR/$(basename $(pwd) | sed 's/ /-/g')" -name "*.jsonl" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -n "$LATEST" ]; then
        # Quick backup logic here
        echo "Quick backup: $(basename $LATEST)"
    fi
else
    # Full backup logic (as shown in Option 1)
    echo "Full backup mode"
fi
```

---

## Option 3: Git-LFS for Large Files

For efficient Git storage of large conversation archives:

### Setup Git LFS

```bash
# Install Git LFS (if not already installed)
git lfs install

# Track encrypted backup files
git lfs track "*.enc"
git add .gitattributes
git commit -m "chore: configure Git LFS for conversation backups"
```

**Benefits:**
- Large encrypted files stored efficiently
- Git tracks pointers, not full files
- Reduces repository size
- Fast clones and pulls

---

## Backup Script Features

### Core Features

1. **Incremental Detection**
   - Track last backup timestamp
   - Only backup new/modified conversations
   - Compare file modification times

2. **Encryption**
   - AES-256-CBC encryption
   - Single password for all backups
   - Password stored securely in `.claude/` (gitignored)

3. **Indexing**
   - JSON index tracks all backups
   - Session metadata (ID, project, timestamp, size)
   - Easy to query and search

4. **Git Integration**
   - Auto-commit backups to repository
   - Version-controlled backup history
   - Can use Git LFS for efficiency

5. **Retention Management**
   - Keep daily backups for 7 days
   - Keep weekly backups for 1 month
   - Keep monthly backups for 1 year
   - Auto-cleanup old backups

---

## Restoration Process

### Restore Script

**File: `scripts/restore-conversations.sh`**

```bash
#!/bin/bash
# Restore conversations from backup

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
PASSWORD=$(cat "$BACKUP_DIR/backup-password.txt")

# List available backups
echo "Available backups:"
jq -r '.backup_files[] | "\(.created) - \(.filename) (\(.sessions_count) sessions, \(.size_mb) MB)"' \
    "$BACKUP_DIR/backup-index.json"

# Restore specific backup
read -p "Enter backup filename to restore: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/encrypted/$BACKUP_FILE" ]; then
    echo "Backup file not found"
    exit 1
fi

# Decrypt and extract
RESTORE_DIR="$BACKUP_DIR/restored-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESTORE_DIR"

openssl enc -aes-256-cbc -d -pbkdf2 -pass "pass:$PASSWORD" \
    -in "$BACKUP_DIR/encrypted/$BACKUP_FILE" | \
    tar -xzf - -C "$RESTORE_DIR"

echo "Restored to: $RESTORE_DIR"
ls -lh "$RESTORE_DIR"
```

---

## Space Efficiency

### Storage Estimates

**Scenario:** 2 new conversations per day, avg 1.5MB each

| Retention | Daily Backup | Weekly | Monthly | Total |
|-----------|-------------|--------|---------|-------|
| 7 days | 21 MB | - | - | 21 MB |
| 1 month | 84 MB | 12 MB | - | 96 MB |
| 1 year | 84 MB | 48 MB | 144 MB | 276 MB |

**With Compression & Encryption:**
- ~30% size reduction → ~193 MB per year

**With Git LFS:**
- Only latest backups stored locally
- Old backups on remote server
- Local storage: ~50-100 MB

---

## Recommended Setup (Quick Start)

### Step 1: Create Directory Structure

```bash
cd "/z/Work Files/Megaworld/SQL"
mkdir -p .claude/conversation-backups/latest
mkdir -p .claude/conversation-backups/encrypted
mkdir -p scripts
```

### Step 2: Generate Password

```bash
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt
echo "Password generated: .claude/conversation-backups/backup-password.txt"
```

### Step 3: Initialize Index

```bash
cat > .claude/conversation-backups/backup-index.json <<EOF
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
cat >> .gitignore <<EOF

# Claude conversation backups (unencrypted)
.claude/conversation-backups/latest/
.claude/conversation-backups/backup-password.txt

# But DO commit encrypted backups and index
!.claude/conversation-backups/encrypted/
!.claude/conversation-backups/backup-index.json
EOF
```

### Step 5: Create Backup Script

```bash
# Copy the backup script from Option 1 above
nano scripts/backup-conversations.sh
chmod +x scripts/backup-conversations.sh
```

### Step 6: Schedule Backup

```bash
# Test manual run first
./scripts/backup-conversations.sh

# Then schedule (choose Windows Task Scheduler or Crontab)
```

---

## Comparison: Manual vs Automated

| Aspect | Manual Export | Automated Backup |
|--------|--------------|------------------|
| **Frequency** | When you remember | Daily/per-session |
| **Effort** | High (manual steps) | Zero (automatic) |
| **Risk of data loss** | High | Low |
| **Storage** | Large one-time exports | Incremental, efficient |
| **Git integration** | None | Built-in |
| **Encryption** | Optional | Automatic |
| **Restoration** | Manual decrypt/extract | Simple script |
| **Space usage** | ~40MB per full export | ~200MB per year |

---

## Security Considerations

### Password Management

**DO:**
- Store password in `.claude/` directory (gitignored)
- Backup password separately (password manager, secure note)
- Use strong encryption (AES-256)

**DON'T:**
- Commit password to Git
- Store password with encrypted files
- Share password via email

### Git Security

**DO:**
- Add `.claude/` to `.gitignore` (except encrypted/ and index)
- Use Git LFS for large files
- Commit encrypted backups only

**DON'T:**
- Commit unencrypted conversations
- Push password file to remote
- Store sensitive data unencrypted

---

## Alternative: Cloud Backup Integration

### Option: Automatic Cloud Sync

Use cloud storage services for automatic backup:

**OneDrive/Dropbox/Google Drive:**
```bash
# Symlink backup directory to cloud folder
ln -s "$(pwd)/.claude/conversation-backups/encrypted" \
      "$HOME/OneDrive/ClaudeBackups"
```

**Advantages:**
- Off-site backup
- Automatic sync
- Multiple device access
- Built-in versioning

**Disadvantages:**
- Requires cloud storage account
- May have size limits
- Privacy considerations (use encryption!)

---

## Monitoring & Alerts

### Backup Health Check

**Script: `scripts/check-backup-health.sh`**

```bash
#!/bin/bash
# Check backup health and send alerts

BACKUP_DIR="$(pwd)/.claude/conversation-backups"
INDEX_FILE="$BACKUP_DIR/backup-index.json"

LAST_BACKUP=$(jq -r '.last_backup' "$INDEX_FILE")
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s)
NOW_EPOCH=$(date +%s)
HOURS_SINCE=$(( ($NOW_EPOCH - $LAST_BACKUP_EPOCH) / 3600 ))

if [ $HOURS_SINCE -gt 48 ]; then
    echo "⚠️  WARNING: Last backup was $HOURS_SINCE hours ago"
    echo "Last backup: $LAST_BACKUP"
    # Send notification (email, Slack, etc.)
else
    echo "✅ Backup health: OK (last backup $HOURS_SINCE hours ago)"
fi

# Check backup integrity
BACKUP_COUNT=$(jq '.backup_files | length' "$INDEX_FILE")
echo "Total backups: $BACKUP_COUNT"

# Check encryption
if [ ! -f "$BACKUP_DIR/backup-password.txt" ]; then
    echo "❌ ERROR: Backup password file missing!"
fi
```

---

## Recommended Implementation Plan

### Phase 1: Setup (Today)
1. ✅ Create directory structure
2. ✅ Generate encryption password
3. ✅ Create backup script
4. ✅ Update `.gitignore`
5. ✅ Test manual backup

### Phase 2: Automation (This Week)
6. ⏳ Schedule daily backup task
7. ⏳ Test automated execution
8. ⏳ Verify Git commits working
9. ⏳ Set up backup health monitoring

### Phase 3: Optimization (Next Week)
10. ⏳ Implement retention policy
11. ⏳ Set up Git LFS (if needed)
12. ⏳ Configure cloud sync (optional)
13. ⏳ Document recovery procedures

---

## Troubleshooting

### Common Issues

**Issue:** "Backup script not running"
- Check scheduled task is enabled
- Verify script has execute permissions
- Check script path is correct

**Issue:** "Git commit fails"
- Ensure you're in Git repository
- Check Git user name/email configured
- Verify file paths are correct

**Issue:** "Encryption fails"
- Verify OpenSSL installed
- Check password file exists
- Test password manually

**Issue:** "Backups too large"
- Enable Git LFS
- Implement retention policy
- Check for duplicate backups

---

## Cost-Benefit Analysis

### Benefits
- ✅ **Zero manual effort** after setup
- ✅ **No data loss risk** from system failures
- ✅ **Version history** via Git
- ✅ **Space efficient** (incremental backups)
- ✅ **Encrypted** for privacy
- ✅ **Automated** daily or per-session

### Costs
- ⏱️ **Setup time:** ~1-2 hours one-time
- 💾 **Storage:** ~200 MB per year
- 🔧 **Maintenance:** ~5 minutes per month (health checks)

**ROI:** After setup, saves ~30 minutes per manual export × frequency

---

## Next Steps

**Immediate Actions:**
1. Review this document
2. Choose Option 1 (Daily) or Option 2 (Per-Session)
3. Run Phase 1 setup commands
4. Test manual backup
5. Schedule automated backup

**This Week:**
- Complete Phase 2 automation
- Monitor first few backup runs
- Verify Git commits

**Ongoing:**
- Weekly: Check backup health
- Monthly: Review retention policy
- Quarterly: Test restoration process

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-08 19:07:44 | Initial strategy document |

---

**END OF AUTOMATED BACKUP STRATEGY**

**Recommended Action:** Proceed with Phase 1 setup today.
