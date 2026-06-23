const assert = require('assert');
const fs = require('fs');
const path = require('path');

const nodeInfoJs = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtInfo/index.js'),
  'utf8'
);
const nodeInfoLess = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtInfo/index.less'),
  'utf8'
);
const nodeUseJs = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtUse/index.js'),
  'utf8'
);
const nodeUseLess = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtUse/index.less'),
  'utf8'
);
const nodeLabelLess = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtLabel/index.less'),
  'utf8'
);
const nodeStainLess = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtStain/index.less'),
  'utf8'
);
const nodeStainJs = fs.readFileSync(
  path.join(__dirname, '../../../components/NodeMgtStain/index.js'),
  'utf8'
);
const pageSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.ok(
  /<NodeInfo[\s\S]*?titleIcon=\{SVG\.getSvg\("infoSvg", 20\)\}[\s\S]*?titleText=\{formatMessage\(\{ id: 'enterpriseColony\.mgt\.node\.nodeDetails' \}\)\}/.test(pageSource),
  'node detail title should be passed into the card component'
);

assert.ok(
  /className=\{styles\.infoHeader\}/.test(nodeInfoJs) &&
    /className=\{styles\.nodeInfoGrid\}/.test(nodeInfoJs) &&
    /\.nodeInfoGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/m.test(nodeInfoLess),
  'node detail card should combine node header and three-column detail grid'
);

assert.ok(
  /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(nodeInfoLess) &&
    /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(nodeUseLess) &&
    /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient\(circle at top right,/m.test(nodeLabelLess) &&
    /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(nodeStainLess),
  'node management cards should share the gradient card surface'
);

assert.ok(
  /chartType="progressGauge"/.test(nodeUseJs) &&
    /\.nodeMetrics\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/m.test(nodeUseLess) &&
    /\.nodeGaugeFloat\s*\{[\s\S]*?position:\s*absolute;/m.test(nodeUseLess),
  'node resource usage should use the unified metric grid with floating gauges'
);

assert.ok(
  /\.labelStyle\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/m.test(nodeLabelLess) &&
    /\.taintsPanel\s*\{[\s\S]*?border-radius:\s*16px;/m.test(nodeStainLess),
  'node labels and taints should use the unified inner content style'
);

assert.ok(
  /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient\(circle at top right,[\s\S]*?fade\(@primary-color, 8%\) 0%[\s\S]*?fade\(@primary-color, 4%\) 42%[\s\S]*?transparent 78%/m.test(nodeLabelLess),
  'node label card gradient should match the unified top-right radial card background'
);

assert.ok(
  /className=\{styles\.taintsPanel\}[\s\S]*?className=\{styles\.taintsScroll\}[\s\S]*?className=\{styles\.taintsForm\}/.test(nodeStainJs) &&
  /className=\{styles\.taintsForm\}/.test(nodeStainJs) &&
    /\.taintsScroll\s*\{[\s\S]*?max-height:\s*360px;[\s\S]*?overflow-y:\s*auto;/m.test(nodeStainLess),
  'node taints list should cap height and scroll when content overflows'
);

console.log('node management layout tests passed');
