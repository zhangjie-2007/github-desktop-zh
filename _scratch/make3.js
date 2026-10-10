/* 用修正后的过滤条件重抽一遍：原 extract2.js 第 14 行要求纯 ASCII，
   导致所有带 … 的界面文案（菜单项、对话框按钮）被整批丢掉。 */
const fs = require('fs');
const S = 'D:/GitHub-Desktop-ZH/_scratch/';
let src = fs.readFileSync(S + 'extract2.js', 'utf8');
const before = src;
src = src.replace(
  "if (!/^[\\x20-\\x7E]+$/.test(s)) return;",
  "if (/[\\x00-\\x1f\\x7f]/.test(s)) return;   // 修正：允许 … 等可打印非 ASCII"
);
if (src === before) { console.error('补丁没生效，请检查 extract2.js 第 14 行'); process.exit(1); }
src = src.replace(/strings\.txt/g, 'strings3.txt');
fs.writeFileSync(S + 'extract3.js', src, 'utf8');
console.log('已生成 extract3.js（输出 strings3.txt）');
