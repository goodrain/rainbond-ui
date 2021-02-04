/*
  挂载共享目录组件
*/

import { Input, Modal, notification, Table, Tooltip } from 'antd';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { getMnt } from '../../services/app';
import globalUtil from '../../utils/global';

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      total: 0,
      current: 1,
      pageSize: 6,
      localpaths: {}
    };
  }
  componentDidMount() {
    this.loadUnMntList();
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({ message: '请选择要挂载共享配置文件目录' });
      return;
    }

    let res = [];
    res = this.state.selectedRowKeys.map(index => {
      const data = this.state.list[index];
      return {
        id: data.dep_vol_id,
        path: this.state.localpaths[data.dep_vol_id]
      };
    });
    res = res.filter(item => !!item.path);

    if (!res.length) {
      notification.warning({ message: '请检查本地配置文件目录是否填写' });
      return;
    }

    this.props.onSubmit && this.props.onSubmit(res);
  };
  handleTableChange = (page, pageSize) => {
    this.setState(
      {
        current: page,
        pageSize
      },
      () => {
        this.loadUnMntList();
      }
    );
  };
  loadUnMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: this.state.current,
      page_size: this.state.pageSize,
      type: 'unmnt',
      volume_type: this.props.volume_type
        ? this.props.volume_type
        : ['share-file', 'memoryfs', 'local']
    }).then(data => {
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
  isDisabled = (data, index) =>
    this.state.selectedRowKeys.indexOf(index) === -1;
  handleChange = (value, data, index) => {
    const local = this.state.localpaths;
    local[data.dep_vol_id] = value;
    this.setState({ localpaths: local });
  };
  render() {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys
        });
      }
    };
    const { total, current, pageSize } = this.state;

    const pagination = {
      onChange: this.handleTableChange,
      total,
      pageSize,
      current
    };

    return (
      <Modal
        title="挂载共享配置文件目录"
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Table
          pagination={pagination}
          dataSource={this.state.list}
          rowSelection={rowSelection}
          style={{ width: '100%', overflowX: 'auto' }}
          columns={[
            {
              title: '本地挂载配置文件路径',
              dataIndex: 'localpath',
              key: '1',
              width: '20%',
              render: (localpath, data, index) => (
                <Input
                  onChange={e => {
                    this.handleChange(e.target.value, data, index);
                  }}
                  disabled={this.isDisabled(data, index)}
                />
              )
            },
            {
              title: '配置文件名称',
              dataIndex: 'dep_vol_name',
              key: '2',
              width: '20%',
              render: (data, index) => (
                <Tooltip title={data}>
                  <span
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word'
                    }}
                  >
                    {data}
                  </span>
                </Tooltip>
              )
            },
            {
              title: '挂载配置文件路径',
              dataIndex: 'dep_vol_path',
              key: '3',
              width: '20%',
              render: (data, index) => (
                <Tooltip title={data}>
                  <span
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word'
                    }}
                  >
                    {data}
                  </span>
                </Tooltip>
              )
            },
            {
              title: '所属组件',
              dataIndex: 'dep_app_name',
              key: '5',
              width: '20%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.dep_app_alias
                      }/overview`}
                    >
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word'
                        }}
                      >
                        {v}
                      </span>
                    </Link>
                  </Tooltip>
                );
              }
            },
            {
              title: '组件所属应用',
              dataIndex: 'dep_app_group',
              key: '6',
              width: '15%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.dep_group_id
                      }`}
                    >
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word'
                        }}
                      >
                        {v}
                      </span>
                    </Link>
                  </Tooltip>
                );
              }
            }
          ]}
        />
      </Modal>
    );
  }
}
