import React, { PureComponent } from "react";
import { Modal, Form, Select, Button } from "antd";
import { connect } from "dva";
import styles from "../CreateTeam/index.less";

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  Loading: loading.effects["global/joinTeam"]
}))
export default class JoinTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      teams: []
    };
  }
  componentDidMount() {
    this.loadTeams();
  }
  loadTeams = () => {
    const { enterpriseID } = this.props;
    this.props.dispatch({
      type: "global/getUserCanJoinTeams",
      payload: {
        enterpriseID
      },
      callback: data => {
        if (data) {
          this.setState({ teams: data.list });
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
    const { onCancel, form, Loading } = this.props;
    const { getFieldDecorator } = form;
    const { teams } = this.state;
    const teamList = teams && teams.length > 0 && teams;
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
        title="加入团队"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit} loading={Loading}>
            确定
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <FormItem {...formItemLayout} label="团队名称" hasFeedback>
            {getFieldDecorator("team_name", {
              initialValue: (teamList && teamList[0].team_name) || "",
              rules: [
                {
                  required: true,
                  message: "请选择团队"
                }
              ]
            })(
              <Select
                style={{ width: "100%" }}
                onChange={this.handleTeamChange}
                placeholder="请选择一个团队"
              >
                {teamList &&
                  teamList.map(team => (
                    <Option value={team.team_name}>{team.team_alias}</Option>
                  ))}
              </Select>
            )}
            {!teamList && <div>暂无团队可以添加，可以先创建团队。</div>}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
