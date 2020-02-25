import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import {
  Card,
  Switch,
  notification,
  Button,
  Radio,
  Col,
  Row,
  Popconfirm,
  Tooltip,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from '../List/BasicList.less';
import globalUtil from '../../utils/global';
import Addimg from '../../../public/images/add.png';
import TeamListTable from '../../components/tables/TeamListTable';
import userUtil from '../../utils/user';
import sourceUnit from '../../utils/source-unit';
import JoinTeam from '../../components/JoinTeam';
import ScrollerX from '../../components/ScrollerX';
import CreateTeam from '../../components/CreateTeam';
import DescriptionList from '../../components/DescriptionList';
import CreatUser from '../../components/CreatUserForm';
import rainbondUtil from '../../utils/rainbond';
import ConfirmModal from '../../components/ConfirmModal';
import { Pie } from '../../components/Charts';
import AddTeam from '../../../public/images/addTeam.png';
import Cpus from '../../../public/images/cpus.png';
import CreationTeam from '../../../public/images/creationTeam.png';
import Element from '../../../public/images/element.png';
import EnterpriseBj from '../../../public/images/enterpriseBj.png';
import EnterpriseInfo from '../../../public/images/enterpriseInfo.png';
import Memory from '../../../public/images/memory.png';
import Records from '../../../public/images/records.png';
import Team from '../../../public/images/team.png';
import TeamCrew from '../../../public/images/teamCrew.png';
import User from '../../../public/images/user.png';
import Arrow from '../../../public/images/arrow.png';

import OauthForm from '../../components/OauthForm';

const { Description } = DescriptionList;
const RadioGroup = Radio.Group;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class Enterprise extends PureComponent {
  constructor(props) {
    super(props);
    const params = this.getParam();
    // const isPublic = this.props.rainbondInfo && this.props.rainbondInfo.is_public;
    const { user, rainbondInfo } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      date: moment(new Date().getTime()).format('YYYY-MM-DD'),
      companyInfo: {},
      list: [],
      datalist: [],
      showPayHistory: false,
      showConsumeDetail: false,
      // isPublic,
      teamList: [],
      teamsPage: 1,
      teamsPageSize: 8,
      showAddTeam: false,
      adminer,
      userVisible: false,
      openOauth: false,
      oauthInfo: false,
      isOpen: false,
      showDeleteDomain: false,
      israinbondTird: rainbondUtil.OauthbEnable(rainbondInfo),
      enterpriseInfo: false,
      enterpriseInfoLoading: true,
      enterpriseList: [],
      overviewAppInfo: false,
      overviewInfo: false,
      overviewTeamInfo: false,
      overviewAppInfoLoading: true,
      overviewInfoLoading: true,
      overviewTeamInfoLoading: true,
      overviewMonitorInfoLoading: true,
      joinTeam: false,
    };
  }
  componentDidMount() {
    const { dispatch, rainbondInfo } = this.props;

    if (
      rainbondUtil.OauthbIsEnable(rainbondInfo) ||
      rainbondUtil.OauthbEnable(rainbondInfo)
    ) {
      this.handelOauthInfo();
    }

    dispatch({
      type: 'global/getIsRegist',
      callback: () => {},
    });

    this.getEnterpriseList();
  }

  getEnterpriseList = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
            },
            () => {
              if (res.list.length > 0) {
                this.getEnterpriseInfo();
                this.getOverviewApp();
                this.getOverview();
                this.getOverviewTeam();
                this.getOverviewMonitor();
              }
            }
          );
        }
      },
    });
  };

  getEnterpriseInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            enterpriseInfo: res.bean,
            enterpriseInfoLoading: false,
          });
        }
      },
    });
  };

  getOverviewApp = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'global/fetchOverviewApp',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewAppInfo: res.bean,
            overviewAppInfoLoading: false,
          });
        }
      },
    });
  };

  getOverview = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchOverview',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewInfo: res.bean,
            overviewInfoLoading: false,
          });
        }
      },
    });
  };

  getOverviewTeam = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'global/fetchOverviewTeam',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewTeamInfo: res.bean,
            overviewTeamInfoLoading: false,
          });
        }
      },
    });
  };

  getOverviewMonitor = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'global/fetchOverviewMonitor',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewMonitorInfo: res.bean,
            overviewMonitorInfoLoading: false,
          });
        }
      },
    });
  };

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  onRegistChange = e => {
    this.props.dispatch({
      type: 'global/putIsRegist',
      payload: {
        isRegist: e.target.value,
      },
      callback: () => {},
    });
  };
  getParam() {
    return this.props.match.params;
  }
  getCompanyInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'global/getCompanyInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: eid,
      },
      callback: data => {
        if (data) {
          this.setState({ companyInfo: data.bean });
        }
      },
    });
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '添加成功' });
        this.cancelCreateTeam();
        this.getOverviewTeam();
        this.props.dispatch({ type: 'user/fetchCurrent' });
      },
    });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };
  showConsumeDetail = () => {
    this.setState({ showConsumeDetail: true });
  };
  hideConsumeDetail = () => {
    this.setState({ showConsumeDetail: false });
  };
  showPayHistory = () => {
    this.setState({ showPayHistory: true });
  };
  hidePayHistory = () => {
    this.setState({ showPayHistory: false });
  };

  handelUnderstand = () => {
    window.open('https://www.goodrain.com/industrycloud');
  };
  handelObtain = () => {
    window.open('https://t.goodrain.com/');
  };

  handlChooseeOpen = () => {
    const { isOpen, israinbondTird } = this.state;
    israinbondTird && isOpen ? this.handleOpenDomain() : this.handleOpen();
  };

  handleOpenDomain = () => {
    this.setState({
      showDeleteDomain: true,
    });
  };

  handleOpen = () => {
    this.setState({
      openOauth: true,
    });
  };
  handelClone = () => {
    this.setState({
      openOauth: false,
      showDeleteDomain: false,
    });
  };

  handelOauthInfo = info => {
    const { dispatch, rainbondInfo } = this.props;
    dispatch({
      type: 'global/getOauthInfo',
      callback: res => {
        if (res && res._code == 200) {
          const bean = res.bean;
          const judge = rainbondUtil.OauthbEnable(info || rainbondInfo);
          this.setState({
            oauthInfo: bean && bean.oauth_services,
            isOpen: judge
              ? bean.oauth_services && bean.oauth_services.enable
              : false,
          });
        }
      },
    });
  };

  handleDeleteOauth = () => {
    const { dispatch } = this.props;
    const { oauthInfo } = this.state;
    dispatch({
      type: 'global/deleteOauthInfo',
      payload: {
        service_id: oauthInfo.service_id,
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: '删除成功' });
          window.location.reload();
        }
      },
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

      return unit ? units : parseInt(nums);
    }
    return null;
  };

  handleJoinTeam = values => {
    this.props.dispatch({
      type: 'global/joinTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '申请成功，请等待审核' });
        this.cancelJoinTeam();
      },
    });
  };

  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };

  renderContent = () => {
    const teamBox = {
      marginTop: '16px',
      lineHeight: '1px',
      borderColor: 'rgba(0, 0, 0, 0.09)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
      color: '#3D54C4',
      display: 'flex',
      alignItems: 'center',
    };

    const teamBoxList = {
      ...teamBox,
      ...{ height: '40px', padding: '12px' },
    };
    const teamBoxs = {
      ...teamBox,
      ...{ height: '68px', padding: '24px', cursor: 'pointer' },
    };
    const teamBoxsPs = {
      ...teamBox,
      ...{
        height: '68px',
        padding: '24px',
        justifyContent: 'space-around',
        width: '100%',
      },
    };

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

    const teamOperation = (
      <div style={teamBoxsPs}>
        <div
          style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={this.onJoinTeam}
        >
          <img src={AddTeam} alt="" />
          <div style={{ marginTop: '5px' }}>
            <a className={styles.teamTit}>加入团队</a>
          </div>
        </div>

        {this.state.adminer && (
          <div
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={this.onAddTeam}
          >
            <img src={CreationTeam} alt="" />
            <div style={{ marginTop: '5px' }}>
              <a className={styles.teamTit}>创建团队</a>
            </div>
          </div>
        )}
      </div>
    );
    return (
      <div>
        {this.state.joinTeam && (
          <JoinTeam onOk={this.handleJoinTeam} onCancel={this.cancelJoinTeam} />
        )}

        <Card
          style={{
            marginBottom: 24,
          }}
          style={{ marginBottom: '20px' }}
          loading={enterpriseInfoLoading}
          bordered={false}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className={styles.enterpriseInfo}>
                <img src={EnterpriseInfo} alt="" />
                <span>企业信息</span>
              </div>

              <div className={styles.enterpriseName}>
                {enterpriseInfo &&
                  `企业名称：
                ${enterpriseInfo.enterprise_alias}
                `}
              </div>
              <div className={styles.enterpriseBox}>
                <p>
                  联合云ID&nbsp;
                  {enterpriseInfo && enterpriseInfo.enterprise_id}
                </p>
                <p>
                  平台版本&nbsp;
                  {this.props.rainbondInfo.version || 'V3.7.1-release'}
                </p>
                <p>
                  创建时间&nbsp;
                  {enterpriseInfo && enterpriseInfo.create_time}
                </p>
              </div>

              <div className={styles.btns}>
                <Button type="primary" onClick={this.handelObtain}>
                  开源社区
                </Button>
                <Button
                  className={styles.buttonBjNot}
                  onClick={this.handelUnderstand}
                >
                  获取资源管理后台
                </Button>
                <Button
                  className={styles.buttonBjNot}
                  onClick={this.handelObtain}
                >
                  获取商业解决方案
                </Button>
              </div>
            </div>
            <div>
              <img src={EnterpriseBj} alt="" style={{ marginRight: '54px' }} />
            </div>
          </div>
        </Card>

        <div>
          <Row
            style={{
              marginBottom: 24,
            }}
          >
            <Col span={13}>
              <Card
                bordered={false}
                loading={overviewAppInfoLoading}
                style={{ height: '243px', marginRight: '25px' }}
              >
                <Row style={{ marginBottom: '6px' }}>
                  <Col className={styles.grays} span={12}>
                    应用数量
                  </Col>
                  <Col className={styles.grays} span={12}>
                    组件数量
                  </Col>
                </Row>
                <Row>
                  <Col span={8}>
                    <Pie
                      percent={
                        overviewAppInfo &&
                        Math.round(
                          (overviewAppInfo.service_groups.running /
                            overviewAppInfo.service_groups.total) *
                            10000
                        ) / 100.0
                      }
                      types="app"
                      lineWidth={18}
                      color="#3D58DA"
                      subTitle={
                        <div className={styles.appContent}>
                          <h6>
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.running}
                            个
                          </h6>
                          <div>
                            共
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.total}
                            个应用数量
                          </div>
                        </div>
                      }
                      height={168}
                    />
                  </Col>

                  <Col span={4}>
                    <div>
                      <div>
                        <div className={styles.appnumno}>运行中应用</div>
                        <div className={styles.nums}>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.running}
                            个
                          </span>
                          <span>|</span>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.total}
                            个
                          </span>
                        </div>
                      </div>
                      <div>
                        <div
                          className={styles.appnums}
                          style={{ marginTop: '26px' }}
                        >
                          未运行应用
                        </div>
                        <div className={styles.nums}>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.closed}
                            个
                          </span>
                          <span>|</span>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.service_groups.total}
                            个
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginTop: '10px' }}>
                      <Pie
                        percent={
                          overviewAppInfo &&
                          Math.round(
                            (overviewAppInfo.components.running /
                              overviewAppInfo.components.total) *
                              10000
                          ) / 100.0
                        }
                        types="component"
                        color="#3D58DA"
                        subTitle={
                          <div className={styles.elements}>
                            <div>
                              <div>
                                {overviewAppInfo &&
                                  overviewAppInfo.components.closed}
                              </div>
                              <div>未运行</div>
                            </div>
                            <div />
                            <div>
                              <div>
                                {overviewAppInfo &&
                                  overviewAppInfo.components.running}
                              </div>
                              <div>运行中</div>
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
                        <div className={styles.appnumno}>运行中组件</div>
                        <div className={styles.nums}>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.components.running}
                            个
                          </span>
                          <span>|</span>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.components.total}
                            个
                          </span>
                        </div>
                      </div>
                      <div>
                        <div
                          className={styles.appnums}
                          style={{ marginTop: '26px' }}
                        >
                          未运行组件
                        </div>
                        <div className={styles.nums}>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.components.closed}
                            个
                          </span>
                          <span>|</span>
                          <span>
                            {overviewAppInfo &&
                              overviewAppInfo.components.total}
                            个
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={11}>
              <Card
                loading={overviewInfoLoading}
                bordered={false}
                style={{ height: '243px' }}
              >
                <Row>
                  <Col span={8}>
                    <ul className={styles.Box}>
                      <li>
                        <div>
                          <img src={Element} alt="" />
                        </div>
                      </li>
                      <li>{overviewInfo && overviewInfo.shared_apps}</li>
                      <li>应用模板数量</li>
                      <li>——</li>
                    </ul>
                  </Col>
                  <Col span={8}>
                    <ul className={styles.Box}>
                      <li>
                        <div>
                          <img src={Team} alt="" />
                        </div>
                      </li>
                      <li>{overviewInfo && overviewInfo.total_teams}</li>

                      <li>团队数量</li>
                      <li>——</li>
                    </ul>
                  </Col>
                  <Col span={8}>
                    <ul className={styles.Box}>
                      <li>
                        <div>
                          <img src={User} alt="" />
                        </div>
                      </li>
                      <li>{overviewInfo && overviewInfo.total_users}</li>

                      <li>用户数量</li>
                      <li>——</li>
                    </ul>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row
            style={{
              marginBottom: 24,
            }}
          >
            <Col span={13}>
              <Card
                bordered={false}
                loading={overviewTeamInfoLoading}
                style={{ height: '243px', marginRight: '25px' }}
              >
                {active_teams && (
                  <Row style={{ marginBottom: '4px' }}>
                    <Col className={styles.grays} span={12}>
                      团队
                    </Col>

                    <Col className={styles.grays} span={12}>
                      活跃团队
                    </Col>
                  </Row>
                )}

                <Row>
                  <Col span={active_teams?12:24}>
                    {new_join_team && (
                      <Card
                        bodyStyle={teamBoxs}
                        bordered={false}
                        onClick={() => {
                          this.props.dispatch(
                            routerRedux.replace(
                              `/team/${new_join_team[0].team_name}/region/${new_join_team[0].region}/index`
                            )
                          );
                        }}
                      >
                        <div className={styles.addTeam}>
                          <img src={TeamCrew} alt="" />
                        </div>

                        <div
                          className={styles.grays}
                          style={{ marginLeft: '18px', width: '128px' }}
                        >
                          新加入团队：
                        </div>
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
                    <Card bodyStyle={{ padding: 0 }} bordered={false}>
                      {teamOperation}
                    </Card>
                  </Col>
                  {active_teams && (
                    <Col span={11} offset={1}>
                      {active_teams.map(item => {
                        const { team_name, region, team_alias } = item;
                        return (
                          <Card
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
                                  routerRedux.replace(
                                    `/team/${team_name}/region/${region}/index`
                                  )
                                );
                              }}
                            >
                              <Tooltip title={team_alias}>{team_alias}</Tooltip>
                            </div>
                            <div>
                              <img src={Arrow} alt="" />
                            </div>
                          </Card>
                        );
                      })}
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
            <Col span={11}>
              <Card
                bordered={false}
                loading={overviewMonitorInfoLoading}
                style={{ height: '243px' }}
              >
                <Row>
                  <Col span={8}>
                    <ul className={styles.Box}>
                      <li>
                        <img src={Memory} alt="" />
                      </li>
                      <li>
                        {overviewMonitorInfo &&
                          overviewMonitorInfo.total_regions}
                      </li>
                      <li>数据中心数量</li>
                      <li>——</li>
                    </ul>
                  </Col>
                  <Col span={8}>
                    {overviewMonitorInfo && (
                      <ul className={styles.Box}>
                        <li>
                          <img src={Records} alt="" />
                        </li>
                        <li>
                          {this.handlUnit(overviewMonitorInfo.memory.used)}
                          <span className={styles.units}>
                            {this.handlUnit(
                              overviewMonitorInfo.memory.used,
                              'MB'
                            )}
                          </span>
                          /{this.handlUnit(overviewMonitorInfo.memory.total)}
                          <span className={styles.units}>
                            {this.handlUnit(
                              overviewMonitorInfo.memory.used,
                              'MB'
                            )}
                          </span>
                        </li>
                        <li>内存使用量/总量</li>
                        <li>——</li>
                      </ul>
                    )}
                  </Col>
                  <Col span={8}>
                    <ul className={styles.Box}>
                      <li>
                        <img src={Cpus} alt="" />
                      </li>
                      <li>
                        {overviewMonitorInfo &&
                          parseInt(overviewMonitorInfo.cpu.used)}
                        <span className={styles.units}>Core</span>/
                        {overviewMonitorInfo &&
                          parseInt(overviewMonitorInfo.cpu.total)}
                        <span className={styles.units}>Core</span>
                      </li>
                      <li>CPU使用量/总量</li>
                      <li>——</li>
                    </ul>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    );
  };
  // 管理员添加用户
  addUser = () => {
    this.setState({
      userVisible: true,
    });
  };
  handleCreatUser = values => {
    this.props.dispatch({
      type: 'global/creatUser',
      payload: {
        ...values,
      },
      callback: data => {
        if (data && data._condition == 200) {
          notification.success({ message: data.msg_show });
        } else {
          notification.error({ message: data.msg_show });
        }
      },
    });
    this.cancelCreatUser();
  };

  handleCreatOauth = values => {
    let {
      name,
      client_id,
      client_secret,
      oauth_type,
      home_url,
      is_auto_login,
      redirect_domain,
    } = values;
    oauth_type = oauth_type.toLowerCase();
    if (oauth_type === 'github') {
      home_url = 'https://github.com';
    }
    const obj = {
      name,
      client_id,
      client_secret,
      is_auto_login,
      oauth_type,
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      home_url,
      is_console: true,
    };
    this.handelRequest(obj);
  };

  handelRequest = (obj = {}, isclone) => {
    const { dispatch, rainbondInfo } = this.props;
    const { oauthInfo } = this.state;
    obj.eid = rainbondInfo.eid;
    oauthInfo
      ? (obj.service_id = oauthInfo.service_id)
      : (obj.service_id = null);
    isclone ? (obj.enable = false) : (obj.enable = true);

    dispatch({
      type: 'global/editOauth',
      payload: {
        arr: { enable: obj.enable, value: null },
      },
    });

    dispatch({
      type: 'global/creatOauth',
      payload: {
        arr: [obj],
      },
      callback: data => {
        dispatch({
          type: 'global/fetchRainbondInfo',
          callback: info => {
            if (info) {
              this.setState({
                israinbondTird: rainbondUtil.OauthbEnable(info),
              });
              this.handelOauthInfo(info);
            }
          },
        });
        this.props.dispatch({ type: 'user/fetchCurrent' });
        notification.success({ message: '成功' });
        this.handelClone();
      },
    });
  };

  cancelCreatUser = () => {
    this.setState({
      userVisible: false,
    });
  };
  render() {
    const { userVisible, openOauth, showDeleteDomain, oauthInfo } = this.state;
    const { oauthLongin } = this.props;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div>企业管理员可以设置平台信息，管理企业下的团队</div>
        </div>
      </div>
    );

    return (
      <div>
        {this.renderContent()}
        {this.state.showAddTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {userVisible && (
          <CreatUser
            onOk={this.handleCreatUser}
            onCancel={this.cancelCreatUser}
          />
        )}
        {openOauth && (
          <OauthForm
            loading={oauthLongin}
            oauthInfo={oauthInfo}
            onOk={this.handleCreatOauth}
            onCancel={this.handelClone}
          />
        )}

        {showDeleteDomain && (
          <ConfirmModal
            loading={oauthLongin}
            title="关闭"
            desc="确定要关闭Oauth2.0认证？"
            onOk={() => {
              this.handelRequest(oauthInfo, 'clone');
            }}
            onCancel={this.handelClone}
          />
        )}
      </div>
    );
  }
}
