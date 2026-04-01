import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Modal, Card, notification, Button, Alert, Spin, Tag } from 'antd';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import jsYaml from 'js-yaml';
import styles from './index.less';
import { getHelmChartUrlValidation, getHelmChartUrlValidationMessage } from './helmChartUrl';
import { getPreferredHelmValuesFileKey } from './helmValues';
import { getWorkloadKindOptions, getResourceStatusMeta } from './utils';
import {
  DEFAULT_TAB,
  HELM_WIZARD_STEPS,
  getTabMetaMap,
  TAB_ORDER,
  TAB_RESOURCE_MAP,
} from './constants';
import {
  compareHelmVersions,
  getDistinctCount,
  getStatusSummary,
} from './helpers';
import ResourceEmptyState from './components/ResourceEmptyState';
import ResourceHero from './components/ResourceHero';
import ResourceContentHeader from './components/ResourceContentHeader';
import YamlModalHeader from './components/YamlModalHeader';
import HelmModals from './components/HelmModals';
import WorkloadTab from './tabs/WorkloadTab';
import PodTab from './tabs/PodTab';
import NetworkTab from './tabs/NetworkTab';
import ConfigTab from './tabs/ConfigTab';
import StorageTab from './tabs/StorageTab';
import HelmTab from './tabs/HelmTab';

@connect(({ teamResources, enterprise, loading }) => ({
  resources: teamResources.resources,
  helmReleases: teamResources.helmReleases,
  helmPreview: teamResources.helmPreview,
  helmReleaseHistory: teamResources.helmReleaseHistory,
  total: teamResources.total,
  currentEnterprise: enterprise.currentEnterprise,
  resourceListLoading: loading.effects['teamResources/fetchResources'],
  configListLoading: loading.effects['teamResources/fetchConfigResources'],
  helmListLoading: loading.effects['teamResources/fetchHelmReleases'],
  resourceYamlLoading: loading.effects['teamResources/fetchResource'],
  createResourceLoading: loading.effects['teamResources/createResource'],
  updateResourceLoading: loading.effects['teamResources/updateResource'],
  deleteResourceLoading: loading.effects['teamResources/deleteResource'],
  uninstallReleaseLoading: loading.effects['teamResources/uninstallRelease'],
}))
class ResourceCenter extends PureComponent {
  contentCardRef = React.createRef();
  helmPreviewRequestId = 0;

  getNextHelmPreviewRequestId = () => {
    this.helmPreviewRequestId += 1;
    return this.helmPreviewRequestId;
  };

  invalidateHelmPreviewRequests = () => {
    this.helmPreviewRequestId += 1;
  };

  isLatestHelmPreviewRequest = requestId => requestId === this.helmPreviewRequestId;

  state = {
    activeTab: DEFAULT_TAB,
    workloadKind: 'deployments',
    workloadKindGroup: 'apps',
    yamlModalVisible: false,
    yamlModalMode: 'create',
    yamlModalStep: 'editor',
    yamlContent: '',
    yamlTargetName: '',
    yamlTargetParams: null,
    yamlResult: null,
    yamlResultLoading: false,
    openingYamlName: '',
    deletingResourceName: '',
    uninstallingReleaseName: '',
    searchText: '',
    // Helm 应用商店弹窗状态
    helmModalVisible: false,
    helmModalMode: 'install',
    helmTargetRelease: null,
    helmSourceType: 'store',
    helmStep: 'source',         // 'source' | 'basic' | 'values'
    helmInstallLoading: false,
    helmRepos: [],
    helmRepoLoading: false,
    helmCurrentRepo: '',
    helmAllCharts: [],           // 当前仓库完整 chart 列表（客户端过滤用）
    helmCharts: [],              // 过滤+分页后展示的 chart 列表
    helmChartLoading: false,
    helmChartSearch: '',
    helmChartPage: 1,
    helmChartPageSize: 8,
    helmChartTotal: 0,
    helmSelectedChart: null,     // 用户点选的 chart
    helmForm: { version: '', release_name: '', values: '' },
    helmPreviewLoading: false,
    helmPreviewData: null,
    helmPreviewFileKey: '',
    helmPreviewStatus: 'idle',
    helmPreviewError: '',
    helmConfigVisible: false,
    helmValuesEditorVisible: false,
    helmValuesEditorSourceType: 'store',
    helmExternalForm: {
      chart_protocol: 'https://',
      chart_address: '',
      auth_type: 'none',
      release_name: '',
      values: '',
      username: '',
      password: '',
    },
    helmUploadRecord: {},
    helmUploadEventId: '',
    helmUploadFileList: [],
    helmUploadExistFiles: [],
    helmUploadChartInfo: null,
    helmUploadLoading: false,
    helmUploadForm: {
      version: '',
      release_name: '',
      values: '',
    },
    helmDetailVisible: false,
    helmDetailRelease: null,
    helmAutoUpgradeLoading: false,
    helmAutoUpgradeInfo: null,
    helmAutoUpgradeError: '',
    helmHistoryVisible: false,
    helmHistoryLoading: false,
    helmHistoryRelease: null,
    helmHistoryList: [],
    helmRollbackLoading: false,
  };

  componentDidMount() {
    const initialViewState = this.getInitialViewState();
    const { openHelmInstall, openCreateResource, ...initialState } = initialViewState;
    this.setState(initialState, () => {
      this.fetchTabData(
        initialState.activeTab,
        initialState.activeTab === 'workload'
          ? {
            resource: initialState.workloadKind,
            group: initialState.workloadKindGroup,
          }
          : {}
      );
      if (openHelmInstall) {
        this.openHelmInstallFromQuery();
      } else if (openCreateResource) {
        this.openCreateResourceFromQuery();
      }
    });
  }

  componentDidUpdate(prevProps) {
    const prevQuery = this.getLocationQuery(prevProps.location);
    const nextQuery = this.getLocationQuery();
    const prevOpenHelmInstall = this.shouldOpenHelmInstall(prevQuery.openHelmInstall);
    const nextOpenHelmInstall = this.shouldOpenHelmInstall(nextQuery.openHelmInstall);
    const prevOpenCreateResource = this.shouldOpenCreateResource(prevQuery.openCreateResource);
    const nextOpenCreateResource = this.shouldOpenCreateResource(nextQuery.openCreateResource);

    if (
      prevQuery.tab !== nextQuery.tab ||
      prevQuery.workloadKind !== nextQuery.workloadKind
    ) {
      const nextViewState = this.getInitialViewState();
      const { openHelmInstall, openCreateResource, ...nextState } = nextViewState;
      this.setState({
        activeTab: nextState.activeTab,
        workloadKind: nextState.workloadKind,
        workloadKindGroup: nextState.workloadKindGroup,
        searchText: ''
      }, () => {
        this.fetchTabData(
          nextState.activeTab,
          nextState.activeTab === 'workload'
            ? {
              resource: nextState.workloadKind,
              group: nextState.workloadKindGroup,
            }
            : {}
        );
        if (openHelmInstall) {
          this.openHelmInstallFromQuery();
        } else if (openCreateResource) {
          this.openCreateResourceFromQuery();
        }
      });
      return;
    }

    if (!prevOpenHelmInstall && nextOpenHelmInstall) {
      this.openHelmInstallFromQuery();
      return;
    }

    if (!prevOpenCreateResource && nextOpenCreateResource) {
      this.openCreateResourceFromQuery();
    }

    const nextState = {};
    if (prevProps.resourceYamlLoading && !this.props.resourceYamlLoading && this.state.openingYamlName) {
      nextState.openingYamlName = '';
    }
    if (prevProps.deleteResourceLoading && !this.props.deleteResourceLoading && this.state.deletingResourceName) {
      nextState.deletingResourceName = '';
    }
    if (prevProps.uninstallReleaseLoading && !this.props.uninstallReleaseLoading && this.state.uninstallingReleaseName) {
      nextState.uninstallingReleaseName = '';
    }
    if (Object.keys(nextState).length > 0) {
      this.setState(nextState);
    }
  }

  componentWillUnmount() {
  }

  getParams() {
    const { match } = this.props;
    return (match && match.params) || {};
  }

  getLocationQuery(locationArg = this.props.location) {
    const location = locationArg || {};
    const query = (location && location.query) || {};
    const searchParams = location && location.search ? new URLSearchParams(location.search) : null;
    return {
      tab: query.tab || (searchParams && searchParams.get('tab')) || '',
      workloadKind: query.workloadKind || (searchParams && searchParams.get('workloadKind')) || '',
      openHelmInstall: query.openHelmInstall || (searchParams && searchParams.get('openHelmInstall')) || '',
      openCreateResource: query.openCreateResource || (searchParams && searchParams.get('openCreateResource')) || '',
    };
  }

  shouldOpenHelmInstall = (value) => value === true || value === 'true' || value === '1';
  shouldOpenCreateResource = (value) => value === true || value === 'true' || value === '1';

  getInitialViewState() {
    const { tab, workloadKind, openHelmInstall, openCreateResource } = this.getLocationQuery();
    const workloadKindOptions = getWorkloadKindOptions();
    const matchedWorkloadKind = workloadKindOptions.find(item => item.value === workloadKind) || workloadKindOptions[0];
    const tabMeta = getTabMetaMap();
    const shouldOpenHelmInstall = this.shouldOpenHelmInstall(openHelmInstall);
    const shouldOpenCreateResource = this.shouldOpenCreateResource(openCreateResource);
    const targetTab = shouldOpenHelmInstall ? 'helm' : (shouldOpenCreateResource ? 'workload' : tab);
    return {
      activeTab: tabMeta[targetTab] ? targetTab : DEFAULT_TAB,
      workloadKind: matchedWorkloadKind.value,
      workloadKindGroup: matchedWorkloadKind.group,
      openHelmInstall: shouldOpenHelmInstall,
      openCreateResource: shouldOpenCreateResource,
    };
  }

