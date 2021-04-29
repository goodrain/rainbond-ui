/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
import {
  Avatar,
  Button,
  Form,
  List,
  notification,
  Spin,
  Table,
  Tabs,
  Tag
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
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

@Form.create()
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
      loadingDetail: true,
      loadingList: true,
      upgradeLoading: true,
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
  }

  // 查询当前组下的云市应用
  getApplication = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/application',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            list: res.list,
            loadingList: false
          });
        }
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
    this.props.dispatch({
      type: 'global/CloudAppUpdateRecordsList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        page,
        pageSize,
        status__gt: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.list && res.list.length > 0) {
            this.setState({
              dataList: res.list
            });
          }
        }
      }
    });
  };

  getUpgradeRecordsHelmList = () => {
    const { page, pageSize } = this.state;
    this.props.dispatch({
      type: 'global/fetchUpgradeRecordsHelmList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        page,
        pageSize
      },
      callback: res => {
        this.handleLoading();
        if (res && res.status_code === 200) {
          if (res.list && res.list.length > 0) {
            this.setState({
              dataList: res.list
            });
          }
        }
      }
    });
  };

  handleLoading = () => {
    this.setState({
      loadingList: false,
      upgradeLoading: false
    });
  };
  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              appDetail: res.bean,
              loadingDetail: false
            },
            () => {
              if (
                res.bean &&
                res.bean.app_type &&
                res.bean.app_type === 'helm'
              ) {
                this.handleTabs('2');
              } else {
                this.getApplication();
              }
            }
          );
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

  handleTabs = key => {
    const { appDetail } = this.state;
    this.setState(
      {
        activeKey: key
      },
      () => {
        if (appDetail.app_type === 'helm') {
          this.getUpgradeRecordsHelmList();
        } else {
          key == '2' ? this.getUpgradeRecordsList() : this.getApplication();
        }
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
  handleEditHelmApp = (RollbackInfo, msg, key) => {
    const { dispatch } = this.props;
    const { appDetail } = this.state;
    dispatch({
      type: 'application/editHelmApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        username: appDetail.username,
        app_name: appDetail.group_name,
        app_note: appDetail.note,
        values: RollbackInfo.values,
        version: RollbackInfo.app_version,
        revision: RollbackInfo.revision
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: msg });
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${this.getGroupId()}`
            )
          );
        }
        this.handleTabs(key);
      }
    });
  };
  encodeBase64Content = commonContent => {
    const base64Content = Buffer.from(commonContent).toString('base64');
    return base64Content;
  };

  decodeBase64Content = base64Content => {
    let commonContent = base64Content.replace(/\s/g, '+');
    commonContent = Buffer.from(commonContent, 'base64').toString();
    return commonContent;
  };
  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'yaml' || fileArr[length - 1] === 'yml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: '请上传以.yaml、.yml结尾的 Region Config 文件'
        });
      }
      return false;
    }
    return true;
  };
  handleRollback = RollbackInfo => {
    this.setState(
      {
        upgradeLoading: true
      },
      () => {
        this.handleEditHelmApp(RollbackInfo, '回滚中、请耐心等待', '2');
      }
    );
  };

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const {
      upgradeLoading,
      loadingList,
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
                      {' '}
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
        render: text => (
          <span>
            {moment(text)
              .locale('zh-cn')
              .format('YYYY-MM-DD HH:mm:ss')}
          </span>
        )
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
    const helmColumns = [
      {
        title: '创建时间',
        dataIndex: 'updated',
        key: '1',
        render: text => (
          <span>
            {moment(text)
              .locale('zh-cn')
              .format('YYYY-MM-DD HH:mm:ss')}
          </span>
        )
      },
      {
        title: '名字',
        dataIndex: 'chart',
        key: '2',
        render: text => <span>{text}</span>
      },
      {
        title: '版本',
        dataIndex: 'app_version',
        key: '3',
        render: text => <span>{text}</span>
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: '4',
        render: status => <span>{infoUtil.getHelmStatus(status)}</span>
      },
      {
        title: '操作',
        dataIndex: 'revision',
        key: '4',
        width: 100,
        render: (_, data) => (
          <Button
            type="link"
            style={{ marginLeft: '-15px' }}
            onClick={() => {
              this.handleRollback(data);
            }}
          >
            回滚
          </Button>
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
    const isHelm =
      appDetail && appDetail.app_type && appDetail.app_type === 'helm';

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title="升级管理"
        content="当前应用内具有从应用市场或应用商店安装而来的组件时，升级管理功能可用。若安装源的应用版本有变更则可以进行升级操作"
        extraContent={null}
      >
        {!infoShow && (
          <div>
            {loadingDetail ? (
              <Spin />
            ) : (
              <Tabs
                activeKey={activeKey}
                onChange={this.handleTabs}
                className={styles.tabss}
              >
                {!isHelm && (
                  <TabPane tab="云市应用列表" key="1">
                    <div className={styles.cardList}>
                      <List
                        rowKey="id"
                        size="large"
                        loading={loadingList}
                        dataSource={[...list]}
                        renderItem={item => (
                          <List.Item
                            actions={[
                              <a
                                onClick={e => {
                                  e.preventDefault();
                                  if (item.can_upgrade) {
                                    this.setState(
                                      {
                                        infoData: item
                                      },
                                      () => {
                                        this.setState({
                                          infoShow: item.not_upgrade_record_id
                                            ? true
                                            : !!item.can_upgrade
                                        });
                                      }
                                    );
                                  }
                                }}
                                style={{
                                  display: 'block',
                                  marginTop: '15px',
                                  color: item.can_upgrade
                                    ? '#1890ff'
                                    : '#bfbfbf'
                                }}
                              >
                                {item.not_upgrade_record_status != 1
                                  ? infoUtil.getStatusCN(
                                      item.not_upgrade_record_status
                                    )
                                  : item.can_upgrade
                                  ? '升级'
                                  : '无可升级的变更'}
                              </a>
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
                )}
                <TabPane tab={isHelm ? '升级记录' : '云市应用升级记录'} key="2">
                  <Table
                    style={{ padding: '24px' }}
                    loading={upgradeLoading}
                    columns={isHelm ? helmColumns : columns}
                    dataSource={dataList}
                    pagination={paginationProps}
                  />
                </TabPane>
              </Tabs>
            )}
          </div>
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
