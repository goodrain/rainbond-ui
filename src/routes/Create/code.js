import React, { PureComponent } from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "dva";
import { Link, Switch, Route, routerRedux } from "dva/router";
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
import { getRoutes } from "../../utils/utils";
import { getRouterData } from "../../common/router";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import CodeCustom from "./code-custom";
import CodeDemo from "./code-demo";
import CodeGoodrain from "./code-goodrain";
import CodeGithub from "./code-github";
import rainbondUtil from "../../utils/rainbond";

const ButtonGroup = Button.Group;

@connect(
  ({ user, groupControl, global }) => ({ rainbondInfo: global.rainbondInfo }),
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
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/${key}`
      )
    );
  };
  render() {
    const { rainbondInfo } = this.props;
    const map = {
      custom: CodeCustom,
      demo: CodeDemo,
      gitlab: CodeGithub,
      github: CodeGithub
    };

    const tabList = [
      {
        key: "custom",
        tab: "自定义源码"
      }
    ];
    if (rainbondUtil.officialDemoEnable(rainbondInfo)) {
      tabList.push({ key: "demo", tab: "官方DEMO" });
    }

    tabList.push({ key: "github", tab: "github" });
    if (rainbondUtil.OauthbEnable(rainbondInfo)) {
      rainbondInfo.oauth_services.value.map(item => {
        const { name, service_id, oauth_type } = item;
        map[service_id] = CodeGithub;
        tabList.push({
          key: service_id,
          types: oauth_type,
          tab:
            oauth_type === "github"
              ? "Github项目"
              : oauth_type === "gitlab"
              ? "Gitlab项目"
              : oauth_type === "gitee"
              ? "Gitee项目"
              : name + "项目"
        });
        return tabList;
      });
    }

    const { match, routerData, location } = this.props;
    let type = this.props.match.params.type;
    if (!type) {
      type = "custom";
    }
    const Com = map[type];

    return (
      <PageHeaderLayout
        breadcrumbList={[
          {
            title: "首页",
            href: "/"
          },
          {
            title: "创建应用",
            href: ""
          },
          {
            title: "从源码创建",
            href: ""
          }
        ]}
        title="由源码创建组件"
        onTabChange={this.handleTabChange}
        content={<p> 从指定源码仓库中获取源码，基于源码信息创建新组件 </p>}
        tabActiveKey={type}
        tabList={tabList}
      >
        {Com ? (
          <Com
            {...this.props}
            type={this.props.match.params.type}
            tabList={tabList}
          />
        ) : (
          "参数错误"
        )}
      </PageHeaderLayout>
    );
  }
}
