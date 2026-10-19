/* eslint-disable camelcase */
/* eslint-disable react/no-array-index-key */
import {
  Alert,
  Badge,
  Button,
  Empty,
  Icon,
  notification,
  Progress,
  Select,
  Skeleton,
  Tag
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import userUtil from '@/utils/user';
import IssueModal from './components/IssueModal';
import OverviewModule from './components/OverviewModule';
import PlatformInfoModal from './components/PlatformInfoModal';
import ResourceTrend from './components/ResourceTrend';
import overviewData from './overviewData';
import styles from './index.less';

const { Option } = Select;
const SNAPSHOT_REFRESH_INTERVAL = 30000;
const METRICS_REFRESH_INTERVAL = 60000;
const t = (id, values) => formatMessage({ id: `platformOverview.${id}` }, values);

function displayNumber(value, precision = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return parseFloat(number.toFixed(precision));
}

function formatMemory(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return { value: '-', unit: 'GiB' };
  return { value: displayNumber(number / 1024, 1), unit: 'GiB' };
}

@connect(({ user, global, platformOverview }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  overview: platformOverview
}))
export default class Enterprise extends PureComponent {
  state = {
    selectedRegion: '',
    metric: 'cpu',
    timeRange: '6h',
    teamMetric: 'cpu',
    platformModalVisible: false,
    applicationModalVisible: false,
    gatewayModalVisible: false,
    license: null,
    licenseStatus: 'idle',
    licenseStatusReason: '',
    licenseUpdating: false,
    upgradeStatus: 'idle',
    hasNewVersion: false,
    latestVersion: ''
  };

  componentDidMount() {
    this.mounted = true;
    const { dispatch, user } = this.props;
    if (!userUtil.isCompanyAdmin(user)) {
      dispatch(routerRedux.replace('/'));
      return;
    }
    dispatch({ type: 'platformOverview/reset' });
    this.loadPlatformData();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.startRefreshTimers();
    this.deferSecondaryRequests();
  }

  componentDidUpdate(prevProps) {
    const previousShell = prevProps.overview && prevProps.overview.shell;
    const shell = this.props.overview && this.props.overview.shell;
    if (shell && shell !== previousShell && !this.state.selectedRegion) {
      const clusters = shell.clusters || [];
      const queryRegion =
        this.props.location && this.props.location.query && this.props.location.query.regionName;
      const selected =
        clusters.find(item => item.region_name === queryRegion) ||
        clusters.find(item => item.status === '1') ||
        clusters[0];
      if (selected) {
        this.setState({ selectedRegion: selected.region_name }, this.loadClusterData);
      }
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.clearRefreshTimers();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.deferredRequest) {
      if (window.cancelIdleCallback) window.cancelIdleCallback(this.deferredRequest);
      else window.clearTimeout(this.deferredRequest);
    }
    this.props.dispatch({ type: 'platformOverview/reset' });
  }

  getEnterpriseId = () => this.props.match.params.eid;

  getCurrentCluster = () => {
    const { shell } = this.props.overview;
    return ((shell && shell.clusters) || []).find(
      item => item.region_name === this.state.selectedRegion
    );
  };

  getCurrentSnapshot = () => {
    const { cluster, contexts } = this.props.overview;
    return contexts.cluster === this.state.selectedRegion ? cluster : null;
  };

  getCurrentMetrics = () => {
    const { metrics, contexts } = this.props.overview;
    const { selectedRegion, metric, timeRange } = this.state;
    return contexts.metrics === `${selectedRegion}|${metric}|${timeRange}` ? metrics : null;
  };

  loadPlatformData = () => {
    const enterpriseId = this.getEnterpriseId();
    const { dispatch } = this.props;
    dispatch({ type: 'platformOverview/fetchShell', payload: { enterpriseId } });
    dispatch({ type: 'platformOverview/fetchRuntime', payload: { enterpriseId } });
  };

  loadRuntime = () => {
    this.props.dispatch({
      type: 'platformOverview/fetchRuntime',
      payload: { enterpriseId: this.getEnterpriseId() }
    });
  };

  loadClusterSnapshot = (force = false) => {
    const { selectedRegion } = this.state;
    if (!selectedRegion) return;
    this.props.dispatch({
      type: 'platformOverview/fetchCluster',
      payload: { enterpriseId: this.getEnterpriseId(), regionName: selectedRegion, force }
    });
  };

