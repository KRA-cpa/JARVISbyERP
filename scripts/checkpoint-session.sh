#!/bin/bash
# Checkpoint current Claude session
# Version: 1.0
# Usage: ./scripts/checkpoint-session.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PROJECT=$(basename "$(pwd)" | sed 's/ /-/g' | sed 's/[^a-zA-Z0-9-]/_/g')
PROJECT_DIR=$(find ~/.claude/projects -type d -name "*$PROJECT*" 2>/dev/null | head -1)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Claude Session Checkpoint ==="

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}⚠️  No project directory found for: $PROJECT${NC}"
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

echo "Latest session: $(basename $LATEST)"
echo "Last modified: $AGE_MINUTES minutes ago"

# Copy if recently modified (within last 10 minutes)
if [ $AGE_MINUTES -lt 10 ]; then
    mkdir -p .claude/checkpoints
    cp "$LATEST" ".claude/checkpoints/checkpoint-$TIMESTAMP.jsonl"
    echo -e "${GREEN}✅ Checkpoint saved: .claude/checkpoints/checkpoint-$TIMESTAMP.jsonl${NC}"
else
    echo -e "${YELLOW}⚠️  Session hasn't been updated recently - might not be current${NC}"
    echo "Creating checkpoint anyway..."
    mkdir -p .claude/checkpoints
    cp "$LATEST" ".claude/checkpoints/checkpoint-$TIMESTAMP.jsonl"
    echo -e "${GREEN}✅ Checkpoint saved: .claude/checkpoints/checkpoint-$TIMESTAMP.jsonl${NC}"
fi
