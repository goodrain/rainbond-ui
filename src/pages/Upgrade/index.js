import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { List, Table, Tag, Avatar, Tabs } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import Info from './info';
import infoUtil from './info-util';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import sourceUtil from '../../utils/source-unit';
import globalUtil from '../../utils/global';
import {
  createEnterprise,
  createTeam,
  createApp,
} from '../../utils/breadcrumb';
import roleUtil from '../../utils/role';
import styles from './index.less';

const { TabPane } = Tabs;

@connect(({ user, global, application, teamControl, enterprise }) => ({
  groupDetail: application.groupDetail || {},
  currUser: user.pageUser,
  groups: global.groups || [],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      showApp: {},
      showMarketAppDetail: false,
      infoShow: false,
      infoData: null,
      list: [],
      activeKey: '1',
      page: 1,
      pageSize: 5,
      total: 0,
      dataList: [],
      appDetail: {},
    };
  }

  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    const isUpgrade = roleUtil.queryAppInfo(
      currentTeamPermissionsInfo,
      'upgrade'
    );
    if (!isUpgrade) {
      globalUtil.withoutPermission(dispatch);
    }
  }

  componentDidMount() {
    this.fetchAppDetail();
    this.getApplication();
  }

  // 查询当前组下的云市应用
  getApplication = () => {
    this.props.dispatch({
      type: 'global/application',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            list: res.list,
          });
        }
      },
    });
  };
  getGroupId = () => {
    const { params } = this.props.match;
    return params.appID;
  };
  // 查询某应用的更新记录列表
  getUpgradeRecordsList = () => {
    const { page, pageSize } = this.state;
    this.props.dispatch({
      type: 'global/CloudAppUpdateRecordsList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        page,
        pageSize,
        status__gt: 1,
      },
      callback: res => {
        if (res && res._code == 200) {
          if (res.list && res.list.length > 0) {
            this.setState({
              dataList: res.list,
            });
          }
        }
      },
    });
  };
  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
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
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      },
    });
  };

  showMarketAppDetail = app => {
    this.setState({
      showApp: app,
      showMarketAppDetail: true,
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false,
    });
  };

  callback = key => {
    this.setState(
      {
        activeKey: key,
      },
      () => {
        key == '2' ? this.getUpgradeRecordsList() : this.getApplication();
      }
    );
  };

  handleTableChange = (page, pageSize) => {
    this.setState(
      {
        page,
        pageSize,
      },
      () => {
        this.getUpgradeRecordsList();
      }
    );
  };
  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const {
      loading,
      list,
      showMarketAppDetail,
      showApp,
      infoShow,
      infoData,
      activeKey,
      page,
      total,
      pageSize,
      dataList,
      appDetail,
      loadingDetail,
    } = this.state;

    const paginationProps = {
      onChange: this.handleTableChange,
      pageSize,
      total,
      page,
    };

    const ListContent = ({
      data: { upgrade_versions, current_version, min_memory },
    }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>当前版本</span>
          <p>
            <Tag
              style={{
                height: '17px',
                lineHeight: '16px',
                marginBottom: '3px',
              }}
              color="green"
              size="small"
            >
              {' '}
              {current_version}
            </Tag>
          </p>
        </div>
        <div className={styles.listContentItem}>
          <span>可升级版本</span>
          <p>
            {upgrade_versions && upgrade_versions.length > 0
              ? upgrade_versions.map((item, index) => {
                  return (
                    <Tag
                      style={{
                        height: '17px',
                        lineHeight: '16px',
                        marginBottom: '3px',
                      }}
                      color="green"
                      size="small"
                      key={index}
                    >
                      {' '}
                      {item}
                    </Tag>
                  );
                })
              : '暂无升级'}
          </p>
        </div>
        <div className={styles.listContentItem}>
          <span>内存</span>
          <p>{sourceUtil.unit(min_memory || 128, 'MB')}</p>
        </div>
      </div>
    );

    const columns = [
      {
        title: '创建时间',
        dataIndex: 'create_time',
        key: '1',
        width: '20%',
        render: text => <span>{text}</span>,
      },
      {
        title: '名字',
        dataIndex: 'group_name',
        key: '2',
        width: '20%',
        render: text => <span>{text}</span>,
      },
      {
        title: '版本',
        dataIndex: 'version',
        key: '3',
        width: '30%',
        render: (text, data) => (
          <span>
            {data.old_version && data.version ? (
              <span>
                <a href="javascript:;">{data.old_version}</a>升级到
                <a href="javascript:;">{data.version}</a>
              </span>
            ) : (
              '-'
            )}
          </span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: '4',
        width: '15%',
        render: status => <span>{infoUtil.getStatusCN(status)}</span>,
      },
      {
        title: '组件详情',
        dataIndex: 'tenant_id',
        key: '5',
        width: '15%',
        render: (text, item) => (
          <a
            onClick={e => {
              e.preventDefault();
              item.status != 1 &&
                this.setState({
                  infoData: item,
                  infoShow: true,
                });
            }}
            style={{ color: item.status == 1 ? '#000' : '#1890ff' }}
            href="javascript:;"
          >
            {item.status == 1 ? '-' : '详情'}
          </a>
        ),
      },
    ];
    let breadcrumbList = [];

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
        title="升级管理"
        content="当前应用内具有从应用市场或应用商店安装而来的组件时，升级管理功能可用。若安装源的应用版本有变更则可以进行升级操作"
        extraContent={null}
      >
        {!infoShow && (
          <Tabs
            defaultActiveKey={activeKey}
            onChange={this.callback}
            className={styles.tabss}
          >
            <TabPane tab="云市应用列表" key="1">
              <div className={styles.cardList}>
                <List
                  rowKey="id"
                  size="large"
                  loading={loading}
                  dataSource={[...list]}
                  // pagination={paginationProps}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <a
                          onClick={e => {
                            e.preventDefault();
                            if (item.can_upgrade) {
                              this.setState(
                                {
                                  infoData: item,
                                },
                                () => {
                                  this.setState({
                                    infoShow: item.not_upgrade_record_id
                                      ? true
                                      : !!item.can_upgrade,
                                  });
                                }
                              );
                            }
                          }}
                          style={{
                            display: 'block',
                            marginTop: '15px',
                            color: item.can_upgrade ? '#1890ff' : '#bfbfbf',
                          }}
                        >
                          {item.not_upgrade_record_status != 1
                            ? infoUtil.getStatusCN(
                                item.not_upgrade_record_status
                              )
                            : item.can_upgrade
                            ? '升级'
                            : '无可升级的变更'}
                        </a>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={
                              item.pic ||
                              require('../../../public/images/app_icon.jpg')
                            }
                            shape="square"
                            size="large"
                          />
                        }
                        title={
                          <a
                            onClick={() => {
                              this.showMarketAppDetail(item);
                            }}
                          >
                            {item.group_name}
                          </a>
                        }
                        description={item.describe}
                      />
                      <ListContent data={item} />
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
            <TabPane tab="云市应用升级记录" key="2">
              <Table
                columns={columns}
                dataSource={dataList}
                pagination={paginationProps}
              />
            </TabPane>
          </Tabs>
        )}

        {showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={showApp}
          />
        )}

        {infoShow && (
          <Info
            data={infoData}
            activeKey={this.state.activeKey}
            group_id={this.getGroupId()}
            setInfoShow={() => {
              this.setState({ infoShow: false }, () => {
                this.state.activeKey == '2'
                  ? this.getUpgradeRecordsList()
                  : this.getApplication();
              });
            }}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
