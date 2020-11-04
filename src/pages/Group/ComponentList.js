/* eslint-disable no-nested-ternary */
import React, { Fragment, Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Badge, Button, Card, notification, Table, Tooltip } from 'antd';
import moment from 'moment';
import ScrollerX from '../../components/ScrollerX';
import styles from './ComponentList.less';
import MoveGroup from '../../components/AppMoveGroup';
import BatchDelete from '../../components/BatchDelete';
import {
  batchOperation,
  batchMove,
  restart,
  start,
  stop
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';

@connect(
  ({ global }) => ({
    groups: global.groups
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
      batchDeleteShow: false,
      operationState: false
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
  onSelectChange = (selectedRowKeys) => {
    this.setState({
      selectedRowKeys
    });
  };
  getSelectedKeys() {
    const selected = this.getSelected();
    return selected.map((item) => item.service_id);
  }

  getSelected() {
    const key = this.state.selectedRowKeys;
    const res = key.map((item) => this.state.apps[item]);
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
    const { dispatch, groupId: group_id } = this.props;
    const { current, pageSize: page_size } = this.state;
    dispatch({
      type: 'groupControl/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id,
        page: current,
        page_size
      },
      callback: (data) => {
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
    const { dispatch, groupId: group_id } = this.props;
    const { current, pageSize: page_size } = this.state;
    dispatch({
      type: 'groupControl/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id,
        page: current,
        page_size
      },
      callback: (data) => {
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

  handleReStart = (data) => {
    restart({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then((data) => {
      if (data) {
        notification.success({
          message: '操作成功，重启中'
        });
      }
    });
  };
  handleStart = (data) => {
    start({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then((data) => {
      if (data) {
        notification.success({
          message: '操作成功，启动中'
        });
      }
    });
  };
  handleStop = (data) => {
    stop({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then((data) => {
      if (data) {
        notification.success({
          message: '操作成功，关闭中'
        });
      }
    });
  };

  handleOperationState = (operationState) => {
    this.setState({ operationState });
  };
  handleBatchOperation = (action) => {
    const ids = this.getSelectedKeys();
    const map = {
      stop: '批量关闭中',
      start: '批量启动中',
      restart: '批量重启中',
      upgrade: '批量更新中',
      deploy: '批量构建中'
    };
    batchOperation({
      action,
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids && ids.join(',')
    }).then((data) => {
      this.handleOperationState(false);
      if (data && map[action]) {
        notification.success({
          message: map[action]
        });
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
  handleBatchMove = (groupID) => {
    const ids = this.getSelectedKeys();
    batchMove({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(','),
      move_group_id: groupID
    }).then((data) => {
      if (data) {
        notification.success({
          message: '批量移动中'
        });
        this.hideBatchDelete();
      }
    });
  };
  hideMoveGroup = () => {
    this.setState({ moveGroupShow: false });
  };
  showBatchMove = () => {
    this.setState({ moveGroupShow: true });
  };
  // 是否可以批量操作
  CanBatchOperation = () => {
    const arr = this.getSelected();
    return arr && arr.length > 0;
  };

  render() {
    const {
      componentPermissions: {
        isStart,
        isRestart,
        isStop,
        isDelete,
        isEdit,
        isUpdate,
        isConstruct
      },
      groupId,
      groups
    } = this.props;
    const {
      selectedRowKeys,
      current,
      total,
      apps,
      pageSize,
      batchDeleteShow,
      batchDeleteApps,
      moveGroupShow,
      operationState
    } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };
    const pagination = {
      pageSize,
      current,
      total,
      onChange: (page) => {
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
        render: (val) =>
          moment(val).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (val, data) => (
          <Fragment>
            {data.service_source && data.service_source !== 'third_party' && (
              <Fragment>
                {isRestart && (
                  <a
                    onClick={() => {
                      this.handleReStart(data);
                    }}
                    href="javascript:;"
                    style={{
                      marginRight: 10
                    }}
                  >
                    重启
                  </a>
                )}
                {isStart && (
                  <a
                    onClick={() => {
                      this.handleStart(data);
                    }}
                    href="javascript:;"
                    style={{
                      marginRight: 10
                    }}
                  >
                    启动
                  </a>
                )}
                {isStop && (
                  <a
                    onClick={() => {
                      this.handleStop(data);
                    }}
                    href="javascript:;"
                  >
                    关闭
                  </a>
                )}
              </Fragment>
            )}
          </Fragment>
        )
      }
    ];
    const customBox = [
      {
        permissions: isConstruct,
        name: '批量构建',
        action: 'deploy'
      },
      {
        permissions: isUpdate,
        name: '批量更新',
        action: 'upgrade'
      },
      {
        permissions: isRestart,
        name: '批量重启',
        action: 'restart'
      },
      {
        permissions: isStop,
        name: '批量关闭',
        action: 'stop'
      },
      {
        permissions: isStart,
        name: '批量启动',
        action: 'start'
      },
      {
        permissions: isEdit,
        name: '批量移动',
        action: false,
        customMethods: this.showBatchMove
      },
      {
        permissions: isDelete,
        name: '批量删除',
        action: false,
        customMethods: this.handleBatchDelete
      }
    ];
    const footer = (
      <div className={styles.tableList}>
        <div className={styles.tableListOperator}>
          {customBox.map((item) => {
            const { permissions, name, action, customMethods } = item;
            return (
              permissions && (
                <Button
                  loading={operationState === action ? operationState : false}
                  disabled={!this.CanBatchOperation()}
                  onClick={() => {
                    if (action) {
                      this.handleOperationState(action);
                      this.handleBatchOperation(action);
                    } else {
                      customMethods();
                    }
                  }}
                >
                  {name}
                </Button>
              )
            );
          })}
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
              style={{ position: 'relative' }}
              pagination={pagination}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={apps || []}
              footer={() => footer}
            />
          </ScrollerX>
          {batchDeleteShow && (
            <BatchDelete
              batchDeleteApps={batchDeleteApps}
              onCancel={this.hideBatchDelete}
              onOk={this.hideBatchDelete}
            />
          )}
          {moveGroupShow && (
            <MoveGroup
              currGroupID={groupId}
              groups={groups}
              onOk={this.handleBatchMove}
              onCancel={this.hideMoveGroup}
            />
          )}
        </Card>
      </div>
    );
  }
}
