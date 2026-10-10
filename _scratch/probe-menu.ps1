# 重启 GitHub Desktop（必须走计划任务，否则被 DSH 作业对象连带杀掉），
# 然后打开「帮助」菜单，等 Debug dump 写出后截图。
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U3 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int i);
}
"@

cmd /c "taskkill /IM GitHubDesktop.exe /F" 2>&1 | Out-Null
Start-Sleep -Seconds 3

$exe = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.7\GitHubDesktop.exe"
cmd /c "schtasks /create /tn GHZHLaunch /tr `"\`"$exe\`"`" /sc once /st 23:59 /f" 2>&1 | Out-Null
cmd /c "schtasks /run /tn GHZHLaunch" 2>&1 | Out-Null
Start-Sleep -Seconds 16
cmd /c "schtasks /delete /tn GHZHLaunch /f" 2>&1 | Out-Null

$p = Get-Process -Name GitHubDesktop -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Error '窗口没起来'; exit 1 }
$h = $p.MainWindowHandle
[U3]::ShowWindow($h, 9) | Out-Null
[U3]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 900

[System.Windows.Forms.SendKeys]::SendWait('%h')
Start-Sleep -Seconds 3

$sw = [U3]::GetSystemMetrics(0)
$sh = [U3]::GetSystemMetrics(1)
$bmp = New-Object System.Drawing.Bitmap($sw, $sh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($sw, $sh)))
$g.Dispose()
$out = 'D:\GitHub-Desktop-ZH\_scratch\helpmenu.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "已保存 $out"

[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Write-Host '=== menudump.txt ==='
Get-Content 'D:\GitHub-Desktop-ZH\_scratch\menudump.txt' -Encoding UTF8 -ErrorAction SilentlyContinue
