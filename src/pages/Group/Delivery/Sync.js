import React, { PureComponent } from 'react';
import { Alert, Button, Icon, Modal, Progress, Spin } from 'antd';
import { t } from './common';
import styles from './index.less';

export default class TemplateSync extends PureComponent {
  state = { pollError: false, actionError: false, busy: false, logComponent: null, logs: [], logLoading: false, logError: false };
  alive = false;
  revision = 0;
  logRequest = 0;
  componentDidMount() { this.alive = true; this.schedule(); }
  componentDidUpdate(previous) {
    if (previous.job !== this.props.job) {
      if (this.props.job.status === 'cancelled') this.props.onCancel(); else this.schedule();
    }
  }
  componentWillUnmount() { this.alive = false; this.revision += 1; clearTimeout(this.timer); }
  schedule = () => {
    clearTimeout(this.timer);
    if (this.props.job.status === 'syncing' && !this.state.pollError) this.timer = setTimeout(this.refresh, 2000);
  };
  payload = operation => ({ operation, scope: this.props.scope, user: this.props.user, syncId: this.props.job.id });
  refresh = () => {
    if (this.polling || this.operating) return;
    clearTimeout(this.timer);
    this.polling = true;
    const revision = this.revision;
    this.setState({ pollError: false });
    this.props.dispatch({ type: 'templateDelivery/synchronize', payload: this.payload('status'), callback: job => {
      this.polling = false;
      if (this.alive && revision === this.revision) this.props.onChange(job);
    }, onError: () => {
      this.polling = false;
      if (this.alive && revision === this.revision) this.setState({ pollError: true });
    } });
  };
  run = operation => {
    if (this.operating || this.props.publishing) return;
    this.operating = true;
    this.revision += 1;
    const revision = this.revision;
    clearTimeout(this.timer);
    this.setState({ busy: true, actionError: false });
    this.props.dispatch({ type: 'templateDelivery/synchronize', payload: this.payload(operation), callback: job => {
      this.operating = false;
      if (!this.alive || revision !== this.revision) return;
      this.setState({ busy: false, pollError: false }, () => {
        if (operation === 'cancel') this.props.onCancel(); else this.props.onChange(job);
      });
    }, onError: () => {
      this.operating = false;
      if (this.alive && revision === this.revision) this.setState({ busy: false, actionError: true }, this.schedule);
    } });
  };
  cancel = () => Modal.confirm({ title: t('abandonPublish'), content: t('abandonSyncHelp'),
    okText: t('abandonPublish'), cancelText: t('continueSync'), onOk: () => this.run('cancel') });
  loadLogs = component => {
    const ticket = ++this.logRequest;
    this.setState({ logComponent: component, logLoading: true, logError: false, logs: [] });
    this.props.dispatch({ type: 'templateDelivery/synchronize', payload: { ...this.payload('logs'), serviceId: component.service_id }, callback: result => {
      if (this.alive && ticket === this.logRequest) this.setState({ logs: Array.isArray(result.lines) ? result.lines : [], logLoading: false });
    }, onError: () => { if (this.alive && ticket === this.logRequest) this.setState({ logError: true, logLoading: false }); } });
  };
  closeLogs = () => { this.logRequest += 1; this.setState({ logComponent: null, logs: [], logLoading: false }); };
  render() {
    const { job, publishing, failure, onPublish } = this.props;
    const { busy, pollError, actionError, logComponent, logLoading, logError, logs } = this.state;
    const success = job.status === 'success', failed = job.status === 'failed';
    const statuses = { syncing: 'syncComponentRunning', success: 'syncComponentSuccess', failed: 'syncComponentFailed', queued: 'syncComponentQueued' };
    const completed = job.components.filter(item => item.status === 'success').length;
    return <div className={styles.syncContent}>
      <div className={styles.syncHeading} role="status" aria-live="polite">
        <Icon type={failed ? 'close-circle' : success ? 'check-circle' : 'sync'} spin={!failed && !success}
          className={`${styles.syncHero} ${failed ? styles.syncStatusfailed : styles.syncHeroSuccess}`} />
        <h2>{t(failed ? 'syncFailed' : success ? 'syncSuccess' : 'syncRunning')}</h2>
        <p>{t(success ? 'syncReadyHelp' : failed ? 'syncFailedHelp' : 'syncWaitHelp')}</p>
      </div>
      <div>
          <Progress percent={job.components.length ? Math.floor(completed / job.components.length * 100) : 0} status={failed ? 'exception' : success ? 'success' : 'active'} />
          {pollError && <Alert type="warning" showIcon className={styles.syncAlert} message={t('syncStatusUnavailable')}
            description={<Button onClick={this.refresh}>{t('syncRefresh')}</Button>} />}
          {(actionError || failure) && <Alert className={styles.syncAlert} type="error" showIcon message={t(failure || 'syncActionFailed')} />}
          <ul className={styles.syncComponents}>{job.components.map(component => <li key={component.service_id}>
            <Icon type={component.status === 'success' ? 'check-circle' : component.status === 'failed' ? 'close-circle' : component.status === 'queued' ? 'clock-circle' : 'sync'}
              spin={component.status === 'syncing'} className={styles[`syncStatus${component.status}`]} />
            <span className={styles.syncComponentName}>{t('components')}: {component.name}</span>
            <span className={styles.muted}>{component.error || t(statuses[component.status])}</span>
            <Button type="link" disabled={component.status === 'queued'} onClick={() => this.loadLogs(component)}>{t('syncLogs')}</Button>
          </li>)}</ul>
      </div>
      <div className={styles.syncActions}>
          <Button disabled={publishing} loading={busy} onClick={this.cancel}>{t('abandonPublish')}</Button>
          {failed && <Button type="primary" loading={busy} onClick={() => this.run('retry')}>{t('retry')}</Button>}
          {success && <Button type="primary" disabled={busy} loading={publishing} onClick={onPublish}>{t('confirmPublish')}</Button>}
      </div>
      {logComponent && <Modal visible width={800} title={`${t('syncLogs')} · ${logComponent.name}`} onCancel={this.closeLogs}
        className={styles.syncLogModal} footer={<Button onClick={() => this.loadLogs(logComponent)} loading={logLoading}>{t('syncRefresh')}</Button>}>
        <Spin spinning={logLoading}>{logError ? <Alert type="warning" showIcon message={t('syncLogsUnavailable')} /> :
          <pre className={styles.syncLogs}>{logs.length ? logs.join('\n') : t('syncNoLogs')}</pre>}</Spin>
      </Modal>}
    </div>;
  }
}
