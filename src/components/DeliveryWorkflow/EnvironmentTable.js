import React, { PureComponent } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import moment from 'moment';
import DeliveryUpgradeAction from './DeliveryUpgradeAction';
import { w } from './index';
import styles from './version.less';

export default class EnvironmentTable extends PureComponent {
  state = { information: {} };
  render() {
    return <Table rowKey="id" size="small" pagination={false} dataSource={this.props.items} scroll={{ x: 760 }} columns={[
      { title: w('environmentApplicationName'), key: 'application', width: '20%', render: (_, row) => {
        const info = this.state.information[row.id];
        return <div>{info && info.target && info.target.app_name || row.target.app_name || '—'}
          {info && info.target_deleted && <div className={styles.secondary}><Tag>{w('environmentApplicationDeleted')}</Tag></div>}
        </div>;
      } },
      { title: w('environmentCurrentVersion'), key: 'version', width: '14%', render: (_, row) => {
        const info = this.state.information[row.id];
        if (info && info.current_version) return info.current_version;
        return info && (info.target_deleted || info.version_unavailable) ? <Tooltip title={w(info.target_deleted ? 'environmentDeletedVersionHint' : 'environmentVersionUnavailable')}>
          <span>{w('environmentDeliveredVersion', { version: info.delivered_version || row.version || '—' })}</span>
        </Tooltip> : '—';
      } },
      { title: w('deliveryEnvironments'), key: 'environment', render: (_, row) => {
        const target = row.target;
        return `${target.team_alias || target.team_name} / ${target.region_alias || target.region_name}`;
      } },
      { title: w('environmentUpdatedAt'), key: 'updated', width: 168, render: (_, row) => {
        const info = this.state.information[row.id];
        const updated = info && info.updated_at || row.updated_at;
        return updated && moment(updated).isValid() ? <span title={info && info.target_deleted ? w('environmentRecordUpdatedAt') : undefined}>
          {moment(updated).format('YYYY-MM-DD HH:mm')}
        </span> : '—';
      } },
      { title: w('actions'), key: 'upgrade', width: 100, render: (_, row) => <DeliveryUpgradeAction task={row}
        onInfo={info => this.setState(state => ({ information: { ...state.information, [row.id]: info } }))} /> }
    ]} />;
  }
}
