import { message } from 'antd';
import { formatMessage } from '@/utils/intl';
import { listTeamApplications, submitTeamApplication, reviewTeamApplication } from '../services/teamApplications';

function failure(error) {
  const key = error && /^workspace\./.test(error.message) ? error.message : 'workspace.unavailable';
  const serverMessage = error && error.response && error.response.data && error.response.data.msg_show;
  message.error(serverMessage || formatMessage({ id: key }));
}

export default {
  namespace: 'teamApplications',
  state: { items: [], failed: false },
  effects: {
    fetch: [function* ({ payload }, { call, put }) {
      yield put({ type: 'save', payload: { items: [], failed: false } });
      try {
        const response = yield call(listTeamApplications, payload);
        if (!response || !response.bean || !Array.isArray(response.bean.list)) throw new Error('workspace.unavailable');
        yield put({ type: 'save', payload: { items: response.bean.list } });
        if (payload.scope !== 'all' && response.bean.list.some(item => item.status === 'approved')) yield put({ type: 'user/fetchCurrent' });
      } catch (error) {
        yield put({ type: 'save', payload: { failed: true } });
      }
    }, { type: 'takeLatest' }],
    *submit({ payload, callback }, { call, put }) {
      try {
        const response = yield call(submitTeamApplication, payload);
        if (!response || !response.bean) throw new Error('workspace.unavailable');
        yield put({ type: 'fetch', payload: { user: payload.user, scope: 'mine' } });
        message.success(formatMessage({ id: 'workspace.submitted' }));
        if (callback) callback(response.bean);
      } catch (error) { failure(error); }
    },
    *review({ payload, callback }, { call, put }) {
      try {
        const response = yield call(reviewTeamApplication, payload);
        if (!response || !response.bean) throw new Error('workspace.unavailable');
        yield put({ type: 'fetch', payload: { user: payload.user, scope: 'all' } });
        if (response.bean.status === payload.decision) message.success(formatMessage({ id: 'workspace.reviewed' }));
        else message.warning(response.bean.provisioning_error || formatMessage({ id: 'workspace.unavailable' }));
        if (callback) callback(response.bean);
      } catch (error) { failure(error); }
    }
  },
  reducers: {
    save(state, { payload }) { return { ...state, ...payload }; },
    reset() { return { items: [], failed: false }; }
  }
};
