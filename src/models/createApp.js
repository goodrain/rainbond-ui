import {
  buildApp,
  createAppByCode,
  createAppByCompose,
  createAppByDockerrun,
  createThirdPartyServices,
  createJarWarServices,
  createJarWarUploadStatus,
  deleteJarWarUploadStatus,
  createJarWarUploadRecord,
  createJarWarFormSubmit,
  createJarWarSubmit,
  createThirtAppByCodes,
  getAppsByComposeId,
  installApp,
  preflightDeploy,
  preflightInstallApp,
  installAppPlugin,
  changeAppVersions,
  installHelmApp,
  helmAppInstall,
  getHelmVersion,
  installHelmAppCmd,
  setNodeLanguage,
  installRamAppCmd,
  getAppByVirtualMachineImage,
  deleteVirtualMachineImageAsset,
  getVMCapabilities,
  createAppByVirtualMachine,
  getImageRepositories,
  getImageTags,
  saveTarImageName,
  getHelmUploadChartInfo,
  checkHelmChartApp,
  getHelmChartYaml,
  installHelmUploadApp,
  updateCustomLanguage
} from '../services/createApp';
import {
  captureAppOperation,
  captureMarketInstall
} from '../posthog';

function buildCreateAppProperties(payload = {}, overrides = {}) {
  return {
    team_name: payload.team_name,
    group_id: payload.group_id,
    app_id: payload.app_id,
    template_id: payload.template_id || payload.app_id,
    template_name: payload.template_name || payload.app_name || payload.name,
    market_app_name: payload.app_name || payload.name || payload.template_name,
    version: payload.app_version || payload.version,
    category: payload.category,
    source: payload.source,
    marketName: payload.marketName,
    install_source: payload.install_from_cloud ? 'cloud_market' : payload.install_source,
    deploy_type: payload.deploy_type,
    ...overrides
  };
}

function trackCreateSucceeded(actionType, payload) {
  const properties = buildCreateAppProperties(payload, { action_type: actionType });
  captureAppOperation(actionType, 'succeeded', properties);
}

function trackCreateStarted(actionType, payload) {
  captureAppOperation(actionType, 'started', buildCreateAppProperties(payload, { action_type: actionType }));
}

