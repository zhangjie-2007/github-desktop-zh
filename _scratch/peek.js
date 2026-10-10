const fs = require('fs');
const MAP = 'C:\\Users\\zhangjie\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
console.log('sources:', map.sources.length, '有内容的:', map.sourcesContent.filter(Boolean).length);
console.log('sourceRoot:', map.sourceRoot);
const want = process.argv[2] || 'ui/changes/commit-message.tsx';
for (let i = 0; i < map.sources.length; i++) {
  if (map.sources[i].endsWith(want)) {
    const c = map.sourcesContent[i] || '';
    console.log('=== ' + map.sources[i] + '  len=' + c.length);
    console.log(c.slice(0, 1500));
    break;
  }
}
