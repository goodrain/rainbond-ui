import React, { PureComponent } from "react";
import { routerRedux } from "dva/router";
import { connect } from "dva";
import {
  createEnterprise,
  createTeam,
  createApp
} from "../../utils/breadcrumb";

import PageHeaderLayout from "../../layouts/PageHeaderLayout";

/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class AppPublishList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      appDetail: {}
    };
  }
  componentDidMount() {
    this.fetchAppDetail();
  }

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: "groupControl/fetchGroupDetail",
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  render() {
    let breadcrumbList = [];
    const { appDetail, loadingDetail } = this.state;
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title="发布记录管理"
        content="应用发布是指将当前运行的应用进行模型化，形成应用模版发布到企业共享库或云端应用商店中，从而支持应用的标准化交付或共享"
      />
    );
  }
}
