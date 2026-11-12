const { deliveryScope, sensitiveName } = require('./templateDelivery');
const copy = value => JSON.parse(JSON.stringify(value));
const listingRequiresReview = item => !item.destination || item.destination.type !== 'market';
const listingDeployable = item => item.status === 'approved' || !listingRequiresReview(item) && item.publication_status === 'published';
function latestPublications(items) {
  const destinations = new Map();
  items.slice().sort((a,b) => (Date.parse(b.submitted_at) || 0) - (Date.parse(a.submitted_at) || 0)).forEach(item => {
    const destination = item.destination || { type: 'local' }, key = `${destination.type}:${destination.market_id || ''}`;
    if (!destinations.has(key)) destinations.set(key, item);
  });
  return [...destinations.values()];
}
function requireValue(value, key = 'workflow.invalid') { if (!value) throw new Error(key); }
function actor(user, enterprise) {
  requireValue(user && user.user_id != null && String(user.enterprise_id) === String(enterprise), 'workflow.forbidden');
}
function submitListing(items, { user, scope, template, reason, authorized, appName }, now, id) {
  actor(user, scope.enterprise_id);
  requireValue(authorized, 'workflow.forbidden');
  requireValue(template.scope === deliveryScope(scope) && template.component_overrides && template.component_overrides.length);
  requireValue(!template.deleted_at, 'workflow.versionUnavailable');
  requireValue(typeof reason === 'string' && reason.trim() && reason.length <= 500, 'workflow.reasonRequired');
  requireValue(!items.some(item => item.template.id === template.id && item.template.scope === template.scope && ['pending', 'approved'].includes(item.status)), 'workflow.alreadySubmitted');
  const group = items.find(item => item.template.scope === template.scope && item.template.template_name === template.template_name);
  const frozen = copy(template);
  frozen.component_overrides.forEach(config => (config.service_env_map_list || []).forEach(env => {
    if (env.is_sensitive || sensitiveName(env.attr_name)) { env.attr_value = ''; env.is_sensitive = true; env.required_on_install = true; }
  }));
  return { id, group_id: group ? group.group_id : id, enterprise_id: String(scope.enterprise_id), source: copy(scope),
    app_name: appName || `应用 ${scope.appID}`, template: frozen, reason: reason.trim(), status: 'pending',
    applicant_id: String(user.user_id), applicant_name: user.nick_name || user.user_name || String(user.user_id), submitted_at: now,
    reviewer_name: '', review_comment: '', reviewed_at: '', actions: [{ action: 'submit', user_name: user.nick_name || user.user_name, time: now }] };
}
function reviewListing(item, user, decision, comment, now) {
  actor(user, item.enterprise_id);
  requireValue(user.is_enterprise_admin === true, 'workflow.forbidden');
  requireValue(item.status === 'pending', 'workflow.alreadyReviewed');
  requireValue(['approved', 'rejected'].includes(decision));
  requireValue(typeof comment === 'string' && comment.length <= 500 && (decision !== 'rejected' || comment.trim()), 'workflow.reviewReason');
  return { ...item, status: decision, reviewer_name: user.nick_name || user.user_name || String(user.user_id),
    review_comment: comment.trim(), reviewed_at: now, actions: [...item.actions, { action: decision, user_name: user.nick_name || user.user_name, time: now, comment: comment.trim() }] };
}
function recordDelivery(items, { user, scope, template, target, kind, authorized, listingId }, listings, now, id) {
  actor(user, scope.enterprise_id);
  requireValue(template.scope === deliveryScope(scope));
  requireValue(!template.deleted_at, 'workflow.versionUnavailable');
  requireValue(['delivery', 'test', 'offline'].includes(kind));
  requireValue(kind === 'test' ? user.is_enterprise_admin === true : authorized, 'workflow.forbidden');
  const approved = listings.some(item => item.template.id === template.id && item.template.scope === template.scope &&
    String(item.enterprise_id) === String(scope.enterprise_id) && item.status === 'approved');
  if (listingId) requireValue(listings.some(item => item.id === listingId && item.template.id === template.id && item.template.scope === template.scope), 'workflow.notFound');
  if (kind !== 'offline') {
    requireValue(target && target.team_name && target.region_name && typeof target.app_name === 'string' && target.app_name.trim() && target.app_name.length <= 64, 'workflow.targetRequired');
    requireValue(kind === 'test' || target.team_name === scope.teamName || approved, 'workflow.teamOnly');
  }
  return { id, enterprise_id: String(scope.enterprise_id), source: copy(scope), template_id: template.id,
    version: template.version, template_name: template.template_name, listing_id: listingId || '', kind,
    target: kind === 'offline' ? null : copy(target), status: 'requested',
    user_id: String(user.user_id), user_name: user.nick_name || user.user_name || String(user.user_id), created_at: now };
}
function listingGroups(items) {
  const groups = new Map();
  items.forEach(item => {
    const group = groups.get(item.group_id) || { id: item.group_id, source: item.source, app_name: item.app_name,
      template_name: item.template_profile && item.template_profile.name || item.template.template_name, profile: item.template_profile || null, versions: [], latest_at: item.submitted_at };
    group.versions.push(item);
    if (item.submitted_at > group.latest_at) group.latest_at = item.submitted_at;
    groups.set(item.group_id, group);
  });
  return Array.from(groups.values()).map(group => {
    const versions = new Map();
    group.versions.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).forEach(item => {
      if (!versions.has(item.template.id)) versions.set(item.template.id, { ...item, history: [] });
      else versions.get(item.template.id).history.push(item);
    });
    const latest = Array.from(versions.values()).map(item => {
      const entries = [item, ...item.history];
      const pending = latestPublications(entries).find(row => listingRequiresReview(row) && row.status === 'pending');
      return pending ? { ...pending, history: entries.filter(row => row.id !== pending.id) } : item;
    });
    return { ...group, versions: latest, pending: latest.filter(version => listingRequiresReview(version) && version.status === 'pending').length };
  }).sort((a, b) => b.latest_at.localeCompare(a.latest_at));
}
function successfulDeliveryEnvironments(items) {
  const environments = new Map();
  items.filter(item => item.kind === 'delivery' && item.status === 'succeeded' && item.target).slice()
    .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)).forEach(item => {
      const target = item.target, key = JSON.stringify([target.team_name, target.region_name, target.app_id || target.app_name]);
      if (!environments.has(key)) environments.set(key, item);
    });
  return Array.from(environments.values());
}
module.exports = { submitListing, reviewListing, recordDelivery, listingGroups, successfulDeliveryEnvironments,
  listingRequiresReview, listingDeployable, latestPublications };
