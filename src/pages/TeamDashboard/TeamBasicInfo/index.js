import React, { Component } from 'react'
import { Row, Col, Card, Table, Button, Input, Spin, Pagination, Tag, notification, Empty, Tooltip, Icon, Select } from 'antd';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import Result from '../../../components/Result';
import AddGroup from '../../../components/AddOrEditGroup';
import NewbieGuiding from '../../../components/NewbieGuiding';
import VisterBtn from '../../../components/visitBtnForAlllink';
import CreateComponentModal from '../../../components/CreateComponentModal';
import newRole from '@/utils/newRole';
import globalUtil from '../../../utils/global';
import PluginUtil from '../../../utils/pulginUtils'
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
    const savedViewState = window.localStorage.getItem('isTableView');
    const { noviceGuide, rainbondInfo } = props;
    // 检查是否已完成新手引导
    const hasCompletedGuide = noviceGuide && noviceGuide.some(item => item.key === 'teamOverview' && item.value == 'True');
    // 检查是否显示新手引导
    const shouldShowGuide = rainbondInfo?.is_saas === true && !hasCompletedGuide;

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
      addGroup: false,
      teamOverviewPermission: newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_overview'),
      teamAppCreatePermission: newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_app_create'),
      isTableView: savedViewState === 'true',
      isTransitioning: false,
      language: cookie.get('language') === 'zh-CN',
      storageUsed: 0,
      guideStep: shouldShowGuide ? 'team-overview' : '',
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

    // 初始化第一个高亮
    this.guideTimer = setTimeout(() => {
      if (this._isMounted) {
        const currentTarget = document.querySelector(`[data-guide="${this.state.guideStep}"]`);
        if (currentTarget) {
          currentTarget.style.position = 'relative';
          currentTarget.style.zIndex = '1000';
          currentTarget.style.backgroundColor = '#fff';
        }
      }
    }, 1000);
  }

  componentWillUnmount() {
    this._isMounted = false;
    // 清理定时器
    if (this.guideTimer) {
      clearTimeout(this.guideTimer);
    }
  }

  handleGuideStep = (step) => {
    this.setState({ guideStep: step });
    if (step === 'close' || (!step && this.state.guideStep === 'create-app')) {
      const { dispatch } = this.props;
      dispatch({
        type: 'global/putUserNewbieGuideConfig',
        payload: {
          arr: [{ key: 'teamOverview', value: true }]
        },
        callback: () => {
          this.getUserNewbieGuideConfig();
        }
      });
    }
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('guideStepChange', { detail: step }));
  }
  getUserNewbieGuideConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchUserNewbieGuideConfig'
    });
  };
  componentDidUpdate(prevProps, prevState) {
    const { guideStep } = this.state;
    const { noviceGuide } = this.props;

    // 检查 noviceGuide 是否变化
    if (prevProps.noviceGuide !== noviceGuide) {
      const hasCompletedGuide = noviceGuide && noviceGuide.some(item => item.key === 'teamOverview' && item.value === true);
      if (hasCompletedGuide && guideStep) {
        this.setState({ guideStep: '' });
      }
    }

    if (prevState.guideStep !== guideStep) {
      // 移除之前的遮罩和高亮
      const prevOverlay = document.getElementById('guide-overlay');
      if (prevOverlay) {
        prevOverlay.remove();
      }
      const prevTarget = document.querySelector(`[data-guide="${prevState.guideStep}"]`);
      if (prevTarget) {
        prevTarget.style.position = '';
        prevTarget.style.zIndex = '';
      }

      // 添加新的遮罩和高亮
      setTimeout(() => {
        const currentTarget = document.querySelector(`[data-guide="${guideStep}"]`);
        if (currentTarget) {
          // 高亮目标元素
          currentTarget.style.position = 'relative';
          currentTarget.style.zIndex = '1000';
        }
      }, 100);
    }
  }

  renderGuide = () => {
    const { guideStep } = this.state;
    const guideInfo = {
      'team-overview': {
        tit: '团队基本信息',
        desc: '这里展示了团队的基本信息和资源使用情况，包括应用数量、组件数量、CPU使用量、内存使用量和存储使用量等重要指标。',
        nextStep: 'team-setting',
        svgPosition: { top: '250px', left: '300px' },
        conPosition: { top: '260px', left: '320px' }
      },
      'team-setting': {
        tit: '团队设置',
        desc: '团队名称是系统根据用户名自动生成的，您可以在团队设置中修改团队名称、邀请新成员加入团队、设置角色权限等。',
        prevStep: 'team-overview',
        nextStep: 'create-app',
        svgPosition: { top: '80px', right: '30px' },
        conPosition: { top: '60px', right: '80px' }
      },
      'create-app': {
        tit: '创建新应用',
        desc: '点击此处开启部署向导，您可一键安装应用市场精选应用，快速体验开箱即用的便捷；也可灵活选择源码构建（支持绑定私有Git仓库）、镜像部署（对接自有镜像库）或YAML编排。',
        prevStep: 'team-setting',
        isSuccess: true,
        svgPosition: { top: '330px', right: '30px' },
        conPosition: { top: '340px', right: '40px' }
      }
    };
    return guideStep && guideInfo[guideStep] ? (
      <NewbieGuiding
        {...guideInfo[guideStep]}
        totals={5}
        handleClose={() => this.handleGuideStep('close')}
        handlePrev={() => this.handleGuideStep(guideInfo[guideStep].prevStep)}
        handleNext={() => this.handleGuideStep(guideInfo[guideStep].nextStep)}
      />
    ) : null;
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
              this.getStorageUsed(res.bean.team_id)
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
          })
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  }

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
        page_size: 10,
      },
      () => {
        this.loadHotApp(true);
      }
    );
  };
  //下拉框选择排序方式
  handleSortChange = (value) => {
    this.setState({
      appListLoading: true,
      sortValue: value,
      page: 1,
      page_size: 10,
    }, () => {
      this.loadHotApp();
    })
  }
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
  }
  // 新建应用
  handleAddGroup = (groupId, groups) => {
    const { dispatch } = this.props;
    this.setState({
      addGroup: false
    }, () => {
      newRole.refreshPermissionsInfo()
      notification.success({
        message: formatMessage({ id: 'versionUpdata_6_1.createSuccess' })
      })
      dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${groupId}`))
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

  // 取消新建应用
  cancelAddApp = () => {
    this.setState({
      addGroup: false
    })
  }
  // 获取行样式
  getRowClassName = (record) => {
    switch (record.status) {
      case 'RUNNING':
        return styles.runningRow;
      case 'STARTING':
        return styles.runningRow;
      case 'CLOSED':
        return styles.stoppedRow;
      case 'STOPPING':
        return styles.stoppedRow;
      case 'ABNORMAL':
        return styles.errorRow;
      case 'PARTIAL_ABNORMAL':
        return styles.errorRow;
      case 'unknown':
        return styles.errorRow;
      case 'deployed':
        return styles.runningRow;
      case 'superseded':
        return styles.runningRow;
      case 'failed':
        return styles.errorRow;
      case 'pending-install':
        return styles.runningRow;
      case 'pending-upgrade':
        return styles.runningRow;
      case 'pending-rollback':
        return styles.runningRow;
      default:
        return styles.defaultRow;
    }
  };
  // 添加视图切换处理函数
  handleViewChange = (checked) => {
    // 先触发退出动画
    this.setState({ isTransitioning: true }, () => {
      // 等待退出动画完成后切换视图
      setTimeout(() => {
        window.localStorage.setItem('isTableView', checked);
        this.setState({
          isTableView: checked
        }, () => {
          // 切换完成后触发进入动画
          setTimeout(() => {
            this.setState({ isTransitioning: false });
          }, 50);
        });
      }, 200);
    });
  };
  // 添加卡片视图渲染函数
  renderCardView = () => {
    const { teamHotAppList, appListLoading, language, teamAppCreatePermission } = this.state;
    const { dispatch } = this.props;
    const isAppCreate = teamAppCreatePermission?.isAccess;
    const addComponentSvg = (
      <svg t="1735296415486" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4279" width="16" height="16"><path d="M801.171 483.589H544V226.418c0-17.673-14.327-32-32-32s-32 14.327-32 32v257.171H222.83c-17.673 0-32 14.327-32 32s14.327 32 32 32H480v257.17c0 17.673 14.327 32 32 32s32-14.327 32-32v-257.17h257.171c17.673 0 32-14.327 32-32s-14.327-32-32-32z" p-id="4280" fill='#195AC3'></path></svg>
    )
    const visterSvg = (
      <svg t="1735296596548" style={{ marginRight: '2px' }} className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10566" width="12" height="12"><path d="M864.107583 960.119537H63.880463V159.892417h447.928278V96.011954H0v927.988046h927.988046V527.874486h-63.880463v432.245051z" p-id="10567" fill='currentColor'></path><path d="M592.137467 0v63.880463h322.462458L457.491222 521.371685l45.137093 45.137093L960.119537 109.400075v322.462458h63.880463V0H592.137467z" p-id="10568" fill='currentColor'></path></svg>
    )
    const addNewAppSvg = (
      <svg t="1735296415486" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4279" width="48" height="48"><path d="M801.171 483.589H544V226.418c0-17.673-14.327-32-32-32s-32 14.327-32 32v257.171H222.83c-17.673 0-32 14.327-32 32s14.327 32 32 32H480v257.17c0 17.673 14.327 32 32 32s32-14.327 32-32v-257.17h257.171c17.673 0 32-14.327 32-32s-14.327-32-32-32z" p-id="4280" fill='#195AC3'></path></svg>
    )
    return (
      <Spin spinning={appListLoading}>
        <div className={styles.teamHotAppList} style={{ height: teamHotAppList.length < 8 ? '300px' : '' }}>
          {/* 新增应用卡片 */}
          {isAppCreate && (
            <div style={{ marginLeft: '0px' }}>
              <div
                className={`${styles.teamHotAppItem} ${styles.hoverPointer} ${styles.addNewAppCard}`}
                onClick={() => {
                  this.onJumpToWizard();
                }}
              >
                <div className={styles.addNewAppContent}>
                  {addNewAppSvg}
                  <div className={styles.addNewAppText}>
                    {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {teamHotAppList.map((item, index) => {
            // 添加操作菜单
            const appOverviewPermission = newRole.queryPermissionsInfo(
              this.props.currentTeamPermissionsInfo?.team,
              'app_overview',
              `app_${item.group_id}`
            );
            const isAppCreate = appOverviewPermission?.isCreate;
            // 如果有新增卡片，需要调整 margin
            const actualIndex = this.state.teamAppCreatePermission?.isAccess ? index + 1 : index;
            return (
              <div key={item.group_id} style={{ marginLeft: (actualIndex % 4) ? '1.2%' : '0px' }}>
                <div
                  className={`${styles.teamHotAppItem} ${styles.hoverPointer}`}
                  onClick={() => {
                    dispatch(routerRedux.push(
                      `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${item.group_id}/overview`
                    ));
                  }}
                >
                  <div className={styles.appStatusBar} style={{ background: globalUtil.appStatusColor(item.status) }}></div>
                  <div className={styles.appCardContent}>
                    {/* 第一行：图标 + 应用名 + 访问按钮 */}
                    <div className={styles.appCardHeader}>
                      <div className={styles.appCardHeaderLeft}>
                        <span
                          className={styles.appIcon}
                          style={{ background: globalUtil.appStatusColor(item.status, 0.1) }}
                        >
                          {globalUtil.fetchSvg('appIconSvg', globalUtil.appStatusColor(item.status), 28)}
                        </span>
                        <Tooltip placement="topLeft" title={item.group_name}>
                          <span className={styles.appName}>{item.group_name}</span>
                        </Tooltip>
                      </div>
                      <div className={styles.appCardHeaderRight} onClick={(e) => e.stopPropagation()}>
                        {item.status === 'RUNNING' && item.accesses.length > 0 && item.accesses.some(a => a.access_info && a.access_info.length > 0 && a.access_info[0].access_urls && a.access_info[0].access_urls.length > 0) && (
                          <>
                            {visterSvg}
                            <VisterBtn
                              linkList={item.accesses}
                              type="link"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    {/* 第二行：运行状态 */}
                    <div className={styles.appCardStatus}>
                      <span className={styles.statusDot} style={{ background: globalUtil.appStatusColor(item.status) }}></span>
                      <span className={styles.statusText} style={{ color: globalUtil.appStatusColor(item.status) }}>
                        {globalUtil.appStatusText(item.status)}
                      </span>
                    </div>
                    {/* 分割线 */}
                    <div className={styles.appCardDivider}></div>
                    {/* 第三行：组件数 + 更新时间 */}
                    <div className={styles.appCardFooter}>
                      <span className={styles.componentCount}>
                        <Icon type="menu" style={{ marginRight: 4 }} />
                        {item.services_num} <FormattedMessage id="unit.component" />
                      </span>
                      <span className={styles.updateTime}>
                        <Icon type="clock-circle" style={{ marginRight: 4 }} />
                        {item.update_time && moment(item.update_time).fromNow()}
                        <FormattedMessage id="teamOverview.update" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Spin>
    );
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
      addGroup,
      teamOverviewPermission: {
        isAppList,
        isAccess: isTeamOverview
      },
      teamAppCreatePermission: {
        isAccess: isAppCreate
      },
      isTableView,
      isTransitioning,
      storageUsed,
      sortValue
    } = this.state;
    const { index, pluginsList } = this.props;
    const showStorageUsed = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');
    const visterSvg = (
      <svg t="1735296596548" style={{ marginRight: '2px' }} className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10566" width="12" height="12"><path d="M864.107583 960.119537H63.880463V159.892417h447.928278V96.011954H0v927.988046h927.988046V527.874486h-63.880463v432.245051z" p-id="10567" fill='currentColor'></path><path d="M592.137467 0v63.880463h322.462458L457.491222 521.371685l45.137093 45.137093L960.119537 109.400075v322.462458h63.880463V0H592.137467z" p-id="10568" fill='currentColor'></path></svg>
    );
    const columns = [
      {
        title: formatMessage({ id: 'versionUpdata_6_1.appName' }),
        dataIndex: 'group_name',
        key: 'group_name',
        render: (text, record) => {
          return <a
            className={styles.appName}
            onClick={() => {
              const { dispatch } = this.props;
              dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${record.group_id}/overview`))
            }}
          >
            {text}
          </a>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          return <Tag color={globalUtil.appStatusColor(text)}>{globalUtil.appStatusText(text)}</Tag>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.servicesNum' }),
        dataIndex: 'services_num',
        key: 'services_num',
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.memory' }),
        dataIndex: 'used_mem',
        key: 'used_mem',
        render: (text, record) => {
          return <span>
            {text || 0}
          </span>
        }
      },
      {
        title: 'CPU(m)',
        dataIndex: 'used_cpu',
        key: 'used_cpu',
        render: (text, record) => {
          return <span>
            {text || 0}
          </span>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.disk' }),
        dataIndex: 'used_disk',
        key: 'used_disk',
        render: (text, record) => {
          return <span>
            {text || 0}
          </span>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.updated.time' }),
        dataIndex: 'update_time',
        key: 'update_time',
        render: (text, record) => {
          return moment(record.update_time).fromNow();
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.action' }),
        key: 'action',
        render: (text, record) => {
          return (
            <a
              onClick={() => {
                const { dispatch } = this.props;
                dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${record.group_id}/overview`))
              }}>
              {formatMessage({ id: 'versionUpdata_6_1.manage' })}
            </a>
          )
        },
      },
    ];

    return (
      <>
        {this.renderGuide()}
        {(index?.overviewInfo?.region_health || loadingOverview) && (
          <>
            <div data-guide="team-overview" className={styles.teamOverview}>
              <div className={styles.sectionHeader}>
                <span>{globalUtil.fetchSvg('enterpriseDataSvg')}</span>
                <h2>{formatMessage({ id: 'teamOverview.overview.title' })}</h2>
              </div>
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
            <div className={styles.appListHeader}>
              <div className={styles.appListHeaderTop}>
                <div className={styles.sectionHeader}>
                  <span>{globalUtil.fetchSvg('clustersInfoSvg')}</span>
                  <h2>{formatMessage({ id: 'versionUpdata_6_1.appList' })}</h2>
                </div>
                <div className={styles.appListToolbar}>
                  <div className={styles.customToggle}>
                    <Tooltip title={formatMessage({ id: 'versionUpdata_6_1.appList.card' })}>
                      <div
                        className={`${styles.toggleItem} ${!isTableView ? styles.active : ''}`}
                        onClick={() => this.handleViewChange(false)}
                      >
                        <span className={styles.toggleIcon}>
                          {globalUtil.fetchSvg('cardViewSvg', 22)}
                        </span>
                      </div>
                    </Tooltip>
                    <Tooltip title={formatMessage({ id: 'versionUpdata_6_1.appList.table' })}>
                      <div
                        className={`${styles.toggleItem} ${isTableView ? styles.active : ''}`}
                        onClick={() => this.handleViewChange(true)}
                      >
                        <span className={styles.toggleIcon}>
                          {globalUtil.fetchSvg('tableViewSvg', 22)}
                        </span>
                      </div>
                    </Tooltip>
                  </div>
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
              {!appListLoading && isAppList && (
                <div className={`${styles.viewContainer} ${isTransitioning ? styles.viewExiting : styles.viewEntering}`}>
                  {isTableView ? (
                    <div className={styles.tableListView}>
                      {/* 新建应用行 */}
                      {isAppCreate && (
                        <div
                          className={styles.tableCreateRow}
                          onClick={() => this.onJumpToWizard()}
                          data-guide="create-app"
                        >
                          <span className={styles.tableCreateIcon}>
                            <Icon type="plus" />
                          </span>
                          <span className={styles.tableCreateText}>
                            {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                          </span>
                        </div>
                      )}
                      {/* 应用列表 */}
                      {teamHotAppList.length > 0 ? (
                        teamHotAppList.map((item) => (
                          <div
                            key={item.group_id}
                            className={styles.tableAppRow}
                          >
                            <div className={styles.tableAppStatusBar} style={{ background: globalUtil.appStatusColor(item.status) }}></div>
                            <div
                              className={styles.tableAppContent}
                              onClick={() => {
                                const { dispatch } = this.props;
                                dispatch(routerRedux.push(
                                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${item.group_id}/overview`
                                ));
                              }}
                            >
                              <span
                                className={styles.tableAppIcon}
                                style={{ background: globalUtil.appStatusColor(item.status, 0.1) }}
                              >
                                {globalUtil.fetchSvg('appIconSvg', globalUtil.appStatusColor(item.status), 24)}
                              </span>
                              <div className={styles.tableAppInfo}>
                                <Tooltip placement="topLeft" title={item.group_name}>
                                  <span className={styles.tableAppName}>{item.group_name}</span>
                                </Tooltip>
                                <div className={styles.tableAppMeta}>
                                  <span className={styles.tableAppStatus}>
                                    <span className={styles.statusDot} style={{ background: globalUtil.appStatusColor(item.status) }}></span>
                                    <span style={{ color: globalUtil.appStatusColor(item.status) }}>{globalUtil.appStatusText(item.status)}</span>
                                  </span>
                                  <span className={styles.tableDivider}>·</span>
                                  <span className={styles.tableMetaItem}>
                                    <Icon type="menu" style={{ marginRight: 4 }} />
                                    {item.services_num} <FormattedMessage id="unit.component" />
                                  </span>
                                  <span className={styles.tableDivider}>·</span>
                                  <span className={styles.tableMetaItem}>
                                    <Icon type="clock-circle" style={{ marginRight: 4 }} />
                                    {item.update_time && moment(item.update_time).fromNow()} <FormattedMessage id="teamOverview.update" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={styles.tableAppActions} onClick={(e) => e.stopPropagation()}>
                              {item.status === 'RUNNING' && item.accesses.length > 0 && item.accesses.some(a => a.access_info && a.access_info.length > 0 && a.access_info[0].access_urls && a.access_info[0].access_urls.length > 0) && (
                                <span className={styles.tableActionBtn}>
                                  {visterSvg}
                                  <VisterBtn
                                    linkList={item.accesses}
                                    type="link"
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.appListEmpty}>
                          <Empty
                            description={formatMessage({ id: 'teamOverview.startDeploy' })}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {this.renderCardView()}
                      {teamHotAppList.length === 0 && !isAppCreate && (
                        <div className={styles.appListEmpty}>
                          <Empty
                            description={formatMessage({ id: 'teamOverview.startDeploy' })}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {teamHotAppList.length > 0 && (
                    <div className={styles.paginationContainer}>
                      <Pagination
                        showSizeChanger
                        onShowSizeChange={this.handleChangePage}
                        current={page}
                        pageSize={page_size}
                        total={appListTotal}
                        onChange={this.handleChangePage}
                        showQuickJumper
                        showTotal={(appListTotal) => `共 ${appListTotal} 条`}
                        hideOnSinglePage={appListTotal <= 11}
                        pageSizeOptions={['11', '23', '35', '47', '59']}
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
        {addGroup && <AddGroup onCancel={this.cancelAddApp} onOk={this.handleAddGroup} />}
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
