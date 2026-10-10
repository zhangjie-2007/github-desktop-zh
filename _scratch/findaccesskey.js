/* 在 renderer.js.map 的 sourcesContent 里定位「访问键标签」组件的源码，看它在没有 & 时渲染成什么。 */
const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const srcs = map.sources, conts = map.sourcesContent;
const needles = ['access-key', 'sr-only'];
for (let i = 0; i < conts.length; i++) {
  const c = conts[i];
  if (!c) continue;
  if (needles.every((n) => c.includes(n)) && /aria-hidden/.test(c)) {
    console.log('### ' + srcs[i] + '  (' + c.length + ' 字节)');
    console.log(c);
    console.log('----------------------------------------');
  }
}
