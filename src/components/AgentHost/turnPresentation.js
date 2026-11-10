const { shouldRenderMessageItem } = require('./displayFilters');

function hasAnswer(item) {
  return item && item.role === 'assistant' && item.kind === 'normal' &&
    ((typeof item.content === 'string' && item.content.trim()) || (Array.isArray(item.suggestedActions) && item.suggestedActions.length));
}

/** A presentation group follows a user request, never a model/tool step. */
function groupConversationMessages(messages, options = {}) {
  const groups = [];
  let turn = null;
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
      return;
    }
    if (!turn && item.kind === 'context') {
      groups.push({ kind: 'context', item, key: item.id });
      return;
    }
    if (!turn) {
      turn = { kind: 'turn', key: `turn:${item.id}`, createdAt: item.createdAt, runId: item.streamRunId || '', items: [] };
      groups.push(turn);
    }
    if (!turn.runId) turn.runId = item.streamRunId || (item.approval && item.approval.runId) || '';
    if (item.runStatus) turn.runStatus = item.runStatus;
    turn.items.push(item);
  });
  const turns = groups.filter(group => group.kind === 'turn');
  turns.forEach((group, index) => {
    group.answer = group.items.slice().reverse().find(hasAnswer) || null;
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
