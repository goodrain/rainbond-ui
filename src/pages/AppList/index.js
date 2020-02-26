import React, { PureComponent } from "react";
import { routerRedux } from "dva/router";
import { connect } from "dva";
import { Card, Button, Col, Row, Menu, Dropdown, Icon, Spin } from "antd";
import { createEnterprise, createTeam } from "../../utils/breadcrumb";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";

/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true
    };
  }
  componentDidMount() {
    this.fetchTeamApps();
  }
  fetchTeamApps = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: teamName
      },
      callback: re => {
        this.setState({ apps: re, loading: false });
      }
    });
  };
  jumpToAllbackup = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch(
      routerRedux.push(`/team/${teamName}/region/${regionName}/allbackup`)
    );
  };
  deleteApp = appID => {};

  render() {
    const { teamName, regionName } = this.props.match.params;
    const { apps, loading } = this.state;
    const moreSvg = () =>
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>;
    const menu = appID => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.deleteApp(appID);
              }}
            >
              删除
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    let breadcrumbList = [];
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: "应用列表" });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="应用管理"
        content="应用可以是一个工程，一个架构，一个业务系统的管理单元，其由多个组件和应用配置构成。"
      >
        <div>
          <Row>
            <Button onClick={this.jumpToAllbackup}>全部备份</Button>
          </Row>
          <Row type="flex" align="middle">
            <Col span={6}>应用名称</Col>
            <Col span={3}>组件数量</Col>
            <Col span={3}>备份记录</Col>
            <Col span={3}>发布记录</Col>
            <Col span={8}>备注</Col>
          </Row>
          {loading &&
            <div>
              <Spin />
            </div>}
          {apps &&
            apps.map(item => {
              const { group_name, group_id } = item;
              return (
                <Card
                  key={group_id}
                  style={{ marginBottom: "10px" }}
                  hoverable
                  bodyStyle={{ padding: 0 }}
                >
                  <Row type="flex" align="middle">
                    <Col
                      span={6}
                      onClick={() => {
                        this.props.dispatch(
                          routerRedux.replace(
                            `/team/${teamName}/region/${regionName}/apps/${group_id}`
                          )
                        );
                      }}
                    >
                      {group_name}
                    </Col>
                    <Col span={3} />
                    <Col span={3} />
                    <Col span={3} />
                    <Col span={8} />
                    <Col span={1}>
                      <Dropdown overlay={menu(group_id)} placement="bottomLeft">
                        <Button style={{ border: "none" }}>
                          <Icon component={moreSvg} />
                        </Button>
                      </Dropdown>
                    </Col>
                  </Row>
                </Card>
              );
            })}
        </div>
      </PageHeaderLayout>
    );
  }
}
