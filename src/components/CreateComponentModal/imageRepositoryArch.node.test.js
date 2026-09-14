const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const imageRepositoryView = source.slice(
  source.indexOf("currentView === 'imageRepo' ?"),
  source.indexOf("currentView === 'thirdList' ?")
);

test('image repository creation receives the available cluster architectures', () => {
  assert.match(imageRepositoryView, /<ImgRepostory[\s\S]*archInfo=\{archInfo\}/);
});
