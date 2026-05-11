const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

assert.ok(
  /<ScrollerX\s+sm=\{`calc\(1100px - var\(--agent-panel-width,\s*0px\)\)`\}>/.test(
    jsSource
  ),
  'enterprise page should reduce its horizontal min width when the agent panel is open'
);

assert.ok(
  /swidth='100%'/.test(jsSource),
  'cluster charts should use percentage width instead of a fixed pixel width'
);

assert.ok(
  /\.content_right\s*\{[\s\S]*?display:\s*flex;[\s\S]*?gap:\s*12px;[\s\S]*?flex-wrap:\s*nowrap;/m.test(
    lessSource
  ),
  'cluster content right area should keep a single row in the reduced viewport'
);

assert.ok(
  /\.content_data\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*23%;/m.test(
    lessSource
  ),
  'cluster chart blocks should participate in percentage-based flex sizing'
);

assert.ok(
  /\.node\s*\{[\s\S]*?flex:\s*0 0 18%;[\s\S]*?min-width:\s*0;/m.test(
    lessSource
  ),
  'node summary blocks should participate in percentage-based flex sizing'
);

assert.ok(
  /\.content_left\s*\{[\s\S]*?width:\s*32%;/m.test(lessSource),
  'cluster left content should shrink to leave more room for the right-side statistics in narrow layouts'
);

assert.ok(
  /\.clusterIcon\s*\{[\s\S]*?width:\s*84px;[\s\S]*?height:\s*120px;/m.test(
    lessSource
  ),
  'cluster icon area should shrink in narrow layouts'
);

assert.ok(
  /\.node\s*\{[\s\S]*?p\s*\{[\s\S]*?font-size:\s*16px;/m.test(lessSource),
  'node headings should use a smaller font size in narrow layouts'
);

console.log('enterprise agent layout tests passed');
