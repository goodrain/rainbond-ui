import {
  createEnterpriseCluster,
  deleteEnterpriseCluster,
  fetchEnterpriseCluster,
  fetchEnterpriseClusters,
  fetchEnterpriseClusterTenants,
  getProtocols,
  sethEnterpriseClusterTenantLimit,
  upEnterpriseCluster,
  fetchHelmToken,
  fetchHelmCommand
} from '../services/region';

export default {
  namespace: 'region',
  state: {
    // 成员
    protocols: []
  },
  effects: {
    *fetchProtocols({ payload }, { call, put }) {
      const response = yield call(getProtocols, payload);
      if (response && !response.status) {
        yield put({ type: 'saveProtocols', payload: response.list });
      }
    },
    *upEnterpriseCluster({ payload, callback }, { call }) {
      const response = yield call(upEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createEnterpriseCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(
        createEnterpriseCluster,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmCommand({ payload, callback }, { call }) {
      const response = yield call(fetchHelmCommand, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseClusters({ payload, callback }, { call }) {
      const response = yield call(fetchEnterpriseClusters, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmToken({ payload, callback }, { call }) {
      const response = yield call(fetchHelmToken, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseClusterTenants(
      { payload, callback, handleError },
      { call }
    ) {
      const response = yield call(
        fetchEnterpriseClusterTenants,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *setEnterpriseTenantLimit({ payload, callback, handleError }, { call }) {
      const response = yield call(
        sethEnterpriseClusterTenantLimit,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseCluster({ payload, callback }, { call }) {
      const response = yield call(fetchEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteEnterpriseCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(
        deleteEnterpriseCluster,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    }
  },
  reducers: {
    saveProtocols(state, action) {
      return {
        ...state,
        protocols: action.payload
      };
    }
  }
};
