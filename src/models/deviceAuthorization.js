import {
  decideDeviceAuthorization,
  inspectDeviceAuthorization
} from '../services/deviceAuthorization';

export default {
  namespace: 'deviceAuthorization',

  state: {
    status: 'entry',
    grant: null,
    error: null
  },

  effects: {
    *inspect({ payload }, { call, put }) {
      yield put({ type: 'setState', payload: { status: 'loading', error: null } });
      try {
        const response = yield call(inspectDeviceAuthorization, payload);
        if (response && response.bean) {
          yield put({
            type: 'setState',
            payload: { status: 'confirm', grant: response.bean, error: null }
          });
          return;
        }
        yield put({ type: 'setState', payload: { status: 'error', error: 'invalid' } });
      } catch (error) {
        yield put({ type: 'setState', payload: { status: 'error', error: 'invalid' } });
      }
    },

    *decide({ payload }, { call, put }) {
      yield put({ type: 'setState', payload: { status: 'submitting', error: null } });
      try {
        const response = yield call(decideDeviceAuthorization, payload);
        const status = response && response.bean && response.bean.status;
        if (status === 'approved' || status === 'denied') {
          yield put({ type: 'setState', payload: { status, error: null } });
          return;
        }
        yield put({ type: 'setState', payload: { status: 'error', error: 'invalid' } });
      } catch (error) {
        yield put({ type: 'setState', payload: { status: 'error', error: 'invalid' } });
      }
    }
  },

  reducers: {
    setState(state, { payload }) {
      return { ...state, ...payload };
    },
    reset() {
      return { status: 'entry', grant: null, error: null };
    }
  }
};
