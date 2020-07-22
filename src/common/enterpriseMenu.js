/* eslint-disable react/react-in-jsx-scope */
import { isUrl } from "../utils/utils";
import userUtil from "../utils/user";
import rainbondUtil from "../utils/rainbond";

function menuData(eid, currentUser) {
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
  const menuArr = [
    {
      name: "总览",
      icon: "dashboard",
      path: `/enterprise/${eid}/index`,
      authority: ["admin", "user"]
    },
    {
      name: '应用市场',
      icon: 'share-alt',
      path: `/enterprise/${eid}/shared`,
      authority: ["admin", "user"]
    }
  ];
  if (rainbondUtil.isEnableBillingFunction()) {
    menuArr.push({
      name: "订购",
      icon: orderSvg,
      path: `/enterprise/${eid}/orders/overviewService`,
      authority: ["admin", "user"]
    });
  }
  menuArr.push({
    name: "团队",
    icon: "team",
    path: `/enterprise/${eid}/teams`,
    authority: ["admin", "user"]
  });
  if (adminer) {
    menuArr.push(
      {
        name: "集群",
        icon: clusterSvg,
        path: `/enterprise/${eid}/clusters`,
        authority: ["admin", "user"]
      },
      {
        name: "用户",
        icon: "user",
        path: `/enterprise/${eid}/users`,
        authority: ["admin", "user"]
      },
      {
        name: "设置",
        icon: "setting",
        path: `/enterprise/${eid}/setting`,
        authority: ["admin", "user"]
      }
    );
  }

  return menuArr;
}

function formatter(data, parentPath = "", parentAuthority) {
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

export const getMenuData = (eid, currentUser) => {
  const menus = formatter(menuData(eid, currentUser));
  return menus;
};
