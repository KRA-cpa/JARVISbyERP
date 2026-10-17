# Setup Automated Conversation Backups - One-Time Setup

**Version:** 1.0
**Date:** 2025-11-08
**Time Required:** 2 minutes

---

## What This Does

Sets up automatic daily backups of Claude CLI conversations at 11 PM every night:
- ✅ Runs automatically (no user intervention needed)
- ✅ Backs up new/modified conversations only (incremental)
- ✅ Encrypted with AES-256 for privacy
- ✅ Commits to Git automatically
- ✅ Claude monitors backup health automatically

---

## One-Time Setup (Run Once)

### Step 1: Open PowerShell as Administrator

**Windows 10/11:**
1. Press `Win + X`
2. Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. Click **Yes** when prompted

### Step 2: Run Setup Script

```powershell
# Navigate to repo
cd "Z:\Work Files\Megaworld\SQL"

# Run setup script
.\scripts\setup-scheduled-backup.ps1
```

### Step 3: Verify Setup

You should see:
```
✅ Scheduled task created successfully!

Backup Schedule:
  - Runs daily at 11:00 PM
  - Backs up to: Z:\Work Files\Megaworld\SQL\.claude\conversation-backups\encrypted\
  - Encrypted with AES-256
```

---

## Verify It's Working

### Check Scheduled Task

**Option A: Task Scheduler GUI**
1. Press `Win + R`
2. Type: `taskschd.msc`
3. Press Enter
4. Look for: **"ClaudeConversationBackup_MegaworldSQL"**
5. Should show: **Ready** status

**Option B: PowerShell**
```powershell
Get-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL"
```

### Test Backup Now (Optional)

```powershell
# Run backup immediately (don't wait for 11 PM)
Start-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL"

# Check if it worked
cd "Z:\Work Files\Megaworld\SQL"
ls .claude\conversation-backups\encrypted\
```

---

## How Claude Monitors Backups

**Automatic Health Checks:**
- Claude checks backup status at start of each session
- If backup is overdue (>36 hours), Claude will proactively run backup
- You don't need to ask - Claude handles it automatically!

**What Claude Checks:**
```bash
./scripts/check-backup-health.sh
```

Output:
- ✅ Green: Backup healthy (<24 hours old)
- ⚠️  Yellow: Backup due soon (24-36 hours old)
- 🔴 Red: Backup overdue (>36 hours) - Claude will run backup

---

## Manual Backup (If Needed)

If you want to run a backup manually at any time:

```bash
cd "Z:\Work Files\Megaworld\SQL"
./scripts/backup-conversations.sh
```

---

## Troubleshooting

### "Task not found"

**Solution:** Run setup script again as Administrator

### "Backup not running"

**Check:**
```powershell
# View task history
Get-ScheduledTaskInfo -TaskName "ClaudeConversationBackup_MegaworldSQL"

# Check last run time
(Get-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL").LastRunTime
```

### "Permission denied"

**Solution:** Task must run as your user account with Git Bash available

### "Script not executing"

**Check bash path:**
```powershell
where.exe bash
```

Should show: `C:\Program Files\Git\usr\bin\bash.exe` or similar

---

## Modify Backup Schedule

### Change Time (e.g., to 2 AM)

```powershell
# Remove old task
Unregister-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL" -Confirm:$false

# Create new trigger
$action = New-ScheduledTaskAction -Execute "bash" -Argument "-c 'cd ""Z:\Work Files\Megaworld\SQL"" && ./scripts/backup-conversations.sh'"
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL" -Action $action -Trigger $trigger -Settings $settings
```

### Run Every 12 Hours

```powershell
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 12)
```

### Disable Temporarily

```powershell
Disable-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL"
```

### Enable Again

```powershell
Enable-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL"
```

### Remove Completely

```powershell
Unregister-ScheduledTask -TaskName "ClaudeConversationBackup_MegaworldSQL" -Confirm:$false
```

---

## What Gets Backed Up

**Source:**
```
~/.claude/projects/Z--Work-Files-Megaworld-SQL/*.jsonl
```

**Destination:**
```
Z:\Work Files\Megaworld\SQL\.claude\conversation-backups\
├── encrypted/
│   ├── backup-20251108-192413.enc  (41 MB)
│   ├── backup-20251109-230000.enc
│   └── backup-20251110-230000.enc
├── backup-index.json
└── backup-password.txt (gitignored)
```

**What's Saved:**
- All conversation files (.jsonl)
- Encrypted with AES-256
- Committed to Git (encrypted only)
- Password stored separately (not committed)

---

## Backup Retention

**Automatic Cleanup** (future enhancement):
- Keep daily backups for 7 days
- Keep weekly backups for 1 month
- Keep monthly backups for 1 year

**Currently:** All backups kept indefinitely (manual cleanup needed)

---

## Security

**Encrypted Files:**
- ✅ Safe to commit to Git
- ✅ Safe to sync to cloud storage
- ✅ Unreadable without password

**Password File:**
- ❌ NOT committed to Git (in .gitignore)
- ⚠️  Back up separately to password manager
- ⚠️  Without password, backups cannot be decrypted

**Password Location:**
```
Z:\Work Files\Megaworld\SQL\.claude\conversation-backups\backup-password.txt
```

**Backup Password Now:**
1. Open file above
2. Copy password
3. Save to password manager (1Password, LastPass, etc.)

---

## Summary

### What You Did:
1. ✅ Ran PowerShell script as Administrator
2. ✅ Created scheduled task for daily backups at 11 PM
3. ✅ Verified task is active

### What Happens Now:
- ✅ Backups run automatically every night at 11 PM
- ✅ Claude checks backup health at start of each session
- ✅ Claude runs backup proactively if overdue (>36 hours)
- ✅ You never need to think about it!

### Next Steps:
- **Optional:** Test backup now with `Start-ScheduledTask`
- **Important:** Back up password file to password manager
- **Done:** System is fully automated!

---

## For Other Repos

To set up in a different repository:

1. Copy `CLAUDE_BACKUP_SETUP.md` to new repo
2. Follow Quick Start guide
3. Run `setup-scheduled-backup.ps1` with new repo path
4. Done!

---

## Support

**If backups fail:**
1. Check `./scripts/check-backup-health.sh`
2. Review Task Scheduler logs
3. Run `./scripts/backup-conversations.sh` manually to see errors

**If task doesn't run:**
- Ensure computer is on at scheduled time (or use "wake to run")
- Check Windows Task Scheduler event logs
- Verify bash is accessible from scheduled task context

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-08 | Initial automated backup setup guide |

---

**END OF SETUP GUIDE**

✅ **Your conversations are now automatically backed up every 24 hours!**

⚠️ **Don't forget to back up the password file to your password manager!**