function trackCreateFailed(actionType, payload, error) {
  captureAppOperation(actionType, 'failed', buildCreateAppProperties(payload, {
    action_type: actionType,
    error_category: 'request_failed',
    error_code: error && (error.status || error.code || error.name)
  }));
}

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
    *installApp({ payload, callback,handleError }, { call }) {
      captureMarketInstall('started', buildCreateAppProperties(payload));
      try {
        const data = yield call(installApp, payload, handleError);
        if (data) {
          captureMarketInstall('succeeded', buildCreateAppProperties(payload));
        }
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        captureMarketInstall('failed', buildCreateAppProperties(payload, {
          error_category: 'request_failed',
          error_code: e && (e.status || e.code || e.name)
        }));
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
      }
    },
    *preflightInstallApp({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(preflightInstallApp, payload, handleError);
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
      }
    },
    *preflightDeploy({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(preflightDeploy, payload, handleError);
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
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
      trackCreateStarted('helm_app_install', payload);
      const data = yield call(installHelmApp, payload);
      if (data) {
        trackCreateSucceeded('helm_app_install', payload);
      }
      if (data && callback) {
        callback(data);
      }
    },
    *createAppByCode({ payload, callback }, { call }) {
      trackCreateStarted('source_code_create', payload);
      const data = yield call(createAppByCode, payload);
      if (data) {
        trackCreateSucceeded('source_code_create', payload);
      }
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createThirtAppByCode({ payload, callback }, { call }) {
      trackCreateStarted('third_party_code_create', payload);
      const data = yield call(createThirtAppByCodes, payload);
      if (data) {
        trackCreateSucceeded('third_party_code_create', payload);
      }
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },

    *createThirdPartyServices({ payload, callback }, { call }) {
      trackCreateStarted('third_party_service_create', payload);
      const data = yield call(createThirdPartyServices, payload);
      if (data) {
        trackCreateSucceeded('third_party_service_create', payload);
      }
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarServices({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(createJarWarServices, payload);
        if (data && callback) {
          setTimeout(() => {
            callback(data);
          });
        }
      } catch (e) {
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
      }
    },
    *createJarWarUploadStatus({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(createJarWarUploadStatus, payload);
        if (data && callback) {
          setTimeout(() => {
            callback(data);
          });
        }
      } catch (e) {
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
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
    *createJarWarFormSubmit({ payload, callback }, { call }) {
      const data = yield call(createJarWarFormSubmit, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createJarWarSubmit({ payload, callback }, { call }) {
      const data = yield call(createJarWarSubmit, payload);
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    
    *deleteJarWarUploadStatus({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(deleteJarWarUploadStatus, payload);
        if (data && callback) {
          setTimeout(() => {
            callback(data);
          });
        }
      } catch (e) {
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
      }
    },
    *createAppByCompose({ payload, callback }, { call }) {
      trackCreateStarted('compose_create', payload);
      const data = yield call(createAppByCompose, payload);
      if (data) {
        trackCreateSucceeded('compose_create', payload);
      }
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createAppByDockerrun({ payload, callback }, { call }) {
      trackCreateStarted('docker_run_create', payload);
      const data = yield call(createAppByDockerrun, payload);
      if (data) {
        trackCreateSucceeded('docker_run_create', payload);
      }
      if (data && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *buildApps({ payload, callback, handleError }, { call }) {
      const data = yield call(buildApp, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *helmAppInstall({ payload, callback, handleError }, { call }) {
      const data = yield call(helmAppInstall, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getHelmVersion({ payload, callback, handleError }, { call }) {
      const data = yield call(getHelmVersion, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *installHelmAppCmd({ payload, callback, handleError }, { call }) {
      trackCreateStarted('helm_cmd_install', payload);
      try {
        const data = yield call(installHelmAppCmd, payload, handleError);
        if (data) {
          trackCreateSucceeded('helm_cmd_install', payload);
        }
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('helm_cmd_install', payload, e);
        if (handleError) {
          handleError(e);
        } else {
          throw e;
        }
      }
    },
    *setNodeLanguage({ payload, callback, handleError }, { call }) {
      const data = yield call(setNodeLanguage, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *installRamAppCmd({ payload, callback, handleError }, { call }) {
      trackCreateStarted('ram_cmd_install', payload);
      try {
        const data = yield call(installRamAppCmd, payload, handleError);
        if (data) {
          trackCreateSucceeded('ram_cmd_install', payload);
        }
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('ram_cmd_install', payload, e);
        if (handleError) {
          handleError(e);
        }
      }
    },
    *createAppByVirtualMachine({ payload, callback, handleError }, { call }) {
      trackCreateStarted('virtual_machine_create', payload);
      try {
        const data = yield call(createAppByVirtualMachine, payload, handleError);
        if (data) {
          trackCreateSucceeded('virtual_machine_create', payload);
        }
        if (data && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('virtual_machine_create', payload, e);
        if (handleError) {
          handleError(e);
        }
      }
    },
    *getAppByVirtualMachineImage({ payload, callback, handleError }, { call }) {
      const data = yield call(getAppByVirtualMachineImage, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteVirtualMachineImageAsset({ payload, callback, handleError }, { call }) {
      const data = yield call(deleteVirtualMachineImageAsset, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getVMCapabilities({ payload, callback, handleError }, { call }) {
      const data = yield call(getVMCapabilities, payload, handleError);
      if (data && callback) {
        callback(data);
      }
    },
    *getImageRepositories({ payload, callback, handleError }, { call }) {
      const data = yield call(getImageRepositories, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *getImageTags({ payload, callback, handleError }, { call }) {
      const data = yield call(getImageTags, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *saveTarImageName({ payload, callback, handleError }, { call }) {
      const data = yield call(saveTarImageName, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *getHelmUploadChartInfo({ payload, callback, handleError }, { call }) {
      const data = yield call(getHelmUploadChartInfo, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *checkHelmChartApp({ payload, callback, handleError }, { call }) {
      const data = yield call(checkHelmChartApp, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *getHelmChartYaml({ payload, callback, handleError }, { call }) {
      const data = yield call(getHelmChartYaml, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
    *installHelmUploadApp({ payload, callback, handleError }, { call }) {
      trackCreateStarted('helm_upload_install', payload);
      try {
        const data = yield call(installHelmUploadApp, payload, handleError);
        if (data) {
          trackCreateSucceeded('helm_upload_install', payload);
        }
        if(data && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('helm_upload_install', payload, e);
        if (handleError) {
          handleError(e);
        }
      }
    },
    *updateCustomLanguage({ payload, callback, handleError }, { call }) {
      const data = yield call(updateCustomLanguage, payload, handleError);
      if(data && callback) {
        callback(data);
      }
    },
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
