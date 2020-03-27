import {
  queryEnterpriseService,
  queryEnterpriseOrderList,
  queryEnterpriseOrderDetails,
  queryBankInfo,
} from '../services/order';

export default {
  namespace: 'order',

  state: {},

  effects: {
    *fetchEnterpriseService({ payload, callback }, { call, put }) {
      const response = yield call(queryEnterpriseService, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseOrderList({ payload, callback }, { call, put }) {
      const response = yield call(queryEnterpriseOrderList, payload);
      if (response && callback) {
         callback(response);
      }
    },
    *fetchEnterpriseOrderDetails({ payload, callback }, { call, put }) {
      const response = yield call(queryEnterpriseOrderDetails, payload);
      if (response && callback) {
         callback(response);
      }
    },
    *fetchBankInfo({ payload, callback }, { call, put }) {
      const response = yield call(queryBankInfo, payload);
      if (response && callback) {
         callback(response);
      }
    },
  },

  reducers: {},
};
