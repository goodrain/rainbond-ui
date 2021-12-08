import {
  Affix,
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  notification,
  Radio,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddPort from '../../components/AddPort';
import AddRelation from '../../components/AddRelation';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import {
  addMnt,
  batchAddRelationedApp,
  getMnt,
  getRelationedApp,
  removeRelationedApp
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from './setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
@Form.create()
class BaseInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryList: [
        {
          text: '64M',
          value: 64
        },
        {
          text: '128M',
          value: 128
        },
        {
          text: '256M',
          value: 256
        },
        {
          text: '512M',
          value: 512
        },
        {
          text: '1G',
          value: 1024
        },
        {
          text: '2G',
          value: 1024 * 2
        },
        {
          text: '4G',
          value: 1024 * 4
        },
        {
          text: '8G',
          value: 1024 * 8
        },
        {
          text: '16G',
          value: 1024 * 16
        }
      ]
    };
  }
  handleSubmit = () => {
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  render() {
    const { appDetail, form } = this.props;
    const { getFieldDecorator } = form;
    const {
      extend_method: extendMethod,
      min_memory: minMemory,
      min_cpu: minCpu
    } = appDetail.service;
    const list = this.state.memoryList;

    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px'
    };
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    return (
      <Card
        title="基本信息"
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item {...formItemLayout} label="组件类型">
          {getFieldDecorator('extend_method', {
            initialValue: extendMethod || 'stateless_multiple',
            rules: [
              {
                required: true,
                message: '请选择组件类型'
              }
            ]
          })(
            <RadioGroup>
              {globalUtil.getSupportComponentTyps().map(item => {
                return (
                  <Radio key={item.type} style={radioStyle} value={item.type}>
                    {item.name}({item.desc}）
                  </Radio>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="内存">
          {getFieldDecorator('min_memory', {
            initialValue: minMemory || 0,
            rules: [
              {
                required: true,
                message: '请选择内存'
              }
            ]
          })(
            <RadioGroup>
              <RadioButton key={0} value={0}>
                不限制
              </RadioButton>
              {minMemory < list[0].value && minMemory != 0 ? (
                <RadioButton value={minMemory}>{minMemory}M</RadioButton>
              ) : null}
              {list.map((item, index) => {
                return (
                  <RadioButton key={index} value={item.value}>
                    {item.text}
                  </RadioButton>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="CPU">
          {getFieldDecorator('min_cpu', {
            initialValue: minCpu || 0,
            rules: [
              {
                required: true,
                message: '请输入CPU'
              },
              {
                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                message: '只允许输入整数'
              }
            ]
          })(
            <Input
              style={{ width: '200px' }}
              type="number"
              min={0}
              addonAfter="m"
              placeholder="请输入CPU"
            />
          )}
          <div style={{ color: '#999999', fontSize: '12px' }}>
            CPU分配额0为不限制，1000m=1core。
          </div>
        </Form.Item>
        <Row>
          <Col span="5" />
          <Col span="19">
            <Button onClick={this.handleSubmit} type="primary">
              确认修改
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderDeploy extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: ''
    };
  }
  componentDidMount() {
    this.getRuntimeInfo();
  }

  getRuntimeInfo = () => {
    this.props.dispatch({
      type: 'appControl/getRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({ runtimeInfo: data.bean ? data.bean : {} });
        }
      }
    });
  };
  handleEditRuntime = (build_env_dict = {}) => {
    this.props.dispatch({
      type: 'appControl/editRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        build_env_dict
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '修改成功' });
          this.getRuntimeInfo();
        }
      }
    });
  };
  handleEditInfo = (val = {}) => {
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ...val
      },
      callback: data => {
        if (data) {
          this.props.updateDetail();
          notification.success({ message: '更新成功' });
        }
      }
    });
  };
  render() {
    const {
      visible,
      appDetail,
      componentPermissions: { isDeploytype, isSource }
    } = this.props;
    const { runtimeInfo } = this.state;
    if (!runtimeInfo) return null;
    const language = appUtil.getLanguage(appDetail);

    return (
      <div
        style={{
          display: visible ? 'block' : 'none'
        }}
      >
        {!isDeploytype && !isSource && <NoPermTip />}
        {isDeploytype && (
          <BaseInfo appDetail={appDetail} onSubmit={this.handleEditInfo} />
        )}

        {language && runtimeInfo && isSource && (
          <CodeBuildConfig
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            language={language}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}
      </div>
    );
  }
}
// 存储管理
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class Mnt extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showAddRelation: false,
      selfPathList: [],
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      volumes: [],
      volumeOpts: []
    };
  }

  componentDidMount() {
    this.fetchVolumeOpts();
    this.loadMntList();
    this.fetchVolumes();
  }
  fetchVolumes = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        is_config: false
      },
      callback: data => {
        if (data) {
          this.setState({
            volumes: data.list || []
          });
        }
      }
    });
  };
  fetchVolumeOpts = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumeOpts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            volumeOpts: data.list || []
          });
        }
      }
    });
  };
  loadMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      page: 1,
      page_size: 1000
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || []
        });
      }
    });
  };
  handleAddVar = () => {
    this.setState({
      showAddVar: {
        new: true
      }
    });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: 'appControl/addVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ...vals
      },
      callback: () => {
        this.fetchVolumes();
        this.handleCancelAddVar();
      }
    });
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = mnts => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        this.loadMntList();
      }
    });
  };
  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  handleDeleteVolume = () => {
    this.props.dispatch({
      type: 'appControl/deleteVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
      }
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: 'appControl/deleteMnt',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };
  getVolumeTypeShowName = volume_type => {
    const { volumeOpts } = this.state;
    return getVolumeTypeShowName(volumeOpts, volume_type);
  };
  render() {
    const { mntList } = this.state;
    const { volumes } = this.state;
    const columns = [
      {
        title: '存储名称',
        dataIndex: 'volume_name'
      },
      {
        title: '挂载路径',
        dataIndex: 'volume_path'
      },
      {
        title: '存储类型',
        dataIndex: 'volume_type',
        render: (text, record) => {
          return <span>{this.getVolumeTypeShowName(text)}</span>;
        }
      },
      {
        title: '存储容量',
        dataIndex: 'volume_capacity',
        render: (text, record) => {
          if (text == 0) {
            return <span>不限制</span>;
          }
          return <span>{text}GB</span>;
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (text, record) => {
          if (text == 'not_bound') {
            return <span style={{ color: 'red' }}>未挂载</span>;
          }
          return <span style={{ color: 'green' }}>已挂载</span>;
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (val, data) => {
          return (
            <a
              onClick={() => {
                this.onDeleteVolume(data);
              }}
              href="javascript:;"
            >
              删除
            </a>
          );
        }
      }
    ];
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 16
          }}
          title="存储设置"
          extra={
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />
              添加存储
            </Button>
          }
        >
          <Table pagination={false} dataSource={volumes} columns={columns} />
          <div
            style={{
              marginTop: 10,
              textAlign: 'right'
            }}
          />
        </Card>
        <Card
          style={{
            marginBottom: 16
          }}
          title="共享存储"
          extra={
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              挂载共享存储
            </Button>
          }
        >
          <Table
            pagination={false}
            columns={[
              {
                title: '本地挂载路径',
                dataIndex: 'local_vol_path',
                key: '1',
                width: '20%',
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word'
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: '目标存储名称',
                dataIndex: 'dep_vol_name',
                key: '2',
                width: '15%',
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word'
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: '目标挂载路径',
                dataIndex: 'dep_vol_path',
                key: '3',
                width: '15%',
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word'
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: '目标存储类型',
                dataIndex: 'dep_vol_type',
                key: '4',
                width: '10%',
                render: (text, record) => {
                  return <span>{this.getVolumeTypeShowName(text)}</span>;
                }
              },
              {
                title: '目标所属组件',
                dataIndex: 'dep_app_name',
                key: '5',
                width: '10%',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.dep_app_alias
                      }/overview`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: '目标组件所属应用',
                dataIndex: 'dep_app_group',
                key: '6',
                width: '15%',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.dep_group_id
                      }`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: '操作',
                dataIndex: 'action',
                key: '7',
                width: '15%',
                render: (val, data) => {
                  return (
                    <a
                      onClick={() => {
                        this.onDeleteMnt(data);
                      }}
                      href="javascript:;"
                    >
                      取消挂载
                    </a>
                  );
                }
              }
            ]}
            dataSource={mntList}
          />
        </Card>
        {this.state.showAddVar && (
          <AddOrEditVolume
            volumeOpts={this.state.volumeOpts}
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
          />
        )}
        {this.state.showAddRelation && (
          <AddRelationMnt
            appAlias={this.props.appDetail.service.service_alias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载"
            desc="确定要取消此挂载目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除存储目录"
            desc="确定要删除此存储目录吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
      </Fragment>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class Relation extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddRelation: false,
      linkList: [],
      relationList: [],
      viewRelationInfo: null
    };
  }
  componentDidMount() {
    this.loadRelationedApp();
  }
  loadRelationedApp = () => {
    getRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias
    }).then(data => {
      if (data) {
        this.setState({
          relationList: data.list || []
        });
      }
    });
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddRelation = ids => {
    batchAddRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      dep_service_ids: ids
    }).then(data => {
      if (data) {
        notification.info({ message: '需要更新才能生效' });
        this.loadRelationedApp();
        this.handleCancelAddRelation();
      }
    });
  };
  handleRemoveRelationed = app => {
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      dep_service_id: app.service_id
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };
  onViewRelationInfo = data => {
    this.setState({ viewRelationInfo: data });
  };
  cancelViewRelationInfo = data => {
    this.setState({ viewRelationInfo: null });
  };
  render() {
    const { linkList, relationList } = this.state;
    return (
      <Card title="组件依赖">
        <Table
          pagination={false}
          columns={[
            {
              title: '组件名称',
              dataIndex: 'service_cname',
              render: (val, data) => {
                return (
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                      data.service_alias
                    }/overview`}
                  >
                    {val}
                  </Link>
                );
              }
            },
            {
              title: '所属组',
              dataIndex: 'group_name'
            },
            {
              title: '操作',
              dataIndex: 'var',
              render: (val, data) => {
                return (
                  <Fragment>
                    <a
                      onClick={() => this.onViewRelationInfo(data)}
                      href="javascript:;"
                      style={{
                        marginRight: 8
                      }}
                    >
                      查看链接信息
                    </a>
                    <a
                      onClick={() => {
                        this.handleRemoveRelationed(data);
                      }}
                      href="javascript:;"
                    >
                      取消依赖
                    </a>
                  </Fragment>
                );
              }
            }
          ]}
          dataSource={relationList}
        />
        <div
          style={{
            marginTop: 10,
            textAlign: 'right'
          }}
        >
          <Button onClick={this.showAddRelation}>
            <Icon type="plus" />
            添加依赖
          </Button>
        </div>
        {this.state.showAddRelation && (
          <AddRelation
            appAlias={this.props.appDetail.service.service_alias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
        {this.state.viewRelationInfo && (
          <ViewRelationInfo
            appAlias={this.state.viewRelationInfo.service_alias}
            onCancel={this.cancelViewRelationInfo}
          />
        )}
      </Card>
    );
  }
}
// 端口
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class Ports extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showEditAlias: null,
      showDeleteDomain: null,
      showDeletePort: null,
      showDeleteDomain: null,
      showAddPort: false,
      ports: []
    };
  }
  componentDidMount() {
    this.fetchPorts();
  }
  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        this.setState({
          ports: (data && data.list) || []
        });
      }
    });
  };
  handleSubmitProtocol = (protocol, port, callback) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/changeProtocol',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port,
        protocol
      },
      callback: () => {
        this.fetchPorts();
        callback();
      }
    });
  };
  showEditAlias = port => {
    this.setState({ showEditAlias: port });
  };
  hideEditAlias = () => {
    this.setState({ showEditAlias: null });
  };
  handleEditAlias = vals => {
    this.props.dispatch({
      type: 'appControl/editPortAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: this.state.showEditAlias.container_port,
        port_alias: vals.alias
      },
      callback: () => {
        this.fetchPorts();
        this.hideEditAlias();
      }
    });
  };
  handleOpenInner = port => {
    this.props.dispatch({
      type: 'appControl/openPortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  onCloseInner = port => {
    this.props.dispatch({
      type: 'appControl/closePortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  handleOpenOuter = port => {
    this.props.dispatch({
      type: 'appControl/openPortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  onCloseOuter = port => {
    this.props.dispatch({
      type: 'appControl/closePortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  handleDeletePort = port => {
    this.setState({ showDeletePort: port });
  };
  cancalDeletePort = () => {
    this.setState({ showDeletePort: null });
  };
  handleSubmitDeletePort = () => {
    this.props.dispatch({
      type: 'appControl/deletePort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: this.state.showDeletePort
      },
      callback: () => {
        this.cancalDeletePort();
        this.fetchPorts();
      }
    });
  };
  showAddPort = () => {
    this.setState({ showAddPort: true });
  };

  onCancelAddPort = () => {
    this.setState({ showAddPort: false });
  };
  handleAddPort = val => {
    this.props.dispatch({
      type: 'appControl/addPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        protocol: val.protocol,
        port: val.port
      },
      callback: () => {
        this.onCancelAddPort();
        this.fetchPorts();
      }
    });
  };
  render() {
    const ports = this.state.ports || [];
    const isImageApp = appUtil.isImageApp(this.props.appDetail);
    const isDockerfile = appUtil.isDockerfile(this.props.appDetail);
    return (
      <Card
        title="端口管理"
        style={{
          marginBottom: 16
        }}
      >
        <div className={styles.ports}>
          {ports.map(port => {
            return (
              <Port
                key={port.ID}
                showOuterUrl={false}
                showDomain={false}
                port={port}
                onDelete={this.handleDeletePort}
                onEditAlias={this.showEditAlias}
                onSubmitProtocol={this.handleSubmitProtocol}
                onOpenInner={this.handleOpenInner}
                onCloseInner={this.onCloseInner}
                onOpenOuter={this.handleOpenOuter}
                onCloseOuter={this.onCloseOuter}
              />
            );
          })}
          {!ports.length ? (
            <p
              style={{
                textAlign: 'center'
              }}
            >
              暂无端口
            </p>
          ) : (
            ''
          )}
        </div>
        <div
          style={{
            textAlign: 'right',
            paddingTop: 20
          }}
        >
          <Button type="default" onClick={this.showAddPort}>
            <Icon type="plus" />
            添加端口
          </Button>
        </div>
        {this.state.showEditAlias && (
          <EditPortAlias
            port={this.state.showEditAlias}
            onOk={this.handleEditAlias}
            onCancel={this.hideEditAlias}
          />
        )}
        {this.state.showDeletePort && (
          <ConfirmModal
            title="端口删除"
            desc="确定要删除此端口吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleSubmitDeletePort}
            onCancel={this.cancalDeletePort}
          />
        )}
        {this.state.showDeleteDomain && (
          <ConfirmModal
            title="域名解绑"
            desc="确定要解绑此域名吗？"
            subDesc={this.state.showDeleteDomain.domain}
            onOk={this.handleSubmitDeleteDomain}
            onCancel={this.cancalDeleteDomain}
          />
        )}
        {this.state.showAddPort && (
          <AddPort
            isImageApp={isImageApp}
            isDockerfile={isDockerfile}
            onCancel={this.onCancelAddPort}
            onOk={this.handleAddPort}
          />
        )}
      </Card>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderProperty extends PureComponent {
  render() {
    const {
      appDetail,
      visible,
      componentPermissions: { isEnv, isRely, isStorage, isPort }
    } = this.props;
    return (
      <div
        style={{
          display: visible ? 'block' : 'none'
        }}
      >
        {!isPort && !isEnv && !isStorage && !isRely && <NoPermTip />}

        {isPort && <Ports appDetail={appDetail} />}
        {isEnv && (
          <EnvironmentVariable
            title="环境变量"
            type="Inner"
            appAlias={appDetail.service.service_alias}
          />
        )}
        {isStorage && <Mnt appDetail={appDetail} />}
        {isRely && <Relation appDetail={appDetail} />}
      </div>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  }),
  null,
  null,
  {
    withRef: true
  }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      componentPermissions: this.handlePermissions('queryComponentInfo'),
      type: 'property'
    };
  }
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleType = type => {
    if (this.state.type !== type) {
      this.setState({ type });
    }
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  render() {
    const { appDetail } = this.props;
    const { type, componentPermissions } = this.state;

    return (
      <div>
        <div
          style={{
            overflow: 'hidden'
          }}
        >
          <div className={styles.typeBtnWrap}>
            <Affix offsetTop={0}>
              <div>
                <span
                  className={`${styles.typeBtn} ${
                    type === 'property' ? styles.active : ''
                  }`}
                  onClick={() => {
                    this.handleType('property');
                  }}
                >
                  基本属性
                  <Icon type="right" />
                </span>
                <span
                  className={`${styles.typeBtn} ${
                    type === 'deploy' ? styles.active : ''
                  }`}
                  onClick={() => {
                    this.handleType('deploy');
                  }}
                >
                  部署属性
                  <Icon type="right" />
                </span>
              </div>
            </Affix>
          </div>

          <div
            className={styles.content}
            style={{
              overflow: 'hidden',
              marginBottom: 90
            }}
          >
            <RenderDeploy
              updateDetail={this.props.updateDetail}
              appDetail={appDetail}
              visible={type === 'deploy'}
              componentPermissions={componentPermissions}
            />
            <RenderProperty
              key={appDetail.service.extend_method}
              appDetail={appDetail}
              visible={type !== 'deploy'}
              componentPermissions={componentPermissions}
            />
          </div>
        </div>
      </div>
    );
  }
}
