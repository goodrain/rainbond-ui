import React, { PureComponent } from 'react';
import VMStorageSnapshotHint from '../../components/VMStorageSnapshotHint';
import VmSnapshotCreate from './VmSnapshotCreate';
import { Alert, Badge, Button, Card, Descriptions, Empty, Modal, Spin, Table } from 'antd';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import { snapshotContextKey, validSnapshotName } from '../../utils/vmSnapshotRead';
import { newVMRestoreRequestId, vmRestoreAttemptKey, loadVMRestoreAttempt, saveVMRestoreAttempt,
  clearVMRestoreAttempt } from '../../utils/vmSnapshotRestore';
import { createComponentPollingGuard, getComponentPollingDelay } from './componentPolling';
import styles from './VmSnapshots.less';

const text = key => formatMessage({ id: `componentOverview.vmWorkspace.snapshotRead.${key}` });
const capText = key => formatMessage({ id: `componentOverview.vmStorageSnapshot.${key}` });
const PHASES = ['prepared', 'stopping', 'creating', 'snapshotting', 'manifest-acked', 'resuming',
  'ready', 'failed', 'cancelling', 'cancelled', 'deleting', 'deleted'];
const terminal = phase => ['ready', 'failed', 'cancelled', 'deleted'].includes(phase);
const failedRead = { kind: 'failed', status: 0, code: '', retryable: true };

export class VmSnapshots extends PureComponent {
  state = { contextKey: '', listStatus: 'loading', items: null, page: 1, pageSize: 20, total: 0,
    listRefreshing: false, listError: null, selectedName: '', detail: null, detailStatus: 'idle', detailError: null, detailRefreshing: false,
    capability: null, capabilityStatus: 'loading', capabilityRefreshing: false, capabilityError: null,
    restoreStatus: 'idle', restoreSnapshot: '', restoreRequestId: '', restore: null, restoreError: null, restoreAdvanceReady: false };
  mounted = false;
  timers = { list: null, detail: null, restore: null };
  failures = { list: 0, detail: 0 };
  listGuard = createComponentPollingGuard(() => this.enabled(), () => this.identity());
  detailGuard = createComponentPollingGuard(() => this.enabled(), () => `${this.identity()}:${this.state.selectedName}`);
  capabilityGuard = createComponentPollingGuard(() => this.enabled(), () => this.identity());
  restoreGuard = createComponentPollingGuard(() => this.enabled(),
    () => `${this.identity()}:${this.state.restoreSnapshot}:${this.state.restoreRequestId}`);

