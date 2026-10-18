#!/bin/bash
# Checkpoint current Claude session
# Version: 1.1 (17 Oct 2026: code review CR-12/CR-13 — exact project folder; one copy path)
# Usage: ./scripts/checkpoint-session.sh   (run from the repo root)

source "$(dirname "$0")/lib/claude-project-dir.sh"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Claude Session Checkpoint ==="

if ! PROJECT_DIR=$(claude_project_dir); then
    echo -e "${RED}⚠️  No project directory found for this repo${NC}"
    exit 1
fi

# Find most recently modified conversation
LATEST=$(find "$PROJECT_DIR" -name "*.jsonl" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$LATEST" ]; then
    echo -e "${RED}⚠️  No conversation files found - session not saved yet${NC}"
    echo "Tip: Modify a file or use /checkpoint command to trigger save"
    exit 1
fi

# Get modification time
MOD_TIME=$(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null)
NOW=$(date +%s)
AGE_MINUTES=$(( ($NOW - $MOD_TIME) / 60 ))

echo "Latest session: $(basename "$LATEST")"
echo "Last modified: $AGE_MINUTES minutes ago"

# Warn if not modified in the last 10 minutes, but checkpoint either way
if [ $AGE_MINUTES -ge 10 ]; then
    echo -e "${YELLOW}⚠️  Session hasn't been updated recently - might not be current${NC}"
    echo "Creating checkpoint anyway..."
fi

mkdir -p .claude/checkpoints
cp "$LATEST" ".claude/checkpoints/checkpoint-$TIMESTAMP.jsonl"
echo -e "${GREEN}✅ Checkpoint saved: .claude/checkpoints/checkpoint-$TIMESTAMP.jsonl${NC}"
