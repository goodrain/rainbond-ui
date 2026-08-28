const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const source = fs.readFileSync(path.join(__dirname, 'manage.js'), 'utf8');
const ast = parser.parse(source, {
  sourceType: 'module',
  plugins: [
    'classProperties',
    'decorators-legacy',
    'dynamicImport',
    'jsx',
    'objectRestSpread'
  ]
});

function findStorageCard(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (
    node.type === 'JSXElement' &&
    node.openingElement &&
    node.openingElement.name &&
    node.openingElement.name.name === 'Card'
  ) {
    const cardSource = source.slice(node.start, node.end);
    if (
      cardSource.includes('dataSource={storgeListData}') &&
      cardSource.includes('onClick={this.showAddStorgeConfig}')
    ) {
      return node;
    }
  }

  const values = Array.isArray(node) ? node : Object.values(node);
  for (const value of values) {
    const match = findStorageCard(value);
    if (match) {
      return match;
    }
  }
  return null;
}

assert.ok(
  findStorageCard(ast),
  'plugin management should render the configuration file and shared storage card'
);

assert.ok(
  source.includes('partitionPluginVersionConfig(data && data.list)') &&
    source.includes('buildStorageSavePayload({') &&
    source.includes('buildStorageDeletePayload({') &&
    source.includes('toStorageEditorData(data)'),
  'plugin management should use the tested storage transformations for read, save, edit, and delete'
);

console.log('plugin management storage layout tests passed');
