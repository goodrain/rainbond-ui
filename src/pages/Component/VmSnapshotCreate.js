import React, { PureComponent } from 'react';
import { Alert, Button, Form, Input, Modal, Select } from 'antd';
import { formatMessage } from '@/utils/intl';
import { snapshotFieldErrors, validateSnapshotPrepare, snapshotAttemptKey, loadSnapshotAttempt, saveSnapshotAttempt,
  newSnapshotRequestId } from '../../utils/vmSnapshotCreate';

const text = key => formatMessage({ id: `componentOverview.vmWorkspace.snapshotCreate.${key}` });

export class VmSnapshotCreate extends PureComponent {
  state = { visible: false, name: '', description: '', power: 'previous', status: 'idle', attempt: null, job: null,
    fieldErrors: {}, formError: '' };
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
      this.setState({ visible: false, attempt, status: attempt ? 'unknown' : 'idle', job: null, name: '', description: '',
        fieldErrors: {}, formError: '' });
    } catch (_) { this.setState({ visible: false, attempt: null, status: 'unavailable', job: null }); }
  };
  open = () => {
    if (!this.active() || !this.props.capabilityReady || this.state.attempt || this.state.status === 'checkingActive') return;
    const key = this.key(); const id = ++this.sequence;
    const current = () => this.active() && this.key() === key && this.sequence === id;
    const context = this.props.context;
    this.setState({ status: 'checkingActive' });
    let finished = false;
    const finish = (data, error) => {
      if (finished || !current()) return;
      finished = true;
      if (error) { this.setState({ status: 'activeUnavailable' }); return; }
      if (data.snapshot) {
        try { saveSnapshotAttempt(this.storage(), key, data.snapshot.selection); }
        catch (_) { this.setState({ status: 'unavailable' }); return; }
        this.setState({ attempt: data.snapshot.selection, job: data.snapshot.job, status: 'accepted' });
      } else this.setState({ status: data.blocked ? 'otherOperation' : 'idle', visible: !data.blocked, fieldErrors: {}, formError: '' });
    };
    try {
      const pending = this.props.dispatch({ type: 'vmSnapshotReads/activeSnapshot',
        payload: { team_name: context.team, region_name: context.region, app_alias: context.alias },
        shouldApply: current, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, true); }, () => finish(null, true));
      return pending;
    } catch (_) { finish(null, true); return undefined; }
  };
  submit = () => {
    if (!this.active() || !this.props.capabilityReady || this.state.attempt || ['pending', 'unavailable'].includes(this.state.status)) return undefined;
    const fieldErrors = snapshotFieldErrors(this.state);
    this.setState({ fieldErrors, formError: '' });
    if (Object.keys(fieldErrors).length) return undefined;
    const key = this.key();
    let payload;
    try {
      payload = validateSnapshotPrepare({ name: this.state.name, description: this.state.description,
        power_after: this.state.power, request_id: (this.props.requestId || newSnapshotRequestId)() });
    } catch (_) { this.setState({ formError: 'requestUnavailable' }); return undefined; }
    try {
      saveSnapshotAttempt(this.storage(), key, payload);
    } catch (_) { this.setState({ formError: 'unavailable' }); return undefined; }
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
  confirmRetry = () => {
    if (!this.active() || !this.state.attempt || this.state.job?.error_code !== 'CONFLICT') return;
    const key = this.key(); const requestId = this.state.attempt.request_id; const revision = this.state.job.revision;
    Modal.confirm({ title: `${text('retryTitle')}: ${this.state.attempt.name}`, content: text('retryConfirm'),
      okText: text('retry'), cancelText: text('cancel'),
      onOk: () => {
        if (this.key() === key && this.state.attempt?.request_id === requestId && this.state.job?.revision === revision) {
          return this.readback(true);
        }
        return undefined;
      } });
  };
  readback = (retry = false) => {
    if (!this.active() || !this.state.attempt || this.state.status === 'reading' || this.state.status === 'pending') return undefined;
    if (retry === true && (this.state.job?.error_code !== 'CONFLICT' || !Number.isSafeInteger(this.state.job.revision))) return undefined;
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
      } else this.setState({ status: error ? 'unknown' : 'accepted', job: error ? null : retry === true ? data.job : data });
      // Complete comes only from the same scoped durable job, never native flags or a by-name snapshot.
      if (!error && this.props.onAccepted) this.props.onAccepted();
    };
    const context = this.props.context;
    try {
      const pending = this.props.dispatch({ type: retry === true ? 'vmSnapshotReads/retrySnapshot' : 'vmSnapshotReads/jobStatus',
        payload: { ...attempt, snapshot_name: attempt.name, expected_request_id: attempt.request_id,
          ...(retry === true ? { revision: this.state.job.revision } : {}),
          team_name: context.team, region_name: context.region, app_alias: context.alias },
        shouldApply: current, callback: data => finish(data), handleError: error => finish(null, error) });
      if (pending?.then) pending.then(() => { if (!finished) finish(null, true); }, () => finish(null, true));
      return pending;
    } catch (_) { finish(null, true); return undefined; }
  };
  render() {
    const { attempt, status, visible, name, description, power, fieldErrors, formError, job } = this.state;
    const enabled = this.active();
    const jobError = { CONFLICT: 'conflict', DEPENDENCY_PENDING: 'dependencyPending', REGION_UNKNOWN: 'regionUnknown',
      RETRY_EXHAUSTED: 'retryExhausted' }[job?.error_code];
    const trigger = <Button type="primary" size="small" icon="plus"
        disabled={!enabled || !this.props.capabilityReady || !!attempt || status === 'unavailable'}
        loading={this.props.capabilityChecking || status === 'checkingActive'}
        onClick={this.open}>{text('title')}</Button>;
    const feedback = <section className={this.props.className} aria-label={text('title')}>
      {status !== 'idle' && <Alert type={status === 'completed' ? 'success' : status === 'accepted' && !jobError ? 'info' : 'warning'} showIcon
        message={text(status === 'accepted' && jobError ? jobError : ['pending', 'reading', 'accepted', 'unknown', 'rejected', 'unsupported', 'workerUnavailable', 'completed', 'unavailable', 'invalid', 'checkingActive', 'activeUnavailable', 'otherOperation'].includes(status) ? status : 'unknown')}
        description={attempt ? <span>{attempt.name} <Button disabled={!enabled || ['pending', 'reading'].includes(status)}
          loading={status === 'reading'} onClick={() => this.readback()}>{text('readback')}</Button>
          {job?.error_code === 'CONFLICT' && <Button disabled={!enabled || ['pending', 'reading'].includes(status)}
            onClick={this.confirmRetry}>{text('retry')}</Button>}
        </span> : undefined} />}
      <Modal visible={visible && enabled} title={text('title')} okText={text('submit')} cancelText={text('cancel')}
        okButtonProps={{ disabled: !this.props.capabilityReady || !!attempt || status === 'pending' }}
        onOk={this.submit} onCancel={() => this.setState({ visible: false })}>
        <p>{text('offline')}</p>
        {formError && <Alert type="error" showIcon message={<span role="alert">{text(formError)}</span>} />}
        {!this.props.capabilityReady && <Alert type="warning" showIcon message={text('capabilityRequired')} />}
        <Form.Item label={text('name')} required htmlFor="vm-snapshot-name"
          validateStatus={fieldErrors.name ? 'error' : undefined}
          help={<span id="vm-snapshot-name-help" role={fieldErrors.name ? 'alert' : undefined}>{text(fieldErrors.name || 'nameHint')}</span>}>
          <Input id="vm-snapshot-name" value={name} maxLength={253} placeholder="before-upgrade"
            aria-invalid={!!fieldErrors.name} aria-describedby="vm-snapshot-name-help"
            onChange={event => this.setState({ name: event.target.value, fieldErrors: { ...fieldErrors, name: '' }, formError: '' })} />
        </Form.Item>
        <Form.Item label={text('description')} htmlFor="vm-snapshot-description"
          validateStatus={fieldErrors.description ? 'error' : undefined}
          help={<span id="vm-snapshot-description-help" role={fieldErrors.description ? 'alert' : undefined}>{text(fieldErrors.description || 'descriptionHint')}</span>}>
          <Input.TextArea id="vm-snapshot-description" value={description} maxLength={2048}
            aria-invalid={!!fieldErrors.description} aria-describedby="vm-snapshot-description-help"
            onChange={event => this.setState({ description: event.target.value, fieldErrors: { ...fieldErrors, description: '' }, formError: '' })} />
        </Form.Item>
        <Form.Item label={text('power')}>
          <Select value={power} aria-label={text('power')} onChange={value => this.setState({ power: value })} style={{ width: '100%' }}>
          <Select.Option value="previous">{text('previous')}</Select.Option>
          <Select.Option value="stopped">{text('stopped')}</Select.Option>
          </Select>
        </Form.Item>
      </Modal>
    </section>;
    return this.props.children ? this.props.children(trigger, feedback) : <>{trigger}{feedback}</>;
  }
}
export default VmSnapshotCreate;
