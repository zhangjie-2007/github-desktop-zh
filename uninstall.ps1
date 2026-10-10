# ============================================================================
#  GitHub Desktop 汉化 · 卸载（把 index.html 还原成英文原版）
#  用法：powershell -ExecutionPolicy Bypass -File D:\GitHub-Desktop-ZH\uninstall.ps1
# ============================================================================
param([string]$AppDir)

$ErrorActionPreference = 'Stop'
$Mark = 'GHZH-INJECT'

function Find-AppDir {
  $base = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
  if (-not (Test-Path $base)) { throw "找不到 GitHub Desktop 安装目录：$base" }
  $cand = Get-ChildItem -Path $base -Directory -Filter 'app-*' |
          Where-Object { Test-Path (Join-Path $_.FullName 'resources\app\index.html') } |
          Sort-Object { try { [version]($_.Name -replace '^app-','') } catch { [version]'0.0' } } -Descending
  if (-not $cand) { throw "在 $base 下没找到 app-* 目录" }
  return $cand[0].FullName
}

if (-not $AppDir) { $AppDir = Find-AppDir }
$index = Join-Path $AppDir 'resources\app\index.html'
if (-not (Test-Path $index)) { throw "找不到 $index" }

$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8
if ($html -notlike "*$Mark*") {
  Write-Host "index.html 里没有汉化注入段，无需卸载。" -ForegroundColor Yellow
  exit 0
}
$new = [regex]::Replace($html, '<!--' + $Mark + '-->.*?<!--/' + $Mark + '-->', '', 'Singleline')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($index, $new, $utf8NoBom)
Write-Host "已还原：$index" -ForegroundColor Green
Write-Host "汉化文件本身还在 D:\GitHub-Desktop-ZH\，要彻底删除就删这个目录。" -ForegroundColor DarkGray
