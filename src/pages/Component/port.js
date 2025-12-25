import { Alert, Button, Card, Col, Form, Icon, Input, Modal, notification, Radio, Row } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import AddDomain from '../../components/AddDomain';
import AddPort from '../../components/AddPort';
import ConfirmModal from '../../components/ConfirmModal';
import NoPermTip from '../../components/NoPermTip';
import Port from '../../components/Port';
import ScrollerX from '../../components/ScrollerX';
import SubDomain from '../../components/SubDomain';
import SubPort from '../../components/SubPort';
import appUtil from '../../utils/app';
import cookie from '@/utils/cookie';
import handleAPIError from '@/utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import styles from './port.less';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: { xs: { span: 24 }, sm: { span: 5 } },
  wrapperCol: { xs: { span: 24 }, sm: { span: 16 } }
};

const enFormItemLayout = {
  labelCol: { xs: { span: 24 }, sm: { span: 8 } },
  wrapperCol: { xs: { span: 24 }, sm: { span: 16 } }
};

@Form.create()
class EditAlias extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      language: cookie.get('language') === 'zh-CN'
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel?.();
  };

  render() {
    const { form, port = {} } = this.props;
    const { getFieldDecorator } = form;
    const { language } = this.state;
    const layoutProps = language ? formItemLayout : enFormItemLayout;

    return (
      <Modal
        title={<FormattedMessage id="componentOverview.body.EditAlias.title" />}
        onOk={this.handleSubmit}
        maskClosable={false}
        visible
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...layoutProps} label={<FormattedMessage id="componentOverview.body.EditAlias.label_alias" />}>
            {getFieldDecorator('alias', {
              initialValue: port.port_alias,
              rules: [
                { required: true, message: formatMessage({ id: 'componentOverview.body.EditAlias.label_alias.message' }) },
                { pattern: /^[^\s\u4e00-\u9fa5!@#\$%\^\&\*\(\)_\+\-=\[\]\{\};:'"\\|,<>\?\/`~][^\s\u4e00-\u9fa5]*$/, message: formatMessage({ id: 'placeholder.portFrom.invalid_format' }) },
                { pattern: /^[A-Z][A-Z0-9_]*$/, message: formatMessage({ id: 'applicationMarket.HelmForm.invalid_format' }) }
              ]
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.EditAlias.label_alias.message' })} />)}
          </FormItem>
          <FormItem {...layoutProps} label={<FormattedMessage id="componentOverview.body.EditAlias.label_k8s_service_name" />}>
            {getFieldDecorator('k8s_service_name', {
              initialValue: port.k8s_service_name,
              rules: [
                { required: true, message: formatMessage({ id: 'componentOverview.body.EditAlias.label_k8s_service_name_message' }) },
                { max: 63, message: formatMessage({ id: 'componentOverview.body.EditAlias.label_k8s_service_name.max' }) },
                { pattern: /^[a-z]([-a-z0-9]*[a-z0-9])?$/, message: formatMessage({ id: 'componentOverview.body.EditAlias.label_k8s_service_name.pattern' }) }
              ]
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.EditAlias.label_k8s_service_name_message' })} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@Form.create()
class AddKey extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel?.();
  };

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Modal
        title={<FormattedMessage id="componentOverview.body.AddKey.title" />}
        onOk={this.handleSubmit}
        visible
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={<FormattedMessage id="componentOverview.body.AddKey.alias" />}>
            {getFieldDecorator('alias', {
              initialValue: '',
              rules: [
                { required: true, message: formatMessage({ id: 'componentOverview.body.AddKey.required' }) },
                { max: 64, message: formatMessage({ id: 'componentOverview.body.AddKey.max' }) }
              ]
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.AddKey.required' })} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({ id: 'popover.manage.certificate.label.kind' })}>
            {getFieldDecorator('certificate_type', {
              initialValue: formatMessage({ id: 'popover.manage.certificate.label.server' }),
              rules: [{ required: true }]
            })(
              <RadioGroup>
                <Radio value={formatMessage({ id: 'popover.manage.certificate.label.server' })}>
                  {formatMessage({ id: 'popover.manage.certificate.label.server' })}
                </Radio>
              </RadioGroup>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="key">
            {getFieldDecorator('private_key', {
              rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.AddKey.private_key' }) }]
            })(<TextArea placeholder={formatMessage({ id: 'componentOverview.body.AddKey.private_key' })} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id="componentOverview.body.AddKey.certificate" />}>
            {getFieldDecorator('certificate', {
              rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.AddKey.placeholder' }) }]
            })(<TextArea placeholder={formatMessage({ id: 'componentOverview.body.AddKey.placeholder' })} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ appControl }) => ({
    ports: appControl.ports,
    certificates: appControl.certificates
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
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
      isAddLicense: false,
      troubleshootVisible: false
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    this.fetchPorts();
    this.fetchCertificates();
    dispatch({
      type: 'region/fetchProtocols',
      payload: { team_name: globalUtil.getCurrTeamName(), region_name: globalUtil.getCurrRegionName() },
      handleError: err => handleAPIError(err)
    });
  }

  showSuccessNotification = () => {
    const { appDetail } = this.props;
    if (!appDetail?.is_third) {
      notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
    }
  };

  onCloseInner = port => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    dispatch({
      type: 'appControl/closePortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  onCloseOuter = port => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    dispatch({
      type: 'appControl/closePortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  onCancelAddDomain = () => this.setState({ showAddDomain: null });

  onAddDomain = val => this.setState({ showAddDomain: val });

  onCancelAddPort = () => this.setState({ showAddPort: false });

  addLicense = () => {
    const { page_size } = this.state;
    this.setState({ page_size: page_size + 10 }, () => {
      this.fetchCertificates();
    });
  };

  fetchCertificates = () => {
    const { dispatch } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'appControl/fetchCertificates',
      payload: {
        page,
        page_size: 99999,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data?.list) {
          const listNum = data.bean?.nums || 0;
          this.setState({ isAddLicense: listNum > page_size });
        }
      },
      handleError: err => handleAPIError(err)
    });
  };

  fetchPorts = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleSubmitProtocol = (protocol, port, callback) => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/changeProtocol',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port,
        protocol
      },
      callback: () => {
        this.fetchPorts();
        callback();
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleDeletePort = port => this.setState({ showDeletePort: port });

  cancalDeletePort = () => this.setState({ showDeletePort: null });

  handleSubmitDeletePort = () => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { showDeletePort } = this.state;
    dispatch({
      type: 'appControl/deletePort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port: showDeletePort
      },
      callback: () => {
        this.cancalDeletePort();
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleDeleteDomain = port => this.setState({ showDeleteDomain: port });

  cancalDeleteDomain = () => this.setState({ showDeleteDomain: null });

  handleSubmitDeleteDomain = () => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { showDeleteDomain } = this.state;
    dispatch({
      type: 'appControl/unbindDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port: showDeleteDomain.port,
        domain: showDeleteDomain.domain
      },
      callback: () => {
        this.cancalDeleteDomain();
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  showAddPort = () => this.setState({ showAddPort: true });

  showSubPort = port => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/getSubPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appAlias,
        port: port.container_port
      },
      callback: data => {
        const portlist = data?.list;
        if (portlist?.length === 0) {
          notification.info({ message: formatMessage({ id: 'notification.success.cannotModify' }) });
        } else {
          this.setState({
            showSubPort: true,
            tcp_ports: portlist,
            subPort: port.container_port
          });
        }
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleSubPort = values => {
    const { dispatch, appAlias } = this.props;
    const { subPort } = this.state;
    const valList = values.port.split('||');
    dispatch({
      type: 'appControl/SubPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appAlias,
        port: subPort,
        lb_mapping_port: valList[1],
        service_id: valList[0]
      },
      callback: () => {
        this.setState({ showSubPort: false });
        notification.success({ message: formatMessage({ id: 'notification.success.edit_port' }) });
        this.fetchPorts();
      },
      handleError: err => handleAPIError(err)
    });
  };

  hideSubPort = () => this.setState({ showSubPort: false });

  showSubDomain = port => {
    const { dispatch, appAlias } = this.props;
    this.setState({ showSubDomain: true, single_port: port.mapping_port });
    dispatch({
      type: 'appControl/getSubDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ sld_suffix: data.bean.sld_suffix });
        }
      },
      handleError: err => handleAPIError(err)
    });
  };

  hideSubDomain = () => this.setState({ showSubDomain: false });

  handleSubDomain = values => {
    const { dispatch, appAlias } = this.props;
    const { sld_suffix, single_port } = this.state;
    const newdomain = `${values.domain}.${sld_suffix}`;
    dispatch({
      type: 'appControl/SubDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appAlias,
        domain_name: newdomain,
        container_port: single_port
      },
      callback: () => {
        this.setState({ sld_suffix: null, showSubDomain: false });
        notification.success({ message: formatMessage({ id: 'notification.success.secondary' }) });
        this.fetchPorts();
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleAddPort = val => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    dispatch({
      type: 'appControl/addPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        protocol: val.protocol,
        port: val.port
      },
      callback: () => {
        this.onCancelAddPort();
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleCreateKey = () => {
    this.setState({ showAddDomain: null, showAddKey: true });
  };

  cancelCreateKey = () => this.setState({ showAddKey: false });

  handleSubmitKey = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/addCertificate',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        alias: vals.alias,
        private_key: vals.private_key,
        certificate: vals.certificate,
        certificate_type: vals.certificate_type
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.setUp' }) });
        this.cancelCreateKey();
        this.fetchCertificates();
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleOpenOuter = port => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    dispatch({
      type: 'appControl/openPortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleOpenInner = port => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    dispatch({
      type: 'appControl/openPortInner',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port
      },
      callback: () => {
        this.fetchPorts();
        this.showSuccessNotification();
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleAddDomain = values => {
    const { dispatch, appDetail, appAlias } = this.props;
    const { showAddDomain } = this.state;

    if (values.protocol === 'httptohttps') {
      values.rule_extensions = [{ key: values.protocol, value: 'true' }];
    }

    dispatch({
      type: 'appControl/bindDomain',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        port: showAddDomain.container_port,
        domain: values.domain,
        protocol: values.protocol,
        certificate_id: values.certificate_id,
        group_id: appDetail.service.group_id,
        rule_extensions: values.rule_extensions || []
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.setUp' }) });
        this.fetchPorts();
        this.onCancelAddDomain();
      },
      handleError: err => handleAPIError(err)
    });
  };

  showEditAlias = port => this.setState({ showEditAlias: port });

  hideEditAlias = () => this.setState({ showEditAlias: null });

  handleEditAlias = val => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { showEditAlias } = this.state;
    dispatch({
      type: 'appControl/editPortAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        k8s_service_name: val.k8s_service_name,
        port: showEditAlias.container_port,
        port_alias: val.alias
      },
      callback: () => {
        this.fetchPorts();
        this.hideEditAlias();
        if (!this.props.appDetail?.is_third) {
          notification.success({ message: formatMessage({ id: 'notification.success.operationToUpdate' }) });
        }
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  canView = () => {
    const { componentPermissions: { isPort } } = this.props;
    return isPort;
  };

  handleTroubleshoot = () => this.setState({ troubleshootVisible: true });

  handleCancelTroubleshoot = () => this.setState({ troubleshootVisible: false });

  render() {
    const { ports, certificates, appDetail } = this.props;
    const {
      isAddLicense, troubleshootVisible, showDeletePort, showDeleteDomain,
      showAddPort, showAddDomain, showAddKey, showEditAlias, showSubDomain,
      showSubPort, sld_suffix, tcp_ports
    } = this.state;

    if (!this.canView()) return <NoPermTip />;

    const isImageApp = appUtil.isImageApp(appDetail);
    const isDockerfile = appUtil.isDockerfile(appDetail);
    const extendMethod = appDetail?.service?.extend_method;
    const isHelm = appDetail?.service?.component_type === 'helm';

    return (
      <Fragment>
        <Row>
          <Col span={15}>
            <Alert
              showIcon
              message={
                <>
                  <FormattedMessage id="componentOverview.body.Port.message" />
                  <a onClick={this.handleTroubleshoot} style={{ fontWeight: 'bold' }}>
                    <FormattedMessage id="componentOverview.body.Port.troubleshoot" />
                  </a>
                </>
              }
              type="info"
              style={{ marginBottom: 24 }}
            />
          </Col>
          {!isHelm && (
            <Col span={9} style={{ textAlign: 'right' }}>
              <Button onClick={this.showAddPort}>
                <Icon type="plus" />
                <FormattedMessage id="componentOverview.body.Port.add" />
              </Button>
            </Col>
          )}
        </Row>
        {!ports.length ? (
          <Card bodyStyle={{padding:12}}>
            <p style={{ marginTop: 100, marginBottom: 100, fontSize: 20, textAlign: 'center' }}>
              <FormattedMessage id="componentOverview.body.Port.msg" />
              <a onClick={this.showAddPort} href="javascript:;">
                <FormattedMessage id="componentOverview.body.Port.addMsg" />
              </a>
            </p>
          </Card>
        ) : (
          <Card bodyStyle={{padding:12}}>
            <ScrollerX sm={700}>
              {ports.map(port => (
                <Port
                  key={port.container_port}
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
        {showDeletePort && (
          <ConfirmModal
            title={<FormattedMessage id="confirmModal.deldete.port.title" />}
            desc={<FormattedMessage id="confirmModal.deldete.port.desc" />}
            subDesc={<FormattedMessage id="confirmModal.deldete.port.subDesc" />}
            onOk={this.handleSubmitDeletePort}
            onCancel={this.cancalDeletePort}
          />
        )}
        {showDeleteDomain && (
          <ConfirmModal
            title={<FormattedMessage id="confirmModal.deldete.unbound.title" />}
            desc={<FormattedMessage id="confirmModal.deldete.unbound.desc" />}
            subDesc={showDeleteDomain.domain}
            onOk={this.handleSubmitDeleteDomain}
            onCancel={this.cancalDeleteDomain}
          />
        )}
        {showAddPort && (
          <AddPort
            isImageApp={isImageApp}
            isDockerfile={isDockerfile}
            onCancel={this.onCancelAddPort}
            onOk={this.handleAddPort}
            extendMethod={extendMethod}
          />
        )}
        {showAddDomain && (
          <AddDomain
            addLicense={this.addLicense}
            isAddLicense={isAddLicense}
            certificates={certificates || []}
            onCreateKey={this.handleCreateKey}
            onOk={this.handleAddDomain}
            onCancel={this.onCancelAddDomain}
          />
        )}
        {showAddKey && (
          <AddKey onOk={this.handleSubmitKey} onCancel={this.cancelCreateKey} />
        )}
        {showEditAlias && (
          <EditAlias
            port={showEditAlias}
            onOk={this.handleEditAlias}
            onCancel={this.hideEditAlias}
          />
        )}
        {showSubDomain && (
          <SubDomain
            sld_suffix={sld_suffix}
            onCancel={this.hideSubDomain}
            onOk={this.handleSubDomain}
          />
        )}
        {showSubPort && (
          <SubPort
            postList={tcp_ports}
            onCancel={this.hideSubPort}
            onOk={this.handleSubPort}
          />
        )}
        {troubleshootVisible && (
          <Modal
            title={formatMessage({ id: 'componentOverview.body.Port.troubleshoot.title' })}
            visible
            onCancel={this.handleCancelTroubleshoot}
            footer={[
              <Button key="close" size="small" onClick={this.handleCancelTroubleshoot}>
                {formatMessage({ id: 'button.close' })}
              </Button>
            ]}
          >
            <ul className={styles.ulStyle}>
              <li>{formatMessage({ id: 'componentOverview.body.Port.troubleshoot.li1' })}</li>
              <li>{formatMessage({ id: 'componentOverview.body.Port.troubleshoot.li2' })}</li>
              <li>{formatMessage({ id: 'componentOverview.body.Port.troubleshoot.li3' })}</li>
              <li>{formatMessage({ id: 'componentOverview.body.Port.troubleshoot.li4' })}</li>
            </ul>
          </Modal>
        )}
      </Fragment>
    );
  }
}
