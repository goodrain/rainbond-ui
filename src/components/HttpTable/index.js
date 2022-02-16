/* eslint-disable react/no-unused-state */
/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import ConfirmModal from '@/components/ConfirmModal';
import {
  Button,
  Card,
  Icon,
  Modal,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import globalUtil from '../../utils/global';
import DrawerForm from '../DrawerForm';
import InfoConnectModal from '../InfoConnectModal';
import ParameterForm from '../ParameterForm';
import Search from '../Search';
import styles from './index.less';

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
      toDeleteHttp: false,
      deleteLoading: false,
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
      parameterInfo: null,
      gateWayInfo: null
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
          if (res.bean && res.bean.value) {
            this.setState({
              parameterVisible: values,
              parameterInfo: res.bean && res.bean.value
            });
          } else {
            this.setState({ parameterVisible: values, parameterInfo: null });
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
  handleOk = (values, group_name, routingConfiguration, obj) => {
    const { dispatch, groups } = this.props;
    const { editInfo, gateWayInfo } = this.state;
    // 新增网关策略
    if (!editInfo) {
      dispatch({
        type: 'gateWay/addHttpStrategy',
        payload: {
          values,
          group_name,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data.bean.is_outer_service === false) {
            this.setState({
              values,
              group_name
            });
            this.whether_open(values, group_name);
            return;
          }
          if (data) {
            notification.success({
              message: data.msg_show || '添加成功'
            });
            this.setState({
              drawerVisible: false,
              editInfo: ''
            });
            this.reload();
          }
        }
      });
    } else {
      // 编辑网关策略
      dispatch({
        type: 'gateWay/queryDetail_http',
        payload: {
          http_rule_id: gateWayInfo.http_rule_id,
          team_name: globalUtil.getCurrTeamName(),
          service_alias: gateWayInfo.service_alias
        },
        callback: data => {
          if (data) {
            // 如果没有打开高级路由参数,
            if (!values.rule_extensions_round) {
              values.path_rewrite = data.bean.path_rewrite || '';
              values.rewrites = data.bean.rewrites || [];
              values.domain_cookie = data.bean.domain_cookie || '';
              values.domain_heander = data.bean.domain_heander || '';
              values.the_weight = data.bean.the_weight || '';
              values.certificate_id = data.bean.certificate_id || '';
            }
            if (obj && obj.whether_open) {
              values.whether_open = true;
            }

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
                  notification.success({
                    message: data.msg_show || '编辑成功'
                  });
                  this.setState({
                    drawerVisible: false,
                    editInfo: ''
                  });
                  this.load();
                }
              }
            });
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
    const value = {
      proxy_buffer_numbers: Number(values.proxy_buffer_numbers),
      proxy_buffer_size: Number(values.proxy_buffer_size),
      proxy_body_size: Number(values.proxy_body_size),
      proxy_connect_timeout: Number(values.proxy_connect_timeout),
      proxy_read_timeout: Number(values.proxy_read_timeout),
      proxy_send_timeout: Number(values.proxy_send_timeout),
      proxy_buffering: values.proxy_buffering ? 'on' : 'off',
      WebSocket: values.WebSocket,
      set_headers: values.set_headers
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
    this.setState({
      gateWayInfo: values
    });
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
  handleToDeleteHttp = val => {
    this.setState({
      toDeleteHttp: val
    });
  };
  handleDeleteLoading = deleteLoading => {
    this.setState({
      deleteLoading
    });
  };
  handleDelete = () => {
    this.handleDeleteLoading(true);
    const { dispatch } = this.props;
    const { toDeleteHttp: values } = this.state;
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
        notification.success({
          message: (data && data.msg_show) || '删除成功'
        });
        this.handleToDeleteHttp(false);
        this.handleDeleteLoading(false);
        this.reload();
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
    const domainHeander = values.domain_heander;
    const domainCookie = values.domain_cookie;
    const domainPath = values.domain_path;
    const setArr = [
      {
        name: '请求头',
        val: domainHeander
      },
      {
        name: 'Cookie',
        val: domainCookie
      },
      {
        name: 'Path',
        val: domainPath
      },
      {
        name: '权重',
        val: values.the_weight
      }
    ];
    const title = (
      <ul className={styles.routings}>
        {setArr.map(item => {
          const { name, val } = item;
          return (
            <li>
              <div>{name}：</div>
              <div>{val || '-'}</div>
              {val && (
                <CopyToClipboard
                  text={val}
                  onCopy={() => notification.success({ message: '复制成功' })}
                >
                  <Icon type="copy" />
                </CopyToClipboard>
              )}
            </li>
          );
        })}
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
      parameterInfo: null
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
      toDeleteHttp,
      deleteLoading,
      page_num,
      page_size,
      whetherOpenForm,
      appStatusVisable,
      parameterInfo
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
        width: 60,
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
                    this.handleToDeleteHttp(record);
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
                      this.handleToDeleteHttp(record);
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
            editInfo={parameterInfo}
          />
        )}
        {toDeleteHttp && (
          <ConfirmModal
            onOk={this.handleDelete}
            loading={deleteLoading}
            title="删除策略"
            subDesc="此操作不可恢复"
            desc="确定要删除此策略吗?"
            onCancel={() => {
              this.handleToDeleteHttp(false);
            }}
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
