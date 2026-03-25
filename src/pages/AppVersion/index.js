import React, { PureComponent } from 'react';
import {
  Button,
  Card,
  Collapse,
  Dropdown,
  Drawer,
  Empty,
  Icon,
  Menu,
  Modal,
  Spin,
  Table,
  Tag,
  Timeline,
  notification
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import roleUtil from '../../utils/newRole';
import { fetchMarketAuthority } from '../../utils/authority';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import {
  getApplication as fetchInstalledSources,
  getUpdateRecordsList,
  getAppVersionOverview,
  getAppVersionSnapshots,
  getAppVersionSnapshotDetail,
  deleteAppVersionSnapshot,
  rollbackAppVersionSnapshot
} from '../../services/api';
import {
  createShare,
  getUpgradeComponentList,
  getShareRecords,
  deleteShareRecord as removeShareRecord,
  giveupShare as cancelShareRecord
} from '../../services/application';
import { getAppModelLastRecord, postUpgradeRecord } from '../../services/app';
import { appExport, queryExport } from '../../services/market';
import AppExportAction from '../../components/AppExportAction';
import SelectStore from '../../components/SelectStore';
import AuthCompany from '../../components/AuthCompany';
import AppExporter from '../EnterpriseShared/AppExporter';
import styles from './index.less';

const { Panel } = Collapse;

@connect(({ application, user, teamControl, enterprise, loading }) => ({
  apps: application.apps || [],
  currentUser: user.currentUser,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  currentEnterprise: enterprise.currentEnterprise,
  appDetailLoading: loading.effects['application/fetchGroupDetail'],
  appsLoading: loading.effects['application/fetchApps'],
  shareRecordsLoading: loading.effects['application/fetchShareRecords']
}))
export default class AppVersion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      appDetail: {},
      overview: {},
      snapshotVersions: [],
      sourceGroups: [],
      upgradeRecords: [],
      selectedTemplateId: 'personal',
      templateActionVisible: false,
      detailVisible: false,
      detailRecord: null,
      sourceUpgradeVisible: false,
      snapshotExportStatusMap: {},
      snapshotExportLoadingMap: {},
      publishRecords: [],
      publishRecordsLoading: false,
      publishRecordsVisible: false,
      selectStoreVisible: false,
      storeLoading: false,
      storeList: [],
      storeName: '',
      isAuthCompany: false,
      pendingPublishVersion: '',
      showExporterApp: false,
      exporterAppData: null,
      sharedAppExporting: false
    };
    this.snapshotExportPollingTimer = null;
    this.rollbackRefreshTimer = null;
    this.unmounted = false;
  }

  componentDidMount() {
    this.unmounted = false;
    this.fetchAppDetail();
    this.fetchApps();
    this.fetchAppVersionOverview();
    this.fetchSnapshotVersions();
    this.fetchUpgradeRecords();
    this.fetchPublishRecords();
    this.loadSourceGroups();
    this.syncRoutePanel();
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.clearSnapshotExportPolling();
    this.clearRollbackRefreshPolling();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.syncRoutePanel();
    }
    if (prevProps.apps !== this.props.apps) {
      this.loadSourceGroups();
    }
  }

  getAppId = () => {
    return this.props.match.params.appID;
  };

  getAppName = () => {
    const { appDetail } = this.state;
    return (
      appDetail.group_name ||
      appDetail.group_alias ||
      appDetail.app_name ||
      `应用 ${this.getAppId()}`
    );
  };

  getEnterpriseId = () => {
    const { currentEnterprise, currentUser } = this.props;
    return (
      globalUtil.getCurrEnterpriseId() ||
      (currentEnterprise && currentEnterprise.enterprise_id) ||
      (currentUser && currentUser.enterprise_id) ||
      ''
    );
  };

  getPublishPermissionInfo = () => {
    const { currentTeamPermissionsInfo } = this.props;
    return (
      roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
        'app_release',
        `app_${this.getAppId()}`
      ) || {}
    );
  };

  canPublishSnapshotVersion = version => {
    const { overview } = this.state;
    return !!(
      overview &&
      overview.template_id &&
      version &&
      version !== '未创建快照' &&
      version !== '未发布'
    );
  };

  buildPublishQuery = version => {
    const { overview } = this.state;
    const query = [];
    if (overview && overview.template_id) {
      query.push(`preferred_app_id=${encodeURIComponent(overview.template_id)}`);
    }
    if (version) {
      query.push(`preferred_version=${encodeURIComponent(version)}`);
    }
    return query.length > 0 ? `?${query.join('&')}` : '';
  };

  navigateToPublishStep = (recordId, step = 1, query = '') => {
    if (!recordId) {
      return;
    }
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    const stepName = step === 2 ? 'two' : 'one';
    dispatch(
      routerRedux.push(
        `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordId}/${stepName}${stepName === 'one' ? query : ''}`
      )
    );
  };

  clearSnapshotExportPolling = () => {
    if (this.snapshotExportPollingTimer) {
      clearTimeout(this.snapshotExportPollingTimer);
      this.snapshotExportPollingTimer = null;
    }
  };

  normalizeSnapshotExportStatus = statusInfo => {
    if (!statusInfo) {
      return {
        is_export_before: false,
        status: 'not_export',
        file_path: '',
        no_export: false
      };
    }
    if (statusInfo.no_export === 'true') {
      return {
        is_export_before: false,
        status: 'not_export',
        file_path: '',
        no_export: true
      };
    }
    const rainbondApp = statusInfo.rainbond_app || {};
    return {
      is_export_before: !!rainbondApp.is_export_before,
      status: rainbondApp.status || 'not_export',
      file_path: rainbondApp.file_path || '',
      no_export: false
    };
  };

  getSnapshotExportVersions = records => {
    return (records || this.state.snapshotVersions || [])
      .map(item => item && item.version)
      .filter(Boolean);
  };

  refreshSnapshotExportStatuses = versions => {
    const snapshotVersions = versions || this.getSnapshotExportVersions();
    const { overview } = this.state;
    if (!snapshotVersions.length) {
      this.clearSnapshotExportPolling();
      this.setState({
        snapshotExportStatusMap: {},
        snapshotExportLoadingMap: {}
      });
      return;
    }
    if (!overview || !overview.template_id || !this.getEnterpriseId()) {
      return;
    }
    this.fetchSnapshotExportStatuses(snapshotVersions);
  };

  fetchSnapshotExportStatuses = async versions => {
    const { overview } = this.state;
    const templateId = overview && overview.template_id;
    const enterpriseId = this.getEnterpriseId();
    const targetVersions = (versions || []).filter(Boolean);
    this.clearSnapshotExportPolling();
    if (!templateId || !enterpriseId || !targetVersions.length) {
      return;
    }
    try {
      const res = await queryExport({
        enterprise_id: enterpriseId,
        body: {
          app_id: templateId,
          app_version: targetVersions.join('#')
        }
      });
      if (this.unmounted) {
        return;
      }
      const statusList = (res && res.list) || [];
      const nextStatusMap = {};
      targetVersions.forEach((version, index) => {
        nextStatusMap[version] = this.normalizeSnapshotExportStatus(statusList[index]);
      });
      this.setState(
        prevState => ({
          snapshotExportStatusMap: {
            ...prevState.snapshotExportStatusMap,
            ...nextStatusMap
          }
        }),
        () => {
          const exportingVersions = targetVersions.filter(version => {
            const status = this.state.snapshotExportStatusMap[version];
            return status && status.status === 'exporting';
          });
          if (exportingVersions.length) {
            this.snapshotExportPollingTimer = setTimeout(() => {
              this.fetchSnapshotExportStatuses(exportingVersions);
            }, 5000);
          }
        }
      );
    } catch (error) {
      if (!this.unmounted) {
        this.clearSnapshotExportPolling();
      }
    }
  };

  getSnapshotExportStatus = version => {
    return this.state.snapshotExportStatusMap[version] || this.normalizeSnapshotExportStatus();
  };

  setSnapshotExportLoading = (version, loading) => {
    if (!version || this.unmounted) {
      return;
    }
    this.setState(prevState => ({
      snapshotExportLoadingMap: {
        ...prevState.snapshotExportLoadingMap,
        [version]: loading
      }
    }));
  };

  clearRollbackRefreshPolling = () => {
    if (this.rollbackRefreshTimer) {
      clearTimeout(this.rollbackRefreshTimer);
      this.rollbackRefreshTimer = null;
    }
  };

  pollRollbackRecordUntilSettled = async (recordId, attempt = 0) => {
    if (!recordId || this.unmounted) {
      return;
    }
    const maxAttempts = 30;
    const finishedStatuses = [5, 7, 9, 10];
    try {
      const res = await getUpdateRecordsList({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId(),
        page: 1,
        pageSize: 100,
        status__gt: 1
      });
      const upgradeRecords = (res && res.list) || [];
      if (this.unmounted) {
        return;
      }
      this.setState({ upgradeRecords });
      const rollbackRecord = upgradeRecords.find(
        item => `${item.ID || item.id}` === `${recordId}`
      );
      const rollbackStatus = rollbackRecord && rollbackRecord.status;
      if (finishedStatuses.includes(rollbackStatus)) {
        this.rollbackRefreshTimer = null;
        await Promise.all([
          this.fetchAppVersionOverview(),
          this.fetchSnapshotVersions(),
          this.fetchUpgradeRecords(),
          this.fetchAppDetail()
        ]);
        return;
      }
    } catch (error) {
      if (this.unmounted) {
        return;
      }
    }

    if (attempt >= maxAttempts || this.unmounted) {
      this.rollbackRefreshTimer = null;
      await Promise.all([
        this.fetchAppVersionOverview(),
        this.fetchSnapshotVersions(),
        this.fetchUpgradeRecords(),
        this.fetchAppDetail()
      ]);
      return;
    }

    this.rollbackRefreshTimer = setTimeout(() => {
      this.pollRollbackRecordUntilSettled(recordId, attempt + 1);
    }, 2000);
  };

  canExportSnapshot = version => {
    if (!version) {
      return false;
    }
    const { overview } = this.state;
    const exportStatus = this.getSnapshotExportStatus(version);
    return !!(
      overview &&
      overview.template_id &&
      this.getEnterpriseId() &&
      !exportStatus.no_export
    );
  };

  syncRoutePanel = () => {
    const query = (this.props.location && this.props.location.query) || {};
    if (query.panel === 'source-upgrade') {
      this.setState({ sourceUpgradeVisible: true });
    }
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            appDetail: res.bean || {},
            loading: false
          });
        }
      },
      handleError: error => {
        this.setState({ loading: false });
        if (error && error.code === 404) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };

  fetchApps = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: this.getAppId(),
        page: 1,
        page_size: 10000
      }
    });
  };

  fetchAppVersionOverview = async () => {
    try {
      const res = await getAppVersionOverview({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId()
      });
      if (this.unmounted) {
        return;
      }
      this.setState(
        {
          overview: (res && res.bean) || {}
        },
        () => {
          this.refreshSnapshotExportStatuses();
        }
      );
    } catch (error) {
      if (!this.unmounted) {
        this.setState({
          overview: {}
        });
      }
    }
  };

  fetchSnapshotVersions = async () => {
    try {
      const res = await getAppVersionSnapshots({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId()
      });
      const snapshotVersions = await Promise.all(
        ((res && res.list) || []).map(this.attachSnapshotComponentNames)
      );
      if (this.unmounted) {
        return;
      }
      this.setState(
        {
          snapshotVersions
        },
        () => {
          this.refreshSnapshotExportStatuses(this.getSnapshotExportVersions(snapshotVersions));
        }
      );
    } catch (error) {
      if (!this.unmounted) {
        this.setState({
          snapshotVersions: [],
          snapshotExportStatusMap: {},
          snapshotExportLoadingMap: {}
        });
      }
    }
  };

  getTemplateComponentNames = template => {
    const apps = (template && template.apps) || [];
    return Array.from(
      new Set(
        apps
          .map(app => app.service_cname || app.service_alias || app.service_key || app.service_name || '')
          .filter(Boolean)
      )
    );
  };

  attachSnapshotComponentNames = async record => {
    if (!record || !record.version_id) {
      return {
        ...record,
        includedComponentNames: []
      };
    }
    try {
      const res = await getAppVersionSnapshotDetail({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId(),
        version_id: record.version_id
      });
      const detail = (res && res.bean) || {};
      return {
        ...record,
        ...detail,
        includedComponentNames: this.getTemplateComponentNames(detail.template)
      };
    } catch (error) {
      return {
        ...record,
        includedComponentNames: []
      };
    }
  };

  fetchUpgradeRecords = async () => {
    try {
      const res = await getUpdateRecordsList({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId(),
        page: 1,
        pageSize: 100,
        status__gt: 1
      });
      this.setState({
        upgradeRecords: (res && res.list) || []
      });
    } catch (error) {
      this.setState({
        upgradeRecords: []
      });
    }
  };

  fetchPublishRecords = async () => {
    this.setState({ publishRecordsLoading: true });
    try {
      const res = await getShareRecords({
        team_name: globalUtil.getCurrTeamName(),
        app_id: this.getAppId(),
        page: 1,
        page_size: 10
      });
      if (this.unmounted) {
        return;
      }
      this.setState({
        publishRecords: (res && res.list) || [],
        publishRecordsLoading: false
      });
    } catch (error) {
      if (!this.unmounted) {
        this.setState({
          publishRecords: [],
          publishRecordsLoading: false
        });
      }
    }
  };

  loadSourceGroups = async () => {
    if (!this.props.apps || this.props.apps.length === 0) {
      return;
    }
    const team_name = globalUtil.getCurrTeamName();
    const group_id = this.getAppId();
    let sourceList = [];
    try {
      const response = await fetchInstalledSources({
        team_name,
        group_id
      });
      sourceList = (response && response.list) || [];
    } catch (error) {
      sourceList = [];
    }

    const sourceGroups = await Promise.all(
      sourceList.map(async item => {
        let components = [];
        try {
          const res = await getUpgradeComponentList({
            team_name,
            group_id,
            upgrade_group_id: item.upgrade_group_id,
            app_model_key: item.group_key
          });
          components = (res && res.list) || [];
        } catch (error) {
          components = [];
        }

        return {
          id: `${item.group_key || 'market'}-${item.upgrade_group_id || 0}`,
          templateType: 'market',
          templateName: item.group_name || item.app_model_name || '应用商店模板',
          currentVersion: item.current_version || '-',
          latestVersion:
            item.can_upgrade && item.upgrade_versions && item.upgrade_versions.length > 0
              ? item.upgrade_versions[0]
              : '-',
          groupKey: item.group_key || '',
          upgradeGroupId: item.upgrade_group_id || 0,
          marketName: item.market_name || item.app_store_name || '',
          canUpgrade: !!item.can_upgrade,
          upgradeableComponentCount: components.filter(component => {
            const versions = component.upgradable_versions || [];
            return versions.length > 0;
          }).length,
          componentNames: components.map(component => component.service_cname || (component.service && component.service.service_cname) || '').filter(Boolean),
          componentCount: components.length
        };
      })
    );

    this.setState({ sourceGroups });
  };

  getPersonalTemplate = () => {
    const { overview } = this.state;
    return {
      id: 'personal',
      templateType: 'personal',
      templateName: '应用版本',
      currentVersion: overview.current_version || '未创建快照',
      latestVersion: '-',
      componentCount: this.props.apps.length
    };
  };

  createPublishRecord = async (scope = '', target = {}, recordVersion = '') => {
    const { teamName, appID } = this.props.match.params;
    const { overview } = this.state;
    if (!this.canPublishSnapshotVersion(recordVersion)) {
      this.setState({ storeLoading: false });
      notification.warning({ message: '请先创建快照后再发布' });
      return;
    }
    try {
      const res = await createShare({
        team_name: teamName,
        group_id: appID,
        scope,
        target,
        snapshot_app_id: overview.template_id,
        snapshot_version: recordVersion
      });
      const bean = (res && res.bean) || {};
      const recordId = bean.ID;
      if (!recordId) {
        throw new Error('publish record missing');
      }
      this.setState({
        selectStoreVisible: false,
        storeLoading: false,
        pendingPublishVersion: '',
        isAuthCompany: false
      });
      this.navigateToPublishStep(recordId, bean.step, this.buildPublishQuery(recordVersion));
    } catch (error) {
      this.setState({ storeLoading: false });
      notification.error({
        message: this.getRequestErrorMessage(error, '创建发布流程失败')
      });
    }
  };

  getLatestPublishRecord = () => {
    const { overview } = this.state;
    return overview && overview.latest_publish_time
      ? { create_time: overview.latest_publish_time, version: overview.current_version || '-' }
      : null;
  };

  getUpgradeableSources = () => {
    return (this.state.sourceGroups || []).filter(source => {
      return (
        source.canUpgrade ||
        (source.latestVersion &&
          source.latestVersion !== '-' &&
          `${source.latestVersion}` !== `${source.currentVersion}`)
      );
    });
  };

  getUpgradeableComponentCount = sources => {
    const total = (sources || []).reduce((count, source) => {
      return count + (source.upgradeableComponentCount || source.componentCount || 0);
    }, 0);
    return total || (sources || []).length;
  };

  getTemplateRows = () => {
    return [this.getPersonalTemplate()].concat(this.state.sourceGroups || []);
  };

  getSelectedTemplate = () => {
    const rows = this.getTemplateRows();
    const selected = rows.find(item => item.id === this.state.selectedTemplateId);
    return selected || rows[0] || null;
  };

  renderOverviewPanel = selectedTemplate => {
    const templateRows = this.getTemplateRows();
    const latestPublish = this.getLatestPublishRecord();
    return (
      <Card bordered={false} className={styles.overviewCard}>
        <div className={styles.overviewHeader}>
          <div>
            <div className={styles.overviewEyebrow}>应用版本中心</div>
            <div className={styles.overviewTitle}>{this.getAppName()}</div>
            <div className={styles.overviewDesc}>
              聚合管理个人模板与应用商店模板版本，在同一视图里查看版本演进、发布状态与来源升级。
            </div>
          </div>
          <div className={styles.overviewActions}>
            <Button onClick={this.openSourceUpgradeDrawer}>来源升级</Button>
          </div>
        </div>
        <div className={styles.overviewStats}>
          <div className={styles.overviewStat}>
            <span className={styles.overviewStatLabel}>当前模板</span>
            <span className={styles.overviewStatValue}>{selectedTemplate ? selectedTemplate.templateName : '-'}</span>
          </div>
          <div className={styles.overviewStat}>
            <span className={styles.overviewStatLabel}>模板总数</span>
            <span className={styles.overviewStatValue}>{templateRows.length}</span>
          </div>
          <div className={styles.overviewStat}>
            <span className={styles.overviewStatLabel}>来源模板</span>
            <span className={styles.overviewStatValue}>{this.state.sourceGroups.length}</span>
          </div>
          <div className={styles.overviewStat}>
            <span className={styles.overviewStatLabel}>最新发布</span>
            <span className={styles.overviewStatValue}>{latestPublish ? latestPublish.version || '-' : '未发布'}</span>
          </div>
        </div>
      </Card>
    );
  };

  openPublishPage = (recordVersion = '') => {
    this.createPublishRecord('', {}, recordVersion);
  };

  handlePublishAction = (target, recordVersion = '') => {
    if (target === 'market') {
      this.openCloudPublishPage(recordVersion);
      return;
    }
    this.openPublishPage(recordVersion);
  };

  openCloudPublishPage = recordVersion => {
    if (!this.canPublishSnapshotVersion(recordVersion)) {
      notification.warning({ message: '请先创建快照后再发布' });
      return;
    }
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) {
      notification.warning({ message: '当前企业信息缺失，无法发布到云应用商店' });
      return;
    }
    this.setState({
      storeLoading: true,
      pendingPublishVersion: recordVersion
    });
    this.props.dispatch({
      type: 'enterprise/fetchEnterpriseStoreList',
      payload: {
        enterprise_id: enterpriseId
      },
      callback: data => {
        const storeList = (data && data.list) || [];
        if (!storeList.length) {
          this.setState({
            storeLoading: false,
            storeList: [],
            selectStoreVisible: false
          });
          notification.warning({ message: '当前企业未配置可用的云应用商店' });
          return;
        }
        if (storeList[0].access_key) {
          const writableStores = storeList.filter(
            item => item.status === 1 && fetchMarketAuthority(item, 'Write')
          );
          if (!writableStores.length) {
            this.setState({
              storeLoading: false,
              storeList: [],
              selectStoreVisible: false
            });
            notification.warning({ message: '当前没有可写入的云应用商店，请先检查商店权限' });
            return;
          }
          this.setState({
            selectStoreVisible: true,
            isAuthCompany: false,
            storeList: writableStores,
            storeLoading: false
          });
          return;
        }
        this.setState({
          storeName: storeList[0].name,
          isAuthCompany: true,
          storeLoading: false,
          selectStoreVisible: false
        });
      }
    });
  };

  renderPublishAction = ({
    recordVersion = '',
    disabled = false,
    size = 'default',
    type,
    ghost = false
  } = {}) => {
    const overlay = (
      <Menu
        onClick={({ key, domEvent }) => {
          if (domEvent) {
            domEvent.stopPropagation();
          }
          this.handlePublishAction(key, recordVersion);
        }}
      >
        <Menu.Item key="local">{formatMessage({ id: 'appPublish.btn.local' })}</Menu.Item>
        <Menu.Item key="market">{formatMessage({ id: 'appPublish.btn.market' })}</Menu.Item>
      </Menu>
    );

    return (
      <Dropdown overlay={overlay} trigger={['click']} disabled={disabled}>
        <Button size={size} type={type} ghost={ghost} disabled={disabled}>
          {formatMessage({ id: 'appPublish.btn.publish' })} <Icon type="down" />
        </Button>
      </Dropdown>
    );
  };

  openUpgradePage = template => {
    if (this.state.sourceUpgradeVisible) {
      this.closeSourceUpgradeDrawer(() => this.openUpgradePage(template));
      return;
    }
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    if (!template || !template.groupKey || !template.upgradeGroupId) {
      this.openSourceUpgradeDrawer();
      return;
    }
    getAppModelLastRecord({
      appID: appID,
      team_name: teamName,
      upgrade_group_id: template.upgradeGroupId
    })
      .then(re => {
        const record = re && re.bean;
        const status = record && record.status;
        if (record && status && ![3, 8].includes(status)) {
          this.openUpgradeInfoPage(record, template);
          return;
        }
        return postUpgradeRecord({
          team_name: teamName,
          appID: appID,
          upgrade_group_id: template.upgradeGroupId,
          noModels: true
        }).then(createRes => {
          this.openUpgradeInfoPage(createRes && createRes.bean, template);
        });
      })
      .catch(() => {
        postUpgradeRecord({
          team_name: teamName,
          appID: appID,
          upgrade_group_id: template.upgradeGroupId,
          noModels: true
        }).then(createRes => {
          this.openUpgradeInfoPage(createRes && createRes.bean, template);
        });
      });
  };

  openUpgradeInfoPage = (record, template) => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    if (!record) {
      this.openSourceUpgradeDrawer();
      return;
    }
    const recordId = record.ID || record.id;
    const upgradeGroupId = record.upgrade_group_id || template.upgradeGroupId;
    const groupKey = record.group_key || template.groupKey;
    if (!recordId || !upgradeGroupId || !groupKey) {
      this.openSourceUpgradeDrawer();
      return;
    }
    const jumpToUpgradePage = () => {
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/apps/${appID}/upgrade/${upgradeGroupId}/record/${recordId}?app_id=${groupKey}`
        )
      );
    };
    if (this.state.sourceUpgradeVisible) {
      this.closeSourceUpgradeDrawer(jumpToUpgradePage);
      return;
    }
    jumpToUpgradePage();
  };

  openSourceUpgradeDrawer = () => {
    this.setState({ sourceUpgradeVisible: true });
  };

  closeSourceUpgradeDrawer = callback => {
    this.setState({ sourceUpgradeVisible: false }, () => {
      if (callback) {
        callback();
      }
    });
  };

  openTemplateActionModal = () => {
    this.setState({ templateActionVisible: true });
  };

  closeTemplateActionModal = () => {
    this.setState({ templateActionVisible: false });
  };

  hideSelectStore = () => {
    this.setState({
      selectStoreVisible: false,
      storeLoading: false,
      pendingPublishVersion: ''
    });
  };

  handleSelectStore = values => {
    const { pendingPublishVersion } = this.state;
    if (!values || !values.store_id) {
      return;
    }
    this.setState({ storeLoading: true });
    this.createPublishRecord('goodrain', { store_id: values.store_id }, pendingPublishVersion);
  };

  handleAddPersonalTemplate = () => {
    this.closeTemplateActionModal();
    this.handleCreateSnapshot();
  };

  handleAddMarketTemplate = () => {
    this.closeTemplateActionModal();
    notification.info({
      message: '请从应用总览的添加入口继续安装来源模板'
    });
  };

  formatTime = value => {
    if (!value) {
      return '-';
    }
    return moment(value)
      .locale('zh-cn')
      .format('YYYY-MM-DD HH:mm:ss');
  };

  formatPublishScope = scope => {
    if (scope === 'team') {
      return '团队';
    }
    if (scope === 'enterprise') {
      return '企业';
    }
    if (scope === 'goodrain') {
      return '应用市场';
    }
    return '本地';
  };

  formatPublishStatus = status => {
    if (status === 0) {
      return '发布中';
    }
    if (status === 1) {
      return '已发布';
    }
    if (status === 2) {
      return '已取消';
    }
    return '-';
  };

  formatDiffFieldItem = (fieldKey, item = {}) => {
    if (fieldKey === 'service_env_map_list') {
      const key = item.attr_name || '-';
      const value = item.attr_value || '';
      return `${key}=${value}`;
    }
    if (fieldKey === 'service_connect_info_map_list') {
      const key = item.attr_name || '-';
      const value = item.attr_value || '';
      return `${key}=${value}`;
    }
    if (fieldKey === 'port_map_list') {
      const segments = [`容器端口 ${item.container_port || '-'}/${String(item.protocol || 'tcp').toUpperCase()}`];
      if (item.port_alias) {
        segments.push(`别名 ${item.port_alias}`);
      }
      if (item.k8s_service_name) {
        segments.push(`服务 ${item.k8s_service_name}`);
      }
      return segments.join('，');
    }
    if (fieldKey === 'service_volume_map_list') {
      const segments = [`${item.volume_name || '-'} -> ${item.volume_path || '-'}`];
      if (item.volume_capacity !== undefined && item.volume_capacity !== null && item.volume_capacity !== '') {
        segments.push(`容量 ${item.volume_capacity}`);
      }
      if (item.volume_type) {
        segments.push(`类型 ${item.volume_type}`);
      }
      return segments.join('，');
    }
    if (fieldKey === 'probes') {
      const segments = [item.probe_id || item.mode || 'probe'];
      if (item.mode) {
        segments.push(`类型 ${item.mode}`);
      }
      if (item.port !== undefined && item.port !== null && item.port !== '') {
        segments.push(`端口 ${item.port}`);
      }
      if (item.path) {
        segments.push(`路径 ${item.path}`);
      }
      if (item.cmd) {
        segments.push(`命令 ${item.cmd}`);
      }
      if (item.failure_threshold !== undefined && item.failure_threshold !== null && item.failure_threshold !== '') {
        segments.push(`失败阈值 ${item.failure_threshold}`);
      }
      return segments.join('，');
    }
    try {
      return JSON.stringify(item);
    } catch (error) {
      return '-';
    }
  };

  formatOtherChangeValue = value => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return '-';
    }
  };

  renderOtherChangeValueBlock = value => {
    const formattedValue = this.formatOtherChangeValue(value);
    const shouldCollapse = formattedValue.length > 160 || formattedValue.indexOf('\n') > -1;
    if (!shouldCollapse) {
      return <pre className={styles.detailEntryCode}>{formattedValue}</pre>;
    }
    return (
      <details className={styles.detailEntryDetails}>
        <summary className={styles.detailEntryDetailsSummary}>
          {formattedValue.slice(0, 160)}...
        </summary>
        <pre className={styles.detailEntryCode}>{formattedValue}</pre>
      </details>
    );
  };

  getFieldChangeEntryCount = fieldChange => {
    if (!fieldChange) {
      return 0;
    }
    return []
      .concat(fieldChange.added || [])
      .concat(fieldChange.removed || [])
      .concat(fieldChange.updated || []).length;
  };

  getUpdatedComponentSummaryItems = component => {
    const summaryItems = [];
    (component.field_changes || []).forEach(fieldChange => {
      const count = this.getFieldChangeEntryCount(fieldChange);
      if (count > 0) {
        summaryItems.push({
          key: fieldChange.field_key,
          label: fieldChange.field_label,
          count
        });
      }
    });
    if (component.other_changes && component.other_changes.length > 0) {
      summaryItems.push({
        key: 'other_changes',
        label: '其他配置',
        count: component.other_changes.length
      });
    }
    return summaryItems;
  };

  renderComponentNameList = (components, emptyText) => {
    if (!components || components.length === 0) {
      return <div className={styles.detailEmptyText}>{emptyText}</div>;
    }
    return (
      <div className={styles.detailComponentTagList}>
        {components.map(item => (
          <span
            key={item.component_name}
            className={styles.detailComponentTag}
          >
            {item.component_name}
          </span>
        ))}
      </div>
    );
  };

  renderFieldChangeEntries = (fieldKey, changeType, entries) => {
    if (!entries || entries.length === 0) {
      return null;
    }
    const titleMap = {
      added: '新增',
      removed: '删除',
      updated: '修改'
    };
    const classNameMap = {
      added: styles.detailChangeAdded,
      removed: styles.detailChangeRemoved,
      updated: styles.detailChangeUpdated
    };
    return (
      <div className={styles.detailChangeGroup}>
        <div className={styles.detailChangeHeading}>
          <span className={`${styles.detailChangeBadge} ${classNameMap[changeType]}`}>
            {titleMap[changeType]}
          </span>
          <span>{entries.length} 项</span>
        </div>
        <div className={styles.detailEntryList}>
          {entries.map(entry => (
            <div
              key={`${changeType}-${entry.identity}`}
              className={styles.detailEntry}
            >
              <div className={styles.detailEntryIdentity}>{entry.identity}</div>
              {changeType === 'updated' ? (
                <div className={styles.detailEntryDiff}>
                  <div>之前：{this.formatDiffFieldItem(fieldKey, entry.before)}</div>
                  <div>现在：{this.formatDiffFieldItem(fieldKey, entry.after)}</div>
                </div>
              ) : (
                <div className={styles.detailEntrySingle}>
                  {this.formatDiffFieldItem(fieldKey, entry.item)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  renderUpdatedComponentDetails = updatedComponents => {
    if (!updatedComponents || updatedComponents.length === 0) {
      return <div className={styles.detailEmptyText}>当前没有组件字段级修改</div>;
    }
    const defaultActiveKeys =
      updatedComponents.length <= 2
        ? updatedComponents.map(component => component.component_name)
        : [updatedComponents[0].component_name];
    return (
      <Collapse
        bordered={false}
        defaultActiveKey={defaultActiveKeys}
        className={styles.detailUpdatedComponentList}
      >
        {updatedComponents.map(component => (
          <Panel
            key={component.component_name}
            className={styles.detailUpdatedComponent}
            header={(
              <div className={styles.detailUpdatedComponentHeader}>
                <div className={styles.detailUpdatedComponentTitle}>{component.component_name}</div>
                <div className={styles.detailUpdatedComponentMeta}>
                  {this.getUpdatedComponentSummaryItems(component).map(item => (
                    <span
                      key={`${component.component_name}-${item.key}`}
                      className={styles.detailUpdatedComponentBadge}
                    >
                      {item.label} {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          >
            {component.field_changes && component.field_changes.length > 0 ? (
              <div className={styles.detailFieldList}>
                {component.field_changes.map(fieldChange => (
                  <div
                    key={`${component.component_name}-${fieldChange.field_key}`}
                    className={styles.detailFieldBlock}
                  >
                    <div className={styles.detailFieldTitle}>{fieldChange.field_label}</div>
                    {this.renderFieldChangeEntries(fieldChange.field_key, 'added', fieldChange.added)}
                    {this.renderFieldChangeEntries(fieldChange.field_key, 'removed', fieldChange.removed)}
                    {this.renderFieldChangeEntries(fieldChange.field_key, 'updated', fieldChange.updated)}
                  </div>
                ))}
              </div>
            ) : null}
            {component.other_changes && component.other_changes.length > 0 ? (
              <div className={styles.detailFieldList}>
                {component.other_changes.map(change => (
                  <div
                    key={`${component.component_name}-other-${change.field_key}`}
                    className={styles.detailFieldBlock}
                  >
                    <div className={styles.detailFieldTitle}>{change.field_label}</div>
                    <div className={styles.detailEntryList}>
                      <div className={styles.detailEntry}>
                        <div className={styles.detailEntryIdentity}>之前</div>
                        {this.renderOtherChangeValueBlock(change.before)}
                      </div>
                      <div className={styles.detailEntry}>
                        <div className={styles.detailEntryIdentity}>现在</div>
                        {this.renderOtherChangeValueBlock(change.after)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {(!component.field_changes || component.field_changes.length === 0) &&
            (!component.other_changes || component.other_changes.length === 0) ? (
              <div className={styles.detailEmptyText}>当前没有可展开的配置变化。</div>
            ) : null}
          </Panel>
        ))}
      </Collapse>
    );
  };

  renderDiffDetailContent = (diffSummary, componentDiffDetails, emptyText) => {
    const addedComponents = componentDiffDetails.added_components || [];
    const removedComponents = componentDiffDetails.removed_components || [];
    const updatedComponents = componentDiffDetails.updated_components || [];

    return (
      <>
        <div className={styles.detailSummaryGrid}>
          <div className={styles.detailSummaryItem}>
            <span className={styles.detailSummaryLabel}>新增组件</span>
            <span className={styles.detailSummaryValue}>{diffSummary.added_count || 0}</span>
          </div>
          <div className={styles.detailSummaryItem}>
            <span className={styles.detailSummaryLabel}>删除组件</span>
            <span className={styles.detailSummaryValue}>{diffSummary.removed_count || 0}</span>
          </div>
          <div className={styles.detailSummaryItem}>
            <span className={styles.detailSummaryLabel}>修改组件</span>
            <span className={styles.detailSummaryValue}>{diffSummary.updated_count || 0}</span>
          </div>
        </div>
        {!diffSummary.has_changes ? (
          <div className={styles.detailEmptyText}>{emptyText}</div>
        ) : (
          <>
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>新增组件</div>
              {this.renderComponentNameList(addedComponents, '当前没有新增组件')}
            </div>
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>删除组件</div>
              {this.renderComponentNameList(removedComponents, '当前没有删除组件')}
            </div>
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>修改组件</div>
              {this.renderUpdatedComponentDetails(updatedComponents)}
            </div>
          </>
        )}
      </>
    );
  };

  renderDetailDiffSection = record => {
    const diffSummary = (record && record.diff_summary) || {};
    const componentDiffDetails = (record && record.component_diff_details) || {};

    if (record && record.detail_mode === 'runtime') {
      return (
        <div className={styles.drawerBlock}>
          <div className={styles.drawerTitle}>当前状态变更</div>
          <div className={styles.detailCompareHint}>
            当前展示的是运行态相较快照基线 {record.baseline_version || '-'} 的差异。
          </div>
          {this.renderDiffDetailContent(
            diffSummary,
            componentDiffDetails,
            '当前运行态与快照基线一致，没有额外差异。'
          )}
        </div>
      );
    }

    return (
      <div className={styles.drawerBlock}>
        <div className={styles.drawerTitle}>版本变更</div>
        {!record.has_previous_version ? (
          <div className={styles.detailEmptyText}>该版本是首个快照，当前没有可对比的上一个版本。</div>
        ) : (
          <>
            <div className={styles.detailCompareHint}>
              当前展示的是版本 {record.version || '-'} 相较上一版本 {record.previous_version || '-'} 的差异。
            </div>
            {this.renderDiffDetailContent(
              diffSummary,
              componentDiffDetails,
              '这个版本与上一个快照没有配置差异。'
            )}
          </>
        )}
      </div>
    );
  };

  getRuntimeStateComponentNames = diffDetails => {
    const detail = diffDetails || {};
    const names = []
      .concat((detail.added_components || []).map(item => item.component_name))
      .concat((detail.removed_components || []).map(item => item.component_name))
      .concat((detail.updated_components || []).map(item => item.component_name));
    return Array.from(new Set(names.filter(Boolean)));
  };

  getCurrentBaselineSnapshot = () => {
    const { overview, snapshotVersions } = this.state;
    const versions = snapshotVersions || [];
    if (!versions.length) {
      return null;
    }
    const currentVersionId = overview && overview.current_version_id;
    return (
      versions.find(item => `${item.version_id}` === `${currentVersionId}`) ||
      versions[0]
    );
  };

  getPersonalTimeline = () => {
    const { overview, snapshotVersions, appDetail } = this.state;
    const versions = snapshotVersions || [];
    const baselineSnapshot = this.getCurrentBaselineSnapshot();
    const baselineSnapshotId = baselineSnapshot && baselineSnapshot.version_id;
    const baselineSnapshotIndex = versions.findIndex(
      item => `${item.version_id}` === `${baselineSnapshotId || ''}`
    );
    const timeline = [];

    if (overview && overview.has_changes && baselineSnapshot) {
      const runtimeComponentNames = this.getRuntimeStateComponentNames(overview.component_diff_details);
      timeline.push({
        id: 'runtime-state',
        version: '已修改',
        createTime: appDetail.update_time || appDetail.create_time,
        timeLabel: '最近更新',
        description: `当前运行态与快照基线 ${baselineSnapshot.version || '-'} 存在差异，尚未形成新的快照版本。`,
        componentLabel: '变化组件',
        componentNames: runtimeComponentNames,
        emptyComponentText: '当前状态未返回组件差异',
        detail: {
          templateName: '当前状态',
          title: '当前状态',
          detail_mode: 'runtime',
          baseline_version: baselineSnapshot.version,
          currentVersion: baselineSnapshot.version,
          app_version_info: '当前运行态相较快照基线的未保存修改。',
          create_time: appDetail.update_time || appDetail.create_time,
          diff_summary: overview.change_summary || {},
          component_diff_details: overview.component_diff_details || {},
        },
        timelineState: 'runtime',
        isCurrent: true,
      });
    }

    if (baselineSnapshot) {
      timeline.push({
        id: `snapshot-${baselineSnapshot.version_id}`,
        version: baselineSnapshot.version || '未命名版本',
        createTime: baselineSnapshot.create_time,
        timeLabel: '创建于',
        description: baselineSnapshot.app_version_info || '当前快照未填写版本说明',
        componentLabel: '包含组件',
        componentNames: baselineSnapshot.includedComponentNames || [],
        emptyComponentText: '当前版本未返回组件信息',
        actionVersion: baselineSnapshot.version || '',
        detail: baselineSnapshot,
        timelineState: 'current',
        isCurrent: true,
        isCurrentBaseline: true,
        isLatestCreated: `${baselineSnapshot.version_id}` === `${versions[0] && versions[0].version_id}`,
      });
    }

    return timeline.concat(
      versions
        .filter(record => `${record.version_id}` !== `${baselineSnapshotId || ''}`)
        .map((record, index) => ({
          id: `snapshot-${record.version_id}`,
          version: record.version || '未命名版本',
          createTime: record.create_time,
          timeLabel: '创建于',
          description: record.app_version_info || '当前快照未填写版本说明',
          componentLabel: '包含组件',
          componentNames: record.includedComponentNames || [],
          emptyComponentText: '当前版本未返回组件信息',
          actionVersion: record.version || '',
          detail: record,
          timelineState:
            baselineSnapshotIndex !== -1 && index < baselineSnapshotIndex
              ? 'upgrade'
              : 'history',
          isCurrent: false,
          isCurrentBaseline: false,
          isLatestCreated: `${record.version_id}` === `${versions[0] && versions[0].version_id}`,
        }))
    );
  };

  handleCreateSnapshot = async () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    let overview = this.state.overview || {};
    try {
      const res = await getAppVersionOverview({
        team_name: teamName,
        group_id: appID
      });
      overview = (res && res.bean) || {};
      if (!this.unmounted) {
        this.setState({ overview }, () => {
          this.refreshSnapshotExportStatuses();
        });
      }
    } catch (error) {
      overview = this.state.overview || {};
    }
    if (!this.canCreateSnapshot(overview)) {
      notification.warning({ message: '当前没有新的变更，无需创建快照' });
      return;
    }
    dispatch({
      type: 'application/ShareGroup',
      payload: {
        team_name: teamName,
        group_id: appID,
        scope: '',
        target: {},
        snapshot_mode: true,
        snapshot_app_id: overview.template_id || ''
      },
      callback: data => {
        const bean = data && data.bean;
        const recordId = bean && bean.ID;
        const appModelId = (bean && bean.app_id) || overview.template_id;
        if (!recordId) {
          notification.error({ message: '打开快照配置页失败' });
          return;
        }
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordId}/one?mode=snapshot${appModelId ? `&preferred_app_id=${appModelId}` : ''}${overview.current_version ? `&latest_snapshot_version=${overview.current_version}` : ''}`
          )
        );
      }
    });
  };

  handleRollbackSnapshot = async versionId => {
    try {
      const res = await rollbackAppVersionSnapshot({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId(),
        version_id: versionId
      });
      this.clearRollbackRefreshPolling();
      await this.fetchUpgradeRecords();
      const rollbackRecord = (res && res.bean) || {};
      const rollbackRecordId = rollbackRecord.ID || rollbackRecord.id;
      if (rollbackRecordId) {
        this.pollRollbackRecordUntilSettled(rollbackRecordId);
      } else {
        await Promise.all([
          this.fetchAppVersionOverview(),
          this.fetchSnapshotVersions(),
          this.fetchUpgradeRecords(),
          this.fetchAppDetail()
        ]);
      }
      notification.success({ message: '回滚任务已创建' });
    } catch (error) {
      notification.error({ message: '回滚失败' });
    }
  };

  getRequestErrorMessage = (error, fallback) => {
    return (
      (error && error.msg_show) ||
      (error && error.response && error.response.data && error.response.data.msg_show) ||
      (error && error.data && error.data.msg_show) ||
      fallback
    );
  };

  handleDeleteSnapshot = async versionId => {
    try {
      const res = await deleteAppVersionSnapshot({
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getAppId(),
        version_id: versionId
      });
      notification.success({
        message: (res && res.msg_show) || '删除成功'
      });
      this.fetchAppVersionOverview();
      this.fetchSnapshotVersions();
    } catch (error) {
      notification.error({
        message: this.getRequestErrorMessage(error, '删除失败')
      });
    }
  };

  confirmDeleteSnapshot = item => {
    if (!this.canDeleteSnapshot(item)) {
      return;
    }
    Modal.confirm({
      title: '删除历史版本',
      content: '删除后该历史版本将无法再查看、发布或回滚，且不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      onOk: () => this.handleDeleteSnapshot(item.detail.version_id)
    });
  };

  continuePublishRecord = record => {
    if (!record || !record.record_id) {
      return;
    }
    this.navigateToPublishStep(record.record_id, record.step);
  };

  cancelPublishRecord = async recordId => {
    if (!recordId) {
      notification.warning({
        message: formatMessage({ id: 'notification.warn.parameter_error' })
      });
      return;
    }
    try {
      await cancelShareRecord({
        team_name: globalUtil.getCurrTeamName(),
        share_id: recordId
      });
      notification.success({ message: '已取消发布' });
      this.fetchPublishRecords();
    } catch (error) {
      notification.error({
        message: this.getRequestErrorMessage(error, '取消发布失败')
      });
    }
  };

  handleDeletePublishRecord = async recordId => {
    try {
      await removeShareRecord({
        team_name: globalUtil.getCurrTeamName(),
        app_id: this.getAppId(),
        record_id: recordId
      });
      notification.success({ message: '删除成功' });
      this.fetchPublishRecords();
    } catch (error) {
      notification.error({
        message: this.getRequestErrorMessage(error, '删除失败')
      });
    }
  };

  confirmDeletePublishRecord = recordId => {
    if (!recordId) {
      return;
    }
    Modal.confirm({
      title: '删除发布记录',
      content: '删除后该发布记录将不可恢复，是否继续？',
      okText: '确认删除',
      cancelText: '取消',
      onOk: () => this.handleDeletePublishRecord(recordId)
    });
  };

  setSharedAppExporting = status => {
    this.setState({ sharedAppExporting: status });
  };

  hideSharedAppExport = () => {
    this.setState({ showExporterApp: false, exporterAppData: null });
  };

  openPublishRecordsDrawer = () => {
    this.setState({ publishRecordsVisible: true });
  };

  closePublishRecordsDrawer = () => {
    this.setState({ publishRecordsVisible: false });
  };

  showSharedAppExport = data => {
    if (!data) {
      return;
    }
    this.setState({
      showExporterApp: true,
      exporterAppData: {
        ...data,
        version: Array.isArray(data.version) ? data.version : Array.of(data.version),
        app_id: data.app_model_id
      }
    });
  };

  handleExportSnapshot = version => {
    const { overview } = this.state;
    const enterpriseId = this.getEnterpriseId();
    if (!overview || !overview.template_id || !enterpriseId || !version) {
      notification.warning({ message: '当前快照暂不可导出' });
      return Promise.resolve();
    }
    this.setSnapshotExportLoading(version, true);
    return appExport({
      enterprise_id: enterpriseId,
      app_id: overview.template_id,
      app_versions: [version],
      format: 'rainbond-app'
    })
      .then(() => {
        notification.success({
          message: formatMessage({
            id: 'notification.success.operate_successfully',
            defaultMessage: '操作成功，开始导出，请稍等！'
          })
        });
        return this.fetchSnapshotExportStatuses([version]);
      })
      .finally(() => {
        this.setSnapshotExportLoading(version, false);
      });
  };

  canRollbackSnapshot = item => {
    const { overview } = this.state;
    if (!item || !item.detail || !item.detail.version_id) {
      return false;
    }
    if (item.timelineState === 'runtime') {
      return false;
    }
    if (item.timelineState === 'history' || item.timelineState === 'upgrade') {
      return true;
    }
    return !!(overview && overview.has_changes);
  };

  canDeleteSnapshot = item => {
    const { overview } = this.state;
    if (!item || !item.detail || !item.detail.version_id) {
      return false;
    }
    if (!['history', 'upgrade'].includes(item.timelineState)) {
      return false;
    }
    return `${item.detail.version_id}` !== `${overview && overview.current_version_id}`;
  };

  canCreateSnapshot = overview => {
    const currentOverview = overview || this.state.overview || {};
    const hasSnapshotBaseline = !!(
      currentOverview.has_template &&
      currentOverview.current_version &&
      Number(currentOverview.snapshot_count || 0) > 0
    );
    if (!hasSnapshotBaseline) {
      return true;
    }
    return !!currentOverview.has_changes;
  };

  renderPersonalOverview = () => {
    const personalTemplate = this.getPersonalTemplate();
    const latestPublish = this.getLatestPublishRecord();
    const { overview } = this.state;
    const changeSummary = overview.change_summary || {};
    return (
      <Card bordered={false} className={styles.personalCard}>
        <div className={styles.personalHeader}>
          <div>
            <div className={styles.personalEyebrow}>应用版本</div>
            <div className={styles.personalTitle}>
              {personalTemplate.currentVersion === '未创建快照'
                ? '当前还没有快照版本'
                : `当前版本 ${personalTemplate.currentVersion}`}
            </div>
            <div className={styles.personalDesc}>
              {overview.has_changes
                ? `当前应用存在未快照变更：新增 ${changeSummary.added_count || 0} 个组件，修改 ${changeSummary.updated_count || 0} 个组件，删除 ${changeSummary.removed_count || 0} 个组件。`
                : '默认只展示当前应用的版本时间线；如果来源模板有更新，会在上方横幅里提示。'}
            </div>
          </div>
          <div className={styles.personalActions}>
            <Button
              type="primary"
              onClick={this.handleCreateSnapshot}
              disabled={!this.canCreateSnapshot(overview)}
            >
              创建快照
            </Button>
            <Button onClick={this.openPublishRecordsDrawer}>
              <Icon type="profile" />
              发布记录
            </Button>
          </div>
        </div>
        <div className={styles.personalStats}>
          <div className={styles.personalStat}>
            <span className={styles.personalStatLabel}>当前版本</span>
            <span className={styles.personalStatValue}>{personalTemplate.currentVersion}</span>
          </div>
          <div className={styles.personalStat}>
            <span className={styles.personalStatLabel}>快照数量</span>
            <span className={styles.personalStatValue}>{overview.snapshot_count || 0}</span>
          </div>
          <div className={styles.personalStat}>
            <span className={styles.personalStatLabel}>来源模板</span>
            <span className={styles.personalStatValue}>{overview.source_template_count || this.state.sourceGroups.length}</span>
          </div>
          <div className={styles.personalStat}>
            <span className={styles.personalStatLabel}>最近发布时间</span>
            <span className={styles.personalStatValue}>
              {latestPublish ? this.formatTime(latestPublish.create_time) : '未发布'}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  renderUpgradeBanner = () => {
    const upgradeableSources = this.getUpgradeableSources();
    if (!upgradeableSources.length) {
      return null;
    }
    const primarySource = upgradeableSources[0];
    const upgradeableComponentCount = this.getUpgradeableComponentCount(upgradeableSources);
    return (
      <Card bordered={false} className={styles.upgradeBanner}>
        <div className={styles.upgradeBannerInner}>
          <div className={styles.upgradeBannerIcon}>
            <Icon type="thunderbolt" />
          </div>
          <div className={styles.upgradeBannerContent}>
            <div className={styles.upgradeBannerTitle}>
              {`发现 ${upgradeableComponentCount} 个组件有新版本`}
            </div>
            <div className={styles.upgradeBannerDesc}>
              {upgradeableSources.length > 1
                ? '建议查看升级详情后升级。'
                : `${primarySource.templateName} 可升级到 ${primarySource.latestVersion}。`}
            </div>
            <div className={styles.upgradeBannerMeta}>
              {upgradeableSources.map(source => (
                <span key={source.id} className={styles.upgradeBannerMetaItem}>
                  {source.templateName} {source.currentVersion} -> {source.latestVersion}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.upgradeBannerActions}>
            <Button
              type="primary"
              className={styles.upgradeBannerButton}
              onClick={() => {
                if (upgradeableSources.length > 1) {
                  this.openSourceUpgradeDrawer();
                } else {
                  this.openUpgradePage(primarySource);
                }
              }}
            >
              {upgradeableSources.length > 1 ? '查看升级详情' : '去升级'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  getSourceTimeline = template => {
    const hasUpgradeVersion =
      template.latestVersion &&
      template.latestVersion !== '-' &&
      `${template.latestVersion}` !== `${template.currentVersion}`;
    const relatedRecords = (this.state.upgradeRecords || [])
      .filter(record => {
        const sameGroupKey = `${record.group_key || ''}` === `${template.groupKey || ''}`;
        const sameUpgradeGroup =
          `${record.upgrade_group_id || ''}` === `${template.upgradeGroupId || ''}` ||
          !record.upgrade_group_id;
        return sameGroupKey && sameUpgradeGroup;
      })
      .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime());

    const latestNode =
      hasUpgradeVersion
        ? {
            id: `${template.id}-latest`,
            title: `${template.templateName} ${template.latestVersion}`,
            subTitle: template.marketName
              ? `${template.marketName} / 待升级版本`
              : '待升级版本',
            createTime: this.state.appDetail.update_time || this.state.appDetail.create_time,
            description: `上游检测到新版本 ${template.latestVersion}，可以从当前安装版本继续升级。`,
            detail: {
              ...template,
              currentVersion: template.latestVersion
            },
            timelineState: 'upgrade',
            isCurrent: false
          }
        : null;

    const currentNode = {
      id: `${template.id}-current`,
      title: `${template.templateName} ${template.currentVersion}`,
      subTitle: template.marketName ? `${template.marketName} / 当前已安装版本` : '当前已安装版本',
      createTime: this.state.appDetail.update_time || this.state.appDetail.create_time,
      description: hasUpgradeVersion
        ? `当前运行在 ${template.currentVersion}，上方可升级到 ${template.latestVersion}`
        : '当前没有检测到更高的来源版本',
      detail: template,
      timelineState: 'current',
      isCurrent: true
    };

    const historyNodes = relatedRecords.map(record => ({
      id: `upgrade-${record.ID || record.id}`,
      title: `${template.templateName} ${record.version || template.currentVersion}`,
      subTitle: record.old_version ? `从 ${record.old_version} 升级到 ${record.version}` : '来源升级记录',
      createTime: record.create_time,
      description: `状态：${record.status}`,
      detail: record,
      timelineState: 'history',
      isCurrent: false
    }));

    return (latestNode ? [latestNode] : []).concat([currentNode]).concat(historyNodes);
  };

  renderTemplateTable = selectedTemplate => {
    const columns = [
      {
        title: '模板名称',
        dataIndex: 'templateName',
        key: 'templateName',
        render: (value, record) => (
          <div className={styles.templateNameCell}>
            <span className={styles.templateNameText}>{value}</span>
            <Tag color={record.templateType === 'personal' ? 'purple' : 'blue'}>
              {record.templateType === 'personal' ? '个人模板' : '应用商店'}
            </Tag>
          </div>
        )
      },
      {
        title: '当前版本',
        dataIndex: 'currentVersion',
        key: 'currentVersion',
        render: value => <Tag color="green">{value}</Tag>
      },
      {
        title: '最新版本',
        dataIndex: 'latestVersion',
        key: 'latestVersion',
        render: (value, record) =>
          record.templateType === 'market' ? <Tag color={record.canUpgrade ? 'orange' : 'default'}>{value}</Tag> : <span>-</span>
      },
      {
        title: '组件数',
        dataIndex: 'componentCount',
        key: 'componentCount'
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <div className={styles.tableActions}>
            {record.templateType === 'market' && (
              <Button size="small" onClick={() => this.openUpgradePage(record)} disabled={!record.canUpgrade}>
                升级
              </Button>
            )}
            {record.templateType === 'personal' && (
              this.renderPublishAction({
                recordVersion: record.currentVersion,
                disabled: record.currentVersion === '未发布',
                size: 'small'
              })
            )}
            <Button
              size="small"
              type={selectedTemplate && selectedTemplate.id === record.id ? 'primary' : 'default'}
              onClick={() => this.setState({ selectedTemplateId: record.id })}
            >
              {selectedTemplate && selectedTemplate.id === record.id ? '当前查看' : '查看时间线'}
            </Button>
          </div>
        )
      }
    ];

    return (
      <Card bordered={false} className={styles.templateCard}>
        <div className={styles.templateToolbar}>
          <div>
            <div className={styles.templateTitle}>模板列表</div>
            <div className={styles.templateHint}>上方切换模板，下方时间线只展示当前选中模板。</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" ghost onClick={this.openSourceUpgradeDrawer}>来源升级</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={this.getTemplateRows()}
          pagination={false}
          className={styles.templateTable}
          rowClassName={record =>
            selectedTemplate && selectedTemplate.id === record.id ? styles.templateRowActive : ''
          }
        />
      </Card>
    );
  };

  renderTemplateSwitcher = selectedTemplate => {
    const rows = this.getTemplateRows();
    return (
      <Card bordered={false} className={styles.switcherCard}>
        <div className={styles.switcherHeader}>
          <div>
            <div className={styles.templateTitle}>模板切换</div>
            <div className={styles.templateHint}>切换上方模板，下方只展示当前模板的版本时间线。</div>
          </div>
          <div className={styles.switcherActions}>
            <Button type="primary" ghost onClick={this.openSourceUpgradeDrawer}>来源升级</Button>
          </div>
        </div>
        <div className={styles.switcherRail}>
          {rows.map(record => {
            const active = selectedTemplate && selectedTemplate.id === record.id;
            return (
              <button
                key={record.id}
                type="button"
                className={`${styles.switcherChip} ${active ? styles.switcherChipActive : ''}`}
                onClick={() => this.setState({ selectedTemplateId: record.id })}
              >
                <span className={styles.switcherChipName}>{record.templateName}</span>
                <span className={styles.switcherChipType}>
                  {record.templateType === 'personal' ? '个人模板' : '应用商店'}
                </span>
                {record.templateType === 'market' && record.canUpgrade && (
                  <span className={styles.switcherChipStatus}>可升级</span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className={styles.switcherAddTab}
            onClick={this.openTemplateActionModal}
          >
            <Icon type="plus" />
          </button>
        </div>
        {selectedTemplate && (
          <div className={styles.switcherSummary}>
            <span className={styles.switcherSummaryLabel}>
              {selectedTemplate.templateType === 'personal' ? '个人模板' : '应用商店模板'}
            </span>
            <span>当前版本 {selectedTemplate.currentVersion}</span>
            {selectedTemplate.templateType === 'market' && selectedTemplate.latestVersion !== '-' && (
              <span>最新版本 {selectedTemplate.latestVersion}</span>
            )}
            <span>{selectedTemplate.componentCount} 个组件</span>
            {selectedTemplate.templateType === 'market' && selectedTemplate.canUpgrade && (
              <span className={styles.switcherSummaryUpgrade}>
                可升级到 {selectedTemplate.latestVersion}
              </span>
            )}
          </div>
        )}
      </Card>
    );
  };

  renderTimeline = () => {
    const timelineData = this.getPersonalTimeline();
    const publishPermission = this.getPublishPermissionInfo();

    return (
      <Card
        bordered={false}
        className={styles.historyCard}
        title={
          <div className={styles.historyTitle}>
            <Icon type="clock-circle" />
            <span>版本时间线</span>
          </div>
        }
      >
        {timelineData.length > 0 ? (
          <Timeline className={styles.historyTimeline}>
            {timelineData.map(item => (
              <Timeline.Item
                key={item.id}
                dot={
                  <span
                    className={
                      item.timelineState === 'runtime'
                        ? styles.timelineDotRuntime
                        : item.timelineState === 'upgrade'
                        ? styles.timelineDotUpgrade
                        : item.timelineState === 'current'
                          ? styles.timelineDotCurrent
                          : styles.timelineDotHistory
                    }
                  />
                }
                color="blue"
              >
                <Card
                  bordered={false}
                  className={`${styles.timelineCard} ${
                    item.timelineState === 'runtime'
                      ? styles.timelineRuntime
                      : item.timelineState === 'upgrade'
                      ? styles.timelineUpgrade
                      : item.timelineState === 'current'
                        ? styles.timelineCurrent
                        : styles.timelineHistory
                  }`}
                >
                  <div className={styles.timelineHeader}>
                    <div>
                      <div className={styles.timelineTopline}>
                        <span
                          className={`${styles.timelineTypeTag} ${
                            item.timelineState === 'runtime'
                              ? styles.timelineTypeTagRuntime
                              : item.timelineState === 'upgrade'
                              ? styles.timelineTypeTagUpgrade
                              : item.timelineState === 'current'
                                ? styles.timelineTypeTagCurrent
                                : styles.timelineTypeTagHistory
                          }`}
                        >
                          {item.timelineState === 'runtime'
                            ? '当前状态'
                            : item.timelineState === 'current'
                              ? '当前版本'
                              : item.timelineState === 'upgrade'
                                ? '升级版本'
                              : '历史版本'}
                        </span>
                      </div>
                      <div className={styles.timelineTitleRow}>
                        <div className={styles.timelineTitle}>
                          {item.timelineState === 'runtime' ? (
                            <span>{item.version}</span>
                          ) : (
                            <>
                              <span className={styles.timelineTitlePrefix}>应用版本</span>
                              <span>{item.version}</span>
                            </>
                          )}
                        </div>
                        <div className={styles.timelineVersionDesc}>{item.description}</div>
                      </div>
                      <div className={styles.timelineMeta}>
                        <span>{item.timeLabel || '创建于'}：{this.formatTime(item.createTime)}</span>
                        {item.detail && item.detail.diff_summary && item.detail.diff_summary.has_changes && (
                          <span style={{ marginLeft: 16 }}>
                            变化：新增 {item.detail.diff_summary.added_count || 0}，修改 {item.detail.diff_summary.updated_count || 0}，删除 {item.detail.diff_summary.removed_count || 0}
                          </span>
                        )}
                      </div>
                      <div className={styles.timelineSummary}>
                        <div className={styles.timelineComponentLabel}>
                          {(item.componentLabel || '包含组件')}{item.componentNames && item.componentNames.length ? `（${item.componentNames.length}）` : ''}
                        </div>
                        {item.componentNames && item.componentNames.length ? (
                          <div className={styles.timelineComponentList}>
                            {item.componentNames.map(componentName => (
                              <span
                                key={`${item.id}-${componentName}`}
                                className={styles.timelineComponentChip}
                              >
                                {componentName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.timelineComponentEmpty}>{item.emptyComponentText || '当前版本未返回组件信息'}</div>
                        )}
                      </div>
                    </div>
                    <div className={styles.timelineActions}>
                      <Button size="small" onClick={() => this.setState({ detailVisible: true, detailRecord: item.detail })}>
                        查看详情
                      </Button>
                      {item.timelineState === 'runtime' ? (
                        <Button
                          size="small"
                          type="primary"
                          onClick={this.handleCreateSnapshot}
                          disabled={!this.canCreateSnapshot()}
                        >
                          创建快照
                        </Button>
                      ) : null}
                      {publishPermission.isShare && item.timelineState !== 'runtime' && item.detail && item.detail.version ? (
                        this.renderPublishAction({
                          recordVersion: item.actionVersion,
                          size: 'small',
                          type: 'primary',
                          ghost: true
                        })
                      ) : null}
                      {item.timelineState !== 'runtime' && item.detail && item.detail.version ? (
                        <AppExportAction
                          exportStatus={this.getSnapshotExportStatus(item.actionVersion)}
                          loading={!!this.state.snapshotExportLoadingMap[item.actionVersion]}
                          disabled={!this.canExportSnapshot(item.actionVersion)}
                          onExport={() => this.handleExportSnapshot(item.actionVersion)}
                        />
                      ) : null}
                      {this.canRollbackSnapshot(item) ? (
                        <Button size="small" onClick={() => this.handleRollbackSnapshot(item.detail.version_id)}>
                          回滚
                        </Button>
                      ) : null}
                      {this.canDeleteSnapshot(item) ? (
                        <Button size="small" onClick={() => this.confirmDeleteSnapshot(item)}>
                          删除
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div className={styles.timelineEmpty}>
            <Empty description="当前应用还没有快照版本" />
            <Button type="primary" onClick={this.handleCreateSnapshot}>
              创建第一个快照
            </Button>
          </div>
        )}
      </Card>
    );
  };

  getPublishRecordScopeLabel = record => {
    if (!record) {
      return '-';
    }
    switch (record.scope) {
      case '':
        return formatMessage({ id: 'appPublish.table.scope.market' });
      case 'team':
        return formatMessage({ id: 'appPublish.table.scope.team_market' });
      case 'enterprise':
        return formatMessage({ id: 'appPublish.table.scope.enterprise_market' });
      default:
        return (
          (record.scope_target && record.scope_target.store_name) ||
          formatMessage({ id: 'appPublish.table.scope.app_shop' })
        );
    }
  };

  renderPublishRecordStatus = status => {
    switch (status) {
      case 0:
        return formatMessage({ id: 'appPublish.table.status.release' });
      case 1:
        return (
          <span style={{ color: globalUtil.getPublicColor('rbd-success-status') }}>
            {formatMessage({ id: 'appPublish.table.status.release_finish' })}
          </span>
        );
      case 2:
        return (
          <span style={{ color: globalUtil.getPublicColor('rbd-content-color') }}>
            {formatMessage({ id: 'appPublish.table.status.canceled' })}
          </span>
        );
      default:
        return '-';
    }
  };

  renderPublishRecordsDrawer = () => {
    const publishPermission = this.getPublishPermissionInfo();
    const columns = [
      {
        title: formatMessage({ id: 'appPublish.table.publishName' }),
        dataIndex: 'app_model_name',
        key: 'app_model_name',
        render: (value, record) =>
          value || (
            <span style={{ color: globalUtil.getPublicColor('rbd-content-color') }}>
              {record.status === 0
                ? formatMessage({ id: 'appPublish.table.versions.notSpecified' })
                : '-'}
            </span>
          )
      },
      {
        title: formatMessage({ id: 'appPublish.table.versions' }),
        dataIndex: 'version',
        key: 'version',
        render: (value, record) => {
          const versionAlias = record.version_alias ? `(${record.version_alias})` : '';
          return value || versionAlias
            ? `${value || ''}${versionAlias}`
            : formatMessage({ id: 'appPublish.table.versions.notSpecified' });
        }
      },
      {
        title: formatMessage({ id: 'appPublish.table.scope' }),
        dataIndex: 'scope',
        key: 'scope',
        render: (_, record) => this.getPublishRecordScopeLabel(record)
      },
      {
        title: formatMessage({ id: 'appPublish.table.publishTime' }),
        dataIndex: 'create_time',
        key: 'create_time',
        render: value => this.formatTime(value)
      },
      {
        title: formatMessage({ id: 'appPublish.table.status' }),
        dataIndex: 'status',
        key: 'status',
        render: value => this.renderPublishRecordStatus(value)
      },
      {
        title: formatMessage({ id: 'appPublish.table.operate' }),
        key: 'operate',
        render: (_, record) => {
          const actions = [];
          if (record.status === 0) {
            if (publishPermission.isShare) {
              actions.push(
                <Button size="small" key="continue" onClick={() => this.continuePublishRecord(record)}>
                  {formatMessage({ id: 'appPublish.table.btn.continue' })}
                </Button>
              );
            }
            if (publishPermission.isDelete) {
              actions.push(
                <Button size="small" key="cancel" onClick={() => this.cancelPublishRecord(record.record_id)}>
                  {formatMessage({ id: 'appPublish.table.btn.release_cancel' })}
                </Button>
              );
            }
          } else {
            if (
              (record.scope === 'team' || record.scope === 'enterprise') &&
              publishPermission.isExport
            ) {
              actions.push(
                <Button size="small" key="export" onClick={() => this.showSharedAppExport(record)}>
                  {formatMessage({ id: 'applicationMarket.localMarket.export_app' })}
                  {this.state.sharedAppExporting
                    ? ` ${formatMessage({ id: 'applicationMarket.localMarket.in_export' })}`
                    : ''}
                </Button>
              );
            }
            if (publishPermission.isDelete) {
              actions.push(
                <Button size="small" key="delete" onClick={() => this.confirmDeletePublishRecord(record.record_id)}>
                  {formatMessage({ id: 'appPublish.table.btn.delete' })}
                </Button>
              );
            }
          }
          return actions.length > 0 ? <div className={styles.tableActions}>{actions}</div> : '-';
        }
      }
    ];

    return (
      <Drawer
        title="发布记录"
        width={1040}
        visible={this.state.publishRecordsVisible}
        onClose={this.closePublishRecordsDrawer}
      >
        <div className={styles.templateToolbar}>
          <div>
            <div className={styles.templateTitle}>发布记录</div>
            <div className={styles.templateHint}>
              发布完成后会回到这里，你可以继续未完成任务，或查看已发布到组件库和云应用商店的记录。
            </div>
          </div>
        </div>
        <Table
          rowKey={record => record.record_id || `${record.app_model_id || 'record'}-${record.create_time || ''}`}
          columns={columns}
          dataSource={this.state.publishRecords}
          loading={this.state.publishRecordsLoading}
          pagination={false}
          className={styles.templateTable}
        />
      </Drawer>
    );
  };

  renderSourceUpgradeDrawer = () => {
    const sourceGroups = this.state.sourceGroups || [];
    return (
      <Drawer
        title="来源升级"
        width={560}
        visible={this.state.sourceUpgradeVisible}
        onClose={this.closeSourceUpgradeDrawer}
      >
        {sourceGroups.length > 0 ? (
          <div className={styles.centerSection}>
            {sourceGroups.map(source => (
              <Card key={source.id} bordered={false} className={styles.sourceCard}>
                <div className={styles.sourceHeader}>
                  <div>
                    <div className={styles.sourceTitle}>
                      <span>{source.templateName}</span>
                      {source.marketName && <Tag color="blue">{source.marketName}</Tag>}
                      {source.canUpgrade && <Tag color="orange">可升级</Tag>}
                    </div>
                    <div className={styles.sourceMeta}>
                      <span>当前版本：{source.currentVersion}</span>
                      <span>最新版本：{source.latestVersion}</span>
                      <span>组件数：{source.componentCount}</span>
                    </div>
                  </div>
                  <div className={styles.timelineActions}>
                    <Button onClick={() => this.openUpgradePage(source)} disabled={!source.canUpgrade}>
                      {source.canUpgrade ? '去升级' : '暂无升级'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="当前应用下还没有检测到应用商店安装模板" />
        )}
      </Drawer>
    );
  };

  renderDetailDrawer = () => {
    const record = this.state.detailRecord;
    if (!record) {
      return null;
    }
    const isRuntimeRecord = record.detail_mode === 'runtime';
    return (
      <Drawer
        title="详情"
        width={720}
        visible={this.state.detailVisible}
        onClose={() => this.setState({ detailVisible: false, detailRecord: null })}
      >
        <div className={styles.drawerBlock}>
          <div className={styles.drawerTitle}>基础信息</div>
          <div className={styles.drawerDesc}>
            <p>名称：{record.app_model_name || record.templateName || record.group_name || record.title || '-'}</p>
            {isRuntimeRecord ? (
              <p>快照基线：{record.baseline_version || record.currentVersion || '-'}</p>
            ) : (
              <p>版本：{record.version || record.currentVersion || '-'}</p>
            )}
            <p>版本说明：{record.app_version_info || (isRuntimeRecord ? '当前运行态尚未固化为快照版本' : '当前快照未填写版本说明')}</p>
            {record.version_alias && <p>版本别名：{record.version_alias}</p>}
            {record.scope && <p>发布范围：{this.formatPublishScope(record.scope)}</p>}
            {record.create_time && <p>{isRuntimeRecord ? '最近更新时间' : '创建时间'}：{this.formatTime(record.create_time)}</p>}
            {record.marketName && <p>来源市场：{record.marketName}</p>}
            {record.includedComponentNames && record.includedComponentNames.length > 0 && (
              <p>包含组件：{record.includedComponentNames.join('、')}</p>
            )}
          </div>
        </div>
        {this.renderDetailDiffSection(record)}
      </Drawer>
    );
  };

  render() {
    const {
      selectStoreVisible,
      storeLoading,
      storeList,
      storeName,
      isAuthCompany,
      showExporterApp,
      exporterAppData
    } = this.state;
    return (
      <PageHeaderLayout
        title={formatMessage({
          id: 'appVersion.page.title',
          defaultMessage: '应用版本'
        })}
        content={formatMessage(
          {
            id: 'appVersion.page.content',
            defaultMessage: '当前应用：{appName}'
          },
          { appName: this.getAppName() }
        )}
        titleSvg={pageheaderSvg.getPageHeaderSvg('upgrade', 18)}
      >
        <div className={styles.page}>
          {this.state.loading ? (
            <Spin />
          ) : (
            <>
              {this.renderUpgradeBanner()}
              {this.renderPersonalOverview()}
              {this.renderTimeline()}
            </>
          )}
        </div>
        {this.renderPublishRecordsDrawer()}
        {this.renderSourceUpgradeDrawer()}
        {this.renderDetailDrawer()}
        {showExporterApp && exporterAppData && (
          <AppExporter
            eid={this.getEnterpriseId()}
            setIsExporting={this.setSharedAppExporting}
            app={exporterAppData}
            onOk={this.hideSharedAppExport}
            onCancel={this.hideSharedAppExport}
            team_name={globalUtil.getCurrTeamName()}
            regionName={globalUtil.getCurrRegionName()}
          />
        )}
        <SelectStore
          loading={storeLoading}
          dispatch={this.props.dispatch}
          storeList={storeList}
          enterprise_id={this.getEnterpriseId()}
          visible={selectStoreVisible}
          onCancel={this.hideSelectStore}
          onOk={this.handleSelectStore}
        />
        {isAuthCompany && (
          <AuthCompany
            eid={this.getEnterpriseId()}
            marketName={storeName}
            currStep={2}
            onCancel={() => {
              this.setState({
                isAuthCompany: false,
                pendingPublishVersion: ''
              });
            }}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
