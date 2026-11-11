import React, { PureComponent } from 'react';
import { Alert, Button, Descriptions, Empty, Select, Spin, Steps, message } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import globalUtil from '@/utils/global';
import PageHeader from '@/components/PageHeader';
import pageHeaderSvg from '@/utils/pageHeaderSvg';
import { isLinuxQcow2QuickStart } from '@/utils/vmQuickStart';
import CreateVm from './CreateVm';
import { t } from './messages';
import styles from './index.less';

function identity(props) {
  return {
    team: props.teamName || globalUtil.getCurrTeamName(),
    region: props.regionName || globalUtil.getCurrRegionName(),
    application: props.groupId || globalUtil.getAppID()
  };
}

@connect()
export class VmCreateWorkflow extends PureComponent {
  state = { quickStart: null, quickStartSubmitting: false, selectedStorage: '', creationStorage: { status: 'loading', options: [] } };
  mounted = false;
  quickStartInFlight = false;
  sourceCollectionInFlight = false;
  credentialsCleared = false;
  storageReadGeneration = 0;

  componentDidMount() {
    this.mounted = true;
    if (this.props.sourceSummary) this.loadCreationStorage();
  }
  componentDidUpdate(previous) {
    if (previous.sourceSummary !== this.props.sourceSummary && !this.state.quickStart)
      this.loadCreationStorage();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.storageReadGeneration += 1;
    if (this.props.clearSourceCredentials) this.props.clearSourceCredentials();
  }

  loadCreationStorage = () => {
    if (this.state.quickStartSubmitting || this.state.quickStart?.serviceAlias) return;
    const context = identity(this.props);
    const source = this.props.sourceSummary;
    const generation = ++this.storageReadGeneration;
    const isActive = () => this.mounted && generation === this.storageReadGeneration && source === this.props.sourceSummary &&
      (!this.props.isSourceScopeCurrent || this.props.isSourceScopeCurrent()) &&
      context.team === globalUtil.getCurrTeamName() && context.region === globalUtil.getCurrRegionName() &&
      String(context.application) === String(globalUtil.getAppID());
    this.setState({ creationStorage: { status: 'loading', options: [] } });
    let settled = false;
    const finish = result => {
      if (!isActive()) return;
      settled = true;
      const options = (Array.isArray(result?.options) ? result.options : [])
        .filter(option => option && typeof option.value === 'string' && typeof option.label === 'string')
        .map(option => ({ value: option.value.slice(0, 128), label: option.label.slice(0, 256) }));
      const status = result?.status === 'deferred' && result.reason === 'legacy-permission' ? 'deferred'
        : result?.status === 'ready' ? options.length ? 'ready' : 'empty'
        : result?.status === 'empty' ? 'empty' : 'failed';
      this.setState({ creationStorage: { status, options: status === 'ready' ? options : [] } });
    };
    const request = this.props.dispatch({
      type: 'createApp/fetchVMCreationStorage',
      payload: { team_name: context.team, region_name: context.region },
      isActive,
      callback: finish
    });
    if (request && request.then) request.then(() => {
      if (!settled) finish({ status: 'failed' });
    }, () => finish({ status: 'failed' }));
  };

  create = values => {
    if (this.quickStartInFlight || this.sourceCollectionInFlight) return;
    if (this.props.sourceSummary) {
      const storage = this.state.creationStorage;
      if ((storage.status === 'ready' && !storage.options.some(option => option.value === values.disk_volume_type)) ||
        !['ready', 'deferred'].includes(storage.status)) {
        message.warning(t(storage.status === 'ready' ? 'storageRequired' : 'creationStorageFailed'));
        return;
      }
    }
    if (!this.props.collectSourcePayload) {
      message.warning(t('nativeSourceRequired'));
      return;
    }
    this.sourceCollectionInFlight = true;
    this.setState({ quickStartSubmitting: true });
    this.props.collectSourcePayload(source => {
      this.sourceCollectionInFlight = false;
      if (!this.mounted) return;
      if (!source) {
        this.setState({ quickStartSubmitting: false });
        return;
      }
      const context = identity(this.props);
      this.runQuickStart({
        ...source,
        team_name: context.team,
        group_id: source.group_id || context.application,
        resources: { cpu: values.cpu, memory: values.memory, disk: values.disk },
        ...(values.disk_volume_type ? { disk_volume_type: values.disk_volume_type } : {})
      });
    });
  };

