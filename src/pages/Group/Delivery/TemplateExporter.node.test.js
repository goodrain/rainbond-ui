const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
function exporter() {
  const source = fs.readFileSync(`${__dirname}/TemplateExporter.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => ['start', 'statuses'].includes(node.key && node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, {
    formatKeys: { 'rainbond-app': 'rainbond_app', 'docker-compose': 'docker_compose', 'helm-chart': 'helm_chart', slug: 'slug' }
  });
  const target = new Target(), requests = [];
  target.props = { scope: { teamName: 'team', regionName: 'region' }, template: { id: 'version-1' }, user: { user_id: 1 }, dispatch: request => requests.push(request) };
  target.state = { busy: false, formats: ['rainbond-app', 'docker-compose', 'helm-chart'], items: [] };
  target.alive = true;target.requestKeys = {};target.refresh = () => {};
  target.setState = (update, callback) => { Object.assign(target.state, update);if (callback) callback(); };
  return { target, requests };
}
test('export formats preserve independent progress and download references', () => {
  const { target } = exporter();
  target.state.items = [
    { export_format: 'docker-compose', status: 'succeeded', download_url: '/console/delivery-tasks/compose/download' },
    { export_format: 'rainbond-app', status: 'running' },
    { export_format: 'docker-compose', status: 'failed' }
  ];
  const statuses = target.statuses();
  assert.equal(statuses.docker_compose.status, 'success');
  assert.equal(statuses.docker_compose.file_path, '/console/delivery-tasks/compose/download');
  assert.equal(statuses.rainbond_app.status, 'exporting');
  assert.equal(statuses.helm_chart.is_export_before, false);
  assert.equal(statuses.slug, undefined);
});
test('export requests carry the selected format and reuse their request key after an uncertain failure', () => {
  const { target, requests } = exporter();
  target.start('docker-compose');target.start('docker-compose');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.format, 'docker-compose');
  assert.equal(requests[0].payload.kind, 'offline');
  const key = requests[0].payload.requestKey;
  requests[0].onError();target.start('docker-compose');
  assert.equal(requests[1].payload.requestKey, key);
  requests[1].callback();target.start('helm-chart');
  assert.notEqual(requests[2].payload.requestKey, key);
  assert.equal(requests[2].payload.image_handle, 'image_save');
});
