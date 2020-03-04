import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import { Card, notification, Button, Icon, Col, Row, Tooltip } from 'antd';
import styles from '../List/BasicList.less';
import globalUtil from '../../utils/global';
import userUtil from '../../utils/user';
import Convenient from '../../components/Convenient';
import JoinTeam from '../../components/JoinTeam';
import CreateTeam from '../../components/CreateTeam';
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

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
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
      // isPublic,
      teamList: [],
      teamsPage: 1,
      teamsPageSize: 8,
      showAddTeam: false,
      adminer,
      userVisible: false,
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
      collectionList: [],
      convenientVisible: false,
      editorConvenient: false,
      delcollectionVisible: false,
      collectionInfo: false,
    };
  }
  componentDidMount() {
    const { dispatch, rainbondInfo } = this.props;
    this.getEnterpriseList();
    const { adminer } = this.state;
    !adminer && this.fetchCollectionViewInfo();
  }

  fetchCollectionViewInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'user/fetchCollectionViewInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            collectionList: res.list,
          });
        }
      },
    });
  };

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

  handelUnderstand = () => {
    window.open('https://www.goodrain.com/industrycloud');
  };
  handelObtain = () => {
    window.open('https://t.goodrain.com/');
  };

  handlUnit = (num, unit) => {
    if (num) {
      let nums = num;
      let units = unit;
      if (nums >= 1024) {
        nums = num / 1024;
        units = 'GB';
      }

      return unit ? units : nums.toFixed(2);
      // parseInt(nums)
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

  handleConvenientEntrance = () => {
    notification.success({ message: '添加成功' });
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
      collectionInfo,
    });
  };

  deleteCollectionViewInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    const { collectionInfo } = this.state;
    dispatch({
      type: 'user/deleteCollectionViewInfo',
      payload: {
        favorite_id: collectionInfo && collectionInfo.favorite_id,
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: '删除成功' });
          this.fetchCollectionViewInfo();
          this.handleCloseDelCollectionVisible();
        }
      },
    });
  };
  handleCloseDelCollectionVisible = () => {
    this.setState({
      delcollectionVisible: false,
      collectionInfo: false,
      editorConvenient: false,
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
      collectionList,
      convenientVisible,
      editorConvenient,
      delcollectionVisible,
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
        {convenientVisible && (
          <Convenient
            {...this.props}
            title="添加快捷入口"
            onOk={this.handleConvenientEntrance}
            onCancel={this.cancelConvenientEntrance}
          />
        )}

        {delcollectionVisible && (
          <ConfirmModal
            title="删除快捷入口"
            subDesc="此操作不可恢复"
            desc="确定要删除此快捷入口吗？"
            onOk={this.deleteCollectionViewInfo}
            onCancel={this.handleCloseDelCollectionVisible}
          />
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
          {this.state.adminer && (
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
          )}

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
                  <Col span={active_teams ? 12 : 24}>
                    {new_join_team && (
                      <Card
                        bodyStyle={teamBoxs}
                        bordered={false}
                        onClick={() => {
                          this.props.dispatch(
                            routerRedux.replace(
                              `/team/${new_join_team[0].team_name}/region/${
                                new_join_team[0].region
                              }/index`
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

            {this.state.adminer ? (
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
                                overviewMonitorInfo.memory.total,
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
            ) : (
              <Col span={11}>
                <Card
                  bordered={false}
                  loading={overviewMonitorInfoLoading}
                  style={{ height: '243px' }}
                >
                  <Row style={{ marginBottom: '4px' }}>
                    <Col className={styles.grays} span={12}>
                      便捷入口
                    </Col>
                    <Col
                      className={styles.grays}
                      style={{ textAlign: 'right' }}
                      span={12}
                    >
                      <a
                        style={{ marginRight: '10px' }}
                        onClick={() => {
                          this.onConvenientEntrance();
                        }}
                      >
                        新增
                      </a>
                      {collections && (
                        <a
                          onClick={() => {
                            this.handleIsConvenientEntrance();
                          }}
                        >
                          编辑
                        </a>
                      )}
                    </Col>
                  </Row>

                  <Col span={24}>
                    <Row>
                      {collections &&
                        collections.map((item, index) => {
                          const { url, name } = item;
                          if (index > 5) {
                            return null;
                          }
                          return (
                            <Col
                              span={12}
                              key={name}
                              onClick={() => {
                                editorConvenient
                                  ? this.deleteConvenient(item)
                                  : this.props.dispatch(
                                      routerRedux.replace(url)
                                    );
                              }}
                            >
                              <Card
                                bodyStyle={teamBoxList}
                                bordered={false}
                                style={{ height: '40px', paddingRight: '10px' }}
                              >
                                <div
                                  className={styles.overText}
                                  style={{ width: '93%', cursor: 'pointer' }}
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
                        })}
                    </Row>
                  </Col>
                </Card>
              </Col>
            )}
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

  cancelCreatUser = () => {
    this.setState({
      userVisible: false,
    });
  };
  render() {
    const { userVisible } = this.state;
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
      </div>
    );
  }
}
