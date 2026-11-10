import React, { PureComponent } from 'react';
import { Avatar, Badge, Button, Collapse, Empty, Icon, Select, Table, Tabs, Tag, Timeline, Tooltip } from 'antd';
import moment from 'moment';
import { DeploymentTable, listingStatusLabel, w } from '../../components/DeliveryWorkflow';
import { ReviewHistory } from '../../components/DeliveryWorkflow/VersionDetails';
import styles from './asset.less';
import VersionConfiguration from './VersionConfiguration';
const { compareVersions, defaultComparison, orderedVersions, repositoryComparison, localMarketTemplatePath } = require('../../utils/deliveryAsset');
const quantity = value => value == null || !Number.isFinite(Number(value)) ? '—' : Number(Number(value).toFixed(3));
const fieldLabels = { componentName: 'component', repository: 'repositoryAddress', branch: 'branch', commit: 'commit', buildVersion: 'buildVersion', imageAddress: 'imageAddress',
  container_cpu: 'cpuConfiguration', init_memory: 'memoryConfiguration', min_node: 'minimumInstances', max_node: 'maximumInstances', step_node: 'instanceStep',
  port_map_list: 'portConfiguration', dep_service_map_list: 'componentDependencies', service_volume_map_list: 'volumeConfiguration', mnt_relation_list: 'sharedVolumes',
  k8s_resources: 'kubernetesResources', app_config_groups: 'applicationConfiguration', ingress_http_routes: 'routingConfiguration', plugins: 'pluginConfiguration' };
const valueText = (field, value) => {
  if (value == null) return '—';
  if (field.format === 'env') return value.install ? w('installTimeValue') : value.value === '' ? w('emptyValue') : value.value;
  if (field.format === 'cpu') return `${Number((value / 1000).toFixed(3))} ${w('coreUnit')}${value === 0 ? ` (${w('unlimitedQuota')})` : ''}`;
  if (field.format === 'memory') return `${Number((value / 1024).toFixed(3))} GB${value === 0 ? ` (${w('unlimitedQuota')})` : ''}`;
  if (field.format === 'configuration') return `${value} ${w('configurationItemUnit')}`;
  return String(value);
};

