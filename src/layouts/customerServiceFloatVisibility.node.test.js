const assert = require('assert');
const {
  shouldShowCustomerServiceFloat,
} = require('./customerServiceFloatVisibility');

assert.strictEqual(
  shouldShowCustomerServiceFloat({
    pluginsLoaded: false,
    showEnterprisebase: false,
    isSaas: false,
    agentVisible: false,
  }),
  false,
  'customer service float should stay hidden until plugin visibility prerequisites are loaded'
);

assert.strictEqual(
  shouldShowCustomerServiceFloat({
    pluginsLoaded: true,
    showEnterprisebase: true,
    isSaas: false,
    agentVisible: false,
  }),
  false,
  'customer service float should stay hidden for private deployments that install the enterprise base plugin'
);

assert.strictEqual(
  shouldShowCustomerServiceFloat({
    pluginsLoaded: true,
    showEnterprisebase: false,
    isSaas: false,
    agentVisible: true,
  }),
  false,
  'customer service float should hide while AgentHost is expanded'
);

assert.strictEqual(
  shouldShowCustomerServiceFloat({
    pluginsLoaded: true,
    showEnterprisebase: false,
    isSaas: false,
    agentVisible: false,
  }),
  true,
  'customer service float should still render when AgentHost is collapsed and the existing visibility rules allow it'
);

console.log('customer service float visibility helper tests passed');
