# Quick Reference - Automated Conversation Backups

**Version:** 1.1
**Last Updated:** 2026-10-18 (decrypt reads the password file; scripts v1.1)

---

## ⚡ Quick Commands

### Setup in Current Repository (5 min)

```bash
# 1. Copy portable setup guide (if not present)
# See CLAUDE_BACKUP_SETUP.md

# 2. Create directories
mkdir -p .claude/conversation-backups/{latest,encrypted} scripts

# 3. Generate password
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt

# 4. Initialize index
echo '{"last_backup":"1970-01-01T00:00:00Z","total_conversations":0,"backed_up_sessions":[],"backup_files":[]}' > .claude/conversation-backups/backup-index.json

# 5. Copy scripts from Megaworld SQL repo
cp "/z/Work Files/Megaworld/SQL/scripts/backup-conversations.sh" ./scripts/
cp "/z/Work Files/Megaworld/SQL/scripts/check-backup-health.sh" ./scripts/
chmod +x ./scripts/*.sh

# 6. Test
./scripts/backup-conversations.sh
```

### Schedule Automated Backup (Windows)

**For Current Repository:**
```powershell
# Open PowerShell as Administrator
cd "Z:\Your\Repo\Path"
.\scripts\setup-scheduled-backup-universal.ps1
```

**For ALL Z Drive Repositories:**
```powershell
# Open PowerShell as Administrator
cd "Z:\Work Files\Megaworld\SQL"
.\scripts\setup-all-z-drive-backups.ps1
```

### Check Backup Status

```bash
./scripts/check-backup-health.sh
```

Output:
- ✅ Green = Healthy (<24 hours)
- ⚠️ Yellow = Due soon (24-36 hours)
- 🔴 Red = Overdue (>36 hours)

### Manual Backup

```bash
./scripts/backup-conversations.sh
```

### Checkpoint Current Session

```bash
./scripts/checkpoint-session.sh
```

---

## 📁 File Locations

| File | Location | Committed to Git? |
|------|----------|-------------------|
| Encrypted backups | `.claude/conversation-backups/encrypted/` | ✅ Yes |
| Backup password | `.claude/conversation-backups/backup-password.txt` | ❌ No (gitignored) |
| Backup index | `.claude/conversation-backups/backup-index.json` | ✅ Yes |
| Unencrypted staging | `.claude/conversation-backups/latest/` | ❌ No (gitignored) |
| Checkpoints | `.claude/checkpoints/` | ❌ No (optional) |

---

## 🔑 Password Management

**Password Location:**
```
.claude/conversation-backups/backup-password.txt
```

**Backup Password (IMPORTANT!):**
```bash
# View password
cat .claude/conversation-backups/backup-password.txt

# Copy to password manager (1Password, LastPass, etc.)
```

⚠️ **Without password, backups CANNOT be decrypted!**

---

## 🔄 Restore from Backup

### List Available Backups

```bash
ls -lh .claude/conversation-backups/encrypted/
```

### Restore Specific Backup

```bash
# Set variables
BACKUP_FILE="backup-20251108-192413.enc"
RESTORE_DIR=".claude/conversation-backups/restored-$(date +%Y%m%d-%H%M%S)"

# Decrypt and extract (openssl reads the password from the file, so it never appears on the command line)
mkdir -p "$RESTORE_DIR"
openssl enc -aes-256-cbc -d -pbkdf2 -pass "file:.claude/conversation-backups/backup-password.txt" \
    -in ".claude/conversation-backups/encrypted/$BACKUP_FILE" | \
    tar -xzf - -C "$RESTORE_DIR"

# View restored files
ls -lh "$RESTORE_DIR"
```

---

## 🛠️ Troubleshooting

### "No backups found"

**Solution:** Run initial backup
```bash
./scripts/backup-conversations.sh
```

### "Password file not found"

**Solution:** Generate password
```bash
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt
```

### "Scheduled task not running"

**Check task status:**
```powershell
Get-ScheduledTask -TaskName "ClaudeConversationBackup_*"
Get-ScheduledTaskInfo -TaskName "ClaudeConversationBackup_[YourRepo]"
```

**Test task manually:**
```powershell
Start-ScheduledTask -TaskName "ClaudeConversationBackup_[YourRepo]"
```

### "bash: command not found"

**Check bash location:**
```bash
which bash
# or
where.exe bash
```

