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
import MenuContext from '../../layouts/MenuContext';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage';
import PluginListContent from '../Plugin/components/PluginListContent';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtile from '../../utils/pulginUtils';
import roleUtil from '../../utils/newRole';
import teamUtil from '../../utils/team';
import handleAPIError from '../../utils/error';
import userUtil from '../../utils/user';
import styles from './index.less';
import MoveTeam from './move_team';

const { isTeamOverviewResponse, getTeamOverviewData } = require('../../components/Team/TeamEventList/helpers');
const { createTeamOverviewScope } = require('../../utils/teamOverviewBootstrap');

// Keep modern context outside connect: DVA's React Redux 5 wrapper needs its
// legacy store context and must not inherit a wrapped component's contextType.
function withTeamOverviewLoader(Component) {
  return class TeamOverviewLoader extends PureComponent {
    render() {
      return (
        <MenuContext.Consumer>
          {context => <Component {...this.props} teamOverviewLoader={context && context.teamOverviewLoader} />}
        </MenuContext.Consumer>
      );
    }
  };
}

@withTeamOverviewLoader
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
      overviewSnapshot: null,
      teamsUrl: this.props.currentEnterprise
        ? this.getLoginRole(this.props.currUser)
        : '/',
      eventPermissions: this.handlePermissions('team_dynamic'),
      memberPermissions: this.handlePermissions('team_member'),
      datecenterPermissions: this.handlePermissions('team_region'),
      rolePermissions: this.handlePermissions('team_role'),
      pluginPermissions: this.handlePermissions('team_plugin_manage')
    };
    this._isMounted = false;
    this.overviewGeneration = 0;
    this.overviewScope = null;
    this.overviewIdentity = createTeamOverviewScope();
  }

  componentWillMount() {
    const { dispatch, location, pluginsList } = this.props;
    const permissions = this.getPermissionsFromProps();
    const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(pluginsList);
    const {
      eventPermissions: { isAccess: dynamicAccess },
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess },
      pluginPermissions: { isAccess: pluginAccess }
    } = permissions;

    // 检查权限
    if (!dynamicAccess && !memberAccess && !datecenterAccess && !roleAccess && !pluginAccess) {
      globalUtil.withoutPermission(dispatch);
      return;
    }

    this.setState({
      ...permissions,
      scope: this.getResolvedScope(location, permissions, showEnterprisePlugin)
    });
  }

  componentDidMount() {
    this._isMounted = true;
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    const loader = this.props.teamOverviewLoader;
    const force = Boolean(loader && loader.beginVisit && loader.beginVisit());
    this.loadOverview({ force });
  }

  componentDidUpdate(prevProps) {
    const locationChanged =
      prevProps.location?.search !== this.props.location?.search ||
      prevProps.location?.state?.config !== this.props.location?.state?.config;
    const permissionsChanged =
      prevProps.currentTeamPermissionsInfo !== this.props.currentTeamPermissionsInfo;
    const pluginListChanged = prevProps.pluginsList !== this.props.pluginsList;

    if (locationChanged || permissionsChanged || pluginListChanged) {
      this.syncViewState({ refreshOverview: locationChanged });
    }
    const identity = this.getOverviewIdentity();
    if (this.overviewScope !== this.getOverviewScope() || this.activeOverviewIdentity !== identity) {
      // A router can preserve this page instance while moving to another team.
      // Register that visit too, so a later real remount is a refresh rather
      // than being mistaken for the new team's first late bootstrap consumer.
      const loader = this.props.teamOverviewLoader;
      if (identity && loader && loader.beginVisit) loader.beginVisit();
      this.loadOverview({ force: false });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.overviewGeneration += 1;
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

  getPermissionsFromProps = () => {
    return {
      eventPermissions: this.handlePermissions('team_dynamic'),
      memberPermissions: this.handlePermissions('team_member'),
      datecenterPermissions: this.handlePermissions('team_region'),
      rolePermissions: this.handlePermissions('team_role'),
      pluginPermissions: this.handlePermissions('team_plugin_manage')
    };
  };

  getRequestedScope = (location = this.props.location) => {
    const search = (location && location.search) || '';
    const query = new URLSearchParams(search);
    return query.get('tab') || (location && location.state && location.state.config) || '';
  };

  getDefaultScope = (permissions, showEnterprisePlugin) => {
    if (permissions.eventPermissions.isAccess) {
      return 'event';
    }
    if (permissions.memberPermissions.isAccess) {
      return 'member';
    }
    if (permissions.rolePermissions.isAccess && showEnterprisePlugin) {
      return 'role';
    }
    if (permissions.pluginPermissions.isAccess) {
      return 'plugin';
    }
    return '';
  };

  getResolvedScope = (location, permissions, showEnterprisePlugin) => {
    const requestedScope = this.getRequestedScope(location);
    if (requestedScope === 'event' && permissions.eventPermissions.isAccess) {
      return 'event';
    }
    if (requestedScope === 'member' && permissions.memberPermissions.isAccess) {
      return 'member';
    }
    if (
      requestedScope === 'role' &&
      permissions.rolePermissions.isAccess &&
      showEnterprisePlugin
    ) {
      return 'role';
    }
    if (requestedScope === 'plugin' && permissions.pluginPermissions.isAccess) {
      return 'plugin';
    }
    return this.getDefaultScope(permissions, showEnterprisePlugin);
  };

  syncViewState = ({ refreshOverview = false } = {}) => {
    const permissions = this.getPermissionsFromProps();
    const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(this.props.pluginsList);
    const nextScope = this.getResolvedScope(this.props.location, permissions, showEnterprisePlugin);

    // Automatic permission/plugin hydration shares this page initialization.
    // Only an explicit navigation back to activities requires another read.
    if (refreshOverview && nextScope === 'event' && this.state.scope !== 'event') {
      this.loadOverview();
    }
    this.setState(prevState => {
      const updates = {};
      ['eventPermissions', 'memberPermissions', 'datecenterPermissions', 'rolePermissions', 'pluginPermissions'].forEach(
        key => {
          if (JSON.stringify(prevState[key]) !== JSON.stringify(permissions[key])) {
            updates[key] = permissions[key];
          }
        }
      );
      if (nextScope && prevState.scope !== nextScope) {
        updates.scope = nextScope;
      }
      return Object.keys(updates).length > 0 ? updates : null;
    });
  };

  // 获取团队基本信息
  getOverviewScope = () => JSON.stringify([globalUtil.getCurrTeamName(), globalUtil.getCurrRegionName()]);

  getOverviewIdentity = () => {
    const { currUser, currentTeam, currentTeamPermissionsInfo } = this.props;
    const identity = this.overviewIdentity({
      teamName: globalUtil.getCurrTeamName(),
      regionName: globalUtil.getCurrRegionName(),
      userId: currUser && currUser.user_id,
      enterpriseId: currUser && currUser.enterprise_id,
      isEnterpriseAdmin: currUser && currUser.is_enterprise_admin,
      userRoles: currUser && currUser.roles,
      // Standalone pages retain their existing permission-hydration behavior;
      // the layout-owned path additionally rejects true known-scope changes.
      permissions: this.props.teamOverviewLoader &&
        (!currentTeam || currentTeam.team_name === globalUtil.getCurrTeamName()) &&
        currentTeamPermissionsInfo ? currentTeamPermissionsInfo.team : null
    });
    if (this.props.teamOverviewLoader &&
      (!currUser || currUser.user_id === undefined || currUser.user_id === null || currUser.user_id === '')) return '';
    return identity;
  };

  loadOverview = ({ force = true } = {}) => {
    if (!this._isMounted) return;
    const { dispatch } = this.props;
    const scope = this.getOverviewScope();
    const identity = this.getOverviewIdentity();
    const overviewLoader = this.props.teamOverviewLoader;
    const generation = ++this.overviewGeneration;
    this.overviewScope = scope;
    this.activeOverviewIdentity = identity;
    const isCurrent = () => this._isMounted && generation === this.overviewGeneration &&
      scope === this.getOverviewScope() && identity === this.getOverviewIdentity();
    let settled = false;
    const finish = (response, error) => {
      if (settled || !isCurrent()) return;
      settled = true;
      const success = isTeamOverviewResponse(response);
      this.setState({
        overviewSnapshot: { scope, generation, isCurrent, status: success ? 'success' : 'error', response: success ? response : null }
      });
      // The layout is the sole error-notification owner for shared reads.
      if (error && !overviewLoader) handleAPIError(error);
    };
    this.setState({
      overviewSnapshot: { scope, generation, isCurrent, status: 'pending', response: null }
    });
    const pending = dispatch({
      type: 'index/fetchOverview',
      overviewLoader,
      forceOverview: force,
      shouldApply: () => !settled && isCurrent(),
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => finish(res),
      handleError: err => finish(null, err)
    });
    // DVA dispatch settles even when a handled API error produces no response.
    // End the shared pending state without silently starting another request.
    if (pending && typeof pending.then === 'function') {
      pending.then(() => finish(null), error => finish(null, error));
    }
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
    const scope = this.getOverviewScope();
    const identity = this.getOverviewIdentity();
    const isCurrent = () => this._isMounted && scope === this.getOverviewScope() &&
      identity === this.getOverviewIdentity();
    dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data
      },
      callback: () => {
        if (!isCurrent()) return;
        this.handleUpDataHeader();
        dispatch({
          type: 'user/fetchCurrent',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          callback: res => {
            if (!isCurrent()) return;
                        dispatch({
              type: 'global/IsUpDataHeader',
              payload: { isUpData: false }
            });
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
      },
      handleError: err => {
        if (isCurrent()) handleAPIError(err);
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
    const { dispatch } = this.props;
    if (key === 'event' && this.state.scope !== 'event') this.loadOverview();
    this.setState({ scope: key });
    dispatch(
      routerRedux.push({
        pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/team`,
        search: `?tab=${key}`
      })
    );
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
      pluginPermissions,
      overviewSnapshot
    } = this.state;

    const overview = getTeamOverviewData(overviewSnapshot, this.getOverviewScope());
    const logoInfo = (overview && overview.logo) || TeamImg;

    const dynamicAccess = eventPermissions?.isAccess;
    const memberAccess = memberPermissions?.isAccess;
    const roleAccess = rolePermissions?.isAccess;
    const pluginAccess = pluginPermissions?.isAccess;
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
    if (pluginAccess) {
      tabList.push({
        key: 'plugin',
        tab: formatMessage({ id: 'teamManage.tabs.plugin' })
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
        tabActiveKey={
          scope ||
          this.getDefaultScope(
            {
              eventPermissions,
              memberPermissions,
              rolePermissions,
              pluginPermissions
            },
            showEnterprisePlugin
          ) ||
          'event'
        }
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {scope === 'member' && (
          <TeamMemberList memberPermissions={memberPermissions} rolePermissions={rolePermissions} />
        )}

        {scope === 'role' && (
          <EnterprisePluginsPage
            type="Permission"
            componentData={{ rolePermissions }}
            key="Permission"
          />
        )}

        {scope === 'event' && dynamicAccess && (
          <TeamEventList memberPermissions={memberPermissions} overviewSnapshot={overviewSnapshot} />
        )}

        {scope === 'plugin' && pluginAccess && <PluginListContent />}

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
