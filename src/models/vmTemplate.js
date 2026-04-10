import {
  getVMTemplateDetail,
  getVMTemplates,
  retryVMTemplateVersion,
  updateVMTemplate
} from '../services/vmTemplate';

export default {
  namespace: 'vmTemplate',
  state: {
    list: [],
    detail: null
  },
  effects: {
    *fetchList({ payload, callback }, { call, put }) {
      const response = yield call(getVMTemplates, payload);
      if (response) {
        yield put({
          type: 'saveList',
          payload: response.list || []
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *fetchDetail({ payload, callback }, { call, put }) {
      const response = yield call(getVMTemplateDetail, payload);
      if (response) {
        yield put({
          type: 'saveDetail',
          payload: response.bean || null
        });
        if (callback) {
          callback(response);
        }
      }
    },
    *updateTemplate({ payload, callback }, { call }) {
      const response = yield call(updateVMTemplate, payload);
      if (response && callback) {
        callback(response);
      }
    },
    *retryVersion({ payload, callback }, { call }) {
      const response = yield call(retryVMTemplateVersion, payload);
      if (response && callback) {
        callback(response);
      }
    }
  },
  reducers: {
    saveList(state, action) {
      return {
        ...state,
        list: action.payload || []
      };
    },
    saveDetail(state, action) {
      return {
        ...state,
        detail: action.payload || null
      };
    }
  }
};
