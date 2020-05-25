import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Table, Modal, notification, Card } from 'antd';
import { unOpenRegion } from '../../services/team';
import globalUtil from '../../utils/global';

// 开通集群
@connect(({ user, global }) => ({
  currUser: user.currentUser,
  enterprise: global.enterprise,
}))
class OpenRegion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      regions: [],
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
  }

  getUnRelationedApp = () => {
    unOpenRegion({
      team_name: globalUtil.getCurrTeamName(),
    }).then(data => {
      if (data) {
        this.setState({ regions: data.list || [] });
      }
    });
  };

  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({
        message: '请选择要开通的集群',
      });
      return;
    }
    const { onSubmit } = this.props;
    if (onSubmit) {
      onSubmit(this.state.selectedRowKeys);
    }
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  render() {
    const mode = this.props.mode || 'modal';
    const { enterprise } = this.props;
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys: selectedRows.map(item => {
            return item.region_name;
          }),
        });
      },
    };

    if (mode === 'modal') {
      return (
        <Modal
          title="开通集群"
          width={600}
          visible
          onOk={this.handleSubmit}
          onCancel={this.handleCancel}
        >
          {this.state.regions.length == 0 &&
            enterprise &&
            !enterprise.is_enterprise && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <a href="https://www.goodrain.com/info.html" target="_blank">
                  多云管理功能请咨询企业服务
                </a>
              </div>
            )}
          <Table
            size="small"
            pagination={false}
            dataSource={this.state.regions || []}
            rowSelection={rowSelection}
            columns={[
              {
                title: '集群',
                dataIndex: 'region_alias',
              },
              {
                title: '简介',
                dataIndex: 'desc',
              },
            ]}
          />
        </Modal>
      );
    }

    return (
      <Card title="当前团队没有集群，请先开通" style={{ height: '500px' }}>
        <Table
          size="small"
          pagination={false}
          dataSource={this.state.regions || []}
          rowSelection={rowSelection}
          columns={[
            {
              title: '集群',
              dataIndex: 'region_alias',
            },
            {
              title: '简介',
              dataIndex: 'desc',
            },
          ]}
        />
        <div style={{ textAlign: 'right', paddingTop: 16 }}>
          <Button type="primary" onClick={this.handleSubmit}>
            开通
          </Button>
        </div>
      </Card>
    );
  }
}

export default OpenRegion;
