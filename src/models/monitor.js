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
  addServiceMonitorFigure,
  getServiceMonitorFigure,
  postServiceMonitor,
  deleteServiceMonitor,
  updateServiceMonitor,
  updataServiceMonitorFigure,
  deleteServiceMonitorFigure,
  batchDeleteServiceMonitorFigure,
  getServiceMonitorFigureInfo,
  getKeyImport,
  getComponentMetrics,
  addKeyImport
} from '../services/monitor';

export default {
  namespace: 'monitor',

  state: {
    tags: []
  },

  effects: {
    *fetchComponentMetrics({ payload, callback, handleError }, { call }) {
      const response = yield call(getComponentMetrics, payload, handleError);
      if (response && callback) {
        callback(response);
      }
    },
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
    *fetchServiceMonitorFigureInfo({ payload, callback }, { call }) {
      const response = yield call(getServiceMonitorFigureInfo, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchKeyImport({ payload, callback }, { call }) {
      const response = yield call(getKeyImport, payload);
      if (callback) {
        callback(response);
      }
    },
    *addKeyImport({ payload, callback }, { call }) {
      const response = yield call(addKeyImport, payload);
      if (callback) {
        callback(response);
      }
    },
    *addServiceMonitorFigure({ payload, callback }, { call }) {
      const response = yield call(addServiceMonitorFigure, payload);
      if (callback) {
        callback(response);
      }
    },
    *editServiceMonitorFigure({ payload, callback }, { call }) {
      const response = yield call(updataServiceMonitorFigure, payload);
      if (callback) {
        callback(response);
      }
    },
    *delServiceMonitorFigure({ payload, callback }, { call }) {
      const response = yield call(deleteServiceMonitorFigure, payload);
      if (callback) {
        callback(response);
      }
    },
    *batchDeleteServiceMonitorFigure({ payload, callback }, { call }) {
      const response = yield call(batchDeleteServiceMonitorFigure, payload);
      if (callback) {
        callback(response);
      }
    },
    *fetchServiceMonitorFigure({ payload, callback }, { call }) {
      const response = yield call(getServiceMonitorFigure, payload);
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
