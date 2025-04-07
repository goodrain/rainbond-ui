export function createEnterprise(list, currentEnterprise) {
  if (currentEnterprise) {
    list.push({
      title: currentEnterprise.enterprise_alias,
      href: `/enterprise/${currentEnterprise.enterprise_id}/index`,
    });
  }
  return list;
}

export function createTeam(list, currentTeam, regionNmae) {
  if (currentTeam && regionNmae) {
    list.push({
      title: currentTeam.team_alias,
      href: `/team/${currentTeam.team_name}/region/${regionNmae}/index`,
    });
  }
  return list;
}

export function createApp(list, currentTeam, regionNmae, currentApp) {
  if (currentApp) {
    list.push({
      title: currentApp.appName,
      href: `/team/${currentTeam.team_name}/region/${regionNmae}/apps/${currentApp.appID}/overview`,
    });
  }
  return list;
}

export function createComponent(
  list,
  currentTeam,
  regionNmae,
  currentComponent
) {
  if (currentComponent) {
    list.push({
      title: currentComponent.componentName,
      href: `/team/${currentTeam.team_name}/region/${regionNmae}/components/${currentComponent.componentID}/overview`,
    });
  }
  return list;
}
