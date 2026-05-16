const STORAGE_KEY = 'agent.autoApprove.session';

function getStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  return window.sessionStorage;
}

function readPolicies() {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writePolicies(list) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function policyEquals(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'session-all') return true;
  if (a.kind === 'session-target') return a.targetKey === b.targetKey;
  if (a.kind === 'session-op') return a.skillId === b.skillId;
  if (a.kind === 'session-target-op') {
    return a.targetKey === b.targetKey && a.skillId === b.skillId;
  }
  return false;
}

function getPolicies() {
  return readPolicies();
}

function addPolicy(policy) {
  const list = readPolicies();
  if (list.some(p => policyEquals(p, policy))) return;
  list.push(policy);
  writePolicies(list);
}

function removePolicy(policy) {
  const list = readPolicies().filter(p => !policyEquals(p, policy));
  writePolicies(list);
}

function clearPolicies() {
  const storage = getStorage();
  if (storage) storage.removeItem(STORAGE_KEY);
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

function policyMatches(policy, ctx) {
  const targetKey = targetRefToKey(ctx.targetRef);
  switch (policy.kind) {
    case 'session-all':
      return true;
    case 'session-target':
      return !!targetKey && policy.targetKey === targetKey;
    case 'session-op':
      return !!ctx.skillId && policy.skillId === ctx.skillId;
    case 'session-target-op':
      return (
        !!targetKey &&
        policy.targetKey === targetKey &&
        !!ctx.skillId &&
        policy.skillId === ctx.skillId
      );
    default:
      return false;
  }
}

function matches(ctx) {
  if (!ctx) return false;
  if (ctx.risk === 'high') return false;
  const list = readPolicies();
  return list.some(p => policyMatches(p, ctx));
}

module.exports = {
  STORAGE_KEY,
  targetRefToKey,
  getPolicies,
  addPolicy,
  removePolicy,
  clearPolicies,
  matches,
};
