import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Alert, Badge, Button, Form, Input, Modal, Radio, Select, Spin, Table } from 'antd';
import moment from 'moment';
import { formatMessage } from '@/utils/intl';
import ComponentConfig from '../../pages/Group/Delivery/ComponentConfig';
import DeliveryUpgradeAction from './DeliveryUpgradeAction';
const { listingRequiresReview } = require('../../utils/deliveryWorkflow');
export const w = (key, values) => formatMessage({ id: `workflow.${key}` }, values);
export const deliveryRecordsLabel = (items, normal = 'deliveryRecordsTab') => w(items.some(item => item.kind === 'test') ?
  items.every(item => item.kind === 'test') ? 'testRecordsTab' : 'deliveryAndTestRecords' : normal);
export const statusLabel = status => <Badge status={{ pending: 'processing', approved: 'success', rejected: 'error', requested: 'processing', queued: 'processing', running: 'processing', publishing: 'processing', published: 'success', succeeded: 'success', failed: 'error' }[status] || 'default'} text={w(status)} />;

export const taskStatusLabel = row => row.kind === 'offline' ? <Badge status={row.status === 'succeeded' ? 'success' : row.status === 'failed' ? 'error' : 'processing'}
  text={w(row.status === 'succeeded' ? 'packageReady' : row.status === 'failed' ? 'packageFailed' : 'packaging')} /> : statusLabel(row.status);

export const listingStatusLabel = item => !listingRequiresReview(item) ? <span>{statusLabel(item.publication_status || 'not_started')}
  {item.publication_status === 'failed' && item.publication_task_id && <TaskRetryButton taskId={item.publication_task_id} owner={item.applicant_id} />}</span> : <span>{statusLabel(item.status)}{item.status === 'approved' &&
  <span style={{ marginLeft: 8 }}>{statusLabel(item.publication_status || 'not_started')}
    {item.publication_status === 'failed' && item.publication_task_id && <TaskRetryButton adminOnly taskId={item.publication_task_id} />}</span>}</span>;

@connect(({ user, loading }) => ({ currentUser: user.currentUser, retrying: loading.effects['deliveryCenter/retry'] }))
class TaskRetryButton extends PureComponent {
  render() {
    const { currentUser, taskId, owner, adminOnly, dispatch, retrying } = this.props;
    if (!currentUser || !(currentUser.is_enterprise_admin || !adminOnly && String(currentUser.user_id) === String(owner))) return null;
    return <Button type="link" loading={retrying} onClick={() => dispatch({ type: 'deliveryCenter/retry', payload: taskId })}>{w('retry')}</Button>;
  }
}

export class ListingModal extends PureComponent {
  state = { reason: '', error: false, destination: 'local', marketId: undefined, markets: [], marketsLoading: true, marketFailed: false };
  alive = false;
  componentDidMount() {
    this.alive = true;
    if (this.props.dispatch) this.props.dispatch({ type: 'templateDelivery/load', payload: { kind: 'markets', scope: this.props.scope },
      callback: bean => { if (this.alive) this.setState({ markets: bean.items || [], marketsLoading: false }); },
      onError: () => { if (this.alive) this.setState({ marketFailed: true, marketsLoading: false }); } });
  }
  componentWillUnmount() { this.alive = false; }
  render() {
    const { template, busy, onCancel, onSubmit } = this.props;
    const online = this.state.destination === 'market';
    const duplicate = (this.props.existingRequests || []).some(row => {
      const destination = row.destination || {type:'local'};
      return destination.type === this.state.destination && (!online || destination.market_id === this.state.marketId) &&
        ['pending','approved','not_required'].includes(row.status) && !(online && row.status === 'pending' && !row.publication_task_id);
    });
    return <Modal visible title={w('publishVersion')} onCancel={busy ? undefined : onCancel} confirmLoading={busy} closable={!busy} maskClosable={false}
      okText={w(online ? 'startMarketSync' : 'submit')} okButtonProps={{disabled:duplicate || online && (this.state.marketsLoading || this.state.marketFailed || !this.state.marketId)}} cancelText={w('cancel')} onOk={() => {
        if (duplicate) return;
        if (!online && !this.state.reason.trim() || online && !this.state.marketId) { this.setState({ error: true }); return; }
        onSubmit(online ? '' : this.state.reason.trim(), { type: this.state.destination, ...(this.state.destination === 'market' ? { market_id: this.state.marketId } : {}) });
      }}>
      <p>{template.template_name} · {template.version}</p>
      <Form layout="vertical">
        <Form.Item label={w('listingDestination')} required><Radio.Group value={this.state.destination}
          onChange={event => this.setState({ destination: event.target.value, error: false })}>
          <Radio value="local">{w('localCatalog')}</Radio><Radio value="market">{w('onlineMarket')}</Radio>
        </Radio.Group></Form.Item>
        {this.state.destination === 'market' && <Form.Item required label={w('onlineMarket')} validateStatus={this.state.error && !this.state.marketId ? 'error' : undefined}>
          <Select value={this.state.marketId} loading={this.state.marketsLoading} disabled={this.state.marketsLoading}
            placeholder={w('chooseOnlineMarket')} notFoundContent={w(this.state.marketFailed ? 'marketsUnavailable' : 'noPublishableMarkets')}
            onChange={marketId => this.setState({ marketId, error: false })}>
            {this.state.markets.map(market => <Select.Option key={market.id} value={market.id}>{market.name}</Select.Option>)}
          </Select>{this.state.marketFailed && <span>{w('marketsUnavailable')}</span>}
        </Form.Item>}
        {!online && <Form.Item label={w('reason')} required validateStatus={this.state.error ? 'error' : undefined} help={this.state.error ? w('reasonRequired') : undefined}>
        <Input.TextArea rows={4} maxLength={500} value={this.state.reason} onChange={event => this.setState({ reason: event.target.value, error: false })} />
      </Form.Item>}</Form><p>{w(duplicate ? 'alreadySubmitted' : online ? 'onlineListingHelp' : 'listingHelp')}</p>
    </Modal>;
  }
}

