/* eslint-disable camelcase */
import { Button, Drawer, Form, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import PortInput from './portInput';

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ user, global, loading }) => ({
  currUser: user.currentUser,
  groups: global.groups,
  addTcpLoading: loading.effects['gateWay/addTcp'],
  editTcpLoading: loading.effects['gateWay/editTcp']
}))
class DrawerForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      serviceComponentList: [],
      portList: [],
      domain_port: '',
      end_point: '',
      isPerform: true
    };
  }
  resolveOk = e => {
    e.preventDefault();
    const { onOk } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        values.default_port =
          values.end_point && values.end_point.available_port;
        onOk && onOk(values);
      }
    });
  };
  componentDidMount() {
    const { appID } = this.props;
    this.props.dispatch({
      type: 'gateWay/querydomain_port',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            domain_port: data.list
          });
        }
      }
    });
    const { editInfo } = this.props;
    if (editInfo) {
      this.handleServices({ key: editInfo.g_id });
    }
    if (appID) {
      this.handleServices({ key: appID });
    }
  }
  /** 获取服务组件 */
  handleServices = groupObj => {
    const { isPerform } = this.state;
    const { dispatch, editInfo } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    /** 获取对应的group_name */
    dispatch({
      type: 'application/fetchApps',
      payload: {
        group_id: groupObj.key,
        team_name
      },
      callback: data => {
        if (data) {
          this.setState({ serviceComponentList: data.list }, () => {
            if (data.list && data.list.length > 0) {
              if (isPerform && editInfo) {
                this.handlePorts(editInfo.service_id, true);
                this.props.form.setFieldsValue({
                  service_id: editInfo.service_id
                });
              } else {
                this.handlePorts(data.list[0].service_id, false);
                this.props.form.setFieldsValue({
                  service_id: data.list[0].service_id
                });
              }
            }
          });
        }
      }
    });
  };
  /** 获取端口 */
  handlePorts = service_id => {
    const { dispatch, editInfo } = this.props;
    const { isPerform } = this.state;
    const team_name = globalUtil.getCurrTeamName();
    const service_obj = this.state.serviceComponentList.filter(item => {
      return item.service_id == service_id;
    });

    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        app_alias:
          service_obj &&
          service_obj.length > 0 &&
          service_obj[0].service_alias &&
          service_obj[0].service_alias,
        team_name
      },
      callback: data => {
        if (data) {
          this.setState({ portList: data.list }, () => {
            if (data.list && data.list.length > 0) {
              if (isPerform && editInfo) {
                this.setState({
                  isPerform: false
                });
                this.props.form.setFieldsValue({
                  container_port: editInfo.container_port
                });
              } else {
                this.props.form.setFieldsValue({
                  container_port: data.list[0].container_port
                });
              }
            }
          });
        }
      }
    });
  };
  handleChange = data => {};
  checkport = (rules, value, callback) => {
    const { tcpType, editInfo } = this.props;
    if (!value.ip || !value.available_port) {
      callback('请输入完整的ip和端口');
      return;
    }
    if (
      value.available_port &&
      value.available_port >= 1 &&
      value.available_port <= 65534
    ) {
      callback();
    } else {
      callback('请输入正确的端口:1-65534');
    }
  };
  render() {
    const {
      onClose,
      editInfo,
      addTcpLoading,
      editTcpLoading,
      appID
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { domain_port } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 }
      }
    };

    let rule_round;
    let current_enpoint;
    if (editInfo && editInfo.rule_extensions)
      rule_round = editInfo.rule_extensions.split(':')[1];

    if (editInfo && editInfo.end_point) {
      const end_pointArr = editInfo.end_point.split(':');
      current_enpoint = [
        {
          ip: end_pointArr[0],
          available_port: end_pointArr[1]
        }
      ];
    }

    return (
      <div>
        {domain_port && (
          <Drawer
            title={editInfo ? '编辑tcp/udp访问策略' : '添加tcp/udp访问策略'}
            placement="right"
            width={500}
            closable={false}
            onClose={onClose}
            visible={this.props.visible}
            maskClosable={false}
            closable
            zIndex={1001}
            style={{
              overflow: 'auto'
            }}
          >
            <Form>
              <h3
                style={{
                  borderBottom: '1px solid #BBBBBB',
                  marginBottom: '10px'
                }}
              >
                路由规则
              </h3>

              <FormItem {...formItemLayout} label="IP">
                {getFieldDecorator('end_point', {
                  rules: [{ required: true, validator: this.checkport }],
                  initialValue: editInfo ? current_enpoint[0] : domain_port[0]
                })(
                  <PortInput
                    current_enpoint={current_enpoint}
                    domain_port={domain_port}
                    onChange={this.handleChange}
                  />
                )}
              </FormItem>
              <h3
                style={{
                  borderBottom: '1px solid #BBBBBB',
                  marginBottom: '10px'
                }}
              >
                访问目标
              </h3>

              <FormItem
                {...formItemLayout}
                label="应用名称"
                style={{ zIndex: 10011 }}
              >
                {getFieldDecorator('group_id', {
                  rules: [{ required: true, message: '请选择应用' }],
                  initialValue: appID
                    ? { key: appID }
                    : editInfo && editInfo.g_id && editInfo.group_name
                    ? {
                        key: editInfo.g_id,
                        label: editInfo.group_name
                      }
                    : undefined
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    labelInValue
                    disabled={appID}
                    placeholder="请选择要所属应用"
                    onChange={this.handleServices}
                  >
                    {(this.props.groups || []).map((group, index) => {
                      return (
                        <Option value={`${group.group_id}`} key={index}>
                          {group.group_name}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="组件"
                style={{ zIndex: 10011 }}
              >
                {getFieldDecorator('service_id', {
                  rules: [{ required: true, message: '请选择' }],
                  initialValue:
                    editInfo && editInfo.service_id
                      ? editInfo.service_id
                      : this.state.serviceComponentList &&
                        this.state.serviceComponentList.length > 0
                      ? this.state.serviceComponentList[0].service_id
                      : undefined
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder="请选择组件"
                    onChange={this.handlePorts}
                  >
                    {(this.state.serviceComponentList || []).map(
                      (service, index) => {
                        return (
                          <Option value={`${service.service_id}`} key={index}>
                            {service.service_cname}
                          </Option>
                        );
                      }
                    )}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="端口号"
                style={{ zIndex: 10011 }}
              >
                {getFieldDecorator('container_port', {
                  rules: [{ required: true, message: '请选择端口号' }],
                  initialValue:
                    editInfo && editInfo.container_port
                      ? editInfo.container_port
                      : this.state.portList && this.state.portList.length > 0
                      ? this.state.portList[0].container_port
                      : undefined
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder="请选择端口号"
                  >
                    {(this.state.portList || []).map((port, index) => {
                      return (
                        <Option value={port.container_port} key={index}>
                          {port.container_port}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="负载均衡"
                style={{ zIndex: 10011 }}
              >
                {getFieldDecorator('rule_extensions', {
                  initialValue: rule_round || 'round-robin'
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder="请选择负载均衡类型"
                  >
                    <Option value="round-robin">轮询</Option>
                  </Select>
                )}
              </FormItem>
            </Form>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                borderTop: '1px solid #e8e8e8',
                padding: '10px 16px',
                textAlign: 'right',
                left: 0,
                background: '#fff',
                borderRadius: '0 0 4px 4px',
                zIndex: 99999
              }}
            >
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                onClick={this.resolveOk}
                type="primary"
                loading={addTcpLoading || editTcpLoading}
              >
                确认
              </Button>
            </div>
          </Drawer>
        )}
      </div>
    );
  }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;
