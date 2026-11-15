import React, { PureComponent } from 'react';
import { Table } from 'antd';
import moment from 'moment';
import DeliveryUpgradeAction from './DeliveryUpgradeAction';
import { w } from './index';

export default class EnvironmentTable extends PureComponent {
  state = { information: {} };
  render() {
    return <Table rowKey="id" size="small" pagination={false} dataSource={this.props.items} scroll={{ x: 760 }} columns={[
      { title: w('environmentTemplateName'), dataIndex: 'template_name', width: '20%' },
      { title: w('environmentCurrentVersion'), key: 'version', width: '14%', render: (_, row) => {
        const info = this.state.information[row.id];
        return info && info.current_version || '—';
      } },
      { title: w('deliveryEnvironments'), key: 'environment', render: (_, row) => {
        const target = row.target;
        return `${target.team_alias || target.team_name} / ${target.region_alias || target.region_name} / ${target.app_name}`;
      } },
      { title: w('environmentUpdatedAt'), key: 'updated', width: 168, render: (_, row) => {
        const info = this.state.information[row.id];
        const updated = info && info.updated_at;
        return updated ? moment(updated).format('YYYY-MM-DD HH:mm') : '—';
      } },
      { title: w('actions'), key: 'upgrade', width: 100, render: (_, row) => <DeliveryUpgradeAction task={row}
        onInfo={info => this.setState(state => ({ information: { ...state.information, [row.id]: info } }))} /> }
    ]} />;
  }
}
