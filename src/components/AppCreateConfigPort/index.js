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
  AutoComplete
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
    console.log(ports,'-------')
    const isImageApp = appUtil.isImageApp(this.props.appDetail);
    const isDockerfile = appUtil.isDockerfile(this.props.appDetail);
    return (
      <Card
        title={formatMessage({id:'componentCheck.advanced.setup.port_manage.title'})}
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
              {formatMessage({id:'componentCheck.advanced.setup.port_manage.btn.null'})}
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
            {formatMessage({id:'button.add_port'})}
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
            title={formatMessage({id:'confirmModal.port.delete.title'})}
            desc={formatMessage({id:'confirmModal.delete.port.desc'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            onOk={this.handleSubmitDeletePort}
            onCancel={this.cancalDeletePort}
          />
        )}
        {this.state.showDeleteDomain && (
          <ConfirmModal
            title={formatMessage({id:'confirmModal.domain.delete.title'})}
            desc={formatMessage({id:'confirmModal.delete.domain.desc'})}
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
    const { appDetail, handleBuildSwitch } = this.props;
    const { type, componentPermissions, language } = this.state;

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
              marginBottom: 90
            }}
          >
            <Ports appDetail={appDetail}/>
          </div>
        </div>
      <CustomFooter />
      </div>
    );
  }
}