  runQuickStart = (payload, resume) => {
    if (this.quickStartInFlight) return;
    this.quickStartInFlight = true;
    const context = identity(this.props);
    const isActive = () => this.mounted &&
      (!this.props.isSourceScopeCurrent || this.props.isSourceScopeCurrent()) &&
      context.team === globalUtil.getCurrTeamName() &&
      context.region === globalUtil.getCurrRegionName() &&
      String(context.application) === String(globalUtil.getAppID());
    this.setState({
      quickStartSubmitting: true,
      ...(payload.disk_volume_type ? { selectedStorage: payload.disk_volume_type } : {}),
      quickStart: { ...resume, status: 'processing', stage: resume?.stage || 'create', error: '', groupId: payload.group_id || context.application,
        sshRequired: resume?.sshRequired === true || isLinuxQcow2QuickStart(payload.source_type, payload.vm_url),
        resources: { cpu: payload.resources.cpu, memory: payload.resources.memory, disk: payload.resources.disk } }
    });
    const update = (result = {}, finished = false) => {
      if (!isActive()) return;
      const stages = ['create', 'ssh', 'storage', 'configure', 'build'];
      const errors = ['quickStartCreateFailed', 'quickStartSshUnconfirmed', 'quickStartStorageFailed', 'quickStartStorageRequired', 'quickStartConfigureFailed', 'quickStartBuildFailed', 'quickStartInvalidRequest'];
      const safe = {
        status: finished && ['failed', 'storage-required', 'submitted'].includes(result.status) ? result.status : finished ? 'failed' : 'processing',
        error: finished ? errors.includes(result.error) ? result.error : result.status === 'submitted' ? '' : 'quickStartInvalidRequest' : ''
      };
      if (stages.includes(result.stage)) safe.stage = result.stage;
      if (typeof result.serviceAlias === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(result.serviceAlias)) safe.serviceAlias = result.serviceAlias;
      if (safe.serviceAlias && !this.credentialsCleared) {
        this.credentialsCleared = true;
        if (this.props.clearSourceCredentials) this.props.clearSourceCredentials();
      }
      if (/^\d+$/.test(String(result.groupId))) safe.groupId = String(result.groupId);
      if (typeof result.portConfigured === 'boolean') safe.portConfigured = result.portConfigured;
      if (typeof result.resourceConfigured === 'boolean') safe.resourceConfigured = result.resourceConfigured;
      if (typeof result.sshRequired === 'boolean') safe.sshRequired = result.sshRequired;
      if (Array.isArray(result.storageOptions)) safe.storageOptions = result.storageOptions
        .filter(option => option && typeof option.value === 'string' && typeof option.label === 'string')
        .map(option => ({ value: option.value.slice(0, 128), label: option.label.slice(0, 128) }));
      if (finished) this.quickStartInFlight = false;
      this.setState(previous => ({
        quickStart: { ...previous.quickStart, ...safe }, quickStartSubmitting: !finished,
        ...(safe.status === 'storage-required' && safe.storageOptions &&
          !safe.storageOptions.some(option => option.value === previous.selectedStorage) ? { selectedStorage: '' } : {})
      }));
    };
    const request = this.props.dispatch({
      type: 'createApp/createVirtualMachineWorkflow', payload, resume, isActive,
      onProgress: result => update(result), callback: result => update(result, true)
    });
    if (request && request.catch) request.catch(() => update({ status: 'failed', error: 'quickStartInvalidRequest' }, true));
  };

  retryQuickStart = () => {
    const { quickStart, selectedStorage } = this.state;
    if (!quickStart?.serviceAlias) return;
    this.runQuickStart({
      team_name: identity(this.props).team,
      group_id: quickStart.groupId,
      resources: quickStart.resources,
      ...(selectedStorage ? { disk_volume_type: selectedStorage } : {})
    }, quickStart);
  };

