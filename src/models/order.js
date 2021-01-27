import {
  CreateOrder,
  queryBankInfo,
  queryEnterpriseOrderDetails,
  queryEnterpriseOrderList,
  queryEnterpriseService,
  queryEnterpriseServiceRefresh
} from '../services/order';

export default {
  namespace: 'order',

  state: {
    enterpriseServiceInfo: null
  },

  effects: {
    *fetchEnterpriseService({ payload, callback }, { call, put }) {
      const response = yield call(queryEnterpriseService, payload);
      if (response && response.status_code === 200) {
        yield put({
          type: 'setEnterpriseServiceInfo',
          payload: response.bean
        });
        callback && callback(response);
      }
    },
    *fetchEnterpriseServiceRefresh(
      { payload, callback, handleError },
      { call }
    ) {
      const response = yield call(
        queryEnterpriseServiceRefresh,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *createOrder({ payload, callback, handleError }, { call }) {
      const response = yield call(CreateOrder, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseOrderList({ payload, callback }, { call }) {
      const response = yield call(queryEnterpriseOrderList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseOrderDetails({ payload, callback, handleError }, { call }) {
      const response = yield call(
        queryEnterpriseOrderDetails,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchBankInfo({ payload, callback }, { call }) {
      const response = yield call(queryBankInfo, payload);
      if (response && callback) {
        callback(response);
      }
    }
  },

  reducers: {
    setEnterpriseServiceInfo(state, { payload }) {
      return {
        ...state,
        enterpriseServiceInfo: payload
      };
    }
  }
};
