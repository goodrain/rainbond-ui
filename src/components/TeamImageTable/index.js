import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { Table } from 'antd';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';
import globalUtil from "../../utils/global"

class TeamMemberTable extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      page: 1,
      pageSize: 10
    }
  }
  onPageChange = (page, pageSize) => {
    this.setState({
      page,
      pageSize
    });
  }
  render() {
    const { page, pageSize } = this.state
    const {
      list,
      members,
      onDelete,
      onEditAction,
      onMoveTeam,
      memberPermissions: { isEdit, isDelete, isAccess },
      team,
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
        render: (text, data) => {
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
          render: (_, data) => {
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
                  >
                    {formatMessage({id: 'teamManage.tabs.image.table.btn.edit'})}
                  </a>
                )}
                {isDelete && (
                  <a
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
      <Table rowKey={(record,index) => index}  pagination={pagination} dataSource={list} columns={columns} />
    );
  }
}

export default TeamMemberTable;
