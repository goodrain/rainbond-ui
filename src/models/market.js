import {
  appExport,
  cancelImportApp,
  CheckWarehouseAppName,
  createAppMarket,
  createAppModel,
  createMarketAppModel,
  createTag,
  delAppVersion,
  deleteAppMarket,
  deleteHelmAppStore,
  deleteTag,
  fetchAppModels,
  fetchAppModelsTags,
  fetchHelmMarkets,
  fetchHelmMarketsTab,
  fetchMarkets,
  fetchMarketsTab,
  getAppMarketInfo,
  getAppModelsDetails,
  getBindingMarketsList,
  getHelmAppStore,
  getMarketApp,
  getRecommendMarketAppList,
  importApp,
  importDir,
  postBindingMarkets,
  postHelmAppStore,
  queryExport,
  queryImportApp,
  queryImportDirApp,
  queryImportingApp,
  queryImportRecord,
  storehubCheck,
  syncHelmAppStore,
  upAppMarket,
  upAppModel,
  upDataAppVersionInfo,
  upDataTag,
  upHelmAppStore,
  HelmwaRehouseAdd,
  HelmwaRehouseDelete,
  HelmwaRehouseEdit,
  HelmwaRehouseList,
  HelmwaRehouseAddStore,
  HelmwaRehouseAddCom
} from '../services/market';

export default {
  namespace: 'market',
  state: {},
  effects: {
    *fetchAppModels({ payload, callback }, { call }) {
      const response = yield call(fetchAppModels, payload);
      if (response && callback) {
        callback(response);
      }
    },
    
    *fetchAppMarketInfo({ payload, callback }, { call }) {
      const response = yield call(getAppMarketInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addBindingMarkets({ payload, callback, handleError }, { call }) {
      const response = yield call(postBindingMarkets, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *addHelmAppStore({ payload, callback, handleError }, { call }) {
      const response = yield call(postHelmAppStore, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *upHelmAppStore({ payload, callback }, { call }) {
      const response = yield call(upHelmAppStore, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *checkWarehouseAppName({ payload, callback, handleError }, { call }) {
      const response = yield call(CheckWarehouseAppName, payload, handleError);
      if (callback) {
        callback(response);
      }
    },
    *deleteHelmAppStore({ payload, callback }, { call }) {
      const response = yield call(deleteHelmAppStore, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmAppStore({ payload, callback, handleError }, { call }) {
      const response = yield call(getHelmAppStore, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *syncHelmAppStore({ payload, callback, handleError }, { call }) {
      const response = yield call(syncHelmAppStore, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchBindingMarketsList({ payload, callback, handleError }, { call }) {
      const response = yield call(getBindingMarketsList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *upAppModel({ payload, callback }, { call }) {
      const response = yield call(upAppModel, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *upAppMarket({ payload, callback }, { call }) {
      const response = yield call(upAppMarket, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteAppMarket({ payload, callback }, { call }) {
      const response = yield call(deleteAppMarket, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createAppModel({ payload, callback, handleError }, { call }) {
      const response = yield call(createAppModel, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *createAppMarket({ payload, callback }, { call }) {
      const response = yield call(createAppMarket, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createMarketAppModel({ payload, callback, handleError }, { call }) {
      const response = yield call(createMarketAppModel, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppModelsTags({ payload, callback }, { call }) {
      const response = yield call(fetchAppModelsTags, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppModelsDetails({ payload, callback }, { call }) {
      const response = yield call(getAppModelsDetails, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *upDataAppVersionInfo({ payload, callback }, { call }) {
      const response = yield call(upDataAppVersionInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteAppVersion({ payload, callback }, { call }) {
      const response = yield call(delAppVersion, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMarketsTab({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchMarketsTab, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmMarketsTab({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchHelmMarketsTab, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmMarkets({ payload, callback }, { call }) {
      const response = yield call(fetchHelmMarkets, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMarkets({ payload, callback }, { call }) {
      const response = yield call(fetchMarkets, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createTag({ payload, callback }, { call }) {
      const data = yield call(createTag, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *upDataTag({ payload, callback }, { call }) {
      const data = yield call(upDataTag, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteTag({ payload, callback }, { call }) {
      const data = yield call(deleteTag, payload);
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
    *getRecommendMarketAppList({ payload, callback }, { call }) {
      const data = yield call(getRecommendMarketAppList, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *queryExport({ payload, callback }, { call }) {
      const data = yield call(queryExport, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *appExport({ payload, callback }, { call }) {
      const data = yield call(appExport, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *importApp({ payload, callback }, { call }) {
      const data = yield call(importApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *queryImportApp({ payload, callback }, { call }) {
      const data = yield call(queryImportApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *importDir({ payload, callback }, { call }) {
      const data = yield call(importDir, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *queryImportDirApp({ payload, callback }, { call }) {
      const data = yield call(queryImportDirApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *queryImportingApp({ payload, callback }, { call }) {
      const data = yield call(queryImportingApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *queryImportRecord({ payload, callback }, { call }) {
      const data = yield call(queryImportRecord, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *cancelImportApp({ payload, callback }, { call }) {
      const data = yield call(cancelImportApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *storehubCheck({ payload, callback }, { call }) {
      const data = yield call(storehubCheck, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseAdd({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseAdd, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseDelete({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseDelete, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseEdit({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseEdit, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseList({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseList, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseAddStore({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseAddStore, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *HelmwaRehouseAddCom({ payload, callback, handleError }, { call }) {
      const data = yield call(HelmwaRehouseAddCom, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },

    
  },

  reducers: {}
};
