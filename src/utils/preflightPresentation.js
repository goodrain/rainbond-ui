const normalizeMessage = message => (message || '').trim();

const DEPLOY_REPLACEMENTS = [
  ['部分安装前检测无法确认', '部分部署前检测无法确认'],
  ['部分安装环境检测未完成，安装可继续', '部分部署前检测未完成，部署可继续'],
  ['安装环境检测通过', '部署前检测通过'],
  ['无法安装应用', '无法部署组件'],
  ['安装要求', '部署要求'],
  ['安装可继续', '部署可继续'],
  ['安装将继续', '部署将继续'],
  ['安装中观察', '部署中观察']
];

const normalizeCopy = (message, copyType) => {
  let text = normalizeMessage(message);
  if (copyType !== 'deploy') {
    return text;
  }
  DEPLOY_REPLACEMENTS.forEach(([from, to]) => {
    text = text.replace(from, to);
  });
  return text;
};

const isGenericWarningSummary = summary => (
  summary === '部分安装前检测无法确认' ||
  summary === '部分部署前检测无法确认' ||
  summary === '部分安装环境检测未完成，安装可继续' ||
  summary === '部分部署前检测未完成，部署可继续'
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

const getPreflightDisplay = (preflight = {}, options = {}) => {
  const summary = normalizeCopy(preflight.summary, options.copyType);
  const checks = Array.isArray(preflight.checks) ? preflight.checks : [];
  const seen = {};
  const messages = [];

  checks.forEach(item => {
    if (!item || (item.status !== 'block' && item.status !== 'warning')) {
      return;
    }
    const message = normalizeCopy(item.message, options.copyType);
    if (!message || message === summary || seen[message]) {
      return;
    }
    seen[message] = true;
    messages.push(message);
  });

  if (!summary && messages.length === 0 && preflight.msg_show) {
    messages.push(normalizeCopy(preflight.msg_show, options.copyType));
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
