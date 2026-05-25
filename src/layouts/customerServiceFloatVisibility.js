function shouldShowCustomerServiceFloat(options) {
  const settings = options || {};
  const pluginsLoaded = !!settings.pluginsLoaded;
  const showEnterprisebase = !!settings.showEnterprisebase;
  const isSaas = !!settings.isSaas;
  const agentVisible = !!settings.agentVisible;

  if (agentVisible) {
    return false;
  }

  if (!pluginsLoaded) {
    return false;
  }

  if (showEnterprisebase && !isSaas) {
    return false;
  }

  return true;
}

module.exports = {
  shouldShowCustomerServiceFloat,
};
