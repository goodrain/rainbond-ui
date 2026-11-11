const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const parser = require('@babel/parser');

async function verifyUpgradeRecordErrorContract() {
  const sourceRoot = path.resolve(__dirname, '../../..');
  const serviceSource = fs.readFileSync(path.join(sourceRoot, 'services/api.js'), 'utf8');
  const serviceAST = parser.parse(serviceSource, { sourceType: 'module', plugins: ['jsx'] });
  const declaration = serviceAST.program.body.find(node =>
    node.type === 'ExportNamedDeclaration' && node.declaration &&
    node.declaration.id && node.declaration.id.name === 'getUpdateRecordsInfo'
  ).declaration;
  const readRecord = vm.runInNewContext(`(${serviceSource.slice(declaration.start, declaration.end)})`, {
    apiconfig: { baseUrl: '' },
    request: (url, options) => Promise.resolve({ url, options })
  });
  const modelSource = fs.readFileSync(path.join(sourceRoot, 'models/global.js'), 'utf8');
  const modelAST = parser.parse(modelSource, { sourceType: 'module', plugins: ['jsx'] });
  const model = modelAST.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = model.properties.find(node => node.key.name === 'effects').value;
  const method = effects.properties.find(node => node.key.name === 'CloudAppUpdateRecordsInfo');
  const effect = vm.runInNewContext(`({${modelSource.slice(method.start, method.end)}})`, {
    getUpdateRecordsInfo: readRecord
  }).CloudAppUpdateRecordsInfo;
  const payload = { team_name: 'team', group_id: 1, record_id: 87 };
  const handleError = () => {};
  const iterator = effect({ payload, handleError }, { call: (fn, ...args) => ({ fn, args }) });
  const request = iterator.next().value;
  const response = await request.fn(...request.args);
  assert.strictEqual(response.url, '/console/teams/team/groups/1/upgrade-records/87');
  assert.strictEqual(response.options.method, 'get');
  assert.strictEqual(response.options.params.record_id, 87);
  assert.strictEqual(response.options.handleError, handleError, 'query errors must reach the page through DVA and the service');
}

verifyUpgradeRecordErrorContract().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
