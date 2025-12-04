import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { Button, Table } from 'antd';
import teamUtil from '../../utils/team';
import cookie from '@/utils/cookie';
import roleUtil from '../../utils/role';

class TeamMemberTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 10
    };
  }
  onPageChange = (page, pageSize) => {
    this.setState({
      page,
      pageSize
    });
  }
  render() {
    const { page, pageSize } = this.state;
    const {
      list,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete },
      team,
      users
    } = this.props;
    const pagination = {
      current: page,
      pageSize: pageSize,
      total: list.length ,
      onChange: this.onPageChange,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: (total) => `共 ${total} 条`,
      onShowSizeChange: this.onPageChange,
      hideOnSinglePage: list.length<=10
  }
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
          const isRoles = data.roles.some(role => role.role_id == 0);
          const currUser = users.user_id === data.user_id;
          return (
            <div>
              {isEdit && (
                <Button
                  type="link"
                  size='small'
                  disabled={isRoles}
                  style={{
                    marginLeft: 6,
                  }}
                  onClick={() => {
                    onEditAction(data);
                  }}
                >
                  {formatMessage({id: 'teamManage.tabs.member.table.editRole'})}
                </Button>
              )}
              {teamUtil.canChangeOwner(team) && (
                <Button
                  type="link"
                  size='small'
                  disabled={isRoles}
                  style={{
                    marginLeft: 6,
                  }}
                  onClick={() => {
                    onMoveTeam(data);
                  }}
                >
                  
                  {formatMessage({id: 'teamManage.tabs.member.table.turnOver'})}
                </Button>
              )}
              {isDelete && (
                <Button
                  type="link"
                  size='small'
                  disabled={isRoles || currUser}
                  onClick={() => {
                    onDelete(data);
                  }}
                >
                  {formatMessage({id: 'teamManage.tabs.member.table.delete'})}
                </Button>
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
