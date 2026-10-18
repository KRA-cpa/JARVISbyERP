#!/bin/bash
# reorg-move.sh — apply docs/planning/REORG_MANIFEST.tsv with git mv (renames only)
# Plan: docs/planning/PLAN_RepoReorg_20261017.md §5 step 2
# Usage: ./scripts/reorg-move.sh [--dry-run]

set -euo pipefail

cd "$(dirname "$0")/.."
MANIFEST="docs/planning/REORG_MANIFEST.tsv"
DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

moved=0
while IFS=$'\t' read -r old new; do
    # The manifest may be checked out with CRLF (core.autocrlf=true): drop the trailing \r
    old="${old%$'\r'}"
    new="${new%$'\r'}"

    # Skip comments and blank lines
    [[ -z "$old" || "$old" == \#* ]] && continue

    if [ ! -e "$old" ]; then
        echo "SKIP (missing): $old"
        continue
    fi

    if $DRY_RUN; then
        echo "WOULD MOVE: $old -> $new"
    else
        mkdir -p "$(dirname "$new")"
        git mv "$old" "$new"
    fi
    moved=$((moved + 1))
done < "$MANIFEST"

echo "Moved: $moved"