export default class VersionsSection extends PureComponent {
  state = { tabs: {}, baselines: {}, expandedNotes: {} };
  renderComparison = (item, versions) => {
    const candidates = versions.filter(row => row.template.id !== item.template.id);
    const preferred = defaultComparison(versions, item);
    const selectedId = this.state.baselines[item.template.id];
    const baseline = selectedId ? candidates.find(row => row.template.id === selectedId) : preferred;
    const comparison = compareVersions(baseline && baseline.template, item.template);
    return <div>
      <div className={styles.comparisonToolbar}><span>{w('comparisonBaseline')}</span><Select aria-label={w('comparisonBaseline')}
        value={baseline && baseline.template.id} disabled={!candidates.length} placeholder={w('selectComparisonBaseline')}
        onChange={id => this.setState(state => ({ baselines: { ...state.baselines, [item.template.id]: id } }))}>
        {candidates.map(row => <Select.Option key={row.template.id} value={row.template.id}>{row.template.version} · {w(row.status)}</Select.Option>)}
      </Select>{baseline && <span className={styles.muted}>{baseline.template.version} <Icon type="arrow-right" /> {item.template.version}</span>}</div>
      {!baseline ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w(candidates.length ? 'selectComparisonBaseline' : 'noComparisonBaseline')} /> : <React.Fragment>
        <div className={styles.changeSummary}>{['added', 'removed', 'updated', 'application'].map(type => <span key={type}><strong>{comparison.summary[type]}</strong>{w(`changes_${type}`)}</span>)}</div>
        <div className={styles.changeGroups}>{comparison.changes.length ? comparison.changes.map(row => {
          const compareURL = row.sourceBefore && repositoryComparison(row.sourceBefore, row.sourceAfter);
          return <section className={styles.changeGroup} key={row.id}>
            <header><div>{row.type === 'application' ? <strong>{w('applicationConfiguration')}</strong> :
              <Button type="link" onClick={() => this.props.onSource(row.id, row.type === 'removed' ? baseline.template.id : item.template.id)}>{row.name}</Button>}
              <Tag color={row.type === 'added' ? 'green' : row.type === 'removed' ? 'red' : 'blue'}>{w(`change_${row.type}`)}</Tag>
            </div>{compareURL && <a href={compareURL} target="_blank" rel="noopener noreferrer">{w('compareRepositoryChanges')}<Icon type="export" /></a>}</header>
            {row.fields.length ? <div className={`${styles.table} ${styles.diffTable}`}><Table rowKey="key" size="small" pagination={false} dataSource={row.fields} columns={[
              { title: w('changedField'), key: 'setting', width: '28%', render: (_, field) => <span>{field.name || w(fieldLabels[field.key] || field.key)}
                {field.format === 'configuration' && <small className={styles.muted}> · {w('configurationContentsChanged')}</small>}</span> },
              { title: <span>{w('baselineValue')} <code>{baseline.template.version}</code></span>, key: 'before', width: '36%', render: (_, field) => <span className={styles.diffBefore}>{valueText(field, field.before)}</span> },
              { title: <span>{w('currentVersionValue')} <code>{item.template.version}</code></span>, key: 'after', width: '36%', render: (_, field) => <span className={styles.diffAfter}>{valueText(field, field.after)}</span> }
            ]} /></div> : <p className={styles.changeEmpty}>{w(row.type === 'added' ? 'newComponentConfiguration' : 'removedComponentConfiguration')}</p>}
          </section>;
        }) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w('noVersionDifferences')} />}</div>
      </React.Fragment>}
      <p className={styles.muted}>{w('comparisonScopeHelp')}</p>
    </div>;
  };
  render() {
    const { group, item, deployments, onSelect, onReview, onTest, onSource, onDeploy, onViewTemplate } = this.props;
    const versions = orderedVersions(group.versions), profile = group.profile || { name: group.template_name,
      logo: versions[0] && versions[0].template.logo, description: versions[0] && versions[0].template.template_description };
    const template = item && item.template, history = template ? deployments.filter(row => row.template_id === template.id) : [];
    const templatePath = localMarketTemplatePath(group.source.enterprise_id, item, versions);
    return <section id="asset-versions" className={styles.assetSection} aria-labelledby="asset-versions-title">
      <header className={styles.sectionHeader}><div><h2 id="asset-versions-title"><span className={styles.sectionMarker}><Icon type="appstore" /></span><span className={styles.sectionNumber}>03</span>{w('assetVersions')}</h2><p>{w('assetVersionsHelp')}</p></div>
        {group.pending > 0 && <Badge status="processing" text={`${group.pending} ${w('pendingReview')}`} />}</header>
      <div className={styles.profile}><Avatar shape="square" size={44} src={profile.logo} icon="appstore" /><div className={styles.profileCopy}><h3>{profile.name}</h3><p>{profile.description || w('noTemplateIntroduction')}</p></div>
        <dl className={styles.profileStats}>{[[versions.length, 'assetVersionLabel'], [template ? template.components.length : 0, 'assetComponentLabel'], [deployments.filter(row => row.kind === 'delivery' && row.status === 'succeeded').length, 'successfulInstalls']].map(([count, key]) => <div key={key}><dd>{count}</dd><dt>{w(key)}</dt></div>)}</dl></div>
      {template ? <div className={styles.versionWorkspace}>
        <Timeline className={styles.versionTimeline} aria-label={w('versionTimeline')}>{versions.map(row => <Timeline.Item key={row.template.id}
          color={row.template.id === template.id ? 'blue' : 'gray'}>
          <button type="button" aria-pressed={row.template.id === template.id}
            className={`${styles.versionEntry} ${row.template.id === template.id ? styles.activeVersionEntry : ''}`} onClick={() => onSelect(row.template.id)}>
            <strong>v{row.template.version}</strong><time dateTime={row.template.created_at || row.submitted_at}>{moment(row.template.created_at || row.submitted_at).format('YYYY-MM-DD')}<span>{moment(row.template.created_at || row.submitted_at).format('HH:mm')}</span></time>
            <small>{w(row.status)}</small>
          </button>
        </Timeline.Item>)}</Timeline>
        <div className={styles.versionContent}>
          <header className={styles.versionHeader}><div><h3>{template.version}</h3>{listingStatusLabel(item)}
            <div className={styles.muted}>{w('submittedBy')} {item.applicant_name || template.creator_name || '—'} · {moment(item.submitted_at).format('YYYY-MM-DD HH:mm')} · {template.components.length} {w('componentUnit')}</div>
          </div><div className={styles.versionActions}>{!template.deleted_at && <React.Fragment>
            {item.status === 'pending' && <Button type="primary" onClick={() => onReview(item)}>{w('review')}</Button>}
            {item.status === 'approved' ? <React.Fragment>
              <Button type="primary" onClick={() => onDeploy(item)}>{w('deploy')}</Button>
              <Tooltip title={!templatePath ? w('localTemplateNotPublished') : undefined}><span><Button disabled={!templatePath} onClick={() => onViewTemplate(templatePath)}>{w('viewTemplate')}</Button></span></Tooltip>
            </React.Fragment> : <Button onClick={() => onTest(item)}>{w('deployTest')}</Button>}
          </React.Fragment>}</div></header>
          <div className={styles.versionNotes}>
            <div className={styles.subheading}><h3>{w('releaseNotes')}</h3>
              {template.description && (template.description.length > 180 || template.description.split('\n').length > 4) && <Button type="link" size="small"
                aria-expanded={!!this.state.expandedNotes[template.id]} onClick={() => this.setState(state => ({ expandedNotes: { ...state.expandedNotes, [template.id]: !state.expandedNotes[template.id] } }))}>
                {w(this.state.expandedNotes[template.id] ? 'collapseReleaseNotes' : 'expandReleaseNotes')}</Button>}
            </div>
            <div className={`${styles.notes} ${this.state.expandedNotes[template.id] ? styles.expandedNotes : ''}`} aria-label={w('releaseNotes')}><div className={styles.notesText}>{template.description || w('noDescription')}</div></div>
          </div>

          <Tabs activeKey={this.state.tabs[template.id] || (defaultComparison(versions, item) ? 'changes' : 'content')} animated={false}
            onChange={tab => this.setState(state => ({ tabs: { ...state.tabs, [template.id]: tab } }))}>
            <Tabs.TabPane key="content" tab={w('versionContent')}>

              <div className={styles.table}><Table rowKey="service_id" size="small" pagination={false} dataSource={template.components} columns={[
                { title: w('component'), dataIndex: 'name', render: (value, row) => <a onClick={() => onSource(row.service_id, template.id)}>{value}</a> },
                { title: w('source'), dataIndex: 'source', render: value => <span className={styles.preWrap}>{value || '—'}</span> },
                { title: w('sourceVersion'), key: 'revision', render: (_, row) => <div>{row.branch || '—'}{row.commit && <div className={styles.muted}><code title={row.commit}>{row.commit.slice(0, 12)}</code></div>}</div> },
                { title: w('configurationSummary'), key: 'configuration', render: (_, row) => {
                  const config = template.component_overrides.find(value => value.service_id === row.service_id), scale = config && config.extend_method_map;
                  return config ? <div>{config.service_env_map_list.length} {w('variableUnit')}{row.vm ? <div className={styles.muted}>{w('virtualMachine')}</div> : scale && <div className={styles.muted}>CPU {quantity(scale.container_cpu == null ? undefined : scale.container_cpu / 1000)} {w('coreUnit')} · {quantity(scale.init_memory == null ? undefined : scale.init_memory / 1024)} GB</div>}</div> : '—';
                } }
              ]} /></div>
              <Collapse bordered={false} className={styles.configuration}><Collapse.Panel key="configuration" header={w('componentConfiguration')}>
                <VersionConfiguration key={template.id} template={template} />
              </Collapse.Panel></Collapse>
            </Tabs.TabPane>
            <Tabs.TabPane key="changes" tab={w('versionComparison')}>{this.renderComparison(item, versions)}</Tabs.TabPane>
            <Tabs.TabPane key="audit" tab={w('reviewAndDelivery')}>
              <div className={styles.subheading}><h3>{w('reviewTab')}</h3></div><ReviewHistory reviews={[item]} />
              <div className={styles.subheading}><h3>{w('deploymentRecords')}</h3></div>
              {history.length ? <div className={styles.table}><DeploymentTable items={history} /></div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w('noDeliveryRecords')} />}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div> : <Empty description={w('noVersions')} />}
    </section>;
  }
}
