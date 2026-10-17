#!/bin/bash
# Check backup health - Claude runs this at session start
# Version: 1.0

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

# Calculate backup age
BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")
NOW=$(date +%s)
HOURS_SINCE=$(( ($NOW - $BACKUP_TIME) / 3600 ))

echo "Latest backup: $(basename "$LATEST_BACKUP")"
echo "Age: $HOURS_SINCE hours ago"

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
