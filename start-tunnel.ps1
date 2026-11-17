#Requires -Version 7.0
<#
    start-tunnel.ps1 — dedahkan FileBridge MCP melalui Cloudflare Quick Tunnel.

    AMARAN
      Quick Tunnel memberi URL awam rawak yang berubah setiap kali dimulakan.
      Sesiapa yang mempunyai URL DAN token boleh membaca/menulis fail projek.
      Untuk kegunaan berterusan, gunakan Named Tunnel + Cloudflare Access.

    Guna:
      .\start-tunnel.ps1              # latar belakang, URL ditulis ke mcp-connection.txt
      .\start-tunnel.ps1 -Foreground  # papar log cloudflared secara langsung
      .\start-tunnel.ps1 -Stop        # hentikan semua proses cloudflared
#>
[CmdletBinding()]
param(
    [string]$LocalUrl = 'http://127.0.0.1:3000',
    [switch]$Foreground,
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot

function Get-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $fallback = 'C:\Tools\bin\cloudflared.exe'
    if (Test-Path $fallback) { return $fallback }

    throw 'cloudflared tidak dijumpai. Pasang dengan: winget install Cloudflare.cloudflared, atau letak cloudflared.exe di C:\Tools\bin.'
}

if ($Stop) {
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
    Remove-Item (Join-Path $env:TEMP 'asyariff-mcp') -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host 'Semua proses cloudflared dihentikan.' -ForegroundColor Yellow
    return
}

$cloudflared = Get-Cloudflared

# Pastikan FileBridge MCP benar-benar hidup sebelum membuka terowong.
try {
    Invoke-RestMethod -Uri "$LocalUrl/health" -TimeoutSec 5 | Out-Null
}
catch {
    throw "FileBridge MCP tidak menjawab di $LocalUrl. Jalankan .\start-filebridge.ps1 dalam terminal lain dahulu."
}

$logDir = Join-Path $env:TEMP 'asyariff-mcp'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$logFile = Join-Path $logDir 'tunnel.log'
$outFile = Join-Path $logDir 'tunnel.out.log'
$infoFile = Join-Path $projectRoot 'mcp-connection.txt'

if ($Foreground) {
    Write-Host "Meneruskan $LocalUrl ke Cloudflare..." -ForegroundColor Cyan
    Write-Host 'Salin URL trycloudflare.com daripada output di bawah.' -ForegroundColor DarkGray
    & $cloudflared tunnel --url $LocalUrl --no-autoupdate
    return
}

Remove-Item $logFile, $outFile -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath $cloudflared `
    -ArgumentList @('tunnel', '--url', $LocalUrl, '--no-autoupdate') `
    -RedirectStandardError $logFile `
    -RedirectStandardOutput $outFile `
    -WindowStyle Hidden `
    -PassThru

$url = $null
$deadline = (Get-Date).AddSeconds(60)

while ((Get-Date) -lt $deadline -and -not $url) {
    Start-Sleep -Milliseconds 700

    if ($proc.HasExited) {
        throw "cloudflared berhenti (kod $($proc.ExitCode)). Semak $logFile."
    }

    foreach ($fail in @($logFile, $outFile)) {
        if ($url -or -not (Test-Path $fail)) { continue }
        $padanan = Select-String -Path $fail -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches |
            Select-Object -First 1
        if ($padanan) {
            $url = $padanan.Matches[0].Value
        }
    }
}

if (-not $url) {
    throw "URL terowong tidak muncul dalam 60 saat. Semak $logFile."
}

# Ambil token daripada .env tanpa mencetaknya ke skrin.
$token = ''
$envFile = 'C:\Tools\filebridge-mcp\.env'
if (Test-Path $envFile) {
    $baris = Select-String -Path $envFile -Pattern '^BEARER_TOKEN=(.+)$' | Select-Object -First 1
    if ($baris) { $token = $baris.Matches[0].Groups[1].Value.Trim() }
}

$mcpUrl = "$url/mcp"
$mcpTokenUrl = if ($token) { "$url/mcp?token=$token" } else { $mcpUrl }

$info = @(
    "URL awam   : $url",
    "URL MCP    : $mcpUrl",
    "URL + token: $mcpTokenUrl",
    "Token      : $token",
    "Dicipta    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "Nota       : URL ini berubah setiap kali tunnel dimulakan semula."
) -join [Environment]::NewLine

Set-Content -Path $infoFile -Value $info -Encoding utf8

# Hadkan fail maklumat kepada pengguna semasa sahaja (Windows).
try {
    & icacls $infoFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'icacls gagal' }
}
catch {
    Write-Host 'Amaran: tidak dapat mengehadkan kebenaran mcp-connection.txt.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '  Cloudflare Quick Tunnel aktif' -ForegroundColor Green
Write-Host "  URL MCP : $mcpUrl"
Write-Host '  Token   : lihat mcp-connection.txt (tidak dipaparkan di sini)'
Write-Host ''
Write-Host '  Dalam Claude.ai, tambah URL penuh BERSAMA token:' -ForegroundColor Cyan
Write-Host "  $url/mcp?token=<token-daripada-mcp-connection.txt>"
Write-Host ''
Write-Host "  Hentikan: .\start-tunnel.ps1 -Stop" -ForegroundColor DarkGray
