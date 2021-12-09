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
      staticList: ['']
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
      callback('请输入组件地址');
      return;
    }
    if (typeof value === 'object') {
      value.map(item => {
        if (item == '') {
          callback('请输入组件地址');
          return null;
        }

        if (
          this.state.endpointsType == 'static' &&
          !regs.test(item || '') &&
          !rega.test(item || '') &&
          !rege.test(item || '')
        ) {
          callback('请输入正确的地址');
        }
        if (this.handleIsRepeat(value)) {
          callback('组件地址不能相同');
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
      callback(`不支持${value}${value == '1.1.1.1' ? '地址' : '环回接口地址'}`);
    }
    callback();
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error('请输入组件英文名称'));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error('只支持小写字母、数字或“-”，并且必须以字母开始、以数字或字母结尾')
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error('不能大于32个字符'));
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
    const { endpointsType, staticList, addGroup } = this.state;
    const data = this.props.data || {};
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    const isService = handleType && handleType === 'Service';
    const apiMessage = (
      <Alert
        message="API地址在组件创建后获取"
        type="warning"
        showIcon
        style={{ width: '350px', marginBottom: '20px' }}
      />
    );
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="组件名称">
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: '请输入组件名称' },
                {
                  max: 24,
                  message: '最大长度24位'
                }
              ]
            })(
              <Input
                placeholder="请输入组件名称"
                style={{
                  display: 'inline-block',
                  width: isService ? 350 : 277,
                  marginRight: 15
                }}
              />
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label="组件英文名称">
            {getFieldDecorator('k8s_component_name', {
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(
              <Input
                style={{
                  display: 'inline-block',
                  width: isService ? 350 : 277,
                  marginRight: 15
                }}
                placeholder="组件的英文名称"
              />
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: '请选择' }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder="请选择要所属应用"
                style={{
                  display: 'inline-block',
                  width: isService ? 350 : 277,
                  marginRight: 15
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
              <Button onClick={this.onAddGroup}>创建新应用</Button>
            ) : null}
          </Form.Item>

          <FormItem {...formItemLayout} label="组件注册方式">
            {getFieldDecorator('endpoints_type', {
              rules: [{ required: true, message: '请选择endpoints类型!' }],
              initialValue: this.state.endpointsType
            })(
              <RadioGroup
                onChange={this.handleChangeEndpointsType}
                value={endpointsType}
              >
                <Radio value="static">静态注册</Radio>
                <Radio value="api">API注册</Radio>
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
              {...formItemLayout}
              label={
                <span>
                  组件地址
                  {platform_url && (
                    <Tooltip title="点击阅读文档">
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
                      <Row style={{ width: 370 }} key={index}>
                        <Col span={18}>
                          <Input
                            onChange={this.onKeyChange.bind(
                              this,
                              index,
                              'static'
                            )}
                            value={item}
                            placeholder="请输入组件地址"
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
              <FormItem {...formItemLayout} label="Namespace">
                {getFieldDecorator('namespace', {
                  rules: [{ required: false, message: '请输入Namesapce' }],
                  initialValue: ''
                })(
                  <Input
                    style={{
                      display: 'inline-block',
                      width: isService ? 350 : 277,
                      marginRight: 15
                    }}
                    placeholder="留空则默认为当前团队所在Namesapce"
                  />
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="Service">
                {getFieldDecorator('serviceName', {
                  rules: [{ required: true, message: '请输入服务名' }],
                  initialValue: ''
                })(
                  <Input
                    style={{
                      display: 'inline-block',
                      width: isService ? 350 : 277,
                      marginRight: 15
                    }}
                    placeholder="请输入服务名"
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
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button onClick={this.handleSubmit} type="primary">
                      新建组件
                    </Button>,
                    false
                  )
                : !handleType && (
                    <div>
                      {endpointsType == 'api' && apiMessage}
                      <Button onClick={this.handleSubmit} type="primary">
                        确认创建
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
