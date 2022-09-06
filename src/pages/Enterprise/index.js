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
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
import styles from '../List/BasicList.less';

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
      showAddTeam: false,
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
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    this.loading();
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
      handleError: error => {}
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
              message: formatMessage({id:'notification.warn.create_team'})
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
              message: formatMessage({id:'notification.warn.app'})
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

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
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

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: res => {
        const { response_data } = res;
        if (response_data && response_data.code) {
          if (response_data.code === 400) {
            notification.warning({ message: response_data.msg_show });
          } else {
            notification.success({ message: response_data.msg_show });
          }
        }
        this.cancelCreateTeam();
        this.getOverviewTeam();
        this.props.dispatch({ type: 'user/fetchCurrent' });
      }
    });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
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

  handleJoinTeam = values => {
    this.props.dispatch({
      type: 'global/joinTeam',
      payload: values,
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.wait_review'}) });
        this.cancelJoinTeam();
      }
    });
  };

  handleConvenientEntrance = () => {
    notification.success({ message: formatMessage({id:'notification.success.add'}) });
    this.fetchCollectionViewInfo();
    this.cancelConvenientEntrance();
  };
  cancelConvenientEntrance = () => {
    this.setState({ convenientVisible: false });
  };
  onConvenientEntrance = () => {
    this.setState({ convenientVisible: true });
  };
  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
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
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
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

  renderContent = () => {
    const teamBox = {
      marginTop: '16px',
      lineHeight: '1px',
      borderColor: 'rgba(0, 0, 0, 0.09)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
      color: '#3D54C4',
      display: 'flex',
      alignItems: 'center'
    };

    const teamBoxList = {
      ...teamBox,
      ...{ height: '40px', padding: '12px' }
    };
    const teamBoxs = {
      ...teamBox,
      ...{ height: '68px', padding: '24px', cursor: 'pointer' }
    };
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
      language
    } = this.state;
    const new_join_team =
      overviewTeamInfo &&
      overviewTeamInfo.new_join_team &&
      overviewTeamInfo.new_join_team.length > 0 &&
      overviewTeamInfo.new_join_team;
    const active_teams =
      overviewTeamInfo &&
      overviewTeamInfo.active_teams &&
      overviewTeamInfo.active_teams.length > 0 &&
      overviewTeamInfo.active_teams;

    const collections =
      collectionList && collectionList.length > 0 && collectionList;

    const colors = { color: '#3D54C4', cursor: 'pointer' };
    const memoryInfo = overviewMonitorInfo && overviewMonitorInfo.memory;
    const memoryUsed = (memoryInfo && this.handlUnit(memoryInfo.used)) || 0;
    const memoryUsedUnit =
      (memoryInfo && this.handlUnit(memoryInfo.used, 'MB')) || 'MB';
    const memoryTotal = (memoryInfo && this.handlUnit(memoryInfo.total)) || 0;
    const cpuInfo = (overviewMonitorInfo && overviewMonitorInfo.cpu) || 0;
    const cpuUsed = (cpuInfo && cpuInfo.used && parseInt(cpuInfo.used)) || 0;
    const cpuTotal = (cpuInfo && cpuInfo.total && parseInt(cpuInfo.total)) || 0;
    const AppNumInfo = overviewAppInfo && overviewAppInfo.service_groups;
    const runApp = (AppNumInfo && AppNumInfo.running) || 0;
    const appTotal = (AppNumInfo && AppNumInfo.total) || 0;
    const appClosed = (AppNumInfo && AppNumInfo.closed) || 0;

    const comInfo = overviewAppInfo && overviewAppInfo.components;
    const runCom = (comInfo && comInfo.running) || 0;
    const comTotal = (comInfo && comInfo.total) || 0;
    const comClosed = (comInfo && comInfo.closed) || 0;
    const enterpriseVersion =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const memoryTotalUnit =
      (memoryInfo && this.handlUnit(memoryInfo.total, 'MB')) || 'MB';
    const teamOperation = (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: this.state.adminer ? 'space-around' : 'center'
        }}
      >
        <div
          style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={this.onJoinTeam}
        >
          <img src={AddTeam} alt="" />
          <div style={{ marginTop: '5px' }}>
            <a className={styles.teamTit}><FormattedMessage id="enterpriseOverview.team.join"/></a>
          </div>
        </div>

        {this.state.adminer && (
          <div
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={this.onAddTeam}
          >
            <img src={CreationTeam} alt="" />
            <div style={{ marginTop: '5px' }}>
              <a className={styles.teamTit}><FormattedMessage id="enterpriseOverview.team.setup"/></a>
            </div>
          </div>
        )}
      </div>
    );
    return (
      <div>
        {this.state.joinTeam && (
          <JoinTeam
            enterpriseID={eid}
            onOk={this.handleJoinTeam}
            onCancel={this.cancelJoinTeam}
          />
        )}
        {convenientVisible && (
          <Convenient
            {...this.props}
            title={<FormattedMessage id="enterpriseOverview.Convenient.title"/>}
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
        <Card
          style={{
            marginBottom: 24
          }}
          style={{ marginBottom: '20px' }}
          loading={enterpriseInfoLoading}
          bordered={false}
        >
          <Fragment>
            <div className={styles.eidbox}>
              <div>
                <div className={styles.enterpriseInfo}>
                  <img src={EnterpriseInfo} alt="" />
                  <span>
                    {/* 企业信息 */}
                    <FormattedMessage id="enterpriseOverview.information.message"/>
                  </span>
                </div>
                {enterpriseInfo && (
                  <div className={styles.enterpriseName}>
                    {/* 企业名称 */}
                   <FormattedMessage id="enterpriseOverview.information.name"/>{enterpriseInfo.enterprise_alias}
                    {!enterpriseEdition && enterpriseVersion !== 'cloud' && (
                      <a
                        style={{ marginLeft: 32 }}
                        href="https://p5yh4rek1e.feishu.cn/share/base/shrcnDhEE6HkYddzjY4XRKuXikb"
                        target="_blank"
                        // onClick={this.handelConsulting}
                      >
                        {/* 了解企业服务 */}
                        <FormattedMessage id="enterpriseOverview.information.serve"/>
                      </a>
                    )}
                  </div>
                )}
                {enterpriseInfo && (
                  <div className={styles.enterpriseBox}>
                    <p>
                      <Tooltip title={enterpriseInfo.enterprise_id}>
                        {/* 联合云id */}
                      <FormattedMessage id="enterpriseOverview.information.unite"/>&nbsp;
                        {enterpriseInfo.enterprise_id}
                      </Tooltip>
                    </p>
                    <p>
                      <Tooltip title={enterpriseVersion}>
                        {/* 平台版本 */}
                      <FormattedMessage id="enterpriseOverview.information.versions"/>&nbsp;
                        {enterpriseVersion}
                      </Tooltip>
                    </p>
                    <p>
                      <Tooltip title={enterpriseInfo.create_time}>
                        {/* 创建时间 */}
                      <FormattedMessage id="enterpriseOverview.information.time"/>&nbsp;
                        {enterpriseInfo.create_time}
                      </Tooltip>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <img
                  src={EnterpriseBj}
                  alt=""
                  style={{ marginRight: '54px' }}
                />
              </div>
            </div>
          </Fragment>
        </Card>

        <div>
          {this.state.adminer && (
            <Row
              style={{
                marginBottom: 24
              }}
            >
              <Col span={13}>
                <Card
                  bordered={false}
                  loading={overviewAppInfoLoading}
                  style={{
                    height: '243px',
                    marginRight: '25px'
                  }}
                >
                  <Row style={{ marginBottom: '6px' }}>
                    <Col className={styles.grays} span={12}>
                      {/* 应用数量 */}
                      <FormattedMessage id="enterpriseOverview.app.number"/>
                    </Col>
                    <Col className={styles.grays} span={12}>
                      {/* 组件数量 */}
                      <FormattedMessage id="enterpriseOverview.module.number"/>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={8}>
                      <Pie
                        percent={
                          Math.round((runApp / appTotal) * 10000) / 100.0
                        }
                        types="app"
                        lineWidth={18}
                        color="#3D58DA"
                        subTitle={
                          <div className={styles.appContent}>
                            <h6>{runApp} {language ? formatMessage({id:'unit.entries'}) : ''}</h6>
                            <div>
                              {/*  共{appTotal}
                              应用数量 */}
                              <FormattedMessage 
                              id="enterpriseOverview.app.overview"
                              values={{number:appTotal}}
                              />
                            </div>
                          </div>
                        }
                        height={168}
                      />
                    </Col>

                    <Col span={4}>
                      <div>
                        <div>
                          <div className={styles.appnumno}>
                          {/* 运行中应用 */}
                            <FormattedMessage id="enterpriseOverview.app.run"/>
                          </div>
                          <div className={styles.nums}>
                            <span>{runApp} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                            <span>|</span>
                            <span>{appTotal} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                          </div>
                        </div>
                        <div>
                          <div
                            className={styles.appnums}
                            style={{ marginTop: '26px' }}
                          >
                            {/* 未运行应用 */}
                            <FormattedMessage id="enterpriseOverview.app.notrun"/>
                          </div>
                          <div className={styles.nums}>
                            <span>{appClosed} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                            <span>|</span>
                            <span>{appTotal} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginTop: '10px' }}>
                        <Pie
                          percent={
                            Math.round((runCom / comTotal) * 10000) / 100.0
                          }
                          types="component"
                          color="#3D58DA"
                          subTitle={
                            <div className={language ? styles.elements : styles.en_elements}>
                              <div>
                                <div>{comClosed}</div>
                                <div>
                                  {/* 未运行 */}
                                <FormattedMessage id="enterpriseOverview.module.notrun"/>
                                </div>
                              </div>
                              <div />
                              <div>
                                <div>{runCom}</div>
                                <div>
                                  {/* 运行中 */}
                                <FormattedMessage id="enterpriseOverview.module.run"/>
                                </div>
                              </div>
                            </div>
                          }
                          height={156}
                        />
                      </div>
                    </Col>
                    <Col span={4}>
                      <div>
                        <div>
                          <div className={styles.appnumno}>
                            {/* 运行中组件 */}
                            <FormattedMessage id="enterpriseOverview.module.run.component"/>
                          </div>
                          <div className={styles.nums}>
                            <span>{runCom} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                            <span>|</span>
                            <span>{comTotal} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                          </div>
                        </div>
                        <div>
                          <div
                            className={styles.appnums}
                            style={{ marginTop: '26px' }}
                          >
                            {/* 未运行组件 */}
                            <FormattedMessage id="enterpriseOverview.module.notrun.component"/>
                          </div>
                          <div className={styles.nums}>
                            <span>{comClosed} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                            <span>|</span>
                            <span>{comTotal} {language ? formatMessage({id:'unit.entries'}) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={11}>
                <Card
                  bordered={false}
                  loading={overviewInfoLoading}
                  style={{ height: '243px' }}
                >
                  <Row>
                    <Col span={7}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Element} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link
                            to={`/enterprise/${eid}/shared/local`}
                            style={colors}
                          >
                            {overviewInfo && overviewInfo.shared_apps}
                          </Link>
                        </li>
                        <li>
                          {/* 应用模版数量 */}
                        <FormattedMessage id="enterpriseOverview.overview.template"/>
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={10}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Team} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link to={`/enterprise/${eid}/teams`} style={colors}>
                            {overviewInfo && overviewInfo.total_teams}
                          </Link>
                        </li>

                        <li>
                          {/* 团队数量 */}
                        <FormattedMessage id="enterpriseOverview.overview.team"/>
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={7}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={User} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link to={`/enterprise/${eid}/users`} style={colors}>
                            {overviewInfo && overviewInfo.total_users}
                          </Link>
                        </li>
                        <li>
                          {/* 用户数量 */}
                        <FormattedMessage id="enterpriseOverview.overview.user"/>
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )}

          <Row
            style={{
              marginBottom: 24
            }}
          >
            <Col span={13}>
              <Card
                bordered={false}
                loading={overviewTeamInfoLoading}
                style={{ height: '243px', marginRight: '25px' }}
              >
                <Row style={{ marginBottom: '4px' }}>
                  <Col className={styles.grays} span={12}>
                    {/* 团队 */}
                    <FormattedMessage id="enterpriseOverview.team.group"/>
                  </Col>

                  {active_teams ? (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* 常用团队 */}
                      <FormattedMessage id="enterpriseOverview.team.frequently"/>
                      <Link style={colors} to={`/enterprise/${eid}/teams`}>
                        <FormattedMessage id="enterpriseOverview.team.more"/>
                      {/* 更多 */}
                      </Link>
                    </Col>
                  ) : (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <span style={colors} onClick={this.onJoinTeam}>
                        {/* 加入团队 */}
                        <FormattedMessage id="enterpriseOverview.team.join"/>
                      </span>

                      {this.state.adminer && (
                        <span
                          style={{
                            color: '#3D54C4',
                            marginLeft: '5px',
                            cursor: 'pointer'
                          }}
                          onClick={this.onAddTeam}
                        >
                          {/*  创建团队 */}
                          <FormattedMessage id="enterpriseOverview.team.setup"/>
                        </span>
                      )}
                    </Col>
                  )}
                </Row>

                {active_teams ? (
                  <Row>
                    <Col span={12}>
                      {new_join_team && (
                        <Card
                          hoverable
                          bodyStyle={teamBoxs}
                          bordered={false}
                          onClick={() => {
                            this.props.dispatch(
                              routerRedux.push(
                                `/team/${new_join_team[0].team_name}/region/${new_join_team[0].region}/index`
                              )
                            );
                          }}
                        >
                          <div className={styles.addTeam}>
                            <img
                              onClick={() => {
                                this.props.dispatch(
                                  routerRedux.push(
                                    `/team/${new_join_team[0].team_name}/region/${new_join_team[0].region}/index`
                                  )
                                );
                              }}
                              src={TeamCrew}
                              alt=""
                            />
                          </div>
                          <Tooltip title={<FormattedMessage id="enterpriseOverview.team.new"/>}>
                            <div
                              className={`${styles.grays} ${styles.addteam}`}
                            >
                              {/* 新加入团队: */}
                          <FormattedMessage id="enterpriseOverview.team.new"/>

                            </div>
                          </Tooltip>

                          <Tooltip title={new_join_team[0].team_alias}>
                            <div
                              className={`${styles.overText} ${styles.teamtest}`}
                            >
                              {new_join_team[0].team_alias}
                            </div>
                          </Tooltip>
                          <div>
                            <img src={Arrow} alt="" />
                          </div>
                        </Card>
                      )}
                      <Card hoverable bodyStyle={teamBoxs} bordered={false}>
                        {teamOperation}
                      </Card>
                    </Col>
                    <Col span={11} offset={1}>
                      {active_teams.map(item => {
                        const { team_name, region, team_alias } = item;
                        return (
                          <Card
                            hoverable
                            key={team_name}
                            bodyStyle={teamBoxList}
                            bordered={false}
                            style={{ height: '40px' }}
                          >
                            <div
                              className={styles.overText}
                              style={{ width: '93%', cursor: 'pointer' }}
                              onClick={() => {
                                this.props.dispatch(
                                  routerRedux.push(
                                    `/team/${team_name}/region/${region}/index`
                                  )
                                );
                              }}
                            >
                              <Tooltip title={team_alias}>{team_alias}</Tooltip>
                            </div>
                            <div>
                              <img
                                onClick={() => {
                                  this.props.dispatch(
                                    routerRedux.push(
                                      `/team/${team_name}/region/${region}/index`
                                    )
                                  );
                                }}
                                src={Arrow}
                                alt=""
                              />
                            </div>
                          </Card>
                        );
                      })}
                    </Col>
                  </Row>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>

            {this.state.adminer ? (
              <Col span={11}>
                <Card
                  bordered={false}
                  loading={overviewMonitorInfoLoading}
                  style={{ height: '243px' }}
                >
                  {overviewMonitorInfo && (
                    <Row>
                      <Col span={7}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Records} alt="" />
                          </li>
                          <li>
                            <Link
                              style={colors}
                              to={`/enterprise/${eid}/clusters`}
                            >
                              {overviewMonitorInfo.total_regions || 0}
                            </Link>
                          </li>
                          <li>
                            {/* 集群数量 */}
                          <FormattedMessage id="enterpriseOverview.overview.colony"/>
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                      <Col span={10}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Memory} alt="" />
                          </li>
                          <li>
                            <Tooltip
                              className={styles.cen}
                              title={
                                <FormattedMessage 
                                id="enterpriseOverview.overview.tooltip"
                                values={{num:memoryUsed,unit:memoryUsedUnit}}
                                />
                              }
                              // title={`${memoryUsed}${memoryUsedUnit} 包含各团队内存使用量、系统使用量和平台组件使用量`}
                            >
                              <span className={styles.numbers}>
                                {memoryUsed}
                                <span className={styles.units}>
                                  {memoryUsedUnit}
                                </span>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={`${memoryTotal} ${memoryTotalUnit}`}
                              className={styles.cen}
                            >
                              <span className={styles.numbers}>
                                /{memoryTotal}
                                <span className={styles.units}>
                                  {memoryTotalUnit}
                                </span>
                              </span>
                            </Tooltip>
                          </li>
                          <li>
                            {/* 内存使用量/总量 */}
                          <FormattedMessage id="enterpriseOverview.overview.memory"/>
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                      <Col span={7}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Cpus} alt="" />
                          </li>
                          <li>
                            <Tooltip
                              className={styles.cen}
                              title={`${cpuUsed}Core`}
                            >
                              <span className={styles.numbers}>
                                {cpuUsed}
                                <span className={styles.units}>Core</span>
                              </span>
                            </Tooltip>
                            <Tooltip
                              className={styles.cen}
                              title={`${cpuTotal}Core`}
                            >
                              <span className={styles.numbers}>
                                /{cpuTotal}
                                <span className={styles.units}>Core</span>
                              </span>
                            </Tooltip>
                          </li>
                          <li>
                            {/* CPU使用量/总量 */}
                          <FormattedMessage id="enterpriseOverview.overview.cpu"/>
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                    </Row>
                  )}
                </Card>
              </Col>
            ) : (
              <Col span={11}>
                <Card
                  bordered={false}
                  loading={collectionInfoLoading}
                  style={{ height: '243px' }}
                >
                  <Row style={{ marginBottom: '4px' }}>
                    <Col className={styles.grays} span={12}>
                      {/* 便捷入口 */}
                      <FormattedMessage id="enterpriseOverview.overview.entrance"/>

                    </Col>
                    <Col
                      className={styles.grays}
                      style={{ textAlign: 'right' }}
                      span={12}
                    >
                      <span
                        style={{
                          marginRight: '10px',
                          color: '#3D54C4',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          this.onConvenientEntrance();
                        }}
                      >
                        {/* 新增 */}
                        <FormattedMessage id="enterpriseOverview.overview.add"/>

                      </span>
                      {collections && (
                        <span
                          style={colors}
                          onClick={() => {
                            this.handleIsConvenientEntrance();
                          }}
                        >
                          {/* 编辑 */}
                          <FormattedMessage id="enterpriseOverview.overview.edit"/>

                        </span>
                      )}
                    </Col>
                  </Row>

                  <Col span={24}>
                    <Row>
                      {collections ? (
                        collections.map((item, index) => {
                          const { url, name } = item;
                          const startPage = (page - 1) * page_size;

                          const totals = page * page_size;
                          if (page !== 1 && index < startPage) {
                            return null;
                          }
                          if (index >= totals) {
                            return null;
                          }
                          return (
                            <Col
                              span={12}
                              key={name}
                              onClick={() => {
                                editorConvenient
                                  ? this.deleteConvenient(item)
                                  : this.props.dispatch(routerRedux.push(url));
                              }}
                            >
                              <Card
                                bodyStyle={teamBoxList}
                                bordered={false}
                                style={{
                                  height: '40px',
                                  paddingRight: '10px'
                                }}
                              >
                                <div
                                  className={styles.overText}
                                  style={{
                                    width: '93%',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Tooltip title={name}>{name}</Tooltip>
                                </div>
                                <div>
                                  {editorConvenient ? (
                                    <Icon type="close" />
                                  ) : (
                                    <img src={Arrow} alt="" />
                                  )}
                                </div>
                              </Card>
                            </Col>
                          );
                        })
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <Pagination
                        size="small"
                        current={page}
                        pageSize={page_size}
                        total={Number(total)}
                        onChange={this.onPageChangeCollectionView}
                      />
                    </div>
                  </Col>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      </div>
    );
  };

  render() {
    const {
      showAddTeam,
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
        {showAddTeam && (
          <CreateTeam
            enterprise_id={eid}
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
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
          <CustomFooter/>
      </div>
    );
  }
}
