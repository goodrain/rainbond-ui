import { Button, Card, notification, Popconfirm, Table } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import ScrollerX from '../../components/ScrollerX';
import SelectStore from '../../components/SelectStore';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
export default class AppPublishList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      appDetail: {},
      page: 1,
      pageSize: 10,
      total: 0,
      selectStoreShow: false,
    };
  }
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    const isShare = roleUtil.queryAppInfo(currentTeamPermissionsInfo, 'share');
    if (!isShare) {
      globalUtil.withoutPermission(dispatch);
    }
  }

  componentDidMount() {
    this.fetchAppDetail();
    this.fetchPublishRecoder();
  }
  onPublishStore = () => {
    this.setState({ selectStoreShow: true });
  };
  onPublishLocal = () => {
    this.handleShare('', {});
  };

  onPageChange = page => {
    this.setState({ page }, () => {
      this.fetchPublishRecoder();
    });
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'groupControl/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false,
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
      },
    });
  };

  fetchPublishRecoder = () => {
    this.setState({ loading: true });
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;
    dispatch({
      type: 'groupControl/fetchShareRecords',
      payload: {
        team_name: teamName,
        app_id: appID,
        page,
        page_size: pageSize,
      },
      callback: data => {
        if (data) {
          this.setState({ recoders: data.list, loading: false });
        }
      },
    });
  };

  handleShare = (scope, target) => {
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/ShareGroup',
      payload: {
        team_name: teamName,
        group_id: appID,
        scope,
        target,
      },
      callback: data => {
        this.continuePublish(data.bean.ID, data.bean.step);
      },
    });
  };

  hideSelectStoreShow = () => {
    this.setState({ selectStoreShow: false });
  };

  handleSelectStore = values => {
    const selectStore = values.store_id;
    if (!selectStore) {
      notification.warning({ message: '未选择正确的应用商店' });
    }
    this.handleShare('goodrain', { store_id: selectStore });
  };
  deleteRecord = recordID => {
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/deleteShareRecord',
      payload: {
        team_name: teamName,
        app_id: appID,
        record_id: recordID,
      },
      callback: data => {
        this.fetchPublishRecoder();
      },
    });
  };

  cancelPublish = recordID => {
    if (recordID == undefined || recordID == '') {
      notification.warning({ message: '参数异常' });
      return;
    }
    const { teamName } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/giveupShare',
      payload: {
        team_name: teamName,
        share_id: recordID,
      },
      callback: data => {
        this.fetchPublishRecoder();
      },
    });
  };

  continuePublish = (recordID, step) => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    if (step === 1) {
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordID}/one`
        )
      );
    }
    if (step === 2) {
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordID}/two`
        )
      );
    }
  };

  render() {
    let breadcrumbList = [];
    const {
      appDetail,
      loading,
      loadingDetail,
      page,
      pageSize,
      total,
      selectStoreShow,
      recoders,
    } = this.state;
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      dispatch,
    } = this.props;
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
        loading={loadingDetail}
        title={formatMessage({ id: 'app.publish.title' })}
        content={formatMessage({ id: 'app.publish.desc' })}
        extraContent={
          <div>
            <Button
              style={{ marginRight: 8 }}
              type="primary"
              onClick={this.onPublishLocal}
            >
              发布到组件库
            </Button>
            <Button style={{ marginRight: 8 }} onClick={this.onPublishStore}>
              发布到云应用商店
            </Button>
          </div>
        }
      >
        <Card loading={loading}>
          <ScrollerX sm={800}>
            <Table
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: this.onPageChange,
              }}
              dataSource={recoders || []}
              columns={[
                {
                  title: '发布模版名称',
                  dataIndex: 'app_model_name',
                  render: val => {
                    if (val) {
                      return val;
                    }
                    return <span style={{ color: '#999999' }}>未指定</span>;
                  },
                },
                {
                  title: '版本号(别名)',
                  dataIndex: 'version',
                  align: 'center',
                  render: (val, data) => {
                    if (val) {
                      return (
                        <p style={{ marginBottom: 0 }}>
                          {val}
                          {data.version_alias ? `(${data.version_alias})` : ''}
                        </p>
                      );
                    }
                    return <span style={{ color: '#999999' }}>未指定</span>;
                  },
                },
                {
                  title: '发布范围',
                  dataIndex: 'scope',
                  align: 'center',
                  render: (val, data) => {
                    switch (val) {
                      case '':
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            应用市场
                          </Link>
                        );
                      case 'team':
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            应用市场(团队)
                          </Link>
                        );
                      case 'enterprise':
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            应用市场(企业)
                          </Link>
                        );
                      default:
                        if (data.scope_target) {
                          return (
                            <p style={{ marginBottom: 0 }}>
                              应用商店
                              {data.scope_target.store_name &&
                                data.scope_target.store_name}
                            </p>
                          );
                        }
                        return <p style={{ marginBottom: 0 }}>应用商店</p>;
                    }
                  },
                },
                {
                  title: '发布时间',
                  align: 'center',
                  dataIndex: 'create_time',
                  render: val => (
                    <span>
                      {moment(val)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  ),
                },
                {
                  title: '状态',
                  align: 'center',
                  dataIndex: 'status',
                  render: val => {
                    // eslint-disable-next-line default-case
                    switch (val) {
                      case 0:
                        return '发布中';
                      case 1:
                        return <span style={{ color: 'green' }}>发布完成</span>;
                      case 2:
                        return <span style={{ color: '#999999' }}>已取消</span>;
                    }
                  },
                },
                {
                  title: '操作',
                  width: '200px',
                  dataIndex: 'dataIndex',
                  render: (val, data) => {
                    return (
                      <div>
                        {data.status == 0 ? (
                          <div>
                            <a
                              style={{ marginRight: '5px' }}
                              onClick={() => {
                                this.continuePublish(data.record_id, data.step);
                              }}
                            >
                              继续发布
                            </a>
                            <a
                              style={{ marginRight: '5px' }}
                              onClick={() => {
                                this.cancelPublish(data.record_id);
                              }}
                            >
                              取消发布
                            </a>
                          </div>
                        ) : (
                          <Popconfirm
                            title="确认要删除当前记录吗?"
                            onConfirm={() => {
                              this.deleteRecord(data.record_id);
                            }}
                            okText="确认"
                            cancelText="取消"
                          >
                            <a href="#">删除</a>
                          </Popconfirm>
                        )}
                      </div>
                    );
                  },
                },
              ]}
            />
          </ScrollerX>
        </Card>
        <SelectStore
          dispatch={dispatch}
          enterprise_id={currentEnterprise.enterprise_id}
          visible={selectStoreShow}
          onCancel={this.hideSelectStoreShow}
          onOk={this.handleSelectStore}
        />
      </PageHeaderLayout>
    );
  }
}
