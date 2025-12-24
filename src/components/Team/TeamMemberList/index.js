import { notification, Button, Modal, Select, message } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import copy from 'copy-to-clipboard';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../../utils/global';
import roleUtil from '../../../utils/role';
import teamUtil from '../../../utils/team';
import handleAPIError from '../../../utils/error';
import AddMember from '../../AddMember';
import ConfirmModal from '../../ConfirmModal';
import ScrollerX from '../../ScrollerX';
import TeamMemberTable from '../../TeamMemberTable';
import styles from './index.less';

const { Option } = Select;

@connect(({ teamControl, loading, user, index }) => ({
  currUser: user.currentUser,
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

  // 显示/隐藏成员操作弹窗
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

  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };

  hideDelMember = () => {
    this.setState({ toDeleteMember: null });
  };

  showAddMember = () => {
    this.setState({ showAddMember: true });
  };

  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };

  // 更新当前用户信息
  updateCurrentUser = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };

  // 移除成员
  handleMoveTeam = () => {
    const { dispatch } = this.props;
    const { toMoveTeam } = this.state;

    dispatch({
      type: 'teamControl/moveTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: toMoveTeam.user_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: res.msg_show });
        }
        this.updateCurrentUser();
        this.loadMembers();
        this.hideMoveTeam();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 编辑成员角色
  handleEditAction = data => {
    const { dispatch } = this.props;
    const { toEditAction } = this.state;

    dispatch({
      type: 'teamControl/editMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: toEditAction.user_id,
        role_ids: data.role_ids
      },
      callback: () => {
        this.loadMembers();
        this.hideEditAction();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 添加成员
  handleAddMember = values => {
    const { dispatch } = this.props;

    dispatch({
      type: 'teamControl/addMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_ids: values.user_ids.map(item => item.key).join(','),
        role_ids: values.role_ids.join(',')
      },
      callback: () => {
        this.loadMembers();
        this.hideAddMember();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 删除成员
  handleDelMember = () => {
    const { dispatch } = this.props;
    const { toDeleteMember } = this.state;

    dispatch({
      type: 'teamControl/delMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_ids: toDeleteMember.user_id
      },
      callback: () => {
        this.loadMembers();
        this.hideDelMember();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 加载团队成员列表
  loadMembers = () => {
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;

    dispatch({
      type: 'teamControl/fetchTeamMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        page_size: pageSize,
        page
      },
      callback: data => {
        if (data) {
          this.setState({
            members: data.list || [],
            total: data.total || 0
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 加载团队角色列表
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
        if (data) {
          this.setState({
            roles: data.list || []
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 分页切换
  handlePageChange = page => {
    this.setState({ page }, () => {
      this.loadMembers();
    });
  };

  // 显示邀请弹窗
  showInviteModal = () => {
    this.setState({
      showInviteModal: true,
      selectedRole: undefined,
      inviteLink: '',
      isLinkGenerated: false
    });
  };

  // 关闭邀请弹窗
  handleCloseModal = () => {
    this.setState({ showInviteModal: false });
  };

  // 角色选择变化
  handleRoleChange = value => {
    this.setState({ selectedRole: value });
  };

  // 创建邀请链接
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
        if (res && res.status_code === 200) {
          const inviteLink = res.bean.invite_id;
          this.setState({
            inviteLink: `${window.location.origin}/#/invite/${inviteLink}`,
            isLinkGenerated: true
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 复制邀请链接
  handleCopyLink = () => {
    const { inviteLink } = this.state;
    copy(inviteLink);
    message.success(formatMessage({ id: 'versionUpdata_6_1.invite.copy.success' }));
    this.handleCloseModal();
  };

  render() {
    const {
      currentTeam,
      memberPermissions,
      toMoveTeamLoading,
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
      onChange: this.handlePageChange
    };    
    // 检查是否有邀请成员的权限（需要是团队管理员或团队拥有者）
    const canInviteMember = teamUtil.canChangeOwner(currentTeam) || currUser?.is_enterprise_admin;

    return (
      <div>
        <div className={styles.memberListContainer}>
          <div className={styles.memberListHeader}>
            <div className={styles.sectionHeader}>
            </div>
            {canInviteMember && (
              <Button onClick={this.showInviteModal} type="primary" icon="plus">
                {formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.submit' })}
              </Button>
            )}
          </div>
          <ScrollerX sm={600}>
            <TeamMemberTable
              users={currUser}
              memberPermissions={memberPermissions}
              team={currentTeam}
              onMoveTeam={this.onMoveTeam}
              onDelete={this.onDelMember}
              onEditAction={this.onEditAction}
              list={members}
              pagination={pagination}
            />
          </ScrollerX>
        </div>
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
              {formatMessage({ id: 'popover.cancel' })}
            </Button>,
            <Button
              key="submit"
              type="primary"
              disabled={!selectedRole && !isLinkGenerated}
              onClick={isLinkGenerated ? this.handleCopyLink : this.handleCreateInviteLink}
            >
              {isLinkGenerated
                ? formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.copy' })
                : formatMessage({ id: 'versionUpdata_6_1.teamManage.invite.modal.submit' })}
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
              {roles.map(item => (
                <Option key={item.ID} value={item.ID}>
                  {roleUtil.actionMap(item.name, true)}
                </Option>
              ))}
            </Select>
          </div>
          {isLinkGenerated && (
            <div
              style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}
            >
              {inviteLink}
            </div>
          )}
        </Modal>
      </div>
    );
  }
}
