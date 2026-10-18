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
