const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

assert.ok(
  /const overviewItems = \[[\s\S]*?key: 'app'[\s\S]*?action: '创建'[\s\S]*?object: '应用'[\s\S]*?key: 'service'[\s\S]*?object: '组件'[\s\S]*?key: 'cpu'[\s\S]*?object: 'CPU'[\s\S]*?key: 'memory'[\s\S]*?object: '内存'[\s\S]*?key: 'storage'[\s\S]*?\];/.test(jsSource),
  'team overview should render the five action-value-object summary cards'
);

assert.ok(
  /\.basicInfoRow\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\);/m.test(lessSource),
  'team overview cards should stay in a five-column grid on wide screens'
);

assert.ok(
  /\.basicInfo\s*\{[\s\S]*?border-radius:\s*22px;[\s\S]*?background-image:\s*radial-gradient/m.test(lessSource),
  'team overview cards should use the unified gradient card surface'
);

assert.ok(
  /<div className=\{styles\.basicInfoTitle\}>\{item\.action\}<\/div>/.test(jsSource) &&
    /<div className=\{styles\.basicInfoContent\}>[\s\S]*?\{item\.unit && <span>\{item\.unit\}<\/span>\}[\s\S]*?<div className=\{styles\.basicInfoDesc\}>\{item\.object\}<\/div>/.test(jsSource),
  'team overview cards should render action, value with unit, and object text'
);

assert.ok(
  /\.basicInfoTitle\s*\{[\s\S]*?color:\s*@text-color-secondary;/m.test(lessSource) &&
    /\.basicInfoContent\s*\{[\s\S]*?color:\s*@primary-color;[\s\S]*?font-size:\s*@rbd-display-size;[\s\S]*?span\s*\{[\s\S]*?font-size:\s*@rbd-auxiliary-size;/m.test(lessSource) &&
    /\.basicInfoDesc\s*\{[\s\S]*?font-size:\s*@rbd-content-size;/m.test(lessSource),
  'team overview cards should emphasize values with primary display text'
);

console.log('team event list overview card tests passed');
