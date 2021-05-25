/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-nested-ternary */
import ComponentVersion from '@/components/ComponentVersion';
import { Avatar, List, Table, Tabs, Tag } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import styles from './index.less';
import Info from './info';
import infoUtil from './info-util';

const { TabPane } = Tabs;

@connect(({ user, global, application, teamControl, enterprise }) => ({
  groupDetail: application.groupDetail || {},
  currUser: user.pageUser,
  groups: global.groups || [],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      upgradeLoading: true,
      recordLoading: true,
      isComponent: false,
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
      appDetail: {}
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
  getParameter = () => {
    const { teamName, regionName, appID } = this.props.match.params;
    return {
      team_name: teamName,
      region_name: regionName,
      group_id: appID
    };
  };

  // 查询当前组下的云市应用
  getApplication = () => {
    this.props.dispatch({
      type: 'global/application',
      payload: this.getParameter(),
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            list: res.list
          });
        }
        this.handleCancelLoading();
      }
    });
  };
  getGroupId = () => {
    const { params } = this.props.match;
    return params.appID;
  };
  // 查询某应用的更新记录列表
  getUpgradeRecordsList = () => {
    const { page, pageSize } = this.state;
    const { team_name, group_id } = this.getParameter();
    this.props.dispatch({
      type: 'global/CloudAppUpdateRecordsList',
      payload: {
        team_name,
        group_id,
        page,
        pageSize,
        status__gt: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            dataList: res.list || []
          });
        }
        this.handleCancelLoading();
      }
    });
  };
  fetchAppDetail = () => {
    const { dispatch } = this.props;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: this.getParameter(),
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
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
      }
    });
  };

  showMarketAppDetail = app => {
    this.setState({
      showApp: app,
      showMarketAppDetail: true
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  callback = key => {
    this.setState(
      {
        upgradeLoading: true,
        recordLoading: true,
        activeKey: key
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
        pageSize
      },
      () => {
        this.getUpgradeRecordsList();
      }
    );
  };

  showComponentVersion = info => {
    this.setState({
      isComponent: info
    });
  };

  handleCancelComponent = () => {
    this.setState({
      isComponent: false
    });
  };

  handleCancelLoading = () => {
    this.setState({
      upgradeLoading: false,
      recordLoading: false
    });
  };
  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const {
      recordLoading,
      upgradeLoading,
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
      isComponent,
      loadingDetail
    } = this.state;

    const paginationProps = {
      onChange: this.handleTableChange,
      pageSize,
      total,
      page
    };

    const ListContent = ({ data: { upgrade_versions, current_version } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>当前版本</span>
          <p>
            <Tag
              style={{
                height: '17px',
                lineHeight: '16px',
                marginBottom: '3px'
              }}
              color="green"
              size="small"
            >
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
                        marginBottom: '3px'
                      }}
                      color="green"
                      size="small"
                      key={index}
                    >
                      {item}
                    </Tag>
                  );
                })
              : '暂无升级'}
          </p>
        </div>
      </div>
    );

    const columns = [
      {
        title: '创建时间',
        dataIndex: 'create_time',
        key: '1',
        width: '20%',
        render: text => <span>{text}</span>
      },
      {
        title: '名字',
        dataIndex: 'group_name',
        key: '2',
        width: '20%',
        render: text => <span>{text}</span>
      },
      {
        title: '版本',
        dataIndex: 'version',
        key: '3',
        width: '30%',
        render: (_, data) => (
          <div>
            {data.old_version && data.version ? (
              <div>
                <span className={styles.versions}>{data.old_version}</span>
                升级到
                <span className={styles.versions}>{data.version}</span>
              </div>
            ) : (
              '-'
            )}
          </div>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: '4',
        width: '15%',
        render: status => <span>{infoUtil.getStatusCN(status)}</span>
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
              item.status !== 1 &&
                this.setState({
                  infoData: item,
                  infoShow: true
                });
            }}
            style={{ color: item.status === 1 ? '#000' : '#1890ff' }}
          >
            {item.status === 1 ? '-' : '详情'}
          </a>
        )
      }
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
            <TabPane tab="应用模型列表" key="1">
              <div className={styles.cardList}>
                <List
                  rowKey="id"
                  size="large"
                  loading={upgradeLoading}
                  dataSource={[...list]}
                  renderItem={item => {
                    const notUpgradeRecordStatus =
                      item.not_upgrade_record_status;
                    return (
                      <List.Item
                        actions={[
                          <a
                            onClick={e => {
                              e.preventDefault();
                              if (item.can_upgrade) {
                                this.setState({
                                  infoData: item,
                                  infoShow: item.not_upgrade_record_id
                                    ? true
                                    : !!item.can_upgrade
                                });
                              }
                            }}
                          >
                            {notUpgradeRecordStatus !== 1 ? (
                              infoUtil.getStatusCN(notUpgradeRecordStatus)
                            ) : item.can_upgrade ? (
                              '升级'
                            ) : (
                              <span
                                style={{
                                  color: 'rgba(0, 0, 0, 0.45)'
                                }}
                              >
                                无可升级的变更
                              </span>
                            )}
                          </a>,
                          <a
                            onClick={() => {
                              this.showComponentVersion(item);
                            }}
                          >
                            查看组件
                          </a>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              src={
                                item.pic ||
                                require('../../../public/images/app_icon.svg')
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
                    );
                  }}
                />
              </div>
            </TabPane>
            <TabPane tab="升级记录" key="2">
              <Table
                loading={recordLoading}
                columns={columns}
                dataSource={dataList}
                pagination={paginationProps}
              />
            </TabPane>
          </Tabs>
        )}
        {isComponent && (
          <ComponentVersion
            onCancel={this.handleCancelComponent}
            data={isComponent}
            ok={this.getApplication}
            {...this.getParameter()}
          />
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
                this.state.activeKey === '2'
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
