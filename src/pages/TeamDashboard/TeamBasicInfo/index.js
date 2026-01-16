import React, { Component } from 'react'
import { Button, Input, Spin, Pagination, Tooltip, Icon, Select } from 'antd';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import Result from '../../../components/Result';
import VisterBtn from '../../../components/visitBtnForAlllink';
import CreateComponentModal from '../../../components/CreateComponentModal';
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
  // 添加卡片视图渲染函数
  renderCardView = () => {
    const { teamHotAppList, teamAppCreatePermission } = this.state;
    const { dispatch } = this.props;
    const isAppCreate = teamAppCreatePermission?.isAccess;
    const visterSvg = (
      <svg t="1735296596548" style={{ marginRight: '2px' }} className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10566" width="12" height="12"><path d="M864.107583 960.119537H63.880463V159.892417h447.928278V96.011954H0v927.988046h927.988046V527.874486h-63.880463v432.245051z" p-id="10567" fill='currentColor'></path><path d="M592.137467 0v63.880463h322.462458L457.491222 521.371685l45.137093 45.137093L960.119537 109.400075v322.462458h63.880463V0H592.137467z" p-id="10568" fill='currentColor'></path></svg>
    )

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
                      <Tooltip title="应用商店">
                        <div className={styles.iconItem} style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>
                          <StoreIcon />
                        </div>
                      </Tooltip>
                      <Tooltip title="镜像构建">
                        <div className={styles.iconItem} style={{ background: 'rgba(250, 140, 22, 0.1)', color: '#fa8c16' }}>
                          <ContainerIcon />
                        </div>
                      </Tooltip>
                      <Tooltip title="源码构建">
                        <div className={styles.iconItem} style={{ background: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }}>
                          <CodeIcon />
                        </div>
                      </Tooltip>
                      <Tooltip title="软件包">
                        <div className={styles.iconItem} style={{ background: 'rgba(235, 47, 150, 0.1)', color: '#eb2f96' }}>
                          <PackageIcon />
                        </div>
                      </Tooltip>
                      <Tooltip title="Yaml/Helm">
                        <div className={styles.iconItem} style={{ background: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' }}>
                          <FileTextIcon />
                        </div>
                      </Tooltip>
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
              return (
                <div key={item.group_id}>
                  <div
                    className={styles.teamHotAppItem}
                    onClick={() => {
                      dispatch(routerRedux.push(
                        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${item.group_id}/overview`
                      ));
                    }}
                  >
                    <div className={styles.appStatusBar} style={{ background: globalUtil.appStatusColor(item.status) }}></div>
                    <div className={styles.appCardContent}>
                      {/* 第一行：图标 + 应用名/状态 + 访问按钮 */}
                      <div className={styles.appCardHeader}>
                        <div className={styles.appCardHeaderLeft}>
                          <span
                            className={styles.appIcon}
                            style={{ background: globalUtil.appStatusColor(item.status, 0.1) }}
                          >
                            {globalUtil.fetchSvg('appIconSvg', globalUtil.appStatusColor(item.status), 28)}
                          </span>
                          <div className={styles.appNameWrapper}>
                            <Tooltip placement="topLeft" title={item.group_name}>
                              <span className={styles.appName}>{item.group_name}</span>
                            </Tooltip>
                            <div className={styles.appCardStatus}>
                              <span className={styles.statusDot} style={{ background: globalUtil.appStatusColor(item.status) }}></span>
                              <span className={styles.statusText} style={{ color: globalUtil.appStatusColor(item.status) }}>
                                {globalUtil.appStatusText(item.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.appCardHeaderRight} style={{ color: '#1890ff' }} onClick={(e) => e.stopPropagation()}>
                          {item.status === 'RUNNING' && item.accesses.length > 0 && item.accesses.some(a => a.access_info && a.access_info.length > 0 && a.access_info[0].access_urls && a.access_info[0].access_urls.length > 0) && (
                            <>
                              {visterSvg}
                              <VisterBtn
                                linkList={item.accesses}
                                type="link"
                                color="#1890ff"
                              />
                            </>
                          )}
                        </div>
                      </div>
                      {/* 第二行：组件数 + 内存 + CPU */}
                      <div className={styles.appCardResources}>
                        <span className={styles.resourceItem}>
                          <Icon type="appstore" className={styles.resourceIcon} />
                          <span className={styles.resourceValue}>{item.services_num}</span>
                          <span className={styles.resourceLabel}><FormattedMessage id="unit.component" /></span>
                        </span>
                        <span className={styles.resourceItem}>
                          MEM:
                          <span className={styles.resourceValue} style={{marginLeft:4}}>
                            {(item.used_mem || 0) >= 1024
                              ? ((item.used_mem || 0) / 1024).toFixed(2)
                              : (item.used_mem || 0)}
                          </span>
                          <span className={styles.resourceLabel}>
                            {(item.used_mem || 0) >= 1024 ? 'GB' : 'MB'}
                          </span>
                        </span>
                        <span className={styles.resourceItem}>
                          CPU:
                          <span className={styles.resourceValue} style={{marginLeft:4}}>
                            {(item.used_cpu || 0) >= 1000
                              ? ((item.used_cpu || 0) / 1000).toFixed(2)
                              : (item.used_cpu || 0)}
                          </span>
                          <span className={styles.resourceLabel}>
                            {(item.used_cpu || 0) >= 1000 ? 'Core' : 'm'}
                          </span>
                        </span>
                      </div>
                      {/* 第三行：创建时间 + 更新时间 */}
                      <div className={styles.appCardTimeRow}>
                        <span className={styles.timeItem}>
                          <Icon type="calendar" className={styles.timeIcon} />
                          <span className={styles.timeLabel}>{formatMessage({ id: 'teamApply.createTime' })}</span>
                          <span className={styles.timeValue}>{item.create_time && moment(item.create_time).format('YYYY/MM/DD')}</span>
                        </span>
                        <span className={styles.timeItem}>
                          <Icon type="clock-circle" className={styles.timeIcon} />
                          <span className={styles.timeLabel}>{formatMessage({ id: 'versionUpdata_6_1.updateTime' })}</span>
                          <span className={styles.timeValue}>{item.update_time && moment(item.update_time).fromNow()}</span>
                        </span>
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
                    <Tooltip title="应用商店">
                      <div className={styles.iconItem} style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>
                        <StoreIcon />
                      </div>
                    </Tooltip>
                    <Tooltip title="镜像构建">
                      <div className={styles.iconItem} style={{ background: 'rgba(250, 140, 22, 0.1)', color: '#fa8c16' }}>
                        <ContainerIcon />
                      </div>
                    </Tooltip>
                    <Tooltip title="源码构建">
                      <div className={styles.iconItem} style={{ background: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }}>
                        <CodeIcon />
                      </div>
                    </Tooltip>
                    <Tooltip title="软件包">
                      <div className={styles.iconItem} style={{ background: 'rgba(235, 47, 150, 0.1)', color: '#eb2f96' }}>
                        <PackageIcon />
                      </div>
                    </Tooltip>
                    <Tooltip title="Yaml/Helm">
                      <div className={styles.iconItem} style={{ background: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' }}>
                        <FileTextIcon />
                      </div>
                    </Tooltip>
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
    const { index } = this.props;
    // 应用列表权限
    const isAppList = newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview')?.isAppList;

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
      </>
    );
  }
}
