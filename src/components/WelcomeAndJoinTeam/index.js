import { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Steps, Form, Icon, Select, Button } from "antd";
import styles from "./index.less";
import userStyles from "../../layouts/UserLayout.less";
import { routerRedux } from "dva/router";
import cookie from "../../utils/cookie";

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
      exitShow: false
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
        if (data) {
          this.setState({ teams: data.list });
        }
      },
    });
  };
  getJoinTeams = () => {
    this.props.dispatch({
      type: "global/getJoinTeams",
      payload: { user_id: this.props.currUser.user_id },
      callback: (data) => {
        if (data) {
          this.setState({ joinTeams: data.list });
          if (data.list && data.list.length > 0) {
            const exitShow = data.list.filter((item => {
              return item.is_pass == 2
            }))
            this.setState({ current: 1, exitShow: exitShow.length > 0 ? true : false });
          }
        }
      },
    });
  };

  deleteJoinTeams = () => {
    const { joinTeams } = this.state;
    let str = ""
    joinTeams.map(item => {
      str += item.team_name + "-"
    })
    str = str.slice(0, str.length - 1)
    this.props.dispatch({
      type: "global/deleteJoinTeams",
      payload: {
        user_id: this.props.currUser.user_id,
        is_pass: 2,
        team_name: str
      },
      callback: (data) => {
        cookie.remove("token");
        cookie.remove("newbie_guide");
        cookie.remove("platform_url");
        cookie.remove("guide");
        cookie.remove("token", { domain: "" });
        cookie.remove("guide", { domain: "" });
        cookie.remove("team", { domain: "" });
        cookie.remove("region_name", { domain: "" });
        localStorage.clear();
        this.props.dispatch(routerRedux.replace("/user/login"));
      },
    });
  }
  handleSubmit = () => {
    if (this.state.selectedTeam != "") {
      this.props.dispatch({
        type: "global/joinTeam",
        payload: { team_name: this.state.selectedTeam },
        callback: () => {
          this.props.onOk && this.props.onOk();
          this.getJoinTeams();
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
                <div style={{ marginTop: "20px", textAlign: "left", paddingLeft: "166px" }}>
                  <Select
                    value={this.state.selectedTeam}
                    style={{ width: "32%", marginRight: "10px" }}
                    onChange={this.handleTeamChange}
                  >
                    <Option value="">请选择一个团队</Option>
                    {this.state.teams.map((team, index) => <Option key={index} value={team.team_name}>{team.team_alias}</Option>)}
                  </Select>
                  <Fragment>
                    <Button onClick={this.handleSubmit} type="primary">
                      加入团队
                    </Button>
                  </Fragment>
                </div>
                <div style={{ textAlign: "left", paddingLeft: "166px", paddingTop: "10px" }}>
                  {this.state.joinTeams.map((join, index) => (
                    <div style={{ marginTop: "10px" }} key={index}>
                      <Icon type="right" style={{ marginRight: 8 }} />已申请加入团队（{join.team_alias}）<span style={{ color: join.is_pass == 0 ? "#009B62" : join.is_pass == 2 ? "#DD1144" : "#FAFAFA" }}>{this.change(join.is_pass)}</span>
                    </div>
                  ))}
                </div>
                {this.state.joinTeams && this.state.joinTeams.length > 0 &&
                  <div style={{ marginTop: "20px", textAlign: "left", paddingLeft: "244px" }}>
                    <Button onClick={this.deleteJoinTeams}>退出登录</Button>
                  </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
