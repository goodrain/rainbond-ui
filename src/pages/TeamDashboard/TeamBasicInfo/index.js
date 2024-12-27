import React, { Component } from 'react'
import { Row, Col, Card, Table, Button, Select, Input, Spin, Pagination, Tag, notification, Empty, Switch, Dropdown, Menu } from 'antd';
import { connect } from 'dva';
import Result from '../../../components/Result';
import AddGroup from '../../../components/AddOrEditGroup';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import newRole from '@/utils/newRole';
import globalUtil from '../../../utils/global';
import { routerRedux } from 'dva/router';
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
      isTableView: true,
    };
  }
  componentDidMount() {
    const { teamOverviewPermission, teamAppCreatePermission } = this.state;
    this.loadOverview();
    this.setState({
      isTableView: window.localStorage.getItem('isTableView') === 'true'
    })
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
    this.setState({
      isTableView: checked
    }, () => {
      window.localStorage.setItem('isTableView', checked);
    });
  };
  // 添加卡片视图渲染函数
  renderCardView = () => {
    const { teamHotAppList, appListLoading } = this.state;
    return (
      <Spin spinning={appListLoading} style={{ paddingTop: 60 }}>
        <Row className={styles.cardRow}>
          {teamHotAppList.map(app => {
            // 添加操作菜单
            const appOverviewPermission = newRole.queryPermissionsInfo(
              this.props.currentTeamPermissionsInfo?.team,
              'app_overview',
              `app_${app.group_id}`
            );
            const isAppCreate = appOverviewPermission?.isCreate;
            return (
              <Col span={5} key={app.group_id}>
                <div className={`${styles.customCard} ${this.getRowClassName(app)}`}
                  onClick={() => {
                    const { dispatch } = this.props;
                    dispatch(routerRedux.push(
                      `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${app.group_id}`
                    ));
                  }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.appName}>{app.group_name}</span>
                    <Tag color={globalUtil.appStatusColor(app.status)}>
                      {globalUtil.appStatusText(app.status)}
                    </Tag>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>组件数量:</span>
                      <span className={styles.value}>{app.services_num} 个</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>内存使用:</span>
                      <span className={styles.value}>{app.used_mem || 0} MB</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>CPU使用:</span>
                      <span className={styles.value}>{app.used_cpu || 0} Core</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>更新时间:</span>
                      <span className={styles.value}>{moment(app.update_time).fromNow()}</span>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    {isAppCreate && (
                      <Button className={styles.actionButton}
                        icon='plus'
                        type='link'
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          this.props.dispatch(
                            routerRedux.push(
                              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${app.group_id}`
                            )
                          );
                        }}>
                        添加组件
                      </Button>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
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
        {(index?.overviewInfo?.region_health || loadingOverview) &&
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
              title={formatMessage({ id: 'versionUpdata_6_1.appList' })}
              bordered={false}
              className={styles.appListCard}
              extra={
                <>
                  <span>排列方式：</span>
                  <Select
                    style={{ width: '80px', marginRight: 10 }}
                    value={isTableView}
                    onChange={this.handleViewChange}
                  >
                    <Option value={true}>表格</Option>
                    <Option value={false}>卡片</Option>
                  </Select>
                  <Search
                    placeholder={formatMessage({ id: 'teamOverview.searchTips' })}
                    onSearch={this.onSearch}
                    value={query}
                    allowClear
                    onChange={(e) => {
                      this.setState({ query: e.target.value })
                    }}
                    style={{ width: 300, marginRight: 10 }}
                  />
                  <Select
                    style={{ width: '140px', marginRight: 10 }}
                    placeholder={formatMessage({ id: 'teamOverview.sortTips' })}
                    defaultValue={1}
                    onChange={this.handleSortChange}
                  >
                    <Option title={formatMessage({ id: 'teamOverview.runStatusSort' })} value={1}><FormattedMessage id="teamOverview.runStatusSort" /></Option>
                    <Option title={formatMessage({ id: 'teamOverview.updateTimeSort' })} value={2}><FormattedMessage id="teamOverview.updateTimeSort" /></Option>
                  </Select>
                  {isAppCreate && <Button
                    type="primary"
                    onClick={() => {
                      this.setState({
                        addGroup: true
                      })
                    }}>
                    {formatMessage({ id: 'versionUpdata_6_1.createApp' })}
                  </Button>}
                </>
              }
            >
              {isAppList ? (
                <>
                  {isTableView ? (
                    <>
                      <Table
                        dataSource={teamHotAppList}
                        columns={columns}
                        pagination={false}
                        rowClassName={this.getRowClassName}
                        rowKey={record => record.group_id}
                        loading={appListLoading}
                        pagination={false}
                      />
                    </>
                  ) : (
                    this.renderCardView()
                  )}
                  <Pagination
                    showSizeChanger
                    onShowSizeChange={this.handleChangePage}
                    current={page}
                    pageSize={page_size}
                    total={appListTotal}
                    pageSizeOptions={pageSizeOptions}
                    onChange={this.handleChangePage}
                    showQuickJumper
                    showTotal={(appListTotal) => `共 ${appListTotal} 条`}
                    hideOnSinglePage={appListTotal <= 12}
                    pageSizeOptions={['12', '24', '36', '48', '60']}
                  />
                </>
              ) : (
                <div style={{ paddingTop: '96px' }}>
                  <Empty />
                </div>
              )}
            </Card>
          </>
        }
        {loadedOverview &&
          index?.overviewInfo &&
          !index?.overviewInfo?.region_health && (
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
        {addGroup &&
          <AddGroup
            onCancel={this.cancelAddApp}
            onOk={this.handleAddGroup}
          />
        }
      </>

    )
  }
}
