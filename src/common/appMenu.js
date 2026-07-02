/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from '@/utils/intl';
import roleUtil from '../utils/newRole';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils';
import { isPluginBaseId } from '../utils/pluginArchUtils';

const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-observability';

function getApplicationPluginMenuName(plugin) {
  if (isPluginBaseId(plugin, GATEWAY_MONITORING_PLUGIN_ID)) {
    return formatMessage({
      id: 'menu.app.gatewayMonitoring.applicationTraffic',
      defaultMessage: '应用流量'
    });
  }
  return plugin.display_name;
}

/**
 * 生成分组菜单数据
 * @param {string} teamName - 团队名称
 * @param {string} regionName - 集群名称
 * @param {string} appID - 应用ID
 * @param {object} permissionsInfo - 权限信息
 * @param {array} pluginList - 插件列表
 * @param {object} currentUser - 当前用户
 * @param {object} rainbondInfo - 平台信息
 * @returns {array} 分组菜单数组
 */
function menuData(teamName, regionName, appID, permissionsInfo, pluginList, currentUser, rainbondInfo) {
  const pluginArr = PluginUtil.segregatePluginsByHierarchy(pluginList, 'Application');
  const appPermissions = roleUtil.queryTeamOrAppPermissionsInfo(permissionsInfo.team, 'app', `app_${appID}`);
  const isEnterpriseAdmin = !!(currentUser && currentUser.is_enterprise_admin);
  const canAccessSaasAdminFeature = !(rainbondInfo && rainbondInfo.is_saas) || isEnterpriseAdmin;
  const canAccessAppK8sResources = canAccessSaasAdminFeature;
  const canAccessAppBackup = canAccessSaasAdminFeature;
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

  const menuGroups = [];

  // ============ 第一组：应用总览（无标题） ============
  menuGroups.push({
    groupKey: 'overview',
    groupName: '', // 无标题
    items: [
      {
        name: formatMessage({ id: 'menu.app.dashboard' }),
        icon: getMenuSvg.getSvg('dashboard'),
        path: `team/${teamName}/region/${regionName}/apps/${appID}/overview`,
        authority: ['admin', 'user']
      }
    ]
  });

  // ============ 第二组：管理功能 ============
  const adminItems = [];

  adminItems.push({
    name: formatMessage({ id: 'menu.app.version' }),
    icon: getMenuSvg.getSvg('version'),
    path: `team/${teamName}/region/${regionName}/apps/${appID}/version`,
    authority: ['admin', 'user']
  });

  if (isAppGatewayMonitor || isAppRouteManage || isAppTargetServices || isAppCertificate) {
    adminItems.push({
      name: formatMessage({ id: 'menu.app.gateway' }),
      icon: getMenuSvg.getSvg('gateway'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/gateway`,
      authority: ['admin', 'user']
    });
  }

  if (
    canAccessAppBackup &&
    PluginUtil.isInstallEnterprisePlugin(pluginList) &&
    (isEnterpriseAdmin || !rainbondInfo?.security_restrictions?.enable)
  ) {
    adminItems.push({
      name: formatMessage({ id: 'menu.app.backup' }),
      icon: getMenuSvg.getSvg('backup'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/backup`,
      authority: ['admin', 'user']
    });
  }

  if (
    isAppResources &&
    (isEnterpriseAdmin || !rainbondInfo?.security_restrictions?.enable) &&
    canAccessAppK8sResources
  ) {
    adminItems.push({
      name: formatMessage({ id: 'menu.app.k8s' }),
      icon: getMenuSvg.getSvg('kubenetes'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/asset`,
      authority: ['admin', 'user']
    });
  }

  if (isAppConfigGroup) {
    adminItems.push({
      name: formatMessage({ id: 'menu.app.configgroups' }),
      icon: getMenuSvg.getSvg('setting'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/configgroups`,
      authority: ['admin', 'user']
    });
  }

  if (adminItems.length > 0) {
    menuGroups.push({
      groupKey: 'administration',
      groupName: formatMessage({ id: 'menu.group.administration', defaultMessage: '管理功能' }),
      items: adminItems
    });
  }

  // ============ 第三组：插件 ============
  if (pluginArr && pluginArr.length > 0) {
    const pluginItems = pluginArr.map(item => ({
      name: getApplicationPluginMenuName(item),
      icon: getMenuSvg.getSvg('plugin'),
      path: `team/${teamName}/region/${regionName}/apps/${appID}/plugins/${item.name}`,
      authority: ['admin', 'user']
    }));

    menuGroups.push({
      groupKey: 'plugins',
      groupName: formatMessage({ id: 'menu.group.plugins', defaultMessage: '插件' }),
      items: pluginItems
    });
  }

  return menuGroups;
}

/**
 * 格式化菜单项路径
 */
function formatMenuItems(items, parentPath = '', parentAuthority) {
  return items.map(item => {
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
      result.children = formatMenuItems(
        item.children,
        `${parentPath}${item.path}/`,
        item.authority
      );
    }
    return result;
  });
}

/**
 * 格式化分组菜单数据
 */
function formatter(menuGroups) {
  return menuGroups.map(group => ({
    ...group,
    items: formatMenuItems(group.items)
  }));
}

/**
 * 获取分组菜单数据
 */
export const getAppMenuData = (
  teamName,
  regionName,
  appID,
  permissionsInfo,
  pluginList,
  currentUser,
  rainbondInfo
) => {
  const menuGroups = menuData(teamName, regionName, appID, permissionsInfo, pluginList, currentUser, rainbondInfo);
  return formatter(menuGroups);
};

/**
 * 将分组菜单展平为普通菜单数组（兼容旧代码）
 */
export const getFlatAppMenuData = (
  teamName,
  regionName,
  appID,
  permissionsInfo,
  pluginList,
  currentUser,
  rainbondInfo
) => {
  const menuGroups = getAppMenuData(teamName, regionName, appID, permissionsInfo, pluginList, currentUser, rainbondInfo);
  return menuGroups.reduce((acc, group) => [...acc, ...group.items], []);
};
