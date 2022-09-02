const enterpriseMenu = {
  'menu.enterprise.dashboard': 'Overview',
  'menu.enterprise.share': 'Share',
  'menu.enterprise.team': 'Team',
  'menu.enterprise.cluster': 'Cluster',
  'menu.enterprise.user': 'User',
  'menu.enterprise.monitoring': 'Monitoring',
  'menu.enterprise.audit': 'Audit',
  'menu.enterprise.setting': 'Setting',
};

const teamMenu = {
  'menu.team.dashboard': 'Overview',
  'menu.team.create': 'Add',
  'menu.team.create.code': 'Building from source',
  'menu.team.create.image': 'Building from images',
  'menu.team.create.upload': 'Kubernetes YAML import',
  'menu.team.create.market': 'Install from the app Marketplace',
  'menu.team.create.third': 'Creating third-party components',
  'menu.team.app': 'Apply',
  'menu.team.gateway': 'Gateway',
  'menu.team.gateway.certificate': 'certificate management',
  'menu.team.gateway.control': 'Access Policy Management',
  'menu.team.plugin': 'Plugin',
  'menu.team.setting': 'Manage',
}

const appMenu = {
  'menu.app.dashboard': 'Overview',
  'menu.app.publish': 'release',
  'menu.app.backup': 'backups',
  'menu.app.gateway': 'gateway',
  'menu.app.configgroups': 'configuration',
  'menu.app.k8s': 'K8s resources',
  'menu.app.upgrade': 'upgrade'
}



export default Object.assign({}, enterpriseMenu, teamMenu, appMenu);