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
  //不能输入非汉字效验  效验不能输入非空字符串
  validateNoChinese = (rule, value, callback) => {
    let reg = /^[^\u4e00-\u9fa5]+$/g;
    let regEmpty = /^\s*$/g;
    if (value && !reg.test(value)) {
      callback('书写格式错误');
    } else if (value && regEmpty.test(value)) {
      callback('缺陷编号不能为空');
    } else {
      callback();
    }
  }
  
  render() {
    const { onCancel, data, form, title, loading } = this.props;
    const { getFieldDecorator, getValueFormEvent } = form;
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
        title={title || (data ? '修改镜像仓库授权信息' : '添加镜像仓库授权信息')}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Skeleton loading={roleLoading || currentRolesLoading}>
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...formItemLayout} label="镜像仓库地址">
              {getFieldDecorator('domain', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: '请输入镜像仓库地址',
                  },
                  {
                    message: '不能输入汉字',
                    validator: this.validateNoChinese
                  },
                  {
                    max: 255,
                    message: '最大长度为255个字符',
                  }
                ],
                getValueFromEvent: event => {return event.target.value.replace(/(^\s*)|(\s*$)/g, '');},
              })(<Input placeholder="请输入镜像仓库地址" />)}
            </FormItem>
            <FormItem {...formItemLayout} label="用户名">
              {getFieldDecorator('username', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: '请输入用户名',
                  },
                  {
                    max: 255,
                    message: '最大长度为255个字符',
                  }
                ]
              })(<Input placeholder="请输入用户名" />)}
            </FormItem>
            <FormItem {...formItemLayout} label="密码">
              {getFieldDecorator('password', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: '请输入密码',
                  },
                  {
                    max: 255,
                    message: '最大长度为255个字符',
                  }
                ]
              })(<Input placeholder="请输入密码" type="password" />)}
            </FormItem>
          </Form>
        </Skeleton>
      </Modal>
    );
  }
}

export default ConfirmModal;
