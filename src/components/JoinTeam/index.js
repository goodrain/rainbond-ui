import React, { PureComponent } from 'react';
import { Modal, Form, Select ,Button} from 'antd';
import { connect } from 'dva';
import styles from "../CreateTeam/index.less";

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
@connect(({ user }) => ({
  currUser: user.currentUser,
}))
export default class JoinTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      teams: [],
    };
  }
  componentDidMount() {
    this.loadTeams();
  }
  loadTeams = () => {
    this.props.dispatch({
      type: 'global/getAllTeams',
      payload: { user_id: this.props.currUser.user_id, page_size: 100 },
      callback: data => {
        if (data) {
          this.setState({ teams: data.list });
        }
      },
    });
  };


  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  render() {
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
        title="加入团队"
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
        <Form onSubmit={this.handleSubmit} layout="horizontal"  hideRequiredMark>
          <FormItem {...formItemLayout} label="团队名称" hasFeedback>
            {getFieldDecorator('team_name', {
              rules: [
                {
                  required: true,
                  message: '请选择团队',
                },
              ],
            })(
              <Select
                value={this.state.selectedTeam}
                style={{ width: '100%' }}
                onChange={this.handleTeamChange}
              >
                <Option value="">请选择一个团队</Option>
                {this.state.teams.map(team => (
                  <Option value={team.team_name}>{team.team_alias}</Option>
                ))}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
