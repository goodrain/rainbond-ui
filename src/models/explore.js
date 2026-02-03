import {
  fetchExploreApps,
  fetchExploreAppDetail,
  fetchExploreCategories,
  fetchExploreTags,
  installExploreApp,
  fetchRecommendedApps
} from '../services/explore';

export default {
  namespace: 'explore',
  state: {
    appList: [],
    appDetail: null,
    categories: [],
    tags: [],
    pagination: {
      page: 1,
      page_size: 10,
      total: 0
    }
  },
  effects: {
    *fetchApps({ payload, callback }, { call, put }) {
      const response = yield call(fetchExploreApps, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchAppDetail({ payload, callback }, { call }) {
      const response = yield call(fetchExploreAppDetail, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchCategories({ payload, callback }, { call }) {
      const response = yield call(fetchExploreCategories, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchTags({ payload, callback }, { call }) {
      const response = yield call(fetchExploreTags, payload);
      if (response && callback) {
        callback(response);
      }
    },

    *installApp({ payload, callback, handleError }, { call }) {
      const response = yield call(installExploreApp, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },

    *fetchRecommendedApps({ callback }, { call }) {
      const response = yield call(fetchRecommendedApps);
      if (response && callback) {
        callback(response);
      }
    }
  },
  reducers: {
    saveAppList(state, { payload }) {
      return {
        ...state,
        appList: payload.list || [],
        pagination: {
          ...state.pagination,
          total: payload.total || 0
        }
      };
    },
    saveAppDetail(state, { payload }) {
      return {
        ...state,
        appDetail: payload
      };
    },
    saveCategories(state, { payload }) {
      return {
        ...state,
        categories: payload || []
      };
    },
    saveTags(state, { payload }) {
      return {
        ...state,
        tags: payload || []
      };
    }
  }
};
