const assert = require('assert');
const {
  collectShareServiceData,
  getNodeScalingDisabledTip,
  isNodeScalingDisabled
} = require('./appShareFormHelpers');

const componentRef = {
  props: {
    tab: 'web',
    form: {
      validateFields(callback) {
        callback(null, {
          'extend||min_node||service-1': 2,
          'extend||max_node||service-1': 5,
          'extend||step_node||service-1': 2,
          'extend||init_memory||service-1': 1024,
          'extend||container_cpu||service-1': 500
        });
      }
    }
  }
};

const result = collectShareServiceData({
  shareServiceList: [
    {
      service_id: 'service-1',
      service_alias: 'web',
      service_share_uuid: 'service-1+service-1',
      extend_method_map: {
        min_node: 1,
        max_node: 3,
        step_node: 1,
        init_memory: 512,
        container_cpu: 250
      }
    }
  ],
  selectedShareKeys: ['service-1+service-1'],
  componentRefs: [componentRef]
});

assert.strictEqual(result.componentFormHasError, false);
assert.deepStrictEqual(result.selectedShareServices[0].extend_method_map, {
  min_node: 2,
  max_node: 5,
  step_node: 2,
  init_memory: 1024,
  container_cpu: 500
});

const daemonsetComponentRef = {
  props: {
    tab: 'agent',
    form: {
      validateFields(callback) {
        callback(null, {
          'extend||min_node||service-2': 3,
          'extend||max_node||service-2': 9,
          'extend||step_node||service-2': 3,
          'extend||init_memory||service-2': 2048,
          'extend||container_cpu||service-2': 800
        });
      }
    }
  }
};

const daemonsetResult = collectShareServiceData({
  shareServiceList: [
    {
      service_id: 'service-2',
      service_alias: 'agent',
      service_share_uuid: 'service-2+service-2',
      extend_method: 'daemonset',
      extend_method_map: {
        min_node: 1,
        max_node: 64,
        step_node: 1,
        min_memory: 64,
        init_memory: 512,
        max_memory: 65536,
        step_memory: 64,
        container_cpu: 250
      }
    }
  ],
  selectedShareKeys: ['service-2+service-2'],
  componentRefs: [daemonsetComponentRef]
});

assert.strictEqual(daemonsetResult.componentFormHasError, false);
assert.deepStrictEqual(daemonsetResult.selectedShareServices[0].extend_method_map, {
  min_memory: 64,
  init_memory: 2048,
  max_memory: 65536,
  step_memory: 64,
  container_cpu: 800
});

assert.strictEqual(
  isNodeScalingDisabled({
    extend_method: 'daemonset'
  }),
  true
);
assert.strictEqual(
  isNodeScalingDisabled({
    extend_method: 'stateless_multiple'
  }),
  false
);
assert.strictEqual(
  getNodeScalingDisabledTip({
    extend_method: 'daemonset'
  }, 'min_node'),
  'DaemonSet 类型资源不能设置节点步长'
);
assert.strictEqual(
  getNodeScalingDisabledTip({
    extend_method: 'daemonset'
  }, 'max_node'),
  'DaemonSet 类型资源不能设置节点步长'
);
assert.strictEqual(
  getNodeScalingDisabledTip({
    extend_method: 'daemonset'
  }, 'step_node'),
  'DaemonSet 类型资源不能设置节点步长'
);
assert.strictEqual(
  getNodeScalingDisabledTip({
    extend_method: 'stateless_multiple'
  }, 'min_node'),
  ''
);
assert.strictEqual(
  getNodeScalingDisabledTip({
    extend_method: 'daemonset'
  }, 'init_memory'),
  ''
);
