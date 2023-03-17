/* eslint-disable no-param-reassign */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable react/self-closing-comp */
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
  Select,
  Skeleton,
  Spin,
  Collapse,
  Switch,
  Radio,
  notification
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import RoutingRule from '@/components/RoutingRule';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import rainbondUtil from '../../utils/rainbond';
import teamUtil from '../../utils/team';
import DAHosts from '../DAHosts';
import userUtil from '../../utils/user';
import styles from './index.less';
import Parameterinput from '../Parameterinput';
import { login } from '@/services/user';

const FormItem = Form.Item;
const { Option, OptGroup } = Select;
const { Panel } = Collapse;

@connect(({ user, loading, global }) => ({
  currUser: user.currentUser,
  enterprise: global.enterprise,
  addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
  editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy'],
  groups: global.groups,
}))
class DrawerForm extends PureComponent {
  constructor(props) {
    super(props);
    const { editInfo } = this.props;

    this.state = {
      language: cookie.get('language') === 'zh-CN' ? true : false,
      gateWayArr: [],
      GateWayIpList: [],
      gateWayNamespace: '',
      loadBalancerArr: [],
      nodePortArr: [],
      portsArr: [],
      nameSpace: ''
    };
  }

  componentDidMount() {
    this.handleBatchGateWay()
    this.fetchServiceID()
  }

  componentWillMount() {
  }

  // 
  handleOk = (type) => {
    const { gateWayNamespace } = this.state;
    const { onOk, form } = this.props;
    let matches_ruleErr = true;
    let backend_refs_ruleErr = true;
    let filters_ruleErr = true;
    form.validateFields((err, values) => {
      // if (!err && onOk) {
      if (!err && onOk) {
        values && values.rules.map((item, index) => {
          const rule = item
          if (rule && rule.matches_rule) {
            rule.matches_rule.map(item => {
              let pathEmpty = true;
              let headerEmpty = true;
              const { headers, path } = item
              if (path) {
                if (path.type == "" && path.value == "") {
                  pathEmpty = false;
                }
              }
              headers && headers.map(item => {
                if (item.name == "" && item.type == "" && item.value == "") {
                  headerEmpty = false;
                }
              })
              if (pathEmpty || headerEmpty) {
                if (pathEmpty && path) {
                  if (path.type == undefined || path.value == "" || path.type == '') {
                    notification.warning({
                      message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.pathEmpty' })
                    });
                    matches_ruleErr = false
                  }
                } else {
                  item.path = null
                }
                if (headerEmpty && headers) {
                  headers && headers.map(header_item => {
                    if (header_item.name == "" || header_item.type == undefined || header_item.value == "" || header_item.type == '') {
                      notification.warning({
                        message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.headerEmpty' })
                      });
                      matches_ruleErr = false
                    }
                  })
                } else {
                  item.headers = null
                }
              }
              if (!headerEmpty && !pathEmpty) {
                rule.matches_rule = null
              }
            })
          }
          if (rule && rule.backend_refs_rule) {
            rule.backend_refs_rule.map(item => {
              let allEmpty = true;
              if (item.name == "") {
                rule.backend_refs_rule = null
              } else {
                if (item.name == "" && item.weight == "" && item.kind == "" && item.namespace == "") {
                  allEmpty = false;
                  notification.warning({
                    message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.backend' })
                  });
                  backend_refs_ruleErr = false
                }
                if (allEmpty) {
                  if (item.name == "" || item.weight == "" || item.kind == "" || item.namespace == "" || item.kind == undefined) {
                    notification.warning({
                      message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.allEmpty' })
                    });
                    backend_refs_ruleErr = false
                  }
                  if (item.weight != "") {
                    item.weight = Number(item.weight)
                  }
                  if (item.kind == "Service" && item.port == '') {
                    notification.warning({
                      message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Service' })
                    });
                    backend_refs_ruleErr = false
                  } else {
                    item.port = Number(item.port)
                  }
                }
              }
            })
          }
          if (rule && rule.filters_rule) {
            rule.filters_rule.map(item => {
              const { request_redirect } = item
              if (request_redirect) {
                if (item.type == 'RequestRedirect') {
                  request_redirect.port = Number(request_redirect.port)
                  request_redirect.status_code = Number(request_redirect.status_code)
                  item.request_header_modifier = null
                } else if (item.type == 'RequestHeaderModifier') {
                  item.request_redirect = null
                } else {
                  rule.filters_rule = null
                }
                if (item.type == 'RequestRedirect' && request_redirect.hostname == "") {
                  notification.warning({
                    message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.RequestRedirect' })
                  });
                  return
                  filters_ruleErr = false
                }
              }
            })
          }
        })
        if (matches_ruleErr && backend_refs_ruleErr && filters_ruleErr) {
          onOk(values, gateWayNamespace, type);
        }
      }
      // }
    });
  };

