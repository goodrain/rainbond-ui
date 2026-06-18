/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-param-reassign */
/* eslint-disable react/sort-comp */
/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
import {
  Alert,
  Card,
  Empty,
  Icon,
  notification,
  Spin,
  Badge,
  Tooltip,
  Modal,
  Button,
  Form,
  Input,
  Tag
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import ScrollerX from '@/components/ScrollerX';
import moment from 'moment';
import ConfirmModal from '../../components/ConfirmModal';
import Consulting from '../../components/Consulting';
import Convenient from '../../components/Convenient';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import SVG from '../../utils/pageHeaderSvg'
import userUtil from '../../utils/user';
import cookie from '../../utils/cookie';
import K3s from '../../../public/images/k3s.png'
import Charts from '../../components/ClusterEcharts/Echarts'
import CodeMirrorForm from '../../components/CodeMirrorForm';
import enterpriseStyles from './index.less'


@Form.create()
@connect(({ user, global, index, region }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  overviewInfo: index.overviewInfo,
  navigation_status: region.navigation_status
}))
export default class Enterprise extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const params = this.getParam();
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      consulting: false,
      eid: params ? params.eid : '',
      adminer,
      enterpriseInfo: false,
      enterpriseInfoLoading: true,
      overviewAppInfo: false,
      overviewInfo: false,
      overviewAppInfoLoading: true,
      collectionList: [],
      convenientVisible: false,
      delcollectionVisible: false,
      collectionInfo: false,
      clusters: [],
      appAlertList: [],
      appAlertLoding: true,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      isAuthorizationCode: false,
      enterpriseAuthorization: null,
      isAuthorizationLoading: true,
      isNeedAuthz: false,
      authorizationCode: '',
      authorizationCodeExpanded: false,
      hasNewVs: true,
      typeStatusCpu: false,
      typeStatusMemory: false,
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
    this.fetchAllVersion()
  }
  componentDidMount() {
    this.loading();
    this.handleGetEnterpriseAuthorization();
    this.interval = setInterval(() => this.handleAppAlertInfo(), 5000);
  }
  // 组件销毁停止计时器
  componentWillUnmount() {
    // 组件销毁  清除定时器
    clearInterval(this.interval)
  }
  fetchAllVersion = () => {
    const { rainbondInfo , dispatch} = this.props
    const currentVersion = rainbondInfo && rainbondInfo.version && rainbondInfo.version.value
      ? rainbondInfo.version.value.split('-')[0]
      : ''
    dispatch({
      type: 'global/fetchAllVersion',
      callback: res => {
        const list = Array.isArray(res && res.response_data) ? res.response_data : [];
        const latestVersion = list[0];
        this.setState({
          hasNewVs:
            !currentVersion ||
            !latestVersion ||
            latestVersion.split('-')[0] === currentVersion
        })
      },
      handleError: () => {
        this.setState({
          hasNewVs: true
        })
      }
    })
  }
  // 获取企业授权信息
  handleGetEnterpriseAuthorization = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;
    dispatch({
      type: 'region/getEnterpriseLicense',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            isAuthorizationLoading: false,
            enterpriseAuthorization: res.bean,
            authorizationCode: res.bean.authz_code
          });
        }
      },
      handleError: error => {
        if (error?.response?.data?.code === 400) {
          this.setState({
            authorizationCode:null,
            enterpriseAuthorization: null,
            isAuthorizationLoading: false,
          });
        }
      }
    });
  };
  // 更新企业授权码
  handleUpdateEnterpriseAuthorization = (code) => {
    const { dispatch } = this.props;
    const { eid } = this.state;
    dispatch({
      type: 'region/uploadEnterpriseLicense',
      payload: {
        enterprise_id: eid,
        authz_code: code
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleGetEnterpriseAuthorization();
          notification.success({ message: '授权码更新成功' });
          this.handleCanceAuthorization();
        }
      }
    });
  }
  // 获取企业的集群信息
  handleLoadEnterpriseClusters = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, indexs) => {
            const { region_name, enterprise_id } = item
            dispatch({
              type: 'teamControl/fetchPluginUrl',
              payload: {
                enterprise_id: enterprise_id,
                region_name: region_name
              },
              callback: data => {
                // if (data && data.bean) {
                //   if(data?.bean?.need_authz){
                //     this.setState({
                //       isNeedAuthz: data?.bean?.need_authz
                //     })
                //   }
                // }
              }
            })
            dispatch({
              type: 'global/fetchClusterUsed',
              payload: {
                  query: `(sum(node_memory_MemTotal_bytes) - sum(node_memory_MemAvailable_bytes)) / 1024 / 1024 /1024`,
                  regionName: region_name,
              },
              callback: res => {
                item.memory_used = res?.result[0]?.value[1]
              }
            })
            dispatch({
              type: 'global/fetchClusterUsed',
              payload: {
                  query: `(1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m]))) * sum(machine_cpu_cores)`,
                  regionName: region_name,
              },
              callback: res => {
                item.cpu_used = res?.result[0]?.value[1]
              }
            })
            item.key = `cluster${indexs}`;
            clusters.push(item);
            return item;
          });
          this.setState({ clusters });
          globalUtil.putClusterInfoLog(eid, res.list);
        }
      }
    });
  };
  getParam() {
    return this.props.match.params;
  }

  getOverviewMonitor = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

    dispatch({
      type: 'global/fetchOverviewMonitor',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            overviewMonitorInfo: res.bean
          });
        }
      }
    });
  };

  getOverview = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

    dispatch({
      type: 'global/fetchOverview',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            overviewInfo: res.bean
          });
        }
      }
    });
  };

  getOverviewApp = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

    dispatch({
      type: 'global/fetchOverviewApp',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            overviewAppInfo:
              res.bean && JSON.stringify(res.bean) !== '{}' ? res.bean : false,
            overviewAppInfoLoading: false
          });
        }
      }
    });
  };

  getEnterpriseInfo = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            enterpriseInfo: res.bean,
            enterpriseInfoLoading: false
          });
        }
      }
    });
  };


  loading = () => {
    const { adminer, eid } = this.state;
    if (eid) {
      this.getEnterpriseInfo();
      this.handleLoadEnterpriseClusters(eid);
      this.handleAppAlertInfo();
      // this.fetchPlatformHealth();
      if (adminer) {
        this.getOverviewApp();
        this.getOverview();
        this.getOverviewMonitor();
      } else {
        this.fetchCollectionViewInfo();
      }
    }
  };

  fetchCollectionViewInfo = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;
    dispatch({
      type: 'user/fetchCollectionViewInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            collectionList: res.list
          });
        }
      }
    });
  };

  handelConsulting = () => {
    this.setState({
      consulting: true
    });
  };
  cancelConsulting = () => {
    this.setState({
      consulting: false
    });
  };

  handlUnit = (num, unit) => {
    if (num) {
      let nums = num;
      let units = unit;
      if (nums >= 1024) {
        nums = num / 1024;
        units = 'GB';
      }
      return unit ? units : nums.toFixed(2) / 1;
    }
    return null;
  };


  handleConvenientEntrance = () => {
    notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
    this.fetchCollectionViewInfo();
    this.cancelConvenientEntrance();
  };
  cancelConvenientEntrance = () => {
    this.setState({ convenientVisible: false });
  };
  onConvenientEntrance = () => {
    this.setState({ convenientVisible: true });
  };

  deleteConvenient = collectionInfo => {
    this.setState({
      delcollectionVisible: true,
      collectionInfo
    });
  };

  deleteCollectionViewInfo = () => {
    const { dispatch } = this.props;
    const { collectionInfo, eid } = this.state;
    dispatch({
      type: 'user/deleteCollectionViewInfo',
      payload: {
        favorite_id: collectionInfo && collectionInfo.favorite_id,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
          this.fetchCollectionViewInfo();
          this.handleCloseDelCollectionVisible();
        }
      }
    });
  };
  handleCloseDelCollectionVisible = () => {
    this.setState({
      delcollectionVisible: false,
      collectionInfo: false
    });
  };
  // 应用报警信息
  handleAppAlertInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchAppAlertInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            appAlertList: res.list,
            appAlertLoding: false
          });
        } else {
          this.handleCloseLoading()
        }
      },
      handleError: (log) => {
        this.setState({
          appAlertList: [],
          appAlertLoding: false
        });
      }
    });
  };
  // loding
  handleCloseLoading = () => {
    const { appAlertLoding } = this.state
    this.setState({
      appAlertLoding: false
    })
  }
  // 应用报警跳转
  onJumpAlert = (key, team, region, group, component) => {
    const { dispatch } = this.props;
    if (key == 'component') {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/apps/${group}/overview?type=components&componentID=${component}&tab=overview`));
    } else if (key == 'team') {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/index`));
    } else {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/apps/${group}/overview`));
    }
  }
  //集群状态
  clusterStatus = (status, health_status) => {
    if (health_status === 'failure') {
      return <span style={{ color: 'red' }}>
        {/* 通信异常 */}
        <FormattedMessage id='enterpriseColony.table.state.err' />
      </span>;
    }
    switch (status) {
      case '0':
        return (
          <div>
            <Badge color="#1890ff" />
            {/* 编辑中 */}
            <FormattedMessage id='enterpriseColony.table.state.edit' />
          </div>
        );
      case '1':
        return (
          <div>
            <Badge color="#52c41a" />
            {/* 运行中 */}
            <FormattedMessage id='enterpriseColony.table.state.run' />
          </div>
        );
      case '2':
        return (
          <div>
            <Badge color="#b7b7b7" />
            {/* 已下线 */}
            <FormattedMessage id='enterpriseColony.table.state.down' />
          </div>
        );

      case '3':
        return (
          <div>
            <Badge color="#1890ff" />
            {/* 维护中 */}
            <FormattedMessage id='enterpriseColony.table.state.maintain' />
          </div>
        );
      case '5':
        return (
          <div>
            <Badge color="#fff" />
            {/* 异常 */}
            <FormattedMessage id='enterpriseColony.table.state.abnormal' />
          </div>
        );
      default:
        return (
          <div>
            <Badge color="#fff" />
            {/* 未知 */}
            <FormattedMessage id='enterpriseColony.table.state.unknown' />
          </div>
        );
    }
  }
  // 集群展示图标
  clusterIcon = (provider, region_type) => {
    switch (provider) {
      case 'ack':
        return (
          <span className={enterpriseStyles.clusterIconSymbol} key={provider}>
            {globalUtil.fetchSvg('Ack')}
          </span>
        );
      case 'tke':
        return (
          <span className={enterpriseStyles.clusterIconSymbol} key={provider}>
            {globalUtil.fetchSvg('Tke')}
          </span>
        );
      case 'K3s':
        return (
          <span className={enterpriseStyles.clusterIconSymbol} key={provider}>
            <img src={K3s} alt="" />
          </span>
        );
      case 'helm':
        return (
          <span className={enterpriseStyles.clusterIconSymbol} key={provider}>
            {globalUtil.fetchSvg(
              region_type == 'aliyun'
                ? 'Ack'
                : region_type == 'huawei'
                  ? 'Cce'
                  : region_type == 'tencent'
                    ? 'Tke'
                    : 'K8s'
            )}
          </span>
        );
      default:
        return (
          <span className={enterpriseStyles.clusterIconSymbol} key={provider}>
            {globalUtil.fetchSvg('K8s')}
          </span>
        );
    }
  }
  handleAuthorization = () => {
    this.setState({
      isAuthorizationCode: true
    })
  }
  handleCanceAuthorization = () => {
    this.setState({
      isAuthorizationCode: false
    })
  }
  handleCopyEid = () => {
    const { eid } = this.state;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(eid).then(() => {
        notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
      });
    } else {
      const input = document.createElement('input');
      input.value = eid;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
    }
  }
  handleCopyAuthCode = () => {
    const { authorizationCode } = this.state;
    if (!authorizationCode) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(authorizationCode).then(() => {
        notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = authorizationCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
    }
  }
  handleToggleAuthCode = () => {
    this.setState(({ authorizationCodeExpanded }) => ({
      authorizationCodeExpanded: !authorizationCodeExpanded
    }));
  }
  handleSubmit = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.handleUpdateEnterpriseAuthorization(values.authorization_code)
      }
    });
  };
  downloadClusterInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    this.download(`/console/enterprise/${eid}/platform-info`)
  }

  download = downloadPath => {
    let aEle = document.querySelector('#down-a-element');
    if (!aEle) {
      aEle = document.createElement('a');
      aEle.setAttribute('download', '');
      document.body.appendChild(aEle);
    }
    aEle.href = downloadPath;
    if (document.all) {
      aEle.click();
    } else {
      const e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      aEle.dispatchEvent(e);
    }
  };
  handleRouteupdate = () => {
    const { dispatch } = this.props
    const { eid } = this.state;
    dispatch(routerRedux.push(`/enterprise/${eid}/setting?type=updateVersion`));
  }

  handleClickStatus = type => {
    if (type === 'cpu') {
      this.setState(({ typeStatusCpu }) => ({
        typeStatusCpu: !typeStatusCpu
      }));
    } else {
      this.setState(({ typeStatusMemory }) => ({
        typeStatusMemory: !typeStatusMemory
      }));
    }
  }

  renderContent = () => {
    const { rainbondInfo, form } = this.props;
    const {
      enterpriseInfo,
      overviewInfo,
      overviewMonitorInfo,
      overviewAppInfo,
      enterpriseInfoLoading,
      overviewAppInfoLoading,
      collectionList,
      convenientVisible,
      delcollectionVisible,
      eid,
      language,
      clusters,
      appAlertList,
      appAlertLoding,
      isAuthorizationCode,
      enterpriseAuthorization,
      isAuthorizationLoading,
      isNeedAuthz,
      authorizationCode,
      authorizationCodeExpanded,
      hasNewVs,
      typeStatusCpu,
      typeStatusMemory,
      // platformHealth,
      // platformHealthLoading,
      // healthDetailVisible,
      // currentHealthIssue,
    } = this.state;
    const end = enterpriseAuthorization && enterpriseAuthorization.expire_at ? moment.unix(enterpriseAuthorization.expire_at).valueOf() : null;
    const current = moment().valueOf();
    const isServiceExpired = enterpriseAuthorization && enterpriseAuthorization.subscribe_until
      ? moment.unix(enterpriseAuthorization.subscribe_until).valueOf() < current
      : false;
    const { getFieldDecorator, setFieldsValue } = form;
    const timestamp = Date.parse(new Date());
    const enterpriseVersion =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const cloudSvg = globalUtil.fetchSvg('cloudSvg');
    const updataSvg = globalUtil.fetchSvg('updataSvg');
    const errorSvg = globalUtil.fetchSvg('errorSvg');
    const enterpriseDataSvg = globalUtil.fetchSvg('enterpriseDataSvg');
    const clustersInfoSvg = globalUtil.fetchSvg('clustersInfoSvg');
    const appErrorSvg = globalUtil.fetchSvg('appErrorSvg');
    const switchSvg = globalUtil.fetchSvg('switchSvg');
    // const healthSvg = globalUtil.fetchSvg('healthSvg');
    const formatMetricValue = (value, precision = 2) => {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) {
        return 0;
      }
      return parseFloat(number.toFixed(precision));
    };
    const formatMetricPercent = value => {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) {
        return 0;
      }
      return number > 100 ? 100 : parseFloat(number.toFixed(2));
    };
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      }
    };
    return (
      <div style={{padding:18}}>
        {!isAuthorizationLoading && !authorizationCode && (
          <div className={enterpriseStyles.authBanner}>
            <div className={enterpriseStyles.authBannerLeft}>
              <span className={enterpriseStyles.authBannerIcon}>
                <Icon type="unlock" />
              </span>
              <span className={enterpriseStyles.authBannerText}>
                {formatMessage({id:'platformUpgrade.index.getEnterpriseAuth'})}
                <a onClick={this.handleAuthorization}>
                  {formatMessage({id:'platformUpgrade.index.getEnterpriseAuthLink'})}
                </a>
              </span>
            </div>
          </div>
        )}
        {convenientVisible && (
          <Convenient
            {...this.props}
            title={<FormattedMessage id="enterpriseOverview.Convenient.title" />}
            onOk={this.handleConvenientEntrance}
            onCancel={this.cancelConvenientEntrance}
          />
        )}

        {delcollectionVisible && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.fast_entrance.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.fast_entrance.desc' })}
            onOk={this.deleteCollectionViewInfo}
            onCancel={this.handleCloseDelCollectionVisible}
          />
        )}
        {/* 企业信息、数据总览板块 */}
        <Spin spinning={enterpriseInfoLoading}>
          <div className={enterpriseStyles.dualCardContainer}>
            {/* 企业信息卡片 */}
            <div className={`${enterpriseStyles.cardContainer} ${enterpriseStyles.platformInfoCard}`}>
              <div className={enterpriseStyles.platformInfoInner}>
                <div className={enterpriseStyles.platformInfoMain}>
                  <div className={enterpriseStyles.overviewCardHeader}>
                    <span className={enterpriseStyles.overviewCardHeaderIcon}>
                      <Icon type="home" />
                    </span>
                    <h2>{formatMessage({ id: 'enterpriseOverview.information.message' })}</h2>
                  </div>
                  {enterpriseInfo && (
                    <div className={enterpriseStyles.platformInfoContent}>
                      <div className={enterpriseStyles.platformCompanyBlock}>
                        <div className={enterpriseStyles.platformLabel}>
                          <FormattedMessage id="enterpriseOverview.information.name" />
                        </div>
                        <div className={enterpriseStyles.platformCompanyName}>
                          <span>{enterpriseInfo.enterprise_alias}</span>
                          {!enterpriseEdition && enterpriseVersion !== 'cloud' && (
                            <a
                              href="https://p5yh4rek1e.feishu.cn/share/base/shrcnDhEE6HkYddzjY4XRKuXikb"
                              target="_blank"
                            >
                              {formatMessage({id:'platformUpgrade.index.consulting'})}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className={enterpriseStyles.platformDivider} />
                      <div className={enterpriseStyles.platformMetaList}>
                        <div className={enterpriseStyles.platformMetaItem}>
                          <span className={enterpriseStyles.platformMetaLabel}><FormattedMessage id="enterpriseOverview.information.unite" /></span>
                          <Tooltip title={enterpriseInfo.enterprise_id}>
                            <span className={enterpriseStyles.platformMetaValue}>{enterpriseInfo.enterprise_id}</span>
                          </Tooltip>
                        </div>
                        <div className={enterpriseStyles.platformMetaItem}>
                          <span className={enterpriseStyles.platformMetaLabel}><FormattedMessage id="enterpriseOverview.information.versions" /></span>
                          <Tooltip title={enterpriseVersion}>
                            <span className={enterpriseStyles.platformMetaValue}>{enterpriseVersion || '-'}</span>
                          </Tooltip>
                        </div>
                        <div className={enterpriseStyles.platformMetaItem}>
                          <span className={enterpriseStyles.platformMetaLabel}><FormattedMessage id="enterpriseOverview.information.time" /></span>
                          <Tooltip title={enterpriseInfo.create_time}>
                            <span className={enterpriseStyles.platformMetaValue}>{enterpriseInfo.create_time}</span>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={enterpriseStyles.platformInfoIllustration}>
                  {!hasNewVs ? (
                    <div onClick={this.handleRouteupdate}>
                      <Tooltip placement="top" title={formatMessage({id:'platformUpgrade.index.clicktoupload'})}>
                        {updataSvg}
                        <div className={enterpriseStyles.jumpText}>
                          <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char1}`}>{formatMessage({id:'platformUpgrade.index.have'})}&nbsp;</span>
                          <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char2}`}>{formatMessage({id:'platformUpgrade.index.new'})}&nbsp;</span>
                          <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char3}`}>{formatMessage({id:'platformUpgrade.index.ban'})}&nbsp;</span>
                          <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char4}`}>{formatMessage({id:'platformUpgrade.index.ben'})}&nbsp;</span>
                        </div>
                      </Tooltip>
                    </div>
                  ) : (
                    cloudSvg
                  )}
                </div>
              </div>
            </div>
            {/* 数据总览卡片 */}
            <div className={`${enterpriseStyles.cardContainer} ${enterpriseStyles.dataOverviewCard}`}>
              <div className={enterpriseStyles.dataOverviewInner}>
                <div className={enterpriseStyles.overviewCardHeader}>
                  <span className={enterpriseStyles.overviewCardHeaderIcon}>{enterpriseDataSvg}</span>
                  <h2>{formatMessage({ id: 'enterpriseOverview.information.dataScreen' })}</h2>
                </div>
                <div className={enterpriseStyles.enterpriseDataContent}>
                  <div className={enterpriseStyles.piece}>
                    <p className={enterpriseStyles.dataOverviewTitle}>{formatMessage({ id: 'enterpriseOverview.overview.colonyAction' })}</p>
                    <p className={enterpriseStyles.dataOverviewValue}>
                      <Link to={`/enterprise/${eid}/clusters`}>
                        {overviewMonitorInfo && overviewMonitorInfo.total_regions || 0}
                      </Link>
                    </p>
                    <p className={enterpriseStyles.dataOverviewDesc}>{formatMessage({ id: 'enterpriseOverview.overview.colonyDesc' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p className={enterpriseStyles.dataOverviewTitle}>{formatMessage({ id: 'enterpriseOverview.overview.teamAction' })}</p>
                    <p className={enterpriseStyles.dataOverviewValue}>
                      <Link to={`/enterprise/${eid}/teams`}>
                        {overviewInfo && overviewInfo.total_teams}
                      </Link>
                    </p>
                    <p className={enterpriseStyles.dataOverviewDesc}>{formatMessage({ id: 'enterpriseOverview.overview.teamDesc' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p className={enterpriseStyles.dataOverviewTitle}>{formatMessage({ id: 'enterpriseOverview.overview.userAction' })}</p>
                    <p className={enterpriseStyles.dataOverviewValue}>
                      <Link to={`/enterprise/${eid}/users`}>
                        {overviewInfo && overviewInfo.total_users}
                      </Link>
                    </p>
                    <p className={enterpriseStyles.dataOverviewDesc}>{formatMessage({ id: 'enterpriseOverview.overview.userDesc' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p className={enterpriseStyles.dataOverviewTitle}>{formatMessage({ id: 'enterpriseOverview.overview.templateAction' })}</p>
                    <p className={enterpriseStyles.dataOverviewValue}>
                      <Link to={`/enterprise/${eid}/shared/local`}>
                        {overviewInfo && overviewInfo.shared_apps}
                      </Link>
                    </p>
                    <p className={enterpriseStyles.dataOverviewDesc}>{formatMessage({ id: 'enterpriseOverview.overview.templateDesc' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
        {/* 企业授权信息 */}
        {authorizationCode &&!isAuthorizationLoading && (
          <div className={`${enterpriseStyles.cardContainer} ${enterpriseStyles.licenseCard}`}>
            <div className={enterpriseStyles.licenseContent}>
              {enterpriseAuthorization ? (
                <Fragment>
                  <div className={enterpriseStyles.licenseSummary}>
                    <div className={enterpriseStyles.licenseMain}>
                      <div className={enterpriseStyles.overviewCardHeader}>
                        <span className={enterpriseStyles.overviewCardHeaderIcon}>
                          <Icon type="safety" />
                        </span>
                        <h2>{formatMessage({id:'platformUpgrade.index.info'})}</h2>
                      </div>
                      <div className={enterpriseStyles.licenseCompanyBlock}>
                        <span className={enterpriseStyles.licenseCompanyLabel}>
                          {formatMessage({id:'platformUpgrade.index.Authorizationenterprise'})}
                        </span>
                        <div className={enterpriseStyles.licenseCompanyRow}>
                          <span className={enterpriseStyles.licenseCompany}>
                            {enterpriseAuthorization.company || '-'}
                          </span>
                        </div>
                        {end && end < current ? (
                          <Button size="small" type="primary" className={enterpriseStyles.renewBtn} onClick={this.handleAuthorization}>
                            {formatMessage({id:'platformUpgrade.index.updataAuthorization'})}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className={enterpriseStyles.licenseLimitPanel}>
                      <div className={enterpriseStyles.licenseLimitItem}>
                        <span>{formatMessage({id:'platformUpgrade.index.expireAt'})}</span>
                        <strong>
                          {enterpriseAuthorization.expire_at
                            ? moment.unix(enterpriseAuthorization.expire_at).format('YYYY-MM-DD')
                            : formatMessage({id:'platformUpgrade.index.nilimit'})}
                        </strong>
                      </div>
                      <div className={enterpriseStyles.licenseLimitItem}>
                        <span>{formatMessage({id:'platformUpgrade.index.clusterAuthorization'})}</span>
                        <strong>
                          {enterpriseAuthorization.cluster_limit == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.cluster_limit} 个`}
                        </strong>
                      </div>
                      <div className={enterpriseStyles.licenseLimitItem}>
                        <span>{formatMessage({id:'platformUpgrade.index.Authorizationnode'})}</span>
                        <strong>
                          {enterpriseAuthorization.node_limit == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.node_limit} 个`}
                        </strong>
                      </div>
                      <div className={enterpriseStyles.licenseLimitItem}>
                        <span>{formatMessage({id:'platformUpgrade.index.Authorizationmemory'})}</span>
                        <strong>
                          {enterpriseAuthorization.memory_limit == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.memory_limit} GB`}
                        </strong>
                      </div>
                    </div>
                  </div>
                  {isServiceExpired && (
                    <div className={enterpriseStyles.licenseServiceExpired}>
                      <Tooltip title="服务已过期，无法安装和更新插件，已安装插件不受影响">
                        <span>
                          {formatMessage({id:'platformUpgrade.index.tel'})}
                          {enterpriseAuthorization.subscribe_until ? moment.unix(enterpriseAuthorization.subscribe_until).format('YYYY-MM-DD') : '-'}
                        </span>
                      </Tooltip>
                      <Button size="small" type="primary" className={enterpriseStyles.renewBtn} onClick={this.handleAuthorization}>
                        {formatMessage({id:'platformUpgrade.index.updataAuthorization'})}
                      </Button>
                    </div>
                  )}
                  <div className={enterpriseStyles.licenseDivider} />
                  <div className={enterpriseStyles.licenseCodeBlock}>
                    <div className={enterpriseStyles.licenseCodeHeader}>
                      <span>{formatMessage({id:'platformUpgrade.index.AuthorizationCode'})}</span>
                      <div className={enterpriseStyles.licenseCodeActions}>
                        <Tooltip title={formatMessage({id:'platformUpgrade.index.authModal.copy'})}>
                          <button type="button" onClick={this.handleCopyAuthCode}>
                            <Icon type="copy" />
                          </button>
                        </Tooltip>
                        <Tooltip title={authorizationCodeExpanded
                          ? formatMessage({id:'platformUpgrade.index.collapse'})
                          : formatMessage({id:'platformUpgrade.index.view'})}
                        >
                          <button type="button" onClick={this.handleToggleAuthCode}>
                            <Icon type={authorizationCodeExpanded ? 'eye-invisible' : 'eye'} />
                          </button>
                        </Tooltip>
                        <Tooltip title={formatMessage({id:'platformUpgrade.index.updataAuthorization'})}>
                          <button type="button" onClick={this.handleAuthorization}>
                            <Icon type="edit" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div
                      className={`${enterpriseStyles.licenseCodeContent} ${
                        authorizationCodeExpanded ? enterpriseStyles.licenseCodeExpanded : ''
                      }`}
                    >
                      {authorizationCode || '-'}
                    </div>
                  </div>
                  <div className={enterpriseStyles.authorization_plugins}>
                    <div className={enterpriseStyles.licenseCodeHeader}>
                      <span>{formatMessage({id:'platformUpgrade.index.availablePlugins'})}</span>
                    </div>
                    <div className={enterpriseStyles.authorization_plugins_list}>
                      {enterpriseAuthorization.plugins && enterpriseAuthorization.plugins.length > 0 ? (
                        enterpriseAuthorization.plugins.map(plugin => (
                          <Tag key={plugin.plugin_id} className={enterpriseStyles.authorization_plugin_tag}>
                            {plugin.name}
                          </Tag>
                        ))
                      ) : (
                        <span className={enterpriseStyles.authorization_plugins_empty}>
                          {formatMessage({id:'platformUpgrade.index.noPlugins'})}
                        </span>
                      )}
                    </div>
                  </div>
                </Fragment>
              ) : (
                <div className={enterpriseStyles.authorization_error}>
                  <div className={enterpriseStyles.authorization_invalid}>
                    <div className={enterpriseStyles.authorization_svg}>
                      {errorSvg}
                    </div>
                    <div>{formatMessage({id:'platformUpgrade.index.noAuthorization'})}</div>
                  </div>
                  <p>{formatMessage({id:'platformUpgrade.index.connection'})}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* 集群信息 */}
        <div className={enterpriseStyles.clusterOverviewCard}>
          <div className={enterpriseStyles.clusterOverviewInner}>
            <div className={enterpriseStyles.overviewCardHeader}>
              <span className={enterpriseStyles.overviewCardHeaderIcon}>{clustersInfoSvg}</span>
              <h2>{formatMessage({ id: 'enterpriseOverview.information.colonyInfo' })}</h2>
            </div>
          <Spin spinning={overviewAppInfoLoading}>
            <div className={enterpriseStyles.clusterOverviewBody}>
              {clusters.length > 0 ?
                (clusters.map(item => {
                const {
                  region_alias,
                  rbd_version,
                  health_status,
                  provider,
                  status,
                  total_cpu,
                  used_cpu,
                  used_memory,
                  total_memory,
                  region_type,
                  k8s_version,
                  create_time,
                  all_nodes,
                  node_ready,
                  region_id,
                  run_pod_number,
                  memory_used,
                  cpu_used
                } = item
                const cpuTotal = formatMetricValue(total_cpu, 0);
                const cpuAllocated = formatMetricValue(used_cpu);
                const cpuAllocatedPercent = formatMetricPercent((Number(used_cpu) / Number(total_cpu)) * 100);
                const cpuRemaining = formatMetricValue(Number(total_cpu) - Number(used_cpu));
                const cpuActualUsed = formatMetricValue(cpu_used);
                const cpuActualPercent = formatMetricPercent((Number(cpu_used) / Number(total_cpu)) * 100);
                const cpuActualRemaining = formatMetricValue(Number(total_cpu) - Number(cpu_used));
                const cpuDisplayValue = typeStatusCpu ? cpuActualUsed : cpuAllocated;
                const cpuDisplayPercent = typeStatusCpu ? cpuActualPercent : cpuAllocatedPercent;
                const cpuDisplayRemaining = typeStatusCpu ? cpuActualRemaining : cpuRemaining;
                const memoryTotalGb = formatMetricValue(Number(total_memory) / 1024);
                const memoryAllocatedGb = formatMetricValue(Number(used_memory) / 1024);
                const memoryAllocatedPercent = formatMetricPercent((Number(used_memory) / Number(total_memory)) * 100);
                const memoryRemainingGb = formatMetricValue((Number(total_memory) - Number(used_memory)) / 1024);
                const memoryActualUsedGb = formatMetricValue(memory_used);
                const memoryActualPercent = formatMetricPercent((Number(memory_used) / (Number(total_memory) / 1024)) * 100);
                const memoryActualRemainingGb = formatMetricValue((Number(total_memory) / 1024) - Number(memory_used));
                const memoryDisplayValue = typeStatusMemory ? memoryActualUsedGb : memoryAllocatedGb;
                const memoryDisplayPercent = typeStatusMemory ? memoryActualPercent : memoryAllocatedPercent;
                const memoryDisplayRemaining = typeStatusMemory ? memoryActualRemainingGb : memoryRemainingGb;
                const clusterType = region_type && region_type[0];
                return (
                  <div className={enterpriseStyles.clusterInfo} key={region_id || region_alias}>
                    <div className={enterpriseStyles.clusterSummary}>
                      <div className={enterpriseStyles.clusterSummaryMain}>
                        <div className={enterpriseStyles.clusterIconBox}>
                          {this.clusterIcon(provider, clusterType)}
                        </div>
                        <div className={enterpriseStyles.clusterSummaryContent}>
                          <div className={enterpriseStyles.clusterNameRow}>
                            <span className={enterpriseStyles.clusterName}>{region_alias}</span>
                            <div className={`${enterpriseStyles.clusterStatus} ${health_status === 'failure' ? enterpriseStyles.clusterStatusError : ''}`}>
                              {this.clusterStatus(status, health_status)}
                            </div>
                          </div>
                          <div className={enterpriseStyles.clusterMetaList}>
                            <div className={enterpriseStyles.clusterMetaItem}>
                              <span className={enterpriseStyles.clusterMetaLabel}>{formatMessage({ id: 'enterpriseOverview.overview.colonyVersion' })}</span>
                              <Tooltip title={rbd_version}>
                                <span className={enterpriseStyles.clusterMetaValue}>{rbd_version || '-'}</span>
                              </Tooltip>
                            </div>
                            <div className={enterpriseStyles.clusterMetaItem}>
                              <span className={enterpriseStyles.clusterMetaLabel}>Kubernetes</span>
                              <span className={enterpriseStyles.clusterMetaValue}>{k8s_version || '-'}</span>
                            </div>
                            <div className={enterpriseStyles.clusterMetaItem}>
                              <span className={enterpriseStyles.clusterMetaLabel}>{formatMessage({ id: 'enterpriseOverview.overview.createTime' })}</span>
                              <span className={enterpriseStyles.clusterMetaValue}>{globalUtil.fetchdayTime(create_time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link className={enterpriseStyles.clusterSetting} to={`/enterprise/${eid}/clusters/ClustersMGT/${region_id}`} >
                        <Tooltip title={formatMessage({ id: 'enterpriseOverview.overview.edit' })}>
                          {SVG.getSvg("settingSvg", 18)}
                        </Tooltip>
                      </Link>
                    </div>
                    <div className={enterpriseStyles.clusterDivider} />
                    {health_status !== 'failure' ? (
                      <div className={enterpriseStyles.clusterMetrics}>
                        <div className={enterpriseStyles.clusterMetricItem}>
                          <div className={enterpriseStyles.clusterMetricTitleRow}>
                            <span className={enterpriseStyles.clusterMetricTitle}>
                              {formatMessage({ id: typeStatusCpu ? 'enterpriseOverview.overview.cpu_used' : 'enterpriseOverview.overview.cpu_allocated' })}
                            </span>
                            <Tooltip title={formatMessage({ id: typeStatusCpu ? 'enterpriseColony.mgt.cluster.assigned' : 'enterpriseColony.mgt.cluster.used' })}>
                              <button
                                className={enterpriseStyles.clusterMetricSwitch}
                                type="button"
                                onClick={() => this.handleClickStatus('cpu')}
                              >
                                {switchSvg}
                              </button>
                            </Tooltip>
                          </div>
                          <div className={enterpriseStyles.clusterMetricValue}>
                            <span>{cpuDisplayValue}</span>
                            <em>/{cpuTotal} Core</em>
                          </div>
                          <div className={enterpriseStyles.clusterMetricDesc}>
                            {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                            <span>{cpuDisplayRemaining}</span>
                            Core
                          </div>
                          <div className={enterpriseStyles.clusterGaugeFloat}>
                            <Charts
                              chartType="progressGauge"
                              keys={`enterpriseCpuGauge${region_id || region_alias}`}
                              unit="%"
                              usedValue={cpuDisplayPercent}
                              svalue={cpuDisplayPercent}
                              swidth="140px"
                              sheight="140px"
                            />
                          </div>
                        </div>
                        <div className={enterpriseStyles.clusterMetricItem}>
                          <div className={enterpriseStyles.clusterMetricTitleRow}>
                            <span className={enterpriseStyles.clusterMetricTitle}>
                              {formatMessage({ id: typeStatusMemory ? 'enterpriseOverview.overview.memory_used' : 'enterpriseOverview.overview.memory_allocated' })}
                            </span>
                            <Tooltip title={formatMessage({ id: typeStatusMemory ? 'enterpriseColony.mgt.cluster.assigned' : 'enterpriseColony.mgt.cluster.used' })}>
                              <button
                                className={enterpriseStyles.clusterMetricSwitch}
                                type="button"
                                onClick={() => this.handleClickStatus('memory')}
                              >
                                {switchSvg}
                              </button>
                            </Tooltip>
                          </div>
                          <div className={enterpriseStyles.clusterMetricValue}>
                            <span>{memoryDisplayValue}</span>
                            <em>/{memoryTotalGb} GB</em>
                          </div>
                          <div className={enterpriseStyles.clusterMetricDesc}>
                            {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                            <span>{memoryDisplayRemaining}</span>
                            GB
                          </div>
                          <div className={enterpriseStyles.clusterGaugeFloat}>
                            <Charts
                              chartType="progressGauge"
                              keys={`enterpriseMemoryGauge${region_id || region_alias}`}
                              unit="%"
                              usedValue={memoryDisplayPercent}
                              svalue={memoryDisplayPercent}
                              swidth="140px"
                              sheight="140px"
                            />
                          </div>
                        </div>
                        <div className={enterpriseStyles.clusterMetricItem}>
                          <div className={enterpriseStyles.clusterMetricTitle}>{formatMessage({ id: 'enterpriseOverview.overview.node_normal' })}</div>
                          <div className={enterpriseStyles.clusterMetricValue}>
                            <span>{node_ready == {} ? 0 : node_ready || 0}</span>
                            <em>/{all_nodes || 0}</em>
                            <small>{formatMessage({ id: 'enterpriseOverview.overview.unit.count' })}</small>
                          </div>
                          <div className={enterpriseStyles.clusterMetricDesc}>Node</div>
                        </div>
                        <div className={enterpriseStyles.clusterMetricItem}>
                          <div className={enterpriseStyles.clusterMetricTitle}>{formatMessage({ id: 'enterpriseOverview.overview.running_components' })}</div>
                          <div className={enterpriseStyles.clusterMetricValue}>
                            <span>{run_pod_number && run_pod_number || 0}</span>
                            <small>{formatMessage({ id: 'enterpriseOverview.overview.unit.count' })}</small>
                          </div>
                          <div className={enterpriseStyles.clusterMetricDesc}>Pod</div>
                        </div>
                      </div>) : (
                      <div className={enterpriseStyles.clusterFailureContent}>
                        <div className={enterpriseStyles.error_troubleshoot_left}>
                          <Empty
                            image={errorSvg}
                            description={
                              <span style={{ color: globalUtil.getPublicColor('rbd-error-status'), fontSize: '18px' }}>
                                {formatMessage({ id: 'enterpriseOverview.overview.Abnormal' })}
                              </span>
                            } />
                        </div>
                        <div className={enterpriseStyles.error_troubleshoot_right}>
                          <ul className={enterpriseStyles.ulStyle}>
                            <div>{formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.title1' })}</div>
                            <li>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li1' })}
                            </li>
                            <li style={{ marginTop: '10px' }}>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li2' })}
                            </li>
                            <li>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li3' })}
                            </li>
                            <li>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li4' })}
                            </li>
                          </ul>
                          <ul className={enterpriseStyles.ulStyle}>
                            <div>{formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.title2' })}</div>
                            <li>
                              1、
                              <Link to={`/enterprise/${eid}/logs`} >
                                {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li5' })}
                              </Link>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li6' })}
                            </li>
                            <li>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li7' })}
                            </li>
                            <li>
                              {formatMessage({ id: 'enterpriseOverview.overview.troubleshoot.li8' })}
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )
                })) : (
                  <div className={enterpriseStyles.clusterInfo_Empty}>
                    <Empty description={formatMessage({ id: 'enterpriseOverview.overview.no_cluster' })} />
                  </div>
                )}
            </div>
          </Spin>
          </div>
        </div>
        {/* 应用报警 */}
        {!appAlertLoding && appAlertList.length > 0 && (
          <div className={enterpriseStyles.appAlertCard}>
            <div className={enterpriseStyles.cardHeader}>
              <span>{appErrorSvg}</span>
              <h2>{formatMessage({ id: 'enterpriseOverview.information.appAlert' })}</h2>
            </div>
            <div className={enterpriseStyles.cardBody}>
              <div className={enterpriseStyles.appAlertContent}>
                <div className={enterpriseStyles.appAlertList}>
                  {appAlertList.map(item => {
                    const { group_id, group_name, region_name, service_alias, service_cname, tenant_name, tenant_alias, alert_date } = item
                    return (
                      <div className={enterpriseStyles.appAlertItem} key={`${tenant_name}-${group_id}-${service_alias}`}>
                        <div className={enterpriseStyles.appAlertIcon}>
                          <Icon type="warning" />
                        </div>
                        <div className={enterpriseStyles.appAlertInfo}>
                          <div className={enterpriseStyles.appAlertColumn}>
                            <span className={enterpriseStyles.appAlertLabel}>{formatMessage({ id: 'enterpriseOverview.overview.source' })}</span>
                            <button
                              className={enterpriseStyles.appAlertValueLink}
                              type="button"
                              onClick={() => {
                                this.onJumpAlert('team', tenant_name, region_name, group_id, service_alias)
                              }}
                            >
                              {tenant_alias}
                            </button>
                          </div>
                          <div className={enterpriseStyles.appAlertColumn}>
                            <span className={enterpriseStyles.appAlertLabel}>{formatMessage({ id: 'enterpriseOverview.overview.team' })}</span>
                            <button
                              className={enterpriseStyles.appAlertValueLink}
                              type="button"
                              onClick={() => {
                                this.onJumpAlert('app', tenant_name, region_name, group_id, service_alias)
                              }}
                            >
                              {group_name}
                            </button>
                          </div>
                          <div className={enterpriseStyles.appAlertColumn}>
                            <span className={enterpriseStyles.appAlertLabel}>{formatMessage({ id: 'enterpriseOverview.overview.component' })}</span>
                            <button
                              className={enterpriseStyles.appAlertValueLink}
                              type="button"
                              onClick={() => {
                                this.onJumpAlert('component', tenant_name, region_name, group_id, service_alias)
                              }}
                            >
                              {service_cname}
                            </button>
                          </div>
                          <div className={enterpriseStyles.appAlertColumn}>
                            <span className={enterpriseStyles.appAlertLabel}>{formatMessage({ id: 'enterpriseOverview.overview.status' })}</span>
                            <span className={enterpriseStyles.appAlertStatus}>{formatMessage({ id: 'enterpriseOverview.overview.error' })}</span>
                          </div>
                        </div>
                        <div className={enterpriseStyles.appAlertDate}>
                          {alert_date || moment(timestamp).locale('zh-cn').format('YYYY-MM-DD')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}


        {isAuthorizationCode &&
          <Modal
            visible
            onCancel={this.handleCanceAuthorization}
            footer={null}
            closable={false}
            width={520}
            bodyStyle={{ padding: 0 }}
            centered
          >
            <div className={enterpriseStyles.authModal}>
              <div className={enterpriseStyles.authModalBody}>
                <div className={enterpriseStyles.authModalIcon}>
                  <Icon type="lock" />
                </div>
                <div className={enterpriseStyles.authModalTitle}>
                  {formatMessage({id:'platformUpgrade.index.authModal.title'})}
                </div>
                <div className={enterpriseStyles.authModalSubtitle}>
                  {formatMessage({id:'platformUpgrade.index.authModal.subtitle'})}
                </div>
                <div className={enterpriseStyles.authModalActions}>
                  <a href="https://www.rainbond.com" target="_blank" className={enterpriseStyles.authModalActionCard}>
                    <Icon type="global" className={enterpriseStyles.authModalActionIcon} />
                    <span>{formatMessage({id:'platformUpgrade.index.authModal.website'})}</span>
                    <Icon type="right" className={enterpriseStyles.authModalActionArrow} />
                  </a>
                  <a href="https://www.rainbond.com/enterprise_server" target="_blank" className={enterpriseStyles.authModalActionCard}>
                    <Icon type="solution" className={enterpriseStyles.authModalActionIcon} />
                    <span>{formatMessage({id:'platformUpgrade.index.authModal.getCommercial'})}</span>
                    <Icon type="right" className={enterpriseStyles.authModalActionArrow} />
                  </a>
                </div>
                <div className={enterpriseStyles.authModalEid}>
                  <span className={enterpriseStyles.authModalEidLabel}>
                    {formatMessage({id:'platformUpgrade.index.authModal.enterpriseId'})}
                  </span>
                  <span className={enterpriseStyles.authModalEidValue}>{eid}</span>
                  <a onClick={this.handleCopyEid} className={enterpriseStyles.authModalCopyBtn}>
                    <Icon type="copy" style={{ marginRight: 4 }} />
                    {formatMessage({id:'platformUpgrade.index.authModal.copy'})}
                  </a>
                </div>
                <div className={enterpriseStyles.authModalEidTip}>
                  {formatMessage({id:'platformUpgrade.index.authModal.idTip'})}
                </div>
                <div className={enterpriseStyles.authModalCodeSection}>
                  <div className={enterpriseStyles.authModalCodeLabel}>
                    {formatMessage({id:'platformUpgrade.index.authModal.hasCode'})}
                  </div>
                  <div className={enterpriseStyles.authModalCodeInput}>
                    {getFieldDecorator('authorization_code', {
                      initialValue: authorizationCode || '',
                    })(
                      <Input.TextArea
                        rows={3}
                        placeholder={formatMessage({id:'platformUpgrade.index.authModal.inputPlaceholder'})}
                      />
                    )}
                  </div>
                  <Button type="primary" block onClick={this.handleSubmit} style={{ marginTop: 12, borderRadius: 6 }}>
                    {formatMessage({id:'platformUpgrade.index.authModal.activate'})}
                  </Button>
                </div>
                <div className={enterpriseStyles.authModalLater}>
                  <a onClick={this.handleCanceAuthorization}>
                    {formatMessage({id:'platformUpgrade.index.authModal.later'})}
                  </a>
                </div>
              </div>
            </div>
          </Modal>
        }
      </div>
    );
  };

  render() {
    const {
      consulting,
      enterpriseInfo,
    } = this.state;
    return (
      <ScrollerX sm={`calc(1100px - var(--agent-panel-width, 0px))`}>
        {this.renderContent()}
        {consulting && (
          <Consulting
            name={enterpriseInfo && enterpriseInfo.enterprise_alias}
            onOk={this.cancelConsulting}
            onCancel={this.cancelConsulting}
          />
        )}
      </ScrollerX>
    );
  }
}
