import React, { PureComponent } from 'react';
import { Badge, Empty, Table } from 'antd';
import { w } from '../../components/DeliveryWorkflow';
import styles from './asset.less';
const { sensitiveName } = require('../../utils/templateDelivery');
const { isNodeScalingDisabled } = require('../Group/components/appShareFormHelpers');
const number = (value, divisor = 1) => value == null || !Number.isFinite(Number(value)) ? '—' : Number((Number(value) / divisor).toFixed(3));

export default class VersionConfiguration extends PureComponent {
  state = { selectedId: (this.props.template.components[0] || {}).service_id };
  render() {
    const { template } = this.props;
    const component = template.components.find(item => item.service_id === this.state.selectedId) || template.components[0];
    if (!component) return <Empty description={w('noSourceComponents')} />;
    const config = template.component_overrides.find(item => item.service_id === component.service_id);
    if (!config) return <Empty description={w('versionConfigurationUnavailable')} />;
    const scale = config.extend_method_map || {}, vm = !!component.vm || config.extend_method === 'vm';
    const daemonset = isNodeScalingDisabled(config);
    const quota = (value, divisor, unit) => value == null ? '—' : Number(value) === 0 ? `0 ${unit} (${w('unlimitedQuota')})` : `${number(value, divisor)} ${unit}`;
    const facts = vm ? [[w('virtualMachineDisk'), component.vm && component.vm.boot_source_format || '—']] : [
      [w('cpuConfiguration'), quota(scale.container_cpu, 1000, w('coreUnit'))],
      [w('memoryConfiguration'), quota(scale.init_memory, 1024, 'GB')],
      ...(daemonset ? [[w('replicaPolicy'), w('nodeReplicaPolicy')]] : [
        [w('minimumInstances'), number(scale.min_node)], [w('maximumInstances'), number(scale.max_node)], [w('instanceStep'), number(scale.step_node)]])
    ];
    return <div className={styles.savedConfiguration}>
      <div className={styles.configComponents} role="group" aria-label={w('selectConfigurationComponent')}>
        {template.components.map(item => <button type="button" key={item.service_id} aria-pressed={item.service_id === component.service_id}
          className={item.service_id === component.service_id ? styles.selectedConfigComponent : undefined}
          onClick={() => this.setState({ selectedId: item.service_id })}>{item.name}</button>)}
      </div>
      <section className={styles.savedConfigPanel} aria-label={w('resourcesAndReplicaConfiguration')}>
        <header><h3>{w('resourcesAndReplicaConfiguration')}</h3><span>{component.name} · v{template.version}</span></header>
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
    </div>;
  }
}
