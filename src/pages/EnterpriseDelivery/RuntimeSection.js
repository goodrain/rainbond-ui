import React, { PureComponent } from 'react';
import { Badge, Button, Icon, Select, Spin, Table, Timeline } from 'antd';
import moment from 'moment';
import { statusLabel, w } from '../../components/DeliveryWorkflow';
import styles from './asset.less';
const metric = value => typeof value !== 'number' || !Number.isFinite(value) ? '—' : value > 0 && value < 0.01 ? '<0.01' : Number(value.toFixed(2)).toLocaleString();
const statuses = { RUNNING: 'appRunning', CLOSED: 'appStopped', STARTING: 'appStarting', STOPPING: 'appStopping', ABNORMAL: 'appAbnormal', PARTIAL_ABNORMAL: 'appAbnormal', BUILDING: 'componentBuilding' };
const runtimeStatus = value => {
  const status = String(value || '').toUpperCase();
  return <Badge status={status === 'RUNNING' ? 'success' : ['ABNORMAL', 'PARTIAL_ABNORMAL'].includes(status) ? 'error' : ['STARTING', 'STOPPING', 'BUILDING'].includes(status) ? 'processing' : 'default'} text={statuses[status] ? w(statuses[status]) : status || '—'} />;
};

export default class RuntimeSection extends PureComponent {
  state = { expandedEvents: false };
  componentDidUpdate(previous) {
    if (previous.environment.key !== this.props.environment.key) this.setState({ expandedEvents: false });
  }
  names = scope => {
    const team = (this.props.targets || []).find(item => item.team_name === scope.teamName);
    const region = team && team.regions.find(item => item.name === scope.regionName);
    return { team: team && team.team_alias || scope.teamName, region: region && region.alias || scope.regionName };
  };
  renderMetric = (key, value, unit) => {
    const measured = typeof value === 'number' && Number.isFinite(value) && value >= 0;
    return <div key={key}><dt>{w(key)}</dt><dd><strong>{metric(measured ? value : undefined)}</strong>{measured && <span>{unit}</span>}</dd></div>;
  };
  render() {
    const { environment, environments, onEnvironment, onRefresh, data, loading, sourceAppName, onVersion, versions, onSource, sourceIds } = this.props;
    const resources = data && data.resources || {}, current = data && data.state || {}, app = data && data.app;
    const names = this.names(environment.scope), origin = environment.origins[0], events = data && data.events || [];
    const name = app && app.group_name || environment.name || (environment.kind === 'source' ? sourceAppName : '—');
    const components = data && data.components;
    return <section id="asset-runtime" className={styles.assetSection} aria-labelledby="asset-runtime-title">
      <header className={styles.sectionHeader}><div><h2 id="asset-runtime-title"><span className={styles.sectionMarker}><Icon type="database" /></span><span className={styles.sectionNumber}>02</span>{w('assetRuntime')}</h2><p>{w('assetRuntimeHelp')}</p></div>
        <div className={styles.environmentToolbar}><Select aria-label={w('selectRuntimeEnvironment')} value={environment.key} onChange={onEnvironment}>
        {environments.map(item => { const label = this.names(item.scope);return <Select.Option key={item.key} value={item.key}>
          {w(item.kind === 'source' ? 'sourceEnvironment' : item.kind === 'test' ? 'testEnvironment' : 'deliveredEnvironment')} · {label.team} / {label.region}{item.origins[0] && item.origins[0].version ? ` · ${item.origins[0].version}` : ''}
        </Select.Option>; })}
      </Select><Button icon="reload" loading={loading} onClick={onRefresh}>{w('refreshRuntime')}</Button>
          {app && <Button icon="export" href={`#/team/${encodeURIComponent(environment.scope.teamName)}/region/${encodeURIComponent(environment.scope.regionName)}/apps/${encodeURIComponent(environment.scope.appID)}/overview`} target="_blank" rel="noopener noreferrer">{w('openApplication')}</Button>}
        </div></header>
      <Spin spinning={loading}>
        <div className={styles.runtimeOverview}><div className={styles.environmentIdentity}><div><h3>{name}</h3>{runtimeStatus(current.status || resources.status || app && app.status)}
          <div className={styles.environmentFacts}><span>{w('environmentTeam')}：{names.team}</span><span>{w('environmentRegion')}：{names.region}</span>
            {data && data.collected_at && <span>{w('updatedAt')} {moment(data.collected_at).format('YYYY-MM-DD HH:mm:ss')}</span>}
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
        <div className={styles.runtimeColumns}><div><div className={styles.subheading}><h3>{w('environmentComponents')}{components && ` (${components.length})`}</h3></div>
          {components ? <div className={styles.table}><Table rowKey="service_id" size="small" pagination={false} dataSource={components} columns={[
            { title: w('component'), dataIndex: 'name', render: (value, row) => environment.kind === 'source' && sourceIds.includes(row.service_id) ? <a onClick={() => onSource(row.service_id)}>{value}</a> : value },
            { title: w('status'), dataIndex: 'status', render: runtimeStatus },
            { title: w('componentResources'), key: 'resources', render: (_, row) => <span>CPU {metric(row.cpu_millicores == null ? undefined : row.cpu_millicores / 1000)} {w('coreUnit')} · {metric(row.memory_mib == null ? undefined : row.memory_mib / 1024)} GB</span> },
            { title: w('replicas'), dataIndex: 'replicas', render: metric }
          ]} locale={{ emptyText: w('noEnvironmentComponents') }} /></div> : !loading && <p className={styles.muted}>{w('currentComponentsUnavailable')}</p>}
        </div><div><div className={styles.subheading}><h3>{w('applicationEvents')}</h3><span className={styles.muted}>{events.length}</span></div>
          {events.length ? <React.Fragment><Timeline className={styles.eventTimeline}>{(this.state.expandedEvents ? events : events.slice(0, 8)).map((event, index) => <Timeline.Item key={event.id || index} color="blue">
            <p>{event.comment_text || event.operation_name || event.content || event.operation_type || '—'}</p><div className={styles.muted}>{event.username || event.user_name || '—'} · {event.create_time || event.created_at || '—'}</div>
          </Timeline.Item>)}</Timeline>{events.length > 8 && <Button type="link" onClick={() => this.setState(state => ({ expandedEvents: !state.expandedEvents }))}>{w(this.state.expandedEvents ? 'collapseEvents' : 'expandEvents')}</Button>}</React.Fragment> :
            <p className={styles.muted}>{loading ? w('loadingEvents') : data && data.events_available === false ? w('eventsUnavailable') : w('noApplicationEvents')}</p>}
        </div></div>
      </Spin>
    </section>;
  }
}
