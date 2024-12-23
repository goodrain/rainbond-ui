import { Card, notification, Button, Modal, Select, message } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import AddMember from '../../AddMember';
import ConfirmModal from '../../ConfirmModal';
import ScrollerX from '../../ScrollerX';
import TeamMemberTable from '../../TeamMemberTable';
import roleUtil from '../../../utils/role';
import copy from 'copy-to-clipboard';

@connect(({ teamControl, loading, user, index }) => ({
  currUser: user.currentUser,
  regions: teamControl.regions,
  currentTeam: teamControl.currentTeam,
  toMoveTeamLoading: loading.effects['teamControl/moveTeam'],
  overviewInfo: index.overviewInfo
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
      showInviteModal: false,
      selectedRole: undefined,
      inviteLink: '',
      isLinkGenerated: false,
      roles: []
    };
  }
  componentDidMount() {
    this.loadMembers();
    this.loadRoles();
  }
  onMoveTeam = member => {
    this.setState({ toMoveTeam: member });
  };
  onDelMember = member => {
    this.setState({ toDeleteMember: member });
  };
  onEditAction = member => {
    this.setState({ toEditAction: member });
  };
  hideMoveTeam = () => {
    this.setState({ toMoveTeam: null });
  };
  handleMoveTeam = () => {
    this.props.dispatch({
      type: 'teamControl/moveTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: this.state.toMoveTeam.user_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: res.msg_show });
        }
        this.updateCurrentUser();
        this.loadMembers();
        this.hideMoveTeam();
      }
    });
  };

  updateCurrentUser = () => {
    this.props.dispatch({
      type: 'user/fetchCurrent'
    });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = data => {
    const toEditMember = this.state.toEditAction;
    this.props.dispatch({
      type: 'teamControl/editMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: toEditMember.user_id,
        role_ids: data.role_ids
      },
      callback: () => {
        this.loadMembers();
        this.hideEditAction();
      }
    });
  };
  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  handleAddMember = values => {
    this.props.dispatch({
      type: 'teamControl/addMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_ids: values.user_ids.map(item => item.key).join(','),
        role_ids: values.role_ids.join(',')
      },
      callback: () => {
        this.loadMembers();
        this.hideAddMember();
      }
    });
  };
  hideDelMember = () => {
    this.setState({ toDeleteMember: null });
  };
  handleDelMember = () => {
    this.props.dispatch({
      type: 'teamControl/delMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_ids: this.state.toDeleteMember.user_id
      },
      callback: () => {
        this.loadMembers();
        this.hideDelMember();
      }
    });
  };
  loadMembers = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch({
      type: 'teamControl/fetchTeamMember',
      payload: {
        team_name: teamName,
        region_name: regionName,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        if (data) {
          this.setState({
            members: data.list || [],
            total: data.total
          });
        }
      }
    });
  };
  hanldePageChange = page => {
    this.setState({ page }, () => {
      this.loadMembers();
    });
  };
  showInviteModal = () => {
    this.setState({
      showInviteModal: true,
      selectedRole: undefined,
      inviteLink: '',
      isLinkGenerated: false
    });
  };

  handleRoleChange = (value) => {
    this.setState({ selectedRole: value });
  };

  handleCreateInviteLink = () => {
    const { dispatch, overviewInfo } = this.props;
    const { selectedRole } = this.state;

    dispatch({
      type: 'user/createInviteLink',
      payload: {
        team_id: overviewInfo.team_id,
        role_id: selectedRole
      },
      callback: res => {
        console.log(res,"res");
        
        if (res && res.status_code === 200) {
          const inviteLink = res.bean.invite_id;
          this.setState({
            inviteLink: `${window.location.origin}/#/invite/${inviteLink}`,
            isLinkGenerated: true
          });
        }
      }
    });
  };

  handleCopyLink = () => {
    const { inviteLink } = this.state;
    copy(inviteLink);
    message.success(formatMessage({ id: 'versionUpdata_6_1.invite.copy.success' }));
    this.handleCloseModal();
  };

  handleCloseModal = () => {
    this.setState({ showInviteModal: false });
  };
  loadRoles = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_size: -1,
        page: 1
      },
      callback: data => {
        this.setState(
          {
            roles: data.list || []
          }
        );
      }
    });
  };

  render() {
    const {
      currentTeam,
      memberPermissions,
      toMoveTeamLoading,
      memberPermissions: { isCreate },
      currUser
    } = this.props;
    const {
      page,
      pageSize,
      total,
      showAddMember,
      members,
      roles,
      toEditAction,
      toDeleteMember,
      toMoveTeam,
      showInviteModal,
      selectedRole,
      inviteLink,
      isLinkGenerated
    } = this.state;
    const pagination = {
      current: page,
      pageSize,
      total,
      onChange: v => {
        this.hanldePageChange(v);
      }
    };
    return (
      <div>
        <Card
          style={{
            marginBottom: 24
          }}
          bodyStyle={{
            paddingTop: 12
          }}
          title={formatMessage({ id: 'teamManage.tabs.member.title' })}
          extra={
            <Button onClick={this.showInviteModal} type="primary" icon='plus'>
              { formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.submit' }) }
            </Button>
          }
        >
          <ScrollerX sm={600}>
            <TeamMemberTable
              users={currUser}
              memberPermissions={memberPermissions}
              team={currentTeam}
              onMoveTeam={this.onMoveTeam}
              onDelete={this.onDelMember}
              onEditAction={this.onEditAction}
              list={members}
            />
          </ScrollerX>
        </Card>
        {showAddMember && (
          <AddMember
            roles={roles}
            onOk={this.handleAddMember}
            onCancel={this.hideAddMember}
          />
        )}

        {toEditAction && (
          <AddMember
            roles={roles}
            data={toEditAction}
            onOk={this.handleEditAction}
            onCancel={this.hideEditAction}
          />
        )}
        {toDeleteMember && (
          <ConfirmModal
            onOk={this.handleDelMember}
            title={formatMessage({ id: 'confirmModal.delete.member' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.member.desc' })}
            onCancel={this.hideDelMember}
          />
        )}
        {toMoveTeam && (
          <ConfirmModal
            onOk={this.handleMoveTeam}
            loading={toMoveTeamLoading}
            title={formatMessage({ id: 'confirmModal.MoveTeam.title' })}
            subDesc={formatMessage({ id: 'confirmModal.MoveTeam.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.MoveTeam.desc' }, { nick_name: toMoveTeam.nick_name })}
            onCancel={this.hideMoveTeam}
          />
        )}
        <Modal
          title={formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.title' })}
          visible={showInviteModal}
          onCancel={this.handleCloseModal}
          footer={[
            <Button key="cancel" onClick={this.handleCloseModal}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              disabled={!selectedRole && !isLinkGenerated}
              onClick={isLinkGenerated ? this.handleCopyLink : this.handleCreateInviteLink}
            >
              {isLinkGenerated ? formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.copy' }) : formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.submit' })}
            </Button>
          ]}
        >
          <div style={{ marginBottom: 16 }}>
            <Select
              style={{ width: '100%' }}
              placeholder={formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.subDesc' })}
              onChange={this.handleRoleChange}
              disabled={isLinkGenerated}
              value={selectedRole}
            >
              {roles.map(item => {
                const { ID, name } = item;
                return (
                  <Option key={ID} value={ID}>
                    {roleUtil.actionMap(name, true)}
                  </Option>
                );
              })}
            </Select>
          </div>
          {isLinkGenerated && (
            <div style={{
              background: '#f5f5f5',
              padding: '8px 12px',
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {inviteLink}
            </div>
          )}
        </Modal>
      </div>
    );
  }
}
