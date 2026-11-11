function shouldPollUpgradeRecord(record = {}) {
  const status = Number(record.status);
  return [2, 4].includes(status) ||
    ([3, 5].includes(status) && !!record.runtime_state && record.runtime_state.status === 'pending');
}

function getRuntimePresentation(record = {}) {
  const runtime = record.runtime_state || {};
  const status = ['ready', 'pending', 'abnormal'].includes(runtime.status) ? runtime.status : 'unknown';
  const operated = new Set((record.service_record || []).filter(item => item.event_id).map(item => item.service_id));
  const components = (runtime.components || []).filter(item =>
    item.status !== 'running' && (item.status !== 'closed' || operated.has(item.service_id))
  );
  return {
    status,
    type: { ready: 'success', pending: 'info', abnormal: 'error', unknown: 'warning' }[status],
    components
  };
}

module.exports = { shouldPollUpgradeRecord, getRuntimePresentation };
