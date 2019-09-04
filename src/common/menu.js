import { isUrl } from "../utils/utils";
import globalUtil from "../utils/global";
import configureGlobal from "../utils/configureGlobal";

const menuData = function() {
  let menuArr = [
    {
      name: "团队总览",
      icon: "dashboard",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
    },
    {
      name: "创建应用",
      icon: "plus",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create`,
      children: [
        {
          name: "从源码创建",
          path: "code"
        },
        {
          name: "从Docker镜像创建",
          path: "image"
        },
        {
          name: "从应用市场安装",
          path: "market"
        },
        {
          name: "添加第三方服务",
          path: "outer"
        }
      ]
    },
    {
      name: "应用管理",
      icon: "appstore-o",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`
    },
    {
      name: "应用网关",
      icon: "gateway",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway`,
      children: [
        {
          name: "访问控制",
          path: "control"
        },
        {
          name: "证书管理",
          path: "license"
        }
      ]
    },
    {
      name: "插件管理",
      icon: "api",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`
    },
    {
      name: "团队管理",
      icon: "team",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/team`
    },
    {
      name: "内部市场",
      icon: "usb",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`
    },
    {
      name: "企业中心",
      icon: "red-envelope",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/finance`
    }
  ];
  if (configureGlobal.newbieGuideShow) {
    menuArr.push({
      name: "任务引导",
      icon: "exclamation-circle",
      path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/guide`
    });
  }
  return menuArr;
};

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

// 处理我的应用二级和三级菜单

export const getMenuData = groups => {
  const menus = formatter(menuData());

  if (groups && groups.length) {
    for (let i = 0; i < menus.length; i++) {
      const item = menus[i];

      if (item.path.indexOf("groups") > -1) {
        item.children = groups.map(group => {
          const children = (group.service_list || []).map(item => ({
            name: item.service_cname,
            path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
              item.service_alias
            }`,
            link: true,
            exact: true
          }));
          return {
            name: group.group_name,
            path: `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
              group.group_id
            }`,
            link: true,
            children,
            exact: true
          };
        });
      }
    }
  }

  return menus;
};
