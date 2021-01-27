import { Button, Card, Form, Input, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
import ScrollerX from '../../components/ScrollerX';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';

const FormItem = Form.Item;
/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      page: 1,
      query: '',
      pageSize: 10,
      operationPermissions: this.handlePermissions('queryAppInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  componentDidMount() {
    this.getTeamAppList();
  }
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getTeamAppList();
    });
  };

  onAddGroup = () => {
    this.setState({ addGroup: true });
  };

  getTeamAppList = () => {
    const { teamName, regionName } = this.props.match.params;
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'global/getTeamAppList',
      payload: {
        team_name: teamName,
        region: regionName,
        query,
        page,
        page_size: pageSize
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            loading: false,
            apps: res.list,
            total: res.bean && res.bean.total
          });
        }
      }
    });
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };

  handleSearch = () => {
    this.getTeamAppList();
  };
  handelChange = e => {
    this.setState({ query: e.target.value });
  };
  handleEnter = () => {
    this.handleSearch();
  };

  handleAddGroup = vals => {
    const { teamName } = this.props.match.params;
    this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: teamName,
        ...vals
      },
      callback: res => {
        if (res) {
          notification.success({ message: '新建成功' });
          this.getTeamAppList();
          this.cancelAddGroup();
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

  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match
    } = this.props;
    const { teamName, regionName } = match.params;
    const {
      apps,
      loading,
      page,
      pageSize,
      total,
      addGroup,
      operationPermissions: { isCreate }
    } = this.state;
    let breadcrumbList = [];

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
          <Form layout="inline" style={{ display: 'inline-block' }}>
            <FormItem>
              <Input
                placeholder="搜索应用"
                onChange={this.handelChange}
                onPressEnter={this.handleEnter}
                style={{ width: 250 }}
              />
            </FormItem>
            <FormItem>
              <Button type="primary" onClick={this.handleSearch} icon="search">
                搜索
              </Button>
            </FormItem>
          </Form>
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ float: 'right', marginBottom: '20px' }}
              onClick={this.onAddGroup}
            >
              新建应用
            </Button>
          )}
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
                size: 'default',
                current: page,
                pageSize,
                total,
                onChange: this.onPageChange
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
                  }
                },
                {
                  title: '更新时间',
                  dataIndex: 'update_time',
                  width: '200px',
                  render: (val, data) => {
                    if (val) {
                      return moment(val).format('YYYY-MM-DD HH:mm:ss');
                    }
                    return '-';
                  }
                },
                {
                  title: '创建时间',
                  dataIndex: 'create_time',
                  width: '200px',
                  render: (val, data) => {
                    if (val) {
                      return moment(val).format('YYYY-MM-DD HH:mm:ss');
                    }
                    return '-';
                  }
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
                  }
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
                  }
                },
                {
                  title: '备份记录',
                  width: '150px',
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
                  }
                },
                {
                  title: '发布记录',
                  width: '150px',
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
                  }
                },
                {
                  title: '备注',
                  dataIndex: 'group_note',
                  render: val => {
                    return (
                      <p style={{ marginBottom: 0, color: '#999999' }}>{val}</p>
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
