/*
  挂载共享目录组件
*/

import { Input, Modal, notification, Table, Tooltip, Row, Col, Select } from 'antd';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
      localpaths: {},
      appList: [],
      comList: [],
      loading: true
    };
  }
  componentDidMount() {
    this.loadUnMntList();
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.choice.catalogue' }) });
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
      notification.warning({ message: formatMessage({ id: 'notification.warn.inspect.fillIn' }) });
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
  loadUnMntList = (bool = true) => {
    this.setState({
      loading: true
    })
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: this.state.current,
      page_size: this.state.pageSize,
      type: 'unmnt',
      volume_type: this.props.volume_type
        ? this.props.volume_type
        : ['share-file', 'memoryfs', 'local'],
      dep_app_group: this.state.dep_app_group || '',
      dep_app_name: this.state.dep_app_name || '',
      config_name: this.state.config_name || ''
    }).then(data => {
      if (data) {
        if (bool) {
          this.handleData(data.list)
        }
        this.setState({
          list: data.list || [],
          total: data.total,
          loading: false
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
  handleData = (data) => {
    let appList = [];
    let comList = [];
    const result = data.reduce((acc, item) => {
      const componentKey = item.dep_app_alias;
      const componentName = item.dep_app_name;
      const appKey = item.dep_group_id;
      const appName = item.dep_app_group;
      const existingAppComponent = comList.find(app => app.key === componentKey);
      const existingApp = appList.find(com => com.key === appKey);
      if (!existingApp) {
        appList.push({ key: appKey, value: appName });
      }
      if (!existingAppComponent) {
        comList.push({ key: componentKey, value: componentName });
      }
      return acc;
    }, {});
    this.setState({
      appList,
      comList
    })
  }
  handleDependChange = (e, bool) => {
    if (bool === 'dep_app_group') {
      this.setState({ dep_app_group: e }, () => { this.loadUnMntList(false) })
    } else if (bool === 'dep_app_name') {
      this.setState({ dep_app_name: e }, () => { this.loadUnMntList(false) })
    } else if (bool === 'config_name') {
      this.setState({ config_name: e }, () => { this.loadUnMntList(false) })
    }
  }
  render() {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys
        });
      }
    };
    const { total, current, pageSize,loading } = this.state;

    const pagination = {
      onChange: this.handleTableChange,
      total,
      pageSize,
      current
    };

    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.tab.RelationMnt.title' />}
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Row style={{paddingBottom:10}}>
          <Col span={6}>
            {formatMessage({id:'componentOther.relationMnt.name'})}
            <Input
              style={{ width: 150 }}
              onBlur={(e) => this.handleDependChange(e.target.value, 'config_name')}
              placeholder={formatMessage({ id: 'componentOther.relationMnt.file_name' })}
            />
          </Col>
          <Col span={6}>
            {formatMessage({id:'componentOther.relationMnt.app'})}
            <Select
              allowClear
              placeholder={formatMessage({id:'componentOther.relationMnt.select_app'})}
              style={{ width: 150 }}
              onChange={(e) => this.handleDependChange(e, 'dep_app_group')}

            >
              {this.state.appList.map(item => {
                return (
                  <Select.Option key={item.value} value={item.value}>
                    {item.value}
                  </Select.Option>
                );
              }
              )}
            </Select>
          </Col>
          <Col span={8}>
            {formatMessage({id:'componentOther.relationMnt.com'})}
            <Select
              allowClear
              placeholder={formatMessage({id:'componentOther.relationMnt.select_com'})}
              style={{ width: 150 }}
              onChange={(e) => this.handleDependChange(e, 'dep_app_name')}
            >
              {this.state.comList.map(item => {
                return (
                  <Select.Option key={item.value} value={item.value}>
                    {item.value}
                  </Select.Option>
                )
              }
              )}
            </Select>
          </Col>
        </Row>

        <Table
          loading={loading}
          rowKey={(record,index) => index}
          pagination={pagination}
          dataSource={this.state.list}
          rowSelection={rowSelection}
          style={{ width: '100%', overflowX: 'auto' }}
          columns={[
            {
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.localpath' }),
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
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_vol_name' }),
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
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_vol_path' }),
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
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_app_name' }),
              dataIndex: 'dep_app_name',
              key: '5',
              width: '20%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${data.dep_app_alias
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
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_app_group' }),
              dataIndex: 'dep_app_group',
              key: '6',
              width: '15%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id
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
