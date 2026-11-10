import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Checkbox, Empty, Form, Input, Modal, Spin } from 'antd';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { t, getScope, deliveryPath, canPublishTemplate } from './common';
import ComponentConfig from './ComponentConfig';
import PluginFields, { defaultPlugin } from './PluginFields';
import styles from './index.less';
const { validateVersionInfo } = require('../../../utils/templateDelivery');

const initialState = props => ({ template: null, latestVersion: null, values: {
  version: props.location && props.location.query && props.location.query.version || '1.0.0', description: '', service_ids: [] },
  components: [], configs: {}, plugin: defaultPlugin(), pluginEnabled: false,
  loading: true, loadingConfigs: false, dirty: false, failed: false, failedConfigs: [], errors: {}, failure: null });

@connect(({ user, teamControl, loading }) => ({
  user: user.currentUser, team: teamControl.currentTeam, permissions: teamControl.currentTeamPermissionsInfo,
  publishing: loading.effects['templateDelivery/publish']
}))
export default class TemplateEditor extends PureComponent {
  state = initialState(this.props);
  alive = false;
  generation = 0;
  pendingConfigs = new Set();
  componentDidMount() { this.alive = true;this.load(); }
  componentDidUpdate(previous) {
    if (JSON.stringify(previous.match.params) !== JSON.stringify(this.props.match.params) ||
      (previous.user || {}).user_id !== (this.props.user || {}).user_id ||
      (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id) {
      this.generation += 1;this.submitting = false;this.pendingConfigs.clear();this.setState(initialState(this.props), this.load);
    }
  }
  componentWillUnmount() { this.alive = false;this.generation += 1; }
  active = generation => this.alive && generation === this.generation;
  scope = () => getScope(this.props.match.params, this.props.user);
  load = () => {
    if (!this.props.user) return;
    const generation = this.generation;
    this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'templateDelivery/load', payload: { scope: this.scope() }, callback: bean => {
      if (!this.active(generation)) return;
      if (!bean.template) { this.setState({ template: null, components: bean.components, loading: false });return; }
      this.setState(state => ({ template: bean.template, latestVersion: bean.latestVersion, components: bean.components, loading: false,
        values: { ...state.values, service_ids: bean.components.filter(item => item.delivery_available !== false).map(item => item.service_id) } }), this.loadConfigs);
    }, onError: () => { if (this.active(generation)) this.setState({ loading: false, failed: true }); } });
  };
  change = (key, value) => this.setState(state => ({ dirty: true, values: { ...state.values, [key]: value },
    errors: { ...state.errors, [key]: null }, failure: null }), () => { if (key === 'service_ids') this.loadConfigs(); });
  loadConfigs = () => {
    const selected = this.state.values.service_ids;
    const pending = this.state.components.filter(item => selected.includes(item.service_id) && !this.state.configs[item.service_id] && !this.pendingConfigs.has(item.service_id));
    pending.forEach(item => this.pendingConfigs.add(item.service_id));
    const retryIds = pending.map(item => item.service_id);
    this.setState(state => ({ loadingConfigs: selected.some(id => this.pendingConfigs.has(id)),
      failedConfigs: state.failedConfigs.filter(id => selected.includes(id) && !retryIds.includes(id)) }));
    if (!pending.length) return;
    const generation = this.generation;
    pending.forEach(component => this.props.dispatch({ type: 'templateDelivery/load', payload: { kind: 'config', scope: this.scope(), component }, callback: config => {
      if (!this.active(generation)) return;
      this.pendingConfigs.delete(component.service_id);
      this.setState(state => ({ configs: { ...state.configs, [component.service_id]: config },
        loadingConfigs: state.values.service_ids.some(id => this.pendingConfigs.has(id)),
        failedConfigs: state.failedConfigs.filter(id => id !== component.service_id) }));
    }, onError: () => {
      if (!this.active(generation)) return;
      this.pendingConfigs.delete(component.service_id);
      this.setState(state => ({ loadingConfigs: state.values.service_ids.some(id => this.pendingConfigs.has(id)),
        failedConfigs: Array.from(new Set([...state.failedConfigs, component.service_id])).filter(id => state.values.service_ids.includes(id)) }));
    } }));
  };
  next = () => {
    if (this.submitting || this.props.publishing || this.state.loading || this.state.loadingConfigs || this.state.failedConfigs.length) return;
    const { values, pluginEnabled, plugin, components } = this.state;
    const errors = validateVersionInfo(values, pluginEnabled, plugin);
    if (values.service_ids.some(id => !components.some(item => item.service_id === id))) errors.service_ids = 'componentsChanged';
    if (values.service_ids.some(id => components.some(item => item.service_id === id && item.delivery_available === false))) errors.service_ids = 'componentsNeedBuild';
    if (Object.keys(errors).length) { this.setState({ errors });return; }
    if (this.configEditor && this.configEditor.validate()) this.publish();
  };
  publish = () => {
    if (this.submitting || this.props.publishing || !canPublishTemplate(this.props.user, this.props.team, this.props.permissions, this.props.match.params)) return;
    this.submitting = true;
    const generation = this.generation;
    const { values, configs, pluginEnabled, plugin } = this.state;
    const signature = JSON.stringify([values, configs, pluginEnabled, plugin]);
    if (signature !== this.creationSignature) { this.creationSignature = signature;this.requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
    this.props.dispatch({ type: 'templateDelivery/publish', payload: { scope: this.scope(), values, configs, user: this.props.user,
      requestId: this.requestId, options: { pluginEnabled, plugin } },
      callback: () => { if (this.active(generation)) this.props.dispatch(routerRedux.replace(deliveryPath(this.props.match.params))); },
      onError: key => { if (this.active(generation)) { this.submitting = false;this.setState({ failure: key.replace(/^delivery\./, '') }); } } });
  };
  leave = () => {
    if (this.props.publishing) return;
    const go = () => this.props.dispatch(routerRedux.push(deliveryPath(this.props.match.params)));
    if (!this.state.dirty) { go();return; }
    Modal.confirm({ title: t('leaveTitle'), content: t('leaveHelp'), okText: t('leave'), cancelText: t('continueEditing'), onOk: go });
  };
  renderBasic = () => {
    const { values, errors } = this.state;
    return <section className={styles.metadataSection}>
      <header className={styles.versionHeading}><h2 className={styles.formSectionTitle}>{t('versionInformation')}</h2></header>
      <div className={styles.versionComposer}>
        <div className={styles.versionSide}>
          <Form className={styles.basicForm} layout="vertical" onSubmit={event => { event.preventDefault();this.next(); }}>
            <Form.Item label={t('version')} required validateStatus={errors.version ? 'error' : undefined} help={errors.version ? t(errors.version) : this.state.latestVersion ? `${t('latestVersion')} ${this.state.latestVersion}` : undefined}>
              <Input aria-label={t('version')} maxLength={32} value={values.version} onChange={event => this.change('version', event.target.value)} placeholder="1.0.0" />
            </Form.Item>
          </Form>
        </div>
        <Form className={styles.releaseMetadata} layout="vertical" onSubmit={event => { event.preventDefault();this.next(); }}>
          <Form.Item label={t('description')} validateStatus={errors.description ? 'error' : undefined} help={errors.description ? t(errors.description) : undefined}>
            <Input.TextArea aria-label={t('description')} rows={5} autosize={{ minRows: 5, maxRows: 16 }} maxLength={20000}
              value={values.description} placeholder={t('descriptionPlaceholder')} onChange={event => this.change('description', event.target.value)} />
          </Form.Item>
          <div className={styles.notesCount}>{values.description.length} / 20000</div>
        </Form>
      </div>
    </section>;
  };
  renderAdvanced = () => {
    if (!this.props.user || !this.props.user.is_enterprise_admin) return null;
    const { values, errors, components, pluginEnabled, plugin } = this.state;
    return <Form className={styles.pluginOptions} layout="vertical" onSubmit={event => event.preventDefault()}>
      <PluginFields enabled={pluginEnabled} value={plugin} components={components.filter(item => values.service_ids.includes(item.service_id))}
        errors={Object.keys(errors).reduce((result, key) => ({ ...result, [key]: t(errors[key]) }), {})}
        onEnabledChange={pluginEnabled => this.setState({ pluginEnabled, errors: {}, dirty: true })}
        onChange={(key, value) => this.setState(state => ({ plugin: { ...state.plugin, [key]: value }, errors: {}, dirty: true }))} />
    </Form>;
  };
  renderComponentSelection = () => {
    const { values, errors, components } = this.state;
    return <section className={styles.selectionSection}>
      <div className={styles.selectionHeading}>
        <span id="delivery-component-selection" className={styles.selectionLabel}>{t('service_ids')}</span>
        <span className={styles.selectionCount} aria-label={`${t('selectedComponents')} ${values.service_ids.length} / ${components.length}`}>
          {values.service_ids.length} / {components.length}
        </span>
        <Checkbox className={styles.selectAllComponents} checked={components.some(item => item.delivery_available !== false) && components.filter(item => item.delivery_available !== false).every(item => values.service_ids.includes(item.service_id))}
          indeterminate={values.service_ids.length > 0 && !components.filter(item => item.delivery_available !== false).every(item => values.service_ids.includes(item.service_id))}
          disabled={!components.some(item => item.delivery_available !== false)} onChange={event => this.change('service_ids', event.target.checked ? components.filter(item => item.delivery_available !== false).map(item => item.service_id) : [])}>{t('selectAllComponents')}</Checkbox>
      </div>
      <Form layout="vertical" onSubmit={event => event.preventDefault()}>
      <Form.Item required validateStatus={errors.service_ids ? 'error' : undefined} help={errors.service_ids ? t(errors.service_ids) : undefined}>
        <Checkbox.Group aria-labelledby="delivery-component-selection" className={styles.componentChoices} value={values.service_ids} onChange={ids => this.change('service_ids', ids)}>
          {components.map(item => <Checkbox key={item.service_id} value={item.service_id} disabled={item.delivery_available === false} className={values.service_ids.includes(item.service_id) ? styles.componentChoiceSelected : undefined}>
            <span className={styles.componentChoiceBody}><span className={styles.componentChoiceName} title={item.name}>{item.name}</span><span className={styles.componentSource}>{item.delivery_available === false ? t('componentNeedsBuild') : item.source_type === 'source_code' ? t('sourceCode') : t('sourceImage')}</span></span>
          </Checkbox>)}
        </Checkbox.Group>
      </Form.Item>
      </Form>
    </section>;
  };
  render() {
    const { template, loading, failed, components, configs, values, failedConfigs, loadingConfigs, failure } = this.state;
    const { user, team, permissions, match, publishing } = this.props;
    const allowed = canPublishTemplate(user, team, permissions, match.params);
    return <PageHeaderLayout isFooter wrapperClassName={styles.page} title={<span className={styles.pageTitle}><Button type="link" icon="arrow-left" disabled={publishing} onClick={this.leave} aria-label={t('backToRecords')} />{t('createVersion')}</span>}
      action={template && <div className={styles.templateContext}><span className={styles.contextLabel}>{t('belongsToTemplate')}</span><strong title={template.name}>{template.name}</strong></div>}>
      {!allowed ? <Alert type="warning" showIcon message={t('permissionRequired')} /> : <Spin spinning={loading}>
        {failed ? <Alert type="warning" showIcon message={t('componentsUnavailable')} description={<Button onClick={this.load}>{t('retry')}</Button>} /> :
          !loading && !template ? <Empty description={t('templateContextUnavailable')}><Button onClick={this.load}>{t('retry')}</Button></Empty> :
          !loading && !components.length ? <Empty description={t('noComponents')} /> : <div className={styles.editorLayout}>
            <div ref={node => { this.editorRoot = node; }}>
            <div className={styles.editorForm}>
              <React.Fragment>
                <div className={styles.editorIntro}>{this.renderBasic()}</div>
                <section className={styles.configurationSection}>
                {this.renderComponentSelection()}
                <div className={styles.sectionBody}>
                <Spin spinning={loadingConfigs}>
                {!!failedConfigs.length && <Alert type="warning" showIcon message={t('configUnavailable')} description={<Button onClick={this.loadConfigs}>{t('retry')}</Button>} />}
                {values.service_ids.length ? <ComponentConfig layout="editor" ref={ref => { this.configEditor = ref; }} loading={loadingConfigs}
                  components={components.filter(item => values.service_ids.includes(item.service_id))} configs={configs}
                  onChange={(id, config) => this.setState(state => ({ configs: { ...state.configs, [id]: config }, dirty: true }))} /> :
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('componentsRequired')} />}
                </Spin></div>
                {this.renderAdvanced()}
                </section>
              </React.Fragment>
              {failure && <Alert className={styles.failure} type="error" showIcon message={t(failure)} />}
              <div className={styles.editorActions}>
                <span className={styles.editorActionSummary}>{values.version || '—'} · {t('selectedComponentCount', { count: values.service_ids.length })}</span>
                <div><Button disabled={publishing} onClick={this.leave}>{t('cancel')}</Button>
                <Button type="primary" loading={publishing} disabled={loading || !components.length || loadingConfigs || !!failedConfigs.length} onClick={this.next}>{t('createVersion')}</Button></div>
              </div>
            </div>
            </div>
          </div>}
      </Spin>}
    </PageHeaderLayout>;
  }
}
