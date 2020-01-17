import React, { PureComponent } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import { List, Avatar, Button, Icon, notification } from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import styles from "./index.less";
import globalUtil from "../../utils/global";
import userUtil from "../../utils/user";
import teamUtil from "../../utils/team";
import cookie from "../../utils/cookie";
import MoveTeam from "./move_team";
import TeamDataCenterList from "../../components/Team/TeamDataCenterList";
import TeamMemberList from "../../components/Team/TeamMemberList";
import TeamRoleList from "../../components/Team/TeamRoleList";
import TeamEventList from "../../components/Team/TeamEventList";

@connect(({ user, teamControl, loading }) => ({
  currUser: user.currentUser,
  teamControl,
  projectLoading: loading.effects["project/fetchNotice"],
  activitiesLoading: loading.effects["activities/fetchList"],
  regions: teamControl.regions,
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    const params = this.getParam();
    this.state = {
      showEditName: false,
      showDelTeam: false,
      showExitTeam: false,
      scope: params.type || "event",
    };
  }
  getParam() {
    return this.props.match.params;
  }
  componentDidMount() {
    this.props.dispatch({ type: "teamControl/fetchAllPerm" });
  }
  componentWillUnmount() {}
  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  showExitTeam = () => {
    this.setState({ showExitTeam: true });
  };
  hideExitTeam = () => {
    this.setState({ showExitTeam: false });
  };
  handleExitTeam = () => {
    const team_name = globalUtil.getCurrTeamName();
    if (team_name == "jdgn6pk5") {
        notification.warning({ message: "当前为演示团队，不能退出！" });
        return
    }
    this.props.dispatch({
      type: "teamControl/exitTeam",
      payload: {
        team_name,
      },
      callback: () => {
        cookie.remove("team");
        cookie.remove("region_name");
        cookie.remove("newbie_guide");
        cookie.remove("platform_url");
        this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`));
        location.reload();
      },
    });
  };
  showDelTeam = () => {
    this.setState({ showDelTeam: true });
  };
  hideDelTeam = () => {
    this.setState({ showDelTeam: false });
  };
  handleEditName = (data) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/editTeamAlias",
      payload: {
        team_name,
        ...data,
      },
      callback: () => {
        this.props.dispatch({ type: "user/fetchCurrent" });
        this.hideEditName();
      },
    });
  };
  handleDelTeam = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/delTeam",
      payload: {
        team_name,
      },
      callback: () => {
        location.hash = "/index";
        location.reload();
      },
    });
  };
  handleTabChange = (key) => {
    this.setState({ scope: key });
  };
  render() {
    const { currUser } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, team_name);

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar size="large" src={require("../../../public/images/team-icon.png")} />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {team.team_alias}{" "}
            {teamUtil.canEditTeamName(team) && <Icon onClick={this.showEditName} type="edit" />}
          </div>
          <div>创建于 {moment(team.create_time).format("YYYY-MM-DD")}</div>
        </div>
      </div>
    );
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.extraBtns}>
          <Button onClick={this.showExitTeam} type="dashed">
            退出团队
          </Button>
          {
            <Button
              disabled={!teamUtil.canDeleteTeam(team)}
              onClick={this.showDelTeam}
              type="dashed"
            >
              {" "}
              删除团队{" "}
            </Button>
          }
        </div>
      </div>
    );
    const eventCar = <TeamEventList />;
    const tabList = [
      {
        key: "event",
        tab: "动态",
      },
      {
        key: "member",
        tab: "成员",
      },
      {
        key: "datecenter",
        tab: "数据中心",
      },
      {
        key: "role",
        tab: "角色",
      },
    ];

    return (
      <PageHeaderLayout
        tabList={tabList}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {this.state.scope === "datecenter" && <TeamDataCenterList />}
        {this.state.scope === "member" && <TeamMemberList />}
        {this.state.scope === "role" && <TeamRoleList />}
        {this.state.scope === "event" && eventCar}

        {this.state.showEditName && (
          <MoveTeam
            teamAlias={team.team_alias}
            onSubmit={this.handleEditName}
            onCancel={this.hideEditName}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelTeam}
            title="删除团队"
            subDesc="此操作不可恢复"
            desc="确定要删除此团队吗？"
            onCancel={this.hideDelTeam}
          />
        )}
        {this.state.showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title="退出团队"
            subDesc="此操作不可恢复"
            desc="确定要退出此团队吗?"
            onCancel={this.hideExitTeam}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
