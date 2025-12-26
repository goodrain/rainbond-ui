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
  Form
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
      hasNewVs: true,
      typeStatusCpu: false,
      typeStatusMemory: false,
      // platformHealth: null,
      // platformHealthLoading: true,
      // healthDetailVisible: false,
      // currentHealthIssue: null,
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
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    dispatch({
      type: 'global/fetchAllVersion',
      callback: res => {
        if (res) {
          let list = res.response_data
          const isNewVs = list[0].split('-')[0] === currentVersion
          this.setState({
            hasNewVs: isNewVs
          })
        }
      }
    })
  }
  // // 获取平台健康状态
  // fetchPlatformHealth = () => {
  //   const { dispatch } = this.props;
  //   dispatch({
  //     type: 'global/fetchPlatformHealth',
  //     callback: res => {
  //       if (res && res.status_code === 200) {
  //         this.setState({
  //           platformHealth: res.bean,
  //           platformHealthLoading: false
  //         });
  //       }
  //     },
  //     handleError: () => {
  //       this.setState({
  //         platformHealth: null,
  //         platformHealthLoading: false
  //       });
  //     }
  //   });
  // };

  // // 显示健康问题详情
  // showHealthDetail = (issue, regionAlias) => {
  //   this.setState({
  //     healthDetailVisible: true,
  //     currentHealthIssue: { ...issue, regionAlias }
  //   });
  // };

  // // 关闭健康问题详情
  // closeHealthDetail = () => {
  //   this.setState({
  //     healthDetailVisible: false,
  //     currentHealthIssue: null
  //   });
  // };

  // // 根据 region_name 获取 region_alias
  // getRegionAlias = (regionName) => {
  //   const { clusters } = this.state;
  //   const cluster = clusters.find(c => c.region_name === regionName);
  //   return cluster ? cluster.region_alias : regionName;
  // };

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
                if (data && data.bean) {
                  if(data?.bean?.need_authz){
                    this.setState({
                      isNeedAuthz: data?.bean?.need_authz
                    })
                  }
                }
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
    const styleK8s = {
      marginRight: '8px',
      display: 'inline-block',
      marginTop: '20px'
    }
    const stylesCustom = (region_type == 'custom') ? styleK8s : ''
    switch (provider) {
      case 'ack':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={enterpriseStyles.icons}>
              {globalUtil.fetchSvg('Ack')}
            </div>
            <p>Aliyun   ACK</p>
          </span>
        );
      case 'tke':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={enterpriseStyles.icons}>
              {globalUtil.fetchSvg('Tke')}
            </div>
            <p>Tencent   TKE</p>
          </span>
        );
      case 'K3s':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={enterpriseStyles.icons}>
              <img style={{ height: '120px' }} src={K3s} alt=""></img>
            </div>
          </span>
        );
      case 'helm':
        return (
          <span style={stylesCustom} key={provider}>
            <div className={enterpriseStyles.icons}>
              {globalUtil.fetchSvg(
                region_type == 'aliyun'
                  ? globalUtil.fetchSvg('Ack')
                  : region_type == 'huawei'
                    ? globalUtil.fetchSvg('Tke')
                    : region_type == 'tencent'
                      ? globalUtil.fetchSvg('Cce')
                      : globalUtil.fetchSvg('K8s')
              )}
            </div>
            <p>
              {globalUtil.fetchSvg(
                region_type == 'aliyun'
                  ? 'Aliyun   ACK'
                  : region_type == 'huawei'
                    ? 'Huawei   CCE'
                    : region_type == 'tencent'
                      ? 'Tencent   TKE'
                      : ''
              )}
            </p>

          </span>
        );
      default:
        return (
          <span style={{ marginRight: '8px', display: 'inline-block', marginTop: '20px' }} key={provider}>
            {/* 直接对接 */}
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


  handleClickStatus = (type) => {
    if(type === 'cpu'){
      this.setState({
        typeStatusCpu: !this.state.typeStatusCpu
      })
    } else {
      this.setState({
        typeStatusMemory: !this.state.typeStatusMemory
      })
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
      hasNewVs,
      typeStatusCpu,
      typeStatusMemory,
      // platformHealth,
      // platformHealthLoading,
      // healthDetailVisible,
      // currentHealthIssue,
    } = this.state;
    const end = enterpriseAuthorization && new Date(enterpriseAuthorization.end_time).getTime();
    const current = new Date().getTime();
    const { getFieldDecorator, setFieldsValue } = form;
    const timestamp = Date.parse(new Date());
    const enterpriseVersion =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const isSaas = rainbondInfo && rainbondInfo.is_saas || false;
    const cloudSvg = globalUtil.fetchSvg('cloudSvg');
    const updataSvg = globalUtil.fetchSvg('updataSvg');
    const errorSvg = globalUtil.fetchSvg('errorSvg');
    const enterpriseInfoSvg = globalUtil.fetchSvg('enterpriseInfoSvg');
    const enterpriseDataSvg = globalUtil.fetchSvg('enterpriseDataSvg');
    const clustersInfoSvg = globalUtil.fetchSvg('clustersInfoSvg');
    const appErrorSvg = globalUtil.fetchSvg('appErrorSvg');
    const authorizationSvg = globalUtil.fetchSvg('authorizationSvg');
    const editCodeSvg = globalUtil.fetchSvg('editCodeSvg');
    const switchSvg = globalUtil.fetchSvg('switchSvg');
    // const healthSvg = globalUtil.fetchSvg('healthSvg');
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
            <div className={enterpriseStyles.cardContainer}>
              <div className={enterpriseStyles.cardHeader}>
                <span>{enterpriseInfoSvg}</span>
                <h2>{formatMessage({ id: 'enterpriseOverview.information.message' })}</h2>
              </div>
              <div className={enterpriseStyles.cardBody}>
                <div className={enterpriseStyles.enterpriseInfoContent}>
                  <div className={enterpriseStyles.enterpriseInfo_left}>
                    {enterpriseInfo && (
                      <div className={enterpriseStyles.enterpriseId}>
                        <p>
                          <span className={enterpriseStyles.infoLabel}><FormattedMessage id="enterpriseOverview.information.name" />:</span>
                          <span className={enterpriseStyles.infoValue}>{enterpriseInfo.enterprise_alias}</span>
                          {!enterpriseEdition && enterpriseVersion !== 'cloud' && (
                            <a
                              style={{ marginLeft: 24 }}
                              href="https://p5yh4rek1e.feishu.cn/share/base/shrcnDhEE6HkYddzjY4XRKuXikb"
                              target="_blank"
                            >
                              {formatMessage({id:'platformUpgrade.index.consulting'})}
                            </a>
                          )}
                          <a
                            style={{ marginLeft: 12 }}
                            onClick={() => { this.downloadClusterInfo() }}
                          >
                            {formatMessage({id:'platformUpgrade.index.platforminfo'})}
                          </a>
                        </p>
                        <p>
                          <Tooltip title={enterpriseInfo.enterprise_id}>
                            <span className={enterpriseStyles.infoLabel}><FormattedMessage id="enterpriseOverview.information.unite" />:</span>
                            <span className={enterpriseStyles.infoValue}>{enterpriseInfo.enterprise_id}</span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseVersion}>
                            <span className={enterpriseStyles.infoLabel}><FormattedMessage id="enterpriseOverview.information.versions" />:</span>
                            <span className={enterpriseStyles.infoValue}>{enterpriseVersion || '-'}</span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseInfo.create_time}>
                            <span className={enterpriseStyles.infoLabel}><FormattedMessage id="enterpriseOverview.information.time" />:</span>
                            <span className={enterpriseStyles.infoValue}>{enterpriseInfo.create_time}</span>
                          </Tooltip>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={enterpriseStyles.enterpriseInfo_right}>
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
            </div>
            {/* 数据总览卡片 */}
            <div className={enterpriseStyles.cardContainer}>
              <div className={enterpriseStyles.cardHeader}>
                <span>{enterpriseDataSvg}</span>
                <h2>{formatMessage({ id: 'enterpriseOverview.information.dataScreen' })}</h2>
              </div>
              <div className={enterpriseStyles.cardBody}>
                <div className={enterpriseStyles.enterpriseDataContent}>
                  <div className={enterpriseStyles.piece}>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.colony' })}</p>
                    <p>
                      <Link to={`/enterprise/${eid}/clusters`}>
                        {overviewMonitorInfo && overviewMonitorInfo.total_regions || 0}
                      </Link>
                    </p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.team' })}</p>
                    <p>
                      <Link to={`/enterprise/${eid}/teams`}>
                        {overviewInfo && overviewInfo.total_teams}
                      </Link>
                    </p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.user' })}</p>
                    <p>
                      <Link to={`/enterprise/${eid}/users`}>
                        {overviewInfo && overviewInfo.total_users}
                      </Link>
                    </p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.template' })}</p>
                    <p>
                      <Link to={`/enterprise/${eid}/shared/local`}>
                        {overviewInfo && overviewInfo.shared_apps}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
        {/* 平台健康检测 - 已注释 */}
        {/* {platformHealth && platformHealth.regions && Object.keys(platformHealth.regions).some(
          regionName => platformHealth.regions[regionName].issues && platformHealth.regions[regionName].issues.length > 0
        ) && (
          <div className={enterpriseStyles.cardContainer}>
            <div className={enterpriseStyles.cardHeader}>
              <span>{healthSvg}</span>
              <h2>{formatMessage({ id: 'enterpriseOverview.platformHealth.title' })}</h2>
            </div>
            <div className={enterpriseStyles.cardBody}>
              <div className={enterpriseStyles.platformHealthContent}>
                {Object.keys(platformHealth.regions).map(regionName => {
                  const regionData = platformHealth.regions[regionName];
                  const regionAlias = this.getRegionAlias(regionName);
                  if (!regionData.issues || regionData.issues.length === 0) return null;

                  return (
                    <div key={regionName} className={enterpriseStyles.regionHealthGroup}>
                      <div className={enterpriseStyles.regionHealthIssues}>
                        {regionData.issues.map((issue, index) => (
                          <div
                            key={index}
                            className={enterpriseStyles.healthIssueCard}
                          >
                            <div className={enterpriseStyles.issueIconWrapper}>
                              <Icon type="warning" theme="filled" />
                            </div>
                            <div className={enterpriseStyles.issueContent}>
                              <div className={enterpriseStyles.issueMessage}>{issue.message} - {regionAlias}</div>
                            </div>
                            <div
                              className={enterpriseStyles.issueViewDetail}
                              onClick={() => this.showHealthDetail(issue, regionAlias)}
                            >
                              {formatMessage({ id: 'enterpriseOverview.platformHealth.viewDetail' })}
                              <Icon type="right" style={{ marginLeft: 4, fontSize: 12 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )} */}

        {/* 健康问题详情弹窗 - 已注释 */}
        {/* <Modal
          title={formatMessage({ id: 'enterpriseOverview.platformHealth.detailTitle' })}
          visible={healthDetailVisible}
          onCancel={this.closeHealthDetail}
          footer={null}
          width={640}
        >
          {currentHealthIssue && (
            <div className={enterpriseStyles.healthDetailContent}>
              <div className={enterpriseStyles.healthDetailItem}>
                <span className={enterpriseStyles.healthDetailLabel}>
                  {formatMessage({ id: 'enterpriseOverview.platformHealth.cluster' })}:
                </span>
                <span className={enterpriseStyles.healthDetailValue}>{currentHealthIssue.regionAlias}</span>
              </div>
              <div className={enterpriseStyles.healthDetailItem}>
                <span className={enterpriseStyles.healthDetailLabel}>
                  {formatMessage({ id: 'enterpriseOverview.platformHealth.message' })}:
                </span>
                <span className={enterpriseStyles.healthDetailValue}>{currentHealthIssue.message}</span>
              </div>
              <div className={enterpriseStyles.healthDetailSolution}>
                <div className={enterpriseStyles.healthDetailSolutionTitle}>
                  <Icon type="bulb" style={{ marginRight: 8, color: '#faad14' }} />
                  {formatMessage({ id: 'enterpriseOverview.platformHealth.solution' })}
                </div>
                <pre className={enterpriseStyles.healthDetailSolutionContent}>
                  {currentHealthIssue.solution}
                </pre>
              </div>
            </div>
          )}
        </Modal> */}

        {/* 企业授权信息 */}
        {isNeedAuthz && !isAuthorizationLoading && (
          <div className={enterpriseStyles.cardContainer}>
            <div className={enterpriseStyles.cardHeader}>
              <span>{authorizationSvg}</span>
              <h2>{formatMessage({id:'platformUpgrade.index.info'})}</h2>
            </div>
            <div className={enterpriseStyles.cardBody}>
              <div className={enterpriseStyles.authorizationContent}>
                <div className={enterpriseStyles.authorization_code}>
                  <div className={enterpriseStyles.authorization_code_header}>
                    <div className={enterpriseStyles.authorization_title}>{formatMessage({id:'platformUpgrade.index.AuthorizationCode'})}</div>
                    <div className={enterpriseStyles.authorization_actions}>
                      <div onClick={() => { this.handleAuthorization() }} className={enterpriseStyles.authorization_svg}>
                        {editCodeSvg}
                      </div>
                    </div>
                  </div>
                  <div className={enterpriseStyles.authorization_code_content}>
                    {authorizationCode || '-'}
                  </div>
                </div>
                {enterpriseAuthorization ? (
                  <div className={enterpriseStyles.authorization_info}>
                    <div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.Authorizationtime'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>
                          {enterpriseAuthorization.end_time ? (end < current ? formatMessage({id:'platformUpgrade.index.Authorizationtimeover'}) : enterpriseAuthorization.end_time) : formatMessage({id:'platformUpgrade.index.nilimit'})}
                        </div>
                      </div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.clusterAuthorization'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>
                          {enterpriseAuthorization.expect_cluster == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.expect_cluster} 个`}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.Authorizationenterprise'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>{enterpriseAuthorization.company}</div>
                      </div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.Authorizationnode'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>
                          {enterpriseAuthorization.expect_node == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.expect_node} 个`}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.tel'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>{enterpriseAuthorization.contact}</div>
                      </div>
                      <div className={enterpriseStyles.authorization_info_content}>
                        <div className={enterpriseStyles.authorization_info_title}>{formatMessage({id:'platformUpgrade.index.Authorizationmemory'})}</div>
                        <div className={enterpriseStyles.authorization_info_desc}>
                          {enterpriseAuthorization.expect_memory == '-1' ? formatMessage({id:'platformUpgrade.index.nilimit'}) : `${enterpriseAuthorization.expect_memory} GB`}
                        </div>
                      </div>
                    </div>
                  </div>
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
          </div>
        )}
        {/* 集群信息 */}
        <div className={enterpriseStyles.cardContainer}>
          <div className={enterpriseStyles.cardHeader}>
            <span>{clustersInfoSvg}</span>
            <h2>{formatMessage({ id: 'enterpriseOverview.information.colonyInfo' })}</h2>
          </div>
          <Spin spinning={overviewAppInfoLoading}>
            <div className={enterpriseStyles.cardBody}>
              {clusters.length > 0 ?
                (clusters.map((item, index) => {
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
                  services_status,
                  node_ready,
                  region_id,
                  run_pod_number,
                  memory_used,
                  cpu_used
                } = item
                // CPU使用率
                const cpuUsed = ((used_cpu / total_cpu) * 100).toFixed(2) || 0;

                // CPU实际使用百分比
                const percentCpu = ((cpu_used / total_cpu) * 100).toFixed(2);
                // 内存实际使用百分比
                const percentMemory = ((memory_used / (total_memory / 1024)) * 100).toFixed(2);
                // 内存使用率
                const memoryUsed = ((used_memory / total_memory) * 100).toFixed(2);
                // CPU总量
                const cpuTotal = (total_cpu && parseInt(total_cpu)) || 0;
                // 内存总量
                const memoryTotal = (total_memory && this.handlUnit(total_memory)) || 0;
                //内存单位
                const memoryTotalUnit = (total_memory && this.handlUnit(total_memory, 'MB')) || 'MB';
                return (
                  <div className={enterpriseStyles.clusterInfo}>
                    <div className={enterpriseStyles.clusterInfo_title}>
                      <div className={enterpriseStyles.clusterName}>
                        {region_alias}
                        <div className={enterpriseStyles.status}>
                          {this.clusterStatus(status, health_status)}
                        </div>
                      </div>
                      <div className={enterpriseStyles.setting}>
                        <Link to={`/enterprise/${eid}/clusters/ClustersMGT/${region_id}`} >
                          {SVG.getSvg("settingSvg", 18)}
                        </Link>
                      </div>
                    </div>
                    {health_status !== 'failure' ? (
                      <div className={enterpriseStyles.clusterInfo_content}>
                        <div className={enterpriseStyles.content_left}>
                          <div className={enterpriseStyles.clusterIcon}>
                            {this.clusterIcon(provider, region_type[0])}
                          </div>
                          <div className={enterpriseStyles.clusterVersion}>
                            <p>
                              <span className={enterpriseStyles.infoLabel}>{formatMessage({ id: 'enterpriseOverview.overview.colonyVersion' })}:</span>
                              <Tooltip title={rbd_version}>
                                <span className={enterpriseStyles.infoValue}>{rbd_version || '-'}</span>
                              </Tooltip>
                            </p>
                            <p>
                              <span className={enterpriseStyles.infoLabel}>{formatMessage({ id: 'enterpriseOverview.overview.KubernetesVersion' })}:</span>
                              <span className={enterpriseStyles.infoValue}>{k8s_version == {} ? "-" : k8s_version || "-"}</span>
                            </p>
                            <p>
                              <span className={enterpriseStyles.infoLabel}>{formatMessage({ id: 'enterpriseOverview.overview.createTime' })}:</span>
                              <span className={enterpriseStyles.infoValue}>{globalUtil.fetchdayTime(create_time)}</span>
                            </p>
                          </div>
                        </div>
                        <div className={enterpriseStyles.content_right}>
                          <div className={enterpriseStyles.content_data}>
                            <p>
                              {formatMessage({ id: 'enterpriseOverview.overview.cpu_total' })}:
                              <span>{cpuTotal || 0}</span>Core 
                              {isSaas && <div onClick={()=>this.handleClickStatus('cpu')}>{switchSvg}</div>}
                            </p>
                            {typeStatusCpu ? (
                              <Charts keys={'upcpu1' + `${index}`} unit={'Core'} usedValue={cpu_used && Number(cpu_used).toFixed(2) || 0}  svalue={percentCpu} cname={formatMessage({ id: 'enterpriseColony.mgt.cluster.used' })} swidth='200px' sheight='120px' />
                            ) : (
                              <Charts keys={'upcpu2' + `${index}`} unit={'Core'} usedValue={used_cpu}  svalue={cpuUsed} cname={formatMessage({ id: 'enterpriseColony.mgt.cluster.assigned' })} swidth='200px' sheight='120px' />
                            )}
                          </div>
                          <div className={enterpriseStyles.content_data}>
                            <p>
                              {formatMessage({ id: 'enterpriseOverview.overview.memory_total' })}: 
                              <span>{memoryTotal || 0}</span>
                              {memoryTotalUnit} 
                              {isSaas && <div onClick={()=>this.handleClickStatus('memory')}>{switchSvg}</div>}
                            </p>
                            {typeStatusMemory ? (
                              <Charts keys={'memory1' + `${index}`} unit={'GB'} usedValue={memory_used && Number(memory_used).toFixed(2) || 0}  svalue={percentMemory} cname={formatMessage({ id: 'enterpriseColony.mgt.cluster.used' })} swidth='200px' sheight='120px' />
                            ) : (
                              <Charts keys={'memory2' + `${index}`} unit={'GB'} usedValue={(used_memory / 1024).toFixed(2)}  svalue={memoryUsed} cname={formatMessage({ id: 'enterpriseColony.mgt.cluster.assigned' })} swidth='200px' sheight='120px' />
                            )}
                          </div>
                          <div className={enterpriseStyles.node}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.node_total' })}</p>
                            <div className={enterpriseStyles.nodeData}>
                              <span className={enterpriseStyles.running}>{node_ready == {} ? 0 : node_ready || 0}</span>
                              <span className={enterpriseStyles.sum}>/{all_nodes || 0}</span>
                            </div>
                          </div>
                          <div className={enterpriseStyles.node}>
                            <p >{formatMessage({ id: 'enterpriseOverview.overview.pod_total' })}</p>
                            <div className={enterpriseStyles.nodeData}>
                              <span className={enterpriseStyles.running}>{run_pod_number && run_pod_number || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>) : (
                      <div className={enterpriseStyles.clusterInfo_content}>
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
        {/* 应用报警 - 只在有数据时显示 */}
        {!appAlertLoding && appAlertList.length > 0 && (
          <div className={enterpriseStyles.cardContainer}>
            <div className={enterpriseStyles.cardHeader}>
              <span>{appErrorSvg}</span>
              <h2>{formatMessage({ id: 'enterpriseOverview.information.appAlert' })}</h2>
            </div>
            <div className={enterpriseStyles.cardBody}>
              <div className={enterpriseStyles.appAlertContent}>
                <div style={{
                  height: 170,
                  overflowX: "hidden",
                  overflowY: 'scroll'
                }}>
                  {appAlertList.map(item => {
                    const { group_id, group_name, region_name, service_alias, service_cname, tenant_name, tenant_alias } = item
                    return (
                      <div className={enterpriseStyles.contentAlert}>
                        <div>
                          <span
                            className={enterpriseStyles.spanStyle}
                            onClick={() => {
                              this.onJumpAlert('team', tenant_name, region_name, group_id, service_alias)
                            }}
                          >
                            {tenant_alias}
                          </span>
                          &nbsp;
                          {formatMessage({ id: 'enterpriseOverview.team.group' })}
                          &nbsp;
                          <span
                            className={enterpriseStyles.spanStyle}
                            onClick={() => {
                              this.onJumpAlert('app', tenant_name, region_name, group_id, service_alias)
                            }}
                          >
                            {group_name}
                          </span>
                          &nbsp;{formatMessage({ id: 'enterpriseOverview.overview.component' })}&nbsp;
                          <span
                            className={enterpriseStyles.spanStyle}
                            onClick={() => {
                              this.onJumpAlert('component', tenant_name, region_name, group_id, service_alias)
                            }}
                          >
                            {service_cname}
                          </span>
                          &nbsp;
                          <span style={{ color: globalUtil.getPublicColor('error-color') }}>{formatMessage({ id: 'enterpriseOverview.overview.error' })}</span>
                        </div>
                        <div>
                          <span style={{ marginTop: '2px' }}>
                            {globalUtil.fetchSvg('runTime')}
                          </span>
                          {moment(timestamp).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
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
            title={formatMessage({id:'platformUpgrade.index.updataAuthorization'})}
            visible
            onCancel={this.handleCanceAuthorization}
            footer={[
              <Button
                onClick={this.handleCanceAuthorization}
              >
                {formatMessage({ id: 'button.close' })}
              </Button>,
              <Button
                type='primary'
                onClick={this.handleSubmit}
              >
                {formatMessage({id:'platformUpgrade.EscalationState.updata'})}
              </Button>
            ]}
          >
            <Form onSubmit={this.handleSubmit} {...formItemLayout}>
              <CodeMirrorForm
                setFieldsValue={setFieldsValue}
                Form={Form}
                style={{ marginBottom: '20px' }}
                getFieldDecorator={getFieldDecorator}
                formItemLayout={formItemLayout}
                name={"authorization_code"}
                message={formatMessage({ id: 'notification.hint.confiuration.editContent' })}
                data={authorizationCode}
              />
            </Form>
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
      <ScrollerX sm={1100}>
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
