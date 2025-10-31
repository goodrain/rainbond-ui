/* eslint-disable camelcase */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { Icon, Button, message, Form } from 'antd';
import { formatMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import DatabaseConfigForm from '../../components/DatabaseConfigForm';
import { pinyin } from 'pinyin-pro';
import styles from './Index.less';

@connect(
  ({ teamControl, global, enterprise, user, kubeblocks }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprises: global.enterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser,
    storageClasses: kubeblocks.storageClasses,
    backupRepos: kubeblocks.backupRepos,
    createLoading: kubeblocks.createLoading,
    databaseTypes: kubeblocks.databaseTypes
  }),
  null,
  null,
  { pure: false }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      configFormRef: null
    };
  }

  componentDidMount() {
    this.fetchInitialData();
  }

  fetchInitialData = () => {
    this.fetchStorageClasses();
    this.fetchBackupRepos();
    this.fetchDatabaseTypes();
  };

  fetchStorageClasses = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: 'kubeblocks/fetchStorageClasses',
      payload: {
        team_name,
        region_name
      },
      handleError: (err) => { }
    });
  };

  fetchBackupRepos = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: 'kubeblocks/fetchBackupRepos',
      payload: {
        team_name,
        region_name
      },
      handleError: (err) => { }
    });
  };

  fetchDatabaseTypes = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: 'kubeblocks/fetchKubeBlocksDatabaseTypes',
      payload: {
        team_name,
        region_name
      },
      handleError: (err) => { }
    });
  };

  // 英文名生成
  generateEnglishName = (name) => {
    if (name !== undefined && name !== '') {
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      return cleanedPinyinName;
    }
    return '';
  };

  // 轻量预检英文名冲突（与已存在组件列表比对）
  checkK8sNameConflict = (k8s_name, componentNames = []) => {
    return componentNames && componentNames.includes(k8s_name);
  };

  onRefConfigForm = (ref) => {
    this.setState({ configFormRef: ref });
  };

  handlePrevStep = () => {
    const { dispatch, location } = this.props;
    const { group_id } = location?.query || {};

    // 返回上一步时携带 group_id
    const query = group_id ? `?group_id=${group_id}` : '';
    dispatch(
      routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/database${query}`)
    );
  };
  handleFormSubmit = () => {
    const { configFormRef } = this.state;

    if (configFormRef) {
      configFormRef.handleSubmit();
    }
  };

  handleSubmit = (configData) => {
    const { dispatch, location } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    // 从 URL query 获取应用ID、数据库类型、名称、英文名
    let { group_id, database_type, service_cname, k8s_component_name } = location?.query || {};

    // 验证必需的参数
    if (!service_cname) {
      message.error(formatMessage({ id: 'kubeblocks.database.config.error.component_name_empty' }));
      return;
    }

    if (!database_type) {
      message.error(formatMessage({ id: 'kubeblocks.database.config.error.database_type_empty' }));
      return;
    }

    // 如果未携带组件英文名，基于 service_cname 生成（回填逻辑）
    if (!k8s_component_name) {
      k8s_component_name = this.generateEnglishName(service_cname);
    }

    // 如果存在应用组ID，在提交前做轻量英文名预检
    if (group_id) {
      this.performK8sNamePrecheck(k8s_component_name, group_id, () => {
        this.proceedWithSubmit(configData, { group_id, database_type, service_cname, k8s_component_name });
      });
    } else {
      this.proceedWithSubmit(configData, { group_id, database_type, service_cname, k8s_component_name });
    }
  };

  // 执行英文名预检（仅在存在 group_id 时调用）
  performK8sNamePrecheck = (k8s_component_name, group_id, onSuccess) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        const componentNames = res?.bean?.component_names || [];
        if (this.checkK8sNameConflict(k8s_component_name, componentNames)) {
          message.error('当前应用下英文名已存在，请返回上一步更换英文名');
          return;
        }
        // 预检通过，继续提交
        onSuccess();
      },
      handleError: () => {
        // 获取组件名列表失败，继续提交（由后端兜底）
        onSuccess();
      }
    });
  };

  // 继续创建流程（预检通过后调用）
  proceedWithSubmit = (configData, metadata) => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const { group_id, database_type, service_cname, k8s_component_name } = metadata;

    const apiRequestData = this.formatSubmitData(configData, {
      group_id,
      database_type,
      service_cname,
      k8s_component_name
    });

    // 验证必填字段
    if (!apiRequestData.replicas || apiRequestData.replicas < 1) {
      message.error('副本数量必须大于等于1');
      return;
    }

    if (!apiRequestData.storage_class) {
      message.error('请选择存储类');
      return;
    }

    const apiData = {
      team_name,
      region_name,
      config: apiRequestData
    };

    dispatch({
      type: 'kubeblocks/createDatabaseCluster',
      payload: apiData,
      callback: (response) => {
        if (response && response.status_code === 200) {
          message.success(formatMessage({ id: 'kubeblocks.database.config.success.created' }));

          const serviceAlias = response.bean?.service_alias;
          const groupId = response.bean?.group_id;

          // 先刷新应用分组信息
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: team_name
            }
          });

          // 刷新权限信息，并在权限更新完成后再跳转
          roleUtil.refreshPermissionsInfo(groupId, true, () => {
            // 跳转到应用详情页
            if (serviceAlias && groupId) {
              dispatch(
                routerRedux.push(`/team/${team_name}/region/${region_name}/apps/${groupId}/overview?type=components&componentID=${serviceAlias}&tab=overview`)
              );
            } else {
              message.error('创建成功但无法获取组件信息，请手动刷新页面');
            }
          });
        } else {
          console.error('API 调用失败:', {
            status_code: response?.status_code,
            msg_show: response?.msg_show,
            full_response: response
          });
          message.error(response ? response.msg_show : formatMessage({ id: 'kubeblocks.database.config.error.creation_failed' }));
        }
      },
      handleError: () => {
        message.error(formatMessage({ id: 'kubeblocks.database.config.error.creation_failed' }));
      }
    });
  };

  // 创建新应用组的方法
  installApp = (vals) => {
    const { dispatch, location } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    // 从 location.query 获取应用组创建需要的参数
    const { service_cname, k8s_component_name, k8s_app, group_name } = location?.query || {};

    dispatch({
      type: 'application/addGroup',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_name: group_name || service_cname,
        k8s_app: k8s_app,
        note: '',
      },
      callback: (res) => {
        if (res && res.group_id) {
          // 创建应用组成功后，更新 location.query 并继续创建数据库组件
          const { service_cname, database_type } = this.props.location?.query || {};
          this.proceedWithSubmit(vals, {
            group_id: res.group_id,
            database_type,
            service_cname,
            k8s_component_name: k8s_component_name
          });
        }
      },
      handleError: () => { }
    })
  }

  // 统一的入口方法
  handleInstallApp = (configData) => {
    const { location } = this.props;
    const { group_id } = location?.query || {};

    if (group_id) {
      // 已有应用
      this.handleSubmit(configData);
    } else {
      //先创建应用组，再创建数据库组件
      this.installApp(configData);
    }
  };

  formatSubmitData = (configData, metadata) => {
    const { group_id, database_type, service_cname, k8s_component_name } = metadata;

    let basicInfo = {};
    let backupConfig = {};

    if (configData.basicInfo) {
      // 嵌套结构：{ basicInfo: {...}, backupConfig: {...} }
      basicInfo = configData.basicInfo || {};
      backupConfig = configData.backupConfig || {};
    } else {
      // 平铺结构：直接包含所有字段
      basicInfo = configData;
      backupConfig = configData;
    }

    const rawCpu = (basicInfo.min_cpu !== undefined && basicInfo.min_cpu !== null)
      ? basicInfo.min_cpu
      : 1000;
    const rawMemory = (basicInfo.min_memory !== undefined && basicInfo.min_memory !== null)
      ? basicInfo.min_memory
      : 1024;

    const normalizedCpuMillicores = this.parseCpuValue(rawCpu);
    const normalizedMemoryMB = this.parseMemoryValue(rawMemory);

    const requestData = {
      cluster_name: service_cname,                              // 数据库集群名称（必填，**重要：将作为 Rainbond 组件的中文显示名称**）
      database_type: database_type,                             // 数据库类型（必填）
      version: basicInfo.dbVersion || 'latest',                 // 数据库版本（必填）
      cpu: this.convertCpuValue(normalizedCpuMillicores),       // CPU 配置（必填，传 millicores）
      memory: this.convertMemoryValue(normalizedMemoryMB),      // 内存配置（必填，传 MB）
      storage_size: `${basicInfo.disk_cap || 50}Gi`,           // 存储大小（必填）

      replicas: parseInt(basicInfo.replicas) || 1,             // 副本数量（必填）
      storage_class: basicInfo.storageClass || '',             // 存储类名称（必填）
      k8s_app: k8s_component_name,                             // K8s组件名称（必填，Rainbond组件英文名）

      ...(group_id && { group_id }),                           // 应用分组ID（可选）

      ...this.formatBackupConfig(backupConfig)
    };

    return requestData;
  };

  /**
* 解析CPU值：将滑块序号或millicores值统一转换为millicores数字
*/
  parseCpuValue = (value) => {
    const sliderIndexToMillicoresMap = {
      0: 0,     // 无限制
      1: 100,
      2: 250,
      3: 500,
      4: 1000,
      5: 2000,
      6: 4000,
      7: 8000,
      8: 16000
    };

    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) return 1000;

    if (numeric >= 0 && numeric <= 8) {
      if (Object.prototype.hasOwnProperty.call(sliderIndexToMillicoresMap, numeric)) {
        return sliderIndexToMillicoresMap[numeric];
      }
      return 1000;
    }

    return numeric;
  };

  /**
   * 解析内存值：将滑块序号或MB值统一转换为 MB 数字
   */
  parseMemoryValue = (value) => {
    const sliderIndexToMBMap = {
      0: 0,        // 无限制
      1: 128,
      2: 256,
      3: 512,
      4: 1024,
      5: 2048,
      6: 4096,
      7: 8192,
      8: 16384,
      9: 32768
    };

    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) return 1024;

    if (numeric >= 0 && numeric <= 9) {
      if (Object.prototype.hasOwnProperty.call(sliderIndexToMBMap, numeric)) {
        return sliderIndexToMBMap[numeric];
      }
      return 1024;
    }

    return numeric;
  };

  formatBackupConfig = (backupConfig) => {
    if (!backupConfig || Object.keys(backupConfig).length === 0 || !backupConfig.backupRepo) {
      return {};
    }

    const {
      backupRepo = '',
      backupCycle = 'daily',
      backupRetention = 7,
      termination_policy = 'Delete',
      backupStartTime = {}
    } = backupConfig;

    const backupSchedule = this.formatBackupSchedule(backupCycle, backupStartTime);

    const backupConfiguration = {
      backup_repo: backupRepo,
      backup_schedule: backupSchedule,
      retention_period: `${backupRetention}d`,
      termination_policy: this.convertTerminationPolicy(termination_policy)
    };

    return backupConfiguration;
  };

  formatBackupSchedule = (cycle, startTime) => {
    const schedule = {
      frequency: this.convertFrequency(cycle),
      hour: parseInt(startTime.hour) || 2,
      minute: parseInt(startTime.minute) || 0
    };

    if (cycle === 'week') {
      schedule.dayOfWeek = parseInt(startTime.day) || 1;
    }

    return schedule;
  };

  convertFrequency = (frontendFrequency) => {
    const frequencyMap = {
      'hour': 'hourly',
      'day': 'daily',
      'week': 'weekly'
    };
    return frequencyMap[frontendFrequency] || 'daily';
  };

  convertTerminationPolicy = (termination_policy) => {
    return termination_policy === 'WipeOut' ? 'WipeOut' : 'Delete';
  };

  convertCpuValue = (cpuSliderValue) => {
    const cpuMap = {
      0: '0m',       // 无限制
      100: '100m',
      250: '250m',
      500: '500m',
      1000: '1',
      2000: '2',
      4000: '4',
      8000: '8',
      16000: '16'
    };
    return cpuMap[cpuSliderValue] || '1';
  };

  convertMemoryValue = (memorySliderValue) => {
    const memoryMap = {
      0: '0Mi',      // 无限制
      128: '128Mi',
      256: '256Mi',
      512: '512Mi',
      1024: '1Gi',
      2048: '2Gi',
      4096: '4Gi',
      8192: '8Gi',
      16384: '16Gi',
      32768: '32Gi'
    };
    return memoryMap[memorySliderValue] || '1Gi';
  };

  render() {
    const {
      rainbondInfo,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      dispatch,
      form,
      storageClasses,
      backupRepos,
      createLoading,
      databaseTypes
    } = this.props;

    const { database_type, group_id, service_cname } = this.props.location?.query || {};

    let dbVersions = [];
    if (database_type && Array.isArray(databaseTypes)) {
      const found = databaseTypes.find(item => String(item.type) === String(database_type));
      if (found && Array.isArray(found.version)) {
        dbVersions = found.version;
      }
    }

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({ id: 'kubeblocks.database.create.title' }) });
    breadcrumbList.push({ title: formatMessage({ id: 'kubeblocks.database.config.title' }) });

    const isAppOverview = this.props.location?.query?.type || '';

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={`${formatMessage({ id: 'kubeblocks.database.config.title' })} - ${service_cname || '未命名'}`}
        content={<p>{formatMessage({ id: 'kubeblocks.database.config.subtitle' })}</p>}
        titleSvg={pageheaderSvg.getPageHeaderSvg('database', 18)}
        isContent
        extraContent={
          <Button
            onClick={() => {
              dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
                )
              );
            }}
            type="default"
          >
            <Icon type="rollback" />
            {formatMessage({ id: 'button.return' })}
          </Button>
        }
      >
        <div className={styles.formWrap} style={{ width: '100%' }}>

          {/* 数据库配置表单组件 */}
          <DatabaseConfigForm
            form={form}
            dbVersions={dbVersions}
            storageClasses={storageClasses}
            backupRepos={backupRepos}
            databaseTypes={databaseTypes}
            databaseType={database_type}
            onRef={this.onRefConfigForm}
            onSubmit={this.handleInstallApp}
          />

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button style={{ marginRight: 8 }} onClick={this.handlePrevStep}>
              {formatMessage({ id: 'kubeblocks.database.config.btn.prev' })}
            </Button>
            <Button
              type="primary"
              onClick={this.handleFormSubmit}
              loading={createLoading}
            >
              {formatMessage({ id: 'kubeblocks.database.config.btn.create' })}
            </Button>
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
} 
