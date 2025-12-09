import cookie from './cookie';
import { formatMessage } from '@/utils/intl';

const actionMap = {
  admin: formatMessage({id:'utils.role.admin'}),
  developer: formatMessage({id:'utils.role.developer'}),
  viewer: formatMessage({id:'utils.role.viewer'}),
  access: formatMessage({id:'utils.role.access'}),
  owner: formatMessage({id:'utils.role.owner'}),
};

const teamUtil = {
  actionToCN(action = []) {
    let res = [];
    res = action.map(item => actionMap[item]);
    return res.join(', ');
  },
  getRegionByName(teamBean, region_name) {
    const regions = teamBean && teamBean.region || [];
    const region = regions.filter(
      item => item.team_region_name === region_name
    );
    return region[0];
  },
  // 是否可以编辑团队名称
  canEditTeamName(teamBean = {}) {
    return teamBean && teamBean.is_team_owner;
  },
  // 是否可以删除团队
  canDeleteTeam(teamBean = {}) {
    return teamBean && teamBean.is_enterprise_admin;
  },
  // 对否可以移交团队
  canChangeOwner(teamBean = {}) {
    return teamBean && teamBean.is_team_owner;
  },
  // 是否可以管理应用组
  canManageGroup(teamBean = {}) {
    const actions = teamBean.tenant_actions || [];
    return actions.indexOf('manage_group') > -1;
  },
};

export default teamUtil;
