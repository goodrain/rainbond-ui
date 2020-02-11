import { isUrl } from '../utils/utils';
import globalUtil from '../utils/global';
import configureGlobal from '../utils/configureGlobal';
import cookie from '../utils/cookie';

const newbie_guide = cookie.get('newbie_guide');
const menuData = function() {
  const menuArr = [
    {
      name: '团队总览',
      icon: 'dashboard',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`,
      authority: ['admin', 'user'],
    },
    {
      name: '创建应用',
      icon: 'plus',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create`,
      authority: ['admin', 'user'],
      children: [
        {
          name: '从源码创建',
          path: 'code',
          authority: ['admin', 'user'],


        },
        {
          name: '从Docker镜像创建',
          path: 'image',
      authority: ['admin', 'user'],

        },
        {
          name: '从应用市场安装',
          path: 'market',
      authority: ['admin', 'user'],

        },
        {
          name: '添加第三方组件',
          path: 'outer',
      authority: ['admin', 'user'],

        },
      ],
    },
    {
      name: '应用管理',
      icon: 'appstore-o',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`,
      authority: ['admin', 'user'],

    },
    {
      name: '应用网关',
      icon: 'gateway',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway`,
      authority: ['admin', 'user'],

      children: [
        {
          name: '访问控制',
          path: 'control',
      authority: ['admin', 'user'],

        },
        {
          name: '证书管理',
          path: 'license',
      authority: ['admin', 'user'],

        },
      ],
    },
    {
      name: '插件管理',
      icon: 'api',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`,
      authority: ['admin', 'user'],

    },
    {
      name: '团队管理',
      icon: 'team',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/team`,
      authority: ['admin', 'user'],

    },
    {
      name: '内部市场',
      icon: 'usb',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`,
      authority: ['admin', 'user'],

    },
    {
      name: '企业中心',
      icon: 'red-envelope',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/finance`,
      authority: ['admin', 'user'],

    },
  ];
  if (newbie_guide == 'false') {
    return menuArr;
  } else if (newbie_guide !== undefined) {
    menuArr.push({
      name: '任务引导',
      icon: 'exclamation-circle',
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/guide`,
      authority: ['admin', 'user'],
    });
  }
  return menuArr;
};

function formatter(data, parentPath = '', parentAuthority) {
  return data.map(item => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority,
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

// 处理我的应用二级和三级菜单

export const getMenuData = (groups, is_complete) => {
  const menus = formatter(menuData());
  if (groups && groups.length) {
    for (let i = 0; i < menus.length; i++) {
      const item = menus[i];

      if (item.path.indexOf('groups') > -1) {
        item.children = groups.map(group => {
          const children = (group.service_list || []).map(item => ({
            name: item.service_cname,
            path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
              item.service_alias
            }`,
            link: true,
            exact: true,
            hideInMenu: true, // 隐藏该组
          }));
          return {
            name: group.group_name,
            path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
              group.group_id
            }`,
            link: true,
            children: is_complete ? children : false,
            hideInBreadcrumb: true, // 隐藏该条
            exact: true,
          };
        });
      }
    }
  }

  return menus;
};
