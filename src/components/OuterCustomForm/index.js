/* eslint-disable react/jsx-indent */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable eqeqeq */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Icon,
  Input,
  Radio,
  Row,
  Select,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import AddGroup from '../../components/AddOrEditGroup';
import rainbondUtil from '../../utils/rainbond';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 6
  },
  wrapperCol: {
    span: 18
  }
};
const formItemLayouts = {
  labelCol: {
    span: 11
  },
  wrapperCol: {
    span: 13
  }
};
const regs = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
const rega = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
const rege = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

@connect(
  ({ user, global }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    rainbondInfo: global.rainbondInfo
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      endpointsType: 'static',
      visible: false,
      staticList: [''],
      language: cookie.get('language') === 'zh-CN' ? true : false,
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };

  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  handleChange = () => {
    this.setState({
      visible: true
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        if (
          fieldsValue.type != '' &&
          fieldsValue.type != undefined &&
          (fieldsValue.servers == '' ||
            fieldsValue.servers == undefined ||
            fieldsValue.key == '' ||
            fieldsValue.key == undefined)
        ) {
          this.setState({
            visible: true
          });
        }
      }
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  handleChangeEndpointsType = types => {
    this.props.form.setFieldsValue({
      static: ['']
    });
    this.props.form.setFieldsValue({
      endpoints_type: ['']
    });
    this.setState({
      endpointsType: types.target.value,
      staticList: ['']
    });
  };

  showModal = () => {
    this.props.form.validateFields(['type'], { force: true });
    this.setState({
      visible: !!this.props.form.getFieldValue('type')
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  add = typeName => {
    const { staticList } = this.state;
    this.setState({ staticList: staticList.concat('') });
    this.props.form.setFieldsValue({
      [typeName]: staticList.concat('')
    });
  };

  remove = index => {
    const { staticList } = this.state;
    staticList.splice(index, 1);
    this.setValues(staticList);
  };

  setValues = (arr, typeName) => {
    const setArr = arr || [];
    if (!setArr.length) {
      setArr.push('');
    }
    this.setState({ staticList: setArr }, () => {
      this.props.form.setFieldsValue({
        [typeName]: setArr
      });
    });
  };

  onKeyChange = (index, typeName, e) => {
    const { staticList } = this.state;
    staticList[index] = e.target.value;
    this.setValues(staticList, typeName);
  };
  handleIsRepeat = arr => {
    const hash = {};
    for (const i in arr) {
      if (hash[arr[i]]) {
        return true;
      }
      hash[arr[i]] = true;
    }
    return false;
  };

  validAttrName = (rule, value, callback) => {
    if (!value) {
      callback(formatMessage({id: 'placeholder.componentAddress'}));
      return;
    }
    if (typeof value === 'object') {
      value.map(item => {
        if (item == '') {
          callback(formatMessage({id: 'placeholder.componentAddress'}));
          return null;
        }

        if (
          this.state.endpointsType == 'static' &&
          !regs.test(item || '') &&
          !rega.test(item || '') &&
          !rege.test(item || '')
        ) {
          callback(formatMessage({id: 'placeholder.attrName'}));
        }
        if (this.handleIsRepeat(value)) {
          callback(formatMessage({id: 'placeholder.notAttrName'}));
        }
      });
    }
    if (
      value && typeof value === 'object'
        ? value.join().search('127.0.0.1') !== -1 ||
          value.join().search('1.1.1.1') !== -1 ||
          value.join().search('localhost') !== -1
        : value.search('127.0.0.1') !== -1 ||
          value.search('1.1.1.1') !== -1 ||
          value.search('localhost') !== -1
    ) {
      callback(formatMessage({id: 'placeholder.nonsupport'},{ nonsupport: value })`${value == '1.1.1.1' ? formatMessage({id: 'placeholder.nonsupport.regAddress'}) : formatMessage({id: 'placeholder.nonsupport.regLoopBack'})}`);
    }
    callback();
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({id: 'placeholder.nameSpaceReg'}))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
  render() {
    const {
      groups,
      rainbondInfo,
      form,
      handleType,
      groupId,
      ButtonGroupState,
      showSubmitBtn = true,
      showCreateGroup = true
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { endpointsType, staticList, addGroup, language, } = this.state;
    const data = this.props.data || {};
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : formItemLayouts
    const apiMessage = (
      <Alert
        message={formatMessage({id: 'teamAdd.create.third.Alert.warning'})}
        type="warning"
        showIcon
        style={language ? { width: '350px', marginBottom: '20px' } : { width: '250px', marginBottom: '20px' } }
      />
    );
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.service_cname'})}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: formatMessage({id: 'placeholder.component_cname'}) },
                {
                  max: 24,
                  message: formatMessage({id: 'placeholder.max24'})
                }
              ]
            })(
              <Input
                placeholder={formatMessage({id: 'placeholder.component_cname'})}
                style={((language == false) && (isService==true)) ? {
                  display: 'inline-block',
                  width: 200,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                } : {
                  display: 'inline-block',
                  width: 350,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              />
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
            {getFieldDecorator('k8s_component_name', {
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(
              <Input
                style={((language == false) && (isService==true)) ? {
                  display: 'inline-block',
                  width: 200,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }  : {
                  display: 'inline-block',
                  width: 350,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
                placeholder={formatMessage({id: 'placeholder.k8s_component_name'})}
              />
            )}
          </Form.Item>

          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: formatMessage({id: 'placeholder.select'}) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({id: 'placeholder.appName'})}
                style={((language == false) && (isService==true)) ? {
                  display: 'inline-block',
                  width: 200,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  // overflow: 'hidden',
                  whiteSpace: 'nowrap'
                } : {
                  display: 'inline-block',
                  width: 350,
                  marginRight: 15,
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>{formatMessage({id: 'teamAdd.create.third.createNewApp'})}</Button>
            ) : null}
          </Form.Item>

          <FormItem {...is_language} label={formatMessage({id: 'teamAdd.create.third.componentRegister'})}>
            {getFieldDecorator('endpoints_type', {
              rules: [{ required: true, message: formatMessage({id: 'placeholder.endpoints'}) }],
              initialValue: this.state.endpointsType
            })(
              <RadioGroup
                onChange={this.handleChangeEndpointsType}
                value={endpointsType}
              >
                <Radio value="static">{formatMessage({id: 'teamAdd.create.third.staticRegister'})}</Radio>
                <Radio value="api">{formatMessage({id: 'teamAdd.create.third.apiRegister'})}</Radio>
                <Radio value="kubernetes">
                  <Badge count="Beta">
                    <span style={{ width: 100, display: 'block' }}>
                      Kubernetes
                    </span>
                  </Badge>
                </Radio>
              </RadioGroup>
            )}
          </FormItem>

          {endpointsType == 'static' && (
            <FormItem
              {...is_language}
              label={
                <span>
                  {formatMessage({id: 'teamAdd.create.third.componentAddress'})}
                  {platform_url && (
                    <Tooltip title={formatMessage({id: "teamAdd.create.third.href"})}>
                      <a
                        target="_blank"
                        href={`${platform_url}docs/component-create/thirdparty-service/thirdparty-create`}
                      >
                        <Icon type="question-circle-o" />
                      </a>
                    </Tooltip>
                  )}
                </span>
              }
            >
              {getFieldDecorator('static', {
                rules: [{ validator: this.validAttrName }],
                initialValue: ''
              })(
                <div>
                  {staticList.map((item, index) => {
                    return (
                      <Row style={language&&isService ? { width: 370 } :  { width: 280 }} key={index}>
                        <Col span={18}>
                          <Input
                            onChange={this.onKeyChange.bind(
                              this,
                              index,
                              'static'
                            )}
                            value={item}
                            placeholder={formatMessage({id: "placeholder.componentAddress"})}
                          />
                        </Col>
                        <Col span={4} style={{ textAlign: 'center' }}>
                          {index == 0 ? (
                            <Icon
                              type="plus-circle"
                              onClick={() => {
                                this.add('static');
                              }}
                              style={{ fontSize: '20px' }}
                            />
                          ) : (
                            <Icon
                              type="minus-circle"
                              style={{ fontSize: '20px' }}
                              onClick={this.remove.bind(this, index, 'static')}
                            />
                          )}
                        </Col>
                      </Row>
                    );
                  })}
                </div>
              )}
            </FormItem>
          )}

          {endpointsType === 'kubernetes' && (
            <div>
              <FormItem {...is_language} label="Namespace">
                {getFieldDecorator('namespace', {
                  rules: [{ required: false, message: formatMessage({id: "placeholder.nameSpaceMsg"}) }],
                  initialValue: ''
                })(
                  <Input
                    style={((language == false) && (isService==true))? {
                      display: 'inline-block',
                      width: 200,
                      marginRight: 15,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    } : {
                      display: 'inline-block',
                      width: 350,
                      marginRight: 15,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }
                  
                  }
                    placeholder={formatMessage({id: "placeholder.nameSpace"})}
                  />
                )}
              </FormItem>
              <FormItem {...is_language} label="Service">
                {getFieldDecorator('serviceName', {
                  rules: [{ required: true, message: formatMessage({id: "placeholder.serviceName"}) }],
                  initialValue: ''
                })(
                  <Input
                    style={((language == false) && (isService==true))? {
                      display: 'inline-block',
                      width: 200,
                      marginRight: 15,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    } : {
                      display: 'inline-block',
                      width: 350,
                      marginRight: 15,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                    placeholder={formatMessage({id: "placeholder.serviceName"})}
                  />
                )}
              </FormItem>
            </div>
          )}

          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: is_language.wrapperCol.span,
                  offset: is_language.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button onClick={this.handleSubmit} type="primary">
                      {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                    </Button>,
                    false
                  )
                : !handleType && (
                    <div>
                      {endpointsType == 'api' && apiMessage}
                      <Button onClick={this.handleSubmit} type="primary">
                      {formatMessage({id: 'teamAdd.create.btn.create'})}
                      </Button>
                    </div>
                  )}
              {isService && endpointsType == 'api' && apiMessage}
            </Form.Item>
          ) : null}
        </Form>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
