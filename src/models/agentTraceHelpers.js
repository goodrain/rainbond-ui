import * as agentToolLabels from '../utils/agentToolLabels';

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

const { formatToolLabel } = agentToolLabels;

function buildTraceDisplayTitle(friendlyTitle, toolName) {
  if (friendlyTitle && toolName && friendlyTitle !== toolName) {
    return `${friendlyTitle}（${toolName}）`;
  }
  return friendlyTitle || toolName || '工具调用';
}

export function buildTraceContent(data = {}) {
  const toolName = data.tool_name || '';
  const friendlyTitle = formatToolLabel(toolName, data.input);
  const displayTitle = buildTraceDisplayTitle(friendlyTitle, toolName);
  const normalizedInput =
    data && data.input && typeof data.input === 'object'
      ? JSON.stringify(data.input)
      : '';
  return {
    title: friendlyTitle,
    displayTitle,
    detail: '',
    toolName: toolName || friendlyTitle,
    traceId: data.trace_id || '',
    toolCallId: data.tool_call_id || '',
    inputSignature: normalizedInput,
    hasOutput: !!data.output,
  };
}

export function applyTraceEvent(nextMessages, event, contextSnapshot, eventSequence, createMessage) {
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

export { findTraceMessageIndex };
