const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');

function getCssBlock(selector, options = {}) {
  const selectorIndex = options.last
    ? lessSource.lastIndexOf(selector)
    : lessSource.indexOf(selector);
  assert.ok(selectorIndex >= 0, `${selector} should exist`);

  const blockStart = lessSource.indexOf('{', selectorIndex);
  assert.ok(blockStart >= 0, `${selector} should have a declaration block`);

  let depth = 0;
  for (let index = blockStart; index < lessSource.length; index += 1) {
    if (lessSource[index] === '{') {
      depth += 1;
    }
    if (lessSource[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return lessSource.slice(blockStart + 1, index);
      }
    }
  }

  throw new Error(`${selector} block should close`);
}

const tabsContainerBlock = getCssBlock('.ant-tabs-nav-container {', {
  last: true
});
const tabsScrollingContainerBlock = getCssBlock(
  '.ant-tabs-nav-container-scrolling {'
);

assert.ok(
  /<ScrollerX\s+sm=\{`calc\(1200px - var\(--agent-panel-width,\s*0px\)\)`\}>/.test(
    jsSource
  ),
  'enterprise shared page should reduce its horizontal min width when the agent panel is open'
);

assert.ok(
  /\.serBox\s*\{[\s\S]*?flex:\s*1 1 auto;[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*auto;/m.test(
    lessSource
  ),
  'local store filter box should shrink with the available width instead of keeping a fixed width'
);

assert.ok(
  /\.toolbarRow\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*wrap;/m.test(
    lessSource
  ),
  'shared market toolbars should wrap cleanly in narrow layouts'
);

assert.ok(
  /\.toolbarRight\s*\{[\s\S]*?display:\s*flex;[\s\S]*?justify-content:\s*flex-end;/m.test(
    lessSource
  ),
  'toolbar action groups should live in an independent right-aligned flex container'
);

assert.ok(
  /const operation = \(\s*<div style=\{rightStyle\} className=\{\`\$\{styles\.btns\} \$\{styles\.toolbarRight\}\`\}>/.test(
    jsSource
  ),
  'local store actions should also use the shared right-aligned toolbar container'
);

assert.ok(
  /\.toolbarSearchPrimary\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*250px;/m.test(
    lessSource
  ),
  'primary search input should use a constrained responsive width'
);

assert.ok(
  /\.toolbarSearchWide\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*400px;/m.test(
    lessSource
  ),
  'secondary search input should use a constrained responsive width'
);

assert.ok(
  /overflow:\s*hidden\s*!important;[\s\S]*?overflow-y:\s*hidden\s*!important;/m.test(
    tabsContainerBlock
  ),
  'tabs header should not allow horizontal scrolling before tabs overflow'
);

assert.ok(
  !/overflow-x:\s*auto\s*!important;/.test(tabsContainerBlock),
  'tabs header should not force horizontal scrolling on the base tabs container'
);

assert.ok(
  /overflow-x:\s*auto\s*!important;[\s\S]*?scrollbar-width:\s*none;[\s\S]*?-ms-overflow-style:\s*none;/m.test(
    tabsScrollingContainerBlock
  ),
  'tabs header should support hidden horizontal scrolling only after tabs overflow'
);

assert.ok(
  /\.setTabs[\s\S]*?\.ant-tabs-nav-container-scrolling::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/m.test(
    lessSource
  ),
  'overflowing tabs header should hide the native scrollbar in WebKit browsers'
);

assert.ok(
  /\.setTabs[\s\S]*?\.ant-tabs-nav-container\s*\{[\s\S]*?scrollbar-width:\s*none;[\s\S]*?-ms-overflow-style:\s*none;/m.test(
    lessSource
  ) &&
    /\.setTabs[\s\S]*?\.ant-tabs-nav-container::\-webkit-scrollbar\s*\{[\s\S]*?height:\s*0;[\s\S]*?display:\s*none;/m.test(
      lessSource
    ),
  'tabs header should hide the horizontal scrollbar while preserving scroll'
);

console.log('enterprise shared agent layout tests passed');
