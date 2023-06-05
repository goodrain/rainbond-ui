import {
  AddAssociatedComponents,
  AddCopyTeamApps,
  addGroup,
  backup,
  buildCompose,
  CheckAppName,
  CheckHelmApp,
  CheckK8sServiceName,
  checkoutGovernanceModel,
  getGovernancemodeList,
  completeShare,
  createAppBatchComponents,
  createShare,
  delBackup,
  deleteCompose,
  deleteGroup,
  deleteShareRecord,
  delFailureBackup,
  delRestore,
  editAppCreateCompose,
  editGroup,
  editGroups,
  EditHelmApp,
  getAppAccess,
  getAppDetailState,
  getAppResourcesStatistics,
  getAssociatedComponents,
  getBackup,
  getBackupStatus,
  getGroupApps,
  getGroupDetail,
  getHelmAppStoresVersions,
  getHelmComponents,
  getPluginShareEventInShareApp,
  getServiceNameList,
  getServices,
  getShare,
  getShareEventInfo,
  getShareRecord,
  getShareRecords,
  getShareStatus,
  getUpgradeComponentList,
  giveupShare,
  groupMonitorData,
  InstallHelmApp,
  migrateApp,
  parseChart,
  queryAllBackup,
  queryCopyComponent,
  queryMigrateApp,
  queryRestoreState,
  recordShare,
  SetCheckK8sServiceName,
  setGovernancemode,
  startPluginShareEventInShareApp,
  startShareEvent,
  submitShare,
  Toupgrade,
  addHelmModule,
  generateHelmModule,
  deleteKubernetesVal,
  createKubernetesVal,
  updateKubernetesVal,
  batchDelSingleKubernetesVal,
  getOperator,
  fetchGroupAllResource,
  deleteGroupAllResource
} from '../services/application';

