import { isUrl } from '../utils/utils';
import globalUtil from '../utils/global';
import configureGlobal from '../utils/configureGlobal';
import cookie from '../utils/cookie';

const menuData = function() {
  const menuArr = [
    {
      name: '总览',
      icon: 'dashboard',
      path: `/enterprise/${globalUtil.getCurrEnterpriseId()}/index`,
      authority: ['admin', 'user'],
    },
    {
      name: '团队',
      icon: 'team',
      path: `/enterprise/${globalUtil.getCurrEnterpriseId()}/teams`,
      authority: ['admin', 'user'],
    },
    {
      name: '设置',
      icon: 'setting',
      path: `/enterprise/${globalUtil.getCurrEnterpriseId()}/setting`,
      authority: ['admin', 'user'],
    },
    {
      name: '设置1',
      icon: 'setting',
      path: `/enterprise/${globalUtil.getCurrEnterpriseId()}/setting1`,
      authority: ['admin', 'user'],
    },
  ];
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
  return menus;
};
