import React, { PureComponent } from 'react';
import { Table } from 'antd';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';

class TeamMemberTable extends PureComponent {
  render() {
    const {
    //   list,
      pagination,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete },
      team,
    } = this.props;
    const list = [
                    {
                        domain:'https://www.baidu.com',
                        username:'admin',
                        password: '*******',
                        tenant_id:'adsss',
                        secret_id: 'secret'
                    },
                ]
    const columns = [
      {
        title: '镜像仓库地址',
        dataIndex: 'domain',
      },
      {
        title: '用户名',
        dataIndex: 'username',
      },
      {
        title: '密码',
        dataIndex: 'password',
      },
      {
        title: '操作',
        dataIndex: 'action',
        render(_, data) {
          return (
            <div>
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
                  修改
                </a>
              )}
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
