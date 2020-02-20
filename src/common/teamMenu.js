import { isUrl } from "../utils/utils";
import cookie from "../utils/cookie";

const newbie_guide = cookie.get("newbie_guide");
const menuData = function(teamName, regionName) {
  const menuArr = [
    {
      name: "总览",
      icon: "dashboard",
      path: `team/${teamName}/region/${regionName}/index`,
      authority: ["admin", "user"]
    },
    {
      name: "创建",
      icon: "plus",
      path: `team/${teamName}/region/${regionName}/create`,
      authority: ["admin", "user"],
      children: [
        {
          name: "从源码创建组件",
          path: "code",
          path: `/code`,
          authority: ["admin", "user"]
        },
        {
          name: "从Docker镜像创建组件",
          path: "image",
          path: `/image`,
          authority: ["admin", "user"]
        },
        {
          name: "从应用市场安装组件",
          path: "market",
          path: `/market`,
          authority: ["admin", "user"]
        },
        {
          name: "添加第三方组件",
          path: "outer",
          path: `/outer`,
          authority: ["admin", "user"]
        }
      ]
    },
    {
      name: "应用",
      icon: "appstore-o",
      path: `team/${teamName}/region/${regionName}/groups`,
      authority: ["admin", "user"]
    },
    {
      name: "网关",
      icon: "gateway",
      path: `team/${teamName}/region/${regionName}/gateway`,
      authority: ["admin", "user"],
      children: [
        {
          name: "访问控制",
          path: "control",
          authority: ["admin", "user"]
        },
        {
          name: "证书管理",
          path: "license",
          authority: ["admin", "user"]
        }
      ]
    },
    {
      name: "插件",
      icon: "api",
      path: `team/${teamName}/region/${regionName}/myplugns`,
      authority: ["admin", "user"]
    },
    {
      name: "设置",
      icon: "setting",
      path: `team/${teamName}/region/${regionName}/team`,
      authority: ["admin", "user"]
    }
  ];
  if (newbie_guide == "false") {
    return menuArr;
  } else if (newbie_guide !== undefined) {
    menuArr.push({
      name: "任务",
      icon: "exclamation-circle",
      path: `team/${teamName}/region/${regionName}/guide`,
      authority: ["admin", "user"]
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

export const getMenuData = (teamName, regionName) => {
  const menus = formatter(menuData(teamName, regionName));
  return menus;
};
