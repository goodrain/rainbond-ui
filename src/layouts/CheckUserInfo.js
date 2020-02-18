import React from 'react';
import userUtil from '../utils/user';
import globalUtil from '../utils/global';
import cookie from '../utils/cookie';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import WelcomeAndCreateTeam from '../components/WelcomeAndCreateTeam';
import WelcomeAndJoinTeam from '../components/WelcomeAndJoinTeam';

/* 检查用户信息, 包括检测团队和数据中心信息等 */
@connect()
export default class CheckUserInfo extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  // 默认团队
  toDefaultTeam = () => {
    const { userInfo, enterpriseList } = this.props;

    routerRedux.replace(
      `/enterprise/${enterpriseList[0].enterprise_id}/index`
    )

    // const team = userUtil.getDefaultTeam(userInfo);
    // // 当前团队里没有数据中心
    // const currRegion = team.region[0]
    //   ? team.region[0].team_region_name
    //   : 'no-region';

    // this.props.dispatch(
    //   routerRedux.replace(`/team/${team.team_name}/region/${currRegion}/index`)
    // );
  };

  // 验证当前团队里是否已经开通了数据中心
  currTeamHasRegion = () => {
    const { userInfo } = this.props;
    const currTeam = globalUtil.getCurrTeamName();
    // 判断当前团队里是否有数据中心
    const currTeamObj = userUtil.getTeamByTeamName(userInfo, currTeam);
    if (currTeamObj && (!currTeamObj.region || !currTeamObj.region.length)) {
      return false;
    }
    return true;
  };

  // 验证url里的团队和数据中心是否有效
  checkUrlTeamRegion = () => {
    const { userInfo, enterpriseList } = this.props;

    let currTeam = globalUtil.getCurrTeamName();
    let currRegion = globalUtil.getCurrRegionName();

    // 没有数据中心放行，在后续页面做处理
    if (currRegion === 'no-region') {
      return true;
    }

    // url里没有team
    if (!currTeam || !currRegion) {
      console.log('22');

      currTeam = cookie.get('team');
      currRegion = cookie.get('region_name');
      if (currTeam && currRegion) {
      console.log('url里有team');

        this.props.dispatch(
          routerRedux.replace(`/team/${currTeam}/region/${currRegion}/index`)
        );
      } else {
        this.toDefaultTeam();
      }
      return true;
    }

    // 如果当前用户没有该团队, 并且是系统管理员
    if (!userUtil.getTeamByTeamName(userInfo, currTeam)) {
      console.log('33');

      if (userUtil.isSystemAdmin(userInfo) || currTeam === 'grdemo') {
        this.props.dispatch({
          type: 'user/getTeamByName',
          payload: {
            team_name: currTeam,
          },
          callback: () => {},
          fail: () => {
            this.toDefaultTeam();
          },
        });
      } else {
        this.toDefaultTeam();
      }

      return false;
    }

    // 判断当前团队是否有数据中心
    const team = userUtil.getTeamByTeamName(userInfo, currTeam);
    if (!team.region || !team.region.length) {
      console.log('444');
 this.toDefaultTeam();
      // this.props.dispatch(
      //   routerRedux.replace(`/team/${currTeam}/region/no-region/index`)
      // );
      return false;
    }

    // 判断当前浏览的数据中心是否在要访问的团队里
    const region = team.region.filter(
      region => region.team_region_name === currRegion
    );
    if (!region.length) {
      console.log('555');

      this.toDefaultTeam();
      return true;
    }
    cookie.set('team', currTeam);
    cookie.set('region_name', currRegion);
    return true;
  };
  // 判断是否是企业视图
  isEnterpriseView = () => {
    const {
      enterpriseList,
      dispatch,
      enterTrue,
      enterpriseView,
      handleEnterTrue,
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId();
    if (enterpriseView && enterTrue) {
      dispatch(
        routerRedux.replace(
          `/enterprise/${enterpriseList[0].enterprise_id}/index`
        )
      );
      handleEnterTrue && handleEnterTrue();
      return false;
    }
    return false;
  };

  render() {
    const {
      children,
      userInfo,
      rainbondInfo,
      enterpriseList,
      enterpriseView,
    } = this.props;

    if (!userInfo || !rainbondInfo || enterpriseList.length === 0) return null;

    // if (this.isEnterpriseView()) {
    //   return null;
    // }

    if (!enterpriseView && !this.checkUrlTeamRegion()) {
      return null;
    }

    return children;
  }
}
