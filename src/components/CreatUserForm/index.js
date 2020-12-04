import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Select, Modal } from 'antd';
import TenantSelect from '../../components/TenantSelect';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@connect()
class CreateUserForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      authorityList: [],
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
        team_name: selectedTeam,
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              authorityList: data.list,
            },
            () => {
              setFieldsValue({ role_ids: [] });
            }
          );
        }
      },
    });
  };
  checkAccount = (rule, value, callback) => {
    if (!value) {
      callback('请填写密码');
    } else if (value && value.length < 8) {
      callback('密码长度至少为8位');
    } else {
      callback();
    }
  };
  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const { eid, onCancel, title, userInfo, form } = this.props;
    const { getFieldDecorator } = form;
    const { authorityList } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };
    return (
      <Modal
        visible
        maskClosable={false}
        title={title || '添加用户'}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          {!userInfo && (
            <FormItem {...formItemLayout} label="用户名">
              {getFieldDecorator('user_name', {
                initialValue: userInfo ? userInfo.nick_name : '',
                rules: [
                  { required: true, message: '请填写用户名!' },
                  {
                    pattern: /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/,
                    message: '只支持字母、数字、中文、_和-组合'
                  }
                ],
              })(<Input placeholder="请填写用户名!" />)}
            </FormItem>
          )}

          <FormItem {...formItemLayout} label="姓名">
            {getFieldDecorator('real_name', {
              initialValue: (userInfo && userInfo.real_name) || '',
              rules: [{ required: true, message: '请填写姓名!' }],
            })(<Input type="text" placeholder="请填写姓名!" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="密码">
            {getFieldDecorator('password', {
              initialValue: (userInfo && userInfo.password) || '',
              rules: [
                {
                  required: true,
                  validator: this.checkAccount,
                },
              ],
            })(<Input.Password placeholder="请填写密码" />)}
          </FormItem>

          {!userInfo && (
            <div>
              <FormItem {...formItemLayout} label="邮箱">
                {getFieldDecorator('email', {
                  rules: [
                    { required: true, message: '请填写邮箱!' },
                    { type: 'email', message: '邮箱格式不正确!' },
                  ],
                })(<Input type="text" placeholder="请填写邮箱!" />)}
              </FormItem>

              <FormItem {...formItemLayout} label="所属团队">
                {getFieldDecorator('tenant_name', {
                  rules: [{ required: false, message: '请选择团队!' }],
                })(
                  <TenantSelect
                    placeholder="请输入团队名称进行查询"
                    eid={eid}
                    onSelect={this.handleSelect}
                  />
                )}
              </FormItem>

              <FormItem {...formItemLayout} label="角色权限">
                {getFieldDecorator('role_ids', {
                  initialValue: [],
                  rules: [{ required: false, message: '请选择用户角色!' }],
                })(
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="请选择用户角色"
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
