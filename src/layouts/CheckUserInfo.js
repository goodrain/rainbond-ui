import React from "react";
import userUtil from "../utils/user";
import globalUtil from "../utils/global";
import cookie from "../utils/cookie";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import WelcomeAndCreateTeam from "../components/WelcomeAndCreateTeam";
import WelcomeAndJoinTeam from "../components/WelcomeAndJoinTeam";

/* 检查用户信息, 包括检测团队和数据中心信息等 */
@connect()
export default class CheckUserInfo extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount = () => {};
  toDefaultTeam = () => {
    const user = this.props.userInfo;
    const team = userUtil.getDefaultTeam(user);
    // 当前团队里没有数据中心
    const currRegion = team.region[0] ? team.region[0].team_region_name : "";
    if (currRegion) {
      this.props.dispatch(
        routerRedux.replace(
          `/team/${team.team_name}/region/${currRegion}/index`
        )
      );
    }
  };
  // 判断当前用户有没有团队
  hasTeam = () => {
    const currentUser = this.props.userInfo;
    if (!currentUser.teams || !currentUser.teams.length) {
      return false;
    }
    return true;
  };
  canCreateTeam = () => {
    const currentUser = this.props.userInfo;
    return (
      userUtil.isSystemAdmin(currentUser) ||
      userUtil.isCompanyAdmin(currentUser)
    );
  };
  // 验证当前团队里是否已经开通了数据中心
  currTeamHasRegion = () => {
    const user = this.props.userInfo;
    const currTeam = globalUtil.getCurrTeamName();
    // 判断当前团队里是否有数据中心
    const currTeamObj = userUtil.getTeamByTeamName(user, currTeam);
    if (currTeamObj && (!currTeamObj.region || !currTeamObj.region.length)) {
      return false;
    }
    return true;
  };
  // 验证url里的团队和数据中心是否有效
  checkUrlTeamRegion = () => {
    const user = this.props.userInfo;
    let currTeam = globalUtil.getCurrTeamName();
    let currRegion = globalUtil.getCurrRegionName();

    // 没有数据中心放行，在后续页面做处理
    if (currRegion === "no-region") {
      return true;
    }

    // url里没有team
    if (!currTeam || !currRegion) {
      currTeam = cookie.get("team");
      currRegion = cookie.get("region_name");
      if (currTeam && currRegion) {
        this.props.dispatch(
          routerRedux.replace(`/team/${currTeam}/region/${currRegion}/index`)
        );
      } else {
        this.toDefaultTeam();
      }
      return false;
    }

    // 如果当前用户没有该团队, 并且是系统管理员
    if (!userUtil.getTeamByTeamName(user, currTeam)) {
      if (userUtil.isSystemAdmin(user) || currTeam === "grdemo") {
        this.props.dispatch({
          type: "user/getTeamByName",
          payload: {
            team_name: currTeam
          },
          callback: () => {},
          fail: () => {
            this.toDefaultTeam();
          }
        });
      } else {
        this.toDefaultTeam();
      }

      return false;
    }

    // 判断当前团队是否有数据中心
    const team = userUtil.getTeamByTeamName(user, currTeam);
    if (!team.region || !team.region.length) {
      this.props.dispatch(
        routerRedux.replace(`/team/${currTeam}/region/no-region/index`)
      );
      return false;
    }

    // 判断当前浏览的数据中心是否在要访问的团队里
    const region = team.region.filter(
      region => region.team_region_name === currRegion
    );
    if (!region.length) {
      this.toDefaultTeam();
      return false;
    }
    cookie.set("team", currTeam);
    cookie.set("region_name", currRegion);
    return true;
  };

  render() {
    const user = this.props.userInfo;
    const rainbondInfo = this.props.rainbondInfo;
    if (!user || !rainbondInfo) return null;

    if (!this.hasTeam() && this.canCreateTeam()) {
      return (
        <WelcomeAndCreateTeam
          rainbondInfo={rainbondInfo}
          onOk={this.props.onInitTeamOk}
        />
      );
    }
    if (!this.hasTeam() && !this.canCreateTeam()) {
      return (
        <WelcomeAndJoinTeam
          rainbondInfo={rainbondInfo}
          onOk={this.props.onInitTeamOk}
        />
      );
    }
    if (!this.checkUrlTeamRegion()) {
      return null;
    }

    return this.props.children;
  }
}
