import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Alert, Button, Card, List, Modal, Spin, Tag } from 'antd';
import { t } from './common';

const running = task => ['queued', 'running'].includes(task.status);
const stageKeys = { queued: 'vmQueued', exporting: 'vmExporting', ready: 'vmExporting', building: 'vmBuilding',
  releasing: 'vmReleasing', success: 'vmReady', failed: 'vmFailed' };

@connect()
export default class VMPreparations extends PureComponent {
  state = { tasks: [], failed: false, busy: '', log: null, logLoading: false, logFailed: false };
  alive = false;
  generation = 0;
  completed = new Set();
  componentDidMount() { this.alive = true;this.refresh(); }
  componentWillUnmount() { this.alive = false;this.generation += 1;clearTimeout(this.timer); }
  active = generation => this.alive && generation === this.generation;
  refresh = () => {
    clearTimeout(this.timer);
    const generation = this.generation;
    const sequence = (this.sequence || 0) + 1;
    this.sequence = sequence;
    this.props.dispatch({ type: 'templateDelivery/vmPreparation', payload: { scope: this.props.scope, operation: 'list' }, callback: result => {
      if (!this.active(generation) || sequence !== this.sequence) return;
      const newlyReady = result.items.filter(task => task.status === 'succeeded' && !this.completed.has(task.id));
      newlyReady.forEach(task => this.completed.add(task.id));
      this.setState({ tasks: result.items.filter(task => !['succeeded', 'cancelled'].includes(task.status)), failed: false });
      if (newlyReady.length && this.props.onReady) this.props.onReady();
      if (result.items.some(running)) this.timer = setTimeout(this.refresh, 3000);
    }, onError: () => { if (this.active(generation) && sequence === this.sequence) this.setState({ failed: true }); } });
  };
  operate = (operation, task) => {
    if (this.state.busy) return;
    const generation = this.generation;
    this.setState({ busy: task.id });
    this.props.dispatch({ type: 'templateDelivery/vmPreparation', payload: { scope: this.props.scope, operation, taskId: task.id },
      callback: () => { if (this.active(generation)) this.setState({ busy: '' }, this.refresh); },
      onError: () => { if (this.active(generation)) this.setState({ busy: '', failed: true }); } });
  };
  cancel = task => Modal.confirm({ title: t('vmCancelTitle'), content: t('vmCancelHelp'),
    okText: t('vmCancel'), cancelText: t('continueSync'), onOk: () => this.operate('cancel', task) });
  logs = (task, component) => {
    const generation = this.generation, ticket = (this.logTicket || 0) + 1;
    this.logTicket = ticket;
    this.setState({ log: { name: component.name, lines: [] }, logLoading: true, logFailed: false });
    this.props.dispatch({ type: 'templateDelivery/synchronize', payload: { operation: 'logs', scope: this.props.scope,
      syncId: task.id, serviceId: component.service_id }, callback: result => {
      if (this.active(generation) && ticket === this.logTicket) this.setState({ log: { name: component.name, lines: result.lines || [] }, logLoading: false });
    }, onError: () => { if (this.active(generation) && ticket === this.logTicket) this.setState({ logLoading: false, logFailed: true }); } });
  };
  render() {
    const { tasks, failed, busy, log, logLoading, logFailed } = this.state;
    if (!tasks.length && !failed) return null;
    return <Card title={t('vmPreparing')}>
      {failed && <Alert type="warning" showIcon message={t('vmStatusUnavailable')}
        description={<Button onClick={this.refresh}>{t('retry')}</Button>} />}
      <List dataSource={tasks} renderItem={task => <List.Item key={task.id} extra={this.props.allowed && <React.Fragment>
        {task.status === 'failed' && <Button disabled={!!busy || failed} loading={busy === task.id} onClick={() => this.operate('retry', task)}>{t('retry')}</Button>}
        <Button disabled={!!busy || failed} onClick={() => this.cancel(task)}>{t('vmCancel')}</Button>
      </React.Fragment>}>
        <List.Item.Meta title={`${t('version')} ${task.version}`} description={<React.Fragment>
          {task.error && <Alert type="error" message={task.error} />}
          {task.components.map(component => <div key={component.service_id}>
            <Tag color={component.status === 'failed' ? 'red' : component.status === 'success' ? 'green' : 'blue'}>
              {t(stageKeys[component.status] || 'vmQueued')}</Tag>{component.name}
            {component.error && <span> · {component.error}</span>}
            <Button type="link" onClick={() => this.logs(task, component)}>{t('syncLogs')}</Button>
          </div>)}
        </React.Fragment>} />
      </List.Item>} />
      {log && <Modal visible title={log.name} footer={null} onCancel={() => { this.logTicket += 1;this.setState({ log: null }); }}>
        <Spin spinning={logLoading}>{logFailed ? <Alert type="warning" message={t('syncLogsUnavailable')} /> :
          <pre>{log.lines.join('\n') || t('syncNoLogs')}</pre>}</Spin>
      </Modal>}
    </Card>;
  }
}
