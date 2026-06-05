const assert = require('assert');
const fs = require('fs');
const path = require('path');

const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

assert.ok(
  /\.menuContent\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?overflow-x:\s*hidden;[\s\S]*?scrollbar-width:\s*none;[\s\S]*?-ms-overflow-style:\s*none;/m.test(
    lessSource
  ),
  'GlobalRouter sidebar should keep y-axis scrolling while hiding scrollbars in Firefox and IE/Edge'
);

assert.ok(
  /\.menuContent\s*\{[\s\S]*?&::\-webkit-scrollbar\s*\{[\s\S]*?width:\s*0;[\s\S]*?height:\s*0;[\s\S]*?display:\s*none;/m.test(
    lessSource
  ),
  'GlobalRouter sidebar should hide scrollbars in WebKit-based browsers, including Windows Chrome and Edge'
);

console.log('global router scrollbar tests passed');
