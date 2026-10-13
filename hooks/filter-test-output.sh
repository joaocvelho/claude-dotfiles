#!/bin/bash
# PreToolUse hook - filters test command output to show only failures
# Reduces context consumption from thousands of tokens to hundreds
# Reads JSON from stdin, outputs JSON to stdout

# Portable jq resolution: prefer PATH, fallback to ~/.claude/bin
if command -v jq >/dev/null 2>&1; then
    JQ="jq"
else
    JQ="$HOME/.claude/bin/jq.exe"
fi

input=$(cat)

cmd=$(echo "$input" | "$JQ" -r '.tool_input.command // ""')

# If running tests, filter to show only failures
if [[ "$cmd" =~ ^(npm test|npx jest|pytest|go test|dotnet test|mvn test) ]]; then
    filtered_cmd="$cmd 2>&1 | grep -aE '(FAIL|ERROR|Error|error:|✗|failed|Failed)' | head -100"
    echo "$input" | "$JQ" --arg filtered "$filtered_cmd" \
        '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", updatedInput: (.tool_input + {command: $filtered})}}'
else
    echo "{}"
fi