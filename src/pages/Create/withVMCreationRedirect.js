import React, { PureComponent } from 'react';
import { Alert, Button, Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import { isVirtualMachineComponent } from '../../utils/virtualMachineComponent';

const NAME = /^[A-Za-z0-9_-]+$/;
const GROUP = /^[1-9]\d*$/;

// Resolve the actual component before mounting a legacy container wizard.
// A VM draft is preserved and opened in its existing component workspace.
export default function withVMCreationRedirect(WrappedComponent) {
  class VMCreationRedirect extends PureComponent {
    state = { status: 'loading', scopeKey: '' };
    mounted = false;
    generation = 0;

    componentDidMount() {
      this.mounted = true;
      this.loadComponent();
    }

    componentDidUpdate() {
      if (this.state.scopeKey !== this.routeContext().key) this.loadComponent();
    }

    componentWillUnmount() {
      this.mounted = false;
      this.generation += 1;
    }

    routeContext = () => {
      const params = this.props.match?.params || {};
      const team = params.teamName || globalUtil.getCurrTeamName();
      const region = params.regionName || globalUtil.getCurrRegionName();
      const alias = this.props.ServiceGetData || params.appAlias || '';
      return { team, region, alias, key: JSON.stringify([team, region, alias]) };
    };

    loadComponent = () => {
      const scope = this.routeContext();
      const generation = ++this.generation;
      this.setState({ status: 'loading', scopeKey: scope.key });
      const active = () => this.mounted && generation === this.generation &&
        scope.key === this.routeContext().key && scope.team === globalUtil.getCurrTeamName() &&
        scope.region === globalUtil.getCurrRegionName();
      const fail = () => { if (active()) this.setState({ status: 'failed' }); };
      if (![scope.team, scope.region, scope.alias].every(value => typeof value === 'string' && NAME.test(value))) {
        this.setState({ status: 'failed' });
        return;
      }
      let settled = false;
      const request = this.props.dispatch({
        type: 'appControl/fetchDetail',
        payload: { team_name: scope.team, region_name: scope.region, app_alias: scope.alias },
        shouldApply: active,
        handleError: fail,
        callback: detail => {
          if (!active()) return;
          settled = true;
          const service = detail?.service;
          if (!service || service.service_alias !== scope.alias) { fail(); return; }
          if (!isVirtualMachineComponent(detail)) {
            if (typeof service.extend_method !== 'string' || !service.extend_method) { fail(); return; }
            this.setState({ status: 'container' });
            return;
          }
          // Both identifiers come from this same backend detail, never query parameters.
          const group = String(service.group_id || '');
          if (!GROUP.test(group) || !Number.isSafeInteger(Number(group))) { fail(); return; }
          this.setState({ status: 'redirecting' });
          this.props.dispatch(routerRedux.replace({
            pathname: `/team/${scope.team}/region/${scope.region}/apps/${group}/overview`,
            query: { type: 'components', componentID: service.service_alias, tab: 'overview' }
          }));
        }
      });
      if (request && request.then) request.then(() => { if (!settled) fail(); }, fail);
    };

    render() {
      if (this.state.scopeKey === this.routeContext().key && this.state.status === 'container')
        return <WrappedComponent {...this.props} />;
      if (this.state.scopeKey === this.routeContext().key && this.state.status === 'failed') return <div>
        <Alert type="error" showIcon message={formatMessage({ id: 'notification.warn.malfunction' })} />
        <Button onClick={this.loadComponent}>{formatMessage({ id: 'button.retry' })}</Button>
      </div>;
      return <Spin />;
    }
  }

  return connect()(VMCreationRedirect);
}
