function buildPodLogsStreamUrl(body = {}) {
  const query = [];

  if (body.container) {
    query.push(`container=${encodeURIComponent(body.container)}`);
  }
  if (body.lines) {
    query.push(`lines=${encodeURIComponent(body.lines)}`);
  }

  const suffix = query.length > 0 ? `?${query.join('&')}` : '';
  return `${body.baseUrl || ''}/console/teams/${body.team}/regions/${body.region}/k8s-center/pods/${body.pod_name}/logs${suffix}`;
}

module.exports = {
  buildPodLogsStreamUrl,
};
