/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils'

function menuData(eid, currentUser, enterprise, pluginList, clusterList) {
  const adminer = userUtil.isCompanyAdmin(currentUser);
  const menuArr = [
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
    }
  ];
  let observabilityPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-observability');
  let alarmPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-enterprise-alarm');
  let Detectionarr = []
  if(observabilityPlugin && Object.keys(observabilityPlugin).length !== 0){
    Detectionarr.push(observabilityPlugin)
  }
  if(alarmPlugin && Object.keys(alarmPlugin).length !== 0){
    Detectionarr.push(alarmPlugin)
  }
  
  if (Detectionarr && Detectionarr.length == 1) {    
    const firstEntry = Object.entries(Detectionarr[0])[0];
    const [regionName, plugins] = firstEntry;    
    menuArr.push({
      name: '可观测',
      icon: getMenuSvg.getSvg('monitoringSvg'),
      path: `/enterprise/${eid}/plugins/${plugins?.name}?regionName=${regionName}`,
      authority: ['admin', 'user']
    });
  } else if (Detectionarr.length != 0 && Detectionarr.length  == 2) {
    const DetectionChildren = []
    Detectionarr.forEach(item => {
      const keys = Object.keys(item);
      const values = Object.values(item);
      DetectionChildren.push({
        name: values[0]?.display_name,
        icon: getMenuSvg.getSvg(values[0]?.name),
        path: `${values[0]?.name}?regionName=${keys[0]}`,
        authority: ['admin', 'user']
      });
    })
    menuArr.push({
      name: '可观测',
      icon: getMenuSvg.getSvg('monitoringSvg'),
      path: `/enterprise/${eid}/plugins`,
      authority: ['admin', 'user'],
      children: DetectionChildren
    })
  }
  if (rainbondUtil.isEnableBillingFunction()) {
    menuArr.push({
      name: '订购',
      icon: orderSvg,
      path: `/enterprise/${eid}/orders/overviewService`,
      authority: ['admin', 'user']
    });
  }
  menuArr.push({
    name: formatMessage({ id: 'menu.enterprise.team' }),
    icon: getMenuSvg.getSvg('teams'),
    path: `/enterprise/${eid}/teams`,
    authority: ['admin', 'user']
  });

  const billPlugin = PluginUtil.getPluginInfo(pluginList, 'rainbond-bill');
  if (billPlugin && Object.keys(billPlugin).length !== 0) {
    const firstEntry = Object.entries(billPlugin)[0];
    if (firstEntry) {
      const [regionName, plugins] = firstEntry;
      menuArr.push({
        name: '计量计费',
        icon: getMenuSvg.getSvg('bill'),
        path: `/enterprise/${eid}/plugins/rainbond-bill?regionName=${regionName}`,
        authority: ['admin', 'user']
      });
    }
  }

  if (adminer) {
    menuArr.push(
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
      }
    );
    menuArr.push({
      name: formatMessage({ id: 'menu.enterprise.log' }),
      icon: getMenuSvg.getSvg('logs'),
      path: `/enterprise/${eid}/logs`,
      authority: ['admin', 'user']
    });
    menuArr.push({
      name: formatMessage({ id: 'menu.enterprise.extension' }),
      icon: getMenuSvg.getSvg('extension'),
      path: `/enterprise/${eid}/extension`,
      authority: ['admin', 'user']
    });
    menuArr.push({
      name: formatMessage({ id: 'menu.enterprise.setting' }),
      icon: getMenuSvg.getSvg('setting'),
      path: `/enterprise/${eid}/setting`,
      authority: ['admin', 'user']
    });
  }
  const pluginObj = {};

  const clusterInfo = window.sessionStorage.getItem('cluster_info')

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
        path: pluginObj && Object.keys(pluginObj).length === 1
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

    menuArr.push({
      name: '插件列表',
      icon: getMenuSvg.getSvg('plugin'),
      path: `/enterprise/${eid}/plugins`,
      authority: ['admin', 'user'],
      children: pluginChildren,
    });
  }

  return menuArr;
}

function getRegionDispalyName(list, name) {
  const display_name = (list || []).filter(item => item.region_name == name)
  return display_name[0].region_alias || name
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

export const getMenuData = (eid, currentUser, enterprise, pluginList, clusterList) => {
  const menus = formatter(menuData(eid, currentUser, enterprise, pluginList, clusterList));
  return menus;
};
