import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Badge, Button, Empty, Icon, Input, Spin, Table, Timeline, Tooltip } from 'antd';
import moment from 'moment';
import { statusLabel, w } from '../../components/DeliveryWorkflow';
import VisitButton from '../../components/SlidePanel/components/VisterBtnWithIcon';
import globalUtil from '../../utils/global';
import styles from './asset.less';
const { getOperationRecordMessage, getOperationRecordTypeText } = require('../Component/component/Basic/operationRecordHelpers');
const metric = value => typeof value !== 'number' || !Number.isFinite(value) ? '—' : value > 0 && value < 0.01 ? '<0.01' : Number(value.toFixed(2)).toLocaleString();
const statuses = { RUNNING: 'appRunning', CLOSED: 'appStopped', STARTING: 'appStarting', STOPPING: 'appStopping', ABNORMAL: 'appAbnormal', PARTIAL_ABNORMAL: 'appAbnormal', BUILDING: 'componentBuilding' };
const runtimeStatus = value => {
  const status = String(value || '').toUpperCase();
  return <Badge status={status === 'RUNNING' ? 'success' : ['ABNORMAL', 'PARTIAL_ABNORMAL'].includes(status) ? 'error' : ['STARTING', 'STOPPING', 'BUILDING'].includes(status) ? 'processing' : 'default'} text={statuses[status] ? w(statuses[status]) : status || '—'} />;
};

