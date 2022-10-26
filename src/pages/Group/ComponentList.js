/* eslint-disable no-nested-ternary */
/* eslint-disable prettier/prettier */
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Form,
  Icon,
  Input,
  Menu,
  notification,
  Popconfirm,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import moment from 'moment';
import React, { Component, Fragment } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import MoveGroup from '../../components/AppMoveGroup';
import BatchDelete from '../../components/BatchDelete';
import { batchOperation } from '../../services/app';
import appUtil from '../../utils/app';
import cookie from '@/utils/cookie';
import globalUtil from '../../utils/global';
import styles from './ComponentList.less';

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
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
      batchDeleteShow: false,
      operationState: false,
      query: '',
      changeQuery: '',
      tableDataLoading: true,
      sortValue: 1,
      orderValue: 'descend',
      language: cookie.get('language') === 'zh-CN' ? true : false
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
      type: 'application/clearApps'
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
    if (this.timer) {
      clearInterval(this.timer);
    }
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
    const { current, pageSize, query, sortValue, orderValue} = this.state;
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: current,
        page_size: pageSize,
        query,
        sort: sortValue,
        order: orderValue
      },
      callback: data => {
        if (data && data.status_code === 200) {
          this.setState({
            apps: data.list || [],
            total: data.total || 0,
            tableDataLoading: false
          });
        }
      }
    });
  };

  deleteData = () => {
    const { dispatch, groupId } = this.props;
    const { current, pageSize, query } = this.state;
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: groupId,
        page: current,
        page_size: pageSize,
        query
      },
      callback: data => {
        if (data && data.status_code === 200) {
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
      putReStart: formatMessage({id:'notification.hint.component.putReStart'}),
      putStart: formatMessage({id:'notification.hint.component.putStart'}),
      putStop: formatMessage({id:'notification.hint.component.putStop'})
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

  handleOperationState = operationState => {
    this.setState({ operationState });
  };
  handleBatchOperation = action => {
    const ids = this.getSelectedKeys();
    const map = {
      stop: formatMessage({id:'notification.hint.component.putBatchStop'}),
      start: formatMessage({id:'notification.hint.component.putBatchStart'}),
      restart: formatMessage({id:'notification.hint.component.putBatchRestart'}),
      upgrade: formatMessage({id:'notification.hint.component.putBatchUpgrade'}),
      deploy: formatMessage({id:'notification.hint.component.putBatchDeploy'})
    };
    batchOperation({
      action,
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids && ids.join(',')
    }).then(data => {
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
            message: formatMessage({id:'notification.hint.component.putBatchMove'})
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
  // 是否可以批量操作
  CanBatchOperation = () => {
    const arr = this.getSelected();
    return arr && arr.length > 0;
  };
  handelChange = e => {
    this.setState({
      changeQuery: e.target.value
    });
  };

  handleSearch = () => {
    this.setState(
      {
        tableDataLoading: true,
        current: 1,
        query: this.state.changeQuery
      },
      () => {
        this.updateApp();
      }
    );
  };
  //列表点击排序
  handleTableChange = (pagination, filters, sorter) => {
    if(sorter && sorter.field && sorter.field == 'status_cn'){
      this.setState({
        sortValue: 1,
        orderValue: sorter.order,
        tableDataLoading: true
      },()=>{
        this.loadComponents()
      })
    }else if(sorter && sorter.field && sorter.field == 'min_memory'){
      this.setState({
        sortValue: 2,
        orderValue: sorter.order,
        tableDataLoading: true
      },()=>{
        this.loadComponents()
      })
    }else if(sorter && sorter.field && sorter.field == 'update_time'){
      this.setState({
        sortValue: 3,
        orderValue: sorter.order,
        tableDataLoading: true
      },()=>{
        this.loadComponents()
      })
    }else{
      this.setState({
        sortValue: 1,
        orderValue: 'descend',
        tableDataLoading: true
      },()=>{
        this.loadComponents()
      })
    }
  }
  titleCase = (str) => {
    str = str.toLowerCase();
    var attr = str.split(" ");
    for(var i =0;i<attr.length;i++){
       attr[i]=attr[i].substring(0,1).toUpperCase() + attr[i].substring(1);
    }
    return attr.join(" ");
  }
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
      batchMoveLoading,
      reStartLoading,
      startLoading,
      stopLoading,
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
      operationState,
      tableDataLoading,
      language
    } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };
    const pagination = {
      pageSize,
      current,
      total,
      showSizeChanger: true,
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
      },
      // eslint-disable-next-line no-shadow
      onShowSizeChange: (page, pageSize) => {
        this.setState(
          {
            current: page,
            pageSize
          },
          () => {
            this.loadComponents();
          }
        );
      }
    };
    const columns = [
      {
        title: formatMessage({id:'appOverview.list.table.btn.name'}),
        dataIndex: 'service_cname',
        render: (val, data) => (
          <Link
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              data.service_alias
            }/overview`}
          >
            {' '}
            {data.service_source && data.service_source === 'third_party' ? (
              <span>
                <Tooltip title={formatMessage({id:'appOverview.list.table.btn.third_party'})}>
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
        title: formatMessage({id:'appOverview.list.table.memory'}),
        dataIndex: 'min_memory',
        sorter: true,
        render: (val, data) => (
          <span>
            {data.service_source && data.service_source === 'third_party'
              ? '-'
              : `${val}MB`}
          </span>
        )
      },
      {
        title: formatMessage({id:'appOverview.list.table.status'}),
        dataIndex: language ?'status_cn' : 'status',
        sorter: true,
        render: (val, data) =>
          data.service_source && data.service_source === 'third_party' ? (
            <Badge
              status={appUtil.appStatusToBadgeStatus(data.status)}
              text={
                val === '运行中'
                  ? this.titleCase(formatMessage({id:'status.component.health'}))
                  : val === '运行异常'
                  ? this.titleCase(formatMessage({id:'status.component.not_health'}))
                  : val === '已关闭'
                  ? this.titleCase(formatMessage({id:'status.component.off_line'}))
                  : this.titleCase(val)
              }
            />
          ) : (
            <Badge
              status={appUtil.appStatusToBadgeStatus(data.status)}
              text={this.titleCase(val)}
            />
          )
      },
      {
        title: formatMessage({id:'appOverview.list.table.updateTime'}),
        dataIndex: 'update_time',
        sorter: true,
        render: val =>
          moment(val)
            .locale('zh-cn')
            .format('YYYY-MM-DD HH:mm:ss')
      },
      {
        title: formatMessage({id:'appOverview.list.table.operate'}),
        dataIndex: 'action',
        render: (val, data) => (
          <Fragment>
            {data.service_source && data.service_source !== 'third_party' && (
              <Fragment>
                {isRestart && (
                  <Popconfirm
                    title={formatMessage({id:'confirmModal.component.restart.title'})}
                    onConfirm={() => {
                      this.handleOperation('putReStart', data);
                    }}
                  >
                    <Button type="link">
                      {formatMessage({id:'appOverview.list.table.restart'})}
                    </Button>
                  </Popconfirm>
                )}
                {isStart && (
                  <Popconfirm
                    title={formatMessage({id:'confirmModal.component.start.title'})}
                    onConfirm={() => {
                      this.handleOperation('putStart', data);
                    }}
                  >
                    <Button type="link">
                      {formatMessage({id:'appOverview.list.table.start'})}
                    </Button>
                  </Popconfirm>
                )}
                {isStop && (
                  <Popconfirm
                    title={formatMessage({id:'confirmModal.component.stop.title'})}
                    onConfirm={() => {
                      this.handleOperation('putStop', data);
                    }}
                  >
                    <Button type="link">
                      {formatMessage({id:'appOverview.list.table.stop'})}
                    </Button>
                  </Popconfirm>
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
        name: formatMessage({id:'appOverview.list.table.start'}),
        action: 'deploy'
      },
      {
        permissions: isUpdate,
        name: formatMessage({id:'appOverview.btn.update'}),
        action: 'upgrade'
      },
      {
        permissions: isRestart,
        name: formatMessage({id:'appOverview.list.table.restart'}),
        action: 'restart'
      },
      {
        permissions: isStop,
        name: formatMessage({id:'appOverview.list.table.stop'}),
        action: 'stop'
      },
      {
        permissions: isStart,
        name: formatMessage({id:'appOverview.list.table.start'}),
        action: 'start'
      },
      {
        permissions: isEdit,
        name: formatMessage({id:'appOverview.list.table.move'}),
        action: false,
        customMethods: this.showBatchMove
      },
      {
        permissions: isDelete,
        name: formatMessage({id:'appOverview.list.table.delete'}),
        action: false,
        customMethods: this.handleBatchDelete
      }
    ];

    const menu = (
      <Menu>
        {customBox.map(item => {
          const { permissions, name, action, customMethods } = item;
          return (
            permissions && (
              <Menu.Item style={{ textAlign: 'center' }}>
                <a
                  loading={operationState === action ? operationState : false}
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
                </a>
              </Menu.Item>
            )
          );
        })}
      </Menu>
    );
    const footer = (
      <div className={styles.tableList}>
        <div className={styles.tableListOperator}>
          <Dropdown
            overlay={menu}
            trigger={['click']}
            placement="topCenter"
            disabled={!this.CanBatchOperation()}
          >
            <Button style={{ padding: '8px 16px'}}>
              {formatMessage({id:'appOverview.list.table.batchOperate'})} <Icon type="down" />
            </Button>
          </Dropdown>
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
          <Form layout="inline" style={{ marginBottom: '10px' }}>
            <Form.Item>
              <Input
                style={{ width: 250 }}
                placeholder={formatMessage({id:'appOverview.list.input.seach.hint'})}
                onChange={this.handelChange}
                onPressEnter={this.handleSearch}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={this.handleSearch} icon="search">
              {formatMessage({id:'appOverview.list.btn.seach'})}
              </Button>
            </Form.Item>
          </Form>
          <Table
            pagination={pagination}
            rowSelection={rowSelection}
            onChange={this.handleTableChange} 
            columns={columns}
            loading={
              reStartLoading || startLoading || stopLoading || tableDataLoading
            }
            dataSource={apps || []}
            footer={() => footer}
          />
          {batchDeleteShow && (
            <BatchDelete
              batchDeleteApps={batchDeleteApps}
              onCancel={this.hideBatchDelete}
              onOk={this.hideBatchDelete}
            />
          )}
          {moveGroupShow && (
            <MoveGroup
              loading={batchMoveLoading}
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
