/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import {
  addInnerEnvs,
  addInstanceList,
  addMavensettings,
  addOuterEnvs,
  addPort,
  addRunningProbe,
  addStartProbe,

  // addVariable,
  // putVariable,
  addTags,
  addVolume,
  batchDelete,
  batchMove,
  batchReStart,
  batchStart,
  batchStop,
  bindDomain,
  cancelAutoDeploy,
  changeApplicationState,
  changePortProtocal,
  closePortInner,
  closePortOuter,
  createService,
  delAppVersion,
  deleteApp,
  deleteEvns,
  deleteInstanceList,
  deleteMavensettings,
  deleteMember,
  deleteMnt,
  deletePort,
  deleteTag,
  deleteVariable,
  deleteVolume,
  deploy,
  editAppCreateInfo,
  editEvns,
  editMavensettings,
  editMemberAction,
  editName,
  editorHealthList,
  editorVolume,
  editPluginConfigs,
  editPortAlias,
  editRunningProbe,
  editRuntimeBuildInfo,
  editRuntimeInfo,
  editScalingRules,
  editStartProbe,
  editUpDatekey,
  fetchHelmInstanceDetails,
  fetchInstanceDetails,
  fetchLogContent,
  fetchOperationLog,
  getAnalyzePlugins,
  getAppBuidSource,
  getAppDisk,
  getAppMemory,
  getAppOnlineNumber,
  getAppOnlineNumberRange,
  getAppRequest,
  getAppRequestRange,
  getAppRequestTime,
  getAppRequestTimeRange,
  getAppResource,
  getAppVersionList,
  getAutoDeployStatus,
  getBaseInfo,
  getBuildInformation,
  getCodeBranch,
  getComponentState,
  getDetail,
  getExtendInfo,
  getHealthList,
  getInnerEnvs,
  getInstanceList,
  getLanguage,
  getMavensettings,
  getMembers,
  getMultipleModulesInfo,
  getOuterEnvs,
  getPerformanceAnalysis,
  getPermissions,
  getPhpConfig,
  getPluginConfigs,
  getPlugins,
  getPods,
  getPorts,
  getRunningProbe,
  getRuntimeBuildInfo,
  getRuntimeInfo,
  getScalingRules,
  getStartProbe,
  getSubDomain,
  getSubPort,
  getTagInformation,
  getTags,
  getVariable,
  getVariableList,
  getVisitInfo,
  getVolumeOpts,
  getVolumes,
  installPlugin,
  managePods,
  modifyInstanceList,
  moveGroup,
  newaddScalingRules,
  openAutoDeploy,

  // onlyOpenPortOuter,
  openExternalPort,
  openPortInner,
  openPortOuter,
  putAppBuidSource,
  putAutoDeployCommand,
  putAutoDeploySecret,
  putLanguage,
  putMirrorCommand,
  putTransfer,
  queryScalingRecord,
  restart,
  setCodeBranch,
  setMemberAction,
  start,
  startPlugin,
  stop,
  stopPlugin,
  SubDomain,
  SubPort,
  TelescopicInfo,
  unbindDomain,
  unInstallPlugin,
  updateComponentDeployType,
  updatePluginMemory,
  updateRolling,
  updateServiceName,
  upgrade,
  vmPause
} from '../services/app';
import { getGroupApps } from '../services/application';
import { addCertificate, getCertificates } from '../services/team';

