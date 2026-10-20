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


function parseMaybeJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractWebSources(data = {}) {
  if (!data || !/web_(search|fetch)/.test(data.tool_name || '')) return [];
  const candidates = [data.output, data.structured_content, data.structuredContent, data.result];
  const sources = [];
  const visit = value => {
    const parsed = parseMaybeJson(value);
    if (!parsed) return;
    if (Array.isArray(parsed)) {
      parsed.forEach(item => visit(item && item.text ? item.text : item));
      return;
    }
    if (Array.isArray(parsed.sources)) {
      parsed.sources.forEach(source => {
        if (source && source.url) {
          sources.push({ url: source.url, title: source.title || '' });
        }
      });
    }
    ['structured_content', 'structuredContent', 'result'].forEach(key => visit(parsed[key]));
  };
  candidates.forEach(visit);
  const seen = new Set();
  return sources.filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  }).slice(0, 8);
}

function buildTraceDisplayTitle(friendlyTitle, toolName) {
  if (friendlyTitle && toolName && friendlyTitle !== toolName) {
    return `${friendlyTitle}（${toolName}）`;
  }
  return friendlyTitle || toolName || '工具调用';
}

function buildTraceContent(data = {}) {
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
    sources: extractWebSources(data),
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
  extractWebSources,
  applyTraceEvent,
  buildTraceContent,
  findTraceMessageIndex,
};
