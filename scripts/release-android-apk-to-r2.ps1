param(
    [Parameter(Mandatory = $true)]
    [string]$ReleaseKeySuffix,
    [string]$AwsProfile = "",
    [string]$EndpointUrl = "https://78218658b96663f211820a2c34ea89bb.r2.cloudflarestorage.com",
    [string]$Bucket = "schedulaa-public-assets",
    [string]$ApkPath = "C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\app-release.apk",
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

$PublicBaseUrl = "https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev"
$ArchivedKey = "assets/apk/releases/schedulaa-staff-$ReleaseKeySuffix.apk"
$LatestKey = "assets/apk/schedulaa-staff-latest.apk"
$ArchivedFileName = "schedulaa-staff-$ReleaseKeySuffix.apk"
$LatestFileName = "schedulaa-staff-latest.apk"
$ArchivedUrl = "$PublicBaseUrl/$ArchivedKey"
$LatestUrl = "$PublicBaseUrl/$LatestKey"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    & $Action
}

function Get-AwsBaseArgs {
    $args = @()
    if ($AwsProfile) {
        $args += "--profile"
        $args += $AwsProfile
    }
    $args += "--no-verify-ssl"
    $args += "--endpoint-url"
    $args += $EndpointUrl
    return ,$args
}

function Invoke-Aws {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $baseArgs = Get-AwsBaseArgs
    $allArgs = @($baseArgs + $Arguments)
    & aws.exe @allArgs
    if ($LASTEXITCODE -ne 0) {
        throw "aws.exe failed with exit code $LASTEXITCODE"
    }
}

function Assert-Header {
    param(
        [string[]]$Headers,
        [string]$Pattern,
        [string]$Message
    )

    if (-not ($Headers | Where-Object { $_ -match $Pattern })) {
        throw $Message
    }
}

function Verify-PublicUrl {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedFileName
    )

    $headerText = curl.exe -sS -I $Url
    if ($LASTEXITCODE -ne 0) {
        throw "curl.exe failed for $Url with exit code $LASTEXITCODE"
    }

    $headers = $headerText -split "`r?`n" | Where-Object { $_ -ne "" }
    Assert-Header -Headers $headers -Pattern '^HTTP/\d+(\.\d+)? 200\b' -Message "Verification failed for $Url: expected HTTP 200"
    Assert-Header -Headers $headers -Pattern '^Content-Type:\s*application/vnd\.android\.package-archive\b' -Message "Verification failed for $Url: expected APK content type"
    Assert-Header -Headers $headers -Pattern ('^Content-Disposition:.*' + [regex]::Escape($ExpectedFileName)) -Message "Verification failed for $Url: expected Content-Disposition filename $ExpectedFileName"

    Write-Host "Verified: $Url" -ForegroundColor Green
    $headers | ForEach-Object { Write-Host "  $_" }
}

if (-not (Test-Path $ApkPath)) {
    throw "APK not found: $ApkPath"
}

$awsCmd = Get-Command aws.exe -ErrorAction SilentlyContinue
if (-not $awsCmd) {
    throw "aws.exe not found on PATH. Install AWS CLI or add it to PATH."
}

$curlCmd = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $SkipVerify -and -not $curlCmd) {
    throw "curl.exe not found on PATH. Install curl or rerun with -SkipVerify."
}

$apk = Get-Item $ApkPath

Write-Host "APK path: $($apk.FullName)"
Write-Host "APK size: $($apk.Length)"
Write-Host "APK timestamp: $($apk.LastWriteTime.ToString('s'))"
Write-Host "Archived key: $ArchivedKey"
Write-Host "Latest key: $LatestKey"

Invoke-Step "Upload archived APK with direct put-object" {
    Invoke-Aws @(
        "s3api", "put-object",
        "--bucket", $Bucket,
        "--key", $ArchivedKey,
        "--body", $ApkPath,
        "--content-type", "application/vnd.android.package-archive",
        "--content-disposition", "attachment; filename=$ArchivedFileName"
    )
}

Invoke-Step "Refresh stable latest from archived object" {
    Invoke-Aws @(
        "s3api", "copy-object",
        "--bucket", $Bucket,
        "--copy-source", "$Bucket/$ArchivedKey",
        "--key", $LatestKey,
        "--metadata-directive", "REPLACE",
        "--content-type", "application/vnd.android.package-archive",
        "--content-disposition", "attachment; filename=$LatestFileName"
    )
}

if (-not $SkipVerify) {
    Invoke-Step "Verify archived public URL" {
        Verify-PublicUrl -Url $ArchivedUrl -ExpectedFileName $ArchivedFileName
    }

    Invoke-Step "Verify stable latest public URL" {
        Verify-PublicUrl -Url $LatestUrl -ExpectedFileName $LatestFileName
    }
} else {
    Write-Host ""
    Write-Host "Skipping public URL verification." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Release upload complete." -ForegroundColor Green
Write-Host "Archived URL: $ArchivedUrl"
Write-Host "Latest URL:   $LatestUrl"
