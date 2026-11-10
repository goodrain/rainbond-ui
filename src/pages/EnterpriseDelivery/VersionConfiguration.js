import React, { PureComponent } from 'react';
import { Badge, Button, Empty, Table, Tag, Tooltip } from 'antd';
import { w } from '../../components/DeliveryWorkflow';
import styles from './asset.less';
const { sensitiveName } = require('../../utils/templateDelivery');
const { isNodeScalingDisabled } = require('../Group/components/appShareFormHelpers');
const { versionSources, repositoryLinks } = require('../../utils/deliveryAsset');
const number = (value, divisor = 1) => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : Number((Number(value) / divisor).toFixed(3));

export default class VersionConfiguration extends PureComponent {
  state = { selectedId: (this.props.template.components[0] || {}).service_id };
  render() {
    const { template, onSource, renderChanges } = this.props;
    const component = template.components.find(item => item.service_id === this.state.selectedId) || template.components[0];
    if (!component) return <Empty description={w('noSourceComponents')} />;
    const config = template.component_overrides.find(item => item.service_id === component.service_id);
    const source = versionSources(template).find(item => item.service_id === component.service_id);
    const links = repositoryLinks(source.repository, source.provider, source.commit, source.branch);
    const scale = config && config.extend_method_map || {}, vm = !!component.vm || config && config.extend_method === 'vm';
    const daemonset = config && isNodeScalingDisabled(config);
    const quota = (value, divisor, unit) => value == null || value === '' ? '—' : Number(value) === 0 ? `0 ${unit} (${w('unlimitedQuota')})` : `${number(value, divisor)} ${unit}`;
    const facts = vm ? [[w('virtualMachineDisk'), component.vm && component.vm.boot_source_format || '—']] : [
      [w('cpuConfiguration'), quota(scale.container_cpu, 1000, w('coreUnit'))],
      [w('memoryConfiguration'), quota(scale.init_memory, 1024, 'GB')],
      ...(daemonset ? [[w('replicaPolicy'), w('nodeReplicaPolicy')]] : [
        [w('minimumInstances'), number(scale.min_node)], [w('maximumInstances'), number(scale.max_node)], [w('instanceStep'), number(scale.step_node)]])
    ];
    return <div className={styles.savedConfiguration}><div className={styles.componentDetailBlock}>
      <div className={styles.configComponents} role="group" aria-label={w('selectConfigurationComponent')}>
        {template.components.map(item => <button type="button" key={item.service_id} aria-pressed={item.service_id === component.service_id}
          className={item.service_id === component.service_id ? styles.selectedConfigComponent : undefined}
          onClick={() => this.setState({ selectedId: item.service_id })}>{item.name}</button>)}
      </div>
      <section className={styles.savedConfigPanel} aria-label={w('componentInformation')}>
        <header><h3>{component.name} <Tag>{w(source.kind === 'code' ? 'sourceCode' : source.kind === 'vm' ? 'virtualMachine' : source.kind === 'file' ? 'packageSource' : 'image')}</Tag></h3>
          {onSource && <Button type="link" size="small" onClick={() => onSource(component.service_id, template.id)}>{w('viewComponentSource')}</Button>}</header>
        <dl className={source.kind === 'code' ? styles.savedCodeFacts : styles.savedImageFacts}>
          <div><dt>{w(source.kind === 'code' ? 'repositoryAddress' : 'imageAddress')}</dt><dd>{source.kind === 'code' ? links.repository ?
            <a href={links.repository} target="_blank" rel="noopener noreferrer">{source.repository}</a> : source.repository || '—' : <Tooltip title={source.image.address}><code>{source.image.address || '—'}</code></Tooltip>}</dd></div>
          {source.kind === 'code' ? <div><dt>{w('sourceVersion')}</dt><dd>{source.branch || '—'}{source.commit && <Tooltip title={source.commit}><code className={styles.savedCommit}>@ {source.commit.slice(0, 12)}</code></Tooltip>}</dd></div> :
            <React.Fragment><div><dt>{w('imageRegistry')}</dt><dd>{source.image.address ? source.image.registry : '—'}</dd></div>
              <div><dt>{w('imageRepository')}</dt><dd>{source.image.repository || '—'}</dd></div><div><dt>{w('imageTag')}</dt><dd>{source.image.tag || '—'}</dd></div></React.Fragment>}
        </dl>
      </section>
      {config ? <React.Fragment>
      <section className={styles.savedConfigPanel} aria-label={w('resourcesAndReplicaConfiguration')}>
        <header><h3>{w('resourcesAndReplicaConfiguration')}</h3></header>
        <dl className={vm ? styles.vmFacts : styles.resourceFacts}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <section className={styles.savedConfigPanel} aria-label={w('environmentVariables')}>
        <header><h3>{w('environmentVariables')}</h3><span>{config.service_env_map_list.length} {w('variableUnit')}</span></header>
        <div className={styles.savedEnvironmentTable}><Table rowKey={(item, index) => `${item.attr_name}:${index}`} size="small" pagination={false}
          dataSource={config.service_env_map_list} columns={[
            { title: w('variableName'), dataIndex: 'attr_name', width: '36%', render: value => <code>{value}</code> },
            { title: w('templateDefaultValue'), dataIndex: 'attr_value', render: (value, env) => env.is_sensitive || env.required_on_install || sensitiveName(env.attr_name) ?
              <Badge status="default" text={w('installTimeValue')} /> : <span className={styles.preWrap}>{value == null || value === '' ? <span className={styles.muted}>{w('emptyValue')}</span> : String(value)}</span> }
          ]} locale={{ emptyText: w('noEnvironmentVariables') }} /></div>
      </section>
      </React.Fragment> : <Empty description={w('versionConfigurationUnavailable')} />}
      {renderChanges && renderChanges(component.service_id)}
    </div></div>;
  }
}
