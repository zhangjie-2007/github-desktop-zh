# 截取 GitHub Desktop 主窗口（DPI 感知版），保存到 D 盘
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinCap2 {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, IntPtr e);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
"@

[WinCap2]::SetProcessDPIAware() | Out-Null

$out = 'D:\GitHub-Desktop-ZH\screenshot-app.png'
$p = Get-Process -Name GitHubDesktop -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Error '找不到 GitHub Desktop 主窗口'; exit 1 }

$h = $p.MainWindowHandle
if ([WinCap2]::IsIconic($h)) { [WinCap2]::ShowWindow($h, 9) | Out-Null }
# 抢前台：先发一次 ALT 解除前台锁定
[WinCap2]::keybd_event(0x12, 0, 0, [IntPtr]::Zero)
[WinCap2]::keybd_event(0x12, 0, 2, [IntPtr]::Zero)
[WinCap2]::SetWindowPos($h, [IntPtr](-1), 0, 0, 0, 0, 0x0003) | Out-Null
[WinCap2]::SetForegroundWindow($h) | Out-Null
[WinCap2]::SetWindowPos($h, [IntPtr](-2), 0, 0, 0, 0, 0x0003) | Out-Null
Start-Sleep -Milliseconds 1200

$r = New-Object WinCap2+RECT
[WinCap2]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.Right - $r.Left
$hh = $r.Bottom - $r.Top
Write-Host "窗口 ($($r.Left),$($r.Top))  尺寸 ${w}x${hh}"

$bmp = New-Object System.Drawing.Bitmap($w, $hh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size($w, $hh)))
$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "已保存 $out（$((Get-Item $out).Length) 字节）"
