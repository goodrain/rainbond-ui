import { formatMessage } from 'umi-plugin-locale';
import cookie from '../utils/cookie';
import roleUtil from '../utils/role';
import { isUrl } from '../utils/utils';
import getMenuSvg from './getMenuSvg';

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
  const menuArr = [
    {
      name: formatMessage({ id: 'menu.team.dashboard' }),
      icon: getMenuSvg.getSvg('dashboard'),
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
      var item = {
        name: formatMessage({ id: 'menu.team.create' }),
        icon: getMenuSvg.getSvg('add'),
        path: `team/${teamName}/region/${regionName}/create`,
        authority: ['admin', 'user'],
        teamName: teamName,
        regionName: regionName,
        children: [
          {
            name: formatMessage({ id: 'menu.team.create.wizard' }),
            path: `wizard`,
            icon: getMenuSvg.getSvg('wizard'),
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.code' }),
            path: `code`,
            icon: getMenuSvg.getSvg('code'),
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.market' }),
            path: `market`,
            icon: getMenuSvg.getSvg('market'),
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({id:'Vm.createVm.docker'}),
            path: `image`,
            icon: getMenuSvg.getSvg('image'),
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({id:'Vm.createVm.titleVm'}),
            path: `vm`,
            icon: getMenuSvg.getSvg('vm'),
            authority: ['admin', 'user']
          },
          // 基于软件包/yaml创建
          {
            name: formatMessage({ id: 'menu.team.create.upload' }),
            path: `yaml`,
            icon: getMenuSvg.getSvg('yaml'),
            authority: ['admin', 'user']
          },
          {
            name: formatMessage({ id: 'menu.team.create.third' }),
            path: `outer`,
            icon: getMenuSvg.getSvg('outer'),
            authority: ['admin', 'user']
          }
        ]
      }
      // if (setTeamMenu(showPipeline,'rainbond-vm')) {
      //   item.children.push({
      //     name: formatMessage({id:'Vm.createVm.titleVm'}),
      //     path: `vm`,
      //     authority: ['admin', 'user']
      //   },);
      // }
      addMenuArr(item);
    }
    if (setTeamMenu(showPipeline,'pipeline')) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.pipeline' }),
        icon: getMenuSvg.getSvg('Pipeline'),
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
          icon: getMenuSvg.getSvg('control'),
          authority: ['admin', 'user']
        });
      }

      if (certificate) {
        children.push({
          name: formatMessage({ id: 'menu.team.gateway.certificate' }),
          path: 'license',
          icon: getMenuSvg.getSvg('license'),
          authority: ['admin', 'user']
        });
      }
      addMenuArr({
        name: formatMessage({ id: 'menu.team.gateway' }),
        icon: getMenuSvg.getSvg('gateway'),
        path: `team/${teamName}/region/${regionName}/gateway`,
        authority: ['admin', 'user'],
        children
      });
    }

    if (pluginView) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.plugin' }),
        icon: getMenuSvg.getSvg('api'),
        path: `team/${teamName}/region/${regionName}/myplugns`,
        authority: ['admin', 'user']
      });
    }

    if (dynamic || members || clusters || roles) {
      addMenuArr({
        name: formatMessage({ id: 'menu.team.setting' }),
        icon: getMenuSvg.getSvg('setting'),
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
