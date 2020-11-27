/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Icon,
  Input,
  Menu,
  notification,
  Pagination,
  Row,
  Spin
} from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import React, { PureComponent } from "react";
import WarningImg from "../../../public/images/warning.png";
import ConfirmModal from "../../components/ConfirmModal";
import CreateTeam from "../../components/CreateTeam";
import JoinTeam from "../../components/JoinTeam";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import roleUtil from "../../utils/role";
import userUtil from "../../utils/user";
import styles from "./index.less";

const { Search } = Input;

@connect(({ user }) => ({
  user: user.currentUser
}))
export default class EnterpriseTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =  userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      userTeamList: [],
      overviewTeamInfo: false,
      showAddTeam: false,
      showExitTeam: false,
      showDelApply: false,
      ApplyInfo: false,
      exitTeamName: "",
      enterpriseTeamsLoading: false,
      userTeamsLoading: true,
      overviewTeamsLoading: true,
      adminer,
      showDelTeam: false,
      page: 1,
      page_size: 10,
      name: "",
      total: 1,
      joinTeam: false,
      delTeamLoading: false
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

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

  getEnterpriseTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: "global/fetchEnterpriseTeams",
      payload: {
        page,
        page_size,
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            total: (res.bean && res.bean.total_count) || 1,
            teamList: (res.bean && res.bean.list) || [],
            enterpriseTeamsLoading: false
          });
        }
      }
    });
  };
  getUserTeams = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: "global/fetchUserTeams",
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        page,
        page_size,
        name
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false
          });
        }
      }
    });
  };

  load = () => {
    this.state.adminer && this.getEnterpriseTeams();
    this.getOverviewTeam();
    this.getUserTeams();
  };
  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name
      },
      () => {
        this.getEnterpriseTeams();
      }
    );
  };

  handlePaginations = () => (
    <Pagination
      current={this.state.page}
      pageSize={this.state.page_size}
      total={Number(this.state.total)}
      onChange={this.onPageChangeTeam}
    />
  );
  handleSearchUserTeam = name => {
    this.setState(
      {
        page: 1,
        name
      },
      () => {
        this.getUserTeams();
      }
    );
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: "teamControl/createTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "添加成功" });
        // 添加完查询企业团队列表
        this.load();
        this.cancelCreateTeam();
      }
    });
  };

  getOverviewTeam = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: "global/fetchOverviewTeam",
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            overviewTeamsLoading: false,
            overviewTeamInfo: res.bean
          });
        }
      }
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
    this.props.dispatch({
      type: "teamControl/exitTeam",
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        if (res && res._code === 200) {
          this.getOverviewTeam();
          this.getUserTeams();
          this.hideExitTeam();
        }
      }
    });
  };

  hideExitTeam = () => {
    this.setState({ showExitTeam: false, exitTeamName: "" });
  };

  showApply = ApplyInfo => {
    this.setState({ showDelApply: true, ApplyInfo });
  };

  hideDelApply = () => {
    this.setState({ showDelApply: false, ApplyInfo: false });
  };

  handleActiveTabs = key => {
    this.setState(
      {
        name: "",
        page: 1
      },
      () => {
        if (key === "team") {
          this.getOverviewTeam();
          this.getUserTeams();
        } else {
          this.getEnterpriseTeams();
        }
      }
    );
  };
  showCloseAllComponent = exitTeamName => {
    this.setState({ showCloseAllComponent: true, exitTeamName });
  };
  hideCloseAllComponent = () => {
    this.setState({ showCloseAllComponent: false, exitTeamName: "" });
  };

  showDelTeam = exitTeamName => {
    this.setState({ showDelTeam: true, exitTeamName });
  };

  hideDelTeam = () => {
    this.setState({ showExitTeam: false, showDelTeam: false });
  };
  handleCloseAllComponentInTeam = () => {
    const { exitTeamName, closeTeamComponentLoading } = this.state;
    if (closeTeamComponentLoading) {
      return;
    }
    this.setState({ closeTeamComponentLoading: true });
    this.props.dispatch({
      type: "teamControl/stopComponentInTeam",
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        this.setState({ closeTeamComponentLoading: false });
        if (res && res._code === 200) {
          notification.success({ message: "操作成功，组件正在关闭中" });
        }
        this.hideCloseAllComponent();
      },
      handleError: err => {
        if (err.data) {
          notification.warning({
            message: err.data.msg_show
          });
        }
        notification.warning({
          message: "操作遇到故障，请稍后重试"
        });
        this.setState({ closeTeamComponentLoading: false });
      }
    });
  };
  handleDelTeam = () => {
    const { exitTeamName, delTeamLoading } = this.state;
    if (delTeamLoading) {
      return;
    }
    this.setState({ delTeamLoading: true });
    this.props.dispatch({
      type: "teamControl/delTeam",
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        this.setState({ delTeamLoading: false });
        if (res && res._code === 200) {
          this.getEnterpriseTeams();
          this.hideDelTeam();
          notification.success({ message: "团队删除成功" });
        }
      },
      handleError: err => {
        if (err.data) {
          notification.warning({
            message: err.data.msg_show
          });
        }
        this.setState({ delTeamLoading: false });
      }
    });
  };

  handleDelApply = () => {
    const { ApplyInfo } = this.state;
    this.props.dispatch({
      type: "teamControl/undoTeamUsers",
      payload: {
        team_name: ApplyInfo.team_name
      },
      callback: () => {
        notification.success({ message: "撤销申请成功" });
        this.getOverviewTeam();
        this.hideDelApply();
      }
    });
  };

  handleJoinTeam = values => {
    this.props.dispatch({
      type: "global/joinTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "申请成功，请等待审核" });
        this.getOverviewTeam();
        this.cancelJoinTeam();
      }
    });
  };

  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };

  showRegions = (team_name, regions, ismanagement = false) => {
    return regions.map(item => {
      return (
        <Button
          key={`${item.region_name}region`}
          className={styles.regionShow}
          onClick={() => {
            if (ismanagement) {
              this.handleJoinTeams(team_name, item.region_name);
            } else {
              this.onJumpTeam(team_name, item.region_name);
            }
          }}
        >
          {item.region_alias}
          <Icon type="right" />
        </Button>
      );
    });
  };
  handleJoinTeams = (teamName, region) => {
    const { dispatch } = this.props;
    dispatch({
      type: "teamControl/joinTeam",
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res._code === 200) {
          this.onJumpTeam(teamName, region);
        }
      }
    });
  };
  onJumpTeam = (team_name, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.replace(`/team/${team_name}/region/${region}/index`));
  };

  render() {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const {
      teamList,
      overviewTeamInfo,
      enterpriseTeamsLoading,
      overviewTeamsLoading,
      adminer,
      userTeamList,
      userTeamsLoading,
      delTeamLoading,
      showCloseAllComponent,
      closeTeamComponentLoading
    } = this.state;

    const request_join_team =
      overviewTeamInfo &&
      overviewTeamInfo.request_join_team.filter(item => {
        if (item.is_pass === 0) {
          return item;
        }
      });
    const haveNewJoinTeam = request_join_team.length > 0;

    const userTeam = userTeamList && userTeamList.length > 0 && userTeamList;
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
    const menu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
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
              onClick={() => {
                this.showApply(item);
              }}
            >
              撤销申请
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
              onClick={() => {
                this.showCloseAllComponent(exitTeamName);
              }}
            >
              关闭所有组件
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
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
      <Col span={7} style={{ textAlign: "right" }} className={styles.btns}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: "5px" }}
          >
            创建团队
          </Button>
        )}
        {!adminer && (
          <Button type="primary" onClick={this.onJoinTeam}>
            加入团队
          </Button>
        )}
      </Col>
    );

    const managementTemas = (
      <div>
        <Row
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          <Col
            span={2}
            className={styles.teamsTit}
            style={{ marginBottom: "0" }}
          >
            全部团队
          </Col>
          <Col span={15} style={{ textAlign: "left" }}>
            <Search
              style={{ width: "500px" }}
              placeholder="请输入团队名称进行搜索"
              onSearch={this.handleSearchTeam}
            />
          </Col>
          {operation}
        </Row>
        <Row className={styles.teamMinTit} type="flex" align="middle">
          <Col span={6}>团队名称</Col>
          <Col span={3}>拥有人</Col>
          <Col span={11}>集群</Col>
        </Row>

        {teamList.map(item => {
          const {
            team_id,
            team_alias,
            region_list,
            owner_name,
            team_name
          } = item;
          return (
            <Card
              key={team_id}
              style={{ marginTop: "10px" }}
              hoverable
              bodyStyle={{ padding: 0 }}
            >
              <Row type="flex" align="middle" className={styles.pl24}>
                <Col span={6}>{team_alias}</Col>
                <Col span={3}>{owner_name}</Col>
                <Col span={14}>
                  {this.showRegions(team_name, region_list, true)}
                </Col>
                <Col span={1} className={styles.bor}>
                  <Dropdown
                    overlay={managementMenu(team_name)}
                    placement="bottomLeft"
                  >
                    <Icon component={moreSvg} style={{ width: "100%" }} />
                  </Dropdown>
                </Col>
              </Row>
            </Card>
          );
        })}
        <div style={{ textAlign: "right", margin: "15px" }}>
          {this.handlePaginations()}
        </div>
      </div>
    );

    const teamInfo = (
      <div>
        <Row>
          <Col span={17} className={styles.teamsTit}>
            {haveNewJoinTeam && "最新加入团队"}
          </Col>
          {operation}
        </Row>
        {haveNewJoinTeam && (
          <Row className={styles.teamMinTit} type="flex" align="middle">
            <Col span={6}>团队名称</Col>
            <Col span={3}>拥有人</Col>
            <Col span={3}>角色</Col>
            <Col span={12}>状态</Col>
          </Row>
        )}
        {request_join_team &&
          request_join_team.map(item => {
            const {
              is_pass,
              team_id,
              team_name,
              team_alias,
              owner_name,
              role
            } = item;
            return (
              <Card
                key={team_id}
                style={{
                  marginTop: "10px",
                  borderLeft: is_pass === 0 && "6px solid #4D73B1"
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
                  <Col span={6}>{team_alias}</Col>
                  <Col span={3}>{owner_name}</Col>
                  <Col span={3}>{roleUtil.actionMap(role)}</Col>
                  <Col
                    span={11}
                    style={{
                      color: is_pass === 0 && "#999999"
                    }}
                  >
                    {is_pass === 0 && (
                      <span>
                        <img src={WarningImg} alt="" />
                        &nbsp;申请加入团队审批中
                      </span>
                    )}
                  </Col>
                  <Col span={1} className={styles.bor}>
                    <Dropdown
                      overlay={
                        is_pass === 0 ? menucancel(item) : menu(team_name)
                      }
                      placement="bottomLeft"
                    >
                      <Icon component={moreSvg} style={{ width: "100%" }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}

        <Row
          style={{
            margin: "10px 0",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Col
            span={4}
            className={styles.teamsTit}
            style={{ marginBottom: "0" }}
          >
            我的团队
          </Col>

          <Col span={20} style={{ textAlign: "right" }}>
            <Search
              style={{ width: "500px" }}
              placeholder="请输入团队名称进行搜索"
              onSearch={this.handleSearchUserTeam}
            />
          </Col>
        </Row>
        {userTeam && (
          <Row className={styles.teamMinTit} type="flex" align="middle">
            <Col span={6}>团队名称</Col>
            <Col span={3}>拥有人</Col>
            <Col span={3}>角色</Col>
            <Col span={12}>集群</Col>
          </Row>
        )}
        {!userTeam && (
          <Empty
            description="暂无团队，请点击创建团队进行创建"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {userTeam &&
          userTeam.map(item => {
            const {
              team_id,
              team_alias,
              team_name,
              region_list,
              owner_name,
              roles
            } = item;
            return (
              <Card
                key={team_id}
                style={{ marginBottom: "10px" }}
                hoverable
                bodyStyle={{ padding: 0 }}
              >
                <Row type="flex" align="middle" className={styles.pl24}>
                  <Col span={6}>{team_alias}</Col>
                  <Col span={3}>{owner_name}</Col>
                  <Col span={3}>
                    {roles.map(item => {
                      return (
                        <span
                          style={{ marginRight: "8px" }}
                          key={`role${item}`}
                        >
                          {roleUtil.actionMap(item)}
                        </span>
                      );
                    })}
                  </Col>
                  <Col span={11}>
                    {this.showRegions(team_name, region_list)}
                  </Col>
                  <Col span={1} className={styles.bor}>
                    <Dropdown overlay={menu(team_name)} placement="bottomLeft">
                      <Icon component={moreSvg} style={{ width: "100%" }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}
      </div>
    );
    let title = "我的团队";
    const content =
      "团队是企业下多租户资源划分的一个层级，平台中各类资源都属于团队";
    if (adminer) {
      title = "团队管理";
    }
    return (
      <PageHeaderLayout title={title} content={content}>
        {showCloseAllComponent && (
          <ConfirmModal
            onOk={this.handleCloseAllComponentInTeam}
            loading={closeTeamComponentLoading}
            title="关闭团队下所有组件"
            subDesc="此操作不可恢复"
            desc="确定要关闭团队下所有组件吗?"
            onCancel={this.hideCloseAllComponent}
          />
        )}
        {this.state.joinTeam && (
          <JoinTeam
            enterpriseID={eid}
            onOk={this.handleJoinTeam}
            onCancel={this.cancelJoinTeam}
          />
        )}

        {this.state.showAddTeam && (
          <CreateTeam
            enterprise_id={eid}
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
            title="撤销申请"
            subDesc="此操作不可恢复"
            desc="确定要撤销此申请吗?"
            onCancel={this.hideDelApply}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            loading={delTeamLoading}
            onOk={this.handleDelTeam}
            title="删除团队"
            subDesc="此操作不可恢复"
            desc="确定要删除此团队和团队下的所有资源吗？"
            onCancel={this.hideDelTeam}
          />
        )}

        {enterpriseTeamsLoading || overviewTeamsLoading || userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>{adminer ? managementTemas : teamInfo}</div>
        )}
      </PageHeaderLayout>
    );
  }
}
