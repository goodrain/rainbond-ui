import {
  getStoreList,
  getStoreModelList,
  getLocalShareAppList
} from '../services/market'
export default {
  namespace: 'enterprise',

  state: {
    currentEnterprise: {}
  },

  effects: {
    *fetchCurrentEnterprise({ payload }, { call, put }) {
        yield put({ type: "saveCurrentEnterprise", payload: payload });
    },
    *fetchEnterpriseStoreList({ payload, callback }, { call, put }) {
      const response = yield call(getStoreList, payload);
      if (response) {
        callback && callback(response);
      }
    },
    *fetchStoreModels({ payload, callback }, { call, put }) {
      const response = yield call(getStoreModelList, payload);
      if (response) {
        callback && callback(response);
      }
    },
    *fetchLocalModels({ payload, callback }, { call, put }) {
      const response = yield call(getLocalModelList, payload);
      if (response) {
        callback && callback(response);
      }
    },
  },

  reducers: {
    saveCurrentEnterprise(state, { payload }) {
      return {
        ...state,
        currentEnterprise: payload,
      };
    },
  },
};
