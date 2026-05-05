import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import agentPayload from './agentPayload';
const { readSseEvents } = require('./agentStream');

const { buildAgentSessionPayload } = agentPayload;

const AGENT_SESSION_KEY_PREFIX = 'rainbond_ui_agent_session_v1';
const COPILOT_API_BASE = '/api/v1/copilot';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && !!window.sessionStorage;
}

function getStorageKey(userId) {
  return `${AGENT_SESSION_KEY_PREFIX}_${userId || 'guest'}`;
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages
    .filter(item => item && item.id && item.role)
    .map(item => ({
      id: item.id,
      role: item.role,
      kind: item.kind || 'normal',
      content: item.content || '',
      createdAt: item.createdAt || Date.now(),
      contextSnapshot: item.contextSnapshot || {},
      trace: item.trace || null,
      approval: item.approval || null,
      streamMessageId: item.streamMessageId || '',
      streaming: !!item.streaming
    }));
}

function normalizeContext(context) {
  if (!context || typeof context !== 'object') {
    return {};
  }
  return {
    view: context.view || '',
    enterpriseId: context.enterpriseId || '',
    teamName: context.teamName || '',
    regionName: context.regionName || '',
    appId: context.appId || '',
    componentId: context.componentId || '',
    componentSource: context.componentSource || '',
    pathname: context.pathname || ''
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
    lastSequence: pendingApproval.lastSequence || 0
  };
}

function buildPersistedSnapshot(snapshot) {
  const nextSnapshot = snapshot || {};
  return {
    visible: !!nextSnapshot.visible,
    conversationId: nextSnapshot.conversationId || 'global-default',
    messages: normalizeMessages(nextSnapshot.messages),
    context: normalizeContext(nextSnapshot.context),
    pendingApproval: normalizePendingApproval(nextSnapshot.pendingApproval),
    activeRunId: nextSnapshot.activeRunId || '',
    lastEventSequence: nextSnapshot.lastEventSequence || 0,
    lastContextSignature: nextSnapshot.lastContextSignature || '',
    workflowState: nextSnapshot.workflowState || null,
    structuredResult: nextSnapshot.structuredResult || null,
    updatedAt: nextSnapshot.updatedAt || 0
  };
}

function buildRequestHeaders() {
  const headers = {
    Accept: 'application/json',
  };

  const token = cookie.get('token');
  if (token) {
    headers.Authorization = `GRJWT ${token}`;
  }

  const regionName = globalUtil.getCurrRegionName();
  const teamName = globalUtil.getCurrTeamName();

  if (regionName) {
    headers.X_REGION_NAME = regionName;
  }

  if (teamName) {
    headers.X_TEAM_NAME = teamName;
  }

  return headers;
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data &&
        data.error &&
        (data.error.message || data.error.msg_show || data.error.code)) ||
      response.statusText ||
      '请求失败';
    throw new Error(message);
  }

  return data;
}

export async function listAgentSessions({ limit = 20, offset = 0 } = {}) {
  return requestJson(`${COPILOT_API_BASE}/sessions?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: buildRequestHeaders(),
  });
}

export async function deleteAgentSession(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  return requestJson(`${COPILOT_API_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: buildRequestHeaders(),
  });
}

export function persistAgentSession(snapshot, userId) {
  if (!canUseSessionStorage() || !userId) {
    return;
  }
  const storageKey = getStorageKey(userId);
  const persistedSnapshot = buildPersistedSnapshot(snapshot);
  window.sessionStorage.setItem(storageKey, JSON.stringify(persistedSnapshot));
}

export function hydrateAgentSession(userId) {
  if (!canUseSessionStorage() || !userId) {
    return null;
  }
  const storageKey = getStorageKey(userId);
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return buildPersistedSnapshot(parsed);
  } catch (error) {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

export function clearAgentSession(userId) {
  if (!canUseSessionStorage() || !userId) {
    return;
  }
  window.sessionStorage.removeItem(getStorageKey(userId));
}

async function ensureSession({ conversationId, currentUser, context }) {
  if (conversationId && conversationId !== 'global-default') {
    return conversationId;
  }

  const payload = await requestJson(`${COPILOT_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildRequestHeaders()
    },
    body: JSON.stringify(buildAgentSessionPayload(context))
  });

  return payload && payload.data && payload.data.session_id;
}

async function streamRun({
  sessionId,
  runId,
  afterSequence,
  onEvent,
  skipFirstWaitingApproval
}) {
  const query = afterSequence > 0 ? `?after_sequence=${afterSequence}` : '';
  const response = await fetch(
    `${COPILOT_API_BASE}/sessions/${sessionId}/runs/${runId}/events${query}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...buildRequestHeaders(),
        Accept: 'text/event-stream',
      }
    }
  );

  return readSseEvents(response, { onEvent, skipFirstWaitingApproval });
}

export async function sendAgentMessage(payload = {}) {
  const message = (payload.message || '').trim();
  const context = normalizeContext(payload.context);
  const currentUser = payload.currentUser || {};

  if (!message) {
    return {
      sessionId: payload.conversation_id || 'global-default',
      runId: '',
      events: []
    };
  }

  const sessionId = await ensureSession({
    conversationId: payload.conversation_id,
    currentUser,
    context
  });

  const runPayload = await requestJson(
    `${COPILOT_API_BASE}/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...buildRequestHeaders()
      },
      body: JSON.stringify({
        message,
        stream: true,
        context: buildAgentSessionPayload(context).context
      })
    }
  );

  const runId = runPayload && runPayload.data && runPayload.data.run_id;
  const events = await streamRun({
    sessionId,
    runId,
    afterSequence: 0,
    onEvent: payload.onEvent
  });

  return {
    sessionId,
    runId,
    events
  };
}

export async function decideAgentApproval(payload = {}) {
  const approvalId = payload.approvalId;
  const sessionId = payload.sessionId;
  const runId = payload.runId;
  const currentUser = payload.currentUser || {};
  const context = normalizeContext(payload.context);
  const afterSequence = Number(payload.afterSequence || 0);

  await requestJson(`${COPILOT_API_BASE}/approvals/${approvalId}/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildRequestHeaders()
    },
    body: JSON.stringify({
      decision: payload.decision,
      comment: payload.comment || ''
    })
  });

  const events = await streamRun({
    sessionId,
    runId,
    afterSequence,
    onEvent: payload.onEvent,
    skipFirstWaitingApproval: true
  });

  return {
    sessionId,
    runId,
    events
  };
}
