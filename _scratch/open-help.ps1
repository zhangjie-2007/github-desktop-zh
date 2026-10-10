# 重启 GitHub Desktop，强制把它提到最前，再用 Alt+H 打开「帮助」菜单并截全屏。
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U4 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, IntPtr extra);
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int i);
}
"@
$HWND_TOPMOST = New-Object IntPtr(-1)
$HWND_NOTOPMOST = New-Object IntPtr(-2)
$SWP_NOMOVE = 0x0002; $SWP_NOSIZE = 0x0001; $SWP_SHOWWINDOW = 0x0040

cmd /c "taskkill /IM GitHubDesktop.exe /F" 2>&1 | Out-Null
Start-Sleep -Seconds 3

$exe = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.7\GitHubDesktop.exe"
cmd /c "schtasks /create /tn GHZHLaunch /tr `"\`"$exe\`"`" /sc once /st 23:59 /f" 2>&1 | Out-Null
cmd /c "schtasks /run /tn GHZHLaunch" 2>&1 | Out-Null
Start-Sleep -Seconds 18
cmd /c "schtasks /delete /tn GHZHLaunch /f" 2>&1 | Out-Null

$p = Get-Process -Name GitHubDesktop -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Error '窗口没起来'; exit 1 }
$h = $p.MainWindowHandle

# 绕开前台锁定：先按一下 ALT，再抢前台，再置顶
[U4]::keybd_event(0x12, 0, 0, [IntPtr]::Zero)
[U4]::keybd_event(0x12, 0, 2, [IntPtr]::Zero)
Start-Sleep -Milliseconds 150
[U4]::ShowWindow($h, 9) | Out-Null
[U4]::SetWindowPos($h, $HWND_TOPMOST, 0, 0, 0, 0, $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW) | Out-Null
[U4]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 900
Write-Output ("前台窗口 PID = " + (Get-Process -Id (Get-Process GitHubDesktop | Select-Object -First 1).Id).MainWindowTitle)

[System.Windows.Forms.SendKeys]::SendWait('%v')
Start-Sleep -Seconds 3

$sw = [U4]::GetSystemMetrics(0)
$sh = [U4]::GetSystemMetrics(1)
$bmp = New-Object System.Drawing.Bitmap($sw, $sh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($sw, $sh)))
$g.Dispose()
$out = 'D:\GitHub-Desktop-ZH\_scratch\viewmenu.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "已保存 $out"

[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
[U4]::SetWindowPos($h, $HWND_NOTOPMOST, 0, 0, 0, 0, $SWP_NOMOVE -bor $SWP_NOSIZE) | Out-Null
Write-Host '=== menudump（只显示含「仍是英文」的段） ==='
$dump = Get-Content 'D:\GitHub-Desktop-ZH\_scratch\menudump.txt' -Encoding UTF8 -ErrorAction SilentlyContinue
$dump | Select-String -Pattern 'inner=|##'
