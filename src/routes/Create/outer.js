import React, { PureComponent } from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "dva";
import { Link, Switch, Route, routerRedux } from "dva/router";
import { Row, Col, Card, Form, Button, Icon, Menu, Dropdown, notification } from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import { getRoutes } from "../../utils/utils";
import { getRouterData } from "../../common/router";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import OuterCustom from "./outer-custom";

const ButtonGroup = Button.Group;

@connect(

({ user, groupControl, global }) => ({ rainbondInfo: global.rainbondInfo }),
  null,
  null,
  { pure: false },
)
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }
  componentDidMount() {}
  componentWillUnmount() {}
  handleTabChange = (key) => {
    const { dispatch, match } = this.props;
    const { appAlias } = this.props.match.params;
    dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/outer/${key}`));
  };
  render() {
    const rainbondInfo = this.props.rainbondInfo;
    const map = {
      outer: OuterCustom,
    };

    // const tabList = [
    //   {
    //     key: "outer",
    //     tab: "",
    //   }
    // ];
    const { match, routerData, location } = this.props;
    let type = this.props.match.params.type;
    if (!type) {
      type = "outer";
    }
    const Com = map[type];

    return (
      <PageHeaderLayout
        breadcrumbList={[
          {
            title: "首页",
            href: "/",
          },
          {
            title: "创建应用",
            href: "",
          },
          {
            title: "添加第三方组件",
            href: "",
          },
        ]}
        title="添加第三方组件"
        onTabChange={this.handleTabChange}
        content={<p>第三方组件，即运行于Rainbond集群外的组件，在Rainbond中创建组件即可以将其与Rainbond网关无缝对接，同时也可以被Rainbond内服务访问。满足用户通过Rainbond可以对
          各类组件进行统一的监控和管理的需要。</p>}
        // tabActiveKey={type}
        // tabList={tabList}
      >
        {Com ? <Com {...this.props} /> : "参数错误"}
      </PageHeaderLayout>
    );
  }
}