@connect()
export default class RuntimeSection extends PureComponent {
  state = { selectedComponentId: '', query: '', events: {}, accesses: [] };
  alive = false;
  generation = 0;
  pending = new Set();
  visitTicket = 0;
  componentDidMount() { this.alive = true;this.ensureEvents();this.loadVisits(); }
  componentWillUnmount() { this.alive = false;this.generation += 1; }
  componentDidUpdate(previous, previousState) {
    if (previous.environment.key !== this.props.environment.key) {
      this.generation += 1;this.pending.clear();
      this.setState({ selectedComponentId: '', query: '', events: {}, accesses: [] }, () => { this.ensureEvents();this.loadVisits(); });return;
    }
    const selected = this.selected(), before = this.selected(previous, previousState);
    if (selected && (!before || before.service_id !== selected.service_id) && this.eventScroller) this.eventScroller.scrollTop = 0;
    this.ensureEvents();
    if (previous.data !== this.props.data && !this.props.loading) this.loadVisits();
    const events = selected && this.state.events[selected.service_id];
    if (selected && previous.data !== this.props.data && !this.props.loading && !(events && events.failed && events.failedPage > 1)) this.loadEvents(selected);
  }
  filtered = (props = this.props, state = this.state) => (props.data && props.data.components || [])
    .filter(item => item.name.toLowerCase().includes(state.query.trim().toLowerCase()));
  selected = (props = this.props, state = this.state) => {
    const components = this.filtered(props, state);
    return components.find(item => item.service_id === state.selectedComponentId) || components[0];
  };
  loadVisits = () => {
    const components = this.props.data && this.props.data.components || [];
    const generation = this.generation, ticket = ++this.visitTicket;
    if (!components.length) { this.setState({ accesses: [] });return; }
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'access', scope: this.props.environment.scope, components }, callback: data => {
      if (this.alive && generation === this.generation && ticket === this.visitTicket) this.setState({ accesses: data.list });
    }, onError: () => {
      if (this.alive && generation === this.generation && ticket === this.visitTicket) this.setState({ accesses: [] });
    } });
  };
  ensureEvents = () => {
    const selected = this.selected();
    if (selected && !this.state.events[selected.service_id]) this.loadEvents(selected);
  };
  loadEvents = (component, page = 1) => {
    const id = component.service_id;
    if (this.pending.has(id)) return;
    this.pending.add(id);
    const generation = this.generation;
    this.setState(state => ({ events: { ...state.events, [id]: { ...state.events[id], loading: true, failed: false } } }));
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'componentEvents', scope: this.props.environment.scope, component, page }, callback: data => {
      if (!this.alive || generation !== this.generation) return;
      this.pending.delete(id);
      this.setState(state => {
        const previous = state.events[id] || {};
        const items = Array.from(new Map([...(previous.items || []), ...data.items].map(event => [event.id, event])).values())
          .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
        const has_more = page === 1 && previous.page > 1 ? data.total != null && items.length >= data.total ? false : previous.has_more : data.has_more;
        return { events: { ...state.events, [id]: { items, page: Math.max(previous.page || 0, page), total: data.total,
          has_more, loading: false, failed: false } } };
      });
    }, onError: () => {
      if (!this.alive || generation !== this.generation) return;
      this.pending.delete(id);
      this.setState(state => ({ events: { ...state.events, [id]: { ...state.events[id], loading: false, failed: true, failedPage: page } } }));
    } });
  };
  names = scope => {
    const team = (this.props.targets || []).find(item => item.team_name === scope.teamName);
    const region = team && team.regions.find(item => item.name === scope.regionName);
    return { team: team && team.team_alias || scope.teamName, region: region && region.alias || scope.regionName };
  };
  renderMetric = (key, value, unit) => {
    const measured = typeof value === 'number' && Number.isFinite(value) && value >= 0;
    return <div key={key}><dt>{w(key)}</dt><dd><strong>{metric(measured ? value : undefined)}</strong>{measured && <span>{unit}</span>}</dd></div>;
  };
  renderEvent = event => {
    const operation = event.opt_type || event.type;
    if (!operation) return getOperationRecordMessage(event.comment_text || event.message || event.operation_name || event.content || event.operation_type || '—');
    const label = getOperationRecordTypeText(operation, globalUtil.fetchStateOptTypeText(operation));
    return <Tooltip title={globalUtil.fetchMessageLange(event.message, event.status, operation) || undefined}>
      <span>{label} {globalUtil.fetchOperation(event.final_status, event.status)} {event.status === 'failure' && globalUtil.fetchReason(event.reason)}</span>
    </Tooltip>;
  };
  render() {
    const { environment, data, loading, sourceAppName, onVersion, versions, onSource, sourceIds = [] } = this.props;
    const resources = data && data.resources || {}, current = data && data.state || {}, app = data && data.app;
    const names = this.names(environment.scope), origin = environment.origins[0];
    const name = app && app.group_name || environment.name || (environment.kind === 'source' ? sourceAppName : '—');
    const components = data && data.components;
    const filtered = this.filtered(), selected = this.selected();
    const componentEvents = selected && this.state.events[selected.service_id];
    const events = componentEvents && componentEvents.items || [];
    return <section id="asset-runtime" className={styles.assetSection} aria-labelledby="asset-runtime-title">
      <header className={styles.sectionHeader}><div><h2 id="asset-runtime-title"><span className={styles.sectionMarker}><Icon type="database" /></span><span className={styles.sectionNumber}>02</span>{w('assetRuntime')}</h2><p>{w('assetRuntimeHelp')}</p></div>
        <div className={styles.environmentToolbar}>
          <Button icon="setting" href={`#/team/${encodeURIComponent(environment.scope.teamName)}/region/${encodeURIComponent(environment.scope.regionName)}/apps/${encodeURIComponent(environment.scope.appID)}/overview`}>{w('manageApplication')}</Button>
          <VisitButton linkList={this.state.accesses} type="default" />
        </div></header>
      <Spin spinning={loading}>
        <div className={`${styles.runtimeOverview} ${styles.runtimeContext}`}><div className={styles.environmentIdentity}><div><h3>{name}</h3>{runtimeStatus(current.status || resources.status || app && app.status)}
          <div className={styles.environmentFacts}><span>{w('environmentTeam')}：{names.team}</span><span>{w('environmentRegion')}：{names.region}</span>
            {app && app.update_time && <span>{w('updatedAt')} {moment(app.update_time).format('YYYY-MM-DD HH:mm:ss')}</span>}
          </div></div>

        </div>

        <dl className={styles.resourceSummary} aria-label={w('resourceUsage')}>
          {this.renderMetric('usageCpu', current.cpu == null ? undefined : current.cpu / 1000, w('coreUnit'))}
          {this.renderMetric('usageMemory', current.memory == null ? undefined : current.memory / 1024, 'GB')}
          {this.renderMetric('usageDisk', current.disk == null ? undefined : current.disk / 1024 / 1024, 'GB')}
        </dl></div>
        {!loading && (!app || !Object.keys(current).length) && <p className={styles.runtimeHint}>{w('runtimeBriefUnavailable')}</p>}
        {origin && <div className={styles.reference}><span>{w('environmentFromVersion')} {versions.some(item => item.template.id === origin.versionId) ? <Button type="link" size="small" onClick={() => onVersion(origin.versionId)}>{origin.version || '—'}</Button> : origin.version || '—'}</span>
          <span>{w('deploymentTaskState')} {statusLabel(origin.status)}</span></div>}
        <div className={styles.runtimeWorkspace}><div className={styles.runtimeComponentPanel}>
          <div className={styles.runtimePanelHeading}><h3>{w('environmentComponents')}{components && ` (${components.length})`}</h3>
            <Input aria-label={w('searchRuntimeComponents')} placeholder={w('searchRuntimeComponents')} allowClear prefix={<Icon type="search" />}
              value={this.state.query} onChange={event => this.setState({ query: event.target.value })} /></div>
          <div className={styles.runtimeComponentScroll} tabIndex={0} role="region" aria-label={w('componentListRegion')}>
          {components ? <div className={styles.runtimeComponentTable} role="group" aria-label={w('environmentComponents')}><Table rowKey="service_id" size="small" pagination={false} dataSource={filtered}
            rowClassName={row => selected && selected.service_id === row.service_id ? styles.runtimeSelectedRow : ''}
            onRow={row => ({ onClick: () => this.setState({ selectedComponentId: row.service_id }) })}
            columns={[
              { title: w('component'), dataIndex: 'name', width: '26%', render: (value, row) => <button type="button" className={styles.runtimeComponentName}
                title={value} aria-label={value} aria-pressed={!!selected && selected.service_id === row.service_id}
                onClick={event => { event.stopPropagation();this.setState({ selectedComponentId: row.service_id }); }}>{value}</button> },
              { title: w('status'), dataIndex: 'status', width: '16%', render: runtimeStatus },
              { title: w('resourceConfigColumn'), key: 'resources', width: '25%', render: (_, row) => row.vm ? w('virtualMachine') : <div className={styles.runtimeTableResources}>
                <span>CPU {metric(row.cpu_millicores == null ? undefined : row.cpu_millicores / 1000)} {w('coreUnit')}</span>
                <span>{w('memoryShort')} {metric(row.memory_mib == null ? undefined : row.memory_mib / 1024)} GB</span></div> },
              { title: w('replicas'), dataIndex: 'replicas', width: '9%', render: metric },
              { title: w('componentUpdatedAt'), dataIndex: 'updated_at', width: '24%', render: value => value && moment(value).isValid() ?
                <time className={styles.runtimeTableTime} dateTime={value} title={moment(value).format('YYYY-MM-DD HH:mm:ss')}><span>{moment(value).format('YYYY-MM-DD')}</span><small>{moment(value).format('HH:mm:ss')}</small></time> : '—' }
            ]} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w(this.state.query ? 'noMatchingComponents' : 'noEnvironmentComponents')} /> }} /></div> :
            !loading && <p className={styles.muted}>{w('currentComponentsUnavailable')}</p>}
          </div>
          <div className={styles.runtimePanelFooter}><span>{w('matchingComponentCount', { count: filtered.length, total: (components || []).length })}</span></div>
        </div><div className={styles.runtimeEventPanel}><div className={styles.runtimePanelHeading}><div className={styles.runtimeEventHeadingCopy}>
            <span className={styles.runtimeEventEyebrow}>{w('componentOperationEvents')}</span>
            <div className={styles.runtimeSelectedTitle}><h3 title={selected && selected.name}>{selected ? selected.name : w('selectRuntimeComponent')}</h3>{selected && runtimeStatus(selected.status)}</div>
          </div>
          {selected && environment.kind === 'source' && sourceIds.includes(selected.service_id) && <Button type="link" size="small" onClick={() => onSource(selected.service_id)}>{w('viewComponentSource')}</Button>}</div>
          <div className={styles.runtimeEventScroll} ref={node => { this.eventScroller = node; }} tabIndex={0} role="region" aria-label={w('componentEventsRegion')}>
          <Spin spinning={!!componentEvents && componentEvents.loading && !events.length}>
          {events.length ? <Timeline className={styles.eventTimeline}>{events.map((event, index) => <Timeline.Item key={event.id || index} color="blue">
            <p>{this.renderEvent(event)}</p><div className={styles.muted}>{event.user_name || event.real_name || event.username || '—'} · {(event.created_at || event.create_time) ? moment(event.created_at || event.create_time).format('MM-DD HH:mm') : '—'}</div>
          </Timeline.Item>)}</Timeline> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w(!selected ? 'selectRuntimeComponent' : componentEvents && componentEvents.loading ? 'loadingComponentEvents' : componentEvents && componentEvents.failed ? 'componentEventsUnavailable' : 'noComponentOperationEvents')} />}
          </Spin></div>
          <div className={styles.runtimePanelFooter}><span>{w(componentEvents && componentEvents.total != null ? 'componentEventCount' : 'loadedComponentEvents', { count: events.length, total: componentEvents && componentEvents.total })}</span>
            {selected && componentEvents && (componentEvents.failed ? <Button size="small" onClick={() => this.loadEvents(selected, componentEvents.failedPage)}>{w('retry')}</Button> : componentEvents.has_more ?
              <Button size="small" loading={componentEvents.loading} onClick={() => this.loadEvents(selected, (componentEvents.page || 0) + 1)}>{w('loadOlderComponentEvents')}</Button> : !componentEvents.loading && events.length ? <span>{w('allComponentEventsLoaded')}</span> : null)}
          </div>
        </div></div>
      </Spin>
    </section>;
  }
}
