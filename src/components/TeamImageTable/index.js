import React, { PureComponent } from 'react';
import { Table } from 'antd';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';
import globalUtil from "../../utils/global"
import { gitAuthorizationMessage } from "../../services/app"

class TeamMemberTable extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
    }
  }
  render() {
    const {
      list,
      members,
      pagination,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete, isAccess },
      team,
    } = this.props;
    const columns = [
      {
        title: '镜像仓库地址',
        dataIndex: 'domain',
        key: "domain",
        align:'center'
        
      },
      {
        title: '用户名',
        dataIndex: 'username',
        key: "username",
        align:'center'
      },
      {
        title: '密码',
        dataIndex: 'password',
        key: "password",
        align:'center',
        render(text, data){
          let num = text.length
          let str = ''
          for (let index = 0; index <= num-1; index++) {
            str += "*"
          }
          return <span>{str}</span>
        }
      },
        {
          title: isAccess && (isEdit || isDelete) ? '操作' : '',
          dataIndex: 'action',
          key: "action",
          align:'center',
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
