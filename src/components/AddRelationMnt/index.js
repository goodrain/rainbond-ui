/*
  挂载共享目录组件
*/

import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link, Switch, Route } from "dva/router";
import {
  Input,
  Table,
  Modal,
  notification,
  Pagination,
} from "antd";
import { getMnt } from "../../services/app";
import globalUtil from "../../utils/global";

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      total: 0,
      current: 1,
      pageSize: 6,
      localpaths: {},
    };
  }
  componentDidMount() {
    this.loadUnMntList();
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({ message: "请选择要挂载的目录" });
      return;
    }

    let res = [];
    res = this.state.selectedRowKeys.map((index) => {
      const data = this.state.list[index];
      return { id: data.dep_vol_id, path: this.state.localpaths[data.dep_vol_id] };
    });
    res = res.filter(item => !!item.path);

    if (!res.length) {
      notification.warning({ message: "请检查本地存储目录是否填写" });
      return;
    }

    this.props.onSubmit && this.props.onSubmit(res);
  };
  handleTableChange = (page, pageSize) => {
    this.setState(
      {
        current: page,
        pageSize: pageSize
      },
      () => {
        this.loadUnMntList();
      },
    );
  };
  loadUnMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: this.state.current,
      page_size: this.state.pageSize,
      type: "unmnt",
    }).then((data) => {
      if (data) {
        this.setState({
          list: data.list || [],
          total: data.total
        });
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  isDisabled = (data, index) => this.state.selectedRowKeys.indexOf(index) === -1;
  handleChange = (value, data, index) => {
    const local = this.state.localpaths;
    local[data.dep_vol_id] = value;
    this.setState({ localpaths: local });
  };
  render() {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys,
        });
      },
    };
    const {total, current, pageSize} = this.state

    const pagination = {
       onChange:this.handleTableChange,
       total:total,
       pageSize:pageSize,
       current:current
    }

    return (
      <Modal
        title="挂载共享目录"
        width={900}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Table
          pagination={pagination}
          dataSource={this.state.list}
          rowSelection={rowSelection}
          columns={[
            {
              title: "本地存储目录",
              dataIndex: "localpath",
              render: (localpath, data, index) => (
                <Input
                  onChange={(e) => {
                    this.handleChange(e.target.value, data, index);
                  }}
                  disabled={this.isDisabled(data, index)}
                />
              ),
            },
            {
              title: "目标存储名称",
              dataIndex: "dep_vol_name",
            },
            {
              title: "目标存储目录",
              dataIndex: "dep_vol_path",
            },
            {
              title: "目标存储类型",
              dataIndex: "dep_vol_type",
            },
            {
              title: '目标所属应用',
              dataIndex: 'dep_app_name',
              render: (v, data) => {
                return <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${data.dep_app_alias}/overview`}>{v}</Link>
              }
            }, {
              title: '目标应用所属组',
              dataIndex: 'dep_app_group',
              render: (v, data) => {
                return <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${data.dep_group_id}`}>{v}</Link>
              }
            },
          ]}
        />
      </Modal>
    );
  }
}
