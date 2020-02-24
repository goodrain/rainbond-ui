import { isUrl } from '../utils/utils';
import globalUtil from '../utils/global';

const menuData = function(eid) {
  const menuArr = [
    {
      name: '总览',
      icon: 'dashboard',
      path: `/enterprise/${eid}/index`,
      authority: ['admin', 'user'],
    },
    {
      name: '共享库',
      icon: 'share-alt',
      // path: `/enterprise/${eid}/shareds`,
      // icon: 'team',
      path: `/enterprise/${globalUtil.getCurrEnterpriseId()}/shared`,
      authority: ['admin', 'user'],
    },
    {
      name: '团队',
      icon: 'team',
      path: `/enterprise/${eid}/teams`,
      authority: ['admin', 'user'],
    },
    {
      name: '设置',
      icon: 'setting',
      path: `/enterprise/${eid}/setting`,
      authority: ['admin', 'user'],
    }
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

export const getMenuData = (eid) => {
  const menus = formatter(menuData(eid));
  return menus;
};
