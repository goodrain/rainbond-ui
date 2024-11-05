/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import roleUtil from '../utils/newRole';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils'

function menuData(teamName, regionName, appID, permissionsInfo,pluginList) {
  const pluginArr = PluginUtil.segregatePluginsByHierarchy(pluginList, 'Application')
  const appPermissions = roleUtil.queryTeamOrAppPermissionsInfo(permissionsInfo.team, 'app', `app_${appID}`);
  const {
    isAppRelease,
    isAppUpgrade,
    isAppGatewayMonitor,
    isAppRouteManage,
    isAppTargetServices,
    isAppCertificate,
    isAppResources,
    isAppConfigGroup,
  } = appPermissions;

  const menuArr = [
    {
      name: formatMessage({ id: 'menu.app.dashboard' }),
      icon: getMenuSvg.getSvg('dashboard'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}`,
      authority: ['admin', 'user']
    }
  ];

  function addMenuArr(obj) {
    menuArr.push(obj);
  }

  if (isAppRelease) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.publish' }),
      icon: getMenuSvg.getSvg('publish'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/publish`,
      authority: ['admin', 'user']
    });
  }

  if (isAppGatewayMonitor || isAppRouteManage || isAppTargetServices || isAppCertificate) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.gateway' }),
      icon: getMenuSvg.getSvg('gateway'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/gateway`,
      authority: ['admin', 'user']
    });
  }
  if (isAppUpgrade) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.upgrade' }),
      icon: getMenuSvg.getSvg('upgrade'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/upgrade`,
      authority: ['admin', 'user']
    });
  }
  if (PluginUtil.isInstallEnterprisePlugin(pluginList)) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.backup' }),
      icon: getMenuSvg.getSvg('backup'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/backup`,
      authority: ['admin', 'user']
    });
  }
  if (isAppResources) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.k8s' }),
      icon: getMenuSvg.getSvg('kubenetes'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/asset`,
      authority: ['admin', 'user']
    });
    
  }
  if (isAppConfigGroup) {
    addMenuArr({
      name: formatMessage({ id: 'menu.app.configgroups' }),
      icon: getMenuSvg.getSvg('setting'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/configgroups`,
      authority: ['admin', 'user']
    });
  }
  if (pluginArr && pluginArr.length > 0) {
    const pluginChildren = []
    pluginArr.forEach(item => {
      pluginChildren.push({
        name: item.display_name,
        icon: getMenuSvg.getSvg('plugin'),
        path: `${item.name}`,
        authority: ['admin', 'user']
      });
    })
    menuArr.push({
      name: '插件列表',
      icon: getMenuSvg.getSvg('plugin'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/plugins`,
      authority: ['admin', 'user'],
      children: pluginChildren
    });
  }
  return menuArr;
}

function formatter(data, parentPath = '', parentAuthority) {
  return data.map(item => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority
    };
    if (item.children) {
      result.children = formatter(
        item.children,
        `${parentPath}${item.path}/`,
        item.authority
      );
    }
    return result;
  });
}

export const getAppMenuData = (
  teamName,
  regionName,
  appID,
  permissionsInfo,
  pluginList
) => {
  const menus = formatter(
    menuData(teamName, regionName, appID, permissionsInfo, pluginList)
  );
  return menus;
};
