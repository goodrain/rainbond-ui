// Display-only aggregation for the agent chat timeline.
//
// The raw SSE stream emits one trace message per tool call plus one approval
// card per authorization request. Rendering every one of those in the main
// view makes a run look like a log file, so the AgentHost folds them into:
//
// 1. milestones  — adjacent traces of the same semantic phase and the same
//                  user-facing label become one row with a repeat count;
// 2. approvals   — adjacent approvals with the same description become one
//                  card that reports how many times the approval was reused.
//
// Keep this file free of React / antd imports so the node:test suite can
// require it directly.

const PHASE_CREATE_APP = 'create_app';
const PHASE_CREATE_COMPONENT = 'create_component';
const PHASE_CONFIGURE_PORT = 'configure_port';
const PHASE_BUILD = 'build';
const PHASE_DEPLOY = 'deploy';
const PHASE_WAIT_INSTANCE = 'wait_instance';
const PHASE_VERIFY_ACCESS = 'verify_access';
const PHASE_DIAGNOSE = 'diagnose';
const PHASE_OTHER = 'other';

const PHASE_META = {
  [PHASE_CREATE_APP]: { label: '创建应用' },
  [PHASE_CREATE_COMPONENT]: { label: '创建组件' },
  [PHASE_CONFIGURE_PORT]: { label: '配置端口' },
  [PHASE_BUILD]: { label: '构建' },
  [PHASE_DEPLOY]: { label: '部署' },
  [PHASE_WAIT_INSTANCE]: { label: '等待实例' },
  [PHASE_VERIFY_ACCESS]: { label: '验证访问' },
  [PHASE_DIAGNOSE]: { label: '排障诊断' },
  [PHASE_OTHER]: { label: '其它' }
};

const PHASE_ORDER = [
  PHASE_CREATE_APP,
  PHASE_CREATE_COMPONENT,
  PHASE_CONFIGURE_PORT,
  PHASE_BUILD,
  PHASE_DEPLOY,
  PHASE_WAIT_INSTANCE,
  PHASE_VERIFY_ACCESS,
  PHASE_DIAGNOSE,
  PHASE_OTHER
];

const READ_ONLY_TOOL_PREFIX = /^rainbond_(get|list|query|describe|read|inspect)_/;
const BUILD_LOG_TOOL = /build_logs?|build-log/;
const DEPLOY_TOOL = /deploy|upgrade|rollback|restart|scale|operate_app|app_share|share_/;
const DIAGNOSE_TOOL = /logs?|events?|monitor|diagnos|pod/;

function asString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

function getTraceLabel(trace = {}) {
  const label =
    asString(trace.displayTitle) ||
    asString(trace.title) ||
    asString(trace.toolName);
  return label || '工具调用';
}

function getTraceToolName(trace = {}) {
  return asString(trace.toolName).toLowerCase();
}

// Map a tool call onto one of the user-facing pipeline phases. Rules are
// intentionally ordered from most specific to most generic; e.g. a
// "查看构建日志" call is troubleshooting, not a build, even though its title
// contains "构建".
function classifyTracePhase(trace = {}) {
  const tool = getTraceToolName(trace);
  const label = getTraceLabel(trace).toLowerCase();

  if (
    /^rainbond_create_app($|_from_|_snapshot_version$)/.test(tool) ||
    /^rainbond_copy_app$/.test(tool) ||
    /^rainbond_install_app_(model|by_market)$/.test(tool) ||
    /创建应用|安装应用模板|从应用市场安装/.test(label)
  ) {
    return PHASE_CREATE_APP;
  }

  if (
    /^rainbond_(create|copy)_component/.test(tool) ||
    /创建组件|从.+创建组件/.test(label)
  ) {
    return PHASE_CREATE_COMPONENT;
  }

  if (/port/.test(tool) || /端口/.test(label)) {
    return PHASE_CONFIGURE_PORT;
  }

  if (
    /wait|readiness|ready/.test(tool) ||
    /等待.*(实例|就绪|启动)|实例就绪/.test(label)
  ) {
    return PHASE_WAIT_INSTANCE;
  }

  if (
    /gateway|access|verify|health|curl|probe/.test(tool) ||
    /验证.*访问|访问.*验证|访问地址|网关规则|健康检查/.test(label)
  ) {
    return PHASE_VERIFY_ACCESS;
  }

  if (
    /^rainbond_build/.test(tool) ||
    /^rainbond_check_(component|helm_app|yaml_app)$/.test(tool) ||
    /构建组件|构建 Helm|检测组件|构建应用/.test(label)
  ) {
    return PHASE_BUILD;
  }

  if (
    !READ_ONLY_TOOL_PREFIX.test(tool) &&
    (DEPLOY_TOOL.test(tool) ||
      /部署|发布|启动|停止|重启|升级|回滚|伸缩/.test(label))
  ) {
    return PHASE_DEPLOY;
  }

  if (
    READ_ONLY_TOOL_PREFIX.test(tool) ||
    BUILD_LOG_TOOL.test(tool) ||
    DIAGNOSE_TOOL.test(tool) ||
    /日志|事件|监控|诊断|排查|详情|概况|状态|查询|查看/.test(label)
  ) {
    return PHASE_DIAGNOSE;
  }

  return PHASE_OTHER;
}

