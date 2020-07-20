import {
  appExport,
  cancelImportApp,
  createAppMarket,
  createAppModel,
  createMarketAppModel,
  createTag,
  deleteAppMarket,
  deleteTag,
  fetchAppModels,
  fetchAppModelsTags,
  fetchMarkets,
  fetchMarketsTab,
  getMarketApp,
  getRecommendMarketAppList,
  importApp,
  importDir,
  queryExport,
  queryImportApp,
  queryImportDirApp,
  queryImportingApp,
  queryImportRecord,
  upAppMarket,
  upAppModel,
  upDataTag
} from "../services/market";

export default {
  namespace: "market",
  state: {},
  effects: {
    *fetchAppModels({ payload, callback }, { call }) {
      const response = yield call(fetchAppModels, payload);
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
    *createAppModel({ payload, callback }, { call }) {
      const response = yield call(createAppModel, payload);
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
    *createMarketAppModel({ payload, callback }, { call }) {
      const response = yield call(createMarketAppModel, payload);
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
    *fetchMarketsTab({ payload, callback }, { call }) {
      const response = yield call(fetchMarketsTab, payload);
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
    }
  },

  reducers: {}
};
