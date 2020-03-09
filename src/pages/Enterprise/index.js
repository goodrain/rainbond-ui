import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import {
  Card,
  notification,
  Button,
  Icon,
  Col,
  Row,
  Tooltip,
  Empty,
} from 'antd';
import styles from '../List/BasicList.less';
import userUtil from '../../utils/user';
import Convenient from '../../components/Convenient';
import JoinTeam from '../../components/JoinTeam';
import CreateTeam from '../../components/CreateTeam';
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

@connect(({ user, global, index }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  overviewInfo: index.overviewInfo,
}))
export default class Enterprise extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const params = this.getParam();
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      // isPublic,
      showAddTeam: false,
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
    };
  }
  componentDidMount() {
    this.loading();
  }
  loading = () => {
    const { adminer, eid } = this.state;
    if (eid) {
      this.getEnterpriseInfo();
      this.getOverviewTeam();
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
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            collectionInfoLoading: false,
            collectionList: res.list,
          });
        }
      },
    });
  };

  getEnterpriseInfo = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

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
    const { dispatch } = this.props;
    const { eid } = this.state;

    dispatch({
      type: 'global/fetchOverviewApp',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewAppInfo:
              res.bean && JSON.stringify(res.bean) != '{}' ? res.bean : false,
            overviewAppInfoLoading: false,
          });
        }
      },
    });
  };

  getOverview = () => {
    const { dispatch } = this.props;
    const { eid } = this.state;

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
    const { dispatch } = this.props;
    const { eid } = this.state;

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
    const { dispatch } = this.props;
    const { eid } = this.state;

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
    const { dispatch } = this.props;
    const { collectionInfo, eid } = this.state;
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
      collectionInfoLoading,
      eid,
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
    const hovers = { boxShadow: 'rgba(0, 0, 0, 0.9) 1px 1px 5px -2px' };
    const teamOperation = (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: this.state.adminer ? 'space-around' : 'center',
        }}
      >
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
                        <li>
                          <Link to={`/enterprise/${eid}/shared`} style={colors}>
                            {overviewInfo && overviewInfo.shared_apps}
                          </Link>
                        </li>
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
                        <li>
                          <Link to={`/enterprise/${eid}/teams`} style={colors}>
                            {overviewInfo && overviewInfo.total_teams}
                          </Link>
                        </li>

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
                        <li>
                          <Link to={`/enterprise/${eid}/users`} style={colors}>
                            {overviewInfo && overviewInfo.total_users}
                          </Link>
                        </li>
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
                <Row style={{ marginBottom: '4px' }}>
                  <Col className={styles.grays} span={12}>
                    团队
                  </Col>

                  {active_teams ? (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      活跃团队
                      <Link style={colors} to={`/enterprise/${eid}/teams`}>
                        更多
                      </Link>
                    </Col>
                  ) : (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span style={colors} onClick={this.onJoinTeam}>
                        加入团队
                      </span>

                      {this.state.adminer && (
                        <span
                          style={{
                            color: '#3D54C4',
                            marginLeft: '5px',
                            cursor: 'pointer',
                          }}
                          onClick={this.onAddTeam}
                        >
                          创建团队
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
                            style={{ marginLeft: '18px', width: '150px' }}
                          >
                            新加入团队:
                          </div>
                          <Tooltip title={new_join_team[0].team_alias}>
                            <div
                              className={`${styles.overText} ${
                                styles.teamtest
                              }`}
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
                            <Tooltip title="包含各团队内存使用量、系统使用量和rainbond组件使用量">
                              {this.handlUnit(overviewMonitorInfo.memory.used)}

                              <span className={styles.units}>
                                {this.handlUnit(
                                  overviewMonitorInfo.memory.used,
                                  'MB'
                                )}
                              </span>
                            </Tooltip>
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
                  loading={collectionInfoLoading}
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
                      <span
                        style={{
                          marginRight: '10px',
                          color: '#3D54C4',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          this.onConvenientEntrance();
                        }}
                      >
                        新增
                      </span>
                      {collections && (
                        <span
                          style={colors}
                          onClick={() => {
                            this.handleIsConvenientEntrance();
                          }}
                        >
                          编辑
                        </span>
                      )}
                    </Col>
                  </Row>

                  <Col span={24}>
                    <Row>
                      {collections ? (
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
                        })
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
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

  render() {
    return (
      <div>
        {this.renderContent()}
        {this.state.showAddTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
      </div>
    );
  }
}
