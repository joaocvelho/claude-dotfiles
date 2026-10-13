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

$utf8 = New-Object System.Text.UTF8Encoding $false
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$homeFwd = $HOME -replace '\\', '/'
$homeJson = $HOME -replace '\\', '\\'

function Copy-WithBackup($source, $dest, $text) {
    New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
    if (Test-Path $dest) {
        Copy-Item $dest "$dest.bak-$stamp"
        Write-Host "Backup $dest.bak-$stamp"
    }
    [System.IO.File]::WriteAllText($dest, $text, $utf8)
    Write-Host "Copied $source -> $dest"
}

Link-Dir "skills"
Link-Dir "agents"
Link-File "CLAUDE.md"

New-Item -ItemType Directory -Force (Join-Path $claudeDir "hooks") | Out-Null
Copy-Item (Join-Path $PSScriptRoot "hooks\*") (Join-Path $claudeDir "hooks") -Force
Copy-Item (Join-Path $PSScriptRoot "statusline.js") (Join-Path $claudeDir "statusline.js") -Force
Write-Host "Copied hooks and statusline.js"

$settingsDest = Join-Path $claudeDir "settings.json"
$settingsText = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot "settings.json"), $utf8) -replace 'C:/Users/joao\.velho', $homeFwd -replace 'C:\\\\Users\\\\joao\.velho', $homeJson
if (Test-Path $settingsDest) {
    $old = [System.IO.File]::ReadAllText($settingsDest, $utf8) | ConvertFrom-Json
    if ($old.autoMode) {
        $new = $settingsText | ConvertFrom-Json
        $new | Add-Member -NotePropertyName autoMode -NotePropertyValue $old.autoMode -Force
        $settingsText = $new | ConvertTo-Json -Depth 20
    }
}
Copy-WithBackup "settings.json" $settingsDest $settingsText

$vscodeDest = Join-Path $env:APPDATA "Code\User\settings.json"
$vscodeText = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot "vscode\settings.json"), $utf8) -replace 'C:\\\\Users\\\\joao\.velho', $homeJson
Copy-WithBackup "vscode\settings.json" $vscodeDest $vscodeText

$code = Get-Command code -ErrorAction SilentlyContinue
if ($code) {
    & code --install-extension anthropic.claude-code --force
} else {
    Write-Host "VS Code CLI (code) not found: install VS Code, then run: code --install-extension anthropic.claude-code"
}
