import React, { PureComponent } from 'react';
import { Button, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
const { deliveryUpgradePath } = require('../../utils/deliveryUpgrade');
const { deliveryTargetIsCached } = require('../../utils/deliveryNavigation');
const text = (key, values) => formatMessage({ id: `workflow.${key}` }, values);

@connect(({ user }) => ({ user: user.currentUser }))
export default class DeliveryUpgradeAction extends PureComponent {
  state = { info: null, busy: false, checking: true, failed: false };
  alive = false;
  ticket = 0;
  componentDidMount() {
    this.alive = true;
    this.load();
    this.timer = setInterval(() => { if (!document.hidden && !this.state.busy) this.load(); }, 30000);
  }
  componentDidUpdate(previous) {
    if (previous.task.id !== this.props.task.id || previous.task.status !== this.props.task.status ||
      (previous.user || {}).user_id !== (this.props.user || {}).user_id ||
      (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id) {
      this.ticket += 1;
      this.setState({ info: null, busy: false, checking: true, failed: false }, this.load);
    }
  }
  componentWillUnmount() { this.alive = false;this.ticket += 1;clearInterval(this.timer); }
  load = callback => {
    const { task, dispatch } = this.props;
    if (task.kind !== 'delivery' || task.status !== 'succeeded') return;
    const ticket = ++this.ticket;
    this.setState({ checking: true });
    dispatch({ type: 'deliveryCenter/upgrade', payload: task.id, callback: info => {
      if (!this.alive || ticket !== this.ticket) return;
      this.setState({ info, checking: false, failed: false });
      if (callback) callback(info, ticket);
    }, onError: () => {
      if (this.alive && ticket === this.ticket) this.setState({ info: null, busy: false, checking: false, failed: true });
    } });
  };
  open = () => {
    this.setState({ busy: true });
    this.load((info, ticket) => {
      const path = deliveryUpgradePath(info);
      if (!path) { this.setState({ busy: false });return; }
      const navigate = () => {
        if (this.alive && ticket === this.ticket) {
          this.setState({ busy: false });
          this.props.dispatch(routerRedux.push(path));
        }
      };
      if (deliveryTargetIsCached(this.props.user, info)) navigate();
      else this.props.dispatch({ type: 'user/fetchCurrent', payload: { team_name: info.target.team_name }, callback: response => {
        if (!this.alive || ticket !== this.ticket) return;
        if (deliveryTargetIsCached(response && response.bean, info)) navigate();
        else this.setState({ busy: false, info: null });
      }, handleError: () => {
        if (this.alive && ticket === this.ticket) this.setState({ busy: false });
      } });
    });
  };
  render() {
    const { info, busy, checking, failed } = this.state;
    if (this.props.task.kind !== 'delivery' || this.props.task.status !== 'succeeded') return null;
    const available = !!deliveryUpgradePath(info);
    const hint = available ? info.resume_record_id ? text('resumeUpgradeHint') : text('deliveryUpgradeHint', { current: info.current_version, latest: info.latest_version }) :
      text(failed ? 'upgradeUnavailable' : checking ? 'upgradeChecking' : 'noUpgradeVersion');
    return <Tooltip title={hint}><span>
      <Button type="link" size="small" disabled={!available} loading={busy || checking && !info} onClick={this.open}>{text(info && info.resume_record_id ? 'resumeUpgrade' : 'upgradeApplication')}</Button>
      </span>
    </Tooltip>;
  }
}
