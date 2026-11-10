import React, { PureComponent } from 'react';
import { connect } from 'dva';
import AppExporter from '../../EnterpriseShared/AppExporter';
import { t } from './common';
const formatKeys = { 'rainbond-app': 'rainbond_app', 'docker-compose': 'docker_compose', 'helm-chart': 'helm_chart', slug: 'slug' };

@connect()
export default class TemplateExporter extends PureComponent {
  state = { items: [], formats: this.props.template.export_formats || ['rainbond-app', 'docker-compose', 'helm-chart'], busy: false, failed: false, deleted: false };
  alive = false;
  requestKeys = {};
  componentDidMount() { this.alive = true;this.refresh(); }
  componentWillUnmount() { this.alive = false;clearTimeout(this.timer); }
  refresh = () => {
    clearTimeout(this.timer);
    this.props.dispatch({ type: 'templateDelivery/exports', payload: { scope: this.props.scope, versionId: this.props.template.id }, callback: data => {
      if (!this.alive) return;
      this.setState({ items: data.items, formats: data.formats, deleted: !!data.deleted, failed: false });
      if (data.items.some(item => ['queued', 'running'].includes(item.status))) this.timer = setTimeout(this.refresh, 3000);
    }, onError: () => { if (this.alive) this.setState({ failed: true }); } });
  };
  start = format => {
    if (this.state.busy) return;
    this.setState({ busy: true });
    const requestKey = this.requestKeys[format] || (this.requestKeys[format] = `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    this.props.dispatch({ type: 'deliveryCenter/act', payload: { operation: 'deploy', kind: 'offline', format, requestKey,
      image_handle: 'image_save', user: this.props.user, scope: this.props.scope, template: this.props.template }, callback: () => {
      if (!this.alive) return;
      delete this.requestKeys[format];this.setState({ busy: false }, this.refresh);
    }, onError: () => { if (this.alive) this.setState({ busy: false }); } });
  };
  statuses = () => this.state.formats.reduce((result, format) => {
    const task = this.state.items.find(item => (item.export_format || 'rainbond-app') === format);
    result[formatKeys[format]] = task ? { is_export_before: true,
      status: task.status === 'succeeded' ? 'success' : task.status === 'failed' ? 'failed' : 'exporting', file_path: task.download_url } : { is_export_before: false };
    return result;
  }, {});
  render() {
    const { template, scope, onCancel } = this.props;
    return <AppExporter eid={scope.enterprise_id} team_name={scope.teamName} regionName={scope.regionName}
      app={{ app_id: template.id, version: [template.version], source: 'local', versions_info: [{ version: template.version, dev_status: 'published' }] }}
      onOk={onCancel} onCancel={onCancel} loading={this.state.busy}
      deliveryExport={{ status: this.statuses(), onRefresh: this.refresh, onExport: this.start,
        busy: this.state.busy || this.state.failed, unavailable: this.state.deleted,
        error: this.state.deleted ? t('versionUnavailable') : this.state.failed ? t('exportsUnavailable') : '' }} />;
  }
}
