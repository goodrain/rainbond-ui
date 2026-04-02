function buildTeamMenuEnterpriseSettings(enterprise, currentEnterprise) {
  return Object.assign({}, currentEnterprise || {}, enterprise || {});
}

module.exports = {
  buildTeamMenuEnterpriseSettings,
};
