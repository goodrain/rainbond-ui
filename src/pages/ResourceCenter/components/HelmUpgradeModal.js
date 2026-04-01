import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Icon,
  Input,
  List,
  Modal,
  notification,
  Select,
  Spin,
  Tag,
  Upload,
} from 'antd';
import Result from '@/components/Result';
import { getHelmChartUrlValidation, getHelmChartUrlValidationMessage } from '../helmChartUrl';
import { getPreferredHelmValuesFileKey, getSortedHelmValuesFileKeys } from '../helmValues';
import HelmIcon from './HelmIcon';
import styles from '../index.less';

const { Option } = Select;
const { TextArea } = Input;
const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

function getChartDescription(chart = {}) {
  return chart.description || (chart.versions && chart.versions[0] && chart.versions[0].description) || '';
}

export default class HelmUpgradeModal extends PureComponent {
  previewRequestId = 0;
  state = this.buildInitialState();

  getNextPreviewRequestId = () => {
    this.previewRequestId += 1;
    return this.previewRequestId;
  };

  invalidatePreviewRequests = () => {
    this.previewRequestId += 1;
  };

  isLatestPreviewRequest = requestId => requestId === this.previewRequestId;

  getSourceInfo() {
    return ((this.props.targetRelease || {}).source_info) || {};
  }

  isStoreLocked() {
    const sourceInfo = this.getSourceInfo();
    return sourceInfo.upgrade_mode === 'store_locked' || sourceInfo.source_type === 'store';
  }

  getDefaultSourceType() {
    return this.isStoreLocked() ? 'store' : 'external';
  }

  getLockedRepoName() {
    return this.getSourceInfo().repo_name || '';
  }

  getLockedChartName() {
    return this.getSourceInfo().chart_name || ((this.props.targetRelease || {}).chart) || '';
  }

  componentDidUpdate(prevProps) {
    const becameVisible = this.props.visible && !prevProps.visible;
    const becameHidden = !this.props.visible && prevProps.visible;
    const targetChanged = (
      this.props.visible &&
      prevProps.targetRelease &&
      this.props.targetRelease &&
      prevProps.targetRelease.name !== this.props.targetRelease.name
    );
    if (becameHidden) {
      this.invalidatePreviewRequests();
    }
    if (becameVisible || targetChanged) {
      this.resetState();
      this.fetchHelmRepos();
      if (!this.isStoreLocked()) {
        this.initHelmUploadSession();
      }
    }
  }

  buildInitialState() {
    const releaseName = ((this.props.targetRelease || {}).name) || '';
    return {
      sourceType: this.getDefaultSourceType(),
      installLoading: false,
      repos: [],
      repoLoading: false,
      currentRepo: this.getLockedRepoName(),
      allCharts: [],
      charts: [],
      chartLoading: false,
      chartSearch: '',
      chartPage: 1,
      chartPageSize: 9,
      chartTotal: 0,
      selectedChart: null,
      storeForm: { version: '', release_name: releaseName, values: '' },
      previewLoading: false,
      previewData: null,
      previewFileKey: '',
      previewStatus: 'idle',
      previewError: '',
      configVisible: false,
      externalForm: {
        chart_protocol: 'https://',
        chart_address: '',
        auth_type: 'none',
        release_name: releaseName,
        values: '',
        username: '',
        password: '',
      },
      uploadRecord: {},
      uploadEventId: '',
      uploadFileList: [],
      uploadExistFiles: [],
      uploadChartInfo: null,
      uploadLoading: false,
      uploadForm: { version: '', release_name: releaseName, values: '' },
    };
  }

  resetState = () => {
    this.invalidatePreviewRequests();
    this.setState(this.buildInitialState());
  };

  buildPreviewResetState = (extra = {}) => {
    this.invalidatePreviewRequests();
    return {
      previewLoading: false,
      previewData: null,
      previewFileKey: '',
      previewStatus: 'idle',
      previewError: '',
      configVisible: false,
      ...extra,
    };
  };

  getParams() {
    const { teamName, regionName } = this.props;
    return { teamName, regionName };
  }

  getErrorMessage = (err, fallbackMessage) =>
    (err && (
      err.msg_show
      || (err.response && err.response.data && err.response.data.msg_show)
      || (err.data && err.data.msg_show)
    )) || fallbackMessage;

