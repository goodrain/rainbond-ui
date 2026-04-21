import cookie from '../utils/cookie';
import globalUtil from '../utils/global';

const AGENT_SESSION_KEY_PREFIX = 'rainbond_ui_agent_session_v1';
const COPILOT_API_BASE = '/api/v1/copilot';
const TERMINAL_STATUSES = ['done', 'error', 'waiting_approval', 'cancelled'];

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
      approval: item.approval || null
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

function buildSessionPayload(context = {}) {
  return {
    context: {
      app_id: context.appId || '',
      app_name: context.appId || '',
      page: context.pathname || '',
      resource: {
        type: context.componentId ? 'component' : context.appId ? 'app' : 'page',
        id: context.componentId || context.appId || context.pathname || '',
        name: context.componentId || context.appId || context.pathname || ''
      }
    }
  };
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

async function readSseEvents(response) {
  if (!response.ok) {
    let errorMessage = response.statusText || '流式请求失败';
    try {
      const data = await response.json();
      errorMessage =
        (data &&
          data.error &&
          (data.error.message || data.error.msg_show || data.error.code)) ||
        errorMessage;
    } catch (error) {
      // ignore json parse errors for non-json SSE failures
    }
    throw new Error(errorMessage);
  }

  const reader = response.body && response.body.getReader ? response.body.getReader() : null;

  if (!reader) {
    return [];
  }

  const decoder = new TextDecoder();
  const events = [];
  let buffer = '';
  let shouldStop = false;

  try {
    while (!shouldStop) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true }).replace(/\r/g, '');

      let boundaryIndex = buffer.indexOf('\n\n');
      while (boundaryIndex >= 0) {
        const rawEvent = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        const dataLine = rawEvent
          .split('\n')
          .find(line => line.indexOf('data: ') === 0);

        if (dataLine) {
          const parsed = JSON.parse(dataLine.slice(6));
          events.push(parsed);

          if (
            parsed &&
            parsed.type === 'run.status' &&
            parsed.data &&
            TERMINAL_STATUSES.indexOf(parsed.data.status) > -1
          ) {
            shouldStop = true;
            break;
          }

          if (parsed && parsed.type === 'run.error') {
            shouldStop = true;
            break;
          }
        }

        boundaryIndex = buffer.indexOf('\n\n');
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch (error) {
      // ignore close errors
    }
  }

  return events;
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
    body: JSON.stringify(buildSessionPayload(context))
  });

  return payload && payload.data && payload.data.session_id;
}

async function streamRun({
  sessionId,
  runId,
  afterSequence,
  currentUser,
  context
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

  return readSseEvents(response);
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
        stream: true
      })
    }
  );

  const runId = runPayload && runPayload.data && runPayload.data.run_id;
  const events = await streamRun({
    sessionId,
    runId,
    afterSequence: 0,
    currentUser,
    context
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
    currentUser,
    context
  });

  return {
    sessionId,
    runId,
    events
  };
}
