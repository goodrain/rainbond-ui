import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  Tabs,
  Input,
  notification,
  Pagination,
} from 'antd';
import { routerRedux } from 'dva/router';
import DataCenterImg from '../../../public/images/dataCenter.png';
import WarningImg from '../../../public/images/warning.png';
import userUtil from '../../utils/user';
import roleUtil from '../../utils/role';

import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CreateTeam from '../../components/CreateTeam';
import ConfirmModal from '../../components/ConfirmModal';
import JoinTeam from '../../components/JoinTeam';

import styles from './index.less';

const { TabPane } = Tabs;
const { Search } = Input;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
}))
export default class EnterpriseTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      userTeamList: [],
      overviewTeamInfo: false,
      showAddTeam: false,
      showExitTeam: false,
      showDelApply: false,
      ApplyInfo: false,
      exitTeamName: '',
      enterpriseTeamsLoading: true,
      userTeamsLoading: true,
      overviewTeamsLoading: true,
      adminer,
      showDelTeam: false,
      page: 1,
      page_size: 5,
      name: '',
      total: 1,
      joinTeam: false,
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '添加成功' });
        // 添加完查询企业团队列表
        this.load();
        this.cancelCreateTeam();
      },
    });
  };

  load = () => {
    this.getEnterpriseTeams();
    this.getOverviewTeam();
    this.getUserTeams();
  };

  handlePaginations = isPages => (
    <Pagination
      size="small"
      current={this.state.page}
      pageSize={this.state.page_size}
      total={Number(this.state.total)}
      onChange={
        isPages === 'userTeam'
          ? this.onPageChangeUserTeam
          : this.onPageChangeTeam
      }
    />
  );

  onPageChangeUserTeam = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.getUserTeams();
    });
  };

  onPageChangeTeam = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.getEnterpriseTeams();
    });
  };

  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name,
      },
      () => {
        this.getEnterpriseTeams();
      }
    );
  };

  handleSearchUserTeam = name => {
    this.setState(
      {
        page: 1,
        name,
      },
      () => {
        this.getUserTeams();
      }
    );
  };

  getEnterpriseTeams = () => {
    const { dispatch, user } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseTeams',
      payload: {
        enterprise_id: user.enterprise_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            page,
            page_size,
            teamList: res.bean.list,
            name,
            enterpriseTeamsLoading: false,
          });
        }
      },
    });
  };
  getUserTeams = () => {
    const { dispatch, user } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: user.enterprise_id,
        user_id: user.user_id,
        name: '',
        page,
        page_size,
        name,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };

  getOverviewTeam = () => {
    const { dispatch, user } = this.props;

    dispatch({
      type: 'global/fetchOverviewTeam',
      payload: {
        enterprise_id: user.enterprise_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewTeamsLoading: false,
            overviewTeamInfo: res.bean,
          });
        }
      },
    });
  };

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };
  showExitTeam = exitTeamName => {
    this.setState({ showExitTeam: true, exitTeamName });
  };

  handleExitTeam = () => {
    const { exitTeamName } = this.state;
    if (exitTeamName == 'jdgn6pk5') {
      notification.warning({ message: '当前为演示团队，不能退出！' });
      return;
    }
    this.props.dispatch({
      type: 'teamControl/exitTeam',
      payload: {
        team_name: exitTeamName,
      },
      callback: () => {
        location.reload();
      },
    });
  };

  hideExitTeam = () => {
    this.setState({ showExitTeam: false, exitTeamName: '' });
  };

  showApply = ApplyInfo => {
    this.setState({ showDelApply: true, ApplyInfo });
  };

  hideDelApply = () => {
    this.setState({ showDelApply: false, ApplyInfo: false });
  };

  handleActiveTabs = () => {
    this.setState({
      name: '',
      page: 1,
    });
  };

  showDelTeam = exitTeamName => {
    this.setState({ showDelTeam: true, exitTeamName });
  };

  hideDelTeam = () => {
    this.setState({ showExitTeam: false, showDelTeam: false });
  };

  handleDelTeam = () => {
    const { exitTeamName } = this.state;
    this.props.dispatch({
      type: 'teamControl/delTeam',
      payload: {
        team_name: exitTeamName,
      },
      callback: () => {
        location.reload();
      },
    });
  };

  handleDelApply = () => {
    const { ApplyInfo } = this.state;
    this.props.dispatch({
      type: 'teamControl/setJoinTeamUsers',
      payload: {
        team_name: ApplyInfo.team_name,
        user_id: ApplyInfo.user_id,
        action: false,
      },
      callback: () => {
        this.getOverviewTeam();
        this.hideDelApply();
      },
    });
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

  render() {
    const {
      teamList,
      overviewTeamInfo,
      enterpriseTeamsLoading,
      overviewTeamsLoading,
      adminer,
      userTeamList,
      userTeamsLoading,
    } = this.state;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );
    const pd24 = { height: '70px', paddingLeft: ' 24px ' };

    const menu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showExitTeam(exitTeamName);
              }}
            >
              退出团队
            </a>
          </Menu.Item>
        </Menu>
      );
    };

    const menucancel = item => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showApply(item);
              }}
            >
              退回申请
            </a>
          </Menu.Item>
        </Menu>
      );
    };

    const managementMenu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showDelTeam(exitTeamName);
              }}
            >
              删除团队
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const operation = (
      <Col span={4} style={{ textAlign: 'right' }} className={styles.btns}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: '5px' }}
          >
            创建团队
          </Button>
        )}
        <Button type="primary" onClick={this.onJoinTeam}>
          加入团队
        </Button>
      </Col>
    );

    const managementTemas = (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Col
            span={2}
            className={styles.teamsTit}
            style={{ marginBottom: '0' }}
          >
            全部团队
          </Col>
          <Col span={18} style={{ textAlign: 'left' }}>
            <Search
              style={{ width: '500px' }}
              placeholder="请输入团队名称进行搜索"
              onSearch={this.handleSearchTeam}
            />
          </Col>
          {operation}
        </Row>
        <Row className={styles.teamMinTit} type="flex" align="middle">
          <Col span={6}>团队名称</Col>
          <Col span={3}>拥有人</Col>
          <Col span={3}>角色</Col>
          <Col span={11}>数据中心</Col>
        </Row>

        {teamList.map(item => {
          const {
            team_id,
            team_alias,
            region,
            owner_name,
            role,
            team_name,
          } = item;
          return (
            <Card
              key={team_id}
              style={{ marginBottom: '10px' }}
              hoverable
              bodyStyle={{ padding: 0 }}
            >
              <Row type="flex" align="middle" className={styles.pl24}>
                <Col
                  span={6}
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.replace(
                        `/team/${team_name}/region/${region}/index`
                      )
                    );
                  }}
                >
                  {team_alias}
                </Col>
                <Col span={3}>{owner_name}</Col>
                <Col span={3}>{roleUtil.actionMap(role)}</Col>
                <Col span={11}>
                  <img src={DataCenterImg} alt="" />
                  &nbsp;
                  {region}
                </Col>
                <Col span={1} className={styles.bor}>
                  <Dropdown
                    overlay={managementMenu(team_name)}
                    placement="bottomLeft"
                  >
                    <Button style={{ border: 'none' }}>
                      <Icon component={moreSvg} />
                    </Button>
                  </Dropdown>
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    );

    const teamInfo = (
      <div>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            最近常用的团队
          </Col>
          {operation}
        </Row>
        <Row className={styles.teamMinTit} type="flex" align="middle">
          <Col span={6}>团队名称</Col>
          <Col span={3}>拥有人</Col>
          <Col span={3}>角色</Col>
          <Col span={12}>数据中心</Col>
        </Row>

        {overviewTeamInfo &&
          overviewTeamInfo.active_teams.map(item => {
            const {
              team_id,
              team_alias,
              region,
              owner_name,
              role,
              team_name,
            } = item;
            return (
              <Card
                key={team_id}
                style={{ marginBottom: '10px' }}
                hoverable
                bodyStyle={{ padding: 0 }}
              >
                <Row
                  type="flex"
                  align="middle"
                  className={styles.teamContent}
                  style={pd24}
                >
                  <Col
                    span={6}
                    onClick={() => {
                      this.props.dispatch(
                        routerRedux.replace(
                          `/team/${team_name}/region/${region}/index`
                        )
                      );
                    }}
                  >
                    {team_alias}
                  </Col>
                  <Col span={3}>{owner_name}</Col>
                  <Col span={3}>{roleUtil.actionMap(role)}</Col>
                  <Col span={11}>
                    <img src={DataCenterImg} alt="" />
                    &nbsp;
                    {region}
                  </Col>
                  <Col span={1} className={styles.bor}>
                    <Dropdown overlay={menu(team_name)} placement="bottomLeft">
                      <Button style={{ border: 'none' }}>
                        <Icon component={moreSvg} />
                      </Button>
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}

        {overviewTeamInfo &&
          overviewTeamInfo.request_join_team &&
          overviewTeamInfo.request_join_team.length > 0 && (
            <Row>
              <Col span={24} className={styles.teamsTit}>
                最新加入团队
              </Col>
            </Row>
          )}

        {overviewTeamInfo &&
          overviewTeamInfo.request_join_team &&
          overviewTeamInfo.request_join_team.map(item => {
            const {
              is_pass,
              team_id,
              team_name,
              region,
              team_alias,
              owner_name,
              user_name,
              role,
            } = item;
            return (
              <Card
                style={{
                  marginBottom: '10px',
                  borderLeft: is_pass === 0 && '6px solid #4D73B1',
                }}
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <Row
                  type="flex"
                  className={styles.pl24}
                  align="middle"
                  key={team_id}
                >
                  <Col
                    span={6}
                    onClick={() => {
                      is_pass === 0
                        ? ''
                        : this.props.dispatch(
                            routerRedux.replace(
                              `/team/${team_name}/region/${region}/index`
                            )
                          );
                    }}
                  >
                    {team_alias}
                  </Col>
                  <Col span={3}>{owner_name}</Col>
                  <Col span={3}>{roleUtil.actionMap(role)}</Col>
                  <Col
                    span={11}
                    style={{
                      color: is_pass === 0 && '#999999',
                    }}
                  >
                    <img
                      src={is_pass === 0 ? WarningImg : DataCenterImg}
                      alt=""
                    />
                    &nbsp;
                    {is_pass === 0 ? (
                      <span>
                        <span style={{ color: '#333' }}>{user_name}</span>
                        &nbsp;申请加入团队审批中
                      </span>
                    ) : (
                      region
                    )}
                  </Col>
                  <Col span={1} className={styles.bor}>
                    <Dropdown
                      overlay={
                        is_pass === 0 ? menucancel(item) : menu(team_name)
                      }
                      placement="bottomLeft"
                    >
                      <Button style={{ border: 'none' }}>
                        <Icon component={moreSvg} />
                      </Button>
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}

        <Row
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Col
            span={4}
            className={styles.teamsTit}
            style={{ marginBottom: '0' }}
          >
            全部团队
          </Col>

          <Col span={20} style={{ textAlign: 'right' }}>
            <Search
              style={{ width: '500px' }}
              placeholder="请输入团队名称进行搜索"
              onSearch={this.handleSearchUserTeam}
            />
          </Col>
        </Row>

        {userTeamList.map(item => {
          const {
            team_id,
            team_alias,
            team_name,
            region,
            owner_name,
            role,
          } = item;
          return (
            <Card
              key={team_id}
              style={{ marginBottom: '10px' }}
              hoverable
              bodyStyle={{ padding: 0 }}
            >
              <Row type="flex" align="middle" className={styles.pl24}>
                <Col
                  span={6}
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.replace(
                        `/team/${team_name}/region/${region}/index`
                      )
                    );
                  }}
                >
                  {team_alias}
                </Col>
                <Col span={3}>{owner_name}</Col>
                <Col span={3}>{roleUtil.actionMap(role)}</Col>
                <Col span={11}>
                  <img src={DataCenterImg} alt="" />
                  &nbsp;
                  {region}
                </Col>
                <Col span={1} className={styles.bor}>
                  <Dropdown overlay={menu(team_name)} placement="bottomLeft">
                    <Button style={{ border: 'none' }}>
                      <Icon component={moreSvg} />
                    </Button>
                  </Dropdown>
                </Col>
              </Row>
            </Card>
          );
        })}

        <div style={{ textAlign: 'right', margin: '15px' }}>
          {this.handlePaginations('userTeam')}
        </div>
      </div>
    );
    return (
      <PageHeaderLayout
        title="——"
        content="企业管理员可以设置平台信息，管理企业下的团队"
      >
        {this.state.joinTeam && (
          <JoinTeam onOk={this.handleJoinTeam} onCancel={this.cancelJoinTeam} />
        )}

        {this.state.showAddTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {this.state.showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title="退出团队"
            subDesc="此操作不可恢复"
            desc="确定要退出此团队吗?"
            onCancel={this.hideExitTeam}
          />
        )}
        {this.state.showDelApply && (
          <ConfirmModal
            onOk={this.handleDelApply}
            title="退出申请"
            subDesc="此操作不可恢复"
            desc="确定要退出此申请吗?"
            onCancel={this.hideDelApply}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelTeam}
            title="删除团队"
            subDesc="此操作不可恢复"
            desc="确定要删除此团队吗？"
            onCancel={this.hideDelTeam}
          />
        )}

        {enterpriseTeamsLoading || overviewTeamsLoading || userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {adminer ? (
              <Tabs defaultActiveKey="1" onChange={this.handleActiveTabs}>
                <TabPane tab="团队" key="1">
                  {teamInfo}
                </TabPane>
                <TabPane tab="管理" key="2">
                  {managementTemas}
                </TabPane>
              </Tabs>
            ) : (
              teamInfo
            )}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}
