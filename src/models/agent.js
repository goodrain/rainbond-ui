import { getDvaApp } from 'umi';
import {
  abortAgentRun,
  forceCancelAgentRun,
  cancelAgentSessionPending,
  clearAgentSession,
  clearAgentSessionRemote,
  decideAgentApproval,
  deleteAgentSession,
  hydrateAgentSession,
  listAgentSessions,
  loadAgentSessionMessages,
  sendAgentMessage,
  subscribeToActiveRun,
} from '../services/agent';
import { getAgentAccess } from '../services/agentAccess';
import { getEnterprisePluginList } from '../services/api';
import { isPluginBaseId } from '../utils/pluginArchUtils';
import * as agentEventAdapter from '../services/agentEventAdapter';
import {
  formatAgentContextMessage,
  getAgentContextSignature,
} from '../utils/agentContext';
import {
  isSupportedAgentMutationTool,
  resolvePostActionRoute,
  shouldHandleApprovedMutationTrace,
  shouldUseRouteQueryRefresh,
  shouldUseSlidePanelContentRefresh,
} from '../utils/agentMutationRouteMap';
import agentWorkflowState from './agentWorkflowState';
import * as agentInteractionLock from './agentInteractionLock';
import * as agentStreamMessages from './agentStreamMessages';
import * as autoApprovalPolicy from '../components/AgentHost/autoApprovalPolicy';
import * as inFlightAutoApprovals from '../components/AgentHost/inFlightAutoApprovals';
import * as agentTraceHelpers from './agentTraceHelpers';
import * as agentCrossTab from './agentCrossTab';
import * as agentClearConversation from './agentClearConversation';
import * as agentCompactionReducer from './agentCompactionReducer';
import * as agentToolLabels from '../utils/agentToolLabels';
import * as agentComponentMutationFinalizer from './agentComponentMutationFinalizer';
import { captureAgentRetentionEvent } from '../posthog';

const { extractWorkflowState } = agentWorkflowState;
const { adaptAgentEvent } = agentEventAdapter;
const { getNextInteractionLocked } = agentInteractionLock;
const { applyStreamingAssistantEvent } = agentStreamMessages;
const {
  applyTraceEvent,
  buildTraceContent,
} = agentTraceHelpers;
const {
  buildCrossTabOnEventDispatcher,
} = agentCrossTab;
const {
  resolveClearTargetSessionId,
} = agentClearConversation;
const {
  applyCompactionEvent,
  defaultCompactionState,
} = agentCompactionReducer;
const { formatToolLabel } = agentToolLabels;
const {
  buildComponentMutationTrackingPatch,
  buildComponentMutationTrackingPatchFromResult,
  buildFinalComponentOverviewNavigationPayload,
  createClearedComponentMutationTrackingState,
  shouldFinalizeToComponentOverview,
} = agentComponentMutationFinalizer;

// F5 — cross-tab SSE observer registry.
// When tab B gets 409, the local run never produces events here; we have to
// subscribe to the foreign run so the model can react to its terminal
// status. Keyed by runId so we never open two streams for the same run.
const crossTabSubscriptions = new Map();

function startCrossTabRunSubscription({ sessionId, runId, contextSnapshot }) {
  if (!sessionId || !runId) return;
  if (crossTabSubscriptions.has(runId)) return;

  const controller =
    typeof AbortController === 'function' ? new AbortController() : null;
  const entry = { controller, contextSnapshot: contextSnapshot || {} };
  crossTabSubscriptions.set(runId, entry);

  const dvaApp = getDvaApp();
  const dispatch = dvaApp && dvaApp._store && dvaApp._store.dispatch;

  // F12 — only forward run.status from the foreign run. Backend replay of
  // a stale-zombie run would otherwise flood the local tab with the
  // foreign run's chat.message.* / approval.* / compaction.* history. The
  // applyStreamEvent saga still detects terminal run.status and flushes
  // pendingDraft via auto-resend.
  subscribeToActiveRun({
    sessionId,
    runId,
    abortSignal: controller && controller.signal,
    onEvent: buildCrossTabOnEventDispatcher(dispatch, entry.contextSnapshot),
  })
    .catch(() => {
      // Foreign-run SSE may legitimately error (run already terminal,
      // network blip). The model's regular state will recover when the
      // user retries — silent here is correct.
    })
    .then(() => {
      crossTabSubscriptions.delete(runId);
    });
}

// Used after page refresh to resume watching a run that was in-flight. Unlike
// startCrossTabRunSubscription this forwards ALL event types so the UI can
// continue rendering streaming output where it left off.
function startReattachSubscription({ sessionId, runId, afterSequence, contextSnapshot }) {
  if (!sessionId || !runId) return;
  if (crossTabSubscriptions.has(runId)) return;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const entry = { controller, contextSnapshot: contextSnapshot || {} };
  crossTabSubscriptions.set(runId, entry);

  const dvaApp = getDvaApp();
  const dispatch = dvaApp && dvaApp._store && dvaApp._store.dispatch;

  subscribeToActiveRun({
    sessionId,
    runId,
    afterSequence: afterSequence || 0,
    abortSignal: controller && controller.signal,
    onEvent(event) {
      if (typeof dispatch !== 'function') return;
      dispatch({
        type: 'agent/applyStreamEvent',
        payload: { event, contextSnapshot: contextSnapshot || {} },
      });
    },
  })
    .catch(() => {
      // Run may already be terminal — applyStreamEvent handles the cleanup via
      // the terminal run.status path. Silence is correct here.
    })
    .then(() => {
      crossTabSubscriptions.delete(runId);
    });
}

function stopAllCrossTabSubscriptions() {
  crossTabSubscriptions.forEach(entry => {
    if (entry.controller) {
      try { entry.controller.abort(); } catch (e) { /* ignore */ }
    }
  });
  crossTabSubscriptions.clear();
}

const defaultState = {
  hydrated: false,
  visible: false,
  // AI 助手插件更新信息（来自 platform-plugins 接口的 rainbond-agent 条目）；
  // null 表示无更新或尚未检测。结构见 fetchAgentUpdate effect。
  agentUpdate: null,
  conversationId: 'global-default',
  messages: [],
  draft: '',
  sending: false,
  interactionLocked: false,
  lastError: '',
  pendingApproval: null,
  activeRunId: '',
  lastEventSequence: 0,
  context: {
    view: '',
    enterpriseId: '',
    teamName: '',
    regionName: '',
    appId: '',
    componentId: '',
    componentAlias: '',
    componentSource: '',
    pathname: '',
    routeSignature: '',
    pageTitle: '',
    locale: '',
  },
  lastContextSignature: '',
  workflowState: null,
  structuredResult: null,
  sessionList: [],
  sessionListLoading: false,
  sessionPendingApprovals: [],
  cancellingPending: false,
  cancellingRun: false,
  runConflict: null,
  pendingDraft: '',
  pendingDraftMode: '',
  // F14 — compaction lifecycle slice. Driven by SSE events
  // compaction.started / forced_sync_due_to_pressure / completed / failed.
  compaction: { ...defaultCompactionState },
  pendingMutationTool: '',
  pendingMutationRoute: '',
  pendingMutationNavigationKey: '',
  pendingMutationRefreshKey: '',
  pendingMutationRefreshMode: '',
  lastMutationResult: null,
  lastMutationRunId: '',
  ...createClearedComponentMutationTrackingState(),
  updatedAt: 0,
};

