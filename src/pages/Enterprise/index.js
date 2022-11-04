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
  Tooltip
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
// import AuthCompany from '../../components/AuthCompany';
import { Pie } from '../../components/Charts';
import ConfirmModal from '../../components/ConfirmModal';
import Consulting from '../../components/Consulting';
import Convenient from '../../components/Convenient';
import CreateTeam from '../../components/CreateTeam';
import CustomFooter from "../../layouts/CustomFooter";
import InstallStep from '../../components/Introduced/InstallStep';
import JoinTeam from '../../components/JoinTeam';
import Meiqia from '../../layouts/Meiqia';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import userUtil from '../../utils/user';
import cookie from '../../utils/cookie';
import Rke from '../../../public/images/rke.svg'
import K3s from '../../../public/images/k3s.png'
import Charts from './chart'
import styles from '../List/BasicList.less';
import enterpriseStyles from './index.less'
import styleSvg from './svg.less'

@connect(({ user, global, index }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  overviewInfo: index.overviewInfo
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
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    this.loading();
    this.interval = setInterval(() => this.handleAppAlertInfo(), 15000);
  }
  // 组件销毁停止计时器
  componentWillUnmount() {
    // 组件销毁  清除定时器
    clearTimeout(this.interval)
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
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
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
      display:'inline-block', 
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
          <span style={{ marginRight: '8px', display:'inline-block', marginTop: '20px' }} key={provider}>
            {/* 直接对接 */}
            {globalUtil.fetchSvg('K8s')}
          </span>
        );
    }
  }
  renderContent = () => {
    const { rainbondInfo } = this.props;
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
      appAlertLoding
    } = this.state;
    const colors = { color: '#3D54C4', cursor: 'pointer' };
    const timestamp = Date.parse(new Date());
    const enterpriseVersion =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const cloudSvg = (
      <svg t="1610274780071" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="35827" width="300" height="144">
        <path className={styleSvg.icon_path} stroke="#3d54c4" stroke-width="3" d="M722.944 501.76h173.568c13.312 0 24.576-10.752 24.576-24.576 0-13.312-10.752-24.576-24.576-24.576h-173.568c-27.136 0-53.76 9.216-75.264 25.088L296.96 734.72c-3.072 2.048-6.144 3.584-9.728 4.096-8.704 1.024-17.408 1.536-26.112 1.536-39.424-1.536-75.776-18.432-102.912-48.128-27.136-30.208-40.448-69.12-37.376-109.056 5.12-69.632 55.808-123.392 121.344-132.608 1.536 29.184 7.68 57.344 18.944 84.48 4.096 9.216 12.8 15.36 22.528 15.36 3.072 0 6.144-0.512 9.216-2.048 12.288-5.12 18.432-19.456 13.312-31.744-10.24-25.088-15.36-51.712-15.36-78.848C290.816 323.584 384 230.4 498.176 230.4c92.672 0 174.592 61.952 199.68 151.04 3.584 12.8 17.408 20.48 30.208 16.896 12.8-3.584 20.48-17.408 16.896-30.208-30.72-110.08-132.096-186.88-246.784-186.88-129.024 0-236.032 95.744-253.44 219.648-93.184 8.192-165.888 82.432-173.056 178.688-3.584 52.736 14.336 105.984 50.176 145.408 35.84 39.936 84.48 62.464 137.728 64.512H266.24c9.728 0 18.944-0.512 28.672-2.048 11.776-1.536 23.04-6.656 32.256-13.312l350.72-257.024c12.288-9.728 28.672-15.36 45.056-15.36zM897.024 740.352h-301.568c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h301.568c13.312 0 24.576-10.752 24.576-24.576 0-13.824-11.264-24.576-24.576-24.576z" fill="#3d54c4" p-id="35828"></path>
        <path className={styleSvg.icon_path} stroke="#3d54c4" stroke-width="3" d="M643.072 598.016c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h141.312c13.312 0 24.576-10.752 24.576-24.576 0-13.312-10.752-24.576-24.576-24.576h-141.312zM928.256 598.016h-62.464c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h62.464c13.312 0 24.576-10.752 24.576-24.576 0-13.312-11.264-24.576-24.576-24.576zM510.464 740.352H448c-13.312 0-24.576 10.752-24.576 24.576 0 13.312 10.752 24.576 24.576 24.576h62.464c13.312 0 24.576-10.752 24.576-24.576 0-13.824-11.264-24.576-24.576-24.576z" fill="#3d54c4" p-id="35829"></path>
      </svg>
    )
    const errorSvg = (
      <svg t="1666323029464" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6854" width="100" height="100">
        <path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-77.44c240 0 434.56-194.56 434.56-434.56 0-240-194.56-434.56-434.56-434.56C272 77.44 77.44 272 77.44 512c0 240 194.56 434.56 434.56 434.56zM511.658667 210.773333h0.682666a42.666667 42.666667 0 0 1 42.666667 42.666667v344.917333a42.666667 42.666667 0 0 1-42.666667 42.666667h-0.682666a42.666667 42.666667 0 0 1-42.666667-42.666667V253.482667a42.666667 42.666667 0 0 1 42.666667-42.666667zM512 813.226667a43.008 43.008 0 1 1 0-86.058667 43.008 43.008 0 0 1 0 86.058667z"
          fill="#d81e06" p-id="6855">
        </path>
      </svg>
    )
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
            <div>{formatMessage({ id: 'enterpriseOverview.information.message' })}</div>
            <div>{formatMessage({ id: 'enterpriseOverview.information.dataScreen' })}</div>
          </div>
          <Card
            style={{ marginBottom: '20px', boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}
            loading={enterpriseInfoLoading}
            bordered={false}
          >
            <Fragment>
              <div className={enterpriseStyles.enterpriseBox}>
                <div className={enterpriseStyles.enterpriseInfo} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                  <div className={enterpriseStyles.enterpriseInfo_left} >
                    {enterpriseInfo && (
                      <div className={enterpriseStyles.enterpriseName}>
                        {/* 企业名称 */}
                        <FormattedMessage id="enterpriseOverview.information.name" /> <span style={{ color: '#333' }}>{enterpriseInfo.enterprise_alias}</span>
                        {!enterpriseEdition && enterpriseVersion !== 'cloud' && (
                          <a
                            style={{ marginLeft: 32 }}
                            href="https://p5yh4rek1e.feishu.cn/share/base/shrcnDhEE6HkYddzjY4XRKuXikb"
                            target="_blank"
                          // onClick={this.handelConsulting}
                          >
                            {/* 了解企业服务 */}
                            <FormattedMessage id="enterpriseOverview.information.serve" />
                          </a>
                        )}
                      </div>
                    )}
                    {enterpriseInfo && (
                      <div className={enterpriseStyles.enterpriseId}>
                        <p>
                          <Tooltip title={enterpriseInfo.enterprise_id}>
                            {/* 联合云id */}
                            <FormattedMessage id="enterpriseOverview.information.unite" />:&nbsp;
                            <span style={{ color: '#333' }}>
                              {enterpriseInfo.enterprise_id}
                            </span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseVersion}>
                            {/* 平台版本 */}
                            <FormattedMessage id="enterpriseOverview.information.versions" />:&nbsp;
                            <span style={{ color: '#333' }}>
                              {enterpriseVersion || '-'}
                            </span>
                          </Tooltip>
                        </p>
                        <p>
                          <Tooltip title={enterpriseInfo.create_time}>
                            {/* 创建时间 */}
                            <FormattedMessage id="enterpriseOverview.information.time" />:&nbsp;
                            <span style={{ color: '#333' }}>
                              {enterpriseInfo.create_time}
                            </span>
                          </Tooltip>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={enterpriseStyles.enterpriseInfo_right}>
                    {cloudSvg}
                  </div>
                </div>
                <div className={enterpriseStyles.enterpriseData} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
                  <div className={enterpriseStyles.piece}>
                    <p>
                      <Link style={colors} to={`/enterprise/${eid}/clusters`} >
                        {overviewMonitorInfo && overviewMonitorInfo.total_regions || 0}
                      </Link>
                    </p>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.colony' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>
                      <Link to={`/enterprise/${eid}/teams`} style={colors}>
                        {overviewInfo && overviewInfo.total_teams}
                      </Link>
                    </p>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.team' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>
                      <Link to={`/enterprise/${eid}/users`} style={colors}>
                        {overviewInfo && overviewInfo.total_users}
                      </Link>
                    </p>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.user' })}</p>
                  </div>
                  <div className={enterpriseStyles.piece}>
                    <p>
                      <Link to={`/enterprise/${eid}/shared/local`} style={colors} >
                        {overviewInfo && overviewInfo.shared_apps}
                      </Link>
                    </p>
                    <p>{formatMessage({ id: 'enterpriseOverview.overview.template' })}</p>
                  </div>
                </div>
              </div>
            </Fragment>
          </Card>
        </div>
        {/* 集群信息 */}
        <div>
          <div className={enterpriseStyles.title}>
            <div>{formatMessage({ id: 'enterpriseOverview.information.colonyInfo' })}</div>
          </div>
          <Card
            style={{ marginBottom: '20px', boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}
            loading={overviewAppInfoLoading}
            bordered={false}
          >
            {clusters.length > 0 ?
              (clusters.map((item,index) => {
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
                  all_node,
                  services_status
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
                      <div className={enterpriseStyles.clusterName}>{region_alias}</div>
                      <div className={enterpriseStyles.status}>
                        {this.clusterStatus(status, health_status)}
                      </div>
                    </div>
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
                            <span className={language ? enterpriseStyles.k8sVersion : enterpriseStyles.k8sVersion_en}>{k8s_version}</span>
                          </p>
                          <p>
                            <span className={language ? enterpriseStyles.versionName : enterpriseStyles.createTime_en}>{formatMessage({ id: 'enterpriseOverview.overview.createTime' })}:</span>
                            <span className={language ? enterpriseStyles.version : enterpriseStyles.createTimeVersion_en}>
                              {globalUtil.fetchdayTime(create_time)}
                            </span>
                          </p>
                        </div>
                      </div>
                      {health_status !== 'failure' ? (
                        <div className={enterpriseStyles.content_right}>
                          <div className={enterpriseStyles.content_data}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.cpu_total' })}: <span>{cpuTotal || 0}</span>Core</p>
                            <Charts keys={'upcpu' + `${index}`} svalue={cpuUsed || 0} cname="CPU" swidth='200px' sheight='120px' />
                          </div>
                          <div className={enterpriseStyles.content_data}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.memory_total' })}: <span>{memoryTotal || 0}</span>{memoryTotalUnit}</p>
                            <Charts keys={'memory' + `${index}` } svalue={memoryUsed || 0} cname={formatMessage({ id: 'enterpriseOverview.overview.memory' })} swidth='200px' sheight='120px' />
                          </div>
                          <div className={enterpriseStyles.node}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.node_total' })}</p>
                            <div className={enterpriseStyles.nodeData}>
                              <span className={enterpriseStyles.running}>{all_node || 0}</span>
                              <span className={enterpriseStyles.sum}>/{all_node || 0}</span>
                            </div>
                          </div>
                          <div className={enterpriseStyles.node}>
                            <p>{formatMessage({ id: 'enterpriseOverview.overview.pod_total' })}</p>
                            <div className={enterpriseStyles.nodeData}>
                              <span className={enterpriseStyles.running}>{services_status && services_status.running || 0}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={enterpriseStyles.content_right}>
                          <Empty
                            image={errorSvg}
                            description={
                              <span style={{ color: '#d81e06', fontSize: '24px' }}>
                                {formatMessage({ id: 'enterpriseOverview.overview.Abnormal' })}
                              </span>
                            } />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })) : (
                <div className={enterpriseStyles.clusterInfo_Empty}>
                  <Empty description={formatMessage({ id: 'enterpriseOverview.overview.no_cluster' })} />
                </div>
              )}

          </Card>
        </div>
        {/* 应用报警 */}
        <div>
          <div className={enterpriseStyles.title}>
            <div>{formatMessage({ id: 'enterpriseOverview.information.appAlert' })}</div>
          </div>
          <Card
            style={{ marginBottom: '20px', boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}
            loading={overviewAppInfoLoading}
            bordered={false}
          >
            {appAlertList.length > 0 && (
              <div className={enterpriseStyles.appAlert}>
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
                        </span>{formatMessage({ id: 'enterpriseOverview.team.group' })}
                        <span
                          className={enterpriseStyles.spanStyle}
                          onClick={() => {
                            this.onJumpAlert('app', tenant_name, region_name, group_id, service_alias)
                          }}
                        >
                          {group_name}
                        </span>{formatMessage({ id: 'enterpriseOverview.overview.app' })}
                        <span>{formatMessage({ id: 'enterpriseOverview.overview.inside' })}</span>
                        <span
                          className={enterpriseStyles.spanStyle}
                          onClick={() => {
                            this.onJumpAlert('component', tenant_name, region_name, group_id, service_alias)
                          }}
                        >
                          {service_cname}
                        </span>{formatMessage({ id: 'enterpriseOverview.overview.component' })}
                        <span style={{ color: 'red' }}>{formatMessage({ id: 'enterpriseOverview.overview.error' })}</span>
                      </div>
                      <div>
                        <span style={{marginTop:'2px'}}>
                        {globalUtil.fetchSvg('runTime')}
                        </span>
                        {moment(timestamp).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {appAlertLoding && (
              <div className={enterpriseStyles.clusterInfo_Empty}>
                <Spin></Spin>
              </div>
            )}
            {!appAlertLoding && appAlertList.length == 0 && (
              <div className={enterpriseStyles.clusterInfo_Empty}>
                <Empty description={formatMessage({ id: 'enterpriseOverview.overview.no_errorInfo' })} />
              </div>
            )}
          </Card>
        </div>
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
      clusters
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
        {eid &&
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
          )}
        <CustomFooter />
      </div>
    );
  }
}
