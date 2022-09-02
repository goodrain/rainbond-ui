import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import TenantSelect from '../../components/TenantSelect';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@connect()
class CreateUserForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      authorityList: [],
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  /**
   * 表单
   */

  handleSelect = selectedTeam => {
    const { dispatch, form } = this.props;
    const { setFieldsValue } = form;

    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: selectedTeam
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              authorityList: data.list
            },
            () => {
              setFieldsValue({ role_ids: [] });
            }
          );
        }
      }
    });
  };

  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  checkAccountPass = (_, value, callback) => {
    const { userInfo } = this.props;
    if (userInfo && !value) {
      callback();
    } else if (!value) {
      callback('请填写密码');
    } else if (value && value.length < 8) {
      callback('密码长度至少为8位');
    } else if (value && value.length > 16) {
      callback('最大长度16位');
    } else {
      callback();
    }
  };

  render() {
    const {
      eid,
      onCancel,
      title,
      userInfo,
      form,
      loading = false
    } = this.props;

    const { getFieldDecorator } = form;
    const { authorityList, language } = this.state;
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
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };
    const is_language = language ? formItemLayout : formItemLayouts;
    return (
      <Modal
        visible
        maskClosable={false}
        title={title || formatMessage({id:'enterpriseUser.button.adduser'})}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading}
      >
        <Form onSubmit={this.handleSubmit}>
          {!userInfo && (
            <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.user_name'})}>
              {getFieldDecorator('user_name', {
                initialValue: userInfo ? userInfo.nick_name : '',
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.createUser.user_name'}) },
                  {
                    min: 3,
                    message: formatMessage({id:'placeholder.createUser.min3'})
                  },
                  {
                    max: 24,
                    message: formatMessage({id:'placeholder.max24'})
                  },
                  {
                    pattern: /^[a-zA-Z0-9_\-]+$/,
                    message: formatMessage({id:'placeholder.createUser.real_nameMsg'})
                  }
                ]
              })(<Input autoComplete="off" placeholder={formatMessage({id:'placeholder.createUser.user_name'})} />)}
            </FormItem>
          )}
          <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.real_name'})}>
            {getFieldDecorator('real_name', {
              initialValue: (userInfo && userInfo.real_name) || '',
              rules: [
                { required: true, message: formatMessage({id:'placeholder.createUser.real_name'}) },
                {
                  max: 24,
                  message: formatMessage({id:'placeholder.max24'})
                },
                {
                  pattern: /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/,
                  message: formatMessage({id:'placeholder.createUser.real_nameMsg'})
                }
              ]
            })(
              <Input autoComplete="off" type="text" placeholder={formatMessage({id:'placeholder.createUser.real_name'})} />
            )}
          </FormItem>
          {!userInfo && (
            <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.password'})}>
              {getFieldDecorator('password', {
                initialValue: (userInfo && userInfo.password) || '',
                rules: [
                  {
                    required: true,
                    validator: this.checkAccountPass
                  }
                ]
              })(
                <Input.Password
                  autoComplete="new-password"
                  placeholder={formatMessage({id:'placeholder.createUser.password'})}
                />
              )}
            </FormItem>
          )}
          {!userInfo && (
            <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.email'})}>
              {getFieldDecorator('email', {
                initialValue: (userInfo && userInfo.email) || '',
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.createUser.email'}) },
                  { type: 'email', message: formatMessage({id:'placeholder.createUser.emailMsg'}) }
                ]
              })(
                <Input
                  type="text"
                  placeholder={formatMessage({id:'placeholder.createUser.email'})}
                  autoComplete="off"
                />
              )}
            </FormItem>
          )}
          <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.phone'})}>
            {getFieldDecorator('phone', {
              initialValue: (userInfo && userInfo.phone) || '',
              rules: [
                {
                  pattern: /^[0-9]{11}$/,
                  message: formatMessage({id:'placeholder.createUser.phoneMsg'})
                }
              ]
            })(
              <Input
                type="text"
                placeholder={formatMessage({id:'placeholder.createUser.phone'})}
                autoComplete="off"
              />
            )}
          </FormItem>
          {userInfo && (
            <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.new_password'})}>
              {getFieldDecorator('password', {
                initialValue: (userInfo && userInfo.password) || '',
                rules: [
                  {
                    validator: this.checkAccountPass
                  }
                ]
              })(
                <Input.Password
                  autoComplete="new-password"
                  placeholder={formatMessage({id:'placeholder.createUser.new_password'})}
                  style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}
                />
              )}
            </FormItem>
          )}
          {!userInfo && (
            <div>
              <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.tenant_name'})}>
                {getFieldDecorator('tenant_name', {
                  rules: [{ required: false, message: formatMessage({id:'placeholder.createUser.selectTeam'}) }]
                })(
                  <TenantSelect
                    placeholder={formatMessage({id:'placeholder.createUser.tenant_name'})}
                    eid={eid}
                    onSelect={this.handleSelect}
                  />
                )}
              </FormItem>
              <FormItem {...is_language} label={formatMessage({id:'enterpriseUser.form.label.role_ids'})}>
                {getFieldDecorator('role_ids', {
                  initialValue: [],
                  rules: [{ required: false, message: formatMessage({id:'placeholder.createUser.role_ids'}) }]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder={formatMessage({id:'placeholder.createUser.role_ids'})}
                  >
                    {authorityList.map(item => {
                      const { ID, name } = item;
                      return (
                        <Option key={ID} value={ID}>
                          {name}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}
const createUser = Form.create()(CreateUserForm);
export default createUser;
