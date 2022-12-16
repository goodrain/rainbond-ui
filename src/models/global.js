import {
  addConfiguration,
  addEnterpriseAdminTeams,
  authEnterprise,
  bindGithub,
  buyPurchase,
  complatePluginShare,
  deleteAppModel,
  deleteConfiguration,
  deleteEnterpriseAdmin,
  deleteEnterpriseUsers,
  deleteJoinTeam,
  deleteMarketPlugin,
  deleteMsg,
  deleteOauth,
  editConfiguration,
  fetchAppComponents,
  fetchEnterpriseAdmin,
  fetchEnterpriseApps,
  fetchEnterpriseInfo,
  fetchEnterpriseList,
  fetchEnterpriseTeams,
  fetchEnterpriseUsers,
  fetchMyTeams,
  fetchMyTeamsDynamic,
  fetchAppAlertInfo,
  fetchNewbieGuideConfig,
  fetchOverview,
  fetchOverviewApp,
  fetchOverviewMonitor,
  fetchOverviewTeam,
  fetchUserTeams,
  getAllRegion,
  getAllRegionFee,
  getApplication,
  getAppRedeploy,
  getCloudPlugin,
  getCompanyInfo,
  getConfigurationDetails,
  getConfigurationList,
  getCreateAppTeams,
  getDomainName,
  getDomainTime,
  getEnterpriseRoles,
  getGuideState,
  getHelmApplication,
  getJoinTeam,
  getMarketApp,
  getMarketPlugins,
  getPayHistory,
  getPermissions,
  getRainbondInfo,
  getRegionOneDayMoney,
  getRegionSource,
  getRegist,
  getService,
  getTeamAppList,
  getTeamOverview,
  getUpdatedInfo,
  getUpdatedVersion,
  getUpdateRecordsInfo,
  getUpdateRecordsList,
  getUpdateRollback,
  getUpgradeRecordsHelmList,
  getUserCanJoinTeams,
  getuserMessage,
  getVersion,
  InitTeam,
  isPubCloud,
  joinTeam,
  postUpdatedTasks,
  putMsgAction,
  putNewbieGuideConfig,
  queryCodeWarehouseInfo,
  queryCodeWarehouseType,
  queryDetectionTestCode,
  queryNotices,
  queryOauthInfo,
  queryTestCode,
  queryThirdInfo,
  resPrice,
  saveLog,
  setBasicInformation,
  setCertificateType,
  setRegist,
  syncCloudPlugin,
  syncMarketApp,
  syncMarketAppDetail,
  syncMarketPlugins,
  syncMarketPluginTmp,
  toBuildShape,
  toCeateSourceCode,
  toCreatCluster,
  toCreatOauth,
  toCreatUser,
  toEditCloudBackup,
  toEditImageHub,
  toEditMonitorin,
  toEditOauth,
  toQueryLinks,
  toQueryTopology,
  toSearchTenant,
  upDataEnterpriseAdminTeams,
  upEnterpriseUsers,
  getRainbondAlert,
  createShellPod,
  deleteShellPod
} from '../services/api';
import { getTeamRegionGroups } from '../services/team';
import cookie from '../utils/cookie';
import rainbondUtil from '../utils/rainbond';

