import { formatMessage } from 'umi-plugin-locale';
import cookie from '../utils/cookie';
import roleUtil from '../utils/role';
import { isUrl } from '../utils/utils';

const newbieGuide = cookie.get('newbie_guide');
function setTeamMenu(pluginMenu, menuName){
  if(pluginMenu){
    const isShow = pluginMenu.some(item =>{
        return item.name == menuName
    })
    return isShow
  }
}

function menuData(teamName, regionName, permissionsInfo, showPipeline) {
  const Pipeline = (
        <i className="anticon">
            <svg 
              t="1676966831715" 
              class="icon" 
              viewBox="0 0 1024 1024" 
              version="1.1" 
              xmlns="http://www.w3.org/2000/svg" 
              p-id="7785" 
              width="22px" 
              height="22px"
            >
              <path 
                d="M520.704 64L170.496 241.152v360.448l349.696 177.152 349.696-177.152V241.152l-349.184-177.152z m283.648 497.152l-285.696 144.896-91.648-47.104 157.696-89.6c8.704 4.096 16.896 6.656 25.6 6.656 31.744 0 57.344-25.6 57.344-57.344s-25.6-57.344-57.344-57.344c-29.696 0-53.248 21.504-55.296 49.152l-198.144 111.104-123.904-61.952V279.552l285.696-144.896 102.4 51.2-164.352 91.648c-8.704-4.096-16.896-6.144-25.6-6.144C399.36 271.36 373.76 296.96 373.76 328.704s25.6 57.344 57.344 57.344c29.696 0 53.248-21.504 55.296-49.152l202.752-113.152L802.304 281.6v279.552h2.048z" 
                fill="#9CA2A8" 
                p-id="7786"
              >
              </path>
              <path 
                d="M522.752 883.2l-352.256-173.056v70.656l352.256 175.104 347.648-175.104v-70.656l-347.648 173.056z" 
                fill="#9CA2A8" 
                p-id="7787"
              >
                </path>
            </svg>
            </i>
        )
  const menuArr = [
    {
      name: formatMessage({ id: 'menu.team.dashboard' }),
      icon: 'dashboard',
      path: `team/${teamName}/region/${regionName}/index`,
      authority: ['admin', 'user']
    }
  ];
  function results(moduleName, targets) {
    return roleUtil.queryTeamUserPermissionsInfo(
      permissionsInfo,
      moduleName,
      targets
    );
  }
  function addMenuArr(obj) {
    menuArr.push(obj);
  }
  if (permissionsInfo) {
    const appView = results('app', 'describe');
    const appCreateView = results('app', 'create');
    const componentCreateView = results('component', 'create');
    const componentConstructView = results('component', 'construct');
    const control = results('gatewayRule', 'describe');
    const certificate = results('certificate', 'describe');
    const pluginView = results('plugin', 'describe');
    // 动态
    const dynamic = results('teamBasicInfo', 'dynamic_describe');
    // 成员
    const members = results('teamMember', 'describe');
    // 集群
    const clusters = results('teamRegion', 'describe');
    // 角色
    const roles = results('teamRole', 'describe');

    if (appCreateView && componentCreateView && componentConstructView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.create' }),
        icon: 'plus',
        path: `team/${teamName}/region/${regionName}/create`,
        authority: ['admin', 'user'],
        isClick: true,
        teamName: teamName,
        regionName: regionName,
        children: [
          {
            name: formatMessage({ id: 'menu.team.create.code' }),
            path: `code`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.market' }),
            path: `market`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({id:'Vm.createVm.docker'}),
            path: `image`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({id:'Vm.createVm.titleVm'}),
            path: `vm`,
            authority: ['admin', 'user']
          },
          // 基于软件包/yaml创建
          {
            name: formatMessage({ id: 'menu.team.create.upload' }),
            path: `yaml`,
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.third' }),
            path: `outer`,
            authority: ['admin', 'user']
          }
        ]
      });
    }
    if (setTeamMenu(showPipeline,'pipeline')) {
      addMenuArr({
        name: formatMessage({id:'menu.team.pipeline'}),
        icon: Pipeline,
        path: `team/${teamName}/region/${regionName}/Pipeline`,
        authority: ['admin', 'user']
      });
    }
    if (control || certificate) {
      const children = [];
      if (control) {
        children.push({
          name: formatMessage({ id: 'menu.team.gateway.control' }),
          path: 'control',
          authority: ['admin', 'user']
        });
      }

      if (certificate) {
        children.push({
          name: formatMessage({ id: 'menu.team.gateway.certificate' }),
          path: 'license',
          authority: ['admin', 'user']
        });
      }
      addMenuArr({
        name: formatMessage({ id: 'menu.team.gateway' }),
        icon: 'gateway',
        path: `team/${teamName}/region/${regionName}/gateway`,
        authority: ['admin', 'user'],
        children
      });
    }

    if (pluginView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.plugin' }),
        icon: 'api',
        path: `team/${teamName}/region/${regionName}/myplugns`,
        authority: ['admin', 'user']
      });
    }

    if (dynamic || members || clusters || roles) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.setting' }),
        icon: 'setting',
        path: `team/${teamName}/region/${regionName}/team`,
        authority: ['admin', 'user']
      });
    }
    if (newbieGuide === 'false') {
      return menuArr;
    } 
    // else if (newbieGuide !== undefined) {
    //   addMenuArr({
    //     name: '任务',
    //     icon: 'exclamation-circle',
    //     path: `team/${teamName}/region/${regionName}/guide`,
    //     authority: ['admin', 'user']
    //   });
    // }
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
export const getMenuData = (teamName, regionName, permissionsInfo, showPipeline) => {
  const menus = formatter(menuData(teamName, regionName, permissionsInfo, showPipeline));
  return menus;
};
