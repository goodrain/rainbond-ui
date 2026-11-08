import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Checkbox, Empty, Form, Input, Modal, Spin } from 'antd';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../../utils/pageHeaderSvg';
import { t, getScope, deliveryPath, canPublishTemplate } from './common';
import ComponentConfig from './ComponentConfig';
import TemplateSync from './Sync';
import PluginFields, { defaultPlugin } from './PluginFields';
import styles from './index.less';
const { validateTemplateInfo } = require('../../../utils/templateDelivery');

const initialState = props => ({ syncJob: null, startingSync: false, values: { template_name: props.location && props.location.query && props.location.query.template_name || '',
  version: props.location && props.location.query && props.location.query.version || '1.0.0', description: '', service_ids: [] },
  components: [], configs: {}, plugin: defaultPlugin(), pluginEnabled: false, loading: true, loadingConfigs: false, configDirty: false, failed: false, failedConfigs: [], errors: {}, failure: null });

@connect(({ user, teamControl, loading }) => ({
  user: user.currentUser, team: teamControl.currentTeam, permissions: teamControl.currentTeamPermissionsInfo,
  publishing: loading.effects['templateDelivery/publish']
}))
export default class TemplateEditor extends PureComponent {
  state = initialState(this.props);
  alive = false;
  generation = 0;
  pendingConfigs = new Set();
  componentDidMount() { this.alive = true; this.load(); }
  componentDidUpdate(previous) {
    if (JSON.stringify(previous.match.params) !== JSON.stringify(this.props.match.params) ||
      (previous.user || {}).user_id !== (this.props.user || {}).user_id ||
      (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id) {
      this.generation += 1; this.starting = false; this.submitting = false; this.pendingConfigs.clear(); this.setState(initialState(this.props), this.load);
    }
  }
  componentWillUnmount() { this.alive = false; this.generation += 1; }
  active = generation => this.alive && generation === this.generation;
  scope = () => getScope(this.props.match.params, this.props.user);
  load = () => {
    if (!this.props.user) return;
    const generation = this.generation;
    const syncId = this.props.location.query && this.props.location.query.sync_id;
    if (syncId) {
      this.setState({ loading: true, failed: false });
      this.props.dispatch({ type: 'templateDelivery/synchronize', payload: { operation: 'status', scope: this.scope(), syncId }, callback: syncJob => {
        if (!this.active(generation)) return;
        if (syncJob.version_id || syncJob.status === 'cancelled') this.props.dispatch(routerRedux.replace(deliveryPath(this.props.match.params)));
        else this.setState({ syncJob, loading: false });
      }, onError: () => { if (this.active(generation)) this.setState({ loading: false, failed: true }); } });
      return;
    }
    this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'templateDelivery/load', payload: { scope: this.scope() }, callback: bean => {
      if (this.active(generation)) {
        this.setState({ components: bean.components, loading: false,
          values: { ...this.state.values, service_ids: bean.components.map(item => item.service_id) } }, () => {
          this.loadConfigs();
        });
      }
    }, onError: () => { if (this.active(generation)) this.setState({ loading: false, failed: true }); } });
  };
  change = (key, value) => this.setState(state => ({ values: { ...state.values, [key]: value }, errors: { ...state.errors, [key]: null }, failure: null }),
    () => { if (key === 'service_ids') this.loadConfigs(); });
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
    if (this.starting || this.state.syncJob || this.state.loading || this.state.loadingConfigs || this.state.failedConfigs.length) return;
    const { values, pluginEnabled, plugin, components } = this.state;
    const errors = validateTemplateInfo(values, pluginEnabled, plugin);
    if (values.service_ids.some(id => !components.some(item => item.service_id === id))) errors.service_ids = 'componentsChanged';
    if (Object.keys(errors).length) {
      this.setState({ errors }, () => {
        const target = this.editorRoot && this.editorRoot.querySelector('.has-error');
        if (target) target.scrollIntoView({ block: 'center' });
      });
      return;
    }
    if (this.configEditor && this.configEditor.validate()) this.startSync();
  };
  startSync = () => {
    if (this.starting || !canPublishTemplate(this.props.user, this.props.team, this.props.permissions, this.props.match.params)) return;
    this.starting = true;
    const generation = this.generation;
    const { values, configs, components, plugin, pluginEnabled } = this.state;
    const signature = JSON.stringify([values, configs, plugin, pluginEnabled]);
    if (signature !== this.syncSignature) { this.syncRequestId = null; this.syncSignature = signature; }
    this.setState({ startingSync: true, errors: {}, failure: null });
    this.props.dispatch({ type: 'templateDelivery/synchronize', payload: { operation: 'start', scope: this.scope(), values, configs, components, user: this.props.user,
      options: { destination: 'local', plugin, pluginEnabled }, requestId: this.syncRequestId || (this.syncRequestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`) }, callback: syncJob => {
      if (!this.active(generation)) return;
      this.starting = false;
      this.setState({ syncJob, startingSync: false });
      this.props.dispatch(routerRedux.replace({ pathname: this.props.location.pathname,
        query: { ...this.props.location.query, sync_id: syncJob.id } }));
    }, onError: failure => {
      if (!this.active(generation)) return;
      this.starting = false;
      this.setState({ startingSync: false, failure });
    } });
  };
  publish = () => {
    const { values, configs, components, plugin, pluginEnabled, syncJob } = this.state;
    if (this.submitting || !syncJob || syncJob.status !== 'success' || this.props.publishing || !canPublishTemplate(this.props.user, this.props.team, this.props.permissions, this.props.match.params)) return;
    this.submitting = true;
    const generation = this.generation;
    this.props.dispatch({ type: 'templateDelivery/publish', payload: { scope: this.scope(), values, configs, components, user: this.props.user,
      options: { destination: 'local', plugin, pluginEnabled, sync_id: syncJob.id } },
      callback: () => { if (this.active(generation)) this.props.dispatch(routerRedux.replace(deliveryPath(this.props.match.params))); },
      onError: key => { if (this.active(generation)) { this.submitting = false; this.setState({ failure: key.replace(/^delivery\./, '') }); } }
    });
  };
  leave = () => {
    if (this.props.publishing || this.starting) return;
    const go = () => this.props.dispatch(routerRedux.push(deliveryPath(this.props.match.params)));
    const { values, components, pluginEnabled, configDirty } = this.state;
    const dirty = values.template_name || values.description || values.version !== '1.0.0' || pluginEnabled || configDirty || values.service_ids.length !== components.length;
    if (!dirty) { go(); return; }
    Modal.confirm({ title: t('leaveTitle'), content: t('leaveHelp'), okText: t('leave'), cancelText: t('continueEditing'), onOk: go });
  };
  renderBasic = () => {
    const { values, errors, components, pluginEnabled, plugin } = this.state;
    const field = (key, control, required = false) => <Form.Item label={t(key)} required={required} validateStatus={errors[key] ? 'error' : undefined} help={errors[key] ? t(errors[key]) : undefined}>{control}</Form.Item>;
    return <Form className={styles.basicForm} layout="vertical" onSubmit={event => { event.preventDefault(); this.next(); }}>
      <section className={styles.metadataSection}>
        <h3 className={styles.formSectionTitle}>{t('templateInformation')}</h3>
        <div className={styles.sectionBody}>
      <div className={styles.metadataGrid}>
        {field('template_name', <Input aria-label={t('templateName')} maxLength={64} value={values.template_name} onChange={event => this.change('template_name', event.target.value)} placeholder={t('namePlaceholder')} />, true)}
        {field('version', <Input aria-label={t('version')} maxLength={32} value={values.version} onChange={event => this.change('version', event.target.value)} placeholder="1.0.0" />, true)}
        {field('description', <Input.TextArea aria-label={t('description')} rows={1} autosize={{ minRows: 1, maxRows: 3 }} maxLength={255} value={values.description} onChange={event => this.change('description', event.target.value)} placeholder={t('descriptionPlaceholder')} />)}
      </div>
      <PluginFields enabled={pluginEnabled} value={plugin} components={components.filter(item => values.service_ids.includes(item.service_id))}
        errors={Object.keys(errors).reduce((result, key) => ({ ...result, [key]: t(errors[key]) }), {})}
        onEnabledChange={pluginEnabled => this.setState({ pluginEnabled, errors: {} })}
        onChange={(key, value) => this.setState(state => ({ plugin: { ...state.plugin, [key]: value }, errors: { ...state.errors, [key]: null } }))} />
        </div>
      </section>
    </Form>;
  };
  renderComponentSelection = () => {
    const { values, errors, components } = this.state;
    return <section className={styles.selectionSection}>
      <div className={styles.selectionHeading}>
        <h3 id="delivery-component-selection" className={styles.formSectionTitle}>{t('service_ids')}</h3>
        <span className={styles.selectionCount} aria-label={`${t('selectedComponents')} ${values.service_ids.length} / ${components.length}`}>
          {values.service_ids.length} / {components.length}
        </span>
      </div>
      <Form layout="vertical" onSubmit={event => event.preventDefault()}>
      <Form.Item required validateStatus={errors.service_ids ? 'error' : undefined} help={errors.service_ids ? t(errors.service_ids) : undefined}>
        <Checkbox.Group aria-labelledby="delivery-component-selection" className={styles.componentChoices} value={values.service_ids} onChange={ids => this.change('service_ids', ids)}>
          {components.map(item => <Checkbox key={item.service_id} value={item.service_id} className={values.service_ids.includes(item.service_id) ? styles.componentChoiceSelected : undefined}>
            <span>{item.name}</span><span className={styles.componentSource}>{item.source_type === 'source_code' ? t('sourceCode') : t('sourceImage')}</span>
          </Checkbox>)}
        </Checkbox.Group>
      </Form.Item>
      </Form>
    </section>;
  };
  render() {
    const { syncJob, startingSync, loading, failed, components, configs, values, failedConfigs, loadingConfigs, failure } = this.state;
    const { user, team, permissions, match, publishing } = this.props;
    const allowed = canPublishTemplate(user, team, permissions, match.params);
    if (syncJob) return <PageHeaderLayout isFooter wrapperClassName={`${styles.page} ${styles.syncPage}`}>
      <TemplateSync job={syncJob} scope={this.scope()} user={user} dispatch={this.props.dispatch} publishing={publishing}
        failure={failure} onChange={job => this.setState({ syncJob: job })} onPublish={this.publish}
        onCancel={() => {
          this.syncRequestId = null;
          const query = { ...this.props.location.query };delete query.sync_id;
          this.props.dispatch(routerRedux.replace({ pathname: this.props.location.pathname, query }));
          this.setState({ syncJob: null, failure: null }, () => { if (!this.state.components.length) this.load(); });
        }} />
    </PageHeaderLayout>;
    return <PageHeaderLayout isFooter wrapperClassName={styles.page} title={<span className={styles.pageTitle}>{pageheaderSvg.getPageHeaderSvg('publish', 18)}{t('createTemplate')}</span>} content={t('editorHelp')}
      action={<Button disabled={publishing || startingSync} onClick={this.leave}>{t('backToRecords')}</Button>}>
      {!allowed ? <Alert type="warning" showIcon message={t('permissionRequired')} /> : <Spin spinning={loading}>
        {failed ? <Alert type="warning" showIcon message={t('componentsUnavailable')} description={<Button onClick={this.load}>{t('retry')}</Button>} /> :
          !loading && !components.length ? <Empty description={t('noComponents')} /> : <div className={styles.editorLayout}>
            <div ref={node => { this.editorRoot = node; }}>
            <div className={styles.editorForm}>
              <React.Fragment>
                <div className={styles.editorIntro}>{this.renderBasic()}{this.renderComponentSelection()}</div>
                <section className={styles.configurationSection}><h3 className={styles.formSectionTitle}>{t('componentConfig')}</h3>
                <div className={styles.sectionBody}>
                <Spin spinning={loadingConfigs}>
                {!!failedConfigs.length && <Alert type="warning" showIcon message={t('configUnavailable')} description={<Button onClick={this.loadConfigs}>{t('retry')}</Button>} />}
                {values.service_ids.length ? <ComponentConfig layout="editor" ref={ref => { this.configEditor = ref; }} loading={loadingConfigs}
                  components={components.filter(item => values.service_ids.includes(item.service_id))} configs={configs}
                  onChange={(id, config) => this.setState(state => ({ configs: { ...state.configs, [id]: config }, configDirty: true }))} /> :
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('componentsRequired')} />}
                </Spin></div></section>
              </React.Fragment>
              {failure && <Alert className={styles.failure} type="error" showIcon message={t(failure)} />}
              <div className={styles.footer}>
                <Button type="primary" loading={startingSync} disabled={loading || !components.length || loadingConfigs || !!failedConfigs.length} onClick={this.next}>{t('next')}</Button>
              </div>
            </div>
            </div>
          </div>}
      </Spin>}
    </PageHeaderLayout>;
  }
}
