import {
  buildApp,
  createAppByCode,
  createAppByCompose,
  createAppByDockerrun,
  createThirdPartyServices,
  createJarWarServices,
  createJarWarUploadStatus,
  createJarWarUploadRecord,
  createJarWarFormSubmit,
  createJarWarUpload,
  createThirtAppByCodes,
  getAppsByComposeId,
  installApp,
  installAppPlugin,
  changeAppVersions,
  installHelmApp
} from '../services/createApp';

export default {
  namespace: 'createApp',

  state: {
    extend_method: '',
    min_memory: '',
    service_runtimes: '',
    service_server: '',
    service_dependency: ''
  },
  effects: {
    *getAppsByComposeId({ payload, callback }, { call }) {
      const data = yield call(getAppsByComposeId, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *installApp({ payload, callback }, { call }) {
      const data = yield call(installApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *installAppPlugin({ payload, callback }, { call }) {
      const data = yield call(installAppPlugin, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *changeAppVersions({ payload, callback }, { call }) {
      const data = yield call(changeAppVersions, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *installHelmApp({ payload, callback }, { call }) {
      const data = yield call(installHelmApp, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *createAppByCode({ payload, callback }, { call }) {
      const data = yield call(createAppByCode, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createThirtAppByCode({ payload, callback }, { call }) {
      const data = yield call(createThirtAppByCodes, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },

    *createThirdPartyServices({ payload, callback }, { call }) {
      const data = yield call(createThirdPartyServices, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarServices({ payload, callback }, { call }) {
      const data = yield call(createJarWarServices, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarUploadStatus({ payload, callback }, { call }) {
      const data = yield call(createJarWarUploadStatus, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarUploadRecord({ payload, callback }, { call }) {
      const data = yield call(createJarWarUploadRecord, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarUpload({ payload, callback }, { call }) {
      const data = yield call(createJarWarUpload, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarFormSubmit({ payload, callback }, { call }) {
      const data = yield call(createJarWarFormSubmit, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createAppByCompose({ payload, callback }, { call }) {
      const data = yield call(createAppByCompose, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createAppByDockerrun({ payload, callback }, { call }) {
      const data = yield call(createAppByDockerrun, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *buildApps({ payload, callback }, { call }) {
      const data = yield call(buildApp, payload);
      if (data && callback) {
        callback(data);
      }
    }
  },

  reducers: {
    saveRuntimeInfo(state, { payload }) {
      return {
        ...state,
        ...payload
      };
    },
    clearRuntimeInfo() {
      return {
        extend_method: '',
        min_memory: '',
        service_runtimes: '',
        service_server: '',
        service_dependency: ''
      };
    }
  }
};
