import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
    console.log(list,"list");
    const columns = [
      {
        title: formatMessage({id: 'teamManage.tabs.image.table.imageAddress'}),
        dataIndex: 'domain',
        key: "domain",
        align:'center'
        
      },
      {
        title: formatMessage({id: 'teamManage.tabs.image.table.user'}),
        dataIndex: 'username',
        key: "username",
        align:'center'
      },
      {
        title: formatMessage({id: 'teamManage.tabs.image.table.password'}),
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
          title: isAccess && (isEdit || isDelete) ? formatMessage({id: 'teamManage.tabs.image.table.operate'}) : '',
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
                    {formatMessage({id: 'teamManage.tabs.image.table.btn.edit'})}
                  </a>
                )}
                {isDelete && (
                  <a
                    href="javascript:;"
                    onClick={() => {
                      onDelete(data);
                    }}
                  >
                    {formatMessage({id: 'teamManage.tabs.image.table.btn.delete'})}
                  </a>
                )}
              </div>
            );
          },
        },
    ];

    return (
      <Table pagination={list.length > 8 ? pagination : false} dataSource={list} columns={columns} />
    );
  }
}

export default TeamMemberTable;
