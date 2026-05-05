import { getDvaApp } from 'umi';
import {
  cancelAgentSessionPending,
  clearAgentSession,
  decideAgentApproval,
  deleteAgentSession,
  hydrateAgentSession,
  listAgentSessions,
  loadAgentSessionMessages,
  sendAgentMessage,
} from '../services/agent';
const { adaptAgentEvent } = require('../services/agentEventAdapter');
import {
  formatAgentContextMessage,
  getAgentContextSignature,
} from '../utils/agentContext';
import agentWorkflowState from './agentWorkflowState';
const { applyStreamingAssistantEvent } = require('./agentStreamMessages');
const autoApprovalPolicy = require('../components/AgentHost/autoApprovalPolicy');
const inFlightAutoApprovals = require('../components/AgentHost/inFlightAutoApprovals');
const {
  applyTraceEvent,
  buildTraceContent,
} = require('./agentTraceHelpers');
const { formatToolLabel } = require('../utils/agentToolLabels');

const { extractWorkflowState } = agentWorkflowState;

const defaultState = {
  hydrated: false,
  visible: false,
  conversationId: 'global-default',
  messages: [],
  draft: '',
  sending: false,
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
    componentSource: '',
    pathname: '',
  },
  lastContextSignature: '',
  workflowState: null,
  structuredResult: null,
  sessionList: [],
  sessionListLoading: false,
  sessionPendingApprovals: [],
  cancellingPending: false,
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
    sessionList: [],
    sessionListLoading: false,
    sessionPendingApprovals: [],
    cancellingPending: false,
    sending: false,
    lastError: '',
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

function findApprovalMessageIndex(messages, approvalId) {
  return messages.findIndex(
    item => item && item.kind === 'approval' && item.approval && item.approval.approvalId === approvalId
  );
}

function applyAgentEvents({
  messages,
  events,
  contextSnapshot,
  currentPendingApproval,
}) {
  const nextMessages = Array.isArray(messages) ? messages.slice() : [];
  let pendingApproval = normalizePendingApproval(currentPendingApproval);
  let lastEventSequence = 0;

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
        applyTraceEvent(
          nextMessages,
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
        nextMessages.length = 0;
        streamedMessages.forEach(item => nextMessages.push(item));
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
            nextMessages.length = 0;
            streamedMessages.forEach(item => nextMessages.push(item));
            break;
          }
        }
        nextMessages.push(
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
          nextMessages.push(
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
          nextMessages[index] = {
            ...nextMessages[index],
            approval: {
              ...(nextMessages[index].approval || {}),
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
          nextMessages.push(
            createMessage(
              'system',
              'status',
              '本次操作已取消。',
              contextSnapshot,
              { eventSequence }
            )
          );
        } else if (adaptedEvent.status === 'error') {
          nextMessages.push(
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
        nextMessages.push(
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
        nextMessages.push(
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
        nextMessages.push(
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
    ...extractWorkflowState(events),
  };
}

function applyAgentStreamEvent(state, payload) {
  const merged = applyAgentEvents({
    messages: state.messages,
    events: [payload.event],
    contextSnapshot: payload.contextSnapshot || state.context || {},
    currentPendingApproval: state.pendingApproval,
  });

  return {
    messages: merged.messages,
    pendingApproval: merged.pendingApproval,
    lastEventSequence: merged.lastEventSequence || state.lastEventSequence,
    workflowState: merged.workflowState || state.workflowState,
    structuredResult: merged.structuredResult || state.structuredResult,
  };
}

export default {
  namespace: 'agent',

  state: defaultState,

  effects: {
    *hydrateSession({ payload }, { call, put }) {
      const userId = payload && payload.userId;
      const snapshot = yield call(hydrateAgentSession, userId);
      yield put({
        type: 'hydrateState',
        payload: snapshot,
      });
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
      const userMessage = createMessage('user', 'normal', text, contextSnapshot);
      const pendingMessages = state.messages.concat(userMessage);

      yield put({
        type: 'saveState',
        payload: {
          messages: pendingMessages,
          draft: '',
          sending: true,
          lastError: '',
          updatedAt: Date.now(),
        },
      });

      try {
        const dvaApp = getDvaApp();
        const storeDispatch = dvaApp && dvaApp._store && dvaApp._store.dispatch;
        const response = yield call(sendAgentMessage, {
          conversation_id: state.conversationId,
          message: text,
          context: contextSnapshot,
          currentUser,
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
        yield put({
          type: 'saveState',
          payload: {
            sending: false,
            lastError: '消息发送失败，请稍后重试。',
            updatedAt: Date.now(),
          },
        });
      }
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
      const prevState = yield select(store => store.agent);
      const prevApprovalId =
        (prevState.pendingApproval && prevState.pendingApproval.approvalId) || '';

      yield put({
        type: 'applyStreamEventReducer',
        payload,
      });

      const nextState = yield select(store => store.agent);
      const pa = nextState.pendingApproval;
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
        messages: merged.messages,
        pendingApproval: merged.pendingApproval,
        lastEventSequence: merged.lastEventSequence,
        workflowState: merged.workflowState,
        structuredResult: merged.structuredResult,
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
        pendingApproval: null,
        activeRunId: '',
        lastEventSequence: 0,
        workflowState: null,
        structuredResult: null,
        updatedAt: Date.now(),
      };
    },
  },
};

export {
  buildTraceContent,
  applyAgentEvents,
};
