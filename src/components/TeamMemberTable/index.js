import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { Button, Table } from 'antd';
import teamUtil from '../../utils/team';
import cookie from '@/utils/cookie';
import roleUtil from '../../utils/role';

class TeamMemberTable extends PureComponent {
  render() {
    const {
      list,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete },
      team,
      users,
      pagination
    } = this.props;

    const isZhCN = cookie.get('language') === 'zh-CN';
    const columns = [
      {
        title: formatMessage({ id: 'teamManage.tabs.member.table.userName' }),
        dataIndex: 'nick_name'
      },
      {
        title: formatMessage({ id: 'teamManage.tabs.member.table.email' }),
        dataIndex: 'email'
      },
      {
        title: formatMessage({ id: 'teamManage.tabs.member.table.role' }),
        dataIndex: 'roles',
        render: val => (
          <span>
            {(val || []).map(item => (
              <span
                style={{ marginRight: '8px' }}
                key={`role${item.role_id}`}
              >
                {roleUtil.actionMap(item.role_name, isZhCN)}
              </span>
            ))}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'teamManage.tabs.member.table.operate' }),
        dataIndex: 'action',
        render: (_, data) => {
          const isOwner = data.roles.some(role => role.role_id === 0);
          const isCurrUser = users.user_id === data.user_id;

          return (
            <div>
              {isEdit && (
                <Button
                  type="link"
                  size="small"
                  disabled={isOwner}
                  style={{ marginLeft: 6 }}
                  onClick={() => onEditAction(data)}
                >
                  {formatMessage({ id: 'teamManage.tabs.member.table.editRole' })}
                </Button>
              )}
              {teamUtil.canChangeOwner(team) && (
                <Button
                  type="link"
                  size="small"
                  disabled={isOwner}
                  style={{ marginLeft: 6 }}
                  onClick={() => onMoveTeam(data)}
                >
                  {formatMessage({ id: 'teamManage.tabs.member.table.turnOver' })}
                </Button>
              )}
              {isDelete && (
                <Button
                  type="link"
                  size="small"
                  disabled={isOwner || isCurrUser}
                  onClick={() => onDelete(data)}
                >
                  {formatMessage({ id: 'teamManage.tabs.member.table.delete' })}
                </Button>
              )}
            </div>
          );
        }
      }
    ];

    return (
      <Table
        rowKey={(record, index) => index}
        pagination={pagination}
        dataSource={list}
        columns={columns}
      />
    );
  }
}

export default TeamMemberTable;
