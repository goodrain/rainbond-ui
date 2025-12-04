/*
  挂载共享目录组件
*/

import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Input, Table, Modal, notification, Tooltip } from 'antd';
import { getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import { getVolumeTypeShowName } from '../../utils/utils';

const { Search } = Input;
@connect(null, null, null, { withRef: true })
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      total: 0,
      current: 1,
      pageSize: 6,
      query: '',
      localpaths: {},
    };
  }
  componentDidMount() {
    this.loadUnMntList();
  }

  handleSearchTeamList = query => {
    this.setState(
      {
        current: 1,
        query,
      },
      () => {
        this.loadUnMntList();
      }
    );
  };

  handleSubmit = () => {
    const { onSubmit } = this.props;
    const { selectedRowKeys } = this.state;
    if (!selectedRowKeys.length) {
      notification.warning({ message:  formatMessage({id:'notification.warn.catalogue'})});
      return;
    }

    let res = [];
    res = selectedRowKeys.map(index => {
      const data = this.state.list[index];
      return {
        id: data.dep_vol_id,
        path: this.state.localpaths[data.dep_vol_id],
      };
    });
    res = res.filter(item => !!item.path);

    if (!res.length) {
      notification.warning({ message: formatMessage({id:'notification.warn.fillIn'}) });
      return;
    }
    let mag = '';
    const isMountList = res.filter(item => {
      const { path } = item;
      if (path === '') {
        mag = `${formatMessage({id:'componentOverview.body.AddRelationMnt.mag'})}`;
      }
      const isMountPath = pluginUtil.isMountPath(path);
      if (isMountPath) {
        mag = `${formatMessage({id:'componentOverview.body.AddRelationMnt.mag'},{path:path})}`;
      }
      return path !== '' && !isMountPath;
    });
    if (mag) {
      notification.warning({ message: mag });
    }
    if (onSubmit && isMountList.length > 0 && !mag) {
      onSubmit(res);
    }
  };

  handleTableChange = (page, pageSize) => {
    this.setState(
      {
        current: page,
        pageSize,
      },
      () => {
        this.loadUnMntList();
      }
    );
  };
  loadUnMntList = () => {
    const { current, pageSize, query } = this.state;

    getMnt({
      query,
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: current,
      page_size: pageSize,
      type: 'unmnt',
      volume_type: this.props.volume_type
        ? this.props.volume_type
        : ['share-file', 'memoryfs', 'local'],
    }).then(data => {
      if (data) {
        this.setState({
          list: data.list || [],
          total: data.total,
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
      onChange: selectedRowKeys => {
        this.setState({
          selectedRowKeys,
        });
      },
    };
    const { total, current, pageSize } = this.state;

    const pagination = {
      onChange: this.handleTableChange,
      total,
      pageSize,
      current,
    };

    return (
      <Modal
        title={<FormattedMessage id="componentOverview.body.AddRelationMnt.title"/>}
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Search
          style={{ width: '350px', marginBottom: '20px' }}
          placeholder={formatMessage({id:'componentOverview.body.AddRelationMnt.placeholder'})}
          onSearch={this.handleSearchTeamList}
        />

        <Table
          pagination={pagination}
          rowKey={(record,index) => index}
          dataSource={this.state.list}
          rowSelection={rowSelection}
          style={{ width: '100%', overflowX: 'auto' }}
          columns={[
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.localpath'}),
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
              ),
            },
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.dep_vol_name'}),
              dataIndex: 'dep_vol_name',
              key: '2',
              width: '15%',
              render: (data, index) => (
                <Tooltip title={data}>
                  <span
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word',
                    }}
                  >
                    {data}
                  </span>
                </Tooltip>
              ),
            },
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.dep_vol_path'}),
              dataIndex: 'dep_vol_path',
              key: '3',
              width: '15%',
              render: (data, index) => (
                <Tooltip title={data}>
                  <span
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word',
                    }}
                  >
                    {data}
                  </span>
                </Tooltip>
              ),
            },
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.dep_vol_type'}),
              dataIndex: 'dep_vol_type',
              key: '4',
              width: '15%',
              render: (text, record) => {
                return (
                  <Tooltip title={text}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word',
                      }}
                    >
                      {getVolumeTypeShowName(null, text)}
                    </span>
                  </Tooltip>
                );
              },
            },
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.dep_app_name'}),
              dataIndex: 'dep_app_name',
              key: '5',
              width: '15%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.dep_app_alias
                      }/overview?type=components&componentID=${data.dep_app_alias}&tab=overview`}
                    >
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word',
                        }}
                      >
                        {v}
                      </span>
                    </Link>
                  </Tooltip>
                );
              },
            },
            {
              title:formatMessage({id:'componentOverview.body.AddRelationMnt.dep_app_group'}),
              dataIndex: 'dep_app_group',
              key: '6',
              width: '15%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.dep_group_id
                      }/overview`}
                    >
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word',
                        }}
                      >
                        {v}
                      </span>
                    </Link>
                  </Tooltip>
                );
              },
            },
          ]}
        />
      </Modal>
    );
  }
}
