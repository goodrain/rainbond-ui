import React, { Component } from 'react'
import { Button, Dropdown, Input, Menu, Modal, Pagination, Tooltip, Icon, Select, notification } from 'antd';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import Result from '../../../components/Result';
import CreateComponentModal from '../../../components/CreateComponentModal';
import AppDeteleResource from '../../../components/AppDeteleResource';
import {
  CodeIcon,
  StoreIcon,
  ContainerIcon,
  PackageIcon,
  FileTextIcon,
} from '../../../components/CreateComponentModal/icons';
import newRole from '@/utils/newRole';
import globalUtil from '../../../utils/global';
import handleAPIError from '../../../utils/error';
import { routerRedux } from 'dva/router';
import cookie from '../../../utils/cookie'
import moment from 'moment';
import styles from './index.less';
const { Search } = Input;
const { Option } = Select;

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
  loading,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
export default class index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 1,
      page_size: 11,
      query: '',
      sortValue: 1,
      loadingOverview: true,
      loadedOverview: false,
      appListLoading: true,
      teamHotAppList: [],
      appListTotal: 0,
      teamAppCreatePermission: newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_app_create'),
      language: cookie.get('language') === 'zh-CN',
      createComponentVisible: false,
      currentView: null,
      actionModalVisible: false,
      actionCode: '',
      actionTargetApp: null,
      deleteVisible: false,
      deleteConfirmVisible: false,
      deleteTargetApp: null,
      deleteResourceList: null,
    };
    // 标记组件是否已挂载
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    this.loadOverview();

    // 解析 URL 参数（只在首次加载时处理）
    if (!this.hasProcessedUrlParams) {
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const showAddModal = urlParams.get('showAddModal');
      const currentView = urlParams.get('currentView');

      // 如果 URL 中有 showAddModal=true，则显示创建组件弹窗
      if (showAddModal === 'true') {
        this.setState({
          createComponentVisible: true,
          currentView: currentView || null
        });
        this.hasProcessedUrlParams = true;
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.refreshTimers) {
      this.refreshTimers.forEach(timer => clearTimeout(timer));
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
        if (!this._isMounted) return;
        if (res && res.bean && res.bean.region_health) {
          this.setState(
            { loadingOverview: false, loadedOverview: true },
            () => {
              this.loadHotApp();
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

  // 关闭loading
  handleCloseLoading = () => {
    if (this._isMounted) {
      this.setState({ loadingOverview: false, loadedOverview: true });
    }
  };

  refreshCurrentAppList = () => {
    if (!this._isMounted) {
      return;
    }
    if (this.refreshTimers) {
      this.refreshTimers.forEach(timer => clearTimeout(timer));
    }
    this.refreshTimers = [];
    this.loadHotApp();
    [1500, 5000].forEach(delay => {
      const timer = setTimeout(() => {
        if (this._isMounted) {
          this.loadHotApp();
        }
      }, delay);
      this.refreshTimers.push(timer);
    });
  };

  // 加载热门应用数据源
  loadHotApp = () => {
    const { page, page_size, query, sortValue } = this.state;
    this.props.dispatch({
      type: 'global/getTeamAppList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region: globalUtil.getCurrRegionName(),
        query,
        page,
        page_size,
        sort: sortValue
      },
      callback: res => {
        if (!this._isMounted) return;
        if (res && res.status_code === 200) {
          this.setState({
            teamHotAppList: res.list || [],
            appListTotal: res.bean?.total || 0,
            appListLoading: false,
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
        if (!this._isMounted) return;
        if (err && err.data && err.data.code === 10401) {
          this.setState(
            {
              page: 1
            },
            () => {
              this.loadHotApp();
            }
          );
        } else {
          this.setState({ appListLoading: false });
        }
      }
    });
  };

  // pageNum变化的回调
  handleChangePage = (page, page_size) => {
    this.setState(
      {
        page,
        page_size,
        appListLoading: true,
      },
      () => {
        this.loadHotApp();
      }
    );
  };
  // 搜索应用
  onSearch = value => {
    this.setState(
      {
        query: value,
        appListLoading: true,
        page: 1,
      },
      () => {
        this.loadHotApp();
      }
    );
  };

  // 下拉框选择排序方式
  handleSortChange = (value) => {
    this.setState({
      appListLoading: true,
      sortValue: value,
      page: 1,
    }, () => {
      this.loadHotApp();
    })
  }

  // 跳转到向导页
  onJumpToWizard = () => {
    this.setState({ createComponentVisible: true });
  }

  // 关闭创建组件弹窗
  handleCloseCreateComponent = () => {
    this.setState({ createComponentVisible: false });
  }

  getAppOverviewPath = (groupId) => {
    return `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}/overview`;
  };

  navigateToAppOverview = (groupId) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getAppOverviewPath(groupId)));
  };

  formatMemoryValue = (usedMem) => {
    const memory = usedMem || 0;
    return `${memory >= 1024 ? (memory / 1024).toFixed(2) : memory}${memory >= 1024 ? 'GB' : 'MB'}`;
  };

  formatCpuValue = (usedCpu) => {
    const cpu = usedCpu || 0;
    return `${cpu >= 1000 ? (cpu / 1000).toFixed(2) : cpu}${cpu >= 1000 ? 'Core' : 'm'}`;
  };

  getAppInitial = (name) => {
    const normalizedName = (name || '').trim();
    const firstChar = Array.from(normalizedName)[0];
    if (!firstChar) {
      return 'A';
    }
    return /[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
  };

  getAppVisitLinks = (accesses = []) => {
    return accesses.reduce((links, item) => {
      const accessInfo = item && item.access_info;
      const accessUrls = accessInfo && accessInfo[0] && accessInfo[0].access_urls;
      const firstUrl = accessUrls && accessUrls[0];
      if (firstUrl) {
        links.push({
          serviceName: accessInfo[0].service_cname,
          url: firstUrl.includes('http') || firstUrl.includes('https')
            ? firstUrl
            : `http://${firstUrl}`
        });
      }
      return links;
    }, []);
  };

  renderVisitIcon = () => (
    <svg
      className={styles.cardActionIcon}
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path
        d="M832 128h-192v64h147.2L358.4 614.4l51.2 51.2L832 236.8V384h64V128z"
        fill="currentColor"
      />
      <path
        d="M768 832H192V256h320V192H192c-38.4 0-64 25.6-64 64v576c0 38.4 25.6 64 64 64h576c38.4 0 64-25.6 64-64V512h-64v320z"
        fill="currentColor"
      />
    </svg>
  );

  renderVisitAction = (item) => {
    const visitLinks = this.getAppVisitLinks(item.accesses || []);

    if (visitLinks.length === 0) {
      return (
        <div
          className={`${styles.cardActionButton} ${styles.cardActionMuted}`}
          onClick={(e) => {
            e.stopPropagation();
            this.navigateToAppOverview(item.group_id);
          }}
        >
          <Icon type="eye-o" className={styles.cardActionIcon} />
          <span className={styles.cardActionText}>
            <FormattedMessage id="teamOverview.view" />
          </span>
        </div>
      );
    }

    if (visitLinks.length === 1) {
      return (
        <div
          className={styles.cardActionButton}
          onClick={(e) => {
            e.stopPropagation();
            window.open(visitLinks[0].url);
          }}
        >
          {this.renderVisitIcon()}
          <span className={styles.cardActionText}>
            <FormattedMessage id="teamOverview.visitApp" />
          </span>
        </div>
      );
    }

    const menu = (
      <Menu>
        {visitLinks.map(link => (
          <Menu.Item key={`${item.group_id}-${link.url}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
            >
              {link.serviceName || link.url}
            </a>
          </Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={menu} placement="bottomLeft" trigger={['click']}>
        <div
          className={styles.cardActionButton}
          onClick={e => e.stopPropagation()}
        >
          {this.renderVisitIcon()}
          <span className={styles.cardActionText}>
            <FormattedMessage id="teamOverview.visitApp" />
          </span>
        </div>
      </Dropdown>
    );
  };

  renderCreateMethodIcons = () => {
    const methodIcons = [
      {
        title: '应用商店',
        icon: <StoreIcon />,
        className: styles.iconPrimaryTone
      },
      {
        title: '镜像构建',
        icon: <ContainerIcon />,
        className: styles.iconWarningTone
      },
      {
        title: '源码构建',
        icon: <CodeIcon />,
        className: styles.iconSuccessTone
      },
      {
        title: '软件包',
        icon: <PackageIcon />,
        className: styles.iconErrorTone
      },
      {
        title: 'Yaml/Helm',
        icon: <FileTextIcon />,
        className: styles.iconProcessingTone
      }
    ];

    return methodIcons.map(item => (
      <Tooltip key={item.title} title={item.title}>
        <div className={`${styles.iconItem} ${item.className}`}>
          {item.icon}
        </div>
      </Tooltip>
    ));
  };

  getAppOperationPermissions = (groupId) => {
    return newRole.queryPermissionsInfo(
      this.props.currentTeamPermissionsInfo?.team,
      'app_overview',
      `app_${groupId}`
    );
  };

  isAppUnusedStatus = (status) => {
    const knownStatuses = [
      'RUNNING',
      'STARTING',
      'CLOSED',
      'STOPPING',
      'ABNORMAL',
      'PARTIAL_ABNORMAL',
      'WAITING',
      'waiting',
      'not-configured',
      'unknown',
      'deployed',
      'superseded',
      'failed',
      'uninstalled',
      'uninstalling',
      'pending-install',
      'pending-upgrade',
      'pending-rollback'
    ];
    return !status || !knownStatuses.includes(status);
  };

  canStartApp = (item, permissions) => {
    return permissions?.isStart && (item.services_num || 0) > 0 && (item.status === 'CLOSED' || this.isAppUnusedStatus(item.status));
  };

  canStopApp = (item, permissions) => {
    return permissions?.isStop && !!item.status && item.status !== 'STOPPING' && !this.canStartApp(item, permissions);
  };

  getCardOperations = (item) => {
    const permissions = this.getAppOperationPermissions(item.group_id);
    const operations = [];

    if (this.canStartApp(item, permissions)) {
      operations.push({
        key: 'start',
        label: formatMessage({ id: 'appOverview.btn.start' })
      });
    } else if (this.canStopApp(item, permissions)) {
      operations.push({
        key: 'stop',
        label: formatMessage({ id: 'appOverview.btn.stop' })
      });
    }

    if (permissions?.isDelete) {
      operations.push({
        key: 'delete',
        label: formatMessage({ id: 'appOverview.list.table.delete' }),
        danger: true
      });
    }

    return operations;
  };

  openActionModal = (code, item) => {
    this.setState({
      actionModalVisible: true,
      actionCode: code,
      actionTargetApp: item
    });
  };

  closeActionModal = () => {
    this.setState({
      actionModalVisible: false,
      actionCode: '',
      actionTargetApp: null
    });
  };

  submitActionModal = () => {
    const { dispatch } = this.props;
    const { actionCode, actionTargetApp } = this.state;

    if (!actionCode || !actionTargetApp) {
      return;
    }

    dispatch({
      type: 'global/buildShape',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: actionTargetApp.group_id,
        action: actionCode
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: res.msg_show || formatMessage({ id: 'notification.success.build_success' }),
            duration: 3
          });
          this.closeActionModal();
          this.refreshCurrentAppList();
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  openDeleteModal = (item) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchGroupAllResource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: item.group_id
      },
      callback: res => {
        this.setState({
          deleteVisible: true,
          deleteConfirmVisible: false,
          deleteTargetApp: item,
          deleteResourceList: res?.bean || null
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleDeleteStep = () => {
    this.setState({ deleteConfirmVisible: true });
  };

  closeDeleteModal = () => {
    this.setState({
      deleteVisible: false,
      deleteConfirmVisible: false,
      deleteTargetApp: null,
      deleteResourceList: null
    });
  };

  goBackDeleteModal = () => {
    this.setState({ deleteConfirmVisible: false });
  };

  handleDeleteSuccess = () => {
    this.closeDeleteModal();
    this.refreshCurrentAppList();
  };

  handleCardOperation = (item, key) => {
    if (key === 'delete') {
      this.openDeleteModal(item);
      return;
    }
    this.openActionModal(key, item);
  };

  renderMoreAction = (item) => {
    const operations = this.getCardOperations(item);

    if (!operations.length) {
      return (
        <Tooltip title={formatMessage({ id: 'button.more' })}>
          <div
            className={styles.moreActionButton}
            onClick={(e) => {
              e.stopPropagation();
              this.navigateToAppOverview(item.group_id);
            }}
          >
            <Icon type="ellipsis" />
          </div>
        </Tooltip>
      );
    }

    const menu = (
      <Menu
        onClick={({ key, domEvent }) => {
          domEvent.stopPropagation();
          this.handleCardOperation(item, key);
        }}
      >
        {operations.map(operation => (
          <Menu.Item key={operation.key}>
            <span className={operation.danger ? styles.operationDangerText : ''}>
              {operation.label}
            </span>
          </Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
        <div
          className={styles.moreActionButton}
          onClick={e => e.stopPropagation()}
        >
          <Icon type="ellipsis" />
        </div>
      </Dropdown>
    );
  };

  // 添加卡片视图渲染函数
  renderCardView = () => {
    const { teamHotAppList, teamAppCreatePermission } = this.state;
    const isAppCreate = teamAppCreatePermission?.isAccess;

    if (teamHotAppList.length > 0) {
      return (
          <div className={styles.teamHotAppList} >
            {/* 新增应用卡片 */}
            {isAppCreate && (
              <div style={{ marginLeft: '0px' }}>
                <div
                  className={`${styles.teamHotAppItem} ${styles.addNewAppCard}`}
                  onClick={() => {
                    this.onJumpToWizard();
                  }}
                >
                  <div className={styles.addNewAppContent}>
                    {/* 头部：+ 图标 + 标题 */}
                    <div className={styles.addNewAppHeader}>
                      <div className={styles.addNewAppIcon}>
                        <Icon type="plus" />
                      </div>
                      <div className={styles.addNewAppTitleWrapper}>
                        <div className={styles.addNewAppTitle}>
                          {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                        </div>
                        <div className={styles.addNewAppSubtitle}>
                          {formatMessage({ id: 'teamOverview.selectMethodTip' })}
                        </div>
                      </div>
                    </div>
                    {/* 图标列表 */}
                    <div className={styles.addNewAppIcons}>
                      {this.renderCreateMethodIcons()}
                    </div>
                    {/* 底部区域 */}
                    <div className={styles.addNewAppFooterWrapper}>
                      <div className={styles.addNewAppFooter}>
                        {formatMessage({ id: 'teamOverview.supportMethods' })}
                      </div>
                      <div className={styles.startCreateText}>
                        {formatMessage({ id: 'teamOverview.startCreate' })}
                        <Icon type="right" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {teamHotAppList.map((item) => {
              const statusColor = globalUtil.appStatusColor(item.status);
              return (
                <div key={item.group_id}>
                  <div
                    className={styles.teamHotAppItem}
                    onClick={() => {
                      this.navigateToAppOverview(item.group_id);
                    }}
                  >
                    <div className={styles.appCardContent}>
                      <div className={styles.appCardTop}>
                        <div className={styles.appCardIdentity}>
                          <span
                            className={styles.appIcon}
                          >
                            <span className={styles.appIconInitial}>{this.getAppInitial(item.group_name)}</span>
                          </span>
                          <div className={styles.appNameWrapper}>
                            <div className={styles.appTitleRow}>
                              <Tooltip placement="topLeft" title={item.group_name}>
                                <span className={styles.appName}>{item.group_name}</span>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        <div
                          className={styles.appStatusPill}
                          style={{
                            color: statusColor,
                            background: globalUtil.appStatusColor(item.status, 0.14)
                          }}
                        >
                          <span className={styles.statusDot} style={{ background: statusColor }}></span>
                          <span className={styles.statusText}>
                            {globalUtil.appStatusText(item.status)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.appMetricGrid}>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>
                            <FormattedMessage id="teamOverview.component.name" />
                          </span>
                          <span className={styles.metricValue}>{item.services_num || 0}</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>CPU</span>
                          <span className={styles.metricValue}>{this.formatCpuValue(item.used_cpu)}</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>
                            <FormattedMessage id="teamOverview.memory" />
                          </span>
                          <span className={styles.metricValue}>{this.formatMemoryValue(item.used_mem)}</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>
                            <FormattedMessage id="teamOverview.update" />
                          </span>
                          <span className={styles.metricValue}>
                            {item.update_time ? moment(item.update_time).fromNow() : '-'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.appCardFooter}>
                        <div className={styles.appCardActions}>
                          {this.renderVisitAction(item)}
                        </div>
                        {this.renderMoreAction(item)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 补全占位div - 当应用数量不足11个时 */}
            {teamHotAppList.length < 11 && Array.from({ length: 11 - teamHotAppList.length }).map((_, index) => {
              // 计算这个占位div的实际位置（新建卡片占位置0，应用列表占后续位置）
              const actualPosition = (isAppCreate ? 1 : 0) + teamHotAppList.length + index;
              // 根据位置计算所在行（每行4个）
              const row = Math.floor(actualPosition / 4);
              // 根据行数添加渐变类
              let fadeClass = '';
              if (row === 1) {
                fadeClass = styles.fadeRow2;
              } else if (row >= 2) {
                fadeClass = styles.fadeRow3;
              }
              return (
                <div key={`placeholder-${index}`}>
                  <div className={`${styles.teamHotAppItemEmpty} ${fadeClass}`}></div>
                </div>
              );
            })}
          </div>
      );
    } else {
      return (
        <div className={styles.teamHotAppList} >
          {/* 居中提示文字 */}
          <div className={styles.emptyTip}>
            {formatMessage({ id: 'teamOverview.noAppTip' })}
          </div>
          {/* 新增应用卡片 */}
          {isAppCreate && (
            <div style={{ marginLeft: '0px' }}>
              <div
                className={`${styles.teamHotAppItem} ${styles.addNewAppCard}`}
                onClick={() => {
                  this.onJumpToWizard();
                }}
              >
                <div className={styles.addNewAppContent}>
                  {/* 头部：+ 图标 + 标题 */}
                  <div className={styles.addNewAppHeader}>
                    <div className={styles.addNewAppIcon}>
                      <Icon type="plus" />
                    </div>
                    <div className={styles.addNewAppTitleWrapper}>
                      <div className={styles.addNewAppTitle}>
                        {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                      </div>
                      <div className={styles.addNewAppSubtitle}>
                        {formatMessage({ id: 'teamOverview.selectMethodTip' })}
                      </div>
                    </div>
                  </div>
                  {/* 图标列表 */}
                  <div className={styles.addNewAppIcons}>
                    {this.renderCreateMethodIcons()}
                  </div>
                  {/* 底部区域 */}
                  <div className={styles.addNewAppFooterWrapper}>
                    <div className={styles.addNewAppFooter}>
                      {formatMessage({ id: 'teamOverview.supportMethods' })}
                    </div>
                    <div className={styles.startCreateText}>
                      {formatMessage({ id: 'teamOverview.startCreate' })}
                      <Icon type="right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 11个白色占位方块 */}
          {Array.from({ length: 11 }).map((_, index) => {
            // 根据位置添加渐变蒙版类
            // 0-2：原色，3-6：变浅，7-10：融入背景
            let fadeClass = '';
            if (index >= 3 && index <= 6) {
              fadeClass = styles.fadeRow2;
            } else if (index >= 7) {
              fadeClass = styles.fadeRow3;
            }
            return (
              <div key={`placeholder-${index}`}>
                <div className={`${styles.teamHotAppItemEmpty} ${fadeClass}`}></div>
              </div>
            );
          })}
        </div>
      )
    }

  };
  render() {
    const {
      loadingOverview,
      loadedOverview,
      teamHotAppList,
      page,
      page_size,
      query,
      appListLoading,
      appListTotal,
      teamAppCreatePermission: {
        isAccess: isAppCreate
      },
      sortValue
    } = this.state;
    const { index, loading } = this.props;
    const {
      actionModalVisible,
      actionCode,
      deleteVisible,
      deleteConfirmVisible,
      deleteTargetApp,
      deleteResourceList
    } = this.state;
    // 应用列表权限
    const isAppList = newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview')?.isAppList;
    const buildShapeLoading = loading.effects['global/buildShape'];
    const deleteLoading = loading.effects['application/deleteGroupAllResource'];
    const codeObj = {
      start: formatMessage({ id: 'appOverview.btn.start' }),
      stop: formatMessage({ id: 'appOverview.btn.stop' })
    };

    return (
      <>
        {(index?.overviewInfo?.region_health || loadingOverview) && (
          <>
            <div>
              <div className={styles.appListHeaderTop}>
                <div className={styles.appListToolbar}>
                  <Search
                    placeholder={formatMessage({ id: 'teamOverview.searchTips' })}
                    onSearch={this.onSearch}
                    value={query}
                    allowClear
                    onChange={(e) => {
                      this.setState({ query: e.target.value });
                    }}
                    style={{ width: 180, marginRight: 10 }}
                  />
                  <Select
                    style={{ width: this.state.language ? '140px' : '170px' }}
                    placeholder={formatMessage({ id: 'teamOverview.sortTips' })}
                    value={sortValue}
                    onChange={this.handleSortChange}
                  >
                    <Option title={formatMessage({ id: 'teamOverview.runStatusSort' })} value={1}>
                      <FormattedMessage id="teamOverview.runStatusSort" />
                    </Option>
                    <Option title={formatMessage({ id: 'teamOverview.updateTimeSort' })} value={2}>
                      <FormattedMessage id="teamOverview.updateTimeSort" />
                    </Option>
                  </Select>
                </div>
              </div>
              {/* 加载状态 */}

              {!appListLoading && isAppList && (
                <div>
                  {this.renderCardView()}
                  {appListTotal > page_size && (
                    <div className={styles.paginationContainer}>
                      <Pagination
                        current={page}
                        pageSize={page_size}
                        total={appListTotal}
                        onChange={this.handleChangePage}
                        showQuickJumper
                        showTotal={(total) => `共 ${total} 条`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {loadedOverview && index?.overviewInfo && !index?.overviewInfo?.region_health && (
          <div>
            <Result
              type="warning"
              title={formatMessage({ id: 'teamOverview.result.title' })}
              description={formatMessage({ id: 'teamOverview.result.description' })}
              actions={[
                <Button loading={loadingOverview} onClick={this.loadOverview} type="primary" key="console">
                  <FormattedMessage id="teamOverview.loadOverview" />
                </Button>,
              ]}
            />
          </div>
        )}
        <CreateComponentModal
          visible={this.state.createComponentVisible}
          onCancel={this.handleCloseCreateComponent}
          dispatch={this.props.dispatch}
          currentEnterprise={this.props.currentEnterprise}
          rainbondInfo={this.props.rainbondInfo}
          currentUser={this.props.currentUser}
          currentView={this.state.currentView}
        />
        {actionModalVisible && (
          <Modal
            title={formatMessage({ id: 'confirmModal.friendly_reminder.title' })}
            confirmLoading={buildShapeLoading}
            visible={actionModalVisible}
            onOk={this.submitActionModal}
            onCancel={this.closeActionModal}
          >
            <p>{formatMessage({ id: 'confirmModal.friendly_reminder.pages.desc' }, { codeObj: codeObj[actionCode] })}</p>
          </Modal>
        )}
        {deleteVisible && deleteTargetApp && (
          <AppDeteleResource
            onDelete={this.handleDeleteStep}
            onCancel={this.closeDeleteModal}
            goBack={this.goBackDeleteModal}
            onSuccess={this.handleDeleteSuccess}
            skipRedirect
            infoList={deleteResourceList}
            team_name={globalUtil.getCurrTeamName()}
            group_id={deleteTargetApp.group_id}
            regionName={globalUtil.getCurrRegionName()}
            loading={deleteLoading}
            isflag={deleteConfirmVisible}
            desc={formatMessage({ id: 'confirmModal.app.delete.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}
      </>
    );
  }
}
