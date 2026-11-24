function safeOperationMessage(value) {
  return String(value || '')
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\b(password|passwd|token|api[_-]?key|secret|signature|authorization)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1=[redacted]')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .slice(0, 1024);
}

function getUpgradeEventResult(event) {
  if (!event) return null;
  if (event.final_status === 'timeout' || event.status === 'timeout') return 'unconfirmed';
  if (event.final_status === 'complete') {
    if (event.status === 'success') return 'success';
    if (event.status === 'failure' || event.status === 'abnormal') return 'failure';
    return 'unconfirmed';
  }
  if (event.final_status === 'failure') return 'failure';
  return null;
}

// Use the returned task ID. Running status, HTTP 200, and other events cannot
// establish whether this particular update has completed.
async function observeComponentUpgrade({ eventID, readEvents, readErrorLogs, isCurrent,
  wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  now = Date.now, timeout = 120000 }) {
  if (!eventID) return { status: 'unconfirmed' };
  const started = now();
  let failures = 0;
  while (isCurrent() && now() - started < timeout) {
    try {
      const response = await readEvents();
      if (!isCurrent()) return null;
      if (!response || !Array.isArray(response.list)) throw new Error('Event status unavailable');
      failures = 0;
      const event = response.list.find(item => item.event_id === eventID);
      const status = getUpgradeEventResult(event);
      if (status) {
        let message = event.message || '';
        if (status === 'failure' && readErrorLogs) {
          try {
            const logs = await readErrorLogs();
            // The worker writes the concrete cause before its generic callback.
            const detail = logs && Array.isArray(logs.list) && logs.list.find(item =>
              item && typeof item.message === 'string' && /failure:|failure |失败[:：]/i.test(item.message));
            if (detail) message = detail.message;
          } catch (_) { /* The terminal event still proves the failure. */ }
        }
        return isCurrent() ? { status, message: safeOperationMessage(message) } : null;
      }
    } catch (_) {
      failures += 1;
      if (failures >= 3) return { status: 'unconfirmed' };
    }
    await wait(2000);
  }
  return isCurrent() ? { status: 'unconfirmed' } : null;
}

function showComponentUpgradeFeedback({ dispatch, payload, response, isCurrent, notification, formatMessage }) {
  if (!isCurrent()) return;
  notification.info({ message: formatMessage({ id: 'notification.upgrade.submitted' }) });
  dispatch({
    type: 'appControl/watchUpgrade',
    payload: { ...payload, event_id: response && response.bean && response.bean.event_id },
    isCurrent,
    callback: result => {
      if (!isCurrent() || !result) return;
      const message = formatMessage({ id: `notification.upgrade.${result.status}` });
      if (result.status === 'success') notification.success({ message });
      else if (result.status === 'failure') notification.error({ message, description: safeOperationMessage(result.message) });
      else notification.warning({ message });
    }
  });
}

module.exports = { safeOperationMessage, getUpgradeEventResult, observeComponentUpgrade, showComponentUpgradeFeedback };