  // 获取 gateway 下拉列表
  handleBatchGateWay = () => {
    const { dispatch, currUser } = this.props
    const regionName = globalUtil.getCurrRegionName()
    dispatch({
      type: 'gateWay/getBatchGateWay',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: regionName
      },
      callback: res => {
        this.setState({
          gateWayArr: res.list,
          gateWayNamespace: res.list[0].namespace,
          listener_namesArr: res.list[0].listener_names,
          loadBalancerArr: res.list[0].load_balancer_ip ? res.list[0].load_balancer_ip : [],
          nodePortArr: res.list[0].node_port_ip ? res.list[0].node_port_ip : [],
        })
      }
    })
  }
  // 获取 gateway 下拉列表
  fetchServiceID = () => {
    const { dispatch, currUser } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'teamControl/fetchServiceID',
      payload: {
        team_name: teamName
      },
      callback: res => {
        this.setState({
          nameSpace: res.bean.namespace || '',
          portsArr: res.bean.ports || []
        })
      }
    })
  }


  handleGateWayIp = (value) => {
    const name = value.name
    const namespace = value.namespace
    this.setState({
      gateWayNamespace: value.namespace,
      loadBalancerArr: value.load_balancer_ip ? value.load_balancer_ip : [],
      nodePortArr: value.node_port_ip ? value.node_port_ip : [],
      listener_namesArr: value.listener_names
    })
  }
  render() {
    const {
      onClose,
      enterprise,
      groups,
      editInfo,
      addHttpStrategyLoading,
      editHttpStrategyLoading,
      appID
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 21 },
        sm: { span: 21 }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 18 },
        sm: { span: 18 }
      }
    };
    const zh_formItemLayouts = {
      labelCol: {
        xs: { span: 7 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 17 },
        sm: { span: 17 }
      }
    };
    const en_formItemLayouts = {
      labelCol: {
        xs: { span: 10 },
        sm: { span: 10 }
      },
      wrapperCol: {
        xs: { span: 14 },
        sm: { span: 14 }
      },
    };

    const {
      language,
      gateWayArr,
      GateWayIpList,
      gateWayNamespace,
      listener_namesArr,
      loadBalancerArr,
      nodePortArr,
      nameSpace,
      portsArr
    } = this.state;
    const is_languages = language ? zh_formItemLayouts : en_formItemLayouts
    const is_language = language ? formItemLayout : formItemLayouts
    const rules = [
      {
        matches_rule: [
          {
            path: {
              type: "",
              value: ""
            },
            headers: [
              {
                name: "",
                type: "",
                value: ""
              }
            ]
          }
        ],
        backend_refs_rule: [
          {
            name: "",
            weight: 100,
            kind: "Service",
            namespace: nameSpace,
            port: 80
          }
        ],
        filters_rule: [
          {
            type: "",
            request_header_modifier: {
              set: [
                {
                  name: "",
                  value: ""
                }
              ],
              add: [
                {
                  name: "",
                  value: ""
                }
              ],
              remove: [
                ""
              ]
            },
            request_redirect: {
              scheme: "",
              hostname: "",
              port: '',
              status_code: ''
            }

          }
        ],
      }
    ]
    return (
      <div>
        <Drawer
          title={editInfo ? formatMessage({ id: 'teamGateway.DrawerGateWayAPI.edit' }) : formatMessage({ id: 'teamGateway.DrawerGateWayAPI.add' })}
          placement="right"
          width={650}
          closable={false}
          onClose={onClose}
          visible={this.props.visible}
          maskClosable={false}
          style={{
            overflow: 'auto'
          }}
        >
          <Form>
            <Form.Item {...is_language} label={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.type' })}>
              {getFieldDecorator('gateway_class_name', {
                initialValue: (editInfo && editInfo.gateway_name) || (gateWayArr.length > 0 ? gateWayArr[0].name : null),
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'placeholder.appName' })}
                >
                  {(gateWayArr || []).map(item => {
                    return (
                      <Option onClick={() => { this.handleGateWayIp(item) }} key={item.name} value={item.name}>
                        {item.name}
                      </Option>
                    )
                  })}
                </Select>
              )}
              {loadBalancerArr && loadBalancerArr.length > 0 &&
                <Row>
                  <Col span={6} style={{ textAlign: 'end', paddingRight: 20 }}><h4 style={{ marginBottom: 0 }}>LoadBalancer:</h4></Col>
                  <Col span={18}>
                    {loadBalancerArr.map((item) => {
                      return (
                        <div >
                          <span style={{ width: '40%', fontWeight: 'bold', fontSize: '14px', color: 'red' }}>
                            {item}
                          </span>
                        </div>
                      )
                    })}
                  </Col>
                </Row>
              }
              {nodePortArr && nodePortArr.length > 0 &&
                <Row>
                  <Col span={6} style={{ textAlign: 'end', paddingRight: 20 }}><h4 style={{ marginBottom: 0 }}>NodePort:</h4></Col>
                  <Col span={18}>
                    {nodePortArr.map((item) => {
                      return (
                        <div>
                          <span style={{ width: '40%', fontWeight: 'bold', fontSize: '14px', color: 'red' }}>
                            {item}
                          </span>
                        </div>
                      )
                    })
                    }
                  </Col>
                </Row>
              }
            </Form.Item>
            <Form.Item {...is_language} label={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Filtration.Listening' })}>
              {getFieldDecorator('section_name', {
                initialValue: editInfo ? (editInfo.section_name == "" ? "all" : editInfo.section_name) : "all",
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Filtration.select_Listening' })}
                >
                  <Option key={"all"} value={"all"}>
                    {formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Filtration.all_Listening' })}
                  </Option>
                  {(listener_namesArr || []).map((item, index) => {
                    return (
                      <Option key={index} value={item}>
                        {item}
                      </Option>
                    )
                  })}

                </Select>
              )}
            </Form.Item>
            <FormItem {...is_language} label={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.hosts' })}>
              {getFieldDecorator('hosts', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.hostPlaceholder' })
                  },
                  {
                    pattern: /^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/,
                    message: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.input_hosts' })
                  }
                ],
                initialValue: editInfo ? editInfo.hosts : null
              })(<DAHosts />)}
            </FormItem>
            {!appID &&
              <FormItem {...is_language} label={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.appName' })}>
                {getFieldDecorator('group_id', {
                  rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }],
                  initialValue: editInfo ? `${editInfo.app_id}` : ''
                })(
                  <Select
                    placeholder={formatMessage({ id: 'placeholder.appName' })}
                  >
                    {(groups || []).map(group => {
                      return (
                        <Option
                          value={`${group.group_id}`}
                          key={group.group_id}
                        >
                          {group.group_name}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>}

            <FormItem {...is_language} label={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.rules' })}>
              {getFieldDecorator('rules', {
                initialValue: editInfo ? editInfo.rules : rules
              })(<RoutingRule isEdit={editInfo ? true : false} ports={portsArr} nameSpace={nameSpace} />)}
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
              {formatMessage({ id: 'popover.cancel' })}
            </Button>
            <Button
              onClick={() => {
                this.handleOk(editInfo ? "edit" : "add");
              }}
              type="primary"
              loading={addHttpStrategyLoading || editHttpStrategyLoading}
            >
              {formatMessage({ id: 'popover.confirm' })}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;
