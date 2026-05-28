import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import agentPayload from './agentPayload';
import * as agentStream from './agentStream';

const { buildAgentSessionPayload } = agentPayload;
const { readSseEvents, subscribeToRunEvents } = agentStream;

const AGENT_SESSION_KEY_PREFIX = 'rainbond_ui_agent_session_v1';

// copilot 插件 RBDPlugin CR 历史上同时存在过 rainbond-agent 和 rainbond-copilot 两个名字。
// 新发布统一使用 rainbond-agent，但老用户集群里仍可能只有 rainbond-copilot。
// 解析顺序：rainbond-agent 优先，没装就回退到 rainbond-copilot。
// 解析失败（接口异常 / 都没装）走 DEFAULT 兜底。
const COPILOT_PLUGIN_CANDIDATES = ['rainbond-agent', 'rainbond-copilot'];
const DEFAULT_COPILOT_PLUGIN_NAME = 'rainbond-agent';
const COPILOT_PLUGIN_CACHE_KEY = 'rainbond_ui_copilot_plugin_name_v1';
const COPILOT_API_PATH = '/api/v1/copilot';

let cachedCopilotPluginName = '';

// copilot 后端 API 经 console 的插件后端代理访问，路径形如：
//   /console/regions/{region}/backend/plugins/{plugin}/api/v1/copilot/...
// 这样无论控制台是域名还是 IP:端口访问都同源可达。region 取当前页面 region，
// 企业级页面 URL 不含 region 段时回退到 region_name cookie。
function resolveCopilotRegion() {
  return globalUtil.getCurrRegionName() || cookie.get('region_name') || '';
}

function readCachedCopilotPluginName() {
  if (cachedCopilotPluginName) {
    return cachedCopilotPluginName;
  }
  if (!canUseSessionStorage()) {
    return '';
  }
  try {
    const stored = window.sessionStorage.getItem(COPILOT_PLUGIN_CACHE_KEY);
    if (stored && COPILOT_PLUGIN_CANDIDATES.indexOf(stored) >= 0) {
      cachedCopilotPluginName = stored;
      return stored;
    }
  } catch (_) {
    // ignore
  }
  return '';
}

function writeCachedCopilotPluginName(name) {
  cachedCopilotPluginName = name;
  if (!canUseSessionStorage()) {
    return;
  }
  try {
    window.sessionStorage.setItem(COPILOT_PLUGIN_CACHE_KEY, name);
  } catch (_) {
    // ignore
  }
}

async function resolveCopilotPluginName() {
  const cached = readCachedCopilotPluginName();
  if (cached) {
    return cached;
  }

  const enterpriseId = globalUtil.getCurrEnterpriseId();
  const region = resolveCopilotRegion();
  if (!enterpriseId || !region) {
    return DEFAULT_COPILOT_PLUGIN_NAME;
  }

  try {
    const response = await fetch(
      `/console/enterprise/${enterpriseId}/regions/${region}/plugins`,
      {
        method: 'GET',
        credentials: 'include',
        headers: buildRequestHeaders()
      }
    );
    if (response.ok) {
      const body = await response.json().catch(() => ({}));
      const list = (body && body.data && body.data.list) || [];
      const installedNames = new Set(
        list.map(item => item && item.name).filter(Boolean)
      );
      for (const candidate of COPILOT_PLUGIN_CANDIDATES) {
        if (installedNames.has(candidate)) {
          writeCachedCopilotPluginName(candidate);
          return candidate;
        }
      }
    }
  } catch (_) {
    // network error — fall through to default
  }
  return DEFAULT_COPILOT_PLUGIN_NAME;
}

async function copilotApiBase() {
  const region = resolveCopilotRegion();
  if (region) {
    const pluginName = await resolveCopilotPluginName();
    return `/console/regions/${region}/backend/plugins/${pluginName}${COPILOT_API_PATH}`;
  }
  // 兜底：拿不到 region 时退回旧网关路径
  return COPILOT_API_PATH;
}

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
    componentAlias: context.componentAlias || '',
    componentSource: context.componentSource || '',
    pathname: context.pathname || '',
    routeSignature: context.routeSignature || context.pathname || '',
    pageTitle: context.pageTitle || '',
    locale: context.locale || ''
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
    skillId: pendingApproval.skillId || '',
    targetRef: pendingApproval.targetRef || null,
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
    const error = new Error(typeof message === 'string' ? message : '请求失败');
    error.status = response.status;
    error.responseBody = data;
    throw error;
  }

  return data;
}