export class ReviewModal extends PureComponent {
  state = { comment: '', error: false };
  submit = decision => {
    if (decision === 'rejected' && !this.state.comment.trim()) { this.setState({ error: true }); return; }
    this.props.onSubmit(decision, this.state.comment.trim());
  };
  render() {
    const { item, onCancel, busy } = this.props;
    return <Modal visible title={w('reviewTitle')} onCancel={busy ? undefined : onCancel} closable={!busy} maskClosable={false}
      footer={[
        <Button key="cancel" disabled={busy} onClick={onCancel}>{w('cancel')}</Button>,
        <Button key="reject" disabled={busy} type="danger" ghost onClick={() => this.submit('rejected')}>{w('reject')}</Button>,
        <Button key="approve" loading={busy} type="primary" onClick={() => this.submit('approved')}>{w('approve')}</Button>
      ]}>
      <p>{item.template.template_name} · {item.template.version}</p><p>{w('reason')}：{item.reason}</p>
      <Form layout="vertical"><Form.Item label={w('reviewComment')} validateStatus={this.state.error ? 'error' : undefined} help={this.state.error ? w('reviewReason') : w('commentHelp')}>
        <Input.TextArea rows={4} maxLength={500} value={this.state.comment} onChange={event => this.setState({ comment: event.target.value, error: false })} />
      </Form.Item></Form>
    </Modal>;
  }
}

