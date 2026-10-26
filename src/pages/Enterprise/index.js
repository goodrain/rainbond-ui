/* eslint-disable camelcase */
/* eslint-disable react/no-array-index-key */
import {
  Alert,
  Badge,
  Button,
  Empty,
  Icon,
  Modal,
  notification,
  Select,
  Skeleton,
  Tooltip
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
import ResourceGauge from './components/ResourceGauge';
import overviewData from './overviewData';
import styles from './index.less';

const { Option } = Select;
const SNAPSHOT_REFRESH_INTERVAL = 30000;
const METRICS_REFRESH_INTERVAL = 60000;
const t = (id, values) => formatMessage({ id: `platformOverview.${id}` }, values);

function displayNumber(value, precision = 1) {
  return overviewData.formatNumber(value, precision);
}

function componentIcon(name) {
  const icons = { 'rbd-api': 'api', 'rbd-gateway': 'global', 'rbd-worker': 'deployment-unit', 'rbd-app-ui': 'layout', 'rbd-monitor': 'area-chart', 'rbd-chaos': 'build', minio: 'database', 'rbd-db': 'database', 'rbd-mq': 'swap' };
  return icons[name] || 'cloud-server';
}

export function clusterRuntimeStatus(snapshot, failed) {
  if (!snapshot || failed) return 'unknown';
  const nodeSection = overviewData.sectionEnvelope(snapshot, 'nodes');
  const componentSection = overviewData.sectionEnvelope(snapshot, 'components');
  const nodes = nodeSection.data;
  const components = componentSection.data;
  const count = value => typeof value === 'number' && Number.isInteger(value) && value >= 0;
  const validNodes = nodes && count(nodes.total) && count(nodes.ready) && nodes.ready <= nodes.total;
  if (nodes && Array.isArray(nodes.alerts) && nodes.alerts.length) return 'abnormal';
  if (validNodes && nodes.ready < nodes.total) return 'abnormal';
  if (Array.isArray(components) && components.some(item => item && /^(abnormal|failed|error|pending|starting|stopped)$/i.test(item.status))) return 'abnormal';
  if (nodeSection.status !== 'ok' || componentSection.status !== 'ok' || !validNodes || nodes.total === 0 || nodes.disk_stats_status !== 'ok' || !Array.isArray(nodes.alerts) || !Array.isArray(components) || !components.length) return 'unknown';
  if (!components.every(item => item && overviewData.isRunning(item.status) && count(item.run_pods) && count(item.all_pods) && item.run_pods <= item.all_pods)) return 'unknown';
  if (components.some(item => item.run_pods < item.all_pods)) return 'abnormal';
  return 'normal';
}

function formatMemory(value) {
  if (!overviewData.isNumber(value)) return { value: '-', unit: 'GiB' };
  const number = Number(value);
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
    metric: 'memory',
    timeRange: '6h',
    teamMetric: 'memory',
    platformModalVisible: false,
    applicationModalVisible: false,
    gatewayModalVisible: false,
    pluginModalRegion: null,
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
    const context = `${selectedRegion}|${metric}|${timeRange}`;
    if (contexts.metrics === context) return metrics;
    // Keep the displayed range until its replacement arrives; never reuse another cluster or metric.
    const sameMetric = typeof contexts.metrics === 'string' && contexts.metrics.startsWith(`${selectedRegion}|${metric}|`);
    return sameMetric && overviewData.metricState(metrics).points.length ? metrics : null;
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
    const currentVersion =
      this.props.rainbondInfo &&
        this.props.rainbondInfo.version &&
        this.props.rainbondInfo.version.value;
    this.props.dispatch({
      type: 'global/fetchAllVersion',
      callback: response => {
        if (!this.mounted) return;
        const versions = Array.isArray(response && response.response_data)
          ? response.response_data
          : [];
        const latestVersion = overviewData.latestStableVersion(versions);
        if (!latestVersion || !currentVersion) {
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
    this.setState({ selectedRegion, pluginModalRegion: null }, () => {
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
    const { hasNewVersion, latestVersion, upgradeStatus, license, licenseStatus } = this.state;
    const overview = this.props.overview || {};
    const clusterSummary = overviewData.platformClusterSummary(overview.runtime, overview.errors && overview.errors.runtime);
    const licenseSummary = overviewData.platformLicenseSummary(license, licenseStatus);
    const enterpriseEdition = rainbondInfo.enterprise_edition &&
      (rainbondInfo.enterprise_edition.value === true || rainbondInfo.enterprise_edition.value === 'true');
    const licenseLabel = licenseSummary.level === 'healthy' && enterpriseEdition
      ? 'header.enterpriseLicenseValid'
      : licenseSummary.labelId;
    const licenseDate = licenseSummary.expireAt && moment.unix(licenseSummary.expireAt).isValid()
      ? moment.unix(licenseSummary.expireAt).format('YYYY-MM-DD')
      : '-';
    const summaryClasses = { healthy: styles.headerSummaryHealthy, warning: styles.headerSummaryWarning, unknown: styles.headerSummaryUnknown };
    const summaryIcon = { healthy: 'check-circle', warning: 'exclamation-circle', loading: 'loading' };
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
        <button type="button" className={styles.platformIdentity} title={name} aria-label={`${name} · ${t('header.viewDetails')}`} onClick={() => this.setState({ platformModalVisible: true })}>
          <span className={styles.platformLogo}><Icon type="cloud-server" /></span>
          <span><strong>{name}</strong><span className={`${styles.platformSummary} ${summaryClasses[clusterSummary.level] || ''}`} title={t(clusterSummary.labelId, clusterSummary.values)}><Icon type={summaryIcon[clusterSummary.level] || 'info-circle'} /><span>{t(clusterSummary.labelId, clusterSummary.values)}</span></span></span>
          <Icon type="right" />
        </button>
        <div className={styles.platformFacts}>
          <div className={styles.platformFact}><small>{t('header.platformVersion')}</small><strong title={currentVersion}>{currentVersion}</strong></div>
          <button type="button" className={styles.platformLicenseFacts} aria-label={t('header.viewLicense')} onClick={() => this.setState({ platformModalVisible: true })}>
            <span className={styles.platformFact}><small>{t('header.licenseStatus')}</small><strong className={summaryClasses[licenseSummary.level] || ''} title={t(licenseLabel)}>{licenseSummary.level === 'loading' ? <Icon type="loading" /> : null}{t(licenseLabel)}</strong></span>
            <span className={styles.platformFact}><small>{t('header.licenseExpires')}</small><strong>{licenseDate}</strong></span>
          </button>
        </div>
        {upgradeAvailable ? (
          <button type="button" className={styles.upgradeAction} onClick={() => this.jump(`/enterprise/${this.getEnterpriseId()}/setting?type=updateVersion`)}>
            <span className={styles.upgradeIcon}><Icon type="rocket" /></span>
            <span><small>{t('header.newVersion', { version: overviewData.compactVersion(latestVersion) })}</small><strong>{t('header.upgradeNow')} <Icon type="arrow-right" /></strong></span>
          </button>
        ) : upgradeStatus === 'success' ? (
          <span className={overviewData.isDevelopmentVersion(rainbondInfo.version && rainbondInfo.version.value) ? styles.versionUnknown : styles.versionCurrent}><Icon type={overviewData.isDevelopmentVersion(rainbondInfo.version && rainbondInfo.version.value) ? 'code' : 'check-circle'} /> {t(overviewData.isDevelopmentVersion(rainbondInfo.version && rainbondInfo.version.value) ? 'header.development' : 'header.latest')}</span>
        ) : (
          <span className={styles.versionUnknown}><Icon type={upgradeStatus === 'loading' ? 'loading' : 'question-circle'} /> {upgradeStatus === 'loading' ? t('header.upgradeChecking') : t('header.upgradeUnavailable')}</span>
        )}
      </section>
    );
  }

  renderRuntimeNotice(availability) {
    if (availability.kind === 'ok' || availability.kind === 'loading') return null;
    const { loading, updatedAt } = this.props.overview;
    const sections = availability.missing.map(name => t(`global.section.${name}`)).join(t('global.listSeparator'));
    const description = availability.kind === 'stale' ? t('global.runtimeStale') :
      availability.kind === 'unavailable' ? t('global.runtimeFailed') :
        sections ? t('global.runtimeMissing', { sections }) : t('global.runtimePartialUnknown');
    const previousTime = updatedAt && updatedAt.runtime && moment(updatedAt.runtime).isValid()
      ? moment(updatedAt.runtime).format('MM-DD HH:mm:ss') : null;
    const details = [
      availability.regions.length ? t('global.affectedClusters', { names: availability.regions.join(t('global.listSeparator')) }) : null,
      availability.kind === 'stale' && previousTime ? t('global.lastSuccess', { time: previousTime }) : null
    ].filter(Boolean);
    return <Alert className={styles.inlineAlert} type="warning" showIcon message={
      <div className={styles.runtimeNotice}><span><strong>{availability.kind === 'stale' ? t('global.runtimeStaleTitle') : description}</strong>{availability.kind === 'stale' ? <span>{description}</span> : null}
        {details.length ? <Tooltip title={<div>{details.map(detail => <p key={detail}>{detail}</p>)}</div>}><Icon type="info-circle" tabIndex={0} aria-label={details.join(' ')} /></Tooltip> : null}
      </span><Button type="link" size="small" aria-label={t('common.retry')} loading={loading.runtime} onClick={this.loadRuntime}>{t('common.retry')}</Button></div>
    } />;
  }

  renderGlobalPosture() {
    const { shell, runtime, loading, errors } = this.props.overview;
    const quick = (shell && shell.global) || {};
    const alarmState = overviewData.runtimeSection(runtime, 'application_alarms');
    const nodeState = overviewData.runtimeSection(runtime, 'nodes');
    const clusterState = overviewData.runtimeSection(runtime, 'clusters');
    const applicationState = overviewData.runtimeSection(runtime, 'applications');
    const componentState = overviewData.runtimeSection(runtime, 'components');
    const alarms = alarmState.data || {};
    const workloadsAvailable = applicationState.data && componentState.data;
    const alarmAvailable = alarmState.status === 'ok' || alarmState.status === 'partial';
    const availability = overviewData.runtimeAvailability(runtime, errors.runtime);
    const clusterCounts = clusterState.data || {};
    const clusterDetails = [
      overviewData.isNumber(clusterCounts.healthy) ? { key: 'healthy', label: t('global.healthyCount', { count: clusterCounts.healthy }) } : null,
      Number(clusterCounts.warning) > 0 ? { key: 'warning', label: t('global.abnormalCount', { count: clusterCounts.warning }), className: styles.metricRisk } : null,
      Number(clusterCounts.unavailable) > 0 ? { key: 'unknown', label: t('global.unknownCount', { count: clusterCounts.unavailable }), className: styles.metricUnknown } : null
    ].filter(Boolean);
    const clusterDetail = clusterDetails.length ? clusterDetails.map((item, index) => <React.Fragment key={item.key}>{index ? ' · ' : ''}<span className={item.className}>{item.label}</span></React.Fragment>) : clusterState.status === 'loading' ? '-' : t('global.unavailable');
    const notReady = nodeState.data && overviewData.isNumber(nodeState.data.total) && overviewData.isNumber(nodeState.data.ready)
      ? Math.max(0, Number(nodeState.data.total) - Number(nodeState.data.ready)) : null;
    const nodeDetail = notReady > 0 ? <span className={styles.metricRisk}>{t(nodeState.status === 'partial' ? 'global.knownNotReadyCount' : 'global.notReadyCount', { count: notReady })}</span> :
      nodeState.status === 'partial' ? t('global.knownReadyCount', { count: nodeState.data && overviewData.isNumber(nodeState.data.ready) ? nodeState.data.ready : '-' }) :
        nodeState.status === 'ok' && nodeState.data ? t('global.readyCount', { count: displayNumber(nodeState.data.ready, 0) }) : nodeState.status === 'loading' ? '-' : t('global.unavailable');
    const metrics = [
      { icon: 'cluster', label: t('global.clusters'), value: quick.clusters, detail: clusterDetail },
      { icon: 'deployment-unit', label: t('global.nodes'), value: nodeState.status === 'loading' ? undefined : nodeState.status === 'unavailable' ? '-' : nodeState.data && overviewData.isNumber(nodeState.data.total) ? nodeState.data.total : '-', detail: nodeDetail },
      { icon: 'team', label: t('global.teams'), value: quick.teams, detail: t('global.platformScope') },
      { icon: 'user', label: t('global.users'), value: quick.users, detail: t('global.activeUsers') },
      { icon: 'appstore', label: t('global.workloads'), value: workloadsAvailable ? `${applicationState.data.total} / ${componentState.data.total}` : quick.applications !== undefined ? `${quick.applications} / ${quick.components}` : undefined, detail: applicationState.status === 'ok' && componentState.status === 'ok' ? t('global.workloadCounts') : t('global.partialData') },
      { icon: 'alert', label: t('global.appAlarms'), value: alarmState.status === 'loading' ? undefined : alarmAvailable ? alarms.total : '-', detail: alarmState.status === 'loading' ? '-' : alarmState.status === 'ok' ? (alarms.total ? t('global.viewAlarms') : t('global.none')) : alarmState.status === 'partial' ? t('global.partialData') : t('global.unavailable'), warning: alarmAvailable && alarms.total > 0, action: alarmAvailable && alarms.total > 0 ? () => this.setState({ applicationModalVisible: true }) : null }
    ];
    return (
      <OverviewModule title={t('global.title')} loading={loading.shell && !shell} error={errors.shell} onRetry={this.loadPlatformData}>
        {shell ? (
          <div className={styles.globalMetrics}>
            {metrics.map(item => {
              const MetricElement = item.action ? 'button' : 'article';
              return <MetricElement type={item.action ? 'button' : undefined} key={item.label} className={`${styles.globalMetric} ${item.action ? styles.metricAction : ''} ${item.warning ? styles.warningMetric : ''}`} onClick={item.action || undefined}>
                <span className={styles.metricLabel}>{item.label}<Icon type={item.icon} /></span>
                <strong>{item.value === undefined ? <Skeleton active title={{ width: 36 }} paragraph={false} /> : item.value}</strong><em>{item.detail}{item.action ? <Icon type="right" /> : null}</em>
              </MetricElement>;
            })}
          </div>
        ) : null}
        {shell ? this.renderRuntimeNotice(availability) : null}
      </OverviewModule>
    );
  }

  renderScopeSelector() {
    const { shell } = this.props.overview;
    const clusters = (shell && shell.clusters) || [];
    if (clusters.length <= 1) return null;
    return (
      <div className={styles.scopeBar}>
        <div className={styles.scopeContext}>
          <span className={styles.scopeLabel}><span className={styles.scopeIcon}><Icon type="cluster" /></span><strong>{t('scope.title')}</strong></span>
          <Select
            aria-label={t('scope.title')}
            value={this.state.selectedRegion || undefined}
            placeholder={t('scope.empty')}
            onChange={this.handleClusterChange}
            disabled={!clusters.length}
            showSearch={clusters.length > 5}
            optionLabelProp="label"
            optionFilterProp="searchText"
            dropdownClassName={styles.clusterDropdown}
            className={styles.clusterSelect}
          >
            {clusters.map(cluster => (
              <Option key={cluster.region_name} value={cluster.region_name} label={cluster.region_alias || cluster.region_name} title={cluster.region_alias || cluster.region_name} searchText={`${cluster.region_alias || ''} ${cluster.region_name}`}>
                <span className={styles.clusterOption}><Icon type="cluster" /><span><strong>{cluster.region_alias || cluster.region_name}</strong>{cluster.region_alias && cluster.region_alias !== cluster.region_name ? <small>{cluster.region_name}</small> : null}</span></span>
              </Option>
            ))}
          </Select>
        </div>
        <small className={styles.scopeHint}><Icon type="info-circle" />{t('scope.description')}</small>
      </div>
    );
  }

  renderResourceCard(label, icon, data, memory) {
    if (!data) return null;
    const allocated = memory ? formatMemory(data.allocated) : { value: displayNumber(data.allocated), unit: 'Core' };
    const capacity = memory ? formatMemory(data.capacity) : { value: displayNumber(data.capacity), unit: 'Core' };
    const remaining = overviewData.isNumber(data.capacity) && overviewData.isNumber(data.allocated) ? Math.max(0, Number(data.capacity) - Number(data.allocated)) : null;
    const remainingDisplay = memory ? formatMemory(remaining) : { value: displayNumber(remaining), unit: 'Core' };
    const percent = data.allocation_percent;
    return (
      <article className={styles.resourceCard}>
        <div className={styles.resourceHeading}><Icon type={icon} /> {label}</div>
        <div className={styles.resourceContent}><div className={styles.resourceCopy}><span>{t('cluster.allocated')}</span><strong>{allocated.value}<small> / {capacity.value} {capacity.unit}</small></strong><p>{t('cluster.remaining')} {remainingDisplay.value} {remainingDisplay.unit}</p></div>
          <ResourceGauge percent={percent} label={t('cluster.allocationRate')} />
        </div>
      </article>
    );
  }

  renderClusterOverview() {
    const { errors } = this.props.overview;
    const snapshot = this.getCurrentSnapshot();
    const cluster = this.getCurrentCluster();
    const resources = overviewData.sectionData(snapshot, 'resources');
    const nodes = overviewData.sectionData(snapshot, 'nodes');
    const nodeCountsKnown = nodes && overviewData.isNumber(nodes.ready) && overviewData.isNumber(nodes.total);
    const nodesNotReady = nodeCountsKnown ? Math.max(0, Number(nodes.total) - Number(nodes.ready)) : null;
    const resourceStatus = overviewData.sectionStatus(snapshot, 'resources');
    const nodeStatus = overviewData.sectionStatus(snapshot, 'nodes');
    const clusterInfo = overviewData.sectionData(snapshot, 'cluster') || cluster;
    const alerts = (nodes && nodes.alerts) || [];
    const versions = (resources && resources.versions) || {};
    const runtimeStatus = clusterRuntimeStatus(snapshot, errors.cluster);
    return (
      <OverviewModule title={t('cluster.title')} loading={!snapshot && !errors.cluster} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={clusterInfo ? <Button type="link" onClick={this.jumpCluster}>{t('cluster.enterManagement')} <Icon type="arrow-right" /></Button> : null}>
        {snapshot ? (
          <div className={`${styles.clusterOverview} ${alerts.length ? styles.withClusterAlerts : ''}`}>
            <div className={styles.clusterMain}>
              <div className={styles.clusterMeta}>
                <div><span><Icon type="cloud-server" /></span><strong>{clusterInfo.region_alias || clusterInfo.region_name}</strong><small className={styles.clusterIdentityLine}><span className={`${styles.clusterRuntimeBadge} ${styles[`clusterRuntime${runtimeStatus}`]}`}><i aria-hidden="true" />{t(`common.${runtimeStatus}`)}</span><span>{clusterInfo.region_name}</span>{clusterInfo.provider ? <span>{clusterInfo.provider}</span> : null}</small></div>
                <div><small>{t('cluster.rainbondVersion')}</small><strong>{overviewData.compactVersion(versions.rainbond)}</strong></div>
                <div><small>{t('cluster.kubernetesVersion')}</small><strong>{versions.kubernetes || '-'}</strong></div>
              </div>
              {resources ? (
                <div className={styles.clusterResources}>
                  {this.renderResourceCard(t('cluster.cpu'), 'dashboard', resources.cpu, false)}
                  {this.renderResourceCard(t('cluster.memory'), 'database', resources.memory, true)}
                  <article className={`${styles.countCard} ${nodesNotReady > 0 ? styles.countWarning : !nodeCountsKnown || !Number(nodes.total) ? styles.countUnavailable : ''}`}><span>{t('cluster.readyNodes')}<Icon type="deployment-unit" /></span><strong>{nodes ? displayNumber(nodes.ready, 0) : '-'}<small> / {nodes ? displayNumber(nodes.total, 0) : '-'}</small></strong><p>{!nodeCountsKnown ? t('global.unavailable') : !Number(nodes.total) ? t('cluster.noNodes') : nodesNotReady > 0 ? t('global.notReadyCount', { count: nodesNotReady }) : t('cluster.allReady')}</p></article>
                  <article className={styles.countCard}><span>{t(overviewData.isNumber(resources.pods.running) ? 'cluster.runningPods' : 'cluster.workloadPods')}<Icon type="appstore" /></span><strong>{displayNumber(overviewData.isNumber(resources.pods.running) ? resources.pods.running : resources.pods.active, 0)}</strong><p>{t(overviewData.isNumber(resources.pods.running) ? 'cluster.podDescription' : 'cluster.legacyPods')}</p></article>
                </div>
              ) : resourceStatus === 'loading' ? <Skeleton active paragraph={{ rows: 2 }} /> : <Alert type="warning" showIcon message={t('cluster.resourcesUnavailable')} />}
              {nodeStatus !== 'ok' && nodeStatus !== 'loading' ? <Alert className={styles.sectionWarning} type="warning" showIcon message={t('cluster.nodesUnavailable')} /> : null}
              {nodes && ['partial', 'unavailable'].indexOf(nodes.disk_stats_status) > -1 ? <p className={styles.diskStatus}><Icon type="info-circle" /> {t('cluster.diskUnavailable')}</p> : null}
            </div>
            {alerts.length ? (
              <aside className={styles.clusterAlerts}>
                <header><span><Icon type="alert" /> {t('cluster.alerts')}</span><Badge count={alerts.length} /></header>
                <div>{alerts.map((alert, index) => {
                  const translation = overviewData.nodeAlertTranslation(alert);
                  const values = translation.id === 'cluster.diskUsage'
                    ? { filesystem: t(`cluster.filesystem.${translation.values.filesystem}`), percent: translation.values.percent }
                    : { ...translation.values, ...(translation.values.date ? { date: moment(translation.values.date).isValid() ? moment(translation.values.date).format('YYYY-MM-DD HH:mm:ss Z') : translation.values.date } : {}) };
                  return <button type="button" className={alert.severity === 'critical' ? styles.criticalAlert : undefined} key={`${alert.type}-${alert.node_name}-${index}`} onClick={() => this.jumpNode(alert)}><Icon type={alert.severity === 'critical' ? 'close-circle' : 'warning'} /><span><strong>{alert.node_name || t('cluster.unknownNode')}</strong>{alert.severity === 'critical' ? <em>{t('cluster.severityCritical')}</em> : null}<small>{t(translation.id, values)}</small></span><Icon type="right" /></button>;
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
    const current = metric === 'network' ? overviewData.formatThroughput(lastValue) : { value: displayNumber(lastValue), unit: '%' };
    const hasPoints = data && points.length > 0;
    const metricLabel = t(metric === 'network' ? 'monitor.networkTotal' : metric === 'memory' && currentMetrics && currentMetrics.semantics === 'host_memory_working_set' ? 'monitor.memoryWorkingSetRatio' : `monitor.${metric}Usage`);
    const usageLabel = t(metric === 'memory' && currentMetrics && currentMetrics.semantics === 'host_memory_working_set' ? 'monitor.workingSetUsage' : 'monitor.actualUsage');
    const trendLabels = { usageLabel, unavailableLabel: t('monitor.absoluteUnavailable') };
    const unavailable = metricState.status === 'unavailable' || metricState.status === 'partial';
    return (
      <OverviewModule title={t('monitor.title')} className={`${styles.monitorModule} ${!hasPoints ? styles.monitorEmpty : ''}`} loading={!errors.metrics && (metricState.status === 'loading' || (loading.metrics && !currentMetrics))} error={errors.metrics} onRetry={this.loadMetrics}>
        <div className={styles.chartToolbar}>
          {hasPoints ? <div className={styles.chartSummary}><strong>{current.value}<small>{current.unit}</small></strong><span>{metricLabel}<small>{t('monitor.latestSample')} · {moment(points[points.length - 1][0]).format('MM-DD HH:mm')}</small></span></div> : null}
          <div className={styles.monitorControls}><div className={styles.segmentedControl} role="group" aria-label={t('monitor.metricLabel')}>{['memory', 'cpu', 'network'].map(key => <button type="button" key={key} aria-pressed={metric === key} className={metric === key ? styles.segmentActive : ''} onClick={() => this.handleMetricChange(key)}>{t(`monitor.${key}`)}</button>)}</div><Select size="small" value={timeRange} onChange={this.handleRangeChange}>{['1h', '6h', '24h'].map(value => <Option key={value} value={value}>{value}</Option>)}</Select></div>
        </div>
        {hasPoints ? <React.Fragment><ResourceTrend {...trendLabels} data={data} metric={metric} seriesLabel={metricLabel} unitLabel={units[metric]} emptyText={t('monitor.empty')} /><div className={`${styles.chartLegend} ${styles[`legend${metric}`]}`}><span className={styles.legendSwatch} aria-hidden="true" />{metricLabel}{metric === 'network' ? <Tooltip title={t('monitor.networkDescription')}><Icon type="info-circle" /></Tooltip> : null}</div></React.Fragment> : currentMetrics && !errors.metrics ? <div className={styles.monitorEmptyState}><Icon type={unavailable ? 'disconnect' : 'area-chart'} /><strong>{t(unavailable ? 'monitor.unavailableTitle' : 'monitor.empty')}</strong><p>{t(unavailable ? 'monitor.unavailable' : 'monitor.emptyDescription')}</p><Button size="small" onClick={this.loadMetrics}>{t('common.retry')}</Button></div> : null}
        {currentMetrics ? <div className={styles.metricSource}><Tooltip title={<span>{t('monitor.coverageDescription')}{currentMetrics.semantics === 'host_memory_working_set' ? <React.Fragment><br />{t('monitor.workingSet')}</React.Fragment> : null}</span>}><small tabIndex={0}><Icon type="info-circle" /> {t(currentMetrics.coverage === 'scrape_targets' ? 'monitor.scrapeCoverage' : 'monitor.unknownCoverage')}</small></Tooltip></div> : null}
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
    const componentStates = (components || []).map(overviewData.componentVisualState);
    const componentHealthy = componentStates.filter(item => item.level === 'healthy').length;
    const componentAbnormal = componentStates.filter(item => item.level === 'warning').length;
    const componentUnknown = componentStates.filter(item => item.level === 'unknown').length;
    const componentStarting = componentStates.filter(item => item.level === 'starting').length;
    const restartRecords = (components || []).map(component => ({ component, restarts: overviewData.componentRestarts(component) }))
      .filter(item => item.restarts.count > 0);
    const restartDetails = restartRecords.length ? <div><p>{t('services.restartAffected', { count: restartRecords.length })}</p>
      {restartRecords.map(({ component, restarts }) => <div key={component.name}>{component.name} · {t(restarts.complete ? 'services.restartCount' : 'services.restartCountAtLeast', { count: restarts.count })}</div>)}
      {restartRecords.some(item => !item.restarts.complete) ? <p>{t('services.restartPartial')}</p> : null}
      <p>{t('services.restartScope')}</p><p>{t('services.restartMeaning')}</p>
    </div> : null;
    const componentSummary = errors.cluster && components ? t('services.previousState') : !components ? t('services.statusUnknown') : !components.length ? t('services.noComponents') :
      componentAbnormal ? t('services.abnormalCount', { count: componentAbnormal }) : componentUnknown ? t('services.unknownCount', { count: componentUnknown }) :
        componentStarting ? t('services.startingCount', { count: componentStarting }) : t('services.summary', { healthy: componentHealthy, total: components.length });
    const summaryClass = errors.cluster ? styles.serviceUnknown : componentAbnormal ? styles.serviceWarning : components && components.length && componentHealthy === components.length ? styles.serviceHealthy : styles.serviceUnknown;
    const presentation = overviewData.pluginPresentation(plugins);
    return (
      <OverviewModule title={t('services.title')} className={styles.servicesModule} error={errors.cluster} onRetry={this.loadClusterSnapshot}>
        <div className={styles.servicesBody}>
          <div className={styles.componentPanel}><div className={styles.sectionTitle}><button type="button" onClick={this.jumpCluster}><Icon type="cloud-server" /> {t('services.components')} <Icon type="right" /></button><span className={styles.componentStatusGroup}><Tooltip title={components && components.length ? t('services.summary', { healthy: componentHealthy, total: components.length }) : componentSummary}><small className={`${styles.serviceStatus} ${summaryClass}`} tabIndex={0}><i aria-hidden="true" />{componentSummary}</small></Tooltip>
            {restartRecords.length ? <Tooltip trigger={['hover', 'focus']} title={restartDetails}><small className={styles.componentRestartSummary} tabIndex={0} aria-label={t('services.restartAffected', { count: restartRecords.length })}><Icon type="reload" />{t('services.restartGroups', { count: restartRecords.length })}</small></Tooltip> : null}
          </span></div>
          {components ? <div className={styles.componentGrid}>{representative.map(component => {
            const state = overviewData.componentVisualState(component);
            const restarts = overviewData.componentRestarts(component);
            const hasRestarts = restarts.count > 0;
            return <button type="button" key={component.name} onClick={this.jumpCluster} className={styles[state.className] || ''}><span className={styles.componentIcon}><Icon type={componentIcon(component.name)} /></span><span className={styles.componentCopy}><strong>{component.name}</strong><small className={styles.componentMeta}><span>{displayNumber(component.run_pods, 0)}/{displayNumber(component.all_pods, 0)} {t(state.level === 'healthy' ? hasRestarts ? 'services.readyShort' : 'services.ready' : state.labelId)}</span>
              {hasRestarts ? <Tooltip title={<span>{!restarts.complete ? <React.Fragment>{t('services.restartPartial')}<br /></React.Fragment> : null}{t('services.restartScope')}<br />{t('services.restartMeaning')}</span>}><span className={styles.componentRestartCount}>{t(restarts.complete ? 'services.restartCount' : 'services.restartCountAtLeast', { count: restarts.count })}</span></Tooltip> : null}
            </small></span><span className={styles.componentState} aria-label={t(state.labelId)} /><Icon type="right" className={styles.itemChevron} /></button>;
          })}</div> : componentSection.status === 'loading' ? (!errors.cluster ? <Skeleton className={styles.sectionSkeleton} active paragraph={{ rows: 2 }} /> : null) : <Alert type="warning" showIcon message={t('services.componentsUnavailable')} />}</div>
          <div className={styles.pluginPanel}><div className={styles.pluginHeader}><div className={styles.sectionTitle}><button type="button" onClick={this.jumpExtension}><Icon type="appstore" /> {t('services.plugins')}{plugins ? <span className={styles.pluginCount}>{plugins.length}</span> : null}</button></div><Button type="link" size="small" onClick={this.jumpExtension}>{t('services.allPlugins')} <Icon type="arrow-right" /></Button></div>
          <div className={styles.pluginSummary} aria-label={t('services.allPluginStates')}>{plugins ? presentation.summary.map(({ level, count, runtime }) => <span key={level} className={`${styles.pluginRuntime} ${styles[runtime.className]}`}><i />{t(runtime.labelId)} {count}</span>) : t('services.pluginStateDescription')}</div>
          {plugins ? (plugins.length ? <React.Fragment>{this.renderPluginList(presentation.preview)}{plugins.length > 8 ? <Button type="link" size="small" className={styles.viewAllPlugins} onClick={() => this.setState({ pluginModalRegion: this.state.selectedRegion })}>{t('services.viewAllPlugins', { count: plugins.length })} <Icon type="right" /></Button> : null}</React.Fragment> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('services.noPlugins')} />) : pluginSection.status === 'loading' ? (!errors.cluster ? <Skeleton className={styles.sectionSkeleton} active paragraph={{ rows: 2 }} /> : null) : <Alert type="warning" showIcon message={t('services.pluginsUnavailable')} />}</div>
        </div>
      </OverviewModule>
    );
  }

  renderPluginList(items, full = false) {
    return <div className={`${styles.pluginList}${full ? ` ${styles.fullPluginList}` : ''}`} role="list" aria-label={t('services.plugins')}>{items.map(({ plugin, runtime }) => <button type="button" key={plugin.name} onClick={this.jumpExtension} title={plugin.alias || plugin.display_name || plugin.name}><span className={styles.pluginIcon}><Icon type={overviewData.pluginIcon(plugin)} /></span><span className={styles.pluginCopy}><strong>{plugin.alias || plugin.display_name || plugin.name}</strong><small className={`${styles.pluginRuntime} ${styles[runtime.className]}`}><i />{t(runtime.labelId)}</small></span><Icon type="right" className={styles.itemChevron} /></button>)}</div>;
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
    const total = overviewData.teamRankingTotal(snapshot, teamMetric);
    const secondaryFields = ['memory', 'cpu', 'applications'].filter(key => key !== teamMetric);
    const fields = { cpu: 'cpu_cores', memory: 'memory_gib', applications: 'applications' };
    const units = { cpu: 'Core', memory: 'GiB', applications: t('common.countUnit') };
    return (
      <OverviewModule title={t('teams.title')} className={styles.halfModule} error={errors.cluster} onRetry={this.loadClusterSnapshot}>
        {teams ? (list.length ? <div className={styles.teamRanking}><div className={styles.rankingToolbar}><span><Icon type="team" /><span><strong>{t('teams.clusterTotal')} <em>{displayNumber(total, 2)} {unit}</em></strong><Tooltip title={t(teamMetric === 'applications' ? 'teams.applicationDescription' : 'teams.configuredDescription')}><small tabIndex={0}>{t(teamMetric === 'applications' ? 'teams.applicationSort' : 'teams.configuredSort')} <Icon type="info-circle" /></small></Tooltip></span></span><div className={styles.segmentedControl} role="group" aria-label={t('teams.metricLabel')}>{['memory', 'cpu', 'applications'].map(key => <button type="button" key={key} aria-pressed={teamMetric === key} className={teamMetric === key ? styles.segmentActive : ''} onClick={() => this.setState({ teamMetric: key })}>{t(`teams.${key}`)}</button>)}</div></div>{list.map((team, index) => {
          const percent = overviewData.teamRankingShare(team[field], total);
          return <button type="button" key={team.tenant_id} onClick={() => this.jump(`/team/${team.tenant_name}/region/${this.state.selectedRegion}/index`)}><span className={styles.rank}>{index + 1}</span><span className={styles.teamName}><span className={styles.teamLine}><strong>{team.tenant_alias || team.tenant_name}</strong><small>{secondaryFields.map(key => `${t(`teams.${key}`)} ${displayNumber(team[fields[key]], 1)} ${units[key]}`).join(' · ')}</small></span><span className={styles.teamTrack}><i style={{ width: `${percent === null ? 0 : Math.min(100, percent)}%` }} /></span></span><span className={styles.teamValue}><strong>{displayNumber(team[field], 2)} <small>{unit}</small></strong><em>{percent === null ? t('teams.shareUnavailable') : t(teamMetric === 'applications' ? 'teams.applicationShare' : 'teams.capacityShare', { percent: displayNumber(percent, 1) })}</em></span></button>;
        })}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('teams.empty')} />) : teamSection.status === 'loading' ? (!errors.cluster ? <Skeleton active paragraph={{ rows: 4 }} /> : null) : <Alert type="warning" showIcon message={t('teams.unavailable')} />}
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
    const StatusElement = issues.length ? 'button' : 'div';
    return (
      <OverviewModule title={t('gateway.title')} className={styles.halfModule} error={errors.cluster} onRetry={this.loadClusterSnapshot} extra={gateway && issues.length ? <Button type="link" onClick={() => this.setState({ gatewayModalVisible: true })}>{t('gateway.viewIssues', { count: issues.length })}</Button> : null}>
        {gateway ? <React.Fragment><div className={styles.gatewayMetrics}><div><span>{t('gateway.httpDomains')}</span><strong>{displayNumber(gateway.http_domains, 0)}</strong></div><div><span>{t('gateway.tcpRoutes')}</span><strong>{displayNumber(gateway.tcp_routes, 0)}</strong></div><div><span>{t('gateway.certificates')}</span><strong>{(gateway.certificates || []).length}</strong><small>{t('gateway.expiring', { count: expiring })}</small></div></div><StatusElement type={issues.length ? 'button' : undefined} className={`${styles.gatewayStatus} ${issues.length ? styles.gatewayWarning : ''}`} onClick={issues.length ? () => this.setState({ gatewayModalVisible: true }) : undefined}><Tooltip title={<span>{t('gateway.description')}<br />{t('gateway.healthyDescription')}</span>}><Icon type={issues.length ? 'warning' : 'info-circle'} tabIndex={0} aria-label={t('gateway.healthyDescription')} /></Tooltip><span><strong>{issues.length ? t('gateway.hasIssues', { count: issues.length }) : t((gateway.certificates || []).length ? 'gateway.healthy' : 'gateway.noBoundCertificates')}</strong>{issues.length ? <small>{t('gateway.issueDescription')}</small> : null}</span>{issues.length ? <Icon type="right" /> : null}</StatusElement></React.Fragment> : gatewaySection.status === 'loading' ? (!errors.cluster ? <Skeleton active paragraph={{ rows: 3 }} /> : null) : <Alert type="warning" showIcon message={t('gateway.unavailable')} />}
      </OverviewModule>
    );
  }

  renderModals() {
    const enterprise = this.props.enterprise || {};
    const rainbondInfo = this.props.rainbondInfo || {};
    const { runtime } = this.props.overview;
    const snapshot = this.getCurrentSnapshot();
    const gateway = overviewData.sectionData(snapshot, 'gateway') || {};
    const plugins = overviewData.sectionData(snapshot, 'plugins');
    const appItems = (((runtime && runtime.global) || {}).application_alarms || {}).items || [];
    const platform = { name: enterprise.enterprise_alias || enterprise.enterprise_name || 'Rainbond', version: overviewData.compactVersion(rainbondInfo.version && rainbondInfo.version.value), createdAt: enterprise.create_time, enterpriseId: this.getEnterpriseId() };
    const runtimeSummary = overviewData.platformClusterSummary(runtime, this.props.overview.errors.runtime);
    const licenseSummary = overviewData.platformLicenseSummary(this.state.license, this.state.licenseStatus);
    const labels = { basicInfo: t('modal.basicInfo'), close: t('modal.close'), authorizationCode: t('modal.authorizationCode'), newAuthorizationCode: t('modal.newAuthorizationCode'), secureUpdate: t('modal.secureUpdate'), authorizationPrivate: t('modal.authorizationPrivate'), licenseDetailsUnavailable: t('modal.licenseDetailsUnavailable'), pluginAuthorizationUnknown: t('modal.pluginAuthorizationUnknown'), nodeLimit: t('modal.nodeLimit'), pluginCount: count => t('modal.pluginCount', { count }), name: t('modal.name'), version: t('modal.version'), createdAt: t('modal.createdAt'), enterpriseId: t('modal.enterpriseId'), license: t('modal.license'), updateLicense: t('modal.updateLicenseCode'), authorizationPlaceholder: t('modal.authorizationPlaceholder'), authorizationRequired: t('modal.authorizationRequired'), save: t('modal.save'), cancel: t('modal.cancel'), licenseUnavailable: t('modal.licenseUnavailable'), company: t('modal.company'), expireAt: t('modal.expireAt'), clusterLimit: t('modal.clusterLimit'), unlimited: t('modal.unlimited'), notApplicable: t('modal.notApplicable'), validLicense: t('modal.validLicense'), invalidLicense: t('modal.invalidLicense'), invalidReasonUnknown: t('modal.invalidReasonUnknown'), allowedPlugins: t('modal.allowedPlugins'), noPlugins: t('modal.noPlugins'), noLicense: t('modal.noLicense') };
    return (
      <React.Fragment>
        <Modal visible={Boolean(this.state.pluginModalRegion && this.state.pluginModalRegion === this.state.selectedRegion)} title={t('services.plugins')} footer={null} width={680} destroyOnClose onCancel={() => this.setState({ pluginModalRegion: null })}>
          {plugins ? this.renderPluginList(overviewData.pluginPresentation(plugins).ordered, true) : <Alert type="warning" showIcon message={t('services.pluginsUnavailable')} />}
        </Modal>
        <PlatformInfoModal visible={this.state.platformModalVisible} onCancel={() => this.setState({ platformModalVisible: false })} onUpdateLicense={this.handleUpdateLicense} title={t('modal.platformInfo')} labels={labels} platform={platform} runtimeSummary={{ ...runtimeSummary, label: t(runtimeSummary.labelId, runtimeSummary.values) }} licenseLabel={t(licenseSummary.labelId)} license={this.state.license} requestStatus={this.state.licenseStatus} requestError={this.state.licenseStatusReason} updating={this.state.licenseUpdating} />
        <IssueModal visible={this.state.applicationModalVisible} onCancel={() => this.setState({ applicationModalVisible: false })} title={t('issues.appTitle')} labels={{ open: t('issues.openComponent') }} onOpen={this.jumpApplicationIssue} items={appItems.map(item => ({ ...item, key: item.service_id, severity: 'critical', title: item.service_alias || item.service_name, description: t('issues.componentAbnormal'), owner: `${item.tenant_alias || item.tenant_name || '-'} / ${item.application_name || '-'} / ${item.region_name}` }))} />
        <IssueModal visible={this.state.gatewayModalVisible} onCancel={() => this.setState({ gatewayModalVisible: false })} title={t('issues.gatewayTitle')} labels={{ open: t('issues.openApplication') }} onOpen={this.jumpGatewayIssue} items={(gateway.issues || []).map((item, index) => ({ ...item, key: `${item.domain}-${index}`, title: item.domain, description: item.expires_at ? t('issues.certificateExpires', { date: moment(item.expires_at).format('YYYY-MM-DD') }) : t('issues.certificateUnknown'), owner: `${item.tenant_name || '-'} / ${item.service_alias || item.service_name || '-'}` }))} />
      </React.Fragment>
    );
  }

  render() {
    const { shell, loading, errors } = this.props.overview;
    const gatewayHidden = overviewData.sectionStatus(this.getCurrentSnapshot(), 'gateway') === 'empty';
    return (
      <main className={styles.page}>
        {this.renderPlatformHeader()}
        {errors.shell && !shell ? <div className={styles.shellError}><Alert type="error" showIcon message={t('shell.failed')} /><Button onClick={this.loadPlatformData}>{t('common.retry')}</Button></div> : null}
        {loading.shell && !shell ? <div className={styles.pageSkeleton}><Skeleton active paragraph={{ rows: 8 }} /></div> : null}
        {shell ? (
          <React.Fragment>
            {this.renderGlobalPosture()}
            {this.renderScopeSelector()}
            {this.state.selectedRegion ? <React.Fragment>{this.renderClusterOverview()}<div className={styles.primaryGrid}>{this.renderMonitoring()}{this.renderServices()}</div><div className={`${styles.secondaryGrid} ${gatewayHidden ? styles.singleModule : ''}`}>{this.renderTeamRanking()}{this.renderGateway()}</div></React.Fragment> : <Empty description={t('scope.empty')} />}
          </React.Fragment>
        ) : null}
        {this.renderModals()}
      </main>
    );
  }
}
