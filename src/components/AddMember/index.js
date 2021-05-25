import { Form, Input, Modal, Select, Skeleton } from 'antd';
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
      roles: [],
      currentRoles: [],
      roleLoading: true,
      currentRolesLoading: true
    };
  }
  componentDidMount() {
    this.loadRoles();
    const { viewName } = this.props;
    if (viewName === 'enterprise') {
      this.fetchTeamUserRoles();
    } else {
      this.handleCloseCurrentRolesLoading();
    }
  }
  fetchTeamUserRoles = () => {
    const { dispatch, userId, eid, teamName } = this.props;
    dispatch({
      type: 'teamControl/fetchUserTeamsRoles',
      payload: {
        tenantName: teamName,
        team_name: teamName,
        enterprise_id: eid,
        user_id: userId,
        page: 1,
        page_size: -1
      },
      callback: res => {
        this.setState(
          {
            currentRoles: (res.bean && res.bean.roles) || []
          },
          () => {
            this.handleCloseCurrentRolesLoading();
          }
        );
      }
    });
  };

  loadRoles = () => {
    const { dispatch, teamName } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: teamName || globalUtil.getCurrTeamName(),
        page_size: -1,
        page: 1
      },
      callback: data => {
        this.setState(
          {
            roles: data.list || []
          },
          () => {
            this.handleCloseRoleLoading();
          }
        );
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
  handleCloseRoleLoading = () => {
    this.setState({
      roleLoading: false
    });
  };
  handleCloseCurrentRolesLoading = () => {
    this.setState({
      currentRolesLoading: false
    });
  };
  render() {
    const { onCancel, data, form, nickName, title, loading } = this.props;
    const { getFieldDecorator } = form;
    const {
      roles,
      currentRoles,
      roleLoading,
      currentRolesLoading
    } = this.state;
    const initialValueRoles = [];
    const arr =
      (currentRoles && currentRoles.length > 0 && currentRoles) ||
      (data && data.roles && data.roles.length > 0 && data.roles) ||
      [];
    arr.map(item => {
      if (item.role_id) {
        initialValueRoles.push(Number(item.role_id));
      }
    });
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
        confirmLoading={loading}
        title={title || (data ? '编辑成员' : '添加成员')}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Skeleton loading={roleLoading || currentRolesLoading}>
          <Form onSubmit={this.handleSubmit}>
            {data ? (
              <FormItem {...formItemLayout} label="用户名">
                {getFieldDecorator('user_name', {
                  initialValue: nickName || data.nick_name || '',
                  rules: [
                    {
                      required: false,
                      message: '请输入用户名称'
                    }
                  ]
                })(<Input disabled placeholder="请输入用户名称" />)}
              </FormItem>
            ) : (
              <FormItem {...formItemLayout} label="选择用户">
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
        </Skeleton>
      </Modal>
    );
  }
}

export default ConfirmModal;
