#!/bin/bash
# ~/.claude/hooks/limit-context.sh
# Smart truncation: preserves errors, stack traces, test failures, build failures
# Only truncates verbose success output

set -euo pipefail

# Config
MAX_LINES=500
KEEP_HEAD=30
KEEP_TAIL=50
CRITICAL_PATTERNS=(
    "ERROR"
    "FAIL"
    "FAILED"
    "Exception"
    "Error:"
    "error:"
    "Caused by:"
    "at .*\."
    "Stack trace"
    "stack trace"
    "BUILD FAILURE"
    "BUILD ERROR"
    "Test.*failed"
    "FAILED.*Test"
    "AssertionError"
    "Timeout"
    "OutOfMemory"
    "Segmentation fault"
    "Killed"
    "exit code [1-9]"
    "non-zero exit"
    "npm ERR"
    "yarn error"
    "pip.*error"
    "mvn.*FAILURE"
    "gradle.*FAILED"
    "docker.*error"
    "docker.*Error"
)

# Read full input
input=$(cat)
line_count=$(echo "$input" | wc -l)

# If under threshold, pass through
if [ "$line_count" -le "$MAX_LINES" ]; then
    echo "$input"
    exit 0
fi

# Find critical line numbers (1-indexed)
critical_lines=()
for pattern in "${CRITICAL_PATTERNS[@]}"; do
    while IFS= read -r line_num; do
        if [[ -n "$line_num" ]]; then
            critical_lines+=("$line_num")
        fi
    done < <(echo "$input" | grep -n -i -E "$pattern" | cut -d: -f1)
done

# Deduplicate and sort
IFS=$'\n' critical_lines=($(sort -nu <<<"${critical_lines[*]}"))
unset IFS

# If no critical lines found, simple truncate
if [ ${#critical_lines[@]} -eq 0 ]; then
    echo "$input" | head -n "$KEEP_HEAD"
    echo "... [TRUNCADO: $((line_count - KEEP_HEAD - KEEP_TAIL)) linhas de output verboso] ..."
    echo "$input" | tail -n "$KEEP_TAIL"
    exit 0
fi

# Build inclusion ranges around critical lines (±5 lines context)
included_lines=()
for cl in "${critical_lines[@]}"; do
    start=$((cl - 5))
    end=$((cl + 5))
    [ $start -lt 1 ] && start=1
    [ $end -gt $line_count ] && end=$line_count
    for ((i=start; i<=end; i++)); do
        included_lines+=("$i")
    done
done

# Always include head and tail
for ((i=1; i<=KEEP_HEAD; i++)); do included_lines+=("$i"); done
for ((i=line_count-KEEP_TAIL+1; i<=line_count; i++)); do included_lines+=("$i"); done

# Deduplicate and sort final line numbers
IFS=$'\n' included_lines=($(sort -nu <<<"${included_lines[*]}"))
unset IFS

# Output selected lines with truncation markers
prev=0
first=true
for ln in "${included_lines[@]}"; do
    if [ $ln -gt $((prev + 1)) ]; then
        if [ "$first" = true ]; then
            first=false
        else
            echo "... [TRUNCADO: $((ln - prev - 1)) linhas] ..."
        fi
    fi
    echo "$input" | sed -n "${ln}p"
    prev=$ln
done