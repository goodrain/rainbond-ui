/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-param-reassign */
/* eslint-disable react/sort-comp */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
import {
  Card,
  Col,
  Empty,
  Icon,
  notification,
  Pagination,
  Row,
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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import moment from 'moment';
import AddTeam from '../../../public/images/addTeam.png';
import Arrow from '../../../public/images/arrow.png';
import Cpus from '../../../public/images/cpus.png';
import CreationTeam from '../../../public/images/creationTeam.png';
import CustomerService from '../../../public/images/CustomerService.png';
import Element from '../../../public/images/element.png';
import EnterpriseBj from '../../../public/images/enterpriseBj.png';
import EnterpriseInfo from '../../../public/images/enterpriseInfo.png';
import Memory from '../../../public/images/memory.png';
import Records from '../../../public/images/records.png';
import Team from '../../../public/images/team.png';
import TeamCrew from '../../../public/images/teamCrew.png';
import User from '../../../public/images/user.png';
import ConfirmModal from '../../components/ConfirmModal';
import Consulting from '../../components/Consulting';
import Convenient from '../../components/Convenient';
import CreateTeam from '../../components/CreateTeam';
import CustomFooter from "../../layouts/CustomFooter";
import InstallStep from '../../components/Introduced/InstallStep';
import { fetchAllVersion } from '../../services/api'
import JoinTeam from '../../components/JoinTeam';
import Meiqia from '../../layouts/Meiqia';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import SVG from '../../utils/pageHeaderSvg'
import userUtil from '../../utils/user';
import cookie from '../../utils/cookie';
import Rke from '../../../public/images/rke.svg'
import K3s from '../../../public/images/k3s.png'
import Charts from '../../components/ClusterEcharts/Echarts'
import CodeMirrorForm from '../../components/CodeMirrorForm';
import styles from '../List/BasicList.less';
import enterpriseStyles from './index.less'
import styleSvg from './svg.less'


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
      isNewbieGuide: false,
      consulting: false,
      eid: params ? params.eid : '',
      adminer,
      enterpriseInfo: false,
      enterpriseInfoLoading: true,
      overviewAppInfo: false,
      overviewInfo: false,
      overviewTeamInfo: false,
      overviewAppInfoLoading: true,
      overviewInfoLoading: true,
      overviewTeamInfoLoading: true,
      overviewMonitorInfoLoading: true,
      joinTeam: false,
      collectionList: [],
      convenientVisible: false,
      editorConvenient: false,
      delcollectionVisible: false,
      collectionInfo: false,
      collectionInfoLoading: true,
      page_size: 6,
      page: 1,
      total: 0,
      showMarketCloudAuth: false,
      showClusterIntroduced: false,
      marketName: '',
      guideStep: 1,
      clusters: [],
      appAlertList: [],
      appAlertLoding: true,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      isAuthorizationCode: false,
      enterpriseAuthorization: null,
      isAuthorizationLoading: true,
      isNeedAuthz: false,
      authorizationCode: '',
      hasNewVs: false
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
    this.interval = setInterval(() => this.handleAppAlertInfo(), 15000);
  }
  // 组件销毁停止计时器
  componentWillUnmount() {
    // 组件销毁  清除定时器
    clearInterval(this.interval)
  }
  fetchAllVersion = () => {
    const { rainbondInfo } = this.props
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    fetchAllVersion().then(res => {
      if (res) {
        let list = res
        const isNewVs = list[0].split('-')[0] === currentVersion
        this.setState({
          hasNewVs: isNewVs
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
        if (error && error.data && error.data.code === 400) {
          this.setState({
            authorizationCode: error.data.data.bean.authz_code,
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
  // 获取新手引导的配置
  handleLoadNewGuideConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchNewbieGuideConfig',
      callback: res => {
        this.setState({
          showClusterIntroduced: rainbondUtil.handleNewbie(
            res.list || [],
            'successInstallClusters'
          )
        });
      },
      handleError: error => { }
    });
  };
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
                  this.setState({
                    isNeedAuthz: data.bean.need_authz
                  })
                }
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
  handleClusterIntroduced = () => {
    this.putNewbieGuideConfig('successInstallClusters');
    this.setState({
      showClusterIntroduced: false
    });
  };
  putNewbieGuideConfig = configName => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/putNewbieGuideConfig',
      payload: {
        arr: [{ key: configName, value: true }]
      }
    });
  };
  // 开始安装
  onStartInstall = type => {
    const { dispatch } = this.props;
    const { eid } = this.state;
    this.handleClusterIntroduced();
    // 从应用商店安装应用
    if (type === '2' && eid) {
      dispatch(routerRedux.push(`/enterprise/${eid}/shared/local?init=true`));
    } else {
      // 自定义安装
      this.fetchMyTeams();
    }
  };
  // 查看演示示例
  onViewInstance = () => {
    this.fetchMyTeams(true);
  };
  fetchMyTeams = (isNext = false) => {
    const { dispatch } = this.props;
    const { clusters, eid } = this.state;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res && res.list.length > 0) {
            const teamName = res.list[0].team_name;
            if (isNext && teamName) {
              this.fetchApps(teamName, true);
            } else if (teamName) {
              dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${clusters[0].region_name}/create/code`
                )
              );
            }
          } else {
            return notification.warn({
              message: formatMessage({ id: 'notification.warn.create_team' })
            });
          }
        }
      }
    });
  };
  fetchApps = (teamName = '', isNext = false) => {
    const { dispatch } = this.props;
    const { clusters, eid } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseApps',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res && res.list.length > 0) {
            const groupId = res.list[0].ID;
            if (isNext && groupId && teamName) {
              dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${clusters[0].region_name}/apps/${groupId}`
                )
              );
            }
          } else {
            return notification.warn({
              message: formatMessage({ id: 'notification.warn.app' })
            });
          }
        }
      }
    });
  };

  onPageChangeCollectionView = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.fetchCollectionViewInfo();
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
            overviewMonitorInfo: res.bean,
            overviewMonitorInfoLoading: false
          });
        }
      }
    });
  };

  getOverviewTeam = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;
    dispatch({
      type: 'global/fetchOverviewTeam',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            overviewTeamInfo: res.bean,
            overviewTeamInfoLoading: false
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
            overviewInfo: res.bean,
            overviewInfoLoading: false
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
            enterpriseInfoLoading: false,
            isNewbieGuide: rainbondUtil.isEnableNewbieGuide(res.bean)
          });
        }
      }
    });
  };


  loading = () => {
    const { adminer, eid } = this.state;
    if (eid) {
      this.getEnterpriseInfo();
      this.getOverviewTeam();
      this.handleLoadNewGuideConfig();
      this.handleLoadEnterpriseClusters(eid);
      this.handleAppAlertInfo();
      if (adminer) {
        this.getOverviewApp();
        this.getOverview();
        this.getOverviewMonitor();
        this.fetchMarkets();
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
            total: res.list.length,
            collectionInfoLoading: false,
            collectionList: res.list
          });
        }
      }
    });
  };

  fetchMarkets = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (
            res.list.length > 0 &&
            res.list[0].access_key === '' &&
            res.list[0].domain === 'rainbond'
          ) {
            this.setState({
              showMarketCloudAuth: true,
              marketName: res.list[0].name
            });
          }
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

  handleIsConvenientEntrance = () => {
    this.setState({ editorConvenient: !this.state.editorConvenient });
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
      collectionInfo: false,
      editorConvenient: false
    });
  };
  handleGuideStep = guideStep => {
    this.setState({
      guideStep
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
      dispatch(routerRedux.push(`/team/${team}/region/${region}/components/${component}/overview`));
    } else if (key == 'team') {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/index`));
    } else {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/apps/${group}`));
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
      case 'rke':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={enterpriseStyles.icons}>
              <img src={Rke} alt=""></img>
            </div>
            <p>Rancher   RKE</p>
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

  renderContent = () => {
    const { rainbondInfo, navigation_status, form } = this.props;
    const {
      enterpriseInfo,
      overviewInfo,
      overviewMonitorInfo,
      overviewAppInfo,
      overviewTeamInfo,
      enterpriseInfoLoading,
      overviewAppInfoLoading,
      overviewInfoLoading,
      overviewTeamInfoLoading,
      overviewMonitorInfoLoading,
      collectionList,
      convenientVisible,
      editorConvenient,
      delcollectionVisible,
      collectionInfoLoading,
      eid,
      total,
      page_size,
      page,
      language,
      clusters,
      appAlertList,
      appAlertLoding,
      isAuthorizationCode,
      enterpriseAuthorization,
      isAuthorizationLoading,
      isNeedAuthz,
      authorizationCode,
      hasNewVs
    } = this.state;
    const end = enterpriseAuthorization && new Date(enterpriseAuthorization.end_time).getTime();
    const current = new Date().getTime();
    const { getFieldDecorator, setFieldsValue } = form;
    const colors = { color: '#3D54C4', cursor: 'pointer' };
    const timestamp = Date.parse(new Date());
    const enterpriseVersion =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const cloudSvg = (
      <svg t="1610274780071" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="35827" width="160" height="144">
        <path className={styleSvg.icon_path} stroke={globalUtil.getPublicColor()} stroke-width="3" d="M722.944 501.76h173.568c13.312 0 24.576-10.752 24.576-24.576 0-13.312-10.752-24.576-24.576-24.576h-173.568c-27.136 0-53.76 9.216-75.264 25.088L296.96 734.72c-3.072 2.048-6.144 3.584-9.728 4.096-8.704 1.024-17.408 1.536-26.112 1.536-39.424-1.536-75.776-18.432-102.912-48.128-27.136-30.208-40.448-69.12-37.376-109.056 5.12-69.632 55.808-123.392 121.344-132.608 1.536 29.184 7.68 57.344 18.944 84.48 4.096 9.216 12.8 15.36 22.528 15.36 3.072 0 6.144-0.512 9.216-2.048 12.288-5.12 18.432-19.456 13.312-31.744-10.24-25.088-15.36-51.712-15.36-78.848C290.816 323.584 384 230.4 498.176 230.4c92.672 0 174.592 61.952 199.68 151.04 3.584 12.8 17.408 20.48 30.208 16.896 12.8-3.584 20.48-17.408 16.896-30.208-30.72-110.08-132.096-186.88-246.784-186.88-129.024 0-236.032 95.744-253.44 219.648-93.184 8.192-165.888 82.432-173.056 178.688-3.584 52.736 14.336 105.984 50.176 145.408 35.84 39.936 84.48 62.464 137.728 64.512H266.24c9.728 0 18.944-0.512 28.672-2.048 11.776-1.536 23.04-6.656 32.256-13.312l350.72-257.024c12.288-9.728 28.672-15.36 45.056-15.36zM897.024 740.352h-301.568c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h301.568c13.312 0 24.576-10.752 24.576-24.576 0-13.824-11.264-24.576-24.576-24.576z" fill={globalUtil.getPublicColor()} p-id="35828"></path>
        <path className={styleSvg.icon_path} stroke={globalUtil.getPublicColor()} stroke-width="3" d="M643.072 598.016c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h141.312c13.312 0 24.576-10.752 24.576-24.576 0-13.312-10.752-24.576-24.576-24.576h-141.312zM928.256 598.016h-62.464c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h62.464c13.312 0 24.576-10.752 24.576-24.576 0-13.312-11.264-24.576-24.576-24.576zM510.464 740.352H448c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h62.464c13.312 0 24.576-10.752 24.576-24.576 0-13.824-11.264-24.576-24.576-24.576z" fill={globalUtil.getPublicColor()} p-id="35829"></path>
      </svg>
    )
    const updataSvg = (
      <svg t="1729738917523" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23508" width="160" height="100">
        <path className={styleSvg.icon_updata} stroke={globalUtil.getPublicColor("rbd-success-status")} stroke-width="3" d="M512 536.96l181.056 181.056-60.416 60.352-77.952-78.016v238.336H469.312v-238.4l-77.952 78.08-60.416-60.352L512 536.96z m0-451.648a298.688 298.688 0 0 1 296.704 264.32 234.688 234.688 0 0 1-40.64 460.096v-85.952a149.312 149.312 0 1 0-47.488-294.784 213.312 213.312 0 1 0-417.152 0 149.312 149.312 0 0 0-55.104 293.504l7.68 1.28v85.952a234.688 234.688 0 0 1-40.704-460.16A298.688 298.688 0 0 1 512 85.376z" p-id="23509" fill={globalUtil.getPublicColor("rbd-success-status")}></path>
      </svg>
    )
    const errorSvg = (
      <svg t="1666323029464" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6854" width="100" height="100">
        <path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-77.44c240 0 434.56-194.56 434.56-434.56 0-240-194.56-434.56-434.56-434.56C272 77.44 77.44 272 77.44 512c0 240 194.56 434.56 434.56 434.56zM511.658667 210.773333h0.682666a42.666667 42.666667 0 0 1 42.666667 42.666667v344.917333a42.666667 42.666667 0 0 1-42.666667 42.666667h-0.682666a42.666667 42.666667 0 0 1-42.666667-42.666667V253.482667a42.666667 42.666667 0 0 1 42.666667-42.666667zM512 813.226667a43.008 43.008 0 1 1 0-86.058667 43.008 43.008 0 0 1 0 86.058667z"
          fill={globalUtil.getPublicColor('rbd-error-status')} p-id="6855">
        </path>
      </svg>
    )
    const enterpriseInfoSvg = (
      <svg
        t="1667907351951"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5557"
        width="22"
        height="22">
        <path d="M832 896V212.8c0-8.8-7.2-16-16-16H640V80c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16v816h-64v64h768v-64h-64z m-64-635.2V864H640V768h64v-64h-64v-64h64v-64h-64v-64h64v-64h-64v-64h64v-64h-64v-59.2h128zM256 128h320v736H256V128z m64 64h64v64h-64v-64z m128 0h64v64h-64v-64zM320 320h64v64h-64v-64z m128 0h64v64h-64v-64zM320 448h64v64h-64v-64z m128 0h64v64h-64v-64zM320 576h64v64h-64v-64z m128 0h64v64h-64v-64zM320 704h64v64h-64v-64z m128 0h64v64h-64v-64z"
          p-id="5558"
          fill={globalUtil.getPublicColor()}>
        </path>
      </svg>
    )
    const enterpriseDataSvg = (
      <svg
        t="1667908843097"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="9646"
        width="22"
        height="22"
      >
        <path d="M651.324 798.725c0-10.753-7.756-19.458-17.308-19.458H391.775c-9.55 0-17.303 8.705-17.303 19.458v77.824H201.436v58.363h622.906v-58.363H651.324v-77.824zM902.027 89.647H123.769c-32.243 0-58.366 26.104-58.366 58.348V692.77c0 32.221 26.123 58.368 58.366 58.368h778.259c32.243 0 58.368-26.146 58.368-58.368V147.995c0-32.245-26.125-58.348-58.369-58.348z m0 583.63c0 10.734-8.723 19.452-19.457 19.452H143.227c-10.753 0-19.453-8.718-19.453-19.452V167.433c0-10.757 8.7-19.457 19.453-19.457h739.344c10.733 0 19.457 8.7 19.457 19.457v505.844h-0.001z m-199.315-37.223h105.26V329.596h-105.26v306.458z m-168.417 0h105.26V235.301h-105.26v400.753z m-315.782 0h105.26V518.187h-105.26v117.867z m147.364 0h105.261V423.87H365.877v212.185z m0 0"
          fill={globalUtil.getPublicColor()}
          p-id="9647">
        </path>
      </svg>
    )
    const clustersInfoSvg = (
      <svg
        t="1667910445619"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="16493"
        width="22"
        height="22"
      >
        <path d="M512 880.94c-203.44 0-368.94-165.5-368.94-368.94S308.56 143.06 512 143.06 880.94 308.56 880.94 512 715.44 880.94 512 880.94z m0-685.18c-174.37 0-316.23 141.86-316.23 316.24S337.63 828.24 512 828.24 828.24 686.38 828.24 512 686.37 195.76 512 195.76z" fill={globalUtil.getPublicColor()} p-id="16494">
        </path>
        <path d="M512 643.76c-72.66 0-131.76-59.11-131.76-131.76S439.34 380.24 512 380.24 643.77 439.34 643.77 512 584.65 643.76 512 643.76z m0-210.82c-43.6 0-79.06 35.46-79.06 79.06s35.46 79.06 79.06 79.06 79.06-35.46 79.06-79.06-35.47-79.06-79.06-79.06z" fill={globalUtil.getPublicColor()} p-id="16495"></path>
        <path d="M512 960c-14.55 0-26.35-11.8-26.35-26.35V617.41c0-14.55 11.8-26.35 26.35-26.35s26.35 11.8 26.35 26.35v316.24c0 14.55-11.8 26.35-26.35 26.35zM512 432.94c-14.55 0-26.35-11.8-26.35-26.35V90.35C485.64 75.8 497.44 64 512 64c14.55 0 26.35 11.8 26.35 26.35v316.24c0 14.55-11.8 26.35-26.35 26.35zM810.14 836.5c-6.74 0-13.49-2.57-18.63-7.72L567.89 605.17c-10.29-10.29-10.29-26.98 0-37.26 10.28-10.29 26.96-10.29 37.27 0l223.61 223.61c10.29 10.29 10.29 26.98 0 37.26-5.14 5.15-11.88 7.72-18.63 7.72zM437.47 463.83c-6.74 0-13.49-2.57-18.63-7.72L195.22 232.49c-10.29-10.29-10.29-26.98 0-37.26 10.28-10.29 26.98-10.29 37.26 0L456.1 418.84c10.29 10.29 10.29 26.98 0 37.26-5.14 5.16-11.89 7.73-18.63 7.73zM933.65 538.35H617.41c-14.55 0-26.35-11.8-26.35-26.35s11.8-26.35 26.35-26.35h316.23c14.55 0 26.35 11.8 26.35 26.35 0.01 14.55-11.79 26.35-26.34 26.35zM406.59 538.35H90.35C75.8 538.35 64 526.55 64 512s11.8-26.35 26.35-26.35h316.23c14.55 0 26.35 11.8 26.35 26.35 0.01 14.55-11.79 26.35-26.34 26.35zM586.53 463.82c-6.74 0-13.49-2.57-18.63-7.72-10.29-10.29-10.29-26.98 0-37.26l223.61-223.61c10.29-10.29 26.97-10.29 37.26 0s10.29 26.98 0 37.26L605.16 456.1a26.284 26.284 0 0 1-18.63 7.72zM213.85 836.5c-6.74 0-13.49-2.57-18.63-7.72-10.29-10.29-10.29-26.98 0-37.26l223.63-223.63c10.28-10.29 26.97-10.29 37.26 0s10.29 26.98 0 37.26L232.48 828.78c-5.14 5.15-11.89 7.72-18.63 7.72z" fill={globalUtil.getPublicColor()} p-id="16496"></path>
      </svg>
    )
    const appErrorSvg = (
      <svg
        t="1667909488849"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="15021"
        width="22"
        height="22">
        <path d="M764.5696 353.28l4.4544 4.5056 93.8496-94.6176c8.96-9.0112 8.96-18.0224 8.96-27.0336a64.6656 64.6656 0 0 0-8.96-27.0336 40.3968 40.3968 0 0 0-49.152 4.5056l-93.7984 94.4128 8.9088 4.5056c8.96 18.0224 22.3232 27.0336 35.7376 40.7552zM188.16 519.7824H58.5728a35.84 35.84 0 0 0 0 72.0896h129.5872z m361.9328-419.0208a35.3792 35.3792 0 0 0-35.84-35.84 38.6048 38.6048 0 0 0-35.84 35.84V240.64h71.68zM264.1408 357.5808l4.4544-4.5056A171.4176 171.4176 0 0 1 308.8384 312.32l8.9088-4.5056-98.304-98.9184c-17.8688-13.5168-40.192-13.5168-53.6064 0a64.6656 64.6656 0 0 0-8.96 27.0336 64.6656 64.6656 0 0 0 8.96 27.0336z m705.9968 162.2016h-129.5872v72.0896h129.5872a35.84 35.84 0 0 0 0-72.0896zM599.04 600.8832h-80.2304l44.6976-45.056c8.96-9.0112 8.96-18.0224 8.96-27.0336a64.6656 64.6656 0 0 0-8.96-27.0336 34.8672 34.8672 0 0 0-49.152 0l-107.2128 103.6288a35.5328 35.5328 0 0 0 0 49.5616q13.3632 13.5168 40.192 13.5168h75.9808L460.8 740.5568c-8.96 9.0112-8.96 18.0224-8.96 27.0336A64.6656 64.6656 0 0 0 460.8 794.624c8.8576 9.216 17.8176 9.216 26.7264 9.216a63.232 63.232 0 0 0 26.8288-9.0112l107.52-108.1344a58.5216 58.5216 0 0 0 17.8688-45.056c-0.256-22.7328-13.6704-40.7552-40.704-40.7552z m259.1744 292.864h-57.9072v-328.9088C800.3072 407.1424 670.72 276.48 514.3552 276.48s-285.952 130.6624-285.952 288.3584v328.9088H170.2912a35.84 35.84 0 0 0 0 72.0896h688.128a35.84 35.84 0 0 0 0-72.0896z m-129.5872 0H299.8784v-306.3808c0-58.5728 22.3232-112.64 62.5664-157.696a204.544 204.544 0 0 1 303.8208 0c40.2432 40.5504 62.5664 99.1232 62.5664 157.696z"
          fill={globalUtil.getPublicColor()}
          p-id="15022">
        </path>
      </svg>
    )
    const authorizationSvg = (
      <svg
        t="1728530192942"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="12692"
        width="22"
        height="22"
      >
        <path
          d="M893.531011 131.215191L515.361232 2.361034A54.732548 54.732548 0 0 0 498.575845 0.006648c-6.093705 0-12.242807 0.803261-16.785386 2.354386L103.592981 131.215191c-9.223653 3.129948-16.813085 13.82163-16.813085 23.599257v536.85539c0 9.805325 6.370691 22.7129 14.043219 28.834304l383.626415 298.923917a22.989886 22.989886 0 0 0 13.987822 4.570279c5.124252 0 10.248503-1.578824 14.04322-4.570279l383.626414-298.923917c7.64483-6.010609 13.987822-18.918183 13.987822-28.806605V154.786749c0.221589-9.777626-7.340144-20.358514-16.563797-23.599257z m-63.319132 539.098982l-331.663732 258.42848-331.636033-258.42848V194.451227L498.575845 81.357606l331.663732 113.093621v475.862946z m-451.62662-223.694363a17.921032 17.921032 0 0 0-14.4587-7.340144h-61.435624c-7.22935 0-11.467244 8.226501-7.229349 14.126316l140.653785 193.641318a17.893333 17.893333 0 0 0 28.945098 0l236.601937-325.736219a8.946667 8.946667 0 0 0-7.229349-14.126315h-61.435624c-5.678225 0-11.134861 2.769866-14.4587 7.340144l-167.936963 231.256096-72.016511-99.161196z"
          p-id="12693"
          fill={globalUtil.getPublicColor()}
        >
        </path>
      </svg>
    )
    const editCodeSvg = (
      <svg
        t="1728539678643"
        class="icon"
        viewBox="0 0 1117 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="14617"
        width="28"
        height="28"
      >
        <path
          d="M965.694 933.837H142.041A44.757 44.757 0 0 1 97.016 889.5c0-20.134 13.96-36.473 32.638-41.88a55.994 55.994 0 0 1-30.299-22.053 53.962 53.962 0 0 1-4.64-51.852l82.189-191.186a33.06 33.06 0 0 1 8.169-11.89l448.721-442.047a133.773 133.773 0 0 1 94.385-38.468c35.514 0 68.996 13.654 94.231 38.43a129.86 129.86 0 0 1 39.005 93.004 129.63 129.63 0 0 1-39.005 92.812L373.46 756.611a36.013 36.013 0 0 1-12.004 7.862l-191.838 80.693h796.077c24.776 0 44.988 19.867 44.988 44.335 0 24.43-20.212 44.336-44.988 44.336zM786.283 221.559a56.378 56.378 0 0 0-17.105-40.462 58.104 58.104 0 0 0-75.363-5.523l80.924 79.735c7.363-9.742 11.544-21.401 11.544-33.75z m-64.164 86.752l-82.112-80.923-369.754 364.193 82.112 80.923L722.12 308.311zM288.51 714.538l-60.865-59.982-45.026 104.433 105.89-44.45z"
          p-id="14618"
          fill={globalUtil.getPublicColor()}
        >
        </path>
      </svg>
    )
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
      <div>
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
        <div>
          <div className={enterpriseStyles.title}>
            <div>
              <span>{enterpriseInfoSvg}</span>
              <h2 className={enterpriseStyles.rbd_title}>{formatMessage({ id: 'enterpriseOverview.information.message' })}</h2></div>
            <div>
              <span>{enterpriseDataSvg}</span>
              <h2 className={enterpriseStyles.rbd_title}>{formatMessage({ id: 'enterpriseOverview.information.dataScreen' })}</h2></div>
          </div>
          <Card
            style={{ marginBottom: '20px', background: 'transparent' }}
            loading={enterpriseInfoLoading}
            bordered={false}
            bodyStyle={{ padding: 0 }}
          >
            <Fragment>
              <div className={enterpriseStyles.enterpriseBox}>
                <div className={enterpriseStyles.enterpriseInfo} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                  <div className={enterpriseStyles.enterpriseInfo_left} >
                    {enterpriseInfo && (
                      <div className={enterpriseStyles.enterpriseId}>
                        {/* 企业名称 */}
                        <p>
                          <FormattedMessage id="enterpriseOverview.information.name" />:&nbsp;
                          <span style={{ color: '#444444' }}>{enterpriseInfo.enterprise_alias}</span>
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
                            {/* 联合云id */}
                            <FormattedMessage id="enterpriseOverview.information.unite" />:&nbsp;
                            <span>
                              {enterpriseInfo.enterprise_id}
                            </span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseVersion}>
                            {/* 平台版本 */}
                            <FormattedMessage id="enterpriseOverview.information.versions" />:&nbsp;
                            <span>
                              {enterpriseVersion || '-'}
                            </span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseInfo.create_time}>
                            {/* 创建时间 */}
                            <FormattedMessage id="enterpriseOverview.information.time" />:&nbsp;
                            <span>
                              {enterpriseInfo.create_time}
                            </span>
                          </Tooltip>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={enterpriseStyles.enterpriseInfo_right}>
                    {!hasNewVs ? (<div onClick={this.handleRouteupdate}>
                      <Tooltip placement="top" title={formatMessage({id:'platformUpgrade.index.clicktoupload'})}>
                      {updataSvg}
                      <div className={enterpriseStyles.jumpText}>
                        <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char1}`}>{formatMessage({id:'platformUpgrade.index.have'})}</span>
                        <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char2}`}>{formatMessage({id:'platformUpgrade.index.new'})}</span>
                        <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char3}`}>{formatMessage({id:'platformUpgrade.index.ban'})}</span>
                        <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char4}`}>{formatMessage({id:'platformUpgrade.index.ben'})}</span>
                        <span className={`${enterpriseStyles.jump} ${enterpriseStyles.char5}`}>！</span>
                      </div>
                      </Tooltip>
                    </div>) : (
                      cloudSvg
                    )}

                  </div>
                </div>
                <div className={enterpriseStyles.enterpriseData} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                  <div className={enterpriseStyles.piece}>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.colony' })}</p>
                    <p>
                      <Link to={`/enterprise/${eid}/clusters`} >
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
            </Fragment>
          </Card>
        </div>
        {/* 企业授权信息 */}
        {isNeedAuthz && !isAuthorizationLoading &&
          <div style={{ marginBottom: '24px' }}>
            <div className={enterpriseStyles.title}>
              <div>
                <span>{authorizationSvg}</span>
                <h2 className={enterpriseStyles.rbd_title}>{formatMessage({id:'platformUpgrade.index.info'})}</h2>
              </div>
            </div>
            <Card
              style={{ marginBottom: '20px', background: 'transparent' }}
              // loading={overviewAppInfoLoading}
              bordered={false}
              bodyStyle={{ padding: 0 }}
            >
              <div className={enterpriseStyles.authorization} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                <div className={enterpriseStyles.authorization_code}>
                  <div className={enterpriseStyles.authorization_title}>{formatMessage({id:'platformUpgrade.index.AuthorizationCode'})}</div>
                  <div className={enterpriseStyles.authorization_code_content}>
                    {authorizationCode || '-'}
                  </div>
                  <div onClick={() => { this.handleAuthorization() }} className={enterpriseStyles.authorization_svg}>
                    {editCodeSvg}
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

            </Card>
          </div>}
        {/* 集群信息 */}
        <div style={{ marginBottom: '24px' }}>
          <div className={enterpriseStyles.title}>
            <div>
              <span>{clustersInfoSvg}</span>
              <h2 className={enterpriseStyles.rbd_title}>{formatMessage({ id: 'enterpriseOverview.information.colonyInfo' })}</h2>
            </div>
          </div>
          <Card
            style={{ marginBottom: '20px', background: 'transparent' }}
            loading={overviewAppInfoLoading}
            bordered={false}
            bodyStyle={{ padding: 0 }}
          >
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
                  region_id
                } = item
                // CPU使用率
                const cpuUsed = ((used_cpu / total_cpu) * 100).toFixed(2) || 0;
                // 内存使用率
                const memoryUsed = ((used_memory / total_memory) * 100).toFixed(2);
                // CPU总量
                const cpuTotal = (total_cpu && parseInt(total_cpu)) || 0;
                // 内存总量
                const memoryTotal = (total_memory && this.handlUnit(total_memory)) || 0;
                //内存单位
                const memoryTotalUnit = (total_memory && this.handlUnit(total_memory, 'MB')) || 'MB';
                return (
                  <div className={enterpriseStyles.clusterInfo} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
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
                              <span className={language ? enterpriseStyles.versionName : enterpriseStyles.versionName_en}>{formatMessage({ id: 'enterpriseOverview.overview.colonyVersion' })}:</span>
                              <span className={language ? enterpriseStyles.version : enterpriseStyles.version_en}>{rbd_version || '-'}</span>
                            </p>
                            <p>
                              <span className={language ? enterpriseStyles.k8sName : enterpriseStyles.k8sName_en}>{formatMessage({ id: 'enterpriseOverview.overview.KubernetesVersion' })}:</span>
                              <span className={language ? enterpriseStyles.k8sVersion : enterpriseStyles.k8sVersion_en}>{k8s_version == {} ? "-" : k8s_version || "-"} </span>
                            </p>
                            <p>
                              <span className={language ? enterpriseStyles.versionName : enterpriseStyles.createTime_en}>{formatMessage({ id: 'enterpriseOverview.overview.createTime' })}:</span>
                              <span className={language ? enterpriseStyles.version : enterpriseStyles.createTimeVersion_en}>
                                {globalUtil.fetchdayTime(create_time)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className={enterpriseStyles.content_right}>
                          <div className={enterpriseStyles.content_data}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.cpu_total' })}: <span>{cpuTotal || 0}</span>Core</p>
                            <Charts keys={'upcpu' + `${index}`} svalue={cpuUsed || 0} cname="CPU" swidth='200px' sheight='120px' />
                          </div>
                          <div className={enterpriseStyles.content_data}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.memory_total' })}: <span>{memoryTotal || 0}</span>{memoryTotalUnit}</p>
                            <Charts keys={'memory' + `${index}`} svalue={memoryUsed || 0} cname={formatMessage({ id: 'enterpriseOverview.overview.memory' })} swidth='200px' sheight='120px' />
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
                              <span className={enterpriseStyles.running}>{services_status && services_status.running || 0}</span>
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
                <div className={enterpriseStyles.clusterInfo_Empty} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                  <Empty description={formatMessage({ id: 'enterpriseOverview.overview.no_cluster' })} />
                </div>
              )}

          </Card>
        </div>
        {/* 应用报警 */}
        <div>
          <div className={enterpriseStyles.title}>
            <div>
              <span>{appErrorSvg}</span>
              <h2 className={enterpriseStyles.rbd_title}>{formatMessage({ id: 'enterpriseOverview.information.appAlert' })}</h2>
            </div>
          </div>
          <Card
            style={{ marginBottom: '20px', background: 'transparent', }}
            loading={overviewAppInfoLoading}
            bordered={false}
            bodyStyle={{ padding: 0, }}
          >
            {appAlertList.length > 0 && (
              <div className={enterpriseStyles.appAlert} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
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
            )}
            {appAlertLoding && (
              <div className={enterpriseStyles.clusterInfo_Empty} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                <Spin></Spin>
              </div>
            )}
            {!appAlertLoding && appAlertList.length == 0 && (
              <div className={enterpriseStyles.clusterInfo_Empty} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                <Empty description={formatMessage({ id: 'enterpriseOverview.overview.no_errorInfo' })} />
              </div>
            )}
          </Card>
        </div>


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
                mode={'yaml'}
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
      eid,
      isNewbieGuide,
      showClusterIntroduced,
      clusters,
    } = this.state;
    const { rainbondInfo } = this.props;
    return (
      <div>
        {this.renderContent()}
        {rainbondInfo &&
          rainbondInfo.is_public &&
          rainbondInfo.is_public.value &&
          rainbondInfo.is_public.enable && (
            <div className={styles.customerService}>
              <Meiqia />
              <div
                onClick={() => {
                  _MEIQIA && _MEIQIA('showPanel');
                }}
              >
                <img src={CustomerService} alt="" />
              </div>
            </div>
          )}
        {consulting && (
          <Consulting
            name={enterpriseInfo && enterpriseInfo.enterprise_alias}
            onOk={this.cancelConsulting}
            onCancel={this.cancelConsulting}
          />
        )}
        {/* 安装集群成功的弹窗 */}
        {/* {eid &&
          isNewbieGuide &&
          showClusterIntroduced &&
          clusters &&
          clusters.length &&
          clusters[0].status === '1' && (
            <InstallStep
              isCluster
              onCancel={this.handleClusterIntroduced}
              eid={eid}
              onStartInstall={this.onStartInstall}
              onViewInstance={this.onViewInstance}
            />
          )} */}
        <CustomFooter />
      </div>
    );
  }
}
