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
  Collapse,
  Tag,
  message
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddOrEditVolume from '../../components/AddOrEditVolume';
import AddOrEditVMVolume from '../../components/AddOrEditVMVolume'
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
    const { appDetail } = this.props
    const { volumes, mntList } = this.state;
    const method = appDetail && appDetail.service && appDetail.service.extend_method

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
      // {
      //   title: formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.status' }),
      //   dataIndex: 'status',
      //   render: (text, record) => {
      //     if (text == 'not_bound') {
      //       return <span style={{ color: 'red' }}>{formatMessage({ id: 'status.not_mount' })}</span>;
      //     }
      //     return <span style={{ color: 'green' }}>{formatMessage({ id: 'status.mounted' })}</span>;
      //   }
      // },
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
          <Button onClick={this.handleAddVar}>
            <Icon type="plus" />
            {formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.btn.add' })}
          </Button>
        </div>
        <Table pagination={false} dataSource={volumes} columns={columns} />

        {this.state.showAddVar && (
          <AddOrEditVolume
            volumeOpts={this.state.volumeOpts}
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
            method={method}
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
        is_config: true
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
  handleDeleteVolume = () => {
    this.props.dispatch({
      type: 'appControl/deleteVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
          this.onCancelDeleteVolume();
          this.fetchVolumes();
        }
      }
    });
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
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title={<FormattedMessage id='confirmModal.deldete.configurationFile.title' />}
            desc={<FormattedMessage id='confirmModal.deldete.configurationFile.desc' />}
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
      </div>
    );
  }
}

