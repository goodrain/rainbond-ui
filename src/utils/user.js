import cookie from './cookie';
import globalUtil from './global';
import teamUtil from './team';
import regionUtil from './region';

const userUtil = {
  isLogin() {
    return !!cookie.get('token');
  },
  getDefaultTeamName(bean) {
    const dTeam = this.getDefaultTeam(bean);
    if (dTeam) {
      return dTeam.team_name;
    }
    return '';
  },
  getDefaultTeam(bean) {
    // 先判断自己的，如果有自己的团队，则返回
    let team = (bean.teams || []).filter(
      (team) =>
        team.role_name_list.indexOf('owner') > -1 ||
        bean.user_id === team.creater
    )[0];
    // 也有可能他没有自己的团队，比如移交给别人了
    if (!team) {
      team = bean.teams[0];
    }
    return team;
  },
  getDefaultRegionName(bean) {
    const dTeam = this.getDefaultTeam(bean);
    if (dTeam && dTeam.region.length) {
      return dTeam.region[0].team_region_name;
    }
    return '';
  },
  getTeamByTeamName(user, currTeamName) {
    const currTeam =
      user && user.teams.filter((item) => item.team_name === currTeamName)[0];
    return currTeam;
  },
  getTeamByTeamPermissions(teams, currTeamName) {
    const currTeamPermissions =
      teams && teams.filter((item) => item.team_name === currTeamName);
    if (currTeamPermissions && currTeamPermissions.length > 0) {
      return currTeamPermissions[0].tenant_actions;
    }
    return currTeamPermissions;
  },
  // 用户是否在某个团队下，拥有某个集群
  hasTeamAndRegion(user, team_name, region_name) {
    const team = this.getTeamByTeamName(user, team_name);
    if (!team) {
      return false;
    }
    const region = (team.region || []).filter(
      (item) => item.team_region_name === region_name
    )[0];
    return region;
  },
  // 获取某个团队的默认集群

  // 是否开通了gitlab账号
  hasGitlatAccount(user) {
    return user.git_user_id !== 0;
  },
  // 是否是应用市场管理员
  isAppStoreAdmin(userBean) {
    return (
      userBean &&
      userBean.roles &&
      userBean.roles.length > 0 &&
      userBean.roles.includes('app_store')
    );
  },
  // 是否是企业管理员
  isCompanyAdmin(userBean) {
    return (
      userBean &&
      userBean.roles &&
      userBean.roles.length > 0 &&
      userBean.roles.includes('admin')
    );
  },
  // 是否有对应的权限
  isPermissions(userBean, parameter) {
    if (userBean && userBean.permissions && userBean.permissions.length > 0) {
      if (parameter === 'app_store') {
        return this.marketPermissions(userBean.permissions);
      }
    }
    return {};
  },
  marketPermissions(parameter) {
    const arrMap = {
      'app_store.create_app': 'isCreateApp',
      'app_store.edit_app': 'isEditApp',
      'app_store.delete_app': 'isDeleteApp',
      'app_store.import_app': 'isImportApp',
      'app_store.export_app': 'isExportApp',
      'app_store.create_app_store': 'isCreateAppStore',
      'app_store.edit_app_store': 'isEditAppStore',
      'app_store.delete_app_store': 'isDeleteAppStore',
      'app_store.edit_app_version': 'isEditVersionApp',
      'app_store.delete_app_version': 'isDeleteAppVersion'
    };
    const objs = {};
    // eslint-disable-next-line no-unused-expressions
    parameter &&
      parameter.length > 0 &&
      parameter.map((item) => {
        objs[arrMap[item]] = true;
      });
    return objs;
  },
  // 获取当前的soketUrl
  getCurrRegionSoketUrl(currUser) {
    const currTeam = this.getTeamByTeamName(
      currUser,
      globalUtil.getCurrTeamName()
    );
    const currRegionName = globalUtil.getCurrRegionName();
    if (currTeam) {
      const region = teamUtil.getRegionByName(currTeam, currRegionName);
      if (region) {
        return regionUtil.getEventWebSocketUrl(region);
      }
    }
    return '';
  }
};
export default userUtil;
