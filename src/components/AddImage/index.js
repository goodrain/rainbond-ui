import { Form, Input, Modal, Select, Skeleton } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
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
      currentRolesLoading: true,
      language: cookie.get('language') === 'zh-CN' ? true : false
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
      callback(formatMessage({id:'placeholder.reg_Chinese'}));
    } else if (value && regEmpty.test(value)) {
      callback(formatMessage({id:'placeholder.regEmpty'}));
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
      currentRolesLoading,
      language
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
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    return (
      <Modal
        confirmLoading={loading}
        title={title || (data ? formatMessage({id:'confirmModal.edit.image.title'}) : formatMessage({id:'confirmModal.add.image.title'}))}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Skeleton loading={roleLoading || currentRolesLoading}>
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...is_language} label={formatMessage({id:'confirmModal.image.lable.domain'})}>
              {getFieldDecorator('domain', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.git_url'}),
                  },
                  {
                    message: formatMessage({id:'placeholder.not_Chinese'}),
                    validator: this.validateNoChinese
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'}),
                  }
                ],
                getValueFromEvent: event => {return event.target.value.replace(/(^\s*)|(\s*$)/g, '');},
              })(<Input placeholder={formatMessage({id:'placeholder.git_url'})} />)}
            </FormItem>
            <FormItem {...is_language} label={formatMessage({id:'confirmModal.image.lable.username'})}>
              {getFieldDecorator('username', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.userName'}),
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'}),
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.userName'})} />)}
            </FormItem>
            <FormItem {...is_language} label={formatMessage({id:'confirmModal.image.lable.password'})}>
              {getFieldDecorator('password', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.password_1'}),
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'}),
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.password_1'})} type="password" />)}
            </FormItem>
          </Form>
        </Skeleton>
      </Modal>
    );
  }
}

export default ConfirmModal;
