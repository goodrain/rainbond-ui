const SERVER_POLICY_KINDS = {
  'session-target': 'session_target',
  'session-target-op': 'session_target_operation',
  'session-op': 'session_operation',
  'session-all': 'session_all',
};
const LEGACY_STORAGE_KEY = 'agent.autoApprove.session';
const LEGACY_CLEANUP_MARKER = 'agent.autoApprove.serverMigration.v1';

function getStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  return window.sessionStorage;
}

function discardLegacyPolicies() {
  const storage = getStorage();
  if (!storage || storage.getItem(LEGACY_CLEANUP_MARKER) === 'done') return 0;
  let count = 0;
  try {
    const parsed = JSON.parse(storage.getItem(LEGACY_STORAGE_KEY) || '[]');
    count = Array.isArray(parsed) ? parsed.length : 0;
  } catch (_) {
    count = 0;
  }
  storage.removeItem(LEGACY_STORAGE_KEY);
  storage.setItem(LEGACY_CLEANUP_MARKER, 'done');
  return count;
}

function targetRefToKey(targetRef) {
  if (!targetRef || !targetRef.kind) return null;
  // Server emits { kind, service_id, service_alias, app_id, team_name, ... }
  // (see rainbond-copilot/src/server/services/mutation-navigation-ref.ts).
  // It does NOT include a generic `id` field, so the previous
  // `targetRef.id` read always returned undefined and the "记住选择"
  // policy entries showed up as `service:undefined` / `app:undefined`,
  // never matching subsequent approvals. Pick the right id by kind.
  let id = null;
  if (targetRef.kind === 'service') {
    id = targetRef.service_id || targetRef.service_alias;
  } else if (targetRef.kind === 'app') {
    id = targetRef.app_id;
  } else if (targetRef.kind === 'team') {
    id = targetRef.team_name;
  }
  return id ? `${targetRef.kind}:${id}` : null;
}

function toRememberPolicy(kind) {
  const serverKind = SERVER_POLICY_KINDS[kind];
  return serverKind ? { kind: serverKind } : null;
}

function formatServerPolicyLabel(policy) {
  if (!policy) return '';
  switch (policy.kind) {
    case 'session_all':
      return '本会话全部低风险操作';
    case 'session_target':
      return `资源 ${policy.target_key || '-'} 的低风险操作`;
    case 'session_operation':
      return `同类操作 ${policy.operation_key || '-'}`;
    case 'session_target_operation':
      return `${policy.target_key || '-'} · ${policy.operation_key || '-'}`;
    default:
      return policy.kind || '未知规则';
  }
}

module.exports = {
  LEGACY_STORAGE_KEY,
  discardLegacyPolicies,
  formatServerPolicyLabel,
  targetRefToKey,
  toRememberPolicy,
};
