const assert = require('assert');
const {
  getComponentPluginTabName,
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

assert.strictEqual(
  getComponentPluginTabName({ name: 'rainbond-vm', display_name: '虚拟机' }, '监控'),
  '监控',
  'should display the VM component plugin tab as monitoring'
);

assert.strictEqual(
  getComponentPluginTabName({ name: 'rainbond-vm', display_name: 'VM' }, 'Monitor'),
  'Monitor',
  'should use the host locale label for the VM component plugin tab'
);

assert.strictEqual(
  getComponentPluginTabName({ name: 'custom-plugin', display_name: '自定义插件' }),
  '自定义插件',
  'should keep normal component plugin tab names unchanged'
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