  getChartIcon = (chart) => {
    const versions = (chart && chart.versions) || [];
    return (chart && chart.icon) || (versions[0] && versions[0].icon) || '';
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

  buildExternalChartUrl = () => {
    const { externalForm } = this.state;
    return getHelmChartUrlValidation(
      externalForm.chart_protocol,
      externalForm.chart_address,
    ).chartUrl;
  };

  getExternalChartValidation = () => {
    const { externalForm } = this.state;
    return getHelmChartUrlValidation(
      externalForm.chart_protocol,
      externalForm.chart_address,
    );
  };

  getExternalChartValidationMessage = () => {
    const { errorCode } = this.getExternalChartValidation();
    return getHelmChartUrlValidationMessage(
      errorCode,
      descriptor => formatMessage(descriptor),
    );
  };

  fetchHelmRepos = () => {
    const { dispatch, currentEnterprise } = this.props;
    const { teamName } = this.getParams();
    const eid = currentEnterprise && currentEnterprise.enterprise_id;
    const lockedRepoName = this.getLockedRepoName();
    this.setState({ repoLoading: true });
    dispatch({
      type: 'market/HelmwaRehouseList',
      payload: { team_name: teamName },
      callback: res => {
        const list = (res && (res.list || res)) || [];
        const repos = Array.isArray(list) ? list : [];
        this.setState({ repos, repoLoading: false }, () => {
          if (repos.length > 0) {
            const matchedRepo = this.isStoreLocked()
              ? repos.find(repo => (repo.name || repo.repo_name || repo) === lockedRepoName)
              : null;
            const targetRepo = matchedRepo || repos[0];
            const repoName = targetRepo && (targetRepo.name || targetRepo.repo_name || targetRepo);
            if (repoName) {
              this.handleRepoSelect(repoName);
            }
          }
        });
        if (!repos.length) {
          this.setState({ repos: [] });
        }
      },
      handleError: () => this.setState({ repoLoading: false }),
    });
    this.enterpriseID = eid;
  };

  handleRepoSelect = (repoName) => {
    const { dispatch, currentEnterprise } = this.props;
    const eid = currentEnterprise && currentEnterprise.enterprise_id;
    this.setState({
      currentRepo: repoName,
      chartLoading: true,
      chartSearch: '',
      chartPage: 1,
      allCharts: [],
      charts: [],
      selectedChart: null,
      ...this.buildPreviewResetState(),
    });
    dispatch({
      type: 'market/fetchHelmMarkets',
      payload: { enterprise_id: eid, repo_name: repoName },
      callback: res => {
        const all = Array.isArray(res)
          ? res.map(chart => ({
            ...chart,
            description: getChartDescription(chart),
          }))
          : [];
        this.setState({
          allCharts: all,
          chartLoading: false,
        }, () => {
          this.applyChartFilter();
          if (!this.isStoreLocked()) {
            return;
          }
          const lockedChartName = this.getLockedChartName();
          const lockedChart = all.find(chart => (chart.name || '') === lockedChartName);
          if (!lockedChart) {
            this.setState({
              previewLoading: false,
              previewData: null,
              previewFileKey: '',
              previewStatus: 'error',
              previewError: t('resourceCenter.helm.upgrade.lockedChartMissing', '未在已记录仓库中找到当前 Chart，请检查 Helm 仓库配置。'),
              configVisible: false,
            });
            return;
          }
          this.handleChartSelect(lockedChart);
        });
      },
      handleError: () => this.setState({ chartLoading: false }),
    });
  };

  applyChartFilter = () => {
    const { allCharts, chartSearch, chartPage, chartPageSize } = this.state;
    const keyword = (chartSearch || '').toLowerCase();
    const filtered = keyword
      ? allCharts.filter(item => (item.name || '').toLowerCase().includes(keyword))
      : allCharts;
    const total = filtered.length;
    const start = (chartPage - 1) * chartPageSize;
    this.setState({
      chartTotal: total,
      charts: filtered.slice(start, start + chartPageSize),
    });
  };

  handleChartSearch = value => {
    this.setState({ chartSearch: value, chartPage: 1 }, this.applyChartFilter);
  };

  handleChartPageChange = page => {
    this.setState({ chartPage: page }, this.applyChartFilter);
  };

  handleChartSelect = (chart) => {
    const versions = chart.versions || [];
    const version = (versions[0] && versions[0].version) || '';
    this.setState({
      selectedChart: chart,
      ...this.buildPreviewResetState(),
      storeForm: {
        ...this.state.storeForm,
        version,
        values: '',
      },
    }, () => {
      const { teamName, regionName } = this.getParams();
      this.fetchChartPreview({
        team: teamName,
        region: regionName,
        source_type: 'store',
        repo_name: this.state.currentRepo,
        chart: chart && chart.name,
        version,
      }, 'store');
    });
  };

  handleStoreVersionChange = (version) => {
    const { selectedChart, currentRepo, storeForm } = this.state;
    const { teamName, regionName } = this.getParams();
    this.setState({
      storeForm: { ...storeForm, version },
      ...this.buildPreviewResetState(),
    }, () => {
      this.fetchChartPreview({
        team: teamName,
        region: regionName,
        source_type: 'store',
        repo_name: currentRepo,
        chart: selectedChart && selectedChart.name,
        version,
      }, 'store');
    });
  };

  handleExternalFieldChange = (key, value) => {
    const resetKeys = ['chart_protocol', 'chart_address', 'auth_type', 'username', 'password'];
    this.setState({
      externalForm: {
        ...this.state.externalForm,
        [key]: value,
      },
      ...(resetKeys.indexOf(key) > -1 ? this.buildPreviewResetState() : {}),
    });
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
          uploadRecord: bean || {},
          uploadEventId: bean && bean.event_id,
        });
      },
      handleError: err => {
        notification.error({
          message: this.getErrorMessage(err, t('resourceCenter.helm.uploadSessionInitFailed', '初始化 Chart 上传会话失败')),
        });
      },
    });
  };

  fetchUploadStatus = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParams();
    const { uploadEventId } = this.state;
    if (!uploadEventId) {
      return;
    }
    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: regionName,
        team_name: teamName,
        event_id: uploadEventId,
      },
      callback: data => {
        const existFiles = (data && data.bean && data.bean.package_name) || [];
        this.setState({
          uploadExistFiles: existFiles,
          uploadLoading: false,
          ...this.buildPreviewResetState(),
        });
      },
      handleError: err => {
        this.setState({ uploadLoading: false });
        notification.error({
          message: this.getErrorMessage(err, t('resourceCenter.helm.uploadStatusLoadFailed', '读取上传状态失败')),
        });
      },
    });
  };

  handleUploadChange = info => {
    let fileList = info.fileList || [];
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.setState({ uploadFileList: fileList });
    if (info.file && info.file.status === 'uploading') {
      this.setState({ uploadLoading: true });
    }
    if (info.file && info.file.status === 'done') {
      this.fetchUploadStatus();
    }
    if (info.file && info.file.status === 'error') {
      this.setState({ uploadLoading: false });
      notification.error({ message: t('resourceCenter.helm.uploadFailed', 'Chart 包上传失败') });
    }
  };

  handleUploadRemove = () => {
    const { dispatch } = this.props;
    const { teamName } = this.getParams();
    const { uploadEventId } = this.state;
    if (!uploadEventId) {
      return;
    }
    this.setState({ uploadLoading: true });
    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: { team_name: teamName, event_id: uploadEventId },
      callback: () => {
        this.setState({
          uploadFileList: [],
          uploadExistFiles: [],
          uploadChartInfo: null,
          uploadLoading: false,
          ...this.buildPreviewResetState(),
          uploadForm: {
            version: '',
            release_name: ((this.props.targetRelease || {}).name) || '',
            values: '',
          },
        });
        this.initHelmUploadSession();
      },
      handleError: err => {
        this.setState({ uploadLoading: false });
        notification.error({
          message: this.getErrorMessage(err, t('resourceCenter.helm.uploadDeleteFailed', '删除上传包失败')),
        });
      },
    });
  };

  applyPreview = (preview, sourceType) => {
    const valuesMap = (preview && preview.values) || {};
    const firstKey = getPreferredHelmValuesFileKey(valuesMap);
    const decodedValues = firstKey ? this.decodeBase64Text(valuesMap[firstKey]) : '';
    const nextState = {
      previewLoading: false,
      previewData: preview || null,
      previewFileKey: firstKey,
      previewStatus: 'success',
      previewError: '',
      configVisible: true,
    };
    if (sourceType === 'store') {
      nextState.storeForm = { ...this.state.storeForm, values: decodedValues };
    } else if (sourceType === 'external') {
      nextState.externalForm = { ...this.state.externalForm, values: decodedValues };
    } else {
      nextState.uploadForm = {
        ...this.state.uploadForm,
        version: (preview && preview.version) || this.state.uploadForm.version,
        values: decodedValues,
      };
      nextState.uploadChartInfo = preview || null;
    }
    this.setState(nextState);
  };

  fetchChartPreview = (payload, sourceType) => {
    const { dispatch } = this.props;
    const requestId = this.getNextPreviewRequestId();
    this.setState({
      previewLoading: true,
      previewStatus: 'checking',
      previewError: '',
      configVisible: false,
    });
    dispatch({
      type: 'teamResources/previewHelmChart',
      payload,
      callback: bean => {
        if (!this.isLatestPreviewRequest(requestId)) {
          return;
        }
        this.applyPreview(bean, sourceType);
      },
      handleError: err => {
        if (!this.isLatestPreviewRequest(requestId)) {
          return;
        }
        const message = this.getErrorMessage(err, t('resourceCenter.helm.previewFailed', 'Chart 检测失败'));
        this.setState({
          previewLoading: false,
          previewStatus: 'error',
          previewError: message,
          configVisible: false,
        });
        notification.error({ message });
      },
    });
  };

  handlePreviewFileChange = (fileKey) => {
    const { previewData, sourceType } = this.state;
    const valuesMap = (previewData && previewData.values) || {};
    const decodedValues = fileKey ? this.decodeBase64Text(valuesMap[fileKey]) : '';
    const nextState = { previewFileKey: fileKey };
    if (sourceType === 'store') {
      nextState.storeForm = { ...this.state.storeForm, values: decodedValues };
    } else if (sourceType === 'external') {
      nextState.externalForm = { ...this.state.externalForm, values: decodedValues };
    } else {
      nextState.uploadForm = { ...this.state.uploadForm, values: decodedValues };
    }
    this.setState(nextState);
  };

  getUpgradeRisk = (payload) => {
    const currentChart = (((this.props.targetRelease || {}).chart) || '').trim();
    const previewChart = (((this.state.previewData || {}).name) || '').trim();
    if (!currentChart || !previewChart || currentChart === previewChart) {
      return null;
    }
    return { currentChart, previewChart, payload };
  };

  confirmRiskAndSubmit = (risk, submit) => {
    Modal.confirm({
      title: t('resourceCenter.helm.crossChartRiskTitle', '检测到跨 Chart 升级风险'),
      okText: t('resourceCenter.helm.crossChartRiskConfirm', '明确确认并继续'),
      cancelText: t('resourceCenter.common.cancel', '取消'),
      width: 620,
      content: (
        <div className={styles.riskConfirmText}>
          <div>{t('resourceCenter.helm.crossChartRisk.current', '当前 Release Chart：')}<strong>{risk.currentChart}</strong></div>
          <div>{t('resourceCenter.helm.crossChartRisk.target', '目标升级 Chart：')}<strong>{risk.previewChart}</strong></div>
          <div className={styles.riskConfirmSpacer}>{t('resourceCenter.helm.upgrade.riskDesc', 'Helm upgrade 不会自动清理旧资源，这种跨 Chart 升级可能导致资源混跑、流量异常和回滚不可预期。')}</div>
          <div className={styles.riskConfirmSpacer}>{t('resourceCenter.helm.crossChartRisk.suggestion', '更推荐使用 `helm uninstall + helm install` 完成替换，或使用新的 release 名称部署。')}</div>
        </div>
      ),
      onOk: submit,
    });
  };

  handleSubmit = () => {
    const { dispatch, targetRelease, onSuccess } = this.props;
    const { teamName, regionName } = this.getParams();
    const {
      sourceType,
      selectedChart,
      currentRepo,
      storeForm,
      externalForm,
      uploadEventId,
      uploadForm,
      uploadChartInfo,
      previewData,
    } = this.state;
    const targetReleaseName = (targetRelease && targetRelease.name) || '';
    let payload = null;
    let validationMessage = '';

    if (sourceType === 'store') {
      if (!selectedChart) {
        validationMessage = t('resourceCenter.helm.validation.selectChart', '请先选择一个 Helm Chart');
      } else if (!storeForm.version || !previewData) {
        validationMessage = t('resourceCenter.helm.upgrade.validation.finishPreview', '请先完成 Chart 检测');
      } else {
        payload = {
          team: teamName,
          region: regionName,
          source_type: 'store',
          repo_name: currentRepo,
          release_name: targetReleaseName,
          chart: selectedChart.name,
          version: storeForm.version,
          values: storeForm.values,
        };
      }
    } else if (sourceType === 'external') {
      const chartValidation = this.getExternalChartValidation();
      const chartUrl = chartValidation.chartUrl;
      const isOCI = chartUrl.indexOf('oci://') === 0;
      if (!chartValidation.hasValue) {
        validationMessage = t('resourceCenter.helm.validation.chartUrl', '请填写 Chart 地址');
      } else if (chartValidation.errorCode) {
        validationMessage = this.getExternalChartValidationMessage();
      } else if (externalForm.auth_type === 'basic' && (!externalForm.username || !externalForm.password)) {
        validationMessage = t('resourceCenter.helm.validation.basicAuth', '请选择 Basic 鉴权时填写用户名和密码');
      } else if (!previewData) {
        validationMessage = t('resourceCenter.helm.validation.previewFirst', '请先检测 Chart');
      } else {
        payload = {
          team: teamName,
          region: regionName,
          source_type: isOCI ? 'oci' : 'repo',
          chart_url: chartUrl,
          release_name: targetReleaseName,
          values: externalForm.values,
          username: externalForm.auth_type === 'basic' ? externalForm.username : '',
          password: externalForm.auth_type === 'basic' ? externalForm.password : '',
        };
      }
    } else if (!uploadEventId || !uploadChartInfo) {
      validationMessage = t('resourceCenter.helm.validation.uploadFirst', '请先上传并检测 Chart 包');
    } else {
      payload = {
        team: teamName,
        region: regionName,
        source_type: 'upload',
        event_id: uploadEventId,
        version: uploadForm.version,
        release_name: targetReleaseName,
        values: uploadForm.values,
      };
    }

    if (validationMessage) {
      notification.warning({ message: validationMessage });
      return;
    }

    const submitUpgrade = (nextPayload) => {
      this.setState({ installLoading: true });
      dispatch({
        type: 'teamResources/upgradeRelease',
        payload: nextPayload,
        callback: () => {
          this.setState({ installLoading: false });
          if (onSuccess) {
            onSuccess();
          }
        },
        handleError: err => {
          this.setState({ installLoading: false });
          notification.error({
            message: this.getErrorMessage(err, t('resourceCenter.helm.upgradeFailed', '升级失败')),
          });
        },
      });
    };

    const risk = this.getUpgradeRisk(payload);
    if (risk) {
      this.confirmRiskAndSubmit(risk, () => submitUpgrade({
        ...payload,
        allow_chart_replace: true,
      }));
      return;
    }

    submitUpgrade(payload);
  };

  renderTargetBanner() {
    const target = this.props.targetRelease || {};
    const sourceInfo = this.getSourceInfo();
    const sourceText = this.isStoreLocked()
      ? t('resourceCenter.helm.upgrade.storeMode', '升级方式：Helm 商店（仓库 {repo}，Chart {chart}）', {
        repo: sourceInfo.repo_name || '-',
        chart: sourceInfo.chart_name || target.chart || '-',
      })
      : t('resourceCenter.helm.upgrade.genericMode', '升级方式：通用升级（第三方仓库 / OCI 或上传 Chart 包）');
    return (
      <div className={styles.modalBanner} style={{ marginBottom: 16 }}>
        <div className={styles.modalBannerTitle}>
          {t('resourceCenter.helm.modal.upgradeRelease', '升级 Release：')}{target.name || '-'}
        </div>
        <div className={styles.modalBannerMeta}>
          {t('resourceCenter.helm.modal.currentChart', '当前 Chart：')}{target.chart || '-'}
          <span style={{ marginLeft: 8 }}>{t('resourceCenter.helm.modal.currentVersion', '当前版本：')}{target.chart_version || '-'}</span>
        </div>
        <div className={styles.modalSoftText} style={{ marginTop: 6 }}>
          {sourceText}
        </div>
      </div>
    );
  }

  renderSourceTabs() {
    if (this.isStoreLocked()) {
      return null;
    }
    const { sourceType } = this.state;
    const tabs = [
      { key: 'external', label: t('resourceCenter.helm.modal.tabExternal', '第三方仓库 / OCI'), helper: t('resourceCenter.helm.modal.tabExternalHelper', '支持官方、自建 Repo 与 OCI') },
      { key: 'upload', label: t('resourceCenter.helm.modal.tabUpload', '上传 Chart 包'), helper: t('resourceCenter.helm.modal.tabUploadHelper', '上传 .tgz 后直接安装 Release') },
    ];
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {tabs.map(tab => {
          const active = sourceType === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => this.setState({
                sourceType: tab.key,
                ...this.buildPreviewResetState(),
              })}
              className={`${styles.modalCard} ${active ? styles.modalCardActive : ''}`}
              style={{ flex: 1, cursor: 'pointer', padding: '12px 14px' }}
            >
              <div className={active ? styles.resourceLink : styles.modalSectionLabel}>{tab.label}</div>
              <div className={styles.modalMutedText} style={{ marginTop: 4 }}>{tab.helper}</div>
            </div>
          );
        })}
      </div>
    );
  }

  renderPreviewHeader() {
    const {
      sourceType,
      selectedChart,
      previewData,
      currentRepo,
      uploadEventId,
    } = this.state;
    const preview = previewData || {};
    const chartName = preview.name || (selectedChart && selectedChart.name);
    if (!chartName) {
      return null;
    }
    const chartDesc = preview.description || getChartDescription(selectedChart);
    const chartVersion = preview.version || (selectedChart && selectedChart.versions && selectedChart.versions[0] && selectedChart.versions[0].version) || '-';
    const sourceLabel = sourceType === 'store'
      ? t('resourceCenter.helm.modal.repoSource', '仓库：{value}', { value: currentRepo || '-' })
      : sourceType === 'external'
        ? t('resourceCenter.helm.modal.sourceUrl', '来源：{value}', { value: this.buildExternalChartUrl() || '-' })
        : t('resourceCenter.helm.modal.uploadSession', '上传会话：{value}', { value: uploadEventId || '-' });
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Avatar
            shape="square"
            size={48}
            src={this.getChartIcon(selectedChart) || preview.icon}
            icon="appstore"
            className={styles.modalCardIcon}
          />
          <div style={{ flex: 1 }}>
            <div className={styles.modalSectionTitle} style={{ marginBottom: 4 }}>{chartName}</div>
            {chartDesc ? <div className={styles.modalSoftText} style={{ marginBottom: 8 }}>{chartDesc}</div> : null}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }} className={styles.modalMutedText}>
              <span>{sourceLabel}</span>
              <span>{t('resourceCenter.helm.modal.versionLabel', '版本号 {value}', { value: chartVersion })}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  renderDetectState() {
    const { previewStatus, previewError } = this.state;
    if (previewStatus === 'checking') {
      return (
        <Card>
          <Result type="ing" title={t('resourceCenter.helm.modal.checkingTitle', '应用包检验中')} description={t('resourceCenter.helm.modal.checkingDesc', '应用包检验中，请耐心等候...')} style={{ marginTop: 36, marginBottom: 12 }} />
        </Card>
      );
    }
    if (previewStatus === 'success') {
      return (
        <Card>
          <Result
            type="success"
            title={t('resourceCenter.helm.modal.checkSuccessTitle', '应用包检验成功')}
            description={t('resourceCenter.helm.upgrade.checkSuccessDesc', '应用包检验成功，已自动展开 values 配置。')}
            style={{ marginTop: 36, marginBottom: 12 }}
          />
        </Card>
      );
    }
    if (previewStatus === 'error') {
      return (
        <Card>
          <Result
            type="error"
            title={t('resourceCenter.helm.modal.checkFailedTitle', '应用包检验失败')}
            description={previewError || t('resourceCenter.helm.modal.checkFailedDesc', 'Chart 检测失败，请检查地址、权限或 Chart 内容。')}
            style={{ marginTop: 36, marginBottom: 12 }}
          />
        </Card>
      );
    }
    return null;
  }

  renderConfigPanel(formKey) {
    const { previewData, previewFileKey } = this.state;
    const valuesMap = (previewData && previewData.values) || {};
    const valueFiles = getSortedHelmValuesFileKeys(valuesMap);
    const readme = previewData && this.decodeBase64Text(previewData.readme);
    const formState = formKey === 'external'
      ? this.state.externalForm
      : formKey === 'upload'
        ? this.state.uploadForm
        : this.state.storeForm;
    const valuesField = formKey === 'external' ? 'externalForm' : formKey === 'upload' ? 'uploadForm' : 'storeForm';
    return (
      <Collapse bordered={false} defaultActiveKey={['config', 'readme']}>
        <Collapse.Panel key="config" header={t('resourceCenter.helm.modal.configOptions', '配置选项')}>
          {formKey === 'upload' && (
            <Form.Item label={t('resourceCenter.common.version', '版本')} style={{ marginBottom: 16 }}>
              <Input
                value={formState.version || (previewData && previewData.version) || ''}
                onChange={e => this.setState({
                  [valuesField]: {
                    ...formState,
                    version: e.target.value,
                  },
                })}
                placeholder={t('resourceCenter.helm.modal.defaultVersionHint', '默认使用解析出的版本')}
              />
            </Form.Item>
          )}
          {valueFiles.length > 0 && (
            <Form.Item label={t('resourceCenter.common.valuesFile', 'Values 文件')} style={{ marginBottom: 16 }}>
              <Select value={previewFileKey} onChange={this.handlePreviewFileChange}>
                {valueFiles.map(fileKey => <Option key={fileKey} value={fileKey}>{fileKey}</Option>)}
              </Select>
            </Form.Item>
          )}
          <Form.Item label="values.yaml" style={{ marginBottom: 0 }}>
            <TextArea
              rows={16}
              value={formState.values}
              onChange={e => this.setState({
                [valuesField]: {
                  ...formState,
                  values: e.target.value,
                },
              })}
              style={{
                minHeight: 320,
              }}
              className={styles.modalDarkEditor}
            />
          </Form.Item>
        </Collapse.Panel>
        {readme ? (
          <Collapse.Panel key="readme" header={t('resourceCenter.helm.modal.readmeTitle', '应用说明')}>
            <div className={styles.modalReadme} style={{ maxHeight: 240, overflowY: 'auto' }}>
              {readme}
            </div>
          </Collapse.Panel>
        ) : null}
      </Collapse>
    );
  }

  renderStorePane() {
    const {
      repos,
      repoLoading,
      currentRepo,
      chartLoading,
      chartSearch,
      charts,
      chartTotal,
      chartPage,
      chartPageSize,
      selectedChart,
      storeForm,
      configVisible,
    } = this.state;
    const versions = (selectedChart && selectedChart.versions) || [];
    const lockedChartName = this.getLockedChartName();
    if (this.isStoreLocked()) {
      if (repoLoading || chartLoading) {
        return <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin tip={t('resourceCenter.helm.upgrade.loadingStoreInfo', '加载商店应用信息...')} /></div>;
      }
      return (
        <div>
          <div className={styles.modalSectionNotice} style={{ marginBottom: 20 }}>
            {t('resourceCenter.helm.upgrade.storeNotice', '当前 Release 由 Helm 商店安装。升级时仓库与 Chart 已固定，只需选择目标版本并修改 values。')}
          </div>
          {this.renderPreviewHeader()}
          <Form layout="vertical">
            <Form.Item label={t('resourceCenter.detail.sourceRepo', '来源仓库')} style={{ marginBottom: 16 }}>
              <Input value={currentRepo || this.getLockedRepoName()} disabled />
            </Form.Item>
            <Form.Item label={t('resourceCenter.common.chart', 'Chart')} style={{ marginBottom: 16 }}>
              <Input value={lockedChartName} disabled />
            </Form.Item>
            <Form.Item label={t('resourceCenter.common.version', '版本')} required style={{ marginBottom: 16 }}>
              {versions.length > 0 ? (
                <Select value={storeForm.version} onChange={this.handleStoreVersionChange}>
                  {versions.map(ver => <Option key={ver.version} value={ver.version}>{ver.version}</Option>)}
                </Select>
              ) : (
                <Input value={storeForm.version} disabled placeholder={t('resourceCenter.helm.upgrade.loadingVersions', '正在读取可升级版本')} />
              )}
            </Form.Item>
            <Form.Item label={t('resourceCenter.common.releaseName', 'Release 名称')} style={{ marginBottom: 16 }}>
              <Input value={storeForm.release_name} disabled />
            </Form.Item>
          </Form>
          {configVisible ? this.renderConfigPanel('store') : this.renderDetectState()}
        </div>
      );
    }
    if (repoLoading) {
      return <div className={styles.modalLoadingBlock}><Spin tip={t('resourceCenter.helm.modal.loadingRepos', '加载仓库列表...')} /></div>;
    }
    if (!repos.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.modal.noRepos', '暂无 Helm 仓库，请先在应用市场中添加 Helm 仓库')} className={styles.modalLoadingBlock} />;
    }
    return (
      <div>
        <div style={{ display: 'flex', minHeight: 360 }}>
          <div className={styles.modalRepoSidebar} style={{ width: 160, flexShrink: 0, paddingRight: 0 }}>
            <div className={styles.modalSidebarTitle}>{t('resourceCenter.helm.modal.repoTitle', 'Helm 仓库')}</div>
            {repos.map(repo => {
              const name = repo.name || repo.repo_name || repo;
              const active = currentRepo === name;
              return (
                <div
                  key={name}
                  onClick={() => this.handleRepoSelect(name)}
                  className={`${styles.modalRepoItem} ${active ? styles.modalRepoItemActive : ''}`}
                >
                  <Icon type="database" className={styles.modalUploadIcon} />
                  <span className={styles.modalRepoItemText}>{name}</span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, paddingLeft: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Input.Search
                placeholder={t('resourceCenter.helm.modal.searchChart', '搜索 Chart 名称...')}
                value={chartSearch}
                onChange={e => this.handleChartSearch(e.target.value)}
                onSearch={this.handleChartSearch}
                allowClear
                size="small"
                style={{ width: 240 }}
              />
            </div>
            {chartLoading ? (
              <div className={styles.modalLoadingBlock}><Spin tip={t('resourceCenter.helm.modal.loadingCharts', '加载 Chart 列表...')} /></div>
            ) : !charts.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.modal.noCharts', '暂无 Chart')} className={styles.modalLoadingBlock} />
            ) : (
              <>
                <List
                  grid={{ gutter: 12, column: 3 }}
                  dataSource={charts}
                  renderItem={chart => {
                    const versionsList = chart.versions || [];
                    const latestVer = (versionsList[0] && versionsList[0].version) || chart.version || '';
                    return (
                      <List.Item style={{ marginBottom: 8 }}>
                        <Card
                          size="small"
                          hoverable
                          onClick={() => this.handleChartSelect(chart)}
                          bodyStyle={{ padding: '12px 14px' }}
                          className={styles.modalCard}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                            <Avatar
                              shape="square"
                              size={20}
                              src={this.getChartIcon(chart)}
                              icon="appstore"
                              className={styles.modalCardIcon}
                            />
                            <span className={styles.modalCardTitle}>{chart.name}</span>
                          </div>
                          <div className={styles.modalCardDesc} style={{ marginBottom: 6 }}>{getChartDescription(chart)}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {latestVer ? <Tag className={`${styles.smallTag} ${styles.tagPrimary} ${styles.modalTagPrimary}`}>{latestVer}</Tag> : null}
                            {versionsList.length > 1 ? <span className={styles.modalMutedText}>{t('resourceCenter.helm.modal.versionCount', '共 {count} 个版本', { count: versionsList.length })}</span> : null}
                          </div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
                {chartTotal > chartPageSize ? (
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    {Array.from({ length: Math.ceil(chartTotal / chartPageSize) }, (_, index) => index + 1).map(page => (
                      <Button
                        key={page}
                        size="small"
                        type={page === chartPage ? 'primary' : 'default'}
                        style={{ margin: '0 2px', minWidth: 28 }}
                        onClick={() => this.handleChartPageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
        {selectedChart ? (
          <div style={{ marginTop: 16 }}>
            {this.renderPreviewHeader()}
            <Form layout="vertical">
              <Form.Item label={t('resourceCenter.common.version', '版本')} required style={{ marginBottom: 16 }}>
                {versions.length > 0 ? (
                  <Select value={storeForm.version} onChange={this.handleStoreVersionChange}>
                    {versions.map(ver => <Option key={ver.version} value={ver.version}>{ver.version}</Option>)}
                  </Select>
                ) : (
                  <Input value={storeForm.version} disabled />
                )}
              </Form.Item>
              <Form.Item label={t('resourceCenter.common.releaseName', 'Release 名称')} style={{ marginBottom: 16 }}>
                <Input value={storeForm.release_name} disabled />
              </Form.Item>
            </Form>
            {configVisible ? this.renderConfigPanel('store') : this.renderDetectState()}
          </div>
        ) : null}
      </div>
    );
  }

  renderExternalPane() {
    const { externalForm, previewLoading, configVisible } = this.state;
    const chartValidationMessage = this.getExternalChartValidationMessage();
    const isBasicAuth = externalForm.auth_type === 'basic';
    const chartUrl = this.buildExternalChartUrl();
    const detectDisabled = !chartUrl || (isBasicAuth && (!externalForm.username || !externalForm.password));
    return (
      <div>
        <div className={styles.modalSectionNotice} style={{ marginBottom: 20 }}>
          {t('resourceCenter.helm.modal.externalNoticeShort', '请直接填写 Chart 地址，支持 Helm Repo 包地址和 OCI 制品地址。')}
        </div>
        <Form layout="vertical">
          <Form.Item
            label={t('resourceCenter.common.chartAddress', 'Chart 地址')}
            required
            style={{ marginBottom: 8 }}
            validateStatus={chartValidationMessage ? 'error' : undefined}
            help={chartValidationMessage || undefined}
          >
            <Input.Group compact>
              <Select value={externalForm.chart_protocol} onChange={value => this.handleExternalFieldChange('chart_protocol', value)} style={{ width: 120 }}>
                <Option value="https://">https://</Option>
                <Option value="http://">http://</Option>
                <Option value="oci://">oci://</Option>
              </Select>
              <Input
                value={externalForm.chart_address}
                onChange={e => this.handleExternalFieldChange('chart_address', e.target.value)}
                style={{ width: 'calc(100% - 120px)' }}
                placeholder={externalForm.chart_protocol === 'oci://' ? 'registry-1.docker.io/bitnamicharts/nginx:15.9.0' : 'charts.bitnami.com/bitnami/nginx-15.9.0.tgz'}
              />
            </Input.Group>
          </Form.Item>
          <Form.Item label={t('resourceCenter.common.authType', '鉴权方式')} required style={{ marginBottom: 16 }}>
            <Select value={externalForm.auth_type} onChange={value => this.handleExternalFieldChange('auth_type', value)} style={{ width: 180 }}>
              <Option value="none">None</Option>
              <Option value="basic">Basic</Option>
            </Select>
          </Form.Item>
          {isBasicAuth ? (
            <>
              <Form.Item label={t('resourceCenter.common.username', '用户名')} required style={{ marginBottom: 16 }}>
                <Input value={externalForm.username} onChange={e => this.handleExternalFieldChange('username', e.target.value)} />
              </Form.Item>
              <Form.Item label={t('resourceCenter.common.password', '密码')} required style={{ marginBottom: 16 }}>
                <Input.Password value={externalForm.password} onChange={e => this.handleExternalFieldChange('password', e.target.value)} />
              </Form.Item>
            </>
          ) : null}
          <Form.Item label={t('resourceCenter.common.releaseName', 'Release 名称')} style={{ marginBottom: 16 }}>
            <Input value={externalForm.release_name} disabled />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon="search"
              loading={previewLoading}
              disabled={detectDisabled}
              onClick={() => {
                const { teamName, regionName } = this.getParams();
                this.fetchChartPreview({
                  team: teamName,
                  region: regionName,
                  source_type: chartUrl.indexOf('oci://') === 0 ? 'oci' : 'repo',
                  chart_url: chartUrl,
                  username: isBasicAuth ? externalForm.username : '',
                  password: isBasicAuth ? externalForm.password : '',
                }, 'external');
              }}
            >
              {t('resourceCenter.helm.modal.detectChart', '检测 Chart')}
            </Button>
          </Form.Item>
        </Form>
        {!configVisible ? this.renderPreviewHeader() : null}
        {configVisible ? this.renderConfigPanel('external') : this.renderDetectState()}
      </div>
    );
  }

  renderUploadPane() {
    const {
      uploadRecord,
      uploadFileList,
      uploadExistFiles,
      uploadLoading,
      previewLoading,
      configVisible,
    } = this.state;
    return (
      <div>
        <div className={styles.modalSectionNotice} style={{ marginBottom: 20 }}>
          {t('resourceCenter.helm.upgrade.uploadNotice', '上传 `.tgz` Chart 包后，系统会自动解析版本与默认 values，并直接以 Helm Release 方式升级。')}
        </div>
        <Form layout="vertical">
          <Form.Item label={t('resourceCenter.helm.modal.uploadChartLabel', '上传 Chart 包')} required style={{ marginBottom: 12 }}>
            <Upload
              name="packageTarFile"
              fileList={uploadFileList}
              action={uploadRecord && uploadRecord.upload_url}
              onChange={this.handleUploadChange}
              onRemove={() => this.setState({ uploadFileList: [] })}
              accept=".tgz"
            >
              <Button icon="upload" loading={uploadLoading} disabled={!uploadRecord || !uploadRecord.upload_url}>{t('resourceCenter.helm.modal.selectChartPackage', '选择 Chart 包')}</Button>
            </Upload>
          </Form.Item>
          {uploadExistFiles.length ? (
            <Form.Item label={t('resourceCenter.helm.modal.uploadedFiles', '已上传文件')} style={{ marginBottom: 12 }}>
              <div className={styles.modalUploadBox} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {uploadExistFiles.map(item => (
                    <div key={item} className={styles.modalUploadFile}>
                      <Icon type="inbox" className={styles.modalUploadIcon} />
                      {item}
                    </div>
                  ))}
                </div>
                <Button type="link" style={{ paddingRight: 0 }} onClick={this.handleUploadRemove} loading={uploadLoading}>{t('resourceCenter.common.delete', '删除')}</Button>
              </div>
            </Form.Item>
          ) : null}
          {uploadExistFiles.length ? (
            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon="search"
                loading={previewLoading}
                onClick={() => {
                  const { teamName, regionName } = this.getParams();
                  this.fetchChartPreview({
                    team: teamName,
                    region: regionName,
                    source_type: 'upload',
                    event_id: this.state.uploadEventId,
                  }, 'upload');
                }}
              >
                {t('resourceCenter.helm.modal.detectChart', '检测 Chart')}
              </Button>
            </Form.Item>
          ) : null}
        </Form>
        {!configVisible ? this.renderPreviewHeader() : null}
        {configVisible ? this.renderConfigPanel('upload') : (
          this.state.previewStatus === 'idle'
            ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.upgrade.uploadPreviewHint', '上传并检测后将在这里展示 Chart 信息')} />
            : this.renderDetectState()
        )}
      </div>
    );
  }

  renderBody() {
    const { sourceType } = this.state;
    if (sourceType === 'store') {
      return this.renderStorePane();
    }
    if (sourceType === 'external') {
      return this.renderExternalPane();
    }
    return this.renderUploadPane();
  }

  renderFooter() {
    const {
      sourceType,
      installLoading,
      storeForm,
      externalForm,
      uploadChartInfo,
      uploadForm,
      previewData,
      previewLoading,
    } = this.state;
    let disabled = false;
    if (sourceType === 'store') {
      disabled = !storeForm.release_name || !storeForm.version || !previewData || previewLoading;
    } else if (sourceType === 'external') {
      disabled = !externalForm.release_name || !previewData || previewLoading;
    } else {
      disabled = !uploadChartInfo || !uploadForm.release_name || !previewData || previewLoading;
    }
    return (
      <span>
        <Button onClick={this.props.onClose} style={{ marginRight: 8 }}>{t('resourceCenter.common.cancel', '取消')}</Button>
        <Button type="primary" loading={installLoading} disabled={disabled} onClick={this.handleSubmit}>{t('resourceCenter.common.upgrade', '升级')}</Button>
      </span>
    );
  }

  render() {
    return (
      <Modal
        title={(
          <span>
            <HelmIcon size={16} className={styles.modalMutedText} style={{ marginRight: 8 }} />
            {t('resourceCenter.helm.modal.upgradeTitle', '升级 Helm Release')}
          </span>
        )}
        visible={this.props.visible}
        width={1080}
        destroyOnClose
        onCancel={this.props.onClose}
        footer={this.renderFooter()}
        bodyStyle={{ padding: '16px 20px 20px' }}
      >
        {this.renderTargetBanner()}
        {this.renderSourceTabs()}
        {this.renderBody()}
      </Modal>
    );
  }
}
