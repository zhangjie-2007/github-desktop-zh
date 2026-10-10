const fs = require('fs');
const MAP = 'C:/Users/zhangjie/AppData/Local/GitHubDesktop/app-3.6.7/resources/app/renderer.js.map';
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const src = (re) => {
  const i = map.sources.findIndex((s) => re.test(s));
  return i < 0 ? null : { name: map.sources[i].replace(/^webpack:\/\/\/\.\//, ''), text: map.sourcesContent[i] };
};

const p = src(/\/push-pull-button\.tsx$/);
const lines = p.text.split('\n');
console.log('##### ' + p.name + ' 行 560-700 #####');
lines.slice(559, 700).forEach((l, i) => console.log(String(i + 560).padStart(4) + ': ' + l));