Should be: `/usr/bin/bash` or `C:\Program Files\Git\usr\bin\bash.exe`

---

## 📋 Scheduled Task Management

### View All Backup Tasks

```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like 'ClaudeConversationBackup_*'}
```

### Disable Task Temporarily

```powershell
Disable-ScheduledTask -TaskName "ClaudeConversationBackup_[RepoName]"
```

### Enable Task

```powershell
Enable-ScheduledTask -TaskName "ClaudeConversationBackup_[RepoName]"
```

### Remove Task

```powershell
Unregister-ScheduledTask -TaskName "ClaudeConversationBackup_[RepoName]" -Confirm:$false
```

### View Task History

```powershell
Get-ScheduledTaskInfo -TaskName "ClaudeConversationBackup_[RepoName]"
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Project-specific instructions (includes backup monitoring) |
| `docs/backups/CLAUDE_BACKUP_SETUP.md` | Portable setup guide (copy to any repo) |
| `docs/backups/SETUP_AUTOMATED_BACKUPS.md` | Windows scheduled task setup |
| `CAPTURE_CURRENT_SESSION.md` | How to save current open session |
| `docs/backups/QUICK_REFERENCE_BACKUPS.md` | This file (quick commands) |

---

## 🤖 Claude's Role

**Automatic Health Monitoring:**
- Claude checks backup status at start of each session
- Runs health check: `./scripts/check-backup-health.sh`
- If overdue (>36 hours), Claude runs backup automatically
- User doesn't need to ask!

**Claude's Instructions (in CLAUDE.md):**
```
🤖 CLAUDE: CHECK THIS AT START OF EACH SESSION!
- Run `./scripts/check-backup-health.sh` to verify backup status
- If backup overdue (>36 hours), proactively run backup
- This is YOUR responsibility - user shouldn't need to ask!
```

---

## 📊 Backup Schedule

| Trigger | Frequency | Who |
|---------|-----------|-----|
| Windows Task | Daily at 11 PM | System |
| Claude Check | Every session start (if >36h) | Claude |
| Manual | Anytime | User |

---

## 🔐 Security Summary

**Encrypted:**
- ✅ Backups (AES-256-CBC)
- ✅ Safe to commit to Git
- ✅ Safe to sync to cloud

**Not Encrypted:**
- ❌ Password file (gitignored, store separately!)
- ❌ Latest staging directory (gitignored)

**Password Entropy:** 256 bits (cryptographically secure)

---

## 💡 Best Practices

1. ✅ **Schedule automated backups** (Windows Task Scheduler)
2. ✅ **Let Claude monitor** (check health at session start)
3. ✅ **Back up password** to password manager
4. ✅ **Test restoration** periodically
5. ✅ **Checkpoint before risky operations** (`./scripts/checkpoint-session.sh`)

---

## 🚀 Quick Setup for New Repo

```bash
# 1. Copy from existing repo
cp -r "/z/Work Files/Megaworld/SQL/.claude" ./
cp -r "/z/Work Files/Megaworld/SQL/scripts" ./
cp "/z/Work Files/Megaworld/SQL/CLAUDE_BACKUP_SETUP.md" ./

# 2. Generate new password (don't reuse!)
openssl rand -base64 32 > .claude/conversation-backups/backup-password.txt

# 3. Reset index
echo '{"last_backup":"1970-01-01T00:00:00Z","total_conversations":0,"backed_up_sessions":[],"backup_files":[]}' > .claude/conversation-backups/backup-index.json

# 4. Clear old backups
rm .claude/conversation-backups/encrypted/*.enc
rm .claude/conversation-backups/latest/*.jsonl

# 5. Update .gitignore
cat >> .gitignore <<'EOF'

# Claude conversation backups
.claude/conversation-backups/latest/
.claude/conversation-backups/backup-password.txt
!.claude/conversation-backups/encrypted/
!.claude/conversation-backups/backup-index.json
EOF

# 6. Test
./scripts/backup-conversations.sh

# 7. Schedule (PowerShell as Administrator)
# .\scripts\setup-scheduled-backup-universal.ps1
```

---

## 📞 Support

**If something doesn't work:**
1. Check this quick reference
2. Read detailed docs: `docs/backups/CLAUDE_BACKUP_SETUP.md`
3. Test manually: `./scripts/backup-conversations.sh`
4. Check logs: Task Scheduler event log

---

**Last Updated:** 2025-11-08
**Version:** 1.0
