import { Alert, Button, Card, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { unOpenRegion } from '../../services/team';
import globalUtil from '../../utils/global';

// 开通集群
@connect(({ user, global }) => ({
  currUser: user.currentUser,
  enterprise: global.enterprise
}))
class OpenRegion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      regions: []
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
  }

  getUnRelationedApp = () => {
    let { teamName } = this.props;
    if (!teamName) {
      teamName = globalUtil.getCurrTeamName();
    }
    if (teamName) {
      unOpenRegion({
        team_name: teamName
      }).then(data => {
        if (data) {
          this.setState({ regions: data.list || [] });
        }
      });
    }
  };

  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({
        message: '请选择要开通的集群'
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
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys: selectedRows.map(item => {
            return item.region_name;
          })
        });
      }
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
          {this.state.regions.length === 0 && (
            <Alert
              type="warning"
              style={{ marginBottom: '16px' }}
              message="暂无其他集群，请到集群管理面板中添加更多集群"
            />
          )}
          <Table
            size="small"
            pagination={false}
            dataSource={this.state.regions || []}
            rowSelection={rowSelection}
            columns={[
              {
                title: '名称',
                dataIndex: 'region_alias'
              },
              {
                title: '简介',
                dataIndex: 'desc'
              }
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
              dataIndex: 'region_alias'
            },
            {
              title: '简介',
              dataIndex: 'desc'
            }
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
