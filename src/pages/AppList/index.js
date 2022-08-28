import {
  Button,
  Card,
  Form,
  Input,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import ScrollerX from '../../components/ScrollerX';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import styles from '../Create/Index.less';

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
    this.setState({ page, loading: true }, () => {
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

  handleAddGroup = () => {
    notification.success({ message: formatMessage({id: 'notification.success.new_success'}) });
    this.getTeamAppList();
    this.cancelAddGroup();
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
    breadcrumbList.push({ title: formatMessage({id: 'teamOverview.appList'}) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={<FormattedMessage id="teamApply.title" />}
        content={<FormattedMessage id="teamApply.desc" />}
      >
        <Row>
          <Form layout="inline" style={{ display: 'inline-block' }}>
            <FormItem>
              <Input
                placeholder={formatMessage({id: 'teamApply.searchTips'})}
                onChange={this.handelChange}
                onPressEnter={this.handleEnter}
                style={{ width: 250 }}
              />
            </FormItem>
            <FormItem>
              <Button type="primary" onClick={this.handleSearch} icon="search">
              <FormattedMessage id="teamApply.search" />
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
              <FormattedMessage id="teamApply.createApp" />
            </Button>
          )}
        </Row>

        <Card>
          {addGroup && (
            <AddGroup
              teamName={teamName}
              regionName={regionName}
              isGetGroups={false}
              onCancel={this.cancelAddGroup}
              onOk={this.handleAddGroup}
            />
          )}
          <ScrollerX sm={800}>
            <Table
              loading={loading}
              size="default"
              scroll={{ x: window.innerWidth > 1500 ? false : 1500 }}
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
                  title: formatMessage({id: 'teamApply.appName'}),
                  dataIndex: 'group_name',
                  width: 300,
                  render: (val, data) => {
                    return (
                      <Link
                        className={styles.verticalCen}
                        to={`/team/${teamName}/region/${regionName}/apps/${data.group_id}`}
                      >
                        {globalUtil.fetchSvg(
                          data.app_type === 'helm' ? 'HelmSvg' : 'localMarket'
                        )}
                        {val}
                      </Link>
                    );
                  }
                },
                {
                  title: formatMessage({id: 'teamApply.updateTime'}),
                  dataIndex: 'update_time',
                  width: 200,
                  render: val => {
                    if (val) {
                      return moment(val).format('YYYY-MM-DD HH:mm:ss');
                    }
                    return '-';
                  }
                },
                {
                  title: formatMessage({id: 'teamApply.createTime'}),
                  dataIndex: 'create_time',
                  width: 200,
                  render: val => {
                    if (val) {
                      return moment(val).format('YYYY-MM-DD HH:mm:ss');
                    }
                    return '-';
                  }
                },
                {
                  title: formatMessage({id: 'teamApply.componentNumComparison'}),
                  dataIndex: 'services_num',
                  align: 'center',
                  width: 150,
                  render: (_, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.run_service_num}/{data.services_num}
                      </p>
                    );
                  }
                },
                {
                  title: formatMessage({id: 'teamApply.memoryNumComparison'}),
                  dataIndex: 'used_mem',
                  align: 'center',
                  width: 200,
                  render: (_, data) => {
                    return (
                      <p style={{ marginBottom: 0 }}>
                        {data.used_mem}/{data.allocate_mem}
                      </p>
                    );
                  }
                },
                {
                  title: formatMessage({id: 'teamApply.duplicateRecord'}),
                  width: 150,
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
                  title: formatMessage({id: 'teamApply.releaseRecord'}),
                  width: 150,
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
                  title: formatMessage({id: 'teamApply.remarks'}),
                  dataIndex: 'group_note',
                  width: 100,
                  render: val => {
                    return (
                      <Tooltip placement="top" title={val}>
                        <p className={styles.groupnote}>{val}</p>
                      </Tooltip>
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