  loadMetrics = (force = false) => {
    const { selectedRegion, metric, timeRange } = this.state;
    if (!selectedRegion) return;
    this.props.dispatch({
      type: 'platformOverview/fetchMetrics',
      payload: {
        enterpriseId: this.getEnterpriseId(),
        regionName: selectedRegion,
        metric,
        range: timeRange,
        force
      }
    });
  };

  loadClusterData = () => {
    this.loadClusterSnapshot();
    this.loadMetrics();
  };

  startRefreshTimers = () => {
    this.clearRefreshTimers();
    if (document.visibilityState === 'hidden') return;
    this.snapshotTimer = window.setInterval(() => {
      this.loadRuntime();
      this.loadClusterSnapshot(true);
    }, SNAPSHOT_REFRESH_INTERVAL);
    this.metricsTimer = window.setInterval(() => this.loadMetrics(true), METRICS_REFRESH_INTERVAL);
  };

  clearRefreshTimers = () => {
    if (this.snapshotTimer) window.clearInterval(this.snapshotTimer);
    if (this.metricsTimer) window.clearInterval(this.metricsTimer);
    this.snapshotTimer = null;
    this.metricsTimer = null;
  };

  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.clearRefreshTimers();
      return;
    }
    const { updatedAt } = this.props.overview;
    const now = Date.now();
    if (!updatedAt.runtime || now - updatedAt.runtime >= SNAPSHOT_REFRESH_INTERVAL) {
      this.loadRuntime();
    }
    if (!updatedAt.cluster || now - updatedAt.cluster >= SNAPSHOT_REFRESH_INTERVAL) {
      this.loadClusterSnapshot(true);
    }
    if (!updatedAt.metrics || now - updatedAt.metrics >= METRICS_REFRESH_INTERVAL) {
      this.loadMetrics(true);
    }
    this.startRefreshTimers();
  };

  deferSecondaryRequests = () => {
    const task = () => {
      this.loadLicense();
      this.checkUpgrade();
    };
    this.deferredRequest = window.requestIdleCallback
      ? window.requestIdleCallback(task, { timeout: 1800 })
      : window.setTimeout(task, 800);
  };

  loadLicense = () => {
    this.setState({ licenseStatus: 'loading', licenseStatusReason: '' });
    this.props.dispatch({
      type: 'region/getEnterpriseLicense',
      payload: { enterprise_id: this.getEnterpriseId() },
      callback: response => {
        if (!this.mounted) return;
        this.setState({
          license: response && response.bean,
          licenseStatus: 'success',
          licenseStatusReason: ''
        });
      },
      handleError: error => {
        if (!this.mounted) return;
        const classification = overviewData.classifyLicenseRequestError(error);
        this.setState({
          licenseStatus: classification.status,
          licenseStatusReason: classification.reason
        });
      }
    });
  };

  checkUpgrade = () => {
    this.setState({ upgradeStatus: 'loading' });
    const currentVersion = overviewData.compactVersion(
      this.props.rainbondInfo &&
        this.props.rainbondInfo.version &&
        this.props.rainbondInfo.version.value
    );
    this.props.dispatch({
      type: 'global/fetchAllVersion',
      callback: response => {
        if (!this.mounted) return;
        const versions = Array.isArray(response && response.response_data)
          ? response.response_data
          : [];
        const latestVersion = versions[0] ? overviewData.compactVersion(versions[0]) : '';
        if (!latestVersion || currentVersion === '-') {
          this.setState({ latestVersion: '', upgradeStatus: 'error', hasNewVersion: false });
          return;
        }
        this.setState({
          latestVersion,
          upgradeStatus: 'success',
          hasNewVersion: overviewData.isVersionNewer(latestVersion, currentVersion)
        });
      },
      handleError: () => {
        if (this.mounted) this.setState({ upgradeStatus: 'error', hasNewVersion: false });
      }
    });
  };

  handleUpdateLicense = (authorizationCode, done) => {
    this.setState({ licenseUpdating: true });
    this.props.dispatch({
      type: 'region/uploadEnterpriseLicense',
      payload: {
        enterprise_id: this.getEnterpriseId(),
        authz_code: authorizationCode
      },
      callback: response => {
        if (!this.mounted) return;
        this.setState({ licenseUpdating: false });
        if (response && response.status_code === 200) {
          notification.success({ message: t('modal.updateSuccess') });
          this.loadLicense();
          if (done) done(true);
        } else if (done) {
          done(false);
        }
      },
      handleError: () => {
        if (!this.mounted) return;
        this.setState({ licenseUpdating: false });
        notification.error({ message: t('modal.updateFailed') });
        if (done) done(false);
      }
    });
  };

  handleClusterChange = selectedRegion => {
    this.setState({ selectedRegion }, () => {
      this.loadClusterData();
      this.props.dispatch(
        routerRedux.replace(
          `/enterprise/${this.getEnterpriseId()}/index?regionName=${encodeURIComponent(
            selectedRegion
          )}`
        )
      );
    });
  };

  handleMetricChange = metric => this.setState({ metric }, this.loadMetrics);

  handleRangeChange = timeRange => this.setState({ timeRange }, this.loadMetrics);

  jump = path => this.props.dispatch(routerRedux.push(path));

  jumpCluster = () => {
    const cluster = this.getCurrentCluster();
    if (cluster && cluster.region_id) {
      this.jump(`/enterprise/${this.getEnterpriseId()}/clusters/ClustersMGT/${cluster.region_id}`);
    }
  };

  jumpNode = alert => {
    const cluster = this.getCurrentCluster();
    if (!cluster || !cluster.region_id) return;
    this.jump(
      `/enterprise/${this.getEnterpriseId()}/clusters/NodeMGT/${cluster.region_id}?name=${encodeURIComponent(
        alert.node_name || ''
      )}`
    );
  };

  jumpExtension = () => {
    this.jump(
      `/enterprise/${this.getEnterpriseId()}/extension?regionName=${encodeURIComponent(
        this.state.selectedRegion
      )}`
    );
  };

  jumpApplicationIssue = item => {
    if (!item.application_id) {
      this.jump(`/team/${item.tenant_name}/region/${item.region_name}/index`);
      return;
    }
    this.jump(
      `/team/${item.tenant_name}/region/${item.region_name}/apps/${item.application_id}/overview?type=components&componentID=${item.service_alias}&tab=overview`
    );
  };

  jumpGatewayIssue = item => {
    if (!item.application_id) {
      this.jump(`/team/${item.tenant_name}/region/${this.state.selectedRegion}/index`);
      return;
    }
    this.jump(
      `/team/${item.tenant_name}/region/${this.state.selectedRegion}/apps/${item.application_id}/gateway`
    );
  };

  renderPlatformHeader() {
    const enterprise = this.props.enterprise || {};
    const rainbondInfo = this.props.rainbondInfo || {};
    const { hasNewVersion, latestVersion, upgradeStatus } = this.state;
    const upgradeAvailable = upgradeStatus === 'success' && hasNewVersion;
    const currentVersion = overviewData.compactVersion(
      rainbondInfo.version && rainbondInfo.version.value
    );
    const name =
      enterprise.enterprise_alias ||
      enterprise.enterprise_name ||
      (rainbondInfo.title && rainbondInfo.title.value) ||
      'Rainbond';
    return (
      <section className={`${styles.platformHeader} ${upgradeAvailable ? styles.hasUpgrade : ''}`}>
        <button type="button" className={styles.platformIdentity} onClick={() => this.setState({ platformModalVisible: true })}>
          <span className={styles.platformLogo}><Icon type="cloud-server" /></span>
          <span><strong>{name}</strong><small>{currentVersion} · {t('header.viewDetails')}</small></span>
          <Icon type="right" />
        </button>
        {upgradeAvailable ? (
          <button type="button" className={styles.upgradeAction} onClick={() => this.jump(`/enterprise/${this.getEnterpriseId()}/setting?type=updateVersion`)}>
            <span>{t('header.newVersion', { version: latestVersion })}</span>
            <strong>{t('header.upgradeNow')} <Icon type="arrow-right" /></strong>
          </button>
        ) : upgradeStatus === 'success' ? (
          <span className={styles.versionCurrent}><Icon type="check-circle" /> {t('header.latest')}</span>
        ) : (
          <span className={styles.versionUnknown}><Icon type={upgradeStatus === 'loading' ? 'loading' : 'question-circle'} /> {upgradeStatus === 'loading' ? t('header.upgradeChecking') : t('header.upgradeUnavailable')}</span>
        )}
      </section>
    );
  }

  renderGlobalPosture() {
    const { shell, runtime, loading, errors } = this.props.overview;
    const quick = (shell && shell.global) || {};
    const globalRuntime = (runtime && runtime.global) || {};
    const alarmState = overviewData.runtimeSection(runtime, 'application_alarms');
    const applicationState = overviewData.runtimeSection(runtime, 'applications');
    const componentState = overviewData.runtimeSection(runtime, 'components');
    const alarms = alarmState.data || {};
    const workloadsAvailable = applicationState.data && componentState.data;
    const alarmAvailable = alarmState.status === 'ok' || alarmState.status === 'partial';
    const runtimeWarning = errors.runtime || (runtime && runtime.status !== 'ok');
    const metrics = [
      { icon: 'cluster', label: t('global.clusters'), value: quick.clusters, detail: globalRuntime.clusters ? t('global.healthyCount', { count: globalRuntime.clusters.healthy || 0 }) : '-' },
      { icon: 'deployment-unit', label: t('global.nodes'), value: runtime ? (globalRuntime.nodes ? globalRuntime.nodes.total : '-') : undefined, detail: globalRuntime.nodes ? t('global.readyCount', { count: globalRuntime.nodes.ready || 0 }) : runtime ? t('global.unavailable') : '-' },
      { icon: 'team', label: t('global.teams'), value: quick.teams, detail: t('global.platformScope') },
      { icon: 'user', label: t('global.users'), value: quick.users, detail: t('global.activeUsers') },
      { icon: 'appstore', label: t('global.workloads'), value: workloadsAvailable ? `${applicationState.data.total} / ${componentState.data.total}` : quick.applications !== undefined ? `${quick.applications} / ${quick.components}` : undefined, detail: applicationState.status === 'ok' && componentState.status === 'ok' ? t('global.appsComponents') : t('global.partialData') },
      { icon: 'alert', label: t('global.appAlarms'), value: alarmState.status === 'loading' ? undefined : alarmAvailable ? alarms.total : '-', detail: alarmState.status === 'loading' ? '-' : alarmState.status === 'ok' ? (alarms.total ? t('global.pending') : t('global.none')) : alarmState.status === 'partial' ? t('global.partialData') : t('global.unavailable'), warning: alarmAvailable && alarms.total > 0, action: alarmAvailable && alarms.total > 0 ? () => this.setState({ applicationModalVisible: true }) : null }
    ];
    return (
      <OverviewModule title={t('global.title')} description={t('global.description')} loading={loading.shell && !shell} error={errors.shell} onRetry={this.loadPlatformData}>
        {shell ? (
          <div className={styles.globalMetrics}>
            {metrics.map(item => (
              <button type="button" key={item.label} className={`${styles.globalMetric} ${item.warning ? styles.warningMetric : ''}`} onClick={item.action} disabled={!item.action}>
                <span><Icon type={item.icon} /></span>
                <div><small>{item.label}</small><strong>{item.value === undefined ? <Skeleton active title={{ width: 36 }} paragraph={false} /> : item.value}</strong><em>{item.detail}</em></div>
              </button>
            ))}
          </div>
        ) : null}
        {runtimeWarning && shell ? <Alert className={styles.inlineAlert} type="warning" showIcon message={errors.runtime || t('global.runtimeUnavailable')} /> : null}
      </OverviewModule>
    );
  }

  renderScopeSelector() {
    const { shell } = this.props.overview;
    const clusters = (shell && shell.clusters) || [];
    return (
      <div className={styles.scopeBar}>
        <div><span className={styles.scopeIcon}><Icon type="cluster" /></span><span><strong>{t('scope.title')}</strong><small>{t('scope.description')}</small></span></div>
        <Select value={this.state.selectedRegion || undefined} placeholder={t('scope.empty')} onChange={this.handleClusterChange} disabled={!clusters.length} className={styles.clusterSelect}>
          {clusters.map(cluster => <Option key={cluster.region_name} value={cluster.region_name}>{cluster.region_alias || cluster.region_name}</Option>)}
        </Select>
      </div>
    );
  }

  renderResourceCard(label, icon, data, memory) {
    if (!data) return null;
    const allocated = memory ? formatMemory(data.allocated) : { value: displayNumber(data.allocated), unit: 'Core' };
    const capacity = memory ? formatMemory(data.capacity) : { value: displayNumber(data.capacity), unit: 'Core' };
    const remaining = Math.max(0, Number(data.capacity || 0) - Number(data.allocated || 0));
    const remainingDisplay = memory ? formatMemory(remaining) : { value: displayNumber(remaining), unit: 'Core' };
    const percent = Math.max(0, Math.min(100, Number(data.allocation_percent || 0)));
    return (
      <article className={styles.resourceCard}>
        <div className={styles.resourceCopy}><span><Icon type={icon} /> {label}</span><strong>{allocated.value}<small> / {capacity.value} {capacity.unit}</small></strong><p>{t('cluster.remaining')} {remainingDisplay.value} {remainingDisplay.unit}</p></div>
        <Progress type="dashboard" percent={percent} width={92} strokeWidth={9} format={value => `${displayNumber(value, 0)}%`} />
      </article>
    );
  }

  renderClusterOverview() {
    const { errors } = this.props.overview;
    const snapshot = this.getCurrentSnapshot();
    const cluster = this.getCurrentCluster();
    const resources = overviewData.sectionData(snapshot, 'resources');
    const nodes = overviewData.sectionData(snapshot, 'nodes');
    const resourceStatus = overviewData.sectionStatus(snapshot, 'resources');
    const nodeStatus = overviewData.sectionStatus(snapshot, 'nodes');
    const clusterInfo = overviewData.sectionData(snapshot, 'cluster') || cluster;
    const alerts = (nodes && nodes.alerts) || [];
    const versions = (resources && resources.versions) || {};
    return (
      <OverviewModule title={t('cluster.title')} description={clusterInfo ? `${clusterInfo.region_alias || clusterInfo.region_name} · ${clusterInfo.provider || '-'}` : ''} loading={!snapshot && !errors.cluster} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={clusterInfo ? <Button type="link" onClick={this.jumpCluster}>{t('common.details')} <Icon type="arrow-right" /></Button> : null}>
        {snapshot ? (
          <div className={`${styles.clusterOverview} ${alerts.length ? styles.withClusterAlerts : ''}`}>
            <div className={styles.clusterMain}>
              <div className={styles.clusterMeta}>
                <div><span><Icon type="cloud-server" /></span><strong>{clusterInfo.region_alias || clusterInfo.region_name}</strong><small>{clusterInfo.region_name}</small></div>
                <div><small>{t('cluster.rainbondVersion')}</small><strong>{overviewData.compactVersion(versions.rainbond)}</strong></div>
                <div><small>{t('cluster.kubernetesVersion')}</small><strong>{versions.kubernetes || '-'}</strong></div>
              </div>
              {resources ? (
                <div className={styles.clusterResources}>
                  {this.renderResourceCard(t('cluster.cpu'), 'dashboard', resources.cpu, false)}
                  {this.renderResourceCard(t('cluster.memory'), 'database', resources.memory, true)}
                  <article className={styles.countCard}><span>{t('cluster.readyNodes')}</span><strong>{nodes ? nodes.ready : '-'}<small> / {nodes ? nodes.total : '-'}</small></strong><p>{nodes ? (nodes.ready === nodes.total ? t('cluster.allReady') : t('cluster.hasException')) : t('global.unavailable')}</p></article>
                  <article className={styles.countCard}><span>{t('cluster.runningPods')}</span><strong>{resources.pods.running !== null ? resources.pods.running : '-'}<small>{resources.pods.total !== null ? ` / ${resources.pods.total}` : ''}</small></strong><p>{t('cluster.podDescription')}</p></article>
                </div>
              ) : resourceStatus === 'loading' ? <Skeleton active paragraph={{ rows: 2 }} /> : <Alert type="warning" showIcon message={t('cluster.resourcesUnavailable')} />}
              {nodeStatus !== 'ok' && nodeStatus !== 'loading' ? <Alert className={styles.sectionWarning} type="warning" showIcon message={t('cluster.nodesUnavailable')} /> : null}
            </div>
            {alerts.length ? (
              <aside className={styles.clusterAlerts}>
                <header><span><Icon type="alert" /> {t('cluster.alerts')}</span><Badge count={alerts.length} /></header>
                <div>{alerts.map((alert, index) => {
                  const translation = overviewData.nodeAlertTranslation(alert);
                  const values = translation.id === 'cluster.diskUsage'
                    ? { filesystem: t(`cluster.filesystem.${translation.values.filesystem}`), percent: translation.values.percent }
                    : translation.values;
                  return <button type="button" key={`${alert.type}-${alert.node_name}-${index}`} onClick={() => this.jumpNode(alert)}><Icon type={alert.severity === 'critical' ? 'close-circle' : 'warning'} /><span><strong>{alert.node_name || t('cluster.unknownNode')}</strong><small>{t(translation.id, values)}</small></span><Icon type="right" /></button>;
                })}</div>
              </aside>
            ) : null}
          </div>
        ) : null}
      </OverviewModule>
    );
  }

  renderMonitoring() {
    const { metric, timeRange } = this.state;
    const { loading, errors } = this.props.overview;
    const currentMetrics = this.getCurrentMetrics();
    const metricState = overviewData.metricState(currentMetrics);
    const data = metricState.data;
    const points = metricState.points;
    const lastValue = points.length ? points[points.length - 1][1] : null;
    const units = { cpu: '%', memory: '%', network: 'B/s' };
    return (
      <OverviewModule title={t('monitor.title')} description={lastValue === null ? t('monitor.description') : t('monitor.current', { value: displayNumber(lastValue, metric === 'network' ? 0 : 1), unit: units[metric] })} className={styles.monitorModule} loading={!errors.metrics && (metricState.status === 'loading' || (loading.metrics && !data))} error={errors.metrics} onRetry={this.loadMetrics} extra={<div className={styles.monitorControls}><Button.Group>{['cpu', 'memory', 'network'].map(key => <Button key={key} type={metric === key ? 'primary' : 'default'} onClick={() => this.handleMetricChange(key)}>{t(`monitor.${key}`)}</Button>)}</Button.Group><Select value={timeRange} onChange={this.handleRangeChange}>{['1h', '6h', '24h'].map(value => <Option key={value} value={value}>{value}</Option>)}</Select></div>}>
        {data ? <ResourceTrend data={data} metric={metric} unitLabel={units[metric]} emptyText={t('monitor.empty')} /> : metricState.status === 'unavailable' || metricState.status === 'partial' ? <Alert type="warning" showIcon message={t('monitor.unavailable')} /> : null}
      </OverviewModule>
    );
  }

  renderServices() {
    const snapshot = this.getCurrentSnapshot();
    const { errors } = this.props.overview;
    const componentSection = overviewData.sectionEnvelope(snapshot, 'components');
    const pluginSection = overviewData.sectionEnvelope(snapshot, 'plugins');
    const components = componentSection.status === 'ok' ? componentSection.data : null;
    const plugins = pluginSection.status === 'ok' ? pluginSection.data : null;
    const representative = overviewData.representativeComponents(components);
    const componentHealthy = (components || []).filter(item => overviewData.isRunning(item.status)).length;
    const pluginHealthy = (plugins || []).filter(item => overviewData.isRunning(item.status)).length;
    return (
      <OverviewModule title={t('services.title')} description={components ? t('services.summary', { healthy: componentHealthy, total: components.length }) : ''} className={styles.servicesModule} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={<Button type="link" onClick={this.jumpCluster}>{t('common.details')} <Icon type="arrow-right" /></Button>}>
        <div className={styles.servicesBody}>
          <div className={styles.sectionTitle}><span>{t('services.components')}</span><small>{components ? `${componentHealthy}/${components.length}` : '-'}</small></div>
          {components ? <div className={styles.componentGrid}>{representative.map(component => { const healthy = overviewData.isRunning(component.status); return <button type="button" key={component.name} onClick={this.jumpCluster}><Badge status={healthy ? 'success' : 'error'} /><span><strong>{component.name}</strong><small>{component.run_pods}/{component.all_pods} {t('services.ready')}</small></span></button>; })}</div> : componentSection.status === 'loading' ? (!errors.cluster ? <Skeleton className={styles.sectionSkeleton} active paragraph={{ rows: 2 }} /> : null) : <Alert type="warning" showIcon message={t('services.componentsUnavailable')} />}
          <div className={styles.pluginHeader}><div className={styles.sectionTitle}><span>{t('services.plugins')}</span><small>{plugins ? t('services.pluginSummary', { healthy: pluginHealthy, total: plugins.length }) : '-'}</small></div><Button type="link" size="small" onClick={this.jumpExtension}>{t('services.allPlugins')}</Button></div>
          {plugins ? (plugins.length ? <div className={styles.pluginList} tabIndex="0" role="list" aria-label={t('services.plugins')}>{plugins.map(plugin => { const runtime = overviewData.pluginRuntimeState(plugin.status); return <button type="button" key={plugin.name} onClick={this.jumpExtension}><span className={styles.pluginIcon}><Icon type="api" /></span><span><strong>{plugin.alias || plugin.display_name || plugin.name}</strong><small>{plugin.name}</small></span><Tag className={`${styles.pluginRuntime} ${styles[runtime.className]}`}>{t(runtime.labelId)}</Tag></button>; })}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('services.noPlugins')} />) : pluginSection.status === 'loading' ? (!errors.cluster ? <Skeleton className={styles.sectionSkeleton} active paragraph={{ rows: 2 }} /> : null) : <Alert type="warning" showIcon message={t('services.pluginsUnavailable')} />}
        </div>
      </OverviewModule>
    );
  }

  renderTeamRanking() {
    const snapshot = this.getCurrentSnapshot();
    const { errors } = this.props.overview;
    const teamSection = overviewData.sectionEnvelope(snapshot, 'teams');
    const teams = teamSection.status === 'ok' ? teamSection.data : null;
    const { teamMetric } = this.state;
    const field = { cpu: 'cpu_cores', memory: 'memory_gib', applications: 'applications' }[teamMetric];
    const unit = { cpu: 'Core', memory: 'GiB', applications: t('common.countUnit') }[teamMetric];
    const list = (teams && teams[teamMetric]) || [];
    const max = list.length ? Number(list[0][field] || 0) : 0;
    return (
      <OverviewModule title={t('teams.title')} description={t('teams.description')} className={styles.halfModule} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={<Button.Group>{['cpu', 'memory', 'applications'].map(key => <Button key={key} type={teamMetric === key ? 'primary' : 'default'} onClick={() => this.setState({ teamMetric: key })}>{t(`teams.${key}`)}</Button>)}</Button.Group>}>
        {teams ? (list.length ? <div className={styles.teamRanking}>{list.map((team, index) => <button type="button" key={team.tenant_id} onClick={() => this.jump(`/team/${team.tenant_name}/region/${this.state.selectedRegion}/index`)}><span className={styles.rank}>{index + 1}</span><span className={styles.teamName}><strong>{team.tenant_alias || team.tenant_name}</strong><span><i style={{ width: `${max ? Number(team[field] || 0) * 100 / max : 0}%` }} /></span></span><span className={styles.teamValue}>{displayNumber(team[field], 2)} <small>{unit}</small></span></button>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('teams.empty')} />) : teamSection.status === 'loading' ? (!errors.cluster ? <Skeleton active paragraph={{ rows: 4 }} /> : null) : <Alert type="warning" showIcon message={t('teams.unavailable')} />}
      </OverviewModule>
    );
  }

  renderGateway() {
    const snapshot = this.getCurrentSnapshot();
    const { errors } = this.props.overview;
    const gatewaySection = overviewData.sectionEnvelope(snapshot, 'gateway');
    const gateway = gatewaySection.status === 'ok' ? gatewaySection.data : null;
    if (gatewaySection.status === 'empty') return null;
    const issues = (gateway && gateway.issues) || [];
    const expiring = ((gateway && gateway.certificates) || []).filter(item => item.status !== 'normal').length;
    return (
      <OverviewModule title={t('gateway.title')} description={t('gateway.description')} className={styles.halfModule} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={gateway && issues.length ? <Button type="link" onClick={() => this.setState({ gatewayModalVisible: true })}>{t('gateway.viewIssues', { count: issues.length })}</Button> : null}>
        {gateway ? <React.Fragment><div className={styles.gatewayMetrics}><div><span>{t('gateway.httpDomains')}</span><strong>{gateway.http_domains}</strong></div><div><span>{t('gateway.tcpRoutes')}</span><strong>{gateway.tcp_routes}</strong></div><div><span>{t('gateway.certificates')}</span><strong>{(gateway.certificates || []).length}</strong><small>{t('gateway.expiring', { count: expiring })}</small></div></div><button type="button" className={`${styles.gatewayStatus} ${issues.length ? styles.gatewayWarning : ''}`} onClick={() => issues.length && this.setState({ gatewayModalVisible: true })}><Icon type={issues.length ? 'warning' : 'safety-certificate'} /><span><strong>{issues.length ? t('gateway.hasIssues', { count: issues.length }) : t('gateway.healthy')}</strong><small>{issues.length ? t('gateway.issueDescription') : t('gateway.healthyDescription')}</small></span>{issues.length ? <Icon type="right" /> : null}</button></React.Fragment> : gatewaySection.status === 'loading' ? (!errors.cluster ? <Skeleton active paragraph={{ rows: 3 }} /> : null) : <Alert type="warning" showIcon message={t('gateway.unavailable')} />}
      </OverviewModule>
    );
  }

  renderModals() {
    const enterprise = this.props.enterprise || {};
    const rainbondInfo = this.props.rainbondInfo || {};
    const { runtime } = this.props.overview;
    const snapshot = this.getCurrentSnapshot();
    const gateway = overviewData.sectionData(snapshot, 'gateway') || {};
    const appItems = (((runtime && runtime.global) || {}).application_alarms || {}).items || [];
    const platform = { name: enterprise.enterprise_alias || enterprise.enterprise_name || 'Rainbond', version: overviewData.compactVersion(rainbondInfo.version && rainbondInfo.version.value), createdAt: enterprise.create_time, enterpriseId: this.getEnterpriseId() };
    const labels = { name: t('modal.name'), version: t('modal.version'), createdAt: t('modal.createdAt'), enterpriseId: t('modal.enterpriseId'), license: t('modal.license'), updateLicense: t('modal.updateLicense'), authorizationPlaceholder: t('modal.authorizationPlaceholder'), authorizationRequired: t('modal.authorizationRequired'), save: t('modal.save'), cancel: t('modal.cancel'), licenseUnavailable: t('modal.licenseUnavailable'), company: t('modal.company'), expireAt: t('modal.expireAt'), clusterLimit: t('modal.clusterLimit'), unlimited: t('modal.unlimited'), notApplicable: t('modal.notApplicable'), validLicense: t('modal.validLicense'), invalidLicense: t('modal.invalidLicense'), invalidReasonUnknown: t('modal.invalidReasonUnknown'), allowedPlugins: t('modal.allowedPlugins'), noPlugins: t('modal.noPlugins'), noLicense: t('modal.noLicense') };
    return (
      <React.Fragment>
        <PlatformInfoModal visible={this.state.platformModalVisible} onCancel={() => this.setState({ platformModalVisible: false })} onUpdateLicense={this.handleUpdateLicense} title={t('modal.platformInfo')} labels={labels} platform={platform} license={this.state.license} requestStatus={this.state.licenseStatus} requestError={this.state.licenseStatusReason} updating={this.state.licenseUpdating} />
        <IssueModal visible={this.state.applicationModalVisible} onCancel={() => this.setState({ applicationModalVisible: false })} title={t('issues.appTitle')} labels={{ open: t('issues.openComponent') }} onOpen={this.jumpApplicationIssue} items={appItems.map(item => ({ ...item, key: item.service_id, severity: 'critical', title: item.service_alias || item.service_name, description: t('issues.componentAbnormal'), owner: `${item.tenant_alias || item.tenant_name || '-'} / ${item.application_name || '-'} / ${item.region_name}` }))} />
        <IssueModal visible={this.state.gatewayModalVisible} onCancel={() => this.setState({ gatewayModalVisible: false })} title={t('issues.gatewayTitle')} labels={{ open: t('issues.openApplication') }} onOpen={this.jumpGatewayIssue} items={(gateway.issues || []).map((item, index) => ({ ...item, key: `${item.domain}-${index}`, title: item.domain, description: item.expires_at ? t('issues.certificateExpires', { date: moment(item.expires_at).format('YYYY-MM-DD') }) : t('issues.certificateUnknown'), owner: `${item.tenant_name || '-'} / ${item.service_alias || item.service_name || '-'}` }))} />
      </React.Fragment>
    );
  }

  render() {
    const { shell, loading, errors } = this.props.overview;
    return (
      <main className={styles.page}>
        {this.renderPlatformHeader()}
        {errors.shell && !shell ? <div className={styles.shellError}><Alert type="error" showIcon message={t('shell.failed')} /><Button onClick={this.loadPlatformData}>{t('common.retry')}</Button></div> : null}
        {loading.shell && !shell ? <div className={styles.pageSkeleton}><Skeleton active paragraph={{ rows: 8 }} /></div> : null}
        {shell ? (
          <React.Fragment>
            {this.renderGlobalPosture()}
            {this.renderScopeSelector()}
            {this.state.selectedRegion ? <React.Fragment>{this.renderClusterOverview()}<div className={styles.primaryGrid}>{this.renderMonitoring()}{this.renderServices()}</div><div className={styles.secondaryGrid}>{this.renderTeamRanking()}{this.renderGateway()}</div></React.Fragment> : <Empty description={t('scope.empty')} />}
          </React.Fragment>
        ) : null}
        {this.renderModals()}
      </main>
    );
  }
}
