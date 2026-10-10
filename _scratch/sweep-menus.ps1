# 依次打开 6 个菜单，把 DOM dump 追加到 menudump.txt，然后只列出「菜单里仍是英文」的标签。
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U6 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, IntPtr extra);
}
"@
$TOPMOST = New-Object IntPtr(-1); $NOTOPMOST = New-Object IntPtr(-2)
$SWP = 0x0002 -bor 0x0001 -bor 0x0040

$p = Get-Process -Name GitHubDesktop -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Error '找不到窗口'; exit 1 }
$h = $p.MainWindowHandle
[U6]::ShowWindow($h, 9) | Out-Null
[U6]::SetWindowPos($h, $TOPMOST, 0, 0, 0, 0, $SWP) | Out-Null

foreach ($mk in @('f', 'e', 'v', 'r', 'b', 'h')) {
  [U6]::keybd_event(0x12, 0, 0, [IntPtr]::Zero)
  [U6]::keybd_event(0x12, 0, 2, [IntPtr]::Zero)
  Start-Sleep -Milliseconds 150
  [U6]::SetForegroundWindow($h) | Out-Null
  Start-Sleep -Milliseconds 500
  [System.Windows.Forms.SendKeys]::SendWait("%$mk")
  Start-Sleep -Seconds 3
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}')
  Start-Sleep -Milliseconds 700
}
[U6]::SetWindowPos($h, $NOTOPMOST, 0, 0, 0, 0, 0x0002 -bor 0x0001) | Out-Null

# 从 dump 里挑出不含汉字的菜单标签（去掉末尾的快捷键）
$bad = @{}
foreach ($line in (Get-Content 'D:\GitHub-Desktop-ZH\_scratch\menudump.txt' -Encoding UTF8)) {
  $m = [regex]::Match($line, '^\s*\[\d+\] inner=(".*?")\s*\|\|')
  if (-not $m.Success) { continue }
  $t = $m.Groups[1].Value
  $t = $t.Substring(1, $t.Length - 2) -replace '\\"', '"'
  $t = $t -replace '\s+(Ctrl|Alt|Shift|Cmd|F\d)[\+\w]*$', ''
  $t = $t.Trim()
  if ($t -match '^[\x20-\x7E]+$' -and $t -match '[A-Za-z]') { $bad[$t] = 1 }
}
Write-Output "=== 菜单里仍是纯英文的标签（$($bad.Count) 条）==="
$bad.Keys | Sort-Object | ForEach-Object { Write-Output "  $_" }
