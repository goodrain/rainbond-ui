import React, { PureComponent } from 'react';
import { Button, Icon, Table, Tooltip } from 'antd';
import { w } from '../../../components/DeliveryWorkflow';
import { t } from './common';
import styles from './records.less';
const number = (value, divisor = 1) => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : Number((Number(value) / divisor).toFixed(3));

export default class VersionContent extends PureComponent {
  render() {
    const { template, onConfiguration } = this.props;
    const config = row => template.component_overrides.find(item => item.service_id === row.service_id);
    const vm = row => row.vm || row.source_type === 'vm';
    const sourceLabel = row => vm(row) ? w('virtualMachine') : row.source_type === 'source_code' ? w('sourceCode') : row.source_type === 'package_build' ? w('packageSource') : ['image', 'docker_run', 'docker-run', 'dockerfile'].includes(row.source_type) ? w('image') : '—';
    return <div className={styles.versionContents}>
      <div className={styles.contentsHeading}><span>{t('versionComponentCount', { count: template.components.length })}</span>
        <Button type="link" icon="setting" onClick={onConfiguration}>{w('templateConfig')}</Button></div>
      <div className={styles.componentTable}><Table rowKey="service_id" size="small" pagination={false} dataSource={template.components} columns={[
        { title: w('component'), key: 'name', width: '18%', render: (_, row) => <div className={styles.componentIdentity}>
          <Icon type={row.source_type === 'source_code' ? 'branches' : 'appstore'} /><div><strong>{row.name}</strong><small>{sourceLabel(row)}</small></div>
        </div> },
        { title: w('source'), key: 'source', width: '48%', render: (_, row) => <div className={styles.componentSourceCell}>
          <Tooltip title={row.source}><code>{row.source || '—'}</code></Tooltip>
          {(row.branch || row.commit) && <div><span>{row.branch && <React.Fragment><Icon type="branches" /> {row.branch}</React.Fragment>}</span>
            {row.commit && <Tooltip title={row.commit}><span><Icon type="code" /> <code>{row.commit.slice(0, 8)}</code></span></Tooltip>}</div>}
        </div> },
        { title: w('resourceConfigColumn'), key: 'resources', width: '16%', render: (_, row) => {
          const scale = (config(row) || {}).extend_method_map;
          return vm(row) ? <span>{w('virtualMachine')}</span> : scale ? <span className={styles.resourceValue}>{number(scale.container_cpu, 1000)} {w('coreUnit')} · {number(scale.init_memory, 1024)} GB</span> : '—';
        } },
        { title: w('configurationSummary'), key: 'configuration', width: '18%', render: (_, row) => {
          const settings = config(row);
          return settings ? <div className={styles.configurationValue}>{settings.service_env_map_list.length} {w('variableUnit')}</div> : '—';
        } }
      ]} /></div>
      <section className={styles.contentNotes}><h4>{t('description')}</h4><p>{template.description || t('noVersionDescription')}</p></section>
    </div>;
  }
}
