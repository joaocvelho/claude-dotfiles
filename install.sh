#!/bin/bash
# Link ~/.claude/{skills,agents,CLAUDE.md} to this repo via symlinks.
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR"

link() {
  local name="$1"
  local link="$CLAUDE_DIR/$name"
  local target="$REPO_DIR/$name"
  if [ -e "$link" ] || [ -L "$link" ]; then
    echo "$link already exists. Move it aside (or merge its contents into $target) first." >&2
    exit 1
  fi
  ln -s "$target" "$link"
  echo "Linked $link -> $target"
}

link "skills"
link "agents"
link "CLAUDE.md"
