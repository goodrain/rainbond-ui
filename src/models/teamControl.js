import {
  getMembers,
  editTeamName,
  deleteTeam,
  getTeamPermissions,
  removeMember,
  editMember,
  moveTeam,
  addMember,
  createTeam,
  getRegions,
  openRegion,
  getRegionKey,
  exitTeam,
  getAllPerms,
  editRole,
  removeRole,
  createRole,
  getRoles,
  getJoinTeamUsers,
  setJoinTeamUsers,
} from "../services/team";
import cookie from "../utils/cookie";

export default {
  namespace: "teamControl",
  state: {
    // 成员
    members: [],
    // 权限列表
    actions: [],
    // 已开通的数据中心
    regions: [],
    // current show teams
    currentTeam: {},
  },
  effects: {
    * getJoinTeamUsers({ payload, callback }, { call, put }) {
      const response = yield call(getJoinTeamUsers, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * getRoles({ payload, callback }, { call, put }) {
      const response = yield call(getRoles, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * createRole({ payload, callback }, { call, put }) {
      const response = yield call(createRole, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * removeRole({ payload, callback }, { call, put }) {
      const response = yield call(removeRole, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * editRole({ payload, callback }, { call, put }) {
      const response = yield call(editRole, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * getAllPerms({ payload, callback }, { call, put }) {
      const response = yield call(getAllPerms, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * exitTeam({ payload, callback }, { call, put }) {
      const response = yield call(exitTeam, payload);
      if (response) {
        callback && callback();
      }
    },
    * fetchMember({ payload, callback }, { call, put }) {
      const response = yield call(getMembers, payload);
      if (response) {
        callback && callback(response);
      }
    },
    * editTeamAlias({ payload, callback }, { call, put }) {
      const response = yield call(editTeamName, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    * delTeam({ payload, callback }, { call, put }) {
      const response = yield call(deleteTeam, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    * fetchAllPerm({ payload, callback }, { call, put }) {
      const response = yield call(getAllPerms);
      if (response && !response.status) {
        yield put({ type: "savePerm", payload: response.list });
      }
    },
    * delMember({ payload, callback }, { call, put }) {
      const response = yield call(removeMember, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    * editMember({ payload, callback }, { call, put }) {
      const response = yield call(editMember, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    // 移交团队
    * moveTeam({ payload, callback }, { call, put }) {
      const response = yield call(moveTeam, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    // 添加成员
    * addMember({ payload, callback }, { call, put }) {
      const response = yield call(addMember, payload);
      if (response && !response.status) {
        callback && callback(response);
      }
    },
    // 创建团队
    * createTeam({ payload, callback }, { call, put }) {
      const response = yield call(createTeam, payload);
      if (response && !response.status) {
        callback && callback(response);
      }
    },
    * fetchRegions({ payload, callback }, { call, put }) {
      const response = yield call(getRegions, payload);
      if (response && !response.status) {
        yield put({ type: "saveRegions", payload: response.list });
        callback && callback();
      }
    },
    * fetchCurrentTeam({ payload }, { call, put }) {
      yield put({ type: "saveCurrentTeam", payload: payload });
    },
    // 开通数据中心
    * openRegion({ payload, callback }, { call, put }) {
      const response = yield call(openRegion, payload);
      if (response && !response.status) {
        callback && callback();
      }
    },
    // 获取某个数据中心的key
    * getRegionKey({ payload, callback }, { call, put }) {
      const response = yield call(getRegionKey, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
    // 获取某个数据中心的key
    * setJoinTeamUsers({ payload, callback }, { call, put }) {
      const response = yield call(setJoinTeamUsers, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
  },
  reducers: {
    saveCurrentTeam(state, action) {
      return {
        ...state,
        currentTeam: action.payload,
      };
    },
    saveMember(state, action) {
      return {
        ...state,
        members: action.payload,
      };
    },
    savePerm(state, action) {
      return {
        ...state,
        actions: action.payload,
      };
    },
    saveRegions(state, action) {
      return {
        ...state,
        regions: action.payload,
      };
    },
  },
};
