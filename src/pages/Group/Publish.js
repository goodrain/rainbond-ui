import {
  Button,
  Card,
  notification,
  Popconfirm,
  Popover,
  Table,
  Tooltip,
  Row
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ScrollerX from '../../components/ScrollerX';
import SelectStore from '../../components/SelectStore';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AppExporter from '../EnterpriseShared/AppExporter';
import AuthCompany from '../../components/AuthCompany';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import pluginUtils from '../../utils/pulginUtils';
import cookie from '../../utils/cookie';
import { fetchMarketAuthority } from '../../utils/authority';
import style from './publish.less';

@connect(({ list, loading, teamControl, enterprise, rbdPlugin, user }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  pluginList: rbdPlugin.pluginList,
  currentUser: user.currentUser,
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
      storeLoading: false,
      selectStoreShow: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      showExporterApp: false,
      is_exporting: false,
      appData: null,
      publishPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_release', `app_${globalUtil.getAppID()}`),
      showPublish: pluginUtils.isInstallPlugin(this.props?.pluginList, 'rainbond-bill'),
      storeList: [],
      publishBtn: false,
      isAuthCompany: false,
    };
  }
  componentWillMount() {
  }

  componentDidMount() {
    this.fetchAppDetail();
    this.fetchPublishRecoder();
  }
  onPublishStore = () => {
    this.getStoreList();
  };
  onPublishLocal = () => {
    this.handleShare('', {});
  };
  getStoreList = () => {
    this.setState({ loading: true });
    const { dispatch, currentEnterprise } = this.props;
    dispatch({
      type: 'enterprise/fetchEnterpriseStoreList',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id
      },
      callback: data => {
        if (data) {
          const { list = [] } = data;
          let newList = [];
          if (list.length > 0 && list[0].access_key) {
            newList = list.filter(
              item => item.status === 1 && fetchMarketAuthority(item, 'Write')
            );
            this.setState({ selectStoreShow: true, isAuthCompany: false });
          } else {
            this.setState({ storeName: list[0].name, isAuthCompany: true });
          }
          this.setState({ storeList: newList, loading: false,  });
        } else {
          this.setState({ loading: false });
        }
      }
    });
  };
  onPageChange = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.fetchPublishRecoder();
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
        group_id: appID
      },
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
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };

  fetchPublishRecoder = () => {
    this.setState({ loading: true });
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;
    dispatch({
      type: 'application/fetchShareRecords',
      payload: {
        team_name: teamName,
        app_id: appID,
        page,
        page_size: pageSize
      },
      callback: data => {
        if (data) {
          this.setState({
            recoders: data.list,
            total: data.bean.total,
            loading: false
          });
        }
      }
    });
  };

  handleShare = (scope, target) => {
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/ShareGroup',
      payload: {
        team_name: teamName,
        group_id: appID,
        scope,
        target
      },
      callback: data => {
        this.continuePublish(data.bean.ID, data.bean.step);
      }
    });
  };

  hideSelectStoreShow = () => {
    this.setState({ selectStoreShow: false });
  };
  handleStoreLoading = loading => {
    this.setState({ storeLoading: loading });
  };
  handleSelectStore = values => {
    this.handleStoreLoading(true);
    const selectStore = values.store_id;
    this.handleShare('goodrain', { store_id: selectStore });
  };
  deleteRecord = recordID => {
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/deleteShareRecord',
      payload: {
        team_name: teamName,
        app_id: appID,
        record_id: recordID
      },
      callback: () => {
        this.fetchPublishRecoder();
      }
    });
  };

  cancelPublish = recordID => {
    if (recordID === undefined || recordID === '') {
      notification.warning({ message: formatMessage({ id: 'notification.warn.parameter_error' }) });
      return;
    }
    const { teamName } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/giveupShare',
      payload: {
        team_name: teamName,
        share_id: recordID
      },
      callback: () => {
        this.fetchPublishRecoder();
      }
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
    this.handleStoreLoading(false);
  };

  handleBox = val => {
    return (
      <div className={style.version}>
        <Tooltip placement="topLeft" title={val}>
          {val}
        </Tooltip>
      </div>
    );
  };
  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };
  hideAppExport = () => {
    this.setState({ showExporterApp: false });
  };
  showAppExport = (data) => {
    if (!Array.isArray(data.version)){
      data.version = Array.of(data.version)
    }
    data.app_id = data.app_model_id
    this.setState({ showExporterApp: true, appData: data });
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
      storeLoading,
      language,
      showExporterApp,
      is_exporting,
      appData,
      publishPermission: {
        isAccess,
        isShare,
        isExport,
        isDelete,
      },
      showPublish,
      storeList,
      storeName,
      isAuthCompany
    } = this.state;
    if (!isAccess) {
      return roleUtil.noPermission();
    }
    const {
      currentUser,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      dispatch,
      match: {
        params: {
          teamName,
          regionName
        }
      }
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
        title={formatMessage({ id: 'appPublish.title' })}
        content={formatMessage({ id: 'appPublish.desc' })}
        titleSvg={pageheaderSvg.getPageHeaderSvg('publish', 18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`)
            );
          }} icon="home">
            {formatMessage({ id: 'menu.app.dashboard' })}
          </Button>
        }
      >
        <Card
          loading={loading}
          extra={
            isShare &&
            <div style={language ? {} : { display: 'flex' }}>
              <Button
                style={language ? { marginRight: 8 } : { marginRight: 8, padding: 5, }}
                onClick={this.onPublishLocal}
                icon='appstore'
              >
                {formatMessage({ id: 'appPublish.btn.local' })}
              </Button>
              {/* {(currentUser.is_enterprise_admin || !showPublish) && ( */}
                <Button onClick={this.onPublishStore} style={language ? { marginRight: 8 } : { marginRight: 8, padding: 5, }} icon="cloud-upload" type="primary">
                  {formatMessage({ id: 'appPublish.btn.market' })}
                </Button>
              {/* )} */}
            </div>

          }
          style={{
            borderRadius: 5,
          }}
        >
          <ScrollerX sm={800}>
            <Table
              rowKey={(record, index) => index}
              pagination={ {
                current: page,
                pageSize,
                total,
                onChange: this.onPageChange,
                showQuickJumper: true,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                onShowSizeChange: this.onPageChange,
                hideOnSinglePage: total<=10
              } }
              dataSource={recoders || []}
              columns={[
                {
                  title: formatMessage({ id: 'appPublish.table.publishName' }),
                  dataIndex: 'app_model_name',
                  render: (val, data) => {
                    if (val) {
                      return val;
                    }
                    return (
                      <span style={{ color: globalUtil.getPublicColor('rbd-content-color') }}>
                        {data.status === 0 ? formatMessage({ id: 'appPublish.table.versions.notSpecified' }) : '-'}
                      </span>
                    );
                  }
                },
                {
                  title: formatMessage({ id: 'appPublish.table.versions' }),
                  dataIndex: 'version',
                  align: 'left',
                  render: (val, data) => {
                    const versionAlias =
                      (data.version_alias && `(${data.version_alias})`) || '';
                    if (val) {
                      const appVersionInfo = data.app_version_info;
                      return (
                        <Popover
                          style={{
                            marginBottom: 0
                          }}
                          content={
                            appVersionInfo
                              ? this.handleBox(appVersionInfo)
                              : formatMessage({ id: 'appPublish.table.versions.null' })
                          }
                          title={this.handleBox(`${val}${versionAlias}`)}
                        >
                          <div className={style.version}>
                            {val}
                            {versionAlias}
                          </div>
                        </Popover>
                      );
                    }
                    return <span style={{ color: globalUtil.getPublicColor('rbd-content-color') }}>{formatMessage({ id: 'appPublish.table.versions.notSpecified' })}</span>;
                  }
                },
                {
                  title: formatMessage({ id: 'appPublish.table.scope' }),
                  dataIndex: 'scope',
                  align: 'center',
                  render: (val, data) => {
                    const {currentUser} = this.props;
                    const isEnterpriseAdmin = currentUser.is_enterprise_admin;
                    const storeName =
                      data && data.scope_target && data.scope_target.store_name;
                    const marketAddress = `/enterprise/${currentEnterprise.enterprise_id}/shared/local`;
                    switch (val) {
                      case '':
                        return isEnterpriseAdmin ? <Link to={marketAddress}>{formatMessage({ id: 'appPublish.table.scope.market' })}</Link> : <span>{formatMessage({ id: 'appPublish.table.scope.market' })}</span>;
                      case 'team':
                        return isEnterpriseAdmin ? <Link to={marketAddress}>{formatMessage({ id: 'appPublish.table.scope.team_market' })}</Link> : <span>{formatMessage({ id: 'appPublish.table.scope.team_market' })}</span>;
                      case 'enterprise':
                        return isEnterpriseAdmin ? <Link to={marketAddress}>{formatMessage({ id: 'appPublish.table.scope.enterprise_market' })}</Link> : <span>{formatMessage({ id: 'appPublish.table.scope.enterprise_market' })}</span>;
                      default:
                        return (
                          <p style={{ marginBottom: 0 }}>
                            {storeName || formatMessage({ id: 'appPublish.table.scope.app_shop' })}
                          </p>
                        );
                    }
                  }
                },
                {
                  title: formatMessage({ id: 'appPublish.table.publishTime' }),
                  align: 'center',
                  dataIndex: 'create_time',
                  render: val => (
                    <span>
                      {moment(val)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  )
                },
                {
                  title: formatMessage({ id: 'appPublish.table.status' }),
                  align: 'center',
                  dataIndex: 'status',
                  render: val => {
                    // eslint-disable-next-line default-case
                    switch (val) {
                      case 0:
                        return formatMessage({ id: 'appPublish.table.status.release' });
                      case 1:
                        return <span style={{ color: globalUtil.getPublicColor('rbd-success-status') }}>{formatMessage({ id: 'appPublish.table.status.release_finish' })}</span>;
                      case 2:
                        return <span style={{ color: globalUtil.getPublicColor('rbd-content-color') }}>{formatMessage({ id: 'appPublish.table.status.canceled' })}</span>;
                    }
                    return '';
                  }
                },
                {
                  title: formatMessage({ id: 'appPublish.table.operate' }),
                  width: '200px',
                  dataIndex: 'dataIndex',
                  render: (val, data) => {
                    return (
                      <div>
                        {data.status === 0 ? (
                          isShare &&
                          <div>
                            <a
                              style={{ marginRight: '5px' }}
                              onClick={() => {
                                this.continuePublish(data.record_id, data.step);
                              }}
                            >
                              {formatMessage({ id: 'appPublish.table.btn.continue' })}
                            </a>
                            {isDelete &&
                              <a
                                style={{ marginRight: '5px' }}
                                onClick={() => {
                                  this.cancelPublish(data.record_id);
                                }}
                              >
                                {formatMessage({ id: 'appPublish.table.btn.release_cancel' })}
                              </a>
                            }
                          </div>
                        ) : (
                          <div>
                            {(data.scope == 'team' || data.scope == 'enterprise') && isExport && (
                              <a onClick={() => this.showAppExport(data)}>
                                {formatMessage({ id: 'applicationMarket.localMarket.export_app' })}
                                {is_exporting ? `${formatMessage({ id: 'applicationMarket.localMarket.in_export' })}` : ''}
                              </a>
                            )}
                            {isDelete &&
                              <Popconfirm
                                title={formatMessage({ id: 'appPublish.table.btn.confirm_delete' })}
                                onConfirm={() => {
                                  this.deleteRecord(data.record_id);
                                }}
                                okText={formatMessage({ id: 'appPublish.table.btn.confirm' })}
                                cancelText={formatMessage({ id: 'appPublish.table.btn.cancel' })}
                              >
                                <a href="#">{formatMessage({ id: 'appPublish.table.btn.delete' })}</a>
                              </Popconfirm>
                            }
                          </div>
                        )}
                      </div>
                    );
                  }
                }
              ]}
            />
          </ScrollerX>
        </Card>
        {showExporterApp && (
          <AppExporter
            eid={currentEnterprise.enterprise_id}
            setIsExporting={this.setIsExporting}
            app={appData}
            onOk={this.hideAppExport}
            onCancel={this.hideAppExport}
            team_name={teamName}
            regionName={regionName}
          />
        )}
        <SelectStore
          loading={storeLoading}
          dispatch={dispatch}
          storeList={storeList}
          enterprise_id={currentEnterprise.enterprise_id}
          visible={selectStoreShow}
          onCancel={this.hideSelectStoreShow}
          onOk={this.handleSelectStore}
        />
        { isAuthCompany && 
          <AuthCompany
            eid={currentEnterprise.enterprise_id}
            marketName={storeName}
            currStep={2}
            onCancel={() => {
              this.setState({ isAuthCompany: false });
            }}
          />
        }
      </PageHeaderLayout>
    );
  }
}
