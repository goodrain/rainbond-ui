function buildDeployPreflightRequestData(body = {}) {
  const payload = body.payload || {};
  const data = {
    deploy_type: body.deploy_type,
    payload
  };
  const groupId = body.group_id || payload.group_id;
  if (groupId) {
    data.group_id = groupId;
  }
  return data;
}

module.exports = {
  buildDeployPreflightRequestData
};
