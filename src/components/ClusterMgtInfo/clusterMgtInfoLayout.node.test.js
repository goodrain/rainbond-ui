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
  !/enterpriseColony\.mgt\.cluster\.clusterInfo[\s\S]*<DetectionInfo/.test(pageSource),
  'cluster information title should be rendered inside the card, not above DetectionInfo'
);

assert.ok(
  /className=\{styles\.clusterInfoCard\}/.test(jsSource) &&
    /\.clusterInfoCard\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(lessSource),
  'cluster information card should use the gradient card surface'
);

assert.ok(
  /className=\{styles\.clusterCardTitle\}/.test(jsSource) &&
    /className=\{styles\.clusterCardHeader\}/.test(jsSource),
  'cluster icon title and cluster summary should be inside the card header'
);

assert.ok(
  /className=\{styles\.clusterIconBox\}/.test(jsSource) &&
    /className=\{styles\.clusterName\}/.test(jsSource) &&
    /className=\{styles\.clusterStatus\}/.test(jsSource),
  'cluster header should combine icon, name, and status'
);

assert.ok(
  /className=\{styles\.clusterActions\}/.test(jsSource),
  'cluster operations should be rendered on the right side of the header'
);

assert.ok(
  /\.clusterInfoGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/m.test(lessSource) &&
    /\.clusterInfoValue\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/m.test(lessSource),
  'cluster card details should render three per row with ellipsis overflow'
);

console.log('cluster management information layout tests passed');