// 虚拟机存储管理
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class VmMnt extends PureComponent {
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
    if(data.first){
      notification.warning({ message: '主机系统盘不能删除' });
    }else{
      this.setState({ toDeleteVolume: data });
    }
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
  handleMountFormat = (key) => {
    const obj = { 
      '/lun': 'LUN',
      '/disk': '磁盘',
      '/cdrom': '光盘',
      '/filesystems': '文件系统',
    }
    return obj[key] || '-'
  }
  render() {
    const { mntList } = this.state;
    const { volumes } = this.state;
  
    const columns = [
      {
        title: formatMessage({id:'Vm.createVm.Storagename'}),
        dataIndex: 'volume_name'
      },
      {
        title: formatMessage({id:'Vm.createVm.Storagetype'}),
        dataIndex: 'volume_path',
        render: (text, record) => {
          return <span>{this.handleMountFormat(text)}</span>;
        }
      },
      {
        title: formatMessage({id:'Vm.createVm.capacity'}),
        dataIndex: 'volume_capacity',
        render: (text, record) => {
          if (text == 0) {
            return <span>{formatMessage({ id: 'appOverview.no_limit' })}</span>;
          }
          return <span>{text}GB</span>;
        }
      },
      // {
      //   title: '状态',
      //   dataIndex: 'status',
      //   render: (text, record) => {
      //     if (text == 'not_bound') {
      //       return <span style={{ color: 'red' }}>{formatMessage({ id: 'status.not_mount' })}</span>;
      //     }
      //     return <span style={{ color: 'green' }}>{formatMessage({ id: 'status.mounted' })}</span>;
      //   }
      // },
      {
        title: formatMessage({id:'Vm.createVm.handle'}),
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
          <Button onClick={this.handleAddVar}>
            <Icon type="plus" />
            {formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.btn.add' })}
          </Button>
        </div>
        <Table 
          pagination={false} 
          dataSource={volumes} 
          columns={columns} 
        />

        {this.state.showAddVar && (
          <AddOrEditVMVolume
            volumeOpts={this.state.volumeOpts}
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
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
      language: cookie.get('language') === 'zh-CN' ? true : false,
      portsData: [],
      volumesData: [],
      mntDataList: [],
      innerEnvsList: [],
      isPortFlag: false,
      isVolumesFlag: false,
      isMntFlag: false,
      isInnerEnvsFlag: false,
      activeKeyPort: true,
      activeKeyVolume: true,
      activeKeyEnv: true,
      activeKeyMnt: true,
      iconPort: false,
      iconVolume: false,
      iconEnv: false,
      iconMnt: false
    };
  }
  componentDidMount() {
    this.handleFetchPorts()
    this.handleFetchVolumes()
    this.handleLoadMntList()
    this.handleFetchInnerEnvs()
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
  handleFetchPorts = (isFlag) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        this.setState({
          portsData: (data && data.list) || [],
          isPortFlag: true,
        });
        if (!isFlag) {
          this.setState({
            iconPort: data && data.list.length > 0 ? true : false
          })
        }
      }
    });
  };
  handleFetchVolumes = (isFlag) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        is_config: true
      },
      callback: data => {
        if (data) {
          this.setState({
            volumesData: data.list || [],
            isVolumesFlag: true,
          });
          if (!isFlag) {
            this.setState({
              iconVolume: data && data.list.length > 0 ? true : false
            })
          }
        }
      }
    });
  };
  handleLoadMntList = (isFlag) => {
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
            mntDataList: data.list || [],
            isMntFlag: true,
          });
          if (!isFlag) {
            this.setState({
              iconMnt: data && data.list.length > 0 ? true : false
            })
          }
        }
      }
    });
  };
  handleFetchInnerEnvs = (isFlag) => {
    const { dispatch, appAlias, type } = this.props;

    const obj = {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      page: 1,
      page_size: 5,
      env_name: ''
    };
    dispatch({
      type: 'appControl/fetchInnerEnvs',
      payload: obj,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            innerEnvsList: res.list,
            isInnerEnvsFlag: true,
          });
          if (!isFlag) {
            this.setState({
              iconEnv: res && res.list.length > 0 ? true : false
            })
          }
        }
      }
    });
  };
  genExtraPort = (key) => {
    return (
      <span style={{ color: '#4D73B1', fontWeight: '600' }}>{key ? formatMessage({ id: 'button.fold' }) : formatMessage({ id: 'button.config' })}</span>
    )
  }

  genExtraVolume = (key) => {
    return (
      <span style={{ color: '#4D73B1', fontWeight: '600' }}>{key ? formatMessage({ id: 'button.fold' }) : formatMessage({ id: 'button.config' })}</span>
    )
  }

  genExtraEnv = (key) => {
    return (
      <span style={{ color: '#4D73B1', fontWeight: '600' }}>{key ? formatMessage({ id: 'button.fold' }) : formatMessage({ id: 'button.config' })}</span>
    )
  }

  genExtraMnt = (key) => {
    return (
      <span style={{ color: '#4D73B1', fontWeight: '600' }}>{key ? formatMessage({ id: 'button.fold' }) : formatMessage({ id: 'button.config' })}</span>
    )
  }

  callbackPort = (e) => {
    this.setState({
      activeKeyPort: e.length,
      iconPort: true
    })
    if (!e.length) {
      this.setState({
        iconPort: false,
      })
      this.handleFetchPorts(true)
    }
  }
  callbackVolume = (e) => {
    this.setState({
      activeKeyVolume: e.length,
      iconVolume: true
    })
    if (!e.length) {
      this.setState({
        iconVolume: false,
      })
      this.handleFetchVolumes(true)
    }
  }
  callbackEnv = (e) => {
    this.setState({
      activeKeyEnv: e.length,
      iconEnv: true
    })
    if (!e.length) {
      this.setState({
        iconEnv: false,
      })
      this.handleFetchInnerEnvs(true)
    }
  }
  callbackMnt = (e) => {
    this.setState({
      activeKeyMnt: e.length,
      iconMnt: true
    })
    if (!e.length) {
      this.setState({
        iconMnt: false,
      })
      this.handleLoadMntList(true)
    }
  }
  render() {
    const { appDetail } = this.props;
    const {
      type,
      componentPermissions: { isEnv, isRely, isStorage, isPort },
      language,
      portsData,
      volumesData,
      mntDataList,
      innerEnvsList,
      isPortFlag,
      isVolumesFlag,
      isMntFlag,
      isInnerEnvsFlag,
      activeKeyPort,
      activeKeyVolume,
      activeKeyEnv,
      activeKeyMnt,
      iconPort,
      iconVolume,
      iconEnv,
      iconMnt
    } = this.state;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
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
            {isPortFlag &&
              <Collapse onChange={this.callbackPort} defaultActiveKey={portsData.length > 0 ? 'port' : ''} expandIconPosition='right'>
                <Panel
                  header={
                    <span className={styles.spanBox}>
                      <span className={styles.panelTitle} style={{ color: portsData.length > 0 ? '#000' : '#bdbaba' }}>{formatMessage({ id: 'enterpriseColony.import.recognition.port' })}</span>
                      <span className={styles.panelSpan}>
                        <Tooltip title={formatMessage({ id: 'enterpriseColony.import.recognition.port.desc' })}>
                          {formatMessage({ id: 'enterpriseColony.import.recognition.port.desc' })}
                        </Tooltip>
                      </span>
                      {!activeKeyPort && portsData.length > 0 &&
                        <span className={styles.spanList}>
                          {formatMessage({ id: 'enterpriseColony.import.recognition.port.info' })}&nbsp;&nbsp;
                          {portsData.map((item => {
                            return <span>
                              <Tag color="blue">{item.container_port}</Tag>
                            </span>
                          }))}
                        </span>}
                    </span>}
                  key="port"
                  extra={this.genExtraPort(iconPort)}
                  showArrow={false}
                >
                  <Ports appDetail={appDetail} />
                </Panel>
              </Collapse>}
            {isVolumesFlag && method != 'vm' &&
              <Collapse style={{ marginTop: '40px' }} onChange={this.callbackVolume} defaultActiveKey={volumesData.length > 0 ? 'volume' : ''} expandIconPosition='right'>
                <Panel
                  header={
                    <span>
                      <span className={styles.panelTitle} style={{ color: volumesData.length > 0 ? '#000' : '#bdbaba' }}>{formatMessage({ id: 'enterpriseColony.import.recognition.tabs.configFiles' })}</span>
                      <span className={styles.panelSpan}>
                        <Tooltip title={formatMessage({ id: 'enterpriseColony.import.recognition.tabs.configFiles.desc' })}>
                          {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.configFiles.desc' })}
                        </Tooltip>
                      </span>
                      {!activeKeyVolume && volumesData.length > 0 &&
                        <span className={styles.spanList}>
                          {formatMessage({ id: 'enterpriseColony.import.recognition.tabs.configFiles.name' })}&nbsp;&nbsp;
                          {volumesData.map((item => {
                            return <span>
                              <Tag color="blue">{item.volume_name}</Tag>
                            </span>
                          }))}
                        </span>}
                    </span>}
                  extra={this.genExtraVolume(iconVolume)}
                  showArrow={false}
                  key="volume"
                >
                  <ConfigFiles appDetail={appDetail} />
                </Panel>
              </Collapse>
            }
            {isInnerEnvsFlag && method != 'vm' &&
              <Collapse style={{ marginTop: '40px' }} onChange={this.callbackEnv} defaultActiveKey={innerEnvsList.length > 0 ? 'env' : ''} expandIconPosition='right'>
                <Panel
                  header={
                    <span>
                      <span className={styles.panelTitle} style={{ color: innerEnvsList.length > 0 ? '#000' : '#bdbaba' }}>{formatMessage({ id: 'appPublish.shop.pages.title.environment_variable' })}</span>
                      <span className={styles.panelSpan}>
                        <Tooltip title={formatMessage({ id: 'appPublish.shop.pages.title.environment_variable.desc' })}>
                          {formatMessage({ id: 'appPublish.shop.pages.title.environment_variable.desc' })}
                        </Tooltip>
                      </span>
                      {!activeKeyEnv && innerEnvsList.length > 0 &&
                        <span className={styles.spanList}>
                          {formatMessage({ id: 'appPublish.shop.pages.title.environment_variable.name' })}&nbsp;&nbsp;
                          {innerEnvsList.map((item => {
                            return <span>
                              <Tag color="blue">{item.attr_name}</Tag>
                            </span>
                          }))}
                        </span>}
                    </span>}
                  key="env"
                  extra={this.genExtraEnv(iconEnv)}
                  showArrow={false}
                >
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
            }

            {isMntFlag &&
              <Collapse style={{ marginTop: '40px' }} onChange={this.callbackMnt} defaultActiveKey={mntDataList.length > 0 ? 'mnt' : ''} expandIconPosition='right'>
                <Panel
                  header={
                    <span>
                      <span className={styles.panelTitle} style={{ color: mntDataList.length > 0 ? '#000' : '#bdbaba' }}>{formatMessage({ id: 'componentCheck.advanced.setup.storage_config.title' })}</span>
                      <span className={styles.panelSpan}>
                        <Tooltip title={formatMessage({ id: 'componentCheck.advanced.setup.storage_config.desc' })}>
                          {formatMessage({ id: 'componentCheck.advanced.setup.storage_config.desc' })}
                        </Tooltip>
                      </span>
                      {!activeKeyMnt && mntDataList.length > 0 &&
                        <span className={styles.spanList}>
                          {formatMessage({ id: 'componentCheck.advanced.setup.storage_config.name' })}&nbsp;&nbsp;
                          {mntDataList.map((item => {
                            return <span>
                              <Tag color="blue">{item.volume_name}</Tag>
                            </span>
                          }))}
                        </span>}
                    </span>}
                  key="mnt"
                  extra={this.genExtraMnt(iconMnt)}
                  showArrow={false}
                >

                  {isStorage &&
                    <>
                      {method == 'vm' ? <VmMnt appDetail={appDetail} /> : <Mnt appDetail={appDetail} />}
                    </>
                  }
                </Panel>
              </Collapse>
            }

          </div>
        </div>
      </div>
    );
  }
}
