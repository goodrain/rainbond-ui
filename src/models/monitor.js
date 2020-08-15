import { queryTags } from "../services/api";
import {
  deleteComponsentTrace,
  getComponsentTrace,
  setComponsentTrace
} from "../services/app";

export default {
  namespace: "monitor",

  state: {
    tags: []
  },

  effects: {
    *fetchTags(_, { call, put }) {
      const response = yield call(queryTags);
      yield put({
        type: "saveTags",
        payload: response.list
      });
    },
    *getComponsentTrace({ payload, callback }, { call, put }) {
      const response = yield call(getComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    },
    *setComponsentTrace({ payload, callback }, { call, put }) {
      const response = yield call(setComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    },
    *deleteComponsentTrace({ payload, callback }, { call, put }) {
      const response = yield call(deleteComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    }
  },

  reducers: {
    saveTags(state, action) {
      return {
        ...state,
        tags: action.payload
      };
    }
  }
};
