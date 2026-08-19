const ABNORMAL_COMPONENT_STATUSES = ['unusual', 'abnormal'];

function isAbnormalComponentStatus(status) {
  return ABNORMAL_COMPONENT_STATUSES.includes(String(status || '').toLowerCase());
}

function shouldShowComponentAbnormalGuide(options = {}) {
  return (
    options.activeTab === 'overview' &&
    options.agentEnabled === true &&
    options.agentVisible !== true &&
    options.sessionAllows !== false &&
    isAbnormalComponentStatus(options.status)
  );
}

module.exports = {
  ABNORMAL_COMPONENT_STATUSES,
  isAbnormalComponentStatus,
  shouldShowComponentAbnormalGuide,
};
