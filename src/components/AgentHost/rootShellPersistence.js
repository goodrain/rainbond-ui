function shouldPersistAgentSnapshotImmediately(agent, options = {}) {
  const panelClosed = !!options.panelClosed;
  if (panelClosed) {
    return true;
  }

  if (!agent) {
    return false;
  }

  const pendingApproval = agent.pendingApproval;
  if (pendingApproval && pendingApproval.status === 'pending') {
    return false;
  }

  return !agent.sending;
}

module.exports = {
  shouldPersistAgentSnapshotImmediately,
};