export default {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
    // 是否是有公有云
    isPubCloud: null,
    // 当前团队和集群的群组
    groups: null,
    novices: null,
    currTeam: '',
    currRegion: '',
    // 云帮平台信息
    rainbondInfo: null,
    apploadingnum: 0,
    // 显示充值提示
    payTip: false,
    noMoneyTip: false,
    showAuthCompany: false,
    orders: false,
    // 更新头部信息
    upDataHeader: false,
    // enterprise info
    enterprise: null,
    enterpriseInfo: null,
    isRegist: false,
    memoryTip: '',
    is_enterprise_version: false,
    nouse: false,
    needLogin: false
  },

  effects: {
    *fetchPermissions({ payload, callback }, { call }) {
      const response = yield call(getPermissions, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *setNouse({ payload }, { put }) {
      yield put({
        type: 'saveIsisNouse',
        payload: payload.isNouse
      });
    },
    *getUserCanJoinTeams({ payload, callback }, { call }) {
      const data = yield call(getUserCanJoinTeams, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchEnterpriseApps({ payload, callback }, { call }) {
      const data = yield call(fetchEnterpriseApps, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchAppComponents({ payload, callback }, { call }) {
      const data = yield call(fetchAppComponents, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *joinTeam({ payload, callback }, { call }) {
      const data = yield call(joinTeam, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getJoinTeams({ payload, callback }, { call }) {
      const data = yield call(getJoinTeam, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteJoinTeams({ payload, callback }, { call }) {
      const data = yield call(deleteJoinTeam, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getAllRegionFee({ payload, callback }, { call }) {
      const data = yield call(getAllRegionFee, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getPayHistory({ payload, callback }, { call }) {
      const data = yield call(getPayHistory, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteMarketPlugin({ payload, callback }, { call }) {
      const data = yield call(deleteMarketPlugin, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *InitTeam({ payload, callback }, { call }) {
      const data = yield call(InitTeam, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *syncCloudPlugin({ payload, callback }, { call }) {
      const data = yield call(syncCloudPlugin, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getVersion({ payload, callback }, { call }) {
      const data = yield call(getVersion, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getCloudPlugin({ payload, callback }, { call }) {
      const data = yield call(getCloudPlugin, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *complatePluginShare({ payload, callback }, { call }) {
      const data = yield call(complatePluginShare, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getMarketPlugins({ payload, callback }, { call }) {
      const data = yield call(getMarketPlugins, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *syncMarketPlugins({ payload, callback }, { call }) {
      const data = yield call(syncMarketPlugins, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *syncMarketPluginTmp({ payload, callback }, { call }) {
      const data = yield call(syncMarketPluginTmp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getAllRegion({ payload, callback }, { call }) {
      const data = yield call(getAllRegion, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteAppModel({ payload, callback }, { call }) {
      const data = yield call(deleteAppModel, payload);
      if (data && callback) {
        callback(data);
      }
    },

    *getRegionSource({ payload, callback }, { call }) {
      const data = yield call(getRegionSource, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getTeamAppList({ payload, callback, handleError }, { call }) {
      const data = yield call(getTeamAppList, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchConfigurationList({ payload, callback }, { call }) {
      const data = yield call(getConfigurationList, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchConfigurationDetails({ payload, callback }, { call }) {
      const data = yield call(getConfigurationDetails, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *AddConfiguration({ payload, callback }, { call }) {
      const data = yield call(addConfiguration, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *EditConfiguration({ payload, callback }, { call }) {
      const data = yield call(editConfiguration, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *DeleteConfiguration({ payload, callback }, { call }) {
      const data = yield call(deleteConfiguration, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getGuideState({ payload, callback }, { call }) {
      const data = yield call(getGuideState, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getDomainName({ payload, callback, handleError }, { call }) {
      const data = yield call(getDomainName, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getDomainTime({ payload, callback }, { call }) {
      const data = yield call(getDomainTime, payload);
      if (data && callback) {
        callback(data);
      }
    },

    *getService({ payload, callback }, { call }) {
      const data = yield call(getService, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getRegionOneDayMoney({ payload, callback }, { call }) {
      const data = yield call(getRegionOneDayMoney, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getuserMessage({ payload, callback }, { call }) {
      const data = yield call(getuserMessage, payload);
      if (data && callback) {
        callback(data);
      }
    },
    // 消息标记为已读未读
    *putMsgAction({ payload, callback }, { call }) {
      const data = yield call(putMsgAction, payload);
      if (data && callback) {
        callback(data);
      }
    },
    // 删除站内信
    *deleteMsg({ payload, callback }, { call }) {
      const data = yield call(deleteMsg, payload);
      if (data && callback) {
        callback(data);
      }
    },
    // 资源价格计算
    *resPrice({ payload, callback }, { call }) {
      const data = yield call(resPrice, payload);
      if (data && callback) {
        callback(data);
      }
    },
    // 资源购买
    *buyPurchase({ payload, callback }, { call }) {
      const data = yield call(buyPurchase, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getCompanyInfo({ payload, callback }, { call }) {
      const data = yield call(getCompanyInfo, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *authEnterprise({ payload, callback, handleError }, { call }) {
      const data = yield call(authEnterprise, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getTeamOverview({ payload, callback, handleError }, { call }) {
      const data = yield call(getTeamOverview, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *syncMarketAppDetail({ payload, callback }, { call }) {
      const data = yield call(syncMarketAppDetail, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getMarketApp({ payload, callback }, { call }) {
      const data = yield call(getMarketApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *syncMarketApp({ payload, callback }, { call }) {
      const data = yield call(syncMarketApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getRainbondAlert({ payload, callback,handleError }, { call }) {
      const data = yield call(getRainbondAlert, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *fetchRainbondInfo({ callback, handleError }, { call, put }) {
      const data = yield call(getRainbondInfo, handleError);
      if (data) {
        cookie.set(
          'platform_url',
          data.bean && data.bean.document && data.bean.document.enable
            ? data.bean.document.value.platform_url
            : 'https://www.rainbond.com/'
        );
        window.localStorage.setItem(
          'faviconurl',
          rainbondUtil.fetchFavicon(data.bean)
        );
        cookie.setGuide(
          'enterprise_edition',
          rainbondUtil.isEnterpriseEdition(data.bean)
        );
        yield put({ type: 'saveRainBondInfo', payload: data.bean });
        if (callback) {
          setTimeout(() => {
            callback(data.bean);
          });
        }
      }
    },
    *fetchIsPublic(_, { call, put }) {
      const data = yield call(isPubCloud);
      yield put({
        type: 'saveIsPubCloud',
        payload: !!(data.bean.is_public && data.bean.is_public.enable)
      });
    },
    *fetchNotices(_, { call, put }) {
      const data = yield call(queryNotices);
      yield put({ type: 'saveNotices', payload: data });
      yield put({ type: 'user/changeNotifyCount', payload: data.length });
    },
    *clearNotices({ payload }, { put, select }) {
      yield put({ type: 'saveClearedNotices', payload });
      const count = yield select(state => state.global.notices.length);
      yield put({ type: 'user/changeNotifyCount', payload: count });
    },
    *fetchGroups({ payload, callback, handleError }, { put, call }) {
      const response = yield call(getTeamRegionGroups, payload, handleError);
      if (response) {
        yield put({
          type: 'saveGroups',
          payload: response.list || []
        });
        if (callback) {
          setTimeout(() => {
            callback(response.list);
          });
        }
      }
    },
    *application({ payload, callback }, { call }) {
      const response = yield call(getApplication, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *fetchHelmApplication({ payload, callback, handleError }, { call }) {
      const response = yield call(getHelmApplication, payload, handleError);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdatedVersion({ payload, callback }, { call }) {
      const response = yield call(getUpdatedVersion, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdatedInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(getUpdatedInfo, payload, handleError);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdatedTasks({ payload, callback, handleError }, { call }) {
      const response = yield call(postUpdatedTasks, payload, handleError);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *fetchAppRedeploy({ payload, callback, handleError }, { call }) {
      const response = yield call(getAppRedeploy, payload, handleError);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdateRecordsList({ payload, callback }, { call }) {
      const response = yield call(getUpdateRecordsList, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *fetchUpgradeRecordsHelmList({ payload, callback }, { call }) {
      const response = yield call(getUpgradeRecordsHelmList, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdateRecordsInfo({ payload, callback }, { call }) {
      const response = yield call(getUpdateRecordsInfo, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *CloudAppUpdateRollback({ payload, callback }, { call }) {
      const response = yield call(getUpdateRollback, payload);
      if (response && callback) {
        setTimeout(() => {
          callback(response);
        });
      }
    },
    *bindGithub({ payload, callback }, { call }) {
      const response = yield call(bindGithub, payload);
      if (response && callback) {
        callback();
      }
    },
    *putIsRegist({ payload, callback }, { put, call }) {
      const response = yield call(setRegist, payload);
      if (response) {
        yield put({
          type: 'saveIsRegist',
          payload: payload.isRegist
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *getIsRegist({ payload, callback }, { put, call }) {
      const response = yield call(getRegist, payload);
      if (response) {
        yield put({
          type: 'saveIsRegist',
          payload: response.bean && response.bean.is_regist
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *putCertificateType({ payload, callback }, { call }) {
      const response = yield call(setCertificateType, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putBasicInformation({ payload, callback }, { call }) {
      const response = yield call(setBasicInformation, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseInfo({ payload, callback }, { put, call }) {
      const response = yield call(fetchEnterpriseInfo, payload);
      if (response) {
        yield put({
          type: 'saveEnterpriseInfo',
          payload: response.bean
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *saveLog({ payload, callback }, { call }) {
      const response = yield call(saveLog, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchEnterpriseTeams({ payload, callback }, { call }) {
      const response = yield call(fetchEnterpriseTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseAdmin({ payload, callback }, { call }) {
      const response = yield call(fetchEnterpriseAdmin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseRoles({ payload, callback }, { call }) {
      const response = yield call(getEnterpriseRoles, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchCreateAppTeams({ payload, callback }, { call }) {
      const response = yield call(getCreateAppTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteEnterpriseAdmin({ payload, callback }, { call }) {
      const response = yield call(deleteEnterpriseAdmin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseUsers({ payload, callback }, { call }) {
      const response = yield call(fetchEnterpriseUsers, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteEnterpriseUsers({ payload, callback }, { call }) {
      const response = yield call(deleteEnterpriseUsers, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *upEnterpriseUsers({ payload, callback, handleError }, { call }) {
      const response = yield call(upEnterpriseUsers, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },

    *addEnterpriseAdminTeams({ payload, callback }, { call }) {
      const response = yield call(addEnterpriseAdminTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editEnterpriseAdminTeams({ payload, callback }, { call }) {
      const response = yield call(upDataEnterpriseAdminTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMyTeams({ payload, callback }, { call }) {
      const response = yield call(fetchMyTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMyTeamsDynamic({ payload, callback }, { call }) {
      const response = yield call(fetchMyTeamsDynamic, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppAlertInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchAppAlertInfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchUserTeams({ payload, callback }, { call }) {
      const response = yield call(fetchUserTeams, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseList({ callback, handleError }, { call }) {
      const response = yield call(fetchEnterpriseList, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchNewbieGuideConfig({ callback, handleError }, { put, call }) {
      const response = yield call(fetchNewbieGuideConfig, handleError);
      if (response && callback) {
        callback(response);
      }
      yield put({
        type: 'saveNewbieGuideConfig',
        payload: response.list || []
      });
    },
    *putNewbieGuideConfig({ payload, callback, handleError }, { call }) {
      const response = yield call(putNewbieGuideConfig, payload, handleError);
      if (response) {
        window.g_app._store.dispatch({
          type: 'global/fetchNewbieGuideConfig'
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *IsUpDataHeader({ payload }, { put }) {
      yield put({
        type: 'isUpDataHeader',
        payload: payload.isUpData
      });
    },
    *fetchOverviewApp({ payload, callback }, { call }) {
      const response = yield call(fetchOverviewApp, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchOverview({ payload, callback }, { call }) {
      const response = yield call(fetchOverview, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchOverviewTeam({ payload, callback }, { call }) {
      const response = yield call(fetchOverviewTeam, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchOverviewMonitor({ payload, callback }, { call }) {
      const response = yield call(fetchOverviewMonitor, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *getOauthInfo({ callback, payload }, { call }) {
      const response = yield call(queryOauthInfo, payload);
      if (callback) {
        callback(response);
      }
    },
    *deleteOauthInfo({ callback, payload }, { call }) {
      const response = yield call(deleteOauth, payload);
      if (callback) {
        callback(response);
      }
    },
    *testCode({ callback, payload }, { call }) {
      const response = yield call(queryTestCode, payload);
      if (callback) {
        callback(response);
      }
    },
    *detectionCode({ callback, payload }, { call }) {
      const response = yield call(queryDetectionTestCode, payload);
      if (callback) {
        callback(response);
      }
    },
    *createSourceCode({ payload, callback }, { call }) {
      const response = yield call(toCeateSourceCode, payload);
      if (callback) {
        callback(response);
      }
    },
    *creatUser({ payload, callback, handleError }, { call }) {
      const response = yield call(toCreatUser, payload, handleError);
      if (callback) {
        callback(response);
      }
    },
    *creatCluster({ payload, callback }, { call }) {
      const response = yield call(toCreatCluster, payload);
      if (callback) {
        callback(response);
      }
    },
    *creatOauth({ payload, callback }, { call }) {
      const response = yield call(toCreatOauth, payload);
      if (callback) {
        callback(response);
      }
    },
    *editOauth({ payload, callback }, { call }) {
      const response = yield call(toEditOauth, payload);
      if (callback) {
        callback(response);
      }
    },
    *editImageHub({ payload, callback }, { call }) {
      const response = yield call(toEditImageHub, payload);
      if (callback) {
        callback(response);
      }
    },
    *editMonitorin({ payload, callback }, { call }) {
      const response = yield call(toEditMonitorin, payload);
      if (callback) {
        callback(response);
      }
    },
    *editCloudBackup({ payload, callback }, { call }) {
      const response = yield call(toEditCloudBackup, payload);
      if (callback) {
        callback(response);
      }
    },
    *codeWarehouseInfo({ payload, callback }, { call }) {
      const response = yield call(queryCodeWarehouseInfo, payload);
      if (callback) {
        callback(response);
      }
    },
    *codeWarehouseType({ payload, callback }, { call }) {
      const response = yield call(queryCodeWarehouseType, payload);
      if (callback) {
        callback(response);
      }
    },
    *codeThirdInfo({ payload, callback }, { call }) {
      const response = yield call(queryThirdInfo, payload);
      if (callback) {
        callback(response);
      }
    },
    *buildShape({ payload, callback }, { call }) {
      const response = yield call(toBuildShape, payload);
      if (callback) {
        callback(response);
      }
    },

    *fetAllTopology({ payload, callback }, { call }) {
      const response = yield call(toQueryTopology, payload);
      if (callback) {
        callback(response);
      }
    },
    *queryLinks({ payload, callback, handleError }, { call }) {
      const response = yield call(toQueryLinks, payload, handleError);
      if (callback) {
        callback(response);
      }
    },
    *searchTenant({ payload, callback }, { call }) {
      const response = yield call(toSearchTenant, payload);
      if (callback) {
        callback(response);
      }
    },
    *createShellPod({ payload, callback }, { call }) {
      const response = yield call(createShellPod, payload);
      if (callback) {
        callback(response);
      }
    },
    *deleteShellPod({ payload, callback }, { call }) {
      const response = yield call(deleteShellPod, payload);
      if (callback) {
        callback(response);
      }
    },

  },
  reducers: {
    isUpDataHeader(state, action) {
      return {
        ...state,
        upDataHeader: action.payload
      };
    },
    showPayTip(state) {
      return {
        ...state,
        payTip: true
      };
    },
    showMemoryTip(state, action) {
      return {
        ...state,
        memoryTip: action.payload.message
      };
    },
    hideMemoryTip(state) {
      return {
        ...state,
        memoryTip: ''
      };
    },
    showNoMoneyTip(state) {
      return {
        ...state,
        noMoneyTip: true
      };
    },
    hideNoMoneyTip(state) {
      return {
        ...state,
        noMoneyTip: false
      };
    },
    hidePayTip(state) {
      return {
        ...state,
        payTip: false
      };
    },
    saveRainBondInfo(state, { payload }) {
      return {
        ...state,
        rainbondInfo: payload,
        isRegist: payload.is_regist.enable
      };
    },
    saveIsPubCloud(state, { payload }) {
      return {
        ...state,
        isPubCloud: payload
      };
    },
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload
      };
    },
    saveNotices(state, { payload }) {
      return {
        ...state,
        notices: payload
      };
    },
    saveClearedNotices(state, { payload }) {
      return {
        ...state,
        notices: state.notices.filter(item => item.type !== payload)
      };
    },
    saveNewbieGuideConfig(state, { payload }) {
      return {
        ...state,
        novices: payload
      };
    },
    saveGroups(state, { payload }) {
      return {
        ...state,
        groups: payload
      };
    },

    saveCurrTeamAndRegion(state, { payload }) {
      return {
        ...state,
        ...payload
      };
    },
    showLoading(state) {
      return {
        ...state,
        apploadingnum: state.apploadingnum + 1
      };
    },
    hiddenLoading(state) {
      return {
        ...state,
        apploadingnum: state.apploadingnum - 1
      };
    },
    showOrders(state, { payload }) {
      return {
        ...state,
        orders: payload.code
      };
    },
    hideOrders(state) {
      return {
        ...state,
        orders: false
      };
    },
    showAuthCompany(state, { payload }) {
      return {
        ...state,
        showAuthCompany: payload.market_name
      };
    },
    hideAuthCompany(state) {
      return {
        ...state,
        showAuthCompany: false
      };
    },
    showNeedLogin(state) {
      return {
        ...state,
        needLogin: true
      };
    },
    hideNeedLogin(state) {
      return {
        ...state,
        needLogin: false
      };
    },
    saveIsRegist(state, { payload }) {
      return {
        ...state,
        isRegist: payload
      };
    },
    saveIsisNouse(state, { payload }) {
      return {
        ...state,
        nouse: payload
      };
    },
    saveEnterpriseInfo(state, { payload }) {
      cookie.set(
        'newbie_guide',
        payload && payload.newbie_guide && payload.newbie_guide.enable
      );
      return {
        ...state,
        enterprise: payload
      };
    }
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    }
  }
};
