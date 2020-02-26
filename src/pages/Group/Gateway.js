import React, { PureComponent } from "react";
import { routerRedux } from "dva/router";
import HttpTable from "../../components/HttpTable";
import TcpTable from "../../components/TcpTable";
import { connect } from "dva";
import {
  createEnterprise,
  createTeam,
  createApp
} from "../../utils/breadcrumb";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";

/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl, enterprise, global }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  groups: global.groups || [],
  currentEnterprise: enterprise.currentEnterprise
}))
export default class AppGatewayList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      appDetail: {},
      createOpen: false,
      tabKey:
        props.match &&
        props.match.params &&
        props.match.params.types &&
        props.match.params.types
          ? props.match.params.types
          : "http",
      open:
        this.props.match &&
        this.props.match.params &&
        this.props.match.params.types &&
        this.props.match.params.types
          ? this.props.match.params.types
          : false
    };
  }
  componentDidMount() {
    this.fetchAppDetail();
  }
  getGroupId = () => {
    const params = this.props.match.params;
    return params.appID;
  };
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
  renderContent = () => {
    const { tabKey } = this.state;
    if (tabKey == "http") {
      return <HttpTable open={this.state.open} />;
    } else if (tabKey == "tcp") {
      return <TcpTable />;
    }
  };
  handleTabChange = key => {
    this.setState({ tabKey: key, open: false });
  };

  render() {
    const { currentTeam } = this.props;
    const { appID } = this.props.match.params;
    const { open } = this.state;
    const renderContent = () => {
      const { tabKey } = this.state;
      if (tabKey == "http") {
        return (
          <HttpTable currentTeam={currentTeam} appID={appID} open={open} />
        );
      } else if (tabKey == "tcp") {
        return <TcpTable currentTeam={currentTeam} appID={appID} open={open} />;
      }
    };
    let breadcrumbList = [];
    const { appDetail } = this.state;
    const { currentEnterprise, currentRegionName } = this.props;
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
        title="网关访问策略管理"
        content="访问策略是指从集群外访问组件的方式，包括使用HTTP域名访问或IP+Port(TCP/UDP)访问，这里仅管理当前应用下的所有组件的访问策略。"
        tabList={[
          {
            key: "http",
            tab: "HTTP"
          },
          {
            key: "tcp",
            tab: "TCP/UDP"
          }
        ]}
        onTabChange={this.handleTabChange}
      >
        {renderContent()}
      </PageHeaderLayout>
    );
  }
}
