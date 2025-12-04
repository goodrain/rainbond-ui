import { Alert, Button, Card, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
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
        message: formatMessage({id:'placeholder.open_colony'})
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
          title={formatMessage({id:'confirmModal.openRegion.title'})}
          width={600}
          visible
          onOk={this.handleSubmit}
          onCancel={this.handleCancel}
        >
          {this.state.regions.length === 0 && (
            <Alert
              type="warning"
              style={{ marginBottom: '16px' }}
              message={formatMessage({id:'confirmModal.openRegion.alert'})}
            />
          )}
          <Table
            size="small"
            rowKey={(record,index) => index}
            pagination={false}
            dataSource={this.state.regions || []}
            rowSelection={rowSelection}
            columns={[
              {
                title: formatMessage({id:'confirmModal.openRegion.table.region_alias'}),
                dataIndex: 'region_alias'
              },
              {
                title: formatMessage({id:'confirmModal.openRegion.table.desc'}),
                dataIndex: 'desc'
              }
            ]}
          />
        </Modal>
      );
    }

    return (
      <Card title={formatMessage({id:'confirmModal.openRegion.card.title'})} style={{ height: '500px' }}>
        <Table
          size="small"
          rowKey={(record,index) => index}
          pagination={false}
          dataSource={this.state.regions || []}
          rowSelection={rowSelection}
          columns={[
            {
              title: formatMessage({id:'confirmModal.openRegion.table.region_name'}),
              dataIndex: 'region_alias'
            },
            {
              title: formatMessage({id:'confirmModal.openRegion.table.desc'}),
              dataIndex: 'desc'
            }
          ]}
        />
        <div style={{ textAlign: 'right', paddingTop: 16 }}>
          <Button type="primary" onClick={this.handleSubmit}>
            {formatMessage({id:'button.open'})}
          </Button>
        </div>
      </Card>
    );
  }
}

export default OpenRegion;
