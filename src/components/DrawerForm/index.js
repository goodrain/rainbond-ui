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
  Spin
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import DAinput from '../DAinput';
import DAinputs from '../DAinputs';
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
      componentLoading: false,
      portLoading: false,
      serviceComponentList: [],
      serviceComponentLoading: true,
      portList: [],
      licenseList: [],
      isAddLicense: false,
      page: 1,
      page_size: 99999,
      group_name: '',
      descriptionVisible: false,
      rule_extensions_visible: false,
      is_httptohttps: true,
      automaticCertificateVisible: (editInfo && editInfo.auto_ssl) || false,
      isPerform: true,
      rewrite: false,
      routingConfiguration: !!(
        props.editInfo &&
        (props.editInfo.domain_heander ||
          props.editInfo.domain_cookie ||
          props.editInfo.path_rewrite ||
          (props.editInfo.rewrites && props.editInfo.rewrites.length > 0) ||
          props.editInfo.certificate_id)
      )
    };
  }
  componentWillMount() {
    this.heandleEditInfo(this.props);
  }

  heandleEditInfo = props => {
    const { dispatch, editInfo, appID } = props;
    const { page, page_size } = this.state;
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
    if (editInfo || appID) {
      this.handleServices({ key: (editInfo && editInfo.g_id) || appID });
    } else {
      this.setState({
        serviceComponentLoading: false
      });
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
  handleOk = () => {
    const { onOk, form } = this.props;
    const { group_name, routingConfiguration } = this.state;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        // 过滤
        if (values.rewrites && values.rewrites.length > 0) {
          values.rewrites = values.rewrites.filter(
            item => item.regex && item.flag && item.replacement
          );
        }
        const info = Object.assign({}, values);
        if (values.certificate_id === 'auto_ssl') {
          info.auto_ssl = true;
          info.certificate_id = undefined;
        }
        if (values.domain_heander === '=') {
          info.domain_heander = '';
        }
        if (values.domain_cookie === '=') {
          info.domain_cookie = '';
        }
        onOk(info, group_name, routingConfiguration);
      }
    });
  };
  /** 获取组件 */
  handleServices = groupObj => {
    this.handleComponentLoading(true);
    const { dispatch, editInfo, groups, form } = this.props;
    const { setFieldsValue } = form;
    const { isPerform } = this.state;
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
        page_size: -1,
        group_id: groupObj.key,
        team_name
      },
      callback: data => {
        const list = (data && data.list) || [];
        this.setState(
          {
            serviceComponentList: list,
            serviceComponentLoading: false
          },
          () => {
            let serviceId =
              (list && list.length > 0 && list[0].service_id) || undefined;
            const info = {};
            if (serviceId) {
              const services = list.filter(item => {
                return item.service_id === (editInfo && editInfo.service_id);
              });
              if (isPerform && services.length > 0) {
                serviceId = editInfo.service_id;
              }
              this.handlePorts(serviceId);
            } else {
              info.container_port = undefined;
            }
            info.service_id = serviceId;
            setFieldsValue(info);
          }
        );
        this.handleComponentLoading(false);
      }
    });
  };
  handleComponentLoading = loading => {
    this.setState({
      componentLoading: loading
    });
  };
  handlePortLoading = loading => {
    this.setState({
      portLoading: loading
    });
  };

  /** 获取端口 */
  handlePorts = service_id => {
    this.handlePortLoading(true);
    const { dispatch, editInfo, form } = this.props;
    const { isPerform, serviceComponentList } = this.state;
    const { setFieldsValue } = form;
    const team_name = globalUtil.getCurrTeamName();
    const service_obj = serviceComponentList.filter(item => {
      return item.service_id === service_id;
    });
    const serviceAlias =
      service_obj && service_obj.length > 0 && service_obj[0].service_alias;
    if (!serviceAlias) {
      setFieldsValue({
        container_port: undefined
      });
      this.handlePortLoading(false);
      return null;
    }
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        app_alias: serviceAlias,
        team_name
      },
      callback: data => {
        const list = (data && data.list) || [];
        this.setState({ portList: list }, () => {
          let containerPort =
            (list && list.length > 0 && list[0].container_port) || undefined;
          if (containerPort) {
            const containerPorts = list.filter(item => {
              return (
                item.container_port === (editInfo && editInfo.container_port)
              );
            });
            if (isPerform && containerPorts.length > 0) {
              this.setState({
                isPerform: false
              });
              containerPort = editInfo.container_port;
            }
          }
          setFieldsValue({
            container_port: containerPort
          });
        });
        this.handlePortLoading(false);
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
        rule_extensions_visible: true,
        is_httptohttps:true
      });
    }else{
      this.setState({
        is_httptohttps: false,
        rule_extensions_visible: false
      })
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
  weightCheck = (_, value) => {
    if (value > 100 || value < 0) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('权重的数值限制在0-100之间');
    }
    return Promise.resolve();
  };
  checkLength = (_, values, callback) => {
    const valArr = values && values.split(';');
    const arr = [];
    if (valArr && valArr.length > 0) {
      for (let i = 0; i < valArr.length; i++) {
        arr.push({
          key: valArr[i].split('=')[0],
          value: valArr[i].split('=')[1]
        });
      }
    }
    if (arr && arr.length > 0) {
      let isMax = false;
      arr.map(item => {
        const { key, value } = item;
        if (key.length > 255 || value.length > 255) {
          isMax = true;
        }
      });
      if (isMax) {
        callback('最大长度255');
      }
      callback();
    }
    callback();
  };
  handleValidators = (_, val, callback) => {
    let isPass = false;
    if (val && val.length > 0) {
      val.some(item => {
        if (
          (item.regex && item.replacement && item.flag) ||
          (!item.regex && !item.replacement && !item.flag)
        ) {
          isPass = true;
        } else {
          isPass = false;
          return true;
        }
      });
      if (isPass) {
        callback();
      } else {
        callback(new Error('需填写完整Rewrites配置'));
      }
    } else {
      return callback();
    }
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
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 19 },
        sm: { span: 16 }
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
    const appKey = appID && { key: appID };
    const appKeys = editInfo &&
      editInfo.g_id &&
      editInfo.group_name && {
        key: editInfo.g_id,
        label: editInfo.group_name
      };
    const {
      routingConfiguration,
      licenseList,
      isAddLicense,
      automaticCertificateVisible,
      serviceComponentList,
      serviceComponentLoading,
      componentLoading,
      portLoading,
      portList,
      rewrite,
      is_httptohttps
    } = this.state;
    const dividers = <Divider style={{ margin: '4px 0' }} />;
    const serviceId = editInfo && editInfo.service_id && editInfo.service_id;
    const serviceIds =
      serviceComponentList &&
      serviceComponentList.length > 0 &&
      serviceComponentList[0].service_id;
    const containerPort =
      editInfo && editInfo.container_port && editInfo.container_port;
    const containerPorts =
      portList && portList.length > 0 && portList[0].container_port;
    const checkLengths = [
      {
        pattern: /^[^\s]*$/,
        message: formatMessage({id:'placeholder.no_spaces'})
      },
      {
        validator: this.checkLength
      }
    ];
    const isOk = !(componentLoading || portLoading);
    return (
      <div>
        <Drawer
          title={editInfo ? formatMessage({id:'popover.access_strategy.title.edit'}) : formatMessage({id:'popover.access_strategy.title.add'})}
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
              {formatMessage({id:'popover.access_strategy.lable.routingRule'})}
            </h3>
            <FormItem
              {...formItemLayout}
              label={formatMessage({id:'popover.access_strategy.lable.domain_name'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('domain_name', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.addDomain'})
                  },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: formatMessage({id:'placeholder.addDomain.pattern'})
                  }
                ],
                initialValue: editInfo.domain_name
              })(<Input placeholder={formatMessage({id:'placeholder.addDomain'})} />)}
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                <a href="javascript:void(0)" onClick={this.showDescription}>
                {formatMessage({id:'popover.access_strategy.lable.analysis'})}
                {currentRegion && currentRegion.tcpdomain}
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
                  { max: 1024, message: formatMessage({id:'placeholder.max1024'}) },
                  {
                    pattern: /^\/+.*/,
                    message: formatMessage({id:'placeholder.path.absolute'})
                  }
                ],
                initialValue: editInfo.domain_path
              })(<Input placeholder="/" />)}
            </FormItem>
            {!routingConfiguration && (
              <div>
                <p style={{ textAlign: 'center' }}>
                  {formatMessage({id:'popover.access_strategy.lable.more'})}
                  <br />
                  <Icon type="down" onClick={this.handleRoutingConfiguration} />
                </p>
              </div>
            )}
            {routingConfiguration && (
              <div>
                <FormItem {...formItemLayout} label="Path Rewrite">
                  {getFieldDecorator('path_rewrite', {
                    initialValue: editInfo.path_rewrite
                  })(
                    <Checkbox defaultChecked={editInfo.path_rewrite}></Checkbox>
                  )}
                </FormItem>
                <FormItem {...formItemLayout} label="Rewrites">
                  {getFieldDecorator('rewrites', {
                    initialValue: editInfo.rewrites,
                    rules: [{ validator: this.handleValidators }]
                  })(<DAinputs />)}
                </FormItem>
                <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.domain_heander'})}>
                  {getFieldDecorator('domain_heander', {
                    initialValue: editInfo.domain_heander,
                    rules: checkLengths
                  })(<DAinput />)}
                </FormItem>
                <FormItem {...formItemLayout} label="Cookie">
                  {getFieldDecorator('domain_cookie', {
                    initialValue: editInfo.domain_cookie,
                    rules: checkLengths
                  })(<DAinput />)}
                </FormItem>
                <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.the_weight'})}>
                  {getFieldDecorator('the_weight', {
                    initialValue: editInfo.the_weight || 100,
                    rules: [{ required: false, validator: this.weightCheck }]
                  })(
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  )}
                </FormItem>
                {licenseList && (
                  <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.certificate_id'})}>
                    {getFieldDecorator('certificate_id', {
                      initialValue:
                        AutomaticCertificate && editInfo.auto_ssl
                          ? 'auto_ssl'
                          : editInfo.certificate_id
                    })(
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        placeholder={formatMessage({id:'placeholder.certificate.bound'})}
                        onSelect={this.handeCertificateSelect}
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            {/* {isAddLicense && (
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
                            )} */}
                          </div>
                        )}
                      >
                        <OptGroup label={formatMessage({id:'popover.access_strategy.lable.function_select'})}>
                          {licenseList && licenseList.length > 0 && (
                            <Option value="" key={99}>
                              {formatMessage({id:'placeholder.certificate.remove'})}
                            </Option>
                          )}
                          {AutomaticCertificate && (
                            <Option value="auto_ssl" key="auto_ssl">
                              {formatMessage({id:'popover.access_strategy.lable.automatic_issued'})}
                            </Option>
                          )}
                        </OptGroup>
                        <OptGroup label={formatMessage({id:'popover.access_strategy.lable.exist_certificate_select'})}>
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
                    <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.auto_ssl_config'})}>
                      {getFieldDecorator('auto_ssl_config', {
                        initialValue: editInfo.auto_ssl_config,
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'placeholder.select.sign_issue'})
                          }
                        ]
                      })(
                        <Select
                          getPopupContainer={triggerNode =>
                            triggerNode.parentNode
                          }
                          placeholder={formatMessage({id:'placeholder.select.sign_issue'})}
                        >
                          {Object.keys(AutomaticCertificateDeleteValue).map(
                            item => {
                              return <Option value={item}>{item}</Option>;
                            }
                          )}
                        </Select>
                      )}
                    </FormItem>
                  )}

                <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.rule_extensions_http'})}>
                  {(this.state.rule_extensions_visible ||
                    (editInfo.certificate_id && is_httptohttps)||
                    (editInfo.auto_ssl && is_httptohttps)) &&
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
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        placeholder={formatMessage({id:'placeholder.select.rule_extensions_round'})}
                      >
                        <Option value="round-robin">
                          {formatMessage({id:'popover.access_strategy.lable.poll'})}
                        </Option>
                        <Option value="cookie-session-affinity">
                          {formatMessage({id:'popover.access_strategy.lable.conversation'})}
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
              {formatMessage({id:'popover.access_strategy.lable.access_target'})}
            </h3>
            <Skeleton loading={serviceComponentLoading} active>
              <Fragment>
                <FormItem {...formItemLayout} label={formatMessage({id:'popover.newApp.appName'})}>
                  {getFieldDecorator('group_id', {
                    rules: [{ required: true, message: formatMessage({id:'placeholder.select'}) }],
                    initialValue: appKey || appKeys || undefined
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      labelInValue
                      disabled={appID}
                      placeholder={formatMessage({id:'placeholder.appName'})}
                      onChange={this.handleServices}
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
                </FormItem>
                <Spin spinning={componentLoading}>
                  <FormItem {...formItemLayout} label={formatMessage({id:'popover.access_strategy.lable.component'})}>
                    {getFieldDecorator('service_id', {
                      rules: [{ required: true, message: formatMessage({id:'placeholder.select'}) }],
                      initialValue: serviceId || serviceIds || undefined
                    })(
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        placeholder={formatMessage({id:'placeholder.selectComponent'})}
                        onChange={this.handlePorts}
                      >
                        {(serviceComponentList || []).map((service, index) => {
                          return (
                            <Option value={`${service.service_id}`} key={index}>
                              {service.service_cname}
                            </Option>
                          );
                        })}
                      </Select>
                    )}
                  </FormItem>
                </Spin>
                <Spin spinning={!isOk}>
                  <FormItem
                    {...formItemLayout}
                    label={formatMessage({id:'popover.access_strategy.lable.port'})}
                    style={{ marginBottom: '150px' }}
                  >
                    {getFieldDecorator('container_port', {
                      initialValue:
                        containerPort || containerPorts || undefined,
                      rules: [{ required: true, message: formatMessage({id:'placeholder.selectPort'}) }]
                    })(
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        placeholder={formatMessage({id:'placeholder.selectPort'})}
                      >
                        {(portList || []).map((port, index) => {
                          return (
                            <Option value={port.container_port} key={index}>
                              {port.container_port}
                            </Option>
                          );
                        })}
                      </Select>
                    )}
                  </FormItem>
                </Spin>
              </Fragment>
            </Skeleton>
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
              {formatMessage({id:'popover.cancel'})}
            </Button>
            <Button
              onClick={() => {
                if (isOk) {
                  this.handleOk();
                }
              }}
              style={{ cursor: !isOk && 'no-drop' }}
              type="primary"
              loading={addHttpStrategyLoading || editHttpStrategyLoading}
            >
              {formatMessage({id:'popover.confirm'})}
            </Button>
          </div>
        </Drawer>
        {this.state.descriptionVisible && (
          <Modal
            closable={false}
            title={formatMessage({id:'popover.cancel'})}
            visible={this.state.descriptionVisible}
            onOk={this.handleOk_description}
            footer={[
              <Button
                type="primary"
                size="small"
                onClick={this.handleOk_description}
              >
                {formatMessage({id:'popover.access_strategy.modal.domain'})}
              </Button>
            ]}
            zIndex={9999}
          >
            <ul className={styles.ulStyle}>
              <li>
              {formatMessage({id:'popover.access_strategy.lable.li1'})}
              </li>
              <li>
              {formatMessage({id:'popover.access_strategy.lable.li2'})}
              （{currentRegion && currentRegion.team_region_alias}）
              {formatMessage({id:'popover.access_strategy.lable.li4'})}
              {currentRegion && currentRegion.tcpdomain}
              </li>
              <li>
              {formatMessage({id:'popover.access_strategy.lable.li3'})}
              </li>
            </ul>
          </Modal>
        )}
      </div>
    );
  }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;
