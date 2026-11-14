import React, { PureComponent } from 'react';
import { Alert, Button, Input, Modal, Select } from 'antd';
import { formatMessage } from '@/utils/intl';
import { validateSnapshotPrepare, snapshotAttemptKey, loadSnapshotAttempt, saveSnapshotAttempt,
  newSnapshotRequestId } from '../../utils/vmSnapshotCreate';

const text = key => formatMessage({ id: `componentOverview.vmWorkspace.snapshotCreate.${key}` });

export class VmSnapshotCreate extends PureComponent {
  state = { visible: false, name: '', description: '', power: 'previous', status: 'idle', attempt: null, job: null };
  mounted = false;
  sequence = 0;
  key = () => snapshotAttemptKey(this.props.context, this.props.actorId);
  storage = () => this.props.storage || (typeof window !== 'undefined' ? window.sessionStorage : null);
  active = () => this.mounted && this.props.enabled === true && !!this.key();
  componentDidMount() { this.mounted = true; this.restore(); }
  componentDidUpdate(previous) {
    if (snapshotAttemptKey(previous.context, previous.actorId) !== this.key() || previous.enabled !== this.props.enabled) {
      this.sequence += 1; this.restore();
    }
  }
  componentWillUnmount() { this.mounted = false; this.sequence += 1; }
  restore = () => {
    try {
      const attempt = loadSnapshotAttempt(this.storage(), this.key());
      this.setState({ visible: false, attempt, status: attempt ? 'unknown' : 'idle', job: null, name: '', description: '' });
    } catch (_) { this.setState({ visible: false, attempt: null, status: 'unavailable', job: null }); }
  };
  submit = () => {
    if (!this.active() || !this.props.capabilityReady || this.state.attempt || ['pending', 'unavailable'].includes(this.state.status)) return undefined;
    const key = this.key();
    let payload;
    try {
      payload = validateSnapshotPrepare({ name: this.state.name, description: this.state.description,
        power_after: this.state.power, request_id: (this.props.requestId || newSnapshotRequestId)() });
      saveSnapshotAttempt(this.storage(), key, payload);
    } catch (_) { this.setState({ status: 'invalid' }); return undefined; }
    const id = ++this.sequence;
    const current = () => this.active() && this.key() === key && this.sequence === id;
    this.setState({ visible: false, attempt: payload, status: 'pending' });
    let finished = false;
    const finish = (data, error) => {
      if (finished || !current()) return;
      finished = true;
      if (error) {
        if (error.kind === 'rejected') {
          try { this.storage().removeItem(key); } catch (_) { this.setState({ status: 'unknown' }); return; }
          this.setState({ status: error.code === 'vm_snapshot_worker_unavailable' ? 'workerUnavailable' : error.status === 422 ? 'unsupported' : 'rejected', attempt: null, job: null });
        } else this.setState({ status: 'unknown' });
      } else {
        this.setState({ status: 'accepted', job: data.job });
        if (this.props.onAccepted) this.props.onAccepted();
      }
    };
    const context = this.props.context;
    try {
      const pending = this.props.dispatch({ type: 'vmSnapshotReads/enqueue',
        payload: { ...payload, team_name: context.team, region_name: context.region, app_alias: context.alias },
        shouldApply: current, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, { kind: 'unknown' }); }, () => finish(null, { kind: 'unknown' }));
      return pending;
    } catch (_) { finish(null, { kind: 'unknown' }); return undefined; }
  };
  readback = () => {
    if (!this.active() || !this.state.attempt || this.state.status === 'reading' || this.state.status === 'pending') return undefined;
    const key = this.key(); const id = ++this.sequence;
    const current = () => this.active() && this.key() === key && this.sequence === id;
    const attempt = this.state.attempt;
    this.setState({ status: 'reading' });
    let finished = false;
    const finish = (data, error) => {
      if (finished || !current()) return;
      finished = true;
      if (!error && data.complete) {
        try { this.storage().removeItem(key); } catch (_) { this.setState({ status: 'unknown' }); return; }
        this.setState({ status: 'completed', attempt: null, job: data });
      } else this.setState({ status: error ? 'unknown' : 'accepted', job: error ? null : data });
      // Complete comes only from the same scoped durable job, never native flags or a by-name snapshot.
      if (!error && this.props.onAccepted) this.props.onAccepted();
    };
    const context = this.props.context;
    try {
      const pending = this.props.dispatch({ type: 'vmSnapshotReads/jobStatus',
        payload: { ...attempt, snapshot_name: attempt.name, expected_request_id: attempt.request_id,
          team_name: context.team, region_name: context.region, app_alias: context.alias },
        shouldApply: current, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, true); }, () => finish(null, true));
      return pending;
    } catch (_) { finish(null, true); return undefined; }
  };
  render() {
    const { attempt, status, visible, name, description, power } = this.state;
    const enabled = this.active();
    return <section aria-label={text('title')}>
      <Button type="primary" disabled={!enabled || !this.props.capabilityReady || !!attempt || status === 'unavailable'}
        onClick={() => this.setState({ visible: true })}>{text('title')}</Button>
      {!this.props.capabilityReady && <p>{text('capabilityRequired')}</p>}
      <p>{text('eligibilityNotice')}</p>
      {status !== 'idle' && <Alert type={status === 'accepted' ? 'info' : 'warning'} showIcon
        message={text(['pending', 'reading', 'accepted', 'unknown', 'rejected', 'unsupported', 'workerUnavailable', 'completed', 'unavailable', 'invalid'].includes(status) ? status : 'unknown')}
        description={attempt ? <span>{attempt.name} <Button disabled={!enabled || ['pending', 'reading'].includes(status)}
          loading={status === 'reading'} onClick={this.readback}>{text('readback')}</Button></span> : undefined} />}
      <Modal visible={visible && enabled} title={text('title')} okText={text('submit')} cancelText={text('cancel')}
        onOk={this.submit} onCancel={() => this.setState({ visible: false })}>
        <p>{text('offline')}</p>
        <label>{text('name')}<Input value={name} maxLength={253} onChange={event => this.setState({ name: event.target.value })} /></label>
        <label>{text('description')}<Input.TextArea value={description} maxLength={2048}
          onChange={event => this.setState({ description: event.target.value })} /></label>
        <label>{text('power')}<Select value={power} onChange={value => this.setState({ power: value })} style={{ width: '100%' }}>
          <Select.Option value="previous">{text('previous')}</Select.Option>
          <Select.Option value="stopped">{text('stopped')}</Select.Option>
        </Select></label>
      </Modal>
    </section>;
  }
}
export default VmSnapshotCreate;
