import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Table } from 'antd';
import teamUtil from '../../utils/team';
import cookie from '@/utils/cookie';
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
        title: formatMessage({id: 'teamManage.tabs.member.table.userName'}),
        dataIndex: 'nick_name',
      },
      {
        title: formatMessage({id: 'teamManage.tabs.member.table.email'}),
        dataIndex: 'email',
      },
      {
        title: formatMessage({id: 'teamManage.tabs.member.table.role'}),
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
                    {roleUtil.actionMap(item.role_name, cookie.get('language') === 'zh-CN' ? true : false)}
                  </span>
                );
              })}
            </span>
          );
        },
      },
      {
        title: formatMessage({id: 'teamManage.tabs.member.table.operate'}),
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
                  {formatMessage({id: 'teamManage.tabs.member.table.delete'})}
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
                  {formatMessage({id: 'teamManage.tabs.member.table.editRole'})}
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
                  
                  {formatMessage({id: 'teamManage.tabs.member.table.turnOver'})}
                </a>
              )}
            </div>
          );
        },
      },
    ];

    return (
      <Table rowKey={(record,index) => index} pagination={pagination} dataSource={list} columns={columns} />
    );
  }
}

export default TeamMemberTable;
