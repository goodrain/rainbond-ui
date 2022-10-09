/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Table
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';

const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { confirm } = Modal;
const regs = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
const rega = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
const rege = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    appRequest: appControl.appRequest,
    appRequestRange: appControl.appRequestRange,
    requestTime: appControl.requestTime,
    requestTimeRange: appControl.requestTimeRange,
    appDisk: appControl.appDisk,
    appMemory: appControl.appMemory,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      endpoint_num: '',
      list: [],
      deleteVar: false,
      visible: false,
      ep_id: '',
      api_service_key: ''
    };
  }

  componentDidMount() {
    this.handleGetList();
  }

  fetchParameter = () => {
    const { appAlias } = this.props;
    return {
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      app_alias: appAlias
    };
  };

  showConfirm = () => {
    const { dispatch } = this.props;
    const { team_name, region_name, app_alias } = this.fetchParameter();
    confirm({
      title: formatMessage({id:'componentOverview.body.ThirdPartyServices.port'}),
      content: formatMessage({id:'componentOverview.body.ThirdPartyServices.foreign'}),
      okText: formatMessage({id:'componentOverview.body.ThirdPartyServices.configure'}),
      onOk() {
        dispatch(
          routerRedux.push(
            `/team/${team_name}/region/${region_name}/components/${app_alias}/port`
          )
        );
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  handleGetList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getInstanceList',
      payload: this.fetchParameter(),
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            endpoint_num:
              res.bean.endpoint_num > 0 ? res.bean.endpoint_num : '',
            list: res.list
          });
        }
      }
    });
  };
  openDeleteVar = ep_id => {
    this.setState({ deleteVar: true, ep_id });
  };
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  handleDeleteVar = () => {
    const { ep_id } = this.state;
    this.props.dispatch({
      type: 'appControl/deleteInstanceList',
      payload: {
        ...this.fetchParameter(),
        ep_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleGetList();
          this.cancelDeleteVar();
          setTimeout(() => {
            this.handleGetList();
          }, 50000);
          notification.info({ message:  formatMessage({id:'notification.hint.need_updata'})});
        }
      }
    });
  };
  handleModify = status => {
    // 上online， 下offline线
    this.props.dispatch({
      type: 'appControl/modifyInstanceList',
      payload: {
        ...this.fetchParameter(),
        ep_id: status.ep_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.bean && res.bean.port_closed) {
            this.showConfirm();
          } else {
            this.handleGetList();
            this.cancelDeleteVar();
          }
        }
      }
    });
  };
  addInstance = () => {
    this.setState({ visible: true });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      dispatch({
        type: 'appControl/addInstanceList',
        payload: {
          ...this.fetchParameter(),
          ip: fieldsValue.ip
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({ visible: false });
            this.handleGetList();
            notification.info({ message: formatMessage({id:'notification.hint.need_updata'}) });
          }
        }
      });
    });
  };
  handleCancel = () => {
    this.setState({ visible: false });
  };
  validAttrName = (_, value, callback) => {
    if (!value || value === '') {
      callback(<FormattedMessage id='componentOverview.body.ThirdPartyServices.ip'/>);
      return;
    }

    if (value === '1.1.1.1') {
      callback(<FormattedMessage id='componentOverview.body.ThirdPartyServices.address'/>);
    }

    if (
      !regs.test(value || '') &&
      !rega.test(value || '') &&
      !rege.test(value || '')
    ) {
      callback(<FormattedMessage id='componentOverview.body.ThirdPartyServices.correct_address'/>);
      return;
    }

    callback();
  };
  handleUpDatekey = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/editUpDatekey',
      payload: this.fetchParameter(),
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            api_service_key: res.bean && res.bean.api_service_key
          });
        }
      }
    });
  };

  render() {
    const {
      list,
      endpoint_num,
      api_service_key,
      visible,
      deleteVar
    } = this.state;
    const { groupDetail, appDetail, form } = this.props;
    const { getFieldDecorator } = form;
    const isHelm =
      groupDetail && groupDetail.app_type && groupDetail.app_type === 'helm';
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const columns = [
      {
        title: formatMessage({id:'componentOverview.body.ThirdPartyServices.instance_address'}),
        dataIndex: 'ip',
        key: '1'
      },
      {
        title: formatMessage({id:'componentOverview.body.ThirdPartyServices.health_state'}),
        dataIndex: 'status',
        align: 'center',
        key: '2',
        render: data => {
          const stateMap = {
            healthy: formatMessage({id:'componentOverview.body.ThirdPartyServices.health'}),
            unhealthy: formatMessage({id:'componentOverview.body.ThirdPartyServices.unhealth'}),
            notready: formatMessage({id:'componentOverview.body.ThirdPartyServices.not_ready'}),
            unknown: formatMessage({id:'componentOverview.body.ThirdPartyServices.unknown'})
          };
          return (
            <span
              style={{
                color:
                  data == 'healthy' ? 'green' : data == 'unhealthy' ? 'red' : ''
              }}
            >
              {stateMap[data] || <FormattedMessage id='componentOverview.body.ThirdPartyServices.not_online'/>}
            </span>
          );
        }
      }
    ];

    if (!isHelm) {
      columns.push({
        title: formatMessage({id:'componentOverview.body.ThirdPartyServices.operation'}),
        dataIndex: 'ep_id',
        key: '3',
        render: ep_id => (
          <a
            style={{ marginRight: '5px' }}
            onClick={() => {
              this.openDeleteVar(ep_id);
            }}
          >
            <FormattedMessage id='button.delete'/>
          </a>
        )
      });
    }

    const secret_key =
      api_service_key ||
      (appDetail.api_service_key ? appDetail.api_service_key : '');

    return (
      <Fragment>
        <Row gutter={24}>
          {visible && (
            <Modal
              title={<FormattedMessage id='componentOverview.body.ThirdPartyServices.add'/>}
              visible
              onOk={this.handleSubmit}
              onCancel={this.handleCancel}
            >
              <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.ThirdPartyServices.instance_address'/>}>
                {getFieldDecorator('ip', {
                  rules: [{ required: true, validator: this.validAttrName }],
                  initialValue: undefined
                })(<Input  placeholder={formatMessage({id:'componentOverview.body.ThirdPartyServices.input_address'})}/>)}
              </FormItem>
            </Modal>
          )}
          {appDetail.service.service_source === 'third_party' && (
            <Card
              title={<FormattedMessage id='componentOverview.body.ThirdPartyServices.service_instance'/>}
              extra={
                isHelm ? null : (
                  <div>
                    {appDetail.register_way !== 'kubernetes' && (
                      <Button
                        style={{ marginRight: '5px' }}
                        onClick={() => {
                          this.addInstance();
                        }}
                      >
                        <FormattedMessage id='menu.team.create'/>
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        this.handleGetList();
                      }}
                    >
                      <FormattedMessage id='button.freshen'/>
                    </Button>
                  </div>
                )
              }
            >
              <Row>
                <Col span={12}>
                  <p>
                    <b style={{ marginRight: 16 }}><FormattedMessage id='componentOverview.body.ThirdPartyServices.type'/></b>
                    {appDetail.register_way ? appDetail.register_way : ''}
                  </p>
                  {appDetail.api_url && (
                    <p>
                      <b style={{ marginRight: 16 }}><FormattedMessage id='componentOverview.body.ThirdPartyServices.api'/></b>
                      {appDetail.api_url ? appDetail.api_url : ''}
                      <div style={{ margin: '5px 0' }}>
                        <span>
                          <FormattedMessage id='componentOverview.body.ThirdPartyServices.key'/> <a>{secret_key}</a>
                          <CopyToClipboard
                            text={secret_key}
                            onCopy={() => {
                              notification.success({ message:  formatMessage({id:"notification.success.copy"})});
                            }}
                          >
                            <Button size="small" style={{ margin: '0 10px' }}>
                              <FormattedMessage id='button.copy'/>
                            </Button>
                          </CopyToClipboard>
                        </span>
                        <Button
                          size="small"
                          onClick={() => {
                            this.handleUpDatekey();
                          }}
                        >
                          
                          <FormattedMessage id='componentOverview.body.ThirdPartyServices.re_key'/>
                        </Button>
                      </div>
                    </p>
                  )}
                  {endpoint_num && (
                    <p>
                      <b style={{ marginRight: 16 }}><FormattedMessage id='componentOverview.body.ThirdPartyServices.number'/></b>
                      {endpoint_num > 0 ? endpoint_num : ''}
                    </p>
                  )}
                  {appDetail.endpoints_type === 'kubernetes' && (
                    <p>
                      <b style={{ marginRight: 16 }}></b>
                      {appDetail.kubernetes.namespace}/
                      {appDetail.kubernetes.serviceName}
                    </p>
                  )}
                  {appDetail.discovery_type && (
                    <p>
                      <b style={{ marginRight: 16 }}><FormattedMessage id='componentOverview.body.ThirdPartyServices.dynamic'/></b>
                      {appDetail.discovery_type}
                    </p>
                  )}
                  {appDetail.discovery_key && (
                    <p>
                      <b style={{ marginRight: 16 }}><FormattedMessage id='componentOverview.body.ThirdPartyServices.dynamic_key'/></b>
                      {appDetail.discovery_key}
                    </p>
                  )}
                </Col>
                {appDetail.api_url && (
                  <Col span={12}>
                    <span>
                      API
                      <FormattedMessage id='componentOverview.body.ThirdPartyServices.msg'/>
                    </span>
                    <div
                      style={{
                        background: '#000',
                        color: '#fff',
                        padding: '16px'
                      }}
                    >
                      {`curl -X PUT --url ${appDetail.api_url} -H "Content-Type: application/json" -d '{"secret_key":"${secret_key}","ip":"192.168.1.1","is_online":true}'`}
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </Row>
        <Row>
          <Table
            dataSource={list}
            columns={columns}
            style={{ background: '#fff', margin: '12px -12px 0 -12px' }}
          />
        </Row>
        {deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title={<FormattedMessage id='confirmModal.deldete.env.title'/>}
            desc={<FormattedMessage id='confirmModal.deldete.env.desc'/>}
            subDesc={<FormattedMessage id='confirmModal.deldete.env.subDesc'/>}
          />
        )}
      </Fragment>
    );
  }
}
