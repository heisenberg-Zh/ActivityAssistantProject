const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPage(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {
    console,
    require: (p) => {
      if (p.startsWith('.')) return require(path.resolve(path.dirname(file), p));
      return require(p);
    },
    module: { exports: {} },
    exports: {},
    Page: (obj) => { sandbox.__page = obj; },
    getApp: () => ({ globalData: {} }),
    wx: {
      showToast() {},
      navigateBack() {},
      navigateTo() {},
      stopPullDownRefresh() {}
    },
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(code, sandbox, { filename: file });
  if (!sandbox.__page) throw new Error('Page not registered');
  return Object.keys(sandbox.__page);
}

const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const pageEntries = [];
for (const p of app.pages || []) pageEntries.push(p);
for (const pkg of app.subPackages || []) {
  for (const p of pkg.pages || []) pageEntries.push(pkg.root + '/' + p);
}

let missing = [];
for (const p of pageEntries) {
  for (const ext of ['.js','.json','.wxml','.wxss']) {
    const f = p + ext;
    if (!fs.existsSync(f)) missing.push(f);
  }
}
console.log('pageCount=' + pageEntries.length);
console.log('missingCount=' + missing.length);
if (missing.length) missing.forEach(m => console.log('MISSING ' + m));

for (const file of ['pages/admin/index.js','pages/admin/activities/index.js']) {
  try {
    const methods = loadPage(file);
    console.log('LOAD_OK ' + file + ' methods=' + methods.length);
  } catch (e) {
    console.log('LOAD_FAIL ' + file + ' ' + e.message);
    process.exitCode = 1;
  }
}
