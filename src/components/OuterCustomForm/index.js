/* eslint-disable react/jsx-indent */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable eqeqeq */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
  Alert,
  Button,
  Col,
  Form,
  Icon,
  Input,
  Radio,
  Row,
  Select,
  Tooltip,
  Divider
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import role from '@/utils/newRole';
import { pinyin } from 'pinyin-pro';
import rainbondUtil from '../../utils/rainbond';
import {
  getServiceNameRules,
  getK8sComponentNameRules,
  getEndpointsTypeRules,
  getNamespaceRules,
  getServiceNameK8sRules,
  getGroupNameRules
} from './validations';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};
const formItemLayouts = {
  labelCol: {
    span: 21
  },
  wrapperCol: {
    span: 3
  }
};
const regs = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
const rega = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
const rege = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

@connect(
  ({ user, global, teamControl }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    rainbondInfo: global.rainbondInfo,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
      comNames: [],
      creatComPermission: {},
      showAdvanced: false
    };
  }
  componentDidMount() {
    const { handleType, groupId } = this.props;
    if (groupId) {
      this.fetchComponentNames(Number(groupId));
    }
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
    role.refreshPermissionsInfo(groupId, false, this.handlePermissionCallback);
    this.cancelAddGroup();
  };

  handlePermissionCallback = (val) => {
    this.setState({ creatComPermission: val });
  }
  handleChange = () => {
    this.setState({
      visible: true
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    const group_id = globalUtil.getAppID()
    form.validateFields({ force: true },(err, fieldsValue) => {
      if (err) {
        if (
          fieldsValue.type !== '' &&
          fieldsValue.type !== undefined &&
          (fieldsValue.servers === '' ||
            fieldsValue.servers === undefined ||
            fieldsValue.key === '' ||
            fieldsValue.key === undefined)
        ) {
          this.setState({
            visible: true
          });
        }
      }
      if (!err && onSubmit) {
         if (group_id) {
          fieldsValue.group_id = group_id
        }
        if (!fieldsValue.k8s_app || !fieldsValue.group_name) {
          fieldsValue.group_name = fieldsValue.service_cname
          fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname)
        }
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
      callback(formatMessage({ id: 'placeholder.componentAddress' }));
      return;
    }
    if (typeof value === 'object') {
      value.map(item => {
        if (item === '') {
          callback(formatMessage({ id: 'placeholder.componentAddress' }));
          return null;
        }

        if (
          this.state.endpointsType === 'static' &&
          !regs.test(item || '') &&
          !rega.test(item || '') &&
          !rege.test(item || '')
        ) {
          callback(formatMessage({ id: 'placeholder.attrName' }));
        }
        if (this.handleIsRepeat(value)) {
          callback(formatMessage({ id: 'placeholder.notAttrName' }));
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
      callback(`${formatMessage({ id: 'placeholder.nonsupport' }, { nonsupport: value })}${value === '1.1.1.1' ? formatMessage({ id: 'placeholder.nonsupport.regAddress' }) : formatMessage({ id: 'placeholder.nonsupport.regLoopBack' })}`);
    }
    callback();
  };
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
    })
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            comNames: res.bean.component_names && res.bean.component_names.length > 0 ? res.bean.component_names : []
          })
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if (!name) {
      return '';
    }

    const { comNames } = this.state;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();

    // 检查名称是否已存在
    if (comNames && comNames.length > 0) {
      const isExist = comNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }

    return cleanedPinyinName;
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
    const { endpointsType, staticList, addGroup, language, creatComPermission: {
      isCreate
    }} = this.state;
    const data = this.props.data || {};
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : formItemLayouts
    const group_id = globalUtil.getAppID()
    const apiMessage = (
      <Alert
        message={formatMessage({ id: 'teamAdd.create.third.Alert.warning' })}
        type="warning"
        showIcon
        style={language ? { width: '350px', marginBottom: '20px' } : { width: '250px', marginBottom: '20px' }}
      />
    );
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: getServiceNameRules()
            })(
              <Input
                placeholder={formatMessage({ id: 'placeholder.component_cname' })}
                style={((language === false) && (isService === true)) ? {
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
                  whiteSpace: 'nowrap'
                }}
              />
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: getK8sComponentNameRules()
            })(
              <Input
                style={((language === false) && (isService === true)) ? {
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
                  whiteSpace: 'nowrap'
                }}
                placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
              />
            )}
          </Form.Item>

          <FormItem {...is_language} label={formatMessage({ id: 'teamAdd.create.third.componentRegister' })}>
            {getFieldDecorator('endpoints_type', {
              rules: getEndpointsTypeRules(),
              initialValue: this.state.endpointsType
            })(
              <RadioGroup
                onChange={this.handleChangeEndpointsType}
              >
                <Radio value="static">{formatMessage({ id: 'teamAdd.create.third.staticRegister' })}</Radio>
                <Radio value="kubernetes">Kubernetes</Radio>
              </RadioGroup>
            )}
          </FormItem>

          {endpointsType === 'static' && (
            <FormItem
              {...is_language}
              label={
                <span>
                  {formatMessage({ id: 'teamAdd.create.third.componentAddress' })}
                  {platform_url && (
                    <Tooltip title={formatMessage({ id: "teamAdd.create.third.href" })}>
                      <a
                        target="_blank"
                        href={`${platform_url}docs/use-manual/component-create/thirdparty-service/thirdparty-create`}
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
                      <Row style={language && isService ? { width: 370, lineHeight: '40px' } : { width: 280, lineHeight: '40px' }} key={index}>
                        <Col span={18} style={{ marginBottom: '12px' }}>
                          <Input
                            onChange={this.onKeyChange.bind(
                              this,
                              index,
                              'static'
                            )}
                            value={item}
                            placeholder={formatMessage({ id: "placeholder.componentAddress" })}
                          />
                        </Col>
                        <Col span={4} style={{ textAlign: 'center' }}>
                          {index === 0 ? (
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
                  rules: getNamespaceRules(),
                  initialValue: ''
                })(
                  <Input
                    style={((language === false) && (isService === true)) ? {
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
                      whiteSpace: 'nowrap'
                    }
                    }
                    placeholder={formatMessage({ id: "placeholder.nameSpace" })}
                  />
                )}
              </FormItem>
              <FormItem {...is_language} label="Service">
                {getFieldDecorator('serviceName', {
                  rules: getServiceNameK8sRules(),
                  initialValue: ''
                })(
                  <Input
                    style={((language === false) && (isService === true)) ? {
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
                      whiteSpace: 'nowrap'
                    }}
                    placeholder={formatMessage({ id: "placeholder.serviceName" })}
                  />
                )}
              </FormItem>
            </div>
          )}

          {!group_id && <div style={{ width: '100%' }}>
            <Divider />
            <div className="advanced-btn" style={{ marginBottom: 16 }}>
              <Button
                type="link"
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  // color: '#1890ff'
                }}
                onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
              >
                <Icon type={this.state.showAdvanced ? "up" : "down"} style={{ marginRight: 6 }} />
                {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
              </Button>
            </div>
            {this.state.showAdvanced && (
              <div  
              className="userpass-card"
              style={{
                margin: '24px 0',
                background: '#fafbfc',
                border: '1px solid #e6e6e6',
                borderRadius: 8,
                boxShadow: '0 2px 8px #f0f1f2',
                padding: 24,
              }}>
                <div className="advanced-divider" style={{ margin: '0 0 16px 0' }} />
                <Form.Item
                  label={formatMessage({ id: 'popover.newApp.appName' })}
                  colon={false}
                  {...formItemLayout}
                  style={{ marginBottom: 18 }}
                >
                  {getFieldDecorator('group_name', {
                    initialValue: this.props.form.getFieldValue('service_cname') || '',
                    rules: getGroupNameRules()
                  })(<Input 
                      placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })} 
                      style={{
                        borderRadius: 6,
                        height: 40,
                        fontSize: 15,
                        boxShadow: '0 1px 3px #f0f1f2',
                        border: '1px solid #e6e6e6',
                        transition: 'border 0.2s, box-shadow 0.2s'
                      }}
                    />
                    )}
                </Form.Item>
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                    rules: getK8sComponentNameRules()
                  })(<Input 
                        placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} 
                         style={{
                          borderRadius: 6,
                          height: 40,
                          fontSize: 15,
                          boxShadow: '0 1px 3px #f0f1f2',
                          border: '1px solid #e6e6e6',
                          transition: 'border 0.2s, box-shadow 0.2s'
                        }}
                      />
                    )}
                </Form.Item>
              </div>
            )}
          </div>}

          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: { span: 24, offset: 0 }
              }}
              label=""
            >
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {isService && ButtonGroupState
                  ? this.props.handleServiceBotton(
                    <Button onClick={this.handleSubmit} type="primary">
                      {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                    </Button>,
                    false
                  )
                  : !handleType && (
                    <div>
                      {endpointsType === 'api' && apiMessage}
                      <Button onClick={this.handleSubmit} type="primary">
                        {formatMessage({ id: 'teamAdd.create.btn.create' })}
                      </Button>
                    </div>
                  )}
                {isService && endpointsType === 'api' && apiMessage}
              </div>
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
