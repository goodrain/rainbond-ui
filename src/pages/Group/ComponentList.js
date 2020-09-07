/* eslint-disable prettier/prettier */
import React, { Fragment, Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Badge, Button, Card, notification, Table, Tooltip } from 'antd';
import moment from 'moment';
import ScrollerX from '../../components/ScrollerX';
import styles from './ComponentList.less';
import MoveGroup from '../../components/AppMoveGroup';
import BatchDelete from '../../components/BatchDelete';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    buildShapeLoading: loading.effects['appControl/putBatchReStart'],
    batchStartLoading: loading.effects['appControl/putBatchStart'],
    batchStopLoading: loading.effects['appControl/putBbatchStop'],
    batchMoveLoading: loading.effects['appControl/putBatchMove'],
    reStartLoading: loading.effects['appControl/putReStart'],
    startLoading: loading.effects['appControl/putStart'],
    stopLoading: loading.effects['appControl/putStop']
  }),
  null,
  null,
  {
    pure: false
  }
)
export default class ComponentList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      apps: [],
      current: 1,
      total: 0,
      pageSize: 10,
      moveGroupShow: false,
      batchDeleteApps: [],
      batchDeleteShow: false
    };
  }
  componentDidMount() {
    this.updateApp();
    document
      .querySelector('.ant-table-footer')
      .setAttribute('style', 'position:absolute;background:#fff');
  }
  shouldComponentUpdate() {
    return true;
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    this.props.dispatch({
      type: 'groupControl/clearApps'
    });
  }
  onSelectChange = selectedRowKeys => {
    this.setState({
      selectedRowKeys
    });
  };
  getSelectedKeys() {
    const selected = this.getSelected();
    return selected.map(item => item.service_id);
  }

  getSelected() {
    const key = this.state.selectedRowKeys;
    const res = key.map(item => this.state.apps[item]);
    return res;
  }
  updateApp = () => {
    this.loadComponents();
    const { clearTime } = this.props;
    this.timer = setInterval(() => {
      if (!clearTime) {
        this.loadComponents();
      }
    }, 5000);
  };
  loadComponents = () => {
    const { dispatch, groupId } = this.props;
    const { current, pageSize } = this.state;
    dispatch({
      type: 'groupControl/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: current,
        page_size: pageSize
      },
      callback: data => {
        if (data && data._code == 200) {
          this.setState({
            apps: data.list || [],
            total: data.total || 0
          });
        }
      }
    });
  };

  deleteData = () => {
    const { dispatch, groupId } = this.props;
    const { current, pageSize } = this.state;
    dispatch({
      type: 'groupControl/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: current,
        page_size: pageSize
      },
      callback: data => {
        if (data && data._code == 200) {
          this.setState(
            {
              apps: data.list || [],
              total: data.total || 0
            },
            () => {
              this.handleBatchDeletes();
              this.hideMoveGroup();
            }
          );
        }
      }
    });
  };

  handleOperation = (state, data) => {
    const { dispatch } = this.props;
    const operationMap = {
      putReStart: '操作成功，重启中',
      putStart: '操作成功，启动中',
      putStop: '操作成功，关闭中'
    };
    dispatch({
      type: `appControl/${state}`,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: data.service_alias
      },
      callback: res => {
        if (res) {
          notification.success({
            message: operationMap[state]
          });
        }
      }
    });
  };

  handleBatch = state => {
    const ids = this.getSelectedKeys();
    const { dispatch } = this.props;
    const batchMap = {
      putBatchReStart: '批量重启中',
      putBatchStart: '批量启动中',
      putBbatchStop: '批量关闭中'
    };
    dispatch({
      type: `appControl/${state}`,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        serviceIds: ids.join(',')
      },
      callback: data => {
        if (data) {
          notification.success({
            message: batchMap[state]
          });
        }
      }
    });
  };
  handleBatchDelete = () => {
    const apps = this.getSelected();
    this.setState({ batchDeleteApps: apps, batchDeleteShow: true });
  };
  hideBatchDelete = () => {
    // update menus data
    this.deleteData();
    this.updateGroupMenu();
  };
  handleBatchDeletes = () => {
    this.setState({
      batchDeleteApps: [],
      batchDeleteShow: false,
      selectedRowKeys: []
    });
  };
  updateGroupMenu = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      }
    });
  };
  handleBatchMove = groupID => {
    const ids = this.getSelectedKeys();
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/putBatchMove',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        serviceIds: ids.join(','),
        move_group_id: groupID
      },
      callback: data => {
        if (data) {
          notification.success({
            message: '批量移动中'
          });
          this.hideBatchDelete();
        }
      }
    });
  };
  hideMoveGroup = () => {
    this.setState({ moveGroupShow: false });
  };
  showBatchMove = () => {
    this.setState({ moveGroupShow: true });
  };
  // 是否可以批量重启
  canBatchRestart = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };
  // 是否可以批量启动
  canBatchStart = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };
  // 是否可以批量关闭
  canBatchStop = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };
  canBatchMove = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };
  canBatchDelete = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };

  render() {
    const {
      componentPermissions: { isStart, isRestart, isStop, isDelete, isEdit },
      buildShapeLoading,
      batchStartLoading,
      batchStopLoading,
      batchMoveLoading,
      reStartLoading,
      startLoading,
      stopLoading
    } = this.props;
    const { selectedRowKeys, current, total, apps, pageSize } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };
    const pagination = {
      pageSize,
      current,
      total,
      onChange: page => {
        this.setState(
          {
            current: page,
            selectedRowKeys: []
          },
          () => {
            this.loadComponents();
          }
        );
      }
    };
    const columns = [
      {
        title: '组件名称',
        dataIndex: 'service_cname',
        render: (val, data) => (
          <Link
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              data.service_alias
            }/overview`}
          >
            {' '}
            {data.service_source && data.service_source == 'third_party' ? (
              <span>
                <Tooltip title="第三方组件">
                  <span
                    style={{
                      borderRadius: '50%',
                      height: '20px',
                      width: '20px',
                      display: 'inline-block',
                      background: '#1890ff',
                      verticalAlign: 'top',
                      marginRight: '3px'
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        color: '#FFFFFF',
                        height: '20px',
                        lineHeight: '20px',
                        textAlign: 'center'
                      }}
                    >
                      3
                    </span>
                  </span>
                  {val}
                </Tooltip>
              </span>
            ) : (
              <span>{val}</span>
            )}{' '}
          </Link>
        )
      },
      {
        title: '内存',
        dataIndex: 'min_memory',
        render: (val, data) => (
          <span>
            {data.service_source && data.service_source == 'third_party'
              ? '-'
              : `${val}MB`}
          </span>
        )
      },
      {
        title: '状态',
        dataIndex: 'status_cn',
        render: (val, data) =>
          data.service_source && data.service_source == 'third_party' ? (
            <Badge
              status={appUtil.appStatusToBadgeStatus(data.status)}
              text={
                val == '运行中'
                  ? '健康'
                  : val == '运行异常'
                  ? '不健康'
                  : val == '已关闭'
                  ? '下线'
                  : val
              }
            />
          ) : (
            <Badge
              status={appUtil.appStatusToBadgeStatus(data.status)}
              text={val}
            />
          )
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        render: val =>
          moment(val)
            .locale('zh-cn')
            .format('YYYY-MM-DD HH:mm:ss')
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (val, data) => (
          <Fragment>
            {data.service_source && data.service_source !== 'third_party' && (
              <Fragment>
                {isRestart && (
                  <Button
                    type="link"
                    onClick={() => {
                      this.handleOperation('putReStart', data);
                    }}
                    loading={reStartLoading}
                  >
                    重启
                  </Button>
                )}
                {isStart && (
                  <Button
                    type="link"
                    onClick={() => {
                      this.handleOperation('putStart', data);
                    }}
                    loading={startLoading}
                  >
                    启动
                  </Button>
                )}
                {isStop && (
                  <Button
                    type="link"
                    onClick={() => {
                      this.handleOperation('putStop', data);
                    }}
                    loading={stopLoading}
                  >
                    关闭
                  </Button>
                )}
              </Fragment>
            )}
          </Fragment>
        )
      }
    ];
    const footer = (
      <div className={styles.tableList}>
        <div className={styles.tableListOperator}>
          {isRestart && (
            <Button
              disabled={!this.canBatchRestart()}
              onClick={() => {
                this.handleBatch('putBatchReStart');
              }}
              loading={buildShapeLoading}
            >
              批量重启
            </Button>
          )}
          {isStop && (
            <Button
              disabled={!this.canBatchStop()}
              onClick={() => {
                this.handleBatch('putBbatchStop');
              }}
              loading={batchStopLoading}
            >
              批量关闭
            </Button>
          )}
          {isStart && (
            <Button
              disabled={!this.canBatchStart()}
              onClick={() => {
                this.handleBatch('putBatchStart');
              }}
              loading={batchStartLoading}
            >
              批量启动
            </Button>
          )}
          {isEdit && (
            <Button
              disabled={!this.canBatchMove()}
              onClick={this.showBatchMove}
            >
              批量移动
            </Button>
          )}
          {isDelete && (
            <Button
              disabled={!this.canBatchDelete()}
              onClick={this.handleBatchDelete}
            >
              批量删除
            </Button>
          )}
        </div>
      </div>
    );
    return (
      <div>
        <Card
          style={{
            minHeight: 400
          }}
          bordered={false}
          bodyStyle={{ padding: '10px 10px' }}
        >
          <ScrollerX sm={750}>
            <Table
              pagination={pagination}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={apps || []}
              footer={() => footer}
              style={{ position: 'relative' }}
            />
          </ScrollerX>
          {this.state.batchDeleteShow && (
            <BatchDelete
              batchDeleteApps={this.state.batchDeleteApps}
              onCancel={this.hideBatchDelete}
              onOk={this.hideBatchDelete}
            />
          )}
          {this.state.moveGroupShow && (
            <MoveGroup
              loading={batchMoveLoading}
              currGroupID={this.props.groupId}
              groups={this.props.groups}
              onOk={this.handleBatchMove}
              onCancel={this.hideMoveGroup}
            />
          )}
        </Card>
      </div>
    );
  }
}
