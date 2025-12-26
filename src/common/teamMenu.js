import { formatMessage } from '@/utils/intl';
import cookie from '../utils/cookie';
import roleUtil from '../utils/newRole';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils';

const newbieGuide = cookie.get('newbie_guide');

function setTeamMenu(pluginMenu, menuName) {
  if (pluginMenu) {
    const isShow = pluginMenu.some(item => {
      return item.name == menuName;
    });
    return isShow;
  }
}

/**
 * 生成分组菜单数据
 * @param {string} teamName - 团队名称
 * @param {string} regionName - 集群名称
 * @param {object} permissionsInfo - 权限信息
 * @param {array} pluginList - 插件列表
 * @returns {array} 分组菜单数组
 */
function menuData(teamName, regionName, permissionsInfo, pluginList) {
  const menuGroups = [];

  function results() {
    return roleUtil.queryTeamOrAppPermissionsInfo(
      permissionsInfo.team,
      'team'
    );
  }

  const pluginArr = PluginUtil.segregatePluginsByHierarchy(pluginList, 'Team');

  // ============ 第一组：团队总览（无标题） ============
  menuGroups.push({
    groupKey: 'overview',
    groupName: '', // 无标题
    items: [
      {
        name: formatMessage({ id: 'menu.team.dashboard' }),
        icon: getMenuSvg.getSvg('dashboard'),
        path: `team/${teamName}/region/${regionName}/index`,
        authority: ['admin', 'user']
      }
    ]
  });

  // ============ 第二组：管理功能 ============
  if (permissionsInfo) {
    const {
      isTeamPluginManage,
      isTeamDynamic,
      isTeamRegion,
      isTeamRole,
      isTeamRegistryAuth
    } = results();

    const adminItems = [];

    // 流水线
    if (setTeamMenu(pluginList, 'pipeline')) {
      adminItems.push({
        name: formatMessage({ id: 'menu.team.pipeline' }),
        icon: getMenuSvg.getSvg('Pipeline'),
        path: `team/${teamName}/region/${regionName}/Pipeline`,
        authority: ['admin', 'user']
      });
    }

    // 插件管理
    if (isTeamPluginManage) {
      adminItems.push({
        name: formatMessage({ id: 'menu.team.plugin' }),
        icon: getMenuSvg.getSvg('api'),
        path: `team/${teamName}/region/${regionName}/myplugns`,
        authority: ['admin', 'user']
      });
    }

    // 团队设置
    if (isTeamDynamic || isTeamRegion || isTeamRole || isTeamRegistryAuth) {
      adminItems.push({
        name: formatMessage({ id: 'menu.team.setting' }),
        icon: getMenuSvg.getSvg('setting'),
        path: `team/${teamName}/region/${regionName}/team`,
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
    if (newbieGuide !== 'false' && pluginArr && pluginArr.length > 0) {
      const pluginItems = pluginArr.map(item => ({
        name: item.display_name,
        icon: getMenuSvg.getSvg('plugin'),
        path: `team/${teamName}/region/${regionName}/plugins/${item.name}`,
        authority: ['admin', 'user']
      }));

      menuGroups.push({
        groupKey: 'plugins',
        groupName: formatMessage({ id: 'menu.group.plugins', defaultMessage: '插件' }),
        items: pluginItems
      });
    }
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
export const getMenuData = (teamName, regionName, permissionsInfo, pluginList) => {
  const menuGroups = menuData(teamName, regionName, permissionsInfo, pluginList);
  return formatter(menuGroups);
};

/**
 * 将分组菜单展平为普通菜单数组（兼容旧代码）
 */
export const getFlatMenuData = (teamName, regionName, permissionsInfo, pluginList) => {
  const menuGroups = getMenuData(teamName, regionName, permissionsInfo, pluginList);
  return menuGroups.reduce((acc, group) => [...acc, ...group.items], []);
};
