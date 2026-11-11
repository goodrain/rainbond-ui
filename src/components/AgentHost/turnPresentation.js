const { shouldRenderMessageItem } = require('./displayFilters');

function hasAnswer(item) {
  return item && item.role === 'assistant' && item.kind === 'normal' &&
    ((typeof item.content === 'string' && item.content.trim()) || (Array.isArray(item.suggestedActions) && item.suggestedActions.length));
}

/** Model messages delimit actual execution nodes; tool events stay with their issuer. */
function groupExecutionNodes(items, process, answer) {
  const visible = new Set(process);
  const nodes = [];
  let node = null;
  items.forEach(item => {
    if (item.role === 'assistant' && item.kind === 'normal') {
      node = { key: `node:${item.streamMessageId || item.id}`, output: item, events: [] };
      nodes.push(node);
    } else if (visible.has(item)) {
      if (!node) {
        node = { key: `node:${item.id}`, output: null, events: [] };
        nodes.push(node);
      }
      node.events.push(item);
    }
  });
  return nodes.filter(entry => entry.events.length || (entry.output && (
    entry.output.reasoning || entry.output.reasoningStreaming ||
    (entry.output !== answer && entry.output.content)
  )));
}

/** A presentation group follows a user request, never a model/tool step. */
function groupConversationMessages(messages, options = {}) {
  const groups = [];
  let turn = null;
  const turnsByRun = new Map();
  (Array.isArray(messages) ? messages : []).forEach(item => {
    if (!shouldRenderMessageItem(item)) return;
    if (item.role === 'user' && item.kind === 'normal') {
      groups.push({ kind: 'user', item, key: item.id });
      turn = {
        kind: 'turn', key: `turn:${item.id}`, createdAt: item.createdAt,
        runId: item.streamRunId || '', runStatus: item.runStatus || '',
        startedAt: item.runStartedAt || item.createdAt, finishedAt: item.runFinishedAt,
        items: [],
      };
      groups.push(turn);
      if (turn.runId) turnsByRun.set(turn.runId, turn);
      return;
    }
    if (!turn && item.kind === 'context') {
      groups.push({ kind: 'context', item, key: item.id });
      return;
    }
    const runId = item.streamRunId || (item.approval && item.approval.runId) || '';
    let target = runId && turnsByRun.get(runId);
    if (!target) {
      if (!turn || (runId && turn.runId && runId !== turn.runId)) {
        turn = {
          kind: 'turn', key: `turn:${runId ? `run:${runId}` : item.id}`,
          createdAt: item.createdAt, runId, items: [],
        };
        groups.push(turn);
      }
      target = turn;
      if (!target.runId) target.runId = runId;
      if (target.runId) turnsByRun.set(target.runId, target);
    }
    if (item.runStatus) target.runStatus = item.runStatus;
    target.items.push(item);
  });
  const turns = groups.filter(group => group.kind === 'turn');
  turns.forEach((group, index) => {
    const latestOutput = group.items.slice().reverse().find(item => item.role === 'assistant' && item.kind === 'normal');
    const followingActions = latestOutput && group.items.slice(group.items.indexOf(latestOutput) + 1)
      .some(item => item.kind === 'trace' || item.kind === 'approval');
    const finalAnswer = group.items.slice().reverse().find(item => item.isFinalAnswer && hasAnswer(item));
    group.answer = finalAnswer || (hasAnswer(latestOutput) && !followingActions ? latestOutput : null);
    group.pendingApprovals = group.items.filter(item => item.kind === 'approval' && item.approval && item.approval.status === 'pending');
    group.notices = group.items.filter(item => item.kind === 'error' || item.kind === 'status' || item.kind === 'suggested_actions');
    group.process = group.items.filter(item => {
      if (group.notices.includes(item) || group.pendingApprovals.includes(item)) return false;
      if (item.kind === 'trace') {
        const tool = item.trace && item.trace.toolName || '';
        if (/^memory_/i.test(tool) || /记忆/.test(tool)) return false;
      }
      if (item === group.answer) return !!(item.reasoning || item.reasoningStreaming);
      if (item.role === 'assistant' && item.kind === 'normal') return !!(item.reasoning || item.reasoningStreaming || item.content);
      return true;
    });
    group.nodes = groupExecutionNodes(group.items, group.process, group.answer);
    group.running = !!(options.sending && index === turns.length - 1 &&
      (!options.activeRunId || !group.runId || options.activeRunId === group.runId));
    group.waiting = group.pendingApprovals.length > 0;
    group.failed = group.notices.some(item => item.kind === 'error') || group.runStatus === 'failed';
    group.cancelled = group.runStatus === 'cancelled';
    group.latest = group.process[group.process.length - 1] || null;
  });
  return groups.filter(group => group.kind !== 'turn' || group.items.length || group.running);
}

module.exports = { groupConversationMessages };
