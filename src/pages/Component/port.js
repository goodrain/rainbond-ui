import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  message,
  Modal,
  notification,
  Row
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AddDomain from '../../components/AddDomain';
import AddPort from '../../components/AddPort';
import ConfirmModal from '../../components/ConfirmModal';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ScrollerX from '../../components/ScrollerX';
import SubDomain from '../../components/SubDomain';
import SubPort from '../../components/SubPort';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
const { TextArea } = Input;

@Form.create()
class EditAlias extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err && onOk) {
          onOk(values);
        }
      }
    );
  };
  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    const port = this.props.port || {};
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.EditAlias.title'/>}
        onOk={this.handleSubmit}
        maskClosable={false}
        visible
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.EditAlias.label_alias'/>}>
            {getFieldDecorator('alias', {
              initialValue: port.port_alias,
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditAlias.label_alias.message'})

                }
              ]
            })(<Input  placeholder={formatMessage({id:'componentOverview.body.EditAlias.label_alias.message'})}/>)}
          </FormItem>
          <FormItem {...formItemLayout}  lable={<FormattedMessage id='componentOverview.body.EditAlias.label_k8s_service_name'/>}>
            {getFieldDecorator('k8s_service_name', {
              initialValue: port.k8s_service_name,
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditAlias.label_k8s_service_name_message'})

                },
                {
                  max: 63,
                  message: formatMessage({id:'componentOverview.body.EditAlias.label_k8s_service_name.max'})

                },
                {
                  pattern: /^[a-z]([-a-z0-9]*[a-z0-9])?$/,

                  message: formatMessage({id:'componentOverview.body.EditAlias.label_k8s_service_name.pattern'})

                }
              ]
            })(<Input  placeholder={formatMessage({id:'componentOverview.body.EditAlias.label_k8s_service_name_message'})}/>)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@Form.create()
