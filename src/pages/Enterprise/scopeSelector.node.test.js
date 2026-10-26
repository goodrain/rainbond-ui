const assert = require('assert');
const fs = require('fs');
const path = require('path');
const React = require('react');
const esbuild = require('esbuild');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
function method(name, next) {
  const start = source.indexOf(`  ${name}(`);
  const end = source.indexOf(`  ${next}(`, start);
  assert.ok(start > -1 && end > start, `${name} must be available for behavior checks`);
  return source.slice(start, end);
}
const code = esbuild.transformSync(`class ScopeContract {
  ${method('renderScopeSelector', 'renderResourceCard')}
  ${method('componentDidUpdate', 'componentWillUnmount')}
}
module.exports = ScopeContract;`, { loader: 'jsx', format: 'cjs' }).code;
const Select = function Select() {};
const Option = function Option() {};
const Icon = function Icon() {};
const isolated = { exports: {} };
new Function('module', 'React', 'Select', 'Option', 'Icon', 'styles', 't', code)(
  isolated, React, Select, Option, Icon,
  new Proxy({}, { get: (_, key) => key }), value => value
);
const ScopeContract = isolated.exports;
const clusters = Array.from({ length: 6 }, (_, index) => ({
  region_name: `region-${index}`, region_alias: `Cluster ${index}`, status: '1'
}));
function page(list) {
  const instance = new ScopeContract();
  instance.props = { overview: { shell: list === null ? null : { clusters: list } } };
  instance.state = { selectedRegion: '' };
  instance.requests = 0;
  instance.handleClusterChange = () => {};
  instance.loadClusterData = () => { instance.requests += 1; };
  instance.setState = (update, callback) => {
    instance.state = { ...instance.state, ...update };
    if (callback) callback();
  };
  return instance;
}
function walk(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(walk);
  return [element, ...walk(element.props && element.props.children)];
}
[null, [], clusters.slice(0, 1)].forEach(list => {
  const instance = page(list);
  assert.strictEqual(instance.renderScopeSelector(), null, 'no switcher or empty bar for zero/one cluster');
  assert.strictEqual(instance.requests, 0, 'conditional rendering must not request data');
});
const single = page(clusters.slice(0, 1));
single.componentDidUpdate({ overview: { shell: null } });
assert.strictEqual(single.state.selectedRegion, clusters[0].region_name);
assert.strictEqual(single.requests, 1, 'the sole cluster must still load its scoped data automatically');
assert.strictEqual(single.renderScopeSelector(), null);
single.componentDidUpdate(single.props);
assert.strictEqual(single.requests, 1, 'hiding the switcher must not reload the selected cluster');
[2, 6].forEach(count => {
  const instance = page(clusters.slice(0, count));
  instance.state.selectedRegion = clusters[1].region_name;
  const element = walk(instance.renderScopeSelector()).find(node => node.type === Select);
  assert.ok(element, 'multiple clusters must retain the switcher');
  assert.strictEqual(element.props.value, clusters[1].region_name);
  assert.strictEqual(element.props.showSearch, count > 5);
  assert.strictEqual(element.props.onChange, instance.handleClusterChange);
  assert.strictEqual(React.Children.count(element.props.children), count);
  assert.strictEqual(instance.requests, 0);
});
console.log('single-cluster auto-selection and multi-cluster switcher checks passed');
