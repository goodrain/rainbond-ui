import { Button, Card, Modal, notification, Row, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import DrawerForm from '../DrawerForm';
import InfoConnectModal from '../InfoConnectModal';
import ParameterForm from '../ParameterForm';
import Search from '../Search';

@connect(({ user, global, loading, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  groups: global.groups,
  currentTeam: teamControl.currentTeam,
  currentEnterprise: enterprise.currentEnterprise,
  addHttpLoading: loading.effects['appControl/fetchCertificates']
}))
export default class HttpTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      drawerVisible: this.props.open ? this.props.open : false,
      informationConnect: false,
      outerEnvs: [],
      dataList: [],
      loading: true,
      page_num: 1,
      page_size: 10,
      total: '',
      http_search: '',
      editInfo: '',
      whetherOpenForm: false,
      service_id: '',
      values: '',
      group_name: '',
      appStatusVisable: false,
      record: '',
      parameterVisible: false,
      parameterList: null
    };
  }
  componentWillMount() {
    this.load();
  }
  onPageChange = page_num => {
    this.setState({ page_num, loading: true }, () => {
      this.load();
    });
  };
  load = () => {
    const { appID } = this.props;
    if (appID) {
      this.queryAppHTTPRule();
    } else {
      this.queryTeamHTTPRule();
    }
  };
  queryAppHTTPRule = () => {
    const { dispatch, currentTeam, currentEnterprise, appID } = this.props;
    const { page_num, page_size, http_search } = this.state;
    dispatch({
      type: 'gateWay/queryAppHttpData',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_id: appID,
        team_name: currentTeam.team_name,
        page_num,
        page_size,
        search_conditions: http_search
      },
      callback: data => {
        if (data) {
          this.setState({
            dataList: data.list,
            loading: false,
            total: data.bean.total
          });
        }
      }
    });
  };
  queryTeamHTTPRule = () => {
    const { dispatch, currentTeam } = this.props;
    const { page_num, page_size, http_search } = this.state;
    dispatch({
      type: 'gateWay/queryHttpData',
      payload: {
        team_name: currentTeam.team_name,
        page_num,
        page_size,
        search_conditions: http_search
      },
      callback: data => {
        if (data) {
          this.setState({
            dataList: data.list,
            loading: false,
            total: data.bean.total
          });
        }
      }
    });
  };
  reload() {
    this.setState(
      {
        page_num: 1
      },
      () => {
        this.load();
      }
    );
  }

  handleParameterVisibleClick = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/getParameter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        rule_id: values.http_rule_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = [];
          if (res.bean && res.bean.value) {
            if (
              res.bean.value.set_headers &&
              res.bean.value.set_headers.length > 1
            ) {
              let haveUpgrade = false;
              let haveConnection = false;
              res.bean.value.set_headers.map(item => {
                if (item.key != 'Connection' && item.key != 'Upgrade') {
                  arr.push(item);
                }
                if (item.key == 'Connection') {
                  haveUpgrade = true;
                }
                if (item.key == 'Upgrade') {
                  haveConnection = true;
                }
              });
              res.bean.value.set_headers = arr;
              res.bean.value.WebSocket = haveUpgrade && haveConnection;
              this.setState({
                parameterVisible: values,
                parameterList: res.bean && res.bean.value
              });
            } else {
              res.bean.value.WebSocket = false;
              this.setState({
                parameterVisible: values,
                parameterList: res.bean && res.bean.value
              });
            }
          } else {
            this.setState({ parameterVisible: values, parameterList: null });
          }
        }
      }
    });
  };

  handleClick = () => {
    this.setState({ drawerVisible: true });
  };
  handleClose = () => {
    this.setState({ drawerVisible: false, editInfo: '' });
  };
  handleOk = (values, group_name, obj) => {
    const { dispatch, groups } = this.props;
    const { editInfo } = this.state;
    if (obj && obj.whether_open) {
      values.whether_open = true;
    }
    if (!editInfo) {
      dispatch({
        type: 'gateWay/addHttpStrategy',
        payload: {
          values,
          group_name,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data.bean.is_outer_service == false) {
            this.setState({
              values,
              group_name
            });
            this.whether_open(values, group_name);
            return;
          }
          if (data) {
            notification.success({ message: data.msg_show || '添加成功' });
            this.setState({
              drawerVisible: false,
              editInfo: ''
            });
            this.reload();
          }
        }
      });
    } else {
      dispatch({
        type: 'gateWay/editHttpStrategy',
        payload: {
          values,
          group_name: group_name || editInfo.group_name,
          team_name: globalUtil.getCurrTeamName(),
          http_rule_id: editInfo.http_rule_id
        },
        callback: data => {
          if (data) {
            notification.success({ message: data.msg_show || '编辑成功' });
            this.setState({
              drawerVisible: false,
              editInfo: ''
            });
            this.load();
          }
        }
      });
    }
  };
  whether_open = () => {
    this.setState({
      whetherOpenForm: true
    });
  };
  resolveOk = () => {
    this.setState(
      {
        whetherOpenForm: false
      },
      () => {
        const { values, group_name } = this.state;
        this.handleOk(values, group_name, { whether_open: true });
      }
    );
  };
  handleCancelSecond = () => {
    this.setState({ whetherOpenForm: false });
  };
  handleOkParameter = values => {
    const { dispatch } = this.props;
    const arr = [
      { key: 'Connection', value: '"Upgrade"' },
      { key: 'Upgrade', value: '$http_upgrade' }
    ];
    const value = {
      proxy_buffer_numbers: Number(values.proxy_buffer_numbers),
      proxy_buffer_size: Number(values.proxy_buffer_size),
      proxy_body_size: Number(values.proxy_body_size),
      proxy_connect_timeout: Number(values.proxy_connect_timeout),
      proxy_read_timeout: Number(values.proxy_read_timeout),
      proxy_send_timeout: Number(values.proxy_send_timeout),
      proxy_buffering: values.proxy_buffering ? 'on' : 'off',
      set_headers:
        values.set_headers && values.WebSocket
          ? values.set_headers.length == 1 && values.set_headers[0].key == ''
            ? arr
            : values.set_headers.concat(arr)
          : values.set_headers
          ? values.set_headers
          : values.WebSocket
          ? arr
          : []
    };
    dispatch({
      type: 'gateWay/editParameter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        rule_id: this.state.parameterVisible.http_rule_id,
        value
      },
      callback: data => {
        if (data) {
          this.handleCloseParameter();
        }
      }
    });
  };

  /** 获取连接信息 */
  handleConectInfo = record => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/fetchEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            outerEnvs: data.list || [],
            informationConnect: true
          });
        }
      }
    });
  };

  handleParameterInfo = () => {};

  handleCancel = () => {
    this.setState({ informationConnect: false });
  };
  handleEdit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/queryDetail_http',
      payload: {
        http_rule_id: values.http_rule_id,
        team_name: globalUtil.getCurrTeamName(),
        service_alias: values.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            editInfo: data.bean,
            drawerVisible: true
          });
        }
      }
    });
  };

  handleDelete = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/deleteHttp',
      payload: {
        container_port: values.container_port,
        domain_name: values.domain_name,
        service_id: values.service_id,
        http_rule_id: values.http_rule_id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          notification.success({ message: data ? data.msg_show : '删除成功' });
          this.reload();
        }
      }
    });
  };
  saveForm = form => {
    this.form = form;
    const { editInfo } = this.state;
    if (editInfo) {
      if (editInfo.certificate_id == 0) {
        editInfo.certificate_id = undefined;
      }
    }
  };
  handleSearch = search_conditions => {
    this.setState(
      {
        http_search: search_conditions,
        loading: true,
        page_num: 1
      },
      () => {
        this.load();
      }
    );
  };
  seeHighRoute = values => {
    const title = (
      <ul style={{ padding: '0', margin: '0' }}>
        <li style={{ whiteSpace: 'nowrap' }}>
          <span>请求头：</span>
          <span>{values.domain_heander}</span>
        </li>
        <li style={{ whiteSpace: 'nowrap' }}>
          <span>Cookie：</span>
          <span>{values.domain_cookie}</span>
        </li>
        <li style={{ whiteSpace: 'nowrap' }}>
          <span>Path：</span>
          <span>{values.domain_path}</span>
        </li>
        <li style={{ whiteSpace: 'nowrap' }}>
          <span>权重：</span>
          <span>{values.the_weight}</span>
        </li>
      </ul>
    );
    return (
      <Tooltip
        placement="topLeft"
        title={title}
        trigger="click"
        style={{ maxWidth: '500px' }}
      >
        <a>查看详情</a>
      </Tooltip>
    );
  };

  rowKey = (record, index) => index;

  openService = record => {
    this.props.dispatch({
      type: 'appControl/openPortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias,
        port: record.container_port
      },
      callback: () => {
        this.load();
      }
    });
  };
  justifyAppStatus = record => {
    const winHandler = window.open('', '_blank');
    const that = this;
    this.props.dispatch({
      type: 'gateWay/query_app_status',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data && data.bean.status == 'closed') {
          this.setState({ appStatusVisable: true, record });
          winHandler.close();
        } else if (data && data.bean.status == 'undeploy') {
          notification.warning({
            message: '当前组件属于未部署状态',
            duration: 5
          });
          that.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                record.service_alias
              }`
            )
          );
        } else {
          winHandler.location.href = record.domain_name;
        }
      }
    });
  };

  handleAppStatus = () => {
    const { record } = this.state;
    this.setState({ loading: true });
    this.props.dispatch({
      type: 'gateWay/startApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          notification.success({ message: '启动成功', duration: 5 });
          this.setState({ loading: false, appStatusVisable: false }, () => {
            this.load();
          });
        }
      }
    });
  };
  handleAppStatusClosed = () => {
    this.setState({
      appStatusVisable: false
    });
  };

  handleCloseParameter = () => {
    this.setState({
      parameterVisible: false,
      parameterList: null
    });
  };
  render() {
    const {
      addHttpLoading,
      appID,
      operationPermissions: { isCreate, isEdit, isDelete }
    } = this.props;
    const {
      dataList,
      loading,
      drawerVisible,
      parameterVisible,
      informationConnect,
      outerEnvs,
      total,
      page_num,
      page_size,
      whetherOpenForm,
      appStatusVisable,
      parameterList
    } = this.state;

    const columns = [
      {
        title: '域名',
        dataIndex: 'domain_name',
        key: 'domain_name',
        align: 'left',
        width: 200,
        render: (text, record) => {
          return record.is_outer_service == 1 ? (
            <a
              onClick={() => {
                this.justifyAppStatus(record);
              }}
            >
              {text}
            </a>
          ) : (
            <a href={text} disabled target="blank">
              {text}
            </a>
          );
        }
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        align: 'center',
        width: 100,
        render: text => {
          return text == '0' ? <span>默认</span> : <span>自定义</span>;
        }
      },
      {
        title: '高级路由',
        dataIndex: 'is_senior',
        key: 'is_senior',
        align: 'center',
        width: 100,
        render: (text, record) => {
          return text == '0' ? <span>无</span> : this.seeHighRoute(record);
        }
      },
      {
        title: '证书',
        dataIndex: 'certificate_alias',
        key: 'certificate_alias',
        align: 'center',
        width: 40,
        render: text => {
          return text ? <span>{text}</span> : <span>无</span>;
        }
      },
      {
        title: '应用',
        dataIndex: 'group_name',
        key: 'group_name',
        align: 'center',
        width: 100,
        render: (text, record) => {
          return record.is_outer_service == 0 ? (
            <a href="" disabled>
              {text}
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                record.group_id
              }/`}
            >
              {text}
            </Link>
          );
        }
      },
      {
        title: '组件(端口)',
        dataIndex: 'service_cname',
        key: 'service_cname',
        align: 'center',
        width: 100,
        render: (text, record) => {
          return record.is_outer_service == 0 ? (
            <a href="" disabled>
              {text}
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                record.service_alias
              }/port`}
            >
              {text}({record.container_port})
            </Link>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        align: 'center',
        width: 150,
        render: (data, record) => {
          return record.is_outer_service == 1 ? (
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {isEdit && (
                <a
                  onClick={() => {
                    this.handleParameterVisibleClick(record);
                  }}
                >
                  参数配置
                </a>
              )}
              {/* <a onClick={this.handleConectInfo.bind(this, record)}>连接信息</a> */}
              {isEdit && (
                <a
                  onClick={() => {
                    this.handleEdit(record);
                  }}
                >
                  编辑
                </a>
              )}
              {isDelete && (
                <a
                  onClick={() => {
                    this.handleDelete(record);
                  }}
                >
                  删除
                </a>
              )}
            </div>
          ) : (
            <Tooltip
              placement="topLeft"
              title="请开启对外服务方可操作"
              arrowPointAtCenter
            >
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {isDelete && (
                  <a
                    onClick={() => {
                      this.handleDelete(record);
                    }}
                  >
                    删除
                  </a>
                )}
                {isEdit && (
                  <a
                    onClick={() => {
                      this.openService(record);
                    }}
                  >
                    开启
                  </a>
                )}
              </div>
            </Tooltip>
          );
        }
      }
    ];
    return (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            marginBottom: '20px'
          }}
        >
          <Search onSearch={this.handleSearch} type="HTTP" appID={appID} />
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ position: 'absolute', right: '0' }}
              onClick={this.handleClick}
              loading={addHttpLoading}
            >
              添加策略
            </Button>
          )}
        </Row>
        <Card bodyStyle={{ padding: '0' }}>
          <Table
            dataSource={dataList}
            columns={columns}
            loading={loading}
            size="default"
            rowKey={this.rowKey}
            pagination={{
              total,
              page_num,
              pageSize: page_size,
              onChange: this.onPageChange,
              current: page_num
            }}
          />
        </Card>
        {drawerVisible && (
          <DrawerForm
            groups={this.props.groups}
            visible={drawerVisible}
            onClose={this.handleClose}
            onOk={this.handleOk}
            ref={this.saveForm}
            appID={appID}
            editInfo={this.state.editInfo}
          />
        )}
        {parameterVisible && (
          <ParameterForm
            onOk={this.handleOkParameter}
            onClose={this.handleCloseParameter}
            visible={parameterVisible}
            editInfo={parameterList}
          />
        )}
        {informationConnect && (
          <InfoConnectModal
            visible={informationConnect}
            dataSource={outerEnvs}
            onCancel={this.handleCancel}
          />
        )}
        {whetherOpenForm && (
          <Modal
            title="确认要添加吗？"
            visible={this.state.whetherOpenForm}
            onOk={this.handleOk}
            onCancel={this.handleCancelSecond}
            footer={[
              <Button type="primary" size="small" onClick={this.resolveOk}>
                确定
              </Button>
            ]}
            zIndex={9999}
          >
            <p>您选择的组件未开启外部访问，是否自动打开并添加此访问策略？</p>
          </Modal>
        )}
        {appStatusVisable && (
          <Modal
            title="友情提示"
            visible={appStatusVisable}
            onOk={this.handleAppStatus}
            onCancel={this.handleAppStatusClosed}
          >
            <p>当前组件处于关闭状态，启动后方可访问，是否启动组件？</p>
          </Modal>
        )}
      </div>
    );
  }
}
