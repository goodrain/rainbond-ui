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
  Tooltip,
  Select,
  AutoComplete,
  Collapse
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddPort from '../../components/AddPort';
import AddRelation from '../../components/AddRelation';
import AddRelationMnt from '../../components/AddRelationMnt';
import AddStorage from '../../components/AddStorage';
import ScrollerX from '../../components/ScrollerX';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ViewRelationInfo from '../../components/ViewRelationInfo';
import CustomFooter from "../../layouts/CustomFooter";
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
import cookie from '@/utils/cookie';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from './setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option, OptGroup } = Select;
const { Panel } = Collapse;

// 端口
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
@Form.create()
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
      <div>
         <div
          style={{
            textAlign: 'right',
            marginBottom: 12
          }}
        >
          <Button type="default" onClick={this.showAddPort}>
            <Icon type="plus" />
            {formatMessage({ id: 'button.add_port' })}
          </Button>
        </div>
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
              {formatMessage({ id: 'componentCheck.advanced.setup.port_manage.btn.null' })}
            </p>
          ) : (
            ''
          )}
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
            title={formatMessage({ id: 'confirmModal.port.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.port.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            onOk={this.handleSubmitDeletePort}
            onCancel={this.cancalDeletePort}
          />
        )}
        {this.state.showDeleteDomain && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.domain.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.domain.desc' })}
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
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_name' }),
        dataIndex: 'volume_name'
      },
      {
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_path' }),
        dataIndex: 'volume_path'
      },
      {
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_type' }),
        dataIndex: 'volume_type',
        render: (text, record) => {
          return <span>{this.getVolumeTypeShowName(text)}</span>;
        }
      },
      {
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_capacity' }),
        dataIndex: 'volume_capacity',
        render: (text, record) => {
          if (text == 0) {
            return <span>{formatMessage({ id: 'appOverview.no_limit' })}</span>;
          }
          return <span>{text}GB</span>;
        }
      },
      {
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.status' }),
        dataIndex: 'status',
        render: (text, record) => {
          if (text == 'not_bound') {
            return <span style={{ color: 'red' }}>{formatMessage({ id: 'status.not_mount' })}</span>;
          }
          return <span style={{ color: 'green' }}>{formatMessage({ id: 'status.mounted' })}</span>;
        }
      },
      {
        title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.action' }),
        dataIndex: 'action',
        render: (val, data) => {
          return (
            <a
              onClick={() => {
                this.onDeleteVolume(data);
              }}
              href="javascript:;"
            >
              {formatMessage({ id: 'button.delete' })}
            </a>
          );
        }
      }
    ];
    return (
      <Fragment>
          <div
            style={{
              textAlign: 'right',
              marginBottom: 12
            }}
          >
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              {formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.btn.add' })}
            </Button>
          </div>
          <Table
            pagination={false}
            columns={[
              {
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.local_vol_path' }),
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
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.dep_vol_name' }),
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
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.dep_vol_path' }),
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
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.dep_vol_type' }),
                dataIndex: 'dep_vol_type',
                key: '4',
                width: '10%',
                render: (text, record) => {
                  return <span>{this.getVolumeTypeShowName(text)}</span>;
                }
              },
              {
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.dep_app_name' }),
                dataIndex: 'dep_app_name',
                key: '5',
                width: '10%',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${data.dep_app_alias
                        }/overview`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.dep_app_group' }),
                dataIndex: 'dep_app_group',
                key: '6',
                width: '15%',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id
                        }`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: formatMessage({ id: 'componentCheck.advanced.setup.shared_storage.label.action' }),
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
                      {formatMessage({ id: 'button.umount' })}
                    </a>
                  );
                }
              }
            ]}
            dataSource={mntList}
          />
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
            title={formatMessage({ id: 'confirmModal.umount.dalete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.umount.desc' })}
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.path.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.path.desc' })}
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
      </Fragment>
    );
  }
}
// 配置文件
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class ConfigFiles extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      volumes: [],
      showAddVars: null,
      editor: null,
      toDeleteMnt: null,
      toDeleteVolume: null,
    };
  }
  componentDidMount() {
    this.fetchVolumes()
    this.fetchBaseInfo();
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
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      }
    });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  onEditVolume = data => {
    this.setState({ showAddVars: data, editor: data });
  };
  handleAddVars = () => {
    this.setState({
      showAddVars: {
        new: true
      }
    });
  };
  handleCancelAddVars = () => {
    this.setState({ showAddVars: null, editor: null });
  };
  handleSubmitAddVars = vals => {
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appDetail.service.service_alias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          mode: vals.mode,
          ID: editor.ID
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message: formatMessage({ id: 'notification.success.edit' }) });
          }
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appDetail.service.service_alias,
          ...vals
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
          }
        }
      });
    }
  };
  render() {
    const { appDetail } = this.props;
    const { volumes } = this.state;
    const language = appUtil.getLanguage(appDetail);
    return (
      <div>
        <div>
          <div
            style={{
              textAlign: 'right',
              marginBottom: 12
            }}
          >
            <Button onClick={this.handleAddVars}>
              <Icon type="plus" />
              <FormattedMessage id='componentOverview.body.tab.env.setting.add' />
            </Button>
          </div>
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_name' }),
                  dataIndex: 'volume_name'
                },
                {
                  title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_path' }),
                  dataIndex: 'volume_path'
                },
                {
                  title: formatMessage({ id: 'componentOverview.body.tab.env.setting.mode' }),
                  dataIndex: 'mode'
                },
                {
                  title: formatMessage({ id: 'componentOverview.body.tab.env.setting.action' }),
                  dataIndex: 'action',
                  render: (v, data) => (
                    <div>
                      <a
                        onClick={() => {
                          this.onDeleteVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.delete' />
                      </a>
                      <a
                        onClick={() => {
                          this.onEditVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.edit' />
                      </a>
                    </div>
                  )
                }
              ]}
              dataSource={volumes}
            />
          </ScrollerX>
        </div>
        {this.state.showAddVars && (
          <AddStorage
            appBaseInfo={this.props.appBaseInfo}
            onCancel={this.handleCancelAddVars}
            onSubmit={this.handleSubmitAddVars}
            data={this.state.showAddVars}
            editor={this.state.editor}
            {...this.props}
          />
        )}
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
      type: 'deploy',
      language: cookie.get('language') === 'zh-CN' ? true : false
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
    const {
      type,
      componentPermissions: { isEnv, isRely, isStorage, isPort },
      language
    } = this.state;
    return (
      <div>
        <div
          style={{
            overflow: 'hidden'
          }}
        >
          <div
            className={styles.content}
            style={{
              overflow: 'hidden',
              marginBottom: 40
            }}
          >
            <Collapse defaultActiveKey="1">
              <Panel header="端口管理" key="1">
                <Ports appDetail={appDetail} />
              </Panel>
            </Collapse>
            <Collapse style={{marginTop:'40px'}} defaultActiveKey="2">
              <Panel header="配置文件" key="2">
                <ConfigFiles appDetail={appDetail} />
              </Panel>
            </Collapse>
            <Collapse style={{marginTop:'40px'}} defaultActiveKey="3">
              <Panel header="环境变量" key="3">
              {isEnv && (
                <EnvironmentVariable
                  isConfigPort={true}
                  title={formatMessage({ id: 'componentCheck.advanced.setup.environment_variable.title' })}
                  type="Inner"
                  appAlias={appDetail.service.service_alias}
                />
            )}
              </Panel>
            </Collapse>

            <Collapse style={{marginTop:'40px'}} defaultActiveKey="4">
              <Panel header="共享存储" key="4">
              {isStorage && <Mnt appDetail={appDetail} />}
              </Panel>
            </Collapse>
            
           
          </div>
        </div>
      </div>
    );
  }
}
