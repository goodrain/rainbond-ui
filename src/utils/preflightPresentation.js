const normalizeMessage = message => (message || '').trim();

const isGenericWarningSummary = summary => (
  summary === '部分安装前检测无法确认' ||
  summary === '部分安装环境检测未完成，安装可继续'
);

const getResourceDetails = checks => {
  const resourceCheck = checks.find(item => (
    item &&
    item.name === 'resource_capacity' &&
    item.status === 'block' &&
    item.reason === 'resource_not_enough'
  ));
  if (!resourceCheck || !resourceCheck.details) {
    return [];
  }

  const details = resourceCheck.details;
  const resourceDetails = [];
  if (
    Number.isFinite(details.required_cpu) &&
    Number.isFinite(details.free_cpu) &&
    Number.isFinite(details.missing_cpu)
  ) {
    resourceDetails.push(
      `CPU：需要 ${details.required_cpu}m，可用 ${details.free_cpu}m，缺少 ${details.missing_cpu}m`
    );
  }
  if (
    Number.isFinite(details.required_memory) &&
    Number.isFinite(details.free_memory) &&
    Number.isFinite(details.missing_memory)
  ) {
    resourceDetails.push(
      `内存：需要 ${details.required_memory}Mi，可用 ${details.free_memory}Mi，缺少 ${details.missing_memory}Mi`
    );
  }
  return resourceDetails;
};

const getPreflightDisplay = (preflight = {}) => {
  const summary = normalizeMessage(preflight.summary);
  const checks = Array.isArray(preflight.checks) ? preflight.checks : [];
  const seen = {};
  const messages = [];

  checks.forEach(item => {
    if (!item || (item.status !== 'block' && item.status !== 'warning')) {
      return;
    }
    const message = normalizeMessage(item.message);
    if (!message || message === summary || seen[message]) {
      return;
    }
    seen[message] = true;
    messages.push(message);
  });

  if (!summary && messages.length === 0 && preflight.msg_show) {
    messages.push(normalizeMessage(preflight.msg_show));
  }

  const display = {
    summary: messages.length > 0 && isGenericWarningSummary(summary) ? '' : summary,
    messages: messages.slice(0, 4)
  };
  const resourceDetails = getResourceDetails(checks);
  if (resourceDetails.length > 0) {
    display.resourceDetails = resourceDetails;
  }
  return display;
};

module.exports = {
  getPreflightDisplay
};
