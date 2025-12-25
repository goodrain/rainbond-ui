import { Avatar, Button, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import TeamImg from '../../../public/images/default_Avatar.png';
import ConfirmModal from '../../components/ConfirmModal';
import TeamEventList from '../../components/Team/TeamEventList';
import TeamMemberList from '../../components/Team/TeamMemberList';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage'
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtile from '../../utils/pulginUtils'
import roleUtil from '../../utils/newRole';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
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
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  pluginsList: teamControl.pluginsList
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
        ? this.getLoginRole(this.props.currUser)
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
      eventPermissions: { isAccess: dynamicAccess },
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess },
      registryPermissions: { isAccess: registryAccess }
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
  getLoginRole = (currUser) => {
    const { dispatch } = this.props;
    const { teams } = currUser
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0]
      const { team_region_name } = region[0]
      if (team_name && team_region_name) {
        return `/team/${team_name}/region/${team_region_name}/index`
      }
    } else {
      if (currUser?.is_enterprise_admin) {
        return `/enterprise/${currUser?.enterprise_id}/index`
      }
    }
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
        if (res) {
          this.setState({
            logoInfo: res.bean.logo || TeamImg
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
    return roleUtil.queryPermissionsInfo(currentTeamPermissionsInfo && currentTeamPermissionsInfo.team, type);
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
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data
      },
      callback: () => {
        // 刷新用户信息,会自动更新 Redux 中的 currentTeam
        dispatch({
          type: 'user/fetchCurrent',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          callback: res => {
            if (res && res.bean) {
              const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
              // 更新 Redux store 中的团队信息
              dispatch({
                type: 'teamControl/fetchCurrentTeam',
                payload: team
              });
            }
          }
        });
        this.loadOverview();
        this.hideEditName();
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
      currentRegionName,
      pluginsList
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
      registryPermissions: { isAccess: registryAccess },
      tabActiveKey,
      logoInfo = false
    } = this.state;
    const sheowEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(pluginsList)
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar size="large" src={logoInfo} />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {currentTeam.team_alias}{' '}
            {teamUtil.canEditTeamName(currentTeam) && (
              <Icon onClick={this.showEditName} type="edit" />
            )}
          </div>
          <div>
            {formatMessage({ id: 'teamManage.create.time' })}
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
              <Icon type="rollback" /> {formatMessage({ id: 'teamManage.tabs.deleteTeam' })}
            </Button>
          )}
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push({
                pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`,
              })
            );
          }} type="default">
            <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
          </Button>
        </div>
      </div>
    );

    const tabList = [];
    if (dynamicAccess) {
      tabList.push({
        key: 'event',
        tab: formatMessage({ id: 'teamManage.tabs.dynamic' })
      });
    }
    if (memberAccess) {
      tabList.push({
        key: 'member',
        tab: formatMessage({ id: 'teamManage.tabs.member' })
      });
    }
    if (roleAccess && sheowEnterprisePlugin) {
      tabList.push({
        key: 'role',
        tab: formatMessage({ id: 'teamManage.tabs.role' })
      });
    }

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({ id: 'teamManage.tabs.setting' }) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        tabList={tabList}
        tabActiveKey={scope || 'event'}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {scope === 'member' && (
          <TeamMemberList memberPermissions={memberPermissions} />
        )}

        {scope === 'role' && <EnterprisePluginsPage type="Permission" componentData={{ rolePermissions: rolePermissions }} key='Permission' />}

        {scope === 'event' && dynamicAccess && (
          <TeamEventList memberPermissions={memberPermissions} />
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
            title={formatMessage({ id: 'confirmModal.quit.team.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.return.team.desc' })}
            onCancel={this.hideDelTeam}
          />
        )}
        {showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title={formatMessage({ id: 'confirmModal.project_team_quit.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.project_team_quit.desc' })}
            onCancel={this.hideExitTeam}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
