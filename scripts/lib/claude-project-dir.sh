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
