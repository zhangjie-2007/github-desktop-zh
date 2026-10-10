const fs = require('fs');
const DIR = 'D:/GitHub-Desktop-ZH';
global.window = {};
global.document = { readyState: 'complete', body: null, documentElement: null, addEventListener() {}, createTreeWalker() { return { nextNode: () => null }; } };
global.NodeFilter = { SHOW_TEXT: 4, SHOW_ELEMENT: 1, FILTER_ACCEPT: 1, FILTER_REJECT: 2 };
global.MutationObserver = class { observe() {} };
global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
new Function('window', fs.readFileSync(DIR + '/i18n-zh.js', 'utf8'))(global.window);
new Function('window', 'document', 'NodeFilter', 'MutationObserver', 'Node', 'setTimeout', fs.readFileSync(DIR + '/engine.js', 'utf8'))(global.window, global.document, global.NodeFilter, global.MutationObserver, global.Node, () => {});
const tr = global.window.__GHZH__.tr;
const DICT = global.window.__GHZH_DICT__;
console.log('typeof tr =', typeof tr);
for (const s of ['my-branch', 'Pull request', 'Fix the login bug', 'src/app/main.ts', 'a1b2c3d']) {
  const r = tr(s);
  console.log(JSON.stringify(s), '->', JSON.stringify(r), '| raw=', r, '| typeof=', typeof r, '| in DICT=', s in DICT);
}
console.log('DICT["Pull request"] =', JSON.stringify(DICT['Pull request']));
