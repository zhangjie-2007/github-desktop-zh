# 开发笔记（不参与运行）

## 环境

- 没有 pwsh 7，只有 **Windows PowerShell 5.1**。所有 `.ps1` 必须存成 **UTF-8 with BOM**，
  否则 5.1 会按 GBK 解析中文而弄乱字符串。
- node 在 `C:\Users\zhangjie\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`。
- 硬约束：所有下载/临时/交付文件一律放 **D 盘**（用户要求）。

## 关键教训

1. **DSH 派生的 GUI 进程会被连带杀掉**。从 DSH 沙箱的 pwsh 里 `Start-Process GitHubDesktop.exe`
   起来后进程立刻消失（作业对象随 pwsh 退出终止）。可行办法是走计划任务：
   `schtasks /create /tn GHZHLaunch /tr "\"<exe>\"" /sc once /st 23:59 /f` → `/run` → 等 16 秒 → `/delete /f`。
2. **这台机器有 DPI 缩放**。`GetWindowRect` 返回逻辑坐标（505,95 / 993x691），
   而 `CopyFromScreen` + `GetSystemMetrics` 用物理像素（1707x1067），两者不能混用；
   用鼠标点击定位很容易点偏，用 `SendKeys` 发 `%f`/`%v` 之类的访问键更稳。
3. **前台锁定**。`SetForegroundWindow` 在 DSH 窗口占着前台时经常失败，先发一次 ALT 键
   （`keybd_event(0x12,...)`）再抢，配合 `SetWindowPos(HWND_TOPMOST)` 才稳。
4. **抽词别只收纯 ASCII**。第一版抽词器用 `/^[\x20-\x7E]+$/` 过滤，把所有带 `…` 的界面文案
   （菜单项、对话框按钮一大堆）整批丢掉了，导致欢迎页按钮没翻译。改成只过滤控制字符。
5. **`tr()` 的判据必须用 `!= null`**。`ruleHit` 未命中返回 `null`，若只判 `undefined`，
   任何词典里没有的英文都会被替换成字符串 `"null"`。
6. **`collect()` 判「是否已翻译」不能用「含非 ASCII」**，因为英文里的 `…` 也是非 ASCII。
   要用汉字正则。
7. **菜单标签有两套文本**：`.sr-only` 里是整串，可见部分是碎片。只翻可见碎片会拼出
   「Show 已贮藏的更改」这种半中半英。识别到 AccessText 结构后必须**整体处理并停止下钻**。

## 抓菜单/截图

- `_scratch\open-help.ps1`：重启（走计划任务）→ 抢前台 → 发访问键 → 截全屏，结果存 `_scratch\*.png`。
- `_scratch\sweep-menus.ps1`：依次打开 6 个菜单并 dump 每个 `.menu-item` 的文本与结构到
  `_scratch\menudump.txt`，然后列出「翻译后仍是纯英文」的标签。
- 注意：dump 里同时有 `observer-now`（翻译前）和 `observer+600ms`（翻译后）两份记录，
  只看后者才准确。
