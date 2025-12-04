import { Form, Input, Modal, Select, Skeleton } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
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
    const { viewName, data } = this.props;
    if (
      viewName === 'enterprise' &&
      data &&
      data.roles &&
      data.roles.length > 0
    ) {
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
        title={title || (data ? formatMessage({id:'confirmModal.edit.member'}) : formatMessage({id:'confirmModal.add.member'}))}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Skeleton loading={roleLoading || currentRolesLoading}>
          <Form onSubmit={this.handleSubmit}>
            {data ? (
              <FormItem {...formItemLayout} label={formatMessage({id:'confirmModal.lable.member.user_name'})}>
                {getFieldDecorator('user_name', {
                  initialValue: nickName || data.nick_name || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({id:'placeholder.userName'})
                    }
                  ]
                })(<Input disabled placeholder={formatMessage({id:'placeholder.userName'})}/>)}
              </FormItem>
            ) : (
              <FormItem {...formItemLayout} label={formatMessage({id:'confirmModal.lable.member.user_ids'})}>
                {getFieldDecorator('user_ids', {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'placeholder.user_ids'})
                    }
                  ]
                })(<UserSelect />)}
              </FormItem>
            )}

            <FormItem {...formItemLayout} label={formatMessage({id:'confirmModal.lable.member.role_ids'})}>
              {getFieldDecorator('role_ids', {
                initialValue: initialValueRoles,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.role_ids'})
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  mode="multiple"
                  placeholder={formatMessage({id:'placeholder.role_ids'})}
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
