/* eslint-disable react/react-in-jsx-scope */
import { formatMessage } from 'umi-plugin-locale';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import { isUrl } from '../utils/utils';

function menuData(eid, currentUser, enterprise) {
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
  const orderSvg = (
    <i className="anticon">
      <svg
        t="1585203404203"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="18024"
        width="20"
        height="20"
      >
        <path
          d="M111.872 42.666667A26.538667 26.538667 0 0 0 85.333333 69.205333v885.589334c0 14.677333 11.861333 26.538667 26.538667 26.538666h800.256a26.538667 26.538667 0 0 0 26.538667-26.538666V69.205333A26.538667 26.538667 0 0 0 912.128 42.666667H111.872z m0-42.666667h800.256C950.357333 0 981.333333 30.976 981.333333 69.205333v885.589334c0 38.229333-30.976 69.205333-69.205333 69.205333H111.872A69.205333 69.205333 0 0 1 42.666667 954.794667V69.205333C42.666667 30.976 73.642667 0 111.872 0z"
          fill="#4A4A4A"
          p-id="18025"
        />
        <path
          d="M661.333333 128a21.333333 21.333333 0 1 1 42.666667 0v160c0 65.706667-61.226667 117.333333-135.125333 117.333333H455.125333C381.226667 405.333333 320 353.706667 320 288V128a21.333333 21.333333 0 0 1 42.666667 0v160c0 40.362667 40.661333 74.666667 92.458666 74.666667h113.749334c51.797333 0 92.458667-34.304 92.458666-74.666667V128z"
          fill="#4A4A4A"
          p-id="18026"
        />
      </svg>
    </i>
  );
  const monitoringSvg = (
    <i className="anticon">
      <svg viewBox="0 0 1024 1024" p-id="9673" width="20" height="20">
        <path
          d="M834.383448 34.109793H198.867862a141.241379 141.241379 0 0 0-141.241379 141.241379v496.357518a141.241379 141.241379 0 0 0 141.241379 141.241379H834.383448a141.241379 141.241379 0 0 0 141.24138-141.241379V175.351172a141.241379 141.241379 0 0 0-141.24138-141.241379z m-635.515586 70.62069H834.383448a70.62069 70.62069 0 0 1 70.62069 70.620689v496.357518a70.62069 70.62069 0 0 1-70.62069 70.620689H198.867862a70.62069 70.62069 0 0 1-70.62069-70.620689V175.351172a70.62069 70.62069 0 0 1 70.62069-70.620689z"
          fill="#9CA2A8"
          p-id="9674"
        />
        <path
          d="M286.72 514.01269a35.310345 35.310345 0 0 1 35.310345 35.310344v99.751725a35.310345 35.310345 0 0 1-70.62069 0v-99.751725a35.310345 35.310345 0 0 1 35.310345-35.310344zM436.718345 456.951172a35.310345 35.310345 0 0 1 35.310345 35.310345v156.813242a35.310345 35.310345 0 1 1-70.62069 0v-156.777931a35.310345 35.310345 0 0 1 35.310345-35.310345zM586.752 483.116138a35.310345 35.310345 0 0 1 35.310345 35.310345v130.648276a35.310345 35.310345 0 1 1-70.62069 0v-130.648276a35.310345 35.310345 0 0 1 35.310345-35.310345zM736.785655 392.015448a35.310345 35.310345 0 0 1 35.310345 35.310345v221.748966a35.310345 35.310345 0 1 1-70.62069 0v-221.748966a35.310345 35.310345 0 0 1 35.310345-35.310345zM725.768828 202.575448a35.310345 35.310345 0 0 1 43.431724 55.507862l-3.531035 2.718897-143.289379 98.26869a35.310345 35.310345 0 0 1-28.601379 5.12l-4.131311-1.306483-144.948965-56.24938-152.293517 53.318621a35.310345 35.310345 0 0 1-43.431725-17.867034l-1.553655-3.813518a35.310345 35.310345 0 0 1 17.867035-43.431724l3.778207-1.553655 164.652138-57.555862a35.310345 35.310345 0 0 1 19.632551-1.094621l4.802207 1.483035L597.804138 290.251034l127.929379-87.675586zM837.278897 902.708966a35.310345 35.310345 0 0 1 4.13131 70.408827l-4.13131 0.211862h-632.055173a35.310345 35.310345 0 0 1-4.13131-70.373517l4.13131-0.247172h632.055173z"
          fill="#9CA2A8"
          p-id="9675"
        />
      </svg>
    </i>
  );
  const logSvg = (
    <i className="anticon">
      <svg
        t="1607308888685"
        viewBox="0 0 1024 1024"
        version="1.1"
        p-id="5862"
        width="20"
        height="20"
      >
        <path
          d="M394.836769 987.615861H163.337688A113.950325 113.950325 0 0 1 46.188758 876.864142V110.798099A113.950325 113.950325 0 0 1 163.337688 0.04638h566.952844A113.950325 113.950325 0 0 1 845.840159 110.798099v338.652369a39.98257 39.98257 0 0 1-77.966011 0V110.798099a39.98257 39.98257 0 0 0-39.98257-36.783965H163.337688a39.98257 39.98257 0 0 0-39.98257 36.783965v766.066043a39.98257 39.98257 0 0 0 39.98257 37.18379h231.499081a36.783964 36.783964 0 1 1 0 73.567929z"
          fill="#9ca298"
          p-id="5863"
        />
        <path
          d="M632.333235 285.921756H262.494462a36.783964 36.783964 0 1 1 0-73.567929h369.838773a36.783964 36.783964 0 1 1 0 73.567929zM632.333235 473.44001H262.494462a36.783964 36.783964 0 1 1 0-73.567929h369.838773a36.783964 36.783964 0 1 1 0 73.567929zM976.982989 746.520964c0-21.190762-13.9939-31.986056-37.18379-33.985185a47.979084 47.979084 0 0 1-47.179433-58.774378c8.796165-39.98257 6.797037-45.58013-30.786578-66.371066l-23.989543-13.194249a51.17769 51.17769 0 0 0-71.5688 5.997386c-27.587973 21.590588-39.98257 21.190762-66.371066 0a51.17769 51.17769 0 0 0-71.568801-6.797037l-39.98257 21.990414a37.583616 37.583616 0 0 0-19.591459 47.579258c12.394597 39.98257-5.59756 65.571415-48.778736 69.969498-17.992157 1.999129-29.986928 11.594945-30.786579 27.587973a749.673189 749.673189 0 0 0 0 94.758691c0 20.391111 13.594074 30.786579 35.984313 32.785708a49.178561 49.178561 0 0 1 48.778736 57.574901c-7.996514 41.981699-7.996514 46.379781 31.986056 67.970369 8.39634 4.797908 16.792679 9.995643 25.588845 14.393725a48.778736 48.778736 0 0 0 64.371938-8.39634c30.786579-26.388496 39.98257-25.988671 72.368451 0a388.230756 388.230756 0 0 0 39.982571 23.189891c29.187276-18.391982 57.974727-34.38501 83.963397-53.576644a35.584487 35.584487 0 0 0 3.598431-31.58623c-14.793551-35.984313 8.796165-67.570543 50.378038-71.568801 17.192505 0 28.78745-10.795294 29.587102-25.98867a831.237632 831.237632 0 0 0 1.199477-93.559214z m-245.093154 139.139343a96.357994 96.357994 0 1 1 96.357994-96.357993 95.958168 95.958168 0 0 1-96.357994 96.357993z"
          fill="#9ca298"
          p-id="5864"
        />
        <path
          d="M223.311543 587.390335l260.286531 0 0 73.967754-260.286531 0 0-73.967754Z"
          fill="#9ca298"
          p-id="5865"
        />
      </svg>
    </i>
  );

  const menuArr = [
    {
      name: formatMessage({ id: 'menu.enterprise.dashboard' }),
      icon: 'dashboard',
      path: `/enterprise/${eid}/index`,
      authority: ['admin', 'user']
    },
    {
      name: formatMessage({ id: 'menu.enterprise.share' }),
      icon: 'share-alt',
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
    icon: 'team',
    path: `/enterprise/${eid}/teams`,
    authority: ['admin', 'user']
  });
  if (adminer) {
    menuArr.push(
      {
        name: formatMessage({ id: 'menu.enterprise.cluster' }),
        icon: clusterSvg,
        path: `/enterprise/${eid}/clusters`,
        authority: ['admin', 'user']
      },
      {
        name: formatMessage({ id: 'menu.enterprise.user' }),
        icon: 'user',
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
      name: formatMessage({id:'LogEnterprise.title'}),
      icon: logSvg,
      path: `/enterprise/${eid}/logs`,
      authority: ['admin', 'user']
    });
    menuArr.push({
      name: formatMessage({ id: 'menu.enterprise.setting' }),
      icon: 'setting',
      path: `/enterprise/${eid}/setting`,
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
