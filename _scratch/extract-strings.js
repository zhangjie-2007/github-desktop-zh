// 从 GitHub Desktop 的 renderer.js.map 里抽取 UI 文案候选
const fs = require('fs');
const MAP = 'C:\\Users\\zhangjie\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\renderer.js.map';
const OUT = 'D:\\GitHub-Desktop-ZH\\_scratch\\strings.txt';

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const { sources, sourcesContent } = map;

const cand = new Map(); // string -> Set(source)

function add(s, src) {
  s = s.trim();
  if (!s) return;
  if (s.length < 2 || s.length > 90) return;
  if (!/^[\x20-\x7E]+$/.test(s)) return;               // 纯 ASCII
  if (!/[A-Za-z]/.test(s)) return;
  if (/[\\<>{}[\]|]/.test(s)) return;
  if (/^[a-z]/.test(s) && !/ /.test(s)) return;        // 小写单词多半是标识符
  if (/^(https?:|www\.|@)/.test(s)) return;
  if (/\.(css|js|json|png|svg|node|exe|map|md|txt)$/i.test(s)) return;
  if (/^(use|on|get|set)[A-Z]/.test(s)) return;
  if (/^[a-z]+([A-Z][a-z]+)+$/.test(s)) return;        // camelCase 标识符
  if (/^[a-z0-9-]+$/.test(s) && /-/.test(s)) return;   // css 类名
  if (/^[A-Z_]+$/.test(s) && s.length > 3) return;     // 常量
  if (/%[sd]/i.test(s)) { /* 模板串，先留着 */ }
  if (!cand.has(s)) cand.set(s, new Set());
  cand.get(s).add(src);
}

const isUI = (p) => /app[\\/]src[\\/](ui|lib)[\\/]/.test(p);

for (let i = 0; i < sources.length; i++) {
  const src = sources[i];
  if (!isUI(src)) continue;
  const code = sourcesContent[i];
  if (!code) continue;
  const short = src.replace(/.*app[\\/]src[\\/]/, '');

  // JSX 文本
  let m;
  const reJsx = />\s*([A-Z][^<>{}]{1,88}?)\s*</g;
  while ((m = reJsx.exec(code))) add(m[1], short);

  // 字符串字面量
  const reStr = /(['"])((?:(?!\1)[^\\\r\n]|\\.){2,90})\1/g;
  while ((m = reStr.exec(code))) {
    const v = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (/^[A-Z]/.test(v) || /\s/.test(v)) add(v, short);
  }
}

const rows = [...cand.entries()].sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync(OUT, rows.map(([s, set]) => s + '\t' + [...set].slice(0, 3).join(',')).join('\n'), 'utf8');
console.log('候选数: ' + rows.length);
