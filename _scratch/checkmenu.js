/* 检查一批（含动态拼出来的）菜单标签是否已被词典覆盖。 */
const fs = require('fs');
global.window = {};
new Function('window', fs.readFileSync('D:/GitHub-Desktop-ZH/i18n-zh.js', 'utf8'))(global.window);
const D = global.window.__GHZH_DICT__, M = global.window.__GHZH_MENU__;

const cands = [
  'Push', 'Force Push', 'Force Push…', 'Pull', 'Fetch',
  'View on GitHub', 'Open in shell', 'Open in external editor', 'Show in Explorer',
  'Open in GitHub Copilot', 'Stash all changes', 'Stash all changes…',
  'Remove repository', 'Repository settings', 'Create pull request', 'Create Pull Request',
  'Show stashed changes', 'Hide stashed changes',
  'Show Toggle Changes Filter', 'Hide Toggle Changes Filter',
  'Discard all changes…', 'Discard all changes',
  'Publish branch', 'Publish repository', 'Update from main',
  'Add to dictionary', 'Reload', 'Toggle full screen', 'Toggle developer tools',
  'No repositories', 'Changes', 'History', 'Repository list', 'Branches list',
  'Worktrees list', 'Go to Summary', 'Reset zoom', 'Zoom in', 'Zoom out',
  'Expand active resizable', 'Contract active resizable',
  'Options…', 'Exit', 'Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Select all', 'Find',
  'View', 'File', 'Edit', 'Repository', 'Branch', 'Help',
];
const miss = [];
for (const c of cands) {
  const d = D[c], m = M[c];
  if (d === undefined && m === undefined) miss.push(c);
  else console.log('  有: ' + JSON.stringify(c) + '  ->  ' + JSON.stringify(m !== undefined ? m : d));
}
console.log('\n缺少 ' + miss.length + ' 条：');
miss.forEach((c) => console.log('  ' + JSON.stringify(c)));
