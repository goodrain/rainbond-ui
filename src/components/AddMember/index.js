import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import UserSelect from '../UserSelect';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect()
class ConfirmModal extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      roles: []
    };
  }
  componentDidMount() {
    this.loadRoles();
  }
  loadRoles = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_size: 10000,
        page: 1
      },
      callback: data => {
        if (data) {
          this.setState({
            roles: data.list || []
          });
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
  render() {
    const { onCancel, data, form } = this.props;
    const { getFieldDecorator } = form;
    const { roles } = this.state;

    const initialValueRoles = [];

    if (data && data.roles) {
      data.roles.map(item => {
        initialValueRoles.push(Number(item.role_id));
      });
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };

    return (
      <Modal
        title={data ? '编辑成员' : '添加成员'}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          {data ? (
            <FormItem {...formItemLayout} label="用户名" hasFeedback>
              {getFieldDecorator('user_name', {
                initialValue: data.nick_name || '',
                rules: [
                  {
                    required: false,
                    message: '请输入用户名称'
                  }
                ]
              })(<Input disabled placeholder="请输入用户名称" />)}
            </FormItem>
          ) : (
            <FormItem {...formItemLayout} label="选择用户" hasFeedback>
              {getFieldDecorator('user_ids', {
                rules: [
                  {
                    required: true,
                    message: '请选择要添加的用户'
                  }
                ]
              })(<UserSelect />)}
            </FormItem>
          )}

          <FormItem {...formItemLayout} label="选择角色">
            {getFieldDecorator('role_ids', {
              initialValue: initialValueRoles,
              rules: [
                {
                  required: true,
                  message: '请选择角色'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                mode="multiple"
                placeholder="请选择角色"
                style={{ width: '100%' }}
              >
                {roles.map(item => {
                  const { ID, name } = item;
                  return (
                    <Option key={ID} value={ID}>
                      {roleUtil.actionMap(name)}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmModal;
