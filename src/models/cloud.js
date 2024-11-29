import {
  createKubernetesCluster,
  deleteKubernetesCluster,
  getInitNodeCmd,
  initRainbondRegion,
  loadInitRainbondTask,
  loadKubereneteClusters,
  loadLastTask,
  loadRegionConfig,
  loadRunningInitRainbondTasks,
  loadTask,
  loadTaskEvents,
  queryCreateLog,
  reInstall,
  updateInitTaskStatus,
  updateKubernetesCluster,
  fetchCheckSsh,
  AddClusterRke2,
  fetchCheckSshPwd,
} from '../services/cloud';

export default {
  namespace: 'cloud',

  state: {
    status: undefined
  },

  effects: {
    *loadKubereneteClusters({ payload, callback, handleError }, { call }) {
      const response = yield call(loadKubereneteClusters, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *loadTask({ payload, callback, handleError }, { call }) {
      const response = yield call(loadTask, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *loadTaskEvents({ payload, callback, handleError }, { call }) {
      const response = yield call(loadTaskEvents, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *loadLastTask({ payload, callback, handleError }, { call }) {
      const response = yield call(loadLastTask, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *createKubernetesCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(
        createKubernetesCluster,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *loadInitRainbondTask({ payload, callback, handleError }, { call }) {
      const response = yield call(loadInitRainbondTask, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *initRainbondRegion({ payload, callback, handleError }, { call }) {
      const response = yield call(initRainbondRegion, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *loadRunningInitRainbondTasks(
      { payload, callback, handleError },
      { call }
    ) {
      const response = yield call(
        loadRunningInitRainbondTasks,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *loadRegionConfig({ payload, callback, handleError }, { call }) {
      const response = yield call(loadRegionConfig, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *updateInitTaskStatus({ payload, callback, handleError }, { call }) {
      const response = yield call(updateInitTaskStatus, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteKubernetesCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(
        deleteKubernetesCluster,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *getInitNodeCmd({ payload, callback, handleError }, { call }) {
      const response = yield call(getInitNodeCmd, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *queryCreateLog({ payload, callback, handleError }, { call }) {
      const response = yield call(queryCreateLog, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *reInstall({ payload, callback, handleError }, { call }) {
      const response = yield call(reInstall, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *updateKubernetesCluster({ payload, callback, handleError }, { call }) {
      const response = yield call(
        updateKubernetesCluster,
        payload,
        handleError
      );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchCheckSsh({ payload, callback, handleError }, { call }) {
      const response = yield call( fetchCheckSsh, payload, handleError );
      if (response && callback) {
        callback(response);
      }
    },
    *AddClusterRke2({ payload, callback, handleError }, { call }) {
      const response = yield call( AddClusterRke2, payload, handleError );
      if (response && callback) {
        callback(response);
      }
    },
    *fetchCheckSshPwd({ payload, callback, handleError }, { call }) {
      const response = yield call( fetchCheckSshPwd, payload, handleError );
      if (response && callback) {
        callback(response);
      }
    },
  },

  reducers: {}
};
