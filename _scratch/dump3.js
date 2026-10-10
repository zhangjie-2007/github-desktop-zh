const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const i = map.sources.findIndex((s) => /ui[\\/]changes[\\/]commit-message\.tsx$/.test(s));
const text = map.sourcesContent[i];
const lines = text.split('\n');
console.log('##### commit-message.tsx 总行数 ' + lines.length + ' —— 行 1470-1650 #####');
lines.slice(1469, 1650).forEach((l, k) => console.log(String(k + 1470).padStart(4) + ': ' + l));
