import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Avatar, Button, Empty, Icon, Spin } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { w, statusLabel, ReviewModal, DeployModal } from '../../components/DeliveryWorkflow';
import SourceSection from './SourceSection';
import RuntimeSection from './RuntimeSection';
import VersionsSection from './VersionsSection';
import styles from './asset.less';
const { orderedVersions, versionSources, environmentRecords } = require('../../utils/deliveryAsset');
const { deliveryTargetPath, deliveryTargetIsCached } = require('../../utils/deliveryNavigation');
const initialState = () => ({ group: null, deployments: [], loading: true, failed: false, source: [], sourceLoading: false, sourceFailed: false,
  selectedSourceId: '', sourceVersionId: null, histories: {}, targets: [], runtime: null, runtimeLoading: false,
  selectedVersionId: '', activeSection: 'sources', review: null, deployment: null });

@connect(({ user, loading }) => ({ user: user.currentUser, busy: loading.effects['deliveryCenter/act'] }))
export default class DevelopmentDeliveryDetail extends PureComponent {
  state = initialState();
  generation = 0;
  alive = false;
  pendingDeliveryTaskId = '';
  pendingDeliveryRefreshId = '';
  componentDidMount() {
    this.alive = true;this.load();
    this.poll = setInterval(() => { if (!document.hidden && !this.state.review && !this.state.deployment) this.load(true); }, 5000);
  }
  componentDidUpdate(previous) {
    if (JSON.stringify(previous.match.params) !== JSON.stringify(this.props.match.params) ||
      (previous.user || {}).user_id !== (this.props.user || {}).user_id || (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id) {
      this.generation += 1;this.pendingDeliveryTaskId = '';this.pendingDeliveryRefreshId = '';this.observedGroup = null;this.observer && this.observer.disconnect();this.setState(initialState(), this.load);
    }
    if (this.state.group && this.observedGroup !== this.state.group.id && this.assetRoot) {
      this.observedGroup = this.state.group.id;
      if (typeof IntersectionObserver !== 'undefined') {
        this.observer && this.observer.disconnect();
        this.observer = new IntersectionObserver(entries => {
          const visible = entries.find(entry => entry.isIntersecting);
          if (visible && this.alive) this.setState({ activeSection: visible.target.id.replace('asset-', '').replace('-title', '') });
        }, { rootMargin: '-175px 0px -50% 0px' });
        ['sources', 'runtime', 'versions'].forEach(id => { const node = this.assetRoot.querySelector(`#asset-${id}-title`);if (node) this.observer.observe(node); });
      }
    }
  }
  componentWillUnmount() { this.alive = false;this.generation += 1;clearInterval(this.poll);this.observer && this.observer.disconnect(); }

  active = generation => this.alive && generation === this.generation;
  currentVersion = () => {
    const items = this.state.group && this.state.group.versions || [];
    return items.find(item => item.template.id === this.state.selectedVersionId) || orderedVersions(items).find(item => item.status === 'pending') || orderedVersions(items)[0];
  };
  sourceReference = () => {
    const group = this.state.group, current = this.currentVersion();
    const selected = group && group.versions.find(item => item.template.id === this.state.sourceVersionId);
    return (selected || current || {}).template;
  };
  sources = () => {
    const sources = this.state.source.slice();
    versionSources(this.sourceReference()).forEach(item => { if (!sources.some(source => source.service_id === item.service_id)) sources.push({ ...item, archived: true }); });
    return sources;
  };
  environments = () => this.state.group ? environmentRecords(this.state.group.source, this.state.deployments, this.state.group.versions) : [];
  environment = () => this.environments()[0];
  load = (quiet = false) => {
    const { user, match } = this.props;
    if (!user || !user.is_enterprise_admin || String(user.enterprise_id) !== String(match.params.eid)) return;
    const generation = this.generation, ticket = this.centerTicket = (this.centerTicket || 0) + 1;
    if (!quiet) this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'center', user, groupId: match.params.groupId }, callback: bean => {
      if (!this.active(generation) || ticket !== this.centerTicket) return;
      const group = bean.groups.find(item => item.id === match.params.groupId), first = !this.state.group;
      const ids = new Set(group ? group.versions.map(item => item.template.id) : []);
      const deployments = (bean.deployments || []).filter(item => item.template_group_id ? item.template_group_id === match.params.groupId : ids.has(item.template_id));
      if (this.followDelivery(deployments)) return;
      this.setState({ group, deployments, loading: false, failed: false }, () => {
        if (!group) return;
        if (first) { this.loadSources();this.loadTargets();this.runtime(); }
        else if (!this.state.runtimeLoading && Date.now() - (this.runtimeUpdated || 0) > 30000) this.runtime();
      });
    }, onError: () => { if (this.active(generation) && ticket === this.centerTicket) this.setState({ loading: false, failed: true }); } });
  };
  followDelivery = tasks => {
    if (!this.pendingDeliveryTaskId) return false;
    const task = (tasks || []).find(item => item.id === this.pendingDeliveryTaskId);
    if (!task) return false;
    if (['failed', 'cancelled'].includes(task.status)) { this.pendingDeliveryTaskId = '';this.pendingDeliveryRefreshId = '';return false; }
    const path = deliveryTargetPath(task);
    if (!path) return false;
    if (!deliveryTargetIsCached(this.props.user, task)) {
      if (this.pendingDeliveryRefreshId === task.id) return true;
      const generation = this.generation;
      this.pendingDeliveryRefreshId = task.id;
      this.props.dispatch({ type: 'user/fetchCurrent', payload: { team_name: task.target.team_name }, callback: response => {
        if (!this.active(generation) || this.pendingDeliveryTaskId !== task.id) return;
        this.pendingDeliveryRefreshId = '';
        this.pendingDeliveryTaskId = '';
        if (deliveryTargetIsCached(response && response.bean, task)) this.props.dispatch(routerRedux.push(path));
      }, handleError: () => {
        if (this.active(generation) && this.pendingDeliveryRefreshId === task.id) this.pendingDeliveryRefreshId = '';
      } });
      return true;
    }
    this.pendingDeliveryTaskId = '';
    this.pendingDeliveryRefreshId = '';
    this.props.dispatch(routerRedux.push(path));
    return true;
  };
  loadSources = () => {
    const generation = this.generation;
    this.setState({ sourceLoading: true });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'source', user: this.props.user, scope: this.state.group.source }, callback: data => {
      if (!this.active(generation)) return;
      this.setState({ source: data.components, sourceLoading: false, sourceFailed: false }, () => this.history(this.state.selectedSourceId || (this.sources()[0] || {}).service_id, 1));
    }, onError: () => { if (this.active(generation)) this.setState({ source: [], sourceLoading: false, sourceFailed: true }, () => this.history((this.sources()[0] || {}).service_id, 1)); } });
  };
  loadTargets = () => {
    const generation = this.generation;
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'targets', user: this.props.user }, callback: data => { if (this.active(generation)) this.setState({ targets: data.teams || [] }); } });
  };
  history = (id, page = 1) => {
    const component = this.sources().find(item => item.service_id === id);
    if (!component) return;
    if (!component.service_alias) {
      this.setState(state => ({ histories: { ...state.histories, [id]: { page, records: [], failed: true, loading: false } } }));return;
    }
    const generation = this.generation, ticket = this.historyTicket = (this.historyTicket || 0) + 1;
    this.setState(state => ({ histories: { ...state.histories, [id]: { ...state.histories[id], page, loading: true, failed: false } } }));
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'buildHistory', user: this.props.user, scope: this.state.group.source, component, page }, callback: data => {
      if (this.active(generation) && ticket === this.historyTicket) this.setState(state => ({ histories: { ...state.histories, [id]: { ...data, loading: false, failed: false } } }));
    }, onError: () => { if (this.active(generation) && ticket === this.historyTicket) this.setState(state => ({ histories: { ...state.histories, [id]: { page, records: [], loading: false, failed: true } } })); } });
  };
  selectSource = (id, versionId) => this.setState({ selectedSourceId: id, sourceVersionId: versionId || null }, () => this.history(id, 1));
  focusSource = (id, versionId) => { this.selectSource(id, versionId);this.jump('sources'); };
  runtime = () => {
    const environment = this.environment();
    if (!environment) return;
    const generation = this.generation, ticket = this.runtimeTicket = (this.runtimeTicket || 0) + 1;
    this.setState({ runtimeLoading: true });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'runtime', user: this.props.user, scope: environment.scope }, callback: runtime => {
      if (this.active(generation) && ticket === this.runtimeTicket) { this.runtimeUpdated = Date.now();this.setState({ runtime, runtimeLoading: false }); }
    }, onError: () => { if (this.active(generation) && ticket === this.runtimeTicket) this.setState({ runtime: {}, runtimeLoading: false }); } });
  };
  selectVersion = id => this.setState({ selectedVersionId: id, sourceVersionId: null });
  focusVersion = id => { if (this.state.group.versions.some(item => item.template.id === id)) { this.selectVersion(id);this.jump('versions'); } };
  jump = section => {
    this.setState({ activeSection: section });
    const node = this.assetRoot && this.assetRoot.querySelector(`#asset-${section}`);
    if (node) node.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  act = payload => {
    const generation = this.generation;
    this.props.dispatch({ type: 'deliveryCenter/act', payload: { ...payload, user: this.props.user }, callback: task => {
      if (this.active(generation)) {
        if (payload.operation === 'deploy' && payload.kind === 'delivery' && task && task.id) {
          this.pendingDeliveryTaskId = task.id;
          if (this.followDelivery([task])) return;
        }
        this.setState({ review: null, deployment: null }, () => this.load(true));
      }
    } });
  };
  render() {
    const { user, busy, dispatch, match } = this.props;
    if (!user || !user.is_enterprise_admin || String(user.enterprise_id) !== String(match.params.eid)) return <Alert type="warning" message={w('forbidden')} />;
    const { group, loading, failed, sourceLoading, sourceFailed, selectedSourceId, histories, targets, runtime, runtimeLoading, review, deployment, activeSection } = this.state;
    const sources = this.sources(), component = sources.find(item => item.service_id === selectedSourceId) || sources[0], version = this.currentVersion(), environment = this.environment();
    return <PageHeaderLayout isFooter wrapperClassName={styles.assetPage} title={<span className={styles.pageTitle}><Avatar shape="square" size={44} src={group && group.profile && group.profile.logo} icon="appstore" />{group ? group.template_name : w('assetDetail')}{version && <React.Fragment>{statusLabel(version.status)}<code className={styles.headerVersion}>v{version.template.version}</code></React.Fragment>}</span>}
      content={w('assetDetailHelp')} action={<Button onClick={() => dispatch(routerRedux.push(`/enterprise/${match.params.eid}/development-delivery`))}>{w('back')}</Button>}>
      <Spin spinning={loading}>{failed ? <Alert type="warning" showIcon message={w('loadFailed')} description={<Button onClick={() => this.load()}>{w('retry')}</Button>} /> : !group ? !loading && <Empty description={w('notFound')} /> :
        <div className={styles.assetCanvas} ref={node => { this.assetRoot = node; }}>
          <nav className={styles.flowNav} aria-label={w('assetLifecycle')}>
            {[
              ['sources', 'assetSources', w('sourceComponentCount', { count: sources.length })],
              ['runtime', 'assetRuntime', `${group.source.teamName} / ${group.source.regionName}`],
              ['versions', 'assetVersions', w('assetVersionCount', { count: group.versions.length, pending: group.pending })]
            ].map(([key, label, help], index) => <button type="button" key={key} aria-controls={`asset-${key}`} aria-current={activeSection === key ? 'location' : undefined}
              className={`${styles.flowStep} ${activeSection === key ? styles.activeStep : ''}`} onClick={() => this.jump(key)}>
              <span><span className={styles.stepIcon}><Icon type={{ sources: 'branches', runtime: 'database', versions: 'appstore' }[key]} /></span><span><strong><span className={styles.stepNumber}>0{index + 1}</span>{key === 'versions' ? <React.Fragment><span className={styles.fullStepLabel}>{w(label)}</span><span className={styles.shortStepLabel}>{w('assetVersionsShort')}</span></React.Fragment> : w(label)}</strong><small>{help}</small></span></span><Icon type="arrow-right" />
            </button>)}
          </nav>
          <SourceSection components={sources} selectedId={component && component.service_id} onSelect={this.selectSource} history={component && histories[component.service_id] || {}}
            onPage={page => this.history(component.service_id, page)}
            loading={sourceLoading} failed={sourceFailed} onRefresh={this.loadSources} />
          <RuntimeSection environment={environment} targets={targets}
            data={runtime} loading={runtimeLoading} sourceAppName={group.app_name} onVersion={this.focusVersion}
            versions={group.versions} onSource={this.focusSource} sourceIds={sources.map(item => item.service_id)} />
          <VersionsSection group={group} item={version} deployments={this.state.deployments} onSelect={this.selectVersion}
            onReview={item => this.setState({ review: item })} onTest={item => this.setState({ deployment: item })}
            onDeploy={item => this.setState({ deployment: item })} onViewTemplate={path => dispatch(routerRedux.push(path))} onSource={this.focusSource} />
        </div>}
      </Spin>
      {review && <ReviewModal item={review} busy={busy} onCancel={() => this.setState({ review: null })} onSubmit={(decision, comment) => this.act({ operation: 'review', requestId: review.id, decision, comment })} />}
      {deployment && <DeployModal key={deployment.id} testing={deployment.status !== 'approved'} installation={deployment.status === 'approved'}
        approved={group.versions.some(item => item.template.id === deployment.template.id && item.publication_status === 'published')}
        title={deployment.status === 'approved' ? w('deploy') : undefined} template={deployment.template} scope={group.source} user={user} dispatch={dispatch} busy={busy} onCancel={() => this.setState({ deployment: null })}
        onSubmit={values => this.act({ operation: 'deploy', ...values, scope: group.source, template: deployment.template, listingId: deployment.id })} />}
    </PageHeaderLayout>;
  }
}
