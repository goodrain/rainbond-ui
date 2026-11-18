const { formatToolLabel, formatSkillLabel } = require('../utils/agentToolLabels');

const SENSITIVE_KEY =
  /password|passwd|token|secret|authorization|cookie|kubeconfig|private.?key|certificate|api.?key|client.?key/i;
function sanitizeToolValue(value, depth = 0) {
  if (depth > 7) return '[…]';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object')
        return JSON.stringify(sanitizeToolValue(parsed, depth + 1));
    } catch (_) {
      /* Not JSON. */
    }
    return value
      .replace(
        /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/gi,
        '***'
      )
      .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '***')
      .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi, '$1***')
      .replace(
        /((?:password|passwd|token|secret|authorization|cookie|api_key)\s*[:=]\s*)[^\s,;]+/gi,
        '$1***'
      )
      .replace(/(\w+:\/\/[^\s:/]+:)[^\s@]+@/g, '$1***@')
      .slice(0, 8000);
  }
  if (Array.isArray(value))
    return value.slice(0, 40).map((item) => sanitizeToolValue(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const secret = String(value.kind || '').toLowerCase() === 'secret';
  const secretValue = SENSITIVE_KEY.test(String(value.name || value.key || ''));
  const result = {};
  Object.keys(value)
    .slice(0, 80)
    .forEach((key) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype')
        return;
      result[key] =
        SENSITIVE_KEY.test(key) ||
        (secret && /^(data|stringData)$/.test(key)) ||
        (secretValue && /^(value|values)$/.test(key))
          ? '***'
          : sanitizeToolValue(value[key], depth + 1);
    });
  return result;
}

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
  const candidates = [
    data.output,
    data.structured_content,
    data.structuredContent,
    data.result
  ];
  const sources = [];
  const visit = (value) => {
    const parsed = parseMaybeJson(value);
    if (!parsed) return;
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => visit(item && item.text ? item.text : item));
      return;
    }
    if (Array.isArray(parsed.sources)) {
      parsed.sources.forEach((source) => {
        if (
          source &&
          typeof source.url === 'string' &&
          /^https?:\/\//i.test(source.url)
        ) {
          sources.push({ url: source.url, title: source.title || '' });
        }
      });
    }
    ['structured_content', 'structuredContent', 'result'].forEach((key) =>
      visit(parsed[key])
    );
  };
  candidates.forEach(visit);
  const seen = new Set();
  return sources
    .filter((source) => {
      if (seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    })
    .slice(0, 8);
}

function detailText(value) {
  if (value === undefined || value === null) return '';
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (_) {
      /* Plain tool text is supported. */
    }
  }
  const safe = sanitizeToolValue(parsed);
  const text = typeof safe === 'string' ? safe : JSON.stringify(safe, null, 2);
  return text.length > 8000 ? `${text.slice(0, 8000)}\n…` : text;
}

function findTraceMessageIndex(messages, trace) {
  const sameRun = (item) =>
    !trace.runId ||
    (item.streamRunId || item.trace.runId || '') === trace.runId;
  for (const key of ['traceId', 'toolCallId']) {
    if (!trace[key]) continue;
    const index = messages.findIndex(
      (item) =>
        item &&
        item.kind === 'trace' &&
        item.trace &&
        sameRun(item) &&
        item.trace[key] === trace[key]
    );
    if (index > -1) return index;
  }
  return trace.hasOutput
    ? messages.findIndex(
        (item) =>
          item &&
          item.kind === 'trace' &&
          item.trace &&
          sameRun(item) &&
          item.trace.title === trace.title &&
          item.trace.inputSignature === trace.inputSignature &&
          !item.trace.hasOutput
      )
    : -1;
}

function buildTraceContent(data = {}, meta = {}) {
  const parsed = parseMaybeJson(data.input);
  const input =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? sanitizeToolValue(parsed)
      : null;
  const toolName = data.tool_name || '';
  const title = formatToolLabel(toolName, input);
  const output = parseMaybeJson(data.output);
  const hasOutput =
    data.phase === 'end' ||
    Object.prototype.hasOwnProperty.call(data, 'output');
  const isError =
    data.is_error === true ||
    !!(output && !Array.isArray(output) && output.isError === true);
  const isSkill = toolName === 'skill' || toolName.startsWith('select_skill_');
  const skillId =
    (input && (input.name || input.skill_id)) ||
    toolName.slice('select_skill_'.length);
  const objectName =
    input &&
    (input.service_alias ||
      input.component_alias ||
      input.app_name ||
      input.name ||
      input.resource ||
      input.kind);
  const target = isSkill
    ? formatSkillLabel(skillId)
    : input
      ? [
          ...new Set(
            [input.namespace, objectName].filter(
              (value) => typeof value === 'string' && value
            )
          )
        ]
          .join(' · ')
          .slice(0, 160)
      : '';
  return {
    title,
    displayTitle: title,
    detail: '',
    toolName: toolName || title,
    runId: meta.runId || '',
    traceId: data.trace_id || '',
    toolCallId: data.tool_call_id || '',
    inputSignature: input ? JSON.stringify(input) : '',
    inputDetail: input ? detailText(input) : '',
    outputDetail: hasOutput ? detailText(data.output) : '',
    target,
    hasOutput,
    phase: data.phase || '',
    isError,
    status: hasOutput
      ? isError
        ? 'error'
        : 'returned'
      : data.phase === 'start'
        ? 'running'
        : 'unknown',
    turn: data.turn,
    step: data.step,
    startedAt: data.phase === 'start' ? meta.timestamp : undefined,
    finishedAt: hasOutput ? meta.timestamp : undefined,
    sources: extractWebSources(data)
  };
}

function applyTraceEvent(
  nextMessages,
  event,
  contextSnapshot,
  eventSequence,
  createMessage
) {
  const trace = buildTraceContent((event && event.data) || {}, {
    runId: event && event.runId,
    timestamp: event && event.timestamp
  });
  const index = findTraceMessageIndex(nextMessages, trace);
  if (index > -1) {
    const previous = nextMessages[index].trace;
    const merged = {
      ...previous,
      ...trace,
      inputSignature: trace.inputSignature || previous.inputSignature || '',
      inputDetail: trace.inputDetail || previous.inputDetail || '',
      target: trace.target || previous.target || '',
      title:
        trace.inputSignature || !previous.inputSignature
          ? trace.title
          : previous.title,
      displayTitle:
        trace.inputSignature || !previous.inputSignature
          ? trace.displayTitle
          : previous.displayTitle,
      startedAt: previous.startedAt || trace.startedAt,
      sources: trace.sources.length ? trace.sources : previous.sources
    };
    // Replayed starts can arrive after the result. They must never revive it.
    if (previous.hasOutput && !trace.hasOutput)
      Object.assign(merged, {
        hasOutput: true,
        phase: previous.phase,
        status: previous.status,
        isError: previous.isError,
        outputDetail: previous.outputDetail,
        finishedAt: previous.finishedAt
      });
    nextMessages[index] = {
      ...nextMessages[index],
      trace: merged,
      eventSequence
    };
  } else
    nextMessages.push(
      createMessage('system', 'trace', '', contextSnapshot, {
        trace,
        eventSequence
      })
    );
  return nextMessages;
}

module.exports = {
  extractWebSources,
  applyTraceEvent,
  buildTraceContent,
  findTraceMessageIndex,
  sanitizeToolValue,
  detailText
};