function getPhaseLabel(phaseKey) {
  return (
    (PHASE_META[phaseKey] && PHASE_META[phaseKey].label) ||
    PHASE_META[PHASE_OTHER].label
  );
}

function getTraceStatus(trace = {}) {
  if (
    trace.error ||
    trace.errorMessage ||
    trace.hasError ||
    trace.ok === false ||
    trace.status === 'error' ||
    trace.status === 'failed'
  ) {
    return 'failed';
  }

  if (
    trace.status === 'pending' ||
    trace.status === 'running' ||
    trace.hasOutput === false
  ) {
    return 'running';
  }

  return 'done';
}

function resolveMilestoneStatus(items = [], options = {}) {
  const list = Array.isArray(items) ? items : [];
  if (
    list.some(item => getTraceStatus((item && item.trace) || {}) === 'failed')
  ) {
    return 'failed';
  }

  const lastItem = list[list.length - 1];
  if (
    options.sending &&
    lastItem &&
    getTraceStatus(lastItem.trace || {}) === 'running'
  ) {
    return 'running';
  }

  return 'done';
}

// Group adjacent traces that share both phase and label. Non-adjacent calls of
// the same kind intentionally stay separate so the timeline still reflects the
// order in which the run moved between stages.
function buildMilestones(traces = [], options = {}) {
  const list = Array.isArray(traces) ? traces.filter(Boolean) : [];
  const groups = [];

  list.forEach(item => {
    const trace = (item && item.trace) || {};
    const phaseKey = classifyTracePhase(trace);
    const label = getTraceLabel(trace);
    const previous = groups[groups.length - 1];

    if (
      previous &&
      previous.phaseKey === phaseKey &&
      previous.label === label
    ) {
      previous.items.push(item);
      previous.count += 1;
      return;
    }

    groups.push({
      phaseKey,
      phaseLabel: getPhaseLabel(phaseKey),
      label,
      items: [item],
      count: 1
    });
  });

  return groups.map((group, index) => {
    const status = resolveMilestoneStatus(group.items, options);
    const resultText =
      group.count > 1 ? `${group.label} ×${group.count}` : group.label;

    return {
      key: `${group.phaseKey}-${group.label}-${index}`,
      phaseKey: group.phaseKey,
      phaseLabel: group.phaseLabel,
      label: group.label,
      resultText,
      status,
      count: group.count,
      steps: group.items.length,
      items: group.items,
      lastItem: group.items[group.items.length - 1]
    };
  });
}

function isRunBoundary(item = {}) {
  if (!item) {
    return false;
  }

  return (
    item.kind === 'approval' || (item.kind === 'normal' && item.role === 'user')
  );
}

