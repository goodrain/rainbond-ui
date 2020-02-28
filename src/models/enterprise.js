import {
  getStoreList,
  getShareModelList,
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
    *fetchShareModels({ payload, callback }, { call, put }) {
      const response = yield call(getShareModelList, payload);
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
