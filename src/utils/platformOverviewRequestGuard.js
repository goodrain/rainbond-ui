function createRequestId(section, sequence) {
  return `${section}:${sequence}`;
}

function isLatestRequest(activeRequestId, responseRequestId) {
  return Boolean(activeRequestId && activeRequestId === responseRequestId);
}

function getErrorMessage(error) {
  if (error && error.response && error.response.data) {
    const body = error.response.data;
    const nested = body.data || {};
    return body.msg_show || body.msg || nested.msg_show || nested.msg || 'request failed';
  }
  return (error && error.message) || 'request failed';
}

const inFlightRequests = {};

function requestContext(section, payload) {
  if (section === 'cluster') return payload.regionName;
  if (section === 'metrics') return `${payload.regionName}|${payload.metric}|${payload.range}`;
  return 'global';
}

function requestKey(section, payload) {
  return `${section}|${payload.enterpriseId || ''}|${requestContext(section, payload)}`;
}

function runDeduped(key, loader) {
  if (inFlightRequests[key]) return inFlightRequests[key];
  const promise = Promise.resolve().then(loader);
  inFlightRequests[key] = promise;
  const clear = () => {
    if (inFlightRequests[key] === promise) delete inFlightRequests[key];
  };
  promise.then(clear, clear);
  return promise;
}

function clearInFlightRequests() {
  Object.keys(inFlightRequests).forEach(key => delete inFlightRequests[key]);
}

function inFlightRequestCount() {
  return Object.keys(inFlightRequests).length;
}

module.exports = {
  createRequestId,
  clearInFlightRequests,
  getErrorMessage,
  inFlightRequestCount,
  isLatestRequest,
  requestContext,
  requestKey,
  runDeduped
};
