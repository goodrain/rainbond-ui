import React, { PureComponent } from 'react';
import { routerRedux, Link } from 'dva/router';
import { connect } from 'dva';
import { Card, Table, Button, Row, notification, Form, Input } from 'antd';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ScrollerX from '../../components/ScrollerX';
import AddGroup from '../../components/AddOrEditGroup';

const FormItem = Form.Item;
/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      page: 1,
      query: '',
      page_size: 10,
    };
  }
  componentDidMount() {
    this.getTeamAppList();
  }
  handleSearch = e => {
    this.getTeamAppList();
  };
  handelChange = (e) => {
		this.setState({ query: e.target.value})
	}
	handleEnter=()=>{
		this.handleSearch()
	}
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getTeamAppList();
    });
  };
  handleAddGroup = vals => {
    const { teamName } = this.props.match.params;
    this.props.dispatch({
      type: 'groupControl/addGroup',
      payload: {
        team_name: teamName,
        ...vals,
      },
      callback: res => {
        if (res) {
          notification.success({ message: '新建成功' });
          this.getTeamAppList();
          this.cancelAddGroup();
        }
      },
    });
  };

  getTeamAppList = () => {
    const { teamName, regionName } = this.props.match.params;
    const { page, page_size, query } = this.state;
    this.props.dispatch({
      type: 'global/getTeamAppList',
      payload: {
        team_name: teamName,
        region: regionName,
        query: query,
        page,
        page_size,
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            loading: false,
            apps: res.list,
            total: res.bean && res.bean.total,
          });
        }
      },
    });
  };
  jumpToAllbackup = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch(
      routerRedux.push(`/team/${teamName}/region/${regionName}/allbackup`)
    );
  };
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  render() {
    const { teamName, regionName } = this.props.match.params;
    const { apps, loading, page, page_size, total, addGroup } = this.state;
    let breadcrumbList = [];
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '应用列表' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="应用管理"
        content="应用可以是一个工程，一个架构，一个业务系统的管理单元，其由多个组件和应用配置构成"
      >
        <Row>
          <Form layout="inline" style={{ display: 'inline-block'}}>
            <FormItem>
                <Input placeholder="搜索应用"  onChange={this.handelChange.bind(this)} onPressEnter={this.handleEnter} style={{width:250}} />
            </FormItem>
            <FormItem>
              <Button type="primary" onClick={this.handleSearch} icon="search">
                搜索
              </Button>
            </FormItem>
          </Form>
          <Button
            type="primary"
            icon="plus"
            style={{ float: 'right', marginBottom: '20px' }}
            onClick={this.onAddGroup}
          >
            新建应用
          </Button>
        </Row>

        <Card loading={loading}>
          {addGroup && (
            <AddGroup
              onCancel={this.cancelAddGroup}
              onOk={this.handleAddGroup}
            />
          )}
          <ScrollerX sm={800}>
            <Table
              size="default"
              pagination={{
                size: "default",
                current: page,
                pageSize: page_size,
                total,
                onChange: this.onPageChange,
              }}
              dataSource={apps || []}
              columns={[
                {
                  title: '应用名称',
                  dataIndex: 'group_name',
                  width: '300px',
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}`}
                      >
                        {val}
                      </Link>
                    );
                  },
                },
                {
                  title: '组件(运行/总数)',
                  dataIndex: 'services_num',
                  align: 'center',
                  width: '150px',
                  render: (_, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.run_service_num}/{data.services_num}
                      </p>
                    );
                  },
                },
                {
                  title: '占用内存/分配内存(MB)',
                  dataIndex: 'used_mem',
                  align: 'center',
                  width: '200px',
                  render: (_, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.used_mem}/{data.allocate_mem}
                      </p>
                    );
                  },
                },
                {
                  title: '备份记录',
                  width: '200px',
                  dataIndex: 'backup_record_num',
                  align: 'center',
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}/backup`}
                      >
                        {val}
                      </Link>
                    );
                  },
                },
                {
                  title: '发布记录',
                  width: '200px',
                  dataIndex: 'share_record_num',
                  align: 'center',
                  render: (val, data) => {
                    return (
                      <Link
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}/publish`}
                      >
                        {val}
                      </Link>
                    );
                  },
                },
                {
                  title: '备注',
                  dataIndex: 'group_note',
                  render: val => {
                    return (
                      <p style={{ marginBottom: 0, color: '#999999' }}>
                        {val}
                      </p>
                    );
                  },
                },
              ]}
            />
          </ScrollerX>
        </Card>
      </PageHeaderLayout>
    );
  }
}
