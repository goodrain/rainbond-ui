const assert = require('assert');
const { buildHistoryLogQuery } = require('./historyLogQuery');

assert.strictEqual(
  buildHistoryLogQuery('gr123456'),
  '{service_alias="gr123456"}',
  'an empty keyword should query every log line for the component'
);

assert.strictEqual(
  buildHistoryLogQuery('gr123456', '  database error  '),
  '{service_alias="gr123456"} |= "database error"',
  'a keyword should be trimmed and added as a literal Loki line filter'
);

assert.strictEqual(
  buildHistoryLogQuery('service"alias\\prod', 'failed "query"\\path\nnext'),
  '{service_alias="service\\"alias\\\\prod"} |= "failed \\"query\\"\\\\path\\nnext"',
  'component aliases and keywords should be escaped before entering LogQL'
);

assert.strictEqual(
  buildHistoryLogQuery('gr123456', '   '),
  '{service_alias="gr123456"}',
  'whitespace-only keywords should not add an empty line filter'
);

console.log('history log query helper tests passed');
