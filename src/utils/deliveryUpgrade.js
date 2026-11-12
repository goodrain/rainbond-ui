function deliveryUpgradePath(info) {
  const target = info && info.target;
  if (!info || !info.available || !info.upgrade_group_id || !info.app_model_id ||
      !target || !target.team_name || !target.region_name || !target.app_id) return '';
  return `/team/${encodeURIComponent(target.team_name)}/region/${encodeURIComponent(target.region_name)}/apps/${encodeURIComponent(target.app_id)}/upgrade` +
    `?app_model_id=${encodeURIComponent(info.app_model_id)}&upgrade_group_id=${encodeURIComponent(info.upgrade_group_id)}`;
}

function prioritizeDeliveryUpgrade(items, location) {
  const query = { ...Object.fromEntries(new URLSearchParams(location && location.search || '')), ...(location && location.query || {}) };
  if (!query.app_model_id || !query.upgrade_group_id) return items;
  const matches = row => String(row.group_key) === query.app_model_id && String(row.upgrade_group_id) === query.upgrade_group_id;
  return [...items.filter(matches), ...items.filter(row => !matches(row))];
}

module.exports = { deliveryUpgradePath, prioritizeDeliveryUpgrade };
