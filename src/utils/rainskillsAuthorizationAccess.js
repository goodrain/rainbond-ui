function resolveRainskillsAccessStatus(response, error) {
  if (error || !response || !response.bean) {
    return 'error';
  }
  return response.bean.can_open_agent === true ? 'allowed' : 'denied';
}

function isCurrentAccessRequest(mounted, requestId, currentRequestId) {
  return !!mounted && requestId === currentRequestId;
}

module.exports = {
  resolveRainskillsAccessStatus,
  isCurrentAccessRequest
};
