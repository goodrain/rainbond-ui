import React, { PureComponent } from 'react';
import { Button, Icon, Spin, Table, Tag } from 'antd';
import { w } from '../../components/DeliveryWorkflow';
import styles from './asset.less';
const { compareVersions, repositoryComparison } = require('../../utils/deliveryAsset');
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


export default class VersionChanges extends PureComponent {
  render() {
    const { template, baseline, componentId, onSource, loading, baselineUnavailable, onRetry } = this.props;
    const comparison = compareVersions(baseline, template);
    const selectedChange = comparison.changes.find(row => row.id === componentId && row.type !== 'application');
    const changes = comparison.changes.filter(row => row.id === componentId || row.type === 'removed' || row.type === 'application');
    return <section className={styles.versionChanges} aria-label={w('versionChanges')}>
      <div className={styles.subheading}><h3>{w('versionChanges')}</h3>{baseline && <span className={styles.muted}>v{baseline.version} <Icon type="arrow-right" /> v{template.version}</span>}</div>
      <Spin spinning={!!loading}>
      {!baseline ? <p className={styles.muted}>{w(baselineUnavailable ? 'previousVersionUnavailable' : 'initialTemplateVersion')}</p> : <React.Fragment>
        {!selectedChange && <p className={styles.muted}>{w('noComponentVersionChanges')}</p>}
        <div className={styles.changeGroups}>{changes.map(row => {
          const compareURL = row.sourceBefore && repositoryComparison(row.sourceBefore, row.sourceAfter);
          return <section className={styles.changeGroup} key={row.id} aria-label={row.type === 'application' ? w('applicationConfiguration') : row.name}>
            <header><div>{row.type === 'application' ? <strong>{w('applicationConfiguration')}</strong> :
              row.id !== componentId && (onSource ? <Button type="link" onClick={() => onSource(row.id, baseline.id)}>{row.name}</Button> : <strong>{row.name}</strong>)}
              <Tag color={row.type === 'added' ? 'green' : row.type === 'removed' ? 'red' : 'blue'}>{w(`change_${row.type}`)}</Tag>
            </div>{compareURL && <a href={compareURL} target="_blank" rel="noopener noreferrer">{w('compareRepositoryChanges')}<Icon type="export" /></a>}</header>
            {row.fields.length ? <div className={`${styles.table} ${styles.diffTable}`}><Table rowKey="key" size="small" pagination={false} dataSource={row.fields} columns={[
              { title: w('changedField'), key: 'setting', width: '28%', render: (_, field) => <span>{field.name || w(fieldLabels[field.key] || field.key)}
                {field.format === 'configuration' && <small className={styles.muted}> · {w('configurationContentsChanged')}</small>}</span> },
              { title: <span>{w('baselineValue')} <code>{baseline.version}</code></span>, key: 'before', width: '36%', render: (_, field) => <span className={styles.diffBefore}>{valueText(field, field.before)}</span> },
              { title: <span>{w('currentVersionValue')} <code>{template.version}</code></span>, key: 'after', width: '36%', render: (_, field) => <span className={styles.diffAfter}>{valueText(field, field.after)}</span> }
            ]} /></div> : <p className={styles.changeEmpty}>{w(row.type === 'added' ? 'newComponentConfiguration' : 'removedComponentConfiguration')}</p>}
          </section>;
        })}</div>
      </React.Fragment>}
      </Spin>
      {baseline && <p className={styles.muted}>{w('comparisonScopeHelp')}</p>}
      {onRetry && <Button size="small" onClick={onRetry}>{w('retry')}</Button>}
    </section>;
  }
}
