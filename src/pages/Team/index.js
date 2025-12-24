import { Avatar, Button, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import TeamImg from '../../../public/images/default_Avatar.png';
import ConfirmModal from '../../components/ConfirmModal';
import TeamEventList from '../../components/Team/TeamEventList';
import TeamMemberList from '../../components/Team/TeamMemberList';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtile from '../../utils/pulginUtils';
import roleUtil from '../../utils/newRole';
import teamUtil from '../../utils/team';
import handleAPIError from '../../utils/error';
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
      logoInfo: TeamImg,
      teamsUrl: this.props.currentEnterprise
        ? this.getLoginRole(this.props.currUser)
        : '/',
      eventPermissions: this.handlePermissions('team_dynamic'),
      memberPermissions: this.handlePermissions('team_member'),
      datecenterPermissions: this.handlePermissions('team_region'),
      rolePermissions: this.handlePermissions('team_role')
    };
  }

  componentWillMount() {
    const { dispatch, location } = this.props;
    const {
      eventPermissions: { isAccess: dynamicAccess },
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess }
    } = this.state;

    // 检查权限
    if (!dynamicAccess && !memberAccess && !datecenterAccess && !roleAccess) {
      globalUtil.withoutPermission(dispatch);
      return;
    }

    // 确定默认scope
    let scope = 'event';
    if (dynamicAccess) {
      scope = 'event';
    } else if (memberAccess) {
      scope = 'member';
    } else if (roleAccess) {
      scope = 'role';
    }

    // 从路由state中获取配置
    if (location?.state?.config) {
      scope = location.state.config;
    }

    this.setState({ scope });
  }

  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.loadOverview();
  }

  // 获取登录后的默认跳转URL
  getLoginRole = currUser => {
    const { teams } = currUser;
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0];
      const { team_region_name } = region[0];
      if (team_name && team_region_name) {
        return `/team/${team_name}/region/${team_region_name}/index`;
      }
    } else if (currUser?.is_enterprise_admin) {
      return `/enterprise/${currUser?.enterprise_id}/index`;
    }
    return '/';
  };

  // 处理权限
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.queryPermissionsInfo(
      currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
      type
    );
  };
  // 获取团队基本信息
  loadOverview = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchOverview',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            logoInfo: res.bean.logo || TeamImg
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 显示/隐藏编辑名称弹窗
  showEditName = () => {
    this.setState({ showEditName: true });
  };

  hideEditName = () => {
    this.setState({ showEditName: false });
  };

  // 显示/隐藏退出团队弹窗
  showExitTeam = () => {
    this.setState({ showExitTeam: true });
  };

  hideExitTeam = () => {
    this.setState({ showExitTeam: false });
  };

  // 退出团队
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
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 显示/隐藏删除团队弹窗
  showDelTeam = () => {
    this.setState({ showDelTeam: true });
  };

  hideDelTeam = () => {
    this.setState({ showDelTeam: false });
  };
  // 编辑团队名称
  handleEditName = data => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data
      },
      callback: () => {
        this.handleUpDataHeader();
        dispatch({
          type: 'user/fetchCurrent',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          callback: () => {
            dispatch({
              type: 'global/IsUpDataHeader',
              payload: { isUpData: false }
            });
          }
        });
        this.loadOverview();
        this.hideEditName();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 更新头部信息
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };

  // 删除团队
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
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // Tab切换
  handleTabChange = key => {
    this.setState({ scope: key });
  };

  // 跳转到首页
  navigateToHome = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch(
      routerRedux.push({
        pathname: `/team/${teamName}/region/${regionName}/index`
      })
    );
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
      rolePermissions,
      logoInfo
    } = this.state;

    const dynamicAccess = eventPermissions?.isAccess;
    const memberAccess = memberPermissions?.isAccess;
    const roleAccess = rolePermissions?.isAccess;
    const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(pluginsList);
    const isEnterpriseAdmin = teamUtil.canDeleteTeam(currUser);
    // 页面头部内容
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

    // 额外内容（操作按钮）
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.extraBtns}>
          {!isEnterpriseAdmin && (
            <Button onClick={this.showExitTeam} type="dashed">
              <Icon type="rollback" />
              {' '}
              {formatMessage({ id: 'teamManage.tabs.deleteTeam' })}
            </Button>
          )}
          <Button onClick={this.navigateToHome} type="default">
            <Icon type="home" />
            {formatMessage({ id: 'versionUpdata_6_1.home' })}
          </Button>
        </div>
      </div>
    );

    // 构建Tab列表
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
    if (roleAccess && showEnterprisePlugin) {
      tabList.push({
        key: 'role',
        tab: formatMessage({ id: 'teamManage.tabs.role' })
      });
    }

    // 构建面包屑
    const breadcrumbList = createTeam(
      createEnterprise([], currentEnterprise),
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

        {scope === 'role' && (
          <EnterprisePluginsPage
            type="Permission"
            componentData={{ rolePermissions }}
            key="Permission"
          />
        )}

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
