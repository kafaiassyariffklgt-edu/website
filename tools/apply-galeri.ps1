#requires -Version 7
# apply-galeri.ps1 — pasang galeri dalam index.html dan tetapkan pratonton pautan.
# Selamat dijalankan berulang kali: bahagian yang sudah dipasang dilangkau.
param([string]$Akar = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'

function Baca([string]$p)              { Get-Content -LiteralPath $p -Raw -Encoding utf8 }
function Tulis([string]$p, [string]$t) { Set-Content -LiteralPath $p -Value $t -Encoding utf8NoBOM -NoNewline }
function Nl([string]$t)                { if ($t.Contains("`r`n")) { "`r`n" } else { "`n" } }

Add-Type -AssemblyName System.Drawing

function SimpanJpeg($bmp, [string]$dst, [int]$q) {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $p = [System.Drawing.Imaging.EncoderParameters]::new(1)
  $p.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]$q)
  $bmp.Save($dst, $enc, $p)
}

function BuatGaleri([string]$src, [string]$dst, [int]$lebar, [int]$q) {
  $img = [System.Drawing.Image]::FromFile($src)
  $h = [int][math]::Round($img.Height * $lebar / $img.Width)
  $bmp = [System.Drawing.Bitmap]::new($lebar, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $lebar, $h)
  SimpanJpeg $bmp $dst $q
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

function BuatOg([string]$src, [string]$dst, [int]$q) {
  $img = [System.Drawing.Image]::FromFile($src)
  $nisbah = 1200 / 630
  if (($img.Width / $img.Height) -gt $nisbah) { $ch = $img.Height; $cw = [int]($ch * $nisbah) }
  else { $cw = $img.Width; $ch = [int]($cw / $nisbah) }
  $cx = [int](($img.Width - $cw) / 2); $cy = [int](($img.Height - $ch) / 2)
  $bmp = [System.Drawing.Bitmap]::new(1200, 630)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, 1200, 630), $cx, $cy, $cw, $ch, [System.Drawing.GraphicsUnit]::Pixel)
  SimpanJpeg $bmp $dst $q
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

# --- Fail yang diperlukan -------------------------------------------------------
foreach ($r in @('js\modules\galeri.js', 'css\galeri.css', 'tools\galeri-bahagian.html')) {
  if (-not (Test-Path -LiteralPath (Join-Path $Akar $r))) { throw "Fail tiada: $r" }
}

# --- 0. Jana imej galeri dan pratonton daripada fail asal -------------------------
$dirImg = Join-Path $Akar 'assets\img'
$senarai = @(
  @{ Asal = 'Gambar_Sign_Board_Dataran_Sekolah.jpg'; Hasil = 'galeri-papan-tanda.jpg' },
  @{ Asal = 'Drone_View.jpg';                        Hasil = 'galeri-dron.jpg' },
  @{ Asal = 'Panoramic_Front_View.jpg';              Hasil = 'galeri-pintu-masuk.jpg' }
)
foreach ($s in $senarai) {
  $dst = Join-Path $dirImg $s.Hasil
  if (Test-Path -LiteralPath $dst) { Write-Host "imej      : $($s.Hasil) sudah ada, dilangkau"; continue }
  $src = Join-Path $dirImg $s.Asal
  if (-not (Test-Path -LiteralPath $src)) { throw "Fail asal tiada: assets\img\$($s.Asal)" }
  BuatGaleri $src $dst 1600 80
  Write-Host ("imej      : {0} dijana ({1} KB)" -f $s.Hasil, [int]((Get-Item $dst).Length / 1KB))
}
$og = Join-Path $dirImg 'og-sekolah.jpg'
if (Test-Path -LiteralPath $og) {
  Write-Host 'imej      : og-sekolah.jpg sudah ada, dilangkau'
} else {
  $src = Join-Path $dirImg 'Gambar_Sign_Board_Dataran_Sekolah.jpg'
  if (-not (Test-Path -LiteralPath $src)) { throw 'Fail asal tiada: assets\img\Gambar_Sign_Board_Dataran_Sekolah.jpg' }
  BuatOg $src $og 85
  Write-Host ("imej      : og-sekolah.jpg dijana ({0} KB)" -f [int]((Get-Item $og).Length / 1KB))
}

