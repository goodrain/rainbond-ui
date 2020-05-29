import React, { PureComponent } from 'react';
import { Table } from 'antd';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';

class TeamMemberTable extends PureComponent {
  render() {
    const {
      list,
      pagination,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete },
      team,
    } = this.props;

    const columns = [
      {
        title: '用户名',
        dataIndex: 'nick_name',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
      },
      {
        title: '角色',
        dataIndex: 'roles',
        render(val) {
          return (
            <span>
              {(val || []).map(item => {
                return (
                  <span
                    style={{ marginRight: '8px' }}
                    key={`role${item.role_id}`}
                  >
                    {roleUtil.actionMap(item.role_name)}
                  </span>
                );
              })}
            </span>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        render(_, data) {
          return (
            <div>
              {isDelete && (
                <a
                  href="javascript:;"
                  onClick={() => {
                    onDelete(data);
                  }}
                >
                  删除
                </a>
              )}
              {isEdit && (
                <a
                  style={{
                    marginLeft: 6,
                  }}
                  onClick={() => {
                    onEditAction(data);
                  }}
                  href="javascript:;"
                >
                  修改角色
                </a>
              )}
              {teamUtil.canChangeOwner(team) && (
                <a
                  style={{
                    marginLeft: 6,
                  }}
                  onClick={() => {
                    onMoveTeam(data);
                  }}
                  href="javascript:;"
                >
                  移交团队
                </a>
              )}
            </div>
          );
        },
      },
    ];

    return (
      <Table pagination={pagination} dataSource={list} columns={columns} />
    );
  }
}

export default TeamMemberTable;
