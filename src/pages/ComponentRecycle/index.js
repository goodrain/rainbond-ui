import React, { PureComponent } from 'react';
import { Alert, Button, Card, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

const text = key => formatMessage({ id: `componentRecycle.${key}` });

export class ComponentRecycle extends PureComponent {
  state = { items: [], total: 0, page: 1, loading: true, error: '', busy: '' };
  mounted = false;
  generation = 0;
  scope = () => ({ team_name: this.props.match.params.teamName, region_name: this.props.match.params.regionName });
  identity = () => JSON.stringify(this.scope());
  componentDidMount() { this.mounted = true; this.load(); }
  componentDidUpdate(previous) {
    if (previous.match.params.teamName !== this.props.match.params.teamName ||
        previous.match.params.regionName !== this.props.match.params.regionName) {
      this.generation += 1;
      this.setState({ items: [], total: 0, page: 1, busy: '', error: '' }, this.load);
    }
  }
  componentWillUnmount() { this.mounted = false; this.generation += 1; }
  load = () => {
    const identity = this.identity();
    const generation = ++this.generation;
    const active = () => this.mounted && this.identity() === identity && generation === this.generation;
    this.setState({ loading: true, error: '' });
    return this.props.dispatch({ type: 'componentRecycle/list', payload: { ...this.scope(), page: this.state.page },
      shouldApply: active, callback: result => { if (active()) this.setState({ ...result, loading: false }); },
      handleError: error => { if (active()) this.setState({ loading: false, items: [], error: error?.msg_show || text('loadFailed') }); } });
  };
  confirm = (operation, row) => {
    const identity = this.identity();
    const scope = this.scope();
    const generation = this.generation;
    const active = () => this.mounted && this.identity() === identity && generation === this.generation;
    Modal.confirm({
      title: text(operation === 'purge' ? 'purgeTitle' : 'restoreTitle'),
      content: <div><p>{row.service_cname}</p><p>{text(operation === 'purge' ? 'purgeHint' : 'restoreHint')}</p></div>,
      okText: text(operation === 'purge' ? 'purge' : 'restore'), cancelText: text('cancel'),
      okType: operation === 'purge' ? 'danger' : 'primary',
      onOk: () => {
        if (!active() || this.state.busy) return undefined;
        this.setState({ busy: row.service_id, error: '' });
        return this.props.dispatch({ type: `componentRecycle/${operation}`,
          payload: { ...scope, service_id: row.service_id }, shouldApply: active,
          callback: () => {
            if (!active()) return;
            notification.success({ message: text(operation === 'purge' ? 'purged' : 'restored') });
            this.setState({ busy: '', page: 1 }, this.load);
          }, handleError: error => { if (active()) this.setState({ busy: '', error: error?.msg_show || text('operationFailed') }); }
        });
      }
    });
  };
  render() {
    const { items, loading, busy, error, page, total } = this.state;
    return <PageHeaderLayout title={text('title')}>
      <Card extra={<Button icon="reload" loading={loading} disabled={!!busy} onClick={this.load}>{text('refresh')}</Button>}>
        <p>{text('description')}</p>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Table rowKey="service_id" dataSource={items} loading={loading} scroll={{ x: 680 }}
          locale={{ emptyText: text('empty') }} pagination={{ current: page, pageSize: 20, total,
            onChange: value => { if (!busy) this.setState({ page: value }, this.load); } }} columns={[
            { title: text('name'), dataIndex: 'service_cname' },
            { title: text('app'), dataIndex: 'app_name', render: value => value || text('appMissing') },
            { title: text('type'), dataIndex: 'extend_method', render: value => value === 'vm' ? text('vm') : text('component') },
            { title: text('time'), dataIndex: 'recycled_at', render: value => value ? new Date(value).toLocaleString() : '—' },
            { title: text('actions'), key: 'actions', render: (_, row) => <span>
              <Button type="link" disabled={!!busy || !row.can_restore} onClick={() => this.confirm('restore', row)}>{text('restore')}</Button>
              <Button type="link" disabled={!!busy || !row.can_purge} onClick={() => this.confirm('purge', row)}>{text('purge')}</Button>
            </span> }
          ]} />
      </Card>
    </PageHeaderLayout>;
  }
}

export default connect()(ComponentRecycle);