# --- 1. style.css ---------------------------------------------------------------
$f = Join-Path $Akar 'css\style.css'
$t = Baca $f
if ($t.Contains('galeri.css')) {
  Write-Host 'style.css : sudah ada, dilangkau'
} else {
  $a = '@import "rasmi.css";'
  if (-not $t.Contains($a)) { throw 'style.css: penanda @import "rasmi.css" tidak dijumpai.' }
  Tulis $f ($t.Replace($a, $a + (Nl $t) + '@import "galeri.css";'))
  Write-Host 'style.css : galeri.css ditambah'
}

# --- 2. main.js -----------------------------------------------------------------
$f = Join-Path $Akar 'js\main.js'
$t = Baca $f
if ($t.Contains('initGaleri')) {
  Write-Host 'main.js   : sudah ada, dilangkau'
} else {
  $a1 = "import { initDataBind } from './modules/data-bind.js';"
  $a2 = "await jalankan('data-bind', initDataBind);"
  if (-not $t.Contains($a1) -or -not $t.Contains($a2)) { throw 'main.js: penanda data-bind tidak dijumpai.' }
  $nl = Nl $t
  $t = $t.Replace($a1, $a1 + $nl + "import { initGaleri } from './modules/galeri.js';")
  $t = $t.Replace($a2, $a2 + $nl + "  await jikaWujud('[data-galeri]', 'galeri', initGaleri);")
  Tulis $f $t
  Write-Host 'main.js   : initGaleri ditambah'
}

# --- 3. index.html --------------------------------------------------------------
$f = Join-Path $Akar 'index.html'
$t = Baca $f
if ($t.Contains('data-galeri')) {
  Write-Host 'index.html: galeri sudah ada, dilangkau'
} else {
  $anchor = '<section class="sorotan" aria-labelledby="sorotan-title" data-sorotan>'
  if (-not $t.Contains($anchor)) { throw 'index.html: bahagian Sorotan tidak dijumpai.' }
  $nl = Nl $t
  $blok = (Baca (Join-Path $Akar 'tools\galeri-bahagian.html')).TrimEnd()
  $blok = $blok -replace "`r?`n", $nl
  Tulis $f ($t.Replace($anchor, $blok + $nl + $nl + '    ' + $anchor))
  Write-Host 'index.html: bahagian galeri disisipkan'
}

# --- 4. Tag pratonton pautan (semua HTML kecuali dev\) ---------------------------
$img = 'https://kafaiassyariffklgt-edu.github.io/website/assets/img/og-sekolah.jpg'
$alt = 'Papan tanda KAFA Integrasi As-Syariff Telok Datok'

Get-ChildItem -LiteralPath $Akar -Filter *.html -Recurse |
  Where-Object { $_.FullName -notmatch '[\\/]dev[\\/]' } |
  ForEach-Object {
    $asal = Get-Content -LiteralPath $_.FullName -Raw -Encoding utf8
    $baru = $asal `
      -replace '(property="og:image" content=")[^"]+(")',   ('${1}' + $img + '${2}') `
      -replace '(name="twitter:image" content=")[^"]+(")',  ('${1}' + $img + '${2}') `
      -replace '(property="og:image:type" content=")[^"]+', '${1}image/jpeg' `
      -replace '(property="og:image:width" content=")\d+',  '${1}1200' `
      -replace '(property="og:image:height" content=")\d+', '${1}630' `
      -replace '(property="og:image:alt" content=")[^"]+',  ('${1}' + $alt) `
      -replace '(name="twitter:card" content=")summary(")', '${1}summary_large_image${2}'
    if ($baru -ne $asal) {
      Tulis $_.FullName $baru
      Write-Host "pratonton : $($_.Name) dikemas kini"
    }
  }

Write-Host ''
Write-Host 'Siap. Semak dengan "git diff", uji laman, kemudian push.'
