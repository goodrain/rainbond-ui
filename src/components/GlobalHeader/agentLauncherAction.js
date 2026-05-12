function resolveAgentLauncherAction(options) {
  const settings = options || {};
  const pluginStatus = settings.pluginStatus || 'pending';
  const isEnterpriseAdmin = !!settings.isEnterpriseAdmin;

  if (pluginStatus === 'installed') {
    return 'open';
  }

  if (pluginStatus === 'missing') {
    return isEnterpriseAdmin ? 'install' : 'contact_admin';
  }

  if (pluginStatus === 'error') {
    return 'error';
  }

  return 'pending';
}

module.exports = {
  resolveAgentLauncherAction,
};
