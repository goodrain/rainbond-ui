/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import { isUrl } from '../utils/utils';
import  getMenuSvg  from './getMenuSvg';

function menuData(eid, currentUser, enterprise) {
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
      icon:  getMenuSvg.getSvg('shareAlt'),
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
    if (
      enterprise &&
      rainbondUtil.isEnableMonitoring(enterprise) &&
      rainbondUtil.fetchMonitoring(enterprise)
    ) {
      const menuMap = {
        slo_monitor_suffix: '服务监控',
        cluster_monitor_suffix: '集群监控',
        node_monitor_suffix: '节点监控',
        component_monitor_suffix: '组件监控'
      };
      const monitoringObj = rainbondUtil.fetchMonitoring(enterprise);
      const seChildren = [];
      Object.keys(monitoringObj).map(item => {
        if (item !== 'home_url') {
          seChildren.push({
            name: menuMap[item],
            path: `/${item}/dashboard`,
            authority: ['admin', 'user']
          });
        }
      });

      menuArr.push({
        name: formatMessage({ id: 'menu.enterprise.monitoring' }),
        icon: monitoringSvg,
        path: `/enterprise/${eid}/monitoring`,
        authority: ['admin', 'user'],
        children: seChildren
      });
    }
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
    menuArr.push({
      name: '插件DEMO',
      icon: getMenuSvg.getSvg('plugin'),
      path: `/enterprise/${eid}/plugins/pluginsDemo`,
      authority: ['admin', 'user']
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

export const getMenuData = (eid, currentUser, enterprise) => {
  const menus = formatter(menuData(eid, currentUser, enterprise));
  return menus;
};
