# ============================================================================
#  GitHub Desktop 汉化 · 安装（把运行时翻译层挂进 index.html）
#  用法：powershell -ExecutionPolicy Bypass -File D:\GitHub-Desktop-ZH\install.ps1
#  特点：只改一行 index.html，不动 renderer.js；随时可 uninstall.ps1 还原。
# ============================================================================
param(
  [string]$AppDir,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Mark = 'GHZH-INJECT'

# 汉化资源一律留在 D 盘，index.html 里只留一段加载器（绝对路径）
$inject = '<!--' + $Mark + '-->' +
          '<script>try{var fs=require("fs"),p=' + "'D:/GitHub-Desktop-ZH/'" + ';' +
          '(0,eval)(fs.readFileSync(p+"i18n-zh.js","utf8"));' +
          '(0,eval)(fs.readFileSync(p+"engine.js","utf8"))}' +
          'catch(e){console.error("[GHZH] 汉化加载失败",e)}</script>' +
          '<!--/' + $Mark + '-->'
$anchor = '<script defer="defer" src="renderer.js"></script>'

function Find-AppDir {
  $base = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
  if (-not (Test-Path $base)) { throw "找不到 GitHub Desktop 安装目录：$base" }
  $cand = Get-ChildItem -Path $base -Directory -Filter 'app-*' |
          Where-Object { Test-Path (Join-Path $_.FullName 'resources\app\index.html') } |
          Sort-Object { try { [version]($_.Name -replace '^app-','') } catch { [version]'0.0' } } -Descending
  if (-not $cand) { throw "在 $base 下没找到带 resources\app\index.html 的 app-* 目录" }
  return $cand[0].FullName
}

if (-not $AppDir) { $AppDir = Find-AppDir }
$index = Join-Path $AppDir 'resources\app\index.html'
if (-not (Test-Path $index)) { throw "找不到 $index" }
Write-Host "应用目录: $AppDir" -ForegroundColor Cyan
Write-Host "index.html: $index" -ForegroundColor Cyan

$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8

if ($html -like "*$Mark*") {
  if (-not $Force) {
    Write-Host "已经装过了（index.html 里有 $Mark 标记）。要重装请加 -Force。" -ForegroundColor Yellow
    exit 0
  }
  $html = [regex]::Replace($html, '<!--' + $Mark + '-->.*?<!--/' + $Mark + '-->', '', 'Singleline')
  Write-Host "已先移除旧的注入段（-Force）" -ForegroundColor Yellow
}

if ($html -notlike "*$anchor*") {
  throw "index.html 里没找到锚点 $anchor，版本可能变了，请手工处理。"
}

# 备份原始文件到 D 盘（只备份第一次，保留最原始的版本）
$bakDir = Join-Path $Root 'backup'
if (-not (Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir | Out-Null }
$bak = Join-Path $bakDir 'index.html.orig'
if (-not (Test-Path $bak)) {
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($bak, $html, $enc)
  Write-Host "已备份原始 index.html -> $bak" -ForegroundColor Green
} else {
  Write-Host "备份已存在，保持不动: $bak" -ForegroundColor DarkGray
}

$new = $html.Replace($anchor, $inject + $anchor)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($index, $new, $utf8NoBom)

Write-Host "注入完成 ✔" -ForegroundColor Green
Write-Host "现在启动 GitHub Desktop 即可看到中文界面。" -ForegroundColor Green
