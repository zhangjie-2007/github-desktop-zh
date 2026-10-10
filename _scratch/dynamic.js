/* 抽出所有「带变量的模板串」—— 这些是精确词典覆盖不到的动态文案，
   需要写成 engine.js 的 RULES 规则，或者按前缀翻译。 */
const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const found = new Map();

map.sourcesContent.forEach((src, si) => {
  if (!src) return;
  const name = map.sources[si];
  if (!/app[\\/]src[\\/]/.test(name)) return;
  const re = /`((?:[^`\\]|\\[\s\S])*)`/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1];
    if (s.indexOf('${') < 0) continue;
    if (s.length > 160) continue;
    if (!/[A-Za-z]/.test(s)) continue;
    // 只留像句子/标题的：含空格，且不是纯代码
    if (!/\S\s+\S/.test(s)) continue;
    if (/^(import|export|const|let|var|function|return|class)\b/.test(s.trim())) continue;
    if (/[;{}()[\]]/.test(s.replace(/\$\{[^}]*\}/g, 'X'))) continue;
    if (!found.has(s)) found.set(s, name.replace(/^webpack:\/\/\/\.\//, ''));
  }
});

const list = [...found].sort((a, b) => a[0].localeCompare(b[0]));
console.log('动态模板串 ' + list.length + ' 条\n');
for (const [s, f] of list) console.log(JSON.stringify(s).padEnd(70) + '  <- ' + f);
