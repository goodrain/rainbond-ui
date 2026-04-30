function nextTraceHeuristicIndex(messages, trace) {
  return messages.findIndex(item => (
    item &&
    item.kind === 'trace' &&
    item.trace &&
    item.trace.title === trace.title &&
    item.trace.inputSignature === trace.inputSignature &&
    !item.trace.hasOutput
  ));
}

function findTraceMessageIndex(messages, trace) {
  if (trace.traceId) {
    const traceIdIndex = messages.findIndex(
      item => item && item.kind === 'trace' && item.trace && item.trace.traceId === trace.traceId
    );
    if (traceIdIndex > -1) {
      return traceIdIndex;
    }
  }

  if (trace.toolCallId) {
    const toolCallIndex = messages.findIndex(
      item => item && item.kind === 'trace' && item.trace && item.trace.toolCallId === trace.toolCallId
    );
    if (toolCallIndex > -1) {
      return toolCallIndex;
    }
  }

  return trace.hasOutput
    ? nextTraceHeuristicIndex(messages, trace)
    : -1;
}

const { formatToolLabel } = require('../utils/agentToolLabels');

function buildTraceContent(data = {}) {
  const toolName = data.tool_name || '';
  const friendlyTitle = formatToolLabel(toolName, data.input);
  const normalizedInput =
    data && data.input && typeof data.input === 'object'
      ? JSON.stringify(data.input)
      : '';
  const normalizedOutput =
    data &&
    data.output &&
    data.output.structuredContent &&
    typeof data.output.structuredContent === 'object'
      ? data.output.structuredContent
      : data.output;
  const detail = [];
  if (data.input) {
    detail.push(`输入：${JSON.stringify(data.input, null, 2)}`);
  }
  if (normalizedOutput) {
    detail.push(`输出：${JSON.stringify(normalizedOutput, null, 2)}`);
  }
  return {
    title: friendlyTitle,
    detail: detail.join('\n\n'),
    toolName: toolName || friendlyTitle,
    traceId: data.trace_id || '',
    toolCallId: data.tool_call_id || '',
    inputSignature: normalizedInput,
    hasOutput: !!data.output,
  };
}

function applyTraceEvent(nextMessages, event, contextSnapshot, eventSequence, createMessage) {
  const trace = buildTraceContent((event && event.data) || {});
  const traceIndex = findTraceMessageIndex(nextMessages, trace);

  if (traceIndex > -1) {
    nextMessages[traceIndex] = {
      ...nextMessages[traceIndex],
      trace,
      eventSequence,
    };
    return nextMessages;
  }

  nextMessages.push(
    createMessage(
      'system',
      'trace',
      '',
      contextSnapshot,
      {
        trace,
        eventSequence,
      }
    )
  );
  return nextMessages;
}

module.exports = {
  applyTraceEvent,
  buildTraceContent,
  findTraceMessageIndex,
};
