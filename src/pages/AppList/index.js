import React, { PureComponent } from "react";
import { routerRedux, Link } from "dva/router";
import { connect } from "dva";
import { Card, Table } from "antd";
import { createEnterprise, createTeam } from "../../utils/breadcrumb";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import ScrollerX from "../../components/ScrollerX";

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
      loading: true,
      page: 1,
      page_size: 10
    };
  }
  componentDidMount() {
    this.getTeamAppList();
  }
  onPageChange = page => {
    this.setState({ page: page }, () => {
      this.getTeamAppList();
    });
  };
  getTeamAppList = () => {
    const { teamName, regionName } = this.props.match.params;
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "global/getTeamAppList",
      payload: {
        team_name: teamName,
        region: regionName,
        page,
        page_size
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            loading: false,
            apps: res.list,
            total: res.bean && res.bean.total
          });
        }
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
    const { apps, loading, page, page_size, total } = this.state;
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
        <Card loading={loading}>
          <ScrollerX sm={800}>
            <Table
              size="middle"
              pagination={{
                current: page,
                pageSize: page_size,
                total: total,
                onChange: this.onPageChange
              }}
              dataSource={apps || []}
              columns={[
                {
                  title: "应用名称",
                  dataIndex: "group_name",
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}`}
                      >
                        {val}
                      </Link>
                    );
                  }
                },
                {
                  title: "组件(运行/总数)",
                  dataIndex: "services_num",
                  align: "center",
                  render: (val, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.run_service_num}/{data.services_num}
                      </p>
                    );
                  }
                },
                {
                  title: "占用内存/分配内存(MB)",
                  dataIndex: "used_mem",
                  align: "center",
                  render: (val, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.used_mem}/{data.allocate_mem}
                      </p>
                    );
                  }
                },
                {
                  title: "备份记录",
                  dataIndex: "backup_record_num",
                  align: "center",
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}/backup`}
                      >
                        {val}
                      </Link>
                    );
                  }
                },
                {
                  title: "发布记录",
                  dataIndex: "share_record_num",
                  align: "center",
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}/publish`}
                      >
                        {val}
                      </Link>
                    );
                  }
                },
                {
                  title: "备注",
                  dataIndex: "note",
                  render: (val, data) => {
                    return (
                      <p style={{ marginBottom: 0, color: "#999999" }}>
                        {val}
                      </p>
                    );
                  }
                }
              ]}
            />
          </ScrollerX>
        </Card>
      </PageHeaderLayout>
    );
  }
}
