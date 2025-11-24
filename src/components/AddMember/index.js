import { Form, Input, Modal, Select, Skeleton } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import handleAPIError from '../../utils/error';
import cookie from '@/utils/cookie';
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

    if (viewName === 'enterprise' && data && data.roles && data.roles.length > 0) {
      this.fetchTeamUserRoles();
    } else {
      this.handleCloseCurrentRolesLoading();
    }
  }

  // 获取团队用户角色
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
      },
      handleError: err => {
        handleAPIError(err);
        this.handleCloseCurrentRolesLoading();
      }
    });
  };

  // 加载团队角色列表
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
        if (data) {
          this.setState(
            {
              roles: data.list || []
            },
            () => {
              this.handleCloseRoleLoading();
            }
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.handleCloseRoleLoading();
      }
    });
  };
  // 提交表单
  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  // 关闭角色加载状态
  handleCloseRoleLoading = () => {
    this.setState({ roleLoading: false });
  };

  // 关闭当前角色加载状态
  handleCloseCurrentRolesLoading = () => {
    this.setState({ currentRolesLoading: false });
  };
  render() {
    const { onCancel, data, form, nickName, title, loading } = this.props;
    const { getFieldDecorator } = form;
    const { roles, currentRoles, roleLoading, currentRolesLoading } = this.state;
    const isZhCN = cookie.get('language') === 'zh-CN';


    // 计算初始角色值
    const initialValueRoles = [];
    const existingRoles = currentRoles.length > 0 ? currentRoles : (data?.roles || []);

    existingRoles.forEach(item => {
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

    const modalTitle = title || (data
      ? formatMessage({ id: 'confirmModal.edit.member' })
      : formatMessage({ id: 'confirmModal.add.member' }));

    return (
      <Modal
        confirmLoading={loading}
        title={modalTitle}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Skeleton loading={roleLoading || currentRolesLoading}>
          <Form onSubmit={this.handleSubmit}>
            {data ? (
              <FormItem
                {...formItemLayout}
                label={formatMessage({ id: 'confirmModal.lable.member.user_name' })}
              >
                {getFieldDecorator('user_name', {
                  initialValue: nickName || data.nick_name || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({ id: 'placeholder.userName' })
                    }
                  ]
                })(
                  <Input
                    disabled
                    placeholder={formatMessage({ id: 'placeholder.userName' })}
                  />
                )}
              </FormItem>
            ) : (
              <FormItem
                {...formItemLayout}
                label={formatMessage({ id: 'confirmModal.lable.member.user_ids' })}
              >
                {getFieldDecorator('user_ids', {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.user_ids' })
                    }
                  ]
                })(<UserSelect />)}
              </FormItem>
            )}

            <FormItem
              {...formItemLayout}
              label={formatMessage({ id: 'confirmModal.lable.member.role_ids' })}
            >
              {getFieldDecorator('role_ids', {
                initialValue: initialValueRoles,
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.role_ids' })
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  mode="multiple"
                  placeholder={formatMessage({ id: 'placeholder.role_ids' })}
                  style={{ width: '100%' }}
                >
                  {roles.map(item => (
                    <Option key={item.ID} value={item.ID}>
                      {roleUtil.actionMap(item.name, isZhCN )}
                    </Option>
                  ))}
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