  openQuickStartComponent = () => {
    const context = identity(this.props);
    const result = this.state.quickStart;
    if (!result?.serviceAlias || !/^\d+$/.test(String(result.groupId))) return;
    if (this.props.onCancel) this.props.onCancel();
    this.props.dispatch(routerRedux.push({
      pathname: `/team/${context.team}/region/${context.region}/apps/${result.groupId}/overview`,
      query: { type: 'components', componentID: result.serviceAlias, tab: 'overview' }
    }));
  };

  renderQuickStart = () => {
    const { quickStart: result, quickStartSubmitting: loading, selectedStorage } = this.state;
    const stages = ['create', ...(result.sshRequired ? ['ssh'] : []), 'storage', 'configure', 'build'];
    const current = result.status === 'submitted' ? stages.length - 1 : Math.max(0, stages.indexOf(result.stage));
    const storageRequired = result.status === 'storage-required';
    return <section className={styles.quickStartResult} aria-label={t('quickStartProgress')}>
      <Steps current={current} size="small" status={result.status === 'failed' ? 'error' : 'process'}>
        {stages.map(stage => <Steps.Step key={stage} title={t(`quickStartStage.${stage}`)} />)}
      </Steps>
      <Alert showIcon type={loading ? 'info' : result.status === 'submitted' ? 'success' : storageRequired ? 'warning' : 'error'}
        message={loading ? t(`quickStartStage.${result.stage}`) : result.status === 'submitted' ? t('quickStartSubmitted') : t(result.error)}
        description={result.status === 'submitted' ? t(result.sshRequired ? 'quickStartSubmittedHelp' : 'vmCreationSubmittedHelp') : result.serviceAlias ? t('quickStartPartialHelp') : t('quickStartCreateBoundary')} />
      {loading && <Spin className={styles.spaced} />}
      {result.serviceAlias && <Descriptions column={1} bordered size="small" className={styles.spaced}>
        <Descriptions.Item label={t('quickStartComponent')}>{result.serviceAlias}</Descriptions.Item>
      </Descriptions>}
      {result.serviceAlias && result.sshRequired && <Alert className={styles.spaced} type={result.portConfigured ? 'info' : 'warning'}
        message={t('quickStartInternalSsh')} description={t(result.portConfigured ? 'quickStartPortSaved' : 'quickStartPortUnconfirmed')} />}
      {(storageRequired || result.stage === 'configure') && result.storageOptions?.length > 0 && <div className={styles.quickStartStorage}>
        <label htmlFor="quick-start-storage">{t('quickStartChooseStorage')}</label>
        <Select id="quick-start-storage" value={selectedStorage || undefined} disabled={loading}
          placeholder={t('quickStartChooseStorage')} onChange={value => this.setState({ selectedStorage: value })}>
          {result.storageOptions.map(option => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}
        </Select>
      </div>}
      <div className={`${styles.actions} ${styles.spaced}`}>
        <Button disabled={loading} onClick={this.props.onCancel}>{t('backToApplication')}</Button>
        {result.serviceAlias && <Button onClick={this.openQuickStartComponent}>{t('quickStartOpenComponent')}</Button>}
        {!loading && result.serviceAlias && result.status !== 'submitted' && <Button type="primary"
          disabled={storageRequired && !selectedStorage} onClick={this.retryQuickStart}>
          {t(storageRequired ? 'quickStartContinue' : 'quickStartRetry')}
        </Button>}
      </div>
    </section>;
  };

  render() {
    return <div className={`${styles.workflowCreate} ${styles.workflowCreatePage}`}>
      <div className={styles.creationWorkspace}>
        <PageHeader title={t('createTitle')} titleSvg={pageHeaderSvg.getPageHeaderSvg('vm', 18)} />
        {this.state.quickStart ? this.renderQuickStart() : this.props.sourceSummary ? <CreateVm
          sourceSummary={this.props.sourceSummary} onBackToSource={this.props.onBackToSource}
          creationStorage={this.state.creationStorage} onRetryStorage={this.loadCreationStorage}
          onCreate={this.create} onCancel={this.props.onCancel} submitting={this.state.quickStartSubmitting}
        /> : <Empty description={t('nativeSourceRequired')} />}
      </div>
    </div>;
  }
}
