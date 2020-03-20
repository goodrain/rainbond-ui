import { isUrl } from '../utils/utils';
import userUtil from '../utils/user';

const menuData = function(eid, currentUser) {
  const adminer = userUtil.isCompanyAdmin(currentUser);
  const clusterSvg = (
    <i className="anticon">
      <svg
        t="1584693382814"
        viewBox="0 0 1024 1024"
        version="1.1"
        p-id="812"
        width="20"
        height="20"
      >
        <path
          d="M512 542.72L286.72 412.16V151.04L512 20.48l225.28 130.56v261.12L512 542.72zM339.2 381.44L512 481.28l172.8-99.84V181.76L512 81.92l-172.8 99.84v199.68zM776.96 1006.08L551.68 875.52V614.4l225.28-130.56L1002.24 614.4v261.12L776.96 1006.08zM602.88 844.8l172.8 99.84L949.76 844.8V645.12l-172.8-99.84-172.8 99.84V844.8zM247.04 1006.08L21.76 875.52V614.4l225.28-130.56L473.6 614.4v261.12L247.04 1006.08zM74.24 844.8l172.8 99.84L421.12 844.8V645.12l-172.8-99.84-174.08 99.84V844.8z"
          fill="#9CA2A8"
          p-id="813"
        />
      </svg>
    </i>
  );
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
      path: `/enterprise/${eid}/shared`,
      authority: ['admin', 'user'],
    },
    {
      name: '团队',
      icon: 'team',
      path: `/enterprise/${eid}/teams`,
      authority: ['admin', 'user'],
    },
  ];
  if (adminer) {
    menuArr.push(
      {
        name: '集群',
        icon: clusterSvg,
        path: `/enterprise/${eid}/clusters`,
        authority: ['admin', 'user'],
      },
      {
        name: '用户',
        icon: 'user',
        path: `/enterprise/${eid}/users`,
        authority: ['admin', 'user'],
      },
      {
        name: '设置',
        icon: 'setting',
        path: `/enterprise/${eid}/setting`,
        authority: ['admin', 'user'],
      }
    );
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

export const getMenuData = (eid, currentUser) => {
  const menus = formatter(menuData(eid, currentUser));
  return menus;
};