async function requestJsonAcceptStatuses(path, options = {}, acceptedStatuses = []) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options
  });

  // Some terminal statuses (204) have no body; tolerate empty body.
  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (response.ok || acceptedStatuses.indexOf(response.status) > -1) {
    return { status: response.status, data };
  }

  const message =
    (data &&
      data.error &&
      (data.error.message || data.error.msg_show || data.error.code)) ||
    response.statusText ||
    '请求失败';
  const error = new Error(typeof message === 'string' ? message : '请求失败');
  error.status = response.status;
  error.responseBody = data;
  throw error;
}

export async function listAgentSessions({ limit = 20, offset = 0 } = {}) {
  return requestJson(`${await copilotApiBase()}/sessions?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: buildRequestHeaders(),
  });
}

export async function deleteAgentSession(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  return requestJson(`${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: buildRequestHeaders(),
  });
}

export async function loadAgentSessionMessages(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  return requestJson(
    `${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: 'GET',
      headers: buildRequestHeaders(),
    }
  );
}

export async function abortAgentRun({ sessionId, runId } = {}) {
  if (!sessionId || !runId) {
    throw new Error('sessionId and runId are required');
  }
  const result = await requestJsonAcceptStatuses(
    `${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}/runs/${encodeURIComponent(runId)}/abort`,
    {
      method: 'POST',
      headers: buildRequestHeaders(),
    },
    [202, 404]
  );
  return result;
}

export async function clearAgentSessionRemote(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  const result = await requestJsonAcceptStatuses(
    `${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: 'DELETE',
      headers: buildRequestHeaders(),
    },
    [202, 204]
  );
  return result;
}

export async function cancelAgentSessionPending(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  return requestJson(
    `${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}/cancel-pending`,
    {
      method: 'POST',
      headers: buildRequestHeaders(),
    }
  );
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

  const payload = await requestJson(`${await copilotApiBase()}/sessions`, {
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
    `${await copilotApiBase()}/sessions/${sessionId}/runs/${runId}/events${query}`,
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
  const selectedActionId = (payload.selectedActionId || '').trim();
  const selectedActionKey = (payload.selectedActionKey || '').trim();
  const context = normalizeContext(payload.context);
  const currentUser = payload.currentUser || {};

  if (!message && !selectedActionId && !selectedActionKey) {
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

  let runPayload;
  try {
    runPayload = await requestJson(
      `${await copilotApiBase()}/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildRequestHeaders()
        },
        body: JSON.stringify({
          message,
          selected_action_id: selectedActionId || undefined,
          selected_action_key: selectedActionKey || undefined,
          stream: true,
          context: buildAgentSessionPayload(context).context
        })
      }
    );
  } catch (error) {
    // Attach the sessionId so the 409 cross-tab observer can subscribe to
    // the foreign run without depending on backend response shape.
    if (error) {
      error.sessionId = sessionId;
    }
    throw error;
  }

  const runId = runPayload && runPayload.data && runPayload.data.run_id;
  // P0-3 step 5: emit onRunStarted *before* the SSE stream resolves so the
  // model layer can surface both sessionId and activeRunId immediately.
  // Without this, the stop button (canStopRun = sending && activeRunId) only
  // flips on after the run has already finished, and abortRun bails out
  // because conversationId is still its initial 'global-default' literal.
  if (payload.onRunStarted && runId) {
    payload.onRunStarted({ sessionId, runId });
  }
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

// F5 — cross-tab observer. When a tab gets a 409 conflict (another tab is
// running a turn), it stashes the user draft and needs to know when the
// foreign run terminates so it can flush that draft. The local SSE stream
// in this tab never opens, so we subscribe to the active run's stream
// here and let callers dispatch events into the same model pipeline.
export async function subscribeToActiveRun(options = {}) {
  const { sessionId, runId, afterSequence = 0, onEvent, abortSignal } = options;
  if (!sessionId || !runId) {
    throw new Error('sessionId and runId are required');
  }
  return subscribeToRunEvents({
    url: `${await copilotApiBase()}/sessions/${encodeURIComponent(sessionId)}/runs/${encodeURIComponent(runId)}/events`,
    headers: buildRequestHeaders(),
    onEvent,
    afterSequence,
    signal: abortSignal,
  });
}

export async function decideAgentApproval(payload = {}) {
  const approvalId = payload.approvalId;
  const sessionId = payload.sessionId;
  const runId = payload.runId;
  const currentUser = payload.currentUser || {};
  const context = normalizeContext(payload.context);
  const afterSequence = Number(payload.afterSequence || 0);

  await requestJson(`${await copilotApiBase()}/approvals/${approvalId}/decisions`, {
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
