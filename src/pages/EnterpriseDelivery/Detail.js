import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Badge, Button, Card, Empty, Icon, Progress, Spin, Table, Timeline } from 'antd';
import moment from 'moment';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import { w, listingStatusLabel, ReviewModal, DeployModal } from '../../components/DeliveryWorkflow';
import styles from './index.less';
import EnvironmentSummary from '../../components/DeliveryWorkflow/EnvironmentSummary';
import VersionDetails from '../../components/DeliveryWorkflow/VersionDetails';

const formatMetric = value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value > 0 && value < 0.01) return '<0.01';
  return Number(value.toFixed(2)).toLocaleString();
};
const sourceType = row => w(row.vm || row.source_type === 'vm' ? 'virtualMachine' : row.source_type === 'source_code' ? 'sourceCode' : 'image');

@connect(({ user, loading }) => ({ user: user.currentUser, busy: loading.effects['deliveryCenter/act'] }))
export default class DevelopmentDeliveryDetail extends PureComponent {
  state = { group: null, deployments: [], runtime: null, loading: true, runtimeLoading: false, failed: false, review: null, deployment: null,
    expandedEvents: false, versionExpansions: {}, versionTabs: {} };
  generation = 0;
  alive = false;
  componentDidMount() {
    this.alive = true;this.load();
    this.workflowTimer = setInterval(() => { if (!document.hidden && !this.state.review && !this.state.deployment) this.load(true); }, 5000);
  }
  componentDidUpdate(previous) {
    if (JSON.stringify(previous.match.params) !== JSON.stringify(this.props.match.params) ||
      (previous.user || {}).user_id !== (this.props.user || {}).user_id || (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id) {
      this.generation += 1;
      this.setState({ group: null, runtime: null, review: null, deployment: null, expandedEvents: false, versionExpansions: {}, versionTabs: {} }, this.load);
    }
  }
  componentWillUnmount() { clearInterval(this.workflowTimer);this.alive = false; this.generation += 1; }
  active = generation => this.alive && generation === this.generation;
  load = (quiet = false) => {
    if (!this.props.user || !this.props.user.is_enterprise_admin || String(this.props.user.enterprise_id) !== String(this.props.match.params.eid)) return;
    const generation = this.generation;
    if (!quiet) this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'center', user: this.props.user }, callback: bean => {
      if (!this.active(generation)) return;
      const group = bean.groups.find(item => item.id === this.props.match.params.groupId);
      this.setState({ group, deployments: bean.deployments, loading: false }, () => { if (group && !this.state.runtime) this.runtime(); });
    }, onError: () => { if (this.active(generation)) this.setState({ loading: false, failed: true }); } });
  };
  runtime = () => {
    const generation = this.generation;
    this.setState({ runtimeLoading: true });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'runtime', user: this.props.user, scope: this.state.group.source }, callback: runtime => {
      if (this.active(generation)) this.setState({ runtime, runtimeLoading: false });
    }, onError: () => { if (this.active(generation)) this.setState({ runtime: {}, runtimeLoading: false }); } });
  };
  act = payload => {
    const generation = this.generation;
    this.props.dispatch({ type: 'deliveryCenter/act', payload: { ...payload, user: this.props.user }, callback: () => {
      if (this.active(generation)) this.setState(state => ({ review: null, deployment: null,
        versionExpansions: { ...state.versionExpansions, [payload.requestId || payload.listingId]: true },
        versionTabs: { ...state.versionTabs, [payload.requestId || payload.listingId]: payload.operation === 'review' ? 'review' : 'deployments' } }), this.load);
    } });
  };
  renderMetric = (label, value, requested, unit) => {
    const measured = typeof value === 'number' && Number.isFinite(value) && value >= 0;
    const hasRequest = typeof requested === 'number' && Number.isFinite(requested) && requested >= 0;
    const comparable = measured && hasRequest && requested > 0;
    const actualPercent = comparable ? value / requested * 100 : null;
    const percent = comparable ? Math.max(0, Math.min(100, actualPercent)) : 0;
    const ratio = !comparable ? '—' : actualPercent > 0 && actualPercent < 0.1 ? '<0.1%' : `${Number(actualPercent.toFixed(1))}%`;
    return <div className={styles.metric} key={label}>
      <div className={styles.metricLabel}>{w(label)}</div>
      <div className={styles.metricValue}><strong>{formatMetric(measured ? value : undefined)}</strong>{measured && <span>{unit}</span>}</div>
      <div className={styles.resourceMeter} role="progressbar" aria-label={`${w(label)} ${w('usageComparedToRequest')}`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={comparable ? Math.round(percent) : undefined}
        aria-valuetext={comparable ? `${formatMetric(value)} / ${formatMetric(requested)} ${unit} (${formatMetric(actualPercent)}%)` : w('resourceRatioUnavailable')}>
        <Progress percent={percent} strokeWidth={4} showInfo={false} status="normal" />
      </div>
      <div className={styles.metricHint}><span>{hasRequest ? `${w('requestedShort')} ${formatMetric(requested)} ${unit}` : w('noRequestedValue')}</span><span>{ratio}</span></div>
    </div>;
  };
  renderOverview = () => {
    const { group, runtime, runtimeLoading } = this.state;
    const resources = runtime && runtime.resources || {}, state = runtime && runtime.state || {};
    const appName = runtime && runtime.app && runtime.app.group_name || group.app_name;
    const appStatus = String(state.status || resources.status || runtime && runtime.app && runtime.app.status || '').toUpperCase();
    const statusNames = { RUNNING: 'appRunning', CLOSED: 'appStopped', STARTING: 'appStarting', STOPPING: 'appStopping', ABNORMAL: 'appAbnormal', PARTIAL_ABNORMAL: 'appAbnormal' };
    const badge = appStatus === 'RUNNING' ? 'success' : ['ABNORMAL', 'PARTIAL_ABNORMAL'].includes(appStatus) ? 'error' : ['STARTING', 'STOPPING'].includes(appStatus) ? 'processing' : 'default';
    return <React.Fragment>
      <div className={styles.overviewBand}>
        <div className={styles.summaryIdentity}>
          <div className={styles.applicationIcon} aria-hidden="true"><Icon type="appstore" /></div>
          <div className={styles.applicationIdentity}><div className={styles.eyebrow}>{w('sourceAppRuntime')}</div>
            <div className={styles.applicationTitle}><strong>{appName}</strong><Badge status={badge} text={statusNames[appStatus] ? w(statusNames[appStatus]) : appStatus || '—'} /></div>
            <div className={styles.sourceContext}>{group.source.team_alias || group.source.teamName}<span>/</span>{group.source.region_alias || group.source.regionName}</div>
            {runtime && runtime.collected_at && <div className={styles.updatedAt}>{w('updatedAt')} {moment(runtime.collected_at).format('HH:mm:ss')}</div>}
          </div>
        </div>
        <div className={styles.resourceOverview}>
          <div className={styles.resourceHeading}><span>{w('resourceUsage')}<small>{w('usageComparedToRequest')}</small></span>
            <Button icon="reload" loading={runtimeLoading} onClick={this.runtime} aria-label={w('refreshRuntime')}>{w('refresh')}</Button>
          </div>
          <Spin spinning={runtimeLoading}><div className={styles.resourceMetrics}>
            {this.renderMetric('cpuMetric', state.cpu != null ? state.cpu / 1000 : undefined, resources.cpu_request != null ? resources.cpu_request / 1000 : undefined, w('coreUnit'))}
            {this.renderMetric('memoryMetric', state.memory != null ? state.memory / 1024 : undefined, resources.memory_request != null ? resources.memory_request / 1024 : undefined, 'GB')}
            {this.renderMetric('diskMetric', state.disk != null ? state.disk / 1024 / 1024 : undefined, resources.storage_request, 'GB')}
          </div></Spin>
        </div>
      </div>
      {runtime && (!runtime.app || !runtime.resources) && <Alert type="info" showIcon message={w('runtimeUnavailable')} />}
    </React.Fragment>;
  };
  renderCurrentApplication = () => {
    const { runtime, runtimeLoading, expandedEvents } = this.state;
    const components = runtime && runtime.components, events = runtime && runtime.events || [];
    return <div className={styles.currentApplicationPanels}>
      <section className={styles.currentComponents}><h3 className={styles.panelHeading}>{w('currentComponents')}<span className={styles.tabCount}>{components ? components.length : '—'}</span></h3>
        <Spin spinning={runtimeLoading}>{components ? <div className={styles.table}><Table rowKey="service_id" size="small" pagination={false} dataSource={components} columns={[
          { title: w('component'), dataIndex: 'name', width: '20%', render: (name, row) => <div><span>{name}</span><div className={styles.sourceType}>{sourceType(row)}</div></div> },
          { title: w('status'), dataIndex: 'status', width: '14%', render: value => {
            const status = String(value || '').toUpperCase(), names = { RUNNING: 'appRunning', CLOSED: 'appStopped', STARTING: 'appStarting', STOPPING: 'appStopping', ABNORMAL: 'appAbnormal', BUILDING: 'componentBuilding' };
            return <Badge status={status === 'RUNNING' ? 'success' : status === 'ABNORMAL' ? 'error' : ['STARTING', 'BUILDING'].includes(status) ? 'processing' : 'default'} text={names[status] ? w(names[status]) : value || '—'} />;
          } },
          { title: w('componentResources'), key: 'resources', width: '25%', render: (_, row) => <div className={styles.componentResourceValues}>
            <div>CPU {formatMetric(row.cpu_millicores == null ? undefined : row.cpu_millicores / 1000)} {w('coreUnit')} · {formatMetric(row.memory_mib == null ? undefined : row.memory_mib / 1024)} GB</div>
            <div>{w('replicas')} {formatMetric(row.replicas)}</div>
          </div> },
          { title: w('buildSourceVersion'), key: 'source', width: '41%', render: (_, row) => <div className={styles.wrap}>
            <span className={styles.sourceLocation} title={row.source}>{row.source || '—'}</span>
            {(row.branch || row.commit) && <div className={styles.buildIdentity}>{row.branch && <span><Icon type="branches" /> {row.branch}</span>}{row.commit && <code title={row.commit} aria-label={`Commit: ${row.commit}`}>{row.commit.slice(0, 8)}</code>}</div>}
          </div> }
        ]} /></div> : !runtimeLoading && <Alert type="info" showIcon message={w('currentComponentsUnavailable')} />}</Spin>
      </section>
      <section className={styles.currentEvents}><h3 className={styles.panelHeading}>{w('events')}<span className={styles.tabCount}>{events.length}</span></h3>
        {events.length ? <React.Fragment><Timeline className={styles.eventTimeline}>
          {(expandedEvents ? events : events.slice(0, 5)).map((event, index) => <Timeline.Item key={event.id || index} color="blue">
            <p>{event.comment_text || event.operation_name || event.content || event.operation_type || '—'}</p><div className={styles.muted}>{event.username || event.user_name || '—'} · {event.create_time || event.created_at || '—'}</div>
          </Timeline.Item>)}
        </Timeline>{events.length > 5 && <Button type="link" onClick={() => this.setState({ expandedEvents: !expandedEvents })}>{w(expandedEvents ? 'collapseEvents' : 'expandEvents')}</Button>}</React.Fragment> :
          <div className={styles.muted}>{runtimeLoading ? w('loadingEvents') : runtime && runtime.events_available === false ? w('eventsUnavailable') : w('noEvents')}</div>}
      </section>
    </div>;
  };
  toggleVersion = id => this.setState(state => ({ versionExpansions: { ...state.versionExpansions, [id]: !state.versionExpansions[id] } }));
  renderVersion = (item, index) => {
    const { deployments } = this.state;
    const template = item.template, records = deployments.filter(row => row.template_id === template.id);
    const expanded = !!this.state.versionExpansions[item.id];
    return <Timeline.Item key={item.id} color="blue" className={index === 0 ? styles.latestRelease : undefined}>
      <div className={styles.releaseRow}>
        <time className={styles.releaseDate} dateTime={item.submitted_at}><span>{moment(item.submitted_at).format('YYYY-MM-DD')}</span><small>{moment(item.submitted_at).format('HH:mm')}</small></time>
        <article className={styles.timelineVersion} aria-label={`${w('version')} ${template.version}`}>
          <header className={styles.selectedHeader}>
            <div><div className={styles.selectedIdentity}><h2>{template.version}</h2>{index === 0 && <span className={styles.latestLabel}>{w('latest')}</span>}{listingStatusLabel(item)}</div>
              <div className={styles.versionMeta}>{item.applicant_name}<span>·</span>{template.components.length} {w('componentUnit')}</div>
            </div>
            <div className={styles.releaseActions}>
              {item.status === 'pending' && <Button type="primary" onClick={() => this.setState({ review: item })}>{w('review')}</Button>}
              <Button icon="cloud-upload" aria-label={w('testDeploy')} onClick={() => this.setState({ deployment: item })}>{w('testDeploy')}</Button>
            </div>
          </header>
          {template.description && <p className={`${styles.releaseDescription} ${!expanded ? styles.versionSynopsis : ''}`}>{template.description}</p>}
          <EnvironmentSummary items={records} hideEmpty compact />
          <Button type="link" className={styles.releaseDetailsToggle} aria-expanded={expanded}
            aria-label={`${w(expanded ? 'collapseVersion' : 'expandVersion')} ${template.version}`} onClick={() => this.toggleVersion(item.id)}>
            {w(expanded ? 'collapseVersion' : 'expandVersion')}<Icon type={expanded ? 'up' : 'down'} />
          </Button>
          {expanded && <div className={styles.releaseDetails}><VersionDetails inlineConfiguration template={template} reviews={[item]} deployments={records} activeTab={this.state.versionTabs[item.id] || 'template'}
            onTabChange={tab => this.setState(state => ({ versionTabs: { ...state.versionTabs, [item.id]: tab } }))} /></div>}
        </article>
      </div>
    </Timeline.Item>;
  };

  render() {
    const { user, busy, dispatch, match } = this.props;
    const { group, loading, failed, review, deployment } = this.state;
    if (!user || !user.is_enterprise_admin || String(user.enterprise_id) !== String(match.params.eid)) return <Alert type="warning" message={w('forbidden')} />;
    return <PageHeaderLayout isFooter wrapperClassName={styles.modernPage} title={<span className={styles.pageTitle}>{pageheaderSvg.getPageHeaderSvg('publish', 18)}{group ? group.template_name : w('details')}</span>}
      content={w('detailWorkbenchHelp')} action={<Button onClick={() => dispatch(routerRedux.push(`/enterprise/${match.params.eid}/development-delivery`))}>{w('back')}</Button>}>
      <Spin spinning={loading}>{failed ? <Alert type="warning" message={w('loadFailed')} description={<Button onClick={this.load}>{w('retry')}</Button>} /> : !group ? !loading && <Empty description={w('notFound')} /> : <div className={styles.detailSections}>
        <Card className={styles.applicationSection}>
          {this.renderOverview()}
          {this.renderCurrentApplication()}
        </Card>
        <Card className={styles.templateSection}>
          <div className={styles.workspaceHeading}><div><h2>{w('versionTimeline')}</h2><span>{group.versions.length} {w('versionUnit')}</span></div>
            {group.pending > 0 && <Badge status="processing" text={`${group.pending} ${w('pendingReview')}`} />}
          </div>
          <Timeline className={styles.releaseTimeline}>{group.versions.map(this.renderVersion)}</Timeline>
        </Card>
      </div>}</Spin>
      {review && <ReviewModal item={review} busy={busy} onCancel={() => this.setState({ review: null })}
        onSubmit={(decision, comment) => this.act({ operation: 'review', requestId: review.id, decision, comment })} />}
      {deployment && <DeployModal testing template={deployment.template} scope={group.source} user={user} dispatch={dispatch} busy={busy}
        onCancel={() => this.setState({ deployment: null })} onSubmit={values => this.act({ operation: 'deploy', ...values, scope: group.source, template: deployment.template, listingId: deployment.id })} />}

    </PageHeaderLayout>;
  }
}
