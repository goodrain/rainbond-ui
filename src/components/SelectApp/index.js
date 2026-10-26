import { Dropdown, Icon, Input, notification } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import roleUtil from '../../utils/role';
import handleAPIError from '../../utils/error';
import EditGroupName from '../AddOrEditGroup';
import style from './index.less';

@connect(({ user, teamControl }) => ({
  currentUser: user.currentUser,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class SelectApp extends PureComponent {
  constructor(props) {
    super(props);
    this.componentMounted = false;
    this.groupsRequestGeneration = 0;
    this.activeGroupsScope = '';
    this.createAppVisit = null;
    this.state = {
      teamApps: [],
      loading: true,
      currentApp: {},
      queryName: '',
      visible: false
    };
  }
  componentDidMount() {
    this.componentMounted = true;
    this.activeGroupsScope = this.getGroupsScope();
    this.loadTeamApps(false);
  }
  componentDidUpdate(prevProps) {
    const scope = this.getGroupsScope();
    if (scope !== this.activeGroupsScope) {
      this.activeGroupsScope = scope;
      const generation = ++this.groupsRequestGeneration;
      this.createAppVisit = null;
      this.setState(() => generation === this.groupsRequestGeneration && scope === this.getGroupsScope()
        ? { queryName: '', teamApps: [], currentApp: {}, loading: Boolean(scope), showCreateApp: false, visible: false }
        : null, () => {
        if (this.componentMounted && generation === this.groupsRequestGeneration && scope === this.getGroupsScope() && scope) {
          this.loadTeamApps(false);
        }
      });
      return;
    }
    if (String(prevProps.currentAppID) !== String(this.props.currentAppID)) this.syncCurrentApp();
  }
  componentWillUnmount() {
    this.componentMounted = false;
    this.groupsRequestGeneration += 1;
    this.createAppVisit = null;
  }
  getGroupsParams = () => ({
    team_name: this.props.teamName || this.props.currentTeam && this.props.currentTeam.team_name,
    region_name: this.props.regionName || this.props.currentRegion && this.props.currentRegion.team_region_name
  });
  getGroupsScope = () => {
    const { currentUser, initialGroupsScope, currentTeamPermissionsInfo } = this.props;
    const { team_name: team, region_name: region } = this.getGroupsParams();
    if (!currentUser || currentUser.user_id === undefined || currentUser.user_id === null ||
        currentUser.user_id === '' || !team || !region) return '';
    if (Object.prototype.hasOwnProperty.call(this.props, 'initialGroupsScope')) return initialGroupsScope || '';
    return JSON.stringify([team, region, String(currentUser.user_id), currentUser.enterprise_id || '',
      currentUser.is_enterprise_admin, currentUser.roles, currentTeamPermissionsInfo,
      this.props.currentAppID == null ? '' : String(this.props.currentAppID)]);
  };
  invalidateInitialGroups = () => {
    const loader = this.props.initialGroupsLoader;
    if (loader && typeof loader.invalidate === 'function') loader.invalidate();
  };
  syncCurrentApp = () => {
    if (!this.componentMounted) return;
    const scope = this.getGroupsScope();
    const generation = this.groupsRequestGeneration;
    this.setState(previous => this.componentMounted && scope === this.getGroupsScope() &&
      generation === this.groupsRequestGeneration ? {
        currentApp: previous.teamApps.find(item => String(item.group_id) === String(this.props.currentAppID)) || {}
      } : null);
  };
  queryApps = query => {
    const scope = this.getGroupsScope();
    if (!this.componentMounted || !scope) return;
    const generation = ++this.groupsRequestGeneration;
    this.invalidateInitialGroups();
    this.setState(() => this.componentMounted && scope === this.getGroupsScope() &&
      generation === this.groupsRequestGeneration ? { queryName: query == null ? '' : String(query) } : null, () => {
      if (this.componentMounted && scope === this.getGroupsScope() && generation === this.groupsRequestGeneration) this.loadTeamApps(true);
    });
  };
  handleQueryChange = event => {
    if (event && event.target && event.target.value === '') this.queryApps('');
  };
  loadTeamApps = (force = true) => {
    if (!this.componentMounted) return;
    const scope = this.getGroupsScope();
    const generation = ++this.groupsRequestGeneration;
    if (!scope) {
      this.setState(() => this.componentMounted && generation === this.groupsRequestGeneration && !this.getGroupsScope()
        ? { teamApps: [], currentApp: {}, loading: false } : null);
      return;
    }
    const query = this.state.queryName;
    const initialGroupsLoader = !force && query === '' ? this.props.initialGroupsLoader : undefined;
    if (force) this.invalidateInitialGroups();
    const isCurrent = () => this.componentMounted && generation === this.groupsRequestGeneration &&
      scope === this.getGroupsScope();
    this.setState(() => isCurrent() ? { loading: true } : null);
    return this.props.dispatch({
      type: 'global/fetchGroups',
      payload: { ...this.getGroupsParams(), query },
      initialGroupsLoader,
      shouldApply: isCurrent,
      callback: list => {
        if (!isCurrent()) return;
        const apps = Array.isArray(list) ? list : [];
        this.setState(previous => {
          if (!isCurrent()) return null;
          const selected = apps.find(item => String(item.group_id) === String(this.props.currentAppID));
          return { teamApps: apps.slice().reverse(), loading: false,
            currentApp: selected || (String(previous.currentApp.group_id) === String(this.props.currentAppID)
              ? previous.currentApp : {}) };
        });
      },
      handleError: error => {
        if (!isCurrent()) return;
        this.setState(() => isCurrent() ? { loading: false } : null);
        if (!initialGroupsLoader && error) handleAPIError(error);
      }
    });
  };
  isCreateAppVisitCurrent = visit => this.componentMounted && visit && visit === this.createAppVisit &&
    visit.scope === this.getGroupsScope();
  showCreateApp = () => {
    const scope = this.getGroupsScope();
    if (!this.componentMounted || !scope) return;
    const visit = { scope };
    this.createAppVisit = visit;
    this.setState(() => this.isCreateAppVisitCurrent(visit) ? { visible: false, showCreateApp: true } : null);
  };
  handleCreateApp = (visit = this.createAppVisit) => {
    if (!this.isCreateAppVisitCurrent(visit)) return;
    this.invalidateInitialGroups();
    notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
    this.cancelCreateApp(visit);
    this.loadTeamApps(true);
  };
  cancelCreateApp = (visit = this.createAppVisit) => {
    if (!this.isCreateAppVisitCurrent(visit)) return;
    const { scope } = visit;
    this.createAppVisit = null;
    this.setState(() => this.componentMounted && scope === this.getGroupsScope() && !this.createAppVisit
      ? { visible: false, showCreateApp: false } : null);
  };

  handleEnter = () => {
    this.setState({ visible: true });
  };
  handleOut = () => {
    this.setState({ visible: false });
  };
  handleClickApp = () =>{
    this.props.handleClick();
  }
  render() {
    const {
      className,
      currentTeam,
      currentRegion,
      currentAppID,
      currentComponent,
      active,
      currentTeamPermissionsInfo,
    } = this.props;
    const {
      teamApps,
      loading,
      showCreateApp,
      currentApp,
      visible
    } = this.state;
    const teamName = this.props.teamName || currentTeam?.team_name;
    const regionName = this.props.regionName || currentRegion?.team_region_name;
    const createAppVisit = this.createAppVisit;
    const isCreateApp = true;
    const currentAPPLink = `/team/${teamName}/region/${regionName}/apps/${currentAppID}/overview`;
    const dropdown = (
      <div className={style.dropBox}>
        <div className={style.dropBoxSearch}>
          <Input.Search
            key={this.getGroupsScope()}
            onChange={this.handleQueryChange}
            onSearch={this.queryApps}
            className={style.dropBoxSearchInputContrl}
            placeholder={formatMessage({ id: 'header.app.search' })}
            loading={loading}
            prefix={<Icon type="search" className={style.searchIcon} />}
            allowClear
          />
        </div>
        <div className={style.dropBoxContent}>
          {teamApps.length > 0 ? (
            <div className={style.dropBoxList}>
              <ul>
                {teamApps.map(item => {
                  const link = `/team/${teamName}/region/${regionName}/apps/${item.group_id}/overview`;
                  const isCurrentApp = String(item.group_id) === String(currentAppID);
                  return (
                    <li key={item.group_id} onClick={this.handleClickApp}>
                      <Link
                        to={link}
                        title={item.group_name}
                        className={`${style.appItem} ${isCurrentApp ? style.appItemCurrent : ''}`}
                        aria-current={isCurrentApp ? 'page' : undefined}
                      >
                        <div className={style.appItemContent}>
                          <div className={style.appItemIcon}>
                            <Icon type="appstore" />
                          </div>
                          <div className={style.appItemInfo}>
                            <div className={style.appItemName}>{item.group_name}</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            !loading && (
              <div className={style.emptyState}>
                <Icon type="inbox" className={style.emptyIcon} />
                <p><FormattedMessage id="header.app.empty" defaultMessage="No apps found" /></p>
              </div>
            )
          )}
          {isCreateApp && (
            <div
              className={style.dropBoxListCreate}
              onClick={this.showCreateApp}
            >
              <Icon type="plus" className={style.createIcon} />
              <FormattedMessage id="header.app.create" />
            </div>
          )}
        </div>
      </div>
    );
    return (
      <div
        className={className}
        onMouseLeave={this.handleOut}
        onMouseEnter={this.handleEnter}
      >
        <Dropdown
          overlay={dropdown}
          visible={showCreateApp ? false : visible}
          trigger={['click', 'hover']}
          placement="bottomLeft"
        >
          <div>
            {active && (
              <div className={style.selectButton}>
                <div className={`${style.selectButtonName} ${visible ? style.selectButtonNameActive : ''}`}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonApp}>
                      <Icon type="appstore" className={style.selectButtonAppIcon} />
                      <span className={style.selectButtonAppText}>{currentApp.group_name}</span>
                    </div>
                  </div>
                  <Icon
                    className={`${style.selectButtonArray} ${visible ? style.selectButtonArrayActive : ''}`}
                    type="caret-down"
                  />
                </div>
              </div>
            )}
            {!active && (
              <Link to={currentAPPLink} className={style.selectButton}>
                <div className={style.selectButtonName}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonApp}>
                      <Icon type="appstore" className={style.selectButtonAppIcon} />
                      <span className={style.selectButtonAppText}>{currentApp.group_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </Dropdown>

        {showCreateApp && (
          <EditGroupName
            regionName={regionName}
            teamName={teamName}
            isGetGroups={false}
            title={formatMessage({ id: 'header.app.create' })}
            onCancel={() => this.cancelCreateApp(createAppVisit)}
            onOk={() => this.handleCreateApp(createAppVisit)}
          />
        )}
      </div>
    );
  }
}
