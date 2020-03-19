import { isUrl } from "../utils/utils";
import cookie from "../utils/cookie";
import { formatMessage } from 'umi-plugin-react/locale';

const newbie_guide = cookie.get("newbie_guide");
const menuData = function(teamName, regionName) {
  const menuArr = [
    {
      name: formatMessage({id: "menu.team.dashboard"}),
      icon: "dashboard",
      path: `team/${teamName}/region/${regionName}/index`,
      authority: ["admin", "user"]
    },
    {
      name: formatMessage({id: "menu.team.app"}),
      icon: "appstore-o",
      path: `team/${teamName}/region/${regionName}/apps`,
      authority: ["admin", "user"]
    },
    {
      name: formatMessage({id: "menu.team.create"}),
      icon: "plus",
      path: `team/${teamName}/region/${regionName}/create`,
      authority: ["admin", "user"],
      children: [
        {
          name: formatMessage({id: "menu.team.create.code"}),
          path: "code",
          path: `/code`,
          authority: ["admin", "user"]
        },
        {
          name: formatMessage({id: "menu.team.create.image"}),
          path: "image",
          path: `/image`,
          authority: ["admin", "user"]
        },
        {
          name: formatMessage({id: "menu.team.create.market"}),
          path: "market",
          path: `/market`,
          authority: ["admin", "user"]
        },
        {
          name: formatMessage({id: "menu.team.create.third"}),
          path: "outer",
          path: `/outer`,
          authority: ["admin", "user"]
        }
      ]
    },
    {
      name: formatMessage({id: "menu.team.gateway"}),
      icon: "gateway",
      path: `team/${teamName}/region/${regionName}/gateway`,
      authority: ["admin", "user"],
      children: [
        {
          name: formatMessage({id: "menu.team.gateway.control"}),
          path: "control",
          authority: ["admin", "user"]
        },
        {
          name: formatMessage({id: "menu.team.gateway.certificate"}),
          path: "license",
          authority: ["admin", "user"]
        }
      ]
    },
    {
      name: formatMessage({id: "menu.team.plugin"}),
      icon: "api",
      path: `team/${teamName}/region/${regionName}/myplugns`,
      authority: ["admin", "user"]
    },
    {
      name: formatMessage({id: "menu.team.setting"}),
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
