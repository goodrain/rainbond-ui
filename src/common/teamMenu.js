import { formatMessage } from 'umi-plugin-locale';
import cookie from '../utils/cookie';
import roleUtil from '../utils/role';
import { isUrl } from '../utils/utils';

const newbieGuide = cookie.get('newbie_guide');

function menuData(teamName, regionName, permissionsInfo) {
  const menuArr = [
    {
      name: formatMessage({ id: 'menu.team.dashboard' }),
      icon: 'dashboard',
      path: `team/${teamName}/region/${regionName}/index`,
      authority: ['admin', 'user']
    }
  ];
  function results(moduleName, targets) {
    return roleUtil.queryTeamUserPermissionsInfo(
      permissionsInfo,
      moduleName,
      targets
    );
  }
  function addMenuArr(obj) {
    menuArr.push(obj);
  }
  if (permissionsInfo) {
    const appView = results('app', 'describe');
    const appCreateView = results('app', 'create');
    const componentCreateView = results('component', 'create');
    const componentConstructView = results('component', 'construct');
    const control = results('gatewayRule', 'describe');
    const certificate = results('certificate', 'describe');
    const pluginView = results('plugin', 'describe');
    // 动态
    const dynamic = results('teamBasicInfo', 'dynamic_describe');
    // 成员
    const members = results('teamMember', 'describe');
    // 集群
    const clusters = results('teamRegion', 'describe');
    // 角色
    const roles = results('teamRole', 'describe');

    if (appView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.app' }),
        icon: 'appstore-o',
        path: `team/${teamName}/region/${regionName}/apps`,
        authority: ['admin', 'user']
      });
    }
    if (appCreateView && componentCreateView && componentConstructView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.create' }),
        icon: 'plus',
        path: `team/${teamName}/region/${regionName}/create`,
        authority: ['admin', 'user'],
        children: [
          {
            name: formatMessage({ id: 'menu.team.create.code' }),
            path: `/code`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.image' }),
            path: `/image`,
            authority: ['admin', 'user']
          },
          // 基于软件包/yaml创建
          {
            name: formatMessage({ id: 'menu.team.create.upload' }),
            path: `/yaml`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.market' }),
            path: `/market`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.third' }),
            path: `/outer`,
            authority: ['admin', 'user']
          }
        ]
      });
    }

    if (control || certificate) {
      const children = [];
      if (control) {
        children.push({
          name: formatMessage({ id: 'menu.team.gateway.control' }),
          path: 'control',
          authority: ['admin', 'user']
        });
      }

      if (certificate) {
        children.push({
          name: formatMessage({ id: 'menu.team.gateway.certificate' }),
          path: 'license',
          authority: ['admin', 'user']
        });
      }
      addMenuArr({
        name: formatMessage({ id: 'menu.team.gateway' }),
        icon: 'gateway',
        path: `team/${teamName}/region/${regionName}/gateway`,
        authority: ['admin', 'user'],
        children
      });
    }

    if (pluginView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.plugin' }),
        icon: 'api',
        path: `team/${teamName}/region/${regionName}/myplugns`,
        authority: ['admin', 'user']
      });
    }

    if (dynamic || members || clusters || roles) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.setting' }),
        icon: 'setting',
        path: `team/${teamName}/region/${regionName}/team`,
        authority: ['admin', 'user']
      });
    }
    if (newbieGuide === 'false') {
      return menuArr;
    } 
    // else if (newbieGuide !== undefined) {
    //   addMenuArr({
    //     name: '任务',
    //     icon: 'exclamation-circle',
    //     path: `team/${teamName}/region/${regionName}/guide`,
    //     authority: ['admin', 'user']
    //   });
    // }
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
export const getMenuData = (teamName, regionName, permissionsInfo) => {
  const menus = formatter(menuData(teamName, regionName, permissionsInfo));
  return menus;
};
