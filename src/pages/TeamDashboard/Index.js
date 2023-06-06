/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import {
  Button,
  Empty,
  Form,
  Input,
  notification,
  Pagination,
  Spin,
  Select,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import EditGroupName from '../../components/AddOrEditGroup';
import AppState from '../../components/ApplicationState';
import Result from '../../components/Result';
import CustomFooter from "../../layouts/CustomFooter"
import VisterBtn from '../../components/visitBtnForAlllink';
import globalUtil from '../../utils/global';
import TeamWizard from '../TeamWizard'
import userUtil from '../../utils/user';
import cookie from '../../utils/cookie';
import styles from './Index.less';

const { Search } = Input;
const { Option, OptGroup } = Select;
const echarts = require('echarts');
const appLogo = require('@/assets/teamAppLogo.svg');
const defaultAppLogo = require('@/assets/application.png');
const componentLogo = require('@/assets/teamComponentLogo.svg');

@connect(({ user, index, loading, global, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  index,
  enterprise: global.enterprise,
  events: index.events,
  pagination: index.pagination,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  loading,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 团队应用的图表数据
      appColorData: {
        value: 70,
        company: '%',
        ringColor: [
          {
            offset: 0,
            color: '#4f75af' // 0% 处的颜色
          },
          {
            offset: 1,
            color: '#4f75af' // 100% 处的颜色
          }
        ]
      },
      // 分页的总数据
      total: null,
      // 页面加载的loading
      loadingOverview: true,
      loadedOverview: false,
      loadingOfApp: true,
      loadingNotData: true,
      // 热门应用查询参数
      page: 1,
      page_size: 12,
      query: '',
      // 热门应用列表
      teamHotAppList: [],
      sortValue: 1,
      pageSizeOptions: ['12', '16', '20', '24', '28'],
      // 新建应用显示与隐藏
      createAppVisible: false,
      emptyConfig: false,
      searchVisible: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      appListLoading: true,
    };
  }
  componentDidMount() {
    //  获取团队的权限
    const { currUser } = this.props;
    const teamPermissions = userUtil.getTeamByTeamPermissions(
      currUser.teams,
      globalUtil.getCurrTeamName()
    );
    if (teamPermissions && teamPermissions.length !== 0) {
      // 加载团队下的资源
      this.loadOverview();
      this.loadHotApp();
    }
  }
  // 组件销毁停止计时器
  componentWillUnmount() {
    // 组件销毁时,清除应用列表定时器
    this.handleClearTimeout(this.loadHotAppTimer);
    // 组件销毁  清除团队下资源的定时器
    this.handleClearTimeout(this.loadTeamTimer);
  }
  // 搜索应用
  onSearch = value => {
    this.setState(
      {
        query: value,
        loadingOfApp: true,
        page: 1,
      },
      () => {
        this.loadHotApp(true);
      }
    );
  };
  // pageSize变化的回调
  handleChangePageSize = (current, size) => {
    this.setState(
      {
        page_size: size,
        loadingOfApp: true
      },
      () => {
        this.loadHotApp();
      }
    );
  };
  // pageNum变化的回调
  handleChangePage = (page, pageSize) => {
    this.setState(
      {
        page,
        loadingOfApp: true,
        appListLoading: true,
      },
      () => {
        this.loadHotApp();
      }
    );
  };
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
        if (res && res.bean && res.bean.region_health) {
          this.setState(
            { loadingOverview: false, loadedOverview: true },
            () => {
              const { index } = this.props;
              // // 加载热门应用模块
              // if (!this.loadHotAppTimer) {
              this.loadHotApp();
              // }
            }
          );
        } else {
          this.handleCloseLoading();
        }
      },
      handleError: () => {
        this.handleCloseLoading();
      }
    });
  };
  // 加载热门应用数据源
  loadHotApp = (isSearch = false) => {
    const { page, page_size, query, emptyConfig, sortValue } = this.state;
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
        if (res && res.status_code === 200) {
          this.setState({
            teamHotAppList: res.list,
            total: res.bean && res.bean.total,
            loadingOfApp: false,
            searchVisible: isSearch ? true : false,
            emptyConfig: false,
            appListLoading: false,
            loadingNotData: false,
          });
        } else {
          this.setState({
            appListLoading: false,
          });
        }
        if (res && res.list && res.list.length === 0 && query) {
          this.setState({
            emptyConfig: true
          });
        } else {
          this.setState({
            appListLoading: false,
          });
        }
      },
      handleError: err => {
        if (err && err.data && err.data.code === 10401) {
          this.setState(
            {
              page: 1
            },
            () => {
              this.loadHotApp();
            }
          );
        }
      }
    });
  };
  // 计算资源大小和单位
  handlUnit = (num, unit) => {
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
  };
  // 关闭loading
  handleCloseLoading = () => {
    this.setState({ loadingOverview: false, loadedOverview: true });
  };
  // 加载当前团队的权限
  handleTeamPermissions = callback => {
    const { currUser } = this.props;
    const teamPermissions = userUtil.getTeamByTeamPermissions(
      currUser.teams,
      globalUtil.getCurrTeamName()
    );
    if (teamPermissions && teamPermissions.length !== 0) {
      callback();
    }
  };
  // 定时器获取最新的接口数据
  handleTimers = (timerName, callback, times) => {
    this.handleTeamPermissions(() => {
      this[timerName] = setTimeout(() => {
        callback();
      }, times);
    });
  };
  // 组件销毁 停止定时器
  handleClearTimeout = timer => {
    if (timer) {
      clearTimeout(timer);
    }
  };
  // OK
  handleOkApplication = () => {
    this.setState({
      appListLoading: true,
    })
    notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
    this.handleCancelApplication();
    // 重新加载页面数据
    this.loadOverview();
    this.loadHotApp();
  };
  // Cancel
  handleCancelApplication = () => {
    this.setState({
      createAppVisible: false
    });
  };
  // 新建应用时的loading优化
  handleAppLoading = () => {
    this.setState({
      loadingOfApp: true,
    });
  };
  //下拉框选择排序方式
  handleSortChange = (value) => {
    this.setState({
      loadingOfApp: true,
      sortValue: value
    }, () => {
      this.loadHotApp();
    })
  }
  teamOverviewRender = () => {
    const {
      loadingOverview,
      loadedOverview,
      teamHotAppList,
      total,
      pageSizeOptions,
      createAppVisible,
      loadingOfApp,
      page,
      page_size,
      query,
      emptyConfig,
      language,
      appListLoading,
    } = this.state;
    const {
      index,
      dispatch,
      location: {
        query: { team_alias }
      }
    } = this.props;
    // 当前团队名称
    const teamName = globalUtil.getCurrTeamName();
    // 当前集群名称
    const regionName = globalUtil.getCurrRegionName();
    return (
      <Fragment>
        {(index.overviewInfo.region_health || loadingOverview) &&
          <div className={styles.teamAppTitle}>
            <span>{globalUtil.fetchSvg('teamViewTitle')}</span>
            <h2 className={styles.topContainerTitle}>
              {loadingOverview ? (
                <Spin size="small"></Spin>
              ) : (
                index.overviewInfo.team_alias
              )}
            </h2>
          </div>
        }
        {loadingOverview && !index.overviewInfo.region_health && (
          <Spin size="large" tip="Loading..." style={{ textAlign: 'center', }}>
            {/* page top */}
            {!index.overviewInfo.region_health && (
              <div className={styles.topContainer} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
              </div>
            )}
          </Spin>
        )}
        {loadingOverview && index.overviewInfo.region_health && (
          <Spin size="large" tip="Loading..." style={{ textAlign: 'center', }}>
            <div className={styles.topContainer} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
            </div>
          </Spin>
        )}
        {index.overviewInfo.region_health && !loadingOverview && (
          <div className={styles.topContainer} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
            <div>
              <div className={styles.resourceTitle}>
                <FormattedMessage id="teamOverview.runAppNum" />
              </div>
              <div className={styles.resourceValue}>
                {index.overviewInfo && index.overviewInfo.running_app_num || 0}
              </div>
            </div>
            <div>
              <div className={styles.resourceTitle}>
                <FormattedMessage id="teamOverview.runComponentNum" />
              </div>
              <div className={styles.resourceValue}>
                {index.overviewInfo && index.overviewInfo.running_component_num || 0}
              </div>
            </div>
            <div>
              <div className={styles.resourceTitle}>
                <FormattedMessage id="teamOverview.memoryUsage" />
                ({this.handlUnit(
                  index.overviewInfo.team_service_memory_count || 0,
                  'MB'
                )})
              </div>
              <div className={styles.resourceValue}>
                {this.handlUnit(
                  index.overviewInfo.team_service_memory_count || 0
                )}
              </div>
            </div>
            <div>
              <div className={styles.resourceTitle}>
                <FormattedMessage id="teamOverview.diskUsage" />
                ({this.handlUnit(
                  index.overviewInfo.team_service_total_disk || 0,
                  'MB'
                )})
              </div>
              <div className={styles.resourceValue}>
                {this.handlUnit(
                  index.overviewInfo.team_service_total_disk || 0
                )}
              </div>
            </div>
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                dispatch(
                  routerRedux.push({
                    pathname: `/team/${teamName}/region/${regionName}/team`,
                    state: { config: 'member' }
                  })
                );
              }}
            >
              <div className={styles.resourceTitle}>
                <FormattedMessage id="teamOverview.UserNum" />
              </div>
              <div className={styles.resourceValue}>
                {(index.overviewInfo && index.overviewInfo.user_nums) || 0}
              </div>
            </div>
          </div>
        )}

        {(index.overviewInfo.region_health || loadingOverview) &&
          <>
            {/* 热门应用标题 */}
            <div className={styles.teamHotAppTitle}>
              <div className={styles.teamHotAppTitleLeft}>
                <span>{globalUtil.fetchSvg('teamViewHotsvg')}</span>
                <h2><FormattedMessage id="teamOverview.appList" /></h2>
              </div>
            </div>
            {/* app list Loading */}
            {/* appList */}
            {<div className={styles.appListBox} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
              <div className={styles.teamHotAppTitleSearch}>
              <Button
                  style={{float:'left'}}
                  type="primary"
                  onClick={() => {
                    // this.setState({ createAppVisible: true });
                    this.props.dispatch(routerRedux.push({ pathname: `/team/${teamName}/region/${regionName}/wizard` }))
                  }}
                >
                  {formatMessage({ id: 'teamOverview.createApp' })}
                </Button>
                <Search
                  placeholder={formatMessage({ id: 'teamOverview.searchTips' })}
                  onSearch={this.onSearch}
                  defaultValue={query}
                  allowClear
                  style={{ width: 400, margin: '0 0 0 10px' , float:'right'}}
                />
                <Select
                  style={language ? { width: '140px',float:'right' } : { width: '200px',float:'right' }}
                  placeholder={formatMessage({ id: 'teamOverview.sortTips' })}
                  defaultValue={1}
                  onChange={this.handleSortChange}
                >
                  <Option title={formatMessage({ id: 'teamOverview.runStatusSort' })} value={1}><FormattedMessage id="teamOverview.runStatusSort" /></Option>
                  <Option title={formatMessage({ id: 'teamOverview.updateTimeSort' })} value={2}><FormattedMessage id="teamOverview.updateTimeSort" /></Option>
                </Select>
              </div>
              {appListLoading && (
                <div className={styles.no_teamHotAppList}>
                  <Spin tip="Loading..." size="large" />
                </div>
              )}
              {!loadingOfApp && !emptyConfig && teamHotAppList.length > 0 && (
                <div className={styles.teamHotAppList} style={{ height: teamHotAppList.length < 8 ? '300px' : '' }}>
                  {/* 1 */}
                  {teamHotAppList.map((item, index) => {
                    return (
                      <div key={item.group_id} style={{ marginLeft: (index % 4) ? '4%' : '0px' }}>
                        <div
                          className={`${styles.teamHotAppItem} ${styles.hoverPointer}`}
                          style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}
                          onClick={() => {
                            dispatch(
                              routerRedux.push(
                                `/team/${teamName}/region/${regionName}/apps/${item.group_id}`
                              )
                            );
                          }}
                        >
                          {language ? (
                            <div className={styles.appStatus} style={{ background: globalUtil.appStatusColor(item.status) }}>
                              <div>
                                {globalUtil.appStatusText(item.status)}
                              </div>
                            </div>
                          ) : (
                            <Tooltip placement="left" title={globalUtil.appStatusText(item.status)}>
                              <div className={styles.appStatus} style={{ background: globalUtil.appStatusColor(item.status) }}>
                              </div>
                            </Tooltip>
                          )}

                          <div className={styles.appItemDetail}>
                            <Tooltip placement="topLeft" title={item.group_name}>
                              <div className={styles.appTitle}>{item.group_name}</div>
                            </Tooltip>
                            <div className={styles.value}>
                              <div className={styles.memory}><FormattedMessage id="teamOverview.memory" />: {this.handlUnit(item.used_mem || 0)} {this.handlUnit(item.used_mem || 0, 'MB')}</div>
                              <div className={styles.component}><FormattedMessage id="teamOverview.component.name" />: {item.services_num}<FormattedMessage id="unit.entries" /></div>
                            </div>
                            <div className={styles.updateTime}>
                              <div>
                                {item.update_time &&
                                  moment(item.update_time).fromNow()}
                                <FormattedMessage id="teamOverview.update" />
                              </div>
                              {item.status === 'RUNNING' && (
                                <div>
                                  {item.accesses.length > 0 && (
                                    <VisterBtn
                                      linkList={item.accesses}
                                      type="link"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>)}
              {/* 空状态 */}
              {((!appListLoading && teamHotAppList.length == 0) || (emptyConfig && !loadingOfApp)) && (
                <div className={styles.no_teamHotAppList}>
                  <Empty />
                </div>
              )}
              {/* 分页 */}
              {(teamHotAppList.length > 0 && (teamHotAppList.length >= page_size || page > 1)) &&
                <div className={styles.pagination}>
                  <Pagination
                    showSizeChanger
                    onShowSizeChange={this.handleChangePageSize}
                    current={page}
                    pageSize={page_size}
                    total={total}
                    pageSizeOptions={pageSizeOptions}
                    onChange={this.handleChangePage}
                  />
                </div>}
            </div>
            }

            {/* 搜索为空时的状态 */}
            {/* {emptyConfig && !loadingOfApp && <Empty />} */}
            {/* 新建应用 */}
            {createAppVisible && (
              <EditGroupName
                title={formatMessage({ id: 'teamOverview.createApp' })}
                onCancel={this.handleCancelApplication}
                onOk={this.handleOkApplication}
                handleAppLoading={this.handleAppLoading}
              />
            )}
          </>
        }
        {/* 集群不健康的情况 */}
        {loadedOverview &&
          index.overviewInfo &&
          !index.overviewInfo.region_health && (
            <div>
              <Result
                type="warning"
                title={formatMessage({ id: 'teamOverview.result.title' })}
                description={formatMessage({ id: 'teamOverview.result.description' })}
                actions={[
                  <Button
                    loading={loadingOverview}
                    onClick={this.loadOverview}
                    type="primary"
                    key="console"
                  >
                    <FormattedMessage id="teamOverview.loadOverview" />
                  </Button>
                ]}
              />
            </div>
          )}
        <CustomFooter />
      </Fragment>
    )
  }
  render() {
    const {
      loadingOverview,
      loadedOverview,
      teamHotAppList,
      total,
      pageSizeOptions,
      createAppVisible,
      loadingOfApp,
      page,
      page_size,
      query,
      emptyConfig,
      searchVisible,
      language,
      appListLoading,
      loadingNotData,
    } = this.state;
    const {
      index,
      dispatch,
      location: {
        query: { team_alias }
      }
    } = this.props;
    // 当前团队名称
    const teamName = globalUtil.getCurrTeamName();
    // 当前集群名称
    const regionName = globalUtil.getCurrRegionName();

    return (
      <Fragment>
        {loadingNotData ?
          (
            <div style={{width:'100%', height: '600px', display:'flex',justifyContent:'center',alignItems:'center'}}>
              <Spin size="large" tip="Loading..." />
            </div>
          ) : (
            <div>
              {((!emptyConfig && teamHotAppList.length > 0) || (emptyConfig && searchVisible && teamHotAppList.length == 0)) ? this.teamOverviewRender() : <TeamWizard />}
            </div>
          )
        }
      </Fragment>
    );
  }
}
