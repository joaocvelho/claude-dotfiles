# Link ~/.claude/{skills,agents,CLAUDE.md} to this repo via NTFS junctions/hardlinks (no admin needed).
$ErrorActionPreference = "Stop"

$claudeDir = Join-Path $HOME ".claude"
New-Item -ItemType Directory -Force $claudeDir | Out-Null

function Link-Dir($name) {
    $link = Join-Path $claudeDir $name
    $target = Join-Path $PSScriptRoot $name
    if (Test-Path $link) {
        throw "$link already exists. Move it aside (or merge its contents into $target) first."
    }
    New-Item -ItemType Junction -Path $link -Target $target | Out-Null
    Write-Host "Linked $link -> $target"
}

function Link-File($name) {
    $link = Join-Path $claudeDir $name
    $target = Join-Path $PSScriptRoot $name
    if (Test-Path $link) {
        throw "$link already exists. Move it aside (or merge its contents into $target) first."
    }
    New-Item -ItemType HardLink -Path $link -Target $target | Out-Null
    Write-Host "Linked $link -> $target"
}

Link-Dir "skills"
Link-Dir "agents"
Link-File "CLAUDE.md"
