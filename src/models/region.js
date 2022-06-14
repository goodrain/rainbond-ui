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
  fetchHelmCommand,
  fetchHelmJoinStatus
} from '../services/region';

export default {
  namespace: 'region',
  state: {
    // 成员
    protocols: [],
    // 集群基本设置数据
    base_configuration:
      JSON.parse(window.sessionStorage.getItem('base_configuration')) || {},
    // 集群高级配置数据
    advance_configuration:
      JSON.parse(window.sessionStorage.getItem('advance_config')) || {}
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
    *fetchHelmJoinStatus({ payload, callback }, { call }) {
      const response = yield call(fetchHelmJoinStatus, payload);
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
    },
    // 修改基本设置数据
    saveBaseConfiguration(state, action) {
      const { payload } = action;
      console.log(payload, 'payload');
      if (payload) {
        window.sessionStorage.setItem(
          'base_configuration',
          JSON.stringify(payload) || {}
        );
      }
      return {
        ...state,
        base_configuration: payload
      };
    },
    // 修改高级配置数据
    advanceConfiguration(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.setItem(
          'advance_configuration',
          JSON.stringify(payload) || {}
        );
      }
      return {
        ...state,
        advance_configuration: payload
      };
    }
  }
};
