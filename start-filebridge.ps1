#Requires -Version 7.0
<#
    start-filebridge.ps1 — jalankan FileBridge MCP untuk projek KAFAI.

    Server hanya mendengar pada 127.0.0.1:3000. Jangan dedahkan port ini
    terus ke internet; gunakan start-tunnel.ps1.

    Fail konfigurasi : C:\Tools\filebridge-mcp\.env
    Folder projek    : C:\Users\rafee\Downloads\KAFA\kafai-website
#>
[CmdletBinding()]
param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$serverDir = 'C:\Tools\filebridge-mcp'

if (-not (Test-Path (Join-Path $serverDir 'node_modules'))) {
    throw "Pergantungan belum dipasang. Jalankan: cd `"$serverDir`"; npm install"
}

if (-not (Test-Path (Join-Path $serverDir '.env'))) {
    throw "Fail .env tiada di $serverDir. Cipta daripada .env.example dan isi BEARER_TOKEN."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js tidak dijumpai dalam PATH.'
}

$env:PORT = "$Port"

Write-Host ''
Write-Host '  FileBridge MCP' -ForegroundColor Cyan
Write-Host "  MCP   : http://127.0.0.1:$Port/mcp"
Write-Host "  SSE   : http://127.0.0.1:$Port/sse (warisan)"
Write-Host "  Health: http://127.0.0.1:$Port/health"
Write-Host '  Tekan Ctrl+C untuk berhenti.' -ForegroundColor DarkGray
Write-Host ''

Push-Location $serverDir
try {
    node src/server.js
}
finally {
    Pop-Location
}
