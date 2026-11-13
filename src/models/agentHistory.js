const { applyTraceEvent } = require('./agentTraceHelpers.node');

/** Older agents provide model messages only; pair each result with its issuing call. */
function chatMessagesToBubbles(chatMessages, createMessage) {
  if (!Array.isArray(chatMessages)) return [];
  const bubbles = [];
  const tools = new Map();
  let exchange = 0;
  chatMessages.forEach((msg, index) => {
    if (!msg || !msg.role) return;
    const extra = {
      ...(msg.created_at ? { createdAt: msg.created_at } : {}),
      historyIncomplete: true
    };
    if (msg.role === 'assistant' && msg.runtime_progress === true) {
      bubbles.push(createMessage('assistant', 'progress', msg.content || '', {}, {
        ...extra, id: `progress:${msg.progress_id || msg.message_id}`, progressId: msg.progress_id || msg.message_id,
        streamRunId: msg.run_id || '', messageKind: 'progress', isFinalAnswer: false,
        progressAfterMessageId: msg.after_message_id || '', progressAfterToolCallId: msg.after_tool_call_id || '',
      }));
      return;
    }
    if (msg.role === 'user') {
      exchange += 1;
      if (typeof msg.content === 'string' && msg.content.trim())
        bubbles.push(createMessage('user', 'normal', msg.content, {}, extra));
    } else if (msg.role === 'assistant') {
      const text = typeof msg.content === 'string' ? msg.content.trim() : '';
      if (
        text ||
        msg.reasoning_content ||
        (msg.tool_calls && msg.tool_calls.length)
      )
        bubbles.push(
          createMessage(
            'assistant',
            'normal',
            text,
            {},
            {
              ...extra,
              reasoning: msg.reasoning_content || '',
              ...(msg.message_kind ? { messageKind: msg.message_kind } : {}),
              streamMessageId: msg.message_id || `legacy:${exchange}:${index}`
            }
          )
        );
      (Array.isArray(msg.tool_calls) ? msg.tool_calls : []).forEach(
        (call, callIndex) => {
          const fn = (call && call.function) || {};
          const id = call.id || `legacy:${exchange}:${index}:${callIndex}`;
          const scoped = `${exchange}:${id}`;
          tools.set(scoped, {
            id: scoped,
            name: fn.name || 'tool',
            input: fn.arguments
          });
          applyTraceEvent(
            bubbles,
            {
              data: {
                phase: 'start',
                tool_call_id: scoped,
                tool_name: fn.name || 'tool',
                input: fn.arguments
              }
            },
            {},
            0,
            (role, kind, content, context, traceExtra) =>
              createMessage(role, kind, content, context, {
                ...extra,
                ...traceExtra
              })
          );
          const issued = bubbles.find(item => item.trace && item.trace.toolCallId === scoped);
          if (issued) issued.trace.sourceToolCallId = id;
        }
      );
    } else if (msg.role === 'tool') {
      const call = tools.get(`${exchange}:${msg.tool_call_id}`);
      let output = msg.content;
      try {
        output = JSON.parse(output);
      } catch (_) {
        /* Plain results remain readable. */
      }
      applyTraceEvent(
        bubbles,
        {
          data: {
            phase: 'end',
            tool_call_id: call
              ? call.id
              : `${exchange}:orphan:${msg.tool_call_id || index}`,
            tool_name: call ? call.name : '',
            input: call && call.input,
            output,
            is_error: !!(
              output &&
              typeof output === 'object' &&
              output.isError === true
            )
          }
        },
        {},
        0,
        (role, kind, content, context, traceExtra) =>
          createMessage(role, kind, content, context, {
            ...extra,
            ...traceExtra
          })
      );
      const completed = bubbles.find(item => item.trace && item.trace.toolCallId === (call ? call.id : `${exchange}:orphan:${msg.tool_call_id || index}`));
      if (completed && msg.tool_call_id) completed.trace.sourceToolCallId = msg.tool_call_id;
      if (!call) {
        const orphanId = `${exchange}:orphan:${msg.tool_call_id || index}`;
        const orphan = bubbles.find(item => item.trace && item.trace.toolCallId === orphanId);
        if (orphan) orphan.trace.status = orphan.trace.isError ? 'error' : 'unconfirmed';
      }
    }
  });
  return bubbles;
}

function restoreExecutionHistory(
  history,
  activeRun,
  applyEvents,
  createMessage
) {
  if (
    !history ||
    history.version !== 1 ||
    history.complete !== true ||
    !Array.isArray(history.runs)
  )
    return null;
  let state = { messages: [], pendingApproval: null, resolvedApprovalIds: [] };
  for (const run of history.runs) {
    if (!run || typeof run.run_id !== 'string' || !Array.isArray(run.events))
      return null;
    const createdAt = Date.parse(run.started_at || '') || Date.now();
    if (run.message)
      state.messages.push(
        createMessage(
          'user',
          'normal',
          run.message,
          {},
          {
            id: `history:user:${run.run_id}`,
            streamRunId: run.run_id,
            runStatus: run.status,
            runStartedAt: run.started_at,
            runFinishedAt: run.finished_at,
            createdAt
          }
        )
      );
    // The existing active-run reattachment replays from zero. Never hydrate its partial deltas too.
    if (activeRun && activeRun.run_id === run.run_id) continue;
    state = applyEvents({
      messages: state.messages,
      events: run.events.filter(
        (event) =>
          !(
            event.type === 'chat.message' &&
            event.data &&
            event.data.role === 'user'
          )
      ),
      contextSnapshot: {},
      currentPendingApproval: state.pendingApproval,
      currentResolvedApprovalIds: state.resolvedApprovalIds
    });
    state.messages = state.messages.map((item) =>
      item.streamRunId === run.run_id
        ? {
            ...item,
            runStatus: run.status,
            runStartedAt: run.started_at,
            runFinishedAt: run.finished_at
          }
        : item
    );
  }
  return state;
}
module.exports = { chatMessagesToBubbles, restoreExecutionHistory };
