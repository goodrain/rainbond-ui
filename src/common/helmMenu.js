/* eslint-disable import/prefer-default-export */
/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import roleUtil from '../utils/role';
import { isUrl } from '../utils/utils';

const upgradeIcon = (
  <i className="anticon">
    <svg
      width="22px"
      height="22px"
      viewBox="0 0 22 22"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        id="应用视图-发布列表"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="发布"
          transform="translate(-21.000000, -407.000000)"
          fill="#979797"
          fillRule="nonzero"
          stroke="#979797"
        >
          <g id="编组-4备份" transform="translate(20.000000, 89.000000)">
            <g id="编组" transform="translate(2.000000, 318.922078)">
              <path
                d="M13.095,12.3053422 C12.9286229,12.3050607 12.7691004,12.2312553 12.65125,12.1000349 L9.99,9.10003492 L7.30625,12.0734986 C7.06082846,12.3450129 6.66488029,12.3428243 6.421875,12.0686103 C6.17886971,11.7943963 6.18082846,11.3519961 6.42625,11.0804818 L9.55375,7.61679469 C9.67128937,7.48608938 9.8305736,7.41306082 9.9964037,7.41384076 C10.1622338,7.41463326 10.3209576,7.48916952 10.4375,7.62098464 L13.53875,11.115398 C13.7811616,11.3900405 13.779486,11.8318875 13.535,12.1042249 C13.4176174,12.2331472 13.2595979,12.3053422 13.095,12.3053422 L13.095,12.3053422 Z"
                id="路径"
              />
              <path
                d="M9.98,19.9296439 C9.63482203,19.9296439 9.355,19.6169935 9.355,19.2313198 L9.355,9.30534218 C9.355,8.91966847 9.63482203,8.60701816 9.98,8.60701816 C10.325178,8.60701816 10.605,8.91966847 10.605,9.30534218 L10.605,19.2313198 C10.605,19.6169935 10.325178,19.9296439 9.98,19.9296439 L9.98,19.9296439 Z"
                id="路径"
              />
              <path
                d="M15.77875,15.3737779 L13.515,15.3737779 C13.169822,15.3737779 12.89,15.0611276 12.89,14.6754539 C12.89,14.2897802 13.169822,13.9771299 13.515,13.9771299 L15.77875,13.9771299 C17.418465,13.9763609 18.7479315,12.4921733 18.75,10.6600908 C18.7486226,8.82700962 17.4193569,7.34117169 15.77875,7.33886173 L14.0875,7.33886173 L14.18125,6.36958799 C14.1925,6.27740922 14.20625,6.18523045 14.20625,6.08886173 C14.2034964,3.50821116 12.3321813,1.41673167 10.0225,1.41288408 C7.71233049,1.41596243 5.84025512,3.50766675 5.8375,6.08886173 C5.8375,6.18523045 5.85125,6.27740922 5.8625,6.36958799 L5.95625,7.33886173 L4.22,7.33886173 C2.57988131,7.34194098 1.25137594,8.82755399 1.25,10.6600908 C1.25206741,12.4916284 2.58077307,13.9755909 4.22,13.9771299 L6.48375,13.9771299 C6.82892797,13.9771299 7.10875,14.2897802 7.10875,14.6754539 C7.10875,15.0611276 6.82892797,15.3737779 6.48375,15.3737779 L4.22,15.3737779 C1.89070276,15.3714691 0.00275646507,13.2626567 -2.84217094e-14,10.6600908 C0.0013773485,8.05620731 1.88952552,5.94529475 4.22,5.94221369 L4.58875,5.94221369 C4.66326437,2.64847942 7.07241868,0.020482261 10.02125,0.0162360335 C12.9703504,0.0197452723 15.3798886,2.64816122 15.45375,5.94221369 L15.7775,5.94221369 C18.1086654,5.9445238 19.9979324,8.05543669 20,10.6600908 C19.9965549,13.2628826 18.1082503,15.3714706 15.77875,15.3737779 Z"
                id="路径"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  </i>
);

function menuData(teamName, regionName, appID, permissionsInfo) {
  const appPermissions = roleUtil.querySpecifiedPermissionsInfo(
    permissionsInfo,
    'queryAppInfo'
  );

  const control = roleUtil.queryControlInfo(permissionsInfo, 'describe');

  const { isUpgrade } = appPermissions;
  const menuArr = [
    {
      name: formatMessage({ id: 'menu.app.dashboard' }),
      icon: 'dashboard',
      path: `team/${teamName}/region/${regionName}/apps/${appID}`,
      authority: ['admin', 'user']
    }
  ];

  function addMenuArr(obj) {
    menuArr.push(obj);
  }

  // if (control) {
  //   addMenuArr({
  //     name: formatMessage({ id: 'menu.app.gateway' }),
  //     icon: 'gateway',
  //     path: `team/${teamName}/region/${regionName}/apps/${appID}/gateway`,
  //     authority: ['admin', 'user']
  //   });
  // }
  // if (isUpgrade) {
  //   addMenuArr({
  //     name: formatMessage({ id: 'menu.app.upgrade' }),
  //     icon: upgradeIcon,
  //     path: `team/${teamName}/region/${regionName}/apps/${appID}/upgrade`,
  //     authority: ['admin', 'user']
  //   });
  // }
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

export const getHelmMenuData = (
  teamName,
  regionName,
  appID,
  permissionsInfo
) => {
  const menus = formatter(
    menuData(teamName, regionName, appID, permissionsInfo)
  );
  return menus;
};