export class DeployModal extends PureComponent {
  state = { teams: [], loading: true, failed: false, mode: 'team', team: this.props.scope.teamName,
    region: this.props.scope.regionName, app: `${this.props.template.template_name}${this.props.testing ? '-test' : ''}`.slice(0, 64), error: false };
  alive = false;
  componentDidMount() { this.alive = true; this.load(); }
  componentWillUnmount() { this.alive = false; }
  load = () => {
    this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'targets', user: this.props.user, scope: this.props.scope }, callback: bean => {
      if (!this.alive) return;
      const teams = bean.teams.slice();
      this.setState({ teams, loading: false });
    }, onError: () => { if (this.alive) this.setState({ failed: true, loading: false }); } });
  };
  render() {
    const { testing, installation, approved, onCancel, onSubmit, busy, title } = this.props;
    const { mode, teams, team, region, app, loading, failed, error } = this.state;
    const allowed = testing || mode === 'cross' ? teams : teams.filter(item => item.team_name === this.props.scope.teamName);
    const selected = allowed.find(item => item.team_name === team);
    const regions = selected && selected.regions || [];
    return <Modal visible title={title || w(testing ? 'testDeploy' : installation ? 'install' : 'deliver')} width={560} onCancel={busy ? undefined : onCancel} maskClosable={false}
      closable={!busy} confirmLoading={busy} okText={w(mode === 'offline' ? 'requestExport' : 'submitDeployment')} cancelText={w('cancel')}
      okButtonProps={{ disabled: mode !== 'offline' && (loading || failed) }} onOk={() => {
        if (mode !== 'offline' && (!selected || !regions.some(item => item.name === region) || !app.trim())) { this.setState({ error: true }); return; }
        onSubmit({ requestKey: this.requestKey || (this.requestKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`), kind: mode === 'offline' ? 'offline' : testing ? 'test' : 'delivery',
          target: mode === 'offline' ? null : { team_name: team, team_alias: selected.team_alias, region_name: region,
            region_alias: regions.find(item => item.name === region).alias, app_name: app.trim() } });
      }}>
      <p>{this.props.template.template_name} · {this.props.template.version}</p>
      {!testing && <Radio.Group value={mode} onChange={event => this.setState({ mode: event.target.value, team: this.props.scope.teamName, region: this.props.scope.regionName, error: false })}>
        <Radio value="team">{w('teamDelivery')}</Radio><Radio value="cross" disabled={!approved}>{w('crossDelivery')}</Radio>{!installation && <Radio value="offline">{w('offlineExport')}</Radio>}
      </Radio.Group>}
      {!testing && !approved && <p style={{ marginTop: 12 }}>{w('teamOnlyHelp')}</p>}
      {mode === 'offline' ? <Alert type="info" showIcon message={w('offlineHelp')} /> : <Spin spinning={loading}>
        {failed ? <Alert type="warning" message={w('targetsUnavailable')} description={<Button onClick={this.load}>{w('retry')}</Button>} /> :
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label={w('targetTeam')} required><Select aria-label={w('targetTeam')} value={team} onChange={team => {
              this.requestKey = null;
              const next = allowed.find(item => item.team_name === team);
              this.setState({ team, region: next && next.regions[0] && next.regions[0].name, error: false });
            }}>{allowed.map(item => <Select.Option key={item.team_name} value={item.team_name}>{item.team_alias}</Select.Option>)}</Select></Form.Item>
            <Form.Item label={w('targetRegion')} required><Select aria-label={w('targetRegion')} value={region} onChange={region => { this.requestKey = null;this.setState({ region, error: false }); }}>
              {regions.map(item => <Select.Option key={item.name} value={item.name}>{item.alias}</Select.Option>)}
            </Select></Form.Item>
            <Form.Item label={w('targetApp')} required validateStatus={error ? 'error' : undefined} help={error ? w('targetRequired') : undefined}>
              <Input aria-label={w('targetApp')} maxLength={64} value={app} onChange={event => { this.requestKey = null;this.setState({ app: event.target.value, error: false }); }} />
            </Form.Item>
          </Form>}
      </Spin>}
    </Modal>;
  }
}

export class DeploymentTable extends PureComponent {
  render() {
    return <div style={{ overflowX: 'auto' }}><Table rowKey="id" size="small" pagination={false} dataSource={this.props.items} columns={[
      { title: w('operator'), dataIndex: 'user_name' },
      { title: w('operation'), dataIndex: 'kind', render: (value, row) => <span>{w(value === 'test' ? 'testDeploy' : value === 'offline' ? 'offlineExport' : 'install')}{value === 'offline' && row.export_format ? ` · ${row.export_format}` : ''}</span> },
      { title: w('environment'), key: 'target', render: (_, row) => row.target ? `${row.target.team_alias || row.target.team_name} / ${row.target.region_alias || row.target.region_name} / ${row.target.app_name}` : '—' },
      { title: w('time'), dataIndex: 'created_at', render: value => moment(value).format('YYYY-MM-DD HH:mm') },
      { title: w('status'), key: 'status', render: (_, row) => taskStatusLabel(row) },
      { title: w('actions'), key: 'download', render: (_, row) => row.download_url ? <a href={row.download_url} target="_blank" rel="noopener noreferrer">{w('download')}</a> : <span>
        {row.kind === 'delivery' && row.status === 'succeeded' ? <DeliveryUpgradeAction task={row} /> : row.error || '—'}
        {row.status === 'failed' && <TaskRetryButton taskId={row.id} owner={row.user_id} />}</span> }
    ]} /></div>;
  }
}

export class TemplateConfiguration extends PureComponent {
  render() {
    const { template } = this.props;
    const configs = {};
    template.component_overrides.forEach(config => { configs[config.service_id] = { ...config,
      service_env_map_list: config.service_env_map_list.map((env, index) => ({ ...env, _key: `saved-${index}` })) }; });
    return <ComponentConfig disabled components={template.components} configs={configs} />;
  }
}