class AddKey extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    const { onOk, form } = this.props;

    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err && onOk) {
          onOk(values);
        }
      }
    );
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.AddKey.title'/>}
        onOk={this.handleSubmit}
        visible
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.AddKey.alias'/>}>
            {getFieldDecorator('alias', {
              initialValue: '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.AddKey.required'})
                },
                {
                  max: 64,
                  message: formatMessage({id:'componentOverview.body.AddKey.max'})
                }
              ]
            })(<Input  placeholder={formatMessage({id:'componentOverview.body.AddKey.required'})}/>)}
          </FormItem>
          <FormItem {...formItemLayout} label="key" >
            {getFieldDecorator('private_key', {
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.AddKey.private_key'})
                }
              ]
            })(<TextArea  placeholder={formatMessage({id:'componentOverview.body.AddKey.private_key'})}/>)}
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.AddKey.certificate'/>}> 
            {getFieldDecorator('certificate', {
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.AddKey.placeholder'})
                }
              ]
            })(<TextArea placeholder={formatMessage({id:'componentOverview.body.AddKey.placeholder'})} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    ports: appControl.ports,
    certificates: appControl.certificates
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showDeletePort: null,
      showDeleteDomain: null,
      showAddPort: false,
      showAddDomain: null,
      showAddKey: false,
      showEditAlias: null,
      showSubDomain: false,
      showSubPort: false,
      sld_suffix: '',
      single_port: null,
      tcp_ports: [],
      subPort: '',
      page: 1,
      page_size: 10,
      isAddLicense: false
    };
  }

  componentDidMount() {
    this.fetchPorts();
    this.fetchCertificates();
  }
  onCloseInner = port => {
    this.props.dispatch({
      type: 'appControl/closePortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  onCloseOuter = port => {
    this.props.dispatch({
      type: 'appControl/closePortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };
  onCancelAddDomain = () => {
    this.setState({ showAddDomain: null });
  };
  onAddDomain = val => {
    this.setState({ showAddDomain: val });
  };
  onCancelAddPort = () => {
    this.setState({ showAddPort: false });
  };
  addLicense = () => {
    this.setState(
      {
        page_size: this.state.page_size + 10
      },
      () => {
        this.fetchCertificates();
      }
    );
  };

  // 获取证书
  fetchCertificates() {
    const { dispatch } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'appControl/fetchCertificates',
      payload: {
        page,
        page_size,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.list) {
          const listNum = (data.bean && data.bean.nums) || 0;
          const isAdd = !!(listNum && listNum > page_size);
          this.setState({ isAddLicense: isAdd });
        }
      }
    });
  }

  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  handleSubmitProtocol = (protocol, port, callback) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/changeProtocol',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port,
        protocol
      },
      callback: () => {
        this.fetchPorts();
        callback();
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
        app_alias: this.props.appAlias,
        port: this.state.showDeletePort
      },
      callback: () => {
        this.cancalDeletePort();
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleDeleteDomain = port => {
    this.setState({ showDeleteDomain: port });
  };
  cancalDeleteDomain = () => {
    this.setState({ showDeleteDomain: null });
  };
  handleSubmitDeleteDomain = () => {
    this.props.dispatch({
      type: 'appControl/unbindDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port: this.state.showDeleteDomain.port,
        domain: this.state.showDeleteDomain.domain
      },
      callback: () => {
        this.cancalDeleteDomain();
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };
  showAddPort = () => {
    this.setState({ showAddPort: true });
  };

  showSubPort = port => {
    this.props.dispatch({
      type: 'appControl/getSubPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias,
        port: port.container_port
      },
      callback: data => {
        const portlist = data && data.list;
        if (portlist && portlist.length == 0) {
          notification.info({ message: '端口不能修改' });
        } else {
          this.setState({
            showSubPort: true,
            tcp_ports: portlist,
            subPort: port.container_port
          });
        }
      }
    });
  };
  handleSubPort = values => {
    const valList = values.port.split('||');
    this.props.dispatch({
      type: 'appControl/SubPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias,
        port: this.state.subPort,
        lb_mapping_port: valList[1],
        service_id: valList[0]
      },
      callback: data => {
        this.setState({ showSubPort: false });
        notification.success({ message: '端口修改成功' });
        this.fetchPorts();
      }
    });
  };
  hideSubPort = () => {
    this.setState({ showSubPort: false });
  };
  showSubDomain = port => {
    this.setState({ showSubDomain: true, single_port: port.mapping_port });
    this.props.dispatch({
      type: 'appControl/getSubDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ sld_suffix: data.bean.sld_suffix });
        }
      }
    });
  };
  hideSubDomain = () => {
    this.setState({ showSubDomain: false });
  };
  handleSubDomain = values => {
    const newdomain = `${values.domain}.${this.state.sld_suffix}`;
    this.props.dispatch({
      type: 'appControl/SubDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias,
        domain_name: newdomain,
        container_port: this.state.single_port
      },
      callback: data => {
        this.setState({ sld_suffix: null, showSubDomain: false });
        notification.success({ message: '二级域名添加成功' });
        this.fetchPorts();
      }
    });
  };

  handleAddPort = val => {
    this.props.dispatch({
      type: 'appControl/addPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        protocol: val.protocol,
        port: val.port
      },
      callback: () => {
        this.onCancelAddPort();
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  // 创建证书
  handleCreateKey = () => {
    this.setState({ showAddDomain: null, showAddKey: true });
  };
  cancelCreateKey = () => {
    this.setState({ showAddKey: false });
  };
  handleSubmitKey = vals => {
    this.props.dispatch({
      type: 'appControl/addCertificate',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        alias: vals.alias,
        private_key: vals.private_key,
        certificate: vals.certificate
      },
      callback: () => {
        this.cancelCreateKey();
        this.fetchCertificates();
      }
    });
  };
  handleOpenOuter = port => {
    this.props.dispatch({
      type: 'appControl/openPortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleOpenInner = port => {
    this.props.dispatch({
      type: 'appControl/openPortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleAddDomain = values => {
    if (values.protocol == 'httptohttps') {
      values.rule_extensions = [
        {
          key: values.protocol,
          value: 'true'
        }
      ];
    }
    const { appDetail } = this.props;
    const { showAddDomain } = this.state;
    this.props.dispatch({
      type: 'appControl/bindDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        port: showAddDomain.container_port,
        domain: values.domain,
        protocol: values.protocol,
        certificate_id: values.certificate_id,
        group_id: appDetail.service.group_id,
        rule_extensions: values.rule_extensions ? values.rule_extensions : []
      },
      callback: () => {
        this.fetchPorts();
        this.onCancelAddDomain();
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
        app_alias: this.props.appAlias,
        k8s_service_name: vals.k8s_service_name,
        port: this.state.showEditAlias.container_port,
        port_alias: vals.alias
      },
      callback: () => {
        this.fetchPorts();
        this.hideEditAlias();
        this.props.appDetail && this.props.appDetail.is_third
          ? ''
          : notification.success({ message: '操作成功、需要更新才能生效' });
        this.props.onshowRestartTips(true);
      }
    });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isPort }
    } = this.props;
    return isPort;
  }
  render() {
    const { ports, certificates, appDetail } = this.props;
    const { isAddLicense } = this.state;
    const isImageApp = appUtil.isImageApp(appDetail);
    const isDockerfile = appUtil.isDockerfile(appDetail);
    if (!this.canView()) return <NoPermTip />;
    const isHelm =
      appDetail.service && appDetail.service.component_type === 'helm';

    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message={<FormattedMessage id='componentOverview.body.Port.message'/>}
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
          {!isHelm && (
            <Col
              span={12}
              style={{
                textAlign: 'right'
              }}
            >
              <Button onClick={this.showAddPort} type="primary">
                <Icon type="plus" />
                <FormattedMessage id='componentOverview.body.Port.add'/>
              </Button>
            </Col>
          )}
        </Row>
        {!ports.length ? (
          <Card>
            <p
              style={{
                marginTop: 100,
                marginBottom: 100,
                fontSize: 20,
                textAlign: 'center'
              }}
            >
              <FormattedMessage id='componentOverview.body.Port.msg'/>
              <a onClick={this.showAddPort} href="javascript:;">
                <FormattedMessage id='componentOverview.body.Port.addMsg'/>
              </a>
            </p>
          </Card>
        ) : (
          <Card>
            <ScrollerX sm={700}>
              {ports.map(port => (
                <Port
                  port={port}
                  onDelete={this.handleDeletePort}
                  onEditAlias={this.showEditAlias}
                  onSubmitProtocol={this.handleSubmitProtocol}
                  onOpenInner={this.handleOpenInner}
                  onCloseInner={this.onCloseInner}
                  onOpenOuter={this.handleOpenOuter}
                  onCloseOuter={this.onCloseOuter}
                  onAddDomain={this.onAddDomain}
                  onDeleteDomain={this.handleDeleteDomain}
                  onSubDomain={this.showSubDomain}
                  onSubPort={this.showSubPort}
                />
              ))}
            </ScrollerX>
          </Card>
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
        {this.state.showAddDomain && (
          <AddDomain
            addLicense={this.addLicense}
            isAddLicense={isAddLicense}
            certificates={certificates || []}
            onCreateKey={this.handleCreateKey}
            onOk={this.handleAddDomain}
            onCancel={this.onCancelAddDomain}
          />
        )}
        {this.state.showAddKey && (
          <AddKey onOk={this.handleSubmitKey} onCancel={this.cancelCreateKey} />
        )}
        {this.state.showEditAlias && (
          <EditAlias
            port={this.state.showEditAlias}
            onOk={this.handleEditAlias}
            onCancel={this.hideEditAlias}
          />
        )}
        {this.state.showSubDomain && (
          <SubDomain
            sld_suffix={this.state.sld_suffix}
            onCancel={this.hideSubDomain}
            onOk={this.handleSubDomain}
          />
        )}
        {this.state.showSubPort && (
          <SubPort
            postList={this.state.tcp_ports}
            onCancel={this.hideSubPort}
            onOk={this.handleSubPort}
          />
        )}
      </Fragment>
    );
  }
}