export default {
  namespace: 'appControl',
  state: {
    // 标签信息
    tags: null,
    // 应用的扩展信息
    extendInfo: null,
    // 规则
    scalingRules: null,
    // 应用
    apps: [],
    // 应用详情
    appDetail: {},
    baseInfo: {},
    // 应用端口信息
    ports: [],
    // 添加域名是所需要证书
    certificates: [],
    // 应用的环境变量
    innerEnvs: [],
    // 依赖里的环境变量
    outerEnvs: [],
    // 某个依赖的应用的对外环境变量
    relationOuterEnvs: [],
    // 启动时检测信息
    startProbe: {},
    // 运行时检测信息
    runningProbe: {},
    // 应用的代码分支
    branchs: [],
    // 应用的持久化路径
    volumes: [],
    // 应用当前时间在线人数
    onlineNumber: {},
    // 应用一段时间内在线人数
    onlineNumberRange: {},
    // 应用当前时间吞吐率
    appRequest: {},
    // 应用一段内时间吞吐率
    appRequestRange: {},
    // 应用当前时间响应时间
    requestTime: {},
    // 应用一段时间内的响应时间
    requestTimeRange: {},
    // 应用的分支
    codeBranch: [],
    // 应用磁盘使用量
    appDisk: {},
    // 应用内存使用量
    appMemory: {},
    // 应用实例
    pods: [],
    // 应用的访问信息
    visitInfo: null,
    // 设置了权限的团队成员
    members: [],
    build_upgrade: ''
  },
  effects: {
    *fetchOperationLog({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchOperationLog, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getSubDomain({ payload, callback }, { call }) {
      const response = yield call(getSubDomain, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getAppVersionList({ payload, callback }, { call }) {
      const response = yield call(getAppVersionList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *SubDomain({ payload, callback }, { call }) {
      const response = yield call(SubDomain, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getSubPort({ payload, callback }, { call }) {
      const response = yield call(getSubPort, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *SubPort({ payload, callback }, { call }) {
      const response = yield call(SubPort, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *delAppVersion({ payload, callback }, { call }) {
      const response = yield call(delAppVersion, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getPhpConfig({ payload, callback }, { call }) {
      const response = yield call(getPhpConfig, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *openAutoDeploy({ payload, callback }, { call }) {
      const response = yield call(openAutoDeploy, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *putBatchDelete({ payload, callback }, { call }) {
      const response = yield call(batchDelete, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putDeploy({ payload, callback, handleError }, { call }) {
      const response = yield call(deploy, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *putUpgrade({ payload, callback, handleError }, { call }) {
      const response = yield call(upgrade, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *putUpdateRolling({ payload, callback }, { call }) {
      const response = yield call(updateRolling, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putBatchReStart({ payload, callback }, { call }) {
      const response = yield call(batchReStart, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putBatchStart({ payload, callback }, { call }) {
      const response = yield call(batchStart, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putBbatchStop({ payload, callback }, { call }) {
      const response = yield call(batchStop, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putBatchMove({ payload, callback }, { call }) {
      const response = yield call(batchMove, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putReStart({ payload, callback }, { call }) {
      const response = yield call(restart, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putStart({ payload, callback }, { call }) {
      const response = yield call(start, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putStop({ payload, callback }, { call }) {
      const response = yield call(stop, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *cancelAutoDeploy({ payload, callback }, { call }) {
      const response = yield call(cancelAutoDeploy, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getAutoDeployStatus({ payload, callback }, { call }) {
      const response = yield call(getAutoDeployStatus, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getAppResource({ payload, callback, handleError }, { call }) {
      const response = yield call(getAppResource, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getAnalyzePlugins({ payload, callback }, { call }) {
      const response = yield call(getAnalyzePlugins, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getPluginConfigs({ payload, callback }, { call }) {
      const response = yield call(getPluginConfigs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editPluginConfigs({ payload, callback }, { call }) {
      const response = yield call(editPluginConfigs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *startPlugin({ payload, callback }, { call }) {
      const response = yield call(startPlugin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *updatePluginMemory({ payload, callback }, { call }) {
      const response = yield call(updatePluginMemory, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *stopPlugin({ payload, callback }, { call }) {
      const response = yield call(stopPlugin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *unInstallPlugin({ payload, callback }, { call }) {
      const response = yield call(unInstallPlugin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *installPlugin({ payload, callback }, { call }) {
      const response = yield call(installPlugin, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getPlugins({ payload, callback }, { call }) {
      const response = yield call(getPlugins, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editAppCreateInfo({ payload, callback }, { call }) {
      const response = yield call(editAppCreateInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getRuntimeInfo({ payload, callback }, { call }) {
      const response = yield call(getRuntimeInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getRuntimeBuildInfo({ payload, callback }, { call }) {
      const response = yield call(getRuntimeBuildInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMavensettings({ payload, callback }, { call }) {
      const response = yield call(getMavensettings, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *AddMavensettings({ payload, callback }, { call }) {
      const response = yield call(addMavensettings, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *EditMavensettings({ payload, callback }, { call }) {
      const response = yield call(editMavensettings, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *DeleteMavensettings({ payload, callback }, { call }) {
      const response = yield call(deleteMavensettings, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchInstanceDetails({ payload, callback }, { call, put }) {
      const response = yield call(fetchInstanceDetails, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchHelmInstanceDetails({ payload, callback }, { call, put }) {
      const response = yield call(fetchHelmInstanceDetails, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getVariable({ payload, callback }, { call }) {
      const response = yield call(getVariable, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editRuntimeInfo({ payload, callback }, { call }) {
      const response = yield call(editRuntimeInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editRuntimeBuildInfo({ payload, callback }, { call }) {
      const response = yield call(editRuntimeBuildInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addTag({ payload, callback }, { call }) {
      const response = yield call(addTags, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteTag({ payload, callback }, { call }) {
      const response = yield call(deleteTag, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchTags({ payload, callback }, { call, put }) {
      const response = yield call(getTags, payload);
      if (response) {
        yield put({ type: 'saveTags', payload: response.bean });
        if (callback) {
          callback(response.bean);
        }
      }
    },
    *managePod({ payload, callback }, { call }) {
      const response = yield call(managePods, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *telescopic({ payload, callback }, { call }) {
      const response = yield call(TelescopicInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchVisitInfo({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getVisitInfo, payload, handleError);
      if (response) {
        if (callback) {
          callback(response);
        }
        yield put({ type: 'saveVisitInfo', payload: response.bean });
      }
    },
    *fetchPods({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getPods, payload, handleError);
      if (response) {
        yield put({ type: 'savePods', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
    },
    *addScalingRules({ payload, callback }, { call }) {
      const response = yield call(newaddScalingRules, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getScalingRules({ payload, callback }, { call, put }) {
      const response = yield call(getScalingRules, payload);
      if (response) {
        yield put({ type: 'saveScalingRules', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
    },
    *changeScalingRules({ payload, callback }, { call }) {
      const response = yield call(editScalingRules, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getScalingRecord({ payload, callback }, { call }) {
      const response = yield call(queryScalingRecord, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchExtendInfo({ payload, handleError }, { call, put }) {
      const response = yield call(getExtendInfo, payload, handleError);
      if (response) {
        yield put({ type: 'saveExtendInfo', payload: response.bean });
      }
    },
    *editName({ payload, callback }, { call }) {
      const response = yield call(editName, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchLogContent({ payload, callback }, { call }) {
      const response = yield call(fetchLogContent, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchDetail({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getDetail, payload, handleError);
      if (response) {
        yield put({ type: 'saveDetail', payload: response.bean });
        if (callback) {
          callback(response.bean);
        }
      }
    },
    *fetchComponentState({ payload, callback, handleError }, { call }) {
      const response = yield call(getComponentState, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *createService({ payload, callback }, { call }) {
      const response = yield call(createService, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchApps({ payload }, { call, put }) {
      const response = yield call(getGroupApps, payload);
      if (response) {
        yield put({ type: 'saveApps', payload: response.list });
      }
    },
    *fetchPorts({ payload, callback }, { call, put }) {
      const response = yield call(getPorts, payload);
      if (response) {
        yield put({ type: 'savePorts', payload: response.list });
        callback && callback(response);
      }
    },
    *deletePort({ payload, callback }, { call }) {
      const response = yield call(deletePort, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *changeProtocol({ payload, callback }, { call }) {
      const response = yield call(changePortProtocal, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *openPortOuter({ payload, callback }, { call }) {
      const response = yield call(openPortOuter, payload);
      if (response && callback) {
        callback(response);
      }
    },
    // * onlyOpenPortOuter({ payload, callback }, { call }) {
    //   const response = yield call(onlyOpenPortOuter, payload);
    //   if (response) {
    //     callback && callback(response);
    //   }
    // },
    *openExternalPort({ payload, callback }, { call }) {
      const response = yield call(openExternalPort, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *closePortOuter({ payload, callback }, { call }) {
      const response = yield call(closePortOuter, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *openPortInner({ payload, callback }, { call }) {
      const response = yield call(openPortInner, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *closePortInner({ payload, callback }, { call }) {
      const response = yield call(closePortInner, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *bindDomain({ payload, callback }, { call }) {
      const response = yield call(bindDomain, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *unbindDomain({ payload, callback }, { call }) {
      const response = yield call(unbindDomain, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editPortAlias({ payload, callback }, { call }) {
      const response = yield call(editPortAlias, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addPort({ payload, callback }, { call }) {
      const response = yield call(addPort, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *moveGroup({ payload, callback }, { call }) {
      const response = yield call(moveGroup, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getBuildInformation({ payload, callback }, { call }) {
      const response = yield call(getBuildInformation, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteVariable({ payload, callback }, { call }) {
      const response = yield call(deleteVariable, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchCertificates({ payload, callback }, { call, put }) {
      const response = yield call(getCertificates, payload);
      if (response) {
        yield put({ type: 'saveCertificates', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
    },
    *addCertificate({ payload, callback }, { call }) {
      const response = yield call(addCertificate, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchInnerEnvs({ payload, callback }, { call, put }) {
      const response = yield call(getInnerEnvs, payload);
      if (response) {
        yield put({ type: 'saveInnerEnvs', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
    },
    *addInnerEnvs({ payload, callback }, { call }) {
      const response = yield call(addInnerEnvs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchOuterEnvs({ payload, callback }, { call, put }) {
      const response = yield call(getOuterEnvs, payload);
      if (response) {
        if (callback) {
          callback(response);
        }
        yield put({ type: 'saveOuterEnvs', payload: response.list });
      }
    },
    *fetchRelationOuterEnvs({ payload, callback }, { call, put }) {
      const response = yield call(getOuterEnvs, payload);
      if (response) {
        if (callback) {
          callback(response);
        }
        yield put({ type: 'saveRelationOuterEnvs', payload: response.list });
      }
    },
    *addOuterEnvs({ payload, callback }, { call }) {
      const response = yield call(addOuterEnvs, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteEnvs({ payload, callback }, { call }) {
      const response = yield call(deleteEvns, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putTransfer({ payload, callback }, { call }) {
      const response = yield call(putTransfer, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getInstanceList({ payload, callback }, { call }) {
      const response = yield call(getInstanceList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteInstanceList({ payload, callback }, { call }) {
      const response = yield call(deleteInstanceList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *modifyInstanceList({ payload, callback }, { call }) {
      const response = yield call(modifyInstanceList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addInstanceList({ payload, callback }, { call }) {
      const response = yield call(addInstanceList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editUpDatekey({ payload, callback }, { call }) {
      const response = yield call(editUpDatekey, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getHealthList({ payload, callback }, { call }) {
      const response = yield call(getHealthList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editorHealthList({ payload, callback }, { call }) {
      const response = yield call(editorHealthList, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editEvns({ payload, callback }, { call }) {
      const response = yield call(editEvns, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchStartProve({ payload, callback }, { call }) {
      const response = yield call(editEvns, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchRunningProbe({ payload, callback }, { call, put }) {
      const response = yield call(getRunningProbe, payload);
      if (response) {
        if (callback) {
          callback(response);
        }
        yield put({ type: 'saveRunningProbe', payload: response.bean });
      }
    },
    *fetchStartProbe({ payload }, { call, put }) {
      const response = yield call(getStartProbe, payload);
      if (response) {
        yield put({ type: 'saveStartProbe', payload: response.bean });
      }
    },
    *addStartProbe({ payload, callback }, { call }) {
      const response = yield call(addStartProbe, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addRunProbe({ payload, callback }, { call }) {
      const response = yield call(addRunningProbe, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editStartProbe({ payload, callback }, { call }) {
      const response = yield call(editStartProbe, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editRunProbe({ payload, callback }, { call }) {
      const response = yield call(editRunningProbe, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchBaseInfo({ payload }, { call, put }) {
      const response = yield call(getBaseInfo, payload);
      if (response) {
        yield put({ type: 'saveBaseInfo', payload: response.bean });
      }
    },
    *deleteMnt({ payload, callback }, { call }) {
      const response = yield call(deleteMnt, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchVolumes({ payload, callback }, { call, put }) {
      const response = yield call(getVolumes, payload);
      if (response) {
        yield put({
          type: 'saveVolumes',
          payload: response.list || []
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchVolumeOpts({ payload, callback }, { call }) {
      const response = yield call(getVolumeOpts, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *addVolume({ payload, callback }, { call }) {
      const response = yield call(addVolume, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editorVolume({ payload, callback }, { call }) {
      const response = yield call(editorVolume, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteVolume({ payload, callback }, { call }) {
      const response = yield call(deleteVolume, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchPerformanceAnalysis({ payload, callback }, { call }) {
      const response = yield call(getPerformanceAnalysis, payload);
      if (callback) {
        callback(response);
      }
    },
    // 响应时间
    *fetchRequestTime({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppRequestTime, payload);
      if (response) {
        yield put({ type: 'saveRequestTime', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 响应时间
    *fetchRequestTimeRange({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppRequestTimeRange, payload);
      if (response) {
        yield put({ type: 'saveRequestTimeRange', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 吞吐率
    *fetchRequest({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppRequest, payload);
      if (response) {
        yield put({ type: 'saveRequest', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 吞吐率
    *fetchRequestRange({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppRequestRange, payload);

      if (response) {
        yield put({ type: 'saveRequestRange', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 磁盘使用量
    *fetchDisk({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppDisk, payload);
      if (response) {
        yield put({ type: 'saveAppDisk', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 内存使用量
    *fetchMemory({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppMemory, payload);
      if (response) {
        yield put({ type: 'saveAppMemory', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 在线人数
    *fetchOnlineNumber({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppOnlineNumber, payload);
      if (response) {
        yield put({ type: 'saveOnlineNumber', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 在线人数
    *fetchOnlineNumberRange({ payload, callback, complete }, { call, put }) {
      const response = yield call(getAppOnlineNumberRange, payload);
      if (response) {
        yield put({ type: 'saveOnlineNumberRange', payload: response.bean });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 获取分支
    *fetchBranch({ payload, callback, complete }, { call, put }) {
      const response = yield call(getCodeBranch, payload);
      if (response) {
        yield put({ type: 'saveBranch', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
      if (complete) {
        complete();
      }
    },
    // 设置分支
    *setBranch({ payload, callback, complete }, { call }) {
      const response = yield call(setCodeBranch, payload);
      if (response && callback) {
        callback(response);
      }
      if (complete) {
        complete();
      }
    },
    // 设置用户权限
    *setMemberAction({ payload, callback }, { call }) {
      const response = yield call(setMemberAction, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMember({ payload }, { call, put }) {
      const response = yield call(getMembers, payload);
      if (response) {
        yield put({ type: 'saveMember', payload: response.list });
      }
    },
    *fetchpermsMember({ payload, callback }, { call }) {
      const response = yield call(getMembers, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getPermissions({ payload, callback }, { call }) {
      const response = yield call(getPermissions, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteMember({ payload, callback }, { call }) {
      const response = yield call(deleteMember, payload);

      if (response && callback) {
        callback(response);
      }
    },
    *getVariableList({ payload, callback, handleError }, { call }) {
      const response = yield call(getVariableList, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *editMemberAction({ payload, callback }, { call }) {
      const response = yield call(editMemberAction, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *deleteApp({ payload, callback, handleError }, { call }) {
      const response = yield call(deleteApp, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getMultipleModulesInfo({ payload, callback }, { call }) {
      const response = yield call(getMultipleModulesInfo, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putAutoDeploySecret({ payload, callback }, { call }) {
      const response = yield call(putAutoDeploySecret, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putAutoDeployCommand({ payload, callback }, { call }) {
      const response = yield call(putAutoDeployCommand, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putMirrorCommand({ payload, callback }, { call }) {
      const response = yield call(putMirrorCommand, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getAppBuidSource({ payload, callback }, { call }) {
      const response = yield call(getAppBuidSource, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getLanguage({ payload, callback }, { call }) {
      const response = yield call(getLanguage, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putLanguage({ payload, callback }, { call }) {
      const response = yield call(putLanguage, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getTagInformation({ payload, callback }, { call }) {
      const response = yield call(getTagInformation, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *putAppBuidSource({ payload, callback }, { call }) {
      const response = yield call(putAppBuidSource, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *updateComponentDeployType({ payload, callback }, { call }) {
      const response = yield call(updateComponentDeployType, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *changeApplicationState({ payload, callback }, { call, put }) {
      const response = yield call(changeApplicationState, payload);
      yield put({
        type: 'saveBuild_upgrade',
        build_upgrade: response.bean.build_upgrade
      });
      if (response && callback) {
        callback(response);
      }
    },
    *updateServiceName({ payload, callback }, { call }) {
      const response = yield call(updateServiceName, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *vmPause({ payload, callback }, { call }) {
      const response = yield call(vmPause, payload);
      if (response && callback) {
        callback(response);
      }
    },

  },
  reducers: {
    clearMembers(state) {
      return {
        ...state,
        members: []
      };
    },
    saveMember(state, action) {
      return {
        ...state,
        members: action.payload
      };
    },
    saveVisitInfo(state, action) {
      return {
        ...state,
        visitInfo: action.payload
      };
    },
    clearVisitInfo(state) {
      return {
        ...state,
        visitInfo: null
      };
    },
    clearPods(state) {
      return {
        ...state,
        pods: {}
      };
    },
    savePods(state, action) {
      return {
        ...state,
        pods: action.payload
      };
    },
    clearExtendInfo(state) {
      return {
        ...state,
        extendInfo: null
      };
    },
    saveExtendInfo(state, action) {
      return {
        ...state,
        extendInfo: action.payload
      };
    },
    saveScalingRules(state, action) {
      return {
        ...state,
        scalingRules: action.payload
      };
    },
    saveBranch(state, action) {
      return {
        ...state,
        codeBranch: action.payload
      };
    },
    saveApps(state, action) {
      return {
        ...state,
        apps: action.payload
      };
    },
    clearPorts(state) {
      return {
        ...state,
        ports: []
      };
    },
    savePorts(state, action) {
      return {
        ...state,
        ports: action.payload
      };
    },
    clearInnerEnvs(state) {
      return {
        ...state,
        innerEnvs: []
      };
    },
    saveInnerEnvs(state, action) {
      return {
        ...state,
        innerEnvs: action.payload
      };
    },
    clearOuterEnvs(state) {
      return {
        ...state,
        outerEnvs: []
      };
    },
    saveOuterEnvs(state, action) {
      return {
        ...state,
        outerEnvs: action.payload
      };
    },
    clearRelationOuterEnvs(state) {
      return {
        ...state,
        relationOuterEnvs: []
      };
    },
    saveRelationOuterEnvs(state, action) {
      return {
        ...state,
        relationOuterEnvs: action.payload
      };
    },
    clearRunningProbe(state) {
      return {
        ...state,
        runningProbe: {}
      };
    },
    saveRunningProbe(state, action) {
      return {
        ...state,
        runningProbe: action.payload
      };
    },
    clearStartProbe(state) {
      return {
        ...state,
        startProbe: {}
      };
    },
    saveStartProbe(state, action) {
      return {
        ...state,
        startProbe: action.payload
      };
    },
    saveBaseInfo(state, action) {
      return {
        ...state,
        baseInfo: action.payload
      };
    },
    clearVolumes(state) {
      return {
        ...state,
        volumes: []
      };
    },
    saveVolumes(state, action) {
      return {
        ...state,
        volumes: action.payload
      };
    },
    saveCertificates(state, action) {
      return {
        ...state,
        certificates: action.payload
      };
    },
    clearRequesTime(state) {
      return {
        ...state,
        requestTime: {}
      };
    },
    saveRequestTime(state, action) {
      return {
        ...state,
        requestTime: action.payload
      };
    },
    clearRequesTimeRange(state) {
      return {
        ...state,
        requestTimeRange: {}
      };
    },
    saveRequestTimeRange(state, action) {
      return {
        ...state,
        requestTimeRange: action.payload
      };
    },
    clearAppDisk(state) {
      return {
        ...state,
        appDisk: {}
      };
    },
    saveAppDisk(state, action) {
      return {
        ...state,
        appDisk: action.payload
      };
    },
    clearAppMemory(state) {
      return {
        ...state,
        appMemory: {}
      };
    },
    saveAppMemory(state, action) {
      return {
        ...state,
        appMemory: action.payload
      };
    },
    clearRequest(state) {
      return {
        ...state,
        appRequest: {}
      };
    },
    saveRequest(state, action) {
      return {
        ...state,
        appRequest: action.payload
      };
    },
    clearRequestRange(state) {
      return {
        ...state,
        appRequestRange: {}
      };
    },
    saveRequestRange(state, action) {
      return {
        ...state,
        appRequestRange: action.payload
      };
    },
    clearOnlineNumber(state) {
      return {
        ...state,
        onlineNumber: {}
      };
    },
    saveOnlineNumber(state, action) {
      return {
        ...state,
        onlineNumber: action.payload
      };
    },
    clearOnlineNumberRange(state) {
      return {
        ...state,
        onlineNumberRange: {}
      };
    },
    saveOnlineNumberRange(state, action) {
      return {
        ...state,
        onlineNumberRange: action.payload
      };
    },
    clearDetail(state) {
      return {
        ...state,
        appDetail: {}
      };
    },
    saveTags(state, action) {
      return {
        ...state,
        tags: action.payload
      };
    },
    clearTags(state) {
      return {
        ...state,
        tags: null
      };
    },
    saveDetail(state, action) {
      return {
        ...state,
        appDetail: action.payload
      };
    },
    saveBuild_upgrade(state, action) {
      return {
        ...state,
        build_upgrade: action.build_upgrade
      };
    }
  }
};
