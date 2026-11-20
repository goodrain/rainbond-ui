import React, { PureComponent } from 'react';
import { Badge, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import DeliveryUpgradeAction from './DeliveryUpgradeAction';
import { w } from './index';
const statuses = { RUNNING: 'appRunning', CLOSED: 'appStopped', STARTING: 'appStarting', STOPPING: 'appStopping', ABNORMAL: 'appAbnormal', PARTIAL_ABNORMAL: 'appAbnormal', BUILDING: 'componentBuilding' };

@connect()
export default class EnvironmentTable extends PureComponent {
  state = { information: {}, statuses: {} };
  alive = false;
  tickets = {};
  componentDidMount() { this.alive = true; }
  componentWillUnmount() { this.alive = false;this.tickets = {}; }
  receiveInformation = (row, info) => {
    if (!this.alive) return;
    const ticket = this.tickets[row.id] = (this.tickets[row.id] || 0) + 1;
    this.setState(state => ({ information: { ...state.information, [row.id]: info },
      statuses: { ...state.statuses, [row.id]: info ? null : 'unavailable' } }));
    const target = info && info.target || row.target;
    if (!info || info.target_deleted || !target || !target.app_id) return;
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'environmentStatus',
      scope: { teamName: target.team_name, regionName: target.region_name, appID: target.app_id } }, callback: data => {
      if (this.alive && this.tickets[row.id] === ticket) this.setState(state => ({ statuses: { ...state.statuses, [row.id]: data.status } }));
    }, onError: () => {
      if (this.alive && this.tickets[row.id] === ticket) this.setState(state => ({ statuses: { ...state.statuses, [row.id]: 'unavailable' } }));
    } });
  };
  render() {
    return <Table rowKey="id" size="small" pagination={false} dataSource={this.props.items} scroll={{ x: 900 }} columns={[
      { title: w('environmentApplicationName'), key: 'application', width: '20%', render: (_, row) => {
        const info = this.state.information[row.id];
        return info && info.target && info.target.app_name || row.target.app_name || '—';
      } },
      { title: w('appStatus'), key: 'status', width: 110, render: (_, row) => {
        const info = this.state.information[row.id];
        if (info && info.target_deleted) return <Badge status="default" text={w('environmentApplicationDeleted')} />;
        const status = String(this.state.statuses[row.id] || '').toUpperCase();
        return <Badge status={status === 'RUNNING' ? 'success' : ['ABNORMAL', 'PARTIAL_ABNORMAL'].includes(status) ? 'error' : ['STARTING', 'STOPPING', 'BUILDING'].includes(status) ? 'processing' : 'default'}
          text={statuses[status] ? w(statuses[status]) : w(status ? 'environmentStatusUnavailable' : 'environmentStatusLoading')} />;
      } },
      { title: w('environmentCurrentVersion'), key: 'version', width: '14%', render: (_, row) => {
        const info = this.state.information[row.id];
        if (info && info.current_version) return info.current_version;
        return info && (info.target_deleted || info.version_unavailable) ? <Tooltip title={w(info.target_deleted ? 'environmentDeletedVersionHint' : 'environmentVersionUnavailable')}>
          <span>{info.delivered_version || row.version || '—'}</span>
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
        onInfo={info => this.receiveInformation(row, info)} /> }
    ]} />;
  }
}
