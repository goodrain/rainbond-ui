import { Form, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import roleUtil from '../../utils/role';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(
  ({ user }) => ({
    currUser: user.currentUser
  }),
  null,
  null,
  { withRef: true }
)
export default class AddAdmin extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      adminList: [],
      roles: ['app_store', 'admin']
    };
  }
  componentDidMount() {
    this.loadTeams();
    this.loadRoles();
  }
  onSearch = value => {
    this.loadTeams(value);
  };

  loadRoles = () => {
    const { dispatch, eid } = this.props;

    dispatch({
      type: 'global/fetchEnterpriseRoles',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res) {
          this.setState({
            roles: res.list || []
          });
        }
      }
    });
  };

  loadTeams = name => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseUsers',
      payload: { enterprise_id: eid, page: 1, page_size: 999, name },

      callback: res => {
        if (res) {
          this.setState({ adminList: res.list });
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
    const { adminList, roles } = this.state;
    const { onOk, onCancel, actions, info, form } = this.props;
    const { getFieldDecorator } = form;
    const initialValueRoles = [];
    // if (data && data.roles) {
    //   data.roles.map(item => {
    //     initialValueRoles.push(item.role_id);
    //   });
    // }
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
        title={info ? '编辑管理员' : '添加管理员'}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="用户名称">
            {getFieldDecorator('user_id', {
              initialValue: (info && info.user_id) || '',
              rules: [
                {
                  required: true,
                  message: '请输入用户名称'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                showSearch
                style={{ width: 300 }}
                placeholder="请输入用户名称"
                optionFilterProp="children"
                onSearch={this.onSearch}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {adminList &&
                  adminList.length > 0 &&
                  adminList.map(item => {
                    const { nick_name: name, user_id: id } = item;
                    return (
                      <Option key={id} value={id}>
                        {name}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="选择角色">
            {getFieldDecorator('roles', {
              initialValue: (info && info.roles) || [],
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
                style={{ width: 300 }}
              >
                {roles.map((item, index) => {
                  return (
                    <Option key={index} value={item}>
                      {roleUtil.roleMap(item)}
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
