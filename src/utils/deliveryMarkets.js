const opaque = value => /^[a-f\d]{24,}$/i.test(value) || /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value);
function deliveryMarketOptions(items) {
  const unique = new Map();
  (items || []).forEach(item => {
    if (item.status !== 1 || !item.access_key || !(item.access_actions || []).includes('Write')) return;
    const id = item.store_id || item.name;
    if (!id || unique.has(id)) return;
    let host = '';
    try { host = new URL(item.url).host; } catch (error) { /* Older entries may have no address. */ }
    const location = [host, item.domain].filter(Boolean).join(' / ');
    const name = [item.alias, item.store_name, item.name].find(value => typeof value === 'string' && value.trim() && !opaque(value));
    unique.set(id, { id, name: name || location, location });
  });
  const options = [...unique.values()];
  return options.map(option => ({ ...option, name: options.some(other => other.id !== option.id && other.name === option.name) && option.location ?
    `${option.name}（${option.location}）` : option.name }));
}
module.exports = { deliveryMarketOptions };
