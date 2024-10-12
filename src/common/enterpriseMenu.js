/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';
import PluginUtil from '../utils/pulginUtils'

function menuData(eid, currentUser, enterprise, pluginList) {
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
  const pluginArr = PluginUtil.segregatePluginsByHierarchy(pluginList, 'Platform')
  if (pluginArr && pluginArr.length > 0) {
    const pluginChildren = []
    pluginArr.forEach(item => {
      pluginChildren.push({
        name: item.name,
        icon: getMenuSvg.getSvg('plugin'),
        path: `${item.name}`,
        authority: ['admin', 'user']
      });
    })
    menuArr.push({
      name: '插件DEMO',
      icon: getMenuSvg.getSvg('plugin'),
      path: `/enterprise/${eid}/plugins`,
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

export const getMenuData = (eid, currentUser, enterprise, pluginList) => {
  const menus = formatter(menuData(eid, currentUser, enterprise, pluginList));
  return menus;
};
