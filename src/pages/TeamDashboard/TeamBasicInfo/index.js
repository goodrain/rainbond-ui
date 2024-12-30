import React, { Component } from 'react'
import { Row, Col, Card, Table, Button, Select, Input, Spin, Pagination, Tag, notification, Empty, Switch, Dropdown, Menu, Tooltip, Radio, Icon } from 'antd';
import { connect } from 'dva';
import Result from '../../../components/Result';
import AddGroup from '../../../components/AddOrEditGroup';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import VisterBtn from '../../../components/visitBtnForAlllink';
import newRole from '@/utils/newRole';
import globalUtil from '../../../utils/global';
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
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class index extends Component {
  constructor(props) {
    super(props);
    const savedViewState = window.localStorage.getItem('isTableView');
    this.state = {
      page: 1,
      page_size: 12,
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
      language: cookie.get('language') === 'zh-CN' ? true : false,
    };
  }
  componentDidMount() {
    const { teamOverviewPermission, teamAppCreatePermission } = this.state;
    this.loadOverview();
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
      handleError: () => {
        this.handleCloseLoading();
      }
    });
  };
  // 关闭loading
  handleCloseLoading = () => {
    this.setState({ loadingOverview: false, loadedOverview: true });
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
        if (res && res.status_code === 200) {
          this.setState({
            teamHotAppList: res.list,
            appListTotal: res.bean && res.bean.total,
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
        if (nums >= 1024) {
          nums = num / 1024;
          units = 'Core';
        }
        return unit ? units : nums.toFixed(1);
      }
      return num;
    };
  }
  // 新建应用
  handleAddGroup = (groupId, groups) => {
    const { dispatch } = this.props;
    this.setState({
      addGroup: false
    }, () => {
      notification.success({
        message: formatMessage({ id: 'versionUpdata_6_1.createSuccess' })
      })
      dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${groupId}`))
    })
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
    window.localStorage.setItem('isTableView', checked);
    this.setState({
      isTableView: checked
    });
  };
  // 添加卡片视图渲染函数
  renderCardView = () => {
    const { teamHotAppList, appListLoading, language } = this.state;
    const { dispatch } = this.props;
    const addComponentSvg = (
      <svg t="1735296415486" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4279" width="16" height="16"><path d="M801.171 483.589H544V226.418c0-17.673-14.327-32-32-32s-32 14.327-32 32v257.171H222.83c-17.673 0-32 14.327-32 32s14.327 32 32 32H480v257.17c0 17.673 14.327 32 32 32s32-14.327 32-32v-257.17h257.171c17.673 0 32-14.327 32-32s-14.327-32-32-32z" p-id="4280" fill='#195AC3'></path></svg>
    )
    const visterSvg = (
      <svg t="1735296596548" style={{ marginRight: '2px' }} class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10566" width="12" height="12"><path d="M864.107583 960.119537H63.880463V159.892417h447.928278V96.011954H0v927.988046h927.988046V527.874486h-63.880463v432.245051z" p-id="10567" fill='#195AC3'></path><path d="M592.137467 0v63.880463h322.462458L457.491222 521.371685l45.137093 45.137093L960.119537 109.400075v322.462458h63.880463V0H592.137467z" p-id="10568" fill='#195AC3'></path></svg>
    )
    return (
      <Spin spinning={appListLoading}>
        <div className={styles.teamHotAppList} style={{ height: teamHotAppList.length < 8 ? '300px' : '' }}>
          {teamHotAppList.map((item, index) => {
            // 添加操作菜单
            const appOverviewPermission = newRole.queryPermissionsInfo(
              this.props.currentTeamPermissionsInfo?.team,
              'app_overview',
              `app_${item.group_id}`
            );
            const isAppCreate = appOverviewPermission?.isCreate;
            return (
              <div key={item.group_id} style={{ marginLeft: (index % 4) ? '1.2%' : '0px' }}>
                <div
                  className={`${styles.teamHotAppItem} ${styles.hoverPointer}`}
                  onClick={() => {
                    dispatch(routerRedux.push(
                      `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${item.group_id}`
                    ));
                  }}
                >
                  <div className={styles.appStatus} style={{ background: globalUtil.appStatusColor(item.status) }}></div>
                  <div className={styles.appItemDetail}>
                    <Tooltip placement="topLeft" title={item.group_name}>
                      <div className={styles.appTitle}>{item.group_name}</div>
                    </Tooltip>
                    <div className={styles.value}>
                      <div className={styles.statusText} style={{ background: globalUtil.appStatusColor(item.status) }}>
                        {globalUtil.appStatusText(item.status)}
                      </div>
                      <div className={styles.component}><FormattedMessage id="teamOverview.component.name" />: {item.services_num}<FormattedMessage id="unit.entries" /></div>
                    </div>
                    <div className={styles.updateTime}>
                      {item.update_time &&
                        moment(item.update_time).fromNow()}
                      <FormattedMessage id="teamOverview.update" />
                    </div>
                    <div className={styles.btn}>
                      {isAppCreate && (
                        <div className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            this.props.dispatch(
                              routerRedux.push(
                                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${item.group_id}`
                              )
                            );
                          }}>
                          {addComponentSvg} {formatMessage({ id: 'versionUpdata_6_1.addComponent.card' })}
                        </div>
                      )}
                      {item.status === 'RUNNING' && (
                        <div className={styles.visterBtn}>
                          {visterSvg}
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
        </div>
      </Spin>
    );
  };
  render() {
    const {
      loadingOverview,
      loadedOverview,
      teamHotAppList,
      total,
      pageSizeOptions,
      createAppVisible,
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
      isTableView
    } = this.state;
    const { index, currentTeamPermissionsInfo } = this.props;
    const dataSource = [];
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
              dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${record.group_id}`))
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
        dataIndex: 'disk_usage',
        key: 'disk_usage',
        render: (text, record) => {
          return <span>
            {text / 1000 || 0}
          </span>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.updated_at.title' }),
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
          const appOverviewPermission = newRole.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${record.group_id}`)
          const isAppCreate = appOverviewPermission?.isCreate
          return <>
            {isAppCreate && <a onClick={() => {
              this.props.dispatch(
                routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${record.group_id}`)
              )
            }}>{formatMessage({ id: 'versionUpdata_6_1.addComponent' })}</a>}
            <a
              onClick={() => {
                const { dispatch } = this.props;
                dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${record.group_id}`))
              }}>
              {formatMessage({ id: 'versionUpdata_6_1.manage' })}
            </a>
          </>
        },
      },
    ];

    return (
      <>
        {(index?.overviewInfo?.region_health || loadingOverview) && (
          <>
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
                  <div className={styles.basicInfoTitle}>{formatMessage({ id: 'versionUpdata_6_1.diskUsage' })}</div>
                  <div className={styles.basicInfoContent}>{isTeamOverview ? index?.overviewInfo?.disk_usage || 0 : '**'}</div>
                </div>
              </Col>
            </Row>
            <Card
              title={
                <div>
                  {formatMessage({ id: 'versionUpdata_6_1.appList' })}
                  <Radio.Group
                    style={{ marginLeft: '14px' }}
                    value={isTableView ? 'table' : 'card'}
                    onChange={(e) => this.handleViewChange(e.target.value === 'table')}
                  >
                    <Radio.Button value="card">
                      <Tooltip title={formatMessage({ id: 'versionUpdata_6_1.appList.card' })}>
                        <Icon type="appstore" />
                      </Tooltip>
                    </Radio.Button>
                    <Radio.Button value="table">
                      <Tooltip title={formatMessage({ id: 'versionUpdata_6_1.appList.table' })}>
                        <Icon type="table" />
                      </Tooltip>
                    </Radio.Button>
                  </Radio.Group>
                </div>}
              bordered={false}
              className={styles.appListCard}
              extra={
                <>

                  <Search
                    placeholder={formatMessage({ id: 'teamOverview.searchTips' })}
                    onSearch={this.onSearch}
                    value={query}
                    allowClear
                    onChange={(e) => {
                      this.setState({ query: e.target.value });
                    }}
                    style={{ width: 300, marginRight: 10 }}
                  />
                  <Select
                    style={{ width: '140px', marginRight: 10 }}
                    placeholder={formatMessage({ id: 'teamOverview.sortTips' })}
                    defaultValue={1}
                    onChange={this.handleSortChange}
                  >
                    <Option title={formatMessage({ id: 'teamOverview.runStatusSort' })} value={1}>
                      <FormattedMessage id="teamOverview.runStatusSort" />
                    </Option>
                    <Option title={formatMessage({ id: 'teamOverview.updateTimeSort' })} value={2}>
                      <FormattedMessage id="teamOverview.updateTimeSort" />
                    </Option>
                  </Select>
                  {isAppCreate && (
                    <Button
                      type="primary"
                      onClick={() => {
                        this.setState({
                          addGroup: true,
                        });
                      }}
                    >
                      {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                    </Button>
                  )}
                </>
              }
            >
              {isAppList && teamHotAppList.length > 0 ? (
                <>
                  {isTableView ? (
                    <Table
                      dataSource={teamHotAppList}
                      columns={columns}
                      pagination={false}
                      rowClassName={this.getRowClassName}
                      rowKey={(record) => record.group_id}
                      loading={appListLoading}
                      pagination={false}
                    />
                  ) : (
                    this.renderCardView()
                  )}
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
                      hideOnSinglePage={appListTotal <= 12}
                      pageSizeOptions={['12', '24', '36', '48', '60']}
                    />
                  </div>
                </>
              ) : (
                <div style={{ paddingTop: '96px' }}>
                  <Empty />
                </div>
              )}
            </Card>
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
      </>
    );
  }
}
