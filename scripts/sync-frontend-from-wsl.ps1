param(
    [string]$Source = "\\wsl$\Ubuntu\home\uc4u2\work\scheduler2\frontend",
    [string]$Target = "C:\Users\youse\StudioProjects\schedulaa-frontend",
    [string]$StashMessage = ("before-sync-from-linux-source-" + (Get-Date -Format "yyyy-MM-dd")),
    [switch]$SkipStash,
    [switch]$RunBuild,
    [switch]$RunCapSync
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    & $Action
}

if (-not (Test-Path $Source)) {
    throw "WSL source path not found: $Source"
}

if (-not (Test-Path $Target)) {
    throw "Windows Android Studio target path not found: $Target"
}

$robocopyArgs = @(
    $Source,
    $Target,
    "/E",
    "/R:2",
    "/W:2",
    "/XD",
    ".git",
    "node_modules",
    "build",
    "android\app\build",
    "android\.gradle",
    "/XF",
    "npm-debug.log",
    "yarn-error.log"
)

Push-Location $Target

try {
    if (-not $SkipStash) {
        Invoke-Step "Stash local Windows changes" {
            git stash push -u -m $StashMessage
        }
    } else {
        Write-Host "Skipping git stash step." -ForegroundColor Yellow
    }

    Invoke-Step "Sync WSL frontend into Windows Android Studio copy" {
        & robocopy @robocopyArgs
        $robocopyExit = $LASTEXITCODE
        if ($robocopyExit -ge 8) {
            throw "robocopy failed with exit code $robocopyExit"
        }
        Write-Host "robocopy exit code: $robocopyExit" -ForegroundColor Green
    }

    Invoke-Step "Show Windows repo status after sync" {
        git status --short
    }

    if ($RunBuild) {
        Invoke-Step "Build frontend" {
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "npm run build failed with exit code $LASTEXITCODE"
            }
        }
    }

    if ($RunCapSync) {
        Invoke-Step "Sync Capacitor Android project" {
            npx cap sync android
            if ($LASTEXITCODE -ne 0) {
                throw "npx cap sync android failed with exit code $LASTEXITCODE"
            }
        }
    }

    Write-Host ""
    Write-Host "Sync complete." -ForegroundColor Green
    Write-Host "Source: $Source"
    Write-Host "Target: $Target"
} finally {
    Pop-Location
}
