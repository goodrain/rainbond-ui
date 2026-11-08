import React, { PureComponent } from 'react';
import { Alert, Empty, Form, Icon, Input, InputNumber, Table, Tabs, Tooltip } from 'antd';
import { t } from './common';
import styles from './index.less';
const { validateTemplateConfig, sensitiveName } = require('../../../utils/templateDelivery');
const { isNodeScalingDisabled, getNodeScalingDisabledTip } = require('../components/appShareFormHelpers');

export default class ComponentConfig extends PureComponent {
  state = { active: (this.props.components[0] || {}).service_id, errors: {} };
  componentDidUpdate() {
    if (!this.props.components.some(item => item.service_id === this.state.active)) {
      this.setState({ active: (this.props.components[0] || {}).service_id });
    }
  }
  validate = () => {
    const errors = {};
    this.props.components.forEach(item => {
      const config = this.props.configs[item.service_id];
      const found = config ? validateTemplateConfig(config) : { configuration: 'configIncomplete' };
      if (Object.keys(found).length) errors[item.service_id] = found;
    });
    this.setState({ errors, ...(Object.keys(errors).length ? { active: Object.keys(errors)[0] } : {}) }, () => {
      const target = this.root && this.root.querySelector('.has-error,.ant-alert-error');
      if (target) target.scrollIntoView({ block: 'center' });
    });
    return !Object.keys(errors).length;
  };
  change = (config, values) => {
    this.props.onChange(config.service_id, { ...config, ...values });
    this.setState(state => ({ errors: { ...state.errors, [config.service_id]: {} } }));
  };
  editEnv = (config, index, value) => this.change(config, { service_env_map_list: config.service_env_map_list.map((item, current) =>
    current === index ? { ...item, attr_value: value } : item) });
  renderConfig = config => {
    const { disabled, layout } = this.props;
    const errors = this.state.errors[config.service_id] || {};
    const component = this.props.components.find(item => item.service_id === config.service_id) || {};
    const columns = [
      { title: t('variableName'), dataIndex: 'attr_name', width: '34%', render: value => <span className={styles.preWrap}>{value}</span> },
      { title: t('variableValue'), dataIndex: 'attr_value', render: (value, item, index) => {
        const secret = item.is_sensitive || sensitiveName(item.attr_name);
        if (secret) return <span className={styles.muted}>{t('configureOnInstall')}</span>;
        return disabled ? <span className={styles.preWrap}>{value || '—'}</span> :
          <Input aria-label={item.attr_name || t('variableValue')} value={value} onChange={event => this.editEnv(config, index, event.target.value)} />;
      } }
    ];
    const scales = [
      ['min_node', 'minimumInstances', 1, 1, 0, 1], ['max_node', 'maximumInstances', 1, 1, 0, 1],
      ['step_node', 'instanceStep', 1, 1, 0, 1], ['init_memory', 'memory', 0, 0.5, undefined, 1024],
      ['container_cpu', 'cpu', 0, 0.5, undefined, 1000]
    ];
    return <div className={layout === 'editor' ? styles.configurationLayout : undefined}>
      <section className={styles.configSection}><div className={styles.sectionHeading}><h3>{t('environment')}</h3></div>
        {errors.environment && <Alert type="error" showIcon message={t(errors.environment)} />}
        <div className={styles.envTable}><Table rowKey="_key" columns={columns} dataSource={config.service_env_map_list} pagination={false} size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noEnvironment')} /> }} /></div>
      </section>
      {config.extend_method === 'vm' ? <Alert type="info" showIcon message={t('vmConfigHelp')} /> :
        <section className={styles.configSection}><h3>{t('resourcesAndScaling')}</h3><Form layout="vertical" onSubmit={event => event.preventDefault()}>
          <div className={styles.configGrid}>{scales.map(([key, label, min, step, precision, divisor]) => {
            const locked = isNodeScalingDisabled(config) && ['min_node', 'max_node', 'step_node'].includes(key);
            const control = <InputNumber aria-label={t(label)} disabled={disabled || locked} min={min} step={step} precision={precision}
              value={config.extend_method_map[key] == null ? undefined : config.extend_method_map[key] / divisor}
              onChange={value => this.change(config, { extend_method_map: { ...config.extend_method_map,
                [key]: value == null ? value : Math.round(value * divisor) } })} />;
            return <Form.Item key={key} label={t(label)} validateStatus={errors[key] ? 'error' : undefined} help={errors[key] ? t(errors[key]) : undefined}>
              {locked ? <Tooltip title={getNodeScalingDisabledTip(config, key)}><span>{control}</span></Tooltip> : control}
            </Form.Item>;
          })}</div><p className={styles.muted}>{t('zeroQuotaHelp')}</p>
        </Form></section>}
      {component.vm && <section className={styles.configSection}><h3>{t('systemDisk')}</h3><p>{component.vm.boot_source_format || 'qcow2'}</p></section>}
    </div>;
  };
  render() {
    const { components, configs, disabled, layout } = this.props;
    return <div className={`${styles.componentEditor} ${layout === 'editor' ? styles.editorComponentConfig : ''}`} ref={node => { this.root = node; }}>
      <Tabs activeKey={this.state.active} tabPosition={layout === 'editor' ? 'top' : 'left'} animated={false} onChange={active => this.setState({ active })}>
        {components.map(component => <Tabs.TabPane key={component.service_id} tab={<span>{component.name}</span>}>
          {configs[component.service_id] ? this.renderConfig(configs[component.service_id]) : this.props.loading ?
            <div className={styles.configPlaceholder} /> : <Alert type="warning" message={t('configUnavailable')} />}
        </Tabs.TabPane>)}
      </Tabs>
      {!disabled && <p className={styles.scopeNote}><Icon type="info-circle" /> {t('templateOnlyHelp')}</p>}
    </div>;
  }
}
