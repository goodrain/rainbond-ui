function escapeLogQLString(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function buildHistoryLogQuery(appAlias, keyword = '') {
  const selector = `{service_alias="${escapeLogQLString(appAlias)}"}`;
  const normalizedKeyword = String(keyword || '').trim();
  if (!normalizedKeyword) {
    return selector;
  }
  return `${selector} |= "${escapeLogQLString(normalizedKeyword)}"`;
}

module.exports = {
  buildHistoryLogQuery
};
