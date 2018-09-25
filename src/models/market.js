import {
  getMarketApp,
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
} from "../services/market";

export default {
  namespace: "market",
  state: {
  },
  effects: {
    *getMarketApp({ payload, callback }, { call, put }) {
      const data = yield call(getMarketApp, payload);
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
