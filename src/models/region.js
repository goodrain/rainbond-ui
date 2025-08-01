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
  fetDashboardList,
  fetClusterNodeContainer,
  fetchClusterNodeList,
  addClusterNode,
  deleteClusterNode,
  fetchClusterStatus,
  fetchHelmEvents,
  createHelmEvents,
  deleteHelmEvents,
  fetchClusterInfoList,
  fetchClusterInfo,
  fetchClusterNodeInfo,
  installCluster,
  installClusterPodinfo,
  installClusterAllPodinfo,
  unInstallCluster,
  getReginConfig,
  addReginConfig,
  getEnterpriseLicense,
  uploadEnterpriseLicense,
  fetchObservabilityOverview,
  fetchPerformanceOverview,
  fetchResourceOverview,
  fetchQueryRange,
  fetchPrometheusNodeInfo
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
    cluster_info: JSON.parse(window.sessionStorage.getItem('cluster_info')) || {},
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
    *fetchEnterpriseClusters({ payload, callback, handleError }, { call, put }) {
      const response = yield call(fetchEnterpriseClusters, payload, handleError);
      if (response && callback) {
        yield put({ type: 'saveClusterInfo', payload: response.list });
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
    *fetchClusterNodeList({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchClusterNodeList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *addClusterNode({ payload, callback, handleError }, { call }) {
      const response = yield call(addClusterNode, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmEvents({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchHelmEvents, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteClusterNode({ payload, callback, handleError }, { call }) {
      const response = yield call(deleteClusterNode, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *createHelmEvents({ payload, callback, handleError }, { call }) {
      const response = yield call(createHelmEvents, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchClusterStatus({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchClusterStatus, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteHelmEvents({ payload, callback, handleError }, { call }) {
      const response = yield call(deleteHelmEvents, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchClusterInfoList({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchClusterInfoList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchClusterInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchClusterInfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchClusterNodeInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchClusterNodeInfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *installCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(installCluster, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *installClusterPodinfo({ payload, callback, handleError }, { call }) {
      const response = yield call(installClusterPodinfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *installClusterAllPodinfo({ payload, callback, handleError }, { call }) {
      const response = yield call(installClusterAllPodinfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *unInstallCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(unInstallCluster, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getReginConfig({ payload, callback, handleError }, { call }) {
      const response = yield call(getReginConfig, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *addReginConfig({ payload, callback, handleError }, { call }) {
      const response = yield call(addReginConfig, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getEnterpriseLicense({ payload, callback, handleError }, { call }) {
      const response = yield call(getEnterpriseLicense, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *uploadEnterpriseLicense({ payload, callback, handleError }, { call }) {
      const response = yield call(uploadEnterpriseLicense, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchObservabilityOverview({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchObservabilityOverview, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchPerformanceOverview({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchPerformanceOverview, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchResourceOverview({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchResourceOverview, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchQueryRange({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchQueryRange, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchPrometheusNodeInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchPrometheusNodeInfo, payload, handleError);
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
    // 保存集群信息
    saveClusterInfo(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.setItem(
          'cluster_info',
          JSON.stringify(payload) || {}
        );
      }
      return {
        ...state,
        cluster_info: payload
      };
    },
  }
};
