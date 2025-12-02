/*
  挂载共享目录组件
*/

import { Input, Modal, notification, Table, Tooltip, Row, Col, Select } from 'antd';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';

// 常量定义
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

// 样式常量
const WORD_WRAP_STYLE = {
  wordBreak: 'break-all',
  wordWrap: 'break-word'
};

const ROW_STYLE = {
  paddingBottom: 10
};

const SELECT_STYLE = {
  width: 240
};

const TABLE_STYLE = {
  width: '100%',
  overflowX: 'auto'
};

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      total: 0,
      current: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      localpaths: {},
      appList: [],
      comList: [],
      loading: true,
      dep_app_group: '',
      dep_app_name: '',
      config_name: ''
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
    });
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
          this.handleData(data.list);
        }
        this.setState({
          list: data.list || [],
          total: data.total,
          loading: false
        });
      }
    }).catch(err => {
      handleAPIError(err);
      this.setState({
        loading: false
      });
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
    const appList = [];
    const comList = [];

    data.forEach(item => {
      const componentKey = item.dep_app_alias;
      const componentName = item.dep_app_name;
      const appKey = item.dep_group_id;
      const appName = item.dep_app_group;

      const existingApp = appList.find(app => app.key === appKey);
      const existingComponent = comList.find(com => com.key === componentKey);

      if (!existingApp) {
        appList.push({ key: appKey, value: appName });
      }
      if (!existingComponent) {
        comList.push({ key: componentKey, value: componentName });
      }
    });

    this.setState({
      appList,
      comList
    });
  };
  handleDependChange = (e, fieldName) => {
    this.setState({ [fieldName]: e }, () => {
      this.loadUnMntList(false);
    });
  };

  // 渲染带Tooltip的文本列
  renderTextColumn = (text) => (
    <Tooltip title={text}>
      <span style={WORD_WRAP_STYLE}>
        {text}
      </span>
    </Tooltip>
  );

  // 渲染带Tooltip和Link的列
  renderLinkColumn = (text, linkUrl) => (
    <Tooltip title={text}>
      <Link to={linkUrl}>
        <span style={WORD_WRAP_STYLE}>
          {text}
        </span>
      </Link>
    </Tooltip>
  );

  render() {
    const rowSelection = {
      onChange: (selectedRowKeys) => {
        this.setState({
          selectedRowKeys
        });
      }
    };
    const { total, current, pageSize, loading } = this.state;

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
        <Row style={ROW_STYLE}>
          <Col span={8}>
            {formatMessage({id:'componentOther.relationMnt.name'})}
            <Input
              style={SELECT_STYLE}
              onBlur={(e) => this.handleDependChange(e.target.value, 'config_name')}
              placeholder={formatMessage({ id: 'componentOther.relationMnt.file_name' })}
            />
          </Col>
          <Col span={8}>
            {formatMessage({id:'componentOther.relationMnt.app'})}
            <Select
              allowClear
              placeholder={formatMessage({id:'componentOther.relationMnt.select_app'})}
              style={SELECT_STYLE}
              onChange={(e) => this.handleDependChange(e, 'dep_app_group')}
            >
              {this.state.appList.map(item => (
                <Select.Option key={item.value} value={item.value}>
                  {item.value}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            {formatMessage({id:'componentOther.relationMnt.com'})}
            <Select
              allowClear
              placeholder={formatMessage({id:'componentOther.relationMnt.select_com'})}
              style={SELECT_STYLE}
              onChange={(e) => this.handleDependChange(e, 'dep_app_name')}
            >
              {this.state.comList.map(item => (
                <Select.Option key={item.value} value={item.value}>
                  {item.value}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          loading={loading}
          rowKey={(record, index) => index}
          pagination={pagination}
          dataSource={this.state.list}
          rowSelection={rowSelection}
          style={TABLE_STYLE}
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
              render: this.renderTextColumn
            },
            {
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_vol_path' }),
              dataIndex: 'dep_vol_path',
              key: '3',
              width: '20%',
              render: this.renderTextColumn
            },
            {
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_app_name' }),
              dataIndex: 'dep_app_name',
              key: '5',
              width: '20%',
              render: (v, data) => this.renderLinkColumn(
                v,
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id}/overview?type=components&componentID=${data.dep_app_alias}&tab=overview`
              )
            },
            {
              title: formatMessage({ id: 'componentOverview.body.tab.RelationMnt.dep_app_group' }),
              dataIndex: 'dep_app_group',
              key: '6',
              width: '15%',
              render: (v, data) => this.renderLinkColumn(
                v,
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id}/overview`
              )
            }
          ]}
        />
      </Modal>
    );
  }
}
