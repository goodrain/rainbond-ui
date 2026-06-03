const assert = require('assert');
const { collectShareServiceData } = require('./appShareFormHelpers');

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
