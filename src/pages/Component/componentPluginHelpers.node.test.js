const assert = require('assert');
const {
  getVisibleComponentPlugins,
  shouldShowComponentPluginTab
} = require('./componentPluginHelpers');

assert.strictEqual(
  shouldShowComponentPluginTab(
    { name: 'rainbond-vm' },
    { service: { extend_method: 'stateless_multiple' } }
  ),
  false,
  'should hide the virtual machine plugin tab for non-vm components'
);

assert.strictEqual(
  shouldShowComponentPluginTab(
    { name: 'rainbond-vm' },
    { service: { extend_method: 'vm' } }
  ),
  true,
  'should keep the virtual machine plugin tab for vm components'
);

assert.deepStrictEqual(
  getVisibleComponentPlugins(
    [
      { name: 'rainbond-vm' },
      { name: 'rainbond-sourcescan' },
      { name: 'custom-plugin' }
    ],
    {
      service: {
        extend_method: 'stateless_multiple',
        service_source: 'image'
      }
    }
  ).map(item => item.name),
  ['custom-plugin'],
  'should keep only generic component plugins when the component is neither a vm nor a source-code service'
);

assert.deepStrictEqual(
  getVisibleComponentPlugins(
    [
      { name: 'rainbond-vm' },
      { name: 'rainbond-sourcescan' },
      { name: 'custom-plugin' }
    ],
    {
      service: {
        extend_method: 'vm',
        service_source: 'source_code'
      }
    }
  ).map(item => item.name),
  ['rainbond-vm', 'rainbond-sourcescan', 'custom-plugin'],
  'should preserve plugin tabs that match the current component capabilities'
);

console.log('component plugin helper tests passed');
