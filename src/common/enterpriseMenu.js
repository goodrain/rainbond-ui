/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from '@/utils/intl';
import userUtil from '../utils/user';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils'

/**
 * 生成分组菜单数据
 * @param {string} eid - 企业ID
 * @param {object} currentUser - 当前用户
 * @param {object} enterprise - 企业信息
 * @param {object} pluginList - 插件列表
 * @param {array} clusterList - 集群列表
 * @returns {array} 分组菜单数组
 */
function menuData(eid, currentUser, enterprise, pluginList, clusterList) {
  const adminer = userUtil.isCompanyAdmin(currentUser);
  const menuGroups = [];

  // ============ 第一组：企业总览（无标题） ============
  menuGroups.push({
    groupKey: 'overview',
    groupName: '', // 无标题
    items: [
      {
        name: formatMessage({ id: 'menu.enterprise.dashboard' }),
        icon: getMenuSvg.getSvg('dashboard'),
        path: `/enterprise/${eid}/index`,
        authority: ['admin', 'user']
      }
    ]
  });

  // ============ 第二组：资源管理 ============
  if (adminer) {
    const resourceItems = [
      {
        name: formatMessage({ id: 'menu.enterprise.cluster' }),
        icon: getMenuSvg.getSvg('clusters'),
        path: `/enterprise/${eid}/clusters`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.team' }),
        icon: getMenuSvg.getSvg('teams'),
        path: `/enterprise/${eid}/teams`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.user' }),
        icon: getMenuSvg.getSvg('users'),
        path: `/enterprise/${eid}/users`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.share' }),
        icon: getMenuSvg.getSvg('shareAlt'),
        path: `/enterprise/${eid}/shared/local`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.log' }),
        icon: getMenuSvg.getSvg('logs'),
        path: `/enterprise/${eid}/logs`,
        authority: ['admin', 'user']
      }
    ];

    // 计量计费
    const billPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-bill');
    if (billPlugin && Object.keys(billPlugin).length !== 0) {
      const firstEntry = Object.entries(billPlugin)[0];
      if (firstEntry) {
        const [regionName] = firstEntry;
        resourceItems.push({
          name: formatMessage({ id: 'menu.enterprise.billing', defaultMessage: '计量计费' }),
          icon: getMenuSvg.getSvg('bill'),
          path: `/enterprise/${eid}/plugins/rainbond-bill?regionName=${regionName}`,
          authority: ['admin', 'user']
        });
      }
    }

    menuGroups.push({
      groupKey: 'resource',
      groupName: formatMessage({ id: 'menu.group.resource', defaultMessage: '资源管理' }),
      items: resourceItems
    });
  }

  // ============ 第三组：平台设置 ============
  if (adminer) {
    menuGroups.push({
      groupKey: 'settings',
      groupName: formatMessage({ id: 'menu.group.settings', defaultMessage: '平台设置' }),
      items: [
        {
          name: formatMessage({ id: 'menu.enterprise.extension' }),
          icon: getMenuSvg.getSvg('extension'),
          path: `/enterprise/${eid}/extension`,
          authority: ['admin', 'user']
        },
        {
          name: formatMessage({ id: 'menu.enterprise.setting' }),
          icon: getMenuSvg.getSvg('setting'),
          path: `/enterprise/${eid}/setting`,
          authority: ['admin', 'user']
        }
      ]
    });
  }

  // ============ 第四组：可观测性（监控中心、告警中心、日志中心） ============
  const observabilityItems = [];
  const observabilityPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-observability');
  const alarmPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-enterprise-alarm');
  const lokiPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-enterprise-logs');

  // 监控中心
  if (observabilityPlugin && Object.keys(observabilityPlugin).length !== 0) {
    const firstEntry = Object.entries(observabilityPlugin)[0];
    if (firstEntry) {
      const [regionName, plugin] = firstEntry;
      const showSelect = Object.keys(observabilityPlugin).length > 1;
      observabilityItems.push({
        name: plugin?.display_name || formatMessage({ id: 'menu.enterprise.monitoring', defaultMessage: '监控中心' }),
        icon: getMenuSvg.getSvg('monitoringSvg'),
        path: `/enterprise/${eid}/plugins/${plugin?.name || 'rainbond-observability'}?regionName=${regionName}${showSelect ? '&showSelect=true' : ''}`,
        authority: ['admin', 'user']
      });
    }
  }

  // 告警中心
  if (alarmPlugin && Object.keys(alarmPlugin).length !== 0) {
    const firstEntry = Object.entries(alarmPlugin)[0];
    if (firstEntry) {
      const [regionName, plugin] = firstEntry;
      const showSelect = Object.keys(alarmPlugin).length > 1;
      observabilityItems.push({
        name: plugin?.display_name || formatMessage({ id: 'menu.enterprise.alarm', defaultMessage: '告警中心' }),
        icon: getMenuSvg.getSvg('rainbond-enterprise-alarm'),
        path: `/enterprise/${eid}/plugins/${plugin?.name || 'rainbond-enterprise-alarm'}?regionName=${regionName}${showSelect ? '&showSelect=true' : ''}`,
        authority: ['admin', 'user']
      });
    }
  }

  // 日志中心
  if (lokiPlugin && Object.keys(lokiPlugin).length !== 0) {
    const firstEntry = Object.entries(lokiPlugin)[0];
    if (firstEntry) {
      const [regionName, plugin] = firstEntry;
      const showSelect = Object.keys(lokiPlugin).length > 1;
      observabilityItems.push({
        name: plugin?.display_name || formatMessage({ id: 'menu.enterprise.logs', defaultMessage: '日志中心' }),
        icon: getMenuSvg.getSvg('rainbond-enterprise-logs'),
        path: `/enterprise/${eid}/plugins/${plugin?.name || 'rainbond-enterprise-logs'}?regionName=${regionName}${showSelect ? '&showSelect=true' : ''}`,
        authority: ['admin', 'user']
      });
    }
  }

  if (observabilityItems.length > 0) {
    menuGroups.push({
      groupKey: 'observability',
      groupName: formatMessage({ id: 'menu.group.observability', defaultMessage: '可观测性' }),
      items: observabilityItems
    });
  }

  // ============ 第五组：插件（排除可观测性相关插件） ============
  const excludePlugins = ['rainbond-observability', 'rainbond-enterprise-alarm', 'rainbond-enterprise-logs', 'rainbond-bill'];
  const pluginObj = {};

  if (pluginList && Object.keys(pluginList).length !== 0) {
    Object.entries(pluginList).forEach(([key, value]) => {
      const pluginArr = PluginUtil.segregatePluginsByHierarchy(value, 'Platform');
      // 过滤掉已在其他分组中显示的插件
      const filteredPlugins = pluginArr.filter(p => !excludePlugins.includes(p.name));
      if (filteredPlugins.length > 0) {
        pluginObj[key] = filteredPlugins;
      }
    });
  }

  if (pluginObj && Object.keys(pluginObj).length > 0) {
    const pluginItems = [];
    Object.entries(pluginObj).forEach(([regionName, plugins]) => {
      plugins.forEach(plugin => {
        pluginItems.push({
          name: plugin.display_name,
          icon: getMenuSvg.getSvg('plugin'),
          path: `/enterprise/${eid}/plugins/${plugin.name}?regionName=${regionName}`,
          authority: ['admin', 'user']
        });
      });
    });

    if (pluginItems.length > 0) {
      menuGroups.push({
        groupKey: 'plugins',
        groupName: formatMessage({ id: 'menu.group.plugins', defaultMessage: '插件' }),
        items: pluginItems
      });
    }
  }

  return menuGroups;
}

function getRegionDispalyName(list, name) {
  const display_name = (list || []).filter(item => item.region_name == name)
  return display_name[0]?.region_alias || name
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
export const getMenuData = (eid, currentUser, enterprise, pluginList, clusterList) => {
  const menuGroups = menuData(eid, currentUser, enterprise, pluginList, clusterList);
  return formatter(menuGroups);
};

/**
 * 将分组菜单展平为普通菜单数组（兼容旧代码）
 */
export const getFlatMenuData = (eid, currentUser, enterprise, pluginList, clusterList) => {
  const menuGroups = getMenuData(eid, currentUser, enterprise, pluginList, clusterList);
  return menuGroups.reduce((acc, group) => [...acc, ...group.items], []);
};
