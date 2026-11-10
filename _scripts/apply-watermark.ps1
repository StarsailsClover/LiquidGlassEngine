[CmdletBinding()]
param(
    [string]$RepositoryPath,
    [switch]$Check
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepositoryPath)) {
    $scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
    $RepositoryPath = Split-Path -Parent $scriptDirectory
}

$resolveScript = "C:\Users\Sails\.codex\skills\bc-developmentndebugging\scripts\watermark\resolve-watermark.ps1"

function Get-CanonicalWatermark([string]$Root) {
    if (Test-Path -LiteralPath $resolveScript) {
        try {
            $value = & $resolveScript -RepositoryPath $Root -Canonical
            if (-not [string]::IsNullOrWhiteSpace($value)) { return $value.Trim() }
        } catch {
            Write-Warning "Canonical watermark resolution failed: $($_.Exception.Message)"
        }
    }

    $remote = (& git -C $Root config --get remote.origin.url 2>$null).Trim()
    if ($remote -match 'github\.com[:/]([^/]+)/') {
        return "GitHub@$($Matches[1])"
    }
    throw "Unable to resolve the canonical watermark for $Root"
}

function Add-RandomSpacing([string]$Value) {
    $builder = [System.Text.StringBuilder]::new()
    $random = [System.Random]::new()
    $inserted = $false

    for ($index = 0; $index -lt $Value.Length; $index++) {
        $character = $Value[$index]
        [void]$builder.Append($character)
        $next = if ($index + 1 -lt $Value.Length) { $Value[$index + 1] } else { [char]0 }
        if ($character -ne ' ' -and $next -ne ' ' -and $next -ne [char]0 -and $random.Next(0, 3) -eq 0) {
            [void]$builder.Append(' ' * $random.Next(1, 4))
            $inserted = $true
        }
    }

    if (-not $inserted -and $Value.Length -gt 1) {
        return $Value.Insert($random.Next(1, $Value.Length), ' ')
    }
    return $builder.ToString()
}

function Test-WatermarkPresent([string[]]$Lines, [string]$Canonical) {
    $canonicalCompact = ($Canonical -replace '\s', '')
    foreach ($line in $Lines) {
        $compact = ($line -replace '\s', '')
        if ($compact.Contains($canonicalCompact)) { return $true }
    }
    return $false
}

function New-WatermarkLine([string]$Path, [string]$Watermark) {
    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        '.md' { return "<!-- $Watermark -->" }
        '.html' { return "<!-- $Watermark -->" }
        '.css' { return "/* $Watermark */" }
        '.yml' { return "# $Watermark" }
        '.yaml' { return "# $Watermark" }
        default { return "// $Watermark" }
    }
}

$root = (Resolve-Path -LiteralPath $RepositoryPath).Path
$canonical = Get-CanonicalWatermark $root

# Upstream-derived shader sources keep their MIT notice instead of the
# repository watermark; generated copies are rebuilt by the embed step.
$skipPatterns = @(
    '^packages/lge-core/src/shaders/',
    '^pnpm-lock\.yaml$',
    '^LICENSE$',
    '^packages/[^/]+/LICENSE$',
    '^THIRD_PARTY_NOTICES\.md$',
    '^packages/[^/]+/THIRD_PARTY_NOTICES\.md$'
)
$extensions = @('.ts', '.mjs', '.js', '.cjs', '.css', '.html', '.md', '.yml', '.yaml')

$files = & git -C $root ls-files --cached --others --exclude-standard
$missing = @()
$updated = @()

foreach ($relative in $files) {
    $extension = [System.IO.Path]::GetExtension($relative).ToLowerInvariant()
    if ($extensions -notcontains $extension) { continue }
    $skip = $false
    foreach ($pattern in $skipPatterns) {
        if ($relative -match $pattern) { $skip = $true; break }
    }
    if ($skip) { continue }

    $fullPath = Join-Path $root $relative
    if (-not (Test-Path -LiteralPath $fullPath)) { continue }

    $lines = [System.IO.File]::ReadAllLines($fullPath)
    if ($lines.Length -eq 0) { continue }

    $probe = if ($lines.Length -gt 24) { $lines[0..23] } else { $lines }
    if (Test-WatermarkPresent $probe $canonical) { continue }

    $missing += $relative
    if ($Check) { continue }

    $watermarkLine = New-WatermarkLine $relative (Add-RandomSpacing $canonical)
    $insertAt = 0
    if ($extension -eq '.md' -or $extension -eq '.html') {
        # Keep the H1/doctype as line 1 so heading parsing and banners survive.
        $insertAt = 1
    }

    $output = New-Object System.Collections.Generic.List[string]
    if ($insertAt -gt 0) {
        $output.Add($lines[0])
        $output.Add('')
        $output.Add($watermarkLine)
        for ($index = 1; $index -lt $lines.Length; $index++) {
            if ($index -eq 1 -and [string]::IsNullOrWhiteSpace($lines[$index])) { continue }
            $output.Add($lines[$index])
        }
    } else {
        $output.Add($watermarkLine)
        foreach ($line in $lines) { $output.Add($line) }
    }

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($fullPath, $output, $encoding)
    $updated += $relative
}

if ($Check) {
    if ($missing.Count -gt 0) {
        Write-Host "Missing watermark in $($missing.Count) file(s):"
        $missing | ForEach-Object { Write-Host "  $_" }
        exit 1
    }
    Write-Host "Watermark present in every tracked source/document file ($canonical)."
    exit 0
}

Write-Host "Canonical watermark: $canonical"
Write-Host "Updated $($updated.Count) file(s)."
