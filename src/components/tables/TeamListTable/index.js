import React, { PureComponent } from "react";
import { Table, Popconfirm } from "antd";

class TeamListTable extends PureComponent {
  state = {
    selectedRowKeys: [],
    totalCallNo: 0,
  };

  componentWillReceiveProps() {}

  handleTableChange = (pagination, filters, sorter) => {
    if (this.props.onChange) {
      this.props.onChange(pagination, filters, sorter);
    }
  };

  render() {
    const { list, pagination, onDelete } = this.props;

    const columns = [
      {
        title: "团队名称",
        dataIndex: "team_alias",
      },
      {
        title: "拥有人",
        dataIndex: "owner",
        render(val) {
          return <span>{val}</span>;
        },
      },
      {
        title: "创建时间",
        dataIndex: "create_time",
        render(val) {
          return <span>{val}</span>;
        },
      },
      {
        title: "资源分配策略",
        dataIndex: "",
        render(val) {
          return <span>企业共享</span>;
        },
      },
      {
        title: "操作",
        dataIndex: "action",
        render(val, data) {
          return (
            <div>
              <Popconfirm
                title="确定要删除此团队么?"
                onConfirm={() => {
                  onDelete(data.team_name);
                }}
              >
                <a href="javascript:;">删除</a>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    return (
      <Table
        pagination={pagination}
        rowKey={(record,index) => index}
        dataSource={list}
        columns={columns}
        onChange={this.handleTableChange}
      />
    );
  }
}

export default TeamListTable;
