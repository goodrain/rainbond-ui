import { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Steps, Form, Icon, Select, Button } from "antd";
import styles from "./index.less";
import userStyles from "../../layouts/UserLayout.less";

const Step = Steps.Step;
const Option = Select.Option;

@connect(({ user }) => ({
  currUser: user.currentUser,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedTeam: "",
      teams: [],
      joinTeams: [],
      current: 0,
    };
  }
  componentDidMount = () => {
    this.getAllTeams();
    this.getJoinTeams();
  };
  getAllTeams = () => {
    this.props.dispatch({
      type: "global/getAllTeams",
      payload: { user_id: this.props.currUser.user_id, page_size: 100 },
      callback: (data) => {
        this.setState({ teams: data.list });
      },
    });
  };
  getJoinTeams = () => {
    this.props.dispatch({
      type: "global/getJoinTeams",
      payload: { user_id: this.props.currUser.user_id },
      callback: (data) => {
        this.setState({ joinTeams: data.list });
        if (data.list && data.list.length > 0) {
          this.setState({ current: 1 });
        }
      },
    });
  };

  handleSubmit = () => {
    if (this.state.selectedTeam != "") {
      this.props.dispatch({
        type: "global/joinTeam",
        payload: { team_name: this.state.selectedTeam },
        callback: () => {
          this.props.onOk && this.props.onOk();
        },
      });
    }
  };
  handleTeamChange = (value) => {
    this.setState({ selectedTeam: value });
  };
  change = (value) => {
    if (value == 0) {
      return "审核中";
    }
    if (value == 1) {
      return "已通过";
    }
    if (value == 2) {
      return "拒绝加入";
    }
    return "";
  };
  stepshow = () => {
    if (this.state.current == 0) {
      return (
        <Select
          value={this.state.selectedTeam}
          style={{ width: "32%" }}
          onChange={this.handleTeamChange}
        >
          <Option value="">请选择一个团队</Option>
          {this.state.teams.map(team => <Option value={team.team_name}>{team.team_alias}</Option>)}
        </Select>
      );
    }
    return this.state.joinTeams.map(join => (
      <div style={{ marginTop: 32 }}>
        <Icon type="right" style={{ marginRight: 8 }} />已申请加入团队（{join.team_alias}）{this.change(join.is_pass)}
      </div>
    ));
  };
  render() {
    const form = this.props.form;
    const { getFieldDecorator } = form;
    const is_public = this.props.rainbondInfo.is_public;
    return (
      <div className={userStyles.container} style={{ position: "relative", zIndex: 33 }}>
        <div className={userStyles.content}>
          <div className={userStyles.top}>
            <div className={userStyles.header}>
              <h1
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginBottom: 0,
                }}
              >
                {is_public ? "欢迎使用好雨公有云平台" : "欢迎使用好雨Rainbond"}
              </h1>
              <div className={userStyles.desc}>加入团队, 开启云端之旅</div>
            </div>
            <div className={styles.wrap}>
              <div className={styles.body}>
                <Steps current={this.state.current}>
                  <Step title="加入已存在的团队" description="" />
                  <Step title="等待审核" description="" />
                </Steps>
                {this.stepshow()}
              </div>
              {this.state.current == 0 && (
                <div className={styles.footer}>
                  <Fragment>
                    <Button onClick={this.handleSubmit} type="primary">
                      加入团队
                    </Button>
                  </Fragment>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
