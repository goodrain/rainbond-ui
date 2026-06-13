/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Icon,
  Input,
  InputNumber,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import dateUtil from '../../utils/date-util';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import {
  getBackupRepoOptions,
  getBackupRepoPhase,
  getBackupRepoPhaseTextId,
  isBackupRepoSelectable,
  validateBackupRepoSelection
} from '@/utils/backupRepoReadiness';
import styles from './databaseBackup.less';

const { Option } = Select;
const RadioGroup = Radio.Group;
const { Panel } = Collapse;
const READY_BACKUP_REPO_PHASE = 'Ready';
const FAILED_BACKUP_REPO_PHASES = ['Failed', 'Missing'];
const BACKUP_REPO_READY_REFRESH_INTERVAL = 3000;
const BACKUP_REPO_READY_MAX_RETRIES = 10;
const BACKUP_LIST_REFRESH_INTERVAL = 5000;
const DEFAULT_BACKUP_REPO_BUCKET = 'kubeblocks-backup';
const DEFAULT_BACKUP_REPO_VOLUME_CAPACITY = '100Gi';
const DEFAULT_BACKUP_REPO_FORCE_PATH_STYLE = 'true';

const isBackupRepoReady = repo => getBackupRepoPhase(repo) === READY_BACKUP_REPO_PHASE;
const isBackupRepoFailed = repo => FAILED_BACKUP_REPO_PHASES.includes(getBackupRepoPhase(repo));
const isForcePathStyleValue = value => !(value === false || value === 'false');
const getBackupRepoForcePathStyleValue = repo => {
  if (!repo) return DEFAULT_BACKUP_REPO_FORCE_PATH_STYLE;
  const value = repo.forcePathStyle !== undefined ? repo.forcePathStyle : repo.force_path_style;
  return isForcePathStyleValue(value) ? 'true' : 'false';
};
const getBackupRepoPhaseText = phase => {
  const messageId = getBackupRepoPhaseTextId(phase);
  if (messageId) {
    return formatMessage({ id: messageId });
  }
  return phase;
};

const getBackupRepoPhaseColor = phase => {
  if (phase === READY_BACKUP_REPO_PHASE) return 'green';
  if (phase === 'Failed' || phase === 'Missing') return 'red';
  if (phase === 'PreChecking' || phase === 'Deleting') return 'orange';
  return 'blue';
};

const getBackupRepoConditionMessage = repo => {
  const conditions = (repo && repo.conditions) || [];
  const failed = conditions.find(item => item.status === 'False' && item.message);
  const latest = failed || conditions.find(item => item.message);
  return latest ? latest.message : '';
};

/**
 * 数据库备份页面组件
 * 功能：
 * 显示和编辑备份策略
 * 手动备份
 * 管理备份列表
 */

