/* 用重抽的 strings3.txt 对词典做覆盖差分，找出还没翻译的界面文案。 */
const fs = require('fs');
const S = 'D:/GitHub-Desktop-ZH/_scratch/';
global.window = {};
new Function('window', fs.readFileSync('D:/GitHub-Desktop-ZH/i18n-zh.js', 'utf8'))(global.window);
const D = global.window.__GHZH_DICT__, M = global.window.__GHZH_MENU__;

const rows = fs.readFileSync(S + 'strings3.txt', 'utf8').split(/\r?\n/).filter(Boolean)
  .map((l) => l.split('\t'));

const HAS_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
const miss = [];
for (const [s, where] of rows) {
  if (D[s] !== undefined || M[s] !== undefined) continue;
  if (HAS_CJK.test(s)) continue;                       // 已经是中文的条目
  if (!/[A-Za-z]/.test(s)) continue;
  if (s.length < 3) continue;
  miss.push([s, where || '']);
}
fs.writeFileSync(S + 'miss3.txt', miss.map(([s, w]) => s + '\t' + w).join('\n'), 'utf8');
console.log('strings3 候选 ' + rows.length + ' 条，词典未覆盖 ' + miss.length + ' 条 -> miss3.txt');
console.log('其中含 … 的: ' + miss.filter(([s]) => /…/.test(s)).length);
console.log('\n含 … 的前 25 条：');
miss.filter(([s]) => /…/.test(s)).slice(0, 25).forEach(([s, w]) => console.log('  ' + JSON.stringify(s) + '   <- ' + w));
