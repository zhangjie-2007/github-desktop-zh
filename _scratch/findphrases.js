/* 在 renderer 源码里定位关键动态文案的构造位置 */
const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

const phrases = process.argv.slice(2);
for (const p of phrases) {
  console.log('\n########## ' + JSON.stringify(p) + ' ##########');
  let hits = 0;
  map.sourcesContent.forEach((src, si) => {
    if (!src || !/app[\\/]src[\\/]/.test(map.sources[si])) return;
    let idx = 0;
    while ((idx = src.indexOf(p, idx)) !== -1) {
      const line = src.substring(0, idx).split('\n').length;
      console.log('  [' + map.sources[si].replace(/^webpack:\/\/\/\.\//, '') + ':' + line + '] ' +
        src.substring(Math.max(0, idx - 80), idx + 120).replace(/\s+/g, ' '));
      idx += p.length;
      if (++hits > 14) return;
    }
    if (hits > 14) return;
  });
  if (!hits) console.log('  (无)');
}