// Split the trace stream into run segments. A new segment starts at a user
// message or at an approval card, so traces on either side of an authorization
// request never get folded into the same milestone. Assistant text does not
// split a segment: one run commonly emits several assistant messages between
// tool calls.
function splitTracesByRun(messages = []) {
  const list = Array.isArray(messages) ? messages : [];
  const runs = [[]];
  const runIndexByTraceId = new Map();
  let currentRun = 0;

  list.forEach(item => {
    if (isRunBoundary(item)) {
      currentRun += 1;
      runs[currentRun] = [];
      return;
    }

    if (item && item.kind === 'trace') {
      runs[currentRun].push(item);
      if (item.id) {
        runIndexByTraceId.set(item.id, currentRun);
      }
    }
  });

  return { runs, runIndexByTraceId };
}

function getApprovalMergeKey(item = {}) {
  const approval = (item && item.approval) || {};
  return asString(approval.description) || asString(item.content);
}

function findPendingApproval(items = []) {
  return (
    items.find(
      item => item && item.approval && item.approval.status === 'pending'
    ) || null
  );
}

// Fold consecutive approvals that share the same description into a single
// card. The newest approval wins unless one of the folded approvals is still
// pending, in which case the pending one is kept so its action buttons stay
// wired to the approval the backend is waiting on.
function mergeAdjacentApprovals(messages = []) {
  const list = Array.isArray(messages) ? messages : [];
  const merged = [];

  list.forEach(item => {
    if (!item || item.kind !== 'approval') {
      merged.push(item);
      return;
    }

    const previous = merged[merged.length - 1];
    const mergeKey = getApprovalMergeKey(item);
    const previousKey =
      previous && previous.kind === 'approval'
        ? getApprovalMergeKey(previous)
        : '';

    if (
      previous &&
      previous.kind === 'approval' &&
      mergeKey &&
      mergeKey === previousKey
    ) {
      const items = (previous.mergedApprovalItems || [previous]).concat(item);
      const representative = findPendingApproval(items) || item;

      merged[merged.length - 1] = {
        ...representative,
        mergedApprovalItems: items,
        mergedApprovalCount: items.length,
        mergedReuseCount: items.length - 1
      };
      return;
    }

    merged.push(item);
  });

  return merged;
}

function pickFirst(source, keys) {
  if (!source || typeof source !== 'object') {
    return '';
  }

  for (let index = 0; index < keys.length; index += 1) {
    const value = source[keys[index]];
    if (value !== undefined && value !== null && asString(value)) {
      return asString(value);
    }
  }

  return '';
}

function readBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

// Backend approval payloads use snake_case; the UI historically used
// camelCase. Accept both, and fall back to the old description-only display.
function getApprovalDisplayMeta(approval = {}, item = {}) {
  const sources = [approval, item];
  const pick = keys => {
    for (let index = 0; index < sources.length; index += 1) {
      const value = pickFirst(sources[index], keys);
      if (value) {
        return value;
      }
    }
    return '';
  };

  const description =
    asString(approval && approval.description) ||
    asString(item && item.content);
  const actionLabel =
    pick(['action_label', 'actionLabel', 'action_display']) ||
    description ||
    '需要您的授权执行';
  const objectLabel = pick([
    'object_label',
    'objectLabel',
    'target_label',
    'targetLabel'
  ]);
  const effectLabel = pick([
    'effect_label',
    'effectLabel',
    'impact_label',
    'impactLabel'
  ]);
  let readonlyValue;
  if (approval && approval.readonly !== undefined) {
    readonlyValue = approval.readonly;
  } else if (approval && approval.readOnly !== undefined) {
    readonlyValue = approval.readOnly;
  } else if (approval && approval.read_only !== undefined) {
    readonlyValue = approval.read_only;
  } else {
    readonlyValue = item && item.readonly;
  }
  const readonly = readBoolean(readonlyValue);

  return {
    actionLabel,
    objectLabel,
    effectLabel,
    readonly,
    description
  };
}

module.exports = {
  PHASE_ORDER,
  PHASE_META,
  buildMilestones,
  classifyTracePhase,
  getApprovalDisplayMeta,
  getApprovalMergeKey,
  getPhaseLabel,
  getTraceLabel,
  getTraceStatus,
  mergeAdjacentApprovals,
  resolveMilestoneStatus,
  splitTracesByRun
};
