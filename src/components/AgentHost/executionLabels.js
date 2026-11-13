const { formatToolLabel, formatSkillLabel } = require('../../utils/agentToolLabels');

function inputOf(trace) {
  try {
    const value = JSON.parse(trace.inputSignature || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (_) { return {}; }
}

function describeTool(trace = {}, t) {
  const text = value => typeof value === 'string' ? value : '';
  const name = text(trace.toolName);
  const input = inputOf(trace);
  const skill = name === 'skill' || name.startsWith('select_skill_');
  if (skill || name === 'read_skill_module') {
    const id = text(input.skill_id) || text(input.name) || (name.startsWith('select_skill_') ? name.slice('select_skill_'.length) : '');
    const skillName = formatSkillLabel(id || trace.target);
    const module = (text(input.path) || text(input.relative_path) || text(input.module_path)).split('/').pop().replace(/\.md$/i, '');
    return { name: t(skill ? 'selectingNamedSkill' : module ? 'readingNamedModule' : 'readingNamedSkill',
      { name: skillName, module }), action: skillName, icon: 'book', internal: true, query: false, rank: 0 };
  }
  const action = text(trace.displayTitle) || text(trace.title) || formatToolLabel(name, input);
  const target = text(trace.target) && !action.includes(trace.target) ? ` · ${trace.target}` : '';
  const operation = String(input.operation || '').toLowerCase();
  const query = /^(get|list|query|search|check|inspect|read|fetch)$/.test(operation) ||
    /(?:^|_)(get|list|query|search|check|inspect|read|fetch)(?:_|$)/.test(name);
  const mutation = !query && (/^(create|update|delete|set|apply|add|remove|restart|start|stop)$/.test(operation) ||
    /(?:^|_)(create|update|delete|operate|change|restart|start|stop|build|install|scale|upgrade|rollback|set)(?:_|$)/.test(name));
  return { name: `${action}${target}`, action, icon: query ? 'search' : mutation ? 'code' : 'api',
    internal: /^memory_/i.test(name), query, rank: mutation ? 2 : 1 };
}

function summaryOf(turn, t) {
  const tools = turn.process.filter(item => item.kind === 'trace' && item.trace)
    .map(item => describeTool(item.trace, t)).filter(tool => !tool.internal);
  if (!tools.length) {
    const skill = turn.process.slice().reverse().find(item => item.kind === 'trace' && item.trace);
    return skill ? describeTool(skill.trace, t).name : t('analyzeTask');
  }
  const rank = Math.max(...tools.map(tool => tool.rank));
  const actions = tools.filter(tool => tool.rank === rank);
  const distinct = [...new Set(actions.map(tool => tool.action))];
  return distinct.length === 1 ? actions[actions.length - 1].name
    : t('summaryActions', { first: distinct[0], last: distinct[distinct.length - 1] });
}

function describeExecution(turn, t) {
  const summary = () => summaryOf(turn, t);
  const tools = turn.process.filter(item => item.kind === 'trace' && item.trace);
  const last = tools[tools.length - 1];
  if (turn.waiting) {
    const pending = turn.pendingApprovals[turn.pendingApprovals.length - 1];
    return { text: t('awaitingNamedApproval', { name: pending.content || pending.approval.description || summary() }), icon: 'clock-circle-o' };
  }
  if (!turn.running || turn.segmentClosed || turn.failed || turn.cancelled) return { text: summary(), icon: 'deployment-unit' };
  const latestNode = turn.nodes[turn.nodes.length - 1];
  const thinking = latestNode && latestNode.output && latestNode.output.reasoningStreaming;
  if (last) {
    const tool = describeTool(last.trace, t);
    if (!thinking && !last.trace.hasOutput) {
      const repeats = tool.query && tools.filter(item => item.trace.toolName === last.trace.toolName &&
        item.trace.target === last.trace.target).length >= 3;
      return { text: repeats ? t('continuingOperation', { name: tool.name }) : tool.name, icon: tool.icon };
    }
    const subject = tool.action.replace(/^(查询|查看|检查|核对|读取|验证)/, '') || tool.action;
    return { text: t('analyzingOperation', { name: subject }), icon: 'bulb' };
  }
  return { text: t('analyzeRequest'), icon: 'bulb' };
}

module.exports = { describeTool, describeExecution, summaryOf };
