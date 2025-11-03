import {
  addMember,
  closeTeamRegion,
  createRole,
  createTeam,
  deleteTeam,
  editMember,
  editRole,
  editTeamName,
  exitTeam,
  fetchFeatures,
  getJoinTeamUsers,
  getMembers,
  getRegionKey,
  getRegions,
  getTeamMembers,
  getTeamRoles,
  getTeamRolesPermissions,
  getTeamUserPermissions,
  getUserTeamsRoles,
  joinTeam,
  moveTeam,
  openRegion,
  putRolePermissions,
  removeMember,
  removeRole,
  setJoinTeamUsers,
  stopComponentInTeam,
  undoTeamUsers,
  getUploadInformation,
  getAdvancedInformation,
  confirmTheImport,
  fetchToken,
  fetchPluginUrl,
  fetchServiceID,
  fetchAppNames,
  getHelmAdvancedInfo,
  getAuthorizationMessage,
  addAuthorizationMessage,
  editAuthorizationMessage,
  delAuthorizationMessage,
  fetchImageTags,
  getComponentLangVersion,
  loadTarImage,
  getTarImageLoadResult,
} from '../services/team';

export default {
  namespace: 'teamControl',
  state: {
    // 成员
    members: [],
    // 权限列表
    actions: [],
    // 已开通的集群
    regions: [],
    // current show teams
    currentTeam: {},
    currentRegionName: '',
    // team Permissions info
    currentTeamPermissionsInfo: null,
    features: [],
    // 源码构建语言
    codeLanguage: JSON.parse(window.sessionStorage.getItem('codeLanguage')) || '',
    // 包管理器
    packageNpmOrYarn: JSON.parse(window.sessionStorage.getItem('packageNpmOrYarn')) || 'npm',
    // 所有app名称数组
    allAppNames: [],
    // 插件列表
    pluginsList: []
  },
  effects: {
    *fetchTeamUserPermissions(
      { payload, callback, handleError },
      { call, put }
    ) {
      const response = yield call(getTeamUserPermissions, payload, handleError);
      if (response) {
        yield put({
          type: 'saveCurrentTeamPermissionsInfo',
          payload: response.bean.permissions
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchTeamRoles({ payload, callback }, { call }) {
      const response = yield call(getTeamRoles, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchTeamRolesPermissions({ payload, callback }, { call }) {
      const response = yield call(getTeamRolesPermissions, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getJoinTeamUsers({ payload, callback }, { call }) {
      const response = yield call(getJoinTeamUsers, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *createRole({ payload, callback }, { call }) {
      const response = yield call(createRole, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *removeRole({ payload, callback }, { call }) {
      const response = yield call(removeRole, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editRole({ payload, callback }, { call }) {
      const response = yield call(editRole, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *updateRolePermissions({ payload, callback }, { call }) {
      const response = yield call(putRolePermissions, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *exitTeam({ payload, callback }, { call }) {
      const response = yield call(exitTeam, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchMember({ payload, callback }, { call }) {
      const response = yield call(getMembers, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchTeamMember({ payload, callback }, { call }) {
      const response = yield call(getTeamMembers, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchUserTeamsRoles({ payload, callback }, { call }) {
      const response = yield call(getUserTeamsRoles, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *editTeamAlias({ payload, callback }, { call }) {
      const response = yield call(editTeamName, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    *delTeam({ payload, callback, handleError }, { call }) {
      const response = yield call(deleteTeam, payload, handleError);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    *stopComponentInTeam({ payload, callback, handleError }, { call }) {
      const response = yield call(stopComponentInTeam, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *delMember({ payload, callback }, { call }) {
      const response = yield call(removeMember, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    *editMember({ payload, callback }, { call }) {
      const response = yield call(editMember, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    // 移交团队
    *moveTeam({ payload, callback }, { call }) {
      const response = yield call(moveTeam, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    // 添加成员
    *addMember({ payload, callback }, { call }) {
      const response = yield call(addMember, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    // 创建团队
    *createTeam({ payload, callback }, { call }) {
      const response = yield call(createTeam, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    *fetchRegions({ payload, callback }, { call, put }) {
      const response = yield call(getRegions, payload);
      if (response && !response.status) {
        yield put({ type: 'saveRegions', payload: response.list });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchCurrentTeam({ payload }, { put }) {
      yield put({ type: 'saveCurrentTeam', payload });
    },
    *fetchCurrentTeamPermissions({ payload }, { put }) {
      yield put({
        type: 'saveCurrentTeamPermissionsInfo',
        payload
      });
    },
    *fetchCurrentRegionName({ payload }, { put }) {
      yield put({ type: 'saveCurrentRegionName', payload });
    },
    // 开通集群
    *openRegion({ payload, callback }, { call }) {
      const response = yield call(openRegion, payload);
      if (response && !response.status && callback) {
        callback(response);
      }
    },
    *closeTeamRegion({ payload, callback, handleError }, { call }) {
      const response = yield call(closeTeamRegion, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    // 获取某个集群的key
    *getRegionKey({ payload, callback }, { call }) {
      const response = yield call(getRegionKey, payload);
      if (response && callback) {
        callback(response.bean);
      }
    },
    // 审批用户加入
    *setJoinTeamUsers({ payload, callback }, { call }) {
      const response = yield call(setJoinTeamUsers, payload);
      if (response && callback) {
        callback(response.bean);
      }
    },
    // 撤销申请团队
    *undoTeamUsers({ payload, callback }, { call }) {
      const response = yield call(undoTeamUsers, payload);
      if (response && callback) {
        callback(response.bean);
      }
    },
    // add teams
    *joinTeam({ payload, callback }, { call }) {
      const response = yield call(joinTeam, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchFeatures({ payload }, { call, put }) {
      const response = yield call(fetchFeatures, payload);
      if (response) {
        yield put({
          type: 'saveRegionFeatures',
          payload: response.list
        });
      }
    },
    *getUploadInformation({ payload, callback }, { call }) {
      const response = yield call(getUploadInformation, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *getAdvancedInformation({ payload, callback }, { call }) {
      const response = yield call(getAdvancedInformation, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *confirmTheImport({ payload, callback, handleError }, { call }) {
      const response = yield call(confirmTheImport, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchToken({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchToken, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchPluginUrl({ payload, callback, handleError }, { call, put }) {
      const response = yield call(fetchPluginUrl, payload, handleError);
      if (response && callback) {
        yield put({
          type: 'savePluginList',
          payload: response
        });
        if(callback){
          callback(response);
        }
      }
    },
    *fetchServiceID({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchServiceID, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchAppNames({ payload, callback, handleError }, { call,put }) {
      const response = yield call(fetchAppNames, payload, handleError);
        if (response) {
          yield put({
            type: 'saveAppnames',
            payload: response
          });
          if (callback) {
            callback(response);
          }
        }
    },
    *getHelmAdvancedInfo({ payload, callback, handleError }, { call }) {
      const response = yield call(getHelmAdvancedInfo, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getAuthorizationMessage({ payload, callback, handleError }, { call }) {
      const response = yield call(getAuthorizationMessage, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *addAuthorizationMessage({ payload, callback, handleError }, { call }) {
      const response = yield call(addAuthorizationMessage, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *editAuthorizationMessage({ payload, callback, handleError }, { call }) {
      const response = yield call(editAuthorizationMessage, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *delAuthorizationMessage({ payload, callback, handleError }, { call }) {
      const response = yield call(delAuthorizationMessage, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *fetchImageTags({ payload, callback, handleError }, { call }) {
      const response = yield call(fetchImageTags, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getComponentLangVersion({ payload, callback, handleError }, { call }) {
      const response = yield call(getComponentLangVersion, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *loadTarImage({ payload, callback, handleError }, { call }) {
      const response = yield call(loadTarImage, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
    *getTarImageLoadResult({ payload, callback, handleError }, { call }) {
      const response = yield call(getTarImageLoadResult, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
  },
  
  reducers: {
    saveCurrentTeamPermissionsInfo(state, { payload }) {      
      return {
        ...state,
        currentTeamPermissionsInfo: payload
      };
    },
    saveCurrentTeam(state, action) {
      return {
        ...state,
        currentTeam: action.payload
      };
    },
    saveCurrentRegionName(state, action) {
      return {
        ...state,
        currentRegionName: action.payload.currentRegionName
      };
    },
    saveMember(state, action) {
      return {
        ...state,
        members: action.payload
      };
    },

    saveRegions(state, action) {
      return {
        ...state,
        regions: action.payload
      };
    },
    saveRegionFeatures(state, action) {
      return {
        ...state,
        features: action.payload
      };
    },
    saveAppnames(state, { payload }) {
      return {
        ...state,
        allAppNames:  payload.bean && payload.bean.app_names && payload.bean.app_names.length > 0 ? payload.bean.app_names : []
      };
    },
    savePluginList(state, { payload }) {
      return {
        ...state,
        pluginsList:  payload.bean && payload.list && payload.list.length > 0 ? payload.list : []
      };
    },
    // 源码构建选择语言
    ChoosingLanguage(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.setItem(
          'codeLanguage',
          JSON.stringify(payload) || ''
        );
      }
      return {
        ...state,
        codeLanguage: payload
      };
    },
    // 选择包管理器
    ChoosingPackage(state, action) {
      const { payload } = action;
      if (payload) {
        window.sessionStorage.setItem(
          'packageNpmOrYarn',
          JSON.stringify(payload) || 'npm'
        );
      }
      return {
        ...state,
        packageNpmOrYarn: payload
      };
    },
  }
};