  identity = () => snapshotContextKey(this.props.context);
  restoreStorage = () => this.props.storage || (typeof window !== 'undefined' ? window.localStorage : null);
  restoreKey = () => vmRestoreAttemptKey(this.props.context, this.props.snapshotActorId);
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
    else if (previous.capabilityRefreshToken !== this.props.capabilityRefreshToken) {
      this.capabilityGuard.invalidate();
      this.setState({ capability: null, capabilityStatus: 'loading', capabilityRefreshing: false, capabilityError: null }, this.readCapability);
    }
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
    this.clearTimer('list'); this.clearTimer('detail'); this.clearTimer('restore');
    this.listGuard.invalidate(); this.detailGuard.invalidate(); this.capabilityGuard.invalidate(); this.restoreGuard.invalidate();
    this.failures = { list: 0, detail: 0 };
  };
  reset = () => {
    this.invalidate();
    if (!this.mounted) return;
    let attempt = null;
    try { attempt = loadVMRestoreAttempt(this.restoreStorage(), this.restoreKey()); } catch (_) { attempt = null; }
    this.setState({ contextKey: this.identity(), listStatus: 'loading', items: null, page: 1, total: 0,
      listRefreshing: false, listError: null, selectedName: '', detail: null, detailStatus: 'idle', detailError: null, detailRefreshing: false,
      capability: null, capabilityStatus: 'loading', capabilityRefreshing: false, capabilityError: null,
      restoreStatus: attempt ? 'pending' : 'idle', restoreSnapshot: attempt?.snapshot_name || '',
      restoreRequestId: attempt?.request_id || '', restore: null, restoreError: null, restoreAdvanceReady: false },
    () => {
      if (!this.enabled()) return;
      this.read('list');
      if (attempt) this.requestRestore(true);
    });
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
    this.setState({ [`${flow}Refreshing`]: !automatic });
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
      if (flow === 'list' && !automatic) this.readCapability();
      return pending;
    } catch (_) { finish(null, failedRead); return undefined; }
  };
  readCapability = () => {
    if (!this.enabled()) return undefined;
    const request = this.capabilityGuard.begin('capability');
    if (!request) return undefined;
    const context = { ...this.props.context };
    this.setState({ capabilityRefreshing: true });
    let finished = false;
    const finish = (data, error) => {
      if (finished || !request.isCurrent()) return;
      finished = true;
      if (!request.complete()) return;
      this.setState({ capabilityRefreshing: false, capabilityError: error || null,
        capabilityStatus: error ? error.status === 404 || error.kind === 'notFound' ? 'unknown'
          : error.kind === 'unsupported' ? 'unsupported' : 'failed' : 'ready',
        ...(data ? { capability: data } : error && ['forbidden', 'notFound'].includes(error.kind) ? { capability: null } : {}) });
    };
    try {
      const pending = this.props.dispatch({ type: 'vmSnapshotReads/capability',
        payload: { team_name: context.team, region_name: context.region, app_alias: context.alias },
        shouldApply: request.isCurrent, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, failedRead); }, () => finish(null, failedRead));
      return pending;
    } catch (_) { finish(null, failedRead); return undefined; }
  };
  renderCapability = () => {
    const { capability, capabilityStatus, capabilityRefreshing, capabilityError } = this.state;
    const current = this.state.contextKey === this.identity() && this.enabled();
    if (current && ((!capability && capabilityStatus === 'loading') ||
        (capabilityStatus === 'ready' && capability?.supported === true && capability?.complete === true))) return null;
    const state = !current ? 'unknown' : capabilityRefreshing ? 'loading'
      : capabilityStatus === 'ready' ? capability.status : capabilityStatus;
    const stale = !!capability && (capabilityRefreshing || capabilityStatus !== 'ready');
    const label = row => row.disk_key || row.key;
    const reason = value => <span>{value.message && <span>{value.message} </span>}<code>{value.reason_code}</code></span>;
    const errorMessage = capabilityError?.status === 404 || capabilityError?.kind === 'notFound'
      ? capText('readError.notFound')
      : text(capabilityError?.code ? `errorCode.${capabilityError.code}` : `error.${capabilityError?.kind || 'failed'}`);
    return <section aria-label={capText('currentDisks')}>
      <VMStorageSnapshotHint mode="component" state={state} onRetry={current ? this.readCapability : undefined}
        refreshing={capabilityRefreshing} />
      {current && capabilityError && <p role="alert">{errorMessage} {capabilityError.code && <code>{capabilityError.code}</code>}</p>}
      {current && capability && <div>
        {stale ? <p>{capText('lastObservation')}</p> : <p>{reason(capability)} {capText(capability.complete ? 'membershipComplete' : 'membershipUnknown')}</p>}
        <Table size="small" rowKey={(row, index) => `${row.key}:${index}`} pagination={false} dataSource={capability.volumes}
          locale={{ emptyText: capText('noParticipants') }} columns={[
            { title: capText('disk'), key: 'disk', render: (_, row) => label(row) },
            { title: capText('role'), dataIndex: 'role', render: value => capText(value === 'root' ? 'rootDisk' : value === 'data' ? 'dataDisk' : 'unknownDisk') },
            { title: capText('readOnly'), dataIndex: 'read_only', render: value => text(value ? 'yes' : 'no') },
            { title: capText('storage'), dataIndex: 'storage_class', render: value => value || text('notReported') },
            { title: capText('result'), dataIndex: 'status', render: value => <Badge status={value === 'supported' ? 'success' : value === 'unsupported' ? 'warning' : 'default'} text={capText(`decision.${value}`)} /> },
            { title: capText('reason'), key: 'reason', render: (_, row) => reason(row) }
          ]} />
        {capability.excluded_volumes.length > 0 && <div>
          <p>{capText('excluded')}</p>
          <Table size="small" rowKey={(row, index) => `${row.key}:${index}`} pagination={false} dataSource={capability.excluded_volumes}
            columns={[
              { title: capText('disk'), dataIndex: 'key' },
              { title: capText('reason'), dataIndex: 'reason_code', render: value => <span>{capText(['read_only_installation_media', 'auxiliary_media', 'detached_retained_volume'].includes(value) ? `excludedReason.${value}` : 'excludedReason.unknown')} <code>{value}</code></span> }
            ]} />
        </div>}
        <p>{capText('advisory')}</p>
      </div>}
    </section>;
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
  canRestore = item => !!item && item.phase === 'ready' && item.ready_to_use === true &&
    item.manifest_acked === true && item.finalized === true && item.coverage?.complete === true;
  confirmRestore = item => {
    if (!this.enabled() || !this.canRestore(item) || ['submitting', 'pending'].includes(this.state.restoreStatus)) return;
    Modal.confirm({
      title: text('restoreConfirmTitle'),
      content: text('restoreConfirmBody'),
      okText: text('restoreConfirm'),
      cancelText: text('restoreCancel'),
      okType: 'danger',
      onOk: () => this.startRestore(item)
    });
  };
  startRestore = item => {
    let requestId;
    try { requestId = newVMRestoreRequestId(); } catch (_) {
      this.setState({ restoreStatus: 'failed', restoreError: failedRead });
      return;
    }
    try {
      saveVMRestoreAttempt(this.restoreStorage(), this.restoreKey(), { snapshot_name: item.snapshot_name, request_id: requestId });
    } catch (_) {
      this.setState({ restoreStatus: 'failed', restoreError: failedRead });
      return;
    }
    this.restoreGuard.invalidate();
    this.clearTimer('restore');
    this.setState({ restoreStatus: 'submitting', restoreSnapshot: item.snapshot_name, restoreRequestId: requestId,
      restore: null, restoreError: null, restoreAdvanceReady: false }, () => this.requestRestore(false));
  };
  requestRestore = readback => {
    if (!this.enabled() || !validSnapshotName(this.state.restoreSnapshot) || !this.state.restoreRequestId) return;
    if (!readback && this.state.restoreStatus !== 'submitting' && !this.state.restoreAdvanceReady) return;
    const request = this.restoreGuard.begin('restore');
    if (!request) return;
    this.clearTimer('restore');
    this.setState({ restoreAdvanceReady: false });
    const context = { ...this.props.context };
    const payload = { team_name: context.team, region_name: context.region, app_alias: context.alias,
      snapshot_name: this.state.restoreSnapshot, request_id: this.state.restoreRequestId };
    let finished = false;
    const finish = (data, error) => {
      if (finished || !request.isCurrent()) return;
      finished = true;
      if (!request.complete()) return;
      if (error) {
        const explicit = [400, 401, 403, 404, 409, 422].includes(Number(error.status));
        if (explicit) {
          try { clearVMRestoreAttempt(this.restoreStorage(), this.restoreKey()); } catch (_) { /* retain UI result */ }
          this.setState({ restoreStatus: 'failed', restoreError: error, restoreAdvanceReady: false });
        } else {
          this.setState({ restoreStatus: 'pending', restoreError: error, restoreAdvanceReady: false }, this.scheduleRestore);
        }
        return;
      }
      const status = data.phase === 'succeeded' ? 'succeeded' : data.phase === 'failed' ? 'failed' : 'pending';
      this.setState({ restoreStatus: status, restore: data, restoreError: null,
        restoreAdvanceReady: readback && status === 'pending' && data.requires_advance === true }, () => {
        if (status === 'pending') this.scheduleRestore();
        else {
          try { clearVMRestoreAttempt(this.restoreStorage(), this.restoreKey()); } catch (_) { /* terminal state remains visible */ }
        }
        if (status === 'succeeded') {
          this.read('list');
          if (this.state.selectedName === data.snapshot_name) this.read('detail');
        }
      });
    };
    try {
      const pending = this.props.dispatch({ type: `vmSnapshotReads/${readback ? 'restoreStatus' : 'startRestore'}`,
        payload, shouldApply: request.isCurrent, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, failedRead); }, () => finish(null, failedRead));
      return pending;
    } catch (_) { finish(null, failedRead); return undefined; }
  };
  scheduleRestore = () => {
    this.clearTimer('restore');
    const current = this.restoreGuard.checkpoint();
    this.timers.restore = setTimeout(() => {
      if (!current()) return;
      this.timers.restore = null;
      this.requestRestore(!this.state.restoreAdvanceReady);
    }, getComponentPollingDelay({ status: 'restoring' }));
  };
  renderRestoreStatus = () => {
    const { restoreStatus, restoreError, restoreSnapshot } = this.state;
    if (restoreStatus === 'idle') return null;
    const type = restoreStatus === 'succeeded' ? 'success' : restoreStatus === 'failed' ? 'error' : 'info';
    const key = restoreStatus === 'failed' && restoreError?.code ? `errorCode.${restoreError.code}` : `restore.${restoreStatus}`;
    return <Alert type={type} showIcon message={text(key)} description={restoreSnapshot} />;
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
    // Ant Design 3.19 clones every child, including conditional null children.
    const descriptions = [
      <D key="name" label={text('name')}><span style={{ wordBreak: 'break-all' }}>{detail.snapshot_name}</span></D>,
      <D key="state" label={text('state')}>{this.phase(detail)}</D>,
      <D key="description" label={text('description')}>{detail.description || text('notReported')}</D>,
      <D key="created" label={text('created')}>{detail.creation_time || text('notReported')}</D>,
      <D key="dataReady" label={text('dataReady')}>{yesNo(detail.ready_to_use)}</D>,
      <D key="recordSaved" label={text('recordSaved')}>{yesNo(detail.manifest_acked)}</D>,
      <D key="finalized" label={text('finalized')}>{yesNo(detail.finalized)}</D>,
      <D key="coverage" label={text('coverage')}>{detail.coverage.included_disks} / {detail.coverage.expected_writable_disks}</D>,
      <D key="consistency" label={text('consistency')}>{text('offline')}</D>
    ];
    if (detail.error_code) descriptions.push(<D key="stateNote" label={text('stateNote')}>{text(`itemError.${detail.error_code}`)}</D>);
    if (detail.config) descriptions.push(
      <D key="compute" label={text('compute')}>{detail.config.cpu_milli / 1000} {text('cores')} / {detail.config.memory_mib / 1024} GiB</D>,
      <D key="bootMode" label={text('bootMode')}>{detail.config.boot_mode || text('notReported')}</D>
    );
    return <div aria-live="polite">
      <Button size="small" icon="reload" loading={detailRefreshing} onClick={() => this.read('detail')}>{text('refreshDetail')}</Button>
      <Descriptions size="small" column={2}>{descriptions}</Descriptions>
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
    return <VmSnapshotCreate context={this.props.context} actorId={this.props.snapshotActorId} enabled={current}
        className={styles.feedback}
        capabilityChecking={current && (this.state.capabilityRefreshing || this.state.capabilityStatus === 'loading')}
        capabilityReady={current && !this.state.capabilityRefreshing && this.state.capabilityStatus === 'ready' &&
          this.state.capability?.supported === true && this.state.capability?.complete === true}
        dispatch={this.props.dispatch} onAccepted={() => this.read('list')}>
      {(trigger, feedback) => <Card className={styles.snapshotsCard}
        title={formatMessage({ id: 'componentOverview.vmWorkspace.snapshotsTitle' })} size="small"
        extra={<div className={styles.actions}>
          {trigger}
          <Button size="small" icon="reload" loading={listRefreshing} disabled={!current} onClick={() => this.read('list')}>{text('refresh')}</Button>
        </div>}>
      <p>{text('readOnlyScope')}</p>
      {this.renderCapability()}
      {feedback}
      {this.renderRestoreStatus()}
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
            { title: text('details'), key: 'details', render: (_, item) => <span>
              <Button size="small" type="link" onClick={() => this.select(selectedName !== item.snapshot_name, item)}>
                {text(selectedName === item.snapshot_name ? 'collapse' : 'details')}
              </Button>
              <Button size="small" type="link" icon="rollback" disabled={!this.canRestore(item) || ['submitting', 'pending'].includes(this.state.restoreStatus)}
                onClick={() => this.confirmRestore(item)}>{text('restoreAction')}</Button>
            </span> }
          ]} /> : this.renderError(listError, 'list')}
      </Card>}
    </VmSnapshotCreate>;
  }
}
export default connect(({ user }) => ({ snapshotActorId: user?.currentUser?.user_id }))(VmSnapshots);
