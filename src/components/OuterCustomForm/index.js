import {
  Alert, Button,






  Col, Form,








  Icon, Input,


  Modal, Radio,


  Row, Select,







  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
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
      showUsernameAndPass: false,
      showKey: false,
      addGroup: false,
      serverType: 'git',
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
  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: (group) => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  handleChange = () => {
    this.setState({
      visible: true
    });
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
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
      if (!err) {
        this.props.onSubmit && this.props.onSubmit(fieldsValue);
      }
    });
  };
  handleChangeEndpointsType = (types) => {
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

  handleCancel = (e) => {
    this.setState({
      visible: false
    });
  };

  add = (typeName) => {
    const staticList = this.state.staticList;
    this.setState({ staticList: staticList.concat('') });
    this.props.form.setFieldsValue({
      [typeName]: staticList.concat('')
    });
  };

  remove = (index) => {
    const staticList = this.state.staticList;
    staticList.splice(index, 1);
    this.setValues(staticList);
  };

  setValues = (arr, typeName) => {
    arr = arr || [];
    if (!arr.length) {
      arr.push('');
    }
    this.setState({ staticList: arr }, () => {
      this.props.form.setFieldsValue({
        [typeName]: arr
      });
    });
  };

  onKeyChange = (index, typeName, e) => {
    const staticList = this.state.staticList;
    staticList[index] = e.target.value;
    this.setValues(staticList, typeName);
  };

  validAttrName = (rule, value, callback) => {
    if (!value) {
      callback('请输入组件地址');
      return;
    }
    if (typeof value === 'object') {
      value.map((item) => {
        if (item == '') {
          callback('请输入组件地址');
          return;
        }

        if (
          this.state.endpointsType == 'static' &&
          !regs.test(item || '') &&
          !rega.test(item || '') &&
          !rege.test(item || '')
        ) {
          callback('请输入正确的地址');
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
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, rainbondInfo } = this.props;
    const {
      showUsernameAndPass,
      showKey,
      endpointsType,
      staticList
    } = this.state;
    const gitUrl = getFieldValue('git_url');
    let isHttp = /^(http:\/\/|https:\/\/)/.test(gitUrl || '');
    let urlCheck = '';
    if (this.state.serverType == 'svn') {
      isHttp = true;
      urlCheck = /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    const isSSH = !isHttp;
    const data = this.props.data || {};
    const showSubmitBtn =
      this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
    const showCreateGroup =
      this.props.showCreateGroup === void 0 ? true : this.props.showCreateGroup;
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="组件名称">
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [{ required: true, message: '请输入组件名称' }]
            })(
              <Input
                placeholder="请输入组件名称"
                style={{
                  display: 'inline-block',
                  width:
                    this.props.handleType && this.props.handleType === 'Service'
                      ? 350
                      : 277,
                  marginRight: 15
                }}
              />
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_id', {
              initialValue:
                this.props.handleType && this.props.handleType === 'Service'
                  ? Number(this.props.groupId)
                  : data.group_id,
              rules: [{ required: true, message: '请选择' }]
            })(
              <Select
                placeholder="请选择要所属应用"
                style={{
                  display: 'inline-block',
                  width:
                    this.props.handleType && this.props.handleType === 'Service'
                      ? 350
                      : 277,
                  marginRight: 15
                }}
                disabled={
                  !!(
                    this.props.handleType && this.props.handleType === 'Service'
                  )
                }
              >
                {(groups || []).map((group) => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {this.props.handleType &&
            this.props.handleType === 'Service' ? null : showCreateGroup ? (
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
              </RadioGroup>
            )}
          </FormItem>

          {endpointsType == 'static' && (
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  组件地址
                  <Tooltip
                    title={
                      <a
                        href={`${rainbondUtil.documentPlatform_url(
                          rainbondInfo
                        )}docs/component-create/thirdparty-service/thirdparty-create`}
                        target="_blank"
                        style={{ color: '#fff' }}
                      >
                        点击阅读文档
                      </a>
                    }
                  >
                    <Icon type="question-circle-o" />
                  </Tooltip>
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
          {/* discovery type is disable  */}
          {endpointsType == 'discovery' && (
            <div>
              {' '}
              <FormItem
                {...formItemLayout}
                label="动态注册类型"
                style={{ zIndex: 99999 }}
              >
                {getFieldDecorator('type', {
                  rules: [{ required: true, message: '请选择动态注册类型' }],
                  initialValue: ''
                })(
                  <Select
                    onChange={this.handleChange}
                    placeholder="请选择类型"
                    style={{
                      display: 'inline-block',
                      width: 265,
                      marginRight: 15
                    }}
                  >
                    {['Etcd'].map((port, index) => {
                      return (
                        <Option value={port} key={index}>
                          {port}
                        </Option>
                      );
                    })}
                  </Select>
                )}
                <Button onClick={this.showModal}>补全信息</Button>
              </FormItem>
              <Modal
                title={this.props.form.getFieldValue('type')}
                visible={this.state.visible}
                onOk={this.handleCancel}
                onCancel={this.handleCancel}
              >
                <FormItem
                  {...formItemLayout}
                  label={
                    <span>
                      组件地址
                      <Tooltip
                        title={
                          <a
                            href={`${rainbondUtil.documentPlatform_url(
                              rainbondInfo
                            )}docs/component-create/thirdparty-service/thirdparty-create`}
                            target="_blank"
                            style={{ color: '#fff' }}
                          >
                            点击阅读文档
                          </a>
                        }
                      >
                        <Icon type="question-circle-o" />
                      </Tooltip>
                    </span>
                  }
                  style={{ textAlign: 'right' }}
                >
                  {getFieldDecorator('servers', {
                    rules: [
                      { required: true },
                      { validator: this.validAttrName }
                    ],
                    initialValue: ''
                  })(
                    <div>
                      {staticList.map((item, index) => {
                        return (
                          <Row key={index}>
                            <Col span={20}>
                              <Input
                                onChange={this.onKeyChange.bind(
                                  this,
                                  index,
                                  'servers'
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
                                    this.add('servers');
                                  }}
                                  style={{ fontSize: '20px' }}
                                />
                              ) : (
                                <Icon
                                  type="minus-circle"
                                  style={{ fontSize: '20px' }}
                                  onClick={this.remove.bind(
                                    this,
                                    index,
                                    'servers'
                                  )}
                                />
                              )}
                            </Col>
                          </Row>
                        );
                      })}
                    </div>
                  )}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="key"
                  style={{ textAlign: 'right' }}
                >
                  {getFieldDecorator('key', {
                    rules: [{ required: true, message: '请输入key!' }],
                    initialValue: undefined
                  })(<Input placeholder="请输入key" />)}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="用户名"
                  style={{ textAlign: 'right' }}
                >
                  {getFieldDecorator('username', {
                    rules: [{ required: false, message: '请输入用户名!' }],
                    initialValue: undefined
                  })(<Input placeholder="请输入用户名" />)}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="密码"
                  style={{ textAlign: 'right' }}
                >
                  {getFieldDecorator('password', {
                    rules: [{ required: false, message: '请输入密码!' }],
                    initialValue: undefined
                  })(<Input placeholder="请输入密码" />)}
                </FormItem>
              </Modal>
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
              {this.props.handleType &&
              this.props.handleType === 'Service' &&
              this.props.ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button onClick={this.handleSubmit} type="primary">
                      新建组件
                    </Button>,
                    false
                  )
                : !this.props.handleType && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          endpointsType == 'api' ? 'space-evenly' : 'start'
                      }}
                    >
                      <Button onClick={this.handleSubmit} type="primary">
                        确认创建
                      </Button>
                      {endpointsType == 'api' && (
                        <Alert
                          message="API地址在组件创建后获取"
                          type="warning"
                          showIcon
                        />
                      )}
                    </div>
                  )}
              {this.props.handleType &&
                this.props.handleType === 'Service' &&
                endpointsType == 'api' && (
                  <Alert
                    message="API地址在组件创建后获取"
                    type="warning"
                    showIcon
                    style={{ width: '350px' }}
                  />
                )}
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {/* {showKey && isSSH && <ShowRegionKey onCancel={this.hideShowKey} />} */}
      </Fragment>
    );
  }
}
