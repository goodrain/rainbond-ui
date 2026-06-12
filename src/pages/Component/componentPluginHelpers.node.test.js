const assert = require('assert');
const {
  getComponentPluginTabName,
  getVisibleComponentPlugins,
  hasHTTPPort,
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

assert.strictEqual(
  getComponentPluginTabName(
    { name: 'rainbond-gateway-monitoring', display_name: '网关监控' },
    '监控',
    '组件流量'
  ),
  '组件流量',
  'should display the gateway monitoring component plugin tab as component traffic'
);

assert.strictEqual(
  getComponentPluginTabName(
    { name: 'rainbond-gateway-monitoring-AMD64', display_name: 'Gateway Monitoring' },
    'Monitor',
    'Component Traffic'
  ),
  'Component Traffic',
  'should match the gateway monitoring component plugin tab by base plugin id'
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

assert.strictEqual(
  hasHTTPPort([{ protocol: 'tcp' }, { protocol: 'udp' }]),
  false,
  'should not treat tcp or udp ports as http ports'
);

assert.strictEqual(
  hasHTTPPort([{ protocol: 'tcp' }, { protocol: 'http' }]),
  true,
  'should detect http ports'
);

assert.strictEqual(
  shouldShowComponentPluginTab(
    { name: 'rainbond-gateway-monitoring' },
    { service: { extend_method: 'stateless_multiple' } },
    [{ protocol: 'tcp' }]
  ),
  false,
  'should hide gateway monitoring component tab when the component has no http port'
);

assert.strictEqual(
  shouldShowComponentPluginTab(
    { name: 'rainbond-gateway-monitoring-AMD64' },
    { service: { extend_method: 'stateless_multiple' } },
    [{ protocol: 'https' }]
  ),
  true,
  'should show gateway monitoring component tab when the component has an http port'
);

console.log('component plugin helper tests passed');
