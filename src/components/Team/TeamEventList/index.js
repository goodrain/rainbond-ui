/* eslint-disable camelcase */
import { List, Spin, Row, Col } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import newRole from '@/utils/newRole';
import PluginUtil from '../../../utils/pulginUtils';
import globalUtil from '../../../utils/global';
import handleAPIError from '../../../utils/error';
import styles from './index.less';

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
      teamOverviewPermission: newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview'),
      storageUsed: 0
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadEvents();
    this.loadOverview();
  }

  componentWillUnmount() {
    this._isMounted = false;
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
        if (!this._isMounted) return;
        if (res && res.bean && res.bean.region_health) {
          this.setState(
            { loadingOverview: false, loadedOverview: true },
            () => {
              this.getStorageUsed(res.bean.team_id);
            }
          );
        } else {
          this.handleCloseLoading();
        }
      },
      handleError: (err) => {
        handleAPIError(err);
        if (this._isMounted) {
          this.handleCloseLoading();
        }
      }
    });
  };

  // 获取存储实际占用
  getStorageUsed = (teamId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchStorageUsed',
      payload: {
        tenant_id: teamId
      },
      callback: res => {
        if (!this._isMounted) return;
        if (res && res.bean) {
          this.setState({
            storageUsed: res.bean.used_storage
          });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
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
        if (data) {
          this.setState({
            events: data.list || [],
            total: data.total || (data.list ? data.list.length : 0)
          });
        }
      },
      handleError: err => {
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
    const appID = globalUtil.getAppID();

    return events.map(item => {
      const {
        ID,
        user_name,
        opt_type,
        final_status,
        status,
        create_time,
        target,
        service_name,
        service_alias,
        updatedAt
      } = item;

      const linkTo = `/team/${teamName}/region/${regionName}/apps/${appID}/overview?type=components&componentID=${service_alias}&tab=overview`;

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
              {target === 'service' && (
                <Link to={linkTo} className={styles.event}>
                  {service_name}
                </Link>
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
    const { activitiesLoading, index, pluginsList } = this.props;
    const {
      page,
      pageSize,
      total,
      loadingOverview,
      teamOverviewPermission: {
        isAccess: isTeamOverview
      },
      storageUsed
    } = this.state;

    const showStorageUsed = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');

    const pagination = {
      current: page,
      pageSize,
      total,
      onChange: this.handlePageChange
    };

    return (
      <div className={styles.teamEventListWrapper}>
        {/* 团队概览部分 */}
        {(index?.overviewInfo?.region_health || loadingOverview) && (
          <div className={styles.teamOverview}>
            <Row type="flex" justify="space-between" className={styles.basicInfoRow}>
              <Col span={4}>
                <div className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>{formatMessage({ id: 'versionUpdata_6_1.appNum' })}</div>
                  <div className={styles.basicInfoContent}>
                    {isTeamOverview ? index?.overviewInfo?.team_app_num || 0 : '**'}
                  </div>
                </div>
              </Col>
              <Col span={4}>
                <div className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>{formatMessage({ id: 'versionUpdata_6_1.serviceNum' })}</div>
                  <div className={styles.basicInfoContent}>{isTeamOverview ? index?.overviewInfo?.team_service_num || 0 : '**'}</div>
                </div>
              </Col>
              <Col span={4}>
                <div className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>{formatMessage({ id: 'versionUpdata_6_1.cpuUsage' })} ({this.handlUnit('cpu', index?.overviewInfo?.cpu_usage, 'm')})</div>
                  <div className={styles.basicInfoContent}>{isTeamOverview ? this.handlUnit('cpu', index?.overviewInfo?.cpu_usage) || 0 : '**'}</div>
                </div>
              </Col>
              <Col span={4}>
                <div className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>{formatMessage({ id: 'versionUpdata_6_1.memoryUsage' })} ({this.handlUnit('memory', index?.overviewInfo?.memory_usage, 'MB')})</div>
                  <div className={styles.basicInfoContent}>{isTeamOverview ? this.handlUnit('memory', index?.overviewInfo?.memory_usage) || 0 : '**'}</div>
                </div>
              </Col>
              <Col span={4}>
                <div className={styles.basicInfo}>
                  <div className={styles.basicInfoTitle}>
                    {showStorageUsed ? `${formatMessage({ id: 'versionUpdata_6_1.storageUsage' })}(${storageUsed?.unit})` : `${formatMessage({ id: 'versionUpdata_6_1.diskUsage' })}(GB)`}
                  </div>
                  <div className={styles.basicInfoContent}>
                    {isTeamOverview ? (showStorageUsed ? storageUsed?.value : index?.overviewInfo?.disk_usage) : '**'}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* 事件列表部分 */}
        <div className={styles.eventListContainer}>
          <Spin spinning={activitiesLoading}>
            <List
              pagination={total > pageSize ? pagination : false}
              size="large"
            >
              <div className={styles.activitiesList}>
                {this.renderActivities()}
              </div>
            </List>
          </Spin>
        </div>
      </div>
    );
  }
}
