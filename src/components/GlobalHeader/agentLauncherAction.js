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

function resolveAgentPlatformPolicy(options) {
  const settings = options || {};
  const access = settings.access || {};
  const edition = access.edition || (access.is_open_source ? 'open_source' : 'enterprise');
  const isEnterpriseAdmin = !!settings.isEnterpriseAdmin;
  const isOpenSource = edition === 'open_source' || !!access.is_open_source;
  const isInitialEnterpriseAdmin = !!access.is_initial_enterprise_admin;

  if (isOpenSource) {
    if (isEnterpriseAdmin && isInitialEnterpriseAdmin) {
      return 'plugin_then_config';
    }
    return 'open_source_upgrade';
  }

  if (isEnterpriseAdmin) {
    return 'plugin_then_config';
  }

  return 'config_only';
}

module.exports = {
  resolveAgentPlatformPolicy,
  resolveAgentLauncherAction,
};