  consumeHelmInstallQuery = (tab = 'helm') => {
    const { dispatch, location } = this.props;
    const { teamName, regionName } = this.getParams();
    const nextQuery = { ...((location && location.query) || {}) };
    const searchParams = location && location.search ? new URLSearchParams(location.search) : null;

    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (nextQuery[key] === undefined) {
          nextQuery[key] = value;
        }
      });
    }

    delete nextQuery.openHelmInstall;
    nextQuery.tab = tab;

    dispatch(routerRedux.replace({
      pathname: `/team/${teamName}/region/${regionName}/resource-center`,
      query: nextQuery,
    }));
  };

  openHelmInstallFromQuery = () => {
    if (this.state.activeTab !== 'helm') {
      this.setState({ activeTab: 'helm' }, () => {
        this.fetchTabData('helm');
        this.openHelmInstallModal();
        this.consumeHelmInstallQuery('helm');
      });
      return;
    }
    this.openHelmInstallModal();
    this.consumeHelmInstallQuery('helm');
  };

  consumeCreateResourceQuery = (tab = 'workload') => {
    const { dispatch, location } = this.props;
    const { teamName, regionName } = this.getParams();
    const nextQuery = { ...((location && location.query) || {}) };
    const searchParams = location && location.search ? new URLSearchParams(location.search) : null;

    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (nextQuery[key] === undefined) {
          nextQuery[key] = value;
        }
      });
    }

    delete nextQuery.openCreateResource;
    nextQuery.tab = tab;

    dispatch(routerRedux.replace({
      pathname: `/team/${teamName}/region/${regionName}/resource-center`,
      query: nextQuery,
    }));
  };

  openCreateResourceFromQuery = () => {
    if (this.state.activeTab !== 'workload') {
      this.setState({ activeTab: 'workload' }, () => {
        this.fetchTabData('workload');
        this.openCreateChooser();
        this.consumeCreateResourceQuery('workload');
      });
      return;
    }
    this.openCreateChooser();
    this.consumeCreateResourceQuery('workload');
  };

  fetchTabData = (tab, extra = {}) => {
    const { dispatch } = this.props;
    const { workloadKind, workloadKindGroup } = this.state;
    const { teamName, regionName } = this.getParams();
    if (tab === 'helm') {
      dispatch({ type: 'teamResources/fetchHelmReleases', payload: { team: teamName, region: regionName } });
      return;
    }
    if (tab === 'config') {
      dispatch({
        type: 'teamResources/fetchConfigResources',
        payload: { team: teamName, region: regionName, group: '', version: 'v1' },
      });
      return;
    }
    const resourceParams = tab === 'workload'
      ? { group: extra.group || workloadKindGroup || 'apps', version: 'v1', resource: extra.resource || workloadKind || 'deployments' }
      : TAB_RESOURCE_MAP[tab] || TAB_RESOURCE_MAP.workload;
    dispatch({
      type: 'teamResources/fetchResources',
      payload: { team: teamName, region: regionName, ...resourceParams },
    });
  };

  handleTabChange = (key) => {
    const { activeTab } = this.state;
    if (key === activeTab) {
      return;
    }
    this.setState({ activeTab: key, searchText: '' }, () => {
      this.fetchTabData(key);
    });
  };

  handleWorkloadKindChange = (value) => {
    const found = getWorkloadKindOptions().find(k => k.value === value);
    const group = found ? found.group : 'apps';
    this.setState({ workloadKind: value, workloadKindGroup: group });
    this.fetchTabData('workload', { resource: value, group });
  };

  getCurrentResourceParams = (tab = this.state.activeTab) => {
    const { workloadKind, workloadKindGroup } = this.state;
    return tab === 'workload'
      ? { group: workloadKindGroup, version: 'v1', resource: workloadKind }
      : TAB_RESOURCE_MAP[tab] || TAB_RESOURCE_MAP.workload;
  };

  getRecordResourceParams = (record, tab = this.state.activeTab) => {
    if (tab === 'config') {
      const kind = ((record && record.kind) || '').toLowerCase();
      return { group: '', version: 'v1', resource: kind === 'secret' ? 'secrets' : 'configmaps' };
    }
    return this.getCurrentResourceParams(tab);
  };

  getYamlResultTone = (yamlResult) => {
    const summary = (yamlResult && yamlResult.summary) || {};
    if (summary.failure_count > 0 && summary.success_count > 0) {
      return 'warning';
    }
    if (summary.failure_count > 0) {
      return 'error';
    }
    return 'success';
  };

  buildYamlResultSummary = (yamlResult) => {
    const summary = (yamlResult && yamlResult.summary) || {};
    const total = Number(summary.total || 0);
    const successCount = Number(summary.success_count || 0);
    const failureCount = Number(summary.failure_count || 0);

    if (failureCount === 0) {
      return formatMessage(
        { id: 'resourceCenter.yaml.result.summary.success', defaultMessage: '共创建 {total} 个资源，全部成功' },
        { total }
      );
    }
    if (successCount === 0) {
      return formatMessage(
        { id: 'resourceCenter.yaml.result.summary.failure', defaultMessage: '共创建 {total} 个资源，全部失败' },
        { total }
      );
    }
    return formatMessage(
      { id: 'resourceCenter.yaml.result.summary.partial', defaultMessage: '共创建 {total} 个资源，{success} 个成功，{failure} 个失败' },
      { total, success: successCount, failure: failureCount }
    );
  };

  normalizeYamlCreateResult = (payload = {}) => {
    const responsePayload = payload.response_data || payload;
    const responseData = (responsePayload && responsePayload.data) || {};
    const bean = payload.bean || responseData.bean || {};
    const results = bean.results || [];
    const summary = bean.summary || {
      total: results.length,
      success_count: results.filter(item => item && item.success).length,
      failure_count: results.filter(item => item && !item.success).length,
      partial_success: results.some(item => item && item.success) && results.some(item => item && !item.success),
    };
    return {
      statusCode: payload.business_code || payload._condition || responsePayload.code || 500,
      message: bean.message || responsePayload.msg_show || responsePayload.msg || '',
      summary,
      results,
    };
  };

  openYamlResult = (payload) => {
    this.setState({
      yamlModalStep: 'result',
      yamlResultLoading: false,
      yamlResult: this.normalizeYamlCreateResult(payload),
    });
  };

  handleYamlCreateError = (error) => {
    this.openYamlResult(error && error.response && error.response.data ? error.response.data : {});
  };

  handleBackToYamlEditor = () => {
    this.setState({
      yamlModalStep: 'editor',
      yamlResultLoading: false,
    });
  };

  handleRefreshYamlResult = () => {
    this.fetchTabData(this.state.activeTab);
  };

  renderYamlResultPanel = () => {
    const { yamlResultLoading, yamlResult } = this.state;
    if (yamlResultLoading) {
      return (
        <div className={styles.yamlResultLoading}>
          <Spin />
          <div className={styles.yamlResultLoadingText}>
            {formatMessage({ id: 'resourceCenter.yaml.result.loading', defaultMessage: '正在创建资源，请稍候...' })}
          </div>
        </div>
      );
    }

    if (!yamlResult) {
      return null;
    }

    const summary = yamlResult.summary || {};
    const tone = this.getYamlResultTone(yamlResult);
    const alertType = tone === 'success' ? 'success' : (tone === 'warning' ? 'warning' : 'error');
    return (
      <div className={styles.yamlResultPanel}>
        <Alert
          type={alertType}
          showIcon
          className={styles.yamlResultAlert}
          message={this.buildYamlResultSummary(yamlResult)}
          description={yamlResult.message || undefined}
        />

        <div className={styles.yamlResultStats}>
          <div className={styles.yamlResultStatCard}>
            <div className={styles.yamlResultStatLabel}>{formatMessage({ id: 'resourceCenter.yaml.result.total', defaultMessage: '总数' })}</div>
            <div className={styles.yamlResultStatValue}>{summary.total || 0}</div>
          </div>
          <div className={styles.yamlResultStatCard}>
            <div className={styles.yamlResultStatLabel}>{formatMessage({ id: 'resourceCenter.yaml.result.successCount', defaultMessage: '成功' })}</div>
            <div className={styles.yamlResultStatValue}>{summary.success_count || 0}</div>
          </div>
          <div className={styles.yamlResultStatCard}>
            <div className={styles.yamlResultStatLabel}>{formatMessage({ id: 'resourceCenter.yaml.result.failureCount', defaultMessage: '失败' })}</div>
            <div className={styles.yamlResultStatValue}>{summary.failure_count || 0}</div>
          </div>
        </div>

        <div className={styles.yamlResultList}>
          {(yamlResult.results || []).map(item => {
            const displayName = item.name || formatMessage(
              { id: 'resourceCenter.yaml.result.docFallback', defaultMessage: '文档 #{index}' },
              { index: item.index }
            );
            return (
              <div key={`${item.index}-${item.kind || 'unknown'}-${item.name || 'unnamed'}`} className={styles.yamlResultItem}>
                <div className={styles.yamlResultItemHeader}>
                  <div className={styles.yamlResultItemTitle}>
                    <span className={styles.yamlResultItemName}>{displayName}</span>
                    {item.kind ? <span className={styles.yamlResultItemKind}>{item.kind}</span> : null}
                    {item.namespace ? <span className={styles.yamlResultItemNamespace}>{item.namespace}</span> : null}
                    {item.resource_scope ? (
                      <Tag color={item.resource_scope === 'cluster' ? 'blue' : 'cyan'}>
                        {item.resource_scope === 'cluster'
                          ? formatMessage({ id: 'resourceCenter.yaml.result.scope.cluster', defaultMessage: 'Cluster' })
                          : formatMessage({ id: 'resourceCenter.yaml.result.scope.namespaced', defaultMessage: 'Namespaced' })}
                      </Tag>
                    ) : null}
                  </div>
                  <Tag color={item.success ? 'green' : 'red'}>
                    {item.success
                      ? formatMessage({ id: 'resourceCenter.yaml.result.item.success', defaultMessage: '成功' })
                      : formatMessage({ id: 'resourceCenter.yaml.result.item.failure', defaultMessage: '失败' })}
                  </Tag>
                </div>
                <div className={styles.yamlResultItemMessage}>{item.message}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  closeYamlModal = () => {
    const { activeTab, yamlResult } = this.state;
    this.setState({
      yamlModalVisible: false,
      yamlModalMode: 'create',
      yamlModalStep: 'editor',
      yamlContent: '',
      yamlTargetName: '',
      yamlTargetParams: null,
      yamlResult: null,
      yamlResultLoading: false,
    });
    if (yamlResult && yamlResult.summary && Number(yamlResult.summary.success_count) > 0) {
      this.fetchTabData(activeTab);
    }
  };

  getTabMeta = (tab = this.state.activeTab) => {
    const tabMeta = getTabMetaMap();
    return tabMeta[tab] || tabMeta[DEFAULT_TAB];
  };

  getActiveData = (tab = this.state.activeTab) => {
    const { resources, helmReleases } = this.props;
    return tab === 'helm' ? (helmReleases || []) : (resources || []);
  };

  getTabLoading = (tab = this.state.activeTab) => {
    const { resourceListLoading, configListLoading, helmListLoading } = this.props;
    if (tab === 'helm') {
      return !!helmListLoading;
    }
    if (tab === 'config') {
      return !!configListLoading;
    }
    return !!resourceListLoading;
  };

  getMetricCards = () => {
    const { activeTab } = this.state;
    const list = this.getActiveData();
    const summary = getStatusSummary(list);

    if (activeTab === 'helm') {
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.helm.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.helm.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.helm.running' }), value: summary.running, helper: formatMessage({ id: 'resourceCenter.metrics.helm.runningHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.helm.warning' }), value: summary.warning, helper: formatMessage({ id: 'resourceCenter.metrics.helm.warningHelper' }), tone: 'warning' },
        { label: formatMessage({ id: 'resourceCenter.metrics.helm.error' }), value: summary.error, helper: formatMessage({ id: 'resourceCenter.metrics.helm.errorHelper' }), tone: 'error' },
      ];
    }

    if (activeTab === 'workload') {
      const helmManagedCount = list.filter(item => item.source === 'helm').length;
      const notReadyCount = list.filter(item => (
        item.replicas !== undefined &&
        item.ready_replicas !== undefined &&
        Number(item.ready_replicas) < Number(item.replicas)
      )).length;
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.workload.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.workload.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.workload.running' }), value: summary.running, helper: formatMessage({ id: 'resourceCenter.metrics.workload.runningHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.workload.helmManaged' }), value: helmManagedCount, helper: formatMessage({ id: 'resourceCenter.metrics.workload.helmManagedHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.workload.notReady' }), value: notReadyCount, helper: formatMessage({ id: 'resourceCenter.metrics.workload.notReadyHelper' }), tone: 'warning' },
      ];
    }

    if (activeTab === 'pod') {
      const restartedCount = list.filter(item => Number(item.restart_count) > 0).length;
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.pod.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.pod.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.pod.running' }), value: summary.running, helper: formatMessage({ id: 'resourceCenter.metrics.pod.runningHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.pod.restarted' }), value: restartedCount, helper: formatMessage({ id: 'resourceCenter.metrics.pod.restartedHelper' }), tone: restartedCount > 0 ? 'warning' : 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.pod.error' }), value: summary.error, helper: formatMessage({ id: 'resourceCenter.metrics.pod.errorHelper' }), tone: 'error' },
      ];
    }

    if (activeTab === 'network') {
      const portCount = list.reduce((total, item) => total + ((item.ports || []).length || 0), 0);
      const exposedCount = list.filter(item => item.type && item.type !== 'ClusterIP').length;
      const selectorlessCount = list.filter(item => !item.selector || Object.keys(item.selector).length === 0).length;
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.network.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.network.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.network.ports' }), value: portCount, helper: formatMessage({ id: 'resourceCenter.metrics.network.portsHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.network.exposed' }), value: exposedCount, helper: formatMessage({ id: 'resourceCenter.metrics.network.exposedHelper' }), tone: exposedCount > 0 ? 'warning' : 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.network.selectorless' }), value: selectorlessCount, helper: formatMessage({ id: 'resourceCenter.metrics.network.selectorlessHelper' }), tone: selectorlessCount > 0 ? 'warning' : 'default' },
      ];
    }

    if (activeTab === 'config') {
      const secretCount = list.filter(item => ((item.kind || '').toLowerCase() === 'secret')).length;
      const configMapCount = list.filter(item => !item.kind || ((item.kind || '').toLowerCase() === 'configmap')).length;
      const externalCount = list.filter(item => item.source === 'external').length;
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.config.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.config.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.config.configmap' }), value: configMapCount, helper: formatMessage({ id: 'resourceCenter.metrics.config.configmapHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.config.secret' }), value: secretCount, helper: formatMessage({ id: 'resourceCenter.metrics.config.secretHelper' }), tone: secretCount > 0 ? 'warning' : 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.config.external' }), value: externalCount, helper: formatMessage({ id: 'resourceCenter.metrics.config.externalHelper' }), tone: 'default' },
      ];
    }

    if (activeTab === 'storage') {
      const boundCount = list.filter(item => getResourceStatusMeta(item.status).tone === 'running').length;
      const warningCount = summary.warning;
      const storageClassCount = getDistinctCount(list, item => item.storage_class);
      return [
        { label: formatMessage({ id: 'resourceCenter.metrics.storage.total' }), value: list.length, helper: formatMessage({ id: 'resourceCenter.metrics.storage.totalHelper' }), tone: 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.storage.bound' }), value: boundCount, helper: formatMessage({ id: 'resourceCenter.metrics.storage.boundHelper' }), tone: 'running' },
        { label: formatMessage({ id: 'resourceCenter.metrics.storage.pending' }), value: warningCount, helper: formatMessage({ id: 'resourceCenter.metrics.storage.pendingHelper' }), tone: warningCount > 0 ? 'warning' : 'default' },
        { label: formatMessage({ id: 'resourceCenter.metrics.storage.class' }), value: storageClassCount, helper: formatMessage({ id: 'resourceCenter.metrics.storage.classHelper' }), tone: 'default' },
      ];
    }

    return [];
  };

  openCreateYamlModal = () => {
    this.setState({
      yamlModalVisible: true,
      yamlModalMode: 'create',
      yamlModalStep: 'editor',
      yamlContent: '',
      yamlTargetName: '',
      yamlTargetParams: this.getCurrentResourceParams(),
      yamlResult: null,
      yamlResultLoading: false,
    });
  };

  openCreateChooser = () => {
    this.openCreateYamlModal();
  };

  handleYamlCreate = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const { yamlContent, activeTab, yamlModalMode, yamlTargetName, yamlTargetParams } = this.state;
    const action = yamlModalMode === 'edit' ? 'teamResources/updateResource' : 'teamResources/createResource';
    const rawResourceParams = yamlTargetParams || this.getCurrentResourceParams();
    const payload = yamlModalMode === 'edit'
      ? { team: teamName, region: regionName, name: yamlTargetName, yaml: yamlContent, ...rawResourceParams }
      : { team: teamName, region: regionName, source: 'yaml', yaml: yamlContent };

    if (yamlModalMode !== 'edit') {
      this.setState({
        yamlModalStep: 'result',
        yamlResult: null,
        yamlResultLoading: true,
      });
    }
    dispatch({
      type: action,
      payload,
      callback: res => {
        if (yamlModalMode === 'edit') {
          notification.success({ message: formatMessage({ id: 'resourceCenter.yaml.saveSuccess' }) });
          this.closeYamlModal();
          this.fetchTabData(activeTab);
          return;
        }
        this.openYamlResult(res || {});
      },
      handleError: yamlModalMode === 'edit' ? null : this.handleYamlCreateError,
    });
  };

  handleYamlUpload = (file) => {
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target.result || '';
      try {
        jsYaml.loadAll(content);
      } catch (e) {
        notification.error({ message: formatMessage({ id: 'resourceCenter.yaml.invalid' }), description: e.message });
        return;
      }
      this.setState({
        yamlModalVisible: true,
        yamlModalMode: 'create',
        yamlModalStep: 'editor',
        yamlContent: content,
        yamlTargetName: '',
        yamlTargetParams: this.getCurrentResourceParams(),
        yamlResult: null,
        yamlResultLoading: false,
      });
    };
    reader.readAsText(file);
    return false;
  };

  handleOpenResourceYaml = (record, resourceParams) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    this.setState({ openingYamlName: record.name });
    dispatch({
      type: 'teamResources/fetchResource',
      payload: {
        team: teamName,
        region: regionName,
        name: record.name,
        ...(resourceParams || this.getCurrentResourceParams()),
      },
      callback: bean => {
        this.setState({
          yamlModalVisible: true,
          yamlModalMode: 'edit',
          yamlModalStep: 'editor',
          yamlTargetName: record.name,
          yamlTargetParams: resourceParams || this.getCurrentResourceParams(),
          openingYamlName: '',
          yamlContent: jsYaml.dump(bean, { noRefs: true, lineWidth: 120 }),
          yamlResult: null,
          yamlResultLoading: false,
        });
      },
      handleError: () => {
        this.setState({ openingYamlName: '' });
      },
    });
  };

  jumpToWorkloadDetail = (record) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const resourceParams = this.getCurrentResourceParams('workload');
    dispatch(routerRedux.push({
      pathname: `/team/${teamName}/region/${regionName}/resource-center/workloads/${resourceParams.resource}/${record.name}`,
      query: {
        group: resourceParams.group,
        version: resourceParams.version,
        tab: 'workload',
        workloadKind: resourceParams.resource,
      },
    }));
  };

  jumpToPodDetail = (record) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    dispatch(routerRedux.push({
      pathname: `/team/${teamName}/region/${regionName}/resource-center/pods/${record.name}`,
    }));
  };

  jumpToServiceDetail = (record) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const serviceName = (record && record.name) || record;
    dispatch(routerRedux.push({
      pathname: `/team/${teamName}/region/${regionName}/resource-center/services/${serviceName}`,
    }));
  };

  jumpToHelmDetail = (record, query = {}) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    dispatch(routerRedux.push({
      pathname: `/team/${teamName}/region/${regionName}/resource-center/helm/${record.name}`,
      query,
    }));
  };

  // ─── Helm 应用商店 ────────────────────────────────────────────────────────

  buildHelmModalState = (mode = 'install', release = null) => {
    const fixedReleaseName = (release && release.name) || '';
    return {
      helmModalVisible: true,
      helmModalMode: mode,
      helmTargetRelease: release,
      helmSourceType: 'store',
      helmStep: 'source',
      helmInstallLoading: false,
      helmCurrentRepo: '',
      helmAllCharts: [],
      helmCharts: [],
      helmChartSearch: '',
      helmChartPage: 1,
      helmChartTotal: 0,
      helmSelectedChart: null,
      helmForm: { version: '', release_name: fixedReleaseName, values: '' },
      helmPreviewLoading: false,
      helmPreviewData: null,
      helmPreviewFileKey: '',
      helmPreviewStatus: 'idle',
      helmPreviewError: '',
      helmConfigVisible: false,
      helmValuesEditorVisible: false,
      helmValuesEditorSourceType: 'store',
      helmExternalForm: {
        chart_protocol: 'https://',
        chart_address: '',
        auth_type: 'none',
        release_name: fixedReleaseName,
        values: '',
        username: '',
        password: '',
      },
      helmUploadRecord: {},
      helmUploadEventId: '',
      helmUploadFileList: [],
      helmUploadExistFiles: [],
      helmUploadChartInfo: null,
      helmUploadLoading: false,
      helmUploadForm: { version: '', release_name: fixedReleaseName, values: '' },
      helmAutoUpgradeLoading: false,
      helmAutoUpgradeInfo: null,
      helmAutoUpgradeError: '',
    };
  };

  getHelmWizardSteps = () => {
    const { helmSourceType } = this.state;
    return [
      {
        key: 'source',
        title: helmSourceType === 'store'
          ? formatMessage({ id: 'resourceCenter.helmStep.source.storeTitle', defaultMessage: '选择应用' })
          : formatMessage({ id: 'resourceCenter.helmStep.source.otherTitle', defaultMessage: '准备来源' }),
        helper: helmSourceType === 'store'
          ? formatMessage({ id: 'resourceCenter.helmStep.source.storeHelper', defaultMessage: '先从 Helm 仓库中选择目标 Chart。' })
          : helmSourceType === 'external'
            ? formatMessage({ id: 'resourceCenter.helmStep.source.externalHelper', defaultMessage: '先填写 Chart 地址，点击下一步时自动检测。' })
            : formatMessage({ id: 'resourceCenter.helmStep.source.uploadHelper', defaultMessage: '先上传 Chart 包，点击下一步时自动检测。' }),
      },
      {
        key: 'basic',
        title: formatMessage({ id: 'resourceCenter.helmStep.basicTitle', defaultMessage: '基础信息' }),
        helper: formatMessage({ id: 'resourceCenter.helmStep.basicHelper', defaultMessage: '在这一页确认版本与 Release 名称。' }),
      },
      {
        key: 'values',
        title: formatMessage({ id: 'resourceCenter.helmStep.valuesTitle', defaultMessage: '安装配置' }),
        helper: formatMessage({ id: 'resourceCenter.helmStep.valuesHelper', defaultMessage: '最后统一编辑 values.yaml，并直接执行安装。' }),
      },
    ];
  };

  getHelmStepIndex = () => {
    const { helmStep } = this.state;
    const index = HELM_WIZARD_STEPS.indexOf(helmStep);
    return index > -1 ? index : 0;
  };

  canProceedHelmStep = () => {
    const {
      helmStep,
      helmSourceType,
      helmSelectedChart,
      helmPreviewData,
      helmPreviewLoading,
      helmForm,
      helmExternalForm,
      helmUploadExistFiles,
      helmUploadForm,
    } = this.state;

    if (helmStep === 'source') {
      if (helmSourceType === 'store') {
        return !!helmSelectedChart && !!helmPreviewData && !helmPreviewLoading;
      }
      if (helmSourceType === 'external') {
        const chartUrl = this.getHelmExternalChartValidation().chartUrl;
        return !!chartUrl && !(
          helmExternalForm.auth_type === 'basic'
          && (!helmExternalForm.username || !helmExternalForm.password)
        ) && !helmPreviewLoading;
      }
      return !!helmUploadExistFiles.length && !helmPreviewLoading;
    }

    if (helmStep === 'basic') {
      if (helmPreviewLoading || !helmPreviewData) {
        return false;
      }
      if (helmSourceType === 'store') {
        return !!helmForm.release_name && !!helmForm.version;
      }
      if (helmSourceType === 'external') {
        return !!helmExternalForm.release_name;
      }
      return !!helmUploadForm.release_name;
    }

    return false;
  };

  buildHelmSourcePreviewPayload = () => {
    const { teamName, regionName } = this.getParams();
    const { helmSourceType, helmExternalForm, helmUploadEventId } = this.state;
    if (helmSourceType === 'external') {
      const chartUrl = this.getHelmExternalChartValidation().chartUrl;
      if (!chartUrl) {
        return null;
      }
      return {
        team: teamName,
        region: regionName,
        source_type: chartUrl.indexOf('oci://') === 0 ? 'oci' : 'repo',
        chart_url: chartUrl,
        username: helmExternalForm.auth_type === 'basic' ? helmExternalForm.username : '',
        password: helmExternalForm.auth_type === 'basic' ? helmExternalForm.password : '',
      };
    }
    if (helmSourceType === 'upload') {
      if (!helmUploadEventId) {
        return null;
      }
      return {
        team: teamName,
        region: regionName,
        source_type: 'upload',
        event_id: helmUploadEventId,
      };
    }
    return null;
  };

  canInstallHelm = () => {
    const {
      helmSourceType,
      helmPreviewData,
      helmPreviewLoading,
      helmForm,
      helmExternalForm,
      helmUploadChartInfo,
      helmUploadForm,
    } = this.state;

    if (helmPreviewLoading || !helmPreviewData) {
      return false;
    }
    if (helmSourceType === 'store') {
      return !!helmForm.release_name && !!helmForm.version;
    }
    if (helmSourceType === 'external') {
      return !!helmExternalForm.release_name;
    }
    return !!helmUploadChartInfo && !!helmUploadForm.release_name;
  };

  goToNextHelmStep = () => {
    const { helmStep, helmSourceType, helmPreviewData } = this.state;
    const currentIndex = this.getHelmStepIndex();
    if (!this.canProceedHelmStep() || currentIndex >= HELM_WIZARD_STEPS.length - 1) {
      return;
    }
    if (helmStep === 'source' && helmSourceType !== 'store') {
      if (helmPreviewData) {
        this.setState({ helmStep: HELM_WIZARD_STEPS[currentIndex + 1] });
        return;
      }
      const payload = this.buildHelmSourcePreviewPayload();
      if (!payload) {
        return;
      }
      this.fetchHelmChartPreview(payload, helmSourceType, () => {
        this.setState({ helmStep: HELM_WIZARD_STEPS[currentIndex + 1] });
      });
      return;
    }
    this.setState({ helmStep: HELM_WIZARD_STEPS[currentIndex + 1] });
  };

  goToPrevHelmStep = () => {
    const currentIndex = this.getHelmStepIndex();
    if (currentIndex <= 0) {
      return;
    }
    this.setState({ helmStep: HELM_WIZARD_STEPS[currentIndex - 1] });
  };

  openHelmInstallModal = () => {
    this.invalidateHelmPreviewRequests();
    this.setState(this.buildHelmModalState('install'));
    this.fetchHelmRepos();
    this.initHelmUploadSession();
  };

  openHelmUpgradeModal = (release) => {
    this.invalidateHelmPreviewRequests();
    this.setState(this.buildHelmModalState('upgrade', release));
    this.fetchHelmRepos();
    this.initHelmUploadSession();
  };

  openHelmDetailModal = (release) => {
    this.setState({
      helmDetailVisible: true,
      helmDetailRelease: release,
    });
  };

  closeHelmDetailModal = () => {
    this.setState({
      helmDetailVisible: false,
      helmDetailRelease: null,
    });
  };

  openHelmRollbackModal = (release) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    this.setState({
      helmHistoryVisible: true,
      helmHistoryLoading: true,
      helmHistoryRelease: release,
      helmHistoryList: [],
      helmRollbackLoading: false,
    });
    dispatch({
      type: 'teamResources/fetchHelmReleaseHistory',
      payload: {
        team: teamName,
        region: regionName,
        release_name: release.name,
      },
      callback: list => {
        this.setState({
          helmHistoryLoading: false,
          helmHistoryList: Array.isArray(list) ? list : [],
        });
      },
      handleError: err => {
        this.setState({ helmHistoryLoading: false });
        notification.error({
          message: this.getHelmErrorMessage(err, formatMessage({ id: 'resourceCenter.helm.historyLoadFailed', defaultMessage: '读取回滚历史失败' })),
        });
      },
    });
  };

  handleHelmSourceChange = (sourceType) => {
    const { helmModalMode, helmTargetRelease, helmSourceType, helmForm, helmExternalForm, helmUploadForm } = this.state;
    if (sourceType === helmSourceType) {
      return;
    }
    const fixedReleaseName = helmModalMode === 'upgrade' && helmTargetRelease ? helmTargetRelease.name : '';
    const nextState = {
      helmSourceType: sourceType,
      helmStep: 'source',
      helmPreviewLoading: false,
      helmValuesEditorVisible: false,
      helmValuesEditorSourceType: sourceType,
      ...this.buildHelmPreviewResetState(),
    };
    if (helmSourceType === 'store') {
      nextState.helmSelectedChart = null;
      nextState.helmForm = {
        ...helmForm,
        version: '',
        values: '',
        release_name: fixedReleaseName || helmForm.release_name,
      };
    }
    if (helmSourceType === 'external') {
      nextState.helmExternalForm = {
        ...helmExternalForm,
        values: '',
        release_name: fixedReleaseName || helmExternalForm.release_name,
      };
    }
    if (helmSourceType === 'upload') {
      nextState.helmUploadChartInfo = null;
      nextState.helmUploadForm = {
        ...helmUploadForm,
        version: '',
        values: '',
        release_name: fixedReleaseName || helmUploadForm.release_name,
      };
    }
    this.setState(nextState);
    if (sourceType === 'upload' && !(this.state.helmUploadRecord && this.state.helmUploadRecord.upload_url)) {
      this.initHelmUploadSession();
    }
  };

  fetchHelmRepos = (afterLoad) => {
    const { dispatch } = this.props;
    const { teamName } = this.getParams();
    this.setState({ helmRepoLoading: true });
    dispatch({
      type: 'market/HelmwaRehouseList',
      payload: { team_name: teamName },
      callback: res => {
        const list = (res && (res.list || res)) || [];
        const repos = Array.isArray(list) ? list : [];
        this.setState({ helmRepos: repos, helmRepoLoading: false }, () => {
          if (repos.length > 0) {
            this.handleHelmRepoSelect(repos[0].name || repos[0].repo_name || repos[0]);
          }
          if (afterLoad) {
            afterLoad(repos);
          }
        });
      },
      handleError: () => {
        this.setState({ helmRepoLoading: false });
        if (afterLoad) {
          afterLoad([]);
        }
      },
    });
  };

  fetchHelmChartsByRepo = (repoName, query) => {
    const { dispatch, currentEnterprise } = this.props;
    const eid = currentEnterprise && currentEnterprise.enterprise_id;
    return new Promise(resolve => {
      dispatch({
        type: 'market/fetchHelmMarkets',
        payload: {
          enterprise_id: eid,
          repo_name: repoName,
          query,
          page: 1,
          pageSize: 20,
          versions_limit: 20,
        },
        callback: res => {
          const charts = Array.isArray(res) ? res : [];
          resolve(charts);
        },
        handleError: () => resolve([]),
      });
    });
  };

  detectHelmUpgradeOptions = async (release) => {
    const { helmRepos } = this.state;
    const releaseChart = (release && release.chart) || '';
    const currentVersion = (release && release.chart_version) || '';
    if (!releaseChart) {
      this.setState({
        helmAutoUpgradeLoading: false,
        helmAutoUpgradeInfo: null,
        helmAutoUpgradeError: formatMessage({ id: 'resourceCenter.helm.autoUpgrade.missingChart', defaultMessage: '当前 Release 缺少 Chart 信息，请改用手动升级。' }),
      });
      return;
    }
    const repos = Array.isArray(helmRepos) ? helmRepos : [];
    if (!repos.length) {
      this.setState({
        helmAutoUpgradeLoading: false,
        helmAutoUpgradeInfo: null,
        helmAutoUpgradeError: formatMessage({ id: 'resourceCenter.helm.autoUpgrade.noRepo', defaultMessage: '当前没有可用于自动检测的 Helm 仓库，请改用手动升级。' }),
      });
      return;
    }

    const matches = [];
    for (let i = 0; i < repos.length; i += 1) {
      const repo = repos[i];
      const repoName = repo.name || repo.repo_name || repo;
      const charts = await this.fetchHelmChartsByRepo(repoName, releaseChart);
      const targetChart = charts.find(item => (item.name || '') === releaseChart);
      if (!targetChart) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const versions = ((targetChart.versions || []).map(item => item.version).filter(Boolean))
        .filter(version => compareHelmVersions(version, currentVersion) > 0)
        .sort((left, right) => compareHelmVersions(right, left));
      if (versions.length > 0) {
        matches.push({
          repoName,
          chart: targetChart,
          versions,
          recommendedVersion: versions[0],
        });
      }
    }

    if (matches.length === 1) {
      this.setState({
        helmAutoUpgradeLoading: false,
        helmAutoUpgradeInfo: matches[0],
        helmAutoUpgradeError: '',
      });
      return;
    }

    this.setState({
      helmAutoUpgradeLoading: false,
      helmAutoUpgradeInfo: null,
      helmAutoUpgradeError: matches.length > 1
        ? formatMessage({ id: 'resourceCenter.helm.autoUpgrade.multipleSources', defaultMessage: '检测到多个同名 Chart 来源，请改用手动升级。' })
        : formatMessage({ id: 'resourceCenter.helm.autoUpgrade.noMatch', defaultMessage: '暂未发现可自动识别的更新版本，请改用手动升级。' }),
    });
  };

  applyRecommendedUpgrade = () => {
    const { helmAutoUpgradeInfo, helmTargetRelease } = this.state;
    if (!helmAutoUpgradeInfo) {
      return;
    }
    const chart = helmAutoUpgradeInfo.chart || {};
    const version = helmAutoUpgradeInfo.recommendedVersion || '';
    this.setState({
      helmSourceType: 'store',
      helmStep: 'basic',
      helmCurrentRepo: helmAutoUpgradeInfo.repoName,
      helmSelectedChart: chart,
      ...this.buildHelmPreviewResetState(),
      helmForm: {
        version,
        release_name: (helmTargetRelease && helmTargetRelease.name) || '',
        values: '',
      },
    }, () => {
      this.fetchHelmChartPreview({
        team: this.getParams().teamName,
        region: this.getParams().regionName,
        source_type: 'store',
        repo_name: helmAutoUpgradeInfo.repoName,
        chart: chart && chart.name,
        version,
      }, 'store');
    });
  };

  handleHelmRepoSelect = (repoName) => {
    const { dispatch, currentEnterprise } = this.props;
    const eid = currentEnterprise && currentEnterprise.enterprise_id;
    this.setState({
      helmCurrentRepo: repoName,
      helmChartLoading: true,
      helmChartSearch: '',
      helmChartPage: 1,
      helmAllCharts: [],
      helmCharts: [],
      helmSelectedChart: null,
      ...this.buildHelmPreviewResetState(),
    });
    dispatch({
      type: 'market/fetchHelmMarkets',
      payload: { enterprise_id: eid, repo_name: repoName },
      callback: res => {
        const all = Array.isArray(res)
          ? res.map(chart => ({
            ...chart,
            description:
              chart.description
              || (chart.versions && chart.versions[0] && chart.versions[0].description)
              || '',
          }))
          : [];
        this.setState({
          helmAllCharts: all,
          helmChartLoading: false,
        }, () => this.applyHelmChartFilter());
      },
      handleError: () => this.setState({ helmChartLoading: false }),
    });
  };

  applyHelmChartFilter = () => {
    const { helmAllCharts, helmChartSearch, helmChartPage, helmChartPageSize } = this.state;
    const q = (helmChartSearch || '').toLowerCase();
    const filtered = q
      ? helmAllCharts.filter(c => (c.name || '').toLowerCase().includes(q))
      : helmAllCharts;
    const total = filtered.length;
    const start = (helmChartPage - 1) * helmChartPageSize;
    const charts = filtered.slice(start, start + helmChartPageSize);
    this.setState({ helmCharts: charts, helmChartTotal: total });
  };

  handleHelmChartSearch = (v) => {
    this.setState({ helmChartSearch: v, helmChartPage: 1 }, () => this.applyHelmChartFilter());
  };

  handleHelmChartPageChange = (page) => {
    this.setState({ helmChartPage: page }, () => this.applyHelmChartFilter());
  };

  handleHelmChartSelect = (chart) => {
    const versions = chart.versions || [];
    const version = (versions[0] && versions[0].version) || '';
    const { helmModalMode, helmTargetRelease } = this.state;
    this.setState({
      helmSelectedChart: chart,
      helmStep: 'source',
      ...this.buildHelmPreviewResetState(),
      helmForm: {
        version,
        release_name: helmModalMode === 'upgrade' && helmTargetRelease ? helmTargetRelease.name : '',
        values: '',
      },
    }, () => {
      this.fetchHelmChartPreview({
        team: this.getParams().teamName,
        region: this.getParams().regionName,
        source_type: 'store',
        repo_name: this.state.helmCurrentRepo,
        chart: chart && chart.name,
        version,
      }, 'store');
    });
  };

  handleHelmStoreVersionChange = (version) => {
    const { helmSelectedChart, helmCurrentRepo, helmForm } = this.state;
    const { teamName, regionName } = this.getParams();
    this.setState({
      helmForm: { ...helmForm, version },
      ...this.buildHelmPreviewResetState(),
    }, () => {
      this.fetchHelmChartPreview({
        team: teamName,
        region: regionName,
        source_type: 'store',
        repo_name: helmCurrentRepo,
        chart: helmSelectedChart && helmSelectedChart.name,
        version,
      }, 'store');
    });
  };

  getHelmChartIcon = (chart) => {
    const versions = (chart && chart.versions) || [];
    return (chart && chart.icon) || (versions[0] && versions[0].icon) || '';
  };

  handleHelmExternalFieldChange = (key, value) => {
    const { helmExternalForm } = this.state;
    const resetPreviewKeys = ['chart_protocol', 'chart_address', 'auth_type', 'username', 'password'];
    this.setState({
      helmExternalForm: {
        ...helmExternalForm,
        [key]: value,
      },
      ...(resetPreviewKeys.indexOf(key) > -1 ? {
        ...this.buildHelmPreviewResetState(),
      } : {}),
    });
  };

  getHelmExternalChartValidation = () => {
    const { helmExternalForm } = this.state;
    return getHelmChartUrlValidation(
      helmExternalForm.chart_protocol,
      helmExternalForm.chart_address,
    );
  };

  getHelmExternalChartValidationMessage = () => {
    const { errorCode } = this.getHelmExternalChartValidation();
    return getHelmChartUrlValidationMessage(
      errorCode,
      descriptor => formatMessage(descriptor),
    );
  };

  buildHelmExternalChartUrl = () => {
    return this.getHelmExternalChartValidation().chartUrl;
  };

  initHelmUploadSession = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    dispatch({
      type: 'createApp/createJarWarServices',
      payload: {
        region: regionName,
        team_name: teamName,
        component_id: '',
      },
      callback: res => {
        const bean = res && res.bean;
        this.setState({
          helmUploadRecord: bean || {},
          helmUploadEventId: bean && bean.event_id,
        });
      },
      handleError: err => {
        notification.error({
          message: (err && err.msg_show) || formatMessage({ id: 'resourceCenter.helm.uploadSessionInitFailed', defaultMessage: '初始化 Chart 上传会话失败' }),
        });
      },
    });
  };

  decodeBase64Text = (value) => {
    if (!value) {
      return '';
    }
    try {
      return window.atob(value);
    } catch (e) {
      return '';
    }
  };

  getHelmErrorMessage = (err, fallbackMessage) =>
    (err && (
      err.msg_show
      || (err.response && err.response.data && err.response.data.msg_show)
      || (err.data && err.data.msg_show)
    )) || fallbackMessage;

  getHelmFormStateKey = (sourceType) => {
    if (sourceType === 'external') {
      return 'helmExternalForm';
    }
    if (sourceType === 'upload') {
      return 'helmUploadForm';
    }
    return 'helmForm';
  };

  getHelmFormState = (sourceType) => this.state[this.getHelmFormStateKey(sourceType)] || {};

  updateHelmFormState = (sourceType, patch) => {
    const stateKey = this.getHelmFormStateKey(sourceType);
    this.setState(prevState => ({
      [stateKey]: {
        ...(prevState[stateKey] || {}),
        ...patch,
      },
    }));
  };

  buildHelmPreviewResetState = (extra = {}) => {
    this.invalidateHelmPreviewRequests();
    return {
      helmPreviewLoading: false,
      helmPreviewData: null,
      helmPreviewFileKey: '',
      helmPreviewStatus: 'idle',
      helmPreviewError: '',
      helmConfigVisible: false,
      ...extra,
    };
  };

  applyHelmPreview = (preview, sourceType, callback) => {
    const valuesMap = (preview && preview.values) || {};    
    const firstKey = getPreferredHelmValuesFileKey(valuesMap);
    const decodedValues = firstKey ? this.decodeBase64Text(valuesMap[firstKey]) : '';
    const formStateKey = this.getHelmFormStateKey(sourceType);
    const nextState = {
      helmPreviewLoading: false,
      helmPreviewData: preview || null,
      helmPreviewFileKey: firstKey,
      helmPreviewStatus: 'success',
      helmPreviewError: '',
      helmConfigVisible: true,
      helmValuesEditorSourceType: sourceType,
    };
    if (sourceType === 'upload') {
      nextState[formStateKey] = {
        ...this.state[formStateKey],
        version: (preview && preview.version) || this.state.helmUploadForm.version,
        values: decodedValues,
      };
      nextState.helmUploadChartInfo = preview || null;
    } else {
      nextState[formStateKey] = {
        ...this.state[formStateKey],
        values: decodedValues,
      };
    }
    this.setState(nextState, callback);
  };

  fetchHelmChartPreview = (payload, sourceType, callback) => {
    const { dispatch } = this.props;
    const requestId = this.getNextHelmPreviewRequestId();
    this.setState({
      helmPreviewLoading: true,
      helmPreviewData: null,
      helmPreviewFileKey: '',
      helmPreviewStatus: 'checking',
      helmPreviewError: '',
      helmConfigVisible: false,
    });
    dispatch({
      type: 'teamResources/previewHelmChart',
      payload,
      callback: bean => {
        if (!this.isLatestHelmPreviewRequest(requestId)) {
          return;
        }
        this.applyHelmPreview(bean, sourceType, callback);
      },
      handleError: err => {
        if (!this.isLatestHelmPreviewRequest(requestId)) {
          return;
        }
        const message = this.getHelmErrorMessage(err, formatMessage({ id: 'resourceCenter.helm.previewFailed', defaultMessage: 'Chart 检测失败' }));
        this.setState({
          helmPreviewLoading: false,
          helmPreviewStatus: 'error',
          helmPreviewError: message,
          helmConfigVisible: false,
          helmValuesEditorVisible: false,
        });
        notification.error({
          message,
        });
      },
    });
  };

  handleHelmPreviewFileChange = (fileKey) => {
    const { helmPreviewData, helmSourceType } = this.state;
    const valuesMap = (helmPreviewData && helmPreviewData.values) || {};
    const decodedValues = fileKey ? this.decodeBase64Text(valuesMap[fileKey]) : '';
    const formStateKey = this.getHelmFormStateKey(helmSourceType);
    const nextState = {
      helmPreviewFileKey: fileKey,
      [formStateKey]: {
        ...this.state[formStateKey],
        values: decodedValues,
      },
    };
    this.setState(nextState);
  };

  fetchHelmUploadStatusAndInfo = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const { helmUploadEventId } = this.state;
    if (!helmUploadEventId) {
      return;
    }
    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: regionName,
        team_name: teamName,
        event_id: helmUploadEventId,
      },
      callback: data => {
        const existFiles = (data && data.bean && data.bean.package_name) || [];
        this.setState({
          helmUploadExistFiles: existFiles,
          helmUploadLoading: false,
          ...this.buildHelmPreviewResetState(),
        });
      },
      handleError: err => {
        this.setState({ helmUploadLoading: false });
        notification.error({
          message: (err && err.msg_show) || formatMessage({ id: 'resourceCenter.helm.uploadStatusLoadFailed', defaultMessage: '读取上传状态失败' }),
        });
      },
    });
  };

  handleHelmUploadChange = info => {
    let fileList = info.fileList || [];
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.setState({ helmUploadFileList: fileList });
    if (info.file && info.file.status === 'uploading') {
      this.setState({ helmUploadLoading: true });
    }
    if (info.file && info.file.status === 'done') {
      this.fetchHelmUploadStatusAndInfo();
    }
    if (info.file && info.file.status === 'error') {
      this.setState({ helmUploadLoading: false });
      notification.error({
        message: formatMessage({ id: 'resourceCenter.helm.uploadFailed', defaultMessage: 'Chart 包上传失败' }),
      });
    }
  };

  handleHelmUploadRemove = () => {
    const { dispatch } = this.props;
    const { teamName } = this.getParams();
    const { helmUploadEventId, helmModalMode, helmTargetRelease } = this.state;
    if (!helmUploadEventId) {
      return;
    }
    this.setState({ helmUploadLoading: true });
    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: {
        team_name: teamName,
        event_id: helmUploadEventId,
      },
      callback: () => {
        this.setState({
          helmUploadFileList: [],
          helmUploadExistFiles: [],
          helmUploadChartInfo: null,
          helmUploadLoading: false,
          ...this.buildHelmPreviewResetState(),
          helmUploadForm: {
            version: '',
            release_name: helmModalMode === 'upgrade' && helmTargetRelease ? helmTargetRelease.name : '',
            values: '',
          },
        });
        this.initHelmUploadSession();
      },
      handleError: err => {
        this.setState({ helmUploadLoading: false });
        notification.error({
          message: (err && err.msg_show) || formatMessage({ id: 'resourceCenter.helm.uploadDeleteFailed', defaultMessage: '删除上传包失败' }),
        });
      },
    });
  };

  openHelmValuesEditor = (sourceType) => {
    this.setState({
      helmValuesEditorVisible: true,
      helmValuesEditorSourceType: sourceType,
    });
  };

  closeHelmValuesEditor = () => {
    this.setState({ helmValuesEditorVisible: false });
  };

  getHelmUpgradeRisk = (payload) => {
    const { helmModalMode, helmTargetRelease } = this.state;
    if (helmModalMode !== 'upgrade' || !helmTargetRelease) {
      return null;
    }
    const currentChart = (helmTargetRelease.chart || '').trim();
    const previewChart = (((this.state.helmPreviewData || {}).name) || '').trim();
    if (!currentChart || !previewChart || currentChart === previewChart) {
      return null;
    }
    return {
      currentChart,
      previewChart,
      payload,
    };
  };

  confirmHelmRiskAndSubmit = (risk, submit) => {
    Modal.confirm({
      title: formatMessage({ id: 'resourceCenter.helm.crossChartRiskTitle', defaultMessage: '检测到跨 Chart 升级风险' }),
      okText: formatMessage({ id: 'resourceCenter.helm.crossChartRiskConfirm', defaultMessage: '明确确认并继续' }),
      cancelText: formatMessage({ id: 'resourceCenter.common.cancel' }),
      width: 620,
      content: (
        <div className={styles.riskConfirmText}>
          <div>{formatMessage({ id: 'resourceCenter.helm.crossChartRisk.current', defaultMessage: '当前 Release Chart：' })}<strong>{risk.currentChart}</strong></div>
          <div>{formatMessage({ id: 'resourceCenter.helm.crossChartRisk.target', defaultMessage: '目标升级 Chart：' })}<strong>{risk.previewChart}</strong></div>
          <div className={styles.riskConfirmSpacer}>
            {formatMessage({ id: 'resourceCenter.helm.crossChartRisk.desc', defaultMessage: 'Helm upgrade 不会自动清理旧资源，这种跨 Chart 升级可能导致：' })}
          </div>
          <div>{formatMessage({ id: 'resourceCenter.helm.crossChartRisk.item1', defaultMessage: '1. 新旧应用资源混合运行' })}</div>
          <div>{formatMessage({ id: 'resourceCenter.helm.crossChartRisk.item2', defaultMessage: '2. 流量异常与资源冲突' })}</div>
          <div>{formatMessage({ id: 'resourceCenter.helm.crossChartRisk.item3', defaultMessage: '3. 回滚失败或结果不可预期' })}</div>
          <div className={styles.riskConfirmSpacer}>
            {formatMessage({ id: 'resourceCenter.helm.crossChartRisk.suggestion', defaultMessage: '更推荐使用 `helm uninstall + helm install` 完成替换，或使用新的 release 名称部署。' })}
          </div>
          <div className={`${styles.riskConfirmSpacer} ${styles.riskConfirmDanger}`}>
            {formatMessage({ id: 'resourceCenter.helm.crossChartRisk.warning', defaultMessage: '若你未明确确认，本次升级将被默认拒绝。' })}
          </div>
        </div>
      ),
      onOk: submit,
    });
  };

  handleHelmInstall = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const {
      helmModalMode,
      helmTargetRelease,
      helmSourceType,
      helmSelectedChart,
      helmCurrentRepo,
      helmForm,
      helmExternalForm,
      helmUploadEventId,
      helmUploadForm,
    } = this.state;
    let payload = null;
    let validationMessage = '';
    const targetReleaseName = (helmModalMode === 'upgrade' && helmTargetRelease && helmTargetRelease.name) || '';

    if (helmSourceType === 'store') {
      if (!helmSelectedChart) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.selectChart', defaultMessage: '请先选择一个 Helm Chart' });
      } else if (!helmForm.release_name || !helmForm.version) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.releaseAndVersion', defaultMessage: '请填写 Release 名称并选择版本' });
      } else if (!this.state.helmPreviewData) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.waitPreview', defaultMessage: '请等待 Chart 检测完成' });
      } else {
        payload = {
          team: teamName,
          region: regionName,
          source_type: 'store',
          repo_name: helmCurrentRepo,
          release_name: targetReleaseName || helmForm.release_name,
          chart: helmSelectedChart && helmSelectedChart.name,
          version: helmForm.version,
          values: helmForm.values,
        };
      }
    } else if (helmSourceType === 'external') {
      const chartValidation = this.getHelmExternalChartValidation();
      const chartUrl = chartValidation.chartUrl;
      const isOCI = chartUrl.indexOf('oci://') === 0;
      if (!helmExternalForm.release_name) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.releaseName', defaultMessage: '请填写 Release 名称' });
      } else if (!chartValidation.hasValue) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.chartUrl', defaultMessage: '请填写 Chart 地址' });
      } else if (chartValidation.errorCode) {
        validationMessage = this.getHelmExternalChartValidationMessage();
      } else if (
        helmExternalForm.auth_type === 'basic'
        && (!helmExternalForm.username || !helmExternalForm.password)
      ) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.basicAuth', defaultMessage: '请选择 Basic 鉴权时填写用户名和密码' });
      } else if (!this.state.helmPreviewData) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.previewFirst', defaultMessage: '请先检测 Chart' });
      } else {
        payload = {
          team: teamName,
          region: regionName,
          source_type: isOCI ? 'oci' : 'repo',
          chart_url: chartUrl,
          release_name: targetReleaseName || helmExternalForm.release_name,
          values: helmExternalForm.values,
          username: helmExternalForm.auth_type === 'basic' ? helmExternalForm.username : '',
          password: helmExternalForm.auth_type === 'basic' ? helmExternalForm.password : '',
        };
      }
    } else if (helmSourceType === 'upload') {
      if (!helmUploadEventId || !this.state.helmUploadChartInfo) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.uploadFirst', defaultMessage: '请先上传并检测 Chart 包' });
      } else if (!helmUploadForm.release_name) {
        validationMessage = formatMessage({ id: 'resourceCenter.helm.validation.releaseName', defaultMessage: '请填写 Release 名称' });
      } else {
        payload = {
          team: teamName,
          region: regionName,
          source_type: 'upload',
          event_id: helmUploadEventId,
          version: helmUploadForm.version,
          release_name: targetReleaseName || helmUploadForm.release_name,
          values: helmUploadForm.values,
        };
      }
    }

    if (validationMessage) {
      notification.warning({ message: validationMessage });
      return;
    }

    const submitInstall = (nextPayload) => {
      this.setState({ helmInstallLoading: true });
      dispatch({
        type: helmModalMode === 'upgrade' ? 'teamResources/upgradeRelease' : 'teamResources/installRelease',
        payload: nextPayload,
        callback: () => {
          this.setState({ helmModalVisible: false, helmInstallLoading: false });
          this.fetchTabData('helm');
        },
        handleError: err => {
          this.setState({ helmInstallLoading: false });
          notification.error({
            message: this.getHelmErrorMessage(
              err,
              formatMessage({ id: helmModalMode === 'upgrade' ? 'resourceCenter.helm.upgradeFailed' : 'resourceCenter.helm.installFailed', defaultMessage: helmModalMode === 'upgrade' ? '升级失败' : '安装失败' })
            ),
          });
        },
      });
    };

    const risk = this.getHelmUpgradeRisk(payload);
    if (risk) {
      this.confirmHelmRiskAndSubmit(risk, () => submitInstall({
        ...payload,
        allow_chart_replace: true,
      }));
      return;
    }

    submitInstall(payload);
  };

  handleHelmHistoryClose = () => {
    this.setState({
      helmHistoryVisible: false,
      helmHistoryLoading: false,
      helmHistoryRelease: null,
      helmHistoryList: [],
      helmRollbackLoading: false,
    });
  };

  handleHelmModalClose = () => {
    this.invalidateHelmPreviewRequests();
    this.setState({
      helmModalVisible: false,
      helmValuesEditorVisible: false,
    });
  };

  // ─── 其他资源操作 ─────────────────────────────────────────────────────────

  handleHelmUninstall = (releaseName) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    this.setState({ uninstallingReleaseName: releaseName });
    dispatch({
      type: 'teamResources/uninstallRelease',
      payload: { team: teamName, region: regionName, release_name: releaseName },
      callback: () => {
        this.setState({ uninstallingReleaseName: '' });
        this.fetchTabData('helm');
      },
    });
  };

  handleHelmRollback = (releaseName, revision) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    this.setState({ helmRollbackLoading: true });
    dispatch({
      type: 'teamResources/rollbackRelease',
      payload: { team: teamName, region: regionName, release_name: releaseName, revision },
      callback: () => {
        this.setState({ helmRollbackLoading: false, helmHistoryVisible: false });
        this.fetchTabData('helm');
      },
      handleError: err => {
        this.setState({ helmRollbackLoading: false });
        notification.error({
          message: this.getHelmErrorMessage(err, formatMessage({ id: 'resourceCenter.helm.rollbackFailed', defaultMessage: '回滚失败' })),
        });
      },
    });
  };

  handleDeleteResource = (record) => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const { activeTab } = this.state;
    const resourceParams = this.getRecordResourceParams(record, activeTab);
    this.setState({ deletingResourceName: record.name });
    dispatch({
      type: 'teamResources/deleteResource',
      payload: { team: teamName, region: regionName, name: record.name, ...resourceParams },
      callback: () => {
        this.setState({ deletingResourceName: '' });
        this.fetchTabData(activeTab);
      },
    });
  };

  getFilteredData(data) {
    const { searchText } = this.state;
    if (!searchText) return data;
    return data.filter(r => (r.name || '').toLowerCase().includes(searchText.toLowerCase()));
  }

  renderEmptyState = (tab) => {
    const meta = this.getTabMeta(tab);
    const primaryActionLabel = tab === 'helm' ? '' : formatMessage({ id: 'resourceCenter.common.createResource' });

    return (
      <ResourceEmptyState
        meta={meta}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={primaryActionLabel ? this.openCreateChooser : null}
      />
    );
  };

  renderCurrentTab = () => {
    const {
      activeTab,
      workloadKind,
      searchText,
      openingYamlName,
      deletingResourceName,
      uninstallingReleaseName,
    } = this.state;
    const { resources, helmReleases } = this.props;
    const tabLoading = this.getTabLoading(activeTab);

    if (activeTab === 'helm') {
      const data = searchText
        ? (helmReleases || []).filter(item => (item.name || '').toLowerCase().includes(searchText.toLowerCase()))
        : (helmReleases || []);
      return (
        <HelmTab
          data={data}
          searchText={searchText}
          onSearchChange={value => this.setState({ searchText: value })}
          onRefresh={() => this.fetchTabData(activeTab)}
          refreshLoading={tabLoading}
          onInstall={this.openHelmInstallModal}
          onDetail={this.jumpToHelmDetail}
          onUninstall={this.handleHelmUninstall}
          uninstallingName={uninstallingReleaseName}
          emptyContent={this.renderEmptyState('helm')}
        />
      );
    }
    if (activeTab === 'workload') {
      return (
        <WorkloadTab
          data={this.getFilteredData(resources || [])}
          workloadKind={workloadKind}
          searchText={searchText}
          onSearchChange={value => this.setState({ searchText: value })}
          onRefresh={() => this.fetchTabData(activeTab)}
          refreshLoading={tabLoading}
          onCreate={this.openCreateChooser}
          onWorkloadKindChange={this.handleWorkloadKindChange}
          onDetail={this.jumpToWorkloadDetail}
          onDelete={this.handleDeleteResource}
          deletingName={deletingResourceName}
          emptyContent={this.renderEmptyState('workload')}
        />
      );
    }
    if (activeTab === 'pod') {
      return (
        <PodTab
          data={this.getFilteredData(resources || [])}
          searchText={searchText}
          onSearchChange={value => this.setState({ searchText: value })}
          onRefresh={() => this.fetchTabData(activeTab)}
          refreshLoading={tabLoading}
          onCreate={this.openCreateChooser}
          onDetail={this.jumpToPodDetail}
          onDelete={this.handleDeleteResource}
          deletingName={deletingResourceName}
          emptyContent={this.renderEmptyState('pod')}
        />
      );
    }
    if (activeTab === 'network') {
      return (
        <NetworkTab
          data={this.getFilteredData(resources || [])}
          searchText={searchText}
          onSearchChange={value => this.setState({ searchText: value })}
          onRefresh={() => this.fetchTabData(activeTab)}
          refreshLoading={tabLoading}
          onCreate={this.openCreateChooser}
          onDetail={this.jumpToServiceDetail}
          onEditYaml={record => this.handleOpenResourceYaml(record, { group: '', version: 'v1', resource: 'services' })}
          onDelete={this.handleDeleteResource}
          deletingName={deletingResourceName}
          yamlLoadingName={openingYamlName}
          emptyContent={this.renderEmptyState('network')}
        />
      );
    }
    if (activeTab === 'config') {
      return (
        <ConfigTab
          data={this.getFilteredData(resources || [])}
          searchText={searchText}
          onSearchChange={value => this.setState({ searchText: value })}
          onRefresh={() => this.fetchTabData(activeTab)}
          refreshLoading={tabLoading}
          onCreate={this.openCreateChooser}
          onEditYaml={record => this.handleOpenResourceYaml(record, this.getRecordResourceParams(record, 'config'))}
          onDelete={this.handleDeleteResource}
          deletingName={deletingResourceName}
          yamlLoadingName={openingYamlName}
          emptyContent={this.renderEmptyState('config')}
        />
      );
    }
    return (
      <StorageTab
        data={this.getFilteredData(resources || [])}
        searchText={searchText}
        onSearchChange={value => this.setState({ searchText: value })}
        onRefresh={() => this.fetchTabData(activeTab)}
        refreshLoading={tabLoading}
        onCreate={this.openCreateChooser}
        onEditYaml={record => this.handleOpenResourceYaml(record, { group: '', version: 'v1', resource: 'persistentvolumeclaims' })}
        onDelete={this.handleDeleteResource}
        deletingName={deletingResourceName}
        yamlLoadingName={openingYamlName}
        emptyContent={this.renderEmptyState('storage')}
      />
    );
  };

  render() {
    const {
      yamlModalVisible,
      yamlContent,
      yamlModalMode,
      yamlModalStep,
      yamlResult,
    } = this.state;
    const { createResourceLoading, updateResourceLoading } = this.props;
    const activeData = this.getActiveData();
    const currentMeta = this.getTabMeta();
    const tabMetaMap = getTabMetaMap();
    const tabList = TAB_ORDER.map(tab => ({
      key: tab,
      tab: tabMetaMap[tab].title,
    }));
    const summary = getStatusSummary(activeData);
    const yamlSubmitting = yamlModalMode === 'edit' ? updateResourceLoading : createResourceLoading;
    const yamlResultStep = yamlModalMode === 'create' && yamlModalStep === 'result';
    const yamlModalFooter = yamlResultStep ? [
      <Button key="close" onClick={this.closeYamlModal} disabled={this.state.yamlResultLoading}>
        {formatMessage({ id: 'resourceCenter.common.close', defaultMessage: '关闭' })}
      </Button>,
      <Button key="back" onClick={this.handleBackToYamlEditor} disabled={this.state.yamlResultLoading}>
        {formatMessage({ id: 'resourceCenter.yaml.result.back', defaultMessage: '返回修改 YAML' })}
      </Button>,
      <Button key="refresh" type="primary" onClick={this.handleRefreshYamlResult} disabled={this.state.yamlResultLoading}>
        {formatMessage({ id: 'resourceCenter.yaml.result.refresh', defaultMessage: '刷新列表' })}
      </Button>,
    ] : undefined;

    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'resourceCenter.page.title' })}
        content={formatMessage({ id: 'resourceCenter.page.content' })}
        titleSvg={pageheaderSvg.getPageHeaderSvg('k8s', 18)}
        wrapperClassName={styles.pageHeaderLayout}
        tabList={tabList}
        tabActiveKey={this.state.activeTab}
        onTabChange={this.handleTabChange}
      >
        <div className={styles.page}>
          <div className={styles.workspace}>
            <div className={styles.mainPanel}>
              <Card className={styles.contentCard} bodyStyle={{ padding: 0, height: '100%' }}>
                <div ref={this.contentCardRef} className={styles.contentCardAnchor}>
                  <ResourceHero meta={currentMeta} metrics={this.getMetricCards()} summary={summary} />
                  {/* <ResourceContentHeader meta={currentMeta} /> */}
                  <div className={styles.contentBody}>
                    {this.renderCurrentTab()}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Modal
            title={<YamlModalHeader mode={yamlModalMode} onUpload={this.handleYamlUpload} />}
            visible={yamlModalVisible}
            onOk={yamlResultStep ? undefined : this.handleYamlCreate}
            onCancel={this.closeYamlModal}
            width={820}
            confirmLoading={yamlResultStep ? false : yamlSubmitting}
            okText={formatMessage({ id: yamlModalMode === 'edit' ? 'resourceCenter.yaml.ok.edit' : 'resourceCenter.yaml.ok.create', defaultMessage: yamlModalMode === 'edit' ? '保存' : '创建' })}
            cancelText={formatMessage({ id: 'resourceCenter.common.cancel' })}
            wrapClassName={styles.yamlModalWrap}
            bodyStyle={{ padding: '0 24px 24px' }}
            footer={yamlModalFooter}
          >
            <div className={styles.yamlModalToolbar}>
              <div className={styles.yamlModalToolbarInfo}>
                <span className={styles.yamlMetaBadge}>{formatMessage({ id: 'resourceCenter.yaml.toolbar.badge' })}</span>
                <span className={styles.yamlMetaText}>
                  {yamlModalMode === 'edit'
                    ? formatMessage({ id: 'resourceCenter.yaml.toolbar.editHint' })
                    : formatMessage({ id: 'resourceCenter.yaml.toolbar.createHint' })}
                </span>
              </div>
              <div className={styles.yamlModalToolbarTips}>
                <span className={styles.yamlMiniTip}>{formatMessage({ id: 'resourceCenter.yaml.toolbar.multiDoc' })}</span>
                <span className={styles.yamlMiniTip}>{formatMessage({ id: 'resourceCenter.yaml.toolbar.manualEdit' })}</span>
                {yamlResultStep && yamlResult ? (
                  <span className={styles.yamlMiniTip}>
                    {this.buildYamlResultSummary(yamlResult)}
                  </span>
                ) : null}
              </div>
            </div>
            {yamlResultStep ? this.renderYamlResultPanel() : (
              <CodeMirrorForm
                mode="yaml"
                value={yamlContent}
                visible={yamlModalVisible}
                onChange={value => this.setState({ yamlContent: value })}
                isHeader={false}
                isUpload={false}
                isAmplifications={false}
                editorHeight={420}
                style={{ marginBottom: 0 }}
              />
            )}
          </Modal>

          <HelmModals
            modalState={this.state}
            getFormState={this.getHelmFormState}
            updateFormState={this.updateHelmFormState}
            canProceedStep={this.canProceedHelmStep}
            canInstall={this.canInstallHelm}
            buildHelmExternalChartUrl={this.buildHelmExternalChartUrl}
            getHelmExternalChartValidationMessage={this.getHelmExternalChartValidationMessage}
            getHelmChartIcon={this.getHelmChartIcon}
            decodeBase64Text={this.decodeBase64Text}
            onSourceChange={this.handleHelmSourceChange}
            onRepoSelect={this.handleHelmRepoSelect}
            onChartSearch={this.handleHelmChartSearch}
            onChartPageChange={this.handleHelmChartPageChange}
            onChartSelect={this.handleHelmChartSelect}
            onStoreVersionChange={this.handleHelmStoreVersionChange}
            onExternalFieldChange={this.handleHelmExternalFieldChange}
            onUploadChange={this.handleHelmUploadChange}
            onResetUploadFileList={() => this.setState({ helmUploadFileList: [] })}
            onUploadRemove={this.handleHelmUploadRemove}
            onPreviewFileChange={this.handleHelmPreviewFileChange}
            onOpenValuesEditor={this.openHelmValuesEditor}
            onCloseValuesEditor={this.closeHelmValuesEditor}
            onPrevStep={this.goToPrevHelmStep}
            onNextStep={this.goToNextHelmStep}
            onCloseWizard={this.handleHelmModalClose}
            onSubmitWizard={this.handleHelmInstall}
            onCloseDetail={this.closeHelmDetailModal}
            onOpenHistoryFromDetail={this.openHelmRollbackModal}
            onJumpToUpgradeFromDetail={target => this.jumpToHelmDetail(target, { upgrade: 'true' })}
            onCloseHistory={this.handleHelmHistoryClose}
            onRollbackHistory={this.handleHelmRollback}
          />
        </div>
      </PageHeaderLayout>
    );
  }

}

export default ResourceCenter;
