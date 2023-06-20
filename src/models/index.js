import {
  getTeamRegionGroups,
  getTeamRegionApps,
  getTeamRegionAppsStatus,
  getTeamRegionOverview,
  getTeamRegionGroup,
  getNewestEvent,
  getTeamArchOverview,
} from '../services/team';
import cookie from '../utils/cookie';

export default {
  namespace: 'index',
  state: {
    // 总览信息
    overviewInfo: {},
    // 所有分组
    groups: [],
    apps: [],
    groupInfo: {},
    appsStatus: [],
    // 最新动态
    events: [],
    pagination: {
      pageSize: 10,
      currentPage: 1,
      total: 0,
      order: '',
      fields: '',
    },
    appGroupSize: 0,
    appRuningSize: 0,
    appAbnormalSize: 0,
    appClosedSize: 0,
  },
  effects: {
    *fetchEvents({ payload, callback }, { call, put }) {
      const response = yield call(getNewestEvent, payload);
      if (response) {
        yield put({
          type: 'saveEvents',
          payload: response,
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchOverview({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getTeamRegionOverview, payload, handleError);
      if (response) {
        yield put({
          type: 'saveOverviewInfo',
          payload: response.bean,
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchArchOverview({ payload, callback, handleError }, { call, put }) {
      const response = yield call(getTeamArchOverview, payload, handleError);
      if (response) {
        yield put({
          type: 'saveOverviewInfo',
          payload: response.bean,
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchAppOverview({ payload }, { call, put }) {
      const response = yield call(getTeamAppOverview, payload);
      if (response) {
        yield put({
          type: 'saveAppOverviewInfo',
          payload: response.bean,
        });
      }
    },
    *fetchApps({ payload, callback, handleError }, { put, call }) {
      const response = yield call(getTeamRegionApps, payload, handleError);
      if (response) {
        if (callback) {
          callback(response);
        }
        yield put({
          type: 'saveApps',
          payload: response.list || [],
        });

        yield put({
          type: 'savePage',
          payload: {
            total: response.total || 0,
          },
        });
      }
    },
    *fetchAppsStatus({ payload }, { call, put }) {
      const response = yield call(getTeamRegionAppsStatus, payload);
      if (response) {
        yield put({
          type: 'saveAppsStatus',
          payload: response.list,
        });
      }
    },
  },

  reducers: {
    saveEvents(state, { payload }) {
      return {
        ...state,
        events: payload.list,
      };
    },
    saveOverviewInfo(state, { payload }) {
      return {
        ...state,
        overviewInfo: payload,
      };
    },
    saveAppOverviewInfo(state, { payload }) {
      return {
        ...state,
        appGroupSize: payload.appGroupSize,
        appRuningSize: payload.appGroupSize,
        appAbnormalSize: payload.appAbnormalSize,
        appClosedSize: payload.appClosedSize,
      };
    },
    saveAppsStatus(state, action) {
      return {
        ...state,
        appsStatus: action.payload,
      };
    },
    saveApps(state, action) {
      return {
        ...state,
        apps: action.payload,
      };
    },
    savePage(state, action) {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };
    },
  },
};