function createMessage(role, kind, content, contextSnapshot = {}, extra = {}) {
  return {
    id: `msg_${role}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    role,
    kind,
    content,
    createdAt: Date.now(),
    contextSnapshot,
    ...extra,
  };
}

const REPLAY_TOOL_DETAIL_LIMIT = 4000;

function formatReplayArguments(rawArgs) {
  if (!rawArgs) return '';
  if (typeof rawArgs === 'object') {
    try { return JSON.stringify(rawArgs, null, 2); } catch (e) { return String(rawArgs); }
  }
  const text = String(rawArgs);
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch (e) { return text; }
}

function formatReplayToolContent(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  try { return JSON.stringify(content, null, 2); } catch (e) { return String(content); }
}

function truncateReplayDetail(text) {
  if (!text || text.length <= REPLAY_TOOL_DETAIL_LIMIT) return text;
  return `${text.slice(0, REPLAY_TOOL_DETAIL_LIMIT)}\n…(truncated)`;
}

function parseToolArgs(rawArgs) {
  if (!rawArgs) return {};
  if (typeof rawArgs === 'object') return rawArgs;
  try { return JSON.parse(String(rawArgs)) || {}; } catch (e) { return {}; }
}

function chatMessagesToBubbles(chatMessages) {
  if (!Array.isArray(chatMessages)) return [];
  const bubbles = [];
  const toolLabelById = {};

  chatMessages.forEach(msg => {
    if (!msg || !msg.role) return;

    if (msg.role === 'user') {
      const text = typeof msg.content === 'string' ? msg.content : '';
      if (text.trim()) bubbles.push(createMessage('user', 'normal', text));
      return;
    }

    if (msg.role === 'assistant') {
      const text = typeof msg.content === 'string' ? msg.content.trim() : '';
      if (text) bubbles.push(createMessage('assistant', 'normal', text));
      if (Array.isArray(msg.tool_calls)) {
        msg.tool_calls.forEach(tc => {
          const fn = (tc && tc.function) || {};
          const rawName = fn.name || 'tool';
          const parsedArgs = parseToolArgs(fn.arguments);
          const label = formatToolLabel(rawName, parsedArgs) || rawName;
          if (tc && tc.id) toolLabelById[tc.id] = label;
          bubbles.push(
            createMessage('assistant', 'trace', '', {}, {
              trace: {
                title: label,
                detail: truncateReplayDetail(formatReplayArguments(fn.arguments)),
              },
            })
          );
        });
      }
      return;
    }

    if (msg.role === 'tool') {
      const label =
        (msg.tool_call_id && toolLabelById[msg.tool_call_id]) || 'tool';
      const detail = truncateReplayDetail(formatReplayToolContent(msg.content));
      bubbles.push(
        createMessage('tool', 'trace', '', {}, {
          trace: { title: `${label} 结果`, detail },
        })
      );
    }
  });

  return bubbles;
}

function normalizePendingApproval(pendingApproval) {
  if (!pendingApproval || typeof pendingApproval !== 'object') {
    return null;
  }

  return {
    approvalId: pendingApproval.approvalId || '',
    description: pendingApproval.description || '',
    risk: pendingApproval.risk || 'medium',
    scope: pendingApproval.scope || '',
    scopeLabel: pendingApproval.scopeLabel || '',
    levelLabel: pendingApproval.levelLabel || '',
    skillId: pendingApproval.skillId || '',
    targetRef: pendingApproval.targetRef || null,
    runId: pendingApproval.runId || '',
    sessionId: pendingApproval.sessionId || '',
    status: pendingApproval.status || 'pending',
    lastSequence: pendingApproval.lastSequence || 0,
  };
}

function buildHydratedState(snapshot) {
  if (!snapshot) {
    return {
      ...defaultState,
      hydrated: true,
    };
  }

  return {
    ...defaultState,
    ...snapshot,
    hydrated: true,
    messages: Array.isArray(snapshot.messages) ? snapshot.messages : [],
    context: snapshot.context || defaultState.context,
    pendingApproval: normalizePendingApproval(snapshot.pendingApproval),
    activeRunId: snapshot.activeRunId || '',
    lastEventSequence: snapshot.lastEventSequence || 0,
    lastContextSignature:
      snapshot.lastContextSignature ||
      getAgentContextSignature(snapshot.context || defaultState.context),
    workflowState: snapshot.workflowState || null,
    structuredResult: snapshot.structuredResult || null,
    pendingMutationTool: snapshot.pendingMutationTool || '',
    pendingMutationRoute: snapshot.pendingMutationRoute || '',
    pendingMutationNavigationKey: snapshot.pendingMutationNavigationKey || '',
    pendingMutationRefreshKey: snapshot.pendingMutationRefreshKey || '',
    pendingMutationRefreshMode: snapshot.pendingMutationRefreshMode || '',
    lastMutationResult: snapshot.lastMutationResult || null,
    lastMutationRunId: snapshot.lastMutationRunId || '',
    lastComponentMutationAlias: snapshot.lastComponentMutationAlias || '',
    lastComponentMutationAppId: snapshot.lastComponentMutationAppId || '',
    lastComponentMutationTeamName: snapshot.lastComponentMutationTeamName || '',
    lastComponentMutationRegionName: snapshot.lastComponentMutationRegionName || '',
    lastComponentMutationTool: snapshot.lastComponentMutationTool || '',
    sessionList: [],
    sessionListLoading: false,
    sessionPendingApprovals: [],
    cancellingPending: false,
    cancellingRun: false,
    runConflict: null,
    pendingDraft: '',
    pendingDraftMode: '',
    sending: false,
    interactionLocked: false,
    lastError: '',
    // F14 — never resurrect a stale "compressing" banner from a persisted
    // snapshot; the lifecycle is per-run and must reset on hydrate.
    compaction: { ...defaultCompactionState },
  };
}

function getErrorMessage(error) {
  if (!error) {
    return '消息发送失败，请稍后重试。';
  }

  if (typeof error === 'string') {
    return error;
  }

  return error.message || '消息发送失败，请稍后重试。';
}

// sendMessage 失败时给用户看的提示：用大白话说清发生了什么、能怎么办，按错误类型
// 给可操作的建议，不把后端英文报错 / 技术术语堆到界面上。完整技术细节（status /
// message / responseBody）走 console.error，留给开发与支持排查，二者职责分离。
function getSendErrorMessage(error) {
  const status = error && error.status;
  if (status === 401 || status === 403) {
    return '登录状态可能已失效，请刷新页面后重试。';
  }
  if (status === 429) {
    return '请求过于频繁，请稍候片刻再发送。';
  }
  if (status >= 500) {
    // 502/503/504 等：console→插件后端这一跳异常，附错误码方便用户向支持报障。
    return `AI 助手服务暂时不可用，请稍后重试（错误码 ${status}）。`;
  }
  if (status) {
    return `消息发送失败，请稍后重试（错误码 ${status}）。`;
  }
  // 无 HTTP 状态码：fetch 失败 / SSE 流被中途断开，长任务执行较久时尤其常见。
  return '网络连接已中断，可能是任务处理时间较长，请稍后重试。';
}

function buildMutationNavigationPayload(toolName, route) {
  if (!toolName || !route) {
    return null;
  }

  return {
    pendingMutationTool: toolName,
    pendingMutationRoute: route,
    pendingMutationNavigationKey: `${toolName}_${Date.now()}`,
  };
}

function buildMutationRefreshPayload(toolName, mode = 'content') {
  if (!toolName) {
    return null;
  }

  return {
    pendingMutationRefreshKey: `${toolName}_${Date.now()}`,
    pendingMutationRefreshMode: mode,
  };
}

function findApprovalMessageIndex(messages, approvalId) {
  return messages.findIndex(
    item => item && item.kind === 'approval' && item.approval && item.approval.approvalId === approvalId
  );
}

function findLatestAssistantNormalMessageIndex(messages) {
  for (let index = (messages || []).length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item && item.role === 'assistant' && item.kind === 'normal') {
      return index;
    }
  }
  return -1;
}

function applyAgentEvents({
  messages,
  events,
  contextSnapshot,
  currentPendingApproval,
  currentLastMutationResult,
  currentLastMutationRunId,
}) {
  const baseMessages = Array.isArray(messages) ? messages : [];
  let nextMessages = baseMessages;
  let messagesCloned = false;
  const ensureMutableMessages = () => {
    if (!messagesCloned) {
      nextMessages = baseMessages.slice();
      messagesCloned = true;
    }
    return nextMessages;
  };
  let pendingApproval = normalizePendingApproval(currentPendingApproval);
  let lastEventSequence = 0;
  let lastMutationResult = currentLastMutationResult || null;
  let lastMutationRunId = currentLastMutationRunId || '';

  events.forEach(event => {
    const adaptedEvent = adaptAgentEvent(event);
    if (!adaptedEvent || !adaptedEvent.type) {
      return;
    }

    const eventSequence = adaptedEvent.sequence || 0;
    if (eventSequence > lastEventSequence) {
      lastEventSequence = eventSequence;
    }

    switch (adaptedEvent.type) {
      case 'trace': {
        const traceData = (event && event.data) || {};
        if (
          traceData.tool_name &&
          isSupportedAgentMutationTool(traceData.tool_name) &&
          traceData.output
        ) {
          lastMutationResult = {
            toolName: traceData.tool_name,
            output: traceData.output,
            sequence: eventSequence,
          };
          lastMutationRunId = event.runId || '';
        }
        applyTraceEvent(
          ensureMutableMessages(),
          event,
          contextSnapshot,
          eventSequence,
          createMessage
        );
        break;
      }
      case 'message_started':
      case 'message_delta':
      case 'message_completed':
      case 'message_reasoning_started':
      case 'message_reasoning_delta':
      case 'message_reasoning_completed': {
        const streamedMessages = applyStreamingAssistantEvent(
          nextMessages,
          event,
          createMessage,
          contextSnapshot
        );
        nextMessages = streamedMessages;
        messagesCloned = true;
        break;
      }
      case 'message': {
        if (adaptedEvent.messageId) {
          const streamedMessages = applyStreamingAssistantEvent(
            nextMessages,
            {
              type: 'chat.message',
              data: {
                message_id: adaptedEvent.messageId,
                role: adaptedEvent.role,
                content: adaptedEvent.content,
              },
            },
            createMessage,
            contextSnapshot
          );
          const matchedIndex = streamedMessages.findIndex(
            item => item && item.streamMessageId === adaptedEvent.messageId
          );
          if (matchedIndex > -1) {
            nextMessages = streamedMessages;
            messagesCloned = true;
            break;
          }
        }
        ensureMutableMessages().push(
          createMessage(
            adaptedEvent.role === 'user' ? 'user' : 'assistant',
            'normal',
            adaptedEvent.content || '',
            contextSnapshot,
            { eventSequence }
          )
        );
        break;
      }
      case 'suggested_actions': {
        const assistantMessageIndex = findLatestAssistantNormalMessageIndex(nextMessages);
        if (assistantMessageIndex > -1) {
          const mutableMessages = ensureMutableMessages();
          mutableMessages[assistantMessageIndex] = {
            ...mutableMessages[assistantMessageIndex],
            suggestedActions: Array.isArray(adaptedEvent.actions)
              ? adaptedEvent.actions
              : [],
            suggestedActionSummary: adaptedEvent.summary || '后续建议',
            eventSequence,
          };
        } else {
          ensureMutableMessages().push(
            createMessage(
              'system',
              'suggested_actions',
              adaptedEvent.summary || '后续建议',
              contextSnapshot,
              {
                suggestedActions: Array.isArray(adaptedEvent.actions)
                  ? adaptedEvent.actions
                  : [],
                eventSequence,
              }
            )
          );
        }
        break;
      }
      case 'approval_requested': {
        pendingApproval = {
          approvalId: adaptedEvent.approvalId || '',
          description: adaptedEvent.description || '',
          risk: adaptedEvent.risk || 'medium',
          scope: adaptedEvent.scope || '',
          scopeLabel: adaptedEvent.scopeLabel || '',
          levelLabel: adaptedEvent.levelLabel || '',
          skillId: adaptedEvent.skillId || '',
          targetRef: adaptedEvent.targetRef || null,
          runId: adaptedEvent.runId || '',
          sessionId: adaptedEvent.sessionId || '',
          status: 'pending',
          lastSequence: eventSequence,
        };

        // Dedupe: skip if a message with this approvalId already exists.
        // Multiple SSE streams (e.g. sendMessage stream + decideAgentApproval
        // stream) can deliver the same approval.requested event; only the
        // first push should create a UI card.
        const existingApprovalIndex = findApprovalMessageIndex(
          nextMessages,
          pendingApproval.approvalId
        );
        if (existingApprovalIndex === -1) {
          ensureMutableMessages().push(
            createMessage(
              'system',
              'approval',
              adaptedEvent.description || '待审批操作',
              contextSnapshot,
              {
                approval: pendingApproval,
                eventSequence,
              }
            )
          );
        }
        break;
      }
      case 'approval_resolved': {
        const approvalId = adaptedEvent.approvalId;
        const index = findApprovalMessageIndex(nextMessages, approvalId);
        if (index > -1) {
          const mutableMessages = ensureMutableMessages();
          mutableMessages[index] = {
            ...mutableMessages[index],
            approval: {
              ...(mutableMessages[index].approval || {}),
              approvalId,
              status: adaptedEvent.status || 'approved',
              lastSequence: eventSequence,
            },
          };
        }
        if (pendingApproval && pendingApproval.approvalId === approvalId) {
          pendingApproval = null;
        }
        break;
      }
      case 'run_status': {
        if (adaptedEvent.status === 'cancelled') {
          ensureMutableMessages().push(
            createMessage(
              'system',
              'status',
              '本次操作已取消。',
              contextSnapshot,
              { eventSequence }
            )
          );
        } else if (adaptedEvent.status === 'error') {
          ensureMutableMessages().push(
            createMessage(
              'system',
              'error',
              '执行过程中发生错误，请稍后重试。',
              contextSnapshot,
              { eventSequence }
            )
          );
        }
        if (pendingApproval && adaptedEvent.status === 'waiting_approval') {
          pendingApproval = {
            ...pendingApproval,
            lastSequence: eventSequence,
          };
        }
        break;
      }
      case 'run_error': {
        ensureMutableMessages().push(
          createMessage(
            'system',
            'error',
            adaptedEvent.message || '执行过程中发生错误，请稍后重试。',
            contextSnapshot,
            { eventSequence }
          )
        );
        break;
      }
      case 'workflow.selected': {
        ensureMutableMessages().push(
          createMessage(
            'system',
            'status',
            `已进入流程 ${((event.data || {}).workflow_name || 'workflow')}`,
            contextSnapshot,
            { eventSequence }
          )
        );
        break;
      }
      case 'workflow.stage': {
        ensureMutableMessages().push(
          createMessage(
            'system',
            'status',
            `当前阶段：${((event.data || {}).workflow_stage || 'unknown')}`,
            contextSnapshot,
            { eventSequence }
          )
        );
        break;
      }
      case 'workflow.completed': {
        const structuredResult =
          event.data && event.data.structured_result
            ? event.data.structured_result
            : {};
        const suggestedActions = Array.isArray(structuredResult.suggestedActions)
          ? structuredResult.suggestedActions
          : [];
        if (suggestedActions.length > 0) {
          const assistantMessageIndex = findLatestAssistantNormalMessageIndex(nextMessages);
          if (
            assistantMessageIndex > -1 &&
            !nextMessages[assistantMessageIndex].suggestedActions
          ) {
            const mutableMessages = ensureMutableMessages();
            mutableMessages[assistantMessageIndex] = {
              ...mutableMessages[assistantMessageIndex],
              suggestedActions,
              suggestedActionSummary: '后续建议',
              eventSequence,
            };
          }
        }
        break;
      }
      default:
        break;
    }
  });

  return {
    messages: nextMessages,
    pendingApproval,
    lastEventSequence,
    lastMutationResult,
    lastMutationRunId,
    ...extractWorkflowState(events),
  };
}

function applyAgentStreamEvent(state, payload) {
  const merged = applyAgentEvents({
    messages: state.messages,
    events: [payload.event],
    contextSnapshot: payload.contextSnapshot || state.context || {},
    currentPendingApproval: state.pendingApproval,
    currentLastMutationResult: state.lastMutationResult,
    currentLastMutationRunId: state.lastMutationRunId,
  });

  // F14 — fold the same event through the compaction reducer so the UI
  // can render a "compressing" banner for the duration of the pass.
  const nextCompaction = applyCompactionEvent(
    state.compaction || defaultCompactionState,
    payload && payload.event
  );

  return {
    interactionLocked: getNextInteractionLocked(
      state.interactionLocked,
      payload && payload.event
    ),
    messages: merged.messages,
    pendingApproval: merged.pendingApproval,
    lastEventSequence: merged.lastEventSequence || state.lastEventSequence,
    lastMutationResult: merged.lastMutationResult || state.lastMutationResult,
    lastMutationRunId: merged.lastMutationRunId || state.lastMutationRunId,
    workflowState: merged.workflowState || state.workflowState,
    structuredResult: merged.structuredResult || state.structuredResult,
    compaction: nextCompaction,
  };
}

export default {
  namespace: 'agent',

  state: defaultState,

  effects: {
    *checkAccess({ callback }, { call }) {
      try {
        const response = yield call(getAgentAccess);
        if (callback) {
          callback(response);
        }
      } catch (e) {
        if (callback) {
          callback(null, e);
        }
      }
    },

    // 检测 AI 助手插件（rainbond-agent）是否有可升级版本。
    // 静默调用 platform-plugins 接口（showMessage/showLoading 关闭），失败即视为"无更新"，
    // 绝不阻塞或干扰顶栏。命中第一个"已安装且可升级"的条目即记录其升级跳转所需信息。
    *fetchAgentUpdate({ payload }, { call, put }) {
      const enterpriseId = payload && payload.enterprise_id;
      const regionNames = Array.isArray(payload && payload.region_names)
        ? payload.region_names.filter(Boolean)
        : [];

      if (!enterpriseId || !regionNames.length) {
        yield put({ type: 'saveAgentUpdate', payload: null });
        return;
      }

      let agentEntry = null;
      for (let i = 0; i < regionNames.length; i += 1) {
        const regionName = regionNames[i];
        let response = null;
        try {
          response = yield call(
            getEnterprisePluginList,
            { enterprise_id: enterpriseId, region_name: regionName },
            () => {},
            { showMessage: false, showLoading: false }
          );
        } catch (e) {
          response = null;
        }

        const list = (response && response.list) || [];
        const found = list.find(
          item =>
            isPluginBaseId(item, 'rainbond-agent') &&
            item.installed === true &&
            item.upgradeable === true
        );
        if (found) {
          agentEntry = { ...found, region_name: regionName };
          break;
        }
      }

      if (!agentEntry) {
        yield put({ type: 'saveAgentUpdate', payload: null });
        return;
      }

      yield put({
        type: 'saveAgentUpdate',
        payload: {
          upgradeable: true,
          installedVersion: agentEntry.installed_version || '',
          latestVersion: agentEntry.latest_version || '',
          appId: agentEntry.app_id,
          teamName: agentEntry.team_name || '',
          regionName: agentEntry.region_name || ''
        }
      });
    },

    *hydrateSession({ payload }, { call, put }) {
      const userId = payload && payload.userId;
      const snapshot = yield call(hydrateAgentSession, userId);
      yield put({
        type: 'hydrateState',
        payload: snapshot,
      });

      // If the page was refreshed while a run was in-flight, auto-reattach to
      // the SSE stream instead of surfacing a "another window" conflict dialog.
      const restoredRunId = snapshot && snapshot.activeRunId;
      const restoredSessionId = snapshot && snapshot.conversationId;
      if (restoredRunId && restoredSessionId && restoredSessionId !== 'global-default') {
        yield put({ type: 'saveState', payload: { sending: true } });
        startReattachSubscription({
          sessionId: restoredSessionId,
          runId: restoredRunId,
          afterSequence: (snapshot && snapshot.lastEventSequence) || 0,
          contextSnapshot: snapshot && snapshot.context,
        });
      }
    },

    *loadSessionList(_, { call, put }) {
      yield put({ type: 'saveState', payload: { sessionListLoading: true } });
      try {
        const res = yield call(listAgentSessions, { limit: 20 });
        const list = (res && res.data) || [];
        yield put({
          type: 'saveState',
          payload: { sessionList: list, sessionListLoading: false },
        });
      } catch (e) {
        yield put({
          type: 'saveState',
          payload: { sessionListLoading: false, lastError: getErrorMessage(e) || '加载历史失败' },
        });
      }
    },

    *removeSession({ payload }, { call, put, select }) {
      const sessionId = payload && payload.sessionId;
      if (!sessionId) return;
      try {
        yield call(deleteAgentSession, sessionId);
      } catch (e) {
        yield put({ type: 'saveState', payload: { lastError: getErrorMessage(e) || '删除失败' } });
        return;
      }
      const state = yield select(s => s.agent);
      const nextList = (state.sessionList || []).filter(it => it.session_id !== sessionId);
      const patch = { sessionList: nextList };
      if (state.conversationId === sessionId) {
        patch.conversationId = 'global-default';
        patch.messages = [];
        patch.pendingApproval = null;
        patch.activeRunId = '';
        patch.lastEventSequence = 0;
        patch.workflowState = null;
        patch.structuredResult = null;
        patch.draft = '';
        patch.lastError = '';
        patch.pendingMutationTool = '';
        patch.pendingMutationRoute = '';
        patch.pendingMutationNavigationKey = '';
        patch.pendingMutationRefreshKey = '';
        patch.pendingMutationRefreshMode = '';
        patch.lastMutationResult = null;
        patch.lastMutationRunId = '';
        Object.assign(patch, createClearedComponentMutationTrackingState());
      }
      yield put({ type: 'saveState', payload: patch });
    },

    *switchSession({ payload }, { call, put }) {
      const sessionId = payload && payload.sessionId;
      if (!sessionId) return;
      yield put({
        type: 'saveState',
        payload: {
          conversationId: sessionId,
          messages: [],
          draft: '',
          pendingApproval: null,
          activeRunId: '',
          lastEventSequence: 0,
          lastError: '',
          workflowState: null,
          structuredResult: null,
          sessionPendingApprovals: [],
          pendingMutationTool: '',
          pendingMutationRoute: '',
          pendingMutationNavigationKey: '',
          pendingMutationRefreshKey: '',
          pendingMutationRefreshMode: '',
          lastMutationResult: null,
          lastMutationRunId: '',
          ...createClearedComponentMutationTrackingState(),
        },
      });

      try {
        const res = yield call(loadAgentSessionMessages, sessionId);
        const data = (res && res.data) || {};
        const replayed = chatMessagesToBubbles(data.messages || []);
        yield put({
          type: 'saveState',
          payload: {
            messages: replayed,
            sessionPendingApprovals: Array.isArray(data.pending_approvals)
              ? data.pending_approvals
              : [],
          },
        });
      } catch (e) {
        yield put({
          type: 'saveState',
          payload: { lastError: getErrorMessage(e) || '加载历史消息失败' },
        });
      }
    },

    *cancelSessionPending(_, { call, put, select }) {
      const state = yield select(s => s.agent);
      const sessionId = state.conversationId;
      if (!sessionId || sessionId === 'global-default') return;
      yield put({ type: 'saveState', payload: { cancellingPending: true } });
      try {
        yield call(cancelAgentSessionPending, sessionId);
        yield put({
          type: 'saveState',
          payload: { sessionPendingApprovals: [], cancellingPending: false },
        });
      } catch (e) {
        yield put({
          type: 'saveState',
          payload: {
            cancellingPending: false,
            lastError: getErrorMessage(e) || '取消未处理审批失败',
          },
        });
      }
    },

    *syncContext({ payload }, { put, select }) {
      const context = payload || {};
      const state = yield select(store => store.agent);
      const nextSignature = getAgentContextSignature(context);
      const currentSignature = state.lastContextSignature || '';
      const isChanged = !!currentSignature && currentSignature !== nextSignature;
      const nextMessages = isChanged
        ? state.messages.concat(
            createMessage(
              'system',
              'context',
              formatAgentContextMessage(context),
              context
            )
          )
        : state.messages;

      if (
        currentSignature !== nextSignature ||
        JSON.stringify(state.context || {}) !== JSON.stringify(context || {})
      ) {
        yield put({
          type: 'saveState',
          payload: {
            context,
            lastContextSignature: nextSignature,
            messages: nextMessages,
            updatedAt: Date.now(),
          },
        });
      }
    },

    *sendMessage({ payload }, { call, put, select }) {
      const rootState = yield select(store => store);
      const state = rootState.agent;
      const currentUser = rootState.user && rootState.user.currentUser;
      const text = ((payload && payload.message) || state.draft || '').trim();
      if (!text) {
        return;
      }

      const contextSnapshot = (payload && payload.context) || state.context || {};
      captureAgentRetentionEvent('agent_question_created', {
        sessionId: state.conversationId,
        action_type: 'agent_question'
      });
      const suppressUserEcho = !!(payload && payload.suppressUserEcho);
      const pendingMessages = suppressUserEcho
        ? state.messages
        : state.messages.concat(
            createMessage('user', 'normal', text, contextSnapshot)
          );

      yield put({
        type: 'saveState',
        payload: {
          messages: pendingMessages,
          draft: '',
          sending: true,
          interactionLocked: true,
          lastError: '',
          pendingMutationTool: '',
          pendingMutationRoute: '',
          pendingMutationNavigationKey: '',
          pendingMutationRefreshKey: '',
          pendingMutationRefreshMode: '',
          lastMutationResult: null,
          lastMutationRunId: '',
          ...createClearedComponentMutationTrackingState(),
          updatedAt: Date.now(),
        },
      });

      try {
        const dvaApp = getDvaApp();
        const storeDispatch = dvaApp && dvaApp._store && dvaApp._store.dispatch;
        const response = yield call(sendAgentMessage, {
          conversation_id: state.conversationId,
          message: text,
          selectedActionId: payload && payload.selectedActionId,
          selectedActionKey: payload && payload.selectedActionKey,
          context: contextSnapshot,
          currentUser,
          // P0-3 step 5: surface both conversationId and activeRunId the
          // moment the POST returns. Without conversationId, abortRun's
          // early-return (sessionId === 'global-default') swallows the
          // click silently. Both fields drive UI state during the stream.
          onRunStarted: started => {
            const startedSessionId = started && started.sessionId;
            const startedRunId = started && started.runId;
            if (storeDispatch && startedRunId) {
              storeDispatch({
                type: 'agent/saveState',
                payload: {
                  ...(startedSessionId
                    ? { conversationId: startedSessionId }
                    : {}),
                  activeRunId: startedRunId,
                },
              });
            }
          },
          onEvent: event => {
            if (storeDispatch) {
              storeDispatch({
                type: 'agent/applyStreamEvent',
                payload: {
                  event,
                  contextSnapshot,
                },
              });
            }
          },
        });

        yield put({
          type: 'saveState',
          payload: {
            conversationId: (response && response.sessionId) || state.conversationId,
            activeRunId: (response && response.runId) || state.activeRunId,
            sending: false,
            updatedAt: Date.now(),
          },
        });
      } catch (error) {
        // Rich 409 conflict: another run is in progress in another tab.
        // 409 是预期内的跨标签页控制流，不算故障，留给下面分支处理、不打日志。
        if (error && error.status === 409 && error.responseBody) {
          const body = error.responseBody;
          const currentRun = (body && body.current_run) || {};
          // Roll back the optimistic user echo so the conflict UI controls re-send.
          //
          // interactionLocked must drop back to false here: sendMessage set
          // it true on entry, and the appViewportLock overlay (transparent,
          // pointer-events: auto) keeps capturing clicks while it's true —
          // which silently swallows clicks on the conflict-notice buttons
          // and makes them look completely unresponsive.
          yield put({
            type: 'saveState',
            payload: {
              messages: state.messages,
              sending: false,
              interactionLocked: false,
              lastError: '',
              runConflict: {
                currentRun: {
                  runId: currentRun.run_id || '',
                  startedAt: currentRun.started_at || '',
                  status: currentRun.status || '',
                  userMessageExcerpt: currentRun.user_message_excerpt || '',
                  iteration: currentRun.iteration || 0,
                  currentPhase: currentRun.current_phase || '',
                },
                retryAfterSeconds: body.retry_after_seconds || 0,
                receivedAt: Date.now(),
              },
              pendingDraft: text,
              pendingDraftMode: '',
              draft: '',
              updatedAt: Date.now(),
            },
          });
          // F5 — open an SSE stream to the foreign run so we observe its
          // terminal status. applyStreamEvent's existing auto-flush logic
          // will pick up pendingDraft and send once we see done/cancelled/error.
          const conflictSessionId =
            error.sessionId || body.session_id || state.conversationId;
          if (conflictSessionId && currentRun.run_id) {
            startCrossTabRunSubscription({
              sessionId: conflictSessionId,
              runId: currentRun.run_id,
              contextSnapshot: state.context,
            });
          }
          return;
        }

        // 把真实错误打到控制台，否则界面只剩一句通用话术、无从排查。
        // 包含 HTTP status / message / responseBody，定位服务端报错或流式中断。
        // eslint-disable-next-line no-console
        console.error('[RainAgent] sendMessage failed:', error);
        captureAgentRetentionEvent('agent_run_failed', {
          sessionId: state.conversationId,
          runId: state.activeRunId,
          status: 'send_failed',
          error_category: 'send_message_failed',
          error_code: error && (error.status || error.code || error.name)
        });
        yield put({
          type: 'saveState',
          payload: {
            sending: false,
            interactionLocked: false,
            lastError: getSendErrorMessage(error),
            updatedAt: Date.now(),
          },
        });
      }
    },

    *abortRun({ payload }, { call, put, select }) {
      const state = yield select(s => s.agent);
      const hideAfterAbort = !!(payload && payload.hideAfterAbort);
      const sessionId =
        (payload && payload.sessionId) ||
        state.conversationId;
      const runId =
        (payload && payload.runId) ||
        state.activeRunId;

      if (!sessionId || sessionId === 'global-default' || !runId) {
        return;
      }

      yield put({ type: 'saveState', payload: { cancellingRun: true } });

      try {
        const result = yield call(abortAgentRun, { sessionId, runId });
        if (result && (result.status === 202 || result.status === 404)) {
          yield put({
            type: 'saveState',
            payload: {
              visible: hideAfterAbort ? false : state.visible,
              cancellingRun: false,
              sending: false,
              interactionLocked: false,
              activeRunId: '',
              updatedAt: Date.now(),
            },
          });
        }
      } catch (e) {
        // Backend abort failed (e.g. 500). The run may still be alive
        // server-side, but the user's intent is to escape the thinking
        // state — release UI lock the same way as the success path so
        // they aren't stuck. lastError surfaces the failure as a toast.
        yield put({
          type: 'saveState',
          payload: {
            visible: hideAfterAbort ? false : state.visible,
            cancellingRun: false,
            sending: false,
            interactionLocked: false,
            activeRunId: '',
            updatedAt: Date.now(),
            lastError:
              getErrorMessage(e) || '停止运行失败，服务端可能仍在执行',
          },
        });
      }
    },

    *clearConversation({ payload }, { call, put, select }) {
      const userId = payload && payload.userId;
      const state = yield select(s => s.agent);

      // Z2 — DVA state may still hold the 'global-default' sentinel even
      // when sessionStorage has a real sessionId persisted from a prior
      // turn (hot reload, fresh tab hydrating an existing session, etc).
      // Always try sessionStorage as a fallback so the backend DELETE
      // actually fires; otherwise zombie sessions accumulate.
      const hydrateSnapshot = userId
        ? yield call(hydrateAgentSession, userId)
        : null;
      const targetSessionId = resolveClearTargetSessionId({
        conversationId: state.conversationId,
        hydrateSnapshot,
      });

      if (targetSessionId) {
        try {
          yield call(clearAgentSessionRemote, targetSessionId);
        } catch (e) {
          yield put({
            type: 'saveState',
            payload: { lastError: getErrorMessage(e) || '清空会话失败' },
          });
          return;
        }
      }

      // F5 — clearing the conversation tears down any cross-tab observer.
      stopAllCrossTabSubscriptions();
      // Clear local sessionStorage cache + reset DVA state.
      yield call(clearAgentSession, userId);
      yield put({
        type: 'clearState',
        payload: { preserveVisible: true },
      });
    },

    *stopAndSendMine(_, { call, put, select }) {
      const state = yield select(s => s.agent);
      const conflict = state.runConflict;
      if (!conflict || !conflict.currentRun || !conflict.currentRun.runId) {
        return;
      }

      const sessionId = state.conversationId;
      const runId = conflict.currentRun.runId;
      const stashedText = state.pendingDraft || '';

      yield put({
        type: 'saveState',
        payload: { pendingDraftMode: 'stop_and_send', cancellingRun: true },
      });

      try {
        // Force-cancel (not abort): synchronous server-side clear that runs
        // the recovery truncation protocol and commits the terminal status
        // before returning. Abort was 202-async — it only flipped status once
        // a live executor reached a checkpoint, so a wedged/zombie run (e.g.
        // its executor crashed) never went terminal and the sendMessage below
        // 409'd forever. A 200 here means the foreign run is already terminal.
        yield call(forceCancelAgentRun, { sessionId, runId });
      } catch (e) {
        // Foreign-run force-cancel failed (e.g. 500). Tear down the conflict
        // UI so the user can decide their next move instead of being
        // stuck on the dialog. Do NOT auto-send their stashed draft —
        // the foreign run may still be alive server-side.
        stopAllCrossTabSubscriptions();
        yield put({
          type: 'saveState',
          payload: {
            cancellingRun: false,
            pendingDraftMode: '',
            runConflict: null,
            lastError:
              getErrorMessage(e) ||
              '停止其他窗口运行失败，服务端可能仍在执行',
          },
        });
        return;
      }

      // force-cancel returned 200 — the foreign run is now terminal. Stop
      // watching it and send directly; no need to wait for an SSE terminal
      // event (stream may have dropped on refresh) and no 409 race remains.
      stopAllCrossTabSubscriptions();
      yield put({
        type: 'saveState',
        payload: {
          pendingDraft: '',
          pendingDraftMode: '',
          cancellingRun: false,
          runConflict: null,
        },
      });
      if (stashedText) {
        yield put({
          type: 'sendMessage',
          payload: { message: stashedText, context: state.context },
        });
      }
    },

    *keepWaiting(_, { put }) {
      yield put({
        type: 'saveState',
        payload: {
          runConflict: null,
          pendingDraftMode: 'wait',
        },
      });
    },

    *cancelMyInput(_, { put, select }) {
      const state = yield select(s => s.agent);
      const stashed = state.pendingDraft || '';
      // F5 — user backed out, no need to keep watching the foreign run.
      stopAllCrossTabSubscriptions();
      yield put({
        type: 'saveState',
        payload: {
          runConflict: null,
          pendingDraft: '',
          pendingDraftMode: '',
          draft: stashed || state.draft || '',
          interactionLocked: false,
          sending: false,
          activeRunId: '',
          cancellingRun: false,
        },
      });
    },

    *sendMockMessage({ payload }, { put }) {
      yield put({
        type: 'sendMessage',
        payload,
      });
    },

    *resolveApproval({ payload }, { call, put, select }) {
      const rootState = yield select(store => store);
      const state = rootState.agent;
      const currentUser = rootState.user && rootState.user.currentUser;
      const pendingApproval = state.pendingApproval;

      if (!pendingApproval || !pendingApproval.approvalId) {
        return;
      }

      yield put({
        type: 'saveState',
        payload: {
          sending: true,
          interactionLocked: true,
          lastError: '',
        },
      });

      try {
        const dvaApp = getDvaApp();
        const storeDispatch = dvaApp && dvaApp._store && dvaApp._store.dispatch;
        const response = yield call(decideAgentApproval, {
          approvalId: pendingApproval.approvalId,
          decision: payload && payload.decision,
          comment: payload && payload.comment,
          sessionId: pendingApproval.sessionId || state.conversationId,
          runId: pendingApproval.runId || state.activeRunId,
          afterSequence: pendingApproval.lastSequence || state.lastEventSequence,
          context: state.context,
          currentUser,
          onEvent: event => {
            if (storeDispatch) {
              storeDispatch({
                type: 'agent/applyStreamEvent',
                payload: {
                  event,
                  contextSnapshot: state.context || {},
                },
              });
            }
          },
        });

        yield put({
          type: 'saveState',
          payload: {
            sending: false,
            lastError: '',
            updatedAt: Date.now(),
          },
        });
      } catch (error) {
        yield put({
          type: 'saveState',
          payload: {
            sending: false,
            interactionLocked: false,
            lastError: getErrorMessage(error),
            updatedAt: Date.now(),
          },
        });
      } finally {
        if (payload && payload.autoApprovalId) {
          inFlightAutoApprovals.release(payload.autoApprovalId);
        }
      }
    },

    *applyStreamEvent({ payload }, { put, select }) {
      const rootState = yield select(store => store);
      const prevState = rootState.agent;
      const prevApprovalId =
        (prevState.pendingApproval && prevState.pendingApproval.approvalId) || '';
      const adaptedEvent = adaptAgentEvent(payload && payload.event);
      const isDuplicateMutationTrace =
        !!(
          adaptedEvent &&
          adaptedEvent.type === 'trace' &&
          prevState.lastMutationResult &&
          prevState.lastMutationResult.sequence === adaptedEvent.sequence &&
          payload &&
          payload.event &&
          payload.event.data &&
          prevState.lastMutationResult.toolName === payload.event.data.tool_name
        );

      yield put({
        type: 'applyStreamEventReducer',
        payload,
      });

      // Detect run-terminal status from this event so we can flush a pending
      // user draft that was stashed via the 409 conflict UI.
      const incomingEvent = payload && payload.event;
      const incomingType = incomingEvent && incomingEvent.type;
      const incomingData = (incomingEvent && incomingEvent.data) || {};
      const isRunTerminal =
        incomingType === 'run.status' &&
        ['cancelled', 'done', 'error', 'completed', 'failed'].indexOf(incomingData.status) > -1;
      if (
        incomingType === 'run.error' ||
        (incomingType === 'run.status' && ['error', 'failed'].indexOf(incomingData.status) > -1)
      ) {
        captureAgentRetentionEvent('agent_run_failed', {
          sessionId: incomingEvent && incomingEvent.sessionId,
          runId: incomingEvent && incomingEvent.runId,
          status: incomingData.status || 'error',
          error_category: incomingType === 'run.error' ? 'run_error' : 'run_failed',
          error_code: incomingData.code || incomingData.error_code || ''
        });
      }

      if (isRunTerminal) {
        const flushedState = yield select(store => store.agent);
        const stashedText = flushedState.pendingDraft || '';
        const mode = flushedState.pendingDraftMode || '';
        if (stashedText && (mode === 'wait' || mode === 'stop_and_send')) {
          yield put({
            type: 'saveState',
            payload: {
              pendingDraft: '',
              pendingDraftMode: '',
              cancellingRun: false,
              runConflict: null,
            },
          });
          yield put({
            type: 'sendMessage',
            payload: {
              message: stashedText,
              context: flushedState.context,
            },
          });
        } else if (flushedState.cancellingRun) {
          yield put({
            type: 'saveState',
            payload: { cancellingRun: false },
          });
        } else if (flushedState.sending) {
          // Run terminated after a page-refresh reattach: clear the sending
          // lock and activeRunId that hydrateSession set.
          yield put({
            type: 'saveState',
            payload: { sending: false, activeRunId: '' },
          });
        }
      }

      const nextRootState = yield select(store => store);
      const nextState = nextRootState.agent;
      const pa = nextState.pendingApproval;

      if (
        adaptedEvent &&
        adaptedEvent.type === 'approval_requested' &&
        pa &&
        pa.approvalId &&
        pa.status === 'pending' &&
        pa.approvalId !== prevApprovalId
      ) {
        const componentMutationTrackingPatch = buildComponentMutationTrackingPatch({
          toolName: pa.skillId,
          context: nextState.context,
          targetRef: pa.targetRef,
        });
        yield put({
          type: 'saveState',
          payload: {
            pendingMutationTool: pa.skillId || '',
            pendingMutationRoute: '',
            pendingMutationNavigationKey: '',
            ...componentMutationTrackingPatch,
          },
        });
      }

      if (
        adaptedEvent &&
        adaptedEvent.type === 'trace' &&
        payload &&
        payload.event &&
        payload.event.data &&
        shouldHandleApprovedMutationTrace({
          toolName: payload.event.data.tool_name,
          pendingMutationTool: prevState.pendingMutationTool,
        }) &&
        payload.event.data.output &&
        !isDuplicateMutationTrace
      ) {
        const mutationToolName =
          payload.event.data.tool_name || prevState.pendingMutationTool;
        const resultPayload =
          payload.event.data.output &&
          payload.event.data.output.structuredContent
            ? payload.event.data.output.structuredContent
            : payload.event.data.output || null;
        const resultRef = resultPayload && resultPayload.result_ref
          ? resultPayload.result_ref
          : null;
        const shouldRefreshContent = shouldUseSlidePanelContentRefresh(
          mutationToolName
        );
        const shouldRefreshRoute = shouldUseRouteQueryRefresh(
          mutationToolName
        );
        const shouldFinalizeComponentMutation = shouldFinalizeToComponentOverview(
          mutationToolName
        );

        if (shouldFinalizeComponentMutation) {
          const route = resolvePostActionRoute({
            toolName: mutationToolName,
            context: nextState.context,
            appDetail: nextRootState.appControl && nextRootState.appControl.appDetail,
            result: resultPayload,
            resultRef,
          });
          const navigationPayload = buildMutationNavigationPayload(
            mutationToolName,
            route
          );
          const refreshPayload = navigationPayload
            ? null
            : buildMutationRefreshPayload(
                mutationToolName,
                shouldRefreshRoute ? 'route' : 'content'
              );
          const componentMutationTrackingPatch =
            buildComponentMutationTrackingPatchFromResult(nextState, {
              toolName: mutationToolName,
              context: nextState.context,
              targetRef: resultRef,
            });
          yield put({
            type: 'saveState',
            payload: {
              ...(navigationPayload || {}),
              ...(refreshPayload || {}),
              ...componentMutationTrackingPatch,
              updatedAt: Date.now(),
            },
          });
        } else if (shouldRefreshContent) {
          const refreshPayload = buildMutationRefreshPayload(
            mutationToolName,
            'content'
          );
          yield put({
            type: 'saveState',
            payload: {
              pendingMutationTool: '',
              pendingMutationRoute: '',
              pendingMutationNavigationKey: '',
              ...(refreshPayload || {}),
              updatedAt: Date.now(),
            },
          });
        } else if (shouldRefreshRoute) {
          const refreshPayload = buildMutationRefreshPayload(
            mutationToolName,
            'route'
          );
          yield put({
            type: 'saveState',
            payload: {
              pendingMutationTool: '',
              pendingMutationRoute: '',
              pendingMutationNavigationKey: '',
              ...(refreshPayload || {}),
              updatedAt: Date.now(),
            },
          });
        } else {
          const route = resolvePostActionRoute({
            toolName: mutationToolName,
            context: nextState.context,
            appDetail: nextRootState.appControl && nextRootState.appControl.appDetail,
            result: resultPayload,
            resultRef,
          });
          const navigationPayload = buildMutationNavigationPayload(
            mutationToolName,
            route
          );
          const refreshPayload = navigationPayload
            ? null
            : buildMutationRefreshPayload(mutationToolName, 'content');
          yield put({
            type: 'saveState',
            payload: {
              pendingMutationTool: '',
              pendingMutationRoute: '',
              pendingMutationNavigationKey: '',
              ...(navigationPayload || {}),
              ...(refreshPayload || {}),
              updatedAt: Date.now(),
            },
          });
        }
      } else if (
        adaptedEvent &&
        adaptedEvent.type === 'run_status' &&
        adaptedEvent.status === 'done' &&
        prevState.pendingMutationTool &&
        !shouldUseSlidePanelContentRefresh(prevState.pendingMutationTool) &&
        !shouldUseRouteQueryRefresh(prevState.pendingMutationTool)
      ) {
        const route = resolvePostActionRoute({
          toolName: prevState.pendingMutationTool,
          context: nextState.context,
          appDetail: nextRootState.appControl && nextRootState.appControl.appDetail,
          result:
            nextState.lastMutationResult &&
            nextState.lastMutationResult.output &&
            nextState.lastMutationResult.output.structuredContent
              ? nextState.lastMutationResult.output.structuredContent
              : null,
          resultRef:
            nextState.lastMutationResult &&
            nextState.lastMutationResult.output &&
            nextState.lastMutationResult.output.structuredContent &&
            nextState.lastMutationResult.output.structuredContent.result_ref
              ? nextState.lastMutationResult.output.structuredContent.result_ref
              : null,
        });
        const navigationPayload = buildMutationNavigationPayload(
          prevState.pendingMutationTool,
          route
        );
        yield put({
          type: 'saveState',
          payload: {
            pendingMutationTool: '',
            pendingMutationRoute: '',
            pendingMutationNavigationKey: '',
            ...(navigationPayload || {}),
            ...(!navigationPayload
              ? buildMutationRefreshPayload(prevState.pendingMutationTool, 'content')
              : {}),
            updatedAt: Date.now(),
          },
        });
      } else if (
        adaptedEvent &&
        adaptedEvent.type === 'run_status' &&
        adaptedEvent.status === 'done' &&
        prevState.pendingMutationTool &&
        shouldUseRouteQueryRefresh(prevState.pendingMutationTool)
      ) {
        const finalOverviewNavigationPayload =
          buildFinalComponentOverviewNavigationPayload(prevState);
        yield put({
          type: 'saveState',
          payload: {
            pendingMutationTool: '',
            pendingMutationRoute: '',
            pendingMutationNavigationKey: '',
            ...buildMutationRefreshPayload(prevState.pendingMutationTool, 'route'),
            ...(finalOverviewNavigationPayload || {}),
            ...createClearedComponentMutationTrackingState(),
            updatedAt: Date.now(),
          },
        });
      } else if (
        adaptedEvent &&
        adaptedEvent.type === 'run_status' &&
        adaptedEvent.status === 'done'
      ) {
        const finalOverviewNavigationPayload =
          buildFinalComponentOverviewNavigationPayload(prevState);
        if (finalOverviewNavigationPayload) {
          yield put({
            type: 'saveState',
            payload: {
              pendingMutationTool: '',
              pendingMutationRefreshMode: '',
              ...finalOverviewNavigationPayload,
              ...createClearedComponentMutationTrackingState(),
              updatedAt: Date.now(),
            },
          });
        } else if (prevState.lastComponentMutationTool) {
          yield put({
            type: 'saveState',
            payload: {
              ...createClearedComponentMutationTrackingState(),
              updatedAt: Date.now(),
            },
          });
        }
      } else if (
        adaptedEvent &&
        adaptedEvent.type === 'run_status' &&
        (adaptedEvent.status === 'error' || adaptedEvent.status === 'cancelled')
      ) {
        yield put({
          type: 'saveState',
          payload: {
            pendingMutationTool: '',
            pendingMutationRoute: '',
            pendingMutationNavigationKey: '',
            pendingMutationRefreshMode: '',
            ...createClearedComponentMutationTrackingState(),
            updatedAt: Date.now(),
          },
        });
      }

      if (
        pa &&
        pa.approvalId &&
        pa.status === 'pending' &&
        pa.approvalId !== prevApprovalId &&
        autoApprovalPolicy.matches({
          risk: pa.risk,
          skillId: pa.skillId,
          targetRef: pa.targetRef,
        }) &&
        inFlightAutoApprovals.claim(pa.approvalId)
      ) {
        yield put({
          type: 'markApprovalAutoApproved',
          payload: { approvalId: pa.approvalId },
        });
        yield put({
          type: 'resolveApproval',
          payload: {
            decision: 'approved',
            auto: true,
            autoApprovalId: pa.approvalId,
          },
        });
      }
    },

    *clearSession({ payload }, { call, put }) {
      const userId = payload && payload.userId;
      const preserveVisible = payload && payload.preserveVisible;
      yield call(clearAgentSession, userId);
      yield put({
        type: 'clearState',
        payload: {
          preserveVisible: preserveVisible !== false,
        },
      });
    },
  },

  reducers: {
    hydrateState(state, { payload }) {
      return buildHydratedState(payload);
    },

    saveState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },

    show(state) {
      return {
        ...state,
        visible: true,
        updatedAt: Date.now(),
      };
    },

    // 仅更新 agentUpdate，不动 updatedAt：避免触发 RootShell 基于 updatedAt 的上下文同步副作用。
    saveAgentUpdate(state, { payload }) {
      return {
        ...state,
        agentUpdate: payload || null,
      };
    },

    hide(state) {
      return {
        ...state,
        visible: false,
        updatedAt: Date.now(),
      };
    },

    saveDraft(state, { payload }) {
      return {
        ...state,
        draft: payload,
      };
    },

    applyStreamEventReducer(state, { payload }) {
      const merged = applyAgentStreamEvent(state, payload);
      return {
        ...state,
        interactionLocked: merged.interactionLocked,
        messages: merged.messages,
        pendingApproval: merged.pendingApproval,
        lastEventSequence: merged.lastEventSequence,
        lastMutationResult: merged.lastMutationResult,
        lastMutationRunId: merged.lastMutationRunId,
        workflowState: merged.workflowState,
        structuredResult: merged.structuredResult,
        compaction: merged.compaction,
        updatedAt: Date.now(),
      };
    },

    markApprovalAutoApproved(state, { payload }) {
      const approvalId = payload && payload.approvalId;
      if (!approvalId) return state;
      return {
        ...state,
        messages: (state.messages || []).map(m =>
          m && m.kind === 'approval' && m.approval && m.approval.approvalId === approvalId
            ? { ...m, approval: { ...m.approval, autoApproved: true } }
            : m
        ),
      };
    },

    clearState(state, { payload }) {
      const preserveVisible = payload && payload.preserveVisible;
      return {
        ...defaultState,
        hydrated: true,
        visible: preserveVisible ? state.visible : false,
        context: state.context,
        lastContextSignature: state.lastContextSignature,
        interactionLocked: false,
        pendingApproval: null,
        activeRunId: '',
        lastEventSequence: 0,
        workflowState: null,
        structuredResult: null,
        compaction: { ...defaultCompactionState },
        pendingMutationTool: '',
        pendingMutationRoute: '',
        pendingMutationNavigationKey: '',
        pendingMutationRefreshKey: '',
        pendingMutationRefreshMode: '',
        lastMutationResult: null,
        lastMutationRunId: '',
        ...createClearedComponentMutationTrackingState(),
        updatedAt: Date.now(),
      };
    },
  },
};

export {
  buildTraceContent,
  applyAgentEvents,
};
