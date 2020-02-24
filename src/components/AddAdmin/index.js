import React, { PureComponent } from 'react';
import { Modal, Form, Select, Button } from 'antd';
import { connect } from 'dva';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
@connect(({ user }) => ({
  currUser: user.currentUser,
}))
export default class AddAdmin extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      adminList: [],
    };
  }
  componentDidMount() {
    this.loadTeams();
  }
  loadTeams = (name) => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseUsers',
      payload: { enterprise_id: currUser.enterprise_id },
      name,
      callback: res => {
        if (res) {
          this.setState({ adminList: res.list });
        }
      },
    });
  };


  onSearch = value => {
    this.loadTeams(value);
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  render() {
    const { adminList } = this.state;
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, actions } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };

    return (
      <Modal
        title="添加管理员"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button typs="primary" onClick={this.handleSubmit}>
            确定
          </Button>,
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <FormItem {...formItemLayout} label="用户名称" hasFeedback>
            {getFieldDecorator('user_id', {
              rules: [
                {
                  required: true,
                  message: '请输入用户名称',
                },
              ],
            })(
              <Select
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
                    const { nick_name, user_id } = item;
                    return (
                      <Option key={user_id} value={user_id}>
                        {nick_name}
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
