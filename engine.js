/* ============================================================================
 * GitHub Desktop 汉化引擎（运行时 DOM 翻译层）
 *
 * 工作原理：不改 renderer.js，只在页面里加一个观察器，把已知的英文界面文案
 * 换成中文。词典是精确匹配，所以仓库名、分支名、提交信息、代码、diff 内容
 * 都不会被误伤（它们不可能恰好等于某条界面文案）。
 *
 * 词典由同目录的 i18n-zh.js 生成时前置注入：window.__GHZH_DICT__
 * 运行时可调 API：window.__GHZH__
 *   .dict        词典对象
 *   .on()/.off() 开/关翻译（关掉即恢复英文显示，页面重新渲染即可）
 *   .count       已翻译的节点数
 * ==========================================================================*/
(function () {
  'use strict';

  if (window.__GHZH__) { window.__GHZH__.refresh(); return; }

  var DICT = window.__GHZH_DICT__ || {};
  var LOWER = Object.create(null);
  for (var k in DICT) {
    var lk = k.toLowerCase();
    if (!(lk in LOWER)) LOWER[lk] = DICT[k];
  }

  // 菜单词典是单独一份（键是「不含 & 的裸标签」）。普通文本节点也必须能查到它，
  // 否则没有访问键的菜单项（如 "Show User Guides"、"Report issue…"）永远翻不到——
  // 它们不会走 accessKeyLabel 那条特判路径。
  var MENU = window.__GHZH_MENU__ || {};
  var MENULOWER = Object.create(null);
  for (var mk in MENU) {
    var mlk = mk.toLowerCase();
    if (!(mlk in MENULOWER)) MENULOWER[mlk] = MENU[mk];
  }

  // ---- 不翻译的容器：代码、diff、markdown 正文、输入控件 -------------------
  var SKIP_SELECTOR = [
    'script', 'style', 'noscript', 'code', 'pre', 'kbd', 'samp', 'var',
    'textarea', 'input', 'select', 'option', 'svg',
    '.markdown-body',            // README / issue / PR 正文
    '.CodeMirror', '.cm-editor', '.cm-content', '.monaco-editor',
    '.diff-line', '.diff-hunk', '.diff-content', '.blob-wrapper',
    '.commit-message-component .text-box',
    '[contenteditable="true"]', '[data-ghzh-skip]'
  ].join(',');

  // 属性（placeholder/title/aria-label/alt）用的跳过表。
  // 注意这里**去掉了 input/textarea/select/option**：跳过的本意是「别改用户的输入内容」，
  // 而 doElement 只会翻译 INPUT[type=button|submit|reset] 的 value，普通输入框的 value 不动。
  // 早期版本把整个 input 都跳过，导致搜索框的 placeholder 一直是英文
  // （例如侧栏的 "Filter your repositories"），而 collect() 的属性报告不查 skipped，
  // 所以报告显示「无残留」却肉眼可见英文——这个假阴性就是这么来的。
  var SKIP_ATTR_SELECTOR = [
    'script', 'style', 'noscript', 'code', 'pre', 'kbd', 'samp', 'var', 'svg',
    '.markdown-body',
    '.CodeMirror', '.cm-editor', '.cm-content', '.monaco-editor',
    '.diff-line', '.diff-hunk', '.diff-content', '.blob-wrapper',
    '[contenteditable="true"]', '[data-ghzh-skip]'
  ].join(',');

  function skipped(el) {
    if (!el) return true;
    if (el.nodeType === 1) {
      if (el.matches && el.matches(SKIP_SELECTOR)) return true;
    }
    return false;
  }

  function skippedAttr(el) {
    if (!el) return true;
    if (el.nodeType === 1) {
      if (el.matches && el.matches(SKIP_ATTR_SELECTOR)) return true;
    }
    return false;
  }

  // ---- 动态文案规则（带数字/时间的句子，精确词典覆盖不到） -----------------
  var RULES = [
    [/^(\d[\d,]*)\s+commits?$/i, '$1 个提交'],
    [/^(\d[\d,]*)\s+files? changed$/i, '已更改 $1 个文件'],
    [/^(\d[\d,]*)\s+files?$/i, '$1 个文件'],
    [/^(\d[\d,]*)\s+branches?$/i, '$1 个分支'],
    [/^(\d[\d,]*)\s+contributors?$/i, '$1 位贡献者'],
    [/^(\d[\d,]*)\s+changes?$/i, '$1 项更改'],
    [/^(\d[\d,]*)\s+selected$/i, '已选 $1 项'],
    [/^(\d[\d,]*)\s+of\s+(\d[\d,]*)$/i, '$1 / $2'],
    [/^Commit (\d+) of (\d+)$/i, '第 $1 个提交，共 $2 个'],
    [/^(\d+)\s+seconds? ago$/i, '$1 秒前'],
    [/^(\d+)\s+minutes? ago$/i, '$1 分钟前'],
    [/^(\d+)\s+hours? ago$/i, '$1 小时前'],
    [/^(\d+)\s+days? ago$/i, '$1 天前'],
    [/^(\d+)\s+weeks? ago$/i, '$1 周前'],
    [/^(\d+)\s+months? ago$/i, '$1 个月前'],
    [/^(\d+)\s+years? ago$/i, '$1 年前'],
    [/^Yesterday$/i, '昨天'],
    [/^Today$/i, '今天'],

    // --- 工具栏按钮（push-pull-button.tsx，标题都是模板串） -----------------
    // 注意：具体规则必须排在下面的通配 `动词 远程名` 规则之前，否则会被它先吃掉。
    [/^Fetch the latest changes from (.+)$/, '从 $1 获取最新更改'],
    [/^Pull (.+) with rebase$/, '以变基方式拉取 $1'],
    [/^Pull requests in (.+)$/, '$1 中的拉取请求'],
    // 分支菜单里的动态项：`Update from main`
    [/^Update from (.+)$/, '从 $1 更新'],
    [/^Overwrite any changes on (.+) with your local changes[.…]*$/, '用您的本地更改覆盖 $1 上的所有更改…'],
    // `Pull 3 commits from the origin` / `Pull 1 commit from the origin`
    [/^Pull ([\d,]+) commits? from the (.+)$/, '从 $2 拉取 $1 个提交'],
    // `Fetch origin` / `Push origin` / `Force push origin`（通配，放最后）
    // 只用 \S+ 匹配远程名（远程名不含空格），避免误吃 "Pull request #12" 之类的短语。
    [/^(Fetch|Pull|Push|Force push)\s+(?!requests?\b|notifications?\b)(\S+)$/, function (m) {
      var verb = { Fetch: '获取', Pull: '拉取', Push: '推送', 'Force push': '强制推送' }[m[1]];
      return verb + ' ' + m[2];
    }],

    // --- 提交按钮（commit-message.tsx） -------------------------------------
    // 按钮文字是单个文本节点 "Commit 3 files to "（末尾带空格），后面跟 <strong>分支名</strong>。
    // 所以这里匹配的是去掉首尾空白后的 "Commit 3 files to"。
    [/^(Commit|Amend|Committing|Amending)(?: (\d+) files?)? to$/, function (m) {
      var verb = { Commit: '提交', Amend: '修补', Committing: '正在提交', Amending: '正在修补' }[m[1]];
      return m[2] ? verb + ' ' + m[2] + ' 个文件到' : verb + '到';
    }],
    // 工具提示 / title 属性：`Commit to main`、`Amend to main`
    [/^(Commit|Amend|Committing|Amending) to (.+)$/, function (m) {
      var verb = { Commit: '提交', Amend: '修补', Committing: '正在提交', Amending: '正在修补' }[m[1]];
      return verb + '到 ' + m[2];
    }],
    // amend 模式的按钮标题：`Amend last commit`
    [/^(Commit|Amend|Committing|Amending) last commit$/, function (m) {
      var verb = { Commit: '提交', Amend: '修补', Committing: '正在提交', Amending: '正在修补' }[m[1]];
      return verb + '上一次提交';
    }]
  ];

  function ruleHit(s) {
    for (var i = 0; i < RULES.length; i++) {
      var m = RULES[i][0].exec(s);
      if (!m) continue;
      var r = RULES[i][1];
      if (typeof r === 'function') return r(m);
      return r.replace(/\$(\d)/g, function (_, d) { return m[d]; });
    }
    return null;
  }

  var HAS_LETTER = /[A-Za-z]/;
  var _cache = Object.create(null);

  // 核心：翻译一段纯文本，保留首尾空白
  function tr(text) {
    if (!text) return text;
    var hit = _cache[text];
    if (hit !== undefined) return hit === null ? text : hit;

    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    var core = m[2];
    var out = null;

    if (core && core.length >= 2 && HAS_LETTER.test(core)) {
      var v = DICT[core];
      if (v === undefined) v = LOWER[core.toLowerCase()];
      if (v === undefined) v = MENU[core];
      if (v === undefined) v = MENULOWER[core.toLowerCase()];
      if (v === undefined) v = ruleHit(core);
      // 注意用 != null 同时挡掉 null 与 undefined：ruleHit 未命中时返回 null，
      // 若只判 undefined，null 会被拼成字符串 "null" 写回界面。
      if (v != null && v !== core) out = m[1] + v + m[3];
    }
    _cache[text] = out === null ? null : out;
    return out === null ? text : out;
  }

  var count = 0;

  function doTextNode(node) {
    var p = node.parentNode;
    if (!p || skipped(p)) return;
    var v = node.nodeValue;
    var nv = tr(v);
    if (nv !== v) { node.nodeValue = nv; count++; }
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label'];

  function doElement(el) {
    if (!el || el.nodeType !== 1) return;
    if (skippedAttr(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (el.hasAttribute && el.hasAttribute(a)) {
        var v = el.getAttribute(a);
        var nv = tr(v);
        if (nv !== v) { el.setAttribute(a, nv); count++; }
      }
    }
    var tag = el.tagName;
    if (tag === 'INPUT') {
      var t = (el.getAttribute('type') || '').toLowerCase();
      if (t === 'button' || t === 'submit' || t === 'reset') {
        var vv = el.value;
        var nvv = tr(vv);
        if (nvv !== vv) { el.value = nvv; count++; }
      }
    }
  }

  // ---- 菜单访问键标签（app 菜单栏） -----------------------------------------
  // 菜单项的标签由 React 组件 HW 渲染成：
  //   <span> <span class="sr-only">File</span>          <- 完整文本（只有它能整串匹配）
  //          <span class="access-key">F</span>          <- 访问键字符
  //          <span aria-hidden>ile</span> </span>       <- 剩下的部分
  // 可见文字被拆成 "F"+"ile" 两个文本节点，普通文本节点翻译永远匹配不到。
  // 所以这里特判这个结构：拿 .sr-only 的整串去查菜单词典，命中后把译文写进
  // 可见的那个 span（其余清空），.sr-only 也同步。不删除 React 的节点，
  // 避免 React 后续 diff 时拿到已被移除的 DOM 引用。
  // （MENU / MENULOWER 已在文件开头初始化。）

  function accessKeyLabel(el) {
    if (el.tagName !== 'SPAN' || el.children.length < 2) return false;
    var first = el.children[0];
    if (!first.classList || !first.classList.contains('sr-only')) return false;
    for (var i = 1; i < el.children.length; i++) {
      if (el.children[i].getAttribute('aria-hidden') === null) return false;
    }
    var full = first.textContent;
    // 结构已确认是 AccessText：无论能不能翻，都返回 true 让遍历停止下钻，
    // 否则碎片会被单独翻译，拼出 "Show 已贮藏的更改" 这种半中半英的标签。
    if (!full) return true;
    var v = MENU[full];
    if (v === undefined) v = DICT[full];
    if (v === undefined) v = MENULOWER[full.toLowerCase()];
    if (v === undefined) v = LOWER[full.toLowerCase()];
    if (v === undefined) v = ruleHit(full);
    if (v === undefined || v === full) return true;
    first.textContent = v;
    el.children[1].textContent = v;
    for (var j = 2; j < el.children.length; j++) el.children[j].textContent = '';
    count++;
    return true;
  }

  // 递归遍历（原来用 TreeWalker，但它没法在识别出访问键结构后「停止下钻」，
  // 会把 "Sho" / "w" / " stashed changes" 这种碎片当独立文本翻译，拼出半中半英的标签）。
  function walkNode(node) {
    if (!node) return;
    if (node.nodeType === 3) { doTextNode(node); return; }
    if (node.nodeType !== 1) return;
    // 注意：属性翻译必须放在 skipped() 判断之前。
    // input/textarea 在 SKIP_SELECTOR 里（不翻它们的内部文本与 value），
    // 但它们的 placeholder/title/aria-label 是要翻的；早期版本先 return 掉，
    // 于是搜索框的 "Filter your repositories" 永远翻不出来。
    doElement(node);                       // 内部按 skippedAttr 判断
    if (skipped(node)) return;
    // 识别到访问键结构就整体处理完并停止下钻——命中与否都不再遍历它的子节点
    if (accessKeyLabel(node)) return;
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) walkNode(kids[i]);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 9) {
      var top = root.documentElement || root;
      for (var i = 0; i < top.childNodes.length; i++) walkNode(top.childNodes[i]);
      return;
    }
    walkNode(root);
  }

  // ---- 观察器 ---------------------------------------------------------------
  var on = true;
  var queue = [];
  var scheduled = false;

  function flush() {
    scheduled = false;
    var q = queue; queue = [];
    if (!on) return;
    for (var i = 0; i < q.length; i++) {
      try { walk(q[i]); } catch (e) { /* 单个节点失败不影响整体 */ }
    }
  }

  function push(n) { queue.push(n); if (!scheduled) { scheduled = true; setTimeout(flush, 16); } }

  var mo = new MutationObserver(function (records) {
    if (!on) return;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === 'characterData') push(r.target);
      else if (r.type === 'attributes') push(r.target);
      else for (var j = 0; j < r.addedNodes.length; j++) push(r.addedNodes[j]);
    }
  });

  var OBS = { childList: true, subtree: true, characterData: true, attributes: true,
              attributeFilter: ATTRS.concat(['value']) };

  function refresh() {
    queue = []; _cache = Object.create(null);
    if (document.body) walk(document.body);
  }

  function start() {
    mo.observe(document.documentElement, OBS);
    refresh();
    // 首屏 React 挂载有延迟，补几次
    [50, 200, 600, 1500, 3000, 6000].forEach(function (ms) { setTimeout(refresh, ms); });
    setTimeout(report, 8000);
    // 想排查「还有哪些没翻」，在开发者工具里执行：__GHZH__.collect()
  }

  // ---- 自检报告：把「已经翻成中文的界面文字」写到 D 盘，用来确认汉化真的生效 --
  // 渲染进程开了 nodeIntegration，所以这里能 require('fs')；没有也不影响翻译。
  // ---- 采集：把界面上还没翻成中文的英文文案抓出来（用来补词典） --------------
  // 判据：不含汉字/中文标点（也就是还没被翻译），含字母，长度 >= 2。
  // 注意不能用「含非 ASCII 就算已翻译」——英文原文里的省略号 … 也是非 ASCII，
  // 那样会把 "Clone a repository from the Internet…" 这类句子误判成已翻译。
  var HAS_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
  function collect() {
    var seen = Object.create(null), out = [], attrs = [];
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode;
          if (!p || skipped(p)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n;
      while ((n = w.nextNode())) {
        var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (t.length < 2 || !HAS_LETTER.test(t) || HAS_CJK.test(t)) continue;
        if (seen[t]) continue;
        seen[t] = 1; out.push(t);
      }
      var els = document.querySelectorAll('[title],[placeholder],[aria-label],[alt]');
      for (var i = 0; i < els.length; i++) {
        for (var k = 0; k < 4; k++) {
          var a = ['title', 'placeholder', 'aria-label', 'alt'][k];
          var v = els[i].getAttribute(a);
          if (!v) continue;
          v = v.replace(/\s+/g, ' ').trim();
          if (v.length < 2 || !HAS_LETTER.test(v) || HAS_CJK.test(v)) continue;
          if (seen[v]) continue;
          seen[v] = 1; attrs.push(a + ' = ' + v);
        }
      }
    } catch (e) { out.push('<<collect error: ' + e + '>>'); }
    out.sort(); attrs.sort();
    try {
      var fs = require('fs');
      fs.writeFileSync('D:/GitHub-Desktop-ZH/_scratch/untranslated.txt',
        '# 界面上仍为英文的可见文本\n' + out.join('\n') +
        '\n\n# 界面上仍为英文的属性（title/placeholder/aria-label/alt）\n' + attrs.join('\n'), 'utf8');
    } catch (e) { /* ignore */ }
    return { text: out, attrs: attrs };
  }

  function report() {
    var out = {
      at: new Date().toISOString(),
      enabled: on,
      translated: count,
      dictSize: Object.keys(DICT).length,
      menuSize: Object.keys(MENU).length,
      samples: []
    };
    try {
      var sel = ['.commit-button', '.menu-item .label', '.tab-bar-item', '.toolbar-button',
                 '.filter-list-group-header', '.branch-name', '.dialog-header', 'h1', 'h2', 'button'];
      for (var i = 0; i < sel.length && out.samples.length < 60; i++) {
        var nodes = document.querySelectorAll(sel[i]);
        for (var j = 0; j < nodes.length && out.samples.length < 60; j++) {
          var t = (nodes[j].innerText || nodes[j].textContent || '').replace(/\s+/g, ' ').trim();
          if (t) out.samples.push(sel[i] + ' :: ' + t.slice(0, 80));
        }
      }
    } catch (e) { out.sampleError = String(e); }
    try {
      var fs = require('fs');
      fs.writeFileSync('D:/GitHub-Desktop-ZH/status.json', JSON.stringify(out, null, 2), 'utf8');
    } catch (e) { /* 没有 fs 就不写，翻译照常 */ }
    return out;
  }

  window.__GHZH__ = {
    dict: DICT,
    get count() { return count; },
    on: function () { on = true; refresh(); return true; },
    off: function () { on = false; queue = []; return false; },
    toggle: function () { return on ? this.off() : this.on(); },
    refresh: refresh,
    report: report,
    collect: collect,
    tr: tr
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
