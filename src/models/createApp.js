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
  getAvailableResources,
  installApp,
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
import { bindComposeAttempt, bindServiceAttempt, clearServiceAttempt, createAttemptId, createRequestTelemetryOptions, getDeployType, startComposeAttempt, startServiceAttempt } from '../utils/operationAttempt';

const REQUEST_TELEMETRY_OPTIONS = { returnErrorMetadata: true };

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
    deploy_type: getDeployType(payload),
    ...overrides
  };
}

function getOperationDeployType(actionType, payload) {
  const types = {
    source_code_create: 'source_code',
    third_party_code_create: 'source_code',
    compose_create: 'docker_compose',
    docker_run_create: 'image',
    virtual_machine_create: 'virtual_machine',
    package_build_create: 'source_code',
    helm_app_install: 'helm',
    helm_cmd_install: 'helm',
    helm_upload_install: 'helm'
  };
  return types[actionType] || getDeployType(payload);
}

function trackCreateSucceeded(actionType, payload, attemptId) {
  const properties = buildCreateAppProperties(payload, { action_type: actionType, attempt_id: attemptId, deploy_type: getOperationDeployType(actionType, payload) });
  captureAppOperation(actionType, 'succeeded', properties);
}

function trackCreateStarted(actionType, payload, attemptId) {
  captureAppOperation(actionType, 'started', buildCreateAppProperties(payload, { action_type: actionType, attempt_id: attemptId, deploy_type: getOperationDeployType(actionType, payload) }));
}

function trackCreateFailed(actionType, payload, error, attemptId) {
  const failure = (error && error.requestTelemetry) || error || {};
  captureAppOperation(actionType, 'failed', buildCreateAppProperties(payload, {
    action_type: actionType,
    attempt_id: attemptId,
    error_category: failure.error_category || 'request_failed',
    error_code: failure.error_code || failure.status || failure.code || 'request_failed',
    http_status: failure.http_status || 0,
    deploy_type: getOperationDeployType(actionType, payload)
  }));
}

