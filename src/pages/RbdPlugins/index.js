import React, { Component } from 'react';
import { Spin, Card, Button, Icon, Select } from 'antd';
import { connect } from 'dva';
import { importAppPagePlugin } from '../../utils/importPlugins';
import { isSuccessfulPluginResponse } from '../../utils/pluginInitialization';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import RbdPluginsCom from '../../components/RBDPluginsCom'
import Global from '@/utils/global';
import PluginUtil from '../../utils/pulginUtils';
import { renderPlatformPluginIcon } from '../../utils/platformPluginIcon';
import { getPluginBaseId } from '../../utils/pluginArchUtils';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

const { Option } = Select;
const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-observability';
@connect(({ user, region }) => ({
  user: user.currentUser,
  cluster_info: region.cluster_info,
}))
export default class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      app: {},
      plugins: {},
      loading: true,
      pluginLoading: true,
      error: false,
      errInfo: '',
      showSelect: null,
      regionName: null,
    };
    this.isLoading = false; // 防止重复加载的标志
    this.pluginRequestId = 0;
    this.disposed = false;
  }

  getPluginScope = (props = this.props) => {
    const { location, match, user, isCom } = props;
    const params = match && match.params || {};
    const search = location?.search || location?.hash?.split('?')[1] || '';
    const query = new URLSearchParams(search);
    return {
      enterpriseId: params.eid || Global.getCurrEnterpriseId() || user?.enterprise_id,
      teamName: props.teamName || props.team_name || params.teamName || Global.getCurrTeamName(),
      regionName: props.regionName || props.region_name || params.regionName || params.regionID ||
        query.get('regionName') || Global.getCurrRegionName(),
      pluginId: isCom ? query.get('tab') || Global.getSlidePanelTab() : params.pluginId
    };
  };

  componentDidMount() {
    this.getPluginsList();
    const search = this.props.location?.search || this.props.location?.hash?.split('?')[1] || '';
    this.setState({ showSelect: new URLSearchParams(search).get('showSelect') });
  }

  componentWillUnmount() {
    this.disposed = true;
    this.pluginRequestId += 1;
    this.isLoading = false;
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.getPluginScope(prevProps)) !== JSON.stringify(this.getPluginScope())) {
      this.getPluginsList();
    }
    const previous = prevProps.location?.search || prevProps.location?.hash?.split('?')[1] || '';
    const current = this.props.location?.search || this.props.location?.hash?.split('?')[1] || '';
    if (previous !== current) {
      this.setState({ showSelect: new URLSearchParams(current).get('showSelect') });
    }
  }

  importPlugin = (meta, regionName, isCurrent) => {
    const type = PluginUtil.getCurrentViewPosition(window.location.href, this.props.viewPosition);
    importAppPagePlugin(meta, regionName, type === 'Platform' ? 'enterprise' : 'team').then(res => {
      if (isCurrent()) {
        this.setState({ app: res, pluginLoading: false, error: false });
      }
    }).catch(err => {
      if (isCurrent()) {
        this.setState({
          errInfo: err?.response?.data?.message || err?.message || 'An unexpected error occurred.',
          pluginLoading: false,
          error: true
        });
      }
    });
  };

  getPluginsList = () => {
    const scope = this.getPluginScope();
    const scopeKey = JSON.stringify(scope);
    if (this.disposed || this.isLoading && this.activeScopeKey === scopeKey) {
      return;
    }
    this.isLoading = true;
    this.activeScopeKey = scopeKey;
    const requestId = ++this.pluginRequestId;
    const isCurrent = () => !this.disposed && requestId === this.pluginRequestId &&
      scopeKey === JSON.stringify(this.getPluginScope());
    this.setState({ app: {}, plugins: {}, loading: true, pluginLoading: true,
      error: false, errInfo: '', regionName: scope.regionName });
    const fail = (err) => {
      if (isCurrent()) {
        this.isLoading = false;
        this.setState({ plugins: { plugin_type: 'JSInject' }, loading: false, pluginLoading: false,
          error: true, errInfo: err?.response?.data?.message || err?.message || 'Unable to load plugin.' });
      }
    };
    if (!scope.regionName) {
      fail(new Error('No region selected.'));
      return;
    }
    this.props.dispatch({
      type: 'global/getPluginList',
      payload: { enterprise_id: scope.enterpriseId, region_name: scope.regionName },
      shouldApply: isCurrent,
      callback: (res) => {
        if (!isCurrent()) return;
        this.isLoading = false;
        if (!isSuccessfulPluginResponse(res)) {
          fail(new Error(res?.msg_show || res?.msg || 'Unable to load plugin.'));
          return;
        }
        const plugin = res.list.find(item => item.name === scope.pluginId ||
          getPluginBaseId(item.name) === scope.pluginId ||
          getPluginBaseId(item.plugin_id) === scope.pluginId);
        if (!plugin) {
          this.setState({ plugins: { plugin_type: 'JSInject' }, loading: false, pluginLoading: false });
          return;
        }
        this.setState({ plugins: plugin, loading: false });
        if (plugin.plugin_type === 'JSInject') {
          this.importPlugin(plugin, scope.regionName, isCurrent);
        } else {
          this.setState({ pluginLoading: false });
        }
      },
      handleError: fail
    });
  };
  getPluginRegions = () => {
    const { location } = this.props;
    const search = location?.search || location?.hash?.split('?')[1] || window.location.search || window.location.hash?.split('?')[1] || '';
    const pluginRegions = new URLSearchParams(search).get('pluginRegions');
    return pluginRegions ? pluginRegions.split(',').filter(Boolean) : [];
  }
  getSelectableClusters = () => {
    const { cluster_info } = this.props;
    const clusters = Array.isArray(cluster_info) ? cluster_info : [];
    const pluginRegions = this.getPluginRegions();
    if (pluginRegions.length === 0) {
      return clusters;
    }
    return clusters.filter(cluster => pluginRegions.includes(cluster.region_name));
  }
  handleChange = (value) => {
    const { dispatch, location, match } = this.props;
    const pluginId = match.params.pluginId;
    const search = location?.search || location?.hash?.split('?')[1] || '';
    const params = new URLSearchParams(search);
    params.set('regionName', value);
    params.set('showSelect', 'true');
    dispatch(routerRedux.push(`/enterprise/${Global.getCurrEnterpriseId()}/plugins/${pluginId}?${params.toString()}`));
  }
  getPluginTitle = (plugin = {}) => {
    if (getPluginBaseId(plugin.name || plugin.plugin_id) === GATEWAY_MONITORING_PLUGIN_ID) {
      return formatMessage({ id: 'menu.enterprise.monitoring', defaultMessage: '监控中心' });
    }
    return plugin?.display_name;
  }
  render() {
    const { plugins, loading, regionName } = this.state;
    const { isCom = false, viewPosition } = this.props
    return (
      <>
        {!loading ? (
          isCom ?
            <RbdPluginsCom {...this.props} {...this.state} retryPlugin={this.getPluginsList} viewPosition={viewPosition} />
            :
            <PageHeaderLayout
              title={this.getPluginTitle(plugins)}
              content={plugins?.description}
              pluginSVg={renderPlatformPluginIcon(plugins, { size: 20 })}
              extraContent={
                this.state.showSelect ?
                  <>
                    <span style={{ marginRight: 6 }}>选择集群：</span>
                    <Select value={regionName} style={{ width: 120 }} onChange={this.handleChange}>
                      {
                        this.getSelectableClusters().map(item => (
                          <Option key={item.region_name} value={item.region_name}>{item.region_alias}</Option>
                        ))
                      }
                    </Select>
                  </> :
                  <>
                    {
                      Global.getCurrTeamName() &&
                      <Button onClick={() => {
                        const { dispatch } = this.props;
                        dispatch(
                          routerRedux.push({
                            pathname: `/team/${Global.getCurrTeamName()}/region/${Global.getCurrRegionName()}/index`,
                          })
                        );
                      }} type="default">
                        <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
                      </Button>
                    }
                  </>
              }
            >
              <RbdPluginsCom {...this.props} {...this.state} retryPlugin={this.getPluginsList} key={regionName} viewPosition={viewPosition} />
            </PageHeaderLayout>
        ) : (
          <div style={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        )}
      </>
    );
  }
}
