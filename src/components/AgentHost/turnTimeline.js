const { getAssistantDisplayContent, getVisibleSuggestedActions } = require('./displayFilters');

/** Split at real assistant prose, keeping tools/approvals attached to their issuer. */
function buildTurnTimeline(turn) {
  const timeline = [];
  const sources = new Map(turn.nodes.filter(node => node.output).map(node => [node.output, node]));
  let current = null;
  let boundary = 'start';
  function append(source, item, roundNumber) {
    if (!current) {
      current = { kind: 'execution', key: `${turn.key}:execution:${boundary}`, nodes: [], closed: false };
      timeline.push(current);
    }
    current.nodes.push({ key: source.key, sourceKey: source.key,
      output: item ? { ...item, content: '', suggestedActions: [] } : null,
      events: source.events.slice(), roundNumber });
  }
  function body(item) {
    if (current) current.closed = true;
    current = null;
    boundary = item.streamMessageId || item.id;
    timeline.push({ kind: 'answer', key: `answer:${item.id}`, item });
  }
  turn.nodes.filter(node => !node.output).forEach(node => append(node, null, 1));
  let round = 0;
  turn.items.filter(item => item.role === 'assistant' && item.kind === 'normal').forEach(item => {
    round += 1;
    const source = sources.get(item) ||
      { key: `node:${item.streamMessageId || item.id}`, output: item, events: [] };
    const prose = getAssistantDisplayContent(item).trim() || getVisibleSuggestedActions(item.suggestedActions).length;
    // A checkpoint and its next actions share one model message. Keep that
    // message's reasoning, calls and approvals together after the checkpoint.
    const continues = prose && source.events.length && !item.isFinalAnswer && item.messageKind !== 'final';
    if (continues) body(item);
    if (item.reasoning || item.reasoningStreaming || source.events.length) append(source, item, round);
    if (prose && !continues) body(item);
  });
  if (!timeline.length && (turn.running || turn.waiting)) {
    timeline.push({ kind: 'execution', key: `${turn.key}:execution:start`, nodes: [], closed: false });
  }
  const executions = timeline.filter(entry => entry.kind === 'execution');
  executions.forEach((entry, index) => {
    const process = entry.nodes.flatMap(node => [...(node.output ? [node.output] : []), ...node.events]);
    const traces = process.filter(item => item.kind === 'trace' && item.trace);
    const approvals = process.filter(item => item.kind === 'approval' && item.approval);
    const pendingApprovals = approvals.filter(item => item.approval.status === 'pending');
    const last = index === executions.length - 1;
    entry.turn = { ...turn, key: entry.key, nodes: entry.nodes, process, items: process,
      answer: null, notices: [], timeline: undefined,
      pendingApprovals, resolvedApprovals: approvals.filter(item => item.approval.status !== 'pending'),
      waiting: pendingApprovals.length > 0,
      running: turn.running && last && !entry.closed,
      failed: turn.failed && last, cancelled: turn.cancelled && last,
      segmentClosed: entry.closed && !pendingApprovals.length,
      reasoningCount: entry.nodes.filter(node => node.output && (node.output.reasoning || node.output.reasoningStreaming)).length,
      toolCount: new Set(traces.map(item => item.trace.toolCallId || item.trace.traceId || item.id)).size,
      failedTools: traces.filter(item => item.trace.isError), latest: process[process.length - 1] || null,
    };
  });
  return timeline;
}

module.exports = { buildTurnTimeline };
