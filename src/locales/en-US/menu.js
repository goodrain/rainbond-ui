const enterpriseMenu = {
  'menu.enterprise.dashboard': 'Overview',
  'menu.enterprise.share': 'Market',
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
  'menu.team.create.code': 'Build from source code',
  'menu.team.create.image': 'Build from images',
  'menu.team.create.upload': 'Kubernetes YAML Helm',
  'menu.team.create.market': 'Install from the App Market',
  'menu.team.create.third': 'Create third party components',
  'menu.team.app': 'Apps',
  'menu.team.gateway': 'Gateway',
  'menu.team.gateway.certificate': 'Certificate Manage',
  'menu.team.gateway.control': 'Access Policy Manage',
  'menu.team.plugin': 'Plugin',
  'menu.team.setting': 'Manage',
}

const appMenu = {
  'menu.app.dashboard': 'Overview',
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
  'GlobalHeader.exit':'Log out',
  'GlobalHeader.serve':'Enterprise service',
  'GlobalHeader.close':'Do you want to turn off the novice boot function, or fail to turn it on after turning it off?',
  'GlobalHeader.manual':'Platform User Manual',
  'GlobalHeader.new':'Newbie guide',
}



export default Object.assign({}, enterpriseMenu, teamMenu, appMenu, CustomFooter);