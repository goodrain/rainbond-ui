import React, { PureComponent } from 'react';
import { Alert, Badge, Button, Card, Descriptions, Empty, Spin, Table } from 'antd';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import { snapshotContextKey, validSnapshotName } from '../../utils/vmSnapshotRead';
import { createComponentPollingGuard, getComponentPollingDelay } from './componentPolling';

const text = key => formatMessage({ id: `componentOverview.vmWorkspace.snapshotRead.${key}` });
const PHASES = ['prepared', 'stopping', 'creating', 'snapshotting', 'manifest-acked', 'resuming',
  'ready', 'failed', 'cancelling', 'cancelled', 'deleting', 'deleted'];
const terminal = phase => ['ready', 'failed', 'cancelled', 'deleted'].includes(phase);
const failedRead = { kind: 'failed', status: 0, code: '', retryable: true };

export class VmSnapshots extends PureComponent {
  state = { contextKey: '', listStatus: 'loading', items: null, page: 1, pageSize: 20, total: 0,
    listRefreshing: false, listError: null, selectedName: '', detail: null, detailStatus: 'idle', detailError: null, detailRefreshing: false };
  mounted = false;
  timers = { list: null, detail: null };
  failures = { list: 0, detail: 0 };
  listGuard = createComponentPollingGuard(() => this.enabled(), () => this.identity());
  detailGuard = createComponentPollingGuard(() => this.enabled(), () => `${this.identity()}:${this.state.selectedName}`);

