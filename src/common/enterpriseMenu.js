/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from '@/utils/intl';
import rainbondUtil from '../utils/rainbond';
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

  // ============ 第一组：基础功能 ============
  const basicGroup = {
    groupKey: 'basic',
    groupName: formatMessage({ id: 'menu.group.basic', defaultMessage: '基础功能' }),
    items: [
      {
        name: formatMessage({ id: 'menu.enterprise.dashboard' }),
        icon: getMenuSvg.getSvg('dashboard'),
        path: `/enterprise/${eid}/index`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.share' }),
        icon: getMenuSvg.getSvg('shareAlt'),
        path: `/enterprise/${eid}/shared/local`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.team' }),
        icon: getMenuSvg.getSvg('teams'),
        path: `/enterprise/${eid}/teams`,
        authority: ['admin', 'user']
      }
    ]
  };
  menuGroups.push(basicGroup);

  // ============ 第二组：可观测性 ============
  const observabilityItems = [];
  const observabilityPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-observability');
  const alarmPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-enterprise-alarm');
  const lokiPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-enterprise-logs');

  const detectionArr = [];
  if (observabilityPlugin && Object.keys(observabilityPlugin).length !== 0) {
    detectionArr.push(observabilityPlugin);
  }
  if (alarmPlugin && Object.keys(alarmPlugin).length !== 0) {
    detectionArr.push(alarmPlugin);
  }
  if (lokiPlugin && Object.keys(lokiPlugin).length !== 0) {
    detectionArr.push(lokiPlugin);
  }

  if (detectionArr.length === 1) {
    const firstEntry = Object.entries(detectionArr[0])[0];
    if (firstEntry && firstEntry.length >= 1) {
      const [regionName, plugins] = firstEntry;
      const showSelect = Object.keys(detectionArr[0]).length > 1;
      observabilityItems.push({
        name: formatMessage({ id: 'menu.enterprise.observability', defaultMessage: '可观测性' }),
        icon: getMenuSvg.getSvg('monitoringSvg'),
        path: `/enterprise/${eid}/plugins/${plugins?.name || ''}?regionName=${regionName}${showSelect ? '&showSelect=true' : ''}`,
        authority: ['admin', 'user']
      });
    }
  } else if (detectionArr.length >= 2) {
    const detectionChildren = [];
    detectionArr.forEach(item => {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const showSelect = keys.length > 1;
      detectionChildren.push({
        name: values[0]?.display_name,
        icon: getMenuSvg.getSvg(values[0]?.name),
        path: `${values[0]?.name}?regionName=${keys[0]}${showSelect ? '&showSelect=true' : ''}`,
        authority: ['admin', 'user']
      });
    });
    observabilityItems.push({
      name: formatMessage({ id: 'menu.enterprise.observability', defaultMessage: '可观测性' }),
      icon: getMenuSvg.getSvg('monitoringSvg'),
      path: `/enterprise/${eid}/plugins`,
      authority: ['admin', 'user'],
      children: detectionChildren
    });
  }

  // 计量计费
  const billPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-bill');
  if (billPlugin && Object.keys(billPlugin).length !== 0) {
    const firstEntry = Object.entries(billPlugin)[0];
    if (firstEntry) {
      const [regionName] = firstEntry;
      observabilityItems.push({
        name: formatMessage({ id: 'menu.enterprise.billing', defaultMessage: '计量计费' }),
        icon: getMenuSvg.getSvg('bill'),
        path: `/enterprise/${eid}/plugins/rainbond-bill?regionName=${regionName}`,
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

  // ============ 第三组：商业功能 ============
  const commercialItems = [];
  if (rainbondUtil.isEnableBillingFunction()) {
    commercialItems.push({
      name: formatMessage({ id: 'menu.enterprise.order', defaultMessage: '订购' }),
      icon: getMenuSvg.getSvg('order'),
      path: `/enterprise/${eid}/orders/overviewService`,
      authority: ['admin', 'user']
    });
  }

  if (commercialItems.length > 0) {
    menuGroups.push({
      groupKey: 'commercial',
      groupName: formatMessage({ id: 'menu.group.commercial', defaultMessage: '商业功能' }),
      items: commercialItems
    });
  }

  // ============ 第四组：管理功能 (仅管理员) ============
  if (adminer) {
    const adminGroup = {
      groupKey: 'administration',
      groupName: formatMessage({ id: 'menu.group.administration', defaultMessage: '管理功能' }),
      items: [
        {
          name: formatMessage({ id: 'menu.enterprise.cluster' }),
          icon: getMenuSvg.getSvg('clusters'),
          path: `/enterprise/${eid}/clusters`,
          authority: ['admin', 'user']
        },
        {
          name: formatMessage({ id: 'menu.enterprise.user' }),
          icon: getMenuSvg.getSvg('users'),
          path: `/enterprise/${eid}/users`,
          authority: ['admin', 'user']
        },
        {
          name: formatMessage({ id: 'menu.enterprise.log' }),
          icon: getMenuSvg.getSvg('logs'),
          path: `/enterprise/${eid}/logs`,
          authority: ['admin', 'user']
        },
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
    };
    menuGroups.push(adminGroup);
  }

  // ============ 第五组：插件系统 ============
  const pluginObj = {};
  if (pluginList && Object.keys(pluginList).length !== 0) {
    Object.entries(pluginList).forEach(([key, value]) => {
      const pluginArr = PluginUtil.segregatePluginsByHierarchy(value, 'Platform');
      if (pluginArr.length > 0) {
        pluginObj[key] = pluginArr;
      }
    });
  }

  if (pluginObj && Object.keys(pluginObj).length > 0) {
    const pluginChildren = [];
    Object.entries(pluginObj).forEach(([regionName, plugins]) => {
      const regionPluginChildren = plugins.map(val => ({
        name: val.display_name,
        icon: getMenuSvg.getSvg('plugin'),
        path: Object.keys(pluginObj).length === 1
          ? `${val.name}?regionName=${regionName}`
          : val.name,
        authority: ['admin', 'user']
      }));

      if (Object.keys(pluginObj).length > 1) {
        pluginChildren.push({
          name: getRegionDispalyName(clusterList, regionName),
          icon: getMenuSvg.getSvg('clusters'),
          path: regionName,
          authority: ['admin', 'user'],
          children: regionPluginChildren,
        });
      } else {
        pluginChildren.push(...regionPluginChildren);
      }
    });

    menuGroups.push({
      groupKey: 'plugins',
      groupName: formatMessage({ id: 'menu.group.plugins', defaultMessage: '插件系统' }),
      items: [{
        name: formatMessage({ id: 'menu.enterprise.plugins', defaultMessage: '插件列表' }),
        icon: getMenuSvg.getSvg('plugin'),
        path: `/enterprise/${eid}/plugins`,
        authority: ['admin', 'user'],
        children: pluginChildren,
      }]
    });
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
