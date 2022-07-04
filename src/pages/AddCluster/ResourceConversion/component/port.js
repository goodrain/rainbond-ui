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
    Select
  } from 'antd';
  import { connect } from 'dva';
  import { Link } from 'dva/router';
  import React, { Fragment, PureComponent } from 'react';
  import AddPort from '../../../../components/AddPort';
  import AddRelation from '../../../../components/AddRelation';
  import ConfirmModal from '../../../../components/ConfirmModal';
  import EditPortAlias from '../../../../components/EditPortAlias';
  import Port from '../../../../components/Port';
  import {
    addMnt,
    batchAddRelationedApp,
    getMnt,
    getRelationedApp,
    removeRelationedApp
  } from '../../../../services/app';
  import appUtil from '../../../../utils/app';
  import globalUtil from '../../../../utils/global';
  import roleUtil from '../../../../utils/role';
  import { getVolumeTypeShowName } from '../../../../utils/utils';
  import styles from '../index.less';

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
    const { dispatch } = this.props;
    dispatch({
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
        className={styles.cardstyle}
        style={{
          marginBottom: 16
        }}
      >
        <div>
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
export default Ports;
