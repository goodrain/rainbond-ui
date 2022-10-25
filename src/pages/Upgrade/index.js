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
      rollbackRecordDetails: false,
      versionArr: {},
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
  getHelmvs = (vals,index) => {
    const { dispatch } = this.props;
    const repo_name = vals.source.substr(vals.source.indexOf(':') + 1)
    dispatch({
      type: 'createApp/getHelmVersion',
      payload: {
        repo_name: repo_name,
        chart_name: vals.app_model_name || 1,
        highest: true,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          const arrVersion = { ...JSON.parse(res.bean).chart_information };
          const obj = {}
          obj[index]=arrVersion.Version
          this.setState({
            versionArr: {...this.state.versionArr, ...obj}
          })
        }
      }
    });
  }
  // 版本比较
  compareVersion = (v1, v2) => {
    if (v1 && v2) {
      v1 = v1.split('.')
      v2 = v2.split('.')
      const len = Math.max(v1.length, v2.length)
      while (v1.length < len) {
        v1.push('0')
      }
      while (v2.length < len) {
        v2.push('0')
      }
      for (let i = 0; i < len; i++) {
        const num1 = parseInt(v1[i])
        const num2 = parseInt(v2[i])
        if (num1 > num2) {
          return true;
        } else if (num1 < num2) {
          return false;
        }
      }
    } else {
      return false
    }

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
          }, 
          () => {
            const { dataList, versionArr } = this.state;
            // versionArr && versionArr.length == 0 && 
            dataList.map((item,index) => {
              if (item.source.includes('helm')) {
                this.getHelmvs(item,index)
              } 
              else {
                const xx = {};
                xx[index]='';
                this.setState({
                  versionArr: {...this.state.versionArr, ...xx}
                })
              }
            })
          }
          );
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
          {formatMessage({ id: 'helmAppInstall.Upgrade.store' })}{record.market_name}{formatMessage({ id: 'helmAppInstall.Upgrade.from' })}
          <span className={styles.versions}>{record.old_version}</span>
          {formatMessage({ id: 'helmAppInstall.Upgrade.to' })}
          <span className={styles.versions}>{record.version}</span>
        </div>
      );
    }
    return (
      <div>
        {formatMessage({ id: 'helmAppInstall.Upgrade.form_version' })}<span className={styles.versions}>{record.old_version}</span>
        {formatMessage({ id: 'helmAppInstall.Upgrade.to' })}
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
        `/team/${team_name}/region/${globalUtil.getCurrRegionName()}/apps/${group_id}/upgrade/${item.upgrade_group_id
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
  jump = (val, item, vs) => {
    const { dispatch } = this.props
    const repo_name = item.source.substr(item.source.indexOf(':') + 1)
    const obj = {
      app_store_name: repo_name,
      app_model_id: item.app_model_id,
      app_template_name: item.app_model_name,
      version: item.current_version,
    }
    window.sessionStorage.setItem('appinfo', JSON.stringify(obj))
    window.sessionStorage.setItem('updataInfo', JSON.stringify(item))
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/helminstall?type=${val}&upgrade=${vs}`
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
      backUpgradeLoading,
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
          <Tooltip title={formatMessage({ id: 'appUpgrade.current_version.tooltip' })}>
            <span>{formatMessage({ id: 'appUpgrade.current_version' })}</span>
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
          <Tooltip title={formatMessage({ id: 'appUpgrade.Upgradable_version.tooltip' })}>
            <span>{formatMessage({ id: 'appUpgrade.Upgradable_version' })}</span>
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
              : formatMessage({ id: 'helmAppInstall.Upgrade.no' })}
          </p>
        </div>
      </div>
    );
    const ListContentHelm = ({ data, index }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <Tooltip title={formatMessage({ id: 'appUpgrade.current_version.tooltip' })}>
            <span>{formatMessage({ id: 'appUpgrade.current_version' })}</span>
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
              {data.current_version}
            </Tag>
          </p>
        </div>
        <div className={styles.listContentItem}>
          <Tooltip title={formatMessage({ id: 'appUpgrade.Upgradable_version.tooltip' })}>
            <span>{formatMessage({ id: 'appUpgrade.Upgradable_version' })}</span>
          </Tooltip>
          <p>
            {this.state.versionArr &&
              Object.keys(this.state.versionArr).length> 0 &&
              data.current_version &&
              this.compareVersion(this.state.versionArr[index], data.current_version)
              ?
              (
                <Tag
                  style={{
                    height: '17px',
                    lineHeight: '16px',
                    marginBottom: '3px'
                  }}
                  color="green"
                  size="small"
                >
                  {this.state.versionArr[index]}
                </Tag>
              ) : (
                formatMessage({ id: 'helmAppInstall.Upgrade.no' })
              )}
          </p>
        </div>
      </div>
    );
    const columns = [
      {
        title: formatMessage({ id: 'appUpgrade.table.createTime' }),
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
        title: formatMessage({ id: 'appUpgrade.table.app' }),
        dataIndex: 'group_name',
        key: '2',
        width: '20%',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({ id: 'appUpgrade.table.versions' }),
        dataIndex: 'version',
        key: '3',
        width: '30%',
        render: (_, data) => this.getVersionChangeShow(data)
      },
      {
        title: formatMessage({ id: 'appUpgrade.table.status' }),
        dataIndex: 'status',
        key: '4',
        width: '15%',
        render: status => <span>{infoUtil.getStatusText(status)}</span>
      },
      {
        title: formatMessage({ id: 'appUpgrade.table.operate' }),
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
                {formatMessage({ id: 'appUpgrade.table.operate.roll_back' })}
              </a>

              <a
                onClick={e => {
                  e.preventDefault();
                  this.showRollbackList(item);
                }}
              >
                {formatMessage({ id: 'appUpgrade.table.operate.roll_back_record' })}
              </a>
            </div>
          )
      }
    ];
    const helmColumns = [
      {
        title: formatMessage({ id: 'appUpgrade.table.createTime' }),
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
        title: formatMessage({ id: 'appUpgrade.table.chart' }),
        dataIndex: 'chart',
        key: '2',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({ id: 'appUpgrade.table.versions' }),
        dataIndex: 'app_version',
        key: '3',
        render: text => <span>{text}</span>
      },
      {
        title: formatMessage({ id: 'appUpgrade.table.status' }),
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
        title={formatMessage({ id: 'appUpgrade.title' })}
        content={formatMessage({ id: 'appUpgrade.desc' })}
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
              <TabPane tab={formatMessage({ id: 'appUpgrade.tabs.list' })} key="1">
                <div className={styles.cardList}>
                  <List
                    rowKey="id"
                    size="large"
                    loading={loadingList}
                    dataSource={[...dataList]}
                    renderItem={(item, index) => (
                      <List.Item
                        actions={(item.source.indexOf('helm') != -1) ? ([
                          <a
                            style={{
                              display:
                                this.state.versionArr &&
                                  Object.keys(this.state.versionArr).length> 0 &&
                                  item.current_version &&
                                  this.compareVersion(this.state.versionArr[index], item.current_version)
                                  ? "block"
                                  : "none"
                            }}
                            onClick={e => {
                              e.preventDefault();
                              this.jump(upgrade, item, this.state.versionArr[index]);
                            }}
                          >
                            {formatMessage({ id: 'appUpgrade.btn.upgrade' })}
                          </a>,
                          <a
                            onClick={() => {
                              this.jump(install, item);
                            }}
                          >
                            {formatMessage({ id: 'helmAppInstall.Upgrade.reinstall' })}
                          </a>
                        ]
                        ) : (
                          [
                            <a
                              onClick={e => {
                                e.preventDefault();
                                this.fetchAppLastRollbackRecord(item);
                              }}
                            >
                              {formatMessage({ id: 'appUpgrade.btn.upgrade' })}
                            </a>,
                            <a
                              onClick={() => {
                                this.showComponentVersion(item);
                              }}
                            >
                              {formatMessage({ id: 'appUpgrade.btn.addon' })}
                            </a>
                          ]
                        )}
                      >
                        <List.Item.Meta
                          avatar={
                            <getApplication
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
                        {item.source.includes('helm') ? <ListContentHelm data={item} index={index} /> : <ListContent data={item} />}
                        {/* <ListContent data={item} /> */}
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>

              <TabPane tab={formatMessage({ id: 'appUpgrade.tabs.record' })} key="2">
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
            title={formatMessage({ id: 'helmAppInstall.Upgrade.updat_info' })}
            onCancel={() => {
              this.setState({ showLastUpgradeRecord: false });
              if (upgradeItem) {
                this.createNewRecord(upgradeItem);
              }
            }}
            okText={formatMessage({ id: 'helmAppInstall.Upgrade.Continue' })}
            cancelText={upgradeItem ? formatMessage({ id: 'helmAppInstall.Upgrade.new' }) : formatMessage({ id: 'helmAppInstall.Upgrade.cancel' })}
            onOk={() => {
              this.openInfoPage(lastRecord || upgradeItem);
            }}
          >
            <span>
              {formatMessage({ id: 'helmAppInstall.Upgrade.model' })}
              <span style={{ color: '4d73b1' }}>
                {(lastRecord && lastRecord.group_name) ||
                  (upgradeItem && upgradeItem.group_name)}
              </span>
              {isPartiallyCompleted
                ? formatMessage({ id: 'helmAppInstall.Upgrade.again' })
                : isDeploymentFailure
                  ? formatMessage({ id: 'helmAppInstall.Upgrade.failure' })
                  : formatMessage({ id: 'helmAppInstall.Upgrade.unfinished' })}
            </span>
          </Modal>
        )}
        {showLastRollbackRecord && (
          <Modal
            visible
            title={formatMessage({ id: 'helmAppInstall.Upgrade.back_info' })}
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
                {formatMessage({ id: 'helmAppInstall.Upgrade.down' })}
              </Button>
            ]}
          >
            <span>
              {formatMessage({ id: 'helmAppInstall.Upgrade.model' })}
              <span style={{ color: '4d73b1' }}>
                {lastRecord && lastRecord.group_name}
              </span>
              {formatMessage({ id: 'helmAppInstall.Upgrade.unfinished' })}
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
            title={formatMessage({ id: 'helmAppInstall.Upgrade.Rollback_confirm' })}
            onCancel={() => {
              this.showRollback(false);
            }}
            onOk={() => {
              this.rollbackUpgrade();
            }}
          >
            <span style={{ color: 'red' }}>{formatMessage({ id: 'helmAppInstall.Upgrade.rollback_confirm' })}</span>
            <span style={{ display: 'block', marginTop: '16px' }}>
              {formatMessage({ id: 'helmAppInstall.Upgrade.not_add' })}
            </span>
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}
