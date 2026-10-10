/* 把新发现的菜单标签补进 dict-menu.json（键是「去掉 & 的裸标签」）。 */
const fs = require('fs');
const P = 'D:/GitHub-Desktop-ZH/_scratch/dict-menu.json';
const m = JSON.parse(fs.readFileSync(P, 'utf8'));

const add = {
  'Force Push': '强制推送',
  'Force Push…': '强制推送…',
  'Repository settings': '仓库设置',
  'Create pull request': '创建拉取请求',
  'Create Pull Request': '创建拉取请求',
  'Show stashed changes': '显示已贮藏的更改',
  'Hide stashed changes': '隐藏已贮藏的更改',
  'Show Toggle Changes Filter': '显示更改筛选器',
  'Hide Toggle Changes Filter': '隐藏更改筛选器',
};

let n = 0;
for (const k of Object.keys(add)) {
  if (m[k] === undefined) { m[k] = add[k]; n++; }
  else console.log('  已存在，保留原译文：' + JSON.stringify(k) + ' -> ' + JSON.stringify(m[k]));
}
fs.writeFileSync(P, JSON.stringify(m, null, 2), 'utf8');
console.log('新增 ' + n + ' 条，菜单词典现在共 ' + Object.keys(m).length + ' 条');
