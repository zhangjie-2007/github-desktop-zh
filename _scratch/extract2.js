// 从 renderer.js.map 的原始源码里，用真正的扫描器抽取 UI 文案
const fs = require('fs');
const MAP = 'C:\\Users\\zhangjie\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\renderer.js.map';
const OUT = 'D:\\GitHub-Desktop-ZH\\_scratch\\strings.txt';

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const { sources, sourcesContent } = map;

const cand = new Map();

function add(s, src) {
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 110) return;
  if (!/^[\x20-\x7E]+$/.test(s)) return;
  if (!/[A-Za-z]/.test(s)) return;
  if (/[\\{}<>]|=>|\|\||&&|\?\./.test(s)) return;
  if (/^[a-z][A-Za-z0-9]*$/.test(s)) return;              // 单个小写词
  if (/^[a-z0-9_]+(-[a-z0-9_]+)+$/.test(s)) return;
  if (/\.(css|js|json|png|svg|node|exe|map|md|txt|tsx?|otf|woff2?)$/i.test(s)) return;
  if (/^(https?:|mailto:|www\.|data:)/.test(s)) return;
  if (/^\/|^\.\.?$/.test(s)) return;
  if (/^[A-Z][a-zA-Z0-9]*$/.test(s) && s.length < 3) return;
  if (/^(aria|data|role|tabindex|ref|key|id|clsx|typeof|instanceof)/i.test(s)) return;
  if (/^-/.test(s)) return;
  if (!/^[A-Za-z&]/.test(s)) return;
  if (/\//.test(s) && !/ /.test(s)) return;
  if (/^(import|export|from|require|class|function|const|let|var) /.test(s)) return;
  if (/^[a-z]+(-[a-z]+)+$/.test(s)) return;
  if (/^_/.test(s)) return;
  if (/\$\{/.test(s)) return;

  if (!cand.has(s)) cand.set(s, new Set());
  cand.get(s).add(src);
}

// 极简 JS/TS 扫描器：能正确跳过注释与各类字符串
function scan(code, src) {
  let i = 0;
  const n = code.length;
  let prevSig = '';   // 上一个非空白有效字符，用于判断是否 JSX 文本
  let jsxText = false;
  let buf = '';
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    // 注释
    if (c === '/' && c2 === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') { i += 2; while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
    // 字符串
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      let s = '';
      while (i < n && code[i] !== q) {
        if (code[i] === '\\') { s += code[i] + code[i + 1]; i += 2; continue; }
        if (q !== '`' && code[i] === '\n') break;
        s += code[i]; i++;
      }
      i++;
      if (q === '`' || /\$\{/.test(s)) { /* 模板串含插值，跳过 */ }
      else add(s.replace(/\\(['"\\])/g, '$1'), src);
      prevSig = q; jsxText = false; buf = '';
      continue;
    }
    // 尖括号：区分 JSX 标签与文本
    if (c === '>') {
      const tail = code.slice(i + 1);
      const m = /^\s*([^<>{}`\n]+?)\s*(?=<|\{)/.exec(tail);
      if (m && /[A-Za-z]/.test(m[1])) add(m[1], src);
      i++; prevSig = '>'; jsxText = true; buf = ''; continue;
    }
    i++;
  }
}

const isUI = (p) => /app[\\/]src[\\/](ui|lib)[\\/]/.test(p);
for (let i = 0; i < sources.length; i++) {
  if (!isUI(sources[i])) continue;
  const short = sources[i].replace(/.*app[\\/]src[\\/]/, '');
  scan(sourcesContent[i] || '', short);
}

const rows = [...cand.entries()].sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync(OUT, rows.map(([s, set]) => s + '\t' + [...set].slice(0, 2).join(',')).join('\n'), 'utf8');
console.log('候选数: ' + rows.length);
