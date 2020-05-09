import React, { PureComponent } from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import globalUtil from "../../utils/global";
import OuterCustom from "./outer-custom";
import {
  createEnterprise,
  createTeam
} from "../../utils/breadcrumb";


@connect(
  ({ enterprise, teamControl, global }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }
  componentDidMount() {}
  componentWillUnmount() {}
  handleTabChange = key => {
    const { dispatch, match } = this.props;
    const { appAlias } = this.props.match.params;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/outer/${key}`
      )
    );
  };
  render() {
    const rainbondInfo = this.props.rainbondInfo;
    const map = {
      outer: OuterCustom
    };

    let breadcrumbList = [];
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      );
    breadcrumbList.push({title: "创建组件"})
    let type = this.props.match.params.type;
    if (!type) {
      type = "outer";
    }
    const Com = map[type];

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="添加第三方组件"
        onTabChange={this.handleTabChange}
        content={
          <p>
            第三方组件，即运行于Rainbond集群外的组件，在Rainbond中创建组件即可以将其与Rainbond网关无缝对接，同时也可以被Rainbond内服务访问。满足用户通过Rainbond可以对
            各类组件进行统一的监控和管理的需要
          </p>
        }
        // tabActiveKey={type}
        // tabList={tabList}
      >
        {Com ? <Com {...this.props} /> : "参数错误"}
      </PageHeaderLayout>
    );
  }
}
