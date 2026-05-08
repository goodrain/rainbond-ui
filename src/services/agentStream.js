const TERMINAL_STATUSES = ['done', 'error', 'waiting_approval', 'cancelled'];

async function readSseEvents(response, options = {}) {
  const { onEvent, skipFirstWaitingApproval } = options;
  let waitingApprovalSeen = false;
  let approvalResolvedSeen = false;

  if (!response.ok) {
    let errorMessage = response.statusText || '流式请求失败';
    try {
      const data = await response.json();
      errorMessage =
        (data &&
          data.error &&
          (data.error.message || data.error.msg_show || data.error.code)) ||
        errorMessage;
    } catch (error) {
      // ignore json parse errors for non-json SSE failures
    }
    throw new Error(errorMessage);
  }

  const reader = response.body && response.body.getReader ? response.body.getReader() : null;

  if (!reader) {
    return [];
  }

  const decoder = new TextDecoder();
  const events = [];
  let buffer = '';
  let shouldStop = false;

  try {
    while (!shouldStop) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true }).replace(/\r/g, '');

      let boundaryIndex = buffer.indexOf('\n\n');
      while (boundaryIndex >= 0) {
        const rawEvent = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        const dataLine = rawEvent
          .split('\n')
          .find(line => line.indexOf('data: ') === 0);

        if (dataLine) {
          const parsed = JSON.parse(dataLine.slice(6));
          events.push(parsed);
          if (onEvent) {
            onEvent(parsed);
          }

          if (parsed && parsed.type === 'approval.resolved') {
            approvalResolvedSeen = true;
          }

          if (
            parsed &&
            parsed.type === 'run.status' &&
            parsed.data &&
            TERMINAL_STATUSES.indexOf(parsed.data.status) > -1
          ) {
            if (
              parsed.data.status === 'waiting_approval' &&
              skipFirstWaitingApproval &&
              !waitingApprovalSeen &&
              !approvalResolvedSeen
            ) {
              waitingApprovalSeen = true;
              // leftover replay from prior approval — keep reading
            } else {
              shouldStop = true;
              break;
            }
          }

          if (parsed && parsed.type === 'run.error') {
            shouldStop = true;
            break;
          }
        }

        boundaryIndex = buffer.indexOf('\n\n');
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch (error) {
      // ignore close errors
    }
  }

  return events;
}

async function subscribeToRunEvents(options = {}) {
  const {
    url,
    fetchImpl,
    headers = {},
    signal,
    onEvent,
    afterSequence = 0,
  } = options;

  if (!url) {
    throw new Error('url is required');
  }

  const fetchFn =
    fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fetchFn) {
    throw new Error('fetch is not available');
  }

  const query = afterSequence > 0 ? `?after_sequence=${afterSequence}` : '';
  const response = await fetchFn(url + query, {
    method: 'GET',
    credentials: 'include',
    headers: { ...headers, Accept: 'text/event-stream' },
    signal,
  });

  return readSseEvents(response, { onEvent });
}

module.exports = {
  TERMINAL_STATUSES,
  readSseEvents,
  subscribeToRunEvents,
};
