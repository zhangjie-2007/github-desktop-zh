const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

console.log('=== ui/changes 下的源文件 ===');
map.sources.forEach((s) => { if (/ui[\\/]changes[\\/]/.test(s)) console.log('  ' + s.replace(/^webpack:\/\/\/\.\//, '')); });

console.log('\n=== 含 "Commit" 且像按钮标题的模板/字面量 ===');
const seen = new Set();
map.sourcesContent.forEach((src, si) => {
  if (!src || !/app[\\/]src[\\/]/.test(map.sources[si])) return;
  const re = /[`'"]([^`'"\n]{0,40}Commit[^`'"\n]{0,50})[`'"]/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1];
    if (/[={}()<>;]/.test(s)) continue;
    if (s.length < 4 || s.length > 60) continue;
    const key = s;
    if (seen.has(key)) continue;
    seen.add(key);
    const ln = src.substring(0, m.index).split('\n').length;
    console.log('  ' + JSON.stringify(s).padEnd(52) + ' <- ' + map.sources[si].replace(/^webpack:\/\/\/\.\//, '') + ':' + ln);
  }
});