  identity = () => snapshotContextKey(this.props.context);
  enabled = () => {
    const context = this.props.context || {};
    return this.mounted && this.props.pollingEnabled !== false && this.props.visible !== false &&
      (typeof document === 'undefined' || !document.hidden) &&
      !!context.team && !!context.region && !!context.application && !!context.alias &&
      context.team === globalUtil.getCurrTeamName() && context.region === globalUtil.getCurrRegionName() &&
      String(context.application) === String(globalUtil.getAppID()) && context.alias === globalUtil.getSlidePanelComponentID();
  };
  componentDidMount() {
    this.mounted = true;
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.visibilityChanged);
    this.reset();
  }
  componentDidUpdate(previous) {
    if (snapshotContextKey(previous.context) !== this.identity() ||
        (previous.pollingEnabled !== false) !== (this.props.pollingEnabled !== false) ||
        previous.visible !== this.props.visible) this.reset();
  }
  componentWillUnmount() {
    this.mounted = false;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.invalidate();
  }
  visibilityChanged = () => this.reset();
  clearTimer = flow => {
    if (this.timers[flow] !== null) clearTimeout(this.timers[flow]);
    this.timers[flow] = null;
  };
  invalidate = () => {
    this.clearTimer('list'); this.clearTimer('detail');
    this.listGuard.invalidate(); this.detailGuard.invalidate();
    this.failures = { list: 0, detail: 0 };
  };
  reset = () => {
    this.invalidate();
    if (!this.mounted) return;
    this.setState({ contextKey: this.identity(), listStatus: 'loading', items: null, page: 1, total: 0,
      listRefreshing: false, listError: null, selectedName: '', detail: null, detailStatus: 'idle', detailError: null, detailRefreshing: false },
    () => { if (this.enabled()) this.read('list'); });
  };
  schedule = (flow, data, error) => {
    if (!this.enabled() || (error && !error.retryable) || (flow === 'detail' && !this.state.selectedName)) return;
    this.clearTimer(flow);
    const guard = flow === 'list' ? this.listGuard : this.detailGuard;
    const isCurrent = guard.checkpoint();
    this.failures[flow] = error ? this.failures[flow] + 1 : 0;
    const active = flow === 'list' ? data?.items?.some(item => !terminal(item.phase)) : data && !terminal(data.phase);
    const delay = getComponentPollingDelay({ status: active ? 'creating' : 'running', failureCount: this.failures[flow] });
    this.timers[flow] = setTimeout(() => {
      if (!isCurrent()) return;
      this.timers[flow] = null;
      this.read(flow, true);
    }, delay);
  };
  read = (flow, automatic = false) => {
    if (!this.enabled() || (flow === 'detail' && !validSnapshotName(this.state.selectedName))) return;
    const guard = flow === 'list' ? this.listGuard : this.detailGuard;
    const request = guard.begin(flow);
    if (!request) return;
    this.clearTimer(flow);
    if (!automatic) this.failures[flow] = 0;
    const context = { ...this.props.context };
    const payload = { team_name: context.team, region_name: context.region, app_alias: context.alias,
      ...(flow === 'list' ? { page: this.state.page, page_size: this.state.pageSize } : { snapshot_name: this.state.selectedName }) };
    this.setState({ [`${flow}Refreshing`]: true });
    let finished = false;
    const finish = (data, error) => {
      if (finished || !request.isCurrent()) return;
      finished = true;
      if (!request.complete()) return;
      const update = { [`${flow}Refreshing`]: false, [`${flow}Error`]: error || null };
      if (flow === 'list') {
        Object.assign(update, { items: error ? null : data.items, total: error ? 0 : data.total,
          listStatus: error ? error.kind : data.total === 0 ? 'empty' : 'ready' });
        if (error && ['forbidden', 'notFound', 'unsupported'].includes(error.kind)) {
          this.detailGuard.invalidate(); this.clearTimer('detail');
          Object.assign(update, { selectedName: '', detail: null, detailStatus: 'idle', detailRefreshing: false, detailError: null });
        }
      } else Object.assign(update, { detail: error ? null : data, detailStatus: error ? error.kind : 'ready' });
      this.setState(update);
      this.schedule(flow, data, error);
    };
    try {
      const pending = this.props.dispatch({ type: `vmSnapshotReads/${flow}`, payload,
        shouldApply: request.isCurrent, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, failedRead); }, () => finish(null, failedRead));
      return pending;
    } catch (_) { finish(null, failedRead); return undefined; }
  };
  select = (expanded, item) => {
    if (!this.enabled() || this.state.contextKey !== this.identity() ||
        (expanded && !this.state.items?.some(row => row.snapshot_name === item.snapshot_name))) return;
    this.detailGuard.invalidate(); this.clearTimer('detail'); this.failures.detail = 0;
    this.setState({ selectedName: expanded ? item.snapshot_name : '', detail: null, detailError: null,
      detailStatus: expanded ? 'loading' : 'idle', detailRefreshing: false }, () => { if (expanded) this.read('detail'); });
  };
  changePage = (page, pageSize) => {
    this.invalidate();
    this.setState({ page, pageSize, items: null, listStatus: 'loading', listError: null, listRefreshing: false,
      selectedName: '', detail: null, detailStatus: 'idle', detailError: null, detailRefreshing: false }, () => this.read('list'));
  };
  renderError = (error, flow) => <Alert type={error?.kind === 'unsupported' ? 'info' : 'warning'} showIcon
    message={text(error?.code ? `errorCode.${error.code}` : `error.${error?.kind || 'failed'}`)}
    description={<Button size="small" loading={this.state[`${flow}Refreshing`]} onClick={() => this.read(flow)}>{text('retry')}</Button>} />;
  phase = item => <Badge status={item.phase === 'failed' ? 'error' : item.phase === 'ready' ? 'success' : 'default'}
    text={text(`phase.${PHASES.includes(item.phase) ? item.phase : 'unknown'}`)} />;
  renderDetail = () => {
    const { detail, detailStatus, detailError, detailRefreshing } = this.state;
    if (detailStatus === 'loading') return <Spin />;
    if (detailStatus !== 'ready' || !detail) return this.renderError(detailError, 'detail');
    const D = Descriptions.Item;
    const yesNo = value => text(value ? 'yes' : 'no');
    return <div aria-live="polite">
      <Button size="small" icon="reload" loading={detailRefreshing} onClick={() => this.read('detail')}>{text('refreshDetail')}</Button>
      <Descriptions size="small" column={2}>
        <D label={text('name')}><span style={{ wordBreak: 'break-all' }}>{detail.snapshot_name}</span></D>
        <D label={text('state')}>{this.phase(detail)}</D>
        <D label={text('description')}>{detail.description || text('notReported')}</D>
        <D label={text('created')}>{detail.creation_time || text('notReported')}</D>
        <D label={text('dataReady')}>{yesNo(detail.ready_to_use)}</D>
        <D label={text('recordSaved')}>{yesNo(detail.manifest_acked)}</D>
        <D label={text('finalized')}>{yesNo(detail.finalized)}</D>
        <D label={text('coverage')}>{detail.coverage.included_disks} / {detail.coverage.expected_writable_disks}</D>
        <D label={text('consistency')}>{text('offline')}</D>
        {detail.error_code && <D label={text('stateNote')}>{text(`itemError.${detail.error_code}`)}</D>}
        {detail.config && <D label={text('compute')}>{detail.config.cpu_milli / 1000} {text('cores')} / {detail.config.memory_mib / 1024} GiB</D>}
        {detail.config && <D label={text('bootMode')}>{detail.config.boot_mode || text('notReported')}</D>}
      </Descriptions>
      <Table size="small" rowKey="volume_id" pagination={false} dataSource={detail.disks}
        locale={{ emptyText: text('noDiskData') }} columns={[
          { title: text('disk'), dataIndex: 'disk_key' },
          { title: text('role'), dataIndex: 'role', render: value => text(value === 'root' ? 'rootDisk' : value === 'data' ? 'dataDisk' : 'notReported') },
          { title: text('capacity'), dataIndex: 'requested_bytes', render: value => `${Number((value / 1073741824).toFixed(2))} GiB` },
          { title: text('storage'), dataIndex: 'storage_class' },
          { title: text('readOnly'), dataIndex: 'read_only', render: yesNo }
        ]} />
    </div>;
  };
  render() {
    const { listStatus, items, listRefreshing, listError, selectedName, page, pageSize, total } = this.state;
    const current = this.state.contextKey === this.identity() && this.enabled();
    return <Card title={formatMessage({ id: 'componentOverview.vmWorkspace.snapshotsTitle' })} size="small"
      extra={<Button size="small" icon="reload" loading={listRefreshing} disabled={!current} onClick={() => this.read('list')}>{text('refresh')}</Button>}>
      <p>{text('readOnlyScope')}</p>
      {!current || listStatus === 'loading' ? <Spin /> : ['ready', 'empty'].includes(listStatus) ?
        <Table size="small" rowKey="snapshot_name" loading={listRefreshing} dataSource={items}
          locale={{ emptyText: <Empty description={text('empty')} /> }}
          pagination={{ current: page, pageSize, total, showSizeChanger: false, onChange: this.changePage }}
          expandedRowKeys={selectedName ? [selectedName] : []} expandedRowRender={this.renderDetail}
          onExpand={this.select} columns={[
            { title: text('name'), dataIndex: 'snapshot_name', render: name => <span title={name} style={{ wordBreak: 'break-all' }}>{name}</span> },
            { title: text('state'), key: 'phase', render: (_, item) => this.phase(item) },
            { title: text('created'), dataIndex: 'creation_time', render: value => value || text('notReported') },
            { title: text('coverage'), key: 'coverage', render: (_, item) => `${item.coverage.included_disks} / ${item.coverage.expected_writable_disks}` },
            { title: text('details'), key: 'details', render: (_, item) => <Button size="small" type="link"
              onClick={() => this.select(selectedName !== item.snapshot_name, item)}>{text(selectedName === item.snapshot_name ? 'collapse' : 'details')}</Button> }
          ]} /> : this.renderError(listError, 'list')}
    </Card>;
  }
}
export default connect()(VmSnapshots);
