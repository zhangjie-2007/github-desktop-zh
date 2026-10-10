/* 只看「这次修正后才冒出来」的候选（strings3 - strings.txt），再减掉词典已覆盖的。
   这样得到的就是真正新增、且还没翻译的界面文案。 */
const fs = require('fs');
const S = 'D:/GitHub-Desktop-ZH/_scratch/';
global.window = {};
new Function('window', fs.readFileSync('D:/GitHub-Desktop-ZH/i18n-zh.js', 'utf8'))(global.window);
const D = global.window.__GHZH_DICT__, M = global.window.__GHZH_MENU__;

const load = (f) => fs.readFileSync(S + f, 'utf8').split(/\r?\n/).filter(Boolean)
  .map((l) => l.split('\t'));
const old = new Set(load('strings.txt').map((r) => r[0]));
const rows = load('strings3.txt');

const HAS_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
const fresh = [], covered = [];
for (const [s, where] of rows) {
  if (old.has(s)) continue;                 // 上一轮就有
  if (HAS_CJK.test(s)) continue;
  if (!/[A-Za-z]/.test(s) || s.length < 3) continue;
  if (D[s] !== undefined || M[s] !== undefined) { covered.push(s); continue; }
  fresh.push([s, where || '']);
}
fresh.sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync(S + 'fresh.txt', fresh.map(([s, w]) => s + '\t' + w).join('\n'), 'utf8');
console.log('新增候选 ' + fresh.length + ' 条（词典已覆盖的 ' + covered.length + ' 条）-> fresh.txt');
fresh.forEach(([s, w]) => console.log('  ' + JSON.stringify(s) + '   <- ' + w.split(',')[0]));
