import React, { PureComponent } from "react";
import { connect } from "dva";
import { Card } from "antd";
import ScrollerX from "../../ScrollerX";
import teamUtil from "../../../utils/team";
import globalUtil from "../../../utils/global";
import userUtil from "../../../utils/user";
import TeamRoleTable from "../../TeamRoleTable";
import AddRole from "../../AddRole";
import ConfirmModal from "../../ConfirmModal";

@connect(({ teamControl, loading, user }) => ({
  teamControl,
  currUser: user.currentUser,
  activitiesLoading: loading.effects["activities/fetchList"],
}))
export default class RoleList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showAddRole: false,
      page: 1,
      pageSize: 8,
      total: 0,
      roles: [],
    };
  }
  componentDidMount() {
    this.loadRoles();
  }
  onDelRole = (item) => {
    this.setState({ deleteRole: item });
  };
  onEditRole = (item) => {
    this.setState({ editRole: item });
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
  loadRoles = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: "teamControl/getRoles",
      payload: {
        team_name,
        page_size: this.state.pageSize,
        page: this.state.page,
      },
      callback: (data) => {
        this.setState({
          roles: data.list || [],
          total: data.total,
        });
      },
    });
  };
  hanldePageChange = (page) => {
    this.setState({ page }, () => {
      this.loadRoles();
    });
  };
  render() {
    const { currUser, teamControl } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, teamName);
    const pagination = {
      current: this.state.page,
      pageSize: this.state.pageSize,
      total: this.state.total,
      onChange: (v) => {
        this.hanldePageChange(v);
      },
    };
    return (
      <div>
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
              pagination={pagination}
              team={team}
              onDelete={this.onDelRole}
              onEdit={this.onEditRole}
              list={this.state.roles}
            />
          </ScrollerX>
        </Card>
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
      </div>
    );
  }
}
