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
  fetchHelmJoinStatus,
  fetchImportMessage,
  fetchNameSpaceResource,
  fetchNameSpaceAdvancedResource,
  backNameSpaceAdvancedResource,
  fetchClusterLogInfo,
  fetchClusterLogInfoSingle,
  fetchNodeInfo,
  fetchConsoleLogs,
  fetchHistoryLogs,
  fetClusterNodeList,
  editClusterNodeActive,
  fetClusterNodeDetail,
  fetClusterNodeLabels,
  updataClusterNodeLabels,
  fetClusterNodeTaint,
  updataClusterNodeTaint,
<<<<<<< HEAD
  fetDashboardList,
  fetClusterNodeContainer
=======
  fetDashboardList
>>>>>>> 47d9b886c1a942801015b89e69cda95d2008ef31
} from '../services/region';

export default {
  namespace: 'region',
  state: {
    // 成员
    protocols: [],
    // 集群基本设置数据
    base_configuration: JSON.parse(window.sessionStorage.getItem('base_configuration')) || {},
    // 集群高级配置数据
    advance_configuration: JSON.parse(window.sessionStorage.getItem('advance_config')) || {},
    //shell终端状态 
    terminal_status: JSON.parse(window.sessionStorage.getItem('terminal_status')) || false,

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
    *fetchImportMessage({ payload, callback }, { call }) {
      const response = yield call(fetchImportMessage, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchNameSpaceResource({ payload, callback }, { call }) {
      const response = yield call(fetchNameSpaceResource, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchNameSpaceAdvancedResource({ payload, callback }, { call }) {
      const response = yield call(fetchNameSpaceAdvancedResource, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *backNameSpaceAdvancedResource({ payload, callback }, { call }) {
      const response = yield call(backNameSpaceAdvancedResource, payload);
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
    },
    *fetchClusterLogInfo({ payload, callback }, { call }) {
      const response = yield call(fetchClusterLogInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchClusterLogInfoSingle({ payload, callback }, { call }) {
      const response = yield call(fetchClusterLogInfoSingle, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchNodeInfo({ payload, callback }, { call }) {
      const response = yield call(fetchNodeInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchConsoleLogs({ payload, callback }, { call }) {
      const response = yield call(fetchConsoleLogs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHistoryLogs({ payload, callback }, { call }) {
      const response = yield call(fetchHistoryLogs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetClusterNodeList({ payload, callback, handleError }, { call }) {
      const response = yield call(fetClusterNodeList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *editClusterNodeActive({ payload, callback, handleError }, { call }) {
      const response = yield call(editClusterNodeActive, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetClusterNodeDetail({ payload, callback, handleError }, { call }) {
      const response = yield call(fetClusterNodeDetail, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetClusterNodeLabels({ payload, callback, handleError }, { call }) {
      const response = yield call(fetClusterNodeLabels, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *updataClusterNodeLabels({ payload, callback, handleError }, { call }) {
      const response = yield call(updataClusterNodeLabels, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetClusterNodeTaint({ payload, callback, handleError }, { call }) {
      const response = yield call(fetClusterNodeTaint, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *updataClusterNodeTaint({ payload, callback, handleError }, { call }) {
      const response = yield call(updataClusterNodeTaint, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetDashboardList({ payload, callback, handleError }, { call }) {
      const response = yield call(fetDashboardList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetClusterNodeContainer({ payload, callback, handleError }, { call }) {
      const response = yield call(fetClusterNodeContainer, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
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
    },
    // shell终端启动
    terminalCallout(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.setItem(
          'terminal_status',
          JSON.stringify(payload) || {}
        );
      }
      return {
        ...state,
        terminal_status: payload
      };
    },
    // shell终端退出
    terminalRepeal(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.removeItem(
          'terminal_status',
        );
      }
      return {
        ...state,
        terminal_status: !payload
      };
    },
  }
};
