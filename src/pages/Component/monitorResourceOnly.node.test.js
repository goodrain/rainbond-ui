const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'monitor.js'), 'utf8');

assert.ok(
  /import ResourceShow from '\.\/component\/monitor\/resourceshow';/.test(source),
  'component monitor should keep resource monitoring'
);

assert.ok(
  !/TraceShow|component\/monitor\/trace|enableTrace|getMonitorTabs|showMenu|changeMenu|key: 'trace'/.test(source),
  'component monitor should not keep link tracing logic'
);

assert.ok(
  !/import \{ Menu/.test(source) && !/<Menu[\s>]/.test(source),
  'component monitor should not render the resource/trace tab menu'
);

assert.ok(
  /<Row>\s*<ResourceShow \/>\s*<\/Row>/m.test(source),
  'component monitor should render resource monitoring directly'
);

console.log('component monitor resource-only tests passed');