export default {
  namespace: 'application',
  state: {
    // app detail
    groupDetail: {},
    // component list
    apps: [],
    // plugin
    plugins: [],
    func: {}
  },
  effects: {
    *fetchHelmComponents({ payload, callback }, { call }) {
      const response = yield call(getHelmComponents, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchAppAccess({ payload, callback }, { call }) {
      const response = yield call(getAppAccess, payload);
      if (callback) {
        callback(response);
      }
    },
    *CreateAppBatchComponents({ payload, callback }, { call }) {
      const response = yield call(createAppBatchComponents, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchAssociatedComponents({ payload, callback }, { call }) {
      const response = yield call(getAssociatedComponents, payload);
      if (callback) {
        callback(response);
      }
    },
    *checkAppName({ payload, callback, handleError }, { call }) {
      const response = yield call(CheckAppName, payload, handleError);
      if (callback) {
        callback(response);
      }
    },
    *addAssociatedComponents({ payload, callback }, { call }) {
      const response = yield call(AddAssociatedComponents, payload);
      if (callback) {
        callback(response);
      }
    },
    *installHelmApp({ payload, callback, handleError }, { call }) {
      const response = yield call(InstallHelmApp, payload, handleError);
      if (callback) {
        callback(response);
      }
    },
    *parseChart({ payload, callback }, { call }) {
      const response = yield call(parseChart, payload);
      if (callback) {
        callback(response);
      }
    },
    *editHelmApp({ payload, callback }, { call }) {
      const response = yield call(EditHelmApp, payload);
      if (callback) {
        callback(response);
      }
    },
    *checkHelmApp({ payload, callback }, { call }) {
      const response = yield call(CheckHelmApp, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchServiceNameList({ payload, callback }, { call }) {
      const response = yield call(getServiceNameList, payload);
      if (callback) {
        callback(response);
      }
    },
    *checkK8sServiceName({ payload, callback }, { call }) {
      const response = yield call(CheckK8sServiceName, payload);
      if (callback) {
        callback(response);
      }
    },
    *setCheckK8sServiceName({ payload, callback }, { call }) {
      const response = yield call(SetCheckK8sServiceName, payload);
      if (callback) {
        callback(response);
      }
    },
    *setgovernancemode({ payload, callback }, { call }) {
      const response = yield call(setGovernancemode, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchBackupStatus({ payload, callback }, { call }) {
      const response = yield call(getBackupStatus, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchBackup({ payload, callback }, { call }) {
      const response = yield call(getBackup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *queryAllBackup({ payload, callback }, { call }) {
      const response = yield call(queryAllBackup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *queryRestoreState({ payload, callback }, { call }) {
      const response = yield call(queryRestoreState, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *backup({ payload, callback, handleError }, { call }) {
      const response = yield call(backup, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *groupMonitorData({ payload, callback, handleError }, { call }) {
      const response = yield call(groupMonitorData, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *editAppCreateCompose({ payload, callback }, { call }) {
      const response = yield call(editAppCreateCompose, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchGroupDetail({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getGroupDetail, payload, handleError);
      if (response) {
        yield put({ type: 'saveGroupDetail', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchComponentVersion({ payload, callback, handleError }, { call }) {
      const response = yield call(
        getUpgradeComponentList,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchToupgrade({ payload, callback }, { call }) {
      const response = yield call(Toupgrade, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppDetailState({ payload, callback }, { call }) {
      const response = yield call(getAppDetailState, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmAppStoresVersions({ payload, callback, handleError }, { call }) {
      const response = yield call(
        getHelmAppStoresVersions,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppResourcesStatistics({ payload, callback }, { call }) {
      const response = yield call(getAppResourcesStatistics, payload);
      if (response) {
        if (response && callback) {
          callback(response);
        }
      }
    },
    *fetchApps({ payload, callback }, { call, put }) {
      const response = yield call(getGroupApps, payload);
      if (response) {
        yield put({ type: 'saveApps', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
    },
    *delete({ payload, callback }, { call }) {
      const response = yield call(deleteGroup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteCompose({ payload, callback }, { call }) {
      const response = yield call(deleteCompose, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchServices({ payload, callback, handleError }, { call }) {
      const response = yield call(getServices, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *editGroup({ payload, callback }, { call }) {
      const response = yield call(editGroup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editGroups({ payload, callback }, { call }) {
      const response = yield call(editGroups, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addGroup({ payload, callback }, { call }) {
      const response = yield call(addGroup, payload);
      if (response && callback) {
        callback(response.bean);
      }
    },
    *fetchCopyComponent({ payload, callback }, { call }) {
      const response = yield call(queryCopyComponent, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addCopyTeamApps({ payload, callback, handleError }, { call }) {
      const response = yield call(AddCopyTeamApps, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },

    // 查询未完成发布记录
    *recordShare({ payload, callback }, { call }) {
      const response = yield call(recordShare, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchShareRecords({ payload, callback }, { call }) {
      const response = yield call(getShareRecords, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchShareRecord({ payload, callback }, { call }) {
      const response = yield call(getShareRecord, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteShareRecord({ payload, callback }, { call }) {
      const response = yield call(deleteShareRecord, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 创建发布记录
    *ShareGroup({ payload, callback }, { call }) {
      const response = yield call(createShare, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 查询发布信息
    *getShareInfo({ payload, callback }, { call }) {
      const response = yield call(getShare, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 提交发布信息
    *subShareInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(submitShare, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    // 放弃发布
    *giveupShare({ payload, callback, handleError }, { call }) {
      const response = yield call(giveupShare, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    // 构建compose应用
    *buildCompose({ payload, callback }, { call }) {
      const response = yield call(buildCompose, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getShareEventInfo({ payload, callback }, { call }) {
      const response = yield call(getShareEventInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *startShareEvent({ payload, callback }, { call }) {
      const response = yield call(startShareEvent, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *startPluginShareEventInShareApp({ payload, callback }, { call }) {
      const response = yield call(startPluginShareEventInShareApp, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getPluginShareEventInShareApp({ payload, callback }, { call }) {
      const response = yield call(getPluginShareEventInShareApp, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getShareStatus({ payload, callback }, { call }) {
      const response = yield call(getShareStatus, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *completeShare({ payload, callback, handleError }, { call }) {
      const response = yield call(completeShare, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    // 应用备份迁移
    *migrateApp({ payload, callback }, { call }) {
      const response = yield call(migrateApp, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 应用备份迁移状态查询
    *queryMigrateApp({ payload, callback }, { call }) {
      const response = yield call(queryMigrateApp, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 应用备份删除
    *delRestore({ payload, callback }, { call }) {
      const response = yield call(delRestore, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *delBackup({ payload, callback }, { call }) {
      const response = yield call(delBackup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 应用失败记录删除
    *delFailureBackup({ payload, callback }, { call }) {
      const response = yield call(delFailureBackup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // 检查治理模式
    *checkoutGovernanceModel({ payload, callback, handleError }, { call }) {
      const response = yield call(
        checkoutGovernanceModel,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *getGovernancemodeList({ payload, callback, handleError }, { call }) {
      const data = yield call(getGovernancemodeList, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *addHelmModule({ payload, callback, handleError }, { call }) {
      const data = yield call(addHelmModule, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *generateHelmModule({ payload, callback, handleError }, { call }) {
      const data = yield call(generateHelmModule, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteKubernetesVal({ payload, callback, handleError }, { call }) {
      const data = yield call(deleteKubernetesVal, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *createKubernetesVal({ payload, callback, handleError }, { call }) {
      const data = yield call(createKubernetesVal, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *updateKubernetesVal({ payload, callback, handleError }, { call }) {
      const data = yield call(updateKubernetesVal, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *batchDelSingleKubernetesVal({ payload, callback, handleError }, { call }) {
      const data = yield call(batchDelSingleKubernetesVal, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getOperator({ payload, callback, handleError }, { call }) {
      const data = yield call(getOperator, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchGroupAllResource({ payload, callback, handleError }, { call, put }) {
      const response = yield call(fetchGroupAllResource, payload, handleError);
      if (response) {
        if (callback) {
          callback(response);
        }
      }
    },
    *deleteGroupAllResource({ payload, callback, handleError }, { call, put }) {
      const response = yield call(deleteGroupAllResource, payload, handleError);
      if (response) {
        if (callback) {
          callback(response);
        }
      }
    },
  },
  reducers: {
    clearApps(state) {
      return {
        ...state,
        apps: []
      };
    },
    saveApps(state, action) {
      return {
        ...state,
        apps: action.payload
      };
    },
    clearGroupDetail(state) {
      return {
        ...state,
        groupDetail: {}
      };
    },
    saveGroupDetail(state, action) {
      return {
        ...state,
        groupDetail: action.payload
      };
    },
  }
};
