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
      language: cookie.get('language') === 'zh-CN' ? true : false
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
  // 加载团队应用和组件的图表
  loadTeamAppEcharts = () => {
    const { appColorData } = this.state;
    const { index } = this.props;
    // 1.创建实例对象
    const myEcharts1 = echarts.init(document.querySelector('#appEcharts'));
    const myEcharts2 = echarts.init(
      document.querySelector('#componmentEcharts')
    );
    // 2. options配置项
    const option1 = {
      // 鼠标悬停
      tooltip: {
        show: true,
        position: [50, 0],
        fontSize: 10,
        formatter(params) {
          if (params.data.name === '已用') {
            return `
           <div>${formatMessage({id:'teamOverview.runAppNums'},{number:params.data.value})}</div>
          `;
          }
          return `
           <div>${formatMessage({id:'teamOverview.notRunAppNums'},{number:params.data.value})}</div>
          `;
        }
      },
      // 标题
      title: {
        text: '',
        x: 'center',
        y: 'center',
        textStyle: {
          fontWeight: 'normal',
          color: 'red',
          fontSize: '12'
        }
      },
      // 标题是图片
      graphic: {
        type: 'image',
        z: 6,
        style: {
          image: appLogo,
          width: 50
        },
        left: 'center',
        top: '30%'
      },
      color: ['#cccccc'],
      legend: {
        show: false,
        data: []
      },
      // 数据
      series: [
        {
          name: 'Line 1',
          type: 'pie',
          clockWise: true,
          radius: ['40%', '60%'],
          itemStyle: {
            normal: {
              label: {
                show: false
              },
              labelLine: {
                show: false
              }
            }
          },
          center: ['50%', '50%'],
          // hoverAnimation: false,
          data: [
            {
              value: index.overviewInfo.running_app_num,
              name: '已用',
              itemStyle: {
                normal: {
                  color: {
                    // 完成的圆环的颜色
                    colorStops: appColorData.ringColor
                  },
                  label: {
                    show: false
                  },
                  labelLine: {
                    show: false
                  }
                }
              }
            },
            {
              name: '未用',
              value:
                index.overviewInfo.team_app_num -
                index.overviewInfo.running_app_num
            }
          ]
        }
      ]
    };
    const option2 = {
      // 鼠标悬停
      tooltip: {
        show: true,
        position: [50, 0],
        fontSize: 10,
        formatter(params) {
          if (params.data.name === '已用') {
            return `
           <div>${formatMessage({id:'teamOverview.runAppNums'},{number:params.data.value})}</div>
          `;
          }
          return `
           <div>${formatMessage({id:'teamOverview.notRunAppNums'},{number:params.data.value})}</div>
          `;
        }
      },
      // 标题
      title: {
        text: '',
        x: 'center',
        y: 'center',
        textStyle: {
          fontWeight: 'normal',
          color: 'red',
          fontSize: '12'
        }
      },
      // 标题是图片
      graphic: {
        type: 'image',
        z: 6,
        style: {
          image: componentLogo,
          width: 40
        },
        left: 'center',
        top: '34%'
      },
      color: ['#cccccc'],
      legend: {
        show: false,
        data: []
      },
      // 数据
      series: [
        {
          name: 'Line 1',
          type: 'pie',
          clockWise: true,
          radius: ['40%', '60%'],
          itemStyle: {
            normal: {
              label: {
                show: false
              },
              labelLine: {
                show: false
              }
            }
          },
          center: ['50%', '50%'],
          // hoverAnimation: false,
          data: [
            {
              value: index.overviewInfo.running_component_num,
              name: '已用',
              itemStyle: {
                normal: {
                  color: {
                    // 完成的圆环的颜色
                    colorStops: appColorData.ringColor
                  },
                  label: {
                    show: false
                  },
                  labelLine: {
                    show: false
                  }
                }
              }
            },
            {
              name: '未用',
              value:
                index.overviewInfo.team_service_num -
                index.overviewInfo.running_component_num
            }
          ]
        }
      ]
    };
    // 3. 配置项和数据给实例化对象
    myEcharts1.setOption(option1);
    myEcharts2.setOption(option2);
    // 4. 当我们浏览器缩放的时候，图表也等比例缩放
    window.addEventListener('resize', function () {
      // 让我们的图表调用 resize这个方法
      myEcharts1.resize();
      myEcharts2.resize();
    });
  };
  // 搜索应用
  onSearch = value => {
    this.setState(
      {
        query: value,
        loadingOfApp: true,
        page: 1,
        searchVisible: true
      },
      () => {
        this.loadHotApp();
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
        loadingOfApp: true
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
              // // 加载echarts图表
              this.loadTeamAppEcharts();
              // // 加载热门应用模块
              // if (!this.loadHotAppTimer) {
              //   this.loadHotApp();
              // }
            }
          );
          // 每隔10s获取最新的团队下的资源
          this.handleTimers(
            'loadTeamTimer',
            () => {
              this.loadOverview();
            },
            10000
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
  loadHotApp = () => {
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
            emptyConfig: false,
            searchVisible: false
          });
          // 每隔10s获取最新的列表数据
          this.handleTimers(
            'loadHotAppTimer',
            () => {
              this.loadHotApp();
            },
            10000
          );
        }
        if (res && res.list && res.list.length === 0 && query) {
          this.setState({
            emptyConfig: true
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
    notification.success({ message: formatMessage({id:'notification.success.add'}) });
    this.handleCancelApplication();
    // 重新加载页面数据
    this.loadOverview();
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
      language
    } = this.state;
    console.log(language,"language");
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
    // 团队应用
    return (
      <Fragment>
        {index.overviewInfo.region_health && (
          <div className={styles.teamAppTitle}>
            <span>{globalUtil.fetchSvg('teamViewTitle')}</span>
            <h2 className={styles.topContainerTitle}>
              {index.overviewInfo.team_alias}
            </h2>
          </div>
        )}
        {/* 页面loading */}
        {loadingOverview && index.overviewInfo.region_health && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Spin tip="Loading..." size="large" />
          </div>
        )}
        {/* page top */}
        {!loadingOverview && index.overviewInfo.region_health && (
          <div className={styles.topContainer}>
            {/* 应用 */}
            <div>
              <div className={styles.teamApp}>
                <h3 className={styles.teamAppTitle}><FormattedMessage id="teamOverview.app.name" /></h3>
                <div className={styles.teamAppContent}>
                  {/* 图表 */}
                  <div id="appEcharts" className={styles.appEcharts} />
                  {/* 描述 */}
                  <div className={styles.desc}>
                    <div className={styles.activeApp}>
                      <span>
                        {globalUtil.fetchSvg('teamAppActive', '#4f75af', '24')}
                      </span>
                      <Tooltip title={formatMessage({id:'teamOverview.runAppNum'},{number:(index.overviewInfo && index.overviewInfo.running_app_num) || 0})}>
                      <span
                        className={styles.ellipsis}
                        style={{ width: '100%' }}
                      >
                        <FormattedMessage 
                          id="teamOverview.runAppNum" 
                          values={{number:(index.overviewInfo && index.overviewInfo.running_app_num) || 0}}
                        /> 
                      </span>
                      </Tooltip>
                    </div>
                    <div className={styles.defaultApp}>
                      <span>
                        {globalUtil.fetchSvg(
                          'teamDefaultActive',
                          '#cccccc',
                          '24'
                        )}
                      </span>
                      <Tooltip title={formatMessage({id:'teamOverview.notRunAppNum'},{number:(index.overviewInfo.team_app_num - index.overviewInfo.running_app_num) || 0})}>
                      <span
                        className={styles.ellipsis}
                        style={{ width: '100%' }}
                      >
                        <FormattedMessage 
                          id="teamOverview.notRunAppNum"
                          values={{number:(index.overviewInfo.team_app_num - index.overviewInfo.running_app_num) || 0}}
                        />
                      </span>
                      </Tooltip>
                    </div>
                    <div className={styles.totalApp}>
                      <FormattedMessage 
                        id="teamOverview.appSum" 
                        values={{number:(index.overviewInfo &&index.overviewInfo && index.overviewInfo.team_app_num) || 0 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 组件 */}
            <div>
              <div className={styles.teamApp}>
                <h3 className={styles.teamAppTitle}> <FormattedMessage id="teamOverview.component.name" /></h3>
                <div className={styles.teamAppContent}>
                  {/* 图表 */}
                  <div id="componmentEcharts" className={styles.appEcharts} />
                  {/* 描述 */}
                  <div className={styles.desc}>
                    <div className={styles.activeApp}>
                      <span>
                        {globalUtil.fetchSvg('teamAppActive', '#4f75af', '24')}
                      </span>

                      <Tooltip title={formatMessage({id:'teamOverview.runComponentNum'},{number:(index.overviewInfo && index.overviewInfo.running_component_num) || 0})}>
                      <span
                        className={styles.ellipsis}
                        style={{ width: '100%' }}
                      >
                        <FormattedMessage 
                          id="teamOverview.runComponentNum" 
                          values={{number:(index.overviewInfo && index.overviewInfo.running_component_num) || 0 }}
                        />
                      </span>
                    </Tooltip>
                    </div>
                    <div className={styles.defaultApp}>
                      <span>
                        {globalUtil.fetchSvg(
                          'teamDefaultActive',
                          '#cccccc',
                          '24'
                        )}
                      </span>
                      <Tooltip title={formatMessage({id:'teamOverview.notRunComponentNum'},{number:(index.overviewInfo.team_service_num - index.overviewInfo.running_component_num) || 0})}>
                      <span
                        className={styles.ellipsis}
                        style={{ width: '100%' }}
                      >
                        <FormattedMessage 
                          id="teamOverview.notRunComponentNum" 
                          values={{number:(index.overviewInfo.team_service_num - index.overviewInfo.running_component_num) || 0 }}
                        />
                      </span>
                      </Tooltip>
                    </div>
                    <div className={styles.totalApp}>
                      <FormattedMessage 
                        id="teamOverview.componentSum" 
                        values={{number:(index.overviewInfo &&
                          index.overviewInfo &&
                          index.overviewInfo.team_service_num) || 0 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 使用资源 */}
            <div>
              <div className={styles.teamDisk}>
                <h3 className={styles.teamDiskTitle}>
                  <FormattedMessage id="teamOverview.useResource" />
                </h3>
                <div className={styles.teamDiskContent}>
                  <div>
                    <div className={styles.save}>
                      <div>
                        <p style={{ marginBottom: '0px' }}>
                          {this.handlUnit(
                            index.overviewInfo.team_service_memory_count || 0
                          )}
                        </p>
                        <span>
                          {this.handlUnit(
                            index.overviewInfo.team_service_memory_count || 0,
                            'MB'
                          )}
                        </span>
                      </div>
                      <p style={{ marginBottom: '0px' }}>
                        <FormattedMessage id="teamOverview.memoryUsage" />
                      </p>
                    </div>
                    <span className={styles.useLine} />
                    <div className={styles.disk}>
                      <div>
                        <p style={{ marginBottom: '0px' }}>
                          {this.handlUnit(
                            index.overviewInfo.team_service_total_disk || 0
                          )}
                        </p>
                        <span>
                          {this.handlUnit(
                            index.overviewInfo.team_service_total_disk || 0,
                            'MB'
                          )}
                        </span>
                      </div>
                      <p style={{ marginBottom: '0px' }}>
                        <FormattedMessage id="teamOverview.diskUsage" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 用户数量 */}
            <div>
              <div
                className={`${styles.teamDisk} ${styles.hoverPointer}`}
                onClick={() => {
                  dispatch(
                    routerRedux.push({
                      pathname: `/team/${teamName}/region/${regionName}/team`,
                      state: { config: 'member' }
                    })
                  );
                }}
              >
                <h3 className={styles.teamDiskTitle}>
                  <FormattedMessage id="teamOverview.UserNum" />
                </h3>
                <div className={styles.teamDiskContent}>
                  <div className={styles.userNum}>
                    <p>
                      {(index.overviewInfo && index.overviewInfo.user_nums) ||
                        0}
                    </p>
                    
                    <span><FormattedMessage id="unit.entries" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 热门应用标题 */}
        {index.overviewInfo.region_health && (
          <div className={styles.teamHotAppTitle}>
            <div className={styles.teamHotAppTitleLeft}>
              <span>{globalUtil.fetchSvg('teamViewHotsvg')}</span>
              <h2><FormattedMessage id="teamOverview.appList" /></h2>
            </div>
            {/* {(!loadingOfApp || searchVisible) && ( */}
              <div className={styles.teamHotAppTitleSearch}>
                <Select
                  style={language ? { width: '140px' } : { width:'200px' } }
                  placeholder={formatMessage({id: 'teamOverview.sortTips'})}
                  defaultValue={1}
                  onChange={this.handleSortChange}
                >
                  <Option title={formatMessage({id: 'teamOverview.runStatusSort'})} value={1}><FormattedMessage id="teamOverview.runStatusSort" /></Option>
                  <Option title={formatMessage({id: 'teamOverview.updateTimeSort'})} value={2}><FormattedMessage id="teamOverview.updateTimeSort" /></Option>
                </Select>
                <Search
                  placeholder={formatMessage({id: 'teamOverview.searchTips'})}
                  onSearch={this.onSearch}
                  defaultValue={query}
                  allowClear
                  style={{ width: 400 }}
                />
                <span
                  onClick={() => {
                    this.setState({ createAppVisible: true });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <FormattedMessage id="teamOverview.createApp" />
                </span>
              </div>
            {/* )} */}
          </div>
        )}
        {/* app list Loading */}
        {loadingOfApp && index.overviewInfo.region_health && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Spin tip="Loading..." size="large" />
          </div>
        )}
        {/* appList */}
        {!loadingOfApp && !emptyConfig && (
          <div>
            <div className={styles.teamHotAppList}>
              {/* 1 */}
              {teamHotAppList &&
                teamHotAppList.length > 0 &&
                teamHotAppList.map(item => {
                  return (
                    <div key={item.group_id}>
                      <div
                        className={`${styles.teamHotAppItem} ${styles.hoverPointer}`}
                        onClick={() => {
                          dispatch(
                            routerRedux.push(
                              `/team/${teamName}/region/${regionName}/apps/${item.group_id}`
                            )
                          );
                        }}
                      >
                        {/* top */}
                        <div className={styles.hotAppItemDetails}>
                          <span>
                            {item.logo && <img src={item.logo} />}
                            {!item.logo && <img src={defaultAppLogo} />}
                          </span>

                          <div className={styles.hotAppItemUse}>
                            {/* 标题 */}
                            <div
                              className={`${styles.hotAppItemTitle} ${styles.ellipsis}`}
                            >
                              {item.group_name}
                            </div>
                            <div className={styles.useDeatil}>
                              <div className={styles.hotAppUseSave}>
                                <p style={{ marginBottom: '0px' }}><FormattedMessage id="teamOverview.memory" />:</p>
                                <div>
                                  <p style={{ marginBottom: '0px' }}>
                                    {this.handlUnit(item.used_mem || 0)}
                                  </p>
                                  <span>
                                    {this.handlUnit(item.used_mem || 0, 'MB')}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.hotAppComNum}>
                                <span><FormattedMessage id="teamOverview.component.name" />:</span>
                                <span> {item.services_num}</span>
                                <span><FormattedMessage id="unit.entries" /></span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* under */}
                        <div className={styles.hotAppItemBackup}>
                          {/* 更新时间 */}
                          <div className={styles.comMsg}>
                            {/* <div className={styles.versions}>版本:1.0.0</div> */}
                            <div className={styles.update}>
                              <span>
                                {item.update_time &&
                                  moment(item.update_time).fromNow()}
                              </span>
                              <span><FormattedMessage id="teamOverview.update" /></span>
                            </div>
                          </div>
                          {/* 访问 */}
                          {item.status === 'RUNNING' && (
                            <div className={styles.visit}>
                              {item.accesses.length > 0 && (
                                <VisterBtn
                                  linkList={item.accesses}
                                  type="link"
                                />
                              )}
                            </div>
                          )}
                        </div>
                        {/* App status */}
                        <div className={styles.running}>
                          <AppState AppStatus={item.status} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {/* 分页 */}
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
            </div>
          </div>
        )}
        {/* 搜索为空时的状态 */}
        {emptyConfig && !loadingOfApp && <Empty />}
        {/* 新建应用 */}
        {createAppVisible && (
          <EditGroupName
            title={formatMessage({id: 'teamOverview.createApp'})}
            onCancel={this.handleCancelApplication}
            onOk={this.handleOkApplication}
            handleAppLoading={this.handleAppLoading}
          />
        )}
        {/* 集群不健康的情况 */}
        {loadedOverview &&
          index.overviewInfo &&
          !index.overviewInfo.region_health && (
            <div>
              <Result
                type="warning"
                title={formatMessage({id: 'teamOverview.result.title'})}
                description={formatMessage({id: 'teamOverview.result.description'})}
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
          <CustomFooter/>
      </Fragment>
    );
  }
}