@connect(
  ({ appControl, kubeblocks }) => ({
    appDetail: appControl.appDetail,
    clusterDetail: kubeblocks.clusterDetail,
    backupRepos: kubeblocks.backupRepos,
    backupList: kubeblocks.backupList
  }),
  null,
  null,
  { pure: false, withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      editBackupInfo: false, // 是否处于编辑状态
      backupSchedule: '', // 备份周期：hour/day/week
      backupStartDay: '', // 备份开始日期（周）
      backupStartHour: '', // 备份开始小时
      backupStartMinute: '', // 备份开始分钟
      backupRetentionTime: '', // 备份保留时间
      backupRetentionUnit: 'day', // 备份保留单位
      termination_policy: '', // 删除策略
      backupRepo: '', // 备份仓库名称
      restoreVisible: false, // 恢复确认弹窗显示状态
      selectedBackupName: '', // 选中要恢复的备份名称
      restoring: false, // 恢复操作进行中
      repoManageVisible: false,
      repoModalVisible: false,
      repoModalType: 'create',
      editingRepo: null,
      repoSubmitting: false,
      // 分页状态
      backupPagination: {
        page: 1,
        page_size: 6,
        total: 0
      }
    };

  }

  /**
   * 获取默认时间配置
   */
  getDefaultBackupTimeConfig = (schedule) => {
    const config = {
      backupStartMinute: '00' 
    };

    if (schedule === 'day' || schedule === 'week') {
      config.backupStartHour = '00'; 
    }

    if (schedule === 'week') {
      config.backupStartDay = '1'; 
    }

    return config;
  };

  /**
   * 更新备份配置状态
   */
  updateBackupConfigState = (stateUpdates, formUpdates = {}) => {
    const { form } = this.props;

    this.setState(stateUpdates);

    if (Object.keys(formUpdates).length > 0) {
      form.setFieldsValue(formUpdates);
    }
  };

  componentDidMount() {
    this.fetchBackupRepos();
    this.initFromClusterDetail();
    this.fetchBackupList();

    this.startAutoRefresh();
  }

  // 当 props.clusterDetail 变化时，只在非编辑状态下重新初始化界面状态
  componentDidUpdate(prevProps) {
    if (prevProps.clusterDetail !== this.props.clusterDetail && !this.state.editBackupInfo) {
      this.initFromClusterDetail();
    }
  }

  componentWillUnmount() {
    this.stopAutoRefresh();
    this.clearBackupRepoReadyTimer();
  }



  // 仅在第一页时启用备份列表自动刷新
  startAutoRefresh = () => {
    this.stopAutoRefresh(); // 先清除现有定时器

    if (this.state.backupPagination.page === 1) {
      this.backupListTimer = setInterval(() => {
        // 再次检查是否还在第一页
        if (this.state.backupPagination.page === 1) {
          this.fetchBackupList(null, { showLoading: false });
        }
      }, BACKUP_LIST_REFRESH_INTERVAL);
    }
  };

  /**
   * 停止自动刷新
   */
  stopAutoRefresh = () => {
    if (this.backupListTimer) {
      clearInterval(this.backupListTimer);
      this.backupListTimer = null;
    }
  };

  fetchBackupRepos = (callback) => {
    const { dispatch } = this.props;

    dispatch({
      type: 'kubeblocks/fetchBackupRepos',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback,
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  clearBackupRepoReadyTimer = () => {
    if (this.backupRepoReadyTimer) {
      clearTimeout(this.backupRepoReadyTimer);
      this.backupRepoReadyTimer = null;
    }
  };

  getBackupRepoFromResponse = (response, repoName) => {
    const repos = response && Array.isArray(response.list) ? response.list : [];
    return repos.find(repo => {
      const normalized = typeof repo === 'string' ? { name: repo } : repo;
      return normalized && normalized.name === repoName;
    });
  };

  refreshBackupReposUntilReady = (repoName, retryCount = 0) => {
    this.clearBackupRepoReadyTimer();

    this.fetchBackupRepos(response => {
      const repo = this.getBackupRepoFromResponse(response, repoName);
      if (!repoName) {
        return;
      }
      if (isBackupRepoReady(repo)) {
        notification.success({ message: formatMessage({ id: 'kubeblocks.database.backup.repo.check_success' }) });
        return;
      }
      if (isBackupRepoFailed(repo)) {
        const description = getBackupRepoConditionMessage(repo);
        notification.error({
          message: formatMessage({ id: 'kubeblocks.database.backup.repo.check_failed' }),
          description
        });
        return;
      }
      if (retryCount >= BACKUP_REPO_READY_MAX_RETRIES) {
        notification.warning({ message: formatMessage({ id: 'kubeblocks.database.backup.repo.check_timeout' }) });
        return;
      }

      this.backupRepoReadyTimer = setTimeout(() => {
        this.backupRepoReadyTimer = null;
        this.refreshBackupReposUntilReady(repoName, retryCount + 1);
      }, BACKUP_REPO_READY_REFRESH_INTERVAL);
    });
  };

  /**
   * 分页获取备份列表
   */
  fetchBackupList = (page = null, options = {}) => {
    const { dispatch, appDetail } = this.props;
    const { backupPagination } = this.state;
    const { showLoading = true } = options;

    const serviceAlias = appDetail?.service?.service_alias;
    if (!serviceAlias) {
      return;
    }

    if (this.backupListRequestPending) {
      return;
    }
    this.backupListRequestPending = true;

    const currentPage = page !== null ? page : backupPagination.page;

    if (showLoading) {
      this.setState({ loading: true });
    }

    dispatch({
      type: 'kubeblocks/fetchBackupList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: serviceAlias,
        page: currentPage,
        page_size: backupPagination.page_size
      },
      callback: (response) => {
        this.backupListRequestPending = false;
        if (showLoading) {
          this.setState({ loading: false });
        }
        if (response && response.status_code === 200) {
          this.setState(prevState => ({
            backupPagination: {
              ...prevState.backupPagination,
              page: response.page || currentPage,
              total: response.total || 0
            }
          }));
        }
      },
      handleError: (err) => {
        this.backupListRequestPending = false;
        if (showLoading) {
          this.setState({ loading: false });
        }
        handleAPIError(err);
      }
    });
  };

  /**
   * 从 clusterDetail 解析备份配置数据
   */
  parseBackupConfig = (clusterDetail) => {
    if (!clusterDetail || !clusterDetail.backup) {
      return {
        backupSchedule: '',
        backupStartDay: '',
        backupStartHour: '',
        backupStartMinute: '',
        backupRetentionTime: '',
        backupRepo: '',
        termination_policy: ''
      };
    }

    const { backup } = clusterDetail;
    const { schedule, retentionPeriod, backupRepo } = backup;

    // 解析备份周期：将 API 返回的 frequency 转换为前端使用的 cycle
    let backupSchedule = '';
    if (schedule && schedule.frequency) {
      switch (schedule.frequency) {
        case 'hourly':
          backupSchedule = 'hour';
          break;
        case 'daily':
          backupSchedule = 'day';
          break;
        case 'weekly':
          backupSchedule = 'week';
          break;
        default:
          backupSchedule = '';
      }
    }

    const backupStartHour = schedule && schedule.hour !== undefined && schedule.hour !== null ? schedule.hour.toString().padStart(2, '0') : '';
    const backupStartMinute = schedule && schedule.minute !== undefined && schedule.minute !== null ? schedule.minute.toString().padStart(2, '0') : '';
    const backupStartDay = schedule && schedule.dayOfWeek !== undefined && schedule.dayOfWeek !== null ? schedule.dayOfWeek.toString() : '';

    let backupRetentionTime = '';
    if (retentionPeriod) {
      const match = retentionPeriod.match(/(\d+)d/);
      if (match) {
        backupRetentionTime = parseInt(match[1], 10);
      }
    }

    return {
      backupSchedule,
      backupStartDay,
      backupStartHour,
      backupStartMinute,
      backupRetentionTime,
      backupRepo: backupRepo || '',
      termination_policy: ''
    };
  };

  /**
   * 从 clusterDetail 初始化组件状态
   */
  initFromClusterDetail = () => {
    const { clusterDetail, form } = this.props;
    const config = this.parseBackupConfig(clusterDetail);
    this.setState(config);

    // 同步更新表单字段值
    form.setFieldsValue({
      backupRepo: config.backupRepo,
      backupSchedule: config.backupSchedule,
      backupRetention: config.backupRetentionTime || ''
    });
  };

  /**
   * 处理备份仓库变更
   */
  handleBackupRepoChange = (value) => {
    const { backupRepos = [] } = this.props;
    const { backupRetentionTime } = this.state;

    if (value?.trim() && !validateBackupRepoSelection(value, backupRepos)) {
      return;
    }

    if (value?.trim()) {
      const defaultSchedule = 'hour';
      const defaultTimeConfig = this.getDefaultBackupTimeConfig(defaultSchedule);

      this.updateBackupConfigState(
        {
          backupRepo: value,
          backupSchedule: defaultSchedule,
          backupRetentionTime: backupRetentionTime || 7,
          ...defaultTimeConfig
        },
        {
          backupRepo: value,
          backupSchedule: defaultSchedule,
          backupRetention: backupRetentionTime || 7
        }
      );
    } else {
      this.updateBackupConfigState(
        { backupRepo: value },
        { backupRepo: value }
      );
    }
  };

  validateBackupRepo = (rule, value, callback) => {
    const { backupRepos = [] } = this.props;
    if (validateBackupRepoSelection(value, backupRepos)) {
      callback();
      return;
    }
    callback(formatMessage({ id: 'kubeblocks.database.backup.repo_not_ready' }));
  };

  /**
   * 处理备份周期变更
   */
  handleBackupScheduleChange = (e) => {
    const newSchedule = e.target.value;
    const { backupStartHour, backupStartMinute, backupStartDay } = this.state;

    const stateUpdates = { backupSchedule: newSchedule };

    const defaultConfig = this.getDefaultBackupTimeConfig(newSchedule);

    if (newSchedule === 'hour') {
      if (!backupStartMinute && backupStartMinute !== '0') {
        stateUpdates.backupStartMinute = defaultConfig.backupStartMinute;
      }
    } else if (newSchedule === 'day') {
      if (!backupStartHour && backupStartHour !== '0') {
        stateUpdates.backupStartHour = defaultConfig.backupStartHour;
      }
      if (!backupStartMinute && backupStartMinute !== '0') {
        stateUpdates.backupStartMinute = defaultConfig.backupStartMinute;
      }
    } else if (newSchedule === 'week') {
      if (!backupStartDay && backupStartDay !== '0') {
        stateUpdates.backupStartDay = defaultConfig.backupStartDay;
      }
      if (!backupStartHour && backupStartHour !== '0') {
        stateUpdates.backupStartHour = defaultConfig.backupStartHour;
      }
      if (!backupStartMinute && backupStartMinute !== '0') {
        stateUpdates.backupStartMinute = defaultConfig.backupStartMinute;
      }
    }

    this.updateBackupConfigState(
      stateUpdates,
      { backupSchedule: newSchedule }
    );
  };

  /**
   * 处理删除策略变更
   */
  handleTerminationPolicyChange = (e) => {
    this.setState({ termination_policy: e.target.value });
    const { form } = this.props;
    form.setFieldsValue({ termination_policy: e.target.value });
  };

  /**
   * 保存备份配置
   */
  handleSaveBackupConfig = () => {
    const { form, dispatch, appDetail } = this.props;
    const { backupSchedule, backupStartDay, backupStartHour, backupStartMinute, backupRetentionTime, backupRepo, termination_policy } = this.state;

    form.validateFields(['backupRepo', 'backupSchedule', 'backupRetention'], (err) => {
      if (err) return;

      // 只有选择了备份仓库(启用备份功能)才需要校验备份配置参数
      if (backupRepo?.trim()) {
        if (!backupSchedule) {
          notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.cycle_required' }) });
          return;
        }
        if (!backupRetentionTime) {
          notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) });
          return;
        }
        if (backupSchedule === 'week') {
          if (!backupStartDay && backupStartDay !== 0 && backupStartDay !== '0') {
            notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_week_required' }) });
            return;
          }
        }
        if (backupSchedule === 'day' || backupSchedule === 'week') {
          if (!backupStartHour && backupStartHour !== 0 && backupStartHour !== '0') {
            notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_hour_required' }) });
            return;
          }
        }
        if (backupStartMinute === '' || backupStartMinute === undefined || backupStartMinute === null) {
          notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_minute_required' }) });
          return;
        }
      }

      const serviceId = appDetail?.service?.service_id;
      if (!serviceId) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.service_not_ready' }) });
        return;
      }

      const serviceAlias = appDetail?.service?.service_alias;
      if (!serviceAlias) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.service_not_ready' }) });
        return;
      }

      const backupConfig = {
        backupRepo: backupRepo || '',
        terminationPolicy: termination_policy || 'Delete',
        rbdService: { service_id: serviceId }
      };

      if (backupRepo?.trim()) {
        let frequency = 'daily';
        switch (backupSchedule) {
          case 'hour':
            frequency = 'hourly';
            break;
          case 'day':
            frequency = 'daily';
            break;
          case 'week':
            frequency = 'weekly';
            break;
          default:
            frequency = 'daily';
        }

        const schedule = {
          frequency,
          hour: parseInt(backupStartHour, 10) || 0,
          minute: parseInt(backupStartMinute, 10) || 0
        };
        if (backupSchedule === 'week') {
          schedule.dayOfWeek = parseInt(backupStartDay, 10);
        }

        backupConfig.schedule = schedule;
        backupConfig.retentionPeriod = `${backupRetentionTime}d`;
      }

      this.setState({ loading: true });
      dispatch({
        type: 'kubeblocks/updateBackupConfig',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: serviceAlias,
          body: backupConfig
        },
        callback: (res) => {
          this.setState({ loading: false });
          if (res && res.status_code === 200) {
            dispatch({
              type: 'kubeblocks/getClusterDetail',
              payload: {
                team_name: globalUtil.getCurrTeamName(),
                service_alias: serviceAlias
              },
              callback: () => {
                const successMessage = backupRepo?.trim()
                  ? formatMessage({ id: 'kubeblocks.database.backup.config.updated' })
                  : formatMessage({ id: 'kubeblocks.database.backup.disabled.success' });
                notification.success({ message: successMessage });
                this.setState({ editBackupInfo: false });
                this.fetchBackupList();
              }
            });
          } else {
            notification.error({ message: res?.msg_show || formatMessage({ id: 'notification.error.save' }) });
          }
        },
        handleError: (err) => {
          this.setState({ loading: false });
          handleAPIError(err);
        }
      });
    });
  };

  /**
   * 取消编辑
   * 重新从集群详情初始化配置，恢复到只读状态
   */
  handleCancelEdit = () => {
    const { form, clusterDetail } = this.props;

    const config = this.parseBackupConfig(clusterDetail);

    this.setState({ ...config, editBackupInfo: false });
    form.setFieldsValue({
      backupRepo: config.backupRepo,
      backupSchedule: config.backupSchedule,
      backupRetention: config.backupRetentionTime || ''
    });
  };

  /**
   * 处理分页切换
   */
  handlePageChange = (page, pageSize) => {
    this.setState(prevState => ({
      backupPagination: {
        ...prevState.backupPagination,
        page,
        page_size: pageSize
      }
    }), () => {
      this.fetchBackupList(page);
      this.startAutoRefresh();
    });
  };

  /**
   * 手动刷新列表
   */
  handleRefresh = () => {
    this.fetchBackupList();
  };

  openRepoManage = () => {
    this.fetchBackupRepos();
    this.setState({ repoManageVisible: true });
  };

  closeRepoManage = () => {
    this.setState({ repoManageVisible: false });
  };

  openRepoModal = (type, record = null) => {
    const { form } = this.props;
    this.setState({
      repoModalVisible: true,
      repoModalType: type,
      editingRepo: record
    }, () => {
      form.setFieldsValue({
        repoName: type === 'edit' ? record.name : '',
        repoDisplayName: type === 'edit' ? (record.displayName || record.display_name || record.name) : '',
        repoBucket: type === 'edit' ? record.bucket : DEFAULT_BACKUP_REPO_BUCKET,
        repoEndpoint: type === 'edit' ? record.endpoint : '',
        repoRegion: type === 'edit' ? record.region : '',
        repoForcePathStyle: type === 'edit' ? getBackupRepoForcePathStyleValue(record) : DEFAULT_BACKUP_REPO_FORCE_PATH_STYLE,
        repoPathPrefix: type === 'edit' ? (record.pathPrefix || '') : '',
        repoAccessKeyId: '',
        repoSecretAccessKey: ''
      });
    });
  };

  closeRepoModal = () => {
    const { form } = this.props;
    form.resetFields([
      'repoName',
      'repoDisplayName',
      'repoBucket',
      'repoEndpoint',
      'repoRegion',
      'repoForcePathStyle',
      'repoPathPrefix',
      'repoAccessKeyId',
      'repoSecretAccessKey'
    ]);
    this.setState({
      repoModalVisible: false,
      repoModalType: 'create',
      editingRepo: null,
      repoSubmitting: false
    });
  };

  handleRepoSubmit = () => {
    const { dispatch, form } = this.props;
    const { repoModalType, editingRepo } = this.state;
    const fields = [
      'repoName',
      'repoDisplayName',
      'repoBucket',
      'repoEndpoint',
      'repoRegion',
      'repoForcePathStyle',
      'repoPathPrefix',
      'repoAccessKeyId',
      'repoSecretAccessKey'
    ];

    form.validateFields(fields, (err, values) => {
      if (err) return;

      const body = {
        display_name: values.repoDisplayName || values.repoName,
        bucket: values.repoBucket,
        endpoint: values.repoEndpoint,
        region: values.repoRegion || '',
        force_path_style: values.repoForcePathStyle !== 'false',
        path_prefix: values.repoPathPrefix || ''
      };
      if (repoModalType === 'create') {
        body.name = values.repoName;
        body.volume_capacity = DEFAULT_BACKUP_REPO_VOLUME_CAPACITY;
      }
      if (values.repoAccessKeyId || values.repoSecretAccessKey) {
        body.access_key_id = values.repoAccessKeyId;
        body.secret_access_key = values.repoSecretAccessKey;
      }

      this.setState({ repoSubmitting: true });
      dispatch({
        type: repoModalType === 'create' ? 'kubeblocks/createBackupRepo' : 'kubeblocks/updateBackupRepo',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          region_name: globalUtil.getCurrRegionName(),
          repo_name: editingRepo && editingRepo.name,
          body
        },
        callback: res => {
          this.setState({ repoSubmitting: false });
          if (res && res.status_code === 200) {
            notification.info({ message: formatMessage({ id: 'kubeblocks.database.backup.repo.checking' }) });
            this.closeRepoModal();
            this.refreshBackupReposUntilReady(res.bean?.name || (editingRepo && editingRepo.name) || body.name);
          } else {
            notification.error({
              message: res?.msg_show || formatMessage({
                id: repoModalType === 'create'
                  ? 'kubeblocks.database.backup.repo.create_failed'
                  : 'kubeblocks.database.backup.repo.update_failed'
              })
            });
          }
        },
        handleError: err => {
          this.setState({ repoSubmitting: false });
          handleAPIError(err);
        }
      });
    });
  };

  handleDeleteRepo = (record) => {
    const { dispatch, form } = this.props;
    dispatch({
      type: 'kubeblocks/deleteBackupRepo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        repo_name: record.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'kubeblocks.database.backup.repo.delete_success' }) });
          if (this.state.backupRepo === record.name) {
            this.setState({ backupRepo: '' });
            form.setFieldsValue({ backupRepo: '' });
          }
          this.fetchBackupRepos();
        } else {
          notification.error({ message: res?.msg_show || formatMessage({ id: 'kubeblocks.database.backup.repo.delete_failed' }) });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };


  /**
   * 手动备份
   * 触发手动备份操作
   */
  handleManualBackup = () => {
    const { dispatch, appDetail } = this.props;
    const { backupPagination } = this.state;

    const serviceAlias = appDetail?.service?.service_alias;
    if (!serviceAlias) {
      notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.service_not_ready' }) });
      return;
    }

    dispatch({
      type: 'kubeblocks/createManualBackup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: serviceAlias
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.manual.success' })
          });
          this.setState({
            backupPagination: { ...backupPagination, page: 1 }
          }, () => {
            this.fetchBackupList(1);
            this.startAutoRefresh();
          });
        } else {
          notification.error({
            message: res?.msg_show || formatMessage({ id: 'kubeblocks.database.backup.manual.failed' })
          });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  /**
   * 删除备份
   * @param {String} backupName - 要删除的备份名称
   */
  handleDeleteBackup = (backupName) => {
    const { dispatch, appDetail } = this.props;

    const serviceAlias = appDetail?.service?.service_alias;
    if (!serviceAlias) {
      notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.delete.service_incomplete' }) });
      return;
    }

    this.setState({ loading: true });

    dispatch({
      type: 'kubeblocks/deleteBackups',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: serviceAlias,
        backups: [backupName]
      },
      callback: (res) => {
        this.setState({ loading: false });
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.delete.success' })
          });
          this.fetchBackupList();
        } else {
          notification.error({
            message: res?.msg_show || formatMessage({ id: 'kubeblocks.database.backup.delete.failed' })
          });
        }
      },
      handleError: (err) => {
        this.setState({ loading: false });
        handleAPIError(err);
        this.fetchBackupList();
      }
    });
  };

  /**
   * 显示恢复确认弹窗
   */
  handleShowRestoreConfirm = (backupName) => {
    this.setState({
      restoreVisible: true,
      selectedBackupName: backupName
    });
  };

  /**
   * 取消恢复操作
   */
  handleCancelRestore = () => {
    this.setState({
      restoreVisible: false,
      selectedBackupName: ''
    });
  };

  /**
   * 执行从备份恢复操作
   */
  handleConfirmRestore = () => {
    const { dispatch, appDetail } = this.props;
    const { selectedBackupName } = this.state;

    const serviceAlias = appDetail?.service?.service_alias;
    if (!serviceAlias) {
      notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.restore.service_incomplete' }) });
      return;
    }

    this.setState({ restoring: true });

    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    dispatch({
      type: 'kubeblocks/restoreFromBackup',
      payload: {
        team_name: teamName,
        service_alias: serviceAlias,
        body: { backup_name: selectedBackupName }
      },
      callback: (res) => {
        this.setState({
          restoring: false,
          restoreVisible: false,
          selectedBackupName: ''
        });

        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.restore.success' }),
            duration: 4
          });

          const newServiceAlias = res?.bean?.service_alias;
          const groupId = res?.bean?.group_id;

          if (newServiceAlias && groupId) {
            dispatch({
              type: 'global/fetchGroups',
              payload: { team_name: teamName }
            });

            dispatch(
              routerRedux.push(`/team/${teamName}/region/${regionName}/apps/${groupId}/overview?type=components&componentID=${newServiceAlias}&tab=overview`)
            );
          }
        } else {
          notification.error({
            message: res?.msg_show || formatMessage({ id: 'kubeblocks.database.backup.restore.failed' })
          });
        }
      },
      handleError: (err) => {
        this.setState({
          restoring: false,
          restoreVisible: false,
          selectedBackupName: ''
        });
        handleAPIError(err);
      }
    });
  };

  render() {
    const { form, clusterDetail, backupRepos = [], backupList = [] } = this.props;
    const { getFieldDecorator } = form;
    const {
      loading,
      editBackupInfo,
      backupSchedule,
      backupStartDay,
      backupStartHour,
      backupStartMinute,
      backupRetentionTime,
      termination_policy,
      backupRepo,
      restoreVisible,
      selectedBackupName,
      restoring,
      repoManageVisible,
      repoModalVisible,
      repoModalType,
      repoSubmitting,
      backupPagination
    } = this.state;

    // 数据库不支持备份功能
    const isBackupUnSupported = clusterDetail?.basic?.support_backup !== true;
    // 备份功能是否已启用（基于实际保存的配置，而不是编辑中的 state）
    const isBackupDisabled = !clusterDetail?.backup?.backupRepo ||
                             clusterDetail.backup.backupRepo.trim() === '';
    const backupRepoOptions = getBackupRepoOptions(backupRepos);

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 21 }
      }
    };

    // 备份列表列定义
    const backupColumns = [
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.name' }),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'Completed' ? 'green' : status === 'Failed' ? 'red' : 'blue'}>
            {status}
          </Tag>
        )
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.time' }),
        dataIndex: 'time',
        key: 'time',
        render: (t) => t ? dateUtil.format(t, 'yyyy-MM-dd hh:mm:ss') : '-'
      },
      {
        title: formatMessage({ id: 'button.operation' }),
        key: 'action',
        render: (_, record) => (
          <span>
            <Button
              type="link"
              size="small"
              icon="reload"
              style={{ color: '#1890ff', marginRight: 8 }}
              onClick={() => this.handleShowRestoreConfirm(record.name)}
              disabled={record.status !== 'Completed' || isBackupUnSupported}
            >
              {formatMessage({ id: 'kubeblocks.database.backup.restore.button' })}
            </Button>
            <Popconfirm
              title={formatMessage({ id: 'kubeblocks.database.backup.delete.confirm' })}
              onConfirm={() => this.handleDeleteBackup(record.name)}
              okText={formatMessage({ id: 'button.confirm' })}
              cancelText={formatMessage({ id: 'button.cancel' })}
            >
              <Button type="link" size="small" style={{ color: '#f5222d' }} disabled={isBackupUnSupported}>
                <Icon type="delete" /> {formatMessage({ id: 'button.delete' })}
              </Button>
            </Popconfirm>
          </span>
        )
      }
    ];

    const repoColumns = [
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.repo.display_name' }),
        key: 'repoInfo',
        width: 210,
        render: (_, record) => {
          const displayName = record.displayName || record.display_name || record.name || '-';
          const resourceName = record.name || '-';
          return (
            <div className={styles.repoNameCell}>
              <Tooltip title={displayName}>
                <span className={styles.repoPrimaryText}>{displayName}</span>
              </Tooltip>
              <Tooltip title={resourceName}>
                <span className={styles.repoResourceName}>{resourceName}</span>
              </Tooltip>
            </div>
          );
        }
      },
      {
        title: 'Bucket',
        dataIndex: 'bucket',
        key: 'bucket',
        width: 160,
        render: text => (
          <Tooltip title={text || '-'}>
            <span className={styles.repoMutedText}>{text || '-'}</span>
          </Tooltip>
        )
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpoint',
        key: 'endpoint',
        width: 300,
        render: text => (
          <Tooltip title={text || '-'}>
            <span className={styles.repoEndpointText}>{text || '-'}</span>
          </Tooltip>
        )
      },
      {
        title: 'Region',
        dataIndex: 'region',
        key: 'region',
        width: 90,
        render: text => <span className={styles.repoMutedText}>{text || '-'}</span>
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.repo.access_style' }),
        key: 'accessStyle',
        width: 140,
        render: (_, record) => {
          const forcePathStyle = getBackupRepoForcePathStyleValue(record) !== 'false';
          return (
            <span className={styles.repoMutedText}>
              {formatMessage({
                id: forcePathStyle
                  ? 'kubeblocks.database.backup.repo.access_style_path_short'
                  : 'kubeblocks.database.backup.repo.access_style_virtual_short'
              })}
            </span>
          );
        }
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.repo.status' }),
        dataIndex: 'phase',
        key: 'phase',
        width: 100,
        render: (phase, record) => {
          const tag = (
            <Tag color={getBackupRepoPhaseColor(phase)}>
              {getBackupRepoPhaseText(phase) || '-'}
            </Tag>
          );
          const message = getBackupRepoConditionMessage(record);
          return message ? <Tooltip title={message}>{tag}</Tooltip> : tag;
        }
      },
      {
        title: formatMessage({ id: 'button.operation' }),
        key: 'action',
        width: 120,
        render: (_, record) => (
          <span className={styles.repoActionGroup}>
            <Button type="link" size="small" onClick={() => this.openRepoModal('edit', record)}>
              {formatMessage({ id: 'componentOverview.body.tab.env.table.column.edit' })}
            </Button>
            <Popconfirm
              title={formatMessage({ id: 'kubeblocks.database.backup.repo.delete_confirm' })}
              onConfirm={() => this.handleDeleteRepo(record)}
              okText={formatMessage({ id: 'button.confirm' })}
              cancelText={formatMessage({ id: 'button.cancel' })}
            >
              <Button type="link" size="small" className={styles.repoDeleteButton}>
                {formatMessage({ id: 'button.delete' })}
              </Button>
            </Popconfirm>
          </span>
        )
      }
    ];

    if (!clusterDetail) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div className={styles.databaseBackupPage}>
        {/* 不支持备份的数据库展示提醒 */}
        {isBackupUnSupported && (
          <Alert
            showIcon
            message={formatMessage({ id: 'kubeblocks.database.backup.unsupported.alert' })}
            type="info"
            style={{
              marginBottom: 16
            }}
          />
        )}
        {/* 备份策略 */}
        <Card
          className={styles.backupPolicyCard}
          title={formatMessage({ id: 'kubeblocks.database.backup.page.title' })}
          extra={
            <div className={styles.backupPolicyActions}>
              <Button
                icon="database"
                disabled={isBackupUnSupported}
                onClick={this.openRepoManage}
              >
                {formatMessage({ id: 'kubeblocks.database.backup.repo.manage' })}
              </Button>
              {editBackupInfo ? (
                <div className={styles.backupEditActions}>
                  <Button type="primary" onClick={this.handleSaveBackupConfig}>
                    {formatMessage({ id: 'appPublish.table.btn.confirm' })}
                  </Button>
                  <Button onClick={this.handleCancelEdit}>
                    {formatMessage({ id: 'appPublish.table.btn.cancel' })}
                  </Button>
                </div>
              ) : (
                <Button
                  icon="edit"
                  disabled={isBackupUnSupported}
                  onClick={() => this.setState({ editBackupInfo: true })}
                >
                  {formatMessage({ id: 'componentOverview.body.tab.env.table.column.edit' })}
                </Button>
              )}
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form layout="horizontal" hideRequiredMark className={styles.backupPolicyForm}>
            {/* 备份仓库 */}
            <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.repo_label' })}>
              {getFieldDecorator('backupRepo', {
                initialValue: backupRepo || '',
                rules: [{ required: false }, { validator: this.validateBackupRepo }]
              })(
                <Select
                  className={styles.backupRepoSelect}
                  placeholder={formatMessage({ id: 'kubeblocks.database.backup.repo_placeholder' })}
                  onChange={this.handleBackupRepoChange}
                  allowClear
                  disabled={!editBackupInfo || isBackupUnSupported}
                >
                  <Option value="">{formatMessage({ id: 'kubeblocks.database.backup.repo_none' })}</Option>
                  {backupRepoOptions.map(repo => {
                    const phase = getBackupRepoPhase(repo);
                    const phaseText = getBackupRepoPhaseText(phase);
                    const disabled = !isBackupRepoSelectable(repo);
                    return (
                      <Option key={repo.name} value={repo.name} disabled={disabled}>
                        {repo.displayName || repo.display_name || repo.name}{disabled && phaseText ? ` (${phaseText})` : ''}
                      </Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>

            {backupRepo && (
              <>
                {/* 循环周期 */}
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.cycle_label' })}>
                  {getFieldDecorator('backupSchedule', {
                    initialValue: backupSchedule || '',
                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.cycle_required' }) }]
                  })(
                    <RadioGroup onChange={this.handleBackupScheduleChange} disabled={!editBackupInfo || isBackupUnSupported}>
                      <Radio value="hour">{formatMessage({ id: 'kubeblocks.database.backup.cycle_hour' })}</Radio>
                      <Radio value="day">{formatMessage({ id: 'kubeblocks.database.backup.cycle_day' })}</Radio>
                      <Radio value="week">{formatMessage({ id: 'kubeblocks.database.backup.cycle_week' })}</Radio>
                    </RadioGroup>
                  )}
                </Form.Item>

                {/* 备份起始时间 */}
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.startTime_label' })}>
                  {getFieldDecorator('backupStartTime', {
                    initialValue: {
                      day: backupStartDay || '',
                      hour: backupStartHour || '',
                      minute: backupStartMinute || ''
                    },
                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.startTime_required' }) }]
                  })(
                    <div className={styles.backupTimeSelector}>
                      {backupSchedule === 'week' && (
                        <Select
                          value={backupStartDay || ''}
                          onChange={v => this.setState({ backupStartDay: v })}
                          className={styles.backupTimeSelect}
                          disabled={!editBackupInfo || isBackupUnSupported}
                        >
                          <Option value="1">{formatMessage({ id: 'kubeblocks.database.backup.startTime_mon' })}</Option>
                          <Option value="2">{formatMessage({ id: 'kubeblocks.database.backup.startTime_tue' })}</Option>
                          <Option value="3">{formatMessage({ id: 'kubeblocks.database.backup.startTime_wed' })}</Option>
                          <Option value="4">{formatMessage({ id: 'kubeblocks.database.backup.startTime_thu' })}</Option>
                          <Option value="5">{formatMessage({ id: 'kubeblocks.database.backup.startTime_fri' })}</Option>
                          <Option value="6">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sat' })}</Option>
                          <Option value="0">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sun' })}</Option>
                        </Select>
                      )}
                      {(backupSchedule === 'day' || backupSchedule === 'week') && (
                        <>
                          <Select
                            value={backupStartHour || ''}
                            onChange={v => this.setState({ backupStartHour: v })}
                            className={styles.backupTimeSelect}
                            disabled={!editBackupInfo || isBackupUnSupported}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <Option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </Option>
                            ))}
                          </Select>
                          <span>{formatMessage({ id: 'kubeblocks.database.backup.startTime_hour' })}</span>
                        </>
                      )}
                      <Select
                        value={backupStartMinute || ''}
                        onChange={v => this.setState({ backupStartMinute: v })}
                        className={styles.backupTimeSelect}
                        disabled={!editBackupInfo || isBackupUnSupported}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <Option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </Option>
                        ))}
                      </Select>
                      <span>{formatMessage({ id: 'kubeblocks.database.backup.startTime_minute' })}</span>
                    </div>
                  )}
                </Form.Item>

                {/* 备份数据保留时间 */}
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'kubeblocks.database.backup.retention_label' })}>
                  <div className={styles.backupRetentionControl}>
                    {getFieldDecorator('backupRetention', {
                      initialValue: backupRetentionTime || '',
                      rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) }]
                    })(
                      <InputNumber
                        min={1}
                        max={365}
                        value={backupRetentionTime || ''}
                        onChange={v => this.setState({ backupRetentionTime: v })}
                        placeholder={formatMessage({ id: 'kubeblocks.database.backup.retention_placeholder' })}
                        disabled={!editBackupInfo || isBackupUnSupported}
                      />
                    )}
                    <span>{formatMessage({ id: 'kubeblocks.database.backup.retention_unit' })}</span>
                  </div>
                </Form.Item>
              </>
            )}
          </Form>
        </Card>

        <Modal
          title={
            <span className={styles.repoManageTitle}>
              <span className={styles.repoManageTitleIcon}>
                <Icon type="database" />
              </span>
              <span>{formatMessage({ id: 'kubeblocks.database.backup.repo.manage' })}</span>
            </span>
          }
          visible={repoManageVisible}
          onCancel={this.closeRepoManage}
          footer={null}
          width={1080}
          destroyOnClose
          className={styles.repoManageModal}
        >
          <div className={styles.repoManageToolbar}>
            <div className={styles.repoManageMeta}>
              <span>S3</span>
              <strong>{backupRepos.length}</strong>
            </div>
            <div className={styles.repoManageActions}>
              <Button icon="reload" onClick={this.fetchBackupRepos}>
                {formatMessage({ id: 'kubeblocks.parameter.refresh' })}
              </Button>
              <Button type="primary" icon="plus" onClick={() => this.openRepoModal('create')}>
                {formatMessage({ id: 'kubeblocks.database.backup.repo.create_s3' })}
              </Button>
            </div>
          </div>
          <div className={styles.repoManageTableShell}>
            <Table
              className={styles.repoManageTable}
              rowKey="name"
              columns={repoColumns}
              dataSource={backupRepos}
              pagination={false}
              size="middle"
              tableLayout="fixed"
              rowClassName={record => record.name === backupRepo ? styles.repoCurrentRow : ''}
              scroll={{ x: 1120 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={formatMessage({ id: 'kubeblocks.database.backup.repo.empty' })}
                  >
                    <Button type="primary" icon="plus" onClick={() => this.openRepoModal('create')}>
                      {formatMessage({ id: 'kubeblocks.database.backup.repo.create_s3' })}
                    </Button>
                  </Empty>
                )
              }}
            />
          </div>
        </Modal>

        <Modal
          title={formatMessage({
            id: repoModalType === 'create'
              ? 'kubeblocks.database.backup.repo.modal.create_title'
              : 'kubeblocks.database.backup.repo.modal.edit_title'
          })}
          visible={repoModalVisible}
          width={560}
          onOk={this.handleRepoSubmit}
          onCancel={this.closeRepoModal}
          confirmLoading={repoSubmitting}
          destroyOnClose
          className={styles.repoEditorModal}
        >
          {repoModalType === 'edit' && (
            <Alert
              showIcon
              type="info"
              message={formatMessage({ id: 'kubeblocks.database.backup.repo.credential_edit_hint' })}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form layout="vertical" className={styles.repoEditorForm}>
            <div className={styles.repoEditorGrid}>
              <Form.Item className={styles.repoEditorItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.name' })}>
                {getFieldDecorator('repoName', {
                  rules: repoModalType === 'create'
                    ? [
                      { required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.name_required' }) },
                      { pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, message: formatMessage({ id: 'kubeblocks.database.backup.repo.name_invalid' }) }
                    ]
                    : []
                })(<Input disabled={repoModalType === 'edit'} placeholder="prod-s3" />)}
              </Form.Item>
              <Form.Item className={styles.repoEditorItem} label="Bucket">
                {getFieldDecorator('repoBucket', {
                  rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.bucket_required' }) }]
                })(<Input placeholder={DEFAULT_BACKUP_REPO_BUCKET} />)}
              </Form.Item>
              <Form.Item className={styles.repoEditorItem} label="Endpoint">
                {getFieldDecorator('repoEndpoint', {
                  rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.endpoint_required' }) }]
                })(<Input placeholder="https://s3.example.com" />)}
              </Form.Item>
              <Form.Item className={styles.repoEditorItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.access_style' })}>
                {getFieldDecorator('repoForcePathStyle', {
                  initialValue: DEFAULT_BACKUP_REPO_FORCE_PATH_STYLE
                })(
                  <RadioGroup>
                    <Radio value="true">{formatMessage({ id: 'kubeblocks.database.backup.repo.access_style_path' })}</Radio>
                    <Radio value="false">{formatMessage({ id: 'kubeblocks.database.backup.repo.access_style_virtual' })}</Radio>
                  </RadioGroup>
                )}
                <div className={styles.repoAccessStyleHint}>
                  {formatMessage({ id: 'kubeblocks.database.backup.repo.access_style_hint' })}
                </div>
              </Form.Item>
              <Form.Item className={styles.repoEditorItem} label="AccessKey">
                {getFieldDecorator('repoAccessKeyId', {
                  rules: repoModalType === 'create'
                    ? [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.access_key_required' }) }]
                    : []
                })(<Input placeholder={repoModalType === 'edit' ? formatMessage({ id: 'kubeblocks.database.backup.repo.secret_keep' }) : ''} />)}
              </Form.Item>
              <Form.Item className={styles.repoEditorItem} label="SecretKey">
                {getFieldDecorator('repoSecretAccessKey', {
                  rules: repoModalType === 'create'
                    ? [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.repo.secret_key_required' }) }]
                    : []
                })(<Input.Password placeholder={repoModalType === 'edit' ? formatMessage({ id: 'kubeblocks.database.backup.repo.secret_keep' }) : ''} />)}
              </Form.Item>
              <Collapse
                bordered={false}
                className={styles.repoAdvancedCollapse}
                expandIconPosition="right"
              >
                <Panel
                  forceRender
                  header={formatMessage({ id: 'kubeblocks.database.backup.repo.advanced' })}
                  key="advanced"
                >
                  <Form.Item className={styles.repoEditorItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.display_name' })}>
                    {getFieldDecorator('repoDisplayName')(<Input />)}
                  </Form.Item>
                  <Form.Item className={styles.repoEditorItem} label="Region">
                    {getFieldDecorator('repoRegion')(<Input />)}
                  </Form.Item>
                  <Form.Item className={styles.repoEditorItem} label={formatMessage({ id: 'kubeblocks.database.backup.repo.path_prefix' })}>
                    {getFieldDecorator('repoPathPrefix')(<Input />)}
                  </Form.Item>
                </Panel>
              </Collapse>
            </div>
          </Form>
        </Modal>

        {/* 备份列表 */}
        <Card
          title={formatMessage({ id: 'kubeblocks.database.backup.page.list.title' })}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                icon="reload"
                onClick={this.handleRefresh}
                loading={loading}
                disabled={isBackupUnSupported}
              >
                {formatMessage({ id: 'kubeblocks.parameter.refresh' })}
              </Button>
              <Button
                type="primary"
                icon="cloud-upload"
                onClick={this.handleManualBackup}
                disabled={isBackupUnSupported || isBackupDisabled}
              >
                {formatMessage({ id: 'kubeblocks.database.backup.page.manual.button' })}
              </Button>
            </div>
          }
        >
          <Table
            columns={backupColumns}
            dataSource={backupList}
            rowKey={(record) => record.name || record.time}
            loading={loading}
            pagination={{
              current: backupPagination.page,
              pageSize: backupPagination.page_size,
              total: backupPagination.total,
              onChange: this.handlePageChange,
              onShowSizeChange: this.handlePageChange,
              pageSizeOptions: ['6', '12', '24', '48'],
              showSizeChanger: true,
              showTotal: total => formatMessage(
                { id: 'kubeblocks.database.backup.pagination.total' },
                { total }
              )
            }}
          />
        </Card>

        {/* 恢复确认弹窗 */}
        <Modal
          title={formatMessage({ id: 'kubeblocks.database.backup.restore.title' })}
          visible={restoreVisible}
          onCancel={this.handleCancelRestore}
          onOk={this.handleConfirmRestore}
          confirmLoading={restoring}
          okText={formatMessage({ id: 'kubeblocks.database.backup.restore.confirm' })}
          cancelText={formatMessage({ id: 'kubeblocks.database.backup.restore.cancel' })}
        >
          <div style={{ marginBottom: 16 }}>
            <Icon type="info-circle" style={{ color: '#1890ff', marginRight: 8 }} />
            <strong>{formatMessage({ id: 'kubeblocks.database.backup.restore.backup_name' })}: </strong>{selectedBackupName}
          </div>
          <Alert
            type="info"
            showIcon
            message={formatMessage({ id: 'kubeblocks.database.backup.restore.tip.title' })}
            description={formatMessage({ id: 'kubeblocks.database.backup.restore.tip.content' })}
            style={{ marginBottom: 16 }}
          />
        </Modal>
      </div>
    );
  }
}
