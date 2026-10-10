/* 把抽出来的词典 JSON 合成 i18n-zh.js —— GitHub Desktop 运行时翻译词典 */
const fs = require('fs');
const path = require('path');

const SRC = 'D:\\GitHub-Desktop-ZH\\_scratch';
const OUT = 'D:\\GitHub-Desktop-ZH\\i18n-zh.js';

const main = JSON.parse(fs.readFileSync(path.join(SRC, 'dict-merged.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(SRC, 'dict-menu.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(SRC, 'dict-extra.json'), 'utf8'));

// dict-extra 是「补漏词典」：只补齐主词典没有的键，绝不覆盖已有的译文。
for (const k of Object.keys(extra)) {
  if (!(k in main)) main[k] = extra[k];
}

function clean(obj) {
  const out = {};
  let dropped = 0;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v !== 'string' || !k || !v) { dropped++; continue; }
    if (v === k) { dropped++; continue; }          // 译文与原文相同的（纯专有名词）没必要留
    out[k] = v;
  }
  return { out, dropped };
}

const m = clean(main);
const u = clean(menu);

const header = `/* ============================================================================
 * GitHub Desktop 简体中文词典（GitHub Desktop 3.6.7）
 *
 * 由界面英文原文抽取 + 翻译得到，供同目录的 engine.js 使用。
 * 这是精确匹配词典：只有整段文字完全相同才会被替换，所以仓库名、分支名、
 * 提交信息、文件路径、代码和 diff 内容都不会被误伤。
 *
 * __GHZH_DICT__ 普通界面文案（按钮、标签、提示、菜单项……）
 * __GHZH_MENU__ 应用菜单栏文案。这些标签在 DOM 里被拆成多个 span，
 *               engine.js 会拿 .sr-only 里的整串来查这张表。
 *
 * 生成时间：${new Date().toISOString()}
 * 词条数：${Object.keys(m.out).length} + ${Object.keys(u.out).length}
 * ==========================================================================*/
`;

const body =
  'window.__GHZH_DICT__ = ' + JSON.stringify(m.out, null, 0) + ';\n\n' +
  'window.__GHZH_MENU__ = ' + JSON.stringify(u.out, null, 0) + ';\n';

fs.writeFileSync(OUT, header + body, 'utf8');
console.log('已写 ' + OUT);
console.log('主词典 ' + Object.keys(m.out).length + ' 条（丢弃 ' + m.dropped + ' 条同文/空值）');
console.log('菜单词典 ' + Object.keys(u.out).length + ' 条（丢弃 ' + u.dropped + ' 条同文/空值）');
