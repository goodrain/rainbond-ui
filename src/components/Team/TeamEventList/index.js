/* eslint-disable camelcase */
import { List, Pagination, Spin } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import newRole from '@/utils/newRole';
import PluginUtil from '../../../utils/pulginUtils';
import globalUtil from '../../../utils/global';
import handleAPIError from '../../../utils/error';
import styles from './index.less';

const {
  buildTeamEventTarget,
  getTeamEventServiceLabel,
  shouldLoadTeamStorage,
  isTeamOverviewResponse,
  getTeamOverviewData,
} = require('./helpers');
const { createComponentPollingGuard } = require('../../../pages/Component/componentPolling');

@connect(({ user, index, loading, global, teamControl, enterprise }) => ({
  currentUser: user.currentUser,
  index,
  enterprise: global.enterprise,
  events: index.events,
  pagination: index.pagination,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  activitiesLoading: loading.effects['index/fetchEvents'],
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  pluginsList: global.pluginsList
}))
export default class EventList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 事件列表相关
      page: 1,
      pageSize: 8,
      total: 0,
      events: [],
      // 团队概览相关
      loadingOverview: true,
      loadedOverview: false,
      overviewInfo: null,
      teamOverviewPermission: newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview'),
      storageUsed: 0
    };
    this._isMounted = false;
    this.eventRequestGeneration = 0;
    this.storageRetryCount = 0;
    this.scopeGuard = createComponentPollingGuard(() => this._isMounted, () => this.getScope());
    this.overviewGuard = createComponentPollingGuard(
      () => this._isMounted && !this.isOverviewShared(), () => this.getScope()
    );
    this.storageGuard = createComponentPollingGuard(
      () => this._isMounted && this.canLoadStorage(), () => this.getStorageIdentity()
    );
  }

  componentDidMount() {
    this._isMounted = true;
    this.scope = this.getScope();
    this.loadEvents();
    this.loadOverview();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.scopeGuard.invalidate();
    this.overviewGuard.invalidate();
    this.resetStorageRequest();
  }

  componentDidUpdate() {
    const permission = this.getOverviewPermission();
    if (this.scope !== this.getScope()) {
      this.scope = this.getScope();
      this.scopeGuard.invalidate();
      this.overviewGuard.invalidate();
      this.sharedOverviewSnapshot = undefined;
      this.sharedOverviewScope = null;
      this.resetStorageRequest();
      this.storageOverview = null;
      this.storageLoadedKey = null;
      this.setState({ page: 1, events: [], total: 0, storageUsed: 0, loadingOverview: true,
        loadedOverview: false, overviewInfo: null, teamOverviewPermission: permission }, () => {
        this.loadEvents();
        this.loadOverview();
      });
      return;
    }
    if (Boolean(this.state.teamOverviewPermission.isAccess) !== Boolean(permission.isAccess)) {
      this.setState({ teamOverviewPermission: permission });
    }
    if (this.isOverviewShared()) {
      this.syncSharedOverview();
    } else if (this.overviewShared) {
      this.overviewShared = false;
      this.loadOverview();
    }
    this.syncStorageRequest();
  }

  getScope = () => JSON.stringify([globalUtil.getCurrTeamName(), globalUtil.getCurrRegionName()]);
  isOverviewShared = () => this.props.overviewSnapshot !== undefined;
  syncSharedOverview = () => {
    const snapshot = this.props.overviewSnapshot;
    const scope = this.getScope();
    if (this.overviewShared && this.sharedOverviewSnapshot === snapshot && this.sharedOverviewScope === scope) return;
    this.overviewShared = true;
    this.sharedOverviewSnapshot = snapshot;
    this.sharedOverviewScope = scope;
    this.overviewGuard.invalidate();
    this.resetStorageRequest();
    this.storageLoadedKey = null;
    this.storageOverview = getTeamOverviewData(snapshot, scope);
    const loading = !snapshot || snapshot.scope !== scope || snapshot.status === 'pending';
    this.setState({
      overviewInfo: this.storageOverview,
      storageUsed: 0,
      loadingOverview: loading,
      loadedOverview: !loading
    }, () => this.syncStorageRequest());
  };
  getOverviewPermission = () => newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview');
  getStorageIdentity = () => JSON.stringify([this.getScope(), this.storageOverview && this.storageOverview.team_id]);
  canLoadStorage = () => shouldLoadTeamStorage({
    billingInstalled: PluginUtil.isInstallPlugin(this.props.pluginsList, 'rainbond-bill'),
    canViewOverview: this.getOverviewPermission().isAccess,
    overview: this.storageOverview
  });
  resetStorageRequest = () => {
    this.storageGuard.invalidate();
    clearTimeout(this.storageRetryTimer);
    this.storageRetryTimer = null;
    this.storageFailedKey = null;
    this.storageRetryCount = 0;
    this.storageEligible = false;
    this.storageIdentity = null;
  };
  syncStorageRequest = () => {
    if (!this._isMounted) return;
    const identity = this.getStorageIdentity();
    const eligible = this.canLoadStorage();
    if (this.storageIdentity !== identity || this.storageEligible !== eligible) {
      this.resetStorageRequest();
      this.storageIdentity = identity;
      this.storageEligible = eligible;
    }
    if (eligible && this.storageLoadedKey !== identity && this.storageFailedKey !== identity) {
      this.getStorageUsed(this.storageOverview.team_id);
    }
  };
  retryStorageRequest = request => {
    this.storageFailedKey = this.getStorageIdentity();
    this.storageRetryCount += 1;
    // One delayed retry per eligibility/scope change. Re-renders do not retry a
    // persistent failure or create an unbounded background request loop.
    if (this.storageRetryCount === 1) {
      this.storageRetryTimer = setTimeout(() => {
        this.storageRetryTimer = null;
        if (!request.isCurrent()) return;
        this.storageFailedKey = null;
        this.syncStorageRequest();
      }, 10000);
    }
  };

  // 获取团队下的基本信息
  loadOverview = () => {
    if (this.isOverviewShared()) {
      this.syncSharedOverview();
      return;
    }
    const request = this.overviewGuard.begin('overview');
    if (!request) return;
    const { dispatch } = this.props;
    const pending = dispatch({
      type: 'index/fetchOverview',
      shouldApply: request.isCurrent,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (!request.complete()) return;
        this.storageOverview = isTeamOverviewResponse(res) ? res.bean : null;
        this.setState(
          { overviewInfo: this.storageOverview, loadingOverview: false, loadedOverview: true },
          () => {
            if (request.isCurrent()) this.syncStorageRequest();
          }
        );
      },
      handleError: (err) => {
        if (!request.complete()) return;
        this.storageOverview = null;
        this.setState({ overviewInfo: null });
        this.syncStorageRequest();
        handleAPIError(err);
        if (this._isMounted) {
          this.handleCloseLoading();
        }
      }
    });
    if (pending && typeof pending.then === 'function') {
      const settleEmpty = error => {
        if (!request.complete()) return;
        this.storageOverview = null;
        this.setState({ overviewInfo: null, loadingOverview: false, loadedOverview: true });
        this.syncStorageRequest();
        if (error) handleAPIError(error);
      };
      pending.then(() => settleEmpty(), settleEmpty);
    }
  };

  // 获取存储实际占用
  getStorageUsed = (teamId) => {
    if (!this.canLoadStorage() || teamId !== this.storageOverview.team_id) return;
    const request = this.storageGuard.begin('storage');
    if (!request) return;
    const identity = this.getStorageIdentity();
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchStorageUsed',
      payload: {
        tenant_id: teamId,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (!request.complete()) return;
        if (res && res.bean) {
          this.storageLoadedKey = identity;
          this.setState({
            storageUsed: res.bean.used_storage
          });
        } else {
          this.retryStorageRequest(request);
        }
      },
      handleError: (err) => {
        if (!request.complete()) return;
        handleAPIError(err);
        this.retryStorageRequest(request);
      }
    });
  };

  // 关闭loading
  handleCloseLoading = () => {
    if (this._isMounted) {
      this.setState({ loadingOverview: false, loadedOverview: true });
    }
  };

  // 根据type计算资源大小和单位 cpu 内存
  handlUnit = (type, num, unit) => {
    if (type === 'memory') {
      if (num || unit) {
        let nums = num;
        let units = unit;
        if (nums >= 1024) {
          nums = num / 1024;
          units = 'GB';
        }
        return unit ? units : nums.toFixed(1);
      }
      return num;
    } else if (type === 'cpu') {
      if (num || unit) {
        let nums = num;
        let units = unit;
        if (nums >= 1000) {
          nums = num / 1000;
          units = 'Core';
        }
        return unit ? units : nums.toFixed(1);
      }
      return num;
    }
    return num;
  };

  // 加载团队事件列表
  loadEvents = () => {
    if (!this._isMounted) return;
    const isCurrent = this.scopeGuard.checkpoint();
    const generation = ++this.eventRequestGeneration;
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;

    dispatch({
      type: 'index/fetchEvents',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_size: pageSize,
        page
      },
      callback: data => {
        if (!isCurrent() || generation !== this.eventRequestGeneration) return;
        if (data) {
          this.setState({
            events: data.list || [],
            total: data.total || (data.list ? data.list.length : 0)
          });
        }
      },
      handleError: err => {
        if (!isCurrent() || generation !== this.eventRequestGeneration) return;
        handleAPIError(err);
      }
    });
  };

  // 分页切换
  handlePageChange = page => {
    this.setState({ page }, () => {
      this.loadEvents();
    });
  };

  // 渲染活动列表
  renderActivities = () => {
    const { events } = this.state;

    if (!events || events.length === 0) {
      return (
        <p
          style={{
            textAlign: 'center',
            color: '#ccc',
            paddingTop: 20
          }}
        >
          {formatMessage({ id: 'teamManage.tabs.dynamic.notDynamic' })}
        </p>
      );
    }

    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    return events.map(item => {
      const {
        ID,
        user_name,
        opt_type,
        final_status,
        status,
        create_time,
        target,
        updatedAt
      } = item;

      const linkTo = buildTeamEventTarget(teamName, regionName, item);
      const serviceLabel = getTeamEventServiceLabel(item);

      return (
        <List.Item key={ID}>
          <div className={styles.eventItem}>
            <div className={styles.eventInfo}>
              <a className={styles.username}>{user_name}</a>
              <span className={styles.event}>
                {' '}
                {globalUtil.fetchStateOptTypeText(opt_type)}
              </span>
              &nbsp;
              {target === 'service' && serviceLabel && (
                linkTo ? (
                  <Link to={linkTo} className={styles.event}>
                    {serviceLabel}
                  </Link>
                ) : (
                  <span className={styles.event}>{serviceLabel}</span>
                )
              )}
              <span>
                {formatMessage({ id: 'teamManage.tabs.dynamic.meta.app' })}
              </span>
              <span
                style={{
                  color: globalUtil.fetchAbnormalcolor(opt_type)
                }}
              >
                {globalUtil.fetchOperation(final_status, status)}
              </span>
            </div>
            <span className={styles.eventTime} title={updatedAt}>
              {globalUtil.fetchdayTime(create_time)}
            </span>
          </div>
        </List.Item>
      );
    });
  };

  render() {
    const { activitiesLoading, pluginsList } = this.props;
    const {
      page,
      pageSize,
      total,
      loadingOverview: standaloneLoadingOverview,
      storageUsed: loadedStorageUsed
    } = this.state;
    // Never render the shared Redux overview from another team/region while a
    // current page request is still pending or has failed.
    const snapshot = this.props.overviewSnapshot;
    const overviewInfo = this.isOverviewShared()
      ? getTeamOverviewData(snapshot, this.getScope())
      : this.scope === this.getScope() ? this.state.overviewInfo : null;
    const loadingOverview = this.isOverviewShared()
      ? !snapshot || snapshot.scope !== this.getScope() || snapshot.status === 'pending'
      : standaloneLoadingOverview;
    const storageUsed = this.storageOverview === overviewInfo ? loadedStorageUsed : 0;
    const isTeamOverview = this.getOverviewPermission().isAccess;

    const showStorageUsed = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');

    const pagination = {
      current: page,
      pageSize,
      total,
      onChange: this.handlePageChange
    };

    const overviewItems = [
      {
        key: 'app',
        action: '创建',
        value: isTeamOverview ? overviewInfo?.team_app_num || 0 : '**',
        unit: '个',
        object: '应用'
      },
      {
        key: 'service',
        action: '创建',
        value: isTeamOverview ? overviewInfo?.team_service_num || 0 : '**',
        unit: '个',
        object: '组件'
      },
      {
        key: 'cpu',
        action: '使用',
        value: isTeamOverview
          ? this.handlUnit('cpu', overviewInfo?.cpu_usage) || 0
          : '**',
        unit: this.handlUnit('cpu', overviewInfo?.cpu_usage, 'm'),
        object: 'CPU'
      },
      {
        key: 'memory',
        action: '使用',
        value: isTeamOverview
          ? this.handlUnit('memory', overviewInfo?.memory_usage) || 0
          : '**',
        unit: this.handlUnit('memory', overviewInfo?.memory_usage, 'MB'),
        object: '内存'
      },
      {
        key: 'storage',
        action: '使用',
        value: isTeamOverview
          ? showStorageUsed
            ? storageUsed?.value
            : overviewInfo?.disk_usage
          : '**',
        unit: showStorageUsed ? storageUsed?.unit : 'GB',
        object: showStorageUsed ? '存储' : '磁盘'
      }
    ];

    return (
      <div className={styles.teamEventListWrapper}>
        {/* 团队概览部分 */}
        {(overviewInfo?.region_health || loadingOverview) && (
          <div className={styles.teamOverview}>
            <div className={styles.basicInfoRow}>
              {overviewItems.map(item => (
                <div key={item.key} className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>{item.action}</div>
                  <div className={styles.basicInfoContent}>
                    {item.value}
                    {item.unit && <span>{item.unit}</span>}
                  </div>
                  <div className={styles.basicInfoDesc}>{item.object}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 事件列表部分 */}
        <div className={styles.eventListContainer}>
          <Spin spinning={activitiesLoading}>
            <div className={styles.eventListBody}>
              <div className={styles.activitiesList}>
                <List size="large">{this.renderActivities()}</List>
              </div>
            </div>
            {total > pageSize && (
              <div className={styles.eventListPagination}>
                <Pagination {...pagination} />
              </div>
            )}
          </Spin>
        </div>
      </div>
    );
  }
}
