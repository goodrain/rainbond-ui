import React, { PureComponent } from 'react';
import { Checkbox, Form, Input, Select } from 'antd';
import { formatMessage } from '../../../utils/intl';
import { t } from './common';
import { normalizePlatformPluginPositionsForSelection } from '../components/appShareHelpers';
import styles from './index.less';

export const defaultPlugin = () => ({ plugin_id: '', plugin_name: '', plugin_type: 'JSInject', frontend_component: '',
  entry_path: '/static/main.js', inject_position: ['NoInject'], menu_title: '', route_path: '' });
const label = name => formatMessage({ id: `appPublish.btn.record.list.label.${name}` });

export default class PluginFields extends PureComponent {
  render() {
    const { enabled, value, onEnabledChange, onChange, components, errors, disabled } = this.props;
    const field = (name, control, required = false) => <Form.Item key={name} label={label(name)} required={required}
      htmlFor={`delivery-plugin-${name}`} validateStatus={errors[name] ? 'error' : undefined} help={errors[name]}>{control}</Form.Item>;
    const input = (name, required = false, props = {}) => field(name, <Input id={`delivery-plugin-${name}`} value={value[name]}
      disabled={disabled} onChange={event => onChange(name, event.target.value)} {...props} />, required);
    return <section className={styles.pluginSection}>
      <Checkbox checked={enabled} disabled={disabled} onChange={event => onEnabledChange(event.target.checked)}>{t('deliveryAsPlatformPlugin')}</Checkbox>
      {enabled && <div className={styles.fields}>
        {input('plugin_id', true, { placeholder: 'rainbond-my-plugin' })}{input('plugin_name', true)}
        {field('plugin_type', <Select id="delivery-plugin-plugin_type" value={value.plugin_type} disabled={disabled} onChange={type => onChange('plugin_type', type)}>
          <Select.Option value="JSInject">JSInject</Select.Option><Select.Option value="Iframe">Iframe</Select.Option></Select>, true)}
        {field('frontend_component', <Select id="delivery-plugin-frontend_component" value={value.frontend_component || undefined} disabled={disabled} allowClear onChange={name => onChange('frontend_component', name || '')}>
          {components.map(item => <Select.Option key={item.service_id} value={item.name || item.service_id}>{item.name || item.service_id}</Select.Option>)}
        </Select>)}
        {input('entry_path', true)}
        {field('inject_position', <Select id="delivery-plugin-inject_position" mode="multiple" value={value.inject_position} disabled={disabled}
          onChange={positions => onChange('inject_position', normalizePlatformPluginPositionsForSelection(positions))}>
          {['Platform', 'Team', 'Application', 'Component', 'NoInject'].map(position => <Select.Option key={position} value={position}>{t(`deliveryPosition${position}`)}</Select.Option>)}
        </Select>, true)}
        {input('menu_title')}{input('route_path', false, { addonBefore: '/plugins/', placeholder: 'my-plugin' })}
      </div>}
    </section>;
  }
}
