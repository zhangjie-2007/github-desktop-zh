/* 检查 main.js 里的应用菜单标签是否都被覆盖（有些是原生对话框标题，翻不了）。 */
const fs = require('fs');
const APP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/';
global.window = {};
new Function('window', fs.readFileSync('D:/GitHub-Desktop-ZH/i18n-zh.js', 'utf8'))(global.window);
const D = global.window.__GHZH_DICT__, M = global.window.__GHZH_MENU__;

const src = fs.readFileSync(APP + 'main.js', 'utf8');
const re = /label\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const labels = new Set();
let m;
while ((m = re.exec(src))) {
  const s = m[1].replace(/\\(["\\])/g, '$1');
  if (/^[A-Za-z&]/.test(s)) labels.add(s);
}
const all = [...labels].sort();
const miss = [];
for (const raw of all) {
  const bare = raw.replace(/&&/g, '\u0000').replace(/&/g, '').replace(/\u0000/g, '&');
  if (M[bare] !== undefined || D[bare] !== undefined || M[raw] !== undefined || D[raw] !== undefined) continue;
  miss.push(raw);
}
console.log('main.js 里 label:"…" 字面量共 ' + all.length + ' 个，未被词典覆盖 ' + miss.length + ' 个：');
miss.forEach((s) => console.log('  ' + JSON.stringify(s)));
