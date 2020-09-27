/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { queryTags } from '../services/api';
import {
  deleteComponsentTrace,
  getComponsentTrace,
  setComponsentTrace
} from '../services/app';
import {
  getMonitorRangeData,
  getServiceMonitor,
  postServiceMonitor,
  deleteServiceMonitor,
  updateServiceMonitor
} from '../services/monitor';

export default {
  namespace: 'monitor',

  state: {
    tags: []
  },

  effects: {
    *fetchTags(_, { call, put }) {
      const response = yield call(queryTags);
      yield put({
        type: 'saveTags',
        payload: response.list
      });
    },
    *fetchServiceMonitor({ payload, callback }, { call }) {
      const response = yield call(getServiceMonitor, payload);
      if (callback) {
        callback(response);
      }
    },
    *addServiceMonitor({ payload, callback }, { call }) {
      const response = yield call(postServiceMonitor, payload);
      if (callback) {
        callback(response);
      }
    },
    *deleteServiceMonitor({ payload, callback }, { call }) {
      const response = yield call(deleteServiceMonitor, payload);
      if (callback) {
        callback(response);
      }
    },
    *updateServiceMonitor({ payload, callback }, { call }) {
      const response = yield call(updateServiceMonitor, payload);
      if (callback) {
        callback(response);
      }
    },
    *getComponsentTrace({ payload, callback }, { call }) {
      const response = yield call(getComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    },
    *setComponsentTrace({ payload, callback }, { call }) {
      const response = yield call(setComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    },
    *deleteComponsentTrace({ payload, callback }, { call }) {
      const response = yield call(deleteComponsentTrace, payload);
      if (callback) {
        callback(response);
      }
    },
    *getMonitorRangeData({ payload, callback }, { call }) {
      const response = yield call(getMonitorRangeData, payload);
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
