const TERMINAL_STATUSES = ['done', 'error', 'waiting_approval', 'cancelled'];
const STREAM_BATCHABLE_EVENT_TYPES = {
  'chat.message.delta': true,
  'chat.message.reasoning.delta': true,
};

function isBatchableStreamEvent(event) {
  return !!(event && STREAM_BATCHABLE_EVENT_TYPES[event.type]);
}

function buildBatchableEventKey(event) {
  const data = (event && event.data) || {};
  return [
    event.type || '',
    event.tenantId || '',
    event.sessionId || '',
    event.runId || '',
    data.message_id || '',
  ].join('|');
}

function cloneBatchableEvent(event) {
  return {
    ...event,
    data: {
      ...((event && event.data) || {}),
    },
  };
}

function createStreamEventDispatcher(onEvent, options = {}) {
  if (!onEvent) {
    return {
      dispatch() {},
      async flush() {},
    };
  }

  const batchWindowMs = Math.max(0, Number(options.eventBatchWindowMs || 16));
  let bufferedEvents = [];
  let flushTimer = null;

  function emitBufferedEvents() {
    if (!bufferedEvents.length) {
      return;
    }

    const eventsToEmit = bufferedEvents;
    bufferedEvents = [];

    eventsToEmit.forEach(event => {
      onEvent(event);
    });
  }

  function cancelScheduledFlush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }

  function flushBufferedEvents() {
    cancelScheduledFlush();
    emitBufferedEvents();
  }

  function scheduleFlush() {
    if (flushTimer || batchWindowMs <= 0) {
      return;
    }

    flushTimer = setTimeout(() => {
      flushTimer = null;
      emitBufferedEvents();
    }, batchWindowMs);
  }

  return {
    dispatch(event) {
      if (!isBatchableStreamEvent(event)) {
        flushBufferedEvents();
        onEvent(event);
        return;
      }

      const nextEvent = cloneBatchableEvent(event);
      const nextKey = buildBatchableEventKey(nextEvent);
      const lastBufferedEvent = bufferedEvents[bufferedEvents.length - 1];

      if (
        lastBufferedEvent &&
        buildBatchableEventKey(lastBufferedEvent) === nextKey
      ) {
        lastBufferedEvent.data.delta = `${lastBufferedEvent.data.delta || ''}${nextEvent.data.delta || ''}`;
        lastBufferedEvent.sequence = nextEvent.sequence || lastBufferedEvent.sequence;
        lastBufferedEvent.timestamp = nextEvent.timestamp || lastBufferedEvent.timestamp;
      } else {
        bufferedEvents.push(nextEvent);
      }

      if (batchWindowMs <= 0) {
        flushBufferedEvents();
      } else {
        scheduleFlush();
      }
    },

    async flush() {
      flushBufferedEvents();
    },
  };
}

async function readSseEvents(response, options = {}) {
  const { onEvent, skipFirstWaitingApproval } = options;
  let waitingApprovalSeen = false;
  let approvalResolvedSeen = false;
  const eventDispatcher = createStreamEventDispatcher(onEvent, options);

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
          // 单条 SSE 数据损坏 / 被中途截断时只跳过这一条，不能让 JSON.parse
          // 抛错冲垮整条流——否则上层会把它当成"消息发送失败"，丢掉已经收到的内容。
          let parsed = null;
          try {
            parsed = JSON.parse(dataLine.slice(6));
          } catch (parseError) {
            parsed = null;
            if (typeof console !== 'undefined' && console.warn) {
              // 只记错误本身、不打印 dataLine 原文——它可能含会话内容，且对定位无必要。
              // eslint-disable-next-line no-console
              console.warn('[RainAgent] 跳过一条无法解析的 SSE 事件:', parseError.message);
            }
          }

          if (parsed) {
            events.push(parsed);
            eventDispatcher.dispatch(parsed);

            if (parsed.type === 'approval.resolved') {
              approvalResolvedSeen = true;
            }

            if (
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

            if (parsed.type === 'run.error') {
              shouldStop = true;
              break;
            }
          }
        }

        boundaryIndex = buffer.indexOf('\n\n');
      }
    }
  } finally {
    await eventDispatcher.flush();
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