function isRequestFailure(response) {
  return !!(response && response.__rainbondRequestFailure);
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
      const attemptId = startServiceAttempt(payload);
      captureMarketInstall('started', buildCreateAppProperties(payload, { attempt_id: attemptId, deploy_type: 'app_market' }));
      try {
        const data = yield call(installApp, payload, handleError, createRequestTelemetryOptions(attemptId));
        if (data && !isRequestFailure(data)) {
          captureMarketInstall('succeeded', buildCreateAppProperties(payload, { attempt_id: attemptId, deploy_type: 'app_market' }));
          if (callback) {
            callback(data);
          }
        } else {
          const failure = (data && data.requestTelemetry) || data || {};
          captureMarketInstall('failed', buildCreateAppProperties(payload, {
            attempt_id: attemptId,
            deploy_type: 'app_market',
            error_category: failure.error_category || 'request_failed',
            error_code: failure.error_code || failure.status || failure.code || 'request_failed',
            http_status: failure.http_status || 0
          }));
        }
      } catch (e) {
        captureMarketInstall('failed', buildCreateAppProperties(payload, {
          attempt_id: attemptId,
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
    *fetchAvailableResources({ payload, callback, handleError }, { call }) {
      const data = yield call(getAvailableResources, payload, handleError);
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
      const attemptId = createAttemptId();
      trackCreateStarted('helm_app_install', payload, attemptId);
      const data = yield call(installHelmApp, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        trackCreateSucceeded('helm_app_install', payload, attemptId);
      } else {
        trackCreateFailed('helm_app_install', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
        callback(data);
      }
    },
    *createAppByCode({ payload, callback }, { call }) {
      const attemptId = startServiceAttempt(payload);
      trackCreateStarted('source_code_create', payload, attemptId);
      const data = yield call(createAppByCode, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
          bindServiceAttempt({ team_name: payload.team_name, service_alias: data.bean && data.bean.service_alias }, attemptId, payload);
        trackCreateSucceeded('source_code_create', payload, attemptId);
      } else {
        trackCreateFailed('source_code_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createThirtAppByCode({ payload, callback }, { call }) {
      const attemptId = createAttemptId();
      trackCreateStarted('third_party_code_create', payload, attemptId);
      const data = yield call(createThirtAppByCodes, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        bindServiceAttempt({ team_name: payload.team_name, service_alias: data.bean && data.bean.service_alias }, attemptId, payload);
        trackCreateSucceeded('third_party_code_create', payload, attemptId);
      } else {
        trackCreateFailed('third_party_code_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },

    *createThirdPartyServices({ payload, callback }, { call }) {
      const attemptId = createAttemptId();
      trackCreateStarted('third_party_service_create', payload, attemptId);
      const data = yield call(createThirdPartyServices, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        trackCreateSucceeded('third_party_service_create', payload, attemptId);
      } else {
        trackCreateFailed('third_party_service_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
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
      const attemptId = startServiceAttempt(payload);
      trackCreateStarted('package_build_create', payload, attemptId);
      const data = yield call(createJarWarFormSubmit, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        bindServiceAttempt({ team_name: payload.team_name, service_alias: data.bean && data.bean.service_alias }, attemptId, payload);
        trackCreateSucceeded('package_build_create', payload, attemptId);
      } else {
        trackCreateFailed('package_build_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
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
      const attemptId = startComposeAttempt(payload);
      trackCreateStarted('compose_create', payload, attemptId);
      const data = yield call(createAppByCompose, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        bindComposeAttempt({ team_name: payload.team_name, group_id: data.bean && data.bean.group_id, compose_id: data.bean && data.bean.compose_id }, attemptId);
        trackCreateSucceeded('compose_create', payload, attemptId);
      } else {
        trackCreateFailed('compose_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *createAppByDockerrun({ payload, callback }, { call }) {
      const attemptId = startServiceAttempt(payload);
      trackCreateStarted('docker_run_create', payload, attemptId);
      const data = yield call(createAppByDockerrun, payload, createRequestTelemetryOptions(attemptId));
      if (data && !isRequestFailure(data)) {
        bindServiceAttempt({ team_name: payload.team_name, service_alias: data.bean && data.bean.service_alias }, attemptId, payload);
        trackCreateSucceeded('docker_run_create', payload, attemptId);
      } else {
        trackCreateFailed('docker_run_create', payload, data, attemptId);
      }
      if (data && !isRequestFailure(data) && callback) {
        setTimeout(() => {
          callback(data);
        });
      }
    },
    *buildApps({ payload, callback, handleError }, { call }) {
      try {
        const data = yield call(buildApp, payload, handleError);
        if (data && callback) {
          callback(data);
        }
      } finally {
        clearServiceAttempt(payload);
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
      const attemptId = createAttemptId();
      trackCreateStarted('helm_cmd_install', payload, attemptId);
      try {
        const data = yield call(installHelmAppCmd, payload, handleError, createRequestTelemetryOptions(attemptId));
        if (data && !isRequestFailure(data)) {
          trackCreateSucceeded('helm_cmd_install', payload, attemptId);
        } else {
          trackCreateFailed('helm_cmd_install', payload, data, attemptId);
        }
        if (data && !isRequestFailure(data) && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('helm_cmd_install', payload, e, attemptId);
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
      const attemptId = createAttemptId();
      trackCreateStarted('ram_cmd_install', payload, attemptId);
      try {
        const data = yield call(installRamAppCmd, payload, handleError, createRequestTelemetryOptions(attemptId));
        if (data && !isRequestFailure(data)) {
          trackCreateSucceeded('ram_cmd_install', payload, attemptId);
        } else {
          trackCreateFailed('ram_cmd_install', payload, data, attemptId);
        }
        if (data && !isRequestFailure(data) && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('ram_cmd_install', payload, e, attemptId);
        if (handleError) {
          handleError(e);
        }
      }
    },
    *createAppByVirtualMachine({ payload, callback, handleError }, { call }) {
      const attemptId = startServiceAttempt(payload);
      trackCreateStarted('virtual_machine_create', payload, attemptId);
      try {
        const data = yield call(createAppByVirtualMachine, payload, createRequestTelemetryOptions(attemptId));
        if (data && !isRequestFailure(data)) {
        bindServiceAttempt({ team_name: payload.team_name, service_alias: data.bean && data.bean.service_alias }, attemptId, payload);
          trackCreateSucceeded('virtual_machine_create', payload, attemptId);
        } else {
          trackCreateFailed('virtual_machine_create', payload, data, attemptId);
        }
        if (data && !isRequestFailure(data) && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('virtual_machine_create', payload, e, attemptId);
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
      const attemptId = createAttemptId();
      trackCreateStarted('helm_upload_install', payload, attemptId);
      try {
        const data = yield call(installHelmUploadApp, payload, handleError, createRequestTelemetryOptions(attemptId));
        if (data && !isRequestFailure(data)) {
          trackCreateSucceeded('helm_upload_install', payload, attemptId);
        } else {
          trackCreateFailed('helm_upload_install', payload, data, attemptId);
        }
        if(data && !isRequestFailure(data) && callback) {
          callback(data);
        }
      } catch (e) {
        trackCreateFailed('helm_upload_install', payload, e, attemptId);
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
