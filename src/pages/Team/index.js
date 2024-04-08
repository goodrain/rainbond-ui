import { Avatar, Button, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import TeamImg from '../../../public/images/team-icon.png';
import ConfirmModal from '../../components/ConfirmModal';
import TeamDataCenterList from '../../components/Team/TeamDataCenterList';
import TeamEventList from '../../components/Team/TeamEventList';
import TeamMemberList from '../../components/Team/TeamMemberList';
import TeamRoleList from '../../components/Team/TeamRoleList';
import TeamImageList from '../../components/Team/TeamImageList'
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import teamUtil from '../../utils/team';
import styles from './index.less';
import MoveTeam from './move_team';

@connect(({ user, teamControl, loading, enterprise }) => ({
  currUser: user.currentUser,
  teamControl,
  projectLoading: loading.effects['project/fetchNotice'],
  activitiesLoading: loading.effects['activities/fetchList'],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showEditName: false,
      showDelTeam: false,
      showExitTeam: false,
      scope: '',
      teamsUrl: this.props.currentEnterprise
        ? `/enterprise/${this.props.currentEnterprise.enterprise_id}/teams`
        : '/',
      eventPermissions: this.handlePermissions('team_dynamic'),
      memberPermissions: this.handlePermissions('team_member'),
      datecenterPermissions: this.handlePermissions('team_region'),
      rolePermissions: this.handlePermissions('team_role'),
      registryPermissions: this.handlePermissions('team_registry_auth') 
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const {
      eventPermissions:{  isAccess: dynamicAccess},
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess },
      registryPermissions:{ isAccess: registryAccess}
    } = this.state;
    if (
      !dynamicAccess &&
      !memberAccess &&
      !datecenterAccess &&
      !roleAccess
    ) {
      globalUtil.withoutPermission(dispatch);
    }

    let scopes = '';
    if (dynamicAccess) {
      scopes = 'event';
    } else if (memberAccess) {
      scopes = 'member';
    } else if (datecenterAccess) {
      scopes = 'datecenter';
    } else {
      scopes = 'role';
    }
    this.setState({ scope: scopes });
    const {
      location: { state }
    } = this.props;
    if (state && state.config) {
      this.setState({
        scope: state.config
      });
    }
  }

  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.loadOverview()
  }
  // 获取团队下的基本信息
  loadOverview = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchOverview',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if(res){
          this.setState({
            logoInfo:res.bean.logo
          })
        }
      },
      handleError: () => {
      }
    });
  };
  getParam() {
    return this.props.match.params;
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return  roleUtil.queryPermissionsInfo(currentTeamPermissionsInfo && currentTeamPermissionsInfo.team, type);
  };

  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  showExitTeam = () => {
    this.setState({ showExitTeam: true });
  };
  hideExitTeam = () => {
    this.setState({ showExitTeam: false });
  };
  handleExitTeam = () => {
    const { dispatch } = this.props;
    const { teamsUrl } = this.state;
    dispatch({
      type: 'teamControl/exitTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          dispatch(routerRedux.push(teamsUrl));
        }
      }
    });
  };
  showDelTeam = () => {
    this.setState({ showDelTeam: true });
  };
  hideDelTeam = () => {
    this.setState({ showDelTeam: false });
  };
  handleEditName = data => {
    this.props.dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data
      },
      callback: () => {
        this.props.dispatch({ type: 'user/fetchCurrent' });
        this.loadOverview();
        this.hideEditName();
        this.handleUpDataHeader();
      }
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };
  handleDelTeam = () => {
    const { teamsUrl } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/delTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          dispatch(routerRedux.push(teamsUrl));
        }
      }
    });
  };
  handleTabChange = key => {
    this.setState({ scope: key });
  };
  render() {
    const {
      currUser,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const {
      scope,
      showEditName,
      showDelTeam,
      showExitTeam,
      eventPermissions,
      memberPermissions,
      datecenterPermissions,
      rolePermissions,
      registryPermissions,
      eventPermissions: { isAccess: dynamicAccess },
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess },
      registryPermissions: { isAccess: registryAccess},
      tabActiveKey,
      logoInfo = false
    } = this.state;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          {logoInfo ? 
          (
          <Avatar size="large" src={logoInfo} />
          ):(
          <Avatar
            style=
            {{
              backgroundColor: '#00a2ae',
              verticalAlign: 'middle'
            }}
            size={60}
            shape="square">
            <span
              style=
              {{
                color: '#fff',
                fontSize: 35,
                textTransform: 'uppercase'
              }}
            >
              {currentTeam.team_alias.substr(0, 1)}
            </span>
          </Avatar>
          )}


        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {currentTeam.team_alias}{' '}
            {teamUtil.canEditTeamName(currentTeam) && (
              <Icon onClick={this.showEditName} type="edit" />
            )}
          </div>
          <div>
            {formatMessage({id: 'teamManage.create.time'})}
            {moment(currentTeam.create_time)
              .locale('zh-cn')
              .format('YYYY-MM-DD')}
          </div>
        </div>
      </div>
    );
    const isEnterpriseAdmin = teamUtil.canDeleteTeam(currUser);
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.extraBtns}>
          {!isEnterpriseAdmin && (
            <Button onClick={this.showExitTeam} type="dashed">
              {formatMessage({id: 'teamManage.tabs.exitTeam'})}
            </Button>
          )}
          <Button
            disabled={!isEnterpriseAdmin}
            onClick={this.showDelTeam}
            type="dashed"
          >
            {formatMessage({id: 'teamManage.tabs.deleteTeam'})}
          </Button>
        </div>
      </div>
    );

    const tabList = [];
    if (dynamicAccess) {
      tabList.push({
        key: 'event',
        tab: formatMessage({id: 'teamManage.tabs.dynamic'})
      });
    }
    if (memberAccess) {
      tabList.push({
        key: 'member',
        tab: formatMessage({id: 'teamManage.tabs.member'})
      });
    }
    if (datecenterAccess) {
      tabList.push({
        key: 'datecenter',
        tab: formatMessage({id: 'teamManage.tabs.cluster'})
      });
    }
    if (roleAccess) {
      tabList.push({
        key: 'role',
        tab: formatMessage({id: 'teamManage.tabs.role'})
      });
    }
    if (registryAccess) {
      tabList.push({
        key: 'image',
        tab: formatMessage({id: 'teamManage.tabs.image'})
      });
    }

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({id: 'teamManage.tabs.setting'}) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        tabList={tabList}
        tabActiveKey={scope || 'event'}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {scope === 'datecenter' && (
          <TeamDataCenterList datecenterPermissions={datecenterPermissions} />
        )}
        {scope === 'member' && (
          <TeamMemberList memberPermissions={memberPermissions} />
        )}
        {scope === 'role' && <TeamRoleList rolePermissions={rolePermissions} />}
        {scope === 'event' && dynamicAccess && (
          <TeamEventList memberPermissions={memberPermissions} />
        )}
        {scope === 'image' && registryAccess && (
          <TeamImageList memberPermissions={registryPermissions} />
        )}
        {showEditName && (
          <MoveTeam
            teamAlias={currentTeam.team_alias}
            imageUrlTeam={logoInfo}
            onSubmit={this.handleEditName}
            onCancel={this.hideEditName}
          />
        )}
        {showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelTeam}
            title={formatMessage({id:'confirmModal.quit.team.title'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            desc={formatMessage({id:'confirmModal.return.team.desc'})}
            onCancel={this.hideDelTeam}
          />
        )}
        {showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title={formatMessage({id:'confirmModal.project_team_quit.delete.title'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            desc={formatMessage({id:'confirmModal.delete.project_team_quit.desc'})}
            onCancel={this.hideExitTeam}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
