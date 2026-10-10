# 用 Alt+F 打开「文件」菜单（访问键来自 main.js 的 &File，翻译只改了 DOM 文本、
# 不改主进程传来的菜单数据，所以 Alt+F 依然有效），然后截全屏确认下拉菜单是否汉化。
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U2 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int i);
}
"@
$p = Get-Process -Name GitHubDesktop -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Error '找不到 GitHub Desktop 主窗口'; exit 1 }
$h = $p.MainWindowHandle
[U2]::ShowWindow($h, 9) | Out-Null
[U2]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 800

[System.Windows.Forms.SendKeys]::SendWait('%h')
Start-Sleep -Milliseconds 1500

$sw = [U2]::GetSystemMetrics(0)
$sh = [U2]::GetSystemMetrics(1)
$bmp = New-Object System.Drawing.Bitmap($sw, $sh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($sw, $sh)))
$g.Dispose()
$out = 'D:\GitHub-Desktop-ZH\screenshot-menu.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "已保存 $out  (${sw}x${sh})"

[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
