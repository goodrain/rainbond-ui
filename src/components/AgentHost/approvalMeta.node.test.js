const assert = require('assert');
const { getApprovalRiskMeta, getApprovalScopeMeta } = require('./approvalMeta');

const enterpriseScope = getApprovalScopeMeta('enterprise');
assert.strictEqual(enterpriseScope.label, '企业级');
assert.strictEqual(enterpriseScope.color, 'purple');

const dangerRisk = getApprovalRiskMeta('high');
assert.strictEqual(dangerRisk.label, '危险');
assert.strictEqual(dangerRisk.color, 'red');
assert.strictEqual(dangerRisk.cardClass, 'approvalCardDanger');

const customLabels = {
  scope: getApprovalScopeMeta('app', '应用级'),
  risk: getApprovalRiskMeta('medium', '警告')
};
assert.strictEqual(customLabels.scope.label, '应用级');
assert.strictEqual(customLabels.risk.label, '警告');

console.log('agent host approval meta tests passed');
