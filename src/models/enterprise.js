import { routerRedux } from 'dva/router';
import { message } from 'antd';
import { fakeSubmitForm } from '../services/api';

export default {
  namespace: 'enterprise',

  state: {
    currentEnterprise: {}
  },

  effects: {
    *fetchCurrentEnterprise({ payload }, { call, put }) {
        yield put({ type: "saveCurrentEnterprise", payload: payload });
    },
  },

  reducers: {
    saveCurrentEnterprise(state, { payload }) {
      return {
        ...state,
        currentEnterprise: payload,
      };
    },
  },
};
