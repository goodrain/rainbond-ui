import React, { PureComponent } from "react";
import { connect } from "dva";
import { Card } from "antd";
import ScrollerX from "../../ScrollerX";
import teamUtil from "../../../utils/team";
import globalUtil from "../../../utils/global";
import userUtil from "../../../utils/user";
import TeamMemberTable from "../../TeamMemberTable";
import AddMember from "../../AddMember";
import ConfirmModal from "../../ConfirmModal";

@connect(({ teamControl, loading, user }) => ({
  regions: teamControl.regions,
  currUser: user.currentUser,
  activitiesLoading: loading.effects["activities/fetchList"],
}))
export default class MemberList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showAddMember: false,
      toDeleteMember: null,
      toMoveTeam: null,
      page: 1,
      pageSize: 8,
      total: 0,
      members: [],
    };
  }
  componentDidMount() {
    this.loadMembers();
  }
  onMoveTeam = (member) => {
    this.setState({ toMoveTeam: member });
  };
  onDelMember = (member) => {
    this.setState({ toDeleteMember: member });
  };
  onEditAction = (member) => {
    this.setState({ toEditAction: member });
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
        this.updateCurrentUser()
        this.loadMembers();
        this.hideMoveTeam();
      },
    });
  };

  updateCurrentUser=()=>{
    this.props.dispatch({
      type: "user/fetchCurrent",
    })
  }
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
  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
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
  hanldePageChange = (page) => {
    this.setState({ page }, () => {
      this.loadMembers();
    });
  };
  render() {
    const { currUser } = this.props;
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
              list={this.state.members}
            />
          </ScrollerX>
        </Card>
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
      </div>
    );
  }
}
