import { 
  getProtocols,
  upEnterpriseCluster,
  createEnterpriseCluster,
  fetchEnterpriseClusters,
  fetchEnterpriseCluster,
  deleteEnterpriseCluster
} from '../services/region';

export default {
  namespace: 'region',
  state: {
    // 成员
    protocols: [],
  },
  effects: {
    *fetchProtocols({ payload, callback }, { call, put }) {
      const response = yield call(getProtocols, payload);
      if (response && !response.status) {
        yield put({ type: 'saveProtocols', payload: response.list });
      }
    },
    *upEnterpriseCluster({ payload, callback }, { put, call }) {
      const response = yield call(upEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createEnterpriseCluster({ payload, callback }, { put, call }) {
      const response = yield call(createEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseClusters({ payload, callback }, { put, call }) {
      const response = yield call(fetchEnterpriseClusters, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchEnterpriseCluster({ payload, callback }, { put, call }) {
      const response = yield call(fetchEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteEnterpriseCluster({ payload, callback }, { put, call }) {
      const response = yield call(deleteEnterpriseCluster, payload);
      if (response && callback) {
        callback(response);
      }
    },
  },
  reducers: {
    saveProtocols(state, action) {
      return {
        ...state,
        protocols: action.payload,
      };
    },
  },
};
