import React, { PureComponent } from "react";
import { routerRedux } from "dva/router";
import HttpTable from "../../components/HttpTable";
import TcpTable from "../../components/TcpTable";
import { connect } from "dva";

import PageHeaderLayout from "../../layouts/PageHeaderLayout";

/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
}))
export default class AppGatewayList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
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
  componentDidMount() {}
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
    const { currentTeam } = this.props
    const { appID } = this.props.match.params;
    const { open } = this.state;
    const renderContent = () => {
      const { tabKey } = this.state;
      if (tabKey == "http") {
        return <HttpTable currentTeam={currentTeam} appID={appID} open={open} />;
      } else if (tabKey == "tcp") {
        return <TcpTable currentTeam={currentTeam} appID={appID} open={open} />;
      }
    };
    return (
      <PageHeaderLayout
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
