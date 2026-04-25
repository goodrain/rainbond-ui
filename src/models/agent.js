import { getDvaApp } from 'umi';
import {
  clearAgentSession,
  decideAgentApproval,
  hydrateAgentSession,
  sendAgentMessage,
} from '../services/agent';
import {
  formatAgentContextMessage,
  getAgentContextSignature,
} from '../utils/agentContext';
import agentWorkflowState from './agentWorkflowState';

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

function buildTraceContent(data = {}) {
  const toolName = data.tool_name || '工具调用';
  const normalizedInput =
    data && data.input && typeof data.input === 'object'
      ? JSON.stringify(data.input)
      : '';
  const normalizedOutput =
    data &&
    data.output &&
    data.output.structuredContent &&
    typeof data.output.structuredContent === 'object'
      ? data.output.structuredContent
      : data.output;
  const detail = [];
  if (data.input) {
    detail.push(`输入：${JSON.stringify(data.input, null, 2)}`);
  }
  if (normalizedOutput) {
    detail.push(`输出：${JSON.stringify(normalizedOutput, null, 2)}`);
  }
  return {
    title: toolName,
    detail: detail.join('\n\n'),
    toolName,
    inputSignature: normalizedInput,
    hasOutput: !!data.output,
  };
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
    if (!event || !event.type) {
      return;
    }

    const eventSequence = event.sequence || 0;
    if (eventSequence > lastEventSequence) {
      lastEventSequence = eventSequence;
    }

    switch (event.type) {
      case 'chat.message': {
        const data = event.data || {};
        nextMessages.push(
          createMessage(
            data.role === 'user' ? 'user' : 'assistant',
            'normal',
            data.content || '',
            contextSnapshot,
            { eventSequence }
          )
        );
        break;
      }
      case 'chat.trace': {
        const trace = buildTraceContent(event.data || {});
        const pendingTraceIndex =
          trace.hasOutput
            ? nextMessages.findIndex(item => (
                item &&
                item.kind === 'trace' &&
                item.trace &&
                item.trace.title === trace.title &&
                item.trace.inputSignature === trace.inputSignature &&
                !item.trace.hasOutput
              ))
            : -1;

        if (pendingTraceIndex > -1) {
          nextMessages[pendingTraceIndex] = {
            ...nextMessages[pendingTraceIndex],
            trace,
            eventSequence,
          };
          break;
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
        break;
      }
      case 'approval.requested': {
        const data = event.data || {};
        pendingApproval = {
          approvalId: data.approval_id || '',
          description: data.description || '',
          risk: data.risk || 'medium',
          scope: data.scope || '',
          scopeLabel: data.scope_label || '',
          levelLabel: data.level_label || '',
          runId: event.runId || '',
          sessionId: event.sessionId || '',
          status: 'pending',
          lastSequence: eventSequence,
        };

        nextMessages.push(
          createMessage(
            'system',
            'approval',
            data.description || '待审批操作',
            contextSnapshot,
            {
              approval: pendingApproval,
              eventSequence,
            }
          )
        );
        break;
      }
      case 'approval.resolved': {
        const data = event.data || {};
        const approvalId = data.approval_id;
        const index = findApprovalMessageIndex(nextMessages, approvalId);
        if (index > -1) {
          nextMessages[index] = {
            ...nextMessages[index],
            approval: {
              ...(nextMessages[index].approval || {}),
              approvalId,
              status: data.status || 'approved',
              lastSequence: eventSequence,
            },
          };
        }
        if (pendingApproval && pendingApproval.approvalId === approvalId) {
          pendingApproval = null;
        }
        break;
      }
      case 'run.status': {
        const data = event.data || {};
        if (data.status === 'cancelled') {
          nextMessages.push(
            createMessage(
              'system',
              'status',
              '本次操作已取消。',
              contextSnapshot,
              { eventSequence }
            )
          );
        } else if (data.status === 'error') {
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
        if (pendingApproval && data.status === 'waiting_approval') {
          pendingApproval = {
            ...pendingApproval,
            lastSequence: eventSequence,
          };
        }
        break;
      }
      case 'run.error': {
        const data = event.data || {};
        nextMessages.push(
          createMessage(
            'system',
            'error',
            data.message || data.error || '执行过程中发生错误，请稍后重试。',
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

    applyStreamEvent(state, { payload }) {
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
