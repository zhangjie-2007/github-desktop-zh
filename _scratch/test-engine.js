/* 离线测试 engine.js 的翻译函数：用假的 window/document 把引擎跑起来，再逐条断言。 */
const fs = require('fs');
const path = require('path');
const DIR = 'D:/GitHub-Desktop-ZH';

global.window = {};
global.document = {
  readyState: 'complete',
  body: null,
  documentElement: null,
  addEventListener() {},
  createTreeWalker() { return { nextNode: () => null }; },
};
global.NodeFilter = { SHOW_TEXT: 4, SHOW_ELEMENT: 1, FILTER_ACCEPT: 1, FILTER_REJECT: 2 };
global.MutationObserver = class { observe() {} disconnect() {} };
global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };

// 先把词典挂到假 window 上（i18n-zh.js 就是一句赋值）
const dictSrc = fs.readFileSync(path.join(DIR, 'i18n-zh.js'), 'utf8');
new Function('window', dictSrc)(global.window);
// 再跑引擎
new Function('window', 'document', 'NodeFilter', 'MutationObserver', 'Node', 'setTimeout',
  fs.readFileSync(path.join(DIR, 'engine.js'), 'utf8'))(
  global.window, global.document, global.NodeFilter, global.MutationObserver, global.Node, () => {});

const tr = global.window.__GHZH__.tr;

const cases = [
  // 提交按钮可见文字（文本节点）
  ['Commit 3 files to ', '提交 3 个文件到 '],
  ['Commit 1 file to ', '提交 1 个文件到 '],
  ['Commit to ', '提交到 '],
  ['Amend 2 files to ', '修补 2 个文件到 '],
  ['Committing to ', '正在提交到 '],
  // 提交按钮 title
  ['Commit to main', '提交到 main'],
  ['Amend last commit', '修补上一次提交'],
  // 工具栏
  ['Fetch origin', '获取 origin'],
  ['Pull origin', '拉取 origin'],
  ['Push origin', '推送 origin'],
  ['Force push origin', '强制推送 origin'],
  ['Pull origin with rebase', '以变基方式拉取 origin'],
  ['Fetch the latest changes from origin', '从 origin 获取最新更改'],
  ['Pull requests in my-repo', 'my-repo 中的拉取请求'],
  ['Pull 3 commits from the origin', '从 origin 拉取 3 个提交'],
  // 菜单里「没有访问键」的裸标签（走普通文本节点路径，必须能查到菜单词典）
  ['Show User Guides', '显示用户指南'],
  ['Show keyboard shortcuts', '显示键盘快捷键'],
  ['Report issue…', '反馈问题…'],
  ['Show logs in Explorer', '在资源管理器中显示日志'],
  ['About GitHub Desktop', '关于 GitHub Desktop'],
  // 不应被误伤的
  ['Pull request', '拉取请求'],
  ['my-branch', 'my-branch'],
  ['Fix the login bug', 'Fix the login bug'],
  ['src/app/main.ts', 'src/app/main.ts'],
  ['a1b2c3d', 'a1b2c3d'],
  ['', ''],
];

let pass = 0, fail = 0;
for (const [input, expect] of cases) {
  const got = tr(input);
  const ok = expect === null ? got !== input : got === expect;
  if (ok) { pass++; console.log('  [OK]   ' + JSON.stringify(input) + ' -> ' + JSON.stringify(got)); }
  else { fail++; console.log('  [FAIL] ' + JSON.stringify(input) + ' -> ' + JSON.stringify(got) + '  期望 ' + JSON.stringify(expect)); }
}
console.log('\n' + pass + ' 通过 / ' + fail + ' 失败');
console.log('主词典条数 = ' + Object.keys(global.window.__GHZH_DICT__).length +
            '，菜单词典条数 = ' + Object.keys(global.window.__GHZH_MENU__ || {}).length);
