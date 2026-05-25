const enterpriseMenu = {
  'menu.enterprise.dashboard': 'Overview',
  'menu.enterprise.share': 'Market',
  'menu.enterprise.team': 'Team',
  'menu.enterprise.cluster': 'Cluster',
  'menu.enterprise.user': 'User',
  'menu.enterprise.monitoring': 'Monitoring',
  'menu.enterprise.audit': 'Audit',
  'menu.enterprise.log': 'Platform Log',
  'menu.enterprise.extension': 'Extension',
  'menu.enterprise.setting': 'Setting',
  'menu.enterprise.order': 'Orders',
  'menu.enterprise.observability': 'Observability',
  'menu.enterprise.billing': 'Billing',
  'menu.enterprise.plugins': 'Plugins',
  'menu.enterprise.platform_resources': 'Platform Resources',
  'menu.enterprise.agent_config': 'AI Assistant Config',
  'menu.team.resource_center': 'K8S Native Resources',
  // Group titles
  'menu.group.basic': 'Basic',
  'menu.group.observability': 'Observability',
  'menu.group.commercial': 'Commercial',
  'menu.group.administration': 'Administration',
  'menu.group.plugins': 'Plugins',
  'menu.group.ai': 'AI',
  // View switcher
  'menu.switcher.workspace': 'Workspace',
  'menu.switcher.platform': 'Platform',
  'menu.switcher.explore': 'Explore',
  // Collapse menu
  'menu.collapse': 'Collapse',
  'menu.expand': 'Expand',
};

const teamMenu = {
  'menu.team.dashboard': 'Application Management',
  'menu.team.create': 'Add',
  'menu.team.create.wizard': 'Wizard page',
  'menu.team.create.code': 'Build from source code',
  'menu.team.create.image': 'Build from images',
  'menu.team.create.upload': 'Yaml Helm K8s',
  'menu.team.create.market': 'Install from the App Market',
  'menu.team.create.third': 'Create third party components',
  'menu.team.app': 'Apps',
  'menu.team.gateway': 'Gateway',
  'menu.team.gateway.certificate': 'Certificate Manage',
  'menu.team.gateway.control': 'Access Policy Manage',
  'menu.team.plugin': 'Plugin',
  'menu.team.setting': 'Manage',
  'menu.team.pipeline': 'Pipeline',
}

const appMenu = {
  'menu.app.dashboard': 'Overview',
  'menu.app.version': 'Versions',
  'menu.app.publish': 'Publish',
  'menu.app.backup': 'Backups',
  'menu.app.gateway': 'Gateway',
  'menu.app.configgroups': 'Config Group',
  'menu.app.k8s': 'K8S Resources',
  'menu.app.upgrade': 'Upgrade'
}


const CustomFooter = {
  'CustomFooter.goodrain':'Goodrain, Inc.',
  'CustomFooter.website':'Website',
  'CustomFooter.services':'Enterprise service',
  'CustomFooter.community':'Community',

  'GlobalHeader.success':'If the modification is successful, log in again',
  'GlobalHeader.core':'Personal center',
  'GlobalHeader.edit':'Change  password',
  'GlobalHeader.language':'Language',
  'GlobalHeader.exit':'Log out',
  'GlobalHeader.serve':'Enterprise service',
  'GlobalHeader.platform':'Platform manage',
  'GlobalHeader.close':'Do you want to turn off the novice boot function, or fail to turn it on after turning it off?',
  'GlobalHeader.manual':'Platform User Manual',
  'GlobalHeader.new':'Newbie guide',
  'GlobalHeader.help':'Help document',
  'GlobalHeader.market':'Application Market',
  'GlobalHeader.balance':'Balance',
  'GlobalHeader.account':'Account Center',
  'GlobalHeader.agent.install.title': 'AI assistant plugin not installed',
  'GlobalHeader.agent.install.content': 'The current enterprise has not installed the rainbond-agent plugin yet. Do you want to open the Extension Center to install it?',
  'GlobalHeader.agent.install.ok': 'Install now',
  'GlobalHeader.agent.install.cancel': 'Cancel',
  'GlobalHeader.agent.contact_admin': 'The AI assistant plugin is not installed for this enterprise. Please contact an enterprise administrator.',
  'GlobalHeader.agent.load_error': 'Failed to load the AI assistant plugin status. Please try again later.',
  'GlobalHeader.agent.loading': 'Checking the AI assistant plugin status. Please try again in a moment.',
  'GlobalHeader.agent.access.title': 'AI assistant is not available for this account yet',
  'GlobalHeader.agent.access.open_source_upgrade': 'The AI assistant is an optional Rainbond enhancement plugin. The Community Edition currently opens trial access to the first enterprise administrator by default. To enable team members to use it together, enable the Enterprise Edition plugin permission. Rainbond core capabilities remain open source and available.',
  'GlobalHeader.agent.access.ok': 'Got it',
  'GlobalHeader.agent.access.enterprise': 'Learn about Enterprise Edition',
  'GlobalHeader.agent.access.cancel': 'Got it',
  'GlobalHeader.agent.access.load_error': 'Failed to check AI assistant access. Please try again later.',
  'GlobalHeader.agent.config.missing.title': 'AI assistant configuration is incomplete',
  'GlobalHeader.agent.config.missing.content': 'The AI assistant plugin is installed, but the API key is not configured yet. Complete the AI assistant configuration before using it.',
  'GlobalHeader.agent.config.missing.contact_admin': 'The AI assistant plugin is installed, but the API key is not configured yet. Please contact an enterprise administrator to complete the configuration.',
  'GlobalHeader.agent.config.missing.ok': 'Configure',
  'GlobalHeader.agent.config.load_error': 'Failed to load the AI assistant configuration. Please try again later.',

}



export default Object.assign({}, enterpriseMenu, teamMenu, appMenu, CustomFooter);
