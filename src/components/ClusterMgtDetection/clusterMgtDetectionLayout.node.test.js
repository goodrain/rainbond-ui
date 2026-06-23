const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
const pageSource = fs.readFileSync(
  path.join(__dirname, '../../pages/EnterpriseClusters/ClustersMGT/index.js'),
  'utf8'
);

assert.ok(
  /<ClusterDetection[\s\S]*?titleIcon=\{SVG\.getSvg\("examineSvg", 20\)\}[\s\S]*?titleText=\{formatMessage\(\{ id: 'enterpriseColony\.mgt\.cluster\.rainbondList' \}\)\}/.test(pageSource),
  'Rainbond component list title should be passed into the card component'
);

assert.ok(
  !/<Row className=\{styles\.titleStyle\}>[\s\S]*?enterpriseColony\.mgt\.cluster\.rainbondList[\s\S]*?<\/Row>/.test(pageSource),
  'Rainbond component list title should not be rendered as an external row'
);

assert.ok(
  /className=\{styles\.cardContainer\}/.test(jsSource) &&
    /className=\{styles\.cardHeader\}/.test(jsSource) &&
    /className=\{styles\.cardBody\}/.test(jsSource),
  'Rainbond component list should render with internal card sections'
);

assert.ok(
  /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(lessSource) &&
    /\.cardBody\s*\{[\s\S]*?\.ant-table\s*\{[\s\S]*?border-radius:\s*16px;/m.test(lessSource),
  'Rainbond component list should use the gradient card surface and unified table style'
);

console.log('cluster management Rainbond component list layout tests passed');
