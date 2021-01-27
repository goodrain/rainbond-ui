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
      is_online: true,
      api_service_key: ''
    };
  }

  componentDidMount() {
    this.handleGetList();
  }
  onChange = () => {
    const { is_online } = this.state;
    this.props.form.setFieldsValue({
      is_online: !is_online
    });
    this.setState({
      is_online: !is_online
    });
  };
  showConfirm = () => {
    const _th = this;
    confirm({
      title: '端口未开启',
      content: '上线前必须开启端口对内或对外属性',
      okText: '去配置',
      onOk() {
        _th.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              _th.props.appAlias
            }/port`
          )
        );
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  handleGetList = () => {
    this.props.dispatch({
      type: 'appControl/getInstanceList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
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
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ep_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleGetList();
          this.cancelDeleteVar();
        }
      }
    });
  };
  handleModify = status => {
    // 上online， 下offline线
    this.props.dispatch({
      type: 'appControl/modifyInstanceList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ep_id: status.ep_id,
        is_online: !status.is_online
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
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.props.dispatch({
        type: 'appControl/addInstanceList',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ip: fieldsValue.ip,
          is_online: fieldsValue.is_online
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({ visible: false });
            this.handleGetList();
          }
        }
      });
    });
  };
  handleCancel = () => {
    this.setState({ visible: false, is_online: false });
  };
  validAttrName = (rule, value, callback) => {
    if (!value || value === '') {
      callback('请输入正确的IP地址');
      return;
    }

    if (value === '1.1.1.1') {
      callback('不支持1.1.1.1地址');
    }

    if (
      !regs.test(value || '') &&
      !rega.test(value || '') &&
      !rege.test(value || '')
    ) {
      callback('请输入正确的地址');
      return;
    }

    callback();
  };
  handleUpDatekey = () => {
    this.props.dispatch({
      type: 'appControl/editUpDatekey',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            api_service_key: res.bean.api_service_key
          });
        }
      }
    });
  };

  render() {
    const { list, endpoint_num, api_service_key, visible } = this.state;
    const { appDetail } = this.props;
    const { getFieldDecorator } = this.props.form;
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
        title: '实例地址',
        dataIndex: 'ip',
        key: '1'
      },
      {
        title: '健康状态',
        dataIndex: 'status',
        key: '2',
        render: data => {
          return (
            <span
              style={{
                color:
                  data == 'healthy' ? 'green' : data == 'unhealthy' ? 'red' : ''
              }}
            >
              {data == 'healthy'
                ? '健康'
                : data == 'unhealthy'
                ? '不健康'
                : data == 'unknown'
                ? '未知'
                : '-'}
            </span>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'ep_id',
        key: '3',
        render: (ep_id, status) => (
          <div>
            {status.is_static && (
              <div>
                <a
                  style={{ marginRight: '5px' }}
                  onClick={() => {
                    this.openDeleteVar(ep_id);
                  }}
                >
                  删除
                </a>
              </div>
            )}
          </div>
        )
      }
    ];

    let num = 0;
    if (
      appDetail &&
      appDetail.register_way &&
      appDetail.register_way === 'static' &&
      appDetail.service &&
      appDetail.service.service_source &&
      appDetail.service.service_source === 'third_party' &&
      list &&
      list.length > 0
    ) {
      list.map(item => {
        if (
          !rege.test(item.address) &&
          (regs.test(item.address) || rega.test(item.address))
        ) {
          num++;
        }
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
              title="新增实例"
              visible
              onOk={this.handleSubmit}
              onCancel={this.handleCancel}
            >
              <FormItem {...formItemLayout} label="实例地址">
                {getFieldDecorator('ip', {
                  rules: [
                    { required: true },
                    { validator: this.validAttrName }
                  ],
                  initialValue: undefined
                })(<Input placeholder="请输入实例地址" />)}
              </FormItem>
              <FormItem {...formItemLayout} label="是否上线">
                {getFieldDecorator('is_online', {
                  rules: [{ required: true, message: '请输入key!' }],
                  initialValue: this.state.is_online
                })(
                  <RadioGroup>
                    <Radio
                      onClick={() => {
                        this.onChange();
                      }}
                      value
                    >
                      上线
                    </Radio>
                  </RadioGroup>
                )}
              </FormItem>
            </Modal>
          )}
          {appDetail.service.service_source === 'third_party' && (
            <Card
              title="服务实例"
              extra={
                <div>
                  <Button
                    style={{ marginRight: '5px' }}
                    onClick={() => {
                      this.addInstance();
                    }}
                  >
                    新增
                  </Button>

                  <Button
                    onClick={() => {
                      this.handleGetList();
                    }}
                  >
                    刷新
                  </Button>
                </div>
              }
            >
              <Row>
                <Col span={12}>
                  <p>
                    注册方式：{' '}
                    {appDetail.register_way ? appDetail.register_way : ''}
                  </p>
                  {appDetail.api_url && (
                    <p>
                      API地址： {appDetail.api_url ? appDetail.api_url : ''}
                      <div style={{ margin: '5px 0' }}>
                        <span>
                          秘钥： <a>{secret_key}</a>
                          <CopyToClipboard
                            text={secret_key}
                            onCopy={() => {
                              notification.success({ message: '复制成功' });
                            }}
                          >
                            <Button size="small" style={{ margin: '0 10px' }}>
                              复制
                            </Button>
                          </CopyToClipboard>
                        </span>
                        <Button
                          size="small"
                          onClick={() => {
                            this.handleUpDatekey();
                          }}
                        >
                          重置密钥
                        </Button>
                      </div>
                    </p>
                  )}
                  {endpoint_num && (
                    <p>当前实例数: {endpoint_num > 0 ? endpoint_num : ''}</p>
                  )}
                  {appDetail.discovery_type && (
                    <p>动态类型: {appDetail.discovery_type}</p>
                  )}
                  {appDetail.discovery_key && (
                    <p>动态key: {appDetail.discovery_key}</p>
                  )}
                </Col>
                {appDetail.api_url && (
                  <Col span={12}>
                    <span>
                      API
                      调用参考（将其中的192.168.1.1修改为你的真实IP地址即可）：
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
        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除吗？"
            subDesc="此操作不可恢复"
          />
        )}
      </Fragment>
    );
  }
}
