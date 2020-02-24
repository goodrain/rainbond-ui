import {
  fetchAppModels,
  upAppModel,
  createAppModel,
  fetchAppModelsTags,
  getMarketApp,
  createTag,
  upDataTag,
  deleteTag,
  queryExport,
  appExport,
  getExport,
  uploadApp,
  importApp,
  queryImportApp,
  importDir,
  queryImportDirApp,
  queryImportingApp,
  queryImportRecord,
  cancelImportApp,
  getRecommendMarketAppList,
} from "../services/market";

export default {
  namespace: "market",
  state: {
  },
  effects: {
    *fetchAppModels({ payload, callback }, { put, call }) {
      const response = yield call(fetchAppModels, payload);
      if (response) {
        callback && callback(response);
      }
    },
    *upAppModel({ payload, callback }, { put, call }) {
      const response = yield call(upAppModel, payload);
      if (response) {
        callback && callback(response);
      }
    },
    *createAppModel({ payload, callback }, { put, call }) {
      const response = yield call(createAppModel, payload);
      if (response) {
        callback && callback(response);
      }
    },
    *fetchAppModelsTags({ payload, callback }, { put, call }) {
      const response = yield call(fetchAppModelsTags, payload);
      if (response) {
        callback && callback(response);
      }
    },

    *createTag({ payload, callback }, { call, put }) {
      const data = yield call(createTag, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *upDataTag ({ payload, callback }, { call, put }) {
      const data = yield call(upDataTag, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *deleteTag ({ payload, callback }, { call, put }) {
      const data = yield call(deleteTag, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *getMarketApp({ payload, callback }, { call, put }) {
      const data = yield call(getMarketApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *getRecommendMarketAppList({ payload, callback }, { call, put }) {
      const data = yield call(getRecommendMarketAppList, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *queryExport({ payload, callback }, { call, put }) {
      const data = yield call(queryExport, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *appExport({ payload, callback }, { call, put }) {
      const data = yield call(appExport, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *getExport({ payload, callback }, { call, put }) {
      const data = yield call(getExport, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *uploadApp({ payload, callback }, { call, put }) {
      const data = yield call(uploadApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *importApp({ payload, callback }, { call, put }) {
      const data = yield call(importApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *queryImportApp({ payload, callback }, { call, put }) {
      const data = yield call(queryImportApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *importDir({ payload, callback }, { call, put }) {
      const data = yield call(importDir, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *queryImportDirApp({ payload, callback }, { call, put }) {
      const data = yield call(queryImportDirApp, payload);
      callback && callback(data);
    },
    *queryImportingApp({ payload, callback }, { call, put }) {
      const data = yield call(queryImportingApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *queryImportRecord({ payload, callback }, { call, put }) {
      const data = yield call(queryImportRecord, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *cancelImportApp({ payload, callback }, { call, put }) {
      const data = yield call(cancelImportApp, payload);
      if (data) {
        callback && callback(data);
      }
    }
  },

  reducers: {}
};
