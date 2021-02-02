/* eslint-disable camelcase */
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Form,
  Icon,
  Input,
  InputNumber,
  Modal,
  Row,
  Select
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import DAinput from '../DAinput';
import styles from './index.less';

const FormItem = Form.Item;
const { Option, OptGroup } = Select;

@connect(({ user, loading, global }) => ({
  currUser: user.currentUser,
  enterprise: global.enterprise,
  addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
  editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
}))
class DrawerForm extends PureComponent {
  constructor(props) {
    super(props);
    const { editInfo } = this.props;
    this.state = {
      serviceComponentList: [],
      portList: [],
      licenseList: [],
      isAddLicense: false,
      page: 1,
      page_size: 10,
      service_id: '',
      group_name: '',
      descriptionVisible: false,
      rule_extensions_visible: false,
      automaticCertificateVisible: (editInfo && editInfo.auto_ssl) || false,
      isPerform: true,
      routingConfiguration: !!(
        props.editInfo &&
        (props.editInfo.domain_heander ||
          props.editInfo.domain_cookie ||
          // props.editInfo.the_weight ||
          props.editInfo.certificate_id)
      )
    };
  }
  componentWillMount() {
    this.heandleEditInfo(this.props);
  }

  heandleEditInfo = props => {
    const { page, page_size } = this.state;
    const { dispatch, editInfo, appID } = props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: 'appControl/fetchCertificates',
      payload: {
        team_name,
        page,
        page_size
      },
      callback: data => {
        if (data && data.list) {
          const listNum = (data.bean && data.bean.nums) || 0;
          const isAdd = !!(listNum && listNum > page_size);
          this.setState({ licenseList: data.list, isAddLicense: isAdd });
        }
      }
    });
    if (editInfo) {
      this.handleServices({ key: editInfo.g_id });
    }
    if (appID) {
      this.handleServices({ key: appID });
    }
  };

  addLicense = () => {
    this.setState(
      {
        page_size: this.state.page_size + 10
      },
      () => {
        this.heandleEditInfo(this.props);
      }
    );
  };
  handleOk = e => {
    e.preventDefault();
    const { onOk } = this.props;
    const { group_name } = this.state;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        if (values.certificate_id === 'auto_ssl') {
          values.auto_ssl = true;
          values.certificate_id = undefined;
        }

        onOk && onOk(values, group_name);
      }
    });
  };
  /** 获取组件 */
  handleServices = groupObj => {
    const { isPerform } = this.state;
    const { dispatch, editInfo, groups } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    /** 获取对应的group_name */
    let group_obj = null;
    if (groups) {
      group_obj = groups.filter(item => {
        return item.group_id == groupObj.key;
      });
    }
    if (group_obj && group_obj.length > 0) {
      this.setState({ group_name: group_obj[0].group_name });
    }
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
  /** 介绍域名说明 */
  showDescription = () => {
    this.setState({
      descriptionVisible: true
    });
  };
  handleOk_description = () => {
    this.setState({
      descriptionVisible: false
    });
  };
  handeCertificateSelect = value => {
    if (value) {
      this.setState({
        rule_extensions_visible: true
      });
    }
    this.setState({
      automaticCertificateVisible: value === 'auto_ssl'
    });
  };

  handleRoutingConfiguration = () => {
    this.setState({
      routingConfiguration: !this.state.routingConfiguration
    });
  };
  render() {
    const {
      onClose,
      enterprise,
      groups,
      editInfo,
      addHttpStrategyLoading,
      editHttpStrategyLoading
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 19 },
        sm: { span: 19 }
      }
    };
    // const currentGroup = editInfo ? editInfo.g_id : groups.lenth > 0 ? groups[0].group_id : null;
    let rule_http;
    let rule_round;
    if (editInfo && editInfo.rule_extensions) {
      editInfo.rule_extensions.split(',').map(item => {
        if (item.includes('httptohttps')) {
          rule_http = item.split(':')[0];
        } else if (item.includes('lb-type')) {
          rule_round = item.split(':')[1];
        }
      });
    }
    /** 筛选当前的集群 */

    let currentRegion = '';
    const { currUser, appID } = this.props;
    const currTeam = userUtil.getTeamByTeamName(
      currUser && currUser,
      globalUtil.getCurrTeamName()
    );
    const currRegionName = globalUtil.getCurrRegionName();
    if (currTeam) {
      currentRegion = teamUtil.getRegionByName(currTeam, currRegionName);
    }
    const AutomaticCertificate = rainbondUtil.CertificateIssuedByEnable(
      enterprise
    );
    const AutomaticCertificateValue = rainbondUtil.CertificateIssuedByValue(
      enterprise
    );
    const AutomaticCertificateDeleteValue =
      JSON.parse(AutomaticCertificateValue) || false;

    const {
      routingConfiguration,
      licenseList,
      isAddLicense,
      automaticCertificateVisible
    } = this.state;
    const dividers = <Divider style={{ margin: '4px 0' }} />;
    return (
      <div>
        <Drawer
          title={editInfo ? '编辑Http访问策略' : '添加http访问策略'}
          placement="right"
          width={500}
          closable={false}
          onClose={onClose}
          visible={this.props.visible}
          maskClosable={false}
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
            <FormItem
              {...formItemLayout}
              label="域名"
              className={styles.antd_form}
            >
              {getFieldDecorator('domain_name', {
                rules: [
                  {
                    required: true,
                    message: '请添加域名'
                  },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: '请填写正确的域名格式，支持泛域名'
                  }
                ],
                initialValue: editInfo.domain_name
              })(<Input placeholder="请输入域名" />)}
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                <a href="javascript:void(0)" onClick={this.showDescription}>
                  请将域名解析到：{currentRegion && currentRegion.tcpdomain}
                </a>
              </span>
            </FormItem>
            <FormItem {...formItemLayout} label="Location">
              {getFieldDecorator('domain_path', {
                rules: [
                  {
                    required: false,
                    message: '/'
                  },
                  {
                    pattern: /^\/+.*/,
                    message: '请输入绝对路径'
                  }
                ],
                initialValue: editInfo.domain_path
              })(<Input placeholder="/" />)}
            </FormItem>

            {!routingConfiguration && (
              <div>
                <p style={{ textAlign: 'center' }}>
                  更多高级路由参数
                  <br />
                  <Icon type="down" onClick={this.handleRoutingConfiguration} />
                </p>
              </div>
            )}

            {routingConfiguration && (
              <div>
                <FormItem {...formItemLayout} label="请求头">
                  {getFieldDecorator('domain_heander', {
                    initialValue: editInfo.domain_heander
                  })(<DAinput />)}
                </FormItem>
                <FormItem {...formItemLayout} label="Cookie">
                  {getFieldDecorator('domain_cookie', {
                    initialValue: editInfo.domain_cookie
                  })(<DAinput />)}
                </FormItem>
                <FormItem {...formItemLayout} label="权重">
                  {getFieldDecorator('the_weight', {
                    initialValue: editInfo.the_weight || 100
                  })(
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  )}
                </FormItem>
                {licenseList && (
                  <FormItem
                    {...formItemLayout}
                    label="HTTPs证书"
                    style={{ zIndex: 999 }}
                  >
                    {getFieldDecorator('certificate_id', {
                      initialValue:
                        AutomaticCertificate && editInfo.auto_ssl
                          ? 'auto_ssl'
                          : editInfo.certificate_id
                    })(
                      <Select
                        placeholder="请绑定证书"
                        onSelect={this.handeCertificateSelect}
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            {isAddLicense && (
                              <div>
                                {dividers}
                                <div
                                  style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                  }}
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={this.addLicense}
                                >
                                  <Icon type="plus" /> 加载更多
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      >
                        <OptGroup label="功能选择">
                          {licenseList && licenseList.length > 0 && (
                            <Option value="" key={99}>
                              移除证书绑定
                            </Option>
                          )}
                          {AutomaticCertificate && (
                            <Option value="auto_ssl" key="auto_ssl">
                              自动签发证书（由控制器自动完成证书签发和匹配）
                            </Option>
                          )}
                        </OptGroup>
                        <OptGroup label="已有证书选择">
                          {licenseList.map((license, index) => {
                            return (
                              <Option value={license.id} key={index}>
                                {license.alias}
                              </Option>
                            );
                          })}
                        </OptGroup>
                      </Select>
                    )}
                  </FormItem>
                )}
                {AutomaticCertificate &&
                  automaticCertificateVisible &&
                  AutomaticCertificateDeleteValue && (
                    <FormItem {...formItemLayout} label="认证配置">
                      {getFieldDecorator('auto_ssl_config', {
                        initialValue: editInfo.auto_ssl_config,
                        rules: [
                          {
                            required: true,
                            message: '请选择签发证书认证配置'
                          }
                        ]
                      })(
                        <Select placeholder="请选择签发证书认证配置">
                          {Object.keys(AutomaticCertificateDeleteValue).map(
                            item => {
                              return <Option value={item}>{item}</Option>;
                            }
                          )}
                        </Select>
                      )}
                    </FormItem>
                  )}

                <FormItem {...formItemLayout} label="扩展功能">
                  {(this.state.rule_extensions_visible ||
                    (editInfo.certificate_id && rule_http)) &&
                    getFieldDecorator('rule_extensions_http', {
                      initialValue: [rule_http]
                    })(
                      <Checkbox.Group>
                        <Row>
                          <Col span={24}>
                            <Checkbox value="httptohttps">
                              HTTP Rewrite HTTPs
                            </Checkbox>
                          </Col>
                        </Row>
                      </Checkbox.Group>
                    )}
                  <FormItem>
                    {getFieldDecorator('rule_extensions_round', {
                      initialValue: rule_round || 'round-robin'
                    })(
                      <Select placeholder="请选择负载均衡类型">
                        <Option value="round-robin">负载均衡算法：轮询</Option>
                        <Option value="cookie-session-affinity">
                          负载均衡算法：会话保持
                        </Option>
                      </Select>
                    )}
                  </FormItem>
                </FormItem>

                <div style={{ textAlign: 'center' }}>
                  <Icon type="up" onClick={this.handleRoutingConfiguration} />
                </div>
              </div>
            )}
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
              style={{ zIndex: 999 }}
            >
              {getFieldDecorator('group_id', {
                rules: [{ required: true, message: '请选择' }],
                initialValue: appID
                  ? { key: appID }
                  : (editInfo && {
                      key: editInfo.g_id,
                      label: editInfo.group_name
                    }) ||
                    undefined
              })(
                <Select
                  labelInValue
                  disabled={appID}
                  placeholder="请选择要所属应用"
                  onChange={this.handleServices}
                >
                  {(groups || []).map(group => {
                    return (
                      <Option value={`${group.group_id}`} key={group.group_id}>
                        {group.group_name}
                      </Option>
                    );
                  })}
                </Select>
              )}
            </FormItem>
            <FormItem {...formItemLayout} label="组件" style={{ zIndex: 999 }}>
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
                <Select placeholder="请选择组件" onChange={this.handlePorts}>
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
              style={{ zIndex: 999, marginBottom: '150px' }}
            >
              {getFieldDecorator('container_port', {
                initialValue:
                  editInfo && editInfo.container_port
                    ? editInfo.container_port
                    : this.state.portList && this.state.portList.length > 0
                    ? this.state.portList[0].container_port
                    : undefined,
                rules: [{ required: true, message: '请选择端口号' }]
              })(
                <Select placeholder="请选择端口号">
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
              zIndex: 9999
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
              onClick={this.handleOk}
              type="primary"
              loading={addHttpStrategyLoading || editHttpStrategyLoading}
            >
              确认
            </Button>
          </div>
        </Drawer>
        {this.state.descriptionVisible && (
          <Modal
            closable={false}
            title="域名解析说明"
            visible={this.state.descriptionVisible}
            onOk={this.handleOk_description}
            footer={[
              <Button
                type="primary"
                size="small"
                onClick={this.handleOk_description}
              >
                确定
              </Button>
            ]}
            zIndex={9999}
          >
            <ul className={styles.ulStyle}>
              <li>
                1.HTTP访问控制策略是基于“域名"等组成路由规则，你需要在所绑定域名的域名服务商增加域名DNS
                A记录 到当前集群的应用网关出口IP地址之上域名访问即可生效。
              </li>
              <li>
                2.当前集群（
                {currentRegion && currentRegion.team_region_alias}
                ）出口IP地址是: {currentRegion && currentRegion.tcpdomain}
              </li>
              <li>3.如有疑问请联系平台运营管理员</li>
            </ul>
          </Modal>
        )}
      </div>
    );
  }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;
