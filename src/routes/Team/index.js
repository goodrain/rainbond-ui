import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link } from "dva/router";
import { Row, Col, Card, List, Avatar, Button, Icon, Popconfirm, Form, Table } from "antd";
import TeamMemberTable from "../../components/TeamMemberTable";
import TeamRoleTable from "../../components/TeamRoleTable";
import ConfirmModal from "../../components/ConfirmModal";
import AddMember from "../../components/AddMember";
import AddRole from "../../components/AddRole";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import styles from "./index.less";
import globalUtil from "../../utils/global";
import userUtil from "../../utils/user";
import teamUtil from "../../utils/team";
import OpenRegion from "../../components/OpenRegion";
import cookie from "../../utils/cookie";
import { routerRedux } from "dva/router";
import ScrollerX from "../../components/ScrollerX";
import MoveTeam from "./move_team";

const FormItem = Form.Item;

@connect(({
  user, teamControl, loading, index,
}) => ({
  currUser: user.currentUser,
  teamControl,
  projectLoading: loading.effects["project/fetchNotice"],
  activitiesLoading: loading.effects["activities/fetchList"],
  regions: teamControl.regions,
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    const params = this.getParam();
    this.state = {
      showEditName: false,
      showDelTeam: false,
      showAddMember: false,
      toDeleteMember: null,
      toEditAction: null,
      toMoveTeam: null,
      openRegion: false,
      showExitTeam: false,
      page: 1,
      pageSize: 8,
      total: 0,
      members: [],
      roles: [],
      rolePage: 1,
      roleTotal: 0,
      rolePageSize: 8,
      events: [],
      eventPage: 1,
      eventPageSize: 6,
      eventTotal: 0,
      showAddRole: false,
      deleteRole: null,
      editRole: null,
      scope: params.type || "event",
      joinUsers: [],
    };
  }
  getParam() {
    return this.props.match.params;
  }
  componentDidMount() {
    this.loadEvents();
    this.loadMembers();
    this.loadRoles();
    this.props.dispatch({ type: "teamControl/fetchAllPerm" });
    this.fetchRegions();
    this.loadJoinUsers();
  }
  loadJoinUsers = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/getJoinTeamUsers",
      payload: {
        team_name: teamName,
      },
      callback: (data) => {
        this.setState({
          joinUsers: data.list || [],
        });
      },
    });
  }
  loadRoles = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    dispatch({
      type: "teamControl/getRoles",
      payload: {
        team_name,
        page_size: this.state.rolePageSize,
        page: this.state.rolePage,
      },
      callback: (data) => {
        this.setState({
          roles: data.list || [],
          roleTotal: data.total,
        });
      },
    });
  };
  loadEvents = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "index/fetchEvents",
      payload: {
        team_name: teamName,
        page_size: this.state.eventPageSize,
        page: this.state.eventPage,
      },
      callback: (data) => {
        this.setState({
          events: data.list || [],
          eventTotal: data.total || data.list.length,
        });
      },
    });
  };
  loadMembers = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch({
      type: "teamControl/fetchMember",
      payload: {
        team_name: teamName,
        region_name: regionName,
        page_size: this.state.pageSize,
        page: this.state.page,
      },
      callback: (data) => {
        this.setState({
          members: data.list || [],
          total: data.total,
        });
      },
    });
  };
  fetchRegions = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();

    dispatch({
      type: "teamControl/fetchRegions",
      payload: {
        team_name: teamName,
      },
    });
  };
  componentWillUnmount() {}
  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  showAddRole = () => {
    this.setState({ showAddRole: true });
  };
  hideAddRole = () => {
    this.setState({ showAddRole: false });
  };
  handleAddRole = (values) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/createRole",
      payload: {
        team_name,
        ...values,
      },
      callback: () => {
        this.loadRoles();
        this.hideAddRole();
      },
    });
  };
  showExitTeam = () => {
    this.setState({ showExitTeam: true });
  };
  hideExitTeam = () => {
    this.setState({ showExitTeam: false });
  };
  handleExitTeam = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/exitTeam",
      payload: {
        team_name,
      },
      callback: () => {
        cookie.remove("team");
        cookie.remove("region_name");
        this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`));
        location.reload();
      },
    });
  };
  showDelTeam = () => {
    this.setState({ showDelTeam: true });
  };
  hideDelTeam = () => {
    this.setState({ showDelTeam: false });
  };
  handleEditName = (data) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/editTeamAlias",
      payload: {
        team_name,
        ...data,
      },
      callback: () => {
        this.props.dispatch({ type: "user/fetchCurrent" });
        this.hideEditName();
      },
    });
  };
  handleDelTeam = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/delTeam",
      payload: {
        team_name,
      },
      callback: () => {
        location.hash = "/index";
        location.reload();
      },
    });
  };
  handleAddMember = (values) => {
    this.props.dispatch({
      type: "teamControl/addMember",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_ids: values.user_ids.map(item => item.key).join(","),
        role_ids: values.role_ids.join(","),
      },
      callback: () => {
        this.loadMembers();
        this.hideAddMember();
      },
    });
  };
  onDelMember = (member) => {
    this.setState({ toDeleteMember: member });
  };
  hideDelMember = () => {
    this.setState({ toDeleteMember: null });
  };
  handleDelMember = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/delMember",
      payload: {
        team_name,
        user_ids: this.state.toDeleteMember.user_id,
      },
      callback: () => {
        this.loadMembers();
        this.hideDelMember();
      },
    });
  };
  onEditAction = (member) => {
    this.setState({ toEditAction: member });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = (data) => {
    const team_name = globalUtil.getCurrTeamName();
    const toEditMember = this.state.toEditAction;
    this.props.dispatch({
      type: "teamControl/editMember",
      payload: {
        team_name,
        user_id: toEditMember.user_id,
        role_ids: data.role_ids.join(","),
      },
      callback: () => {
        this.loadMembers();
        this.hideEditAction();
      },
    });
  };
  onMoveTeam = (member) => {
    this.setState({ toMoveTeam: member });
  };
  hideMoveTeam = () => {
    this.setState({ toMoveTeam: null });
  };
  handleMoveTeam = ({ identity }) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/moveTeam",
      payload: {
        team_name,
        user_name: this.state.toMoveTeam.user_name,
      },
      callback: () => {
        this.loadMembers();
        this.hideMoveTeam();
      },
    });
  };
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false });
  };
  handleOpenRegion = (regions) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/openRegion",
      payload: {
        team_name,
        region_names: regions.join(","),
      },
      callback: () => {
        this.fetchRegions();
        this.props.dispatch({ type: "user/fetchCurrent" });
      },
    });
  };
  hanldeEventPageChange = (page) => {
    this.setState(
      {
        page,
      },
      () => {
        this.loadEvents();
      },
    );
  };
  hanldePageChange = (page) => {
    this.setState(
      {
        page,
      },
      () => {
        this.loadMembers();
      },
    );
  };
  hanldeRolePageChange = (page) => {
    this.setState(
      {
        rolePage: page,
      },
      () => {
        this.loadRoles();
      },
    );
  };
  onEditRole = (item) => {
    this.setState({ editRole: item });
  };
  handleEditRole = (values) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/editRole",
      payload: {
        team_name,
        role_id: this.state.editRole.role_id,
        ...values,
      },
      callback: () => {
        this.hideEditRole();
        this.loadRoles();
      },
    });
  };
  hideEditRole = () => {
    this.setState({ editRole: null });
  };
  onDelRole = (item) => {
    this.setState({ deleteRole: item });
  };
  handleDelRole = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/removeRole",
      payload: {
        team_name,
        role_id: this.state.deleteRole.role_id,
      },
      callback: () => {
        this.hideDelRole();
        this.loadRoles();
      },
    });
  };
  hideDelRole = () => {
    this.setState({ deleteRole: null });
  };
  handleTabChange = (key) => {
    this.setState({ scope: key });
  };
  handleRefused = (data) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/setJoinTeamUsers",
      payload: {
        team_name,
        user_id: data.user_id,
        action: false,
      },
      callback: () => {
        this.loadJoinUsers();
      },
    });
  }
  handleJoin = (data) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/setJoinTeamUsers",
      payload: {
        team_name,
        user_id: data.user_id,
        action: true,
      },
      callback: () => {
        this.loadJoinUsers();
      },
    });
  }
  renderActivities() {
    const list = this.state.events || [];

    if (!list.length) {
      return (
        <p
          style={{
            textAlign: "center",
            color: "ccc",
            paddingTop: 20,
          }}
        >
          暂无动态
        </p>
      );
    }

    const statusCNMap = {
      "": "进行中",
      complete: "完成",
      failure: "失败",
      timeout: "超时",
    };

    return list.map((item) => {
      const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
        item.service_alias
      }/overview`;
      return (
        <List.Item key={item.ID}>
          <List.Item.Meta
            title={
              <span>
                <a className={styles.username}>{item.nick_name}</a>
                <span>{item.type_cn}</span>
                <Link to={linkTo}>
                  {item.service_cname}
                </Link>应用<span>
                  {statusCNMap[item.final_status] ? `${statusCNMap[item.final_status]}` : ""}
                         </span>
              </span>
            }
            description={
              <span className={styles.datetime} title={item.updatedAt}>
                {" "}
                {moment(item.start_time).fromNow()}{" "}
              </span>
            }
          />
        </List.Item>
      );
    });
  }
  render() {
    const {
      index, projectLoading, activitiesLoading, currUser, teamControl, regions,
    } = this.props;

    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, team_name);
    const roles = this.state.roles;

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar size="large" src={require("../../../public/images/team-icon.png")} />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {team.team_alias}{" "}
            {teamUtil.canEditTeamName(team) && <Icon onClick={this.showEditName} type="edit" />}
          </div>
          <div>创建于 {moment(team.create_time).format("YYYY-MM-DD")}</div>
        </div>
      </div>
    );
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.extraBtns}>
          <Button onClick={this.showExitTeam} type="dashed">
            退出团队
          </Button>
          {
            <Button
              disabled={!teamUtil.canDeleteTeam(team)}
              onClick={this.showDelTeam}
              type="dashed"
            >
              {" "}
              删除团队{" "}
            </Button>
          }
        </div>
      </div>
    );
    const datacenterCar = (
      <Card
        className={styles.projectList}
        style={{
          marginBottom: 24,
        }}
        title="已开通数据中心"
        bordered={false}
        extra={
          teamUtil.canAddRegion(team) ? (
            <a href="javascript:;" onClick={this.onOpenRegion}>
              {" "}
              开通数据中心{" "}
            </a>
          ) : null
        }
        loading={projectLoading}
        bodyStyle={{
          padding: 0,
        }}
      >
        {(regions || []).map(item => (
          <Card.Grid className={styles.projectGrid} key={item.ID}>
            <Card
              bodyStyle={{
                padding: 0,
              }}
              bordered={false}
            >
              <Card.Meta
                title={
                  <div className={styles.cardTitle}>
                    <Avatar size="small" src={item.logo} />
                    <a href="javascript:;">{item.region_alisa}</a>
                  </div>
                }
                description={item.desc || "-"}
              />
              <div className={styles.projectItemContent}>
                <span className={styles.datetime}>
                  开通于 {moment(item.create_time).format("YYYY年-MM月-DD日")}
                </span>
              </div>
            </Card>
          </Card.Grid>
        ))}
        {!regions || !regions.length ? (
          <p
            style={{
              textAlign: "center",
              paddingTop: 20,
            }}
          >
            暂无数据中心
          </p>
        ) : (
          ""
        )}
      </Card>
    );

    const members = this.state.members;

    const pagination = {
      current: this.state.page,
      pageSize: this.state.pageSize,
      total: this.state.total,
      onChange: (v) => {
        this.hanldePageChange(v);
      },
    };

    const memberCar = (
      <Card
        style={{
          marginBottom: 24,
        }}
        bodyStyle={{
          paddingTop: 12,
        }}
        bordered={false}
        title="团队成员"
        extra={
          teamUtil.canAddMember(team) ? (
            <a href="javascript:;" onClick={this.showAddMember}>
              添加成员
            </a>
          ) : null
        }
      >
        <ScrollerX sm={600}>
          <TeamMemberTable
            pagination={pagination}
            team={team}
            onMoveTeam={this.onMoveTeam}
            onDelete={this.onDelMember}
            onEditAction={this.onEditAction}
            list={members}
          />
        </ScrollerX>
      </Card>
    );

    const RolePagination = {
      current: this.state.rolePage,
      pageSize: this.state.rolePageSize,
      total: this.state.roleTotal,
      onChange: (v) => {
        this.hanldeRolePageChange(v);
      },
    };

    const roleCar = (
      <Card
        bodyStyle={{
          paddingTop: 12,
        }}
        bordered={false}
        title="角色管理 "
        extra={
          teamUtil.canAddRole(team) && (
            <a href="javascript:;" onClick={this.showAddRole}>
              添加角色
            </a>
          )
        }
      >
        <ScrollerX sm={600}>
          <TeamRoleTable
            pagination={RolePagination}
            team={team}
            onDelete={this.onDelRole}
            onEdit={this.onEditRole}
            list={roles}
          />
        </ScrollerX>
      </Card>
    );

    const eventpagination = {
      current: this.state.eventPage,
      pageSize: this.state.eventPageSize,
      total: this.state.eventTotal,
      onChange: (v) => {
        this.hanldeEventPageChange(v);
      },
    };
    const eventCar = (
      <Row gutter={24}>
        <Col md={12} sm={24}>
          <Card
            bodyStyle={{
              paddingTop: 12,
            }}
            bordered={false}
            title="团队动态"
            loading={activitiesLoading}
          >
            <List pagination={eventpagination} loading={activitiesLoading} size="large">
              <div className={styles.activitiesList}>{this.renderActivities()}</div>
            </List>
          </Card>
        </Col>
        <Col md={12} sm={24}>
          <Card
            bodyStyle={{
              paddingTop: 12,
            }}
            bordered={false}
            title="以下用户申请加入团队"
          >
            <Table
              pagination={false}
              dataSource={this.state.joinUsers || []}
              columns={[{
            title: "用户",
            dataIndex: "user_name",
          }, {
            title: "申请时间",
            dataIndex: "apply_time",
          }, {
            title: "操作",
            dataIndex: "",
            render: (v, data) => (data.is_pass == 0 && (<Fragment>
              <Popconfirm title="确定要通过用户加入么?" onConfirm={() => { this.handleJoin(data); }}>
                <a href="javascript:;">通过</a>
              </Popconfirm>
              <Popconfirm title="确定要拒绝用户么?" onConfirm={() => { this.handleRefused(data); }}>
                <a style={{ marginLeft: 6}} href="javascript:;">拒绝</a>
              </Popconfirm>
            </Fragment>)),
          }]}
            />
          </Card>
        </Col>
      </Row>
    );
    const tabList = [
      {
        key: "event",
        tab: "团队动态",
      },
      {
        key: "member",
        tab: "成员",
      },
      {
        key: "datecenter",
        tab: "数据中心",
      },
      {
        key: "role",
        tab: "角色",
      },
    ];

    return (
      <PageHeaderLayout
        tabList={tabList}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {this.state.scope === "datecenter" && datacenterCar}
        {this.state.scope === "member" && memberCar}
        {this.state.scope === "role" && roleCar}
        {this.state.scope === "event" && eventCar}

        {this.state.showEditName && (
          <MoveTeam
            teamAlias={team.team_alias}
            onSubmit={this.handleEditName}
            onCancel={this.hideEditName}
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
        {this.state.showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title="退出团队"
            subDesc="此操作不可恢复"
            desc="确定要退出此团队吗?"
            onCancel={this.hideExitTeam}
          />
        )}
        {this.state.toDeleteMember && (
          <ConfirmModal
            onOk={this.handleDelMember}
            title="删除成员"
            subDesc="此操作不可恢复"
            desc="确定要删除此成员吗？"
            onCancel={this.hideDelMember}
          />
        )}
        {this.state.toMoveTeam && (
          <ConfirmModal
            onOk={this.handleMoveTeam}
            title="移交团队"
            subDesc="移交后您将失去所有权"
            desc={`确定要把团队移交给 ${this.state.toMoveTeam.user_name} 吗？`}
            onCancel={this.hideMoveTeam}
          />
        )}

        {this.state.showAddMember && (
          <AddMember
            roles={this.state.roles}
            onOk={this.handleAddMember}
            onCancel={this.hideAddMember}
          />
        )}

        {this.state.toEditAction && (
          <AddMember
            roles={this.state.roles}
            data={this.state.toEditAction}
            onOk={this.handleEditAction}
            onCancel={this.hideEditAction}
          />
        )}

        {this.state.showAddRole && (
          <AddRole
            actions={teamControl.actions}
            onOk={this.handleAddRole}
            onCancel={this.hideAddRole}
          />
        )}

        {this.state.editRole && (
          <AddRole
            title="修改角色"
            data={this.state.editRole}
            actions={teamControl.actions}
            onOk={this.handleEditRole}
            onCancel={this.hideEditRole}
          />
        )}

        {this.state.deleteRole && (
          <ConfirmModal
            onOk={this.handleDelRole}
            title="删除角色"
            subDesc="此操作不可恢复"
            desc={`确定要删除角色 （${this.state.deleteRole.role_name}） 吗？`}
            onCancel={this.hideDelRole}
          />
        )}

        {this.state.openRegion && (
          <OpenRegion onSubmit={this.handleOpenRegion} onCancel={this.cancelOpenRegion} />
        )}
      </PageHeaderLayout>
    );
  }
}
