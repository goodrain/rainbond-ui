/* eslint-disable react/sort-comp */
/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-nested-ternary */
import ComponentVersion from '@/components/ComponentVersion';
import {
  Avatar,
  Button,
  Form,
  List,
  Modal,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  getAppModelLastRecord,
  postUpgradeRecord,
  rollbackUpgrade
} from '../../services/app';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import styles from './index.less';
import RollsBackRecordDetails from './RollbackInfo/details';
import RollsBackRecordList from './RollbackInfo/index';
import infoUtil from './UpgradeInfo/info-util';

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
      isDeploymentFailure: false,
      isPartiallyCompleted: false,
      upgradeLoading: true,
      recordLoading: true,
      isComponent: false,
      showApp: {},
      showMarketAppDetail: false,
      list: [],
      activeKey: '1',
      page: 1,
      pageSize: 10,
      total: 0,
      dataList: [],
      appDetail: {},
      backUpgradeLoading: false,
      showLastUpgradeRecord: false,
      showLastRollbackRecord: false,
      rollbackRecords: false,
      rollbackRecordDetails: false
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
    this.fetchAppLastUpgradeRecord();
  }

  onUpgrade = item => {
    const { team_name, group_id } = this.getParameter();
    getAppModelLastRecord({
      appID: group_id,
      team_name,
      upgrade_group_id: item.upgrade_group_id
    }).then(re => {
      // last upgrade record partial success.
      const status = re.bean && re.bean.status;
      if (status) {
        if ([6, 10].includes(status)) {
          this.setState({
            isDeploymentFailure: status === 10,
            isPartiallyCompleted: status === 6,
            showLastUpgradeRecord: true,
            upgradeItem: item
          });
          return;
        }
        if ([3, 8].includes(status)) {
          this.createNewRecord(item);
          return;
        }
        this.openInfoPage(re.bean);
      } else {
        this.createNewRecord(item);
      }
    });
  };

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
            dataList: res.list || []
          });
        }
        this.handleCancelLoading();
      }
    });
  };

  getParameter = () => {
    const { teamName, regionName, appID } = this.props.match.params;
    return {
      team_name: teamName,
      region_name: regionName,
      group_id: appID
    };
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
            list: res.list || [],
            total: res.bean && res.bean.total
          });
        }
        this.handleCancelLoading();
      }
    });
  };

  getVersionChangeShow = record => {
    if (record.market_name) {
      return (
        <div>
          通过应用商店（{record.market_name}）从版本
          <span className={styles.versions}>{record.old_version}</span>
          升级到
          <span className={styles.versions}>{record.version}</span>
        </div>
      );
    }
    return (
      <div>
        从版本<span className={styles.versions}>{record.old_version}</span>
        升级到
        <span className={styles.versions}>{record.version}</span>
      </div>
    );
  };

  fetchAppLastUpgradeRecord = () => {
    const { team_name, group_id } = this.getParameter();
    getAppModelLastRecord({
      team_name,
      appID: group_id,
      noModels: true
    })
      .then(re => {
        const info = re.bean;
        if (info && JSON.stringify(info) !== '{}') {
          this.setState({
            lastRecord: info,
            showLastUpgradeRecord: [2].includes(info.status)
          });
        }
      })
      .catch(err => {
        handleAPIError(err);
      });
  };

  fetchAppLastRollbackRecord = item => {
    const { team_name, group_id } = this.getParameter();
    getAppModelLastRecord({
      team_name,
      appID: group_id,
      record_type: 'rollback',
      noModels: true
    })
      .then(re => {
        const info = re.bean;
        if (info && JSON.stringify(info) !== '{}') {
          const showLastRollbackRecord = [4].includes(info.status);
          if (showLastRollbackRecord) {
            this.setState({
              lastRecord: info,
              showLastRollbackRecord
            });
          } else {
            this.onUpgrade(item);
          }
        } else {
          this.onUpgrade(item);
        }
      })
      .catch(err => {
        handleAPIError(err);
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
          this.setState({
            list: res.list || []
          });
        }
        this.handleCancelLoading();
      }
    });
  };

  handleLoading = () => {
    this.setState({
      loadingList: false,
      recordLoading: false,
      upgradeLoading: false
    });
  };

  createNewRecord = item => {
    const { team_name, group_id } = this.getParameter();
    postUpgradeRecord({
      team_name,
      appID: group_id,
      upgrade_group_id: item.upgrade_group_id,
      noModels: true
    })
      .then(re => {
        this.openInfoPage(re.bean);
      })
      .catch(err => {
        handleAPIError(err);
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
  openInfoPage = item => {
    const { team_name, group_id } = this.getParameter();
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${team_name}/region/${globalUtil.getCurrRegionName()}/apps/${group_id}/upgrade/${
          item.upgrade_group_id
        }/record/${item.ID}?app_id=${item.group_key}`
      )
    );
  };
  showMarketAppDetail = app => {
    this.setState({
      showApp: app,
      showMarketAppDetail: true
    });
  };
  showRollback = item => {
    this.setState({
      showRollbackConfirm: item,
      rollbackRecord: item
    });
  };
  showRollbackList = item => {
    this.setState({
      rollbackRecords: item
    });
  };
  showRollbackDetails = item => {
    this.setState({
      rollbackRecordDetails: item
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
        upgradeLoading: true,
        recordLoading: true,
        activeKey: key
      },
      () => {
        if (appDetail.app_type === 'helm') {
          this.getUpgradeRecordsHelmList();
        } else {
          key === '2' ? this.getUpgradeRecordsList() : this.getApplication();
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
  rollbackUpgrade = () => {
    this.handleBackUpgradeLoading(true);
    const { rollbackRecord } = this.state;
    const { team_name, group_id } = this.getParameter();
    rollbackUpgrade({
      team_name,
      appID: group_id,
      record_id: rollbackRecord.ID
    })
      .then(re => {
        this.handleBackUpgradeLoading(false);
        this.showRollback(false);
        this.showRollbackDetails(re && re.bean);
      })
      .catch(err => {
        this.handleBackUpgradeLoading(false);
        handleAPIError(err);
      });
  };
  handleBackUpgradeLoading = loading => {
    this.setState({
      backUpgradeLoading: loading
    });
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
      loadingList: false,
      upgradeLoading: false,
      recordLoading: false
    });
  };
  jump = (val) =>{
    const { dispatch } = this.props
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/helminstall?type=${val}`
      )
    )
  }

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const {
      loadingList,
      recordLoading,
      upgradeLoading,
      list,
      showMarketAppDetail,
      showApp,
      activeKey,
      page,
      total,
      pageSize,
      dataList,
      appDetail,
      isComponent,
      loadingDetail,
      lastRecord,
      showLastUpgradeRecord,
      showLastRollbackRecord,
      upgradeItem,
      isDeploymentFailure,
      isPartiallyCompleted,
      showRollbackConfirm,
      rollbackRecords,
      rollbackRecordDetails,
      backUpgradeLoading
    } = this.state;
    const arr = [
      {app_model_id
        : 
        "1ac42e3339de41728c50349eeef0deb8",
        app_model_name
        : 
        "默认应用",
        can_upgrade
        : 
        false,
        current_version
        : 
        "1.0",
        describe
        : 
        "This is a default description.",
        details
        : 
        null,
        enterprise_id
        : 
        "6de24baf8e6fea762fec90148559e6c3",
        group_key
        : 
        "1ac42e3339de41728c50349eeef0deb8",
        group_name
        : 
        "core",
        is_official
        : 
        false,
        market_name
        : 
        null,
        not_upgrade_record_id
        : 
        null,
        not_upgrade_record_status
        : 
        1,
        pic
        : 
        "/data/media/uploads/d444ca6e0bc0444ab8d1c250c446f84a.png",
        share_team
        : 
        null,
        share_user
        : 
        null,
        source
        : 
        null,
        tenant_service_group_id
        : 
        "1ac42e3339de41728c50349eeef0deb8",
        upgrade_group_id
        : 
        "1",
        upgrade_versions
        : 
        []},
    ]

    const paginationProps = {
      onChange: this.handleTableChange,
      pageSize,
      total,
      page
    };
    const ListContent = ({ data: { upgrade_versions, current_version } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <Tooltip title={formatMessage({id: 'appUpgrade.current_version.tooltip'})}>
            <span>{formatMessage({id: 'appUpgrade.current_version'})}</span>
          </Tooltip>
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
          <Tooltip title={formatMessage({id: 'appUpgrade.Upgradable_version.tooltip'})}>
            <span>{formatMessage({id: 'appUpgrade.Upgradable_version'})}</span>
          </Tooltip>
          <p>
            {upgrade_versions && upgrade_versions.length > 0
              ? upgrade_versions.map(item => {
                  return (
                    <Tag
                      style={{
                        height: '17px',
                        lineHeight: '16px',
                        marginBottom: '3px'
                      }}
                      color="green"
                      size="small"
                      key={item}
                    >
                      {item}
                    </Tag>
                  );
                })
              : '暂无'}
          </p>
        </div>
      </div>
    );

    const columns = [
      {
        title: formatMessage({id: 'appUpgrade.table.createTime'}),
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
        title: formatMessage({id: 'appUpgrade.table.app'}),
        dataIndex: 'group_name',
        key: '2',
        width: '20%',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({id: 'appUpgrade.table.versions'}),
        dataIndex: 'version',
        key: '3',
        width: '30%',
        render: (_, data) => this.getVersionChangeShow(data)
      },
      {
        title: formatMessage({id: 'appUpgrade.table.status'}),
        dataIndex: 'status',
        key: '4',
        width: '15%',
        render: status => <span>{infoUtil.getStatusText(status)}</span>
      },
      {
        title: formatMessage({id: 'appUpgrade.table.operate'}),
        dataIndex: 'tenant_id',
        key: '5',
        width: '15%',
        render: (_, item) =>
          item.can_rollback && (
            <div>
              <a
                onClick={e => {
                  e.preventDefault();
                  this.showRollback(item);
                }}
              >
                {formatMessage({id: 'appUpgrade.table.operate.roll_back'})}
              </a>

              <a
                onClick={e => {
                  e.preventDefault();
                  this.showRollbackList(item);
                }}
              >
                {formatMessage({id: 'appUpgrade.table.operate.roll_back_record'})}
              </a>
            </div>
          )
      }
    ];
    const helmColumns = [
      {
        title: formatMessage({id: 'appUpgrade.table.createTime'}),
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
        title: formatMessage({id: 'appUpgrade.table.chart'}),
        dataIndex: 'chart',
        key: '2',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({id: 'appUpgrade.table.versions'}),
        dataIndex: 'app_version',
        key: '3',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({id: 'appUpgrade.table.status'}),
        dataIndex: 'status',
        key: '4',
        render: status => <span>{infoUtil.getHelmStatus(status)}</span>
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
      const upgrade = "upgrade";
      const install = "install";
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title={formatMessage({id: 'appUpgrade.title'})}
        content={formatMessage({id: 'appUpgrade.desc'})}
        extraContent={null}
      >
        <div>
          {loadingDetail ? (
            <Spin />
          ) : (
            <Tabs
              // activeKey={activeKey}
              defaultActiveKey="1"
              onChange={this.handleTabs}
              className={styles.tabss}
            >
              {isHelm ?   (
                <TabPane tab={formatMessage({id: 'appUpgrade.tabs.list'})} key="1">
                  <div className={styles.cardList}>
                    <List
                      rowKey="id"
                      size="large"
                      loading={loadingList}
                      dataSource={[...arr]}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <a
                              onClick={e => {
                                e.preventDefault();
                                this.jump(upgrade);
                              }}
                            >
                              {formatMessage({id: 'appUpgrade.btn.upgrade'})}
                            </a>,
                            <a
                            onClick={() => {
                              this.jump(install);
                            }}
                          >
                            重新安装
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
              ) : (
                <TabPane tab={formatMessage({id: 'appUpgrade.tabs.list'})} key="1">
                <div className={styles.cardList}>
                  <List
                    rowKey="id"
                    size="large"
                    loading={loadingList}
                    dataSource={[...dataList]}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <a
                            onClick={e => {
                              e.preventDefault();
                              this.fetchAppLastRollbackRecord(item);
                            }}
                          >
                            {formatMessage({id: 'appUpgrade.btn.upgrade'})}
                          </a>,
                          <a
                            onClick={() => {
                              this.showComponentVersion(item);
                            }}
                          >
                            {formatMessage({id: 'appUpgrade.btn.addon'})}
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
              )}
              <TabPane tab={formatMessage({id: 'appUpgrade.tabs.record'})} key="2">
                <Table
                  style={{ padding: '24px' }}
                  loading={recordLoading || upgradeLoading}
                  columns={isHelm ? helmColumns : columns}
                  dataSource={list}
                  pagination={paginationProps}
                />
              </TabPane>
            </Tabs>
          )}
        </div>
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
        {showLastUpgradeRecord && (lastRecord || upgradeItem) && (
          <Modal
            visible
            title="升级提示"
            onCancel={() => {
              this.setState({ showLastUpgradeRecord: false });
              if (upgradeItem) {
                this.createNewRecord(upgradeItem);
              }
            }}
            okText="继续"
            cancelText={upgradeItem ? '新升级' : '取消'}
            onOk={() => {
              this.openInfoPage(lastRecord || upgradeItem);
            }}
          >
            <span>
              应用模型
              <span style={{ color: '4d73b1' }}>
                {(lastRecord && lastRecord.group_name) ||
                  (upgradeItem && upgradeItem.group_name)}
              </span>
              {isPartiallyCompleted
                ? '上次升级任务部分组件更新成功，是否继续重试？'
                : isDeploymentFailure
                ? '上次升级任务部署失败，是否继续重试？'
                : '存在未完成的升级任务，是否继续完成上次任务？'}
            </span>
          </Modal>
        )}
        {showLastRollbackRecord && (
          <Modal
            visible
            title="回滚提示"
            onCancel={() => {
              this.setState({ showLastRollbackRecord: false });
            }}
            footer={[
              <Button
                style={{ marginTop: '20px' }}
                onClick={() => {
                  this.setState({ showLastRollbackRecord: false });
                }}
              >
                关闭
              </Button>
            ]}
          >
            <span>
              应用模型
              <span style={{ color: '4d73b1' }}>
                {lastRecord && lastRecord.group_name}
              </span>
              存在未完成的回滚任务，无法继续升级
            </span>
          </Modal>
        )}
        {rollbackRecords && (
          <RollsBackRecordList
            {...this.getParameter()}
            info={rollbackRecords}
            showRollbackDetails={item => {
              this.showRollbackDetails(item);
            }}
            onCancel={() => {
              this.showRollbackList(false);
            }}
          />
        )}
        {rollbackRecordDetails && (
          <RollsBackRecordDetails
            {...this.getParameter()}
            info={rollbackRecordDetails}
            onCancel={() => {
              this.showRollbackDetails(false);
            }}
          />
        )}

        {showRollbackConfirm && (
          <Modal
            visible
            confirmLoading={backUpgradeLoading}
            title="回滚确认"
            onCancel={() => {
              this.showRollback(false);
            }}
            onOk={() => {
              this.rollbackUpgrade();
            }}
          >
            <span style={{ color: 'red' }}>确认要回滚吗？</span>
            <span style={{ display: 'block', marginTop: '16px' }}>
              回滚过程不会删除新增组件。
            </span>
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}
