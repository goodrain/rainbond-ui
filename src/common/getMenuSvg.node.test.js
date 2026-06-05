const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'getMenuSvg.js'), 'utf8');

assert.ok(
  /aiEngine:\s*\([\s\S]*?<svg t="1780628224361"[\s\S]*?p-id="5323"/m.test(source),
  'getMenuSvg should expose the AI model sidebar icon'
);

const aiEngineBlock = source.match(/aiEngine:\s*\([\s\S]*?\n\s*\),\n\s*bill:/m);

assert.ok(aiEngineBlock && !/fill=/.test(aiEngineBlock[0]), 'AI model icon should not hardcode fill color');

console.log('menu svg tests passed');
